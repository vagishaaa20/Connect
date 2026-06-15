import Razorpay from 'razorpay';
import crypto from 'crypto';
import rideModel from '../models/rideModel.js';
import mongoose from 'mongoose';
import { aiText } from '../helpers/aiHelper.js';

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing from .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ─── Create Ride ─────────────────────────────────────────────────────────────
export const createRide = async (req, res) => {
  try {
    const { origin, destination, departureTime, totalSeats, estimatedFare, notes } = req.body;
    const ride = await rideModel.create({
      creator: req.user._id,
      origin,
      destination,
      departureTime: departureTime || null,
      totalSeats: Number(totalSeats),
      estimatedFare: Number(estimatedFare) || 0,
      notes,
      passengers: [req.user._id],
    });
    res.status(201).json({ ride });
  } catch (err) {
    console.error('createRide error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Nearby / AI-matched Rides ───────────────────────────────────────────
export const getNearbyRides = async (req, res) => {
  try {
    const { origin, destination } = req.query;
    const now = new Date();

    await rideModel.updateMany(
      { status: 'open', departureTime: { $lt: now, $ne: null } },
      { $set: { status: 'expired' } }
    );

    const rides = await rideModel
      .find({
        status: 'open',
        $or: [
          { departureTime: { $gte: now } },
          { departureTime: null },
          { departureTime: { $exists: false } },
        ],
      })
      .populate('creator', 'name phone')
      .populate('passengers', 'name');

    if (!origin && !destination) return res.json({ rides });

    const prompt = `You are a ride-matching assistant for a campus app.
User wants to go from "${origin}" to "${destination}".
Here are available rides: ${JSON.stringify(
      rides.map(r => ({
        id: r._id,
        from: r.origin,
        to: r.destination,
        seats: r.totalSeats - r.passengers.length,
      }))
    )}
For each ride, give a match score 0-100 based on route overlap.
Return ONLY JSON: {"scores": [{"id": "rideId", "score": 85, "reason": "Same route"}]}`;

    const text = await aiText(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    const { scores } = JSON.parse(clean);

    const scored = rides
      .map(ride => {
        const match = scores.find(s => s.id === ride._id.toString());
        return {
          ...ride.toObject(),
          matchScore: match?.score || 0,
          matchReason: match?.reason || '',
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ rides: scored });
  } catch (err) {
    console.error('getNearbyRides error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ─── Join Ride ────────────────────────────────────────────────────────────────
export const joinRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ message: 'Missing rideId' });
    if (!mongoose.Types.ObjectId.isValid(rideId))
      return res.status(400).json({ message: 'Invalid rideId' });

    const ride = await rideModel.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const userId = req.user._id;

    if (ride.creator.equals(userId)) return res.json({ ride, alreadyMember: true });

    const alreadyJoined = ride.passengers.some(p =>
      p.equals ? p.equals(userId) : p.toString() === userId.toString()
    );
    if (alreadyJoined) return res.json({ ride, alreadyMember: true });

    if (ride.passengers.length >= ride.totalSeats)
      return res.status(400).json({ message: 'Ride is full' });

    ride.passengers.push(userId);
    if (ride.passengers.length >= ride.totalSeats) ride.status = 'full';
    await ride.save();

    res.json({ ride });
  } catch (err) {
    console.error('joinRide error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── Complete Ride + AI Fare Split ───────────────────────────────────────────
export const completeRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ message: 'Missing rideId' });

    const ride = await rideModel
      .findById(rideId)
      .populate('passengers', 'name defaultUpi');

    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only creator can complete ride' });
    if (!ride.passengers || ride.passengers.length === 0)
      return res.status(400).json({ message: 'No passengers on this ride' });

    ride.status = 'completed';

    const farePerPerson = Math.ceil(ride.estimatedFare / ride.passengers.length);
    ride.ridePayments = ride.passengers.map(p => ({
      userId: p._id,
      amount: farePerPerson,
      status: 'pending',
    }));

    await ride.save();

    // ── AI fare explanation — non-fatal if it fails ───────────────────────
    let aiExplanation = `Fare of ₹${ride.estimatedFare} split equally — ₹${farePerPerson} per person.`;
    try {
      const prompt = `A campus ride from ${ride.origin} to ${ride.destination} just completed.
Total fare: ₹${ride.estimatedFare}. Passengers: ${ride.passengers.map(p => p.name).join(', ')}.
Each person owes ₹${farePerPerson}.
Write a friendly 2-sentence explanation of the split. Be casual and campus-friendly.`;

      aiExplanation = await aiText(prompt);
    } catch (err) {
      console.warn('AI fare explanation failed (non-fatal):', err.message);
    }

    res.json({ ride, farePerPerson, passengers: ride.passengers, aiExplanation });
  } catch (err) {
    console.error('completeRide error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ─── Create Razorpay order for ride payment ───────────────────────────────────
export const createRidePaymentOrder = async (req, res) => {
  try {
    const { rideId } = req.body;
    const userId = req.user._id;

    if (!rideId) return res.status(400).json({ message: 'Missing rideId' });

    const ride = await rideModel
      .findById(rideId)
      .populate('passengers', 'name email phone');

    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'completed')
      return res.status(400).json({ message: 'Ride not completed yet' });

    const paymentRecord = ride.ridePayments?.find(p =>
      p.userId.toString() === userId.toString()
    );
    if (!paymentRecord)
      return res.status(400).json({ message: 'You are not a passenger on this ride' });
    if (paymentRecord.status === 'paid')
      return res.status(400).json({ message: 'You have already paid' });

    const order = await getRazorpay().orders.create({
      amount: Math.round(paymentRecord.amount * 100),
      currency: 'INR',
      receipt: `ride_${rideId.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
    });

    paymentRecord.razorpayOrderId = order.id;
    await ride.save();

    const user = await (await import('../models/userModel.js')).default.findById(userId);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      farePerPerson: paymentRecord.amount,
      user: {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      },
    });
  } catch (err) {
    console.error('createRidePaymentOrder error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ─── Verify Razorpay payment for ride ────────────────────────────────────────
export const verifyRidePayment = async (req, res) => {
  try {
    const { rideId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user._id;

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpaySignature)
      return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });

    const ride = await rideModel.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const paymentRecord = ride.ridePayments?.find(p =>
      p.userId.toString() === userId.toString()
    );
    if (!paymentRecord)
      return res.status(404).json({ message: 'Payment record not found' });

    paymentRecord.razorpayPaymentId = razorpayPaymentId;
    paymentRecord.status = 'paid';
    paymentRecord.paidAt = new Date();
    await ride.save();

    res.json({ message: 'Ride payment verified', status: 'paid' });
  } catch (err) {
    console.error('verifyRidePayment error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ─── Get ride payment status ──────────────────────────────────────────────────
export const getRidePaymentStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await rideModel
      .findById(rideId)
      .populate('ridePayments.userId', 'name email');

    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const payments = (ride.ridePayments || []).map(p => ({
      userId: p.userId?._id,
      name: p.userId?.name,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt,
    }));

    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      payments,
      totalPaid,
      farePerPerson: ride.ridePayments?.[0]?.amount || 0,
      totalFare: ride.estimatedFare,
      origin: ride.origin,
      destination: ride.destination,
    });
  } catch (err) {
    console.error('getRidePaymentStatus error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getRideById = async (req, res) => {
  try {
    const ride = await rideModel.findById(req.params.id)
      .populate('creator', 'name _id')
      .populate('passengers', 'name _id');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};