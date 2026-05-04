import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { to: '/alumni', icon: '🎓', label: 'Alumni' },
  { to: '/mentorship', icon: '🤝', label: 'Mentorship' },
  { to: '/messages', icon: '💬', label: 'Messages' },
  { to: '/jobs', icon: '💼', label: 'Jobs & Referrals' },
  { to: '/events', icon: '📅', label: 'Events' },
  { to: '/career-ai', icon: '🤖', label: 'Career AI' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'rgba(13,17,32,0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, padding: '0 12px',
    }}>
      <motion.div
        style={{ padding: '20px 12px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.div
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0,
            }}
            whileHover={{ scale: 1.08, rotate: [0, -4, 4, 0] }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            🎓
          </motion.div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', lineHeight: 1.2 }}>AlumniConnect</div>
            <div style={{ fontSize: '10px', color: 'var(--accent-light)', fontWeight: 600 }}>AI Platform</div>
          </div>
        </div>
      </motion.div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map(({ to, icon, label }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i, type: 'spring', stiffness: 380, damping: 28 }}
          >
            <NavLink
              to={to}
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'sidebar-nav-link--active' : ''}`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
              })}
            >
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
        <NavLink
          to="/profile"
          className="sidebar-nav-link"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <motion.div className="avatar avatar-sm" style={{ fontSize: '12px' }} whileHover={{ scale: 1.08 }}>{initials}</motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-light)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </NavLink>
        <motion.button
          type="button"
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', marginTop: '2px', fontSize: '13px', color: 'var(--text-muted)' }}
          whileHover={{ x: 2, color: 'var(--text-secondary)' }}
          whileTap={{ scale: 0.98 }}
        >
          <span>🚪</span> Sign out
        </motion.button>
      </div>
    </aside>
  );
}
