import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LogIn, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

/* ══════════════════════════════════════
   ANIMATED MESH BACKGROUND
══════════════════════════════════════ */
const MeshBg = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
    {/* Base */}
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0a0b1a 0%, #0d0f22 50%, #0a0b1a 100%)' }} />
    {/* Grid */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)`,
      backgroundSize: '50px 50px',
    }} />
    {/* Glow orbs */}
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.55, 0.35] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '70%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 65%)', filter: 'blur(40px)' }} />
    <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 65%)', filter: 'blur(50px)' }} />
    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      style={{ position: 'absolute', top: '30%', right: '20%', width: '40%', height: '40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 65%)', filter: 'blur(50px)' }} />
    {/* Scan line */}
    <motion.div animate={{ y: ['-5%', '105%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
      style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)', filter: 'blur(1px)' }} />
    {/* Corner accents */}
    {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h], i) => (
      <motion.div key={i} animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
        style={{
          position: 'absolute', [v]: 24, [h]: 24, width: 20, height: 20, pointerEvents: 'none',
          borderTop: v === 'top' ? '1px solid rgba(99,102,241,0.5)' : 'none',
          borderBottom: v === 'bottom' ? '1px solid rgba(99,102,241,0.5)' : 'none',
          borderLeft: h === 'left' ? '1px solid rgba(99,102,241,0.5)' : 'none',
          borderRight: h === 'right' ? '1px solid rgba(99,102,241,0.5)' : 'none',
        }} />
    ))}
  </div>
);

/* ══════════════════════════════════════
   FLOATING CAMPUS LIFE ITEMS
══════════════════════════════════════ */
const ITEMS = [
  { emoji: '📚', x: 7, y: 12, dur: 7, delay: 0, size: 1.5 },
  { emoji: '🎒', x: 87, y: 8, dur: 9, delay: 1, size: 1.3 },
  { emoji: '🍕', x: 18, y: 68, dur: 8, delay: 2, size: 1.1 },
  { emoji: '🚗', x: 78, y: 72, dur: 10, delay: 0.5, size: 1.4 },
  { emoji: '☕', x: 52, y: 6, dur: 6, delay: 3, size: 1.0 },
  { emoji: '🎧', x: 91, y: 42, dur: 11, delay: 1.5, size: 1.2 },
  { emoji: '💻', x: 4, y: 48, dur: 8, delay: 2.5, size: 1.3 },
  { emoji: '🍜', x: 44, y: 88, dur: 7, delay: 2, size: 1.1 },
  { emoji: '🎓', x: 32, y: 92, dur: 6, delay: 4, size: 1.4 },
  { emoji: '📱', x: 82, y: 28, dur: 8, delay: 3.5, size: 1.1 },
];

const FloatingItems = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
    {ITEMS.map((item, i) => (
      <motion.div key={i}
        animate={{ y: [0, -16, 0], rotate: [0, i % 2 === 0 ? 8 : -8, 0], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: item.dur, delay: item.delay, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', left: `${item.x}%`, top: `${item.y}%`,
          fontSize: `${item.size}rem`, userSelect: 'none',
          filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.4))',
        }}>{item.emoji}</motion.div>
    ))}
  </div>
);

/* ══════════════════════════════════════
   HOLOGRAPHIC LOGO CARD
══════════════════════════════════════ */
const HoloLogo = () => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });
  const ref = useRef(null);

  return (
    <motion.div ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', perspective: 600, display: 'inline-block', marginBottom: '2rem' }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect();
        if (r) { mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.9rem',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20, padding: '0.9rem 1.4rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 40px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Shimmer */}
        <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Icon */}
        <motion.div animate={{ boxShadow: ['0 0 10px rgba(99,102,241,0.5)', '0 0 24px rgba(99,102,241,0.9)', '0 0 10px rgba(99,102,241,0.5)'] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: 900, color: '#fff',
            fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.02em',
          }}>CC</motion.div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.3rem', color: '#fff', letterSpacing: '0.06em', lineHeight: 1, textShadow: '0 0 20px rgba(99,102,241,0.5)' }}>
            CAMPUS<span style={{ color: 'rgba(255,255,255,0.5)' }}>CONNECT</span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace', marginTop: 2 }}>
            Student Life Platform
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   FEATURE PILL
══════════════════════════════════════ */
const Pill = ({ emoji, label, color, delay }) => (
  <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    whileHover={{ scale: 1.08, y: -2 }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      background: `${color}12`, border: `1px solid ${color}33`,
      borderRadius: 99, padding: '0.35rem 0.85rem',
      fontSize: '0.78rem', color: '#fff',
      fontFamily: 'monospace', cursor: 'default',
      boxShadow: `0 0 12px ${color}22`,
      backdropFilter: 'blur(8px)',
    }}>{emoji} {label}</motion.div>
);

/* ══════════════════════════════════════
   INPUT FIELD
══════════════════════════════════════ */
const Field = ({ id, label, type, placeholder, value, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
      {label}
    </label>
    <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
        padding: '0.75rem 1rem', color: '#fff',
        fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
        outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', phone: '', address: '', upiId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/rooms');
      } else {
        const ok = await register({ name: formData.username, email: formData.email, password: formData.password, phone: formData.phone, address: formData.address, upiId: formData.upiId });
        if (ok) { setSuccess('Account created! Please log in.'); setIsLogin(true); }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const loginFields = [
    { id: 'email', label: 'University Email', type: 'email', placeholder: 'you@university.edu' },
    { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••••' },
  ];
  const signupFields = [
    { id: 'username', label: 'Full Name', type: 'text', placeholder: 'Your name' },
    { id: 'email', label: 'University Email', type: 'email', placeholder: 'you@university.edu' },
    { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••••' },
    { id: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
    { id: 'address', label: 'Hostel / Address', type: 'text', placeholder: 'Block B, Room 204' },
    { id: 'upiId', label: 'UPI ID (optional)', type: 'text', placeholder: 'name@upi' },
  ];
  const fields = isLogin ? loginFields : signupFields;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0b1a; }
        input[type="datetime-local"] { color-scheme: dark; }
        ::placeholder { color: rgba(255,255,255,0.18) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <MeshBg />
        <FloatingItems />

        {/* ── LEFT PANEL ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="left-panel"
          style={{
            flex: '0 0 48%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '4rem 3.5rem',
            position: 'relative', zIndex: 2,
          }}
        >
          <HoloLogo />

          {/* Hero text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 'clamp(3rem, 4.5vw, 5.5rem)',
              color: '#fff', lineHeight: 0.92, letterSpacing: '0.02em',
              textShadow: '0 0 60px rgba(99,102,241,0.25)',
              marginBottom: '1.25rem',
            }}>
            CAMPUS<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #f97316, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              LIFE
            </span><br />
            TOGETHER
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: 340 }}>
            Split food orders, share rides, and stop overpaying — designed for students who actually use it.
          </motion.p>

          {/* Feature pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
            <Pill emoji="🍕" label="Group Orders" color="#f97316" delay={0.55} />
            <Pill emoji="🚗" label="Shared Rides" color="#3b82f6" delay={0.65} />
            <Pill emoji="🤖" label="AI Invoice" color="#818cf8" delay={0.75} />
            <Pill emoji="💬" label="Live Chat" color="#22c55e" delay={0.85} />
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            style={{
              display: 'flex', gap: '0', borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: '1.75rem',
            }}>
            {[['₹0', 'Platform Fee'], ['AI', 'Powered'], ['Real-time', 'Updates']].map(([val, sub], i) => (
              <motion.div key={sub} whileHover={{ y: -3 }}
                style={{ flex: 1, paddingRight: i < 2 ? '1.5rem' : 0, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none', marginRight: i < 2 ? '1.5rem' : 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.4rem', color: '#fff', letterSpacing: '0.04em', textShadow: '0 0 12px rgba(99,102,241,0.4)' }}>{val}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', position: 'relative', zIndex: 2, overflowY: 'auto',
        }}>
          {/* Divider glow */}
          <div style={{
            position: 'absolute', left: 0, top: '10%', bottom: '10%', width: 1,
            background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.3), transparent)',
          }} />

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            {/* Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 28, padding: '2.25rem',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 0 80px rgba(99,102,241,0.08), 0 40px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Card top glow */}
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)' }} />

              {/* Tab switcher */}
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.04)',
                borderRadius: 14, padding: 3, marginBottom: '1.75rem',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {['Login', 'Sign Up'].map((label, i) => (
                  <motion.button key={label}
                    onClick={() => { setIsLogin(i === 0); setError(''); setSuccess(''); }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: 11, border: 'none', cursor: 'pointer',
                      fontFamily: "'Bebas Neue', cursive", fontWeight: 700, fontSize: '0.85rem',
                      letterSpacing: '0.1em', transition: 'all 0.22s',
                      background: isLogin === (i === 0) ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: isLogin === (i === 0) ? '#818cf8' : 'rgba(255,255,255,0.3)',
                      boxShadow: isLogin === (i === 0) ? '0 0 16px rgba(99,102,241,0.25)' : 'none',
                      textShadow: isLogin === (i === 0) ? '0 0 10px rgba(129,140,248,0.6)' : 'none',
                    }}>{label}</motion.button>
                ))}
              </div>

              {/* Heading */}
              <AnimatePresence mode="wait">
                <motion.div key={isLogin ? 'hl' : 'hs'}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                  style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', color: '#fff', letterSpacing: '0.05em', lineHeight: 1, textShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
                    {isLogin ? 'WELCOME BACK 👋' : 'JOIN THE CAMPUS'}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: '0.4rem', fontFamily: 'monospace' }}>
                    {isLogin ? 'Pick up where you left off.' : 'Create your account in seconds.'}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form key={isLogin ? 'fl' : 'fs'}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.22 }}
                  onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {fields.map(f => <Field key={f.id} {...f} value={formData[f.id]} onChange={handleChange} />)}
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ marginTop: '1rem', padding: '0.7rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, fontSize: '0.82rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        ⚠ {error}
                      </motion.div>
                    )}
                    {success && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ marginTop: '1rem', padding: '0.7rem 1rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, fontSize: '0.82rem', color: '#4ade80' }}>
                        ✓ {success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', marginTop: '1.5rem', padding: '0.9rem',
                      background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff', border: 'none', borderRadius: 14,
                      fontFamily: "'Bebas Neue', cursive", fontWeight: 700,
                      fontSize: '1rem', letterSpacing: '0.1em',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      boxShadow: loading ? 'none' : '0 4px 24px rgba(99,102,241,0.45)',
                    }}>
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Loader2 size={18} />
                      </motion.div>
                    ) : isLogin ? (
                      <><LogIn size={15} /> LOGIN <ArrowRight size={15} /></>
                    ) : (
                      <><UserPlus size={15} /> CREATE ACCOUNT <ArrowRight size={15} /></>
                    )}
                  </motion.button>

                  <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                    {isLogin ? "No account? " : "Have an account? "}
                    <motion.button type="button" whileHover={{ scale: 1.05 }}
                      onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', fontWeight: 600, fontSize: '0.78rem', padding: 0, fontFamily: 'monospace', textShadow: '0 0 8px rgba(129,140,248,0.5)' }}>
                      {isLogin ? 'Sign up →' : 'Log in →'}
                    </motion.button>
                  </p>
                </motion.form>
              </AnimatePresence>
            </div>

            {/* Below card tagline */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              ✦ BUILT FOR STUDENTS · POWERED BY AI ✦
            </motion.p>
          </motion.div>
        </div>

        {/* Mobile hide left panel */}
        <style>{`
          @media (max-width: 720px) { .left-panel { display: none !important; } }
        `}</style>
      </div>
    </>
  );
};

export default LoginPage;