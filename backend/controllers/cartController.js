import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import Group from '../models/groupModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractPdfText } from '../helpers/pdfHelpers.js';
import { parseInvoiceWithGroqLlama } from '../helpers/llamaHelpers.js';
import stringSimilarity from "string-similarity";
import UserMemory from '../models/userMemoryModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ---------- Multer setup for invoice uploads ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/invoices';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `invoice_${Date.now()}${ext}`);
  }
});

export const uploadInvoice = multer({ storage }).single('invoice');

// ---------- Helper ----------
const getGroupObjectId = (groupId) => {
  if (!mongoose.Types.ObjectId.isValid(groupId))
    throw new Error('Invalid groupId');
  return new mongoose.Types.ObjectId(groupId);
};





// Helper function to cast groupId string to ObjectId
const getGroupIdObjectId = (groupId) => {
    if (mongoose.Types.ObjectId.isValid(groupId)) {
        return new mongoose.Types.ObjectId(groupId);
    }
    // Handle error or return null/throw if validation is desired here
    throw new Error("Invalid Group ID provided.");
};


// 1. Add item to cart
export const addItemToCart = async (req, res) => {
    try {
        const { groupId, itemName, price, image, quantity } = req.body;
        // userId is already an ObjectId from auth middleware
        const userId = req.user._id; 
        
        // --- FIX: Ensure groupId is an ObjectId for all queries/saves ---
        const groupIdObjectId = getGroupIdObjectId(groupId);

        const group = await Group.findById(groupIdObjectId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const now = new Date();
        if (group.checkoutDeadline < now)
            return res.status(400).json({ message: 'Cannot add items, deadline passed' });

        // Query using ObjectId
        let cart = await Cart.findOne({ groupId: groupIdObjectId, status: 'active' });
        if (!cart) cart = new Cart({ groupId: groupIdObjectId, items: [] });

        // Add or update item
        // Use .equals() for reliable ObjectId comparison
        const existingItem = cart.items.find(
            i => i.itemName === itemName && i.userId.equals(userId)
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ userId, itemName, price, image, quantity });
        }

        cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await cart.save();

        res.json({ message: 'Item added', cart });
    } catch (err) {
        console.error("addItemToCart error:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 2. Remove item from cart
export const removeItemFromCart = async (req, res) => {
    try {
        const { groupId, itemName } = req.body;
        const userId = req.user._id;

        // --- FIX: Ensure groupId is an ObjectId for all queries/saves ---
        const groupIdObjectId = getGroupIdObjectId(groupId);

        const cart = await Cart.findOne({ groupId: groupIdObjectId, status: 'active' });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        // Filter items: !(itemName match AND userId match)
        cart.items = cart.items.filter(
            // Use .equals() for reliable ObjectId comparison
            i => !(i.itemName === itemName && i.userId.equals(userId))
        );
        
        cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await cart.save();

        res.json({ message: 'Item removed', cart });
    } catch (err) {
        console.error("removeItemFromCart error:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 3. View cart 
export const viewCart = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;
        
        
        const groupIdObjectId = getGroupIdObjectId(groupId);


        const cart = await Cart.findOne({ 
            groupId: groupIdObjectId, 
            status: "active" 
        });

        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        // Authorization check
        const group = await Group.findById(groupIdObjectId);
        // Use .some(m => m.equals(userId)) for reliable ObjectId comparison
        if (!group.members.some(m => m.equals(userId)))
            return res.status(403).json({ message: 'You are not a member of this group' });

        res.json({ cart, admin: group.admin.toString() });
    } catch (err) {
        console.error("viewCart error:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 4. Checkout cart (admin only)
export const checkoutCart = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Invoice file is required" });

    const { groupId } = req.body;
    const userId = req.user._id;
    const groupIdObj = getGroupObjectId(groupId);

    const group = await Group.findById(groupIdObj);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.admin.equals(userId))
      return res.status(403).json({ message: 'Only admin can checkout' });

    if (group.checkoutDeadline < new Date())
      return res.status(400).json({ message: 'Cannot checkout, deadline passed' });

    const cart = await Cart.findOne({ groupId: groupIdObj, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const invoiceUrl = `${req.protocol}://${req.get('host')}/uploads/invoices/${req.file.filename}`;
    group.invoiceUrl = invoiceUrl;

    // Parse invoice
    const pdfText = await extractPdfText(req.file.path);
    const invoiceItems = await parseInvoiceWithGroqLlama(pdfText);

    // Update cart items based on invoice using fuzzy matching
    cart.items = cart.items.map(cartItem => {
      let bestMatch = null;
      let highestScore = 0;

      invoiceItems.forEach(invItem => {
        const score = stringSimilarity.compareTwoStrings(
          cartItem.itemName.trim().toLowerCase(),
          invItem.itemName.trim().toLowerCase()
        );
        if (score > highestScore) {
          highestScore = score;
          bestMatch = invItem;
        }
      });

      if (bestMatch && highestScore >= 0.6) {
        cartItem.price = bestMatch.price; // update price from invoice
      }

      return cartItem;
    });

    // Compute cart total
    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Organize items per user
    const usersData = {};
    cart.items.forEach(item => {
      const uid = item.userId.toString();
      if (!usersData[uid]) usersData[uid] = { items: [], total: 0 };
      usersData[uid].items.push({
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        image: item.image
      });
      usersData[uid].total += item.price * item.quantity;
    });

    cart.status = 'checkedout';
    await cart.save();

// After cart.save() in checkoutCart:
const memory = await UserMemory.findOneOrCreate(
  { userId },
  { userId, frequentItems: [], frequentRoutes: [] }
);

// Update frequent items
cart.items.filter(i => i.userId.equals(userId)).forEach(item => {
  const existing = memory.frequentItems.find(f => f.name === item.itemName);
  if (existing) existing.count++;
  else memory.frequentItems.push({ name: item.itemName, count: 1 });
});

memory.totalOrders += 1;
memory.lastUpdated = new Date();

// Ask AI to write a fresh profile summary
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const profilePrompt = `
Based on this user's order history, write a 1-sentence profile useful for food recommendations.
Frequent items: ${JSON.stringify(memory.frequentItems)}
Total orders: ${memory.totalOrders}
Be specific: mention their top items and patterns.`;
const result = await model.generateContent(profilePrompt);
memory.aiSummary = result.response.text().trim();
await memory.save();

    group.status = 'checkedout';
    await group.save();

    // Prepare frontend-friendly response
    const frontendResponse = {
      message: 'Order placed successfully',
      cartTotal: cart.total,
      invoiceUrl,
      users: usersData,
      invoiceItems
    };

    res.json(frontendResponse);

  } catch (err) {
    console.error("checkoutCart error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
