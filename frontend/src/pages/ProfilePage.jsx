import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SKILLS_LIST = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Machine Learning', 'Java', 'AWS', 'Docker', 'TypeScript', 'Go', 'Figma', 'Data Analysis', 'Git', 'CSS', 'C++'];
const INTERESTS_LIST = ['Full Stack Development', 'Data Science', 'AI/ML', 'DevOps', 'Product Management', 'UI/UX Design', 'Cybersecurity', 'Cloud Computing', 'Finance', 'Blockchain'];
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Data Science', 'Electrical Engineering', 'Mathematics', 'Design', 'Business', 'Finance', 'Other'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '', bio: '', department: '', graduationYear: '',
    skills: [], careerInterests: [], currentRole: '', company: '',
    industry: '', location: '', linkedIn: '', github: '', website: '',
    goals: '', yearsOfExperience: '', isAvailableForMentorship: true,
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        department: user.department || '',
        graduationYear: user.graduationYear || '',
        skills: user.skills || [],
        careerInterests: user.careerInterests || [],
        currentRole: user.currentRole || '',
        company: user.company || '',
        industry: user.industry || '',
        location: user.location || '',
        linkedIn: user.linkedIn || '',
        github: user.github || '',
        website: user.website || '',
        goals: user.goals || '',
        yearsOfExperience: user.yearsOfExperience || '',
        isAvailableForMentorship: user.isAvailableForMentorship !== false,
      });
    }
  }, [user]);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleSkill = (s) => upd('skills', form.skills.includes(s) ? form.skills.filter(x => x !== s) : [...form.skills, s]);
  const toggleInterest = (s) => upd('careerInterests', form.careerInterests.includes(s) ? form.careerInterests.filter(x => x !== s) : [...form.careerInterests, s]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/users/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const profileCompletion = () => {
    const fields = ['bio', 'department', 'skills', 'location'];
    const filled = fields.filter(f => form[f] && (Array.isArray(form[f]) ? form[f].length > 0 : form[f].trim()));
    return Math.round((filled.length / fields.length) * 100);
  };
  const completion = profileCompletion();

  return (
    <div className="page animate-fade">
      {/* Profile Header */}
      <div className="page-hero" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="avatar avatar-xl" style={{ fontSize: '32px', border: '3px solid var(--accent)', boxShadow: '0 0 30px var(--accent-glow)' }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{user?.name}</h1>
              {user?.isVerified && <span style={{ color: 'var(--info)', fontSize: '16px' }} title="Verified">✓ Verified</span>}
              <span className="tag" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
              {user?.currentRole && user?.company ? `${user.currentRole} @ ${user.company}` : user?.department || 'Complete your profile'}
            </p>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Profile Completion</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: completion === 100 ? 'var(--success)' : 'var(--accent-light)' }}>{completion}%</span>
              </div>
              <div className="progress-bar" style={{ width: '280px' }}>
                <div className="progress-fill" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning)' }}>⭐ {user?.engagementScore || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Engagement Points</div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.connections?.length || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Connections</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.badges?.length || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Badges</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div className="flex-col gap-20">
          {/* Basic Info */}
          <div className="card card-p">
            <h2 className="section-title" style={{ marginBottom: '20px' }}>👤 Basic Info</h2>
            <div className="flex-col gap-14">
              <div className="form-group"><label className="label">Display Name</label><input className="input" value={form.name} onChange={e => upd('name', e.target.value)} /></div>
              <div className="form-group"><label className="label">Bio</label><textarea className="input" placeholder="Tell people about yourself..." value={form.bio} onChange={e => upd('bio', e.target.value)} style={{ minHeight: '90px' }} /></div>
              <div className="grid-2">
                <div className="form-group"><label className="label">Department</label>
                  <select className="input" value={form.department} onChange={e => upd('department', e.target.value)}>
                    <option value="">Select...</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="label">Graduation Year</label><input type="number" className="input" min="2000" max="2035" value={form.graduationYear} onChange={e => upd('graduationYear', e.target.value)} /></div>
              </div>
              {form.bio && <div className="form-group"><label className="label">Goals</label><textarea className="input" placeholder="Your career goals..." value={form.goals} onChange={e => upd('goals', e.target.value)} style={{ minHeight: '70px' }} /></div>}
            </div>
          </div>

          {/* Professional (Alumni) */}
          {user?.role === 'alumni' && (
            <div className="card card-p">
              <h2 className="section-title" style={{ marginBottom: '20px' }}>💼 Professional</h2>
              <div className="flex-col gap-14">
                <div className="grid-2">
                  <div className="form-group"><label className="label">Current Role</label><input className="input" placeholder="Software Engineer" value={form.currentRole} onChange={e => upd('currentRole', e.target.value)} /></div>
                  <div className="form-group"><label className="label">Company</label><input className="input" placeholder="Google" value={form.company} onChange={e => upd('company', e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="label">Industry</label><input className="input" placeholder="Technology" value={form.industry} onChange={e => upd('industry', e.target.value)} /></div>
                  <div className="form-group"><label className="label">Years of Experience</label><input type="number" className="input" min="0" max="50" value={form.yearsOfExperience} onChange={e => upd('yearsOfExperience', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="label">Location</label><input className="input" placeholder="San Francisco, CA" value={form.location} onChange={e => upd('location', e.target.value)} /></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', padding: '12px', borderRadius: 'var(--radius)', background: form.isAvailableForMentorship ? 'rgba(16,185,129,0.08)' : 'transparent', border: `1px solid ${form.isAvailableForMentorship ? 'rgba(16,185,129,0.3)' : 'var(--border)'}` }}>
                  <input type="checkbox" checked={form.isAvailableForMentorship} onChange={e => upd('isAvailableForMentorship', e.target.checked)} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Available for Mentorship</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Students will be able to request you as a mentor</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex-col gap-20">
          {/* Skills */}
          <div className="card card-p">
            <h2 className="section-title" style={{ marginBottom: '16px' }}>🛠 Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {SKILLS_LIST.map(s => (
                <button key={s} type="button" onClick={() => toggleSkill(s)} className="tag" style={{ cursor: 'pointer', background: form.skills.includes(s) ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.06)', border: `1px solid ${form.skills.includes(s) ? 'var(--accent)' : 'rgba(124,58,237,0.12)'}`, fontSize: '12px' }}>
                  {form.skills.includes(s) ? '✓ ' : ''}{s}
                </button>
              ))}
            </div>
            {form.skills.length > 0 && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{form.skills.length} skills selected</div>}
          </div>

          {/* Career Interests (students) */}
          {user?.role === 'student' && (
            <div className="card card-p">
              <h2 className="section-title" style={{ marginBottom: '16px' }}>🎯 Career Interests</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {INTERESTS_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleInterest(s)} className="tag tag-cyan" style={{ cursor: 'pointer', background: form.careerInterests.includes(s) ? 'rgba(6,182,212,0.25)' : 'rgba(6,182,212,0.06)', border: `1px solid ${form.careerInterests.includes(s) ? 'var(--info)' : 'rgba(6,182,212,0.15)'}`, fontSize: '12px' }}>
                    {form.careerInterests.includes(s) ? '✓ ' : ''}{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="card card-p">
            <h2 className="section-title" style={{ marginBottom: '20px' }}>🔗 Social Links</h2>
            <div className="flex-col gap-14">
              <div className="form-group"><label className="label">LinkedIn</label><input className="input" placeholder="https://linkedin.com/in/..." value={form.linkedIn} onChange={e => upd('linkedIn', e.target.value)} /></div>
              <div className="form-group"><label className="label">GitHub</label><input className="input" placeholder="https://github.com/..." value={form.github} onChange={e => upd('github', e.target.value)} /></div>
              <div className="form-group"><label className="label">Website / Portfolio</label><input className="input" placeholder="https://yoursite.com" value={form.website} onChange={e => upd('website', e.target.value)} /></div>
            </div>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} disabled={loading} className="btn btn-primary btn-full btn-lg">
            {loading ? <><span className="spinner spinner-sm" /> Saving...</> : '✅ Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
