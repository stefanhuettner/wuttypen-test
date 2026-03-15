export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, name, wuttyp, wuttyp_name, wuttyp_emoji, group_id } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  const ML_TOKEN = process.env.MAILERLITE_TOKEN_KINDERLEICHT;
  if (!ML_TOKEN) return res.status(500).json({ error: "Server config error" });

  try {
    const mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ML_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        fields: {
          name: name || null,
          wuttyp: wuttyp,
          wuttyp_name: wuttyp_name,
          wuttyp_emoji: wuttyp_emoji
        },
        groups: [group_id]
      })
    });

    const data = await mlRes.json();
    
    if (mlRes.ok) {
      return res.status(200).json({ success: true, status: data?.data?.status });
    } else {
      console.error("MailerLite error:", JSON.stringify(data));
      return res.status(mlRes.status).json({ error: data?.message || "MailerLite error" });
    }
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
