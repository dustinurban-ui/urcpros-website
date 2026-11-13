// Vercel serverless function: emails each strategy-call request to URC via Resend.
// Environment variables (set in Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY  – your Resend API key (required)
//   LEAD_TO_EMAIL   – where leads are delivered (default: connect@urcpros.com)
//   FROM_EMAIL      – sender address on a domain verified in Resend (default: website@urcpros.com)

const MAX = 2000;

function clean(v, max = 200) {
  return String(v ?? '').trim().slice(0, max);
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Spam trap: real visitors never fill this hidden field.
  if (clean(body.company_website)) return res.status(200).json({ ok: true });

  const lead = {
    name: clean(body.name),
    company: clean(body.company),
    email: clean(body.email),
    phone: clean(body.phone, 50),
    role: clean(body.role, 80),
    employees: clean(body.employees, 40),
    industry: clean(body.industry, 80),
    needs: (Array.isArray(body.needs) ? body.needs : []).map((n) => clean(n, 80)).slice(0, 6).join(', '),
    challenge: clean(body.challenge, MAX),
  };

  if (!lead.name || !lead.company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return res.status(400).json({ error: 'Please include your name, company and a valid email.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Our form is temporarily unavailable.' });
  }
  const to = process.env.LEAD_TO_EMAIL || 'connect@urcpros.com';
  const from = process.env.FROM_EMAIL || 'website@urcpros.com';

  const rows = [
    ['Name', lead.name], ['Company', lead.company], ['Email', lead.email], ['Phone', lead.phone],
    ['Role', lead.role], ['Employees', lead.employees], ['Industry', lead.industry],
    ['Needs help with', lead.needs], ['Biggest hiring challenge', lead.challenge],
  ].filter(([, v]) => v);

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
<h2 style="margin:0 0 12px">New strategy call request</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="font-weight:bold;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join('')}</table>
<p style="color:#666;margin-top:16px">Hit Reply to answer ${esc(lead.name)} directly. They were shown your Calendly to book a time.</p></div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `URC Website <${from}>`,
        to: [to],
        reply_to: lead.email,
        subject: `New strategy call request: ${lead.company} (${lead.name})`,
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error('Resend error', r.status, await r.text());
      return res.status(502).json({ error: 'We could not send your request.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Send failed', err);
    return res.status(502).json({ error: 'We could not send your request.' });
  }
}
