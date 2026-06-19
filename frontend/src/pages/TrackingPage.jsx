import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation2, Square, MapPin, Users, Wifi, WifiOff, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

// ── Unique color per user ─────────────────────────────────────────────────────
const USER_COLORS = ['#fbbf24', '#34d399', '#818cf8', '#f97316', '#ec4899', '#06b6d4'];
const getColor = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export const TrackingPage = () => {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const userId   = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'You';

  const [ride, setRide]             = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [connected, setConnected]   = useState(false);
  const [myPos, setMyPos]           = useState(null);
  const [accuracy, setAccuracy]     = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [members, setMembers]       = useState({}); // { userId: { name, lat, lng, timestamp } }
  const [pulse, setPulse]           = useState(0);

  const socketRef  = useRef(null);
  const watchIdRef = useRef(null);

  // Pulse animation
  useEffect(() => {
    if (!isTracking) return;
    const t = setInterval(() => setPulse(p => p + 1), 2000);
    return () => clearInterval(t);
  }, [isTracking]);

  // Fetch ride info
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const { data } = await axios.get(`${API}/api/rides/${rideId}`,
          { headers: { Authorization: `Bearer ${token}` } });
        setRide(data.ride);
      } catch (err) {
        console.error('fetchRide error:', err.message);
      }
    };
    if (token && rideId) fetchRide();
  }, [rideId, token]);

  // Socket setup
  useEffect(() => {
    const socket = io(API, { auth: { token }, reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('startRideTracking', { rideId });
    });

    socket.on('disconnect', () => setConnected(false));

    // Receive other members' locations
    socket.on('memberLocationUpdate', ({ userId: uid, name, lat, lng, timestamp }) => {
      setMembers(prev => ({
        ...prev,
        [uid]: { name, lat, lng, timestamp: new Date(timestamp) },
      }));
    });

    // Remove member when they stop
    socket.on('memberStopped', ({ userId: uid }) => {
      setMembers(prev => {
        const updated = { ...prev };
        delete updated[uid];
        return updated;
      });
    });

    return () => {
      socket.emit('stopRideTracking', { rideId });
      socket.disconnect();
    };
  }, [rideId, token]);

  // Start sharing own location
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser');
      return;
    }
    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = coords;
        setMyPos({ lat, lng });
        setAccuracy(Math.round(acc));
        setLastUpdated(new Date());
        socketRef.current?.emit('updateLocation', { rideId, lat, lng, name: userName });
      },
      (err) => {
        console.error('Geolocation error:', err.message);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setMyPos(null);
    socketRef.current?.emit('stopRideTracking', { rideId });
  };

  useEffect(() => () => {
    if (watchIdRef.current !== null)
      navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const activeMemberCount = Object.keys(members).length + (isTracking ? 1 : 0);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Navbar showBack backTo="/rides" title="Live Tracking" />

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Grid background */}
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

        {/* Road lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} aria-hidden>
          <path d="M 0 50% L 100% 50%" stroke="var(--text-muted)" strokeWidth="3" strokeDasharray="8 4" />
          <path d="M 50% 0 L 50% 100%" stroke="var(--text-muted)" strokeWidth="3" strokeDasharray="8 4" />
          <circle cx="50%" cy="50%" r="80" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
          <circle cx="50%" cy="50%" r="160" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" />
        </svg>

        {/* Pulse rings when sharing */}
        {isTracking && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div key={`${pulse}-${i}`}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 2, delay: i * 0.6, ease: 'easeOut' }}
                style={{
                  position: 'absolute', width: 40, height: 40,
                  borderRadius: '50%', border: '2px solid var(--accent)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </>
        )}

        {/* Member dots on map */}
        {Object.entries(members).map(([uid, m], idx) => (
          <motion.div key={uid}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              left: `${30 + idx * 15}%`,
              top: `${40 + idx * 10}%`,
              width: 36, height: 36, borderRadius: '50%',
              background: getColor(uid),
              border: '3px solid var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#000',
              boxShadow: `0 0 12px ${getColor(uid)}88`,
              zIndex: 3,
            }}
          >
            {m.name?.[0]?.toUpperCase()}
          </motion.div>
        ))}

        {/* My dot */}
        {isTracking && (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: '#fbbf24',
              border: '3px solid var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#000',
              boxShadow: '0 0 16px #fbbf2488',
              zIndex: 4,
            }}
          >
            {userName?.[0]?.toUpperCase()}
          </motion.div>
        )}

        {/* Control card */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card"
          style={{
            position: 'relative', zIndex: 10,
            padding: '2rem', textAlign: 'center',
            maxWidth: 380, width: '90%',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Status badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span className={`badge ${connected ? 'badge-green' : 'badge-amber'}`}>
              {connected ? <><Wifi size={11} /> Connected</> : <><WifiOff size={11} /> Reconnecting</>}
            </span>
            {isTracking && (
              <span className="badge badge-green">
                <MapPin size={11} /> Sharing
              </span>
            )}
            {activeMemberCount > 0 && (
              <span className="badge badge-amber">
                <Users size={11} /> {activeMemberCount} live
              </span>
            )}
          </div>

          {/* Ride info */}
          {ride && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              {ride.origin} → {ride.destination}
            </p>
          )}

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {isTracking ? 'Sharing Your Location' : 'Share With Ride Group'}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {isTracking
              ? 'Your location is visible to everyone on this ride.'
              : 'Let your ride group know where you are in real time.'}
          </p>

          {/* Last updated */}
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <Clock size={12} />
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {accuracy && ` · ±${accuracy}m`}
            </div>
          )}

          {/* Share / Stop button */}
          {!isTracking ? (
            <motion.button onClick={startTracking}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: 12,
                border: 'none', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                background: 'var(--green)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                boxShadow: '0 4px 16px rgba(46,125,82,0.3)',
              }}>
              <Navigation2 size={16} /> Share My Location
            </motion.button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                padding: '0.75rem', borderRadius: 12,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>Broadcasting live</span>
              </div>
              <motion.button onClick={stopTracking}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: 12,
                  border: 'none', fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  background: 'var(--accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                }}>
                <Square size={16} /> Stop Sharing
              </motion.button>
            </div>
          )}

          {/* Active members list */}
          <AnimatePresence>
            {Object.keys(members).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  Live members
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {Object.entries(members).map(([uid, m]) => (
                    <motion.div key={uid} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.5rem 0.75rem', borderRadius: 10,
                        background: `${getColor(uid)}11`,
                        border: `1px solid ${getColor(uid)}33`,
                      }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: getColor(uid),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700, color: '#000',
                      }}>
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {m.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Users size={13} /> {ride?.passengers?.length || 0} passengers on this ride
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(5rem, 18vw, 10rem)', fontWeight: 800, color: 'var(--border)', lineHeight: 1, marginBottom: '0.5rem' }}>404</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Looks like this page transferred to another campus.</p>
      <motion.button className="btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/')} style={{ padding: '0.8rem 2rem' }}>
        Back to Homepage
      </motion.button>
    </div>
  );
};

export default TrackingPage;




