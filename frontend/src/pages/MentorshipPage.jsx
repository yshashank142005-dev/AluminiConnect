import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:   'var(--warning)',
  accepted:  'var(--success)',
  declined:  'var(--danger)',
  completed: 'var(--info)',
  cancelled: 'var(--text-muted)',
};

const STATUS_ICONS = {
  pending: '⏳', accepted: '✅', declined: '❌', completed: '🏁', cancelled: '🚫',
};

/* ── Skeleton card ── */
const SkeletonMentorCard = () => (
  <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton-shimmer" style={{ height: '16px', width: '50%', borderRadius: '6px' }} />
          <div className="skeleton-shimmer" style={{ height: '22px', width: '80px', borderRadius: '100px' }} />
        </div>
        <div className="skeleton-shimmer" style={{ height: '12px', width: '65%', borderRadius: '6px' }} />
      </div>
    </div>
    <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: '8px' }} />
    <div style={{ display: 'flex', gap: '8px' }}>
      <div className="skeleton-shimmer" style={{ height: '32px', width: '90px', borderRadius: '8px' }} />
      <div className="skeleton-shimmer" style={{ height: '32px', width: '80px', borderRadius: '8px' }} />
    </div>
  </div>
);

/* ── Request Card ── */
const RequestCard = ({ req, currentUser, onRespond, onSchedule, onFeedback, onCancel, index = 0 }) => {
  const isAlumni = currentUser.role === 'alumni';
  const other = isAlumni ? req.student : req.alumni;
  const initials = other?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const [schedForm, setSchedForm] = useState({ date: '', time: '', link: '' });
  const [showSched, setShowSched] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <motion.div
      className="card card-p mentorship-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 340, damping: 28 }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Status stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: STATUS_COLORS[req.status] || 'var(--border)',
      }} />

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px', paddingTop: '6px' }}>
        <motion.div
          className="avatar avatar-md"
          style={{ fontSize: '16px' }}
          whileHover={{ scale: 1.1 }}
        >
          {initials}
        </motion.div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{other?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isAlumni ? `${other?.department}` : `${other?.currentRole} @ ${other?.company}`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {req.matchScore > 0 && (
                <div className="match-score" style={{ width: '36px', height: '36px', fontSize: '11px' }}>
                  {req.matchScore}%
                </div>
              )}
              <motion.span
                style={{
                  fontSize: '12px', fontWeight: 600,
                  color: STATUS_COLORS[req.status] || 'var(--text-muted)',
                  textTransform: 'capitalize', padding: '4px 10px',
                  borderRadius: '100px',
                  background: `${STATUS_COLORS[req.status]}18`,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
              >
                {STATUS_ICONS[req.status]} {req.status}
              </motion.span>
            </div>
          </div>
        </div>
      </div>

      {/* Message quote */}
      <div style={{
        background: 'rgba(255,255,255,0.025)', borderRadius: 'var(--radius)',
        padding: '12px', marginBottom: '14px', fontSize: '13px',
        color: 'var(--text-secondary)', lineHeight: 1.6,
        borderLeft: '3px solid var(--accent)',
      }}>
        "{req.message}"
      </div>

      {req.goals && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          🎯 Goal: {req.goals}
        </p>
      )}

      {/* Scheduled session info */}
      {req.scheduledDate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            fontSize: '13px', color: 'var(--info)', marginBottom: '14px',
            display: 'flex', gap: '8px', flexWrap: 'wrap',
            padding: '10px 12px', borderRadius: 'var(--radius)',
            background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)',
          }}
        >
          <span>📅 {new Date(req.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          {req.scheduledTime && <span>⏰ {req.scheduledTime}</span>}
          {req.meetingLink && (
            <a href={req.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
              🔗 Join Meeting
            </a>
          )}
        </motion.div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {isAlumni && req.status === 'pending' && (
          <>
            <motion.button onClick={() => onRespond(req._id, 'accepted')} className="btn btn-primary btn-sm" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>✅ Accept</motion.button>
            <motion.button onClick={() => onRespond(req._id, 'declined')} className="btn btn-danger btn-sm" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>❌ Decline</motion.button>
          </>
        )}
        {req.status === 'accepted' && !req.scheduledDate && (
          <motion.button onClick={() => setShowSched(v => !v)} className="btn btn-secondary btn-sm" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>📅 Schedule Session</motion.button>
        )}
        {!isAlumni && req.status === 'accepted' && !req.feedback && (
          <motion.button onClick={() => setShowFeedback(v => !v)} className="btn btn-secondary btn-sm" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>⭐ Leave Feedback</motion.button>
        )}
        {['pending', 'accepted'].includes(req.status) && (
          <motion.button onClick={() => onCancel(req._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
        )}
      </div>

      {/* Schedule sub-form */}
      <AnimatePresence>
        {showSched && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.025)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}
          >
            <div className="grid-2" style={{ gap: '10px' }}>
              <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={schedForm.date} onChange={e => setSchedForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="form-group"><label className="label">Time</label><input type="time" className="input" value={schedForm.time} onChange={e => setSchedForm(p => ({ ...p, time: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label className="label">Meeting Link</label><input className="input" placeholder="https://meet.google.com/..." value={schedForm.link} onChange={e => setSchedForm(p => ({ ...p, link: e.target.value }))} /></div>
            <motion.button onClick={() => { onSchedule(req._id, schedForm); setShowSched(false); }} className="btn btn-primary btn-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
              Confirm Schedule
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback sub-form */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.025)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}
          >
            <div>
              <label className="label">Rating</label>
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <motion.button
                    key={s}
                    onClick={() => setRating(s)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', opacity: s <= rating ? 1 : 0.25, transition: 'opacity 0.15s ease' }}
                  >
                    ⭐
                  </motion.button>
                ))}
                <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-secondary)', alignSelf: 'center' }}>{rating}/5</span>
              </div>
            </div>
            <div className="form-group"><label className="label">Comment</label><textarea className="input" placeholder="How was your session?" value={comment} onChange={e => setComment(e.target.value)} style={{ minHeight: '70px' }} /></div>
            <motion.button onClick={() => { onFeedback(req._id, rating, comment); setShowFeedback(false); }} className="btn btn-primary btn-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
              Submit Feedback
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Page ── */
export default function MentorshipPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      console.log(`📡 Fetching mentorship requests with params:`, params);
      const res = await api.get(`/mentorship/requests${params}`);
      console.log(`✅ Response received:`, res.data.requests);
      setRequests(res.data.requests);
    } catch (err) {
      console.error(`❌ Error fetching requests:`, err.message, err.response?.data);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { 
    console.log(`🔄 Filter changed to: ${filter}`);
    fetchRequests(); 
  }, [filter, fetchRequests]);

  const handleRespond = async (id, status) => {
    try {
      await api.put(`/mentorship/request/${id}/respond`, { status });
      toast.success(status === 'accepted' ? '🎉 Request accepted!' : 'Request declined');
      fetchRequests();
      fetchAllRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const handleSchedule = async (id, { date, time, link }) => {
    try {
      await api.put(`/mentorship/request/${id}/schedule`, { scheduledDate: date, scheduledTime: time, meetingLink: link });
      toast.success('Session scheduled! 📅');
      fetchRequests();
      fetchAllRequests();
    } catch { toast.error('Failed to schedule'); }
  };

  const handleFeedback = async (id, rating, comment) => {
    try {
      await api.post(`/mentorship/request/${id}/feedback`, { rating, comment });
      toast.success('Feedback submitted! ⭐');
      fetchRequests();
      fetchAllRequests();
    } catch { toast.error('Failed to submit feedback'); }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/mentorship/request/${id}/cancel`);
      toast.success('Request cancelled');
      fetchRequests();
      fetchAllRequests();
    } catch { toast.error('Failed to cancel'); }
  };

  const statuses = ['all', 'pending', 'accepted', 'completed', 'declined'];

  // Counts per status for badges (use full list regardless of filter)
  const [allRequests, setAllRequests] = useState([]);
  
  const fetchAllRequests = useCallback(() => {
    api.get('/mentorship/requests').then(r => setAllRequests(r.data.requests || [])).catch(() => {});
  }, []);
  
  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  const countFor = (s) => s === 'all' ? allRequests.length : allRequests.filter(r => r.status === s).length;

  const pendingCount = allRequests.filter(r => r.status === 'pending').length;

  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '6px' }}>🤝 Mentorship</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {user?.role === 'student'
                ? 'Track your mentorship requests and scheduled sessions.'
                : 'Manage incoming mentorship requests from students.'}
            </p>
          </div>
          {/* Nudge banner for alumni with pending requests */}
          {user?.role === 'alumni' && pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius)',
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                fontSize: '13px', fontWeight: 600, color: 'var(--warning)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              ⚡ {pendingCount} student{pendingCount > 1 ? 's' : ''} waiting for your response
            </motion.div>
          )}
          {/* CTA for students with no requests */}
          {user?.role === 'student' && allRequests.length === 0 && !loading && (
            <Link to="/alumni" className="btn btn-primary">Browse Mentors →</Link>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <motion.div
        style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {statuses.map(s => {
          const count = countFor(s);
          return (
            <motion.button
              key={s}
              onClick={() => setFilter(s)}
              className="btn btn-sm"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: filter === s ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
                color: filter === s ? 'var(--accent-light)' : 'var(--text-secondary)',
                border: `1px solid ${filter === s ? 'var(--accent)' : 'var(--border)'}`,
                textTransform: 'capitalize',
                gap: '6px',
              }}
            >
              {STATUS_ICONS[s] || '🌐'} {s}
              {count > 0 && (
                <span className="badge" style={{ background: filter === s ? 'var(--accent)' : 'var(--text-muted)', marginLeft: '2px' }}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid-2">
          {[...Array(4)].map((_, i) => <SkeletonMentorCard key={i} />)}
        </div>
      ) : requests.length === 0 ? (
        <>
          {console.log(`📭 No requests to display. Filter: ${filter}, Requests length: ${requests.length}`)}
          <motion.div
          className="empty-state card card-p"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{ padding: '64px 24px' }}
        >
          <motion.span
            style={{ fontSize: '56px', marginBottom: '12px', display: 'block' }}
            animate={{ rotate: [0, 10, -10, 5, -5, 0] }}
            transition={{ duration: 1.5, delay: 0.3 }}
          >🤝</motion.span>
          <h3>
            {filter !== 'all'
              ? `No ${filter} requests`
              : user?.role === 'student'
              ? 'No mentorship requests yet'
              : 'No requests from students yet'}
          </h3>
          <p style={{ maxWidth: '360px', marginTop: '8px', fontSize: '14px' }}>
            {filter !== 'all'
              ? `You have no ${filter} mentorship sessions. Try another filter.`
              : user?.role === 'student'
              ? 'Find an alumni who matches your goals and send your first request!'
              : "Students are finding their way to you. Make sure your profile shows you're available for mentorship."}
          </p>
          {user?.role === 'student' && (
            <Link to="/alumni" className="btn btn-primary" style={{ marginTop: '20px' }}>
              🎓 Browse Alumni
            </Link>
          )}
          </motion.div>
        </>
      ) : (
        <>
          {console.log(`✅ Displaying ${requests.length} requests for filter: ${filter}`)}
          <div className="grid-2">
          {requests.map((req, i) => (
            <RequestCard
              key={req._id}
              req={req}
              index={i}
              currentUser={user}
              onRespond={handleRespond}
              onSchedule={handleSchedule}
              onFeedback={handleFeedback}
              onCancel={handleCancel}
            />
          ))}
        </div>
        </>
      )}
    </motion.div>
  );
}
