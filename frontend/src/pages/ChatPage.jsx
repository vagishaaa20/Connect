import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CreditCard, MapPin, Sparkles, Bot, Hash } from 'lucide-react';
import io from 'socket.io-client';
import debounce from 'lodash.debounce';
import SplitBillModal from '../components/SplitBillModal';

const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') },
  autoConnect: false,
});

const AI_COMMANDS = [
  { cmd: '/summarize', label: 'Summarize chat', hint: 'Get a summary of the last messages', icon: '📋' },
  { cmd: '/recommend', label: 'Recommend items', hint: 'Get food suggestions based on the chat', icon: '🍽️' },
  { cmd: '/split', label: 'Split the bill', hint: 'Calculate how to split costs', icon: '💸' },
];

const handleAICommand = async (text, messages) => {
  const cmd = text.trim().toLowerCase();
  let prompt = '';
  if (cmd.startsWith('/summarize')) {
    const last = messages.slice(-20).map(m => `${m.sender?.name}: ${m.text}`).join('\n');
    prompt = `Summarize this group chat in 2-3 sentences, focusing on what was ordered or planned:\n\n${last}`;
  } else if (cmd.startsWith('/recommend')) {
    const last = messages.slice(-15).map(m => m.text).join(' ');
    prompt = `Based on this college student food group chat, suggest 3 popular items to add to the group order. Be concise and fun:\n\n${last}`;
  } else if (cmd.startsWith('/split')) {
    prompt = 'Give a quick tip on how to split a food bill fairly among friends in 1-2 sentences.';
  } else {
    prompt = text.replace('/ai', '').trim();
    if (!prompt) return null;
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || 'No response from AI.';
};

/* ── Ambient orb ── */
const Orb = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', ...style }} />
);

/* ── Floating emoji particles ── */
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

/* ── Message bubble ── */
const Bubble = ({ msg, isOwn, index }) => {
  const isAI = msg.isAI;
  const bubbleBg = isOwn
    ? 'linear-gradient(135deg, #f97316, #ea580c)'
    : isAI
      ? 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(99,102,241,0.1))'
      : 'rgba(255,255,255,0.05)';
  const borderColor = isOwn ? 'transparent' : isAI ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.06)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24, delay: Math.min(index * 0.03, 0.3) }}
      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem' }}
    >
      {/* Avatar */}
      {!isOwn && (
        <motion.div
          whileHover={{ scale: 1.1 }}
          style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: isAI ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            boxShadow: isAI ? '0 0 12px rgba(129,140,248,0.5)' : '0 0 12px rgba(249,115,22,0.4)',
            border: `1px solid ${isAI ? 'rgba(129,140,248,0.3)' : 'rgba(249,115,22,0.3)'}`,
          }}>
          {isAI ? <Bot size={14} /> : msg.sender?.name?.charAt(0)?.toUpperCase()}
        </motion.div>
      )}

      <div style={{ maxWidth: '68%' }}>
        {!isOwn && (
          <p style={{ fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600, letterSpacing: '0.04em',
            color: isAI ? '#818cf8' : 'rgba(255,255,255,0.4)',
            textShadow: isAI ? '0 0 8px rgba(129,140,248,0.5)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}>
            {isAI && <Sparkles size={10} style={{ filter: 'drop-shadow(0 0 3px #818cf8)' }} />}
            {isAI ? 'CampusAI' : msg.sender?.name}
          </p>
        )}
        <div style={{
          background: bubbleBg,
          border: `1px solid ${borderColor}`,
          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '0.65rem 1rem',
          fontSize: '0.88rem', lineHeight: 1.55, color: '#fff',
          backdropFilter: 'blur(10px)',
          boxShadow: isOwn
            ? '0 4px 16px rgba(249,115,22,0.3)'
            : isAI
              ? '0 4px 16px rgba(129,140,248,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.text}
        </div>
        <p style={{
          fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)',
          marginTop: '0.25rem', textAlign: isOwn ? 'right' : 'left', fontFamily: 'monospace',
        }}>
          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
        </p>
      </div>
    </motion.div>
  );
};

/* ── Typing indicator ── */
const TypingIndicator = () => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
    }}>👤</div>
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '18px 18px 18px 4px', padding: '0.6rem 0.9rem',
      display: 'flex', gap: 4, alignItems: 'center',
    }}>
      {[0, 1, 2].map(i => (
        <motion.span key={i}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: '#f97316', display: 'block', boxShadow: '0 0 4px #f97316' }}
        />
      ))}
    </div>
  </motion.div>
);

/* ── Main ChatPage ── */
const ChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  const emitTyping = useCallback(debounce(() => {
    socket.emit('typing', { groupId });
  }, 400), [groupId]);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit('joinGroup', groupId);
    socket.on('newMessage', msg => setMessages(p => [...p, msg]));
    socket.on('userTyping', ({ userId }) => {
      setTypingUsers(p => [...new Set([...p, userId])]);
      setTimeout(() => setTypingUsers(p => p.filter(u => u !== userId)), 1400);
    });
    socket.on('recentMessages', msgs => setMessages(msgs));
    socket.on('errorMessage', alert);
    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('recentMessages');
      socket.off('errorMessage');
    };
  }, [groupId]);

  useEffect(() => { scrollToBottom(); }, [messages, typingUsers]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const raw = text.trim();
    setText(''); setShowCommands(false);
    const isAICmd = ['/summarize', '/recommend', '/split', '/ai'].some(c => raw.startsWith(c));
    if (isAICmd) {
      setMessages(p => [...p, { _id: Date.now(), text: raw, sender: { _id: localStorage.getItem('userId'), name: 'You' }, createdAt: new Date() }]);
      setAiLoading(true);
      try {
        const reply = await handleAICommand(raw, messages);
        if (reply) setMessages(p => [...p, { _id: Date.now() + 1, text: reply, isAI: true, sender: { name: 'CampusAI' }, createdAt: new Date() }]);
      } catch { } finally { setAiLoading(false); }
    } else {
      socket.emit('sendMessage', { groupId, text: raw });
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setText(val);
    setShowCommands(val.startsWith('/'));
    emitTyping();
  };

  const userId = localStorage.getItem('userId');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.2); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(249,115,22,0.4); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 8px rgba(249,115,22,0.3); }
          50% { box-shadow: 0 0 20px rgba(249,115,22,0.7); }
        }
        .chat-input {
          flex: 1; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 99px;
          padding: 0.7rem 1.2rem; color: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .chat-input:focus { border-color: rgba(249,115,22,0.4); box-shadow: 0 0 0 3px rgba(249,115,22,0.07); }
        .chat-input::placeholder { color: rgba(255,255,255,0.2); }
        .action-btn {
          width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; color: rgba(255,255,255,0.4);
        }
        .action-btn:hover { background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.3); color: #f97316; box-shadow: 0 0 10px rgba(249,115,22,0.2); }
      `}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#080a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>

        {/* Ambient */}
        <Orb style={{ width: 500, height: 500, background: '#f97316', top: -200, left: -200, opacity: 0.04 }} />
        <Orb style={{ width: 400, height: 400, background: '#818cf8', bottom: -100, right: -100, opacity: 0.04 }} />
        <Particles />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)', padding: '0.85rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 10, position: 'relative',
            boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
          }}>
          <motion.button
            whileHover={{ scale: 1.1, x: -2 }} whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/room/${groupId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: '0.25rem', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            ←
          </motion.button>

          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(249,115,22,0.5)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}>
            <Hash size={18} color="#fff" />
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1rem', color: '#fff', letterSpacing: '0.06em', lineHeight: 1 }}>
              GROUP CHAT
            </h2>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2, letterSpacing: '0.04em' }}>
              Room · {groupId?.slice(-6).toUpperCase()}
            </p>
          </div>

          {/* Message count pill */}
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 99,
            background: 'rgba(249,115,22,0.12)', color: '#f97316',
            border: '1px solid rgba(249,115,22,0.2)', fontFamily: 'monospace',
          }}>
            {messages.length} msgs
          </span>

          <button className="action-btn" onClick={() => navigate(`/track/${groupId}`)} title="Live tracking">
            <MapPin size={15} />
          </button>
          <button className="action-btn" onClick={() => setIsSplitOpen(true)} title="Split bill">
            <CreditCard size={15} />
          </button>
        </motion.div>

        {/* Messages area */}
        <main ref={messagesRef} style={{
          flex: 1, overflowY: 'auto', padding: '1.25rem 1.25rem 0.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.8rem',
          position: 'relative', zIndex: 1,
        }}>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
              <motion.div animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.4))' }}>
                💬
              </motion.div>
              <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.3rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
                No messages yet
              </p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.4rem' }}>
                Say hi, or type <span style={{ color: '#818cf8', fontFamily: 'monospace' }}>/summarize</span> for AI magic
              </p>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <Bubble key={msg._id} msg={msg} isOwn={msg.sender?._id?.toString() === userId} index={i} />
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

        {/* Slash command menu */}
        <AnimatePresence>
          {showCommands && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              style={{
                position: 'absolute', bottom: 76, left: '1rem', right: '1rem',
                background: 'rgba(12,14,20,0.96)',
                border: '1px solid rgba(129,140,248,0.2)',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 -8px 40px rgba(129,140,248,0.1), 0 20px 40px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(20px)', zIndex: 20,
              }}
            >
              <div style={{ padding: '0.5rem 1rem 0.3rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={10} /> AI Commands
                </span>
              </div>
              {AI_COMMANDS.map((c, i) => (
                <motion.button key={c.cmd}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setText(c.cmd + ' '); setShowCommands(false); inputRef.current?.focus(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', width: '100%', background: 'none',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.4))' }}>{c.icon}</span>
                  <div>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#818cf8', fontWeight: 600, textShadow: '0 0 6px rgba(129,140,248,0.5)' }}>
                      {c.cmd}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{c.hint}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input footer */}
        <motion.footer initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)', padding: '0.85rem 1rem',
            display: 'flex', gap: '0.6rem', alignItems: 'center',
            zIndex: 10, position: 'relative',
          }}>
          {/* AI hint */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={() => { setText('/'); setShowCommands(true); inputRef.current?.focus(); }}
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 0 10px rgba(129,140,248,0.15)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 18px rgba(129,140,248,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 10px rgba(129,140,248,0.15)'; }}
          >
            <Sparkles size={15} color="#818cf8" style={{ filter: 'drop-shadow(0 0 4px #818cf8)' }} />
          </motion.div>

          <input
            ref={inputRef}
            value={text}
            onChange={handleInput}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message… or type / for AI"
            className="chat-input"
          />

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!text.trim() || aiLoading}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: text.trim() && !aiLoading
                ? 'linear-gradient(135deg, #f97316, #ea580c)'
                : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: text.trim() && !aiLoading ? '0 4px 16px rgba(249,115,22,0.45)' : 'none',
              transition: 'all 0.2s',
            }}>
            <Send size={16} color={text.trim() && !aiLoading ? '#fff' : 'rgba(255,255,255,0.2)'}
              style={{ filter: text.trim() && !aiLoading ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />
          </motion.button>
        </motion.footer>

        <SplitBillModal isOpen={isSplitOpen} onClose={() => setIsSplitOpen(false)} />
      </div>
    </>
  );
};

export default ChatPage;