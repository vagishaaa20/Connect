import mongoose from 'mongoose';

const ridePaymentSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:            { type: Number, required: true },
  status:            { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  paidAt:            { type: Date },
});

const rideSchema = new mongoose.Schema(
  {
    creator:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    origin:        { type: String, required: true },
    destination:   { type: String, required: true },
    departureTime: { type: Date, default: null },
    totalSeats:    { type: Number, required: true, min: 1, max: 8 },
    estimatedFare: { type: Number, default: 0 },
    notes:         { type: String, default: '' },
    status:        {
      type: String,
      enum: ['open', 'full', 'completed', 'expired'],
      default: 'open',
    },
    passengers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    ridePayments:  [ridePaymentSchema],   // ← new: one entry per passenger after completion
  },
  { timestamps: true }
);

export default mongoose.model('Ride', rideSchema);
