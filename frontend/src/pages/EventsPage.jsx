import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Real schema: type (not eventType), venue (not location), rsvpList, meetingLink, isPublished
const EVENT_TYPES = ['All', 'webinar', 'workshop', 'networking', 'reunion', 'career_fair', 'other'];

const EventCard = ({ event, currentUserId, onRSVP, onDelete }) => {
  const isAttending = event.rsvpList?.some(r => (r.user?._id || r.user) === currentUserId);
  const attendeeCount = event.rsvpList?.length || 0;
  const isFull = event.maxAttendees > 0 && attendeeCount >= event.maxAttendees;
  const isOrganizer = event.organizer?._id === currentUserId;
  const isPast = new Date(event.date) < new Date();

  return (
    <div className="card card-p animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="tag tag-cyan" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
              {event.type?.replace('_', ' ')}
            </span>
            {isPast && <span className="tag" style={{ fontSize: '11px', background: 'rgba(100,100,100,0.15)', color: 'var(--text-muted)', borderColor: 'transparent' }}>Past</span>}
            {isAttending && <span className="tag tag-green" style={{ fontSize: '11px' }}>✓ Attending</span>}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{event.title}</h3>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-light)', lineHeight: 1 }}>
            {new Date(event.date).getDate()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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

      {event.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {event.tags.map(t => <span key={t} className="tag" style={{ fontSize: '11px' }}>#{t}</span>)}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          👥 {attendeeCount}{event.maxAttendees > 0 ? ` / ${event.maxAttendees}` : ''} attending
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOrganizer && (
            <button onClick={() => onDelete(event._id)} className="btn btn-danger btn-sm">Delete</button>
          )}
          {event.meetingLink && !isPast && (
            <a href={event.meetingLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">🔗 Join</a>
          )}
          {!isPast && (
            <button onClick={() => onRSVP(event._id)} className={`btn btn-sm ${isAttending ? 'btn-secondary' : 'btn-primary'}`} disabled={!isAttending && isFull}>
              {isAttending ? '✓ Cancel RSVP' : isFull ? '🔒 Full' : '+ RSVP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateEventModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '10:00', venue: 'Online', type: 'webinar', maxAttendees: '', meetingLink: '' });
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px', animation: 'fadeIn 0.2s ease', margin: 'auto' }} onClick={e => e.stopPropagation()}>
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
            <button onClick={async () => { setLoading(true); await onSubmit(form); setLoading(false); }} className="btn btn-primary flex-1" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : '✅ Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    <div className="page animate-fade">
      <div className="page-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '6px' }}>📅 Events</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Webinars, workshops, and networking events hosted by alumni.</p>
          </div>
          {['alumni', 'admin'].includes(user?.role) && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Create Event</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {EVENT_TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)} className="btn btn-sm" style={{ background: filter === t ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)', color: filter === t ? 'var(--accent-light)' : 'var(--text-secondary)', border: `1px solid ${filter === t ? 'var(--accent)' : 'var(--border)'}`, textTransform: 'capitalize' }}>
            {t === 'All' ? t : t.replace('_', ' ')}
          </button>
        ))}
        <button onClick={() => setUpcomingOnly(v => !v)} className="btn btn-sm" style={{ background: upcomingOnly ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)', color: upcomingOnly ? 'var(--info)' : 'var(--text-secondary)', border: `1px solid ${upcomingOnly ? 'rgba(6,182,212,0.4)' : 'var(--border)'}` }}>
          {upcomingOnly ? '🗓 Upcoming Only' : '📋 All Events'}
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="empty-state card card-p"><div className="empty-icon">📅</div><h3>No events found</h3><p>Check back soon or create one!</p></div>
      ) : (
        <div className="grid-3">
          {events.map(event => (
            <EventCard key={event._id} event={event} currentUserId={user?._id} onRSVP={handleRSVP} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
    </div>
  );
}
