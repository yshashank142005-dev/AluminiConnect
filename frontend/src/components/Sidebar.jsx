import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
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
      {/* Logo */}
      <div style={{ padding: '20px 12px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>🎓</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', lineHeight: 1.2 }}>AlumniConnect</div>
            <div style={{ fontSize: '10px', color: 'var(--accent-light)', fontWeight: 600 }}>AI Platform</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500,
              textDecoration: 'none', transition: 'var(--transition)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}
          >
            <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
        <NavLink
          to="/profile"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', transition: 'var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="avatar avatar-sm" style={{ fontSize: '12px' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-light)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginTop: '2px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}
