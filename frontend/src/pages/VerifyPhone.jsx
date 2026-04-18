import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { sendWhatsAppOTP, linkPhone } from '../services/api';

const STEPS = { INPUT: 'input', OTP: 'otp' };

const VerifyPhone = () => {
  const [step, setStep]     = useState(STEPS.INPUT);
  const [phone, setPhone]   = useState('');
  const [otp, setOtp]       = useState(['', '', '', '', '', '']);
  const [error, setError]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const toast    = useToast();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) {
      setError('يرجى إدخال رقم جوال يمني صحيح (9 أرقام)');
      return;
    }

    setLoading(true);
    try {
      await sendWhatsAppOTP(cleaned);
      setStep(STEPS.OTP);
      setCountdown(120);
      toast.success(`تم إرسال رمز التحقق إلى +967${cleaned}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!v && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('يرجى إدخال رمز التحقق كاملاً (6 أرقام)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await linkPhone(phone.replace(/\D/g, ''), code);
      toast.success(res.data.message || 'تم ربط الرقم بنجاح ✅');
      
      const user = JSON.parse(localStorage.getItem('user'));
      user.phone = res.data.user.phone;
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'vendor') navigate('/vendor/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'رمز التحقق غير صحيح');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
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
            <h1>تأكيد رقم الهاتف</h1>
            <p>يجب عليك ربط رقم هاتف فعال لمتابعة استخدام المتجر</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {step === STEPS.INPUT ? (
            <form onSubmit={handleSendOtp} className="auth-form">
              <div className="form-group">
                <label>رقم الجوال (واتساب)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>🇾🇪 +967</span>
                  <input type="tel" placeholder="771234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ paddingLeft: '5.5rem', direction: 'ltr' }}
                    dir="ltr" maxLength={10} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'جارِ الإرسال...' : 'إرسال رمز التحقق ✅'}
              </button>
            </form>
          ) : (
            <div className="auth-form">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <p>تم إرسال الرمز إلى <strong>+967 {phone}</strong></p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.2rem', direction: 'ltr' }}>
                {otp.map((d, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el}
                    type="text" maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus(); }}
                    style={{ width: '45px', height: '55px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', border: `1px solid ${d ? 'var(--primary)' : 'var(--glass-border)'}`, borderRadius: '12px', background: 'var(--glass-bg)' }} />
                ))}
              </div>

              <button onClick={handleVerify} className="btn btn-primary btn-full" disabled={loading || otp.some(d => !d)}>
                {loading ? 'جارِ التحقق...' : 'تأكيد الرمز والربط ✅'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                {countdown > 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>إعادة الإرسال بعد {countdown} ثانية</p>
                ) : (
                  <button onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>إعادة إرسال الرمز</button>
                )}
              </div>
              <button onClick={() => setStep(STEPS.INPUT)} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>تغيير الرقم</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPhone;
