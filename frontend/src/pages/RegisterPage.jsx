import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Data Science',
  'Electrical Engineering', 'Mathematics', 'Design', 'Business', 'Finance', 'Other',
];
const SKILLS_SUGGESTIONS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Machine Learning',
  'Java', 'AWS', 'Docker', 'Figma', 'Data Analysis', 'Product Management',
];

// Steps: 1 = basic info, 'otp' = email verify, 2 = profile details
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student',
    department: '', graduationYear: '', skills: [],
    careerInterests: [], company: '', currentRole: '', industry: '', location: '', goals: '',
  });

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const toggleSkill = (skill) => {
    setForm(p => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill],
    }));
  };

  // ── Cooldown timer for resend ──────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Step 1 → Send OTP ─────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.name || !form.email || !form.password) {
      return toast.error('Please fill all required fields');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setOtpLoading(true);
    try {
      await api.post('/auth/send-otp', { email: form.email });
      toast.success(`Verification code sent to ${form.email} 📧`);
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP input handling ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Verify OTP → Step 2 ───────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter the full 6-digit code');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: form.email, otp: code });
      toast.success('Email verified! ✅ Complete your profile');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpLoading(true);
    try {
      await api.post('/auth/send-otp', { email: form.email });
      toast.success('New code sent!');
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Final submit ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to AlumniConnect 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Progress bar: 1 = 33%, otp = 66%, 2 = 100% ───────────
  const progress = step === 1 ? 33 : step === 'otp' ? 66 : 100;

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="card auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-logo gradient-text">🎓 AlumniConnect AI</div>
        <p className="auth-subtitle">Create your account and start your journey.</p>

        {/* Step progress bar */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            {['Basic Info', 'Verify Email', 'Profile'].map((label, i) => {
              const stepVal = i === 0 ? 1 : i === 1 ? 'otp' : 2;
              const active = step === stepVal;
              const done = (i === 0 && (step === 'otp' || step === 2)) || (i === 1 && step === 2);
              return (
                <span key={label} style={{
                  fontSize: '11px', fontWeight: 600,
                  color: done ? 'var(--success)' : active ? 'var(--accent-light)' : 'var(--text-muted)',
                  transition: 'var(--transition)',
                }}>
                  {done ? '✓ ' : ''}{label}
                </span>
              );
            })}
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
              width: `${progress}%`,
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </div>

        {/* ── STEP 1: Basic Info ── */}
        {step === 1 && (
          <div className="flex-col gap-16 animate-fade">
            <div className="form-group">
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Your full name" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Email Address *</label>
              <input
                className="input" type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                📧 A verification code will be sent to this address
              </span>
            </div>
            <div className="form-group">
              <label className="label">Password *</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">I am a...</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['student', 'alumni'].map(role => (
                  <button key={role} type="button" onClick={() => update('role', role)} className="btn" style={{
                    background: form.role === role ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
                    border: `1px solid ${form.role === role ? 'var(--accent)' : 'var(--border)'}`,
                    color: form.role === role ? 'var(--accent-light)' : 'var(--text-secondary)',
                    justifyContent: 'center', textTransform: 'capitalize',
                  }}>
                    {role === 'student' ? '👨‍🎓' : '🎓'} {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Department</label>
                <select className="input" value={form.department} onChange={e => update('department', e.target.value)}>
                  <option value="">Select...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Graduation Year</label>
                <input className="input" type="number" placeholder="e.g. 2025" min="2000" max="2035" value={form.graduationYear} onChange={e => update('graduationYear', e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              className="btn btn-primary btn-full"
              disabled={otpLoading}
            >
              {otpLoading
                ? <><span className="spinner spinner-sm" /> Sending Code...</>
                : '📧 Send Verification Code →'}
            </button>
          </div>
        )}

        {/* ── STEP OTP: Email Verification ── */}
        {step === 'otp' && (
          <div className="flex-col gap-16 animate-fade">
            {/* Icon */}
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(124,58,237,0.15)',
                border: '2px solid rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', margin: '0 auto 16px',
              }}>📧</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: 'var(--accent-light)' }}>{form.email}</strong>
              </p>
            </div>

            {/* OTP boxes */}
            <div>
              <label className="label" style={{ marginBottom: '12px', display: 'block', textAlign: 'center' }}>
                Enter Verification Code
              </label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: '52px', height: '60px',
                      textAlign: 'center', fontSize: '24px', fontWeight: '800',
                      background: digit ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'var(--transition)',
                      fontFamily: 'inherit',
                      caretColor: 'var(--accent)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-light)'}
                    onBlur={e => e.target.style.borderColor = digit ? 'var(--accent)' : 'var(--border)'}
                  />
                ))}
              </div>
            </div>

            {/* Expires note */}
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              ⏱ Code expires in 5 minutes
            </p>

            {/* Verify button */}
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="btn btn-primary btn-full"
              disabled={loading || otp.join('').length < 6}
            >
              {loading ? <><span className="spinner spinner-sm" /> Verifying...</> : '✅ Verify Email'}
            </button>

            {/* Resend + back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-ghost" style={{ fontSize: '13px' }}>
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || otpLoading}
                className="btn btn-ghost"
                style={{ fontSize: '13px', color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-light)' }}
              >
                {otpLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Profile Details ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <div className="flex-col gap-16 animate-fade">
              <div className="form-group">
                <label className="label">Skills (click to select)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {SKILLS_SUGGESTIONS.map(skill => (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)} className="tag" style={{
                      cursor: 'pointer',
                      background: form.skills.includes(skill) ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.08)',
                      border: form.skills.includes(skill) ? '1px solid var(--accent)' : '1px solid rgba(124,58,237,0.15)',
                    }}>
                      {form.skills.includes(skill) ? '✓ ' : ''}{skill}
                    </button>
                  ))}
                </div>
              </div>
              {form.role === 'alumni' && (
                <>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="label">Company</label>
                      <input className="input" placeholder="e.g. Google" value={form.company} onChange={e => update('company', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="label">Current Role</label>
                      <input className="input" placeholder="e.g. SWE" value={form.currentRole} onChange={e => update('currentRole', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="label">Industry</label>
                      <input className="input" placeholder="e.g. Technology" value={form.industry} onChange={e => update('industry', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="label">Location</label>
                      <input className="input" placeholder="e.g. San Francisco" value={form.location} onChange={e => update('location', e.target.value)} />
                    </div>
                  </div>
                </>
              )}
              {form.role === 'student' && (
                <div className="form-group">
                  <label className="label">Career Goals</label>
                  <textarea className="input" placeholder="What are your career goals? e.g. Get a SWE role at a top tech company..." value={form.goals} onChange={e => update('goals', e.target.value)} style={{ minHeight: '80px' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setStep('otp')} className="btn btn-secondary">← Back</button>
                <button id="register-submit" type="submit" className="btn btn-primary flex-1" disabled={loading}>
                  {loading ? <><span className="spinner spinner-sm" /> Creating...</> : '🚀 Create Account'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
