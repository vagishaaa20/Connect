import UserMemory from '../models/userMemoryModel.js';
import Cart from '../models/cartModel.js';
import { aiText } from '../helpers/aiHelper.js';

// ── Called after every successful cart add / checkout ────────────────────────
export const updateMemoryFromCart = async (userId, items) => {
  try {
    let memory = await UserMemory.findOne({ userId });
    if (!memory) memory = new UserMemory({ userId });

    const hour = new Date().getHours();
    memory.usualOrderTime =
      hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 20 ? 'evening' : 'late-night';

    for (const item of items) {
      const existing = memory.frequentItems.find(
        f => f.name.toLowerCase() === item.itemName.toLowerCase()
      );
      if (existing) {
        existing.count += item.quantity;
      } else {
        memory.frequentItems.push({ name: item.itemName, count: item.quantity });
      }
    }

    memory.frequentItems.sort((a, b) => b.count - a.count);
    memory.frequentItems = memory.frequentItems.slice(0, 20);
    memory.totalOrders += 1;
    memory.lastUpdated = new Date();

    if (memory.totalOrders % 3 === 0) {
      await regenerateSummary(memory);
    }

    await memory.save();
  } catch (err) {
    console.error('updateMemoryFromCart error:', err.message);
  }
};

// ── Called after a ride is joined / created ──────────────────────────────────
export const updateMemoryFromRide = async (userId, origin, destination) => {
  try {
    let memory = await UserMemory.findOne({ userId });
    if (!memory) memory = new UserMemory({ userId });

    const existing = memory.frequentRoutes.find(
      r => r.origin.toLowerCase() === origin.toLowerCase() &&
           r.destination.toLowerCase() === destination.toLowerCase()
    );
    if (existing) {
      existing.count += 1;
    } else {
      memory.frequentRoutes.push({ origin, destination, count: 1 });
    }

    memory.frequentRoutes.sort((a, b) => b.count - a.count);
    memory.frequentRoutes = memory.frequentRoutes.slice(0, 10);
    memory.totalRides += 1;
    memory.lastUpdated = new Date();

    await memory.save();
  } catch (err) {
    console.error('updateMemoryFromRide error:', err.message);
  }
};

// ── Regenerate the LLM-written profile summary ───────────────────────────────
const regenerateSummary = async (memory) => {
  try {
    const topItems = memory.frequentItems.slice(0, 5).map(i => `${i.name} (×${i.count})`).join(', ');
    const topRoutes = memory.frequentRoutes.slice(0, 3)
      .map(r => `${r.origin}→${r.destination}`).join(', ');

    const prompt = `Write a single sentence user profile for a campus student based on this data.
Top ordered items: ${topItems || 'none yet'}.
Frequent routes: ${topRoutes || 'none yet'}.
Usual order time: ${memory.usualOrderTime || 'unknown'}.
Total orders: ${memory.totalOrders}. Total rides: ${memory.totalRides}.
Example output: "Evening hostel orderer who loves veg biryani and frequently rides to City Mall."
Return ONLY the sentence, no quotes, no extra text.`;

    const summary = await aiText(prompt);
    if (summary) memory.aiSummary = summary;
  } catch (err) {
    console.error('regenerateSummary error (non-fatal):', err.message);
  }
};

// ── Get memory formatted for prompt injection ─────────────────────────────────
export const getMemoryContext = async (userId) => {
  try {
    const memory = await UserMemory.findOne({ userId });
    if (!memory || memory.totalOrders === 0) return null;
    return {
      summary: memory.aiSummary || null,
      topItems: memory.frequentItems.slice(0, 5),
      topRoutes: memory.frequentRoutes.slice(0, 3),
      usualOrderTime: memory.usualOrderTime,
      totalOrders: memory.totalOrders,
    };
  } catch {
    return null;
  }
};