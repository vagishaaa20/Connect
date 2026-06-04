import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import Group from '../models/groupModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import stringSimilarity from "string-similarity";
import UserMemory from '../models/userMemoryModel.js';

// ---------- Gemini direct fetch helper ----------
const geminiText = async (prompt) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');
  return data.candidates[0].content.parts[0].text.trim();
};

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

// ---------- Gemini Vision invoice parser ----------
const parseInvoiceWithGeminiVision = async (filePath, mimeType) => {
  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString('base64');

  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const finalMimeType = supportedTypes.includes(mimeType) ? mimeType : 'application/pdf';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: finalMimeType, data: base64Data } },
            { text: `Extract all item names and prices from this invoice.
Return ONLY a JSON array, no explanation, no markdown:
[{ "itemName": "...", "price": number }, ...]` }
          ]
        }]
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.error('Gemini Vision error:', data);
    throw new Error('Gemini Vision failed to parse invoice');
  }

  const text = data.candidates[0].content.parts[0].text;
  const match = text.match(/\[.*\]/s);
  if (!match) throw new Error('No JSON found in Gemini response');
  return JSON.parse(match[0]);
};

// ---------- Frontend invoice parser route handler ----------
export const parseInvoiceAI = async (req, res) => {
  try {
    const { base64, mimeType } = req.body;
    if (!base64 || !mimeType) return res.status(400).json({ message: 'base64 and mimeType required' });

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const finalMimeType = supportedTypes.includes(mimeType) ? mimeType : 'application/pdf';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: finalMimeType, data: base64 } },
              { text: `You are an invoice parser. Extract all line items from this food bill.
Return ONLY valid JSON, no markdown:
{"items": [{"itemName": "string", "price": number, "quantity": number}], "subtotal": number, "total": number}
If unreadable return: {"error": "Could not parse invoice"}` }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(parsed);
  } catch (err) {
    console.error('parseInvoiceAI error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ---------- Helpers ----------
const getGroupObjectId = (groupId) => {
  if (!mongoose.Types.ObjectId.isValid(groupId))
    throw new Error('Invalid groupId');
  return new mongoose.Types.ObjectId(groupId);
};

const getGroupIdObjectId = (groupId) => {
  if (mongoose.Types.ObjectId.isValid(groupId))
    return new mongoose.Types.ObjectId(groupId);
  throw new Error("Invalid Group ID provided.");
};

// 1. Add item to cart
export const addItemToCart = async (req, res) => {
  try {
    const { groupId, itemName, price, image, quantity } = req.body;
    const userId = req.user._id;
    const groupIdObjectId = getGroupIdObjectId(groupId);

    const group = await Group.findById(groupIdObjectId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const now = new Date();
    if (group.checkoutDeadline < now)
      return res.status(400).json({ message: 'Cannot add items, deadline passed' });

    let cart = await Cart.findOne({ groupId: groupIdObjectId, status: 'active' });
    if (!cart) cart = new Cart({ groupId: groupIdObjectId, items: [] });

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
    const groupIdObjectId = getGroupIdObjectId(groupId);

    const cart = await Cart.findOne({ groupId: groupIdObjectId, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(
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

    const cart = await Cart.findOne({ groupId: groupIdObjectId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const group = await Group.findById(groupIdObjectId);
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
  console.log('=== CHECKOUT HIT ===');
  console.log('file:', req.file);
  console.log('body:', req.body);
  try {
    if (!req.file) return res.status(400).json({ message: "Invoice file is required" });

    const { groupId } = req.body;
    const userId = req.user._id;
    const groupIdObj = getGroupObjectId(groupId);

    const group = await Group.findById(groupIdObj);
    if (!group) return res.status(404).json({ message: 'Group not found' });
console.log('deadline:', group.checkoutDeadline, 'now:', new Date());
console.log('is admin:', group.admin.equals(userId));
console.log('deadline passed:', group.checkoutDeadline < new Date());
    if (!group.admin.equals(userId))
      return res.status(403).json({ message: 'Only admin can checkout' });

    if (group.checkoutDeadline < new Date())
      return res.status(400).json({ message: 'Cannot checkout, deadline passed' });

    const cart = await Cart.findOne({ groupId: groupIdObj, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const invoiceUrl = `${req.protocol}://${req.get('host')}/uploads/invoices/${req.file.filename}`;
    group.invoiceUrl = invoiceUrl;

    // Parse invoice with Gemini Vision
    const invoiceItems = await parseInvoiceWithGeminiVision(req.file.path, req.file.mimetype);

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
        cartItem.price = bestMatch.price;
      }

      return cartItem;
    });

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

    // Fix: use findOneAndUpdate with upsert instead of findOneOrCreate
    let memory = await UserMemory.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, frequentItems: [], frequentRoutes: [], totalOrders: 0 } },
      { upsert: true, new: true }
    );

    // Update frequent items
    cart.items.filter(i => i.userId.equals(userId)).forEach(item => {
      const existing = memory.frequentItems.find(f => f.name === item.itemName);
      if (existing) existing.count++;
      else memory.frequentItems.push({ name: item.itemName, count: 1 });
    });

    memory.totalOrders = (memory.totalOrders || 0) + 1;
    memory.lastUpdated = new Date();

    // Fix: use direct fetch instead of SDK
    const profilePrompt = `Based on this user's order history, write a 1-sentence profile useful for food recommendations.
Frequent items: ${JSON.stringify(memory.frequentItems)}
Total orders: ${memory.totalOrders}
Be specific: mention their top items and patterns.`;

    memory.aiSummary = await geminiText(profilePrompt);
    await memory.save();

    group.status = 'checkedout';
    await group.save();

    res.json({
      message: 'Order placed successfully',
      cartTotal: cart.total,
      invoiceUrl,
      users: usersData,
      invoiceItems
    });

  } catch (err) {
    console.error("checkoutCart error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};