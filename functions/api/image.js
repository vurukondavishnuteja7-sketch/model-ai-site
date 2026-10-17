// MODEL AI image generation endpoint using the native Gemini REST API.
// Secret required: AI_IMAGE_API_KEY. Never expose this secret to the browser.
const DEFAULT_GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-lite-image';
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
const imageRateBuckets = new Map();

function json(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: HEADERS });
}

function limited(request) {
  const now = Date.now();
  const key = request.headers.get('CF-Connecting-IP') || 'unknown-client';
  const prior = imageRateBuckets.get(key);
  if (!prior || now - prior.start > 60_000) {
    imageRateBuckets.set(key, { start: now, count: 1 });
    return false;
  }
  prior.count += 1;
  return prior.count > 5;
}

export function onRequestGet() {
  return json(200, {
    ok: true,
    route: '/api/image',
    message: 'Gemini image route is deployed. Send POST with a prompt to generate an image.'
  });
}

export async function onRequestPost({ request, env }) {
  try {
    if (limited(request)) {
      return json(429, { error: 'Image-generation limit reached. Please wait one minute and try again.' });
    }

    const apiKey = String(env?.AI_IMAGE_API_KEY || '').trim();
    if (!apiKey) {
      return json(503, {
        error: 'Image generation needs AI_IMAGE_API_KEY as an encrypted Cloudflare Secret containing your Gemini API key.',
        help: 'Cloudflare → Workers & Pages → modelaitools → Settings → Variables and Secrets → Production.'
      });
    }

    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > 20_000) {
      return json(413, { error: 'The image-generation request is too large. Shorten the prompt and try again.' });
    }

    let body;
    try { body = await request.json(); }
    catch { return json(400, { error: 'Request body must be valid JSON.' }); }

    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const style = typeof body?.style === 'string' ? body.style.slice(0, 80) : 'Realistic';
    const ratio = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '5:4', '4:5', '21:9'].includes(body?.ratio) ? body.ratio : '1:1';
    if (!prompt) return json(400, { error: 'Enter an image prompt first.' });
    if (prompt.length > 3000) return json(400, { error: 'Keep the image prompt under 3,000 characters.' });

    let base = String(env?.AI_IMAGE_API_BASE_URL || DEFAULT_GEMINI_BASE).trim().replace(/\/+$/, '');
    // Older setup guides used Gemini's OpenAI-compatible base. Normalize it to the native REST base.
    base = base.replace(/\/openai$/i, '');
    if (!/^https:\/\/generativelanguage\.googleapis\.com\/v1beta$/i.test(base)) {
      base = DEFAULT_GEMINI_BASE;
    }
    const model = String(env?.AI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL).trim().replace(/[^a-zA-Z0-9._-]/g, '');
    const endpoint = `${base}/models/${encodeURIComponent(model)}:generateContent`;
    const fullPrompt = [
      prompt,
      `Visual style: ${style}.`,
      'Create a polished, coherent image with a clear subject, clean composition and high visual quality.',
      'Avoid illegible text or watermarks unless explicitly requested.',
      `Requested aspect ratio: ${ratio}.`
    ].join('\n');

    let upstream;
    try {
      upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: ratio }
          }
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(55_000) : undefined
      });
    } catch (error) {
      console.error('[MODEL AI image] Gemini connection failed:', error?.message || error);
      return json(502, {
        error: 'Could not connect to Gemini image generation.',
        details: error?.name === 'TimeoutError' || error?.name === 'AbortError'
          ? 'The image request timed out. Try a shorter prompt or try again shortly.'
          : String(error?.message || 'Network request failed').slice(0, 240)
      });
    }

    const raw = await upstream.text();
    let data = null;
    try { data = JSON.parse(raw); } catch {}

    if (!upstream.ok) {
      const providerMessage = data?.error?.message || data?.message || raw.slice(0, 320) || `HTTP ${upstream.status}`;
      console.error('[MODEL AI image] Gemini provider error', {
        status: upstream.status,
        message: String(providerMessage).slice(0, 260)
      });
      let hint = '';
      if (upstream.status === 401 || upstream.status === 403) hint = ' Check the Gemini API key and API access for this project.';
      else if (upstream.status === 429) hint = ' Gemini quota or rate limit may have been reached.';
      else if (upstream.status === 400) hint = ' Check that the model name, prompt and image ratio are supported.';
      return json(502, {
        error: `Gemini image API error (HTTP ${upstream.status}).${hint}`,
        providerStatus: upstream.status,
        details: String(providerMessage).slice(0, 320)
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(part => (part?.inlineData?.data || part?.inline_data?.data));
    if (imagePart) {
      const inline = imagePart.inlineData || imagePart.inline_data;
      const mime = inline.mimeType || inline.mime_type || 'image/png';
      return json(200, {
        image: `data:${mime};base64,${inline.data}`,
        mimeType: mime,
        model
      });
    }

    const feedback = data?.promptFeedback?.blockReason;
    const candidateReason = data?.candidates?.[0]?.finishReason;
    const returnedText = parts.map(part => part?.text || '').filter(Boolean).join('\n').slice(0, 320);
    return json(502, {
      error: feedback
        ? `Gemini did not generate an image because the request was blocked (${feedback}). Try a different prompt.`
        : 'Gemini returned no image data. Check model access, quota and API availability.',
      details: returnedText || (candidateReason ? `Finish reason: ${candidateReason}` : 'No image part was present in the Gemini response.')
    });
  } catch (error) {
    console.error('[MODEL AI image] Unexpected server exception:', error?.stack || error?.message || error);
    return json(500, {
      error: 'Unexpected image-generation server error.',
      details: String(error?.message || 'Unknown error').slice(0, 240)
    });
  }
}
