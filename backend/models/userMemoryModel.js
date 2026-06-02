import mongoose from 'mongoose';

const userMemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  frequentItems: [{ name: String, count: Number }],         // items ordered often
  frequentRoutes: [{ origin: String, destination: String, count: Number }],
  dietaryPreferences: [String],                             // AI inferred: "prefers veg", "likes spicy"
  usualOrderTime: String,                                   // "evening", "lunch"
  totalOrders: { type: Number, default: 0 },
  totalRides: { type: Number, default: 0 },
  aiSummary: String,                                        // LLM-written profile: "Evening hostel food orderer who prefers veg biryani"
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('UserMemory', userMemorySchema);