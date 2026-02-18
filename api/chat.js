import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

/* 👉 Mee OpenRouter API key ikkada pettali */
const OPENROUTER_KEY = "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";

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${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}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // optional
          "X-Title": "Model AI" // optional
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",   // fast + cheap model
          messages: [{ role: "user", content: message }]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "AI not responding.";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error." });
  }
});

app.listen(3000, () => {
  console.log("✅ OpenRouter AI running → http://localhost:3000");
});
