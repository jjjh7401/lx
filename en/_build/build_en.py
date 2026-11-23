"""Build English chapter pages for GitHub Pages from the Korean Tistory build + translated segments.
usage: python3 build_en.py intro ch1 ..."""
import sys, re, json, html
from bs4 import BeautifulSoup

HERE = '/tmp/claude-0/-home-claude/a7519498-4e60-5f86-b698-34faf9e96dcf/scratchpad/en'
OUT = '/home/claude/lx/en'
KO = 'https://ablitzdesign.tistory.com'
META = {
    'intro': dict(title='Introduction · Lighting the Music', desc='Why lighting to music starts with listening, what this AI-assisted book covers, and how to use it.', ko=KO + '/51'),
    'ch1': dict(title='Chapter 1 · Listening Three Times · Lighting the Music', desc='Listen to a new song in three passes, match each sound to a kind of light, and write your notes in bars instead of seconds.', ko=KO + '/49'),
}
# Korean Tistory post -> English page (only chapters that exist in English)
EN_PAGES = {'/51': 'intro.html', '/49': 'ch1.html'}
LEFT = {'새 창에서 열기 ↗': 'Open in new window ↗'}

def slug(t):
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'[^a-z0-9]+', '-', html.unescape(t).lower()).strip('-')
    return t[:60]

def build(key):
    tpl = open(f'{HERE}/{key}.tpl.html').read()
    en = json.load(open(f'{HERE}/{key}.en.json'))
    ko = json.load(open(f'{HERE}/{key}.ko.json'))
    assert len(en) == len(ko), (key, len(en), len(ko))
    soup = BeautifulSoup(tpl, 'html.parser')
    for el in soup.select('[data-seg]'):
        i = int(el['data-seg']); del el['data-seg']
        el.clear()
        frag = BeautifulSoup(en[i], 'html.parser')
        for c in list(frag.contents):
            el.append(c)
    # leftovers outside segments
    for t in soup.find_all(string=True):
        s = str(t)
        m = re.fullmatch(r'\s*웹 부록 (\d+)\s*', s)
        if m: t.replace_with(f'Web tool {m.group(1)}'); continue
        for k, v in LEFT.items():
            if k in s: t.replace_with(s.replace(k, v))
    # links to Korean posts -> English pages or plain text
    for a in soup.find_all('a', href=True):
        h = a['href']
        if h.startswith(KO):
            path = h[len(KO):]
            if path in EN_PAGES: a['href'] = EN_PAGES[path]
            else:
                sp = soup.new_tag('span'); sp['class'] = 'soon'; sp.string = a.get_text(); a.replace_with(sp)
    # English heading ids
    pref = {'intro': 'cintro', 'ch1': 'c1'}[key]
    seen = set()
    for h in soup.find_all(['h2', 'h3']):
        if h.get('id') and re.search(r'[가-힣]', h['id']):
            nid = f'{pref}-{slug(h.decode_contents())}'
            while nid in seen: nid += '-x'
            seen.add(nid); h['id'] = nid
    body = str(soup)
    left = re.findall(r'[가-힣][^<]{0,30}', re.sub(r'<style>.*?</style>', '', body, flags=re.S))
    m = META[key]
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(m['title'])}</title>
<meta name="description" content="{html.escape(m['desc'])}">
<link rel="alternate" hreflang="ko" href="{m['ko']}">
<link rel="alternate" hreflang="en" href="https://jjjh7401.github.io/lx/en/{key}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="{html.escape(m['title'])}">
<meta property="og:description" content="{html.escape(m['desc'])}">
<meta property="og:image" content="https://jjjh7401.github.io/lx/cover-800.jpg">
<meta property="og:url" content="https://jjjh7401.github.io/lx/en/{key}.html">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap">
<link rel="stylesheet" href="en.css?v=1">
</head>
<body>
<header class="ltm-bar" id="ltmBar"></header>
<main id="article-view">
{body}
</main>
<nav class="ltm-pager" id="ltmPager" aria-label="Chapters"></nav>
<footer class="ltm-foot">
<p><b>Lighting the Music</b> by Jaehyun Jung. Free to read online. English edition translated from the Korean original with AI.</p>
<p>Licensed under <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" rel="noopener license" target="_blank">CC BY-NC-ND 4.0</a>: you may share it with credit (title, author and a link to this page), but not for commercial use and not in modified form.</p>
</footer>
<script src="book.js?v=1"></script>
<script>LTM_chapter({json.dumps(key)});</script>
</body>
</html>
'''
    open(f'{OUT}/{key}.html', 'w').write(page)
    print(key, 'bytes', len(page), 'korean left:', left[:8])

for k in sys.argv[1:]:
    build(k)
