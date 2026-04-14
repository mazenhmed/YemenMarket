import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Demo accounts for testing
  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: 'admin', email: 'admin@yemenmarket.com' },
    { username: 'vendor', password: 'vendor123', role: 'vendor', email: 'vendor@store.com' },
    { username: 'customer', password: 'customer123', role: 'customer', email: 'customer@email.com' },
  ];

  const navigateByRole = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'vendor') navigate('/vendor/dashboard');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setError('');

    // Try real API first
    const result = await login(formData);
    
    if (result.success) {
      toast.success('تم تسجيل الدخول بنجاح!');
      navigateByRole(result.user.role);
    } else {
      // Fallback to demo accounts when backend is not running
      const account = demoAccounts.find(a => a.username === formData.username && a.password === formData.password);
      if (account) {
        demoLogin(
          { id: 1, username: account.username, email: account.email, role: account.role },
          { access: 'demo-token', refresh: 'demo-refresh' }
        );
        toast.info('تم الدخول بوضع العرض التجريبي');
        navigateByRole(account.role);
      } else {
        setError(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    }
    setIsLoading(false);
  };

  const fillDemoAccount = (account) => {
    setFormData({ username: account.username, password: account.password });
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">Y</div>
              <div className="logo-text">Yemen<span>Market</span></div>
            </div>
            <h1>مرحباً بعودتك!</h1>
            <p>قم بتسجيل الدخول للوصول إلى حسابك</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>اسم المستخدم</label>
              <input
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>كلمة المرور</label>
              <input
                type="password"
                placeholder="أدخل كلمة المرور"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? 'جارِ الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          
          <div className="auth-footer">
            <p>ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
