import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', role: 'customer'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, demoLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    if (!formData.username || !formData.email || !formData.password) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    if (result.success) {
      toast.success('تم إنشاء الحساب بنجاح!');
      navigate('/');
    } else {
      // Fallback demo mode
      if (result.error.includes('فشل')) {
        demoLogin(
          { username: formData.username, email: formData.email, role: formData.role },
          { access: 'demo-token', refresh: 'demo-refresh' }
        );
        toast.info('تم إنشاء الحساب في وضع العرض');
        navigate('/');
      } else {
        setError(result.error);
      }
    }
    setIsLoading(false);
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
            <h1>إنشاء حساب جديد</h1>
            <p>انضم إلينا وابدأ تجربة تسوق مميزة</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* Role Selector */}
          <div className="role-selector">
            <button type="button" className={`role-btn ${formData.role === 'customer' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'customer' })}>🛒 عميل</button>
            <button type="button" className={`role-btn ${formData.role === 'vendor' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'vendor' })}>🏪 بائع</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>اسم المستخدم</label>
              <input type="text" placeholder="أدخل اسم المستخدم" value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label>البريد الإلكتروني</label>
              <input type="email" placeholder="example@email.com" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>كلمة المرور</label>
                <input type="password" placeholder="أدخل كلمة المرور" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>تأكيد كلمة المرور</label>
                <input type="password" placeholder="أعد كلمة المرور" value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? 'جارِ الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>

          <div className="auth-footer">
            <p>لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
