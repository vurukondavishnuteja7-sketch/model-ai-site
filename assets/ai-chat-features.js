/* Shared client helpers for MODEL AI chat: file parsing, animation, speech and saved sessions. */
(() => {
  'use strict';
  const STORAGE_KEY = 'modelai-chat-sessions-v2';
  const MAX_LOCAL_SESSIONS = 25;
  const MAX_SAVED_MESSAGES = 30;
  const MAX_SAVED_TEXT = 6000;

  function safeArray(value) { return Array.isArray(value) ? value : []; }
  function newId() {
    return (window.crypto?.randomUUID && window.crypto.randomUUID()) || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function contentAsText(content) {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    return content.map(part => {
      if (part?.type === 'text') return String(part.text || '');
      if (part?.type === 'image_url') return '[Image attachment omitted from saved history]';
      return '';
    }).filter(Boolean).join('\n');
  }
  function serialMessages(messages) {
    return safeArray(messages).filter(m => ['user', 'assistant', 'system'].includes(m?.role)).map(m => ({
      role: m.role,
      content: contentAsText(m.content).slice(0, MAX_SAVED_TEXT)
    })).filter(m => m.content).slice(-MAX_SAVED_MESSAGES);
  }
  function readLocalSessions() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(s => s?.id && Array.isArray(s.messages)).slice(0, MAX_LOCAL_SESSIONS) : [];
    } catch { return []; }
  }
  function getSession(id) { return readLocalSessions().find(s => s.id === id) || null; }
  function saveSession(session) {
    if (!session?.id) return null;
    const cleaned = {
      id: String(session.id).slice(0, 100),
      title: String(session.title || 'MODEL AI conversation').slice(0, 120),
      updatedAt: Date.now(),
      messages: serialMessages(session.messages)
    };
    const list = readLocalSessions().filter(s => s.id !== cleaned.id);
    list.unshift(cleaned);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_LOCAL_SESSIONS))); }
    catch (error) { console.warn('[MODEL AI] Could not save local history:', error?.message || error); }
    const remoteSave = window.ModelAIAuth?.saveConversation;
    if (typeof remoteSave === 'function') {
      Promise.resolve(remoteSave(cleaned)).then(ok => {
        if (ok) window.dispatchEvent(new CustomEvent('modelai:chat-cloud-saved', { detail: { id: cleaned.id } }));
      }).catch(error => console.warn('[MODEL AI] Cloud history sync was skipped:', error?.message || error));
    }
    window.dispatchEvent(new CustomEvent('modelai:chat-history-updated'));
    return cleaned;
  }
  async function listSessions() {
    const local = readLocalSessions();
    if (!window.ModelAIAuth?.getCurrentUser || !window.ModelAIAuth.getCurrentUser()) return local;
    try {
      const remote = await window.ModelAIAuth.listConversations();
      const byId = new Map(local.map(s => [s.id, s]));
      for (const entry of safeArray(remote)) {
        if (entry?.id && Array.isArray(entry.messages)) {
          const prior = byId.get(entry.id);
          if (!prior || Number(entry.updatedAt || 0) > Number(prior.updatedAt || 0)) byId.set(entry.id, entry);
        }
      }
      return [...byId.values()].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0)).slice(0, MAX_LOCAL_SESSIONS);
    } catch { return local; }
  }
  async function restoreSession(id) {
    const local = getSession(id);
    if (local) return local;
    if (window.ModelAIAuth?.loadConversation) {
      try { return await window.ModelAIAuth.loadConversation(id); } catch {}
    }
    return null;
  }

  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
      const timer = setTimeout(done, ms);
      function done() { signal?.removeEventListener('abort', abort); resolve(); }
      function abort() { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new DOMException('Aborted', 'AbortError')); }
      signal?.addEventListener('abort', abort, { once: true });
    });
  }
  async function typeText(element, text, signal, interval = 12) {
    if (!element) return;
    const value = String(text || '');
    element.textContent = '';
    const textNode = document.createTextNode('');
    const cursor = document.createElement('span');
    cursor.className = 'ai-typing-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '▍';
    element.append(textNode, cursor);
    const chars = Array.from(value);
    const stride = chars.length > 1800 ? 3 : (chars.length > 800 ? 2 : 1);
    let current = '';
    for (let i = 0; i < chars.length; i += stride) {
      if (signal?.aborted) { cursor.remove(); throw new DOMException('Aborted', 'AbortError'); }
      current += chars.slice(i, i + stride).join('');
      textNode.data = current;
      element.closest('.assistant-thread,.chat-messages')?.scrollTo({ top: element.closest('.assistant-thread,.chat-messages').scrollHeight, behavior: 'auto' });
      await wait(interval, signal);
    }
    textNode.data = value;
    cursor.remove();
  }

  function readDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }
  async function loadPdfJs() {
    const sources = [
      { entry: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs', worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs' },
      { entry: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs', worker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs' }
    ];
    const errors = [];
    for (const source of sources) {
      try {
        const pdfjs = await import(source.entry);
        if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = source.worker;
        return pdfjs;
      } catch (error) { errors.push(error?.message || String(error)); }
    }
    throw new Error('The PDF text reader could not load. Check your connection, or copy the needed PDF text into chat.');
  }
  async function pdfToText(file) {
    const pdfjs = await loadPdfJs();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const documentHandle = await pdfjs.getDocument({ data: bytes, disableWorker: true }).promise;
    const pages = Math.min(documentHandle.numPages, 10);
    const collected = [];
    for (let pageNumber = 1; pageNumber <= pages; pageNumber++) {
      const page = await documentHandle.getPage(pageNumber);
      const text = await page.getTextContent();
      collected.push(`Page ${pageNumber}: ${text.items.map(item => item.str || '').join(' ')}`);
      if (collected.join('\n').length > 15_000) break;
    }
    const output = collected.join('\n\n').slice(0, 15_000);
    if (!output.trim()) throw new Error('No selectable text was found in this PDF. This may be a scanned document; use OCR or upload a clear image instead.');
    return output;
  }
  async function parseAttachment(file) {
    const fileName = String(file?.name || 'attachment').slice(0, 160);
    const mime = String(file?.type || '').toLowerCase();
    if (mime.startsWith('image/')) {
      if (!/^image\/(png|jpeg|webp)$/.test(mime)) throw new Error(`${fileName}: use a PNG, JPEG or WebP image.`);
      if (file.size > 1.8 * 1024 * 1024) throw new Error(`${fileName}: images must be under 1.8 MB so the request fits the AI provider limit.`);
      return { name: fileName, kind: 'image', data: await readDataUrl(file), size: file.size, type: mime };
    }
    if (mime === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      if (file.size > 5 * 1024 * 1024) throw new Error(`${fileName}: PDF must be under 5 MB.`);
      return { name: fileName, kind: 'text', text: await pdfToText(file), size: file.size, type: 'application/pdf' };
    }
    const allowedText = /\.(txt|md|csv|json|log|html|css|js|xml)$/i.test(fileName) || /^(text\/|application\/(json|xml))/.test(mime);
    if (!allowedText) throw new Error(`${fileName}: supported attachments are images, PDFs, TXT, MD, CSV, JSON, HTML, CSS, JS or XML files.`);
    if (file.size > 150 * 1024) throw new Error(`${fileName}: text files must be under 150 KB.`);
    const text = (await file.text()).slice(0, 15_000);
    return { name: fileName, kind: 'text', text, size: file.size, type: mime || 'text/plain' };
  }
  function userContent(text, attachments) {
    const parts = [];
    let composedText = String(text || '').trim();
    const textFiles = safeArray(attachments).filter(file => file.kind === 'text');
    if (textFiles.length) {
      composedText += (composedText ? '\n\n' : '') + textFiles.map(file => `--- Attached file: ${file.name} ---\n${file.text}`).join('\n\n');
    }
    if (!composedText) composedText = safeArray(attachments).some(file => file.kind === 'image') ? 'Please analyze the attached image.' : 'Please review the attached files.';
    parts.push({ type: 'text', text: composedText.slice(0, 26_000) });
    for (const file of safeArray(attachments)) {
      if (file.kind === 'image' && file.data) parts.push({ type: 'image_url', image_url: { url: file.data } });
    }
    return parts.length === 1 && !safeArray(attachments).some(file => file.kind === 'image') ? composedText : parts;
  }
  function displayUserContent(text, attachments) {
    const names = safeArray(attachments).map(file => file.name).filter(Boolean);
    return `${String(text || '').trim() || (names.length ? 'Please review the attachment(s).' : '')}${names.length ? `\n📎 ${names.join(', ')}` : ''}`.trim();
  }
  function clearContainer(element) { if (element) element.replaceChildren(); }
  function renderAttachments(container, files, onRemove) {
    if (!container) return;
    clearContainer(container);
    container.hidden = !files.length;
    for (const [index, file] of files.entries()) {
      const card = document.createElement('div');
      card.className = 'chat-attachment-chip';
      const label = document.createElement('span');
      label.className = 'chat-attachment-label';
      label.textContent = `${file.kind === 'image' ? '🖼' : (file.type === 'application/pdf' ? '📄' : '📝')} ${file.name}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'chat-attachment-remove';
      remove.setAttribute('aria-label', `Remove ${file.name}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => onRemove(index));
      card.append(label, remove);
      if (file.kind === 'image' && file.data) {
        const image = document.createElement('img');
        image.alt = `Preview of ${file.name}`;
        image.src = file.data;
        card.prepend(image);
      }
      container.append(card);
    }
  }
  function speak(text) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) throw new Error('Read aloud is not supported by this browser.');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text || '').slice(0, 8000));
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }
  function stopSpeaking() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  function startDictation(input, button, onTranscript) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) throw new Error('Voice input is not supported in this browser. Try Edge or Chrome, and allow microphone access.');
    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim();
      if (transcript) { if (input) input.value = transcript; if (onTranscript) onTranscript(transcript); }
    };
    recognition.onerror = event => {
      if (button) button.dataset.listening = 'false';
      if (event.error && event.error !== 'no-speech' && event.error !== 'aborted') console.warn('[MODEL AI] Voice input:', event.error);
    };
    recognition.onend = () => { if (button) { button.dataset.listening = 'false'; button.setAttribute('aria-pressed', 'false'); } };
    if (button) { button.dataset.listening = 'true'; button.setAttribute('aria-pressed', 'true'); }
    recognition.start();
    return recognition;
  }
  function renderHistoryList(container, onSelect, currentId) {
    if (!container) return Promise.resolve();
    container.replaceChildren();
    container.hidden = false;
    const loading = document.createElement('p');
    loading.className = 'chat-history-empty';
    loading.textContent = 'Loading saved chats…';
    container.append(loading);
    return listSessions().then(sessions => {
      container.replaceChildren();
      if (!sessions.length) {
        const empty = document.createElement('p');
        empty.className = 'chat-history-empty';
        empty.textContent = 'No saved chats yet. Your conversations will appear here.';
        container.append(empty);
        return;
      }
      for (const session of sessions.slice(0, 12)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-history-item';
        button.classList.toggle('active', session.id === currentId);
        const title = document.createElement('span');
        title.textContent = String(session.title || 'MODEL AI conversation').slice(0, 100);
        const meta = document.createElement('small');
        meta.textContent = session.updatedAt ? new Date(Number(session.updatedAt)).toLocaleString() : 'Saved chat';
        button.append(title, meta);
        button.addEventListener('click', () => onSelect(session));
        container.append(button);
      }
    }).catch(() => {
      container.replaceChildren();
      const empty = document.createElement('p');
      empty.className = 'chat-history-empty';
      empty.textContent = 'Saved history could not be loaded. Your local chats may still be available after refresh.';
      container.append(empty);
    });
  }

  window.ModelAIChatFeatures = {
    newId,
    serialMessages,
    saveSession,
    listSessions,
    restoreSession,
    getSession,
    typeText,
    parseAttachment,
    userContent,
    displayUserContent,
    renderAttachments,
    speak,
    stopSpeaking,
    startDictation,
    renderHistoryList
  };
})();
