import mongoose from 'mongoose';

const CartSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  items: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      itemName: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ],
  total: { type: Number, default: 0 },
  status: { type: String, default: 'active' }  // active / checkedout
});

export default mongoose.model('Cart', CartSchema);
