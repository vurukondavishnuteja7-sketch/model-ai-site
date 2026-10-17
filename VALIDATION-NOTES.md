# Validation Notes

Checks performed on this package:
- All external JavaScript files in `assets/` and `functions/` pass `node --check`.
- Inline JavaScript blocks in HTML were syntax checked.
- 35 tool catalogue entries with unique slugs; JSON catalogue matches the tool list and all 35 tool pages exist.
- All local HTML `href`/`src` references and CSS `url(...)` references resolve to files in the package.
- All 58 SVG files parse as XML; no malformed SVGs found.
- `sitemap.xml` parses as XML and JSON-LD script blocks parse as JSON.
- Firebase configuration is loaded before the authentication helper on the homepage, login page, account page, and AI-chat page; auth now tries modular SDK CDN imports and a compat-script fallback, with visible diagnostic errors.
- Image generation uses the separate server-side `AI_IMAGE_API_KEY` Secret and Gemini native REST endpoint; default image model set to `gemini-3.1-flash-lite-image`. Existing Cloudflare `AI_IMAGE_MODEL` variables must be changed if they still name the retired `gemini-2.5-flash-image` model.
- OpenRouter chat remains server-side, includes body-size/request validation, basic rate limiting, optional web search, and readable provider errors.
- The reference light-blue dashboard is preserved, with responsive controls, the chat typewriter effect/Stop/Regenerate, file attachments, voice helpers, history, favorites/recent tools, custom tool stickers, Text Animation Studio, and AdSense/SEO preparation pages.
- ZIP integrity was verified after packaging.

Not live-tested here: real Firebase sign-up/Google login against your project, actual OpenRouter responses with your secret, Gemini image generation using your account/quota, optional Firestore sync, browser microphone permissions, or AdSense review/approval. These depend on deployed files, enabled Firebase providers/domains, CDN/network access, your secrets, model availability, quotas and account configuration.
