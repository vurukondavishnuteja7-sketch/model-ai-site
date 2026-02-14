export default async function handler(req, res) {
  // Only POST allow
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // Call OpenRouter AI
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://modelai.online", // optional but good
        "X-Title": "Model AI"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant called Model AI."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await aiRes.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, AI reply not available.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("AI ERROR:", error);
    return res.status(500).json({ error: "Internal AI server error" });
  }
}
