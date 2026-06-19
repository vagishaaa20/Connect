import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Car, Plus, Users, MapPin, Clock, Zap, ArrowLeft, Navigation, Fuel, Wind, CreditCard, MessageCircle, LocateFixed } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL}';

const RoadLines = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
    {[...Array(6)].map((_, i) => (
      <motion.div key={i}
        style={{ position: 'absolute', left: `${10 + i * 16}%`, top: '-10%', width: 2, height: '30vh', background: 'linear-gradient(to bottom, transparent, rgba(251,191,36,0.15), transparent)', borderRadius: 99 }}
        animate={{ y: ['0vh', '120vh'] }}
        transition={{ duration: 1.8 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: 'linear' }}
      />
    ))}
  </div>
);

const Speedometer = ({ value = 0, max = 100 }) => {
  const angle = -135 + (value / max) * 270;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(251,191,36,0.1)" strokeWidth="8" />
      <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(251,191,36,0.6)" strokeWidth="8"
        strokeDasharray={`${(value / max) * 226} 226`} strokeLinecap="round"
        transform="rotate(-135 40 40)" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' }} />
      <motion.line x1="40" y1="40" x2="40" y2="12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
        style={{ transformOrigin: '40px 40px', filter: 'drop-shadow(0 0 4px #fbbf24)' }}
        animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 60, damping: 12 }} />
      <circle cx="40" cy="40" r="4" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 6px #fbbf24)' }} />
    </svg>
  );
};

const StatPill = ({ icon, label, value, color }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.05, y: -2 }}
    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}33`, borderRadius: 16, padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)', boxShadow: `0 0 20px ${color}11, inset 0 1px 0 rgba(255,255,255,0.05)`, cursor: 'default' }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: `0 0 12px ${color}44` }}>{icon}</div>
    <div>
      <p style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Bebas Neue', cursive", color, lineHeight: 1, letterSpacing: '0.04em', textShadow: `0 0 12px ${color}88` }}>{value}</p>
      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    </div>
  </motion.div>
);

/* ── Shared button style helper ── */
const actionBtn = (bg, color, border, shadow) => ({
  padding: '0.6rem 0.75rem',
  borderRadius: 12,
  border: border || 'none',
  cursor: 'pointer',
  background: bg,
  color,
  fontWeight: 800,
  fontSize: '0.78rem',
  fontFamily: "'Bebas Neue', cursive",
  letterSpacing: '0.08em',
  boxShadow: shadow || 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.35rem',
  whiteSpace: 'nowrap',
});

/* ── Ride Card ── */
const RideCard = ({ ride, onJoin, onComplete, index }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(my, { stiffness: 200, damping: 20 });
  const ry = useSpring(mx, { stiffness: 200, damping: 20 });

  const currentUserId = localStorage.getItem('userId');

  // ── FIX: .toString() on both sides — ObjectId vs plain string was always false ──
  const isCreator =
    ride.creator?._id?.toString() === currentUserId ||
    ride.creator?.toString()       === currentUserId;

  const isPassenger = ride.passengers?.some(
    p => (p._id || p)?.toString() === currentUserId
  );

  const statusColor = ride.status === 'open' ? '#22c55e' : ride.status === 'full' ? '#f59e0b' : '#6b7280';
  const isFull      = ride.status === 'full';
  const isCompleted = ride.status === 'completed';
  const seatsLeft   = ride.totalSeats - (ride.passengers?.length || 0);

  return (
    <motion.div ref={cardRef}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 120 }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', perspective: 1000 }}
      onMouseMove={e => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 12);
        my.set(((e.clientY - rect.top) / rect.height - 0.5) * -12);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
    >
      <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.4rem', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)', transition: 'border-color 0.3s, box-shadow 0.3s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(251,191,36,0.08), 0 0 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'; }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: statusColor, filter: 'blur(60px)', opacity: 0.06, pointerEvents: 'none' }} />

        {/* Status + badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <motion.div animate={{ boxShadow: [`0 0 8px ${statusColor}66`, `0 0 16px ${statusColor}99`, `0 0 8px ${statusColor}66`] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: statusColor, fontWeight: 700 }}>{ride.status}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {isCreator && (
              <span style={{ fontSize: '0.6rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '0.15rem 0.45rem', borderRadius: 99, fontWeight: 700, border: '1px solid rgba(251,191,36,0.3)' }}>YOURS</span>
            )}
            {ride.matchScore > 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 99, background: ride.matchScore > 70 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: ride.matchScore > 70 ? '#22c55e' : '#f59e0b', border: `1px solid ${ride.matchScore > 70 ? '#22c55e44' : '#f59e0b44'}`, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Zap size={9} /> {ride.matchScore}%
              </span>
            )}
          </div>
        </div>

        {/* Route */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <Navigation size={14} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.04em' }}>{ride.origin}</span>
          </div>
          <div style={{ paddingLeft: '1.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 1, height: 16, background: 'rgba(251,191,36,0.3)', marginLeft: 6 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={14} color="#f97316" style={{ filter: 'drop-shadow(0 0 4px #f97316)' }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.04em' }}>{ride.destination}</span>
          </div>
          {ride.matchReason && <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.4rem', paddingLeft: '1.5rem' }}>{ride.matchReason}</p>}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color="#818cf8" /> {ride.departureTime ? new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={12} color="#34d399" /> {ride.passengers?.length || 0}/{ride.totalSeats}
            {!isFull && !isCompleted && <span style={{ color: '#34d399', marginLeft: 2 }}>({seatsLeft} left)</span>}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, textShadow: '0 0 8px #fbbf2466' }}>
            <Fuel size={12} /> ₹{ride.estimatedFare}
            {ride.passengers?.length > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}> · ₹{Math.ceil(ride.estimatedFare / ride.passengers.length)}/person</span>}
          </span>
        </div>

        {/* Creator */}
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fbbf24', fontWeight: 700 }}>
            {ride.creator?.name?.[0]?.toUpperCase() || '?'}
          </div>
          {ride.creator?.name}
          {ride.notes && <span style={{ marginLeft: 4, fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>"{ride.notes}"</span>}
        </div>

        {/* Seat bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, marginBottom: '1rem', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }}
            animate={{ width: `${((ride.passengers?.length || 0) / ride.totalSeats) * 100}%` }}
            transition={{ delay: index * 0.08 + 0.3, duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: `linear-gradient(to right, ${statusColor}, ${statusColor}aa)`, borderRadius: 99, boxShadow: `0 0 6px ${statusColor}` }}
          />
        </div>

        {/* ── Actions: always show all three relevant buttons ── */}
        {!isCompleted ? (
          <div style={{ display: 'flex', gap: '0.45rem' }}>

            {/* HOP IN — only for non-members on open rides → joins + goes to chat */}
            {ride.status === 'open' && !isCreator && !isPassenger && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => onJoin(ride._id)}
                style={{ ...actionBtn('linear-gradient(135deg, #fbbf24, #f97316)', '#000', 'none', '0 4px 16px rgba(251,191,36,0.4)'), flex: 1 }}>
                <Car size={13} /> Hop In
              </motion.button>
            )}

            {/* CHAT — members (creator or passenger) who have already joined */}
            {(isCreator || isPassenger) && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/rides/chat/ride_${ride._id}`)}
                style={{ ...actionBtn('rgba(129,140,248,0.12)', '#818cf8', '1px solid rgba(129,140,248,0.35)', '0 0 14px rgba(129,140,248,0.2)'), flex: 1 }}>
                <MessageCircle size={13} /> Chat
              </motion.button>
            )}

            {/* TRACK — everyone can track an active ride */}
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/rides/track/${ride._id}`)}
              style={{ ...actionBtn('rgba(56,189,248,0.1)', '#38bdf8', '1px solid rgba(56,189,248,0.3)', '0 0 14px rgba(56,189,248,0.15)'), flex: 1 }}>
              <LocateFixed size={13} /> Track
            </motion.button>

            {/* COMPLETE & SPLIT — only creator — opens payment page */}
            {isCreator && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => onComplete(ride._id)}
                style={{ ...actionBtn('rgba(34,197,94,0.1)', '#22c55e', '1px solid rgba(34,197,94,0.4)', '0 0 14px rgba(34,197,94,0.2)'), flex: 1 }}>
                <Zap size={13} /> Split
              </motion.button>
            )}

            {/* FULL badge — non-member, ride is full */}
            {isFull && !isCreator && !isPassenger && (
              <div style={{ flex: 1, textAlign: 'center', padding: '0.6rem', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.08em' }}>
                🔒 FULL
              </div>
            )}
          </div>
        ) : (
          /* Completed ride row */
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            {(isCreator || isPassenger) ? (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/rides/payment/${ride._id}`)}
                style={{ ...actionBtn('linear-gradient(135deg, #fbbf24, #f97316)', '#000', 'none', '0 4px 16px rgba(251,191,36,0.4)'), flex: 1 }}>
                <CreditCard size={13} /> Pay Now
              </motion.button>
            ) : (
              <div style={{ flex: 1, textAlign: 'center', padding: '0.6rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.08em' }}>
                ✓ COMPLETED
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ── Main page ── */
const RidePage = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [completionData, setCompletionData] = useState(null);
  const [newRide, setNewRide] = useState({ origin: '', destination: '', departureTime: '', totalSeats: 3, estimatedFare: '', notes: '' });

  const fetchRides = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API}/api/rides/nearby?origin=${searchOrigin}&destination=${searchDest}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRides(data.rides || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await axios.post(`${API}/api/rides/create`, {
        ...newRide,
        totalSeats: Number(newRide.totalSeats),
        estimatedFare: Number(newRide.estimatedFare) || 0,
        departureTime: newRide.departureTime || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowCreate(false);
      setNewRide({ origin: '', destination: '', departureTime: '', totalSeats: 3, estimatedFare: '', notes: '' });
      fetchRides();
    } catch (err) { alert(err.response?.data?.message || 'Error creating ride'); }
  };

  // Hop In → join then open ride chat
  const handleJoin = async (rideId) => {
    try {
      await axios.post(`${API}/api/rides/join`, { rideId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchRides();
      navigate(`/rides/chat/ride_${ride._id}`);
    } catch (err) { alert(err.response?.data?.message || 'Could not join'); }
  };

  // Complete & Split → show AI modal then redirect to payment
  const handleComplete = async (rideId) => {
    try {
      const { data } = await axios.post(
        `${API}/api/rides/complete`,
        { rideId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ride = rides.find(r => r._id === rideId);
      setCompletionData({
        rideId,
        passengers:    data.passengers    ?? ride?.passengers ?? [],
        farePerPerson: data.farePerPerson ?? (
          ride ? Math.ceil(ride.estimatedFare / Math.max(1, ride.passengers?.length || 1)) : 0
        ),
        aiExplanation: data.aiExplanation ?? 'Fare split equally among all passengers.',
      });
      fetchRides();
    } catch (err) { alert(err.response?.data?.message || 'Error completing ride'); }
  };

  useEffect(() => { if (token) fetchRides(); }, [token]);

  const openRides  = rides.filter(r => r.status === 'open').length;
  const totalSeats = rides.reduce((s, r) => s + Math.max(0, r.totalSeats - (r.passengers?.length || 0)), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080a0f; }
        .ride-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.75rem 1rem; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; width: 100%; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .ride-input:focus { border-color: rgba(251,191,36,0.5); box-shadow: 0 0 0 3px rgba(251,191,36,0.08); }
        .ride-input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: '#fbbf24', filter: 'blur(160px)', opacity: 0.04 }} />
          <div style={{ position: 'absolute', bottom: -200, right: -200, width: 500, height: 500, borderRadius: '50%', background: '#f97316', filter: 'blur(140px)', opacity: 0.04 }} />
          <div style={{ position: 'absolute', top: '40%', left: '40%', width: 400, height: 400, borderRadius: '50%', background: '#818cf8', filter: 'blur(150px)', opacity: 0.03 }} />
        </div>
        <RoadLines />

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <button onClick={() => navigate('/rooms')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '1rem', transition: 'color 0.2s', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                <ArrowLeft size={14} /> Back to rooms
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 12px #fbbf2488)' }}>🚗</motion.div>
                <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#fff', letterSpacing: '0.04em', lineHeight: 1, textShadow: '0 0 40px rgba(251,191,36,0.3)' }}>
                  RIDE<span style={{ color: '#fbbf24', textShadow: '0 0 20px #fbbf2488' }}>SHARE</span>
                </h1>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>⚡ AI-powered campus ride matching</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Speedometer value={openRides * 12} max={100} />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreate(s => !s)}
                style={{ background: showCreate ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #fbbf24, #f97316)', border: showCreate ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: 14, padding: '0.75rem 1.4rem', color: showCreate ? 'rgba(255,255,255,0.6)' : '#000', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', boxShadow: showCreate ? 'none' : '0 4px 24px rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={15} /> {showCreate ? 'CANCEL' : 'POST RIDE'}
              </motion.button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <StatPill icon="🚗" label="Open rides" value={openRides} color="#fbbf24" />
            <StatPill icon="💺" label="Seats available" value={totalSeats} color="#34d399" />
            <StatPill icon="👥" label="Total rides" value={rides.length} color="#818cf8" />
          </motion.div>

          {/* AI Search */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', backdropFilter: 'blur(20px)' }}>
            <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
              <Navigation size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24', pointerEvents: 'none' }} />
              <input className="ride-input" value={searchOrigin} onChange={e => setSearchOrigin(e.target.value)} placeholder="From (e.g. Main Gate)" style={{ paddingLeft: '2.2rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
              <MapPin size={13} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#f97316', pointerEvents: 'none' }} />
              <input className="ride-input" value={searchDest} onChange={e => setSearchDest(e.target.value)} placeholder="To (e.g. City Mall)" style={{ paddingLeft: '2.2rem' }} />
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={fetchRides}
              style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', borderRadius: 12, padding: '0.75rem 1.2rem', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', boxShadow: '0 4px 20px rgba(129,140,248,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={14} /> AI MATCH
            </motion.button>
          </motion.div>

          {/* Create form */}
          <AnimatePresence>
            {showCreate && (
              <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(251,191,36,0.03)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 20, padding: '1.5rem', boxShadow: '0 0 40px rgba(251,191,36,0.05)' }}>
                  <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.4rem', color: '#fbbf24', letterSpacing: '0.08em', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wind size={16} /> POST A NEW RIDE
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[['origin','From (pickup)','text'],['destination','To (drop)','text'],['departureTime','Departure time','datetime-local'],['totalSeats','Total seats','number'],['estimatedFare','Est. fare (₹)','number'],['notes','Notes (optional)','text']].map(([key, ph, type]) => (
                      <div key={key}>
                        <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>{ph}</label>
                        <input className="ride-input" type={type} placeholder={ph} value={newRide[key]} onChange={e => setNewRide(p => ({ ...p, [key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreate}
                    style={{ width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #fbbf24, #f97316)', border: 'none', borderRadius: 14, cursor: 'pointer', color: '#000', fontWeight: 800, fontSize: '0.95rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.12em', boxShadow: '0 4px 24px rgba(251,191,36,0.4)' }}>
                    🚗 LAUNCH RIDE
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rides grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'rgba(255,255,255,0.3)' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', fontSize: '2rem', marginBottom: '1rem' }}>⚙️</motion.div>
              <p style={{ fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', fontSize: '1.1rem' }}>SCANNING ROUTES...</p>
            </div>
          ) : rides.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '5rem 0' }}>
              <motion.div animate={{ y: [0,-10,0] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛣️</motion.div>
              <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.4rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>NO RIDES ON THIS ROAD</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Be the first to post one</p>
            </motion.div>
          ) : (
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              <AnimatePresence>
                {rides.map((ride, i) => (
                  <RideCard key={ride._id} ride={ride} onJoin={handleJoin} onComplete={handleComplete} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* ── AI Fare Split Modal ── */}
        <AnimatePresence>
          {completionData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
              <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
                style={{ background: 'linear-gradient(135deg, rgba(15,17,25,0.98), rgba(20,22,32,0.98))', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 24, padding: '2rem', maxWidth: 440, width: '100%', boxShadow: '0 0 80px rgba(251,191,36,0.1), 0 40px 80px rgba(0,0,0,0.6)' }}>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <motion.div animate={{ scale: [1,1.1,1] }} transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontSize: '3rem', marginBottom: '0.75rem', filter: 'drop-shadow(0 0 16px #fbbf2466)' }}>🤖</motion.div>
                  <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', color: '#fbbf24', letterSpacing: '0.08em', textShadow: '0 0 16px #fbbf2444' }}>AI FARE SPLIT</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.6 }}>{completionData.aiExplanation}</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1rem', marginBottom: '1.2rem' }}>
                  {completionData.passengers?.length === 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: '0.85rem' }}>No passenger data available.</p>
                  )}
                  {completionData.passengers?.map((p, i) => (
                    <motion.div key={p._id || i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < completionData.passengers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>
                          {p.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>{p.name || 'Passenger'}</span>
                      </div>
                      <span style={{ color: '#fbbf24', fontWeight: 800, fontFamily: "'Bebas Neue', cursive", fontSize: '1.1rem', textShadow: '0 0 8px #fbbf2466' }}>
                        ₹{completionData.farePerPerson}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setCompletionData(null); navigate(`/rides/payment/${completionData.rideId}`); }}
                    style={{ flex: 1, padding: '0.9rem', background: 'linear-gradient(135deg, #fbbf24, #f97316)', border: 'none', borderRadius: 14, cursor: 'pointer', color: '#000', fontWeight: 800, fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <CreditCard size={15} /> PAY NOW
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setCompletionData(null)}
                    style={{ flex: 1, padding: '0.9rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', fontSize: '0.9rem' }}>
                    🏁 LATER
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default RidePage;