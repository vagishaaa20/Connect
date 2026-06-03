import { GoogleGenerativeAI } from '@google/generative-ai';
import rideModel from '../models/rideModel.js';
import mongoose from 'mongoose';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const createRide = async (req, res) => {
  try {
    const { origin, destination, departureTime, totalSeats, estimatedFare, notes } = req.body;
    const ride = await rideModel.create({
      creator: req.user._id,
      origin, destination,
      departureTime: departureTime || null,  // ← fix
      totalSeats: Number(totalSeats),
      estimatedFare: Number(estimatedFare) || 0,
      notes,
      passengers: [req.user._id]
    });
    res.status(201).json({ ride });
  } catch (err) {
    console.error('Create ride error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getNearbyRides = async (req, res) => {
  try {
    const { origin, destination } = req.query;
    const now = new Date();
    
   // Mark past rides as expired automatically
await rideModel.updateMany(
  { status: 'open', departureTime: { $lt: now, $ne: null } },
  { $set: { status: 'expired' } }
);

    const rides = await rideModel.find({
      status: 'open',
      $or: [
        { departureTime: { $gte: now } }, // future departure
        { departureTime: null },            // no time set
        { departureTime: { $exists: false } }
      ]
    })
      .populate('creator', 'name phone')
      .populate('passengers', 'name');
    
    // rest of your existing code unchanged...
    if (!origin && !destination) return res.json({ rides });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
You are a ride-matching assistant for a campus app.
User wants to go from "${origin}" to "${destination}".
Here are available rides: ${JSON.stringify(rides.map(r => ({
  id: r._id, from: r.origin, to: r.destination, seats: r.totalSeats - r.passengers.length
})))}
For each ride, give a match score 0-100 based on route overlap.
Return ONLY JSON: {"scores": [{"id": "rideId", "score": 85, "reason": "Same route"}]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const { scores } = JSON.parse(text);

    const scored = rides.map(ride => {
      const match = scores.find(s => s.id === ride._id.toString());
      return { ...ride.toObject(), matchScore: match?.score || 0, matchReason: match?.reason || '' };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ rides: scored });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const joinRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ message: 'Missing rideId' });

    // Add this check
    if (!mongoose.Types.ObjectId.isValid(rideId))
      return res.status(400).json({ message: 'Invalid rideId' });

    const ride = await rideModel.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const userId = req.user._id;

    if (ride.creator.equals(userId))
      return res.json({ ride, alreadyMember: true });

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
    console.error('joinRide error:', err.message); // ← tells you exact line
    res.status(500).json({ message: err.message }); // ← send message to frontend too
  }
};

export const completeRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await rideModel.findById(rideId).populate('passengers', 'name defaultUpi');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only creator can complete ride' });

    ride.status = 'completed';
    await ride.save();

    const farePerPerson = (ride.estimatedFare / ride.passengers.length).toFixed(2);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
A campus ride from ${ride.origin} to ${ride.destination} just completed.
Total fare: ₹${ride.estimatedFare}. Passengers: ${ride.passengers.map(p => p.name).join(', ')}.
Each person owes ₹${farePerPerson}.
Write a friendly 2-sentence explanation of the split. Be casual and campus-friendly.`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text().trim();

    res.json({ ride, farePerPerson, passengers: ride.passengers, aiExplanation: explanation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};