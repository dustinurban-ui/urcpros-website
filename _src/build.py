# Assembles the inner pages from index.html's shared head/header/footer.
import re, sys
root = sys.argv[1]
idx = open(f'{root}/index.html').read()
head = idx[:idx.index('<body>')]
head = re.sub(r'<script type="application/ld\+json">.*?</script>\n', '', head, flags=re.S)
header = idx[idx.index('<a class="skip"'):idx.index('<main id="main">')]
footer = idx[idx.index('</main>') + len('</main>'):]
pages = {
  'services': ('Services | Urban Recruiting &amp; Consulting', 'Recruiting, leadership, HR operations and workforce planning for one predictable monthly fee. No per-hire fees.', '/services', ''),
  'contact': ('Book a Strategy Call | Urban Recruiting &amp; Consulting', 'Book a free 30-minute strategy call with Urban Recruiting & Consulting and find out what is slowing down your hiring.', '/contact', '<link rel="stylesheet" href="https://assets.calendly.com/assets/external/widget.css">\n<script src="https://assets.calendly.com/assets/external/widget.js" async></script>\n'),
  'privacy-policy': ('Privacy Policy | Urban Recruiting &amp; Consulting', 'How Urban Recruiting & Consulting collects and uses information through urcpros.com.', '/privacy-policy', ''),
}
for name, (title, desc, path, extra) in pages.items():
    h = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head)
    h = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{desc}">', h)
    h = h.replace('href="https://www.urcpros.com/"', f'href="https://www.urcpros.com{path}"').replace('content="https://www.urcpros.com/"', f'content="https://www.urcpros.com{path}"')
    h = h.replace('</head>', extra + '</head>') if extra else h
    hd = header.replace(f'<a href="{path}">', f'<a href="{path}" aria-current="page">')
    main = open(f'{root}/_src/{name}.main.html').read()
    open(f'{root}/{name}.html', 'w').write(h + '<body>\n' + hd + main + footer)
    print('built', name)
