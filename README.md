# MODEL AI — Reference Dashboard

This is the full static website plus Cloudflare Pages Functions for `modelaitools.online`. The homepage keeps the clean white/light-blue reference design with blue/purple accents and adds the selected chat, file, image, history, voice, recent-tools, animation and accessibility features.

## Deploy
Read [START-HERE.md](START-HERE.md), then copy the repository root to GitHub and deploy with Cloudflare Pages Git integration. The `functions/` directory must remain in the root.

## Features
- 35 tool pages, including a new browser-local Text Animation Studio.
- Reference dashboard with tool search/category filtering, favorites, recently-used tools, SVG stickers, responsive sidebar and AdSense placeholder.
- Firebase email/password and Google sign-in with visible diagnostic status messages.
- Secure OpenRouter chat and optional Web Search via Cloudflare Function.
- Gemini image generation via the native server-side API, with selectable style and aspect ratio.
- Typewriter response animation, stop/regenerate, file attachments (images/PDF/text), image/document analysis, browser speech input/read-aloud, and local chat history with optional Firestore sync.

## API secrets
Use Cloudflare Variables and Secrets; see [API-SETUP.md](API-SETUP.md). Never commit provider keys to frontend JavaScript or GitHub.

## Important validation note
Static JavaScript syntax, local asset paths, tool counts and ZIP contents are checked during packaging. Live sign-in, provider responses and AdSense approval depend on your actual account/domain configuration and are not claimed as live-tested.
