import mongoose from 'mongoose';

const CartSchema = new mongoose.Schema({
  groupId: { type:  mongoose.Schema.Types.Mixed, ref: 'Group' },
  items: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      itemName: String,
      price: Number,
      quantity: Number,
      image: String,
    }
  ],
  total: { type: Number, default: 0 },
  status: { type: String, default: 'active' }, // active / checkedout

  // Payment tracking per user
  payments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      amount: { type: Number, required: true },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      status: { type: String, default: 'pending' }, // pending / paid / failed
      paidAt: { type: Date },
    }
  ]
});

export default mongoose.model('Cart', CartSchema);
