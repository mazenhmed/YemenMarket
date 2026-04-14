import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

const ICONS = {
  order_new: '🛒', order_status: '📦', order_paid: '💰',
  product_approved: '✅', product_rejected: '❌',
  store_approved: '🎉', store_suspended: '⚠️',
  welcome: '👋', system: '🔔', low_stock: '📉', new_review: '⭐',
};

const NotificationDropdown = () => {
  const { user } = useAuth();
  const { unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ page_size: 10 });
      setNotifications(res.data.results || res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchNotifications();
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

  if (!user) return null;

  return (
    <div className="notification-wrapper" ref={ref}>
      <button className="nav-notification-btn" onClick={handleOpen} title="الإشعارات">
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notif-dropdown-header">
            <h4>الإشعارات</h4>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                قراءة الكل
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {loading ? (
              <div className="notif-loading">جارِ التحميل...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">لا توجد إشعارات</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                >
                  <span className="notif-icon">{ICONS[n.notification_type] || '🔔'}</span>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{n.time_ago}</div>
                  </div>
                  {!n.is_read && <span className="notif-dot"></span>}
                </div>
              ))
            )}
          </div>

          <Link to="/notifications" className="notif-view-all" onClick={() => setOpen(false)}>
            عرض جميع الإشعارات ←
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
