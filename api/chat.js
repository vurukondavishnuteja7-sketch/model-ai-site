const API_KEY = "PASTE_OPENROUTER_KEY";

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");

let currentUser = null;

/* ---------------- LOGIN ---------------- */

auth.onAuthStateChanged(user=>{
  currentUser = user;
  if(user) loadHistory();
});

function googleLogin(){
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
}

function logout(){
  auth.signOut();
  messagesDiv.innerHTML = "";
}

/* ---------------- CHAT UI ---------------- */

function addMessage(text, cls){
  const div = document.createElement("div");
  div.className = "msg " + cls;
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* ---------------- FIRESTORE HISTORY ---------------- */

async function saveMessage(role, text){
  if(!currentUser) return;

  await db.collection("chats")
    .doc(currentUser.uid)
    .collection("messages")
    .add({
      role,
      text,
      time: Date.now()
    });
}

async function loadHistory(){
  messagesDiv.innerHTML = "";

  const snap = await db.collection("chats")
    .doc(currentUser.uid)
    .collection("messages")
    .orderBy("time")
    .get();

  snap.forEach(doc=>{
    const m = doc.data();
    addMessage(m.text, m.role === "user" ? "user" : "bot");
  });
}

/* ---------------- VOICE INPUT ---------------- */

function startVoice(){
  const rec = new webkitSpeechRecognition();
  rec.lang = "en-US";
  rec.start();

  rec.onresult = e=>{
    input.value = e.results[0][0].transcript;
  };
}

/* ---------------- AI MESSAGE ---------------- */

async function sendMsg(){
  const text = input.value.trim();
  if(!text) return;

  addMessage(text,"user");
  saveMessage("user", text);

  input.value="";
  addMessage("Thinking...","bot");

  try{
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization":"Bearer " + API_KEY,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"mistralai/mistral-7b-instruct",
        messages:[{role:"user",content:text}]
      })
    });

    const data = await res.json();
    messagesDiv.lastChild.remove();

    const reply = data.choices?.[0]?.message?.content || "No reply";
    addMessage(reply,"bot");
    saveMessage("bot", reply);

  }catch{
    messagesDiv.lastChild.textContent = "AI error";
  }
}

/* ---------------- NEW CHAT ---------------- */

function newChat(){
  messagesDiv.innerHTML = "";
}
