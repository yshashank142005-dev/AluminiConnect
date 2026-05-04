import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AI_LOADING_STEPS = [
  'Analysing your skills…',
  'Mapping career paths…',
  'Building skill roadmap…',
  'Finding top projects…',
  'Finalising your report…',
];

const SKILLS_LIST = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Machine Learning', 'Java', 'AWS', 'Docker', 'TypeScript', 'Go', 'Figma', 'Data Analysis'];
const TIMELINES = ['3 months', '6 months', '1 year', '2 years'];

const ChatMessage = ({ msg, index = 0 }) => (
  <motion.div
    style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}
    initial={{ opacity: 0, y: 10, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: Math.min(index * 0.03, 0.25), type: 'spring', stiffness: 400, damping: 30 }}
  >
    {msg.role === 'assistant' && (
      <motion.div
        style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, marginRight: '10px', alignSelf: 'flex-end' }}
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
      >🤖</motion.div>
    )}
    <div style={{
      maxWidth: '75%', padding: '12px 16px',
      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      background: msg.role === 'user' ? 'linear-gradient(135deg,var(--accent),#5b21b6)' : 'rgba(255,255,255,0.06)',
      border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
      boxShadow: msg.role === 'user' ? '0 4px 16px rgba(124,58,237,0.2)' : 'none',
      fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap',
    }} dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/•/g, '•') }} />
  </motion.div>
);

/* Animated AI loading stepper */
const AILoadingStepper = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, AI_LOADING_STEPS.length - 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
      <motion.div
        style={{ fontSize: '56px' }}
        animate={{ rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >🤖</motion.div>
      <div style={{ fontWeight: 700, fontSize: '18px', textAlign: 'center' }}>Generating your career path…</div>
      <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {AI_LOADING_STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: i <= step ? 1 : 0.25, transition: 'opacity 0.4s ease' }}>
            <motion.span
              style={{ fontSize: '14px' }}
              animate={i === step ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5, repeat: i === step ? Infinity : 0 }}
            >
              {i < step ? '✅' : i === step ? '⚙️' : '○'}
            </motion.span>
            <span style={{ fontSize: '13px', color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="progress-bar" style={{ width: '260px' }}>
        <motion.div className="progress-fill" animate={{ width: `${((step + 1) / AI_LOADING_STEPS.length) * 100}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
};

const CareerPathResults = ({ data }) => {
  const [activeTab, setActiveTab] = useState('paths');
  const tabs = [
    { id: 'paths', label: '🎯 Career Paths' },
    { id: 'skills', label: '📚 Skill Roadmap' },
    { id: 'projects', label: '🛠 Projects' },
    { id: 'certs', label: '🏆 Certifications' },
    { id: 'plan', label: '📅 Weekly Plan' },
  ];

  return (
    <div className="animate-fade">
      {data.advice && (
        <div style={{ padding: '16px 20px', borderRadius: 'var(--radius)', background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.08))', border: '1px solid rgba(124,58,237,0.25)', marginBottom: '20px', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          💡 <strong style={{ color: 'var(--text-primary)' }}>AI Insight:</strong> {data.advice}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="btn btn-sm" style={{ background: activeTab === t.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)', color: activeTab === t.id ? 'var(--accent-light)' : 'var(--text-secondary)', border: `1px solid ${activeTab === t.id ? 'var(--accent)' : 'var(--border)'}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'paths' && (
        <div className="grid-2">
          {data.careerPaths?.map((p, i) => (
            <motion.div
              key={i}
              className="card card-p"
              style={{ borderLeft: '3px solid var(--accent)', position: 'relative', overflow: 'hidden' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 340, damping: 28 }}
              whileHover={{ y: -3 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{p.title}</div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: p.match >= 85 ? 'var(--success)' : p.match >= 70 ? 'var(--warning)' : 'var(--text-secondary)', padding: '4px 10px', borderRadius: '100px', background: `${p.match >= 85 ? 'rgba(16,185,129' : p.match >= 70 ? 'rgba(245,158,11' : 'rgba(100,100,100'},0.15)` }}>
                  {p.match}% match
                </span>
              </div>
              <div className="progress-bar" style={{ marginBottom: '12px' }}>
                <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${p.match}%` }} transition={{ duration: 0.9, delay: i * 0.08 + 0.2 }}
                  style={{ background: p.match >= 85 ? 'linear-gradient(90deg,var(--success),#34d399)' : undefined }} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>{p.description}</p>
              <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600, marginBottom: '4px' }}>💰 {p.avgSalary}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📈 {p.growthRate}</div>
              {p.topCompanies?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {p.topCompanies.map(c => <span key={c} className="tag tag-cyan" style={{ fontSize: '11px' }}>{c}</span>)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="flex-col gap-12">
          {data.skillRoadmap?.map((s, i) => (
            <div key={i} className="card card-p" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ flexShrink: 0, padding: '8px 12px', borderRadius: 'var(--radius)', background: s.priority === 'high' ? 'rgba(239,68,68,0.12)' : s.priority === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(100,100,100,0.12)', color: s.priority === 'high' ? 'var(--danger)' : s.priority === 'medium' ? 'var(--warning)' : 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                {s.priority}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{s.skill}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.currentLevel} → {s.targetLevel} · ⏱ {s.estimatedTime}</div>
                {s.resources?.length > 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>📚 {s.resources.join(', ')}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="grid-2">
          {data.recommendedProjects?.map((p, i) => (
            <div key={i} className="card card-p">
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>{p.title}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>{p.description}</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {p.skills?.map(s => <span key={s} className="tag" style={{ fontSize: '11px' }}>{s}</span>)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⏱ {p.estimatedTime} · {p.difficulty}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'certs' && (
        <div className="grid-2">
          {data.certifications?.map((c, i) => (
            <div key={i} className="card card-p">
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--accent-light)', marginBottom: '8px' }}>{c.provider}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>{c.relevance}</p>
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>⏱ {c.duration}</span><span>💰 {c.cost}</span>
              </div>
              {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: '10px', display: 'inline-flex' }}>🔗 Learn More</a>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="flex-col gap-12">
          {data.weeklyPlan?.map((w, i) => (
            <div key={i} className="card card-p" style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, flexDirection: 'column', fontSize: '11px', fontWeight: 800, color: 'white', textAlign: 'center' }}>
                Wk<br />{w.week}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>{w.focus}</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {w.tasks?.map((t, j) => <li key={j} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}><span style={{ color: 'var(--accent-light)' }}>→</span>{t}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CareerAIPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('generator');
  const [skills, setSkills] = useState(user?.skills || []);
  const [interests, setInterests] = useState(user?.careerInterests || []);
  const [goals, setGoals] = useState(user?.goals || '');
  const [timeline, setTimeline] = useState('6 months');
  const [loading, setLoading] = useState(false);
  const [careerData, setCareerData] = useState(null);
  const [messages, setMessages] = useState([{ role: 'assistant', content: '👋 Hi! I\'m CareerBot, your AI career advisor. Ask me anything about:\n• **Career planning** & skill roadmaps\n• **Interview prep** & resume tips\n• **Salary negotiation** strategies\n• **Networking** with alumni mentors\n\nWhat would you like to explore?' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const toggleSkill = (s) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleInterest = (s) => setInterests(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleGenerate = async () => {
    if (skills.length === 0) return toast.error('Add at least one skill');
    setLoading(true);
    try {
      const res = await api.post('/ai/career-path', { skills, interests, goals, timeline });
      setCareerData(res.data.data);
      toast.success('Career path generated! 🎯');
    } catch { toast.error('Generation failed, using mock data'); } 
    finally { setLoading(false); }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.post('/ai/chat', { message: userMsg.content, history: messages.slice(-8) });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I had trouble responding. Please try again.' }]); }
    finally { setChatLoading(false); }
  };

  return (
    <div className="page-wide animate-fade" style={{ padding: '32px' }}>
      <div className="page-hero" style={{ marginBottom: '28px' }}>
        <h1 className="page-title" style={{ marginBottom: '6px' }}>🤖 Career AI</h1>
        <p style={{ color: 'var(--text-secondary)' }}>AI-powered career guidance — personalized roadmaps, skill plans, and instant advice.</p>
      </div>

      <motion.div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {[{ id: 'generator', label: '🎯 Career Path Generator' }, { id: 'chat', label: '💬 CareerBot Chat' }].map(t => (
          <motion.button key={t.id} onClick={() => setTab(t.id)} className="btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ background: tab === t.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)', color: tab === t.id ? 'var(--accent-light)' : 'var(--text-secondary)', border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}` }}>{t.label}</motion.button>
        ))}
      </motion.div>

      {tab === 'generator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
          <div className="card card-p" style={{ position: 'sticky', top: 'calc(var(--navbar-h) + 16px)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Your Profile</h3>
            <div className="flex-col gap-16">
              <div className="form-group">
                <label className="label">Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {SKILLS_LIST.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)} className="tag" style={{ cursor: 'pointer', background: skills.includes(s) ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.06)', border: `1px solid ${skills.includes(s) ? 'var(--accent)' : 'rgba(124,58,237,0.12)'}`, fontSize: '12px' }}>
                      {skills.includes(s) ? '✓ ' : ''}{s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="label">Career Interests</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {['Full Stack', 'Data Science', 'AI/ML', 'DevOps', 'Product', 'Design', 'Finance', 'Cybersecurity'].map(s => (
                    <button key={s} type="button" onClick={() => toggleInterest(s)} className="tag tag-cyan" style={{ cursor: 'pointer', background: interests.includes(s) ? 'rgba(6,182,212,0.25)' : 'rgba(6,182,212,0.06)', border: `1px solid ${interests.includes(s) ? 'var(--info)' : 'rgba(6,182,212,0.15)'}`, fontSize: '12px' }}>
                      {interests.includes(s) ? '✓ ' : ''}{s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="label">Goal</label>
                <textarea className="input" placeholder="e.g. Get a SWE role at Google..." value={goals} onChange={e => setGoals(e.target.value)} style={{ minHeight: '70px' }} />
              </div>
              <div className="form-group">
                <label className="label">Timeline</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {TIMELINES.map(t => (
                    <button key={t} onClick={() => setTimeline(t)} className="tag" style={{ cursor: 'pointer', background: timeline === t ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.06)', border: `1px solid ${timeline === t ? 'var(--accent)' : 'rgba(124,58,237,0.12)'}`, fontSize: '12px', padding: '6px 12px' }}>{t}</button>
                  ))}
                </div>
              </div>
              <motion.button onClick={handleGenerate} disabled={loading} className="btn btn-primary btn-full" whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                {loading ? <><span className="spinner spinner-sm" /> Generating…</> : '✨ Generate My Career Path'}
              </motion.button>
            </div>
          </div>

          <div>
            <AnimatePresence mode="wait">
              {!careerData && !loading ? (
                <motion.div key="empty" className="empty-state card card-p" style={{ minHeight: '400px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.span style={{ fontSize: '64px', marginBottom: '12px', display: 'block' }} animate={{ y: [0, -14, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>🤖</motion.span>
                  <h3>Your AI Career Report</h3>
                  <p style={{ maxWidth: '340px', marginTop: '8px', fontSize: '14px', lineHeight: 1.7 }}>Pick your skills, set a goal, and let the AI craft a personalized roadmap — career paths, skill gaps, projects & more.</p>
                  <motion.div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--accent-light)', fontWeight: 600 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>← Start by selecting skills</motion.div>
                </motion.div>
              ) : loading ? (
                <motion.div key="loading" className="card card-p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AILoadingStepper />
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <CareerPathResults data={careerData} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {messages.map((m, i) => <ChatMessage key={i} msg={m} index={i} />)}
            <AnimatePresence>
              {chatLoading && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0,1,2].map(i => <motion.span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-light)', display: 'block' }} animate={{ y: [0,-5,0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i*0.15 }} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
            <input className="input" placeholder="Ask about career paths, interviews, salary, skills…" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()} style={{ flex: 1 }} />
            <motion.button onClick={handleChat} disabled={!chatInput.trim() || chatLoading} className="btn btn-primary" whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.94 }}>Send ➤</motion.button>
          </div>
          <div style={{ padding: '10px 24px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['How to prepare for FAANG interviews?', 'Best skills to learn in 2025?', 'How to negotiate salary?'].map(q => (
              <button key={q} onClick={() => { setChatInput(q); }} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>{q}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
