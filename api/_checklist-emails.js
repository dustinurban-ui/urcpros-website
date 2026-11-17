// Emails for people who download the Construction Hiring Checklist.
// Files starting with "_" in /api are not public endpoints on Vercel.
//
// 1. "delivery" goes out right away with a link back to the checklist.
// 2. Three follow-ups are scheduled through Resend (days 2, 6 and 12). They only send when
//    FOLLOWUPS_ENABLED=true AND COMPANY_ADDRESS is set (marketing email must show a postal address).
//    To stop follow-ups for someone who replies "unsubscribe", cancel their scheduled emails
//    in the Resend dashboard (Emails > Scheduled). The lead notification lists their IDs.

const SITE = 'https://www.urcpros.com';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function layout({ bodyHtml, footerNote, address }) {
  return `<div style="background:#F3F3F4;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
<div style="background:#0C0C0D;padding:20px 28px"><img src="${SITE}/assets/logo.png" alt="Urban Recruiting &amp; Consulting" width="150" style="display:block;height:auto"></div>
<div style="padding:28px;font-size:16px;line-height:1.55;color:#222">${bodyHtml}</div>
<div style="padding:18px 28px;border-top:1px solid #E3E3E6;font-size:12px;line-height:1.5;color:#666">
Urban Recruiting &amp; Consulting, LLC · (303) 651-2275 · <a href="mailto:connect@urcpros.com" style="color:#666">connect@urcpros.com</a>${address ? `<br>${esc(address)}` : ''}${footerNote ? `<br>${footerNote}` : ''}
</div></div></div>`;
}

function button(href, label) {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#DF0156;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:8px;display:inline-block">${label}</a></p>`;
}

const SIGN = `<p style="margin-top:24px">Dustin Urban<br>Co-Founder, Urban Recruiting &amp; Consulting</p>`;
const UNSUB = `You're getting this because you downloaded the Construction Hiring Checklist from urcpros.com. Reply "unsubscribe" and we won't email you again.`;

export function buildEmails({ firstName, reviewUrl, address }) {
  const hi = `<p>Hi ${esc(firstName || 'there')},</p>`;
  const checklistUrl = `${SITE}/checklist?access=1#checklist`;

  const delivery = {
    subject: 'Your Construction Hiring Checklist',
    html: layout({
      address,
      bodyHtml: `${hi}
<p>Here's the checklist you asked for. It has 33 steps, from before you post a job through a new hire's first 30 days.</p>
${button(checklistUrl, 'Open your checklist')}
<p><strong>Where to start:</strong> section 4, "Offer to first day." It's where the most hires fall apart, and usually the fastest to fix.</p>
<p>Count your unchecked boxes as you go. If you'd like a second set of eyes, <a href="${reviewUrl}" style="color:#C8104F">book a 15-minute checklist review</a> and we'll tell you which two fixes matter most for your company.</p>
${SIGN}`,
    }),
    text: `Hi ${firstName || 'there'},\n\nHere's the checklist you asked for: ${checklistUrl}\n\nWhere to start: section 4, "Offer to first day." It's where the most hires fall apart.\n\nWant a second set of eyes? Book a 15-minute checklist review: ${reviewUrl}\n\nDustin Urban\nCo-Founder, Urban Recruiting & Consulting\n(303) 651-2275`,
  };

  const followups = [
    {
      when: 'in 2 days',
      subject: 'The 24-hour rule most contractors miss',
      html: layout({
        address, footerNote: UNSUB,
        bodyHtml: `${hi}
<p>One step on the checklist does more than any job board: contact every qualified applicant within 24 hours.</p>
<p>Good field candidates usually have other options by day three. When callbacks wait until the end of the week, the best people are already working somewhere else.</p>
<p>Three ways to hit 24 hours without adding work:</p>
<ul><li>Text first. Frontline applicants answer texts much faster than email.</li>
<li>Block interview slots on the calendar before the job goes live.</li>
<li>Make one person responsible for callbacks, with a backup when they're on a job site.</li></ul>
<p>If hiring keeps landing on you between jobs, that's exactly what we take off your plate. Just reply to this email.</p>
${SIGN}`,
      }),
    },
    {
      when: 'in 6 days',
      subject: 'Where new hires disappear: offer to first day',
      html: layout({
        address, footerNote: UNSUB,
        bodyHtml: `${hi}
<p>The gap between "yes, I'll take the job" and day one is where most hires are lost. The screen never gets scheduled, nobody checks on references, and the candidate quietly takes another offer.</p>
<p>Section 4 of the checklist covers the basics: put every contingency in writing, schedule screens within 48 hours, and check in at least weekly before the start date.</p>
<p>In our recruiting partnerships, we track all of it in Route to Hire, our candidate tracking system. Candidates confirm each step from a private link, reminders go out when someone stalls, and you see the whole pipeline on one dashboard.</p>
${button(`${SITE}/route-to-hire`, 'See how Route to Hire works')}
${SIGN}`,
      }),
    },
    {
      when: 'in 12 days',
      subject: 'Want a second set of eyes on your checklist?',
      html: layout({
        address, footerNote: UNSUB,
        bodyHtml: `${hi}
<p>If you worked through the checklist, you probably have a few unchecked boxes. Most companies do.</p>
<p>Book a 15-minute checklist review and we'll go through them with you, then tell you which two fixes would make the biggest difference. No pitch deck.</p>
${button(reviewUrl, 'Book a 15-minute review')}
<p>Many of our clients start with recruiting and add HR support as they grow, up to a complete outsourced HR department. Either way, the review is a good place to start.</p>
${SIGN}`,
      }),
    },
  ];

  return { delivery, followups };
}
