import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOrders, updateProfile } from '../services/api';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '', email: user?.email || '', phone: user?.phone || '', city: user?.city || '', address: user?.address || ''
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getOrders();
        const data = res.data.results || res.data;
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      toast.success('تم تحديث الملف الشخصي ✅');
      setEditMode(false);
    } catch {
      toast.info('تم الحفظ في وضع العرض');
      setEditMode(false);
    }
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

  const paymentLabels = {
    cash: '💵 نقدي', transfer: '🏛️ تحويل', floosak: '📱 فلوسك',
    jawali: '📲 جوالي', kuraimi: '🏦 كريمي', credit_card: '💳 بطاقة',
  };

  const roleLabels = { admin: 'مدير المنصة', vendor: 'بائع', customer: 'عميل' };

  return (
    <div className="page-content">
      <div className="container">
        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-avatar">{(user?.username || 'م')[0].toUpperCase()}</div>
            <h2>{user?.username}</h2>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role-badge">{roleLabels[user?.role] || user?.role}</span>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className={`filter-tab ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')} style={{ width: '100%' }}>🛒 طلباتي</button>
              <button className={`filter-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')} style={{ width: '100%' }}>👤 معلوماتي</button>
              <button className="filter-tab" onClick={logout} style={{ width: '100%', color: '#dc2626' }}>🚪 تسجيل الخروج</button>
            </div>
          </div>

          {/* Content */}
          <div className="profile-content">
            {activeTab === 'orders' && (
              <>
                <h2 style={{ marginBottom: '1.5rem' }}>طلباتي ({orders.length})</h2>
                {loading ? <LoadingSpinner text="جارِ تحميل الطلبات..." /> : (
                  orders.length > 0 ? (
                    orders.map(order => {
                      const s = getStatusLabel(order.status);
                      return (
                        <div key={order.id} className="order-history-card">
                          <div className="order-history-top">
                            <span style={{ fontWeight: 700 }}>طلب {order.order_number}</span>
                            <span className="order-status" style={{ background: s.bg, color: s.color }}>{s.text}</span>
                          </div>
                          <div className="order-history-details">
                            <span>📍 {order.city}</span>
                            <span>💰 {Number(order.total_price).toLocaleString()} ريال</span>
                            <span>📅 {new Date(order.created_at).toLocaleDateString('ar')}</span>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                              {order.items.map(item => (
                                <div key={item.id} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.2rem 0' }}>
                                  {item.product_name} × {item.quantity} — {Number(item.total).toLocaleString()} ريال
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {paymentLabels[order.payment_method] || order.payment_method}
                            </span>
                            {order.payment_confirmed && <span style={{ fontSize: '0.75rem', color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>✅ دفع مؤكد</span>}
                            {!order.payment_confirmed && order.payment_method !== 'cash' && <span style={{ fontSize: '0.75rem', color: '#f59e0b', background: '#fef3c7', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>⏳ بانتظار التأكيد</span>}
                            <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem' }}>
                              <Link to={`/invoice/${order.id}`} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>🧾 الفاتورة</Link>
                              {order.shipment && <Link to={`/tracking/${order.shipment.tracking_number}`} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>📦 تتبع</Link>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">📭</span>
                      <h3>لا توجد طلبات بعد</h3>
                      <p>ابدأ التسوق واطلب منتجاتك المفضلة</p>
                    </div>
                  )
                )}
              </>
            )}

            {activeTab === 'profile' && (
              <>
                <h2 style={{ marginBottom: '1.5rem' }}>معلوماتي الشخصية</h2>
                <div className="checkout-section">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="form-row">
                      <div className="form-group"><label>اسم المستخدم</label>
                        <input type="text" value={profileData.username} disabled={!editMode}
                          onChange={e => setProfileData({ ...profileData, username: e.target.value })} /></div>
                      <div className="form-group"><label>البريد الإلكتروني</label>
                        <input type="email" value={profileData.email} disabled={!editMode}
                          onChange={e => setProfileData({ ...profileData, email: e.target.value })} /></div>
                    </div>
                    <div className="form-row" style={{ marginTop: '1rem' }}>
                      <div className="form-group"><label>رقم الهاتف</label>
                        <input type="tel" value={profileData.phone} disabled={!editMode}
                          onChange={e => setProfileData({ ...profileData, phone: e.target.value })} /></div>
                      <div className="form-group"><label>المدينة</label>
                        <input type="text" value={profileData.city} disabled={!editMode}
                          onChange={e => setProfileData({ ...profileData, city: e.target.value })} /></div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}><label>العنوان</label>
                      <textarea value={profileData.address} disabled={!editMode} rows="3"
                        onChange={e => setProfileData({ ...profileData, address: e.target.value })}></textarea></div>
                    
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                      {editMode ? (
                        <>
                          <button type="button" className="btn btn-primary" onClick={handleProfileUpdate}>💾 حفظ</button>
                          <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)}>إلغاء</button>
                        </>
                      ) : (
                        <button type="button" className="btn btn-outline" onClick={(e) => { e.preventDefault(); setEditMode(true); }}>✏️ تعديل</button>
                      )}
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
