// MODEL AI secure OpenRouter proxy for text chat and image understanding.
// Required: AI_API_KEY as a Cloudflare Secret. Never expose it in frontend files.
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_MESSAGES = 20;
const MAX_CONTENT_CHARS = 24_000;
const DEFAULT_OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_FREE_MODEL = 'openrouter/free';
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
const rateBuckets = new Map();

function json(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: HEADERS });
}

function rateLimited(request) {
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown-client';
  const item = rateBuckets.get(ip);
  if (!item || now - item.start > 60_000) {
    rateBuckets.set(ip, { start: now, count: 1 });
    if (rateBuckets.size > 1200) {
      for (const [key, value] of rateBuckets) if (now - value.start > 60_000) rateBuckets.delete(key);
    }
    return false;
  }
  item.count += 1;
  return item.count > 30;
}

export function onRequestGet() {
  return json(200, {
    ok: true,
    route: '/api/chat',
    message: 'MODEL AI chat route is active. Send POST with messages to request a response.'
  });
}

function containsImage(messages) {
  return messages.some(message => Array.isArray(message?.content) && message.content.some(part => part?.type === 'image_url'));
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) {
    return `Send between 1 and ${MAX_MESSAGES} messages.`;
  }
  let chars = 0;
  for (const message of messages) {
    if (!message || !['user', 'assistant', 'system'].includes(message.role)) return 'Unsupported message role.';
    if (typeof message.content === 'string') {
      chars += message.content.length;
      continue;
    }
    if (!Array.isArray(message.content)) return 'Message content must be text or supported image content.';
    for (const part of message.content) {
      if (part?.type === 'text' && typeof part.text === 'string') {
        chars += part.text.length;
        continue;
      }
      if (part?.type === 'image_url') {
        const url = part?.image_url?.url;
        if (typeof url !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/i.test(url)) {
          return 'Images must be PNG, JPEG or WebP data URLs.';
        }
        chars += url.length;
        continue;
      }
      return 'Unsupported content part. Attach text or a supported image.';
    }
  }
  if (chars > MAX_CONTENT_CHARS + MAX_BODY_BYTES) return 'Chat content is too large. Reduce the text or image size.';
  return '';
}

export async function onRequestPost({ request, env }) {
  try {
    if (rateLimited(request)) {
      return json(429, { error: 'Too many AI requests from this network. Please wait a minute and try again.' });
    }

    const length = Number(request.headers.get('content-length') || '0');
    if (length > MAX_BODY_BYTES) return json(413, { error: 'Request is too large. Reduce the text or image size.' });

    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json(413, { error: 'Request is too large. Reduce the text or image size.' });
    }

    let body;
    try { body = JSON.parse(raw); }
    catch { return json(400, { error: 'Request body must be valid JSON.' }); }

    const validationError = validateMessages(body?.messages);
    if (validationError) return json(400, { error: validationError });

    const apiKey = String(env?.AI_API_KEY || '').trim();
    if (!apiKey) {
      return json(503, {
        error: 'AI is not configured. Add AI_API_KEY as an encrypted Cloudflare Secret containing your OpenRouter key.',
        help: 'Cloudflare → Workers & Pages → modelaitools → Settings → Variables and Secrets → Production.'
      });
    }

    const base = String(env?.AI_API_BASE_URL || DEFAULT_OPENROUTER_BASE).trim().replace(/\/+$/, '');
    const isVisionRequest = containsImage(body.messages);
    const model = String(
      isVisionRequest ? (env?.AI_VISION_MODEL || DEFAULT_FREE_MODEL) : (env?.AI_CHAT_MODEL || DEFAULT_FREE_MODEL)
    ).trim();
    const webSearch = body?.webSearch === true && !isVisionRequest;
    const endpoint = `${base}/chat/completions`;
    const requestBody = {
      model,
      messages: body.messages,
      max_tokens: 1400
    };
    // OpenRouter web search is opt-in because provider search can incur separate usage charges.
    if (webSearch) requestBody.tools = [{ type: 'openrouter:web_search' }];

    console.log('[MODEL AI] OpenRouter request', {
      model,
      kind: isVisionRequest ? 'image-analysis' : 'text-chat',
      webSearch
    });

    let upstream;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        upstream = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://modelaitools.online',
            'X-OpenRouter-Title': 'MODEL AI'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error('[MODEL AI] OpenRouter connection failure:', error?.name, error?.message);
      return json(502, {
        error: error?.name === 'AbortError' ? 'The AI provider timed out. Try again shortly.' : 'Could not connect to OpenRouter.',
        details: String(error?.message || 'Network request failed').slice(0, 240)
      });
    }

    const upstreamText = await upstream.text();
    let data = null;
    try { data = JSON.parse(upstreamText); } catch {}

    if (!upstream.ok) {
      const details = data?.error?.message || data?.message || upstreamText.slice(0, 320) || `HTTP ${upstream.status}`;
      console.error('[MODEL AI] OpenRouter rejected request:', upstream.status, String(details).slice(0, 260));
      let hint = '';
      if (upstream.status === 401 || upstream.status === 403) hint = ' Check the OpenRouter key and account access.';
      else if (upstream.status === 402) hint = ' This request needs credits or a different free model.';
      else if (upstream.status === 429) hint = ' Free-model quota or rate limit may have been reached.';
      else if (upstream.status === 400 && webSearch) hint = ' This model may not support web-search tools; try without Web Search.';
      else if (upstream.status === 400 && isVisionRequest) hint = ' The selected model may not support image input; choose a vision-capable model.';
      return json(502, {
        error: `OpenRouter API error (HTTP ${upstream.status}).${hint}`,
        providerStatus: upstream.status,
        details: String(details).slice(0, 320)
      });
    }

    if (!data) return json(502, { error: 'OpenRouter returned an unreadable response. Try again.' });
    const content = data?.choices?.[0]?.message?.content;
    const text = Array.isArray(content) ? content.map(part => part?.text || '').join('\n') : content;
    if (typeof text !== 'string' || !text.trim()) {
      return json(502, { error: 'The selected free model returned no text. Try again or disable Web Search.' });
    }

    const citations = Array.isArray(data?.choices?.[0]?.message?.annotations)
      ? data.choices[0].message.annotations
          .filter(item => item?.type === 'url_citation' && item?.url_citation?.url)
          .slice(0, 10)
          .map(item => ({ title: String(item.url_citation.title || 'Source').slice(0, 160), url: String(item.url_citation.url).slice(0, 1000) }))
      : [];

    return json(200, { text: text.trim(), citations, model });
  } catch (error) {
    console.error('[MODEL AI] Unexpected chat server exception:', error?.stack || error?.message || error);
    return json(500, {
      error: 'Unexpected chat server error.',
      details: String(error?.message || 'Unknown error').slice(0, 240)
    });
  }
}
