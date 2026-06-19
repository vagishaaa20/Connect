import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, MapPin, CreditCard, Save, CheckCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL}';

const ProfilePage = () => {
  const navigate  = useNavigate();
  const { token } = useContext(AuthContext);

  const [form,    setForm]    = useState({ name: '', phone: '', address: '', upiId: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  // Load current profile
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const u = data.user;
        setForm({
          name:    u.name    || '',
          phone:   u.phone   || '',
          address: u.address || '',
          upiId:   u.upiId   || '',
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch(`${API}/api/users/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'name',    label: 'Full Name',   icon: <User size={15} />,       placeholder: 'Your name',           type: 'text' },
    { key: 'phone',   label: 'Phone',       icon: <Phone size={15} />,      placeholder: '10-digit number',     type: 'tel'  },
    { key: 'address', label: 'Address',     icon: <MapPin size={15} />,     placeholder: 'Your campus address', type: 'text' },
    { key: 'upiId',   label: 'UPI ID',      icon: <CreditCard size={15} />, placeholder: 'yourname@okaxis',     type: 'text',
      hint: 'Passengers pay you on this ID when you create rides' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .p-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.75rem 0.9rem 0.75rem 2.6rem; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .p-input:focus { border-color: rgba(251,191,36,0.5); box-shadow: 0 0 0 3px rgba(251,191,36,0.08); }
        .p-input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080a0f', fontFamily: "'DM Sans', sans-serif", padding: '2rem 1rem', position: 'relative' }}>
        {/* Glows */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -200, left: -200, width: 500, height: 500, borderRadius: '50%', background: '#fbbf24', filter: 'blur(160px)', opacity: 0.04 }} />
          <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: '#818cf8', filter: 'blur(140px)', opacity: 0.04 }} />
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.5rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}>
              <ArrowLeft size={16} />
            </motion.button>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(129,140,248,0.4)' }}>
              <User size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ color: '#fff', fontFamily: "'Bebas Neue', cursive", fontSize: '1.5rem', letterSpacing: '0.06em', lineHeight: 1 }}>PROFILE</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: 2 }}>Update your details & UPI ID</p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {fields.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.72rem', color: f.key === 'upiId' ? '#fbbf24' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: f.key === 'upiId' ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>{f.icon}</span>
                    {f.label}
                    {f.key === 'upiId' && <span style={{ fontSize: '0.6rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: 99, border: '1px solid rgba(251,191,36,0.3)', fontWeight: 700, marginLeft: 4 }}>FOR RIDE PAYMENTS</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: f.key === 'upiId' ? '#fbbf24' : 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                      {f.icon}
                    </div>
                    <input
                      className="p-input"
                      type={f.type}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={f.key === 'upiId' ? { borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.03)' } : {}}
                    />
                  </div>
                  {f.hint && <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.35rem', paddingLeft: '0.2rem' }}>{f.hint}</p>}
                </div>
              ))}

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.65rem 0.85rem', color: '#ef4444', fontSize: '0.82rem' }}>
                  {error}
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleSave} disabled={saving}
                style={{ width: '100%', padding: '0.9rem', background: saved ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #818cf8, #6366f1)', border: saved ? '1px solid rgba(34,197,94,0.3)' : 'none', borderRadius: 14, cursor: saving ? 'default' : 'pointer', color: saved ? '#22c55e' : '#fff', fontWeight: 800, fontSize: '0.95rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '0.1em', boxShadow: saved ? 'none' : '0 4px 20px rgba(129,140,248,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s' }}>
                {saved ? <><CheckCircle size={17} /> SAVED!</> : saving ? 'SAVING...' : <><Save size={17} /> SAVE PROFILE</>}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;