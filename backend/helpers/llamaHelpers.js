import axios from "axios";

export const parseInvoiceWithGroqLlama = async (pdfText) => {
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";
  const apiKey = process.env.GROQ_API_KEY;
  console.log("API key exists?", !!apiKey);

  try {
    const response = await axios.post(
      endpoint,
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `
Extract item names and prices from this invoice text.
Return JSON array of objects ONLY:
[{ "itemName": "...", "price": number }, ...]
Invoice text:
${pdfText}
            `
          }
        ],
        max_tokens: 512,
        temperature: 0.0
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    let text = response.data.choices?.[0]?.message?.content;
    if (!text) throw new Error("No content returned from Llama API");

    // Extract JSON block using regex
    const match = text.match(/\[.*\]/s); // match everything between [ ... ]
    if (!match) {
      console.error("Failed to extract JSON from Llama response:", text);
      throw new Error("No JSON found in Llama API response");
    }

    const items = JSON.parse(match[0]);
    return items;
  } catch (err) {
    console.error("Groq Llama API error:", err.message);
    throw new Error("Failed to parse invoice using Llama API");
  }
};