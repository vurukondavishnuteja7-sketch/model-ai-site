/* MODEL AI Firebase authentication, diagnostics, and optional Firestore chat sync. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const safeText = value => String(value || '').trim();
  const firebaseSources = [
    {
      name: 'Firebase CDN v12.19.0',
      app: 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js',
      auth: 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js',
      firestore: 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js'
    },
    {
      name: 'Firebase CDN v10.14.1',
      app: 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js',
      auth: 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js',
      firestore: 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'
    },
    {
      name: 'ESM CDN fallback',
      app: 'https://esm.sh/firebase@12.19.0/app',
      auth: 'https://esm.sh/firebase@12.19.0/auth',
      firestore: 'https://esm.sh/firebase@12.19.0/firestore'
    }
  ];

  let firebaseApp = null;
  let auth = null;
  let currentUser = null;
  let authModule = null;
  let appModule = null;
  let sourceUsed = null;
  let firebasePromise = null;
  let firestorePromise = null;
  let firestoreDb = null;
  let firestoreModule = null;

  function setStatus(message, kind = 'info') {
    const element = $('#auth-status');
    if (element) {
      element.textContent = message;
      element.dataset.kind = kind;
      element.hidden = false;
    } else if (kind === 'error') {
      console.error('[MODEL AI auth]', message);
    } else {
      console.info('[MODEL AI auth]', message);
    }
    const toolStatus = $('#assistant-status');
    if (toolStatus && kind === 'error') toolStatus.textContent = message;
  }

  function hideStatus() {
    const element = $('#auth-status');
    if (element) element.hidden = true;
  }

  function setBusy(busy) {
    document.querySelectorAll('[data-auth-action]').forEach(button => {
      button.disabled = !!busy;
      button.setAttribute('aria-busy', String(!!busy));
    });
  }

  function friendlyError(error) {
    const code = error?.code || '';
    const messages = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/missing-password': 'Please enter your password.',
      'auth/weak-password': 'Use a password with at least 6 characters.',
      'auth/email-already-in-use': 'An account already exists for this email. Try signing in.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/user-not-found': 'No account found for this email. Create an account first.',
      'auth/wrong-password': 'Email or password is incorrect.',
      'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
      'auth/unauthorized-domain': 'This domain is not authorized in Firebase Authentication → Settings → Authorized domains.',
      'auth/operation-not-allowed': 'Enable this sign-in method in Firebase Console → Authentication → Sign-in method.',
      'auth/network-request-failed': 'Network error while contacting Firebase. Check your connection and browser extensions.',
      'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups for this site and retry.',
      'auth/cancelled-popup-request': 'A sign-in popup is already open. Finish or close it first.',
      'auth/invalid-api-key': 'Firebase rejected the web API key. Copy the web app config again from Firebase Console → Project settings → Your apps.',
      'auth/configuration-not-found': 'Firebase Authentication is not configured. Enable Email/Password and Google providers.',
      'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
      'auth/account-exists-with-different-credential': 'This email already uses a different sign-in method. Sign in with that method first.'
    };
    if (messages[code]) return messages[code];
    return error?.message || 'Authentication failed. Check Firebase settings and try again.';
  }

  function setMode(mode) {
    const creating = mode === 'create';
    const title = $('#auth-title');
    const subtitle = $('#auth-subtitle');
    const nameLabel = $('#name-field');
    const nameInput = $('#auth-name');
    const submit = $('#auth-submit');
    const modeButton = $('#auth-mode');
    const resetRow = document.querySelector('.auth-form-row');
    if (title) title.textContent = creating ? 'Create your MODEL AI account' : 'Welcome back';
    if (subtitle) subtitle.textContent = creating ? 'Create an account to get started.' : 'Sign in to continue to your workspace.';
    if (nameLabel) nameLabel.hidden = !creating;
    if (nameInput) { nameInput.hidden = !creating; nameInput.required = creating; nameInput.autocomplete = 'name'; }
    if (submit) submit.textContent = creating ? 'Create account' : 'Sign in';
    if (resetRow) resetRow.hidden = creating;
    if (modeButton) {
      modeButton.textContent = creating ? 'Already have an account? Sign in' : 'New to MODEL AI? Create an account';
      modeButton.dataset.next = creating ? 'signin' : 'create';
      modeButton.dataset.mode = creating ? 'create' : 'signin';
      modeButton.setAttribute('aria-pressed', String(creating));
    }
    hideStatus();
  }

  function updateAccountUI(user) {
    currentUser = user || null;
    const link = $('#auth-profile-link');
    if (link) {
      const name = user ? (user.displayName || user.email?.split('@')[0] || 'Account') : 'Sign in';
      const nameElement = $('#auth-display-name');
      const welcomeElement = $('#auth-welcome');
      const avatarElement = $('#auth-avatar');
      if (nameElement) nameElement.textContent = name;
      if (welcomeElement) welcomeElement.textContent = user ? 'Signed in' : 'Welcome';
      if (avatarElement) avatarElement.textContent = user ? (name[0] || 'A').toUpperCase() : '👤';
      link.href = user ? '/account.html' : '/login.html';
      link.setAttribute('aria-label', user ? 'Open your MODEL AI account' : 'Sign in to MODEL AI');
    }
    const accountName = $('#account-display-name');
    const accountEmail = $('#account-email');
    if (accountName) accountName.textContent = user ? (user.displayName || user.email || 'MODEL AI member') : 'You are not signed in';
    if (accountEmail) accountEmail.textContent = user?.email || 'Sign in to view account details.';
    $('#account-signed-in')?.toggleAttribute('hidden', !user);
    $('#account-signed-out')?.toggleAttribute('hidden', !!user);
    window.dispatchEvent(new CustomEvent('modelai:auth-state', { detail: { user: user ? { uid: user.uid, displayName: user.displayName || '', email: user.email || '' } : null } }));
  }

  function loadClassicScript(src) {
    window.__MODEL_AI_COMPAT_SCRIPT_PROMISES ||= Object.create(null);
    const pending = window.__MODEL_AI_COMPAT_SCRIPT_PROMISES;
    if (pending[src]) return pending[src];
    pending[src] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => {
        script.remove();
        delete pending[src];
        reject(new Error(`Timed out loading ${src}`));
      }, 12000);
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        delete pending[src];
        reject(new Error(`Could not load ${src}`));
      };
      document.head.appendChild(script);
    });
    return pending[src];
  }

  function installCompatAdapter(version) {
    const compat = window.firebase;
    if (!compat?.initializeApp || typeof compat.auth !== 'function') {
      throw new Error('Firebase compat SDK did not expose app/auth APIs.');
    }
    appModule = {
      getApps: () => compat.apps,
      getApp: () => compat.app(),
      initializeApp: config => compat.initializeApp(config)
    };
    authModule = {
      getAuth: app => app.auth(),
      browserLocalPersistence: compat.auth.Auth.Persistence.LOCAL,
      setPersistence: (target, persistence) => target.setPersistence(persistence),
      onAuthStateChanged: (target, next, error) => target.onAuthStateChanged(next, error),
      createUserWithEmailAndPassword: (target, email, password) => target.createUserWithEmailAndPassword(email, password),
      updateProfile: (user, profile) => user.updateProfile(profile),
      signInWithEmailAndPassword: (target, email, password) => target.signInWithEmailAndPassword(email, password),
      GoogleAuthProvider: compat.auth.GoogleAuthProvider,
      signInWithPopup: (target, provider) => target.signInWithPopup(provider),
      sendPasswordResetEmail: (target, email) => target.sendPasswordResetEmail(email),
      signOut: target => target.signOut()
    };
    sourceUsed = {
      name: `Firebase compat CDN v${version}`,
      version,
      compat: true,
      app: `https://www.gstatic.com/firebasejs/${version}/firebase-app-compat.js`,
      auth: `https://www.gstatic.com/firebasejs/${version}/firebase-auth-compat.js`,
      firestore: `https://www.gstatic.com/firebasejs/${version}/firebase-firestore-compat.js`
    };
  }

  async function importFirebaseModules() {
    if (appModule && authModule) return;
    const errors = [];
    for (const source of firebaseSources) {
      try {
        const [appSdk, authSdk] = await Promise.all([import(source.app), import(source.auth)]);
        if (!appSdk.initializeApp || !authSdk.getAuth) throw new Error('Firebase modules did not expose expected APIs.');
        appModule = appSdk;
        authModule = authSdk;
        sourceUsed = source;
        console.info(`[MODEL AI auth] Loaded ${source.name}.`);
        return;
      } catch (error) {
        errors.push(`${source.name}: ${error?.message || String(error)}`);
      }
    }

    // Fallback for browsers/CDN environments where JavaScript module imports are blocked.
    // The compat API is adapted to the modular calls used below, without exposing provider secrets.
    try {
      const version = '12.19.0';
      const appSrc = `https://www.gstatic.com/firebasejs/${version}/firebase-app-compat.js`;
      const authSrc = `https://www.gstatic.com/firebasejs/${version}/firebase-auth-compat.js`;
      await loadClassicScript(appSrc);
      await loadClassicScript(authSrc);
      installCompatAdapter(version);
      console.info(`[MODEL AI auth] Loaded ${sourceUsed.name} fallback.`);
      return;
    } catch (error) {
      errors.push(`Firebase compat fallback: ${error?.message || String(error)}`);
    }

    console.error('[MODEL AI auth] All SDK imports failed:', errors);
    throw new Error('Firebase SDK could not load from its CDN. Check internet/CDN blocking and the browser Console. Details: ' + errors.join(' | ').slice(0, 700));
  }

  async function ensureFirebase() {
    if (auth && authModule) return { app: firebaseApp, auth, authSdk: authModule };
    if (!firebasePromise) {
      firebasePromise = (async () => {
        const config = window.MODEL_AI_FIREBASE_CONFIG;
        if (!window.MODEL_AI_FIREBASE_CONFIGURED || !config) {
          throw new Error('Firebase config script did not load or contains placeholders. Check /assets/firebase-config.js and verify your web app config.');
        }
        await importFirebaseModules();
        try {
          firebaseApp = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(config);
          auth = authModule.getAuth(firebaseApp);
          authModule.setPersistence(auth, authModule.browserLocalPersistence).catch(error => {
            console.warn('[MODEL AI auth] Could not set persistent browser sign-in:', error?.message || error);
          });
          authModule.onAuthStateChanged(auth, user => {
            updateAccountUI(user);
            window.__MODEL_AI_FIREBASE_READY = true;
            if ($('#login-card') && user) {
              setStatus('Signed in successfully. Opening your account…', 'success');
              setTimeout(() => { location.href = '/account.html'; }, 500);
            }
            window.dispatchEvent(new CustomEvent('modelai:auth-ready', { detail: { user: user ? { uid: user.uid, displayName: user.displayName || '', email: user.email || '' } : null } }));
          }, error => {
            console.error('[MODEL AI auth] Auth state error:', error);
            setStatus(friendlyError(error), 'error');
          });
          window.__MODEL_AI_FIREBASE_READY = true;
          window.dispatchEvent(new CustomEvent('modelai:firebase-ready', { detail: { ok: true } }));
          return { app: firebaseApp, auth, authSdk: authModule };
        } catch (error) {
          console.error('[MODEL AI auth] Firebase initialization failed:', error);
          throw new Error('Firebase initialization failed: ' + friendlyError(error));
        }
      })();
    }
    try {
      return await firebasePromise;
    } catch (error) {
      setStatus(error?.message || 'Firebase could not initialize.', 'error');
      window.dispatchEvent(new CustomEvent('modelai:firebase-ready', { detail: { ok: false, message: error?.message || String(error) } }));
      throw error;
    }
  }

  async function ensureFirestore() {
    if (firestoreDb && firestoreModule) return { db: firestoreDb, module: firestoreModule };
    if (!firestorePromise) {
      firestorePromise = (async () => {
        const loaded = await ensureFirebase();
        const source = sourceUsed || firebaseSources[0];
        try {
          if (sourceUsed?.compat) {
            await loadClassicScript(sourceUsed.firestore);
            const compat = window.firebase;
            firestoreDb = loaded.app.firestore();
            firestoreModule = {
              doc: (db, ...segments) => db.doc(segments.join('/')),
              collection: (db, ...segments) => db.collection(segments.join('/')),
              setDoc: (ref, data, options) => ref.set(data, options),
              getDocs: async queryRef => queryRef.get(),
              getDoc: async ref => {
                const snapshot = await ref.get();
                return { exists: () => snapshot.exists, data: () => snapshot.data() };
              },
              orderBy: (field, direction = 'asc') => ({ kind: 'orderBy', field, direction }),
              limit: size => ({ kind: 'limit', size }),
              query: (ref, ...constraints) => constraints.reduce((query, constraint) => {
                if (constraint.kind === 'orderBy') return query.orderBy(constraint.field, constraint.direction);
                if (constraint.kind === 'limit') return query.limit(constraint.size);
                return query;
              }, ref)
            };
            if (!compat?.firestore) throw new Error('Firebase Firestore compat API is unavailable.');
          } else {
            firestoreModule = await import(source.firestore);
            firestoreDb = firestoreModule.getFirestore(loaded.app);
          }
          return { db: firestoreDb, module: firestoreModule };
        } catch (error) {
          console.error('[MODEL AI auth] Firestore SDK could not load:', error);
          throw new Error('Cloud chat history could not load. Enable Firebase Firestore and allow the SDK CDN.');
        }
      })();
    }
    return firestorePromise;
  }

  function plainMessages(messages) {
    return (Array.isArray(messages) ? messages : []).filter(message => ['user', 'assistant', 'system'].includes(message?.role)).map(message => {
      let content = message.content;
      if (Array.isArray(content)) {
        content = content.map(part => {
          if (part?.type === 'text') return String(part.text || '');
          if (part?.type === 'image_url') return '[Image attachment omitted from saved history]';
          return '';
        }).filter(Boolean).join('\n');
      }
      return { role: message.role, content: String(content || '').slice(0, 6000) };
    }).filter(message => message.content && message.content.length < 7000).slice(-30);
  }

  async function saveConversation(conversation) {
    if (!currentUser || !conversation?.id) return false;
    try {
      const { db, module: fs } = await ensureFirestore();
      const safe = {
        id: String(conversation.id).slice(0, 80),
        title: String(conversation.title || 'MODEL AI Chat').slice(0, 120),
        updatedAt: Date.now(),
        messages: plainMessages(conversation.messages)
      };
      await fs.setDoc(fs.doc(db, 'users', currentUser.uid, 'conversations', safe.id), safe, { merge: true });
      return true;
    } catch (error) {
      console.warn('[MODEL AI auth] Cloud chat save skipped:', error?.message || error);
      return false;
    }
  }

  async function listConversations() {
    if (!currentUser) return [];
    try {
      const { db, module: fs } = await ensureFirestore();
      const ref = fs.collection(db, 'users', currentUser.uid, 'conversations');
      const result = await fs.getDocs(fs.query(ref, fs.orderBy('updatedAt', 'desc'), fs.limit(20)));
      return result.docs.map(doc => doc.data()).filter(item => item?.id && Array.isArray(item.messages));
    } catch (error) {
      console.warn('[MODEL AI auth] Cloud chat history unavailable:', error?.message || error);
      return [];
    }
  }

  async function loadConversation(id) {
    if (!currentUser || !id) return null;
    try {
      const { db, module: fs } = await ensureFirestore();
      const ref = fs.doc(db, 'users', currentUser.uid, 'conversations', String(id));
      const snapshot = await fs.getDoc(ref);
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      console.warn('[MODEL AI auth] Cloud chat restore unavailable:', error?.message || error);
      return null;
    }
  }

  const modeButton = $('#auth-mode');
  if (modeButton && !window.__MODEL_AI_LOGIN_UI_BOUND) {
    modeButton.addEventListener('click', event => {
      event.preventDefault();
      setMode(modeButton.dataset.next || 'create');
    });
  }

  const form = $('#auth-form');
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const email = safeText($('#auth-email')?.value);
      const password = $('#auth-password')?.value || '';
      const name = safeText($('#auth-name')?.value);
      const creating = modeButton?.dataset.next === 'signin';
      if (!email) return setStatus('Enter your email address.', 'error');
      if (password.length < 6) return setStatus('Use a password with at least 6 characters.', 'error');
      if (creating && !name) return setStatus('Enter your name to create an account.', 'error');
      setBusy(true);
      try {
        const loaded = await ensureFirebase();
        if (creating) {
          const credential = await loaded.authSdk.createUserWithEmailAndPassword(loaded.auth, email, password);
          await loaded.authSdk.updateProfile(credential.user, { displayName: name });
          setStatus('Account created successfully. Redirecting…', 'success');
        } else {
          await loaded.authSdk.signInWithEmailAndPassword(loaded.auth, email, password);
          setStatus('Signed in successfully. Redirecting…', 'success');
        }
        setTimeout(() => { location.href = '/account.html'; }, 500);
      } catch (error) {
        setStatus(friendlyError(error), 'error');
        console.error('[MODEL AI auth] Email auth action failed:', error);
      } finally {
        setBusy(false);
      }
    });
  }

  const googleButton = $('#google-signin');
  googleButton?.addEventListener('click', async () => {
    setBusy(true);
    try {
      const loaded = await ensureFirebase();
      const provider = new loaded.authSdk.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await loaded.authSdk.signInWithPopup(loaded.auth, provider);
      setStatus('Google sign-in successful. Redirecting…', 'success');
      setTimeout(() => { location.href = '/account.html'; }, 500);
    } catch (error) {
      setStatus(friendlyError(error), 'error');
      console.error('[MODEL AI auth] Google sign-in failed:', error);
    } finally {
      setBusy(false);
    }
  });

  $('#password-reset')?.addEventListener('click', async () => {
    const email = safeText($('#auth-email')?.value);
    if (!email) return setStatus('Enter your email address first, then choose Forgot password.', 'error');
    setBusy(true);
    try {
      const loaded = await ensureFirebase();
      await loaded.authSdk.sendPasswordResetEmail(loaded.auth, email);
      setStatus('Password reset email sent. Check your inbox and spam folder.', 'success');
    } catch (error) {
      setStatus(friendlyError(error), 'error');
      console.error('[MODEL AI auth] Password reset failed:', error);
    } finally {
      setBusy(false);
    }
  });

  $('#signout-button')?.addEventListener('click', async () => {
    try {
      const loaded = await ensureFirebase();
      await loaded.authSdk.signOut(loaded.auth);
      location.href = '/';
    } catch (error) {
      setStatus(friendlyError(error), 'error');
    }
  });

  window.ModelAIAuth = {
    ensureFirebase,
    getCurrentUser: () => currentUser,
    saveConversation,
    listConversations,
    loadConversation
  };
  window.__MODEL_AI_AUTH_READY = true;
  updateAccountUI(null);
  if (form) setMode('signin');
  // Start a non-blocking startup check so profile and cloud-save features can initialize.
  void ensureFirebase().catch(error => console.warn('[MODEL AI auth] Startup check failed:', error));
})();
