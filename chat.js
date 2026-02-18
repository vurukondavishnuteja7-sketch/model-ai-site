const input = document.getElementById("input");
const messages = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");

function addMsg(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.innerText = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
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
    messages.lastChild.innerText = data.reply;

    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(data.reply));
    }

  } catch {
    messages.lastChild.innerText = "AI connection error.";
  }
}

sendBtn.addEventListener("click", sendMsg);

input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMsg();
});
