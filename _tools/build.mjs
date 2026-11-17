import { readFile, writeFile, readdir, mkdir, rm, rmdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const site = JSON.parse(await readFile('_content/site.json', 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const humanDate = value => new Date(value + 'T12:00:00Z').toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
const digest = async file => createHash('sha256').update(await readFile(file)).digest('hex').slice(0,12);
const css = `/assets/css/site.css?v=${await digest('assets/css/site.css')}`;
const js = `/assets/js/site.js?v=${await digest('assets/js/site.js')}`;
const pages = [];
for (const dir of ['_content/pages', '_content/notes']) {
  for (const file of (await readdir(dir)).filter(x => x.endsWith('.json')).sort()) {
    const page = JSON.parse(await readFile(`${dir}/${file}`, 'utf8'));
    page.content = await readFile(`${dir}/${page.body}`, 'utf8');
    if (!/^\/(?:[a-z0-9-]+\/)*$/.test(page.path)) throw new Error(`Invalid path: ${page.path}`);
    if (page.kind === 'note') {
      if (!['draft','published'].includes(page.status)) throw new Error(`Invalid note status: ${file}`);
      if (!page.workPeriod) throw new Error(`Missing work period: ${file}`);
      if (page.status === 'published') {
        for (const field of ['datePublished','dateModified']) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(page[field] || '') || Number.isNaN(Date.parse(page[field])) || new Date(page[field]).toISOString().slice(0,10) !== page[field] || page[field] > new Date().toISOString().slice(0,10)) throw new Error(`Invalid ${field}: ${file}`);
        }
        if (page.dateModified < page.datePublished) throw new Error(`Modification predates publication: ${file}`);
      } else if (page.datePublished) throw new Error(`Draft cannot have publication date: ${file}`);
    }
    pages.push(page);
  }
}
if (new Set(pages.map(p => p.path)).size !== pages.length) throw new Error('Duplicate page path');
if (typeof site.engineeringNotesEnabled !== 'boolean') throw new Error('engineeringNotesEnabled must be a boolean');
const notes = site.engineeringNotesEnabled ? pages.filter(p => p.kind === 'note' && p.status === 'published') : [];
const publicPages = pages.filter(p => p.path === '/notes/' ? site.engineeringNotesEnabled && notes.length > 0 : p.kind !== 'note' || notes.includes(p));
const navigation = site.navigation.filter(([,url]) => url !== '/notes/' || notes.length > 0);
if (typeof site.consultingEnabled !== 'boolean') throw new Error('consultingEnabled must be a boolean');
const consulting = site.consultingEnabled ? await readFile('_content/components/consulting.html', 'utf8') : '';
const noteList = `<div class="note-list">${notes.map(p => `<a class="note-row" href="${p.path}"><span class="meta">${p.status === 'draft' ? 'Draft outline · Not yet published' : `Published ${humanDate(p.datePublished)}`}</span><h3>${escape(p.title)} <span aria-hidden="true">↗</span></h3><p>${escape(p.description)}</p></a>`).join('')}</div>`;
const person = {'@type':'Person','@id':`${site.url}/#person`, name:site.name, jobTitle:site.role, url:`${site.url}/`, image:`${site.url}/assets/img/optimized/simone-contorno-800.webp`, sameAs:[site.linkedin,site.github], knowsAbout:['Robotics software','Autonomous systems','ROS 2','C++','Navigation','Control','Embedded Linux']};
function layout(page, body) {
  const canonical = site.url + page.path;
  const isPublished = page.kind === 'note' && page.status === 'published';
  const noindex = page.noindex || page.path === '/404.html';
  const graph = [person, {'@type':page.path === '/about/' ? 'ProfilePage' : 'WebPage','@id':canonical+'#webpage',url:canonical,name:page.title,description:page.description,inLanguage:'en', mainEntity:{'@id':page.schemaType ? canonical+'#project' : isPublished ? canonical+'#article' : person['@id']}}];
  if (page.schemaType) {
    const project = {'@type':page.schemaType, '@id':canonical+'#project', name:page.title.split(' — ')[0], description:page.description, url:canonical, author:{'@id':person['@id']}};
    if (page.repository) Object.assign(project,{codeRepository:page.repository, programmingLanguage:'C++', license:'https://www.apache.org/licenses/LICENSE-2.0'});
    graph.push(project);
  }
  if (isPublished) graph.push({'@type':'BlogPosting','@id':canonical+'#article',headline:page.title,description:page.description,author:{'@id':person['@id']},mainEntityOfPage:canonical,datePublished:page.datePublished,dateModified:page.dateModified,image:`${site.url}/assets/img/social-card.png`});
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
<meta name="author" content="${escape(site.name)}">
<meta name="theme-color" content="#1c2e45">
${noindex ? '<meta name="robots" content="noindex, follow">' : ''}
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${isPublished ? 'article' : 'website'}">
<meta property="og:site_name" content="${site.name}">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${site.url}/assets/img/social-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Simone Contorno — Robotics Software Engineer. Robotics Software for Autonomous Systems.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(page.title)}">
<meta name="twitter:description" content="${escape(page.description)}">
<meta name="twitter:image" content="${site.url}/assets/img/social-card.png">
<meta name="twitter:image:alt" content="Simone Contorno — Robotics Software Engineer">
${isPublished ? `<meta property="article:published_time" content="${page.datePublished}">\n<meta property="article:modified_time" content="${page.dateModified}">` : ''}
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${css}">
<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script>
<script src="${js}" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="container header-inner">
<a class="brand" href="/" aria-label="Simone Contorno, home"><span class="brand-mark" aria-hidden="true">SC</span><span>Simone Contorno</span></a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
<nav id="site-nav" class="site-nav" aria-label="Main navigation">${navigation.map(([label,url])=>`<a href="${url}"${page.section === url ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
</div></header>
<main id="main" tabindex="-1">${body}</main>
<footer class="site-footer"><div class="container footer-inner"><p>© Simone Contorno · Robotics Software Engineer</p><nav aria-label="Social links"><a href="${site.github}">GitHub</a><a href="${site.linkedin}">LinkedIn</a><a href="/contact/">Contact Me</a></nav><p class="provenance">Original site: Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>.</p></div></footer>
</body>
</html>
`;
}
const generated = [];
for (const page of publicPages) {
  let body = page.content
    .replace('{{notes-list}}', notes.length ? `<section class="section"><h2>Articles</h2>${noteList}</section>` : '<section class="section"><h2>Robotics Projects</h2><p><a href="/work/">Explore the projects and their source code</a>.</p></section>')
    .replace('{{notes-intro}}', `<p class="lede">${notes.length ? 'Technical articles on robotics software, control and testing.' : 'There are no published articles here yet.'}</p>`)
    .replace('{{notes-section}}', notes.length ? `<section class="section container" id="engineering-notes"><div class="section-head"><h2>Engineering Notes</h2></div>${noteList}</section>` : '')
    .replace('{{consulting-section}}', consulting);
  if (page.kind === 'note') {
    const published = page.status === 'published';
    body = `<div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/notes/">Engineering notes</a><span aria-hidden="true"> / </span><span>${published ? 'Article' : 'Draft outline'}</span></nav><article><header class="article-header"><p class="eyebrow">${published ? 'Engineering note' : 'Draft outline · Not yet published'}</p><h1>${escape(page.title)}</h1><div class="article-meta"><span>By <a href="/about/">Simone Contorno</a></span><span>${published ? `Published <time datetime="${page.datePublished}">${humanDate(page.datePublished)}</time>` : `Outline prepared <time datetime="${page.prepared}">${humanDate(page.prepared)}</time>`}</span></div><p class="meta">Underlying work: ${escape(page.workPeriod)}</p>${published ? `<p class="meta">Last updated <time datetime="${page.dateModified}">${humanDate(page.dateModified)}</time></p>` : '<div class="notice"><p>This is a working outline. It has not been published as an article and does not report new experimental results.</p></div>'}</header><div class="article-layout"><div class="article-body prose">${body}</div><div class="aside"><h2>In this notebook</h2><p>Control, integration and validation, grounded in public sources.</p><a href="/notes/">All engineering notes</a><p><a href="/work/">Related engineering work</a></p></div></div></article></div>`;
  }
  const output = page.path === '/' ? 'index.html' : page.path.slice(1) + 'index.html';
  await mkdir(path.dirname(output), {recursive:true});
  await writeFile(output, layout(page,body));
  generated.push(output);
}
const notFound = {path:'/404.html',title:'Page not found — Simone Contorno',description:'This page could not be found. Return to Simone Contorno’s robotics portfolio or explore selected work.',section:''};
await writeFile('404.html', layout(notFound,'<div class="container error-page"><p class="eyebrow">404 / Page not found</p><h1>Page Not Found</h1><p>The page may have moved. You can return home or explore my robotics work.</p><div class="actions"><a class="button" href="/">Back to home</a><a class="text-link" href="/work/">Explore selected work</a></div></div>'));
generated.push('404.html');
const indexable = publicPages.filter(p => !p.noindex);
await writeFile('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+indexable.map(p=>`  <url><loc>${site.url}${p.path}</loc>${p.dateModified ? `<lastmod>${p.dateModified}</lastmod>` : ''}</url>`).join('\n')+'\n</urlset>\n');
await writeFile('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
// Remove only previously generated pages, never arbitrary directories or hand-authored files.
let previous = [];
try { previous = JSON.parse(await readFile('_tools/generated.json','utf8')); } catch (e) { if(e.code !== 'ENOENT') throw e; }
for (const old of previous) if (!generated.includes(old) && /^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/.test(old)) {
  await rm(old, {force:true});
  let directory = path.dirname(old);
  while (directory !== '.') {
    try { await rmdir(directory); }
    catch (error) { if (['ENOENT','ENOTEMPTY'].includes(error.code)) break; throw error; }
    directory = path.dirname(directory);
  }
}
await writeFile('_tools/generated.json', JSON.stringify(generated,null,2)+'\n');
console.log(`Built ${generated.length} HTML pages; sitemap contains ${indexable.length} indexable URLs. Draft sources are not emitted. Engineering Notes: ${site.engineeringNotesEnabled ? 'enabled' : 'disabled'}. Consulting: ${site.consultingEnabled ? 'enabled' : 'disabled'}.`);
