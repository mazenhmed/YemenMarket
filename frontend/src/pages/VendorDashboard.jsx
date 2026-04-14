import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getVendorProducts, getOrders, createProduct, updateProduct, getCategories, 
  updateOrderStatus, getMyStore, updateStore, createStore,
  getVendorPaymentAccounts, createVendorPaymentAccount, updateVendorPaymentAccount, deleteVendorPaymentAccount
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const FALLBACK_STATS = [
  { label: 'إجمالي المنتجات', value: '0', icon: '📦', color: '#6366f1' },
  { label: 'الطلبات الجديدة', value: '0', icon: '🛒', color: '#10b981' },
  { label: 'إجمالي المبيعات', value: '0', icon: '💰', color: '#f59e0b' },
  { label: 'التقييم', value: '-', icon: '⭐', color: '#f43f5e' },
];

const VendorDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [myStore, setMyStore] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const defaultProductState = {
    name: '', price: '', stock_quantity: '', description: '', category: '', compare_price: '', image: null
  };
  const [productForm, setProductForm] = useState(defaultProductState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  const [storeForm, setStoreForm] = useState({
    store_name: '', description: '', phone: '', email: '', city: 'صنعاء', logo: null
  });
  const [creatingStore, setCreatingStore] = useState(false);
  
  const [settingsForm, setSettingsForm] = useState({
    store_name: '', description: '', phone: '', email: '', logo: null
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Payment Accounts State
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const defaultPaymentForm = { provider: 'floosak', account_name: '', account_number: '', bank_name: '', instructions: '', is_active: true };
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, ordersRes, catRes, storeRes, payRes] = await Promise.all([
          getVendorProducts(),
          getOrders(),
          getCategories(),
          getMyStore().catch(() => ({ data: null })),
          getVendorPaymentAccounts().catch(() => ({ data: [] }))
        ]);
        const pays = payRes.data.results || payRes.data || [];
        setPaymentAccounts(Array.isArray(pays) ? pays : []);

        const prods = prodRes.data.results || prodRes.data || [];
        const ords = ordersRes.data.results || ordersRes.data || [];
        const cats = catRes.data.results || catRes.data || [];

        setProducts(Array.isArray(prods) ? prods : []);
        setOrders(Array.isArray(ords) ? ords : []);
        setCategories(Array.isArray(cats) ? cats : []);
        if (storeRes.data) {
          setMyStore(storeRes.data);
          setSettingsForm({
             store_name: storeRes.data.store_name || '',
             description: storeRes.data.description || '',
             phone: storeRes.data.phone || '',
             email: storeRes.data.email || '',
             logo: null
          });
        }

        // Build stats from real data
        const totalSales = prods.reduce((s, p) => s + (Number(p.price) * (p.sold_count || 0)), 0);
        const avgRating = prods.length > 0
          ? (prods.reduce((s, p) => s + Number(p.rating || 0), 0) / prods.length).toFixed(1)
          : '-';
        const pendingOrders = ords.filter(o => o.status === 'pending').length;

        setStats([
          { label: 'إجمالي المنتجات', value: prods.length.toString(), icon: '📦', color: '#6366f1' },
          { label: 'الطلبات الجديدة', value: pendingOrders.toString(), icon: '🛒', color: '#10b981' },
          { label: 'إجمالي المبيعات', value: totalSales.toLocaleString() + ' ريال', icon: '💰', color: '#f59e0b' },
          { label: 'متوسط التقييم', value: avgRating, icon: '⭐', color: '#f43f5e' },
        ]);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          toast.error('يجب تسجيل الدخول كبائع لعرض إحصائياتك');
        } else if (error.message === 'Network Error') {
          toast.error('الخادم لا يعمل، يرجى تشغيل النافذة السوداء للباك-إند');
        } else {
          toast.error(error.message || 'خطأ في تحميل اللوحة');
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.stock_quantity) {
      toast.error('يرجى ملء اسم المنتج والسعر والكمية');
      return;
    }
    if (!isEditing && !productForm.image) {
      toast.error('لابد من إضافة صورة للمنتج 📸');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('price', productForm.price);
      formData.append('stock_quantity', productForm.stock_quantity);
      formData.append('description', productForm.description || '');
      if (productForm.category) formData.append('category', productForm.category);
      if (productForm.compare_price) formData.append('compare_price', productForm.compare_price);
      if (productForm.image instanceof File) {
          formData.append('image', productForm.image);
      }

      if (isEditing) {
        const res = await updateProduct(editingProductId, formData);
        setProducts(prev => prev.map(p => p.id === editingProductId ? res.data : p));
        toast.success('تم تعديل المنتج بنجاح! ✏️');
      } else {
        const res = await createProduct(formData);
        setProducts(prev => [res.data, ...prev]);
        toast.success('تم إضافة المنتج بنجاح! 📦 سيظهر بعد المراجعة.');
      }
      setShowAddProduct(false);
      setProductForm(defaultProductState);
      setIsEditing(false);
      setEditingProductId(null);
    } catch (err) {
      const msg = err.response?.data?.image ? 'حدث خطأ في الصورة.' : 'فشل الحفظ، تأكد من البيانات.';
      toast.error(msg);
    }
    setSubmitting(false);
  };

  const openEditModal = (product) => {
      setIsEditing(true);
      setEditingProductId(product.id);
      setProductForm({
          name: product.name,
          price: product.price,
          stock_quantity: product.stock_quantity,
          description: product.description || '',
          category: product.category || '',
          compare_price: product.compare_price || '',
          image: null // image must be reuploaded if they want to change it
      });
      setShowAddProduct(true);
  };

  const closeProductModal = () => {
    setShowAddProduct(false);
    setProductForm(defaultProductState);
    setIsEditing(false);
    setEditingProductId(null);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('تم تحديث حالة الطلب');
    } catch {
      toast.error('فشل تحديث الحالة');
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile) return toast.error('يرجى اختيار ملف');
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('id_document', docFile);
      const res = await updateStore(myStore.id, formData);
      setMyStore(res.data);
      toast.success('تم رفع وثيقة الهوية بنجاح، سيتم مراجعتها من قبل الإدارة.');
    } catch {
      toast.error('فشل في رفع الوثيقة');
    }
    setUploadingDoc(false);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: 'قيد الانتظار', color: '#f59e0b', bg: '#fef3c7' },
      confirmed: { text: 'مؤكد', color: '#3b82f6', bg: '#dbeafe' },
      processing: { text: 'قيد التجهيز', color: '#6366f1', bg: '#e0e7ff' },
      shipped: { text: 'تم الشحن', color: '#8b5cf6', bg: '#ede9fe' },
      delivered: { text: 'تم التوصيل', color: '#059669', bg: '#ecfdf5' },
      cancelled: { text: 'ملغي', color: '#dc2626', bg: '#fef2f2' },
    };
    return labels[status] || { text: status, color: '#64748b', bg: '#f1f5f9' };
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!storeForm.store_name) return toast.error('يرجى إدخال اسم المتجر');
    setCreatingStore(true);
    try {
      const formData = new FormData();
      Object.keys(storeForm).forEach(k => {
        if (storeForm[k]) formData.append(k, storeForm[k]);
      });
      const res = await createStore(formData);
      setMyStore(res.data);
      setSettingsForm({
         store_name: res.data.store_name || '', description: res.data.description || '',
         phone: res.data.phone || '', email: res.data.email || '', logo: null
      });
      toast.success('تم إنشاء متجرك بنجاح! 🎉 يرجى إكمال الوثائق لتوثيقه.');
    } catch (err) {
      if (err.response && err.response.data) {
        const errors = typeof err.response.data === 'object' ? Object.values(err.response.data).flat().join('\n') : 'خطأ من الخادم';
        toast.error(`سبب الخطأ: ${errors}`);
      } else {
        toast.error('الخادم غير متاح للاتصال. تأكد أن الباك-إند يعمل بدون أخطاء.');
      }
    }
    setCreatingStore(false);
  };

  const handleUpdateStoreSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      const formData = new FormData();
      Object.keys(settingsForm).forEach(k => {
        if (settingsForm[k]) formData.append(k, settingsForm[k]);
      });
      const res = await updateStore(myStore.id, formData);
      setMyStore(res.data);
      toast.success('تم حفظ إعدادات متجرك بنجاح! 💾');
    } catch {
      toast.error('لم نتمكن من حفظ الإعدادات.');
    }
    setUpdatingSettings(false);
  };

  if (loading) return <div className="page-content"><LoadingSpinner text="جارِ تحميل لوحة التحكم..." /></div>;

  if (!loading && !myStore) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="auth-card" style={{ maxWidth: '600px', width: '100%', margin: '2rem auto' }}>
          <div className="auth-header">
            <h2>مرحباً بك كشريك بيع 🏪</h2>
            <p>أنت على بُعد خطوة واحدة. يرجى إعداد بيانات متجرك.</p>
          </div>
          <form className="auth-form" onSubmit={handleCreateStore}>
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label>شعار المتجر (اختياري)</label>
              <input type="file" accept="image/*" onChange={(e) => setStoreForm({...storeForm, logo: e.target.files[0]})} style={{background: '#f8fafc', padding: '0.8rem', borderRadius: '10px', width: '100%'}} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>اسم المتجر *</label>
                <input type="text" placeholder="مثال: متجر التقنية" required 
                  value={storeForm.store_name} onChange={(e) => setStoreForm({...storeForm, store_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>المدينة *</label>
                <select value={storeForm.city} onChange={(e) => setStoreForm({...storeForm, city: e.target.value})}>
                    <option value="صنعاء">صنعاء</option><option value="عدن">عدن</option>
                    <option value="تعز">تعز</option><option value="إب">إب</option>
                    <option value="حضرموت">حضرموت</option><option value="الحديدة">الحديدة</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>رقم هاتف المتجر</label>
                <input type="text" placeholder="77XXXXXXX" 
                  value={storeForm.phone} onChange={(e) => setStoreForm({...storeForm, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني للتواصل</label>
                <input type="email" placeholder="store@example.com" 
                  value={storeForm.email} onChange={(e) => setStoreForm({...storeForm, email: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>وصف المتجر (النشاط التجاري)</label>
              <textarea placeholder="ماذا تبيع في متجرك؟" rows="3"
                value={storeForm.description} onChange={(e) => setStoreForm({...storeForm, description: e.target.value})}></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={creatingStore}>
              {creatingStore ? 'جارِ تفعيل المتجر...' : '🚀 إطلاق المتجر'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>لوحة تحكم البائع</h1>
            <p>مرحباً {user?.username || 'بائع'}، إليك ملخص أداء متجرك</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/sales-report" className="btn btn-outline" style={{ background: '#fffbeb', borderColor: '#f59e0b', color: '#d97706' }}>📊 تقرير المبيعات</Link>
            <button className="btn btn-primary" onClick={() => { setIsEditing(false); setProductForm(defaultProductState); setShowAddProduct(true); }}>➕ إضافة منتج</button>
          </div>
        </div>

        {myStore && !myStore.is_verified && (
          <div className="store-verification-banner" style={{background: '#fffbeb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '2rem'}}>
            <h3 style={{color: '#d97706', marginBottom: '0.5rem'}}>⚠️ متجرك بانتظار التوثيق ({getStatusLabel(myStore.status).text})</h3>
            <p style={{color: '#92400e', marginBottom: '1rem'}}>
              مرحباً بك في يمن ماركت! لنشر منتجاتك للعامة، بجب عليك رفع وثيقة إثبات الهوية (بطاقة شخصية أو سجل تجاري واضح).
            </p>
            {myStore.admin_notes && (
              <p style={{color: '#dc2626', fontWeight: 'bold', marginBottom: '1rem'}}>
                ملاحظة الإدارة: {myStore.admin_notes}
              </p>
            )}
            <form onSubmit={handleUploadDoc} style={{display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
              <input type="file" onChange={e => setDocFile(e.target.files[0])} accept="image/*,.pdf" style={{background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db'}} />
              <button type="submit" className="btn btn-primary" disabled={uploadingDoc || !docFile}>
                {uploadingDoc ? 'جارِ الرفع...' : 'رفع الوثيقة'}
              </button>
            </form>
            {myStore.id_document && (
              <p style={{color: '#059669', marginTop: '1rem', fontSize: '0.9rem'}}>✅ تم رفع وثيقة وهي قيد المراجعة. <a href={myStore.id_document} target="_blank" rel="noreferrer" style={{textDecoration:'underline'}}>عرض الوثيقة</a></p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="dashboard-stats">
          {stats.map((stat, idx) => (
            <div key={idx} className="dashboard-stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
              <div className="stat-value" style={{ fontSize: '1.3rem' }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button className={`dash-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 نظرة عامة</button>
          <button className={`dash-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>📦 المنتجات ({products.length})</button>
          <button className={`dash-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>🛒 الطلبات ({orders.length})</button>
          <button className={`dash-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>💳 طرق الدفع</button>
          <button className={`dash-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ الإعدادات</button>
        </div>

        {/* Orders */}
        {(activeTab === 'overview' || activeTab === 'orders') && (
          <div className="dashboard-section">
            <h3>آخر الطلبات</h3>
            {orders.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">📭</span><h3>لا توجد طلبات بعد</h3></div>
            ) : (
              <div className="dashboard-table">
                <div className="table-header">
                  <span>رقم الطلب</span><span>العميل</span><span>المبلغ</span><span>الحالة</span><span>إجراء</span>
                </div>
                {orders.slice(0, activeTab === 'overview' ? 5 : orders.length).map(order => {
                  const s = getStatusLabel(order.status);
                  return (
                    <div key={order.id} className="table-row">
                      <span className="order-id">{order.order_number}</span>
                      <span>{order.full_name}</span>
                      <span>{Number(order.total_price).toLocaleString()} ريال</span>
                      <span className="order-status" style={{ background: s.bg, color: s.color }}>{s.text}</span>
                      <span style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {order.status === 'pending' && (
                          <button className="action-btn success" onClick={() => handleUpdateStatus(order.id, 'confirmed')}>✅ تأكيد</button>
                        )}
                        {order.status === 'confirmed' && (
                          <button className="action-btn warning" onClick={() => handleUpdateStatus(order.id, 'shipped')}>🚚 شحن</button>
                        )}
                        <button className="action-btn" onClick={() => setViewingOrder(order)}>👁️ عرض الطلب</button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Products */}
        {(activeTab === 'overview' || activeTab === 'products') && (
          <div className="dashboard-section">
            <h3>منتجاتي</h3>
            {products.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <h3>لا توجد منتجات بعد</h3>
                <button className="btn btn-primary" onClick={() => { setIsEditing(false); setProductForm(defaultProductState); setShowAddProduct(true); }}>➕ أضف أول منتج</button>
              </div>
            ) : (
              <div className="dashboard-table">
                <div className="table-header">
                  <span>المنتج</span><span>السعر</span><span>المخزون</span><span>المبيعات</span><span>الحالة</span>
                </div>
                {products.slice(0, activeTab === 'overview' ? 5 : products.length).map(p => {
                  const statusMap = { active: { text: 'نشط', color: '#059669', bg: '#ecfdf5' }, pending: { text: 'بانتظار المراجعة', color: '#d97706', bg: '#fef3c7' }, suspended: { text: 'موقوف', color: '#dc2626', bg: '#fef2f2' } };
                  const st = statusMap[p.status] || statusMap.active;
                  return (
                    <div key={p.id} className="table-row">
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span>{Number(p.price).toLocaleString()} ريال</span>
                      <span style={{ color: p.stock_quantity === 0 ? '#dc2626' : 'inherit' }}>{p.stock_quantity} قطعة</span>
                      <span>{p.sold_count || 0} مبيع</span>
                      <span className="order-status" style={{ background: st.bg, color: st.color }}>{st.text}</span>
                      <span>
                        <button className="action-btn success" onClick={() => openEditModal(p)}>✏️ تعديل</button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Payment Accounts Tab */}
        {activeTab === 'payments' && (
          <div className="dashboard-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>💳 حسابات الدفع الخاصة بمتجرك</h3>
              <button className="btn btn-primary" onClick={() => { setEditingPayment(null); setPaymentForm(defaultPaymentForm); setShowPaymentModal(true); }}>➕ إضافة حساب</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              هذه الحسابات ستظهر للعملاء عند الدفع لطلباتهم من متجرك. تأكد من صحة البيانات.
            </p>
            {paymentAccounts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">💳</span>
                <h3>لم تضف أي حساب دفع بعد</h3>
                <p>أضف حسابات الدفع الخاصة بك (فلوسك، جوالي، كريمي، تحويل بنكي) لكي يتمكن العملاء من إرسال الدفعات إليك.</p>
                <button className="btn btn-primary" onClick={() => { setEditingPayment(null); setPaymentForm(defaultPaymentForm); setShowPaymentModal(true); }}>➕ إضافة أول حساب</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
                {paymentAccounts.map(acc => {
                  const icons = { floosak: '📱', jawali: '📲', kuraimi: '🏦', transfer: '🏛️', cash: '💵' };
                  const providerNames = { floosak: 'فلوسك', jawali: 'جوالي', kuraimi: 'كريمي', transfer: 'تحويل بنكي', cash: 'استلام نقدي' };
                  return (
                    <div key={acc.id} style={{ background: acc.is_active ? 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' : '#f8fafc', border: `1.5px solid ${acc.is_active ? '#6ee7b7' : '#e2e8f0'}`, borderRadius: '14px', padding: '1.4rem', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ fontSize: '2rem' }}>{icons[acc.provider] || '💳'}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{providerNames[acc.provider]}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{acc.account_name}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: acc.is_active ? '#dcfce7' : '#fee2e2', color: acc.is_active ? '#166534' : '#991b1b', fontWeight: 600 }}>
                          {acc.is_active ? '✅ فعّال' : '⛔ معطل'}
                        </span>
                      </div>
                      <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.05em', color: '#0f172a', direction: 'ltr', textAlign: 'left' }}>{acc.account_number}</div>
                        {acc.bank_name && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>🏦 {acc.bank_name}</div>}
                        {acc.instructions && <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.5rem', fontStyle: 'italic' }}>💡 {acc.instructions}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                        <button className="action-btn success" style={{ flex: 1 }} onClick={() => { setEditingPayment(acc); setPaymentForm({ provider: acc.provider, account_name: acc.account_name, account_number: acc.account_number, bank_name: acc.bank_name || '', instructions: acc.instructions || '', is_active: acc.is_active }); setShowPaymentModal(true); }}>✏️ تعديل</button>
                        <button className="action-btn" style={{ flex: 1, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={async () => { if (!window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) return; try { await deleteVendorPaymentAccount(acc.id); setPaymentAccounts(p => p.filter(a => a.id !== acc.id)); toast.success('تم حذف الحساب'); } catch { toast.error('فشل الحذف'); } }}>🗑️ حذف</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Store Settings */}
        {activeTab === 'settings' && (
          <div className="dashboard-section">
            <h3>إعدادات وتفاصيل المتجر</h3>
            <div className="auth-card" style={{ maxWidth: '600px', margin: '0 auto', boxShadow: 'none', border: '1px solid var(--glass-border)' }}>
              <form className="auth-form" onSubmit={handleUpdateStoreSettings}>
                {myStore.logo && (
                   <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
                     <img src={myStore.logo} alt="شعار" style={{width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-400)', padding: '3px'}} />
                   </div>
                )}
                <div className="form-group">
                  <label>تغيير شعار المتجر (صورة العرض)</label>
                  <input type="file" accept="image/*" onChange={(e) => setSettingsForm({...settingsForm, logo: e.target.files[0]})} style={{background: '#f8fafc', padding: '0.8rem', borderRadius: '10px', width: '100%'}} />
                </div>
                <div className="form-group">
                  <label>اسم المتجر الحالي</label>
                  <input type="text" value={settingsForm.store_name || ''} onChange={(e) => setSettingsForm({...settingsForm, store_name: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>هاتف التواصل</label>
                    <input type="text" value={settingsForm.phone || ''} onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" value={settingsForm.email || ''} onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>وصف المتجر</label>
                  <textarea rows="3" value={settingsForm.description || ''} onChange={(e) => setSettingsForm({...settingsForm, description: e.target.value})}></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={updatingSettings}>
                  {updatingSettings ? 'جارِ الحفظ...' : '💾 حفظ الإعدادات'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showAddProduct && (
          <div className="modal-overlay" onClick={closeProductModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                <button className="modal-close" onClick={closeProductModal}>✕</button>
              </div>
              <form className="auth-form" onSubmit={handleSaveProduct}>
                <div className="form-group" style={{ textAlign: 'center' }}>
                  <label>صورة المنتج {isEditing ? '(اترك الحقل فارغاً للاحتفاظ بالحاليه)' : '*'}</label>
                  <input type="file" accept="image/*" 
                    onChange={e => setProductForm({ ...productForm, image: e.target.files[0] })}
                    style={{background: '#f8fafc', padding: '0.8rem', borderRadius: '10px', width: '100%'}} />
                </div>
                <div className="form-group">
                  <label>اسم المنتج *</label>
                  <input type="text" placeholder="اسم المنتج" value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>السعر (ريال) *</label>
                    <input type="number" placeholder="0" value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>السعر الأصلي (للخصومات)</label>
                    <input type="number" placeholder="(اختياري)" value={productForm.compare_price}
                      onChange={e => setProductForm({ ...productForm, compare_price: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>الكمية المتوفرة *</label>
                  <input type="number" placeholder="0" value={productForm.stock_quantity}
                    onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>القسم</label>
                  <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                    <option value="">اختر القسم</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar || c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>وصف المنتج</label>
                  <textarea rows="3" placeholder="اكتب وصفاً مفصلاً للمنتج..." value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                  {submitting ? 'جارِ الحفظ...' : '💾 حفظ المنتج'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {viewingOrder && (
          <div className="modal-overlay" onClick={() => setViewingOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>تفاصيل الطلب #{viewingOrder.order_number}</h2>
                <button className="modal-close" onClick={() => setViewingOrder(null)}>✕</button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>معلومات العميل</h4>
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <p><span style={{ fontWeight: 600 }}>👤 الاسم:</span> {viewingOrder.full_name}</p>
                      <p><span style={{ fontWeight: 600 }}>📍 المدينة:</span> {viewingOrder.city}</p>
                      <p><span style={{ fontWeight: 600 }}>📞 الهاتف:</span> {viewingOrder.phone}</p>
                      <p><span style={{ fontWeight: 600 }}>🏠 العنوان:</span> {viewingOrder.address}</p>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>معلومات الدفع</h4>
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <p><span style={{ fontWeight: 600 }}>💰 الإجمالي:</span> <span style={{ color: '#059669', fontWeight: 'bold' }}>{Number(viewingOrder.total_price).toLocaleString()} ريال</span></p>
                      <p><span style={{ fontWeight: 600 }}>💳 الطريقة:</span> {viewingOrder.payment_method === 'cash' ? '💵 نقدي' : viewingOrder.payment_method === 'transfer' ? '🏛️ حوالة بنكية' : viewingOrder.payment_method}</p>
                      <p><span style={{ fontWeight: 600 }}>وضع الدفع:</span> {viewingOrder.payment_confirmed ? '✅ مدفوع ومؤكد' : '⏳ بانتظار التأكيد'}</p>
                      <p><span style={{ fontWeight: 600 }}>📅 التاريخ:</span> <span style={{ fontSize: '0.85rem' }}>{new Date(viewingOrder.created_at).toLocaleString('ar-SA')}</span></p>
                    </div>
                  </div>
                </div>
                
                <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>المنتجات المطلوبة في هذا الطلب</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {viewingOrder.items && viewingOrder.items.length > 0 ? (
                    viewingOrder.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <div style={{ fontSize: '1.5rem' }}>📦</div>
                           <div>
                             <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.product_name}</div>
                             <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>السعر: {Number(item.price).toLocaleString()} ريال</div>
                           </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                           <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.2rem' }}>الكمية: {item.quantity}</div>
                           <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#059669' }}>المجموع: {Number(item.total).toLocaleString()} ريال</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: '8px' }}>لا توجد تفاصيل للعناصر (قد يكون الطلب قديماً)</div>
                  )}
                </div>
                
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => setViewingOrder(null)} style={{ padding: '0.6rem 2rem' }}>إغلاق</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Account Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingPayment ? 'تعديل حساب الدفع' : 'إضافة حساب دفع جديد'}</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <form className="auth-form" onSubmit={async (e) => {
              e.preventDefault();
              if (!paymentForm.account_name || !paymentForm.account_number) return toast.error('يرجى تعبئة اسم الحساب ورقمه');
              setSavingPayment(true);
              try {
                if (editingPayment) {
                  const res = await updateVendorPaymentAccount(editingPayment.id, paymentForm);
                  setPaymentAccounts(p => p.map(a => a.id === editingPayment.id ? res.data : a));
                  toast.success('تم تعديل حساب الدفع بنجاح ✅');
                } else {
                  const res = await createVendorPaymentAccount(paymentForm);
                  setPaymentAccounts(p => [res.data, ...p]);
                  toast.success('تم إضافة حساب الدفع بنجاح ✅');
                }
                setShowPaymentModal(false);
                setPaymentForm(defaultPaymentForm);
                setEditingPayment(null);
              } catch (err) {
                const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.provider?.[0] || 'فشل الحفظ، تأكد من البيانات';
                toast.error(msg);
              }
              setSavingPayment(false);
            }}>
              <div className="form-group">
                <label>نوع خدمة الدفع *</label>
                <select value={paymentForm.provider} onChange={e => setPaymentForm({...paymentForm, provider: e.target.value})}>
                  <option value="floosak">📱 فلوسك</option>
                  <option value="jawali">📲 جوالي</option>
                  <option value="kuraimi">🏦 كريمي</option>
                  <option value="transfer">🏛️ تحويل بنكي</option>
                  <option value="cash">💵 استلام نقدي</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>اسم صاحب الحساب *</label>
                  <input type="text" placeholder="مثال: محمد أحمد" value={paymentForm.account_name} onChange={e => setPaymentForm({...paymentForm, account_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>رقم الحساب / المحفظة *</label>
                  <input type="text" placeholder="مثال: 77XXXXXXX" value={paymentForm.account_number} onChange={e => setPaymentForm({...paymentForm, account_number: e.target.value})} dir="ltr" />
                </div>
              </div>
              {paymentForm.provider === 'transfer' && (
                <div className="form-group">
                  <label>اسم البنك</label>
                  <input type="text" placeholder="مثال: بنك اليمن والخليج" value={paymentForm.bank_name} onChange={e => setPaymentForm({...paymentForm, bank_name: e.target.value})} />
                </div>
              )}
              <div className="form-group">
                <label>تعليمات للعميل (اختياري)</label>
                <textarea rows="2" placeholder="مثال: قم بإرسال المبلغ ثم أرسل رقم العملية في ملاحظات الطلب" value={paymentForm.instructions} onChange={e => setPaymentForm({...paymentForm, instructions: e.target.value})}></textarea>
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.8rem' }}>
                <input type="checkbox" id="acc-active" checked={paymentForm.is_active} onChange={e => setPaymentForm({...paymentForm, is_active: e.target.checked})} style={{ width: 'auto', margin: 0 }} />
                <label htmlFor="acc-active" style={{ margin: 0, cursor: 'pointer' }}>تفعيل هذا الحساب وإظهاره للعملاء</label>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={savingPayment}>
                {savingPayment ? 'جارِ الحفظ...' : '💾 حفظ الحساب'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
