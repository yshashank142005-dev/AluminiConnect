import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const CATEGORY_META = {
  networking: { label: 'Networking',  color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)'  },
  skills:     { label: 'Skills',      color: '#a78bfa', bg: 'rgba(124,58,237,0.1)',   border: 'rgba(124,58,237,0.25)' },
  profile:    { label: 'Profile',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)' },
  jobs:       { label: 'Jobs',        color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)' },
  mentorship: { label: 'Mentorship',  color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.25)' },
  events:     { label: 'Events',      color: '#ec4899', bg: 'rgba(236,72,153,0.1)',   border: 'rgba(236,72,153,0.25)' },
};

/** Formats today's date nicely, e.g. "Monday, May 5" */
const formatDate = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

/** Animated XP chip that counts up */
function XpChip({ xp }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 600); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      className="coach-xp-chip"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={shown ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    >
      <span className="coach-xp-chip-icon">⚡</span>
      +{xp} XP
    </motion.div>
  );
}

/** Skeleton placeholder while loading */
function CoachSkeleton() {
  return (
    <div className="daily-coach-card card">
      <div className="coach-header">
        <div className="skeleton-shimmer" style={{ width: 120, height: 14, borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ width: 72, height: 22, borderRadius: 100 }} />
      </div>
      <div className="coach-body">
        <div className="skeleton-shimmer" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton-shimmer" style={{ width: '80%', height: 18, borderRadius: 6 }} />
          <div className="skeleton-shimmer" style={{ width: '60%', height: 13, borderRadius: 6 }} />
        </div>
      </div>
      <div className="coach-footer">
        <div className="skeleton-shimmer" style={{ width: 110, height: 36, borderRadius: 10 }} />
        <div className="skeleton-shimmer" style={{ width: 60, height: 22, borderRadius: 100 }} />
      </div>
    </div>
  );
}

export default function DailyCoachWidget() {
  const [tip, setTip]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [done, setDone]       = useState(false);   // user marked action done
  const [flipped, setFlipped] = useState(false);   // card-flip for "done" state

  const fetchCoach = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/ai/daily-coach');
      if (res.data?.success) {
        setTip(res.data.data);
        // Restore "done" state from localStorage (per-day)
        const today = new Date().toISOString().slice(0, 10);
        const key = `coach-done-${today}`;
        if (localStorage.getItem(key) === 'true') setDone(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoach(); }, [fetchCoach]);

  const handleDone = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`coach-done-${today}`, 'true');
    setFlipped(true);
    setTimeout(() => setDone(true), 350);
  };

  if (loading) return <CoachSkeleton />;

  if (error) {
    return (
      <div className="daily-coach-card card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 24px', gap: 12, textAlign: 'center' }}>
        <span style={{ fontSize: 32 }}>🤖</span>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Couldn't load today's action.</p>
        <button className="btn btn-ghost btn-sm" onClick={fetchCoach}>Try again</button>
      </div>
    );
  }

  if (!tip) return null;

  const meta = CATEGORY_META[tip.category] || CATEGORY_META.networking;

  return (
    <motion.div
      className="daily-coach-card card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{ '--coach-accent': meta.color, '--coach-bg': meta.bg, '--coach-border': meta.border }}
    >
      {/* Glow orb */}
      <div className="coach-glow-orb" aria-hidden />

      {/* Header row */}
      <div className="coach-header">
        <div className="coach-date-label">
          <span className="coach-date-icon">📅</span>
          {formatDate()}
        </div>
        <span className="coach-category-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
          {meta.label}
        </span>
      </div>

      {/* Section title */}
      <div className="coach-title-row">
        <span className="coach-spark-icon">🧠</span>
        <span className="coach-section-label">AI Daily Coach</span>
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="active" initial={{ opacity: 1 }} exit={{ opacity: 0, rotateY: 90 }} transition={{ duration: 0.3 }}>
            <div className="coach-body">
              {/* Emoji orb */}
              <motion.div
                className="coach-emoji-orb"
                style={{ background: meta.bg, border: `2px solid ${meta.border}` }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span style={{ fontSize: 26 }}>{tip.emoji}</span>
              </motion.div>

              <div className="coach-text">
                <p className="coach-action">{tip.action}</p>
                <p className="coach-why">{tip.why}</p>
              </div>
            </div>

            {/* Progress dots — visual "streak" hint */}
            <div className="coach-streak-dots" aria-hidden>
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`coach-streak-dot ${i < 3 ? 'filled' : ''}`} />
              ))}
            </div>

            {/* Footer */}
            <div className="coach-footer">
              <Link to={tip.link} className="btn btn-primary btn-sm coach-action-btn">
                Do it now →
              </Link>
              <button className="coach-done-btn" onClick={handleDone} title="Mark as done">
                ✓ Done
              </button>
              <XpChip xp={tip.xpReward} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            className="coach-done-state"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <motion.div
              className="coach-done-ring"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
            >
              ✅
            </motion.div>
            <p className="coach-done-title">Action Complete!</p>
            <p className="coach-done-sub">+{tip.xpReward} XP added. Come back tomorrow for a new challenge.</p>
            <div className="coach-done-badge">
              <span>🔥</span> Streak continues
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
