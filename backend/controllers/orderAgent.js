import Cart from '../models/cartModel.js';
import UserMemory from '../models/userMemoryModel.js';
import { updateMemoryFromCart } from './memoryService.js';
import { aiText } from '../helpers/aiHelper.js';

// ── Intent patterns the agent recognises ─────────────────────────────────────
const ORDER_INTENT_PATTERNS = [
  /order what i (normally|usually|always) (eat|get|have|order)/i,
  /get me (the |my )?(usual|same as (always|last time|before))/i,
  /add my (usual|regular|normal) (order|items|food)/i,
  /my usual (please|pls|order)?/i,
  /same as (last time|always|usual)/i,
  /repeat (my |last |previous )?(order|items)/i,
  /(just )?order (the )?usual/i,
];

export const detectOrderIntent = (text) =>
  ORDER_INTENT_PATTERNS.some(p => p.test(text));

// ── Core agent: resolve intent → confirm → execute ───────────────────────────
export const runOrderAgent = async ({ userId, groupId, text, io }) => {
  const memory = await UserMemory.findOne({ userId });

  if (!memory || memory.frequentItems.length === 0) {
    return {
      type: 'agent_reply',
      text: "I don't have any order history for you yet! Order something first and I'll remember it for next time. 🧠",
    };
  }

  const cart = await Cart.findOne({ groupId, status: 'active' });
  if (!cart) {
    return {
      type: 'agent_reply',
      text: "There's no active cart for this group right now. Ask the admin to create one first!",
    };
  }

  const topItems = memory.frequentItems.slice(0, 3);

  const confirmPrompt = `A campus student typed: "${text}"
Their top ordered items are: ${topItems.map(i => `${i.name} (ordered ${i.count} times)`).join(', ')}.
Their usual order time: ${memory.usualOrderTime || 'anytime'}.
Write a SHORT confirmation message (1-2 sentences, casual campus tone) asking if they want you to add these items to the group cart.
Then on a new line write ONLY: ITEMS:${topItems.map(i => i.name).join('|')}
Do not add anything else after the ITEMS line.`;

  let confirmText = `I'll add your usual items: ${topItems.map(i => i.name).join(', ')}. Sound good?`;

  try {
    const raw = await aiText(confirmPrompt);
    const lines = raw.split('\n');
    confirmText = lines.filter(l => !l.startsWith('ITEMS:')).join(' ').trim();
  } catch (err) {
    console.error('runOrderAgent confirm prompt error (non-fatal):', err.message);
  }

  return {
    type: 'agent_confirm',
    text: confirmText,
    payload: {
      action: 'add_usual_items',
      groupId,
      userId: userId.toString(),
      items: topItems.map(i => ({
        itemName: i.name,
        quantity: 1,
        price: 0,
      })),
    },
  };
};

// ── Execute the order after user confirms ─────────────────────────────────────
export const executeOrderAgent = async ({ userId, groupId, items, io }) => {
  try {
    const cart = await Cart.findOne({ groupId, status: 'active' });
    if (!cart) throw new Error('Cart no longer active');

    const addedItems = [];
    for (const item of items) {
      const existing = cart.items.find(
        i => i.itemName.toLowerCase() === item.itemName.toLowerCase()
      );
      const price = existing?.price || item.price || 50;

      cart.items.push({
        itemName: item.itemName,
        price,
        quantity: item.quantity,
        userId,
        image: '',
      });
      addedItems.push({ itemName: item.itemName, price, quantity: item.quantity });
    }

    cart.total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    await cart.save();

    await updateMemoryFromCart(userId, addedItems);
    io.to(groupId).emit('cartUpdated', { cart });

    return {
      type: 'agent_reply',
      text: `Done! Added ${addedItems.map(i => i.itemName).join(', ')} to the group cart. 🛒✨`,
    };
  } catch (err) {
    return {
      type: 'agent_reply',
      text: `Couldn't add items: ${err.message}`,
    };
  }
};