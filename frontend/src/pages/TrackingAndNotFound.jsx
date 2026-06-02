/* ============================================================
   TrackingPage.jsx — Campus-themed live tracking
============================================================ */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation2, Square, MapPin, Users, Wifi } from 'lucide-react';
import Navbar from '../components/Navbar';

export const TrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [pulse, setPulse] = useState(0);

  // Pulse animation when tracking
  useEffect(() => {
    if (!isTracking) return;
    const t = setInterval(() => setPulse(p => p + 1), 2000);
    return () => clearInterval(t);
  }, [isTracking]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Navbar showBack backTo={`/room/${id}`} title="Live Tracking" />

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Map placeholder with campus grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--bg-secondary)',
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.6,
        }} />

        {/* Campus road lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} aria-hidden>
          <path d="M 0 50% L 100% 50%" stroke="var(--text-muted)" strokeWidth="3" strokeDasharray="8 4" />
          <path d="M 50% 0 L 50% 100%" stroke="var(--text-muted)" strokeWidth="3" strokeDasharray="8 4" />
          <circle cx="50%" cy="50%" r="80" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
          <circle cx="50%" cy="50%" r="160" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" />
        </svg>

        {/* Tracking pulse ring */}
        {isTracking && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={`${pulse}-${i}`}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 2, delay: i * 0.6, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 40, height: 40,
                  borderRadius: '50%',
                  border: '2px solid var(--accent)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </>
        )}

        {/* Center dot */}
        <div style={{
          position: 'absolute',
          width: 14, height: 14, borderRadius: '50%',
          background: isTracking ? 'var(--accent)' : 'var(--text-muted)',
          border: '3px solid var(--bg-card)',
          boxShadow: isTracking ? '0 0 0 4px var(--accent-soft)' : 'none',
          transition: 'all 0.4s ease',
          zIndex: 2,
        }} />

        {/* Control card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card"
          style={{
            position: 'relative', zIndex: 10,
            padding: '2rem', textAlign: 'center',
            maxWidth: 340, width: '90%',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Status badge */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span className={`badge ${isTracking ? 'badge-green' : 'badge-amber'}`}>
              {isTracking ? <><Wifi size={11} /> Live</> : <><MapPin size={11} /> Idle</>}
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800,
            marginBottom: '0.5rem',
          }}>
            {isTracking ? 'Sharing Location' : 'Start Tracking'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {isTracking
              ? 'Your location is visible to group members in real time.'
              : 'Let your group know where you are for safe ride coordination.'}
          </p>

          <motion.button
            onClick={() => setIsTracking(v => !v)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: 12,
              border: 'none',
              fontFamily: 'var(--font-display)',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer',
              background: isTracking ? 'var(--accent)' : 'var(--green)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              transition: 'background 0.3s ease',
              boxShadow: isTracking
                ? '0 4px 16px rgba(200,75,49,0.3)'
                : '0 4px 16px rgba(46,125,82,0.3)',
            }}
          >
            {isTracking ? <><Square size={16} /> Stop Sharing</> : <><Navigation2 size={16} /> Share Location</>}
          </motion.button>

          {isTracking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontSize: '0.8rem', color: 'var(--text-muted)',
              }}
            >
              <Users size={13} /> Visible to all group members
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default TrackingPage;


/* ============================================================
   NotFoundPage.jsx — 404 campus themed
   (export as named export from same file for convenience)
============================================================ */
export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '2rem',
    }}>
      {/* Decorative number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(6rem, 18vw, 11rem)',
          fontWeight: 800,
          lineHeight: 1,
          color: 'var(--border)',
          letterSpacing: '-0.05em',
          userSelect: 'none',
          marginBottom: '0.25rem',
        }}
      >
        404
      </motion.div>

      {/* Campus building illustration */}
      <motion.svg
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        width="120" height="70" viewBox="0 0 120 70"
        fill="none" aria-hidden style={{ marginBottom: '1.5rem' }}
      >
        <rect x="20" y="20" width="80" height="50" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.5" rx="2" />
        <rect x="30" y="32" width="15" height="20" fill="var(--border)" rx="1" />
        <rect x="52" y="32" width="15" height="20" fill="var(--border)" rx="1" />
        <rect x="74" y="32" width="15" height="20" fill="var(--border)" rx="1" />
        <rect x="46" y="52" width="28" height="18" fill="var(--border)" rx="2" />
        <polygon points="60,0 100,20 20,20" fill="var(--accent)" opacity="0.7" />
        <rect x="58" y="0" width="4" height="10" fill="var(--accent)" opacity="0.5" />
      </motion.svg>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem', fontWeight: 800,
          marginBottom: '0.5rem',
        }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Looks like this page transferred to another campus.
        </p>
        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          style={{ padding: '0.8rem 2rem' }}
        >
          Back to Homepage
        </motion.button>
      </motion.div>
    </div>
  );
};