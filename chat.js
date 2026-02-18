// public/chat.js

const messages = document.getElementById("messages");
const input = document.getElementById("input");

// add message UI
function addMsg(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.innerText = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// SEND MESSAGE TO SERVER AI
async function sendMsg() {
  const text = input.value.trim();
  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  addMsg("Thinking...", "bot");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();

    messages.lastChild.innerText = data.reply;

    // 🔊 voice reply
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(data.reply);
      speech.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    }
  } catch {
    messages.lastChild.innerText = "Server error. Try again.";
  }
}

// ENTER KEY
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMsg();
});

// 🎤 VOICE INPUT
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

window.sendMsg = sendMsg;
window.startVoice = startVoice;
