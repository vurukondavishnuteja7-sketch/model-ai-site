# MODEL AI — Complete deployment guide

## 1. Deploy the complete website
1. Download and extract this ZIP.
2. Copy the extracted project root into the GitHub repository root. `index.html`, `assets/`, `tools/`, `functions/`, `_headers`, `robots.txt`, and `sitemap.xml` should be at repository root. Do not upload the ZIP file alone or nest everything in an extra folder.
3. Commit the changes. Cloudflare Pages should build the Git-connected repository; the `functions/` directory must remain at root for `/api/*` routes.
4. Confirm the latest production deployment succeeds. Hard-refresh the site with Ctrl+Shift+R.

## 2. Firebase login and signup
- `/assets/firebase-config.js` is loaded before `/assets/firebase-auth.js` on the home, login, account and AI-chat pages.
- Confirm the config against Firebase Console → Project settings → Your apps. The web config is client-side config, not an Admin SDK secret. Never commit a service-account JSON file.
- Firebase Console → Authentication → Sign-in method: enable Email/Password and Google. Authentication → Settings → Authorized domains: add `modelaitools.online` and your actual `*.pages.dev` host.
- Google popup requires an authorized domain and enabled Google provider. If a module CDN is blocked on your browser/network, use the visible auth diagnostic and Console error.

## 3. Optional cloud chat history
- Local chat history works in the browser. For cross-device sync, enable Firestore Database and publish these rules (restrict each user to their own path):
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/conversations/{conversationId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. OpenRouter text chat and image understanding
In Cloudflare Pages → Settings → Variables and Secrets → **Production**, configure:
- `AI_API_KEY` — encrypted Secret with your OpenRouter key.
- `AI_API_BASE_URL` — `https://openrouter.ai/api/v1` (Text).
- `AI_CHAT_MODEL` — `openrouter/free` (Text).
- `AI_VISION_MODEL` — `openrouter/free` (Text; image understanding depends on which free model OpenRouter routes to).
Never put provider keys in frontend files or GitHub. The free-model router is subject to availability and quotas; not every free model supports image input.

## 5. Gemini image generation
Set a separate encrypted Cloudflare Secret `AI_IMAGE_API_KEY` to your Gemini API key. Optional Text variables:
- `AI_IMAGE_API_BASE_URL` = `https://generativelanguage.googleapis.com/v1beta`
- `AI_IMAGE_MODEL` = `gemini-3.1-flash-lite-image`
If an older `AI_IMAGE_MODEL=gemini-2.5-flash-image` already exists in Cloudflare, edit the existing variable to the new model ID before redeploying; the older model was shut down on October 2, 2026.
The function uses Gemini's native `generateContent` REST API. The default model is `gemini-3.1-flash-lite-image`; model access and pricing/quota depend on the Google AI Studio project. Check the current Google AI Studio model access, quota and pricing; do not assume image generation is unlimited or free. Save variables and redeploy.

Optional background removal requires `BG_REMOVE_API_KEY` for the provider wired by the included `/api/background-remove` function.

## 6. AdSense / SEO
This package contains policy pages, sitemap, robots, an ad placeholder and an `ads.txt` starter comment. Replace or update `ads.txt` only with the exact line supplied by your own AdSense account after you have a publisher ID. No approval or monetization is guaranteed. Do not add ad scripts until your account and consent obligations are configured.

## 7. Verify after deployment
- `https://modelaitools.online/api/chat` should show a JSON route-health response on GET.
- `https://modelaitools.online/api/image` should show a JSON route-health response on GET.
- Test `/login.html`, `/tools/ai-chat/`, `/tools/ai-image-generator/`, `/tools/image-analysis/`, and `/tools/text-animation/`.
- If a request fails, inspect DevTools → Network → request → Response and Cloudflare Functions logs. Do not share API keys in screenshots.

## Validation scope
JavaScript syntax, static file paths, tool catalogue consistency and ZIP integrity should be checked before delivery. Actual Firebase sign-in and provider-backed image/chat requests depend on your own account settings and keys and are not claimed as live-tested from this build environment.
