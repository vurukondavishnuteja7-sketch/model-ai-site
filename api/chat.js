import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDUcWSbU-ELP7Erx9yGPbq65clsn2ME8pk",
  authDomain: "model-ai-727b1.firebaseapp.com",
  projectId: "model-ai-727b1",
  appId: "1:970799402645:web:4e2a93dbacbfd6ee97d59c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginBox = document.getElementById("loginBox");
const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

onAuthStateChanged(auth, user => {
  if (user) {
    loginBox.style.display = "none";
    chat.style.display = "block";
  } else {
    loginBox.style.display = "flex";
    chat.style.display = "none";
  }
});

window.googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert(e.message);
  }
};

window.emailLogin = async () => {
  const email = prompt("Email:");
  const pass = prompt("Password:");
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    alert(e.message);
  }
};

window.signUp = async () => {
  const email = prompt("Email:");
  const pass = prompt("Password:");
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    alert(e.message);
  }
};

window.logout = () => signOut(auth);

window.sendMsg = async () => {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();
  addMsg(data.reply || "No reply", "bot");
};

function addMsg(text, cls) {
  const div = document.createElement("div");
  div.className = "msg " + cls;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
