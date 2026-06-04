import Message from '../models/messageModel.js';
import Group from '../models/groupModel.js';
import User from '../models/userModel.js';
import Cart from '../models/cartModel.js';
import jwt from 'jsonwebtoken';
import UserMemory from '../models/userMemoryModel.js';


// ---------- AI command handler ----------
// ---------- Gemini direct fetch helper (updated to support multi-turn) ----------
const geminiChat = async (prompt, conversationHistory = []) => {
  // If conversation history provided, use multi-turn format
  const contents = conversationHistory.length > 0
    ? [
        ...conversationHistory,
        { role: 'user', parts: [{ text: prompt }] }
      ]
    : [{ role: 'user', parts: [{ text: prompt }] }];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');
  return data.candidates[0].content.parts[0].text.trim();
};

// ---------- AI command handler with true multi-turn ----------
const handleAICommand = async (text, groupId, userId) => {
  const memory = await UserMemory.findOne({ userId });
  const userContext = memory?.aiSummary
    ? `User profile: ${memory.aiSummary}. Top items: ${memory.frequentItems.slice(0, 3).map(i => i.name).join(', ')}.`
    : 'New user, no order history yet.';

  // Fetch recent messages and convert to Gemini multi-turn format
  const recent = await Message.find({ groupId })
    .sort({ createdAt: -1 }).limit(10).populate('sender', 'name');
  const recentMessages = recent.reverse();

  // Build conversation history in Gemini format
  // Alternate user/model turns — AI messages become 'model', human messages become 'user'
  const conversationHistory = [];
  for (const msg of recentMessages) {
    if (msg.isAI) {
      // Skip structured JSON messages (suggestion cards) — they confuse the model
      try {
        JSON.parse(msg.text);
        continue;
      } catch {}
      conversationHistory.push({ role: 'model', parts: [{ text: msg.text }] });
    } else {
      conversationHistory.push({
        role: 'user',
        parts: [{ text: `${msg.sender?.name}: ${msg.text}` }]
      });
    }
  }

  // Gemini requires alternating user/model turns — deduplicate consecutive same roles
  const cleanHistory = [];
  for (const turn of conversationHistory) {
    const last = cleanHistory[cleanHistory.length - 1];
    if (last && last.role === turn.role) {
      // Merge consecutive same-role turns into one
      last.parts[0].text += '\n' + turn.parts[0].text;
    } else {
      cleanHistory.push({ ...turn, parts: [{ text: turn.parts[0].text }] });
    }
  }

  // System context prepended as first user turn if history exists
  const systemTurn = {
    role: 'user',
    parts: [{ text: `You are CampusAI, a helpful assistant in a campus group ordering app. ${userContext} Be casual and campus-friendly.` }]
  };
  const systemAck = {
    role: 'model',
    parts: [{ text: `Got it! I know this user well and I'm ready to help with the group order.` }]
  };

  const fullHistory = [systemTurn, systemAck, ...cleanHistory];

  let prompt = '';
  let isStructured = false;

  if (text.startsWith('/recommend')) {
    isStructured = true;
    prompt = `Based on our conversation and this user's history, suggest exactly 3 personalized food items.
Return ONLY this JSON, no explanation, no markdown:
{"suggestions": [{"item": "...", "reason": "...", "estimatedPrice": 0}]}`;

  } else if (text.startsWith('/summarize')) {
    prompt = `Summarize what's been discussed in this group chat in 3-4 sentences. Focus on what was ordered or planned.`;

  } else if (text.startsWith('/split')) {
    const cart = await Cart.findOne({ groupId, status: 'active' }).populate('items.userId', 'name');
    if (!cart) return 'No active cart found for this group.';
    const perUser = {};
    cart.items.forEach(item => {
      const name = item.userId?.name || 'Unknown';
      if (!perUser[name]) perUser[name] = 0;
      perUser[name] += item.price * item.quantity;
    });
    const splitSummary = Object.entries(perUser)
      .map(([name, total]) => `${name}: ₹${total.toFixed(2)}`).join(', ');
    prompt = `Explain this bill split in a friendly campus-casual tone (2-3 sentences):
${splitSummary}
Total: ₹${cart.total.toFixed(2)}`;

  } else if (text.startsWith('/ai ')) {
    prompt = text.replace('/ai ', '').trim();
  }

  if (!prompt) return null;

  const raw = await geminiChat(prompt, fullHistory);

  if (isStructured) {
    try {
      const match = raw.match(/\{.*\}/s);
      if (!match) throw new Error('No JSON found');
      const parsed = JSON.parse(match[0]);
      if (!parsed.suggestions) throw new Error('Invalid structure');
      return JSON.stringify(parsed);
    } catch (e) {
      console.error('Structured AI parse error:', e.message);
      return raw;
    }
  }

  return raw;
};

// ---------- Socket.io chat init ----------
export const initChat = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Not authorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Token invalid'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected', socket.userId);

    socket.on('joinGroup', async (groupId) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) return socket.emit('errorMessage', 'Group not found');
        if (!group.members.includes(socket.userId) && group.admin.toString() !== socket.userId)
          return socket.emit('errorMessage', 'You are not a member of this group');

        socket.join(groupId);

        const recentMessages = await Message.find({ groupId })
          .sort({ createdAt: 1 }).limit(50).populate('sender', 'name _id');
        socket.emit('recentMessages', recentMessages);
      } catch (err) {
        socket.emit('errorMessage', 'Failed to join group');
      }
    });

    socket.on('sendMessage', async ({ groupId, text }) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) return socket.emit('errorMessage', 'Group not found');
        if (!group.members.includes(socket.userId) && group.admin.toString() !== socket.userId)
          return socket.emit('errorMessage', 'You are not a member of this group');

        const isAICmd = text.startsWith('/summarize') || text.startsWith('/recommend')
          || text.startsWith('/split') || text.startsWith('/ai ');

        if (isAICmd) {
          try {
            // Fix: pass socket.userId so handleAICommand gets user context
            const aiReply = await handleAICommand(text, groupId, socket.userId);
            if (aiReply) {
              io.to(groupId).emit('newMessage', {
                _id: `bot_${Date.now()}`,
                text: aiReply,
                isAI: true,
                sender: { _id: 'campusbot', name: 'CampusAI 🤖' },
                createdAt: new Date(),
              });
            }
          } catch (aiErr) {
            console.error('AI command error:', aiErr.message);
            socket.emit('errorMessage', 'AI command failed: ' + aiErr.message);
          }
          return;
        }

        // Normal message
        const msg = await Message.create({ groupId, sender: socket.userId, text });
        const populatedMsg = await msg.populate('sender', 'name _id');
        io.to(groupId).emit('newMessage', populatedMsg);
      } catch (err) {
        socket.emit('errorMessage', 'Failed to send message');
      }
    });

    socket.on('typing', async ({ groupId }) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) return;
        if (!group.members.includes(socket.userId) && group.admin.toString() !== socket.userId) return;
        const user = await User.findById(socket.userId);
        socket.to(groupId).emit('userTyping', { userId: user.name });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.userId);
    });
  });
};

// ---------- REST helpers (used by chat routes) ----------
export const sendMessage = async (groupId, userId, text, io) => {
  const msg = await Message.create({ groupId, sender: userId, text });
  const populated = await msg.populate('sender', 'name _id');
  io.to(groupId).emit('newMessage', populated);
  return populated;
};

export const fetchMessages = async (groupId, limit = 50) => {
  return Message.find({ groupId }).sort({ createdAt: 1 }).limit(limit).populate('sender', 'name email');
};

export const deleteMessage = async (messageId, userId) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error('Message not found');
  if (msg.sender.toString() !== userId) throw new Error('Unauthorized');
  await msg.deleteOne();
  return { message: 'Message deleted' };
};

export const editMessage = async (messageId, userId, newText) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error('Message not found');
  if (msg.sender.toString() !== userId) throw new Error('Unauthorized');
  msg.text = newText;
  await msg.save();
  return msg;
};