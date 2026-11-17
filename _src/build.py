# Builds every page from _src/: a shared head, header and footer around each page's <main>.
# Run from the repo root:  python3 _src/build.py .
# Each page gets its own title, description, canonical URL, social tags and structured data.
import json, os, sys

root = sys.argv[1] if len(sys.argv) > 1 else '.'
SRC = os.path.join(root, '_src')
SITE = 'https://www.urcpros.com'

def read(name):
    with open(os.path.join(SRC, name)) as f:
        return f.read()

ORG = {
    "@type": "ProfessionalService",
    "@id": SITE + "/#org",
    "name": "Urban Recruiting & Consulting, LLC",
    "alternateName": "URC",
    "url": SITE + "/",
    "logo": SITE + "/assets/logo.png",
    "image": SITE + "/assets/og-image.png",
    "telephone": "+1-303-651-2275",
    "email": "connect@urcpros.com",
    "foundingDate": "2014",
    "description": "Recruiting and workforce support for school districts, and recruiting and outsourced HR for construction companies and growing businesses.",
    "address": {"@type": "PostalAddress", "addressRegion": "CO", "addressCountry": "US"},
    "areaServed": {"@type": "Country", "name": "United States"},
    "founder": [
        {"@type": "Person", "name": "Dustin Urban", "jobTitle": "Co-Founder, Partner & Operations Consultant", "sameAs": "https://www.linkedin.com/in/dustin-urban-0bb98b344"},
        {"@type": "Person", "name": "Savanah Urban", "jobTitle": "Co-Founder, Principal Consultant & Senior Solutions Consultant", "sameAs": "https://www.linkedin.com/in/savanah-urban-9207a623/"},
    ],
}

def service(name, desc, audience):
    return {"@type": "Service", "name": name, "description": desc, "serviceType": name,
            "provider": {"@id": SITE + "/#org"}, "areaServed": {"@type": "Country", "name": "United States"},
            "audience": {"@type": "Audience", "audienceType": audience}}

# (output file, URL path, nav section, title, description, main source, breadcrumb trail, extra schema, extra head)
CAL_HEAD = ('<link rel="stylesheet" href="https://assets.calendly.com/assets/external/widget.css">\n'
            '<script src="https://assets.calendly.com/assets/external/widget.js" async></script>\n')
PAGES = [
    ('index.html', '/', '', 'School District Recruiting & Outsourced HR | Urban Recruiting & Consulting',
     'Recruiting and workforce support for school districts, plus recruiting and outsourced HR for construction companies and growing businesses.',
     'home.main.html', [], None, ''),
    ('school-districts.html', '/school-districts', '/school-districts', 'School District Recruiting & Workforce Support | URC',
     'Recruiting and hiring coordination for school bus drivers, driver trainees, custodial and food service staff. We work alongside your district HR and department teams.',
     'school-districts.main.html', [('School Districts', '/school-districts')],
     service('School district recruiting and workforce support', 'Recruiting, screening, interview coordination and candidate follow-through for school district transportation, custodial and food service positions.', 'School districts'), ''),
    ('school-districts/transportation.html', '/school-districts/transportation', '/school-districts', 'School Transportation Recruiting: Bus Drivers & Driver Trainees | URC',
     'Recruiting for school bus drivers, driver trainees for district-paid CDL training, dispatchers, bus monitors and transportation maintenance staff.',
     'transportation.main.html', [('School Districts', '/school-districts'), ('Transportation Recruiting', '/school-districts/transportation')],
     service('School transportation recruiting', 'Recruiting for school bus drivers, driver trainees entering district-provided CDL training, dispatchers, schedulers, bus monitors and transportation maintenance staff.', 'School district transportation departments'), ''),
    ('business.html', '/business', '/business', 'Recruiting & Outsourced HR for Construction and Growing Businesses | URC',
     'Start with recruiting, add HR expertise, or bring on a complete outsourced HR department. Recruiting and HR support for construction companies and growing businesses.',
     'business.main.html', [('Business Recruiting & HR', '/business')],
     service('Recruiting and outsourced HR', 'Recruiting, HR consulting and fully integrated outsourced HR department services for construction companies and growing businesses.', 'Small and growing businesses'), ''),
    ('business/construction.html', '/business/construction', '/business', 'Construction & Roofing Recruiting and HR Support | URC',
     'Recruiting for roofing technicians, project managers and sales roles, plus HR support that grows with your construction company, up to a complete outsourced HR department.',
     'construction.main.html', [('Business Recruiting & HR', '/business'), ('Construction & Roofing', '/business/construction')],
     service('Construction and roofing recruiting and HR support', 'Recruiting and outsourced HR support for roofing, construction, civil construction and oil and gas companies.', 'Construction and roofing companies'), ''),
    ('route-to-hire.html', '/route-to-hire', '/route-to-hire', 'Route to Hire: Candidate Tracking From Application to Hire | URC',
     'Route to Hire is the candidate tracking system URC uses in every recruiting partnership: private checklist links, automated reminders and a live pipeline dashboard.',
     'route-to-hire.main.html', [('Route to Hire', '/route-to-hire')], None, ''),
    ('about.html', '/about', '/about', 'About Urban Recruiting & Consulting | Recruiting & HR Partner Since 2014',
     'Since 2014, Urban Recruiting & Consulting has helped school districts and businesses build the people, processes and HR infrastructure they need to grow.',
     'about.main.html', [('About', '/about')], {"@type": "AboutPage", "url": SITE + "/about", "about": {"@id": SITE + "/#org"}}, ''),
    ('resources.html', '/resources', '/resources', 'Recruiting & HR Resources for School Districts and Businesses | URC',
     'Practical recruiting and HR resources for school district leaders and for construction and growing businesses.',
     'resources.main.html', [('Resources', '/resources')], None, ''),
    ('contact.html', '/contact', '/contact', 'Schedule a Consultation | Urban Recruiting & Consulting',
     'Schedule a consultation with Urban Recruiting & Consulting about school district staffing or your business recruiting and HR needs.',
     'contact.main.html', [('Contact', '/contact')], None, '<link rel="preconnect" href="https://calendly.com">\n'),
    ('checklist.html', '/checklist', '/resources', 'Free Construction Hiring Checklist | Urban Recruiting & Consulting',
     'A free 33-step hiring checklist with a score for roofing and construction companies: fill field, project and office roles faster and keep new hires past day 90.',
     'checklist.main.html', [('Resources', '/resources'), ('Construction Hiring Checklist', '/checklist')], None, ''),
    ('privacy-policy.html', '/privacy-policy', '', 'Privacy Policy | Urban Recruiting & Consulting',
     'How Urban Recruiting & Consulting collects and uses information through urcpros.com.',
     'privacy-policy.main.html', [], None, ''),
]

HEAD = read('partials/head.html')
HEADER = read('partials/header.html')
FOOTER = read('partials/footer.html')

def esc(s):
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')

for out, path, section, title, desc, src, crumbs, extra, extra_head in PAGES:
    url = SITE + path
    graph = [ORG, {"@type": "WebPage", "@id": url + "#page", "url": url, "name": title, "description": desc, "isPartOf": {"@id": SITE + "/#org"}}]
    if crumbs:
        items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}]
        items += [{"@type": "ListItem", "position": i + 2, "name": n, "item": SITE + p} for i, (n, p) in enumerate(crumbs)]
        graph.append({"@type": "BreadcrumbList", "itemListElement": items})
    if extra:
        graph.append(extra)
    jsonld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
    head = (HEAD.replace('{{TITLE}}', esc(title)).replace('{{DESC}}', esc(desc))
            .replace('{{URL}}', url).replace('{{JSONLD}}', jsonld).replace('{{EXTRA}}', extra_head))
    header = HEADER
    if section:
        header = header.replace(f'<a href="{section}">', f'<a href="{section}" aria-current="page">', 1)
    html = head + '<body>\n' + header + read(src) + FOOTER
    dest = os.path.join(root, out)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'w') as f:
        f.write(html)
    print('built', out)

# Sitemap
from datetime import date
today = date.today().isoformat()
urls = ''.join(f'  <url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod></url>\n' for _, p, *_ in PAGES)
with open(os.path.join(root, 'sitemap.xml'), 'w') as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n')
print('built sitemap.xml')
