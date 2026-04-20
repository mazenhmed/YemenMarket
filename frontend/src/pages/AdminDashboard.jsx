import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getAdminStats, getAdminUsers, getStores, getOrders,
  getProducts, updateOrderStatus, updateStore, getTransactions,
  confirmPayment, getPaymentAccounts, updatePaymentAccount,
  getCategories, createCategory, updateCategory, deleteCategory,
  deleteAdminUser
} from '../services/api';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

// ─── Fallback data for demo mode ─────────────────────────────────────
const DEMO_STATS = {
  total_stores: 6, active_stores: 6, total_products: 26, active_products: 24,
  pending_products: 2, total_orders: 6, total_sales: 685000, total_commission: 34250,
  pending_orders: 1, total_users: 12, total_customers: 5, total_vendors: 6,
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [platformStats, setPlatformStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

  const colors = ['#059669', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // تحميل البيانات الأساسية أولاً (تسريع البداية)
        const [statsRes, storesRes, prodsRes, ordersRes, usersRes, catsRes] = await Promise.all([
          getAdminStats(),
          getStores({ page_size: 100 }),
          getProducts({ page_size: 100 }),
          getOrders(),
          getAdminUsers(),
          getCategories()
        ]);
        setPlatformStats(statsRes.data);
        setStores(storesRes.data.results || storesRes.data || []);
        setAllProducts(prodsRes.data.results || prodsRes.data || []);
        setAllOrders(ordersRes.data.results || ordersRes.data || []);
        // admin_users الآن يُرجع { results, count, pages, page }
        setAllUsers(usersRes.data.results || usersRes.data || []);
        setCategories(catsRes.data.results || catsRes.data || []);
      } catch (err) {
        console.error('Admin API fetch failed:', err);
        setIsDemoMode(true);
        setPlatformStats(DEMO_STATS);
        toast.error('خطأ في جلب البيانات، يرجى تسجيل الدخول مجدداً أو تشغيل الخادم.');
      }
      setLoading(false);
    };
    fetchAll();
    // تحميل البيانات الثانوية بشكل منفصل لتسريع التحميل الأول
    getPaymentAccounts().then(res => setPaymentAccounts(res.data.results || res.data || [])).catch(() => {});
    getTransactions().then(res => setAllTransactions(res.data.results || res.data || [])).catch(() => {});
  }, []);

  const handleProductAction = async (productId, action) => {
    try {
      const { updateProductStatus } = await import('../services/api');
      await updateProductStatus(productId, action);
      setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, status: action } : p));
      toast.success(action === 'active' ? 'تم قبول المنتج ✅' : 'تم رفض المنتج');
    } catch {
      toast.error('فشل تحديث حالة المنتج');
    }
  };

  const handleStoreAction = async (storeId, newStatus) => {
    try {
      const { updateStoreStatus } = await import('../services/api');
      const notes = prompt("إضافة ملاحظات للمتجر (اختياري):", "");
      if (notes === null) return; // user cancelled
      await updateStoreStatus(storeId, { status: newStatus, admin_notes: notes });
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, status: newStatus, admin_notes: notes } : s));
      toast.success('تم تحديث حالة المتجر');
    } catch {
      toast.error('فشل تحديث المتجر');
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('تم تحديث حالة الطلب');
    } catch {
      toast.error('فشل تحديث الطلب');
    }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await confirmPayment(orderId);
      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_confirmed: true, is_paid: true } : o));
      toast.success('تم تأكيد استلام الدفع ✅');
    } catch {
      toast.error('فشل تأكيد الدفع');
    }
  };

  const handleUpdatePaymentAccount = async (accountId, field, value) => {
    try {
      await updatePaymentAccount(accountId, { [field]: value });
      setPaymentAccounts(prev => prev.map(a => a.id === accountId ? { ...a, [field]: value } : a));
      toast.success('تم تحديث حساب الدفع');
    } catch {
      toast.error('فشل تحديث الحساب');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    try {
      await deleteAdminUser(userId);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('تم حذف المستخدم بنجاح');
    } catch (error) {
      console.error('Delete User Error:', error.response || error);
      const msg = error.response?.data?.error || error.response?.data?.detail || `Error ${error.response?.status}: فشل في الخادم`;
      toast.error(msg);
      // Fallback native alert if toast fails to display properly
      alert(`تفاصيل الخطأ: ${msg}`);
    }
  };

  const getStatusSt = (status) => {
    const m = {
      pending: { text: 'قيد الانتظار', c: '#f59e0b', bg: '#fef3c7' },
      confirmed: { text: 'مؤكد', c: '#3b82f6', bg: '#dbeafe' },
      shipped: { text: 'تم الشحن', c: '#8b5cf6', bg: '#ede9fe' },
      delivered: { text: 'تم التوصيل', c: '#059669', bg: '#ecfdf5' },
      cancelled: { text: 'ملغي', c: '#dc2626', bg: '#fef2f2' },
      processing: { text: 'قيد التجهيز', c: '#6366f1', bg: '#e0e7ff' },
      active: { text: 'نشط', c: '#059669', bg: '#ecfdf5' },
      approved: { text: 'معتمد', c: '#059669', bg: '#ecfdf5' },
      suspended: { text: 'موقوف', c: '#dc2626', bg: '#fef2f2' },
    };
    return m[status] || { text: status, c: '#64748b', bg: '#f1f5f9' };
  };

  const pendingProducts = allProducts.filter(p => p.status === 'pending');
  const st = platformStats || DEMO_STATS;

  if (loading) return <div className="page-content"><LoadingSpinner text="جارِ تحميل لوحة الإدارة..." /></div>;

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title-row">
            <h1>لوحة تحكم الإدارة</h1>
            <span className="admin-role-badge">🛡️ مدير المنصة</span>
            {isDemoMode && <span className="admin-count-badge" style={{ marginRight: '0.5rem' }}>🔴 وضع العرض</span>}
          </div>
          <p>مرحباً {user?.username || 'Admin'} — إليك ملخص المنصة</p>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'إجمالي المتاجر', value: `${st.total_stores}`, sub: `${st.active_stores} معتمد`, icon: '🏪', color: '#6366f1' },
            { label: 'إجمالي المنتجات', value: `${st.total_products}`, sub: `${st.active_products} نشط · ${st.pending_products} معلق`, icon: '📦', color: '#10b981' },
            { label: 'إجمالي الطلبات', value: `${st.total_orders}`, sub: `${st.pending_orders} معلق`, icon: '🛒', color: '#f59e0b' },
            { label: 'إجمالي المبيعات', value: `${Number(st.total_sales || 0).toLocaleString()} ريال`, sub: 'كامل الطلبات', icon: '💰', color: '#8b5cf6' },
            { label: 'عمولة المنصة (5%)', value: `${Number(st.total_commission || 0).toLocaleString()} ريال`, sub: 'أرباح المنصة', icon: '🏦', color: '#059669' },
            { label: 'المستخدمين', value: `${st.total_users}`, sub: `${st.total_customers} عميل · ${st.total_vendors} بائع`, icon: '👥', color: '#f43f5e' },
          ].map((card, i) => (
            <div key={i} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>{card.icon}</div>
              <div>
                <div className="admin-stat-value">{card.value}</div>
                <div className="admin-stat-label">{card.label}</div>
                <div className="admin-stat-change">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            { key: 'overview', label: 'نظرة عامة' },
            { key: 'categories', label: 'الأقسام' },
            { key: 'stores', label: 'المتاجر' },
            { key: 'products', label: 'المنتجات' },
            { key: 'pending', label: `منتجات معلقة`, badge: pendingProducts.length },
            { key: 'orders', label: 'الطلبات' },
            { key: 'transactions', label: 'المبيعات والأرباح' },
            { key: 'payment-accounts', label: '💳 حسابات الدفع' },
            { key: 'users', label: 'المستخدمين' },
          ].map(tab => (
            <button key={tab.key} className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              {tab.badge > 0 && <span className="tab-badge">{tab.badge}</span>}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === 'overview' && (
          <div className="admin-section">
            <h3 style={{ marginBottom: '1rem' }}>آخر الطلبات</h3>
            <div className="dashboard-table">
              <div className="table-header" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
                <span>رقم الطلب</span><span>العميل</span><span>المبلغ</span><span>طريقة الدفع</span><span>الحالة</span>
              </div>
              {allOrders.slice(0, 6).map(order => {
                const s = getStatusSt(order.status);
                return (
                  <div key={order.id} className="table-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
                    <span className="order-id">{order.order_number}</span>
                    <span>{order.full_name}</span>
                    <span>{Number(order.total_price || 0).toLocaleString()} ريال</span>
                    <span>{order.payment_method === 'cash' ? '💵 نقدي' : order.payment_method === 'transfer' ? '🏛️ تحويل' : order.payment_method === 'floosak' ? '📱 فلوسك' : order.payment_method === 'jawali' ? '📲 جوالي' : order.payment_method === 'kuraimi' ? '🏦 كريمي' : order.payment_method === 'credit_card' ? '💳 بطاقة' : order.payment_method}</span>
                    <span className="order-status" style={{ background: s.bg, color: s.c }}>{s.text}</span>
                  </div>
                );
              })}
              {allOrders.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد طلبات</div>}
            </div>
          </div>
        )}

        {/* ── Tab: Stores ── */}
        {activeTab === 'stores' && (
          <div className="admin-section">
            {selectedStore ? (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedStore(null)} style={{ marginBottom: '1.5rem' }}>← العودة للمتاجر</button>
                <div className="store-detail-panel">
                  <div className="sdp-header">
                    <div className="sdp-avatar" style={{ background: `linear-gradient(135deg, ${colors[Math.abs(selectedStore.id - 1) % colors.length]}, ${colors[selectedStore.id % colors.length]})` }}>
                      {(selectedStore.store_name || 'م')[0]}
                    </div>
                    <div className="sdp-info">
                      <h2>{selectedStore.store_name} {selectedStore.is_verified && '✅'}</h2>
                      <div className="sdp-meta-grid">
                        <span>⭐ {selectedStore.rating}</span>
                        <span>📍 {selectedStore.city}</span>
                        <span>📧 {selectedStore.email}</span>
                        <span>📞 {selectedStore.phone}</span>
                      </div>
                      {selectedStore.id_document && (
                        <div style={{ marginTop: '1rem' }}>
                          <a href={selectedStore.id_document} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">📄 عرض وثيقة الهوية المرفقة</a>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {selectedStore.status !== 'approved' && (
                        <button className="action-btn success" onClick={() => handleStoreAction(selectedStore.id, 'approved')}>✅ قبول</button>
                      )}
                      {selectedStore.status !== 'suspended' && (
                        <button className="action-btn danger" onClick={() => handleStoreAction(selectedStore.id, 'suspended')}>🚫 وقف</button>
                      )}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{selectedStore.description}</p>
                </div>
              </>
            ) : (
              <>
                <div className="admin-section-header">
                  <h3>المتاجر ({stores.length})</h3>
                </div>
                <div className="admin-cards-list">
                  {stores.map((store, i) => {
                    const s = getStatusSt(store.status);
                    return (
                      <div key={store.id} className="admin-vendor-card">
                        <div className="vendor-card-avatar" style={{ background: `linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})` }}>
                          {(store.store_name || 'م')[0]}
                        </div>
                        <div className="vendor-card-info">
                          <div className="vendor-card-name">{store.store_name} {store.is_verified && '✅'}</div>
                          <div className="vendor-card-meta">
                            <span>⭐ {store.rating}</span>
                            <span>📍 {store.city}</span>
                            <span className="order-status" style={{ background: s.bg, color: s.c }}>{s.text}</span>
                            {store.status === 'pending' && store.id_document && <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>📎 مرفق هوية</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="action-btn" onClick={() => setSelectedStore(store)}>عرض التفاصيل</button>
                          {store.status !== 'suspended' && (
                            <button className="action-btn danger" onClick={() => handleStoreAction(store.id, 'suspended')}>وقف</button>
                          )}
                          {store.status === 'suspended' && (
                            <button className="action-btn success" onClick={() => handleStoreAction(store.id, 'approved')}>إعادة تفعيل</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {stores.length === 0 && <div className="empty-state"><span className="empty-icon">🏪</span><h3>لا توجد متاجر</h3></div>}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab: All Products ── */}
        {activeTab === 'products' && (
          <div className="admin-section">
            <h3 style={{ marginBottom: '1rem' }}>جميع المنتجات ({allProducts.length})</h3>
            <div className="dashboard-table">
              <div className="table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                <span>المنتج</span><span>السعر</span><span>المبيعات</span><span>المخزون</span><span>الحالة</span>
              </div>
              {allProducts.map(p => {
                const s = getStatusSt(p.status);
                return (
                  <div key={p.id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span>{Number(p.price).toLocaleString()} ريال</span>
                    <span>{p.sold_count || 0} مبيع</span>
                    <span style={{ color: p.stock_quantity === 0 ? '#dc2626' : 'inherit' }}>{p.stock_quantity}</span>
                    <span className="order-status" style={{ background: s.bg, color: s.c }}>{s.text}</span>
                  </div>
                );
              })}
              {allProducts.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد منتجات</div>}
            </div>
          </div>
        )}

        {/* ── Tab: Pending Products ── */}
        {activeTab === 'pending' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h3>منتجات بانتظار المراجعة</h3>
              {pendingProducts.length > 0 && <span className="admin-count-badge">{pendingProducts.length} منتج</span>}
            </div>
            {pendingProducts.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">✅</span><h3>لا توجد منتجات معلقة</h3><p>جميع المنتجات تمت مراجعتها</p></div>
            ) : (
              <div className="pending-products-list">
                {pendingProducts.map(p => (
                  <div key={p.id} className="pending-product-card">
                    <div className="ppc-icon">📦</div>
                    <div className="ppc-info">
                      <h4>{p.name}</h4>
                      <div className="ppc-meta">
                        <span>🏪 {p.vendor_name || 'متجر'}</span>
                        <span>💰 <strong>{Number(p.price).toLocaleString()} ريال</strong></span>
                        <span>📦 {p.stock_quantity} قطعة</span>
                      </div>
                      {p.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>{p.description.slice(0, 120)}...</p>}
                    </div>
                    <div className="ppc-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleProductAction(p.id, 'active')}>✅ قبول</button>
                      <button className="btn btn-outline btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleProductAction(p.id, 'suspended')}>❌ رفض</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Orders ── */}
        {activeTab === 'orders' && (
          <div className="admin-section">
            <h3 style={{ marginBottom: '1rem' }}>جميع الطلبات ({allOrders.length})</h3>
            <div className="dashboard-table">
              <div className="table-header" style={{ gridTemplateColumns: '1fr 1.2fr 0.8fr 1fr 0.8fr 1fr 1fr' }}>
                <span>رقم الطلب</span><span>العميل</span><span>المدينة</span><span>المبلغ</span><span>الدفع</span><span>الحالة</span><span>إجراء</span>
              </div>
              {allOrders.map(order => {
                const s = getStatusSt(order.status);
                const payIcons = { cash: '💵', transfer: '🏛️', floosak: '📱', jawali: '📲', kuraimi: '🏦', credit_card: '💳' };
                return (
                  <div key={order.id} className="table-row" style={{ gridTemplateColumns: '1fr 1.2fr 0.8fr 1fr 0.8fr 1fr 1fr' }}>
                    <span className="order-id">{order.order_number}</span>
                    <span>{order.full_name}</span>
                    <span>📍 {order.city}</span>
                    <span>{Number(order.total_price || 0).toLocaleString()} ريال</span>
                    <span title={order.payment_method}>{payIcons[order.payment_method] || '💳'}</span>
                    <span className="order-status" style={{ background: s.bg, color: s.c }}>{s.text}</span>
                    <span>
                      <select style={{ fontSize: '0.8rem', padding: '0.25rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        value={order.status} onChange={e => handleOrderStatusUpdate(order.id, e.target.value)}>
                        <option value="pending">قيد الانتظار</option>
                        <option value="confirmed">مؤكد</option>
                        <option value="processing">قيد التجهيز</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">تم التوصيل</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </span>
                    <span style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {!order.payment_confirmed && order.payment_method !== 'cash' && (
                        <button className="action-btn success" style={{ fontSize: '0.7rem' }} onClick={() => handleConfirmPayment(order.id)}>💰 تأكيد الدفع</button>
                      )}
                      {order.payment_confirmed && <span style={{ fontSize: '0.7rem', color: '#059669' }}>✅ مدفوع</span>}
                      <Link to={`/invoice/${order.id}`} style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>🧾</Link>
                    </span>
                  </div>
                );
              })}
              {allOrders.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد طلبات</div>}
            </div>
          </div>
        )}

        {/* ── Tab: Transactions ── */}
        {activeTab === 'transactions' && (
          <div className="admin-section">
            <div className="admin-section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>تفاصيل المبيعات والأرباح ({allTransactions.length})</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="stat-badge" style={{ background: '#ecfdf5', color: '#059669', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  إجمالي أرباح المنصة: <strong>{Number(allTransactions.reduce((acc, t) => acc + Number(t.commission || 0), 0)).toLocaleString()} ريال</strong>
                </div>
              </div>
            </div>
            <div className="dashboard-table">
              <div className="table-header" style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 1.5fr' }}>
                <span>رقم الطلب</span><span>المتجر البائع</span><span>مبلغ البيع</span><span>عمولة المنصة</span><span>رصيد البائع</span><span>نوع العملية</span><span>التاريخ</span>
              </div>
              {allTransactions.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</div>
                  <h3>لا توجد عمليات مالية بعد</h3>
                  <p>عندم يتم بيع المنتجات، ستظهر جميع تفاصيل الأرباح والمبالغ المستحقة هنا.</p>
                </div>
              ) : (
                allTransactions.map(trans => (
                  <div key={trans.id} className="table-row" style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 1.5fr', alignItems: 'center' }}>
                    <span className="order-id" style={{ fontWeight: 600 }}>#{trans.order_number}</span>
                    <span>🏪 {trans.store_name || 'غير معروف'}</span>
                    <span style={{ fontWeight: 600 }}>{Number(trans.amount || 0).toLocaleString()} ريال</span>
                    <span style={{ color: '#059669', fontWeight: 600, background: '#ecfdf5', padding: '0.3rem 0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                      +{Number(trans.commission || 0).toLocaleString()} ريال
                    </span>
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>{Number(trans.vendor_amount || 0).toLocaleString()} ريال</span>
                    <span className="order-status" style={{ background: trans.transaction_type === 'sale' ? '#e0e7ff' : '#fef2f2', color: trans.transaction_type === 'sale' ? '#4f46e5' : '#dc2626' }}>
                      {trans.transaction_type === 'sale' ? 'بيع منتجات' : 'استرجاع'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(trans.created_at).toLocaleString('ar-SA')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Payment Accounts ── */}
        {activeTab === 'payment-accounts' && (
          <div className="admin-section">
            <div className="admin-section-header" style={{ marginBottom: '1.5rem' }}>
              <h3>💳 حسابات الدفع — أرقام حسابات المنصة</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>هذه الأرقام تظهر للعملاء عند الدفع. يمكنك تعديلها في أي وقت.</p>
            </div>
            {paymentAccounts.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">💳</span><h3>لا توجد حسابات دفع</h3></div>
            ) : (
              <div className="payment-accounts-grid">
                {paymentAccounts.map(acc => (
                  <div key={acc.id} className="payment-account-admin-card">
                    <div className="pac-header">
                      <span className="pac-icon">{acc.icon}</span>
                      <h4>{acc.provider_display || acc.provider}</h4>
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem' }}>رقم الحساب/المحفظة</label>
                      <input type="text" defaultValue={acc.account_number}
                        onBlur={e => { if (e.target.value !== acc.account_number) handleUpdatePaymentAccount(acc.id, 'account_number', e.target.value); }}
                        style={{ fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem' }}>اسم صاحب الحساب</label>
                      <input type="text" defaultValue={acc.account_name}
                        onBlur={e => { if (e.target.value !== acc.account_name) handleUpdatePaymentAccount(acc.id, 'account_name', e.target.value); }} />
                    </div>
                    {acc.bank_name !== undefined && (
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem' }}>اسم البنك</label>
                        <input type="text" defaultValue={acc.bank_name || ''}
                          onBlur={e => handleUpdatePaymentAccount(acc.id, 'bank_name', e.target.value)} />
                      </div>
                    )}
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem' }}>تعليمات الدفع</label>
                      <textarea defaultValue={acc.instructions || ''} rows="2" style={{ fontSize: '0.85rem' }}
                        onBlur={e => { if (e.target.value !== acc.instructions) handleUpdatePaymentAccount(acc.id, 'instructions', e.target.value); }}></textarea>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Users ── */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <h3 style={{ marginBottom: '1rem' }}>المستخدمين ({allUsers.length})</h3>
            <div className="dashboard-table">
              <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr' }}>
                <span>المستخدم</span><span>البريد الإلكتروني</span><span>الجوال</span><span>الدور</span><span>المدينة</span><span>تاريخ الانضمام</span><span>إجراء</span>
              </div>
              {allUsers.map(u => {
                const roleMap = { admin: { text: 'مدير', c: '#6366f1', bg: '#e0e7ff' }, vendor: { text: 'بائع', c: '#059669', bg: '#ecfdf5' }, customer: { text: 'عميل', c: '#f59e0b', bg: '#fef3c7' } };
                const r = roleMap[u.role] || roleMap.customer;
                return (
                  <div key={u.id} className="table-row" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr' }}>
                    <span style={{ fontWeight: 600 }}>👤 {u.username}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email || '-'}</span>
                    <span style={{ fontSize: '0.85rem', direction: 'ltr' }}>{u.phone || '-'}</span>
                    <span className="order-status" style={{ background: r.bg, color: r.c }}>{r.text}</span>
                    <span>{u.city || '-'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.date_joined ? new Date(u.date_joined).toLocaleDateString('ar') : '-'}</span>
                    <span>
                      <button className="action-btn danger" onClick={() => handleDeleteUser(u.id)}>🗑️ حذف</button>
                    </span>
                  </div>
                );
              })}
              {allUsers.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد بيانات مستخدمين</div>}
            </div>
          </div>
        )}

        {/* ── Tab: Categories ── */}
        {activeTab === 'categories' && (
          <div className="admin-section">
            <div className="admin-section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <h3>إدارة الأقسام ({categories.length})</h3>
              <button className="btn btn-primary" onClick={() => setEditingCategory({ isNew: true, name: '', name_ar: '', icon: '' })}>+ إضافة قسم جديد</button>
            </div>
            {editingCategory && (
              <div className="store-detail-panel" style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc' }}>
                <h4>{editingCategory.isNew ? 'إضافة قسم جديد' : 'تعديل القسم'}</h4>
                <div className="form-row" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>الاسم (عربي) *</label>
                    <input type="text" value={editingCategory.name_ar || editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name_ar: e.target.value, name: editingCategory.isNew ? e.target.value : editingCategory.name })} />
                  </div>
                  <div className="form-group">
                    <label>الاسم (إنجليزي/اختياري)</label>
                    <input type="text" value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>أيقونة (Emoji)</label>
                    <input type="text" maxLength="4" value={editingCategory.icon || ''} onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>صورة القسم</label>
                    <input type="file" accept="image/*" onChange={e => setEditingCategory({ ...editingCategory, imageFile: e.target.files[0] })} style={{ padding: '0.4rem', background: '#fff' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={async () => {
                    try {
                      const payload = new FormData();
                      payload.append('name', editingCategory.name || editingCategory.name_ar);
                      payload.append('name_ar', editingCategory.name_ar);
                      payload.append('icon', editingCategory.icon || '');
                      if (editingCategory.imageFile) {
                        payload.append('image', editingCategory.imageFile);
                      }

                      if (editingCategory.isNew) {
                        const res = await createCategory(payload);
                        setCategories([...categories, res.data]);
                        toast.success('تمت الإضافة بنجاح');
                      } else {
                        const res = await updateCategory(editingCategory.id, payload);
                        setCategories(categories.map(c => c.id === editingCategory.id ? res.data : c));
                        toast.success('تم التعديل بنجاح');
                      }
                      setEditingCategory(null);
                    } catch (e) { toast.error('فشل حفظ القسم'); }
                  }}>حفظ</button>
                  <button className="btn btn-outline" onClick={() => setEditingCategory(null)}>إلغاء</button>
                </div>
              </div>
            )}
            <div className="dashboard-table">
              <div className="table-header" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr' }}>
                <span>الأيقونة</span><span>القسم</span><span>الاسم الإنجليزي</span><span>المنتجات</span><span>إجراء</span>
              </div>
              {categories.map(cat => (
                <div key={cat.id} className="table-row" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>{cat.icon || '📁'}</span>
                  <span style={{ fontWeight: 600 }}>{cat.name_ar || cat.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
                  <span style={{ color: '#059669', fontWeight: 'bold' }}>{cat.product_count || 0} منتج</span>
                  <span style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="action-btn" onClick={() => setEditingCategory(cat)}>✏️ تعديل</button>
                    <button className="action-btn danger" onClick={async () => {
                      if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
                        try {
                          await deleteCategory(cat.id);
                          setCategories(categories.filter(c => c.id !== cat.id));
                          toast.success('تم حذف القسم');
                        } catch (e) { toast.error('فشل في عملية الحذف'); }
                      }
                    }}>🗑️ حذف</button>
                  </span>
                </div>
              ))}
              {categories.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد أقسام</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
