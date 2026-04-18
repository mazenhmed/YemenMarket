import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { phoneLogin } from '../services/api';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // phone OR username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useUsername, setUseUsername] = useState(false); // toggle classic login
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const navigateByRole = (user) => {
    if (user.role === 'vendor' && !user.phone) {
      toast.info('🛡️ خطوة أمان: يرجى ربط رقم جوالك وتوثيقه للمتابعة');
      navigate('/verify-phone');
      return;
    }

    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'vendor') navigate('/vendor/dashboard');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError(useUsername ? 'يرجى إدخال اسم المستخدم' : 'يرجى إدخال رقم الجوال');
      return;
    }
    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }
    if (!useUsername && identifier.replace(/\D/g, '').length < 9) {
      setError('يرجى إدخال رقم جوال يمني صحيح');
      return;
    }

    setIsLoading(true);
    try {
      const res = await phoneLogin(identifier.trim(), password);
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(`مرحباً بك! 👋`);
      navigateByRole(user);
    } catch (err) {
      console.error('Login error detail:', err.response?.data);
      const backendError = err.response?.data?.error;
      const backendDetails = err.response?.data?.details;
      
      if (backendError) {
        setError(`${backendError}${backendDetails ? ': ' + backendDetails : ''}`);
      } else {
        setError('تعذر الاتصال بالخادم. يرجى التأكد من تشغيل السيرفر.');
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
            <h1>مرحباً بعودتك! 👋</h1>
            <p>{useUsername ? 'سجّل دخولك باسم المستخدم' : 'سجّل دخولك برقم جوالك'}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Phone field */}
            {!useUsername && (
              <div className="form-group">
                <label>رقم الجوال</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', pointerEvents: 'none'
                  }}>🇾🇪 +967</span>
                  <input
                    type="tel"
                    placeholder="771234567"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ paddingLeft: '5.5rem', direction: 'ltr', letterSpacing: '0.08em', fontSize: '1.05rem' }}
                    dir="ltr"
                    maxLength={10}
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

            {/* Username field (classic login) */}
            {useUsername && (
              <div className="form-group">
                <label>اسم المستخدم</label>
                <input
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="username"
                />
              </div>
            )}

            {/* Password field */}
            <div className="form-group">
              <label>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}
              style={{ marginTop: '0.5rem' }}>
              {isLoading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    جارِ التحقق...
                  </span>
                : '🔐 تسجيل الدخول'}
            </button>
          </form>

          {/* Toggle login method */}
          <div style={{ textAlign: 'center', marginTop: '1rem', padding: '0.8rem', background: 'var(--glass-bg)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
            {!useUsername ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                مشترك قديم؟{' '}
                <button type="button"
                  onClick={() => { setUseUsername(true); setIdentifier(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textDecoration: 'underline', fontSize: '0.85rem' }}>
                  دخول باسم المستخدم
                </button>
              </span>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <button type="button"
                  onClick={() => { setUseUsername(false); setIdentifier(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textDecoration: 'underline', fontSize: '0.85rem' }}>
                  ← دخول برقم الجوال
                </button>
              </span>
            )}
          </div>

          <div className="auth-footer">
            <p>ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
