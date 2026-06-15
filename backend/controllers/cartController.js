import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import Group from '../models/groupModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import stringSimilarity from 'string-similarity';
import { updateMemoryFromCart } from './memoryService.js';
import { aiText, aiVision } from '../helpers/aiHelper.js';

// ── Multer setup ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/invoices';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `invoice_${Date.now()}${path.extname(file.originalname)}`),
});
export const uploadInvoice = multer({ storage }).single('invoice');

// ── Gemini Vision invoice parser (file path version) ─────────────────────────
const parseInvoiceWithGeminiVision = async (filePath, mimeType) => {
  const base64Data = fs.readFileSync(filePath).toString('base64');
  const finalMimeType = ['image/jpeg','image/png','image/webp','application/pdf'].includes(mimeType)
    ? mimeType : 'application/pdf';

  const prompt = `Extract all item names and prices from this invoice.
Return ONLY a JSON array, no explanation, no markdown:
[{ "itemName": "...", "price": number }, ...]`;

  // Uses aiVision: Gemini → OpenAI fallback
  const text = await aiVision(base64Data, finalMimeType, prompt);
  const match = text.match(/\[.*\]/s);
  if (!match) throw new Error('No JSON found in AI response');
  return JSON.parse(match[0]);
};

// ── Frontend base64 invoice parser (called from CartPage) ────────────────────
export const parseInvoiceAI = async (req, res) => {
  try {
    const { base64, mimeType } = req.body;
    if (!base64 || !mimeType) return res.status(400).json({ message: 'base64 and mimeType required' });

    const finalMimeType = ['image/jpeg','image/png','image/webp','application/pdf'].includes(mimeType)
      ? mimeType : 'application/pdf';

    const prompt = `You are an invoice parser. Extract all line items from this food bill.
Return ONLY valid JSON, no markdown:
{"items": [{"itemName": "string", "price": number, "quantity": number}], "subtotal": number, "total": number}
If unreadable return: {"error": "Could not parse invoice"}`;

    const text = await aiVision(base64, finalMimeType, prompt);
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(parsed);
  } catch (err) {
    console.error('parseInvoiceAI error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getGroupObjectId = (groupId) => {
  if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error('Invalid groupId');
  return new mongoose.Types.ObjectId(groupId);
};

// ── 1. Add item to cart ───────────────────────────────────────────────────────
export const addItemToCart = async (req, res) => {
  try {
    const { groupId, itemName, price, image, quantity } = req.body;
    const userId = req.user._id;
    const groupIdObj = getGroupObjectId(groupId);

    const group = await Group.findById(groupIdObj);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.checkoutDeadline < new Date())
      return res.status(400).json({ message: 'Cannot add items, deadline passed' });

    let cart = await Cart.findOne({ groupId: groupIdObj, status: 'active' });
    if (!cart) cart = new Cart({ groupId: groupIdObj, items: [] });

    const existing = cart.items.find(i => i.itemName === itemName && i.userId.equals(userId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ userId, itemName, price, image, quantity });
    }

    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    await updateMemoryFromCart(userId, [{ itemName, quantity }]);

    res.json({ message: 'Item added', cart });
  } catch (err) {
    console.error('addItemToCart error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── 2. Remove item ────────────────────────────────────────────────────────────
export const removeItemFromCart = async (req, res) => {
  try {
    const { groupId, itemName } = req.body;
    const userId = req.user._id;
    const groupIdObj = getGroupObjectId(groupId);

    const cart = await Cart.findOne({ groupId: groupIdObj, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => !(i.itemName === itemName && i.userId.equals(userId)));
    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    res.json({ message: 'Item removed', cart });
  } catch (err) {
    console.error('removeItemFromCart error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── 3. View cart ──────────────────────────────────────────────────────────────
export const viewCart = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const groupIdObj = getGroupObjectId(groupId);

    const cart = await Cart.findOne({ groupId: groupIdObj });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const group = await Group.findById(groupIdObj);
    if (!group.members.some(m => m.equals(userId)))
      return res.status(403).json({ message: 'You are not a member of this group' });

    res.json({ cart, admin: group.admin.toString() });
  } catch (err) {
    console.error('viewCart error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── 4. Checkout (admin, with invoice upload) ─────────────────────────────────
export const checkoutCart = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Invoice file is required' });

    const { groupId } = req.body;
    const userId = req.user._id;
    const groupIdObj = getGroupObjectId(groupId);

    const group = await Group.findById(groupIdObj);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admin.equals(userId)) return res.status(403).json({ message: 'Only admin can checkout' });
    if (group.checkoutDeadline < new Date()) return res.status(400).json({ message: 'Deadline passed' });

    const cart = await Cart.findOne({ groupId: groupIdObj, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const invoiceUrl = `${req.protocol}://${req.get('host')}/uploads/invoices/${req.file.filename}`;
    group.invoiceUrl = invoiceUrl;

    const invoiceItems = await parseInvoiceWithGeminiVision(req.file.path, req.file.mimetype);
    cart.items = cart.items.map(cartItem => {
      let best = null, highScore = 0;
      invoiceItems.forEach(inv => {
        const score = stringSimilarity.compareTwoStrings(
          cartItem.itemName.trim().toLowerCase(),
          inv.itemName.trim().toLowerCase()
        );
        if (score > highScore) { highScore = score; best = inv; }
      });
      if (best && highScore >= 0.6) cartItem.price = best.price;
      return cartItem;
    });

    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const usersData = {};
    cart.items.forEach(item => {
      const uid = item.userId.toString();
      if (!usersData[uid]) usersData[uid] = { items: [], total: 0 };
      usersData[uid].items.push({ itemName: item.itemName, price: item.price, quantity: item.quantity, subtotal: item.price * item.quantity });
      usersData[uid].total += item.price * item.quantity;
    });

    cart.payments = Object.entries(usersData).map(([uid, d]) => ({
      userId: uid, amount: d.total, status: 'pending',
    }));

    cart.status = 'checkedout';
    await cart.save();

    const myItems = cart.items.filter(i => i.userId.toString() === userId.toString());
    await updateMemoryFromCart(userId, myItems.map(i => ({ itemName: i.itemName, quantity: i.quantity })));

    group.status = 'checkedout';
    await group.save();

    res.json({ message: 'Order placed successfully', cart, cartTotal: cart.total, invoiceUrl, users: usersData, invoiceItems });
  } catch (err) {
    console.error('checkoutCart error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── 5. Quick checkout (no invoice) ───────────────────────────────────────────
export const quickCheckout = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user._id;
    const groupIdObj = getGroupObjectId(groupId);

    const group = await Group.findById(groupIdObj);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admin.equals(userId)) return res.status(403).json({ message: 'Only admin can checkout' });
    if (group.checkoutDeadline < new Date()) return res.status(400).json({ message: 'Deadline passed' });

    const cart = await Cart.findOne({ groupId: groupIdObj, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const usersData = {};
    cart.items.forEach(item => {
      const uid = item.userId.toString();
      if (!usersData[uid]) usersData[uid] = { items: [], total: 0 };
      usersData[uid].items.push({ itemName: item.itemName, price: item.price, quantity: item.quantity, subtotal: item.price * item.quantity });
      usersData[uid].total += item.price * item.quantity;
    });

    cart.payments = Object.entries(usersData).map(([uid, d]) => ({
      userId: uid, amount: d.total, status: 'pending',
    }));
    cart.status = 'checkedout';
    await cart.save();

    const myItems = cart.items.filter(i => i.userId.toString() === userId.toString());
    await updateMemoryFromCart(userId, myItems.map(i => ({ itemName: i.itemName, quantity: i.quantity })));

    group.status = 'checkedout';
    await group.save();

    res.json({ message: 'Order placed successfully', cart, cartTotal: cart.total, users: usersData });
  } catch (err) {
    console.error('quickCheckout error:', err.message);
    res.status(500).json({ message: err.message });
  }
};