import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Plus, Users, Utensils, Car, ChevronRight, Clock,
  Search, X, Zap, MapPin, Sparkles, CheckCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API = 'http://localhost:5000';

/* ── Toast ── */
const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', borderRadius: 14,
          padding: '0.8rem 1.4rem',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem',
          zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          maxWidth: '90vw', whiteSpace: 'nowrap',
          border: `1px solid ${toast.type === 'success' ? '#22c55e44' : '#ef444444'}`,
        }}
      >
        {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {toast.message}
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Orb ── */
const Orb = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.1, pointerEvents: 'none', ...style }} />
);

/* ── Floating particles ── */
const PARTICLES = ['📚', '🍕', '🚗', '☕', '🎒', '🍜', '🛵', '📖', '🥤', '🎓'];
const FloatingParticles = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
    {PARTICLES.map((emoji, i) => (
      <motion.div key={i}
        initial={{ y: '110vh', x: `${8 + i * 9}vw`, opacity: 0 }}
        animate={{ y: '-10vh', opacity: [0, 0.15, 0.15, 0], rotate: i % 2 === 0 ? 12 : -12 }}
        transition={{ duration: 14 + i * 1.5, repeat: Infinity, delay: i * 1.8, ease: 'linear' }}
        style={{ position: 'absolute', fontSize: '1.5rem', userSelect: 'none' }}
      >{emoji}</motion.div>
    ))}
  </div>
);

/* ── Stat chip ── */
const StatChip = ({ icon, label, value, color }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '0.9rem 1.2rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 130,
    }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: color + '22',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
    }}>{icon}</div>
    <div>
      <p style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</p>
    </div>
  </motion.div>
);

/* ── Room card ── */
const RoomCard = ({ room, onJoin, index, type }) => {
  const isFood = type === 'food';
  const isRide = type === 'ride';
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [4, -4]);
  const rotateY = useTransform(x, [-60, 60], [-4, 4]);
  const bgGlow = isFood ? '#f97316' : '#3b82f6';
  const accentColor = isFood ? '#f97316' : '#3b82f6';

  return (
    <motion.div ref={cardRef}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={e => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 18, padding: '1.4rem',
        display: 'flex', flexDirection: 'column', gap: '0.9rem',
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: 'var(--shadow-sm)',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = bgGlow + '66';
          e.currentTarget.style.boxShadow = `0 0 28px ${bgGlow}22, var(--shadow-md)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 100, height: 100,
          borderRadius: '50%', background: bgGlow, filter: 'blur(40px)', opacity: 0.12, pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: bgGlow + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${bgGlow}33`,
            }}>
              {isFood ? <Utensils size={16} color={accentColor} /> : <Car size={16} color={accentColor} />}
            </div>
            <span style={{
              fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: accentColor,
              fontWeight: 700, background: bgGlow + '18',
              padding: '0.2rem 0.55rem', borderRadius: 99, border: `1px solid ${bgGlow}33`,
            }}>
              {isFood ? 'FOOD' : 'RIDE'}
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Users size={11} />
            {isRide ? `${room.passengers?.length || 0}/${room.totalSeats}` : room.members?.length || 0}
          </span>
        </div>

        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {room.name}
          </h3>
          {isFood && room.restaurant?.name && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>🍽️ {room.restaurant.name}</p>
          )}
          {isRide && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={11} color="var(--text-muted)" /> {room.origin} → {room.destination}
              </p>
              {room.estimatedFare > 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ₹{room.estimatedFare} total
                  {room.passengers?.length > 0 && (
                    <span style={{ color: accentColor }}> · ₹{(room.estimatedFare / room.passengers.length).toFixed(0)}/person</span>
                  )}
                </p>
              )}
              {room.matchScore > 0 && (
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: room.matchScore > 70 ? '#22c55e' : '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Zap size={10} /> {room.matchScore}% route match
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isRide && room.thresholdMinutes && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, flex: 1, fontFamily: 'var(--font-mono)' }}>
              <Clock size={11} /> {room.thresholdMinutes}m left
            </span>
          )}
          {isRide && room.departureTime && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', flex: 1, fontFamily: 'var(--font-mono)' }}>
              🕐 {new Date(room.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <motion.button className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => onJoin(room._id, isRide)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', background: bgGlow, boxShadow: `0 4px 14px ${bgGlow}44` }}>
            Join <ChevronRight size={13} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};


/* ── Create form ── */
const CreateForm = ({ onClose, onCreate, onCreateRide, showToast }) => {
  const [tab, setTab] = useState('food');
  const [foodForm, setFoodForm] = useState({ name: '', restaurantName: '', zomatoLink: '', thresholdMinutes: 30 });
  const [rideForm, setRideForm] = useState({ origin: '', destination: '', departureTime: '', totalSeats: 3, estimatedFare: '', notes: '' });
  const [errors, setErrors] = useState({});

  const validateFood = () => {
    if (!foodForm.name.trim()) { showToast('Room name is required'); return false; }
    return true;
  };

  const validateRide = () => {
    const e = {};
    if (!rideForm.origin.trim()) e.origin = 'Required';
    if (!rideForm.destination.trim()) e.destination = 'Required';
    if (!rideForm.totalSeats || rideForm.totalSeats < 1) e.totalSeats = 'Min 1';
    if (Object.keys(e).length) {
      setErrors(e);
      showToast('Please fill all required fields');
      return false;
    }
    setErrors({});
    return true;
  };

  const inputStyle = (errKey) => errors[errKey]
    ? { outline: '2px solid #ef4444', borderColor: '#ef4444' }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }} transition={{ duration: 0.25 }}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '1.75rem', marginBottom: '1.5rem',
        position: 'relative', boxShadow: 'var(--shadow-lg)',
      }}
    >
      <button className="btn-ghost" onClick={onClose} style={{ position: 'absolute', top: '1.1rem', right: '1.1rem' }}>
        <X size={17} />
      </button>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.1rem' }}>
        Create a New Room
      </h2>

      <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 12, padding: 3, marginBottom: '1.25rem', border: '1px solid var(--border)', width: 'fit-content' }}>
        {[{ id: 'food', label: '🍽️ Food Order' }, { id: 'ride', label: '🚗 Share Ride' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setErrors({}); }} style={{
            padding: '0.5rem 1.1rem', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.84rem', transition: 'all 0.2s',
            background: tab === t.id ? 'var(--bg-elevated)' : 'transparent',
            color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'food' ? (
          <motion.div key="food" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { k: 'name', label: 'Room Name *', ph: 'e.g. "Hostel B dinner run"' },
              { k: 'restaurantName', label: 'Restaurant (optional)', ph: 'Pizza Place, Dominos...' },
              { k: 'zomatoLink', label: 'Order Link (optional)', ph: 'Zomato / Swiggy link' },
            ].map(({ k, label, ph }) => (
              <div key={k}>
                <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
                <input className="input" placeholder={ph} value={foodForm[k]}
                  onChange={e => setFoodForm(f => ({ ...f, [k]: e.target.value }))}
                  style={inputStyle(k)} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Deadline (minutes)</label>
              <input className="input" type="number" min={5} max={180} value={foodForm.thresholdMinutes}
                onChange={e => setFoodForm(f => ({ ...f, thresholdMinutes: Number(e.target.value) }))} />
            </div>
            <motion.button className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => validateFood() && onCreate(foodForm)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.8rem' }}>
              <Utensils size={15} /> Create Food Room
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="ride" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { k: 'origin', label: 'From *', ph: 'Main Gate', full: false },
              { k: 'destination', label: 'To *', ph: 'City Mall', full: false },
              { k: 'departureTime', label: 'Departure Time', type: 'datetime-local', full: false },
              { k: 'totalSeats', label: 'Seats *', type: 'number', ph: '3', full: false },
              { k: 'estimatedFare', label: 'Est. Fare (₹)', type: 'number', ph: '200', full: false },
              { k: 'notes', label: 'Notes (optional)', ph: 'AC cab preferred...', full: true },
            ].map(({ k, label, ph, type, full }) => (
              <div key={k} style={{ gridColumn: full ? '1 / -1' : undefined }}>
                <label style={{
                  fontSize: '0.78rem', fontWeight: 500,
                  color: errors[k] ? '#ef4444' : 'var(--text-secondary)',
                  display: 'block', marginBottom: '0.3rem',
                }}>
                  {label} {errors[k] && <span style={{ fontSize: '0.72rem' }}>— {errors[k]}</span>}
                </label>
                <input className="input" type={type || 'text'} placeholder={ph} value={rideForm[k]}
                  onChange={e => {
                    setRideForm(f => ({ ...f, [k]: e.target.value }));
                    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
                  }}
                  style={inputStyle(k)} />
              </div>
            ))}
            <motion.button className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => validateRide() && onCreateRide(rideForm)}
              style={{ gridColumn: '1 / -1', justifyContent: 'center', padding: '0.8rem', background: '#3b82f6', boxShadow: '0 4px 14px #3b82f644' }}>
              <Car size={15} /> Post Ride
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Main page ── */
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
    const { data } = await axios.post(
      `${API}/api/rides/join`,
      { rideId: id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // redirect to the rides page either way
    navigate('/rides');
  } catch (e) {
    const msg = e.response?.data?.message || '';
    if (msg.toLowerCase().includes('already')) {
      navigate('/rides');
      return;
    }
    showToast(msg || 'Could not join ride.');
  }
};


const handleJoinGroup = async (id) => {
  console.log('joining group with id:', id)
  try {
    await axios.post(
      `${API}/api/groups/join`,
      { groupId: id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    navigate(`/room/${id}`);
  } catch (e) {
    const msg = e.response?.data?.message || '';
    if (e.response?.status === 400 && msg.toLowerCase().includes('already')) {
      navigate(`/room/${id}`);
      return;
    }
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
      const payload = {
        ...form,
        departureTime: form.departureTime || null,
        totalSeats: Number(form.totalSeats),
        estimatedFare: Number(form.estimatedFare) || 0,
      };
      const { data } = await axios.post(`${API}/api/rides/create`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setRides(p => [...p, data.ride]);
      setShowCreate(false);
      showToast('Ride posted!', 'success');
    } catch (e) { showToast(e.response?.data?.message || 'Error creating ride.'); }
  };

  const allItems = [
    ...groups.map(g => ({ ...g, _type: 'food' })),
    ...rides.filter(r => r.status === 'open').map(r => ({
      ...r, name: r.name || `${r.origin} → ${r.destination}`, _type: 'ride',
    })),
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <Orb style={{ width: 500, height: 500, background: '#6366f1', top: -100, left: -150 }} />
      <Orb style={{ width: 400, height: 400, background: '#3b82f6', bottom: -100, right: -100 }} />
      <Orb style={{ width: 300, height: 300, background: '#f97316', top: '40%', left: '60%' }} />
      <FloatingParticles />
      <Navbar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--accent-soft)', border: '1px solid var(--accent)',
            borderRadius: 99, padding: '0.3rem 0.75rem',
            fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: '0.75rem',
          }}>
            <Sparkles size={11} /> AI-powered matching active
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Active Rooms</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Find a group to join or create your own.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <StatChip icon="🍽️" label="Food rooms" value={foodCount} color="#f97316" />
          <StatChip icon="🚗" label="Open rides" value={rideCount} color="#3b82f6" />
          <StatChip icon="👥" label="People active" value={totalUsers} color="#6366f1" />
        </motion.div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search rooms and rides..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.3rem' }} />
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 11, padding: 3, border: '1px solid var(--border)' }}>
            {[{ id: 'all', label: 'All' }, { id: 'food', label: '🍽️ Food' }, { id: 'ride', label: '🚗 Rides' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '0.45rem 0.85rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s',
                background: filter === f.id ? 'var(--bg-card)' : 'transparent',
                color: filter === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                boxShadow: filter === f.id ? 'var(--shadow-sm)' : 'none',
              }}>{f.label}</button>
            ))}
          </div>
          <motion.button className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(s => !s)}>
            {showCreate ? <X size={15} /> : <Plus size={15} />}
            {showCreate ? 'Cancel' : 'Create Room'}
          </motion.button>
        </div>

        {/* Create form */}
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

        {/* Count */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
          {loading ? 'Loading...' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}${filter !== 'all' ? ` · ${filter}` : ''}`}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: 180, borderRadius: 18, background: 'var(--bg-card)', border: '1px solid var(--border)',
                animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
            <AnimatePresence>
              {filtered.map((item, i) => (
                <RoomCard key={item._id} room={item} onJoin={handleJoin} index={i} type={item._type} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏛️</motion.div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              No rooms found
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.3rem', marginBottom: '1.5rem' }}>
              {search ? `No results for "${search}"` : 'Create one and invite your classmates!'}
            </p>
            <motion.button className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setSearch(''); setShowCreate(true); }} style={{ margin: '0 auto' }}>
              <Plus size={15} /> Create First Room
            </motion.button>
          </motion.div>
        )}
      </div>

      <Toast toast={toast} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default RoomPage;