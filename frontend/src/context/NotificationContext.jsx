import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUnreadNotificationCount } from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res.data.count || 0);
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    if (!user) return;
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const refresh = () => fetchUnreadCount();

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
export default NotificationContext;
