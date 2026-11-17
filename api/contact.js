// Vercel serverless function: emails each strategy-call request to URC via Resend.
// Environment variables (set in Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY  – your Resend API key (required)
//   LEAD_TO_EMAIL   – where leads are delivered (default: connect@urcpros.com)
//   FROM_EMAIL      – sender address on a domain verified in Resend (default: website@urcpros.com)
//   REVIEW_URL      – booking link for the 15-minute checklist review (default: main Calendly link)
//   FOLLOWUPS_ENABLED – "true" to schedule the 3 checklist follow-up emails (off by default)
//   COMPANY_ADDRESS – postal address shown in follow-up emails; follow-ups never send without it

import { buildEmails } from './_checklist-emails.js';

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
  if (clean(body.hp_trap)) {
    console.warn('Spam trap filled; submission dropped', clean(body.email));
    return res.status(200).json({ ok: true });
  }

  const lead = {
    name: clean(body.name),
    orgType: clean(body.orgType, 40),
    company: clean(body.company),
    email: clean(body.email),
    phone: clean(body.phone, 50),
    role: clean(body.role, 80),
    employees: clean(body.employees, 40),
    industry: clean(body.industry, 80),
    needs: (Array.isArray(body.needs) ? body.needs : []).map((n) => clean(n, 80)).slice(0, 6).join(', '),
    challenge: clean(body.challenge, MAX),
    source: clean(body.source, 40),
    utm: ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => clean(body[k], 80)).filter(Boolean).join(' / '),
  };
  const isChecklist = lead.source === 'checklist';

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
    ['Reaching out about', lead.orgType], ['Name', lead.name], ['Organization', lead.company], ['Email', lead.email], ['Phone', lead.phone],
    ['Role', lead.role], ['Employees', lead.employees], ['Industry', lead.industry],
    ['Needs help with', lead.needs], ['Biggest hiring challenge', lead.challenge],
    ['Came from', lead.utm],
  ].filter(([, v]) => v);

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
<h2 style="margin:0 0 12px">${isChecklist ? 'New checklist download' : 'New consultation request'}</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="font-weight:bold;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join('')}</table>
<p style="color:#666;margin-top:16px">Hit Reply to answer ${esc(lead.name)} directly. ${isChecklist ? 'They downloaded the Construction Hiring Checklist.' : 'They were shown your Calendly to book a time.'}</p></div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  const send = async (payload) => {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Resend ${r.status}: ${JSON.stringify(out)}`);
    return out.id;
  };

  // Checklist downloads: email the lead their checklist, and schedule follow-ups if enabled.
  const notes = [];
  if (isChecklist) {
    const firstName = lead.name.split(/\s+/)[0];
    const reviewUrl = process.env.REVIEW_URL || 'https://calendly.com/surban26';
    const address = (process.env.COMPANY_ADDRESS || '').trim();
    const { delivery, followups } = buildEmails({ firstName, reviewUrl, address });
    const fromLead = `Dustin Urban, URC <${from}>`;
    try {
      await send({ from: fromLead, to: [lead.email], reply_to: to, subject: delivery.subject, html: delivery.html, text: delivery.text });
      notes.push('Checklist email sent to the lead.');
    } catch (err) {
      console.error('Checklist delivery failed', err);
      notes.push('Checklist email to the lead FAILED. Send them the link: https://www.urcpros.com/checklist?access=1');
    }
    if (process.env.FOLLOWUPS_ENABLED === 'true' && address) {
      for (const f of followups) {
        try {
          const id = await send({ from: fromLead, to: [lead.email], reply_to: to, subject: f.subject, html: f.html, scheduled_at: f.when });
          notes.push(`Follow-up "${f.subject}" scheduled ${f.when} (Resend ID ${id}).`);
        } catch (err) {
          console.error('Follow-up scheduling failed', err);
          notes.push(`Follow-up "${f.subject}" could not be scheduled.`);
        }
      }
    } else {
      notes.push('Automatic follow-ups are off. Follow up personally within a day or two.');
    }
  }

  const noteHtml = notes.length ? `<ul style="color:#444">${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '';
  const finalHtml = html.replace('</div>', `${noteHtml}</div>`);

  try {
    await send({
      from: `URC Website <${from}>`,
      to: [to],
      reply_to: lead.email,
      subject: `${isChecklist ? 'New checklist lead' : `New consultation request${lead.orgType ? ' (' + lead.orgType + ')' : ''}`}: ${lead.company} (${lead.name})`,
      html: finalHtml,
      text: text + (notes.length ? '\n\n' + notes.join('\n') : ''),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Send failed', err);
    return res.status(502).json({ error: 'We could not send your request.' });
  }
}
