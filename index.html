/* BLOGS FULL CONTENT */
const blogTitles=[
"AI Tools for Students","AI Homework Help","ChatGPT Alternatives",
"AI Coding Guide","Future of AI","AI Image Generation",
"AI Productivity","Earn Money Using AI","AI in Education","Next-Gen AI"
];

const blogDiv=document.getElementById("blogs");

blogTitles.forEach((t,i)=>{
blogDiv.innerHTML+=`
<div class="card">
<img src="https://picsum.photos/900/400?random=${i}" class="blog-img">
<h2>${t}</h2>
<p>
Artificial Intelligence is transforming education, jobs, business and daily life.
Learning AI today gives powerful future career and earning opportunities.
</p>
</div>`;
});

/* SIDEBAR */
function toggleSidebar(){
sidebar.classList.toggle("show");
overlay.classList.toggle("show");
}

/* FIREBASE LOGIN */
firebase.initializeApp({
apiKey:"YOUR_FIREBASE_KEY",
authDomain:"YOUR_DOMAIN.firebaseapp.com"
});

const auth=firebase.auth();
const userText=document.getElementById("user");

function login(){
auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
}
function logout(){auth.signOut();}

auth.onAuthStateChanged(u=>{
userText.innerText=u ? "👤 "+u.email : "Not logged in";
});

/* CHAT UI */
const messages=document.getElementById("messages");
const input=document.getElementById("input");

function addMsg(t,type){
const d=document.createElement("div");
d.className="msg "+type;
d.innerText=t;
messages.appendChild(d);
messages.scrollTop=messages.scrollHeight;
}

/* AI CALL */
async function sendMsg(){
const text=input.value.trim();
if(!text) return;

addMsg(text,"user");
input.value="";
addMsg("Thinking...","bot");

const res=await fetch("/api/chat",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({message:text})
});

const data=await res.json();
messages.lastChild.innerText=data.reply;

/* SPEECH */
speechSynthesis.speak(new SpeechSynthesisUtterance(data.reply));
}

/* ENTER */
input.addEventListener("keydown",e=>{
if(e.key==="Enter") sendMsg();
});

/* VOICE */
function startVoice(){
const r=new(window.SpeechRecognition||window.webkitSpeechRecognition)();
r.lang="en-US";
r.start();
r.onresult=e=>{input.value=e.results[0][0].transcript;}
}
