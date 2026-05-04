import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SKILLS_LIST = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Machine Learning', 'Java', 'AWS', 'Docker', 'TypeScript', 'Go', 'Figma', 'Data Analysis', 'Git', 'CSS', 'C++'];
const INTERESTS_LIST = ['Full Stack Development', 'Data Science', 'AI/ML', 'DevOps', 'Product Management', 'UI/UX Design', 'Cybersecurity', 'Cloud Computing', 'Finance', 'Blockchain'];
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Data Science', 'Electrical Engineering', 'Mathematics', 'Design', 'Business', 'Finance', 'Other'];

const ALL_BADGES = [
  { id: 'early_adopter', icon: '🌱', label: 'Early Adopter', desc: 'Joined in the first month' },
  { id: 'networker', icon: '🔗', label: 'Networker', desc: 'Made 5+ connections' },
  { id: 'mentor_hero', icon: '🤝', label: 'Mentor Hero', desc: 'Completed 3 mentorship sessions' },
  { id: 'job_seeker', icon: '💼', label: 'Job Seeker', desc: 'Applied to 10+ jobs' },
  { id: 'event_goer', icon: '📅', label: 'Event Goer', desc: 'RSVPd to 3+ events' },
  { id: 'ai_explorer', icon: '🤖', label: 'AI Explorer', desc: 'Used Career AI 5 times' },
];

const XP_MILESTONES = [
  { pts: 0,   label: 'Newcomer',  emoji: '🚀' },
  { pts: 80,  label: 'Rising',    emoji: '🌟' },
  { pts: 200, label: 'Expert',    emoji: '🔮' },
  { pts: 500, label: 'Legend',    emoji: '👑' },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '', bio: '', department: '', graduationYear: '',
    skills: [], careerInterests: [], currentRole: '', company: '',
    industry: '', location: '', linkedIn: '', github: '', website: '',
    goals: '', yearsOfExperience: '', isAvailableForMentorship: true,
    profilePhoto: '',
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoHover, setPhotoHover] = useState(false);
  // Password
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
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
        profilePhoto: user.profilePhoto || '',
      }));
      setPhotoPreview(user.profilePhoto || '');
    }
  }, [user]);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSkill = (s) => upd('skills', form.skills.includes(s) ? form.skills.filter(x => x !== s) : [...form.skills, s]);
  const toggleInterest = (s) => upd('careerInterests', form.careerInterests.includes(s) ? form.careerInterests.filter(x => x !== s) : [...form.careerInterests, s]);

  /* ── Photo handling ── */
  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Photo must be under 2 MB');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPhotoPreview(base64);
      upd('profilePhoto', base64);
    };
    reader.readAsDataURL(file);
  };

  /* ── Save profile ── */
  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/users/profile', form);
      updateUser(res.data.user);
      setSaveSuccess(true);
      toast.success('Profile updated! ✅');
      setTimeout(() => setSaveSuccess(false), 2200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  /* ── Change password ── */
  const pwStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = pwStrength(pwForm.next);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'var(--danger)', 'var(--warning)', '#f59e0b', 'var(--success)', '#34d399'][strength];

  const handleChangePassword = async () => {
    if (!pwForm.current) return toast.error('Enter your current password');
    if (pwForm.next.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwForm.next !== pwForm.confirm) return toast.error('Passwords do not match');
    setPwLoading(true);
    try {
      await api.put('/users/password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      toast.success('Password changed! 🔐');
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const profileCompletion = () => {
    const fields = ['bio', 'department', 'skills', 'location'];
    const filled = fields.filter(f => form[f] && (Array.isArray(form[f]) ? form[f].length > 0 : form[f].trim()));
    return Math.round((filled.length / fields.length) * 100);
  };
  const completion = profileCompletion();
  const score = user?.engagementScore || 0;
  const earnedBadges = user?.badges || [];
  const nextMilestone = XP_MILESTONES.find(m => m.pts > score) || XP_MILESTONES[XP_MILESTONES.length - 1];
  const prevMilestone = [...XP_MILESTONES].reverse().find(m => m.pts <= score) || XP_MILESTONES[0];
  const xpProgress = nextMilestone.pts > prevMilestone.pts
    ? Math.min(100, ((score - prevMilestone.pts) / (nextMilestone.pts - prevMilestone.pts)) * 100)
    : 100;

  return (
    // eslint-disable-next-line no-unused-vars
    <div className="page animate-fade">
      {/* Profile Header */}
      <div className="page-hero" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Clickable avatar with camera overlay */}
          <motion.div
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => fileInputRef.current?.click()}
            onHoverStart={() => setPhotoHover(true)}
            onHoverEnd={() => setPhotoHover(false)}
            whileHover={{ scale: 1.04 }}
            title="Click to change photo"
          >
            <div
              className="avatar avatar-xl"
              style={{
                fontSize: '32px',
                border: '3px solid var(--accent)',
                boxShadow: '0 0 30px var(--accent-glow)',
                overflow: 'hidden',
                background: photoPreview ? 'transparent' : undefined,
              }}
            >
              {photoPreview
                ? <img src={photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials
              }
            </div>
            <AnimatePresence>
              {photoHover && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>📷</span>
                  <span style={{ fontSize: '10px', color: 'white', fontWeight: 700 }}>EDIT</span>
                </motion.div>
              )}
            </AnimatePresence>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoFile}
            />
          </motion.div>
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
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning)' }}>⭐ {score}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Engagement Points</div>
            {/* XP to next level */}
            <div style={{ textAlign: 'left', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {nextMilestone.pts > score
                  ? `${nextMilestone.pts - score} pts to ${nextMilestone.emoji} ${nextMilestone.label}`
                  : `${prevMilestone.emoji} ${prevMilestone.label} reached!`}
              </div>
              <div className="progress-bar" style={{ width: '160px' }}>
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.connections?.length || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Connections</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{earnedBadges.length}</div>
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

          {/* Badges Showcase */}
          <div className="card card-p">
            <h2 className="section-title" style={{ marginBottom: '16px' }}>🏆 Badges & Achievements</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {ALL_BADGES.map((badge, i) => {
                const earned = earnedBadges.includes(badge.id);
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07, type: 'spring', stiffness: 380, damping: 24 }}
                    title={badge.desc}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      padding: '14px 8px',
                      borderRadius: 'var(--radius)',
                      border: `1px solid ${earned ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                      background: earned ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.015)',
                      filter: earned ? 'none' : 'grayscale(0.8) opacity(0.45)',
                      cursor: 'default',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    whileHover={{ scale: 1.04, filter: 'none' }}
                  >
                    {earned && (
                      <motion.div
                        className="badge-earned-glow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          position: 'absolute', inset: 0, borderRadius: 'var(--radius)',
                          boxShadow: '0 0 18px rgba(124,58,237,0.25)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <span style={{ fontSize: '26px', lineHeight: 1 }}>{badge.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center', color: earned ? 'var(--text-primary)' : 'var(--text-muted)' }}>{badge.label}</span>
                    {!earned && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>🔒 Locked</span>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Change Password card */}
          <div className="card card-p">
            <h2 className="section-title" style={{ marginBottom: '20px' }}>🔐 Change Password</h2>
            <div className="flex-col gap-14">
              {/* Current password */}
              <div className="form-group">
                <label className="label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPw.current ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    style={{ paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }}>
                    {showPw.current ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              {/* New password */}
              <div className="form-group">
                <label className="label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPw.next ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={pwForm.next}
                    onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                    style={{ paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, next: !p.next }))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }}>
                    {showPw.next ? '🙈' : '👁'}
                  </button>
                </div>
                {/* Strength meter */}
                {pwForm.next && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4,5].map(i => (
                        <motion.div key={i}
                          style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= strength ? strengthColor : 'var(--border)' }}
                          animate={{ background: i <= strength ? strengthColor : 'var(--border)' }}
                          transition={{ duration: 0.3 }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
                  </div>
                )}
              </div>
              {/* Confirm */}
              <div className="form-group">
                <label className="label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPw.confirm ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    style={{
                      paddingRight: '44px',
                      borderColor: pwForm.confirm && pwForm.next !== pwForm.confirm ? 'var(--danger)' : undefined,
                    }}
                  />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }}>
                    {showPw.confirm ? '🙈' : '👁'}
                  </button>
                </div>
                {pwForm.confirm && pwForm.next !== pwForm.confirm && (
                  <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</p>
                )}
              </div>
              <motion.button
                onClick={handleChangePassword}
                disabled={pwLoading || !pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm}
                className="btn btn-primary btn-full"
                animate={pwSuccess ? { background: ['linear-gradient(135deg,#7c3aed,#5b21b6)', 'linear-gradient(135deg,#10b981,#059669)', 'linear-gradient(135deg,#7c3aed,#5b21b6)'] } : {}}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -2, boxShadow: '0 8px 28px var(--accent-glow)' }}
                whileTap={{ scale: 0.97 }}
              >
                {pwLoading ? <><span className="spinner spinner-sm" /> Updating…</> : pwSuccess ? '✅ Password Changed!' : '🔐 Update Password'}
              </motion.button>
            </div>
          </div>

          {/* Save Profile Button */}
          <motion.button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary btn-full btn-lg"
            animate={saveSuccess ? { scale: [1, 1.04, 1], background: ['linear-gradient(135deg,#7c3aed,#5b21b6)', 'linear-gradient(135deg,#10b981,#059669)', 'linear-gradient(135deg,#7c3aed,#5b21b6)'] } : {}}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -2, boxShadow: '0 8px 28px var(--accent-glow)' }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <><span className="spinner spinner-sm" /> Saving…</> : saveSuccess ? '✅ Saved!' : '💾 Save Profile'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
