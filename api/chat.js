export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    // IMAGE
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
      return res.status(200).json({ image: imgData?.data?.[0]?.url });
    }

    // CHAT
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    res.status(200).json({ reply: data?.choices?.[0]?.message?.content });

  } catch {
    res.status(500).json({ error: "Server error" });
  }
}
