import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const ICONS = {
  order_new: '🛒', order_status: '📦', order_paid: '💰',
  product_approved: '✅', product_rejected: '❌',
  store_approved: '🎉', store_suspended: '⚠️',
  welcome: '👋', system: '🔔', low_stock: '📉', new_review: '⭐',
};

const COLORS = {
  order_new: '#6366f1', order_status: '#3b82f6', order_paid: '#10b981',
  product_approved: '#059669', product_rejected: '#ef4444',
  store_approved: '#8b5cf6', store_suspended: '#f59e0b',
  welcome: '#ec4899', system: '#6b7280', low_stock: '#ef4444', new_review: '#f59e0b',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { refresh } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ page_size: 100 });
      setNotifications(res.data.results || res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      refresh();
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      refresh();
    } catch { /* ignore */ }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>🔔 الإشعارات</h1>
          <p>جميع الإشعارات والتنبيهات الخاصة بك</p>
        </div>

        <div className="notifications-toolbar">
          <div className="notif-filters">
            <button className={`notif-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              الكل ({notifications.length})
            </button>
            <button className={`notif-filter-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
              غير مقروء ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
              قراءة الكل ✓
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div><p>جارِ التحميل...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔕</div>
            <h3>{filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}</h3>
            <Link to="/" className="btn btn-primary">العودة للرئيسية</Link>
          </div>
        ) : (
          <div className="notifications-list">
            {filtered.map(n => (
              <div
                key={n.id}
                className={`notification-card ${!n.is_read ? 'unread' : ''}`}
                onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                style={{ '--notif-color': COLORS[n.notification_type] || '#6b7280' }}
              >
                <div className="notif-card-icon" style={{ background: COLORS[n.notification_type] || '#6b7280' }}>
                  {ICONS[n.notification_type] || '🔔'}
                </div>
                <div className="notif-card-body">
                  <div className="notif-card-title">{n.title}</div>
                  <div className="notif-card-message">{n.message}</div>
                  <div className="notif-card-time">{n.time_ago || new Date(n.created_at).toLocaleDateString('ar')}</div>
                </div>
                {!n.is_read && <span className="notif-unread-indicator"></span>}
                {n.link && (
                  <Link to={n.link} className="notif-card-link" onClick={e => e.stopPropagation()}>
                    عرض ←
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
