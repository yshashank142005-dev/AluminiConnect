import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['All', 'webinar', 'workshop', 'networking', 'reunion', 'career_fair', 'other'];

const TYPE_ICONS = {
  webinar: '📡', workshop: '🛠', networking: '🔗',
  reunion: '🎓', career_fair: '💼', other: '📌',
};

/* ── Skeleton card ── */
const SkeletonCard = () => (
  <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '18px', width: '55%', borderRadius: '6px' }} />
        <div className="skeleton-shimmer" style={{ height: '14px', width: '80%', borderRadius: '6px' }} />
      </div>
      <div className="skeleton-shimmer" style={{ width: '40px', height: '48px', borderRadius: '8px' }} />
    </div>
    <div className="skeleton-shimmer" style={{ height: '40px', borderRadius: '6px' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div className="skeleton-shimmer" style={{ height: '12px', width: '60%', borderRadius: '4px' }} />
      <div className="skeleton-shimmer" style={{ height: '12px', width: '45%', borderRadius: '4px' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
      <div className="skeleton-shimmer" style={{ height: '12px', width: '100px', borderRadius: '4px' }} />
      <div className="skeleton-shimmer" style={{ height: '32px', width: '90px', borderRadius: '8px' }} />
    </div>
  </div>
);

/* ── Event Card ── */
const EventCard = ({ event, currentUserId, onRSVP, onDelete, index = 0 }) => {
  const isAttending = event.rsvpList?.some(r => (r.user?._id || r.user) === currentUserId);
  const attendeeCount = event.rsvpList?.length || 0;
  const isFull = event.maxAttendees > 0 && attendeeCount >= event.maxAttendees;
  const isOrganizer = event.organizer?._id === currentUserId;
  const isPast = new Date(event.date) < new Date();
  const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
  const typeIcon = TYPE_ICONS[event.type] || '📌';

  return (
    <motion.div
      className="card card-p event-card-enhanced"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 340, damping: 28 }}
      whileHover={{ y: -4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', overflow: 'hidden' }}
    >
      {/* accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: isAttending
          ? 'linear-gradient(90deg, var(--success), #34d399)'
          : isPast
          ? 'rgba(255,255,255,0.08)'
          : 'linear-gradient(90deg, var(--accent), var(--accent2))',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingTop: '6px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="tag tag-cyan" style={{ fontSize: '11px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {typeIcon} {event.type?.replace('_', ' ')}
            </span>
            {isPast && <span className="tag" style={{ fontSize: '11px', background: 'rgba(100,100,100,0.15)', color: 'var(--text-muted)', borderColor: 'transparent' }}>Past</span>}
            {isAttending && (
              <motion.span
                className="tag tag-green"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ fontSize: '11px' }}
              >
                ✓ You're in!
              </motion.span>
            )}
            {!isPast && !isAttending && daysUntil <= 7 && daysUntil > 0 && (
              <span className="tag tag-orange" style={{ fontSize: '11px' }}>⚡ {daysUntil}d left</span>
            )}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{event.title}</h3>
        </div>

        {/* Date badge */}
        <div style={{
          textAlign: 'center', flexShrink: 0,
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '10px', padding: '6px 10px', minWidth: '44px',
        }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-light)', lineHeight: 1 }}>
            {new Date(event.date).getDate()}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {new Date(event.date).toLocaleString('default', { month: 'short' })}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {event.description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
          <span>📍</span><span>{event.venue || 'Online'}</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
          <span>🕐</span>
          <span>
            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {event.time && ` at ${event.time}`}
          </span>
        </div>
        {event.organizer && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
            <span>👤</span><span>By {event.organizer.name}</span>
          </div>
        )}
      </div>

      {/* Attendee progress bar */}
      {event.maxAttendees > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>👥 {attendeeCount} attending</span>
            <span>{event.maxAttendees - attendeeCount > 0 ? `${event.maxAttendees - attendeeCount} spots left` : '🔒 Full'}</span>
          </div>
          <div className="progress-bar" style={{ height: '4px' }}>
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (attendeeCount / event.maxAttendees) * 100)}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ background: isFull ? 'var(--danger)' : undefined }}
            />
          </div>
        </div>
      )}

      {event.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {event.tags.map(t => <span key={t} className="tag" style={{ fontSize: '11px' }}>#{t}</span>)}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {!event.maxAttendees || event.maxAttendees === 0
            ? `👥 ${attendeeCount} attending`
            : ''}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOrganizer && (
            <motion.button onClick={() => onDelete(event._id)} className="btn btn-danger btn-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>Delete</motion.button>
          )}
          {event.meetingLink && !isPast && (
            <a href={event.meetingLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">🔗 Join</a>
          )}
          {!isPast && (
            <motion.button
              onClick={() => onRSVP(event._id)}
              className={`btn btn-sm ${isAttending ? 'btn-secondary' : 'btn-primary'}`}
              disabled={!isAttending && isFull}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
            >
              {isAttending ? '✓ Cancel RSVP' : isFull ? '🔒 Full' : '+ RSVP'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Create Event Modal ── */
const CreateEventModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '10:00', venue: 'Online', type: 'webinar', maxAttendees: '', meetingLink: '' });
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <motion.div
        className="card"
        style={{ width: '100%', maxWidth: '520px', padding: '28px', margin: 'auto' }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>📅 Create Event</h3>
        <div className="flex-col gap-14">
          <div className="form-group"><label className="label">Title *</label><input className="input" placeholder="e.g. Tech Career Panel" value={form.title} onChange={e => upd('title', e.target.value)} /></div>
          <div className="form-group"><label className="label">Description *</label><textarea className="input" placeholder="What's this event about?" value={form.description} onChange={e => upd('description', e.target.value)} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={e => upd('date', e.target.value)} /></div>
            <div className="form-group"><label className="label">Time *</label><input type="time" className="input" value={form.time} onChange={e => upd('time', e.target.value)} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label className="label">Event Type</label>
              <select className="input" value={form.type} onChange={e => upd('type', e.target.value)}>
                {['webinar', 'workshop', 'networking', 'reunion', 'career_fair', 'other'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">Max Attendees</label><input type="number" className="input" placeholder="0 = unlimited" value={form.maxAttendees} onChange={e => upd('maxAttendees', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="label">Venue / Location</label><input className="input" placeholder="Online / Building Name" value={form.venue} onChange={e => upd('venue', e.target.value)} /></div>
          <div className="form-group"><label className="label">Meeting Link</label><input className="input" placeholder="https://zoom.us/..." value={form.meetingLink} onChange={e => upd('meetingLink', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <motion.button
              onClick={async () => { setLoading(true); await onSubmit(form); setLoading(false); }}
              className="btn btn-primary flex-1"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? <span className="spinner spinner-sm" /> : '✅ Create Event'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Page ── */
export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'All') params.set('type', filter);
      if (upcomingOnly) params.set('upcoming', 'true');
      const res = await api.get(`/events?${params}`);
      setEvents(res.data.events || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [filter, upcomingOnly]);

  const handleRSVP = async (id) => {
    try {
      const res = await api.post(`/events/${id}/rsvp`);
      toast.success(res.data.attending ? '🎉 RSVP confirmed!' : 'RSVP cancelled');
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'RSVP failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch { toast.error('Failed to delete'); }
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/events', data);
      toast.success('Event created! 📅');
      setShowCreate(false);
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
  };

  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '6px' }}>📅 Events</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Webinars, workshops, and networking events hosted by alumni.</p>
          </div>
          {['alumni', 'admin'].includes(user?.role) && (
            <motion.button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              + Create Event
            </motion.button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <motion.div
        style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {EVENT_TYPES.map(t => (
          <motion.button
            key={t}
            onClick={() => setFilter(t)}
            className="btn btn-sm"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              background: filter === t ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
              color: filter === t ? 'var(--accent-light)' : 'var(--text-secondary)',
              border: `1px solid ${filter === t ? 'var(--accent)' : 'var(--border)'}`,
              textTransform: 'capitalize',
            }}
          >
            {t === 'All' ? '🌐 All' : `${TYPE_ICONS[t] || ''} ${t.replace('_', ' ')}`}
          </motion.button>
        ))}
        <motion.button
          onClick={() => setUpcomingOnly(v => !v)}
          className="btn btn-sm"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            background: upcomingOnly ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)',
            color: upcomingOnly ? 'var(--info)' : 'var(--text-secondary)',
            border: `1px solid ${upcomingOnly ? 'rgba(6,182,212,0.4)' : 'var(--border)'}`,
          }}
        >
          {upcomingOnly ? '🗓 Upcoming Only' : '📋 All Events'}
        </motion.button>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <motion.div
          className="empty-state card card-p"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{ padding: '64px 24px' }}
        >
          <motion.span
            style={{ fontSize: '56px', marginBottom: '8px', display: 'block' }}
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >🗓</motion.span>
          <h3>No events yet!</h3>
          <p style={{ maxWidth: '340px', marginTop: '6px', fontSize: '14px' }}>
            {filter !== 'All'
              ? `No ${filter.replace('_', ' ')} events right now. Try a different category.`
              : upcomingOnly
              ? "It's quiet on the calendar. Check back soon — events are being planned!"
              : 'No events have been created yet. Be the first to host one!'}
          </p>
          {['alumni', 'admin'].includes(user?.role) && (
            <motion.button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              + Host an Event
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="grid-3">
          {events.map((event, i) => (
            <EventCard key={event._id} event={event} index={i} currentUserId={user?._id} onRSVP={handleRSVP} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      </AnimatePresence>
    </motion.div>
  );
}
