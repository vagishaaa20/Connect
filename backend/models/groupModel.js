import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: String,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  restaurant: {                        
    name: { type: String, required: true },
    zomatoLink: { type: String }
  },
  invoiceUrl: { type: String },
  
  status: { type: String, default: 'active' }, // active / checkedout
  createdAt: { type: Date, default: Date.now },
  checkoutDeadline: Date                  // dynamic threshold for order
});

export default mongoose.model('Group', GroupSchema);