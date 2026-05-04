import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const JOB_TYPES = ['All', 'full-time', 'internship', 'part-time', 'contract', 'freelance'];

const TYPE_COLOR = {
  'full-time': 'var(--accent-light)',
  'internship': 'var(--info)',
  'part-time': 'var(--warning)',
  'contract': '#fb923c',
  'freelance': 'var(--success)',
};

/* ── Skeleton card ── */
const SkeletonJobCard = () => (
  <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '16px', width: '70%', borderRadius: '6px' }} />
        <div className="skeleton-shimmer" style={{ height: '13px', width: '50%', borderRadius: '6px' }} />
        <div style={{ display: 'flex', gap: '6px' }}>
          <div className="skeleton-shimmer" style={{ height: '22px', width: '70px', borderRadius: '100px' }} />
          <div className="skeleton-shimmer" style={{ height: '22px', width: '60px', borderRadius: '100px' }} />
        </div>
      </div>
    </div>
    <div className="skeleton-shimmer" style={{ height: '36px', borderRadius: '6px' }} />
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {[80, 90, 70].map(w => (
        <div key={w} className="skeleton-shimmer" style={{ height: '22px', width: `${w}px`, borderRadius: '100px' }} />
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
      <div className="skeleton-shimmer" style={{ height: '12px', width: '100px', borderRadius: '4px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '32px', width: '72px', borderRadius: '8px' }} />
        <div className="skeleton-shimmer" style={{ height: '32px', width: '72px', borderRadius: '8px' }} />
      </div>
    </div>
  </div>
);

/* ── Job Card ── */
const JobCard = ({ job, onApply, index = 0 }) => {
  const salary = job.salary?.min
    ? `$${(job.salary.min / 1000).toFixed(0)}k${job.salary.max ? ` – $${(job.salary.max / 1000).toFixed(0)}k` : '+'}`
    : null;

  const isNew = job.createdAt && (Date.now() - new Date(job.createdAt)) < 1000 * 60 * 60 * 48;

  return (
    <motion.div
      className="card card-p job-card-enhanced"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, type: 'spring', stiffness: 340, damping: 28 }}
      whileHover={{ y: -4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top accent line by type */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${TYPE_COLOR[job.jobType] || 'var(--accent)'}, transparent)`,
      }} />

      {/* "New" ribbon */}
      {isNew && (
        <div style={{
          position: 'absolute', top: '10px', right: '-20px',
          background: 'var(--success)', color: 'white',
          fontSize: '9px', fontWeight: 800, padding: '3px 24px',
          transform: 'rotate(35deg)', letterSpacing: '0.5px',
        }}>
          NEW
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingTop: '6px' }}>
        <motion.div
          whileHover={{ rotate: [0, -6, 6, 0], scale: 1.08 }}
          transition={{ duration: 0.4 }}
          style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0, fontWeight: 800, color: 'white',
          }}
        >
          {job.company[0]}
        </motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>{job.title}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{job.company} · {job.location}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <span className="tag tag-cyan" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{job.jobType}</span>
            {job.offersReferral && (
              <motion.span
                className="tag tag-green"
                style={{ fontSize: '11px' }}
                animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 8px rgba(16,185,129,0.4)', '0 0 0px rgba(16,185,129,0)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎯 Referral Available
              </motion.span>
            )}
            {salary && <span className="tag" style={{ fontSize: '11px' }}>💰 {salary}</span>}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {job.description}
      </p>

      {job.skills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {job.skills.slice(0, 5).map(s => <span key={s} className="tag" style={{ fontSize: '11px' }}>{s}</span>)}
          {job.skills.length > 5 && <span className="tag" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{job.skills.length - 5}</span>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Posted by {job.postedBy?.name}</div>
          {job.applicationDeadline && (
            <div style={{ fontSize: '11px', color: 'var(--warning)' }}>
              ⏳ Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            onClick={() => onApply(job)}
            className="btn btn-primary btn-sm"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            Apply →
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Apply Modal ── */
const ApplyModal = ({ job, onClose, onSubmit }) => {
  const [cover, setCover] = useState('');
  const [loading, setLoading] = useState(false);
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
        <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>Apply to {job.title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>{job.company} · {job.location}</p>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="label">Cover Letter (optional)</label>
          <textarea
            className="input"
            placeholder="Tell them why you're a great fit... 🚀"
            value={cover}
            onChange={e => setCover(e.target.value)}
            style={{ minHeight: '120px' }}
          />
        </div>
        {job.applyLink && (
          <a href={job.applyLink} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-light)', display: 'block', marginBottom: '16px' }}>
            🔗 External application link
          </a>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <motion.button
            onClick={async () => { setLoading(true); await onSubmit(job._id, cover); setLoading(false); }}
            className="btn btn-primary flex-1"
            disabled={loading}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            {loading ? <><span className="spinner spinner-sm" /> Submitting…</> : '🚀 Submit Application'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Create Job Modal ── */
const CreateJobModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ title: '', company: '', description: '', skills: '', location: 'Remote', jobType: 'full-time', offersReferral: false, applyLink: '' });
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <motion.div
        className="card"
        style={{ width: '100%', maxWidth: '560px', padding: '28px', margin: 'auto' }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>💼 Post a Job / Referral</h3>
        <div className="flex-col gap-14">
          <div className="grid-2">
            <div className="form-group"><label className="label">Job Title *</label><input className="input" placeholder="e.g. Frontend Engineer" value={form.title} onChange={e => upd('title', e.target.value)} /></div>
            <div className="form-group"><label className="label">Company *</label><input className="input" placeholder="e.g. Google" value={form.company} onChange={e => upd('company', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="label">Description *</label><textarea className="input" placeholder="What's the role about?" value={form.description} onChange={e => upd('description', e.target.value)} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="label">Location</label><input className="input" placeholder="Remote" value={form.location} onChange={e => upd('location', e.target.value)} /></div>
            <div className="form-group"><label className="label">Job Type</label>
              <select className="input" value={form.jobType} onChange={e => upd('jobType', e.target.value)}>
                {['full-time','part-time','internship','contract','freelance'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="label">Skills (comma separated)</label><input className="input" placeholder="React, TypeScript, Node.js" value={form.skills} onChange={e => upd('skills', e.target.value)} /></div>
          <div className="form-group"><label className="label">Apply Link</label><input className="input" placeholder="https://company.com/apply" value={form.applyLink} onChange={e => upd('applyLink', e.target.value)} /></div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px',
            padding: '12px', borderRadius: 'var(--radius)',
            background: form.offersReferral ? 'rgba(16,185,129,0.08)' : 'transparent',
            border: `1px solid ${form.offersReferral ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
            transition: 'all 0.2s ease',
          }}>
            <input type="checkbox" checked={form.offersReferral} onChange={e => upd('offersReferral', e.target.checked)} />
            <div>
              <div style={{ fontWeight: 600 }}>🎯 I can offer a referral</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Students will see a "Referral Available" badge on this post</div>
            </div>
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <motion.button
              onClick={async () => { setLoading(true); await onSubmit({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }); setLoading(false); }}
              className="btn btn-primary flex-1"
              disabled={loading}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.96 }}
            >
              {loading ? <span className="spinner spinner-sm" /> : '✅ Post Job'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Page ── */
export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [referralOnly, setReferralOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [applyJob, setApplyJob] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (filter !== 'All') params.set('type', filter);
      if (referralOnly) params.set('referral', 'true');
      if (search) params.set('search', search);
      const res = await api.get(`/jobs?${params}`);
      setJobs(res.data.jobs);
      setTotalPages(res.data.pages || 1);
      setTotalJobs(res.data.total || res.data.jobs?.length || 0);
    } finally { setLoading(false); }
  }, [filter, referralOnly, page, search]);

  useEffect(() => { fetchJobs(); }, [filter, referralOnly, page]);

  const handleApply = async (jobId, coverLetter) => {
    try {
      await api.post(`/jobs/${jobId}/apply`, { coverLetter });
      toast.success('Application submitted! 🎉');
      setApplyJob(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Application failed'); }
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/jobs', data);
      toast.success('Job posted! 💼');
      setShowCreate(false);
      fetchJobs();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post'); }
  };

  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '6px' }}>💼 Jobs &amp; Referrals</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Exclusive opportunities posted by alumni — with real referrals.
              {!loading && totalJobs > 0 && (
                <span style={{ marginLeft: '8px', color: 'var(--accent-light)', fontWeight: 600 }}>
                  {totalJobs} open {totalJobs === 1 ? 'role' : 'roles'}
                </span>
              )}
            </p>
          </div>
          {['alumni', 'admin'].includes(user?.role) && (
            <motion.button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              + Post a Job
            </motion.button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <motion.div
        style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '8px' }}>
          <input
            className="input"
            placeholder="🔍 Search by title, company, or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchJobs()}
          />
          <motion.button onClick={fetchJobs} className="btn btn-primary btn-sm" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            Search
          </motion.button>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {JOB_TYPES.map(t => (
            <motion.button
              key={t}
              onClick={() => { setFilter(t); setPage(1); }}
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
              {t}
            </motion.button>
          ))}
        </div>
        <motion.button
          onClick={() => { setReferralOnly(v => !v); setPage(1); }}
          className="btn btn-sm"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            background: referralOnly ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
            color: referralOnly ? 'var(--success)' : 'var(--text-secondary)',
            border: `1px solid ${referralOnly ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
          }}
        >
          🎯 Referral Only
        </motion.button>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid-3">
          {[...Array(9)].map((_, i) => <SkeletonJobCard key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <motion.div
          className="empty-state card card-p"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{ padding: '64px 24px' }}
        >
          <motion.span
            style={{ fontSize: '56px', marginBottom: '8px', display: 'block' }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            🔭
          </motion.span>
          <h3>No jobs found</h3>
          <p style={{ maxWidth: '340px', marginTop: '6px', fontSize: '14px' }}>
            {referralOnly
              ? 'No referral opportunities right now. Try removing the referral filter.'
              : search
              ? `No results for "${search}". Try different keywords.`
              : filter !== 'All'
              ? `No ${filter} positions open right now. Try a different type.`
              : 'The job board is empty — check back soon as alumni post new roles!'}
          </p>
          {(search || filter !== 'All' || referralOnly) && (
            <motion.button
              onClick={() => { setSearch(''); setFilter('All'); setReferralOnly(false); setPage(1); }}
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
            {jobs.map((job, i) => (
              <JobCard key={job._id} job={job} index={i} onApply={setApplyJob} />
            ))}
          </div>
          {totalPages > 1 && (
            <motion.div
              style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '28px', alignItems: 'center' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn btn-secondary btn-sm"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Prev
              </motion.button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '6px 12px' }}>
                Page {page} of {totalPages}
              </span>
              <motion.button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-secondary btn-sm"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
              >
                Next →
              </motion.button>
            </motion.div>
          )}
        </>
      )}

      <AnimatePresence>
        {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onSubmit={handleApply} />}
        {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      </AnimatePresence>
    </motion.div>
  );
}
