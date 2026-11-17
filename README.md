# urcpros.com — Urban Recruiting & Consulting website

A static website with one serverless function that emails each strategy-call request. It runs on Vercel.

## What's in here

| Path | What it is |
|---|---|
| `*.html`, `school-districts/`, `business/` | The built pages (don't edit these directly) |
| `assets/` | Styles, logo, favicon, and `site.js` (menu, calculator, form, Calendly) |
| `api/contact.js` | Sends each form submission to connect@urcpros.com via Resend |
| `vercel.json` | Clean URLs (`/services`), and redirects from the old site's `/consulting` and `/blog` |
| `_src/` | Page sources: `*.main.html` for each page, `partials/` for the shared head, header and footer. Run `python3 _src/build.py .` to rebuild every page and `sitemap.xml`. Page titles, descriptions and structured data are set in `_src/build.py`. |

## Settings

In `assets/site.js`:
- `CALENDLY_URL`: currently `https://calendly.com/surban26`
- `PORTAL_URL`: the Route to Hire client login (`https://portal.urcpros.com`)

Vercel environment variables (Project → Settings → Environment Variables):

| Name | Value |
|---|---|
| `RESEND_API_KEY` | Your Resend API key |
| `LEAD_TO_EMAIL` | `connect@urcpros.com` |
| `FROM_EMAIL` | `website@urcpros.com` (must be on a domain verified in Resend) |
| `REVIEW_URL` | Optional. Booking link for the 15-minute checklist review (defaults to the main Calendly link) |
| `FOLLOWUPS_ENABLED` | `true` to schedule the 3 checklist follow-up emails. Leave unset to keep them off |
| `COMPANY_ADDRESS` | Postal address shown in follow-up emails. Follow-ups never send without it |

Tick **Preview** as well as **Production** for these variables so the form also works on preview links.

## Launch steps

1. **GitHub:** create a new repository (e.g. `urcpros-site`) and upload everything in this folder.
2. **Resend:** under Domains, make sure `urcpros.com` is verified. If not, add it and put the records Resend shows into GoDaddy DNS. These are new records only; do not edit or delete your MX records.
3. **Vercel:** Add New → Project → import the repository. Framework preset: "Other". Add the three environment variables above, then Deploy.
4. **Test on the preview address:** submit the contact form, confirm the email arrives at connect@urcpros.com, and book a test time in Calendly.
5. **Domain:** Vercel → Project → Settings → Domains → add `urcpros.com` and `www.urcpros.com`. In GoDaddy DNS, change only the `@` A record and the `www` CNAME to the values Vercel shows. Screenshot your DNS first, leave MX/TXT records alone, and keep GoDaddy's nameservers.
6. **Analytics:** Vercel → Project → Analytics → Enable (the script is already on every page).
7. After a few stable days, cancel GoDaddy Website Builder only. Keep the domain and email.
