import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, ArrowRight, Loader2, Sun, Moon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ─── Floating student-life icons ─── */
const ITEMS = [
  { emoji: '📚', x: 8,  y: 15, dur: 6,  delay: 0,   size: 1.6 },
  { emoji: '🎒', x: 88, y: 10, dur: 8,  delay: 1,   size: 1.4 },
  { emoji: '🍕', x: 20, y: 70, dur: 7,  delay: 2,   size: 1.2 },
  { emoji: '🚗', x: 75, y: 75, dur: 9,  delay: 0.5, size: 1.5 },
  { emoji: '☕', x: 50, y: 8,  dur: 5,  delay: 3,   size: 1.1 },
  { emoji: '🎧', x: 92, y: 45, dur: 10, delay: 1.5, size: 1.3 },
  { emoji: '💻', x: 5,  y: 50, dur: 7,  delay: 2.5, size: 1.4 },
  { emoji: '🏫', x: 60, y: 85, dur: 8,  delay: 0.8, size: 1.6 },
  { emoji: '🎓', x: 35, y: 90, dur: 6,  delay: 4,   size: 1.5 },
  { emoji: '🧃', x: 15, y: 35, dur: 9,  delay: 1.2, size: 1.0 },
  { emoji: '📱', x: 80, y: 30, dur: 7,  delay: 3.5, size: 1.2 },
  { emoji: '🍜', x: 45, y: 20, dur: 11, delay: 2,   size: 1.1 },
];

const FloatingItems = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {ITEMS.map((item, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${item.x}%`,
          top: `${item.y}%`,
          fontSize: `${item.size}rem`,
          opacity: 0.13,
          animation: `floatUp ${item.dur}s ${item.delay}s ease-in-out infinite alternate`,
          filter: 'blur(0.3px)',
          userSelect: 'none',
        }}
      >
        {item.emoji}
      </div>
    ))}
  </div>
);

/* ─── Shining CC Logo ─── */
const ShiningLogo = () => {
  const shimRef = useRef(null);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem' }}>
      {/* Logo mark */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 52, height: 52,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 100%)',
          border: '1.5px solid rgba(255,255,255,0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900,
          fontSize: '1.25rem',
          color: '#fff',
          letterSpacing: '-0.04em',
          fontFamily: "'Syne', 'Clash Display', system-ui, sans-serif",
          boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}>
          CC
          {/* Shine sweep */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'shine 3s ease-in-out infinite',
            borderRadius: 'inherit',
          }} />
        </div>
        {/* Glow ring */}
        <div style={{
          position: 'absolute', inset: -4,
          borderRadius: 20,
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          animation: 'pulse-glow 3s ease-in-out infinite',
        }} />
      </div>

      {/* Wordmark */}
      <div>
        <div style={{
          fontFamily: "'Syne', 'Clash Display', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: '1.4rem',
          color: '#fff',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          Campus<span style={{ opacity: 0.7 }}>Connect</span>
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
          marginTop: 2,
        }}>
          Student Life Platform
        </div>
      </div>
    </div>
  );
};

/* ─── Feature pill ─── */
const Pill = ({ emoji, label, delay }) => (
  <motion.span
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      background: 'rgba(255,255,255,0.15)',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: 99,
      padding: '0.3rem 0.85rem',
      fontSize: '0.8rem',
      color: '#fff',
      fontFamily: "'DM Mono', monospace",
      backdropFilter: 'blur(6px)',
    }}
  >
    {emoji} {label}
  </motion.span>
);

/* ─── Input field ─── */
const Field = ({ id, label, type, placeholder, value, onChange }) => (
  <div>
    <label style={{
      display: 'block',
      fontSize: '0.78rem',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: '0.35rem',
      fontFamily: "'Syne', system-ui, sans-serif",
      letterSpacing: '0.02em',
    }}>{label}</label>
    <input
      id={id} type={type} placeholder={placeholder}
      value={value} onChange={onChange}
      className="input"
      style={{ width: '100%', boxSizing: 'border-box' }}
    />
  </div>
);

/* ─── Main component ─── */
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '',
    phone: '', address: '', defaultUpi: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useContext(AuthContext);
  const { theme, toggle, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const doToggle = toggle || toggleTheme;

  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/rooms');
      } else {
        const ok = await register({
          name: formData.username, email: formData.email,
          password: formData.password, phone: formData.phone,
          address: formData.address, defaultUpi: formData.defaultUpi,
        });
        if (ok) { alert('Registration successful! Please log in.'); setIsLogin(true); }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const loginFields = [
    { id: 'email',    label: 'University Email', type: 'email',    placeholder: 'you@university.edu' },
    { id: 'password', label: 'Password',         type: 'password', placeholder: '••••••••••' },
  ];

  const signupFields = [
    { id: 'username',   label: 'Full Name',          type: 'text',     placeholder: 'Your name' },
    { id: 'email',      label: 'University Email',   type: 'email',    placeholder: 'you@university.edu' },
    { id: 'password',   label: 'Password',           type: 'password', placeholder: '••••••••••' },
    { id: 'phone',      label: 'Phone',              type: 'tel',      placeholder: '+91 98765 43210' },
    { id: 'address',    label: 'Hostel / Address',   type: 'text',     placeholder: 'Block B, Room 204' },
    { id: 'defaultUpi', label: 'UPI ID (optional)',  type: 'text',     placeholder: 'name@upi' },
  ];

  const fields = isLogin ? loginFields : signupFields;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Theme toggle */}
      <button
        className="btn-ghost"
        onClick={doToggle}
        style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 50 }}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {/* ── Left panel ── */}
      <div
        className="cc-left-panel"
        style={{
          flex: '0 0 46%',
          background: 'linear-gradient(155deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background blobs */}
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
          top: '-100px', right: '-100px',
          animation: 'blobMove 8s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
          bottom: '-80px', left: '-60px',
          animation: 'blobMove 10s ease-in-out infinite alternate-reverse',
        }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Floating emojis */}
        <FloatingItems />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          <ShiningLogo />

          <h1 style={{
            fontFamily: "'Syne', 'Clash Display', system-ui, sans-serif",
            fontSize: 'clamp(1.9rem, 3.2vw, 2.8rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}>
            Campus life,<br />
            <span style={{
              background: 'linear-gradient(90deg, #fbbf24, #f9a8d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              better together.
            </span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.72)',
            fontSize: '0.97rem',
            lineHeight: 1.65,
            marginBottom: '2rem',
            maxWidth: 320,
          }}>
            Split food orders, share rides, and stop overpaying —
            designed for students who actually use it.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Pill emoji="🍕" label="Group Orders"   delay={0.3} />
            <Pill emoji="🚗" label="Shared Rides"   delay={0.45} />
            <Pill emoji="🤖" label="AI Invoice"     delay={0.6} />
            <Pill emoji="💬" label="Live Chat"      delay={0.75} />
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: '2rem', marginTop: '2.5rem',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: '1.5rem',
          }}>
            {[['₹0', 'Platform fee'], ['AI', 'Powered'], ['Real-time', 'Updates']].map(([val, sub]) => (
              <div key={sub}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{val}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Mono', monospace" }}>{sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflowY: 'auto',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}>
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.4,
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
        >
          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            borderRadius: 14,
            padding: 4,
            marginBottom: '2rem',
            border: '1px solid var(--border)',
          }}>
            {['Login', 'Sign Up'].map((label, i) => (
              <button
                key={label}
                onClick={() => { setIsLogin(i === 0); setError(''); }}
                style={{
                  flex: 1, padding: '0.65rem',
                  borderRadius: 11, border: 'none', cursor: 'pointer',
                  fontFamily: "'Syne', system-ui, sans-serif",
                  fontWeight: 700, fontSize: '0.88rem',
                  transition: 'all 0.22s ease',
                  background: isLogin === (i === 0) ? 'var(--bg-card)' : 'transparent',
                  color: isLogin === (i === 0) ? 'var(--accent)' : 'var(--text-secondary)',
                  boxShadow: isLogin === (i === 0) ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'h-login' : 'h-signup'}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            >
              <h2 style={{
                fontFamily: "'Syne', system-ui, sans-serif",
                fontSize: '1.65rem', fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)', marginBottom: '0.25rem',
              }}>
                {isLogin ? 'Welcome back 👋' : 'Join the campus'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
                {isLogin ? 'Pick up where you left off.' : 'Create your account in seconds.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'f-login' : 'f-signup'}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {fields.map(f => (
                  <Field key={f.id} {...f} value={formData[f.id]} onChange={handleChange} />
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: '1rem', padding: '0.65rem 1rem',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10, fontSize: '0.85rem',
                    color: '#ef4444',
                  }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.975 }}
                style={{
                  width: '100%', marginTop: '1.5rem',
                  padding: '0.9rem',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontFamily: "'Syne', system-ui, sans-serif",
                  fontWeight: 700, fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                  transition: 'box-shadow 0.2s',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : isLogin ? (
                  <><LogIn size={16} /> Login <ArrowRight size={16} /></>
                ) : (
                  <><UserPlus size={16} /> Create Account <ArrowRight size={16} /></>
                )}
              </motion.button>

              <p style={{
                marginTop: '1.25rem', textAlign: 'center',
                fontSize: '0.82rem', color: 'var(--text-muted)',
              }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', fontWeight: 600, fontSize: '0.82rem', padding: 0 }}
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes floatUp {
          0%   { transform: translateY(0px) rotate(0deg); }
          50%  { transform: translateY(-18px) rotate(4deg); }
          100% { transform: translateY(-6px) rotate(-3deg); }
        }

        @keyframes shine {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.08); }
        }

        @keyframes blobMove {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 20px) scale(1.08); }
        }

        @media (max-width: 720px) {
          .cc-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;