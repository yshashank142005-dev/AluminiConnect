import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { SITE_IMAGES } from '../constants/siteImages';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

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
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(
        msg ||
          (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
            ? 'Cannot reach server. Is the backend running on port 5000?'
            : 'Login failed. From the backend folder run: npm run seed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-split"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-visual">
          <img src={SITE_IMAGES.authCampus} alt="" loading="eager" decoding="async" />
          <div className="auth-visual-overlay">
            <motion.p
              className="auth-visual-quote"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
            >
              Connect with alumni who have walked your path — and mentors who light the next one.
            </motion.p>
            <motion.span
              className="auth-visual-meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              AlumniConnect AI · Community & career growth
            </motion.span>
          </div>
        </div>

        <div className="auth-panel">
          <motion.div className="auth-card auth-card--flush" variants={container} initial="hidden" animate="show">
            <motion.div className="auth-logo gradient-text" variants={item}>
              🎓 AlumniConnect AI
            </motion.div>
            <motion.p className="auth-subtitle" variants={item}>
              Where students meet mentors and opportunities meet talent.
            </motion.p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <motion.div className="form-group" variants={item}>
                <label className="label" htmlFor="login-email">Email Address</label>
                <input id="login-email" name="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
              </motion.div>
              <motion.div className="form-group" variants={item}>
                <label className="label" htmlFor="login-password">Password</label>
                <input id="login-password" name="password" type="password" className="input" placeholder="••••••••" value={form.password} onChange={handleChange} autoComplete="current-password" />
              </motion.div>
              <motion.div variants={item} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner spinner-sm" /> Signing in...</> : '→  Sign In'}
                </button>
              </motion.div>
            </form>

            <motion.div className="divider" variants={item} />
            <motion.p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }} variants={item}>
              Quick Demo Login
            </motion.p>
            <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }} variants={item}>
              {[
                { label: 'Student', email: 'arjun@student.com', pass: 'password123' },
                { label: 'Alumni', email: 'priya@alumni.com', pass: 'password123' },
                { label: 'Admin', email: 'admin@alumniconnect.com', pass: 'admin123' },
              ].map(({ label, email, pass }, i) => (
                <motion.button
                  key={label}
                  type="button"
                  onClick={() => quickLogin(email, pass)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', justifyContent: 'center' }}
                  whileHover={{ y: -2, borderColor: 'rgba(139,92,246,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {label}
                </motion.button>
              ))}
            </motion.div>

            <motion.div className="auth-footer" variants={item}>
              Don&apos;t have an account? <Link to="/register">Create one free →</Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
