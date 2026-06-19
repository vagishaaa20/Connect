import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Plus, Users, Utensils, Car, ChevronRight, Clock,
  Search, X, Zap, MapPin, Sparkles, CheckCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API = import.meta.env.VITE_API_URL;

/* ══════════════════════════════════════
   AMBIENT GRID BACKGROUND
══════════════════════════════════════ */
const GridBg = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    {/* Base dark */}
    <div style={{ position: 'absolute', inset: 0, background: '#05060f' }} />
    {/* Grid lines */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `
        linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
    }} />
    {/* Glow orbs */}
    <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', top: -300, left: -200, width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(60px)' }} />
    <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.14, 0.08] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      style={{ position: 'absolute', bottom: -200, right: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      style={{ position: 'absolute', top: '40%', left: '40%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)', filter: 'blur(80px)' }} />
    {/* Scan line */}
    <motion.div
      animate={{ y: ['-100%', '100vh'] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)', filter: 'blur(1px)' }}
    />
  </div>
);

/* ══════════════════════════════════════
   FLOATING PARTICLES
══════════════════════════════════════ */
const PARTICLES = ['📚', '🍕', '🚗', '☕', '🎒', '🍜', '🛵', '📖', '🥤', '🎓'];
const FloatingParticles = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
    {PARTICLES.map((emoji, i) => (
      <motion.div key={i}
        initial={{ y: '110vh', x: `${6 + i * 9}vw`, opacity: 0 }}
        animate={{ y: '-10vh', opacity: [0, 0.2, 0.2, 0] }}
        transition={{ duration: 15 + i * 1.3, repeat: Infinity, delay: i * 2, ease: 'linear' }}
        style={{ position: 'absolute', fontSize: '1.4rem', userSelect: 'none', filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' }}
      >{emoji}</motion.div>
    ))}
  </div>
);

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success'
            ? 'linear-gradient(135deg, rgba(22,163,74,0.95), rgba(15,118,50,0.95))'
            : 'linear-gradient(135deg, rgba(220,38,38,0.95), rgba(185,28,28,0.95))',
          color: '#fff', borderRadius: 16,
          padding: '0.85rem 1.5rem',
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.88rem',
          zIndex: 9999, backdropFilter: 'blur(20px)',
          boxShadow: toast.type === 'success'
            ? '0 8px 32px rgba(22,163,74,0.4), 0 0 0 1px rgba(34,197,94,0.3)'
            : '0 8px 32px rgba(220,38,38,0.4), 0 0 0 1px rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          maxWidth: '90vw',
        }}
      >
        {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {toast.message}
      </motion.div>
    )}
  </AnimatePresence>
);

/* ══════════════════════════════════════
   STAT CHIP — holographic style
══════════════════════════════════════ */
const StatChip = ({ icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    whileHover={{ y: -4, scale: 1.04 }}
    style={{
      background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`,
      border: `1px solid ${color}33`,
      borderRadius: 18, padding: '1rem 1.3rem',
      display: 'flex', alignItems: 'center', gap: '0.8rem',
      backdropFilter: 'blur(20px)',
      boxShadow: `0 0 30px ${color}11, inset 0 1px 0 rgba(255,255,255,0.05)`,
      cursor: 'default', position: 'relative', overflow: 'hidden',
    }}
  >
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
    }} />
    <motion.div
      animate={{ boxShadow: [`0 0 8px ${color}55`, `0 0 20px ${color}99`, `0 0 8px ${color}55`] }}
      transition={{ duration: 2.5, repeat: Infinity }}
      style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${color}15`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
      }}>{icon}</motion.div>
    <div>
      <p style={{
        fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive",
        color, lineHeight: 1, letterSpacing: '0.04em',
        textShadow: `0 0 16px ${color}88`,
      }}>{value}</p>
      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════
   ROOM CARD — holographic tilt card
══════════════════════════════════════ */
const RoomCard = ({ room, onJoin, index, type }) => {
  const isFood = type === 'food';
  const isRide = type === 'ride';
  const cardRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });
  const glowX = useTransform(mx, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(my, [-0.5, 0.5], ['0%', '100%']);

  const accent = isFood ? '#f97316' : '#3b82f6';
  const accentSoft = isFood ? 'rgba(249,115,22,' : 'rgba(59,130,246,';

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.4, delay: index * 0.07, type: 'spring', stiffness: 150 }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        whileHover={{ borderColor: `${accentSoft}0.5)` }}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
          border: `1px solid ${accentSoft}0.12)`,
          borderRadius: 22, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          position: 'relative', overflow: 'hidden',
          backdropFilter: 'blur(24px)',
          boxShadow: `0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Holographic shimmer overlay */}
        <motion.div style={{
          position: 'absolute', inset: 0, borderRadius: 22, pointerEvents: 'none',
          background: `radial-gradient(circle at ${glowX} ${glowY}, ${accentSoft}0.08) 0%, transparent 60%)`,
          transition: 'background 0.1s',
        }} />
        {/* Top edge glow */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
        }} />
        {/* Corner accent */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 120, height: 120,
          borderRadius: '50%', background: accent, filter: 'blur(50px)', opacity: 0.1,
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <motion.div
              animate={{ boxShadow: [`0 0 6px ${accent}55`, `0 0 16px ${accent}99`, `0 0 6px ${accent}55`] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${accentSoft}0.15)`, border: `1px solid ${accentSoft}0.35)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {isFood
                ? <Utensils size={15} color={accent} style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
                : <Car size={15} color={accent} style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />}
            </motion.div>
            <span style={{
              fontSize: '0.65rem', fontFamily: "'Bebas Neue', cursive", color: accent,
              fontWeight: 700, background: `${accentSoft}0.12)`,
              padding: '0.2rem 0.65rem', borderRadius: 99, border: `1px solid ${accentSoft}0.3)`,
              letterSpacing: '0.12em', textShadow: `0 0 8px ${accent}66`,
            }}>
              {isFood ? 'FOOD' : 'RIDE'}
            </span>
          </div>
          <span style={{
            fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)',
            fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Users size={10} />
            {isRide ? `${room.passengers?.length || 0}/${room.totalSeats}` : room.members?.length || 0}
          </span>
        </div>

        {/* Content */}
        <div>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, color: '#fff', lineHeight: 1.25,
            fontFamily: "'DM Sans', sans-serif",
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>{room.name}</h3>
          {isFood && room.restaurant?.name && (
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.3rem' }}>🍽️ {room.restaurant.name}</p>
          )}
          {isRide && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={10} color={accent} style={{ filter: `drop-shadow(0 0 3px ${accent})` }} />
                {room.origin} → {room.destination}
              </p>
              {room.estimatedFare > 0 && (
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                  ₹{room.estimatedFare} total
                  {room.passengers?.length > 0 && (
                    <span style={{ color: accent, textShadow: `0 0 6px ${accent}66` }}> · ₹{(room.estimatedFare / room.passengers.length).toFixed(0)}/person</span>
                  )}
                </p>
              )}
              {room.matchScore > 0 && (
                <span style={{
                  fontSize: '0.7rem', fontFamily: 'monospace',
                  color: room.matchScore > 70 ? '#22c55e' : '#f59e0b',
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  textShadow: room.matchScore > 70 ? '0 0 8px #22c55e88' : '0 0 8px #f59e0b88',
                }}>
                  <Zap size={9} /> {room.matchScore}% match
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
          {!isRide && room.thresholdMinutes && (
            <span style={{
              fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', gap: 3, flex: 1, fontFamily: 'monospace',
            }}>
              <Clock size={10} /> {room.thresholdMinutes}m left
            </span>
          )}
          {isRide && room.departureTime && (
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', flex: 1, fontFamily: 'monospace' }}>
              🕐 {new Date(room.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={() => onJoin(room._id, isRide)}
            style={{
              padding: '0.55rem 1.1rem', fontSize: '0.78rem',
              background: `linear-gradient(135deg, ${accent}, ${isFood ? '#ea580c' : '#2563eb'})`,
              border: 'none', borderRadius: 12, cursor: 'pointer',
              color: '#fff', fontWeight: 700,
              fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.08em',
              boxShadow: `0 4px 18px ${accentSoft}0.45)`,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>
            JOIN <ChevronRight size={12} />
          </motion.button>
        </div>

        {/* Seat bar for rides */}
        {isRide && (
          <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 99, marginTop: -8, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((room.passengers?.length || 0) / (room.totalSeats || 1)) * 100}%` }}
              transition={{ delay: index * 0.07 + 0.4, duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, ${accentSoft}0.6))`, borderRadius: 99, boxShadow: `0 0 6px ${accent}` }}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   CREATE FORM
══════════════════════════════════════ */
const CreateForm = ({ onClose, onCreate, onCreateRide, showToast }) => {
  const [tab, setTab] = useState('food');
  const [foodForm, setFoodForm] = useState({ name: '', restaurantName: '', zomatoLink: '', thresholdMinutes: 30 });
  const [rideForm, setRideForm] = useState({ origin: '', destination: '', departureTime: '', totalSeats: 3, estimatedFare: '', notes: '' });
  const [errors, setErrors] = useState({});

  const validateFood = () => { if (!foodForm.name.trim()) { showToast('Room name is required'); return false; } return true; };
  const validateRide = () => {
    const e = {};
    if (!rideForm.origin.trim()) e.origin = 'Required';
    if (!rideForm.destination.trim()) e.destination = 'Required';
    if (!rideForm.totalSeats || rideForm.totalSeats < 1) e.totalSeats = 'Min 1';
    if (Object.keys(e).length) { setErrors(e); showToast('Fill required fields'); return false; }
    setErrors({}); return true;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 24, padding: '1.75rem', marginBottom: '1.5rem',
        position: 'relative', backdropFilter: 'blur(24px)',
        boxShadow: '0 0 60px rgba(99,102,241,0.08), 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)' }} />
      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
        onClick={onClose}
        style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
        <X size={15} />
      </motion.button>

      <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.4rem', color: '#fff', letterSpacing: '0.06em', marginBottom: '1.25rem', textShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
        ✦ CREATE A ROOM
      </h2>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 3, marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {[{ id: 'food', label: '🍽️ Food Order', color: '#f97316' }, { id: 'ride', label: '🚗 Share Ride', color: '#3b82f6' }].map(t => (
          <motion.button key={t.id} onClick={() => { setTab(t.id); setErrors({}); }}
            whileTap={{ scale: 0.96 }}
            style={{
              padding: '0.5rem 1.1rem', borderRadius: 11, border: 'none', cursor: 'pointer',
              fontFamily: "'Bebas Neue', cursive", fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.08em',
              transition: 'all 0.2s',
              background: tab === t.id ? `${t.color}22` : 'transparent',
              color: tab === t.id ? t.color : 'rgba(255,255,255,0.35)',
              boxShadow: tab === t.id ? `0 0 12px ${t.color}33` : 'none',
              textShadow: tab === t.id ? `0 0 8px ${t.color}66` : 'none',
            }}>{t.label}</motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'food' ? (
          <motion.div key="food" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { k: 'name', label: 'Room Name *', ph: '"Hostel B dinner run"' },
              { k: 'restaurantName', label: 'Restaurant', ph: 'Dominos, Pizza Hut...' },
              { k: 'zomatoLink', label: 'Order Link', ph: 'Zomato / Swiggy URL' },
            ].map(({ k, label, ph }) => (
              <div key={k}>
                <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
                <input className="room-input" placeholder={ph} value={foodForm[k]}
                  onChange={e => setFoodForm(f => ({ ...f, [k]: e.target.value }))}
                  style={errors[k] ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : {}} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deadline (min)</label>
              <input className="room-input" type="number" min={5} max={180} value={foodForm.thresholdMinutes}
                onChange={e => setFoodForm(f => ({ ...f, thresholdMinutes: Number(e.target.value) }))} />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => validateFood() && onCreate(foodForm)}
              style={{
                width: '100%', padding: '0.9rem', marginTop: '0.25rem',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                border: 'none', borderRadius: 14, cursor: 'pointer',
                color: '#fff', fontWeight: 800, fontFamily: "'Bebas Neue', cursive",
                letterSpacing: '0.1em', fontSize: '0.95rem',
                boxShadow: '0 4px 24px rgba(249,115,22,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
              <Utensils size={15} /> LAUNCH FOOD ROOM
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="ride" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { k: 'origin', label: 'From *', ph: 'Main Gate', full: false },
              { k: 'destination', label: 'To *', ph: 'City Mall', full: false },
              { k: 'departureTime', label: 'Departure', type: 'datetime-local', full: false },
              { k: 'totalSeats', label: 'Seats *', type: 'number', ph: '3', full: false },
              { k: 'estimatedFare', label: 'Fare (₹)', type: 'number', ph: '200', full: false },
              { k: 'notes', label: 'Notes', ph: 'AC preferred...', full: true },
            ].map(({ k, label, ph, type, full }) => (
              <div key={k} style={{ gridColumn: full ? '1 / -1' : undefined }}>
                <label style={{ fontSize: '0.7rem', color: errors[k] ? '#f87171' : 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {label} {errors[k] && `— ${errors[k]}`}
                </label>
                <input className="room-input" type={type || 'text'} placeholder={ph} value={rideForm[k]}
                  onChange={e => { setRideForm(f => ({ ...f, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: undefined })); }}
                  style={errors[k] ? { borderColor: '#ef4444' } : {}} />
              </div>
            ))}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => validateRide() && onCreateRide(rideForm)}
              style={{
                gridColumn: '1 / -1', padding: '0.9rem',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none', borderRadius: 14, cursor: 'pointer',
                color: '#fff', fontWeight: 800, fontFamily: "'Bebas Neue', cursive",
                letterSpacing: '0.1em', fontSize: '0.95rem',
                boxShadow: '0 4px 24px rgba(59,130,246,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
              <Car size={15} /> POST RIDE
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
const RoomPage = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [rides, setRides] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/api/groups/nearby`, { headers }).catch(() => ({ data: [] })),
      axios.get(`${API}/api/rides/nearby`, { headers }).catch(() => ({ data: { rides: [] } })),
    ]).then(([gRes, rRes]) => {
      setGroups(Array.isArray(gRes.data) ? gRes.data : []);
      setRides(Array.isArray(rRes.data?.rides) ? rRes.data.rides : []);
    }).finally(() => setLoading(false));
  }, [token, navigate]);

  const handleJoinRide = async (id) => {
    try {
      await axios.post(`${API}/api/rides/join`, { rideId: id }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/rides');
    } catch (e) {
      const msg = e.response?.data?.message || '';
      if (msg.toLowerCase().includes('already')) { navigate('/rides'); return; }
      showToast(msg || 'Could not join ride.');
    }
  };

  const handleJoinGroup = async (id) => {
    try {
      await axios.post(`${API}/api/groups/join`, { groupId: id }, { headers: { Authorization: `Bearer ${token}` } });
      navigate(`/room/${id}`);
    } catch (e) {
      const msg = e.response?.data?.message || '';
      if (e.response?.status === 400 && msg.toLowerCase().includes('already')) { navigate(`/room/${id}`); return; }
      showToast(msg || 'Could not join group.');
    }
  };

  const handleJoin = (id, isRide) => isRide ? handleJoinRide(id) : handleJoinGroup(id);

  const handleCreate = async (form) => {
    try {
      const { data } = await axios.post(`${API}/api/groups/create`, form, { headers: { Authorization: `Bearer ${token}` } });
      setGroups(p => [...p, data.group]);
      setShowCreate(false);
      showToast('Room created!', 'success');
    } catch (e) { showToast(e.response?.data?.message || 'Error creating group.'); }
  };

  const handleCreateRide = async (form) => {
    try {
      const payload = { ...form, departureTime: form.departureTime || null, totalSeats: Number(form.totalSeats), estimatedFare: Number(form.estimatedFare) || 0 };
      const { data } = await axios.post(`${API}/api/rides/create`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setRides(p => [...p, data.ride]);
      setShowCreate(false);
      showToast('Ride posted!', 'success');
    } catch (e) { showToast(e.response?.data?.message || 'Error creating ride.'); }
  };

  const allItems = [
    ...groups.map(g => ({ ...g, _type: 'food' })),
    ...rides.filter(r => {
      if (r.status !== 'open') return false;
      if (r.departureTime && new Date(r.departureTime) < new Date()) return false;
      return true;
    }).map(r => ({ ...r, name: r.name || `${r.origin} → ${r.destination}`, _type: 'ride' })),
  ];

  const filtered = allItems.filter(item => {
    if (filter === 'food' && item._type !== 'food') return false;
    if (filter === 'ride' && item._type !== 'ride') return false;
    if (search && !item.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const foodCount = allItems.filter(i => i._type === 'food').length;
  const rideCount = allItems.filter(i => i._type === 'ride').length;
  const totalUsers = allItems.reduce((s, i) => s + (i.members?.length || i.passengers?.length || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .room-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          padding: 0.7rem 1rem; color: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .room-input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .room-input::placeholder { color: rgba(255,255,255,0.18); }
        .room-input[type="datetime-local"] { color-scheme: dark; }
        @keyframes scan { 0%{opacity:0;transform:scaleX(0)} 50%{opacity:1;transform:scaleX(1)} 100%{opacity:0;transform:scaleX(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
        <GridBg />
        <FloatingParticles />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar />

          <div style={{ maxWidth: 980, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

            {/* ── HERO ── */}
            <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              style={{ marginBottom: '2.5rem' }}>

              {/* Status badge */}
              <motion.div
                animate={{ boxShadow: ['0 0 8px rgba(99,102,241,0.3)', '0 0 20px rgba(99,102,241,0.6)', '0 0 8px rgba(99,102,241,0.3)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.35)',
                  borderRadius: 99, padding: '0.3rem 0.9rem',
                  fontSize: '0.7rem', fontFamily: "'Bebas Neue', cursive",
                  color: '#818cf8', marginBottom: '1rem', letterSpacing: '0.1em',
                }}>
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block', boxShadow: '0 0 6px #818cf8' }} />
                <Sparkles size={11} /> AI-POWERED MATCHING ACTIVE
              </motion.div>

              <h1 style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: '#fff', letterSpacing: '0.03em', lineHeight: 0.95,
                textShadow: '0 0 60px rgba(99,102,241,0.3)',
              }}>
                ACTIVE<br />
                <span style={{
                  background: 'linear-gradient(135deg, #818cf8, #f97316, #ec4899)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>ROOMS</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: '0.6rem', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
                Find a group · share the cost · arrive together
              </p>
            </motion.div>

            {/* ── STATS ── */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <StatChip icon="🍽️" label="Food rooms" value={foodCount} color="#f97316" delay={0.1} />
              <StatChip icon="🚗" label="Open rides" value={rideCount} color="#3b82f6" delay={0.15} />
              <StatChip icon="👥" label="People active" value={totalUsers} color="#818cf8" delay={0.2} />
            </div>

            {/* ── CONTROLS ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>

              {/* Search */}
              <div style={{ flex: 1, position: 'relative', minWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                <input
                  className="room-input"
                  placeholder="Search rooms and rides…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.5rem', borderRadius: 99 }}
                />
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 99, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'food', label: '🍽️ Food' },
                  { id: 'ride', label: '🚗 Rides' },
                ].map(f => (
                  <motion.button key={f.id} onClick={() => setFilter(f.id)}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      padding: '0.45rem 0.9rem', borderRadius: 99, border: 'none', cursor: 'pointer',
                      fontFamily: "'Bebas Neue', cursive", fontWeight: 600, fontSize: '0.78rem',
                      letterSpacing: '0.08em', transition: 'all 0.2s',
                      background: filter === f.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: filter === f.id ? '#818cf8' : 'rgba(255,255,255,0.3)',
                      boxShadow: filter === f.id ? '0 0 12px rgba(99,102,241,0.25)' : 'none',
                      textShadow: filter === f.id ? '0 0 8px rgba(129,140,248,0.6)' : 'none',
                    }}>
                    {f.label}
                  </motion.button>
                ))}
              </div>

              {/* Create button */}
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setShowCreate(s => !s)}
                style={{
                  padding: '0.65rem 1.3rem',
                  background: showCreate
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: showCreate ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  borderRadius: 99, cursor: 'pointer',
                  color: showCreate ? 'rgba(255,255,255,0.5)' : '#fff',
                  fontFamily: "'Bebas Neue', cursive", fontWeight: 700,
                  fontSize: '0.82rem', letterSpacing: '0.1em',
                  boxShadow: showCreate ? 'none' : '0 4px 24px rgba(99,102,241,0.45)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  transition: 'all 0.2s',
                }}>
                <motion.span animate={{ rotate: showCreate ? 45 : 0 }} transition={{ duration: 0.2 }}>
                  <Plus size={14} />
                </motion.span>
                {showCreate ? 'CANCEL' : 'CREATE ROOM'}
              </motion.button>
            </motion.div>

            {/* ── CREATE FORM ── */}
            <AnimatePresence>
              {showCreate && (
                <CreateForm key="create-form"
                  onClose={() => setShowCreate(false)}
                  onCreate={handleCreate}
                  onCreateRide={handleCreateRide}
                  showToast={showToast}
                />
              )}
            </AnimatePresence>

            {/* ── RESULT COUNT ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginBottom: '1.25rem', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
              {loading ? 'SCANNING...' : `${filtered.length} RESULT${filtered.length !== 1 ? 'S' : ''}${filter !== 'all' ? ` · ${filter.toUpperCase()}` : ''}`}
            </motion.div>

            {/* ── GRID ── */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {[...Array(6)].map((_, i) => (
                  <motion.div key={i}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                    style={{
                      height: 190, borderRadius: 22,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                <AnimatePresence>
                  {filtered.map((item, i) => (
                    <RoomCard key={item._id} room={item} onJoin={handleJoin} index={i} type={item._type} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* ── EMPTY STATE ── */}
            {!loading && filtered.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <motion.div
                  animate={{ y: [0, -14, 0], rotate: [0, 6, -6, 0], filter: ['drop-shadow(0 0 10px rgba(99,102,241,0.3))', 'drop-shadow(0 0 24px rgba(99,102,241,0.7))', 'drop-shadow(0 0 10px rgba(99,102,241,0.3))'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: '4rem', marginBottom: '1.25rem', display: 'block' }}>
                  🏛️
                </motion.div>
                <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.6rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>
                  NO ROOMS FOUND
                </p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.4rem', marginBottom: '2rem' }}>
                  {search ? `No results for "${search}"` : 'Create one and invite your crew'}
                </p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setSearch(''); setShowCreate(true); }}
                  style={{
                    padding: '0.8rem 1.8rem',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    border: 'none', borderRadius: 99, cursor: 'pointer',
                    color: '#fff', fontFamily: "'Bebas Neue', cursive",
                    letterSpacing: '0.1em', fontSize: '0.9rem',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.45)',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                  <Plus size={14} /> CREATE FIRST ROOM
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>

        <Toast toast={toast} />
      </div>
    </>
  );
};

export default RoomPage;