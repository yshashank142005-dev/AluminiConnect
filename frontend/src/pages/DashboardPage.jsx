import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const StatCard = ({ icon, label, value, color = 'var(--accent-light)' }) => (
  <div className="card stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
  </div>
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

  if (loading) return (
    <div className="page">
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" /><span>Loading dashboard...</span>
      </div>
    </div>
  );

  return (
    <div className="page animate-fade">
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0]}!</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              {user?.role === 'student'
                ? 'Your career journey starts here. Connect, learn, and grow.'
                : 'Make an impact. Share your experience with the next generation.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {user?.role === 'student' && (
              <Link to="/career-ai" className="btn btn-primary">🤖 Generate Career Path</Link>
            )}
            <Link to={user?.role === 'student' ? '/alumni' : '/jobs'} className="btn btn-secondary">
              {user?.role === 'student' ? '🎓 Browse Alumni' : '💼 Post a Job'}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard icon="⭐" label="Engagement Score" value={user?.engagementScore || 0} color="var(--warning)" />
        <StatCard icon="🔗" label="Connections" value={user?.connections?.length || 0} />
        <StatCard icon="🏆" label="Badges Earned" value={user?.badges?.length || 0} color="var(--success)" />
        <StatCard icon="📅" label="Events RSVPd" value={data.events.filter(e => e.attendees?.includes(user?._id)).length} color="var(--info)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* AI Matches (students) / Recent Jobs (alumni) */}
        <div className="card card-p">
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <h2 className="section-title">
              {user?.role === 'student' ? '🎯 Top Mentor Matches' : '💼 Recent Job Posts'}
            </h2>
            <Link to={user?.role === 'student' ? '/alumni' : '/jobs'} className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div className="flex-col gap-12">
            {(user?.role === 'student' ? data.matches.slice(0, 4) : data.jobs.slice(0, 4)).map((item, i) => {
              const isMatch = user?.role === 'student';
              const person = isMatch ? item.alumni : item;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
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
                </div>
              );
            })}
            {(user?.role === 'student' ? data.matches : data.jobs).length === 0 && (
              <div className="empty-state" style={{ padding: '24px' }}>
                <span>🔍</span><p style={{ fontSize: '13px' }}>Nothing yet — check back soon!</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="flex-col gap-16">
          <div className="card card-p" style={{ flex: 1 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h2 className="section-title">📅 Upcoming Events</h2>
              <Link to="/events" className="btn btn-ghost btn-sm">View all →</Link>
            </div>
            <div className="flex-col gap-12">
              {data.events.slice(0, 3).map((event, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{event.title}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      📆 {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📍 {event.location}</span>
                  </div>
                  <span className="tag" style={{ marginTop: '8px', fontSize: '11px' }}>{event.eventType}</span>
                </div>
              ))}
              {data.events.length === 0 && (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <span>📅</span><p style={{ fontSize: '13px' }}>No upcoming events</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card card-p">
            <h2 className="section-title" style={{ marginBottom: '16px' }}>⚡ Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { icon: '🤖', label: 'Career AI', to: '/career-ai' },
                { icon: '🤝', label: 'Mentorship', to: '/mentorship' },
                { icon: '💬', label: 'Messages', to: '/messages' },
                { icon: '👤', label: 'My Profile', to: '/profile' },
              ].map(({ icon, label, to }) => (
                <Link key={to} to={to} className="btn btn-secondary" style={{ justifyContent: 'center', flexDirection: 'column', padding: '14px', gap: '6px', fontSize: '13px' }}>
                  <span style={{ fontSize: '22px' }}>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
