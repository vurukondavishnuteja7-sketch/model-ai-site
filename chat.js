const messages = document.getElementById("messages");
const input = document.getElementById("input");

/* add message */
function addMessage(text, type){
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;

  // 🔊 AI voice speak for bot reply
  if(type === "bot"){
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speechSynthesis.speak(speech);
  }
}

/* send message */
async function sendMsg(){
  const text = input.value.trim();
  if(!text) return;

  addMessage(text,"user");
  input.value="";

  const loading = document.createElement("div");
  loading.className="msg bot";
  loading.textContent="Thinking...";
  messages.appendChild(loading);

  try{
    const res = await fetch("/api/chat",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ message:text })
    });

    const data = await res.json();
    loading.remove();
    addMessage(data.reply || "No reply","bot");

  }catch{
    loading.textContent = "Server error";
  }
}

/* voice input */
function startVoice(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) return alert("Voice not supported");

  const rec = new SpeechRecognition();
  rec.lang="en-US";
  rec.start();
  rec.onresult=e=> input.value=e.results[0][0].transcript;
}

/* new chat */
function newChat(){
  messages.innerHTML="";
}
