import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const INDUSTRIES = ['All', 'Technology', 'Finance', 'Design & Technology', 'E-Commerce', 'Healthcare', 'Education'];

/* ── Alumni card skeleton ── */
const SkeletonAlumniCard = () => (
  <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div className="skeleton-shimmer" style={{ width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '16px', width: '60%', borderRadius: '6px' }} />
        <div className="skeleton-shimmer" style={{ height: '13px', width: '80%', borderRadius: '6px' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '45%', borderRadius: '6px' }} />
      </div>
    </div>
    <div className="skeleton-shimmer" style={{ height: '36px', borderRadius: '6px' }} />
    <div style={{ display: 'flex', gap: '6px' }}>
      {[60, 80, 70, 55].map(w => (
        <div key={w} className="skeleton-shimmer" style={{ height: '22px', width: `${w}px`, borderRadius: '100px' }} />
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
      <div className="skeleton-shimmer" style={{ height: '13px', width: '120px', borderRadius: '5px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '32px', width: '40px', borderRadius: '8px' }} />
        <div className="skeleton-shimmer" style={{ height: '32px', width: '80px', borderRadius: '8px' }} />
      </div>
    </div>
  </div>
);

/* ── Alumni Card ── */
const AlumniCard = ({ alumni, matchScore, onMessage, onRequestMentorship, index = 0 }) => {
  const initials = alumni.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isTopMatch = matchScore !== undefined && matchScore >= 85;

  return (
    <motion.div
      className="card card-p alumni-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 340, damping: 28 }}
      whileHover={{ y: -5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top match ribbon */}
      {isTopMatch && (
        <div style={{
          position: 'absolute', top: '12px', right: '-20px',
          background: 'linear-gradient(135deg, var(--accent), #5b21b6)',
          color: 'white', fontSize: '9px', fontWeight: 800,
          padding: '4px 28px', transform: 'rotate(35deg)',
          letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
        }}>TOP MATCH</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <motion.div
          className="avatar avatar-lg"
          style={{ fontSize: '22px', flexShrink: 0, boxShadow: isTopMatch ? '0 0 20px var(--accent-glow)' : 'none' }}
          whileHover={{ scale: 1.08, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {initials}
        </motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>{alumni.name}</span>
            {alumni.isVerified && (
              <motion.span title="Verified" style={{ color: 'var(--info)', fontSize: '14px' }} whileHover={{ scale: 1.2 }}>✓</motion.span>
            )}
            {matchScore !== undefined && (
              <motion.div
                className="match-score"
                style={{ width: '40px', height: '40px', fontSize: '12px' }}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.06 + 0.2, type: 'spring', stiffness: 300 }}
              >
                {matchScore}%
              </motion.div>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {alumni.currentRole} {alumni.company && `@ ${alumni.company}`}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            📍 {alumni.location || 'Remote'}
            {alumni.yearsOfExperience > 0 && (
              <span style={{ marginLeft: '8px' }}>· {alumni.yearsOfExperience}y exp</span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {alumni.bio && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {alumni.bio}
        </p>
      )}

      {/* Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {alumni.skills?.slice(0, 4).map(skill => (
          <span key={skill} className="tag" style={{ fontSize: '11px' }}>{skill}</span>
        ))}
        {alumni.skills?.length > 4 && (
          <span className="tag tag-cyan" style={{ fontSize: '11px' }}>+{alumni.skills.length - 4} more</span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '12px', color: alumni.isAvailableForMentorship ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {alumni.isAvailableForMentorship
            ? <><motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>✅</motion.span> Open to mentor</>
            : '🔒 Not available'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            onClick={() => onMessage(alumni)}
            className="btn btn-secondary btn-sm"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            title="Message"
          >
            💬
          </motion.button>
          {alumni.isAvailableForMentorship && (
            <motion.button
              onClick={() => onRequestMentorship(alumni)}
              className="btn btn-primary btn-sm"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              🤝 Mentor
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Mentorship Request Modal ── */
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <motion.div
        className="card"
        style={{ width: '100%', maxWidth: '480px', padding: '28px' }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        {/* Alumni preview header */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', padding: '14px', borderRadius: 'var(--radius)', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div className="avatar avatar-md" style={{ fontSize: '16px', flexShrink: 0 }}>
            {alumni.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{alumni.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{alumni.currentRole} {alumni.company && `@ ${alumni.company}`}</div>
          </div>
        </div>

        <h3 style={{ fontWeight: 700, marginBottom: '6px' }}>Request Mentorship</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Write a personal note — mentors respond better to genuine messages 🤝
        </p>

        <div className="flex-col gap-14">
          <div className="form-group">
            <label className="label">Your Message *</label>
            <textarea
              className="input"
              placeholder="Hi! I'm a CS student interested in backend development. I'd love to learn from your experience at..."
              value={msg}
              onChange={e => setMsg(e.target.value)}
              style={{ minHeight: '120px' }}
            />
          </div>
          <div className="form-group">
            <label className="label">Your Goal (optional)</label>
            <input className="input" placeholder="e.g. Land a software engineering role at a product company" value={goals} onChange={e => setGoals(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <motion.button
              onClick={handleSend}
              disabled={loading}
              className="btn btn-primary flex-1"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
            >
              {loading ? <><span className="spinner spinner-sm" /> Sending…</> : '🚀 Send Request'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Page ── */
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
  const [totalCount, setTotalCount] = useState(0);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (industry !== 'All') params.set('industry', industry);
      if (mentorOnly) params.set('mentorship', 'true');
      const res = await api.get(`/alumni?${params}`);
      setAlumni(res.data.alumni);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || res.data.alumni?.length || 0);
    } finally { setLoading(false); }
  }, [page, industry, mentorOnly]);

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
      setLoading(true);
      const res = await api.get(`/alumni/search?q=${encodeURIComponent(search)}`);
      setAlumni(res.data.alumni);
      setTotalCount(res.data.alumni?.length || 0);
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);
  useEffect(() => { fetchMatches(); }, []);

  const handleMentorshipSubmit = async (alumniId, message, goals) => {
    try {
      await api.post('/mentorship/request', { alumniId, message, goals });
      toast.success('Mentorship request sent! 🎉');
      setSelectedAlumni(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send request'); }
  };

  const displayList = tab === 'matches'
    ? matches.map(m => ({ ...m.alumni, _matchScore: m.score }))
    : alumni;

  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '6px' }}>🎓 Browse Alumni</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Discover mentors who've walked your path.
              {!loading && tab === 'browse' && totalCount > 0 && (
                <span style={{ marginLeft: '8px', color: 'var(--accent-light)', fontWeight: 600 }}>
                  {totalCount} alumni connected
                </span>
              )}
            </p>
          </div>
          {/* AI match teaser for students */}
          {user?.role === 'student' && matches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius)',
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                fontSize: '13px', fontWeight: 600, color: 'var(--accent-light)',
                cursor: 'pointer',
              }}
              onClick={() => setTab('matches')}
              whileHover={{ scale: 1.03 }}
            >
              🎯 {matches.length} AI-curated matches waiting
            </motion.div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      {user?.role === 'student' && (
        <motion.div
          style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          {[
            { id: 'browse', label: '🔍 All Alumni' },
            { id: 'matches', label: `🎯 My Matches${matches.length > 0 ? ` (${matches.length})` : ''}` },
          ].map(t => (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: tab === t.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
                color: tab === t.id ? 'var(--accent-light)' : 'var(--text-secondary)',
                border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {t.label}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Filters (browse tab only) */}
      {tab === 'browse' && (
        <motion.div
          style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <div style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '8px' }}>
            <input
              className="input"
              placeholder="🔍 Search by name, company, or skills…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1 }}
            />
            <motion.button onClick={handleSearch} className="btn btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              Search
            </motion.button>
          </div>
          <select
            className="input"
            style={{ width: '160px' }}
            value={industry}
            onChange={e => { setIndustry(e.target.value); setPage(1); }}
          >
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          <motion.button
            onClick={() => { setMentorOnly(v => !v); setPage(1); }}
            className="btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: mentorOnly ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
              color: mentorOnly ? 'var(--success)' : 'var(--text-secondary)',
              border: `1px solid ${mentorOnly ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
            }}
          >
            ✅ Mentors Only
          </motion.button>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid-3">
          {[...Array(9)].map((_, i) => <SkeletonAlumniCard key={i} />)}
        </div>
      ) : displayList.length === 0 ? (
        <motion.div
          className="empty-state card card-p"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{ padding: '64px 24px' }}
        >
          <motion.span
            style={{ fontSize: '56px', marginBottom: '12px', display: 'block' }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {tab === 'matches' ? '🎯' : '🔍'}
          </motion.span>
          <h3>{tab === 'matches' ? 'No matches found yet' : 'No alumni found'}</h3>
          <p style={{ maxWidth: '360px', marginTop: '8px', fontSize: '14px' }}>
            {tab === 'matches'
              ? 'Complete your profile with skills and career interests so our AI can find your best mentor matches!'
              : mentorOnly
              ? 'No alumni available for mentorship right now. Try removing the mentor filter.'
              : search
              ? `No results for "${search}". Try a different search term.`
              : 'No alumni match your current filters. Try adjusting them.'}
          </p>
          {(search || industry !== 'All' || mentorOnly) && tab === 'browse' && (
            <motion.button
              onClick={() => { setSearch(''); setIndustry('All'); setMentorOnly(false); setPage(1); }}
              className="btn btn-secondary"
              style={{ marginTop: '20px' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              ↩ Clear Filters
            </motion.button>
          )}
        </motion.div>
      ) : (
        <>
          <div className="grid-3">
            {displayList.map((a, i) => (
              <AlumniCard
                key={a._id || i}
                alumni={a}
                index={i}
                matchScore={a._matchScore}
                onMessage={a => navigate(`/messages/${a._id}`)}
                onRequestMentorship={setSelectedAlumni}
              />
            ))}
          </div>

          {tab === 'browse' && totalPages > 1 && (
            <motion.div
              style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '28px', alignItems: 'center' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>← Prev</motion.button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '6px 12px' }}>Page {page} of {totalPages}</span>
              <motion.button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>Next →</motion.button>
            </motion.div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedAlumni && (
          <MentorshipModal
            alumni={selectedAlumni}
            onClose={() => setSelectedAlumni(null)}
            onSubmit={handleMentorshipSubmit}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
