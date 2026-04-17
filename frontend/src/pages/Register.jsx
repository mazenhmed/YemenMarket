import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { sendWhatsAppOTP, phoneRegister } from '../services/api';

const STEPS = { INFO: 'info', OTP: 'otp' };

const Register = () => {
  const [step, setStep]         = useState(STEPS.INFO);
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', confirmPassword: '', role: 'customer' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [sendingOtp, setSendingOtp]     = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown]       = useState(0);
  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const toast    = useToast();

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const saveAndRedirect = (data) => {
    const { access, refresh, user } = data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    if (user.role === 'vendor') navigate('/vendor/dashboard');
    else navigate('/');
  };

  // ── Step 1: Validate info and send WhatsApp OTP ──────────────
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, phone, password, confirmPassword } = formData;
    const cleaned = phone.replace(/\D/g, '');

    if (!name.trim())             { setError('يرجى إدخال الاسم'); return; }
    if (cleaned.length < 9)       { setError('يرجى إدخال رقم جوال يمني صحيح (9 أرقام)'); return; }
    if (password.length < 6)      { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (password !== confirmPassword) { setError('كلمة المرور وتأكيدها غير متطابقتين'); return; }

    setSendingOtp(true);
    try {
      await sendWhatsAppOTP(cleaned);
      setStep(STEPS.OTP);
      setCountdown(120);
      toast.success(`✅ تم إرسال رمز التحقق على واتساب: +967${cleaned}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err) {
      console.error('Send OTP error:', err.response?.status, err.response?.data);
      const msg = err.response?.data?.error
                || err.response?.data?.detail
                || err.message
                || 'فشل إرسال الرمز، تحقق من رقم الجوال';
      setError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2: Handle OTP input ─────────────────────────────────
  const handleOtpChange = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = v;
    setOtp(next);
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!v && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (next.every(d => d) && next.join('').length === 6) handleVerifyOtp(next.join(''));
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); handleVerifyOtp(pasted); }
  };

  // ── Step 2: Verify OTP by sending to backend ─────────────────
  const handleVerifyOtp = async (code) => {
    setError('');
    setVerifyingOtp(true);
    try {
      const res = await phoneRegister({
        name:     formData.name,
        phone:    formData.phone.replace(/\D/g, ''),
        password: formData.password,
        role:     formData.role,
        otp_code: code,
      });
      toast.success('تم إنشاء حسابك بنجاح! 🎉');
      saveAndRedirect(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'فشل التحقق';
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      setError(msg);
      if (msg.includes('مسجّل مسبقاً')) setTimeout(() => setStep(STEPS.INFO), 2000);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResend = async () => {
    setError('');
    setSendingOtp(true);
    try {
      await sendWhatsAppOTP(formData.phone.replace(/\D/g, ''));
      setCountdown(120);
      setOtp(['', '', '', '', '', '']);
      toast.success('تم إعادة إرسال رمز التحقق ✅');
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إعادة الإرسال');
    } finally {
      setSendingOtp(false);
    }
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

          {/* Progress Steps */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[{ label: 'بياناتك', icon: '📝' }, { label: 'واتساب', icon: '💬' }].map((s, i) => (
              <React.Fragment key={i}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                  opacity: i === 0 ? (step === STEPS.INFO ? 1 : 0.5) : (step === STEPS.OTP ? 1 : 0.4)
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: (i === 0 && step === STEPS.INFO) || (i === 1 && step === STEPS.OTP) ? 'var(--primary)' : 'var(--glass-border)',
                    color: 'white', fontSize: '1rem', transition: 'all 0.3s'
                  }}>{s.icon}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</span>
                </div>
                {i < 1 && <div style={{ flex: 1, height: '2px', background: 'var(--glass-border)', maxWidth: '60px' }} />}
              </React.Fragment>
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* ── Step 1: Info Form ── */}
          {step === STEPS.INFO && (
            <>
              {/* Role Selector */}
              <div className="role-selector" style={{ marginBottom: '1rem' }}>
                <button type="button" className={`role-btn ${formData.role === 'customer' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'customer' })}>🛒 عميل</button>
                <button type="button" className={`role-btn ${formData.role === 'vendor' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'vendor' })}>🏪 بائع</button>
              </div>

              <form onSubmit={handleInfoSubmit} className="auth-form">
                <div className="form-group">
                  <label>الاسم الكامل</label>
                  <input type="text" placeholder="أدخل اسمك الكامل" value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>رقم الجوال (واتساب)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', pointerEvents: 'none' }}>
                      🇾🇪 +967
                    </span>
                    <input type="tel" placeholder="771234567"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                      style={{ paddingLeft: '5.5rem', direction: 'ltr', letterSpacing: '0.08em', fontSize: '1.05rem' }}
                      dir="ltr" maxLength={9} required />
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.3rem', display: 'block' }}>
                    💬 سيُرسل رمز التحقق عبر واتساب لهذا الرقم
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>كلمة المرور</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPass ? 'text' : 'password'} placeholder="6 أحرف على الأقل"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        style={{ paddingLeft: '2.5rem' }} required />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>تأكيد كلمة المرور</label>
                    <input type="password" placeholder="أعد كلمة المرور"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={sendingOtp}>
                  {sendingOtp
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        جارِ الإرسال عبر واتساب...
                      </span>
                    : '💬 إرسال رمز التحقق على واتساب'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP Verification ── */}
          {step === STEPS.OTP && (
            <div className="auth-form">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>تم إرسال رمز التحقق على واتساب إلى</p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', direction: 'ltr', color: '#25D366' }}>+967 {formData.phone}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>📱 افتح واتساب وانسخ الرمز</p>
              </div>

              {/* OTP Boxes */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.2rem' }}>
                {otp.map((digit, idx) => (
                  <input key={idx} ref={el => otpRefs.current[idx] = el}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    onKeyDown={e => { if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx-1]?.focus(); }}
                    disabled={verifyingOtp}
                    style={{
                      width: '46px', height: '56px', textAlign: 'center', fontSize: '1.4rem',
                      fontWeight: 700, border: `2px solid ${digit ? '#25D366' : 'var(--glass-border)'}`,
                      borderRadius: '12px', background: digit ? 'rgba(37,211,102,0.05)' : 'var(--glass-bg)',
                      outline: 'none', transition: 'all 0.2s', direction: 'ltr', fontFamily: 'monospace',
                    }} />
                ))}
              </div>

              {verifyingOtp && (
                <div style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 600 }}>
                  ⏳ جارِ إنشاء حسابك...
                </div>
              )}

              {/* Resend */}
              <div style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {countdown > 0
                  ? <span style={{ color: 'var(--text-muted)' }}>
                      إعادة الإرسال بعد <strong style={{ color: '#25D366' }}>{Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</strong>
                    </span>
                  : <button type="button" onClick={handleResend} disabled={sendingOtp}
                      style={{ background: 'none', border: 'none', color: '#25D366', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
                      🔄 {sendingOtp ? 'جارِ الإرسال...' : 'إرسال رمز جديد'}
                    </button>}
              </div>

              <button type="button" onClick={() => { setStep(STEPS.INFO); setOtp(['','','','','','']); setError(''); }}
                style={{ width: '100%', background: 'none', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0.6rem', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← تعديل البيانات
              </button>
            </div>
          )}

          <div className="auth-footer">
            <p>لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
