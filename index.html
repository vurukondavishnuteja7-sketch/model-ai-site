// =============================
// FILE 1: /api/chat.js  (Vercel Serverless Function)
// =============================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || "No reply";

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: "AI error" });
  }
}


// =============================
// FILE 2: index.html  (Frontend Chat UI)
// =============================

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Model AI</title>

  <style>
    body { margin: 0; font-family: Inter, Arial; background: #f6f7fb; display: flex; height: 100vh; }

    .sidebar { width: 240px; background: #ffffff; border-right: 1px solid #e5e7eb; padding: 12px; }

    .new-btn { width: 100%; padding: 10px; background: #16a34a; color: white; border: none; border-radius: 10px; cursor: pointer; }

    .main { flex: 1; display: flex; flex-direction: column; }

    .topbar { padding: 12px 20px; background: white; border-bottom: 1px solid #e5e7eb; font-weight: 600; }

    #chat { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }

    .msg { max-width: 700px; }
    .user { align-self: flex-end; }
    .bot { align-self: flex-start; }

    .bubble { padding: 12px 16px; border-radius: 14px; background: white; border: 1px solid #e5e7eb; }
    .user .bubble { background: #16a34a; color: white; border: none; }

    .input-wrap { padding: 16px; display: flex; justify-content: center; }

    .input-box { width: 100%; max-width: 900px; background: white; border: 1px solid #e5e7eb; border-radius: 20px; display: flex; gap: 10px; padding: 10px; }

    input { flex: 1; border: none; outline: none; }

    button { background: #16a34a; color: white; border: none; padding: 10px 16px; border-radius: 12px; cursor: pointer; }

    img.ai { max-width: 200px; margin-top: 8px; border-radius: 10px; }
  </style>
</head>

<body>
  <div class="sidebar">
    <button class="new-btn" onclick="newChat()">+ New Chat</button>
    <div id="history"></div>
  </div>

  <div class="main">
    <div class="topbar">Model AI Assistant</div>

    <div id="chat"></div>

    <div class="input-wrap">
      <div class="input-box">
        <input id="q" placeholder="Ask anything or type: image of lion" />
        <button onclick="ask()">Send</button>
      </div>
    </div>
  </div>

  <script>
    const chat = document.getElementById("chat");
    const history = document.getElementById("history");

    function addMessage(text, type, images = []) {
      const wrap = document.createElement("div");
      wrap.className = "msg " + type;

      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.innerText = text;
      wrap.appendChild(bubble);

      images.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.className = "ai";
        wrap.appendChild(img);
      });

      chat.appendChild(wrap);
      chat.scrollTop = chat.scrollHeight;
    }

    function saveHistory(q) {
      const item = document.createElement("div");
      item.innerText = q;
      item.onclick = () => (document.getElementById("q").value = q);
      history.appendChild(item);
    }

    function newChat() { chat.innerHTML = ""; }

    async function ask() {
      const q = document.getElementById("q").value.trim();
      if (!q) return;

      addMessage(q, "user");
      saveHistory(q);
      document.getElementById("q").value = "";

      // IMAGE MODE
      if (q.toLowerCase().startsWith("image of")) {
        const prompt = q.replace("image of", "").trim();
        const imgs = [];
        for (let i = 0; i < 4; i++) {
          imgs.push(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${i}`);
        }
        addMessage("Generated images:", "bot", imgs);
        return;
      }

      addMessage("Thinking...", "bot");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: q })
        });

        const data = await res.json();

        chat.lastChild.remove();
        addMessage(data.reply || "Error", "bot");
      } catch {
        chat.lastChild.remove();
        addMessage("Connection error", "bot");
      }
    }
  </script>
</body>
</html>
