import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { SITE_IMAGES } from '../constants/siteImages';
import DailyCoachWidget from '../components/DailyCoachWidget';
import DigitalTwinPanel from '../components/DigitalTwinPanel';

const listParent = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const listChild = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

const StatCard = ({ icon, label, value, color = 'var(--accent-light)', delay = 0 }) => (
  <motion.div
    className="card stat-card stat-card-interactive"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 320, damping: 24 }}
    whileHover={{ y: -4 }}
  >
    <motion.div className="stat-icon" whileHover={{ scale: 1.15, rotate: [0, -6, 6, 0] }} transition={{ duration: 0.45 }}>
      {icon}
    </motion.div>
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ alumni: [], jobs: [], events: [], matches: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [alumniRes, jobsRes, eventsRes, matchRes] = await Promise.allSettled([
          api.get('/alumni?limit=4'),
          api.get('/jobs?limit=4'),
          api.get('/events?upcoming=true&limit=3'),
          user?.role === 'student' ? api.get('/alumni/matches') : Promise.resolve({ data: { matches: [] } }),
        ]);
        setData({
          alumni: alumniRes.value?.data?.alumni || [],
          jobs: jobsRes.value?.data?.jobs || [],
          events: eventsRes.value?.data?.events || [],
          matches: matchRes.value?.data?.matches || [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  if (loading) {
    return (
      <div className="page">
        <div className="dashboard-hero skeleton-shimmer" style={{ minHeight: '200px', marginBottom: '28px', border: 'none' }} />
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="card stat-card skeleton-shimmer" style={{ height: '130px', border: 'none' }} />)}
        </div>
        <div className="dashboard-two-col">
          <div className="card card-p skeleton-shimmer" style={{ height: '300px', border: 'none' }} />
          <div className="flex-col gap-16">
            <div className="card card-p skeleton-shimmer" style={{ height: '180px', border: 'none' }} />
            <div className="card card-p skeleton-shimmer" style={{ height: '100px', border: 'none' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <motion.div
        className="dashboard-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="dashboard-hero-bg" aria-hidden>
          <img src={SITE_IMAGES.dashboardHero} alt="" loading="lazy" decoding="async" />
        </div>
        <div className="dashboard-hero-scrim" />
        <div className="dashboard-hero-inner">
          <div className="flex items-center gap-16" style={{ flexWrap: 'wrap' }}>
            <motion.div 
              className="avatar avatar-xl" 
              style={{ border: '4px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              {user?.name?.[0] || 'U'}
            </motion.div>
            <div>
              <h1 className="page-title" style={{ marginBottom: '8px' }}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                <span className="gradient-text">{user?.name?.split(' ')[0]}!</span>
              </h1>
              <p style={{ color: 'rgba(241,245,249,0.85)', fontSize: '15px', maxWidth: '520px' }}>
                {user?.role === 'student'
                  ? 'Your career journey starts here. Connect, learn, and grow.'
                  : 'Make an impact. Share your experience with the next generation.'}
              </p>
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '150px', maxWidth: '200px' }}>
                  <div className="progress-bar" style={{ height: '5px', background: 'rgba(255,255,255,0.15)' }}>
                    <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1.2, delay: 0.3 }} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.5px' }}>85% Profile Strength</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            {user?.role === 'student' && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link to="/career-ai" className="btn btn-primary">Career AI</Link>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link to={user?.role === 'student' ? '/alumni' : '/jobs'} className="btn btn-secondary">
                {user?.role === 'student' ? 'Browse Alumni' : 'Post a Job'}
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <StatCard icon="🔥" label="Day Streak" value="3" color="#f97316" delay={0.05} />
        <StatCard icon="⭐" label="Engagement" value={user?.engagementScore || 0} color="var(--warning)" delay={0.1} />
        <StatCard icon="🏆" label="Badges" value={user?.badges?.length || 0} color="var(--success)" delay={0.15} />
        <StatCard icon="🔗" label="Connections" value={user?.connections?.length || 0} color="var(--info)" delay={0.2} />
      </div>

      {/* ── AI Daily Coach ── */}
      <DailyCoachWidget />

      {/* ── Digital Twin ── */}
      <DigitalTwinPanel />

      <div className="dashboard-two-col">
        <motion.div className="card card-p" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <h2 className="section-title">
              {user?.role === 'student' ? 'Top Mentor Matches' : 'Recent Job Posts'}
            </h2>
            <Link to={user?.role === 'student' ? '/alumni' : '/jobs'} className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <motion.div className="flex-col gap-12" variants={listParent} initial="hidden" animate="show">
            {(user?.role === 'student' ? data.matches.slice(0, 4) : data.jobs.slice(0, 4)).map((item, i) => {
              const isMatch = user?.role === 'student';
              const person = isMatch ? item.alumni : item;
              return (
                <motion.div key={i} className="interactive-row" variants={listChild} layout>
                  <div className="avatar avatar-md" style={{ fontSize: '16px' }}>
                    {(isMatch ? person?.name : item.company || '?')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isMatch ? person?.name : item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {isMatch ? `${person?.currentRole} @ ${person?.company}` : `${item.company} · ${item.jobType}`}
                    </div>
                  </div>
                  {isMatch && <div className="match-score">{item.score}%</div>}
                  {!isMatch && item.offersReferral && <span className="tag tag-green" style={{ fontSize: '11px' }}>Referral</span>}
                </motion.div>
              );
            })}
            {(user?.role === 'student' ? data.matches : data.jobs).length === 0 && (
              <motion.div className="empty-state" style={{ padding: '32px 24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span style={{ fontSize: '40px', marginBottom: '8px' }}>📭</span>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>All caught up!</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Check back later for fresh updates.</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        <div className="flex-col gap-16">
          <motion.div className="card card-p" style={{ flex: 1 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h2 className="section-title">Upcoming Events</h2>
              <Link to="/events" className="btn btn-ghost btn-sm">View all →</Link>
            </div>
            <motion.div className="flex-col gap-12" variants={listParent} initial="hidden" animate="show">
              {data.events.slice(0, 3).map((event, i) => (
                <motion.div key={i} className="event-card-visual" variants={listChild}>
                  <div className="event-card-visual-thumb">
                    <img src={SITE_IMAGES.eventFallback} alt="" loading="lazy" decoding="async" />
                  </div>
                  <div className="event-card-visual-body">
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{event.title}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{event.location}</span>
                    </div>
                    <span className="tag" style={{ marginTop: '8px', fontSize: '11px' }}>{event.eventType}</span>
                  </div>
                </motion.div>
              ))}
              {data.events.length === 0 && (
                <motion.div className="empty-state" style={{ padding: '32px 24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span style={{ fontSize: '40px', marginBottom: '8px' }}>🌱</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>It's quiet here...</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No events scheduled right now.</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          <motion.div className="card card-p" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { icon: '🤖', label: 'Career AI', to: '/career-ai' },
                { icon: '🤝', label: 'Mentorship', to: '/mentorship' },
                { icon: '💬', label: 'Messages', to: '/messages' },
                { icon: '👤', label: 'My Profile', to: '/profile' },
              ].map(({ icon, label, to }) => (
                <Link key={to} to={to} className="quick-tile">
                  <span className="quick-tile-icon">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
