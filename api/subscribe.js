export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, name, wuttyp, wuttyp_name, wuttyp_emoji, group_id, form_id } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const ML_TOKEN = process.env.MAILERLITE_TOKEN_KINDERLEICHT;
  if (!ML_TOKEN) return res.status(500).json({ error: "Server config error" });

  try {
    // Step 1: Subscribe via FORM endpoint (triggers form-specific double opt-in)
    if (form_id) {
      const formRes = await fetch(`https://connect.mailerlite.com/api/forms/${form_id}/subscribers`, {
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
          }
        })
      });
      const formData = await formRes.json();
      
      if (formRes.ok) {
        return res.status(200).json({ success: true, method: "form", status: formData?.data?.status });
      }
      // If form endpoint fails, fall back to regular subscriber endpoint
      console.error("Form subscribe failed:", JSON.stringify(formData));
    }

    // Fallback: Regular subscriber endpoint (uses account-wide double opt-in)
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
      return res.status(200).json({ success: true, method: "subscriber", status: data?.data?.status });
    } else {
      return res.status(mlRes.status).json({ error: data?.message || "MailerLite error" });
    }
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
