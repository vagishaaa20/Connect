import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, CheckCircle, Clock, AlertCircle, Sparkles, ArrowLeft, Navigation, MapPin, Copy, ExternalLink } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RidePaymentPage = () => {
  const { rideId } = useParams();
  const navigate   = useNavigate();
  const { token }  = useContext(AuthContext);
  const userId     = localStorage.getItem('userId');

  const [ride,    setRide]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  // ── Fetch full ride with populated creator + passengers ───────────────────
  const fetchRide = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API}/api/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRide(data.ride);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token && rideId) fetchRide(); }, [rideId, token]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
        <Sparkles size={28} color="#fbbf24" />
      </motion.div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>Loading ride details...</p>
    </div>
  );

  if (error || !ride) return (
    <div style={{ minHeight: '100vh', background: '#080a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '1.5rem', textAlign: 'center', color: '#ef4444', maxWidth: 400 }}>
        <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
        <p>{error || 'Ride not found'}</p>
      </div>
    </div>
  );

  const creatorId   = ride.creator?._id?.toString() || ride.creator?.toString();
  const isCreator   = creatorId === userId;
  const creator     = ride.creator;
  const farePerPerson = Math.ceil(ride.estimatedFare / Math.max(1, ride.passengers?.length || 1));

  // Creator's UPI ID — stored on their user profile
  const creatorUpi  = creator?.upiId || '';
  const creatorName = creator?.name  || 'Ride Creator';

  // Build UPI deep-link
  const buildUpiLink = (amount) => {
    if (!creatorUpi) return null;
    const params = new URLSearchParams({
      pa: creatorUpi,
      pn: creatorName,
      am: amount.toString(),
      cu: 'INR',
      tn: `Ride fare: ${ride.origin} to ${ride.destination}`,
    });
    return `upi://pay?${params.toString()}`;
  };

  const upiLink = buildUpiLink(farePerPerson);

  const copyUpi = () => {
    navigator.clipboard.writeText(creatorUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <div style={{ minHeight: '100vh', background: '#080a0f', fontFamily: "'DM Sans', sans-serif", padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
        {/* Glows */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: '#fbbf24', filter: 'blur(160px)', opacity: 0.04 }} />
          <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: '#f97316', filter: 'blur(140px)', opacity: 0.04 }} />
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/rides')}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.5rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}>
              <ArrowLeft size={16} />
            </motion.button>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #fbbf24, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(251,191,36,0.4)' }}>
              <Car size={22} color="#000" />
            </div>
            <div>
              <h1 style={{ color: '#fff', fontFamily: "'Bebas Neue', cursive", fontSize: '1.5rem', letterSpacing: '0.06em', lineHeight: 1 }}>FARE SPLIT</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: 2 }}>Pay the ride creator directly</p>
            </div>
          </div>

          {/* Route card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 16, padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Navigation size={13} color="#fbbf24" />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{ride.origin}</span>
            </div>
            <div style={{ width: 1, height: 12, background: 'rgba(251,191,36,0.3)', marginLeft: 6, marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={13} color="#f97316" />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{ride.destination}</span>
            </div>
          </motion.div>

          {/* Fare summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Total fare</span>
              <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>₹{ride.estimatedFare}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Passengers</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>{ride.passengers?.length || 1}</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', fontWeight: 600 }}>Each person pays</span>
              <span style={{ color: '#fbbf24', fontWeight: 800, fontFamily: "'Bebas Neue', cursive", fontSize: '1.6rem', letterSpacing: '0.04em', textShadow: '0 0 12px #fbbf2466' }}>₹{farePerPerson}</span>
            </div>
          </motion.div>

          {/* ── CREATOR VIEW: show who has paid / pending ── */}
          {isCreator ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#000', fontWeight: 700 }}>
                  {creatorName[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{creatorName} <span style={{ fontSize: '0.65rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: 99, fontWeight: 700, border: '1px solid rgba(251,191,36,0.3)' }}>YOU (CREATOR)</span></p>
                  {creatorUpi
                    ? <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>UPI: {creatorUpi}</p>
                    : <p style={{ color: '#ef4444', fontSize: '0.72rem' }}>⚠ No UPI ID set — passengers can't pay you digitally</p>
                  }
                </div>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Passengers</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.25rem' }}>
                {ride.passengers?.filter(p => (p._id || p)?.toString() !== creatorId).map((p, i) => (
                  <motion.div key={p._id || i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#818cf8', fontWeight: 700 }}>
                        {p.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.88rem' }}>{p.name}</span>
                    </div>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>₹{farePerPerson}</span>
                  </motion.div>
                ))}
              </div>

              {/* UPI ID box for creator to share */}
              {creatorUpi ? (
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Your UPI ID (share with passengers)</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '1rem', fontFamily: 'monospace' }}>{creatorUpi}</span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={copyUpi}
                      style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '0.3rem 0.6rem', cursor: 'pointer', color: '#22c55e', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.6rem' }}>Add your UPI ID in profile settings so passengers can pay you</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/profile')}
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.5rem 1rem', cursor: 'pointer', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.08em' }}>
                    Go to Profile →
                  </motion.button>
                </div>
              )}
            </motion.div>

          ) : (
            /* ── PASSENGER VIEW: pay creator via UPI ── */
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

              {/* Creator info */}
              <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 16, padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#000', fontWeight: 700, flexShrink: 0 }}>
                  {creatorName[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pay to ride creator</p>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{creatorName}</p>
                  {creatorUpi
                    ? <p style={{ color: '#fbbf24', fontSize: '0.78rem', fontFamily: 'monospace', marginTop: 2 }}>{creatorUpi}</p>
                    : <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 2 }}>Creator hasn't set a UPI ID yet</p>
                  }
                </div>
              </div>

              {/* Amount highlight */}
              <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(249,115,22,0.06))', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 16, padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Your share</p>
                <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '3rem', color: '#fbbf24', letterSpacing: '0.04em', textShadow: '0 0 20px #fbbf2466', lineHeight: 1 }}>₹{farePerPerson}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  {ride.origin} → {ride.destination}
                </p>
              </div>

              {/* Pay buttons */}
              {creatorUpi ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* UPI deep-link — opens GPay / PhonePe / Paytm */}
                  <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    href={upiLink}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', background: 'linear-gradient(135deg, #fbbf24, #f97316)', borderRadius: 14, textDecoration: 'none', color: '#000', fontWeight: 800, fontSize: '1rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', boxShadow: '0 4px 24px rgba(251,191,36,0.4)' }}>
                    <ExternalLink size={18} /> PAY ₹{farePerPerson} VIA UPI
                  </motion.a>

                  {/* Manual copy fallback */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '0.15rem' }}>Or copy UPI ID and pay manually</p>
                      <p style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 600 }}>{creatorUpi}</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      onClick={copyUpi}
                      style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', color: copied ? '#22c55e' : 'rgba(255,255,255,0.5)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s' }}>
                      {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </motion.button>
                  </div>

                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                    The UPI button opens your payment app directly with the amount pre-filled
                  </p>
                </div>
              ) : (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '1.25rem', textAlign: 'center' }}>
                  <p style={{ color: '#f59e0b', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {creatorName} hasn't added their UPI ID yet.<br />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>Ask them to add it in their profile, or pay them in cash.</span>
                  </p>
                </div>
              )}

              {/* Other passengers */}
              {ride.passengers?.length > 1 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>All passengers (each pays ₹{farePerPerson})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {ride.passengers?.map((p, i) => {
                      const pid = (p._id || p)?.toString();
                      const isMe = pid === userId;
                      const isThisCreator = pid === creatorId;
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: isMe ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isMe ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: isThisCreator ? 'rgba(251,191,36,0.2)' : 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: isThisCreator ? '#fbbf24' : '#818cf8', fontWeight: 700 }}>
                              {p.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span style={{ color: isMe ? '#fbbf24' : 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: isMe ? 700 : 400 }}>
                              {p.name} {isMe && '(you)'} {isThisCreator && '👑'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: isThisCreator ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                            {isThisCreator ? 'collecting' : `₹${farePerPerson}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default RidePaymentPage;