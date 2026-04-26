import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'var(--warning)',
  accepted: 'var(--success)',
  declined: 'var(--danger)',
  completed: 'var(--info)',
  cancelled: 'var(--text-muted)',
};

const RequestCard = ({ req, currentUser, onRespond, onSchedule, onFeedback, onCancel }) => {
  const isAlumni = currentUser.role === 'alumni';
  const other = isAlumni ? req.student : req.alumni;
  const initials = other?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const [schedForm, setSchedForm] = useState({ date: '', time: '', link: '' });
  const [showSched, setShowSched] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <div className="card card-p animate-fade">
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div className="avatar avatar-md" style={{ fontSize: '16px' }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{other?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isAlumni ? `${other?.department}` : `${other?.currentRole} @ ${other?.company}`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="match-score" style={{ width: '36px', height: '36px', fontSize: '11px' }}>{req.matchScore}%</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: STATUS_COLORS[req.status] || 'var(--text-muted)', textTransform: 'capitalize', padding: '4px 10px', borderRadius: '100px', background: `${STATUS_COLORS[req.status]}15` }}>
                {req.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '14px', fontSize: '13px', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent)' }}>
        "{req.message}"
      </div>

      {req.goals && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>🎯 Goal: {req.goals}</p>}

      {req.scheduledDate && (
        <div style={{ fontSize: '13px', color: 'var(--info)', marginBottom: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span>📅 {new Date(req.scheduledDate).toLocaleDateString()}</span>
          {req.scheduledTime && <span>⏰ {req.scheduledTime}</span>}
          {req.meetingLink && <a href={req.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-light)' }}>🔗 Join Meeting</a>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {isAlumni && req.status === 'pending' && (
          <>
            <button onClick={() => onRespond(req._id, 'accepted')} className="btn btn-primary btn-sm">✅ Accept</button>
            <button onClick={() => onRespond(req._id, 'declined')} className="btn btn-danger btn-sm">❌ Decline</button>
          </>
        )}
        {req.status === 'accepted' && !req.scheduledDate && (
          <button onClick={() => setShowSched(v => !v)} className="btn btn-secondary btn-sm">📅 Schedule Session</button>
        )}
        {!isAlumni && req.status === 'accepted' && !req.feedback && (
          <button onClick={() => setShowFeedback(v => !v)} className="btn btn-secondary btn-sm">⭐ Leave Feedback</button>
        )}
        {['pending', 'accepted'].includes(req.status) && (
          <button onClick={() => onCancel(req._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}>Cancel</button>
        )}
      </div>

      {showSched && (
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="grid-2" style={{ gap: '10px' }}>
            <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={schedForm.date} onChange={e => setSchedForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div className="form-group"><label className="label">Time</label><input type="time" className="input" value={schedForm.time} onChange={e => setSchedForm(p => ({ ...p, time: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="label">Meeting Link</label><input className="input" placeholder="https://meet.google.com/..." value={schedForm.link} onChange={e => setSchedForm(p => ({ ...p, link: e.target.value }))} /></div>
          <button onClick={() => { onSchedule(req._id, schedForm); setShowSched(false); }} className="btn btn-primary btn-sm">Confirm Schedule</button>
        </div>
      )}

      {showFeedback && (
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label className="label">Rating</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: '22px', background: 'none', border: 'none', cursor: 'pointer', opacity: s <= rating ? 1 : 0.3 }}>⭐</button>
              ))}
            </div>
          </div>
          <div className="form-group"><label className="label">Comment</label><textarea className="input" placeholder="How was your session?" value={comment} onChange={e => setComment(e.target.value)} style={{ minHeight: '70px' }} /></div>
          <button onClick={() => { onFeedback(req._id, rating, comment); setShowFeedback(false); }} className="btn btn-primary btn-sm">Submit Feedback</button>
        </div>
      )}
    </div>
  );
};

export default function MentorshipPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/mentorship/requests${params}`);
      setRequests(res.data.requests);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleRespond = async (id, status) => {
    try {
      await api.put(`/mentorship/request/${id}/respond`, { status });
      toast.success(status === 'accepted' ? '🎉 Request accepted!' : 'Request declined');
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const handleSchedule = async (id, { date, time, link }) => {
    try {
      await api.put(`/mentorship/request/${id}/schedule`, { scheduledDate: date, scheduledTime: time, meetingLink: link });
      toast.success('Session scheduled! 📅');
      fetchRequests();
    } catch { toast.error('Failed to schedule'); }
  };

  const handleFeedback = async (id, rating, comment) => {
    try {
      await api.post(`/mentorship/request/${id}/feedback`, { rating, comment });
      toast.success('Feedback submitted! ⭐');
      fetchRequests();
    } catch { toast.error('Failed to submit feedback'); }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/mentorship/request/${id}/cancel`);
      toast.success('Request cancelled');
      fetchRequests();
    } catch { toast.error('Failed to cancel'); }
  };

  const statuses = ['all', 'pending', 'accepted', 'completed', 'declined'];

  return (
    <div className="page animate-fade">
      <div className="page-hero">
        <h1 className="page-title" style={{ marginBottom: '6px' }}>🤝 Mentorship</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {user?.role === 'student' ? 'Track your mentorship requests and scheduled sessions.' : 'Manage incoming mentorship requests from students.'}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {statuses.map(s => {
          const count = s === 'all' ? requests.length : requests.filter(r => r.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)} className="btn btn-sm" style={{
              background: filter === s ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
              color: filter === s ? 'var(--accent-light)' : 'var(--text-secondary)',
              border: `1px solid ${filter === s ? 'var(--accent)' : 'var(--border)'}`,
              textTransform: 'capitalize',
            }}>
              {s} {count > 0 && <span className="badge" style={{ background: filter === s ? 'var(--accent)' : 'var(--text-muted)' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
      ) : requests.length === 0 ? (
        <div className="empty-state card card-p">
          <div className="empty-icon">🤝</div>
          <h3>No mentorship requests yet</h3>
          <p>{user?.role === 'student' ? 'Browse alumni and request a mentor to get started.' : 'Students will send requests as they find you.'}</p>
        </div>
      ) : (
        <div className="grid-2">
          {requests.map(req => (
            <RequestCard key={req._id} req={req} currentUser={user} onRespond={handleRespond} onSchedule={handleSchedule} onFeedback={handleFeedback} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
