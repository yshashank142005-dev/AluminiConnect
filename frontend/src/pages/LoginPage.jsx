import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, pass) => {
    setForm({ email, password: pass });
    setLoading(true);
    try {
      await login(email, pass);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch {
      toast.error('Login failed — run npm run seed first');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-logo gradient-text">🎓 AlumniConnect AI</div>
        <p className="auth-subtitle">Where students meet mentors and opportunities meet talent.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input id="login-email" name="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input id="login-password" name="password" type="password" className="input" placeholder="••••••••" value={form.password} onChange={handleChange} autoComplete="current-password" />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm" /> Signing in...</> : '→  Sign In'}
          </button>
        </form>

        {/* Quick Login Demo Buttons */}
        <div className="divider" />
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }}>Quick Demo Login</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: '👨‍🎓 Student', email: 'arjun@student.com', pass: 'password123' },
            { label: '🎓 Alumni', email: 'priya@alumni.com', pass: 'password123' },
            { label: '🛡️ Admin', email: 'admin@alumniconnect.com', pass: 'admin123' },
          ].map(({ label, email, pass }) => (
            <button key={label} onClick={() => quickLogin(email, pass)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
              {label}
            </button>
          ))}
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one free →</Link>
        </div>
      </div>
    </div>
  );
}
