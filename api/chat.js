export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    const ai = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.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}`
        
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await ai.json();

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "No reply"
    });

  } catch (e) {
    res.status(500).json({ reply: "Server error" });
  }
}
