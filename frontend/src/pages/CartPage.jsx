import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ShoppingCart, MessageCircle, ReceiptText,
  Sparkles, Loader2, CheckCircle2, AlertCircle, Upload, ExternalLink,
  CreditCard
} from 'lucide-react';
import Navbar from '../components/Navbar';

const API = import.meta.env.VITE_API_URL;

const FOODS = ['🍕', '🍜', '🍔', '☕', '🥤', '🍣', '🧆', '🍩', '🥗', '🌮'];
const FoodParticles = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
    {FOODS.map((emoji, i) => (
      <motion.div key={i}
        initial={{ y: '110vh', x: `${5 + i * 9.5}vw`, opacity: 0, rotate: 0 }}
        animate={{ y: '-10vh', opacity: [0, 0.18, 0.18, 0], rotate: i % 2 === 0 ? 15 : -15 }}
        transition={{ duration: 16 + i * 1.2, repeat: Infinity, delay: i * 2.1, ease: 'linear' }}
        style={{ position: 'absolute', fontSize: '1.6rem', userSelect: 'none', filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.3))' }}
      >{emoji}</motion.div>
    ))}
  </div>
);

const Steam = () => (
  <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3, pointerEvents: 'none' }}>
    {[0, 1, 2].map(i => (
      <motion.div key={i}
        animate={{ y: [-4, -12, -4], opacity: [0.4, 0, 0.4], scaleX: [1, 1.3, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        style={{ width: 3, height: 10, background: 'rgba(251,191,36,0.4)', borderRadius: 99, filter: 'blur(1px)' }}
      />
    ))}
  </div>
);

const StatChip = ({ icon, label, value, color }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05, y: -2 }}
    style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}33`,
      borderRadius: 16, padding: '0.85rem 1.1rem',
      display: 'flex', alignItems: 'center', gap: '0.7rem',
      backdropFilter: 'blur(12px)', boxShadow: `0 0 20px ${color}11`, cursor: 'default',
    }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: `0 0 10px ${color}44` }}>{icon}</div>
    <div>
      <p style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Bebas Neue', cursive", color, lineHeight: 1, letterSpacing: '0.04em', textShadow: `0 0 10px ${color}66` }}>{value}</p>
      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    </div>
  </motion.div>
);

const ItemRow = ({ item, onRemove, isOwn, index }) => {
  const isHighPrice = item.price > 200;
  return (
    <motion.li layout
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 200 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ position: 'relative' }}>
          {isHighPrice && <Steam />}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 0 12px rgba(249,115,22,0.15)' }}>
            {item.image && !item.image.includes('placeholder') && !item.image.includes('via.placeholder')
              ? <img src={item.image} alt={item.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              : '🍽️'}
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{item.itemName}</p>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginTop: 2 }}>₹{item.price} × {item.quantity}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#f97316', textShadow: '0 0 8px rgba(249,115,22,0.5)' }}>
          ₹{(item.price * item.quantity).toFixed(2)}
        </span>
        {isOwn && (
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            onClick={() => onRemove(item.itemName)}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Trash2 size={14} />
          </motion.button>
        )}
      </div>
    </motion.li>
  );
};

/* ── AI Invoice Panel ── */
const parseInvoiceWithAI = async (file, token) => {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const response = await fetch('${import.meta.env.VITE_API_URL}/api/cart/parse-invoice-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ base64, mimeType: file.type })
  });
  return await response.json();
};

const AIInvoicePanel = ({ groupId, token, onCartUpdate }) => {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('idle');
  const [parsedResult, setParsedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleFile = (f) => { if (f) { setFile(f); setStage('idle'); setParsedResult(null); } };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const handleParse = async () => {
    setStage('parsing'); setErrorMsg('');
    try {
      const result = await parseInvoiceWithAI(file, token);
      if (result.error) throw new Error(result.error);
      if (result.retryAfter) throw new Error('AI is busy — wait 30 seconds and try again');
      setParsedResult(result); setStage('parsed');
    } catch (e) { setErrorMsg(e.message || 'AI could not parse this invoice.'); setStage('error'); }
  };

  const handleCheckout = async () => {
    setStage('uploading');
    const formData = new FormData();
    formData.append('invoice', file);
    formData.append('groupId', groupId);
    try {
      const res = await axios.post(`${API}/api/cart/checkout`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      onCartUpdate(res.data);
      // Navigate directly to payment page
      navigate(`/payment/${groupId}`);
    } catch (e) { setErrorMsg(e.response?.data?.message || 'Checkout failed.'); setStage('error'); }
  };

  const handleQuickCheckout = async () => {
    setStage('uploading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/api/cart/quick-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ groupId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onCartUpdate(data);
      // Navigate directly to payment page
      navigate(`/payment/${groupId}`);
    } catch (e) {
      setErrorMsg(e.message || 'Quick checkout failed.');
      setStage('error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.04), rgba(249,115,22,0.04))', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 20, padding: '1.5rem', marginTop: '1.25rem', boxShadow: '0 0 40px rgba(251,191,36,0.05)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.1rem' }}>
        <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #fbbf24, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(251,191,36,0.5)' }}>
          <Sparkles size={16} color="#000" />
        </motion.div>
        <div>
          <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.1rem', color: '#fbbf24', letterSpacing: '0.06em', textShadow: '0 0 10px #fbbf2444' }}>AI INVOICE PARSER</h3>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Upload a bill — AI extracts items instantly</p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 99, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Only</span>
      </div>

      {/* Quick checkout button */}
      {stage === 'idle' && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleQuickCheckout}
          style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
        >
          <ReceiptText size={14} /> QUICK CHECKOUT (USE CART PRICES)
        </motion.button>
      )}

      {/* Drop zone */}
      {stage === 'idle' && (
        <motion.div onClick={() => fileRef.current?.click()} onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          animate={{ borderColor: dragOver ? '#fbbf24' : file ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)' }}
          style={{ border: `2px dashed ${file ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '1.4rem', textAlign: 'center', cursor: 'pointer', background: file ? 'rgba(249,115,22,0.06)' : dragOver ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s', marginBottom: '0.9rem' }}>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
          <motion.div animate={{ y: file ? 0 : [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Upload size={22} style={{ color: file ? '#f97316' : 'rgba(255,255,255,0.25)', margin: '0 auto 0.4rem', filter: file ? 'drop-shadow(0 0 6px #f97316)' : 'none' }} />
          </motion.div>
          <p style={{ fontSize: '0.84rem', color: file ? '#f97316' : 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
            {file ? file.name : 'Drop invoice here or click to upload'}
          </p>
          {!file && <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.15)', marginTop: '0.2rem' }}>PNG, JPG, PDF supported</p>}
        </motion.div>
      )}

      {/* Parse button */}
      {file && stage === 'idle' && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleParse}
          style={{ width: '100%', padding: '0.8rem', marginBottom: '0.75rem', background: 'linear-gradient(135deg, #fbbf24, #f97316)', border: 'none', borderRadius: 12, cursor: 'pointer', color: '#000', fontWeight: 800, fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(251,191,36,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Sparkles size={15} /> PARSE WITH AI
        </motion.button>
      )}

      {/* Uploading / parsing state */}
      {(stage === 'parsing' || stage === 'uploading') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem', background: 'rgba(251,191,36,0.06)', borderRadius: 12, marginBottom: '0.75rem', border: '1px solid rgba(251,191,36,0.15)' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 size={16} color="#fbbf24" /></motion.div>
          <span style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
            {stage === 'parsing' ? 'AI is reading your invoice…' : 'Processing checkout…'}
          </span>
        </div>
      )}

      {/* Parsed result */}
      {stage === 'parsed' && parsedResult && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.7rem' }}>
            <CheckCircle2 size={15} style={{ color: '#22c55e', filter: 'drop-shadow(0 0 4px #22c55e)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#22c55e' }}>{parsedResult.items?.length} items detected</span>
          </div>
          <ul style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 2 }}>
            {parsedResult.items?.map((it, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{it.itemName} × {it.quantity}</span>
                <span style={{ fontFamily: 'monospace', color: '#f97316' }}>₹{it.price}</span>
              </li>
            ))}
          </ul>
          {parsedResult.total && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace', color: '#fbbf24', textShadow: '0 0 8px #fbbf2466' }}>₹{parsedResult.total}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Error */}
      {stage === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, marginBottom: '0.75rem', color: '#ef4444' }}>
          <AlertCircle size={15} />
          <span style={{ fontSize: '0.82rem' }}>{errorMsg}</span>
        </div>
      )}

      {/* Confirm checkout button — after AI parse */}
      {(stage === 'parsed' || stage === 'error') && file && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleCheckout}
          style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: 12, cursor: 'pointer', color: '#fff', fontWeight: 800, fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <ReceiptText size={15} /> CONFIRM CHECKOUT
        </motion.button>
      )}

      {/* Retry button on error for quick checkout */}
      {stage === 'error' && !file && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setStage('idle'); setErrorMsg(''); }}
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', fontSize: '0.88rem' }}>
          TRY AGAIN
        </motion.button>
      )}
    </motion.div>
  );
};

/* ── Main CartPage ── */
const CartPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState({ itemName: '', price: '', quantity: 1 });
  const [addLoading, setAddLoading] = useState(false);
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const fetchCart = async () => {
    try {
      const { data } = await axios.get(`${API}/api/cart/${groupId}`, { headers: { Authorization: `Bearer ${token}` } });
      setCart(data.cart);
      setGroupData({ admin: data.admin });
    } catch (err) { setError(err.response?.data?.message || 'Failed to fetch cart'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token && groupId) fetchCart(); else setLoading(false); }, [groupId, token]);

  const handleAdd = async () => {
    if (!newItem.itemName || !newItem.price) return;
    setAddLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/cart/add`, {
        groupId, itemName: newItem.itemName,
        price: Number(newItem.price), quantity: Number(newItem.quantity),
        image: 'https://via.placeholder.com/100',
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCart(data.cart);
      setNewItem({ itemName: '', price: '', quantity: 1 });
    } catch (err) { setError(err.response?.data?.message || 'Error adding item'); }
    finally { setAddLoading(false); }
  };

  const handleRemove = async (itemName) => {
    try {
      const { data } = await axios.post(`${API}/api/cart/remove`, { groupId, itemName }, { headers: { Authorization: `Bearer ${token}` } });
      setCart(data.cart);
    } catch (err) { setError(err.response?.data?.message || 'Error removing item'); }
  };

  const isAdmin = groupData?.admin === userId;
  const itemCount = cart?.items?.length || 0;
  const myItems = cart?.items?.filter(i => i.userId === userId) || [];
  const myTotal = myItems.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .food-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.7rem 1rem; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; outline: none; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; }
        .food-input:focus { border-color: rgba(249,115,22,0.5); box-shadow: 0 0 0 3px rgba(249,115,22,0.08); }
        .food-input::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -200, left: -100, width: 600, height: 600, borderRadius: '50%', background: '#f97316', filter: 'blur(160px)', opacity: 0.04 }} />
          <div style={{ position: 'absolute', bottom: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: '#fbbf24', filter: 'blur(140px)', opacity: 0.04 }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 300, height: 300, borderRadius: '50%', background: '#ec4899', filter: 'blur(130px)', opacity: 0.02 }} />
        </div>

        <FoodParticles />
        <Navbar showBack backTo="/rooms" title="" />

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1.5rem 4rem', position: 'relative', zIndex: 1 }}>

          {/* Hero header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <motion.span animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 0 14px rgba(249,115,22,0.6))' }}>🛒</motion.span>
              <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', letterSpacing: '0.04em', lineHeight: 1, textShadow: '0 0 40px rgba(249,115,22,0.25)' }}>
                GROUP <span style={{ color: '#f97316', textShadow: '0 0 20px rgba(249,115,22,0.6)' }}>CART</span>
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>🍽️ Order together · split smart</p>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            <StatChip icon="🍽️" label="Items" value={itemCount} color="#f97316" />
            <StatChip icon="💰" label="My total" value={`₹${myTotal.toFixed(0)}`} color="#fbbf24" />
            <StatChip icon="🧾" label="Cart total" value={`₹${cart?.total?.toFixed(0) || 0}`} color="#22c55e" />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={15} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main cart card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '1.75rem', backdropFilter: 'blur(20px)', boxShadow: '0 0 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem' }}>
              <motion.div animate={{ boxShadow: ['0 0 8px rgba(249,115,22,0.4)', '0 0 18px rgba(249,115,22,0.7)', '0 0 8px rgba(249,115,22,0.4)'] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <ShoppingCart size={20} color="#f97316" style={{ filter: 'drop-shadow(0 0 6px #f97316)' }} />
              </motion.div>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.2rem', color: '#fff', letterSpacing: '0.06em', flex: 1 }}>ORDER ITEMS</h2>
              {cart?.status && (
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  padding: '0.25rem 0.65rem', borderRadius: 99,
                  background: cart.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                  color: cart.status === 'active' ? '#22c55e' : '#f59e0b',
                  border: `1px solid ${cart.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  boxShadow: cart.status === 'active' ? '0 0 8px rgba(34,197,94,0.2)' : '0 0 8px rgba(245,158,11,0.2)',
                }}>{cart.status}</span>
              )}
            </div>

            {/* Add item row */}
            {cart?.status === 'active' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px auto', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(249,115,22,0.04)', borderRadius: 14, border: '1px solid rgba(249,115,22,0.12)' }}>
                <input className="food-input" placeholder="🍽️ Item name" value={newItem.itemName}
                  onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                <input className="food-input" placeholder="₹ Price" type="number" value={newItem.price}
                  onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
                <input className="food-input" placeholder="Qty" type="number" min={1} value={newItem.quantity}
                  onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} />
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={handleAdd} disabled={addLoading}
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: 12, padding: '0 1rem', cursor: 'pointer', color: '#fff', fontWeight: 800, fontSize: '0.82rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.08em', boxShadow: '0 4px 14px rgba(249,115,22,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                  {addLoading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 size={14} /></motion.div> : <><Plus size={14} /> ADD</>}
                </motion.button>
              </motion.div>
            )}

            {/* Items list */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Loader2 size={28} color="#f97316" style={{ filter: 'drop-shadow(0 0 8px #f97316)' }} />
                </motion.div>
              </div>
            ) : !cart?.items?.length ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: '3.5rem', marginBottom: '0.75rem', filter: 'drop-shadow(0 0 16px rgba(249,115,22,0.3))' }}>🛒</motion.div>
                <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.2rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>Cart is empty</p>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.3rem' }}>Add items above to get started</p>
              </motion.div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <AnimatePresence>
                  {cart.items.map((item, i) => (
                    <ItemRow key={`${item.itemName}-${i}`} item={item} onRemove={handleRemove}
                      isOwn={cart.status === 'active'} index={i} />
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {/* Total */}
            {cart?.items?.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.1rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grand Total</span>
                <motion.span key={cart?.total} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                  style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.6rem', color: '#fbbf24', letterSpacing: '0.04em', textShadow: '0 0 16px rgba(251,191,36,0.5)' }}>
                  ₹{(cart?.total || 0).toFixed(2)}
                </motion.span>
              </motion.div>
            )}

            {/* Invoice link */}
            {cart?.invoiceUrl && (
              <a href={cart.invoiceUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.82rem', color: '#818cf8', textDecoration: 'none', filter: 'drop-shadow(0 0 4px rgba(129,140,248,0.4))' }}>
                <ExternalLink size={13} /> View Invoice
              </a>
            )}
          </motion.div>

          {/* AI Invoice panel — admin only, cart active */}
          {isAdmin && cart?.items?.length > 0 && cart?.status === 'active' && (
            <AIInvoicePanel
              groupId={groupId}
              token={token}
              onCartUpdate={(data) => {
                if (data.cart) setCart(data.cart);
              }}
            />
          )}

          {/* Pay button — shown when cart is checkedout (members returning) */}
          {cart?.status === 'checkedout' && (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(249,115,22,0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/payment/${groupId}`)}
              style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: 16, cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.88rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 20px rgba(249,115,22,0.35)', transition: 'all 0.2s' }}>
              <CreditCard size={16} style={{ filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.6))' }} />
              PAY YOUR SHARE
            </motion.button>
          )}

          {/* Chat button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(129,140,248,0.25)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/chat/${groupId}`)}
            style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 16, cursor: 'pointer', color: '#818cf8', fontWeight: 700, fontSize: '0.88rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
            <MessageCircle size={16} style={{ filter: 'drop-shadow(0 0 4px #818cf8)' }} />
            OPEN GROUP CHAT
          </motion.button>
        </div>
      </div>
    </>
  );
};

export default CartPage;