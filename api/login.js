export default function handler(req, res) {
  // LOGOUT
  if (req.query.logout) {
    res.setHeader(
      "Set-Cookie",
      "modelai_user=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"
    );
    return res.status(200).json({ message: "Logged out" });
  }

  // ONLY POST FOR LOGIN
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // SIMPLE COOKIE SESSION
    res.setHeader(
      "Set-Cookie",
      `modelai_user=${encodeURIComponent(username)}; Path=/; HttpOnly; SameSite=Lax`
    );

    return res.status(200).json({
      success: true,
      user: username,
    });

  } catch (err) {
    return res.status(500).json({ error: "Login server error" });
  }
}
