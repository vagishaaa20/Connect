import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LogOut, ArrowLeft, Zap } from 'lucide-react';

/* ── Holographic CC brand mark ── */
const BrandMark = () => {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), { stiffness: 300, damping: 25 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 300, damping: 25 });

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', perspective: 500 }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect();
        if (r) { mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
    >
      <motion.div
        animate={{ boxShadow: ['0 0 10px rgba(99,102,241,0.5)', '0 0 22px rgba(99,102,241,0.9)', '0 0 10px rgba(99,102,241,0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden', cursor: 'pointer',
          border: '1px solid rgba(129,140,248,0.4)',
        }}
      >
        {/* Shimmer sweep */}
        <motion.div
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Hexagon clip shape via pseudo-border */}
        <span style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: '0.92rem', fontWeight: 900, color: '#fff',
          letterSpacing: '0.04em', lineHeight: 1,
          textShadow: '0 0 10px rgba(255,255,255,0.6)',
          position: 'relative', zIndex: 1,
        }}>CC</span>
      </motion.div>
    </motion.div>
  );
};

/* ── Wordmark ── */
const Wordmark = ({ title }) => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <motion.span
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        fontFamily: "'Bebas Neue', cursive",
        fontSize: '1.05rem', letterSpacing: '0.08em', lineHeight: 1,
        color: '#fff',
        textShadow: '0 0 16px rgba(99,102,241,0.4)',
      }}
    >
      {title
        ? <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', letterSpacing: '0.12em' }}>{title}</span>
        : <>CAMPUS<span style={{ color: 'rgba(129,140,248,0.8)' }}>CONNECT</ span></>
      }
    </motion.span>
    {!title && (
      <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>
        Student Life Platform
      </span>
    )}
  </div>
);

/* ── Nav pill indicator ── */
const NavPill = ({ label, active, onClick, color = '#818cf8' }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
    style={{
      background: active ? `${color}18` : 'transparent',
      border: `1px solid ${active ? `${color}44` : 'transparent'}`,
      borderRadius: 99, padding: '0.3rem 0.8rem',
      color: active ? color : 'rgba(255,255,255,0.3)',
      fontFamily: "'Bebas Neue', cursive", fontSize: '0.72rem',
      letterSpacing: '0.1em', cursor: 'pointer',
      textShadow: active ? `0 0 8px ${color}88` : 'none',
      boxShadow: active ? `0 0 10px ${color}22` : 'none',
      transition: 'all 0.2s',
    }}
  >{label}</motion.button>
);

/* ══════════════════════════════════════
   MAIN NAVBAR
══════════════════════════════════════ */
const Navbar = ({ showBack = false, backTo = '/rooms', title = null }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(8,10,22,0.85)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(99,102,241,0.12)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top edge glow line */}
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            position: 'absolute', top: 0, left: '5%', right: '5%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(236,72,153,0.4), rgba(99,102,241,0.6), transparent)',
          }}
        />

        <div style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '0 1.5rem', height: 58,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {showBack && (
              <motion.button
                whileHover={{ x: -3, scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => navigate(backTo)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.boxShadow = '0 0 10px rgba(99,102,241,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <ArrowLeft size={15} />
              </motion.button>
            )}

            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
              onClick={() => navigate('/rooms')}
              whileHover={{ scale: 1.02 }}
            >
              <BrandMark />
              <Wordmark title={title} />
            </motion.div>
          </div>

          {/* ── CENTER NAV (only on main rooms page) ── */}
          {!showBack && !title && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <NavPill label="Rooms" active onClick={() => navigate('/rooms')} color="#818cf8" />
              <NavPill label="Rides" onClick={() => navigate('/rides')} color="#3b82f6" />
            </motion.div>
          )}

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

            {/* AI badge */}
            <motion.div
              animate={{ boxShadow: ['0 0 6px rgba(251,191,36,0.3)', '0 0 14px rgba(251,191,36,0.6)', '0 0 6px rgba(251,191,36,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: 99, padding: '0.2rem 0.6rem',
                fontSize: '0.6rem', color: '#fbbf24',
                fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em',
              }}
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                <Zap size={9} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 3px #fbbf24)' }} />
              </motion.div>
              AI
            </motion.div>

            {/* Logout */}
            {isLoggedIn && (
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                title="Logout"
                style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 10, width: 34, height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(239,68,68,0.7)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.boxShadow = '0 0 12px rgba(239,68,68,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <LogOut size={14} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Bottom scan line */}
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 6 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, width: '30%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)',
            pointerEvents: 'none',
          }}
        />
      </motion.header>
    </>
  );
};

export default Navbar;