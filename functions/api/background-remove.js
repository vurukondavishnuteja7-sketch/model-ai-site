// MODEL AI background removal endpoint. Requires a remove.bg API key.
export async function onRequestPost({ request, env }) {
  const json = (status, data) => new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
  if (!env.BG_REMOVE_API_KEY) return json(503, { error: "Background removal is not configured. Add BG_REMOVE_API_KEY as an encrypted Cloudflare secret. The provider may charge after its free allowance." });
  let incoming;
  try { incoming = await request.formData(); } catch { return json(400, { error: "Choose an image file first." }); }
  const file = incoming.get("image");
  if (!(file instanceof File)) return json(400, { error: "Choose an image file first." });
  if (file.size > 8 * 1024 * 1024) return json(413, { error: "Image must be 8 MB or smaller." });
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return json(415, { error: "Use a PNG, JPEG or WebP image." });
  try {
    const form = new FormData();
    form.append("image_file", file, file.name || "upload.png");
    form.append("size", "auto");
    const upstream = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": env.BG_REMOVE_API_KEY },
      body: form
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      return json(502, { error: `Background provider returned HTTP ${upstream.status}. Check your key, quota and provider account. ${detail.slice(0, 250)}` });
    }
    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: { "Content-Type": upstream.headers.get("content-type") || "image/png", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return json(502, { error: "Could not reach the background-removal provider." });
  }
}
