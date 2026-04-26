import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const INDUSTRIES = ['All', 'Technology', 'Finance', 'Design & Technology', 'E-Commerce', 'Healthcare', 'Education'];

const AlumniCard = ({ alumni, matchScore, onConnect, onMessage, onRequestMentorship }) => {
  const initials = alumni.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="card card-p animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div className="avatar avatar-lg" style={{ fontSize: '22px', flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>{alumni.name}</span>
            {alumni.isVerified && <span title="Verified" style={{ color: 'var(--info)', fontSize: '14px' }}>✓</span>}
            {matchScore !== undefined && <div className="match-score" style={{ width: '40px', height: '40px', fontSize: '12px' }}>{matchScore}%</div>}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {alumni.currentRole} {alumni.company && `@ ${alumni.company}`}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>📍 {alumni.location || 'Remote'}</div>
        </div>
      </div>

      {alumni.bio && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{alumni.bio}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {alumni.skills?.slice(0, 4).map(skill => <span key={skill} className="tag" style={{ fontSize: '11px' }}>{skill}</span>)}
        {alumni.skills?.length > 4 && <span className="tag tag-cyan" style={{ fontSize: '11px' }}>+{alumni.skills.length - 4}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '12px', color: alumni.isAvailableForMentorship ? 'var(--success)' : 'var(--text-muted)' }}>
          {alumni.isAvailableForMentorship ? '✅ Open to mentoring' : '🔒 Not available'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onMessage(alumni)} className="btn btn-secondary btn-sm">💬</button>
          {alumni.isAvailableForMentorship && (
            <button onClick={() => onRequestMentorship(alumni)} className="btn btn-primary btn-sm">🤝 Mentor</button>
          )}
        </div>
      </div>
    </div>
  );
};

const MentorshipModal = ({ alumni, onClose, onSubmit }) => {
  const [msg, setMsg] = useState('');
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!msg.trim()) return toast.error('Please write a message');
    setLoading(true);
    await onSubmit(alumni._id, msg, goals);
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 700, marginBottom: '6px' }}>Request Mentorship</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Sending to <strong>{alumni.name}</strong> · {alumni.currentRole}</p>
        <div className="flex-col gap-14">
          <div className="form-group">
            <label className="label">Your Message *</label>
            <textarea className="input" placeholder="Introduce yourself and explain why you want this mentor..." value={msg} onChange={e => setMsg(e.target.value)} style={{ minHeight: '120px' }} />
          </div>
          <div className="form-group">
            <label className="label">Goals (optional)</label>
            <input className="input" placeholder="e.g. Land a software engineering role" value={goals} onChange={e => setGoals(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={handleSend} disabled={loading} className="btn btn-primary flex-1">
              {loading ? <span className="spinner spinner-sm" /> : '🚀 Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AlumniPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState('browse');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [mentorOnly, setMentorOnly] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (industry !== 'All') params.set('industry', industry);
      if (mentorOnly) params.set('mentorship', 'true');
      const res = await api.get(`/alumni?${params}`);
      setAlumni(res.data.alumni);
      setTotalPages(res.data.pages);
    } finally { setLoading(false); }
  };

  const fetchMatches = async () => {
    if (user?.role !== 'student') return;
    try {
      const res = await api.get('/alumni/matches');
      setMatches(res.data.matches);
    } catch {}
  };

  const handleSearch = async () => {
    if (!search.trim()) return fetchAlumni();
    try {
      const res = await api.get(`/alumni/search?q=${search}`);
      setAlumni(res.data.alumni);
    } catch { toast.error('Search failed'); }
  };

  useEffect(() => { fetchAlumni(); }, [industry, mentorOnly, page]);
  useEffect(() => { fetchMatches(); }, []);

  const handleMentorshipSubmit = async (alumniId, message, goals) => {
    try {
      await api.post('/mentorship/request', { alumniId, message, goals });
      toast.success('Mentorship request sent! 🎉');
      setSelectedAlumni(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send request'); }
  };

  const handleMessage = (a) => navigate(`/messages/${a._id}`);

  const displayList = tab === 'matches' ? matches.map(m => ({ ...m.alumni, _matchScore: m.score })) : alumni;

  return (
    <div className="page animate-fade">
      <div className="page-hero">
        <h1 className="page-title" style={{ marginBottom: '6px' }}>🎓 Browse Alumni</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Discover and connect with alumni mentors who've walked your path.</p>
      </div>

      {/* Tabs */}
      {user?.role === 'student' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[{ id: 'browse', label: '🔍 All Alumni' }, { id: 'matches', label: `🎯 My Matches (${matches.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="btn" style={{
              background: tab === t.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
              color: tab === t.id ? 'var(--accent-light)' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {/* Filters */}
      {tab === 'browse' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '8px' }}>
            <input className="input" placeholder="Search by name, company, skills..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} style={{ flex: 1 }} />
            <button onClick={handleSearch} className="btn btn-primary">Search</button>
          </div>
          <select className="input" style={{ width: '160px' }} value={industry} onChange={e => { setIndustry(e.target.value); setPage(1); }}>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          <button onClick={() => { setMentorOnly(v => !v); setPage(1); }} className="btn" style={{
            background: mentorOnly ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
            color: mentorOnly ? 'var(--success)' : 'var(--text-secondary)',
            border: `1px solid ${mentorOnly ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
          }}>
            ✅ Mentors Only
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
      ) : displayList.length === 0 ? (
        <div className="empty-state card"><div className="empty-icon">🔍</div><h3>No alumni found</h3><p>Try adjusting your filters</p></div>
      ) : (
        <>
          <div className="grid-3">
            {displayList.map((a, i) => (
              <AlumniCard key={a._id || i} alumni={a} matchScore={a._matchScore} onMessage={handleMessage} onRequestMentorship={setSelectedAlumni} onConnect={() => {}} />
            ))}
          </div>
          {tab === 'browse' && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '28px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm">← Prev</button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '6px 12px' }}>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm">Next →</button>
            </div>
          )}
        </>
      )}

      {selectedAlumni && <MentorshipModal alumni={selectedAlumni} onClose={() => setSelectedAlumni(null)} onSubmit={handleMentorshipSubmit} />}
    </div>
  );
}
