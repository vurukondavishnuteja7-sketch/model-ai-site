<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Model AI</title>

  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:Inter,Arial;background:#f7f7f8;display:flex;height:100vh}

    /* Sidebar */
    .sidebar{width:260px;background:#fff;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;padding:12px}
    .logo{font-weight:700;font-size:18px;margin-bottom:12px}
    .new-chat{padding:10px;border:none;border-radius:10px;background:#10a37f;color:#fff;font-weight:600;cursor:pointer;margin-bottom:12px}
    .history{flex:1;overflow-y:auto;font-size:14px}
    .history div{padding:8px;border-radius:8px;cursor:pointer}
    .history div:hover{background:#f3f4f6}

    /* Main */
    .main{flex:1;display:flex;flex-direction:column}
    .topbar{padding:14px 20px;border-bottom:1px solid #e5e7eb;background:#fff;font-weight:600;display:flex;justify-content:space-between}
    .chat{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:14px}

    .msg{max-width:720px}
    .bubble{padding:12px 16px;border-radius:16px;border:1px solid #e5e7eb;background:#fff;white-space:pre-wrap}
    .user{align-self:flex-end}
    .user .bubble{background:#10a37f;color:#fff;border:none}

    .input-area{padding:16px;border-top:1px solid #e5e7eb;background:#fff;display:flex;justify-content:center}
    .input-box{width:100%;max-width:900px;border:1px solid #e5e7eb;border-radius:24px;padding:10px 14px;display:flex;gap:10px;align-items:center;background:#fafafa}
    .input-box input{flex:1;border:none;outline:none;font-size:15px;background:transparent}
    .send-btn{background:#10a37f;color:#fff;border:none;padding:8px 16px;border-radius:12px;cursor:pointer;font-weight:600}
    .icon-btn{border:none;background:transparent;font-size:18px;cursor:pointer}

    img.ai-img{max-width:220px;border-radius:12px;border:1px solid #e5e7eb;margin-top:8px}

    body.dark{background:#0f172a}
    body.dark .sidebar,body.dark .topbar,body.dark .input-area{background:#020617;color:#fff}
    body.dark .bubble{background:#020617;color:#fff;border-color:#1e293b}
    body.dark .input-box{background:#020617;border-color:#1e293b}
  </style>
</head>

<body>
  <div class="sidebar">
    <div class="logo">Model AI</div>
    <button class="new-chat" onclick="newChat()">+ New Chat</button>
    <div id="history" class="history"></div>
  </div>

  <div class="main">
    <div class="topbar">
      <span>AI Assistant</span>
      <span style="cursor:pointer" onclick="toggleTheme()">Theme</span>
    </div>

    <div id="chat" class="chat"></div>

    <div class="input-area">
      <div class="input-box">
        <button class="icon-btn" onclick="triggerUpload()">📎</button>
        <input id="q" placeholder="Message Model AI or type: image cat" />
        <button class="icon-btn" onclick="startVoice()">🎤</button>
        <button class="send-btn" onclick="ask()">Send</button>
      </div>
      <input type="file" id="file" hidden />
    </div>
  </div>

  <script>
    const chat=document.getElementById('chat')
    const historyDiv=document.getElementById('history')

    function addMessage(text,type){
      const wrap=document.createElement('div')
      wrap.className='msg '+type
      const bubble=document.createElement('div')
      bubble.className='bubble'
      bubble.textContent=text
      wrap.appendChild(bubble)
      chat.appendChild(wrap)
      chat.scrollTop=chat.scrollHeight
    }

    function addImage(src){
      const img=document.createElement('img')
      img.src=src
      img.className='ai-img'
      chat.appendChild(img)
      chat.scrollTop=chat.scrollHeight
    }

    function saveHistory(text){
      const saved=JSON.parse(localStorage.getItem('modelai')||'[]')
      saved.unshift(text)
      localStorage.setItem('modelai',JSON.stringify(saved.slice(0,20)))
      renderHistory()
    }

    function renderHistory(){
      historyDiv.innerHTML=''
      const saved=JSON.parse(localStorage.getItem('modelai')||'[]')
      saved.forEach(t=>{
        const d=document.createElement('div')
        d.textContent=t
        d.onclick=()=>document.getElementById('q').value=t
        historyDiv.appendChild(d)
      })
    }

    function newChat(){chat.innerHTML=''}
    function toggleTheme(){document.body.classList.toggle('dark')}

    function triggerUpload(){document.getElementById('file').click()}

    document.getElementById('file').addEventListener('change',e=>{
      const f=e.target.files[0]
      if(!f) return
      addMessage('Uploaded: '+f.name,'user')
    })

    function startVoice(){
      const R=window.SpeechRecognition||window.webkitSpeechRecognition
      if(!R) return alert('Voice not supported')
      const r=new R()
      r.onresult=e=>document.getElementById('q').value=e.results[0][0].transcript
      r.start()
    }

    async function ask(){
      const input=document.getElementById('q')
      const message=input.value.trim()
      if(!message) return

      addMessage(message,'user')
      saveHistory(message)
      input.value=''

      // IMAGE MODE
      if(message.toLowerCase().startsWith('image')){
        const prompt=message.replace('image','').trim()
        for(let i=0;i<4;i++){
          addImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${i}`)
        }
        return
      }

      addMessage('Thinking...','bot')

      try{
        const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})})
        const data=await res.json()
        chat.lastChild.remove()
        addMessage(data.reply||'Error','bot')
      }catch{
        chat.lastChild.remove()
        addMessage('Connection error','bot')
      }
    }

    renderHistory()
  </script>
  <script>
    // STEP 3: Simple Login System (Local Auth)
    const loginBox = document.createElement('div');
    loginBox.style.position='fixed';loginBox.style.top='0';loginBox.style.left='0';loginBox.style.right='0';loginBox.style.bottom='0';
    loginBox.style.background='rgba(0,0,0,0.6)';loginBox.style.display='none';loginBox.style.alignItems='center';loginBox.style.justifyContent='center';
    loginBox.innerHTML = `<div style="background:#fff;padding:20px;border-radius:12px;width:300px;text-align:center">
      <h3>Login to Model AI</h3>
      <input id="username" placeholder="Enter username" style="width:100%;padding:10px;margin:10px 0" />
      <button onclick="doLogin()" style="padding:10px 20px;background:#10a37f;color:#fff;border:none;border-radius:8px">Login</button>
    </div>`;
    document.body.appendChild(loginBox);

    function openLogin(){loginBox.style.display='flex'}
    function closeLogin(){loginBox.style.display='none'}

    function doLogin(){
      const u=document.getElementById('username').value.trim();
      if(!u) return alert('Enter username');
      localStorage.setItem('modelai_user',u);
      alert('Logged in as '+u);
      closeLogin();
    }

    window.addEventListener('load',()=>{
      if(!localStorage.getItem('modelai_user')) openLogin();
    })
  </script>
</body>
</html>
