import mongoose from 'mongoose';
import Group from '../models/groupModel.js';
import Cart from '../models/cartModel.js';

// Create a new group (admin is logged-in user)
export const createGroup = async (req, res) => {
 try {
    const { name, restaurantName, zomatoLink, thresholdMinutes } = req.body;

    const adminId = req.user._id; 

    const now = new Date();
    const checkoutDeadline = new Date(now.getTime() + thresholdMinutes * 60000);

    const group = new Group({
      name,
      admin: adminId,
      members: [adminId], 
      restaurant: { name: restaurantName, zomatoLink },
      checkoutDeadline
    });

    await group.save();
    
    // Create Cart immediately upon group creation
    const cart = new Cart({ groupId: group._id, items: [], total: 0 });
    await cart.save();
    
    res.status(201).json({ message: 'Group created', group, cart });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Join an existing group (user is logged-in user)
export const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid groupId' });
    }

    const groupIdObjectId = new mongoose.Types.ObjectId(groupId);
    
    const group = await Group.findById(groupIdObjectId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const userId = req.user._id; 
    
    // Removed redundant new mongoose.Types.ObjectId(userId)

    if (!group.members.some(member => member.equals(userId))) {
      group.members.push(userId);
      await group.save();
    }
    

    // Use the consistent ObjectId for finding/creating the cart
    let cart = await Cart.findOne({ groupId: groupIdObjectId, status: "active" });
  if (!cart) {
    cart = new Cart({ groupId: groupIdObjectId, items: [], total: 0 });
    await cart.save();
  }

    res.json({ message: 'Joined group', group, cart });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get active nearby groups (optional location filtering)
export const getNearbyGroups = async (req, res) => {
  try {
    const { lng, lat, radiusKm = 5 } = req.query;
    const now = new Date();

    const activeGroups = await Group.find({
      status: 'active',
      checkoutDeadline: { $gte: now }
    });

    res.json(activeGroups);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
