import Razorpay from 'razorpay';
import crypto from 'crypto';
import Cart from '../models/cartModel.js';
import User from '../models/userModel.js';

// ---------- Create Razorpay order for user's share ----------
export const createPaymentOrder = async (req, res) => {
    const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  try {
    const { groupId } = req.body;
    const userId = req.user._id;

    const cart = await Cart.findOne({ groupId, status: 'checkedout' });
    if (!cart) return res.status(404).json({ message: 'No checked out cart found' });

    // Calculate this user's share
    const userItems = cart.items.filter(i => i.userId.equals(userId));
    if (userItems.length === 0)
      return res.status(400).json({ message: 'You have no items in this cart' });

    const amount = userItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Check if already paid
    const existing = cart.payments.find(p => p.userId.equals(userId));
    if (existing?.status === 'paid')
      return res.status(400).json({ message: 'You have already paid' });

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${groupId}_${userId}`,
    });

    // Upsert payment record
    const paymentIdx = cart.payments.findIndex(p => p.userId.equals(userId));
    if (paymentIdx >= 0) {
      cart.payments[paymentIdx].razorpayOrderId = order.id;
      cart.payments[paymentIdx].amount = amount;
      cart.payments[paymentIdx].status = 'pending';
    } else {
      cart.payments.push({
        userId,
        amount,
        razorpayOrderId: order.id,
        status: 'pending',
      });
    }
    await cart.save();

    const user = await User.findById(userId);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      },
    });
  } catch (err) {
    console.error('createPaymentOrder error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ---------- Verify payment after Razorpay callback ----------
export const verifyPayment = async (req, res) => {
  try {
    const { groupId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user._id;

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature)
      return res.status(400).json({ message: 'Payment verification failed' });

    // Mark as paid
    const cart = await Cart.findOne({ groupId, status: 'checkedout' });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const payment = cart.payments.find(p => p.userId.equals(userId));
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.status = 'paid';
    payment.paidAt = new Date();
    await cart.save();

    // Emit socket event so group sees who paid in real time
    if (req.io) {
      const user = await User.findById(userId);
      req.io.to(groupId).emit('paymentUpdate', {
        userId: userId.toString(),
        userName: user.name,
        amount: payment.amount,
        status: 'paid',
      });
    }

    res.json({ message: 'Payment verified', status: 'paid' });
  } catch (err) {
    console.error('verifyPayment error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ---------- Get payment status for all members ----------
export const getPaymentStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const cart = await Cart.findOne({ groupId, status: 'checkedout' })
      .populate('payments.userId', 'name email');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const status = cart.payments.map(p => ({
      userId: p.userId?._id,
      name: p.userId?.name,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt,
    }));

    const totalPaid = cart.payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({ payments: status, totalPaid, cartTotal: cart.total });
  } catch (err) {
    console.error('getPaymentStatus error:', err.message);
    res.status(500).json({ message: err.message });
  }
};