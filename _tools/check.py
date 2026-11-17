"""Static output contracts; Python standard library only."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re, subprocess, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://simone-contorno.github.io'
errors = []
def require(ok, message):
    if not ok: errors.append(message)
class Page(HTMLParser):
    def __init__(self, file):
        super().__init__(convert_charrefs=True)
        self.file=file; self.tags=[]; self.ids=[]; self.headings=[]; self.links=[]; self.meta={}; self.canonical=[]; self.json=[]; self.title=''; self.mode=None
        self.feed(file.read_text())
    def handle_starttag(self, tag, attrs):
        a=dict(attrs); self.tags.append((tag,a))
        if 'id' in a: self.ids.append(a['id'])
        if re.fullmatch('h[1-6]',tag): self.headings.append(int(tag[1]))
        if tag=='meta': self.meta[a.get('name',a.get('property',''))]=a.get('content','')
        if tag=='link' and a.get('rel')=='canonical': self.canonical.append(a['href'])
        for key in ['href','src']:
            if key in a: self.links.append(a[key])
        if 'srcset' in a:
            self.links.extend(x.strip().split()[0] for x in a['srcset'].split(','))
        if tag=='script' and a.get('type')=='application/ld+json': self.mode='json'; self.json.append('')
        if tag=='title': self.mode='title'
    def handle_data(self,data):
        if self.mode=='json': self.json[-1]+=data
        if self.mode=='title': self.title+=data
    def handle_endtag(self,tag):
        if tag in ['script','title']: self.mode=None

files=json.loads((ROOT/'_tools/generated.json').read_text())
pages={f:Page(ROOT/f) for f in files}
titles=set(); descriptions=set(); indexable=set(); external=set(); linkcount=0
for f,p in pages.items():
    route='/' if f=='index.html' else '/'+f.removesuffix('index.html')
    require(p.headings.count(1)==1,f'{f}: exactly one h1')
    previous=0
    for h in p.headings:
        require(h<=previous+1,f'{f}: heading skips h{previous} to h{h}'); previous=h
    require(len(p.ids)==len(set(p.ids)),f'{f}: duplicate ids')
    require(p.title and p.title not in titles,f'{f}: missing/duplicate title'); titles.add(p.title)
    desc=p.meta.get('description','')
    require(desc and desc not in descriptions,f'{f}: missing/duplicate description'); descriptions.add(desc)
    require(p.canonical==[SITE+route],f'{f}: canonical mismatch {p.canonical}')
    require(p.meta.get('og:url')==SITE+route,f'{f}: OG URL mismatch')
    for name in ['og:title','og:description','og:image','og:image:alt','twitter:card','author','viewport']:
        require(bool(p.meta.get(name)),f'{f}: missing {name}')
    require(len([t for t,a in p.tags if t=='main'])==1,f'{f}: one main landmark')
    require(any(t=='html' and a.get('lang')=='en' for t,a in p.tags),f'{f}: language')
    require(not any(t=='form' for t,a in p.tags),f'{f}: unexpected form')
    for t,a in p.tags:
        if t=='img':
            require('alt' in a and bool(a.get('width')) and bool(a.get('height')),f'{f}: image needs alt and dimensions')
        if t=='script' and a.get('src'): require(a['src'].startswith('/assets/js/site.js?'),f'{f}: unexpected script')
    try:
        graphs=[json.loads(x) for x in p.json]
        graph=graphs[0]['@graph']; person=next(x for x in graph if x['@type']=='Person')
        require(len(person['sameAs'])==2,f'{f}: person profiles')
        if 'noindex' in p.meta.get('robots',''):
            require(not any(x['@type'] in ['Article','BlogPosting'] for x in graph),f'{f}: draft article schema')
            require('article:published_time' not in p.meta,f'{f}: draft publication date')
        else: indexable.add(SITE+route)
    except Exception as e: errors.append(f'{f}: invalid structured data: {e}')
    p.links.append(p.meta.get('og:image',''))
    for link in p.links:
        linkcount+=1; u=urlsplit(link)
        if u.scheme=='mailto':
            require(u.path=='simone.contorno@outlook.it',f'{f}: unexpected email'); continue
        if u.netloc and u.netloc!='simone-contorno.github.io': external.add(link); continue
        require(u.scheme in ['', 'https'],f'{f}: unexpected URL scheme: {link}')
        target=ROOT/unquote(u.path).lstrip('/') if u.path else ROOT/f
        if target.is_dir(): target=target/'index.html'
        require(target.is_file(),f'{f}: missing target {link}')
        if u.fragment and target.suffix=='.html' and target.is_file():
            other=pages.get(str(target.relative_to(ROOT))) or Page(target)
            require(unquote(u.fragment) in other.ids,f'{f}: missing anchor {link}')
    require(not re.search(r'\{\{|Lorem ipsum|Your message has been sent|purecounter|data-aos|typed-items',p.file.read_text()),f'{f}: template/placeholder content')
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap=ET.parse(ROOT/'sitemap.xml')
locs=[x.text for x in sitemap.findall('s:url/s:loc',ns)]
require(set(locs)==indexable and len(locs)==len(set(locs)),'Sitemap and indexable page set differ')
require('Sitemap: '+SITE+'/sitemap.xml' in (ROOT/'robots.txt').read_text(),'robots sitemap reference')
for old in ['hero','about','skills','professional-experience','education','certifications','languages','portfolio','contact']:
    require(old in pages['index.html'].ids,f'Missing legacy #{old}')
# Unfinished writing and inactive commercial material must never leak into output.
config=json.loads((ROOT/'_content/site.json').read_text())
notes=[json.loads(p.read_text()) for p in (ROOT/'_content/notes').glob('*.json')]
for note in notes:
    if note['status']=='draft':
        require(not (ROOT/note['path'].strip('/')/'index.html').exists(), 'Draft output exists: '+note['path'])
        for f,p in pages.items():
            require(note['path'] not in p.links, f'{f}: link to unpublished draft')
if not config['engineeringNotesEnabled'] or not any(n['status']=='published' for n in notes):
    require(not (ROOT/'notes/index.html').exists(), 'Disabled/empty notes index must not be generated')
    for f,p in pages.items():
        require(not any(link.startswith('/notes/') for link in p.links), f'{f}: disabled notes linked')
for f,p in pages.items():
    require('work-number' not in p.file.read_text(), f'{f}: project numbering remains')
if not config['consultingEnabled']:
    for f,p in pages.items():
        require(not re.search(r'id="consulting"|Independent Robotics Architecture|employer authorisation|Robotics%20review%20enquiry',p.file.read_text()), f'{f}: disabled consulting exposed')
# Private editorial input must be excluded from source control and Pages output.
if (ROOT/'.git').exists():
    for local_directory in ['docs','_docs']:
        if (ROOT/local_directory).exists():
            require(subprocess.run(['git','check-ignore','-q',local_directory+'/'],cwd=ROOT).returncode==0, 'Local reference material must be ignored by Git')
        require(not subprocess.check_output(['git','ls-files','--',local_directory],cwd=ROOT,text=True).strip(), 'Local reference material must never be tracked')
require(bool(re.search(r'^  - docs\s*$', (ROOT/'_config.yml').read_text(), re.M)), 'Private docs must be excluded from Pages')
for f,p in pages.items():
    require(not any(urlsplit(link).path.startswith('/docs/') for link in p.links),f'{f}: private source material linked')
# Public source footprint and performance budgets: assets actually used by this site.
require((ROOT/'assets/js/site.js').stat().st_size<5000,'Runtime JS exceeds 5 KB')
require((ROOT/'assets/css/site.css').stat().st_size<25000,'CSS exceeds 25 KB')
require((ROOT/'assets/img/optimized/simone-contorno-800.webp').stat().st_size<120000,'Portrait exceeds 120 KB')
require(not (ROOT/'forms/contact.php').exists(),'Obsolete PHP endpoint still present')
if errors:
    print('\n'.join('FAIL '+e for e in errors)); raise SystemExit(1)
print(f'PASS: {len(pages)} pages, {linkcount} URL references, {len(indexable)} sitemap entries; unique metadata, semantic headings, JSON-LD, images, legacy fragments and draft exclusion.')
print(f'External URLs ({len(external)}) checked separately; static checks do not prove external availability.')
(ROOT/'.local/evidence').mkdir(parents=True,exist_ok=True)
(ROOT/'.local/evidence/external-urls.json').write_text(json.dumps(sorted(external),indent=2)+'\n')
