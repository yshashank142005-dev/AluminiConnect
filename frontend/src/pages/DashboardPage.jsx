import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { SITE_IMAGES } from '../constants/siteImages';

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
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="spinner" />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Loading dashboard...
          </motion.span>
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
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard icon="⭐" label="Engagement Score" value={user?.engagementScore || 0} color="var(--warning)" delay={0.05} />
        <StatCard icon="🔗" label="Connections" value={user?.connections?.length || 0} delay={0.1} />
        <StatCard icon="🏆" label="Badges Earned" value={user?.badges?.length || 0} color="var(--success)" delay={0.15} />
        <StatCard icon="📅" label="Events RSVPd" value={data.events.filter(e => e.attendees?.includes(user?._id)).length} color="var(--info)" delay={0.2} />
      </div>

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
              <div className="empty-state" style={{ padding: '24px' }}>
                <span>🔍</span><p style={{ fontSize: '13px' }}>Nothing yet — check back soon!</p>
              </div>
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
                <div className="empty-state" style={{ padding: '24px' }}>
                  <span>📅</span><p style={{ fontSize: '13px' }}>No upcoming events</p>
                </div>
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
