export default async function handler(req, res) {
  // Only POST allow
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    // Safety check
    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // Call OpenRouter AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // Extract AI reply safely
    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't understand that.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("AI ERROR:", error);
    return res.status(500).json({ error: "AI server error" });
  }
}
