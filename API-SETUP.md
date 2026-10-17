# MODEL AI API Setup

## OpenRouter text chat and image analysis
Cloudflare Pages → Settings → Variables and Secrets → Production:
- `AI_API_KEY` (Secret): OpenRouter API key.
- `AI_API_BASE_URL` (Text): `https://openrouter.ai/api/v1`
- `AI_CHAT_MODEL` (Text): `openrouter/free`
- `AI_VISION_MODEL` (Text): `openrouter/free`

The free router chooses from currently available free models. Image understanding works only if the selected model supports vision, and all free usage has provider limits. Optional Web Search uses OpenRouter's search tool when requested; it can require compatible models and may incur separate usage charges.

## Gemini image generation
- `AI_IMAGE_API_KEY` (Secret): Gemini API key from Google AI Studio.
- `AI_IMAGE_API_BASE_URL` (Text): `https://generativelanguage.googleapis.com/v1beta`
- `AI_IMAGE_MODEL` (Text): `gemini-3.1-flash-lite-image`

**Important:** if Cloudflare already has `AI_IMAGE_MODEL=gemini-2.5-flash-image`, edit that existing value to `gemini-3.1-flash-lite-image` before redeploying. Google lists the older Gemini 2.5 Flash Image model as shut down on October 2, 2026.

`functions/api/image.js` reads these environment variables and calls Gemini's native `models/{model}:generateContent` endpoint. The image route reports missing-key, invalid-key, quota, model-access and empty-image responses as JSON diagnostics. Save the Secret and redeploy. A valid API key does not guarantee free image generation or access to every model.

## Optional background removal
- `BG_REMOVE_API_KEY` (Secret) only if you choose to use the included remove.bg integration.

Never paste keys into GitHub files, page source, screenshots or chat. Do not expose `AI_API_KEY` or `AI_IMAGE_API_KEY` in client-side JavaScript.
