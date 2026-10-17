(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const helper = () => window.ModelAIChatFeatures;
  const toast = text => {
    const element = $('#dash-toast');
    if (!element) return;
    element.textContent = text;
    element.classList.add('show');
    clearTimeout(window.__dashToastTimer);
    window.__dashToastTimer = setTimeout(() => element.classList.remove('show'), 2800);
  };

  const sidebar = $('#dash-sidebar');
  const sidebarToggle = $('#sidebar-toggle');
  sidebarToggle?.addEventListener('click', () => {
    const open = sidebar?.classList.toggle('open');
    sidebarToggle.setAttribute('aria-expanded', String(!!open));
    sidebarToggle.textContent = open ? '×' : '☰';
  });
  document.addEventListener('click', event => {
    if (window.innerWidth <= 860 && sidebar?.classList.contains('open') && !sidebar.contains(event.target) && !sidebarToggle?.contains(event.target)) {
      sidebar.classList.remove('open');
      sidebarToggle?.setAttribute('aria-expanded', 'false');
      if (sidebarToggle) sidebarToggle.textContent = '☰';
    }
  });

  $('#theme-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dash-dark');
    const dark = document.body.classList.contains('dash-dark');
    try { localStorage.setItem('modelai-theme', dark ? 'dark' : 'light'); } catch {}
    $('#theme-toggle').textContent = dark ? '☀' : '☾';
  });
  try {
    if (localStorage.getItem('modelai-theme') === 'dark') {
      document.body.classList.add('dash-dark');
      $('#theme-toggle').textContent = '☀';
    }
  } catch {}
  $('#global-search-form')?.addEventListener('submit', event => event.preventDefault());
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      $('#tool-search')?.focus();
    }
    if (event.key === 'Escape') {
      sidebar?.classList.remove('open');
      $('#profile-menu')?.setAttribute('hidden', '');
    }
  });
  const profile = $('#profile-button');
  const profileMenu = $('#profile-menu');
  profile?.addEventListener('click', () => {
    const open = !!profileMenu?.hidden;
    if (profileMenu) profileMenu.hidden = !open;
    profile.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    if (profileMenu && !profileMenu.hidden && !profileMenu.contains(event.target) && !profile?.contains(event.target)) {
      profileMenu.hidden = true;
      profile?.setAttribute('aria-expanded', 'false');
    }
  });
  $('#login-preview')?.addEventListener('click', () => { toast('Use Sign in / Create account to connect Firebase.'); if (profileMenu) profileMenu.hidden = true; });
  $('#api-help')?.addEventListener('click', () => { location.href = '/API-SETUP.md'; });
  $('#notification-button')?.addEventListener('click', () => toast('No new notifications.'));

  // Saved tools remain in this browser; users can see a saved-tools filter without an account.
  let favorites = [];
  try { favorites = JSON.parse(localStorage.getItem('modelai-favorites') || '[]'); if (!Array.isArray(favorites)) favorites = []; } catch {}
  const setFavoriteVisuals = () => {
    $$('[data-favorite]').forEach(button => {
      const saved = favorites.includes(button.dataset.favorite);
      button.classList.toggle('saved', saved);
      button.textContent = saved ? '♥' : '♡';
      button.title = saved ? 'Remove from favourites' : 'Add to favourites';
      button.setAttribute('aria-pressed', String(saved));
    });
    const count = $('#fav-count');
    if (count) count.textContent = String(favorites.length);
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-favorite]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const slug = button.dataset.favorite;
    favorites = favorites.includes(slug) ? favorites.filter(item => item !== slug) : [...favorites, slug];
    try { localStorage.setItem('modelai-favorites', JSON.stringify(favorites)); } catch {}
    setFavoriteVisuals();
    const active = $('#favorites-filter')?.classList.contains('active');
    window.dispatchEvent(new CustomEvent('modelai:favorites', { detail: !!active }));
    toast(favorites.includes(slug) ? 'Added to favourites' : 'Removed from favourites');
  });
  const filterFavoritesButton = $('#favorites-filter');
  filterFavoritesButton?.addEventListener('click', () => {
    const active = !filterFavoritesButton.classList.contains('active');
    filterFavoritesButton.classList.toggle('active', active);
    $$('[data-filter]').forEach(button => button.classList.remove('active'));
    window.dispatchEvent(new CustomEvent('modelai:favorites', { detail: active }));
    $('#tools')?.scrollIntoView({ behavior: 'smooth' });
    toast(active ? 'Showing your saved tools' : 'Showing all tools');
  });
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    if (button.id === 'favorites-filter') return;
    filterFavoritesButton?.classList.remove('active');
    window.dispatchEvent(new CustomEvent('modelai:favorites', { detail: false }));
    if (window.innerWidth <= 860) {
      sidebar?.classList.remove('open');
      sidebarToggle?.setAttribute('aria-expanded', 'false');
      if (sidebarToggle) sidebarToggle.textContent = '☰';
    }
  }));
  setFavoriteVisuals();

  // Recently used tools persist locally and are rebuilt from the existing cards.
  const recentSection = $('#recent-tools-section');
  const recentGrid = $('#recent-tools-grid');
  const RECENT_KEY = 'modelai-recent-tools-v1';
  function recentSlugs() {
    try {
      const value = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(0, 6) : [];
    } catch { return []; }
  }
  function renderRecent() {
    if (!recentSection || !recentGrid) return;
    recentGrid.replaceChildren();
    const slugs = recentSlugs();
    if (!slugs.length) { recentSection.hidden = true; return; }
    recentSection.hidden = false;
    for (const slug of slugs) {
      const source = $$('[data-tool-card]').find(card => card.dataset.favSlug === slug);
      const sourceLink = source?.querySelector('.dash-card-main');
      if (!source || !sourceLink) continue;
      const article = document.createElement('article');
      article.className = 'dash-tool-card recent-tool-card';
      const link = document.createElement('a');
      link.className = 'dash-card-main';
      link.href = sourceLink.href;
      link.addEventListener('click', () => noteRecent(slug));
      const icon = source.querySelector('.dash-tool-icon img');
      const iconWrap = document.createElement('div');
      iconWrap.className = 'dash-tool-top';
      const cloneWrap = document.createElement('span');
      cloneWrap.className = 'dash-tool-icon ai';
      if (icon) { const image = document.createElement('img'); image.src = icon.getAttribute('src'); image.alt = ''; image.loading = 'lazy'; cloneWrap.append(image); }
      iconWrap.append(cloneWrap);
      link.append(iconWrap);
      const title = document.createElement('h3'); title.textContent = source.querySelector('h3')?.textContent || 'Open tool';
      const desc = document.createElement('p'); desc.textContent = source.querySelector('p')?.textContent || '';
      const open = document.createElement('span'); open.className = 'dash-open'; open.textContent = 'Open tool →';
      link.append(title, desc, open);
      article.append(link);
      recentGrid.append(article);
    }
  }
  function noteRecent(slug) {
    const list = [slug, ...recentSlugs().filter(item => item !== slug)].slice(0, 6);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch {}
    renderRecent();
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-tool-card] .dash-card-main');
    if (link) noteRecent(link.closest('[data-tool-card]')?.dataset.favSlug);
  });
  $('#recent-clear')?.addEventListener('click', () => {
    try { localStorage.removeItem(RECENT_KEY); } catch {}
    renderRecent();
    toast('Recently used tools cleared');
  });
  renderRecent();

  // Main dashboard assistant.
  const form = $('#assistant-form');
  const input = $('#assistant-message');
  const thread = $('#assistant-thread');
  const status = $('#assistant-status');
  const fileInput = $('#assistant-image');
  const attachmentTray = $('#assistant-attachments');
  const stopButton = $('#assistant-stop');
  const regenerateButton = $('#assistant-regenerate');
  const readAloudButton = $('#assistant-read-aloud');
  const voiceButton = $('#assistant-voice');
  const searchToggle = $('#assistant-web-search');
  const historyToggle = $('#assistant-history-toggle');
  const historyPanel = $('#assistant-history-panel');
  let pendingFiles = [];
  let messageHistory = [{ role: 'system', content: 'You are MODEL AI, a helpful, accurate and friendly assistant. Be concise when appropriate, explain important steps clearly, state uncertainty, do not invent current facts, and do not claim to generate or inspect a file unless the configured tool returned a result.' }];
  let currentSessionId = helper()?.newId?.() || `chat-${Date.now()}`;
  let currentTitle = 'New MODEL AI chat';
  let lastRequest = null;
  let lastAssistantText = '';
  let activeController = null;
  let busy = false;
  let webSearchEnabled = false;
  let recognition = null;

  const addMessage = (role, text) => {
    const element = document.createElement('div');
    element.className = `assistant-msg ${role === 'user' ? 'user' : 'ai'}`;
    element.textContent = text;
    thread?.append(element);
    if (thread) thread.scrollTop = thread.scrollHeight;
    return element;
  };
  const setStatus = text => { if (status) status.textContent = text; };
  const renderPendingFiles = () => helper()?.renderAttachments(attachmentTray, pendingFiles, index => {
    pendingFiles.splice(index, 1);
    renderPendingFiles();
    setStatus(pendingFiles.length ? `${pendingFiles.length} attachment(s) ready.` : 'Attachments removed.');
  });
  const sessionPayload = () => ({ id: currentSessionId, title: currentTitle, messages: messageHistory });
  function saveCurrentSession() { helper()?.saveSession(sessionPayload()); }
  function setBusy(value) {
    busy = !!value;
    const submit = form?.querySelector('button[type="submit"]');
    if (submit) submit.disabled = busy;
    if (stopButton) stopButton.hidden = !busy;
    if (regenerateButton) regenerateButton.disabled = busy || !lastRequest;
    if (input) input.disabled = busy;
  }
  function clearAssistantForNewChat() {
    activeController?.abort();
    activeController = null;
    helper()?.stopSpeaking();
    messageHistory = [{ role: 'system', content: 'You are MODEL AI, a helpful, accurate and friendly assistant. Be concise when appropriate, explain important steps clearly, state uncertainty, do not invent current facts, and do not claim to generate or inspect a file unless the configured tool returned a result.' }];
    currentSessionId = helper()?.newId?.() || `chat-${Date.now()}`;
    currentTitle = 'New MODEL AI chat';
    lastRequest = null;
    lastAssistantText = '';
    pendingFiles = [];
    if (thread) thread.replaceChildren();
    if (input) input.value = '';
    if (fileInput) fileInput.value = '';
    renderPendingFiles();
    if (readAloudButton) readAloudButton.disabled = true;
    if (regenerateButton) regenerateButton.disabled = true;
    setStatus('New chat started. Your prompts stay in this browser until submitted.');
  }
  async function dispatchMessage({ text, attachments = [], reuseUser = false }) {
    if (!form || !thread || busy) return;
    const cleanText = String(text || '').trim();
    if (!cleanText && !attachments.length && !reuseUser) return;
    const f = helper();
    if (!reuseUser) {
      const content = f ? f.userContent(cleanText, attachments) : cleanText;
      const displayed = f ? f.displayUserContent(cleanText, attachments) : cleanText;
      messageHistory.push({ role: 'user', content });
      addMessage('user', displayed);
      lastRequest = { text: cleanText, attachments: attachments.map(file => ({ ...file })) };
      if (currentTitle === 'New MODEL AI chat') currentTitle = cleanText.slice(0, 70) || attachments[0]?.name || 'MODEL AI chat';
    }
    if (input) input.value = '';
    pendingFiles = [];
    if (fileInput) fileInput.value = '';
    renderPendingFiles();
    const placeholder = addMessage('ai', 'Thinking…');
    const controller = new AbortController();
    activeController = controller;
    setBusy(true);
    setStatus(webSearchEnabled ? 'Asking the free-model router to answer with web search enabled. Web search may have separate usage costs.' : 'Connecting to OpenRouter…');
    try {
      const imagePayloadSize = messageHistory.reduce((sum, item) => sum + (Array.isArray(item.content) ? item.content.reduce((subtotal, part) => subtotal + (part?.type === 'image_url' ? String(part?.image_url?.url || '').length : 0), 0) : 0), 0);
      if (imagePayloadSize > 4_300_000) throw new Error('Attached images are too large together. Remove one image or use smaller files.');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messageHistory.slice(-20), webSearch: webSearchEnabled }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error([data.error || `AI request failed (HTTP ${response.status}).`, data.details].filter(Boolean).join(' '));
      if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('The AI provider returned no text response.');
      lastAssistantText = data.text;
      try {
        if (f?.typeText) await f.typeText(placeholder, data.text, controller.signal, 10);
        else placeholder.textContent = data.text;
      } catch (error) {
        if (error?.name !== 'AbortError') throw error;
        const partial = placeholder.textContent.replace(/▍$/, '').trim();
        if (partial) messageHistory.push({ role: 'assistant', content: partial });
        saveCurrentSession();
        setStatus('Response stopped. You can regenerate it or continue chatting.');
        return;
      }
      messageHistory.push({ role: 'assistant', content: data.text });
      if (readAloudButton) readAloudButton.disabled = !lastAssistantText;
      if (regenerateButton) regenerateButton.disabled = false;
      setStatus(data.model ? `Answered by ${data.model}.` : 'AI response received.');
      saveCurrentSession();
    } catch (error) {
      const aborted = error?.name === 'AbortError';
      placeholder.textContent = aborted ? 'Response stopped.' : (error?.message || 'AI request failed.');
      setStatus(aborted ? 'Response stopped.' : 'AI request failed. Check the details above; API keys stay on the server.');
      saveCurrentSession();
    } finally {
      if (activeController === controller) activeController = null;
      setBusy(false);
      if (thread) thread.scrollTop = thread.scrollHeight;
    }
  }

  $('#assistant-attach')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;
    if (pendingFiles.length + files.length > 4) {
      fileInput.value = '';
      toast('Attach up to 4 files at a time.');
      return;
    }
    if (!helper()) { toast('Attachment helper failed to load. Refresh the page.'); return; }
    setStatus('Reading attachment(s) locally…');
    for (const file of files) {
      try {
        const parsed = await helper().parseAttachment(file);
        pendingFiles.push(parsed);
      } catch (error) { toast(error?.message || `Could not attach ${file.name}.`); }
    }
    fileInput.value = '';
    renderPendingFiles();
    setStatus(pendingFiles.length ? `${pendingFiles.length} attachment(s) ready. They are sent only when you press Send.` : 'No valid attachments selected.');
  });

  $$('[data-chat-suggestion]').forEach(button => button.addEventListener('click', () => {
    if (input) { input.value = button.dataset.chatSuggestion || ''; input.focus(); }
  }));
  form?.addEventListener('submit', event => {
    event.preventDefault();
    dispatchMessage({ text: input?.value || '', attachments: pendingFiles.slice() });
  });
  stopButton?.addEventListener('click', () => {
    if (activeController) activeController.abort();
  });
  regenerateButton?.addEventListener('click', () => {
    if (!lastRequest || busy) return;
    if (messageHistory.at(-1)?.role === 'assistant') messageHistory.pop();
    const lastAi = thread?.querySelector('.assistant-msg.ai:last-child');
    lastAi?.remove();
    dispatchMessage({ text: lastRequest.text, attachments: lastRequest.attachments, reuseUser: true });
  });
  readAloudButton?.addEventListener('click', () => {
    try { helper()?.speak(lastAssistantText); } catch (error) { toast(error.message); }
  });
  voiceButton?.addEventListener('click', () => {
    if (recognition) { recognition.stop(); recognition = null; return; }
    try {
      recognition = helper()?.startDictation(input, voiceButton, () => {});
      setStatus('Listening… speak clearly, then press Send.');
    } catch (error) { toast(error.message); }
  });
  searchToggle?.addEventListener('click', () => {
    webSearchEnabled = !webSearchEnabled;
    searchToggle.setAttribute('aria-pressed', String(webSearchEnabled));
    searchToggle.classList.toggle('active', webSearchEnabled);
    setStatus(webSearchEnabled ? 'Web Search enabled for the next AI request. Provider search may incur separate usage costs.' : 'Web Search disabled.');
  });

  historyToggle?.addEventListener('click', async () => {
    if (!historyPanel) return;
    const open = historyPanel.hidden;
    historyPanel.hidden = !open;
    historyToggle.setAttribute('aria-expanded', String(open));
    if (!open) return;
    historyPanel.replaceChildren();
    const actions = document.createElement('div'); actions.className = 'history-panel-actions';
    const newButton = document.createElement('button'); newButton.type = 'button'; newButton.className = 'btn btn-soft'; newButton.textContent = '+ New chat';
    newButton.addEventListener('click', () => { clearAssistantForNewChat(); historyPanel.hidden = true; historyToggle.setAttribute('aria-expanded', 'false'); });
    const remoteNote = document.createElement('p'); remoteNote.className = 'chat-history-note'; remoteNote.textContent = 'Local history is saved in this browser. Cloud sync works after Firestore is enabled and its rules are set.';
    actions.append(newButton, remoteNote);
    historyPanel.append(actions);
    const listContainer = document.createElement('div'); listContainer.className = 'chat-history-list'; historyPanel.append(listContainer);
    await helper()?.renderHistoryList(listContainer, session => {
      activeController?.abort();
      currentSessionId = session.id;
      currentTitle = session.title || 'Saved chat';
      messageHistory = Array.isArray(session.messages) ? session.messages.map(message => ({ role: message.role, content: message.content })) : [];
      if (!messageHistory.some(message => message.role === 'system')) messageHistory.unshift({ role: 'system', content: 'You are MODEL AI, a helpful assistant. Be accurate and transparent.' });
      thread?.replaceChildren();
      for (const message of messageHistory) if (message.role !== 'system') addMessage(message.role === 'user' ? 'user' : 'ai', String(message.content || ''));
      const lastUser = [...messageHistory].reverse().find(message => message.role === 'user');
      lastRequest = lastUser ? { text: String(lastUser.content || ''), attachments: [] } : null;
      const lastAi = [...messageHistory].reverse().find(message => message.role === 'assistant');
      lastAssistantText = lastAi ? String(lastAi.content || '') : '';
      if (regenerateButton) regenerateButton.disabled = !lastRequest;
      if (readAloudButton) readAloudButton.disabled = !lastAssistantText;
      historyPanel.hidden = true;
      historyToggle.setAttribute('aria-expanded', 'false');
      setStatus('Saved chat restored. Attachments are not saved in history for privacy and storage limits.');
    }, currentSessionId);
  });
  window.addEventListener('modelai:chat-history-updated', () => {
    if (historyPanel && !historyPanel.hidden) setStatus('Chat history updated. Close and reopen History to refresh the list.');
  });
  window.addEventListener('modelai:auth-state', () => {
    // If a conversation was created before authentication finished, sync it after the user signs in.
    if (window.ModelAIAuth?.getCurrentUser?.() && messageHistory.length > 1) saveCurrentSession();
  });
  setBusy(false);

})();
