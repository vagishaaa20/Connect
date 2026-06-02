import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: Date, required: true },
  totalSeats: { type: Number, required: true },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  estimatedFare: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'full', 'completed'], default: 'open' },
  aiMatchScore: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model('Ride', rideSchema);