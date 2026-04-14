import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser as apiLogin, registerUser as apiRegister, getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (user && token && token !== 'demo-token') {
      // Verify token is still valid and refresh user data
      getMe().then(res => {
        const userData = res.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }).catch(() => {
        // Token expired — keep local user data (don't log out automatically)
      });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const res = await apiLogin(credentials);
      const { access, refresh, user: userData } = res.data;
      
      if (!userData || !userData.role) {
        // If API didn't return user data in the token response,
        // try fetching it from /me/ endpoint
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        try {
          const meRes = await getMe();
          const meData = meRes.data;
          setUser(meData);
          localStorage.setItem('user', JSON.stringify(meData));
          return { success: true, user: meData };
        } catch {
          // Can't get user info, treat as failed
          return { success: false, error: 'فشل جلب بيانات المستخدم' };
        }
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      return { success: true, user: userData };
    } catch (error) {
      const msg = error.response?.data?.detail || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      return { success: false, error: msg };
    }
  };

  const register = async (data) => {
    try {
      await apiRegister(data);
      const result = await login({ username: data.username, password: data.password });
      return result;
    } catch (error) {
      const errors = error.response?.data;
      let msg = 'فشل إنشاء الحساب';
      if (errors?.username) msg = 'اسم المستخدم مستخدم بالفعل';
      else if (errors?.email) msg = 'البريد الإلكتروني مستخدم بالفعل';
      else if (errors?.password) msg = Array.isArray(errors.password) ? errors.password.join(' ') : String(errors.password);
      return { success: false, error: msg };
    }
  };

  // Demo login fallback (when backend is not running)
  const demoLogin = (userData, tokens) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, demoLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
