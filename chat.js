const msgBox = document.getElementById("messages");
const input = document.getElementById("input");

function addMsg(text, cls) {
  const div = document.createElement("div");
  div.className = "msg " + cls;
  div.innerText = text;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

async function sendMsg() {
  const text = input.value.trim();
  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  addMsg("Thinking...", "bot");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    msgBox.lastChild.innerText = data.reply;

    speechSynthesis.speak(new SpeechSynthesisUtterance(data.reply));

  } catch {
    msgBox.lastChild.innerText = "Network error.";
  }
}

function startVoice() {
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.lang = "en-US";
  rec.start();
  rec.onresult = e => input.value = e.results[0][0].transcript;
}

function newChat() {
  msgBox.innerHTML = "";
}
