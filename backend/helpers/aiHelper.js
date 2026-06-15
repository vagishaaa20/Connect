import OpenAI from 'openai';
import Groq from 'groq-sdk';

// ── Lazy clients ──────────────────────────────────────────────────────────────
let _openai = null;
const getOpenAI = () => {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
};

let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

// ── Quota error detector ──────────────────────────────────────────────────────
const isQuotaError = (msg) =>
  msg?.includes('quota') ||
  msg?.includes('429') ||
  msg?.includes('rate') ||
  msg?.includes('RESOURCE_EXHAUSTED') ||
  msg?.includes('exceeded');

// ═════════════════════════════════════════════════════════════════════════════
// TEXT HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const geminiText = async (prompt, contents = null) => {
  const body = contents
    ? { contents }
    : { contents: [{ parts: [{ text: prompt }] }] };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Gemini error');
  return data.candidates[0].content.parts[0].text.trim();
};

const groqText = async (prompt) => {
  const response = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content.trim();
};

const openaiText = async (prompt) => {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content.trim();
};

// ── Main text export: Gemini → Groq → OpenAI → fallback message ──────────────
export const aiText = async (prompt, contents = null) => {
  // 1st: Gemini
  try {
    return await geminiText(prompt, contents);
  } catch (err) {
    if (!isQuotaError(err.message)) throw err;
    console.warn('[AI] Gemini quota hit → trying Groq');
  }

  // 2nd: Groq (free)
  try {
    return await groqText(prompt);
  } catch (err) {
    if (!isQuotaError(err.message)) throw err;
    console.warn('[AI] Groq quota hit → trying OpenAI');
  }

  // 3rd: OpenAI (paid fallback)
  try {
    return await openaiText(prompt);
  } catch (err) {
    if (!isQuotaError(err.message)) throw err;
    console.warn('[AI] OpenAI quota hit → returning fallback message');
  }

  // Final fallback
  return "I'm temporarily unavailable due to high demand. Please try again in a moment! 🙏";
};

// ═════════════════════════════════════════════════════════════════════════════
// CHAT HELPERS (multi-turn, Gemini history format)
// ═════════════════════════════════════════════════════════════════════════════

const geminiChat = async (prompt, conversationHistory = []) => {
  const contents = conversationHistory.length > 0
    ? [...conversationHistory, { role: 'user', parts: [{ text: prompt }] }]
    : [{ role: 'user', parts: [{ text: prompt }] }];
  return await geminiText(null, contents);
};

const groqChat = async (prompt, conversationHistory = []) => {
  // Convert Gemini history format → OpenAI/Groq format
  const messages = conversationHistory.map(turn => ({
    role: turn.role === 'model' ? 'assistant' : 'user',
    content: turn.parts[0].text,
  }));
  messages.push({ role: 'user', content: prompt });

  const response = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
  });
  return response.choices[0].message.content.trim();
};

const openaiChat = async (prompt, conversationHistory = []) => {
  const messages = conversationHistory.map(turn => ({
    role: turn.role === 'model' ? 'assistant' : 'user',
    content: turn.parts[0].text,
  }));
  messages.push({ role: 'user', content: prompt });

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });
  return response.choices[0].message.content.trim();
};

// ── Main chat export: Gemini → Groq → OpenAI → fallback message ──────────────
export const aiChat = async (prompt, conversationHistory = []) => {
  // 1st: Gemini
  try {
    return await geminiChat(prompt, conversationHistory);
  } catch (err) {
    if (!isQuotaError(err.message)) throw err;
    console.warn('[AI] Gemini chat quota hit → trying Groq');
  }

  // 2nd: Groq
  try {
    return await groqChat(prompt, conversationHistory);
  } catch (err) {
    if (!isQuotaError(err.message)) throw err;
    console.warn('[AI] Groq chat quota hit → trying OpenAI');
  }

  // 3rd: OpenAI
  try {
    return await openaiChat(prompt, conversationHistory);
  } catch (err) {
    if (!isQuotaError(err.message)) throw err;
    console.warn('[AI] OpenAI chat quota hit → returning fallback message');
  }

  // Final fallback
  return "I'm temporarily unavailable due to high demand. Please try again in a moment! 🙏";
};

// ═════════════════════════════════════════════════════════════════════════════
// VISION HELPERS (Groq has no vision — chain is Gemini → GPT-4o only)
// ═════════════════════════════════════════════════════════════════════════════

const geminiVision = async (base64, mimeType, prompt) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Gemini Vision error');
  return data.candidates[0].content.parts[0].text.trim();
};

const openaiVision = async (base64, mimeType, prompt) => {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: 'text', text: prompt },
      ],
    }],
  });
  return response.choices[0].message.content.trim();
};

// ── Main vision export: Gemini → GPT-4o → fallback message ───────────────────
export const aiVision = async (base64, mimeType, prompt) => {
  // 1st: Gemini Vision
  try {
    return await geminiVision(base64, mimeType, prompt);
  } catch (err) {
    if (!isQuotaError(err.message)) throw err;
    console.warn('[AI] Gemini Vision quota hit → trying GPT-4o');
  }

  // 2nd: GPT-4o (Groq has no vision support)
  try {
    return await openaiVision(base64, mimeType, prompt);
  } catch (err) {
    if (!isQuotaError(err.message)) throw err;
    console.warn('[AI] GPT-4o vision quota hit → returning fallback');
  }

  // Final fallback
  return '{"error": "Vision AI temporarily unavailable. Please try again later."}';
};