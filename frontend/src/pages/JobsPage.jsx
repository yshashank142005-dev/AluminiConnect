import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const JOB_TYPES = ['All', 'full-time', 'internship', 'part-time', 'contract', 'freelance'];

const JobCard = ({ job, onApply, onView }) => {
  const salary = job.salary?.min
    ? `$${(job.salary.min / 1000).toFixed(0)}k${job.salary.max ? ` – $${(job.salary.max / 1000).toFixed(0)}k` : '+'}`
    : null;

  return (
    <div className="card card-p animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          {job.company[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>{job.title}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{job.company} · {job.location}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <span className="tag tag-cyan" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{job.jobType}</span>
            {job.offersReferral && <span className="tag tag-green" style={{ fontSize: '11px' }}>🎯 Referral</span>}
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
          <button onClick={() => onView(job)} className="btn btn-secondary btn-sm">Details</button>
          <button onClick={() => onApply(job)} className="btn btn-primary btn-sm">Apply →</button>
        </div>
      </div>
    </div>
  );
};

const ApplyModal = ({ job, onClose, onSubmit }) => {
  const [cover, setCover] = useState('');
  const [loading, setLoading] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>Apply to {job.title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>{job.company} · {job.location}</p>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="label">Cover Letter (optional)</label>
          <textarea className="input" placeholder="Tell them why you're a great fit..." value={cover} onChange={e => setCover(e.target.value)} style={{ minHeight: '120px' }} />
        </div>
        {job.applyLink && (
          <a href={job.applyLink} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-light)', display: 'block', marginBottom: '16px' }}>
            🔗 External application link
          </a>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={async () => { setLoading(true); await onSubmit(job._id, cover); setLoading(false); }} className="btn btn-primary flex-1" disabled={loading}>
            {loading ? <span className="spinner spinner-sm" /> : '🚀 Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateJobModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ title: '', company: '', description: '', skills: '', location: 'Remote', jobType: 'full-time', offersReferral: false, applyLink: '' });
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '28px', animation: 'fadeIn 0.2s ease', margin: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>💼 Post a Job / Referral</h3>
        <div className="flex-col gap-14">
          <div className="grid-2"><div className="form-group"><label className="label">Job Title *</label><input className="input" placeholder="e.g. Frontend Engineer" value={form.title} onChange={e => upd('title', e.target.value)} /></div>
            <div className="form-group"><label className="label">Company *</label><input className="input" placeholder="e.g. Google" value={form.company} onChange={e => upd('company', e.target.value)} /></div></div>
          <div className="form-group"><label className="label">Description *</label><textarea className="input" placeholder="What's the role about?" value={form.description} onChange={e => upd('description', e.target.value)} /></div>
          <div className="grid-2"><div className="form-group"><label className="label">Location</label><input className="input" placeholder="Remote" value={form.location} onChange={e => upd('location', e.target.value)} /></div>
            <div className="form-group"><label className="label">Job Type</label><select className="input" value={form.jobType} onChange={e => upd('jobType', e.target.value)}>{['full-time','part-time','internship','contract','freelance'].map(t => <option key={t}>{t}</option>)}</select></div></div>
          <div className="form-group"><label className="label">Skills (comma separated)</label><input className="input" placeholder="React, TypeScript, Node.js" value={form.skills} onChange={e => upd('skills', e.target.value)} /></div>
          <div className="form-group"><label className="label">Apply Link</label><input className="input" placeholder="https://company.com/apply" value={form.applyLink} onChange={e => upd('applyLink', e.target.value)} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="checkbox" checked={form.offersReferral} onChange={e => upd('offersReferral', e.target.checked)} />
            I can offer a referral for this position
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={async () => { setLoading(true); await onSubmit({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }); setLoading(false); }} className="btn btn-primary flex-1" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : '✅ Post Job'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (filter !== 'All') params.set('type', filter);
      if (referralOnly) params.set('referral', 'true');
      if (search) params.set('search', search);
      const res = await api.get(`/jobs?${params}`);
      setJobs(res.data.jobs);
      setTotalPages(res.data.pages || 1);
    } finally { setLoading(false); }
  };

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
    <div className="page animate-fade">
      <div className="page-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '6px' }}>💼 Jobs & Referrals</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Exclusive opportunities posted by alumni — with real referrals.</p>
          </div>
          {['alumni', 'admin'].includes(user?.role) && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Post a Job</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '8px' }}>
          <input className="input" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchJobs()} />
          <button onClick={fetchJobs} className="btn btn-primary btn-sm">Search</button>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {JOB_TYPES.map(t => (
            <button key={t} onClick={() => { setFilter(t); setPage(1); }} className="btn btn-sm" style={{ background: filter === t ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)', color: filter === t ? 'var(--accent-light)' : 'var(--text-secondary)', border: `1px solid ${filter === t ? 'var(--accent)' : 'var(--border)'}`, textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
        <button onClick={() => { setReferralOnly(v => !v); setPage(1); }} className="btn btn-sm" style={{ background: referralOnly ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)', color: referralOnly ? 'var(--success)' : 'var(--text-secondary)', border: `1px solid ${referralOnly ? 'rgba(16,185,129,0.4)' : 'var(--border)'}` }}>
          🎯 Referral Only
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
      ) : jobs.length === 0 ? (
        <div className="empty-state card card-p"><div className="empty-icon">💼</div><h3>No jobs found</h3><p>Try adjusting your filters</p></div>
      ) : (
        <>
          <div className="grid-3">
            {jobs.map(job => <JobCard key={job._id} job={job} onApply={setApplyJob} onView={() => {}} />)}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '28px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm">← Prev</button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '6px 12px' }}>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm">Next →</button>
            </div>
          )}
        </>
      )}

      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onSubmit={handleApply} />}
      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
    </div>
  );
}
