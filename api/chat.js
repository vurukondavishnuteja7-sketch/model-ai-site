// Simple AI Chatbot Frontend Script (chat.js)
// Works with a basic HTML page containing:
// - #chat-box (messages container)
// - #user-input (text input)
// - #send-btn (send button)

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 🔑 Add your API key here
const API_KEY = "YOUR_API_KEY_HERE";
const API_URL = "https://api.openai.com/v1/chat/completions";

// Add message to UI
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to AI
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
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: text }],
      }),
    });

    const data = await response.json();
    loadingMsg.remove();

    const reply =
      data.choices?.[0]?.message?.content || "Sorry, no response.";

    addMessage(reply, "bot");
  } catch (error) {
    loadingMsg.remove();
    addMessage("Error connecting to AI.", "bot");
    console.error(error);
  }
}

// Events
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Welcome message
addMessage("Hello! I am your AI assistant. Ask me anything 😊", "bot");
