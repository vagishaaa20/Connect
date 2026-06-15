import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingCart, Receipt, Tag, Check, X } from 'lucide-react';

// ── Renders any structured AI message as an interactive UI component ──────────
const AIMessageCard = ({ message, onAgentConfirm, onAgentDeny, socket, groupId }) => {
  let parsed = null;
  try { parsed = JSON.parse(message.text); } catch { return null; }

  // ── 1. Order agent confirmation card ─────────────────────────────────────
  if (parsed.type === 'agent_confirm') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(249,115,22,0.08))', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 16, padding: '1rem', maxWidth: 320 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <ShoppingCart size={15} color="#fbbf24" />
          <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Agent</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{parsed.text}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
          {parsed.payload?.items?.map((item, i) => (
            <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '0.2rem 0.6rem', borderRadius: 99, border: '1px solid rgba(251,191,36,0.3)', fontWeight: 600 }}>
              {item.itemName}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => socket?.emit('agentConfirm', { groupId, items: parsed.payload?.items })}
            style={{ flex: 1, padding: '0.55rem', background: 'linear-gradient(135deg, #fbbf24, #f97316)', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#000', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <Check size={13} /> Yes, add them!
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onAgentDeny}
            style={{ padding: '0.55rem 0.9rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <X size={13} /> Nope
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── 2. Agent plain reply (after confirm/deny) ─────────────────────────────
  if (parsed.type === 'agent_reply') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '0.85rem 1rem', maxWidth: 280 }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', lineHeight: 1.6 }}>{parsed.text}</p>
      </motion.div>
    );
  }

  // ── 3. Food recommendations card ──────────────────────────────────────────
  if (parsed.type === 'recommendations' && parsed.suggestions) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 16, padding: '1rem', maxWidth: 320 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={14} color="#818cf8" />
          <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Picks For You</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {parsed.suggestions.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.65rem 0.8rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{s.item}</span>
                {s.estimatedPrice > 0 && <span style={{ color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>~₹{s.estimatedPrice}</span>}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', lineHeight: 1.5 }}>{s.reason}</p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── 4. Discount suggestion card ───────────────────────────────────────────
  if (parsed.type === 'discount_suggestion' && parsed.items) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.08))', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 16, padding: '1rem', maxWidth: 320 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <Tag size={14} color="#22c55e" />
          <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Group Discount Spotted! 🎉</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.84rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>{parsed.message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {parsed.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34,197,94,0.08)', borderRadius: 8, padding: '0.45rem 0.7rem' }}>
              <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize' }}>{item.name}</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{item.count} orders</span>
                <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 700 }}>Save ₹{item.estimatedSaving}</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.6rem' }}>Ask your admin to negotiate a bulk deal! 💪</p>
      </motion.div>
    );
  }

  // ── 5. Bill split card ────────────────────────────────────────────────────
  if (parsed.type === 'split_summary' && parsed.splits) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 16, padding: '1rem', maxWidth: 300 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Receipt size={14} color="#f97316" />
          <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bill Split</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.6rem' }}>
          {parsed.splits.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{s.name}</span>
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>₹{s.amount}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>Total</span>
          <span style={{ color: '#f97316', fontWeight: 800, fontFamily: 'monospace' }}>₹{parsed.total}</span>
        </div>
      </motion.div>
    );
  }

  // Fallback: unknown structured type
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '0.75rem', maxWidth: 280 }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{parsed.text || parsed.message || 'AI response'}</p>
    </div>
  );
};

export default AIMessageCard;