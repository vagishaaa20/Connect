import cron from 'node-cron';
import mongoose from 'mongoose';

// Import models — adjust paths if needed
let Ride, Group, Cart;

const loadModels = async () => {
  if (!Ride) Ride = (await import('../models/rideModel.js')).default;
  if (!Group) Group = (await import('../models/groupModel.js')).default;
  if (!Cart) Cart = (await import('../models/cartModel.js')).default;
};

// ---------- Job 1: Expire old rides (every 15 mins) ----------
const expireRides = async () => {
  try {
    await loadModels();
    const now = new Date();
    const result = await Ride.updateMany(
      { status: 'open', departureTime: { $lt: now, $ne: null } },
      { $set: { status: 'expired' } }
    );
    if (result.modifiedCount > 0)
      console.log(`[CRON] Expired ${result.modifiedCount} rides`);
  } catch (err) {
    console.error('[CRON] expireRides error:', err.message);
  }
};

// ---------- Job 2: Warn groups nearing checkout deadline (every 30 mins) ----------
const warnDeadlines = async (io) => {
  try {
    await loadModels();
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins from now

    const groups = await Group.find({
      status: 'active',
      checkoutDeadline: { $gte: now, $lte: soon },
    });

    for (const group of groups) {
      const minutesLeft = Math.round((group.checkoutDeadline - now) / 60000);
      if (io) {
        io.to(group._id.toString()).emit('newMessage', {
          _id: `bot_${Date.now()}`,
          text: `⏰ Heads up! Group order closes in ${minutesLeft} minutes. Add your items now!`,
          isAI: true,
          sender: { _id: 'campusbot', name: 'CampusAI 🤖' },
          createdAt: new Date(),
        });
      }
    }
    if (groups.length > 0)
      console.log(`[CRON] Warned ${groups.length} groups about deadline`);
  } catch (err) {
    console.error('[CRON] warnDeadlines error:', err.message);
  }
};

// ---------- Job 3: Reset proactive AI triggers at midnight ----------
const resetProactiveTriggers = () => {
  try {
    // Import checkProactive's _triggered set indirectly via a global
    if (global.__proactiveTriggered) {
      global.__proactiveTriggered.clear();
      console.log('[CRON] Reset proactive AI triggers');
    }
  } catch (err) {
    console.error('[CRON] resetProactiveTriggers error:', err.message);
  }
};

// ---------- Job 4: Cleanup invoice files older than 30 days (daily) ----------
const cleanupInvoices = async () => {
  try {
    const { default: fs } = await import('fs');
    const { default: path } = await import('path');
    const dir = './uploads/invoices';
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    const now = Date.now();
    let deleted = 0;

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const ageDays = (now - stat.mtimeMs) / (1000 * 60 * 60 * 24);
      if (ageDays > 30) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    });

    if (deleted > 0) console.log(`[CRON] Deleted ${deleted} old invoice files`);
  } catch (err) {
    console.error('[CRON] cleanupInvoices error:', err.message);
  }
};

// ---------- Init all cron jobs ----------
export const initCronJobs = (io) => {
  // Every 15 minutes — expire old rides
  cron.schedule('*/15 * * * *', () => {
    console.log('[CRON] Running: expireRides');
    expireRides();
  });

  // Every 30 minutes — warn groups about deadlines
  cron.schedule('*/30 * * * *', () => {
    console.log('[CRON] Running: warnDeadlines');
    warnDeadlines(io);
  });

  // Every midnight — reset proactive AI triggers
  cron.schedule('0 0 * * *', () => {
    console.log('[CRON] Running: resetProactiveTriggers');
    resetProactiveTriggers();
  });

  // Every day at 2am — cleanup old invoices
  cron.schedule('0 2 * * *', () => {
    console.log('[CRON] Running: cleanupInvoices');
    cleanupInvoices();
  });

  console.log('[CRON] All cron jobs initialized');
};
