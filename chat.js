const msgBox=document.getElementById("messages");
const input=document.getElementById("input");

/* add message */
function addMsg(text,cls){
const div=document.createElement("div");
div.className="msg "+cls;
div.innerText=text;
msgBox.appendChild(div);
msgBox.scrollTop=msgBox.scrollHeight;
}

/* send */
async function sendMsg(){
const text=input.value.trim();
if(!text) return;

addMsg(text,"user");
input.value="";

const reply="This is demo AI reply. Connect OpenRouter later.";
addMsg(reply,"bot");

/* voice reply */
speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
}

/* voice to text */
function startVoice(){
const rec=new(window.SpeechRecognition||window.webkitSpeechRecognition)();
rec.lang="en-US";
rec.start();
rec.onresult=e=>{
input.value=e.results[0][0].transcript;
};
}

/* new chat */
function newChat(){
msgBox.innerHTML="";
}
