import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
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

export default function Navbar() {
  const { user } = useAuth();
  const { onNotification, offNotification } = useSocket();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unread, setUnread] = useState(0);

  const title = pageTitles[location.pathname] || 'AlumniConnect AI';

  useEffect(() => {
    api.get('/notifications?limit=8').then(res => {
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    }).catch(() => {});
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
      background: 'rgba(8,11,20,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 99,
    }}>
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            id="notif-bell"
            onClick={() => setShowNotifs(v => !v)}
            className="btn btn-ghost btn-icon"
            style={{ fontSize: '20px', position: 'relative' }}
          >
            🔔
            {unread > 0 && (
              <span className="badge" style={{
                position: 'absolute', top: '-2px', right: '-2px',
                minWidth: '16px', height: '16px', fontSize: '9px',
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '340px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              zIndex: 200, overflow: 'hidden',
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Notifications</span>
                {unread > 0 && <button onClick={markAllRead} className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <div>🔔</div>
                    <p>No notifications yet</p>
                  </div>
                ) : notifications.map((n, i) => (
                  <div key={i} style={{
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Engagement Score */}
        <div style={{
          padding: '6px 14px', borderRadius: '100px',
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
          fontSize: '13px', fontWeight: 600, color: 'var(--accent-light)',
        }}>
          ⭐ {user?.engagementScore || 0} pts
        </div>
      </div>

      {/* Click outside to close */}
      {showNotifs && <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 150 }} />}
    </header>
  );
}
