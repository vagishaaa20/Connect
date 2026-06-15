import Message from '../models/messageModel.js';
import Group from '../models/groupModel.js';
import Ride from '../models/rideModel.js';
import User from '../models/userModel.js';
import Cart from '../models/cartModel.js';
import jwt from 'jsonwebtoken';
import UserMemory from '../models/userMemoryModel.js';
import { getMemoryContext } from './memoryService.js';
import { detectOrderIntent, runOrderAgent, executeOrderAgent } from './orderAgent.js';
import { aiChat } from '../helpers/aiHelper.js';

// ── Build clean conversation history ─────────────────────────────────────────
const buildConversationHistory = async (groupId, memoryCtx, userName) => {
  const recent = await Message.find({ groupId })
    .sort({ createdAt: -1 }).limit(10).populate('sender', 'name');

  const conversationHistory = [];
  for (const msg of recent.reverse()) {
    if (msg.isAI) {
      try { JSON.parse(msg.text); continue; } catch {}
      conversationHistory.push({ role: 'model', parts: [{ text: msg.text }] });
    } else {
      conversationHistory.push({
        role: 'user',
        parts: [{ text: `${msg.sender?.name}: ${msg.text}` }],
      });
    }
  }

  const clean = [];
  for (const turn of conversationHistory) {
    const last = clean[clean.length - 1];
    if (last?.role === turn.role) {
      last.parts[0].text += '\n' + turn.parts[0].text;
    } else {
      clean.push({ ...turn, parts: [{ text: turn.parts[0].text }] });
    }
  }

  let userContext = 'New user, no order history yet.';
  if (memoryCtx) {
    userContext = memoryCtx.summary
      ? `User profile: "${memoryCtx.summary}".`
      : `User has ordered ${memoryCtx.totalOrders} times.`;
    if (memoryCtx.topItems?.length > 0)
      userContext += ` Favourite items: ${memoryCtx.topItems.map(i => i.name).join(', ')}.`;
    if (memoryCtx.usualOrderTime)
      userContext += ` Usually orders during ${memoryCtx.usualOrderTime}.`;
  }

  return [
    { role: 'user', parts: [{ text: `You are CampusAI, embedded in a campus group ordering app. ${userContext} Be casual and helpful. Current user: ${userName}.` }] },
    { role: 'model', parts: [{ text: `Got it! I know ${userName} and I'm ready to help. 🎓` }] },
    ...clean,
  ];
};

// ── Proactive discount detector ───────────────────────────────────────────────
const detectGroupDiscount = async (groupId, io) => {
  try {
    const cart = await Cart.findOne({ groupId, status: 'active' }).populate('items.userId', 'name');
    if (!cart || cart.items.length < 2) return;

    const itemCounts = {};
    const itemUsers = {};
    for (const item of cart.items) {
      const key = item.itemName.toLowerCase();
      itemCounts[key] = (itemCounts[key] || 0) + item.quantity;
      if (!itemUsers[key]) itemUsers[key] = new Set();
      itemUsers[key].add(item.userId?.name || 'Someone');
    }

    const hotItems = Object.entries(itemCounts)
      .filter(([, count]) => count >= 3)
      .map(([name, count]) => ({
        name, count,
        users: [...itemUsers[name]],
        estimatedSaving: Math.round(count * 10),
      }));

    if (hotItems.length === 0) return;

    const card = {
      type: 'discount_suggestion',
      items: hotItems,
      message: `${hotItems[0].users.slice(0, 3).join(', ')} are all ordering ${hotItems[0].name}!`,
    };

    io.to(groupId).emit('newMessage', {
      _id: `discount_${Date.now()}`,
      text: JSON.stringify(card),
      isAI: true,
      isStructured: true,
      sender: { _id: 'campusbot', name: 'CampusAI 🤖' },
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('detectGroupDiscount error (non-fatal):', err.message);
  }
};

// ── AI command handler ────────────────────────────────────────────────────────
const handleAICommand = async (text, groupId, userId, userName) => {
  const memoryCtx = await getMemoryContext(userId);
  const history = await buildConversationHistory(groupId, memoryCtx, userName);

  let prompt = '';
  let isStructured = false;
  let structureType = null;

  if (text.startsWith('/recommend')) {
    isStructured = true;
    structureType = 'recommendations';
    const topItems = memoryCtx?.topItems?.map(i => i.name).join(', ') || 'not available';
    prompt = `Based on this user's history (favourites: ${topItems}) and our conversation, suggest exactly 3 personalized food items.
Return ONLY this JSON, no explanation, no markdown:
{"type":"recommendations","suggestions":[{"item":"...","reason":"...","estimatedPrice":0}]}`;

  } else if (text.startsWith('/summarize')) {
    prompt = `Summarize what's been discussed in this group chat in 3-4 sentences. Focus on what was ordered or planned.`;

  } else if (text.startsWith('/split')) {
    const cart = await Cart.findOne({ groupId, status: 'active' }).populate('items.userId', 'name');
    if (!cart) return { type: 'agent_reply', text: 'No active cart found for this group.' };
    const perUser = {};
    cart.items.forEach(item => {
      const name = item.userId?.name || 'Unknown';
      if (!perUser[name]) perUser[name] = 0;
      perUser[name] += item.price * item.quantity;
    });
    isStructured = true;
    structureType = 'split_summary';
    prompt = `Return ONLY this JSON for a bill split, no extra text:
{"type":"split_summary","splits":[${Object.entries(perUser).map(([name, total]) => `{"name":"${name}","amount":${total.toFixed(2)}}`).join(',')}],"total":${cart.total.toFixed(2)},"message":"Here's the split!"}`;

  } else if (text.startsWith('/ai ')) {
    prompt = text.replace('/ai ', '').trim();
  }

  if (!prompt) return null;

  const raw = await aiChat(prompt, history);

  if (isStructured) {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON');
      const parsed = JSON.parse(match[0]);
      return { type: structureType, ...parsed, isStructured: true };
    } catch {
      return { type: 'agent_reply', text: raw };
    }
  }

  return { type: 'agent_reply', text: raw };
};

// ── Socket.io init ────────────────────────────────────────────────────────────
export const initChat = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Not authorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Token invalid'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // ── Group chat ────────────────────────────────────────────────────────────
    socket.on('joinGroup', async (groupId) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) return socket.emit('errorMessage', 'Group not found');
        if (!group.members.includes(socket.userId) && group.admin.toString() !== socket.userId)
          return socket.emit('errorMessage', 'Not a member of this group');

        socket.join(groupId);
        const recentMessages = await Message.find({ groupId })
          .sort({ createdAt: 1 }).limit(50).populate('sender', 'name _id');
        socket.emit('recentMessages', recentMessages);
      } catch {
        socket.emit('errorMessage', 'Failed to join group');
      }
    });

    // ── Ride chat ─────────────────────────────────────────────────────────────
    // roomId is always "ride_<rideId>" — e.g. "ride_6657abc123"
    socket.on('joinRideChat', async (roomId) => {
      try {
        const rideId = roomId.replace('ride_', '');
        const ride = await Ride.findById(rideId);
        if (!ride) return socket.emit('errorMessage', 'Ride not found');

        const userId = socket.userId;
        const isPassenger = ride.passengers.some(p => p.toString() === userId.toString());
        const isCreator   = ride.creator.toString() === userId.toString();
        if (!isPassenger && !isCreator)
          return socket.emit('errorMessage', 'Not a member of this ride');

        socket.join(roomId);
        // Reuse the same Message collection — groupId field stores the roomId string
        const recentMessages = await Message.find({ groupId: roomId })
          .sort({ createdAt: 1 }).limit(50).populate('sender', 'name _id');
        socket.emit('recentMessages', recentMessages);
      } catch (err) {
        console.error('joinRideChat error:', err.message);
        socket.emit('errorMessage', 'Failed to join ride chat');
      }
    });

    socket.on('sendRideMessage', async ({ roomId, text }) => {
      try {
        const rideId = roomId.replace('ride_', '');
        const ride = await Ride.findById(rideId);
        if (!ride) return socket.emit('errorMessage', 'Ride not found');

        const userId = socket.userId;
        const isPassenger = ride.passengers.some(p => p.toString() === userId.toString());
        const isCreator   = ride.creator.toString() === userId.toString();
        if (!isPassenger && !isCreator)
          return socket.emit('errorMessage', 'Not a member of this ride');

        // Store message with roomId as the groupId field
        const msg = await Message.create({ groupId: roomId, sender: userId, text });
        const populated = await msg.populate('sender', 'name _id');
        io.to(roomId).emit('newMessage', populated);
      } catch (err) {
        console.error('sendRideMessage error:', err.message);
        socket.emit('errorMessage', 'Failed to send message');
      }
    });

    socket.on('rideTyping', async ({ roomId }) => {
      try {
        const user = await User.findById(socket.userId);
        socket.to(roomId).emit('userTyping', { userId: user?.name });
      } catch {}
    });

    // ── Group sendMessage ─────────────────────────────────────────────────────
    socket.on('sendMessage', async ({ groupId, text }) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) return socket.emit('errorMessage', 'Group not found');
        if (!group.members.includes(socket.userId) && group.admin.toString() !== socket.userId)
          return socket.emit('errorMessage', 'Not a member');

        const user = await User.findById(socket.userId);
        const userName = user?.name || 'User';

        if (detectOrderIntent(text)) {
          const userMsg = await Message.create({ groupId, sender: socket.userId, text });
          const populatedUserMsg = await userMsg.populate('sender', 'name _id');
          io.to(groupId).emit('newMessage', populatedUserMsg);

          const agentResult = await runOrderAgent({ userId: socket.userId, groupId, text, io });
          io.to(groupId).emit('newMessage', {
            _id: `agent_${Date.now()}`,
            text: JSON.stringify(agentResult),
            isAI: true,
            isStructured: true,
            sender: { _id: 'campusbot', name: 'CampusAI 🤖' },
            createdAt: new Date(),
          });
          return;
        }

        const isAICmd = text.startsWith('/summarize') || text.startsWith('/recommend')
          || text.startsWith('/split') || text.startsWith('/ai ');

        if (isAICmd) {
          try {
            const result = await handleAICommand(text, groupId, socket.userId, userName);
            if (result) {
              const isStructured = result.isStructured || false;
              const msgText = isStructured ? JSON.stringify(result) : result.text;
              io.to(groupId).emit('newMessage', {
                _id: `bot_${Date.now()}`,
                text: msgText,
                isAI: true,
                isStructured,
                sender: { _id: 'campusbot', name: 'CampusAI 🤖' },
                createdAt: new Date(),
              });
            }
          } catch (err) {
            socket.emit('errorMessage', 'AI command failed: ' + err.message);
          }
          return;
        }

        const msg = await Message.create({ groupId, sender: socket.userId, text });
        const populated = await msg.populate('sender', 'name _id');
        io.to(groupId).emit('newMessage', populated);
        detectGroupDiscount(groupId, io).catch(() => {});

      } catch (err) {
        socket.emit('errorMessage', 'Failed to send message');
      }
    });

    socket.on('agentConfirm', async ({ groupId, items }) => {
      try {
        const result = await executeOrderAgent({ userId: socket.userId, groupId, items, io });
        io.to(groupId).emit('newMessage', {
          _id: `agent_done_${Date.now()}`,
          text: JSON.stringify(result),
          isAI: true,
          isStructured: true,
          sender: { _id: 'campusbot', name: 'CampusAI 🤖' },
          createdAt: new Date(),
        });
      } catch (err) {
        socket.emit('errorMessage', 'Agent confirm failed: ' + err.message);
      }
    });

    socket.on('typing', async ({ groupId }) => {
      try {
        const user = await User.findById(socket.userId);
        socket.to(groupId).emit('userTyping', { userId: user?.name });
      } catch {}
    });

    // ── Live ride tracking — all passengers share location ────────────────────
    socket.on('startRideTracking', ({ rideId }) => {
      socket.join(`ride_${rideId}`);
      console.log(`[TRACK] User ${socket.userId} joined ride_${rideId}`);
    });

    socket.on('updateLocation', ({ rideId, lat, lng, name }) => {
      socket.to(`ride_${rideId}`).emit('memberLocationUpdate', {
        userId: socket.userId,
        name,
        lat,
        lng,
        timestamp: new Date(),
      });
    });

    socket.on('stopRideTracking', ({ rideId }) => {
      socket.to(`ride_${rideId}`).emit('memberStopped', { userId: socket.userId });
      socket.leave(`ride_${rideId}`);
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });
};

// ── REST helpers ──────────────────────────────────────────────────────────────
export const sendMessage = async (groupId, userId, text, io) => {
  const msg = await Message.create({ groupId, sender: userId, text });
  const populated = await msg.populate('sender', 'name _id');
  io.to(groupId).emit('newMessage', populated);
  return populated;
};

export const fetchMessages = async (groupId, limit = 50) =>
  Message.find({ groupId }).sort({ createdAt: 1 }).limit(limit).populate('sender', 'name email');

export const deleteMessage = async (messageId, userId) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error('Message not found');
  if (msg.sender.toString() !== userId.toString()) throw new Error('Unauthorized');
  await msg.deleteOne();
  return { message: 'Message deleted' };
};

export const editMessage = async (messageId, userId, newText) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error('Message not found');
  if (msg.sender.toString() !== userId.toString()) throw new Error('Unauthorized');
  msg.text = newText;
  await msg.save();
  return msg;
};