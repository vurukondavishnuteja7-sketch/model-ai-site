const messages = document.getElementById("messages");
const input = document.getElementById("input");

function addMessage(text, type){
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

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
    loading.textContent = data.reply || "No reply";

  }catch{
    loading.textContent = "Server error";
  }
}

function startVoice(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) return alert("Voice not supported");

  const rec = new SpeechRecognition();
  rec.lang="en-US";
  rec.start();
  rec.onresult=e=> input.value=e.results[0][0].transcript;
}

function newChat(){
  messages.innerHTML="";
}
