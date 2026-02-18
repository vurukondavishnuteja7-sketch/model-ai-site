// api/chat.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 IKKADE API KEY PETTALI
const OPENROUTER_API_KEY = "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";

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Message is required" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "AI not responding. Check API key.";

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Server error" });
  }
});

// server run
const PORT = 3000;
app.listen(PORT, () => {
  console.log("AI server running on http://localhost:" + PORT);
});
