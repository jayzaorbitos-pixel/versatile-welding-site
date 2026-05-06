const nodemailer = require('nodemailer');

// Pre-built email template — same structure every client
function buildEmailHTML(data, businessName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #1A1A1A; padding: 24px 32px; }
    .header h1 { color: #F59E0B; margin: 0; font-size: 20px; }
    .header p { color: #9CA3AF; margin: 4px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .field { margin-bottom: 20px; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; }
    .field:last-child { border-bottom: none; margin-bottom: 0; }
    .label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; margin-bottom: 4px; }
    .value { font-size: 16px; color: #111; font-weight: 500; }
    .footer { background: #f9f9f9; padding: 16px 32px; font-size: 12px; color: #9CA3AF; border-top: 1px solid #eee; }
    .badge { display: inline-block; background: #F59E0B; color: #fff; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Quote Request</h1>
      <p>${businessName} — Website Lead</p>
    </div>
    <div class="body">
      <div class="badge">NEW LEAD</div>
      <div class="field">
        <div class="label">Full Name</div>
        <div class="value">${data.name || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Phone Number</div>
        <div class="value">${data.phone || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Email Address</div>
        <div class="value">${data.email || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Zip Code</div>
        <div class="value">${data.zipcode || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Type of Job</div>
        <div class="value">${data.service || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Description</div>
        <div class="value">${data.message || '—'}</div>
      </div>
    </div>
    <div class="footer">
      Sent from your website contact form • ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildSMSText(data, businessName) {
  return [
    `NEW LEAD - ${businessName}`,
    `Name: ${data.name || '—'}`,
    `Phone: ${data.phone || '—'}`,
    `Job: ${data.service || '—'}`,
    `Note: ${(data.message || '').substring(0, 100)}`,
  ].join('\n');
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    BUSINESS_NAME,
    BUSINESS_EMAIL,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!BUSINESS_EMAIL || !SMTP_USER || !SMTP_PASS) {
    console.error('Missing env vars');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const data = req.body || {};

  // Basic validation
  if (!data.name || !data.phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    // Send email via Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS, // Gmail App Password
      },
    });

    await transporter.sendMail({
      from: `"${BUSINESS_NAME} Website" <${SMTP_USER}>`,
      to: BUSINESS_EMAIL,
      subject: `New Quote Request from ${data.name}`,
      html: buildEmailHTML(data, BUSINESS_NAME),
      text: buildSMSText(data, BUSINESS_NAME), // plain text fallback
    });

    return res.status(200).json({ success: true, message: 'Quote request sent!' });

  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ error: 'Failed to send. Please call us directly.' });
  }
};
