import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API, { phoneLogin, sendWhatsAppOTP } from '../services/api';

const Login = () => {
  const [step, setStep] = useState('login'); // 'login' | 'link-phone' | 'verify-otp'
  
  // Login form state
  const [identifier, setIdentifier] = useState(''); // phone OR username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useUsername, setUseUsername] = useState(false); // toggle classic login
  
  // Phone link state
  const [linkPhoneInput, setLinkPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempTokenData, setTempTokenData] = useState(null); // stores authenticated user briefly

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const navigateByRole = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'vendor') navigate('/vendor/dashboard');
    else navigate('/');
  };

  const finalizeLogin = (access, refresh, user) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    toast.success(`مرحباً بك مجدداً! 👋`);
    // Ensure state updates completely before router runs
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? '/admin' : (user.role === 'vendor' ? '/vendor/dashboard' : '/');
    }, 200);
  };

  const handleLoginSubmit = async (e) => {
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

      // ENFORCEMENT logic: If user logged in using username and has no phone in DB, intercept!
      if (!user.phone) {
        setTempTokenData({ access, refresh, user });
        setStep('link-phone');
        setTimeout(() => toast.info('يجب ربط رقم الواتساب الخاص بك لتأمين حسابك'), 500);
        setIsLoading(false);
        return;
      }

      finalizeLogin(access, refresh, user);
    } catch (err) {
      console.error('Login error detail:', err.response?.data);
      const backendError = err.response?.data?.error;
      const backendDetails = err.response?.data?.details;

      if (backendError) {
        setError(`${backendError}${backendDetails ? ': ' + backendDetails : ''}`);
      } else {
        setError('تعذر الاتصال بالخادم. يرجى التأكد من تشغيل السيرفر.');
      }
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const cleanedPhone = linkPhoneInput.replace(/\D/g, '');
    if (cleanedPhone.length < 9) {
      setError('يرجى إدخال رقم جوال يمني لنرسل لك الرمز');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await sendWhatsAppOTP(linkPhoneInput);
      setStep('verify-otp');
      toast.success('تم إرسال كود التحقق إلى حسابك في الواتساب');
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إرسال الكود. يرجى المحاولة لاحقاً');
    }
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError('يرجى إدخال الكود');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Secure call with explicit token to bypass local storage absence
      await API.post('/users/link-phone/', 
        { phone: linkPhoneInput, otp_code: otpCode },
        { headers: { Authorization: `Bearer ${tempTokenData.access}` } }
      );
      
      const updatedUser = { ...tempTokenData.user, phone: linkPhoneInput };
      finalizeLogin(tempTokenData.access, tempTokenData.refresh, updatedUser);
    } catch (err) {
      setError(err.response?.data?.error || 'الكود غير صحيح، الرجاء التأكد منه.');
      setIsLoading(false); // only stop loading on fail to avoid flicker
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLoginSubmit} className="auth-form">
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

      <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
        {isLoading
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            جارِ التحقق...
          </span>
          : '🔐 تسجيل الدخول'}
      </button>

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
    </form>
  );

  const renderLinkPhoneForm = () => (
    <form onSubmit={handleSendOTP} className="auth-form" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="form-group">
        <label>رقم الجوال المراد ربطه</label>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          للحفاظ على أمان حسابك، الرجاء إدخال رقم هاتف يمني صالح ليتم ربطه بالحساب.
        </p>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', pointerEvents: 'none'
          }}>🇾🇪 +967</span>
          <input
            type="tel"
            placeholder="771234567"
            value={linkPhoneInput}
            onChange={e => setLinkPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
            style={{ paddingLeft: '5.5rem', direction: 'ltr', letterSpacing: '0.08em', fontSize: '1.05rem' }}
            dir="ltr"
            maxLength={10}
            required
          />
        </div>
      </div>
      <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: '1rem' }}>
        {isLoading ? 'جاري الإرسال...' : 'إرسال كود الواتساب'}
      </button>
    </form>
  );

  const renderVerifyOTPForm = () => (
    <form onSubmit={handleVerifyOTP} className="auth-form" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="form-group">
        <label>رمز التحقق (OTP)</label>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          تم إرسال كود مكوّن من 6 أرقام إلى رقمك عبر الواتساب.
        </p>
        <input
          type="text"
          placeholder="أدخل الكود هنا"
          value={otpCode}
          onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.3rem', fontWeight: 'bold' }}
          dir="ltr"
          maxLength={6}
          required
        />
      </div>
      <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: '1rem' }}>
        {isLoading ? 'جارِ توثيق الحساب...' : 'تأكيد الحساب والدخول'}
      </button>
      <button type="button" onClick={() => setStep('link-phone')} disabled={isLoading}
        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>
        تعديل رقم الجوال
      </button>
    </form>
  );

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">Y</div>
              <div className="logo-text">Yemen<span>Market</span></div>
            </div>
            {step === 'login' && (
              <>
                <h1>مرحباً بعودتك! 👋</h1>
                <p>{useUsername ? 'سجّل دخولك باسم المستخدم' : 'سجّل دخولك برقم جوالك'}</p>
              </>
            )}
            {step === 'link-phone' && (
              <>
                <h1>تأمين الحساب 🛡️</h1>
                <p>خطوة واحدة فقط للوصول لحسابك</p>
              </>
            )}
            {step === 'verify-otp' && (
              <>
                <h1>التحقق من الواتساب 💬</h1>
                <p>الرجاء تأكيد هويتك</p>
              </>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}

          {step === 'login' && renderLoginForm()}
          {step === 'link-phone' && renderLinkPhoneForm()}
          {step === 'verify-otp' && renderVerifyOTPForm()}

          {step === 'login' && (
            <div className="auth-footer">
              <p>ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
