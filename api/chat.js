const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve index.html
app.use(express.static(path.join(__dirname, "..")));

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ reply: "API key missing in .env file" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "user", content: userMessage }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "AI not responding.";

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Server error." });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
});
