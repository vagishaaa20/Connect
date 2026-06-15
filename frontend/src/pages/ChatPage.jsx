import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CreditCard, MapPin, Sparkles, Bot, Hash, ShoppingCart, Check, X, Tag, Receipt, Car, ArrowLeft } from 'lucide-react';
import io from 'socket.io-client';
import debounce from 'lodash.debounce';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Socket created once at module level but connected manually
const socket = io(API, {
  auth: { token: localStorage.getItem('token') },
  autoConnect: false,
});

const AI_COMMANDS = [
  { cmd: '/summarize', label: 'Summarize chat',     hint: 'Get a summary of the last messages',         icon: '📋' },
  { cmd: '/recommend', label: 'Recommend items',    hint: 'Personalised food suggestions from memory',  icon: '🍽️' },
  { cmd: '/split',     label: 'Split the bill',     hint: 'Calculate how to split costs',               icon: '💸' },
  { cmd: '/ai ',       label: 'Ask CampusAI',       hint: 'Free-form AI question',                      icon: '🤖' },
];

// ── Ambient orbs ──────────────────────────────────────────────────────────────
const Orb = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', ...style }} />
);

const EMOJIS = ['💬', '✨', '🍕', '⚡', '🤖', '🎯'];
const Particles = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
    {EMOJIS.map((e, i) => (
      <motion.div key={i}
        initial={{ y: '105vh', x: `${8 + i * 15}vw`, opacity: 0 }}
        animate={{ y: '-8vh', opacity: [0, 0.1, 0.1, 0] }}
        transition={{ duration: 18 + i * 2, repeat: Infinity, delay: i * 3, ease: 'linear' }}
        style={{ position: 'absolute', fontSize: '1.4rem', userSelect: 'none' }}
      >{e}</motion.div>
    ))}
  </div>
);

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>👤</div>
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px 18px 18px 4px', padding: '0.6rem 0.9rem', display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <motion.span key={i}
          animate={{ y: [0,-5,0], opacity: [0.4,1,0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: '#f97316', display: 'block', boxShadow: '0 0 4px #f97316' }}
        />
      ))}
    </div>
  </motion.div>
);

// ── Structured AI card renderer ───────────────────────────────────────────────
const AICard = ({ parsed, groupId, token }) => {

  if (parsed.type === 'agent_confirm') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(249,115,22,0.06))', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 16, padding: '1rem', maxWidth: 300 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <ShoppingCart size={13} color="#fbbf24" />
          <span style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Agent</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.7rem' }}>{parsed.text}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.8rem' }}>
          {parsed.payload?.items?.map((item, i) => (
            <span key={i} style={{ fontSize: '0.72rem', background: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '0.2rem 0.55rem', borderRadius: 99, border: '1px solid rgba(251,191,36,0.25)', fontWeight: 600 }}>
              {item.itemName}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => socket.emit('agentConfirm', { groupId, items: parsed.payload?.items })}
            style={{ flex: 1, padding: '0.5rem', background: 'linear-gradient(135deg, #fbbf24, #f97316)', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#000', fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <Check size={12} /> Yes, add them!
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => {}}
            style={{ padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <X size={12} /> Nope
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (parsed.type === 'agent_reply') {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '0.8rem 1rem', maxWidth: 280 }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.87rem', lineHeight: 1.6 }}>{parsed.text}</p>
      </div>
    );
  }

  if (parsed.type === 'recommendations' && parsed.suggestions) {
    const [added, setAdded] = useState({});
    const addItem = async (item, price, idx) => {
      try {
        const res = await fetch(`${API}/api/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ groupId, itemName: item, price, quantity: 1 }),
        });
        if (res.ok) setAdded(p => ({ ...p, [idx]: true }));
      } catch (err) { console.error('addItem error:', err); }
    };
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 16, padding: '1rem', maxWidth: 310 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.7rem' }}>
          <Sparkles size={13} color="#818cf8" />
          <span style={{ color: '#818cf8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Picks For You</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {parsed.suggestions.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.6rem 0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.87rem', marginBottom: '0.15rem' }}>{s.item}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.73rem', lineHeight: 1.4 }}>{s.reason}</p>
                  {s.estimatedPrice > 0 && <p style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', marginTop: '0.25rem' }}>₹{s.estimatedPrice}</p>}
                </div>
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => addItem(s.item, s.estimatedPrice, i)} disabled={added[i]}
                  style={{ flexShrink: 0, background: added[i] ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #f97316, #ea580c)', border: added[i] ? '1px solid rgba(34,197,94,0.4)' : 'none', borderRadius: 9, padding: '0.35rem 0.65rem', color: added[i] ? '#4ade80' : '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: added[i] ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {added[i] ? <><Check size={11} /> Added</> : <><ShoppingCart size={11} /> Add</>}
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (parsed.type === 'discount_suggestion' && parsed.items) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.06))', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 16, padding: '1rem', maxWidth: 310 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.55rem' }}>
          <Tag size={13} color="#22c55e" />
          <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Group Discount Spotted! 🎉</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.83rem', marginBottom: '0.7rem', lineHeight: 1.5 }}>{parsed.message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.55rem' }}>
          {parsed.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34,197,94,0.07)', borderRadius: 8, padding: '0.4rem 0.65rem' }}>
              <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize' }}>{item.name}</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>{item.count} orders</span>
                <span style={{ fontSize: '0.73rem', color: '#22c55e', fontWeight: 700 }}>Save ₹{item.estimatedSaving}</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)' }}>Ask your admin to negotiate a bulk deal! 💪</p>
      </motion.div>
    );
  }

  if (parsed.type === 'split_summary' && parsed.splits) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 16, padding: '1rem', maxWidth: 290 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.7rem' }}>
          <Receipt size={13} color="#f97316" />
          <span style={{ color: '#f97316', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bill Split</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {parsed.splits.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.84rem' }}>{s.name}</span>
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.84rem', fontFamily: 'monospace' }}>₹{s.amount}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.35rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Total</span>
          <span style={{ color: '#f97316', fontWeight: 800, fontFamily: 'monospace' }}>₹{parsed.total}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.75rem 0.9rem', maxWidth: 280 }}>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>{parsed.text || parsed.message || JSON.stringify(parsed)}</p>
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────
const Bubble = ({ msg, isOwn, index, groupId, token }) => {
  const isAI = msg.isAI || msg.sender?._id === 'campusbot';

  if (isAI && msg.isStructured) {
    try {
      const parsed = JSON.parse(msg.text);
      return (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #fbbf24, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', boxShadow: '0 0 10px rgba(251,191,36,0.4)' }}>🤖</div>
          <div>
            <p style={{ fontSize: '0.68rem', color: '#818cf8', marginBottom: '0.2rem', fontWeight: 600 }}>CampusAI</p>
            <AICard parsed={parsed} groupId={groupId} token={token} />
            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
            </p>
          </div>
        </div>
      );
    } catch {}
  }

  const bubbleBg = isOwn
    ? 'linear-gradient(135deg, #f97316, #ea580c)'
    : isAI
      ? 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(99,102,241,0.1))'
      : 'rgba(255,255,255,0.05)';
  const borderColor = isOwn ? 'transparent' : isAI ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.06)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24, delay: Math.min(index * 0.03, 0.3) }}
      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem' }}
    >
      {!isOwn && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: isAI ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', boxShadow: isAI ? '0 0 10px rgba(129,140,248,0.4)' : '0 0 10px rgba(249,115,22,0.3)' }}>
          {isAI ? <Bot size={13} /> : msg.sender?.name?.charAt(0)?.toUpperCase()}
        </div>
      )}
      <div style={{ maxWidth: '68%' }}>
        {!isOwn && (
          <p style={{ fontSize: '0.68rem', marginBottom: '0.22rem', fontWeight: 600, color: isAI ? '#818cf8' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {isAI && <Sparkles size={9} />}
            {isAI ? 'CampusAI' : msg.sender?.name}
          </p>
        )}
        <div style={{ background: bubbleBg, border: `1px solid ${borderColor}`, borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '0.65rem 1rem', fontSize: '0.87rem', lineHeight: 1.55, color: '#fff', backdropFilter: 'blur(10px)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.text}
        </div>
        <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.22rem', textAlign: isOwn ? 'right' : 'left', fontFamily: 'monospace' }}>
          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
        </p>
      </div>
    </motion.div>
  );
};

// ── Main ChatPage ─────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const aiTimeoutRef = useRef(null);

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // ── Detect if this is a ride chat room ───────────────────────────────────
  // groupId from URL will be "ride_<rideId>" when coming from RidePage
  const isRideChat = groupId?.startsWith('ride_');
  const rideId = isRideChat ? groupId.replace('ride_', '') : null;

  const emitTyping = useCallback(debounce(() => {
    if (isRideChat) {
      socket.emit('rideTyping', { roomId: groupId });
    } else {
      socket.emit('typing', { groupId });
    }
  }, 400), [groupId, isRideChat]);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    if (isRideChat) {
      // ── Ride chat: use joinRideChat / sendRideMessage ─────────────────────
      socket.emit('joinRideChat', groupId);
    } else {
      // ── Group chat: existing behaviour ────────────────────────────────────
      socket.emit('joinGroup', groupId);
    }

    socket.on('recentMessages', msgs => setMessages(msgs));

    socket.on('newMessage', msg => {
      setMessages(p => [...p, msg]);
      if (msg.isAI) {
        setAiLoading(false);
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      }
    });

    socket.on('cartUpdated', () => {});

    socket.on('userTyping', ({ userId: name }) => {
      setTypingUsers(p => [...new Set([...p, name])]);
      setTimeout(() => setTypingUsers(p => p.filter(u => u !== name)), 1400);
    });

    socket.on('errorMessage', (msg) => {
      setAiLoading(false);
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      console.error('Socket error:', msg);
    });

    return () => {
      socket.off('recentMessages');
      socket.off('newMessage');
      socket.off('cartUpdated');
      socket.off('userTyping');
      socket.off('errorMessage');
    };
  }, [groupId, isRideChat]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); }, []);

  const handleSend = () => {
    const raw = text.trim();
    if (!raw) return;
    setText(''); setShowCommands(false);

    if (isRideChat) {
      // Ride chat: simple messages only, no AI commands
      socket.emit('sendRideMessage', { roomId: groupId, text: raw });
    } else {
      // Group chat: full AI command support
      const isAICmd = ['/summarize', '/recommend', '/split', '/ai '].some(c => raw.startsWith(c));
      const looksLikeAgent = /order|usual|same as|repeat/i.test(raw);
      if (isAICmd || looksLikeAgent) {
        setAiLoading(true);
        aiTimeoutRef.current = setTimeout(() => setAiLoading(false), 18000);
      }
      socket.emit('sendMessage', { groupId, text: raw });
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    // Only show AI command menu in group chats
    setShowCommands(!isRideChat && e.target.value.startsWith('/'));
    emitTyping();
  };

  // ── Back navigation ───────────────────────────────────────────────────────
  const handleBack = () => {
    if (isRideChat) {
      navigate('/rides');
    } else {
      navigate(`/room/${groupId}`);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.2); border-radius: 99px; }
        .chat-input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 99px; padding: 0.7rem 1.2rem; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .chat-input:focus { border-color: rgba(249,115,22,0.4); box-shadow: 0 0 0 3px rgba(249,115,22,0.07); }
        .chat-input::placeholder { color: rgba(255,255,255,0.2); }
        .action-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: rgba(255,255,255,0.4); }
        .action-btn:hover { background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.3); color: #f97316; }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 8px rgba(249,115,22,0.3)} 50%{box-shadow:0 0 20px rgba(249,115,22,0.7)} }
        @keyframes ride-glow { 0%,100%{box-shadow:0 0 8px rgba(251,191,36,0.3)} 50%{box-shadow:0 0 20px rgba(251,191,36,0.7)} }
      `}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#080a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
        <Orb style={{ width: 500, height: 500, background: isRideChat ? '#fbbf24' : '#f97316', top: -200, left: -200, opacity: 0.04 }} />
        <Orb style={{ width: 400, height: 400, background: '#818cf8', bottom: -100, right: -100, opacity: 0.04 }} />
        <Particles />

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 10, position: 'relative', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>

          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '0.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = isRideChat ? '#fbbf24' : '#f97316'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <ArrowLeft size={18} />
          </motion.button>

          {/* Icon — ride vs group */}
          <div style={{
            width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isRideChat
              ? 'linear-gradient(135deg, #fbbf24, #f97316)'
              : 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: isRideChat ? '0 0 16px rgba(251,191,36,0.5)' : '0 0 16px rgba(249,115,22,0.5)',
            animation: isRideChat ? 'ride-glow 3s ease-in-out infinite' : 'pulse-glow 3s ease-in-out infinite',
          }}>
            {isRideChat ? <Car size={18} color="#000" /> : <Hash size={18} color="#fff" />}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1rem', color: '#fff', letterSpacing: '0.06em', lineHeight: 1 }}>
              {isRideChat ? 'RIDE CHAT' : 'GROUP CHAT'}
            </h2>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {isRideChat
                ? `Ride · ${rideId?.slice(-6).toUpperCase()}`
                : `Room · ${groupId?.slice(-6).toUpperCase()}`}
            </p>
          </div>

          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 99, background: isRideChat ? 'rgba(251,191,36,0.12)' : 'rgba(249,115,22,0.12)', color: isRideChat ? '#fbbf24' : '#f97316', border: `1px solid ${isRideChat ? 'rgba(251,191,36,0.2)' : 'rgba(249,115,22,0.2)'}`, fontFamily: 'monospace' }}>
            {messages.length} msgs
          </span>

          {/* Action buttons — only show payment/track for group chats */}
          {!isRideChat && (
            <>
              <button className="action-btn" onClick={() => navigate(`/track/${groupId}`)}><MapPin size={15} /></button>
              <button className="action-btn" onClick={() => navigate(`/payment/${groupId}`)}><CreditCard size={15} /></button>
            </>
          )}

          {/* For ride chats: show a track button */}
          {isRideChat && (
            <button className="action-btn" onClick={() => navigate(`/rides/track/${rideId}`)}
              style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.06)' }}>
              <MapPin size={15} />
            </button>
          )}
        </motion.div>

        {/* ── Messages ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.25rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative', zIndex: 1 }}>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
              <motion.div animate={{ y: [0,-12,0], rotate: [0,5,-5,0] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: '4rem', marginBottom: '1rem', filter: `drop-shadow(0 0 20px ${isRideChat ? 'rgba(251,191,36,0.4)' : 'rgba(249,115,22,0.4)'})` }}>
                {isRideChat ? '🚗' : '💬'}
              </motion.div>
              <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.3rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
                {isRideChat ? 'RIDE CHAT IS EMPTY' : 'No messages yet'}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.4rem' }}>
                {isRideChat
                  ? 'Coordinate with your ride mates here'
                  : <>Say hi, or type <span style={{ color: '#818cf8', fontFamily: 'monospace' }}>/recommend</span> for AI-powered picks</>}
              </p>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <Bubble key={msg._id || i} msg={msg} isOwn={msg.sender?._id?.toString() === userId} index={i} groupId={groupId} token={token} />
          ))}

          <AnimatePresence>
            {typingUsers.length > 0 && <TypingIndicator />}
          </AnimatePresence>

          <AnimatePresence>
            {aiLoading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#818cf8' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles size={14} style={{ filter: 'drop-shadow(0 0 6px #818cf8)' }} />
                </motion.div>
                <span style={{ textShadow: '0 0 8px rgba(129,140,248,0.5)' }}>CampusAI is thinking…</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </main>

        {/* ── Slash command menu (group chat only) ── */}
        <AnimatePresence>
          {showCommands && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
              style={{ position: 'absolute', bottom: 76, left: '1rem', right: '1rem', background: 'rgba(12,14,20,0.96)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 -8px 40px rgba(129,140,248,0.1)', backdropFilter: 'blur(20px)', zIndex: 20 }}>
              <div style={{ padding: '0.5rem 1rem 0.3rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={10} /> AI Commands
                </span>
              </div>
              {AI_COMMANDS.map((c, i) => (
                <motion.button key={c.cmd} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setText(c.cmd); setShowCommands(false); inputRef.current?.focus(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
                  <div>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#818cf8', fontWeight: 600 }}>{c.cmd}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{c.hint}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input ── */}
        <motion.footer initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', padding: '0.85rem 1rem', display: 'flex', gap: '0.6rem', alignItems: 'center', zIndex: 10, position: 'relative' }}>

          {/* AI command trigger — only for group chats */}
          {!isRideChat && (
            <motion.div whileHover={{ scale: 1.05 }}
              onClick={() => { setText('/'); setShowCommands(true); inputRef.current?.focus(); }}
              style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Sparkles size={15} color="#818cf8" />
            </motion.div>
          )}

          {/* Ride icon for ride chat */}
          {isRideChat && (
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={15} color="#fbbf24" />
            </div>
          )}

          <input ref={inputRef} value={text} onChange={handleInput}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRideChat ? 'Message your ride mates…' : 'Message… or type / for AI commands'}
            className="chat-input"
          />

          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSend}
            disabled={!text.trim() || aiLoading}
            style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer', background: text.trim() && !aiLoading ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: text.trim() && !aiLoading ? '0 4px 16px rgba(249,115,22,0.45)' : 'none', transition: 'all 0.2s' }}>
            <Send size={16} color={text.trim() && !aiLoading ? '#fff' : 'rgba(255,255,255,0.2)'} />
          </motion.button>
        </motion.footer>
      </div>
    </>
  );
};

export default ChatPage;