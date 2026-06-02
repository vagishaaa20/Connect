import Message from '../models/messageModel.js';
import Group from '../models/groupModel.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI command handler
import UserMemory from '../models/userMemoryModel.js';

const handleAICommand = async (text, groupId, userId) => {
  // Load user's memory
  const memory = await UserMemory.findOne({ userId });
  const userContext = memory?.aiSummary
    ? `User profile: ${memory.aiSummary}. Top items: ${memory.frequentItems.slice(0,3).map(i => i.name).join(', ')}.`
    : 'New user, no order history yet.';

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  let prompt = '';

  if (text.startsWith('/recommend')) {
    prompt = `
You are a campus food assistant with memory of this user.
${userContext}
Based on their history, suggest 3 personalized items for tonight's group order.
Make it feel personal — reference their past preferences.`;

  } else if (text.startsWith('/summarize')) {
    const recent = await Message.find({ groupId }).sort({ createdAt: -1 }).limit(20).populate('sender', 'name');
    const history = recent.reverse().map(m => `${m.sender?.name}: ${m.text}`).join('\n');
    prompt = `Summarize this group chat:\n${history}`;

  } else if (text.startsWith('/split')) {
    const cart = await Cart.findOne({ group: groupId, status: 'active' });
    prompt = `
${userContext}
Explain this bill split to the user personally. Make it feel like you know them.
Cart: ${JSON.stringify(cart?.items)}`;
  }

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

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
            const aiReply = await handleAICommand(text, groupId);
            if (aiReply) {
              // Broadcast AI reply as bot message (no DB save, ephemeral)
              io.to(groupId).emit('newMessage', {
                _id: `bot_${Date.now()}`,
                text: aiReply,
                isAI: true,
                sender: { _id: 'campusbot', name: 'CampusAI' },
                createdAt: new Date(),
              });
            }
          } catch (aiErr) {
            socket.emit('errorMessage', 'AI command failed: ' + aiErr.message);
          }
          return; // don't save AI commands as regular messages
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

// Keep these exports unchanged — used by REST routes if any
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