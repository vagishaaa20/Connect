// test.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // loads GROQ_API_KEY from .env

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY not found in environment variables");
  process.exit(1);
}

async function testGroq() {
  try {
    const endpoint = "https://api.groq.com/openai/v1/chat/completions";

    const response = await axios.post(
      endpoint,
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: "Say hello in JSON format: {\"greeting\": \"...\"}" }
        ],
        max_tokens: 50,
        temperature: 0
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ API Response:", response.data);
  } catch (err) {
    console.error("❌ Groq Llama API error:", err.response?.status, err.response?.data || err.message);
  }
}

testGroq();

