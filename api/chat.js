export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // ===== IMAGE GENERATION =====
    if (message.toLowerCase().startsWith("image:")) {
      const prompt = message.replace("image:", "").trim();

      const img = await fetch("https://openrouter.ai/api/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/dall-e-3",
          prompt,
        }),
      });

      const imgData = await img.json();
      const url = imgData?.data?.[0]?.url;

      return res.status(200).json({ image: url || null });
    }

    // ===== NORMAL CHAT =====
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No AI reply";

    res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
