# Firebase Login & Signup

1. Open Firebase Console → Project settings → Your apps and verify `assets/firebase-config.js` matches your Web app values exactly. The website currently reads `window.MODEL_AI_FIREBASE_CONFIG` defined by this file.
2. Load order matters: `firebase-config.js` must appear before `firebase-auth.js`. This ZIP updates the login/home/account/AI-chat pages with that order and unique cache-busting query strings.
3. Authentication → Sign-in method: enable **Email/Password** and **Google**.
4. Authentication → Settings → Authorized domains: add `modelaitools.online` and the actual Cloudflare Pages hostname, e.g. `modelaitools.pages.dev` only if that is your exact host.
5. Deploy the Git repository with `assets/firebase-config.js`, `assets/firebase-auth.js`, and `assets/login-ui.js` at their exact paths.
6. Visit `/login.html`, hard-refresh, use Create account, then test Google login. Errors now appear in the page status region and Console. If the message says the SDK cannot load, inspect the first module import/network error; a CDN or extension may block external ES modules.
7. Cloud history requires Firestore Database and per-user rules. Local saved chat history continues to work without Firestore.

Firebase web config is normally visible client-side. Never put service-account JSON, Admin SDK private keys or API provider secrets in this file.


## SDK loading fallback
The authentication script tries the Firebase modular browser SDK first and then a Firebase compat-script fallback if module imports fail. If the visible error still reports a CDN load failure, check DevTools → Network for blocked `gstatic.com`/`esm.sh` requests and verify that `/assets/firebase-config.js` returns HTTP 200.
