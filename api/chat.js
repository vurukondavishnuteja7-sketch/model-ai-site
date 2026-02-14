// Secure AI Chatbot Frontend Script (chat.js)
// NOTE: Do NOT expose your OpenAI API key in frontend JS.
// This version connects to your own backend (server.js / API route).

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 🔗 Your backend endpoint (change if needed)
const API_URL = "/api/chat";

// Add message to UI
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to backend AI
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  const loadingMsg = document.createElement("div");
  loadingMsg.className = "message bot";
  loadingMsg.innerText = "Typing...";
  chatBox.appendChild(loadingMsg);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    loadingMsg.remove();

    const reply = data.reply || "No response from AI.";
    addMessage(reply, "bot");
  } catch (error) {
    loadingMsg.remove();
    addMessage("⚠️ AI connection error. Check backend/server.", "bot");
    console.error("AI Error:", error);
  }
}

// Events
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Welcome message
addMessage("Hello! I am your AI assistant 🤖 Ask me anything.", "bot");
