import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';

const PaymentPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const fetchStatus = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/payments/status/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPaymentStatus(data);
    } catch (err) {
      console.error('fetchStatus error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [groupId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      // Step 1 — create Razorpay order
      const res = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId }),
      });
      const order = await res.json();
      if (!res.ok) { alert(order.message); setPaying(false); return; }

      // Step 2 — open Razorpay modal
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'CampusConnect',
        description: 'Group Order Payment',
        order_id: order.orderId,
        prefill: {
          name: order.user.name,
          email: order.user.email,
          contact: order.user.phone,
        },
        theme: { color: '#f97316' },
        handler: async (response) => {
          // Step 3 — verify payment on backend
          const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              groupId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            alert('Payment successful!');
            fetchStatus(); // refresh payment status
          } else {
            alert('Payment verification failed: ' + verifyData.message);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('handlePay error:', err);
      alert('Payment failed: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  const myPayment = paymentStatus?.payments?.find(p => p.userId?.toString() === userId);
  const alreadyPaid = myPayment?.status === 'paid';

  const statusIcon = (status) => {
    if (status === 'paid') return <CheckCircle size={16} color="#4ade80" />;
    if (status === 'failed') return <AlertCircle size={16} color="#f87171" />;
    return <Clock size={16} color="rgba(255,255,255,0.3)" />;
  };

  return (
    <>
      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div style={{
        minHeight: '100vh', background: '#080a0f',
        fontFamily: "'DM Sans', sans-serif", padding: '2rem 1rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 480 }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.2rem' }}
            >←</motion.button>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(249,115,22,0.4)',
            }}>
              <CreditCard size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ color: '#fff', fontFamily: "'Bebas Neue', cursive", fontSize: '1.4rem', letterSpacing: '0.06em' }}>
                SPLIT PAYMENT
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
                Room · {groupId?.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                <Sparkles size={24} color="#f97316" />
              </motion.div>
              <p style={{ marginTop: '1rem' }}>Loading payment details...</p>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <motion.div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Total bill</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>₹{paymentStatus?.cartTotal?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Total paid</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>₹{paymentStatus?.totalPaid?.toFixed(2)}</span>
                </div>
              </motion.div>

              {/* Member payment list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {paymentStatus?.payments?.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      background: p.status === 'paid' ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${p.status === 'paid' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 12, padding: '0.85rem 1rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {statusIcon(p.status)}
                      <div>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{p.name}</p>
                        {p.paidAt && (
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                            Paid {new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: '0.9rem',
                      color: p.status === 'paid' ? '#4ade80' : '#fff',
                    }}>
                      ₹{p.amount?.toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Pay button */}
              {!alreadyPaid && myPayment && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handlePay}
                  disabled={paying}
                  style={{
                    width: '100%', padding: '1rem',
                    background: paying ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: 'none', borderRadius: 14, cursor: paying ? 'default' : 'pointer',
                    color: '#fff', fontWeight: 700, fontSize: '1rem',
                    boxShadow: paying ? 'none' : '0 4px 20px rgba(249,115,22,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {paying ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles size={18} />
                    </motion.div>
                  ) : (
                    <><CreditCard size={18} /> Pay ₹{myPayment?.amount?.toFixed(2)}</>
                  )}
                </motion.button>
              )}

              {alreadyPaid && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    width: '100%', padding: '1rem', borderRadius: 14,
                    background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                    color: '#4ade80', fontWeight: 700, fontSize: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}
                >
                  <CheckCircle size={18} /> You've paid your share!
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default PaymentPage;