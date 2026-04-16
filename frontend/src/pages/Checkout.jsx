import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createOrder, validateCoupon, getPaymentAccounts, calculateShipping, getVendorPublicPaymentAccounts } from '../services/api';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'الدفع عند الاستلام', desc: 'ادفع نقداً عند وصول الطلب', icon: '💵', color: '#10b981' },
  { value: 'floosak', label: 'فلوسك', desc: 'حوّل عبر محفظة فلوسك', icon: '📱', color: '#6366f1' },
  { value: 'jawali', label: 'جوالي', desc: 'حوّل عبر محفظة جوالي', icon: '📲', color: '#f59e0b' },
  { value: 'kuraimi', label: 'كريمي', desc: 'حوّل عبر الكريمي للصرافة', icon: '🏦', color: '#8b5cf6' },
  { value: 'transfer', label: 'تحويل بنكي', desc: 'حوّل لحسابنا البنكي', icon: '🏛️', color: '#3b82f6' },
  { value: 'credit_card', label: 'بطاقة ائتمان', desc: 'Visa / Mastercard', icon: '💳', color: '#ef4444' },
];

const CITIES = ['صنعاء', 'عدن', 'تعز', 'إب', 'حضرموت', 'الحديدة', 'ذمار', 'مأرب'];

const Checkout = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [platformAccounts, setPlatformAccounts] = useState([]);
  const [vendorAccountsMap, setVendorAccountsMap] = useState({});
  const [shippingInfo, setShippingInfo] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Credit card simulation state
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const [formData, setFormData] = useState({
    full_name: '', phone: '', city: '', address: '', notes: '',
    payment_method: 'cash', transfer_number: '', receipt_image: null,
    wallet_number: '', wallet_transaction_id: '', card_last_four: '',
    coupon_code: ''
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      // Fetch platform fallback accounts
      try {
        const platformRes = await getPaymentAccounts();
        setPlatformAccounts(platformRes.data.results || platformRes.data || []);
      } catch (e) { console.error('Platform accounts error:', e); }

      // Collect unique numeric vendor IDs only (skip string names)
      const vendorIds = [...new Set(
        cartItems
          .map(item => item.vendor_id)
          .filter(id => id && typeof id === 'number')
      )];

      if (vendorIds.length > 0) {
        const vAccountsMap = {};
        await Promise.all(vendorIds.map(async (vid) => {
          try {
            const vendorRes = await getVendorPublicPaymentAccounts(vid);
            if (vendorRes.data && vendorRes.data.length > 0) {
              vAccountsMap[vid] = vendorRes.data;
            }
          } catch (e) {
            console.warn(`No payment accounts for vendor ${vid}:`, e);
          }
        }));
        setVendorAccountsMap(vAccountsMap);
      }
    };
    fetchAccounts();
  }, [cartItems]);

  // Calculate shipping when city changes
  useEffect(() => {
    if (!formData.city) { setShippingInfo(null); return; }
    setLoadingShipping(true);
    const subtotalAfterDiscount = totalPrice - ((totalPrice * discount) / 100);
    calculateShipping(formData.city, subtotalAfterDiscount)
      .then(res => setShippingInfo(res.data))
      .catch(() => setShippingInfo({ shipping_cost: 0, is_free: true, estimated_days: '2-5' }))
      .finally(() => setLoadingShipping(false));
  }, [formData.city, totalPrice, discount]);

  // Build unique vendors list from cart items (only those with numeric vendor_id)
  const vendorsInCart = [...new Map(
    cartItems
      .filter(item => item.vendor_id && typeof item.vendor_id === 'number')
      .map(item => [
        item.vendor_id,
        item.vendor_name || item.vendor || 'متجر'
      ])
  ).entries()].map(([id, name]) => ({ id, name }));

  // For each vendor in cart, find matching payment account for selected method
  const accountsToDisplay = vendorsInCart
    .map(vendor => {
      const vAccounts = vendorAccountsMap[vendor.id] || [];
      const specificAccount = vAccounts.find(a => a.provider === formData.payment_method);
      const fallbackAccount = platformAccounts.find(a => a.provider === formData.payment_method);
      const account = specificAccount || fallbackAccount;
      return account ? { vendor, account } : null;
    })
    .filter(Boolean);

  // If no vendor-specific accounts, show platform account as fallback
  if (accountsToDisplay.length === 0) {
    const fallbackAccount = platformAccounts.find(a => a.provider === formData.payment_method);
    if (fallbackAccount) {
      accountsToDisplay.push({ vendor: { name: 'المنصة' }, account: fallbackAccount });
    }
  }

  const shippingCost = shippingInfo?.shipping_cost || 0;
  const discountAmount = (totalPrice * discount) / 100;
  const finalTotal = totalPrice - discountAmount + shippingCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.city || !formData.address) {
      toast.error('يرجى ملء جميع الحقول المطلوبة'); return;
    }
    if (cartItems.length === 0) { toast.error('السلة فارغة'); return; }

    // Validate payment-specific fields
    const pm = formData.payment_method;
    if (['floosak', 'jawali', 'kuraimi'].includes(pm) && !formData.wallet_transaction_id) {
      toast.error('يرجى إدخال رقم عملية التحويل'); return;
    }
    if (pm === 'transfer' && !formData.transfer_number && !formData.receipt_image) {
      toast.error('يرجى إدخال رقم الحوالة أو إرفاق السند'); return;
    }
    if (pm === 'credit_card') {
      const num = cardData.number.replace(/\s/g, '');
      if (num.length < 16 || !cardData.expiry || !cardData.cvv || cardData.cvv.length < 3) {
        toast.error('يرجى إدخال بيانات البطاقة بشكل صحيح'); return;
      }
      formData.card_last_four = num.slice(-4);
    }

    setLoading(true);
    try {
      let payload;
      if (pm === 'transfer' && formData.receipt_image) {
        payload = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) payload.append(key, formData[key]);
        });
        payload.append('items', JSON.stringify(cartItems.map(item => ({ product_id: item.id, quantity: item.quantity }))));
      } else {
        const { receipt_image, ...restData } = formData;
        payload = { ...restData, items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })) };
      }
      const res = await createOrder(payload);
      setOrderNumber(res.data.order_number || 'YM-XXXXX');
      clearCart();
      setOrderComplete(true);
      toast.success('تم إنشاء الطلب بنجاح! 🎉');
    } catch (err) {
      console.error("Order error", err.response?.data || err);
      let errorMsg = 'حدث خطأ غير معروف';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') errorMsg = err.response.data;
        else if (typeof err.response.data === 'object') {
          const vals = Object.values(err.response.data).flat();
          errorMsg = vals.join(' ');
        }
      }
      toast.error('فشل إنشاء الطلب: ' + errorMsg);
    }
    setLoading(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    try {
      const res = await validateCoupon(couponCode);
      setDiscount(res.data.discount_percentage);
      setFormData({ ...formData, coupon_code: res.data.code });
      toast.success(`تم تفعيل كوبون خصم ${res.data.discount_percentage}% بنجاح! 🥳`);
    } catch {
      toast.error('كود الخصم غير صحيح أو منتهي الصلاحية');
      setDiscount(0);
      setFormData({ ...formData, coupon_code: '' });
    }
    setValidatingCoupon(false);
  };

  const formatCardNumber = (v) => v.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);

  if (orderComplete) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="order-success">
            <div className="success-icon">🎉</div>
            <h1>تم تأكيد طلبك بنجاح!</h1>
            <p>شكراً لك، سيتم التواصل معك قريباً لتأكيد الطلب والتوصيل</p>
            <div className="success-order-number"><strong>رقم الطلب:</strong> {orderNumber}</div>
            {formData.payment_method !== 'cash' && formData.payment_method !== 'credit_card' && (
              <p style={{ color: '#f59e0b', marginTop: '1rem', fontSize: '0.95rem' }}>
                ⏳ سيتم تأكيد الدفع من قبل الإدارة خلال ساعات قليلة
              </p>
            )}
            {formData.payment_method === 'credit_card' && (
              <p style={{ color: '#059669', marginTop: '1rem', fontSize: '0.95rem' }}>
                ✅ تم الدفع بنجاح عبر البطاقة
              </p>
            )}
            <a href="/" className="btn btn-primary">العودة للتسوق</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header"><h1>إتمام الطلب</h1><p>أدخل بيانات التوصيل لإتمام طلبك</p></div>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            {/* Shipping Info */}
            <div className="checkout-section">
              <h3>📍 بيانات التوصيل</h3>
              <div className="form-group"><label>الاسم الكامل *</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="الاسم الكامل" required /></div>
              <div className="form-row">
                <div className="form-group"><label>رقم الهاتف *</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="77XXXXXXX" required /></div>
                <div className="form-group"><label>المدينة *</label>
                  <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required>
                    <option value="">اختر المدينة</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div className="form-group"><label>العنوان التفصيلي *</label>
                <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="الحي، الشارع، بالقرب من..." rows="3" required></textarea></div>
              <div className="form-group"><label>ملاحظات (اختياري)</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="ملاحظات إضافية..." rows="2"></textarea></div>
            </div>

            {/* Payment */}
            <div className="checkout-section">
              <h3>💳 طريقة الدفع</h3>
              <div className="payment-options-grid">
                {PAYMENT_METHODS.map(opt => (
                  <label key={opt.value} className={`payment-option-card ${formData.payment_method === opt.value ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, payment_method: opt.value })}
                    style={{ '--payment-color': opt.color }}>
                    <input type="radio" name="payment" value={opt.value} checked={formData.payment_method === opt.value} readOnly />
                    <span className="payment-card-icon">{opt.icon}</span>
                    <strong>{opt.label}</strong>
                    <small>{opt.desc}</small>
                  </label>
                ))}
              </div>

              {/* Wallet payment details */}
              {['floosak', 'jawali', 'kuraimi'].includes(formData.payment_method) && (
                <div className="payment-details-box">
                  {accountsToDisplay.length > 0 && accountsToDisplay.map((item, idx) => (
                    <div key={idx} className="platform-account-info" style={{ marginBottom: '1rem' }}>
                      <div className="account-badge">📱 حساب: {item.vendor.name}</div>
                      <div className="account-number-display">{item.account.account_number}</div>
                      <div className="account-name-display">باسم: {item.account.account_name}</div>
                      {item.account.instructions && <p className="account-instructions">{item.account.instructions}</p>}
                    </div>
                  ))}
                  {accountsToDisplay.length === 0 && (
                    <div className="platform-account-info" style={{ marginBottom: '1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                      لا توجد حسابات دفع متوفرة لهذه الطريقة من قِبل المتاجر المطلوبة.
                    </div>
                  )}
                  <div className="form-group">
                    <label>رقم محفظتك (المرسل منها)</label>
                    <input type="text" value={formData.wallet_number} onChange={e => setFormData({ ...formData, wallet_number: e.target.value })} placeholder="رقم محفظتك..." />
                  </div>
                  <div className="form-group">
                    <label>رقم عملية التحويل *</label>
                    <input type="text" value={formData.wallet_transaction_id} onChange={e => setFormData({ ...formData, wallet_transaction_id: e.target.value })} placeholder="رقم العملية من رسالة التأكيد (افصل بفاصلة إذا كانت عدة حوالات)..." required />
                  </div>
                </div>
              )}

              {/* Bank transfer details */}
              {formData.payment_method === 'transfer' && (
                <div className="payment-details-box">
                  {accountsToDisplay.length > 0 && accountsToDisplay.map((item, idx) => (
                    <div key={idx} className="platform-account-info" style={{ marginBottom: '1rem' }}>
                      <div className="account-badge">🏛️ الحساب البنكي: {item.vendor.name}</div>
                      <div className="account-number-display">{item.account.account_number}</div>
                      <div className="account-name-display">
                        {item.account.bank_name && <span>{item.account.bank_name} — </span>}
                        باسم: {item.account.account_name}
                      </div>
                      {item.account.instructions && <p className="account-instructions">{item.account.instructions}</p>}
                    </div>
                  ))}
                  {accountsToDisplay.length === 0 && (
                    <div className="platform-account-info" style={{ marginBottom: '1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                      لا توجد حسابات دفع متوفرة لهذه الطريقة من قِبل المتاجر المطلوبة.
                    </div>
                  )}
                  <div className="form-group">
                    <label>رقم الحوالة أو المرجع *</label>
                    <input type="text" value={formData.transfer_number || ''} onChange={e => setFormData({ ...formData, transfer_number: e.target.value })} placeholder="الرقم المرجعي للحوالة (افصل بفاصلة إذا كانت عدة حوالات)..." />
                  </div>
                  <div className="form-group">
                    <label>صورة السند (اختياري)</label>
                    <input style={{ padding: '0.5rem', background: '#fff' }} type="file" accept="image/*" onChange={e => setFormData({ ...formData, receipt_image: e.target.files[0] })} />
                  </div>
                </div>
              )}

              {/* Credit card simulation */}
              {formData.payment_method === 'credit_card' && (
                <div className="payment-details-box credit-card-box">
                  <div className="cc-header">
                    <span className="cc-brands">💳 Visa / Mastercard</span>
                    <span className="cc-secure">🔒 دفع آمن</span>
                  </div>
                  <div className="form-group">
                    <label>اسم حامل البطاقة *</label>
                    <input type="text" value={cardData.name} onChange={e => setCardData({ ...cardData, name: e.target.value })} placeholder="الاسم كما يظهر على البطاقة" required />
                  </div>
                  <div className="form-group">
                    <label>رقم البطاقة *</label>
                    <input type="text" value={cardData.number} onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })} placeholder="0000 0000 0000 0000" maxLength="19" required style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1.1rem' }} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>تاريخ الانتهاء *</label>
                      <input type="text" value={cardData.expiry} onChange={e => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                        setCardData({ ...cardData, expiry: v });
                      }} placeholder="MM/YY" maxLength="5" required />
                    </div>
                    <div className="form-group">
                      <label>CVV *</label>
                      <input type="password" value={cardData.cvv} onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="•••" maxLength="4" required />
                    </div>
                  </div>
                  <div className="cc-note">
                    <span>🔒</span> بياناتك مشفرة ومحمية بالكامل. هذا وضع محاكاة — لن يتم خصم أي مبلغ فعلي.
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}
              style={{ padding: '1rem', fontSize: '1.1rem' }}>
              {loading ? 'جارِ إنشاء الطلب...' : `✅ تأكيد الطلب — ${finalTotal.toLocaleString()} ريال`}
            </button>
          </form>

          {/* Order Summary */}
          <div className="cart-summary">
            <h3>ملخص الطلب</h3>
            {cartItems.map(item => (
              <div key={item.id} className="summary-item">
                <span>{item.name} × {item.quantity}</span>
                <span>{(Number(item.price) * item.quantity).toLocaleString()} ريال</span>
              </div>
            ))}
            <div className="summary-divider"></div>
            <div className="summary-row"><span>المجموع الفرعي</span><span>{totalPrice.toLocaleString()} ريال</span></div>

            {/* Shipping */}
            <div className="summary-row">
              <span>الشحن {shippingInfo?.estimated_days ? `(${shippingInfo.estimated_days} أيام)` : ''}</span>
              {loadingShipping ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>جارِ الحساب...</span>
              ) : shippingInfo?.is_free ? (
                <span style={{ color: '#059669', fontWeight: 'bold' }}>مجاني ✨</span>
              ) : (
                <span>{shippingCost.toLocaleString()} ريال</span>
              )}
            </div>
            {shippingInfo && !shippingInfo.is_free && shippingInfo.free_threshold && (
              <div style={{ fontSize: '0.8rem', color: '#f59e0b', textAlign: 'center', padding: '0.3rem 0' }}>
                💡 أضف {(shippingInfo.free_threshold - (totalPrice - discountAmount)).toLocaleString()} ريال للحصول على شحن مجاني
              </div>
            )}

            {discount > 0 && (
              <div className="summary-row" style={{ color: '#059669', fontWeight: 'bold' }}>
                <span>خصم الكوبون ({discount}%)</span>
                <span>- {discountAmount.toLocaleString()} ريال</span>
              </div>
            )}
            <div className="summary-divider"></div>

            {/* Coupon */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input type="text" placeholder="لديك كود خصم؟" value={couponCode} onChange={e => setCouponCode(e.target.value)} disabled={discount > 0}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <button type="button" className="btn btn-outline" onClick={handleApplyCoupon} disabled={validatingCoupon || discount > 0} style={{ padding: '0.5rem' }}>
                {validatingCoupon ? 'جارِ...' : discount > 0 ? 'مفعل ✅' : 'تطبيق'}
              </button>
            </div>

            <div className="summary-row total"><span>الإجمالي النهائي</span><span>{finalTotal.toLocaleString()} ريال</span></div>

            {/* Payment methods icons */}
            <div className="checkout-payment-icons">
              {PAYMENT_METHODS.map(m => (
                <span key={m.value} title={m.label} style={{ opacity: formData.payment_method === m.value ? 1 : 0.4 }}>{m.icon}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
