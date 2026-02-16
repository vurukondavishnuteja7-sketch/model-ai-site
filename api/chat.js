/* ================= CONFIG ================= */

/* ⚠️ IMPORTANT:
   OpenRouter API key ni Vercel Environment Variable lo pettali
   Name: OPENROUTER_API_KEY
*/

const messages = document.getElementById("messages");
const input = document.getElementById("input");


/* ================= ADD MESSAGE UI ================= */

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.textContent = text;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}


/* ================= SEND MESSAGE ================= */

async function sendMsg() {
  const text = input.value.trim();
  if (!text) return;

  // user message
  addMessage(text, "user");
  input.value = "";

  // loading message
  const loading = document.createElement("div");
  loading.className = "msg bot";
  loading.textContent = "Thinking...";
  messages.appendChild(loading);
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    // replace loading with reply
    loading.textContent = data.reply || "No reply from AI";
    messages.scrollTop = messages.scrollHeight;

  } catch (err) {
    loading.textContent = "Error connecting to AI";
    console.error(err);
  }
}


/* ================= VOICE INPUT ================= */

function startVoice() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice not supported in this browser");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = "en-US";
  rec.start();

  rec.onresult = (e) => {
    input.value = e.results[0][0].transcript;
  };
}


/* ================= NEW CHAT ================= */

function newChat() {
  messages.innerHTML = "";
}
