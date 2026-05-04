import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/alumni': 'Browse Alumni',
  '/mentorship': 'Mentorship',
  '/messages': 'Messages',
  '/jobs': 'Jobs & Referrals',
  '/events': 'Events',
  '/career-ai': 'Career AI',
  '/profile': 'My Profile',
};

const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
};

// Smart tip rotated each visit
const TIPS = [
  '💡 Tip: Complete your profile to get better mentor matches.',
  '🎯 Did you know? Alumni with referrals get 3× more responses.',
  '🚀 Try Career AI to get a personalized skill gap analysis.',
  '🤝 Connect with 2 more alumni to unlock the Networker badge!',
  '📅 3 events this month — RSVP early for a spot!',
];
const dailyTip = TIPS[new Date().getDate() % TIPS.length];

export default function Navbar() {
  const { user } = useAuth();
  const { onNotification, offNotification } = useSocket();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [unread, setUnread] = useState(0);

  const title = pageTitles[location.pathname] || 'AlumniConnect AI';
  const greeting = getTimeGreeting();

  useEffect(() => {
    api.get('/notifications?limit=8').then(res => {
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    }).catch(() => {});

    // Show tip briefly on load
    const t = setTimeout(() => setShowTip(true), 800);
    const t2 = setTimeout(() => setShowTip(false), 6000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const handler = (notif) => {
      setNotifications(prev => [{ ...notif, isRead: false, createdAt: new Date() }, ...prev.slice(0, 7)]);
      setUnread(prev => prev + 1);
    };
    onNotification(handler);
    return () => offNotification(handler);
  }, [onNotification, offNotification]);

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 'var(--sidebar-width)', right: 0,
      height: 'var(--navbar-h)',
      background: 'rgba(8,11,20,0.88)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 99,
    }}>
      {/* Left: Title + greeting */}
      <div>
        <motion.h1
          key={title}
          style={{ fontSize: '18px', fontWeight: 700 }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          {title}
        </motion.h1>
        <motion.p
          style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span>{greeting.emoji}</span>
          {greeting.text}, <strong style={{ color: 'var(--text-secondary)', marginLeft: '3px' }}>{user?.name?.split(' ')[0]}</strong>
        </motion.p>
      </div>

      {/* Smart tip toast (auto-dismiss) */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(13,17,32,0.97)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 'var(--radius)',
              padding: '8px 16px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(16px)',
              zIndex: 200,
            }}
          >
            {dailyTip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Streak chip */}
        <motion.div
          style={{
            padding: '5px 12px', borderRadius: '100px',
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
            fontSize: '12px', fontWeight: 700, color: '#f97316',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}
          whileHover={{ scale: 1.05 }}
          title="Your current login streak"
        >
          🔥 3 days
        </motion.div>

        {/* Engagement score */}
        <motion.div
          style={{
            padding: '6px 14px', borderRadius: '100px',
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
            fontSize: '13px', fontWeight: 600, color: 'var(--accent-light)',
          }}
          whileHover={{ scale: 1.03 }}
          title="Your engagement score"
        >
          ⭐ {user?.engagementScore || 0} pts
        </motion.div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <motion.button
            id="notif-bell"
            type="button"
            onClick={() => setShowNotifs(v => !v)}
            className="btn btn-ghost btn-icon"
            style={{ fontSize: '20px', position: 'relative' }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            🔔
            {unread > 0 && (
              <motion.span
                className="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                style={{ position: 'absolute', top: '-2px', right: '-2px', minWidth: '16px', height: '16px', fontSize: '9px' }}
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                key="notif-panel"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '340px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  zIndex: 200, overflow: 'hidden',
                }}
              >
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Notifications</span>
                  {unread > 0 && <button onClick={markAllRead} className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>Mark all read</button>}
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 24px' }}>
                      <span style={{ fontSize: '36px', marginBottom: '8px' }}>🎈</span>
                      <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>You're all caught up!</p>
                      <p style={{ fontSize: '12px' }}>We'll ping you when something exciting happens.</p>
                    </div>
                  ) : notifications.map((n, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: n.isRead ? 'transparent' : 'rgba(124,58,237,0.05)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(124,58,237,0.05)'}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{n.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{n.message}</div>
                      {!n.isRead && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', marginTop: '6px' }} />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar shortcut */}
        <Link to="/profile">
          <motion.div
            className="avatar avatar-sm"
            style={{ fontSize: '12px', cursor: 'pointer', boxShadow: '0 0 0 2px rgba(124,58,237,0.4)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="View profile"
          >
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </motion.div>
        </Link>
      </div>

      {/* Click outside to close */}
      {showNotifs && <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 150 }} />}
    </header>
  );
}
