// Vercel Serverless Function: Club Warteliste Subscription
// Adds subscriber to MailerLite group "Warteliste Club"

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  // MailerLite API
  const ML_TOKEN = process.env.MAILERLITE_TOKEN_KINDERLEICHT;
  const GROUP_ID = '182231085051020573'; // Warteliste Club

  try {
    // Create or update subscriber
    const subscriberRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ML_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        fields: {
          name: name || ''
        },
        groups: [GROUP_ID]
      })
    });

    const data = await subscriberRes.json();

    if (subscriberRes.ok || subscriberRes.status === 200 || subscriberRes.status === 201) {
      return res.status(200).json({ success: true, message: 'Subscribed!' });
    } else {
      console.error('MailerLite error:', data);
      return res.status(500).json({ error: 'Subscription failed', details: data });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
