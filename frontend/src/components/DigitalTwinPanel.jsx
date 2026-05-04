import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

// ─── SVG Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ values = [], color = '#a78bfa', height = 48, width = 200 }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.07;
    return `${x},${y}`;
  });
  const pathD = 'M ' + pts.join(' L ');
  const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3.5" fill={color} />
    </svg>
  );
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function AnimCount({ to, duration = 1000, suffix = '' }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);
  return <>{val}{suffix}</>;
}

// ─── Confidence Ring ───────────────────────────────────────────────────────────
function ConfidenceRing({ score = 75 }) {
  const r = 26, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <motion.circle
        cx="34" cy="34" r={r} fill="none"
        stroke="url(#confGrad)" strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '34px 34px' }}
      />
      <defs>
        <linearGradient id="confGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <text x="34" y="34" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill="#f1f5f9">
        {score}%
      </text>
    </svg>
  );
}

// ─── Delta chip ────────────────────────────────────────────────────────────────
function Delta({ curr, proj, suffix = '' }) {
  const diff = proj - curr;
  const isUp = diff >= 0;
  return (
    <span className={`twin-delta ${isUp ? 'twin-delta--up' : 'twin-delta--down'}`}>
      {isUp ? '▲' : '▼'} {Math.abs(diff)}{suffix}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TwinSkeleton() {
  return (
    <div className="twin-panel card">
      <div className="twin-header">
        <div className="skeleton-shimmer" style={{ width: 160, height: 20, borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ width: 90, height: 26, borderRadius: 100 }} />
      </div>
      <div className="twin-metrics-row">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-shimmer" style={{ height: 90, borderRadius: 12, flex: 1 }} />
        ))}
      </div>
      <div className="skeleton-shimmer" style={{ height: 110, borderRadius: 12, marginTop: 16 }} />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DigitalTwinPanel() {
  const [twin, setTwin]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [activeDay, setActiveDay] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await api.get('/ai/digital-twin');
      if (res.data?.success) setTwin(res.data.data);
      else setError(true);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <TwinSkeleton />;
  if (error) return (
    <div className="twin-panel card twin-error">
      <span style={{ fontSize: 36 }}>🤖</span>
      <p>Couldn't load Digital Twin</p>
      <button className="btn btn-ghost btn-sm" onClick={fetch}>Retry</button>
    </div>
  );
  if (!twin) return null;

  const { currentMetrics: cur, projections: proj, dailyForecast, milestones, narrative, trendLabel, confidenceScore } = twin;
  const xpValues    = dailyForecast.map(d => d.xpTotal);
  const maxXpGain   = Math.max(...dailyForecast.map(d => d.xpGain));
  const hoveredDay  = activeDay !== null ? dailyForecast[activeDay] : null;

  const metrics = [
    { key: 'xp',             label: 'XP',              icon: '⭐', curr: cur.xp,             proj: proj.xp,             color: '#f59e0b', suffix: '' },
    { key: 'connections',    label: 'Connections',     icon: '🤝', curr: cur.connections,    proj: proj.connections,    color: '#06b6d4', suffix: '' },
    { key: 'profileStrength',label: 'Profile',         icon: '✨', curr: cur.profileStrength, proj: proj.profileStrength, color: '#a78bfa', suffix: '%' },
    { key: 'jobReadiness',   label: 'Job Readiness',   icon: '🚀', curr: cur.jobReadiness,   proj: proj.jobReadiness,   color: '#10b981', suffix: '%' },
  ];

  return (
    <motion.div
      className="twin-panel card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      {/* Ambient orb */}
      <div className="twin-bg-orb" aria-hidden />

      {/* ── Header ── */}
      <div className="twin-header">
        <div className="twin-header-left">
          <span className="twin-icon">🧬</span>
          <div>
            <h2 className="twin-title">Digital Twin</h2>
            <p className="twin-subtitle">If you continue this pattern, here's your next 7 days</p>
          </div>
        </div>
        <div className="twin-header-right">
          <span className="twin-trend-badge">{trendLabel}</span>
        </div>
      </div>

      {/* ── Narrative ── */}
      <motion.div
        className="twin-narrative"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      >
        <span className="twin-narrative-icon">💬</span>
        <p>{narrative}</p>
      </motion.div>

      {/* ── Metric cards ── */}
      <div className="twin-metrics-row">
        {metrics.map(({ key, label, icon, curr: c, proj: p, color, suffix }, i) => (
          <motion.div
            key={key}
            className="twin-metric-card"
            style={{ '--tm-color': color }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 320, damping: 26 }}
            whileHover={{ y: -3 }}
          >
            <div className="twin-metric-icon">{icon}</div>
            <div className="twin-metric-curr" style={{ color }}>
              <AnimCount to={p} duration={900 + i * 100} suffix={suffix} />
            </div>
            <div className="twin-metric-label">{label}</div>
            <Delta curr={c} proj={p} suffix={suffix} />
          </motion.div>
        ))}
      </div>

      {/* ── 7-Day Bar Chart ── */}
      <div className="twin-chart-section">
        <div className="twin-chart-header">
          <span className="twin-chart-label">Daily XP Forecast</span>
          <AnimatePresence mode="wait">
            {hoveredDay && (
              <motion.span
                key={hoveredDay.day}
                className="twin-hover-info"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
              >
                {hoveredDay.label} {hoveredDay.date} — <strong>+{hoveredDay.xpGain} XP</strong>
                {hoveredDay.connGain > 0 && <span className="twin-conn-pill">+1 🤝</span>}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="twin-bars">
          {dailyForecast.map((day, i) => {
            const pct = maxXpGain > 0 ? (day.xpGain / maxXpGain) * 100 : 20;
            const hasMilestone = milestones.some(m => m.day === day.day);
            return (
              <div
                key={day.day}
                className={`twin-bar-col ${activeDay === i ? 'twin-bar-col--active' : ''} ${hasMilestone ? 'twin-bar-col--milestone' : ''}`}
                onMouseEnter={() => setActiveDay(i)}
                onMouseLeave={() => setActiveDay(null)}
              >
                {hasMilestone && <span className="twin-milestone-flag">🏁</span>}
                <div className="twin-bar-wrap">
                  <motion.div
                    className="twin-bar"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.35 + i * 0.06, type: 'spring', stiffness: 280, damping: 22 }}
                    style={{ height: `${Math.max(pct, 12)}%` }}
                  />
                </div>
                <span className="twin-bar-label">{day.label}</span>
                <span className="twin-bar-xp">+{day.xpGain}</span>
              </div>
            );
          })}
        </div>

        {/* Sparkline XP Trajectory */}
        <div className="twin-sparkline-wrap">
          <Sparkline values={xpValues} color="#a78bfa" height={44} width={600} />
        </div>
        <div className="twin-sparkline-legend">
          <span className="twin-sparkline-dot" />
          <span>XP trajectory by Day 7: <strong style={{ color: '#a78bfa' }}>{proj.xp} XP</strong></span>
        </div>
      </div>

      {/* ── Milestones ── */}
      {milestones.length > 0 && (
        <div className="twin-milestones">
          <span className="twin-milestones-label">🏁 Upcoming Milestones</span>
          <div className="twin-milestones-row">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                className="twin-milestone-chip"
                style={{ '--mc': m.color }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.08, type: 'spring', stiffness: 420, damping: 24 }}
              >
                <span className="twin-milestone-day">Day {m.day}</span>
                <span className="twin-milestone-text">{m.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer: Confidence ── */}
      <div className="twin-footer">
        <div className="twin-confidence">
          <ConfidenceRing score={confidenceScore} />
          <div>
            <div className="twin-conf-title">Prediction Confidence</div>
            <div className="twin-conf-sub">Based on your profile completeness &amp; activity history</div>
          </div>
        </div>
        <div className="twin-footer-note">
          Refreshes daily · Powered by trend analysis
        </div>
      </div>
    </motion.div>
  );
}
