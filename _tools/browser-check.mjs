// Optional QA dependencies live in ignored .local/qa; see README for setup.
import puppeteer from '../.local/qa/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='http://127.0.0.1:4173';
const evidence=process.env.EVIDENCE_DIR || '.local/evidence/sticky-header';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,args:['--disable-dev-shm-usage'],userDataDir:'.local/chrome-qa'});
const report={pages:[],interactions:[],failures:[],sourceHashes:{}};
const generated=JSON.parse(await readFile('_tools/generated.json','utf8'));
for(const file of [...generated,'assets/css/site.css','assets/js/site.js']) report.sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await mkdir(evidence,{recursive:true});
try {
 const page=await browser.newPage();
 await page.setCacheEnabled(false);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>errors.push(`${r.url()}: ${r.failure()?.errorText}`));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.url()}: ${r.status()}`);});
 const routes=generated.map(f=>f==='index.html'?'/':'/'+f.replace(/index\.html$/,''));
 for(const width of [1440,390,320]) {
  await page.setViewport({width,height:1000,deviceScaleFactor:1});
  for(const route of routes) {
   const response=await page.goto(base+route,{waitUntil:'networkidle0'});
   assert.equal(response.status(),200);
   for (const img of await page.$$('img')) await img.scrollIntoView();
   await page.waitForFunction(()=>[...document.images].every(img=>img.complete && img.naturalWidth>0));
   await page.evaluate(()=>scrollTo(0,0));
   const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.src),h1:document.querySelectorAll('h1').length}));
   assert.equal(state.overflow,false,`${route} overflow at ${width}`);
   assert.deepEqual(state.images,[],`${route} failed images`);
   assert.equal(state.h1,1);
   const mobileMenu=await page.$eval('.nav-toggle',el=>getComputedStyle(el).display!=='none');
   if(mobileMenu) await page.click('.nav-toggle');
   const visibleLinks=await page.$$eval('#site-nav a',links=>links.map(el=>{
    const r=el.getBoundingClientRect();
    return {label:el.textContent,visible:r.width>0 && r.height>0 && r.left>=0 && r.right<=innerWidth && getComputedStyle(el).visibility==='visible'};
   }));
   assert.ok(visibleLinks.every(link=>link.visible),`${route} hidden/clipped menu at ${width}: ${JSON.stringify(visibleLinks)}`);
   if(mobileMenu) await page.click('.nav-toggle');
   assert.equal(await page.$$('.work-number').then(items=>items.length),0);
   assert.deepEqual(await page.$$eval('#site-nav a',links=>links.map(a=>a.textContent)),['Home','Experience','Selected Work','Contact']);
   assert.equal(await page.$$eval('a[href^="/notes/"]',links=>links.length),0);
   assert.doesNotMatch(await page.$eval('body',e=>e.textContent),/Draft outline|Independent Robotics Architecture|consulting engagements/);
   await page.addScriptTag({path:'.local/qa/node_modules/axe-core/axe.min.js'});
   const a11y=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}});return {violations:r.violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>n.target)})),incomplete:r.incomplete.map(x=>x.id)};});
   report.pages.push({route,width,...state,...a11y});
   assert.deepEqual(a11y.violations,[],`${route} axe ${width}: ${JSON.stringify(a11y.violations)}`);
   if(width!==320 && ['/', '/about/','/work/marine-autonomy/','/work/autonomous-vehicle-control/','/contact/','/work/','/work/proxmpc/'].includes(route)) await page.screenshot({path:evidence+'/' +(route==='/'?'home':route.split('/').filter(Boolean).join('-'))+'-'+width+'.png',fullPage:true});
  }
 }
 for (const width of [1440,390,320]) {
  await page.setViewport({width,height:844});
  await page.goto(base+'/about/');
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  assert.ok(await page.evaluate(()=>scrollY>0));
  assert.equal(await page.$eval('.site-header',el=>Math.round(el.getBoundingClientRect().top)),0);
  const stickyState=await page.$eval('.site-header',el=>{const r=el.getBoundingClientRect();return {height:r.height,padding:parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),background:getComputedStyle(el).backgroundColor};});
  assert.ok(stickyState.padding>stickyState.height);
  assert.equal(stickyState.background,'rgb(247, 248, 250)');
  if(width<761) await page.click('.nav-toggle');
  await Promise.all([page.waitForNavigation(),page.click('#site-nav a[href="/work/"]')]);
  assert.equal(new URL(page.url()).pathname,'/work/');
  await page.goto(base+'/about/#education',{waitUntil:'networkidle0'});
  assert.ok(await page.evaluate(()=>document.querySelector('#education').getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom),'Education anchor hidden by sticky header');
  await page.screenshot({path:evidence+'/sticky-anchor-'+width+'.png'});
 }
 await page.setViewport({width:390,height:844});
 await page.goto(base+'/');
 await page.evaluate(()=>scrollTo(0,800));
 await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(()=>document.activeElement.className),'skip-link');
 assert.ok(await page.$eval('.skip-link',el=>{const r=el.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight && document.elementFromPoint(r.left+10,r.top+10)===el;}),'Skip link hidden by sticky header');
 await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
 await page.setViewport({width:667,height:240});
 await page.goto(base+'/about/');
 await page.evaluate(()=>scrollTo(0,700));
 await page.click('.nav-toggle');
 assert.ok(await page.$eval('.site-header',el=>el.getBoundingClientRect().height<=innerHeight),'Mobile menu exceeds short viewport');
 await Promise.all([page.waitForNavigation(),page.click('#site-nav a[href="/contact/"]')]);
 assert.equal(new URL(page.url()).pathname,'/contact/');
 report.interactions.push('Sticky header stays visible on scroll; navigation, direct fragment targets, skip link and short-screen mobile menu remain usable');
 for(const width of [760,761,1024]) {
  await page.setViewport({width,height:900});
  await page.goto(base+'/');
  for(const route of ['/work/','/contact/','/about/','/']) {
   if(await page.$eval('.nav-toggle',el=>getComputedStyle(el).display!=='none')) await page.click('.nav-toggle');
   await Promise.all([page.waitForNavigation(),page.click(`#site-nav a[href="${route}"]`)]);
   if(await page.$eval('.nav-toggle',el=>getComputedStyle(el).display!=='none')) await page.click('.nav-toggle');
   assert.equal(await page.$$eval('#site-nav a',links=>links.filter(el=>{const r=el.getBoundingClientRect();return r.width>0 && r.height>0 && r.left>=0 && r.right<=innerWidth;}).length),4,`${route}: missing navigation at ${width}`);
   if(await page.$eval('.nav-toggle',el=>getComputedStyle(el).display!=='none')) await page.click('.nav-toggle');
  }
 }
 report.interactions.push('All four menu items remain visible after navigation at 760, 761 and 1024 px');
 await page.setViewport({width:390,height:844});
 await page.goto(base+'/');
 await page.click('.nav-toggle');
 assert.equal(await page.$eval('.nav-toggle',e=>e.getAttribute('aria-expanded')),'true');
 await Promise.all([page.waitForNavigation(),page.click('#site-nav a[href="/work/"]')]);
 assert.equal(new URL(page.url()).pathname,'/work/');
 assert.equal(await page.$eval('.nav-toggle',e=>e.getAttribute('aria-expanded')),'false');
 await page.click('.nav-toggle'); await page.keyboard.press('Escape');
 assert.equal(await page.$eval('.nav-toggle',e=>e.getAttribute('aria-expanded')),'false');
 assert.equal(await page.evaluate(()=>document.activeElement.className),'nav-toggle');
 report.interactions.push('Mobile menu opens, navigates to work, closes on Escape and returns focus');
 await page.setViewport({width:1440,height:1000});
 await page.goto(base+'/');
 report.homeResources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.initiatorType!=='script' || !r.name.includes('axe')).map(r=>({url:r.name,encodedBytes:r.encodedBodySize,transferBytes:r.transferSize})));
 await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(()=>document.activeElement.className),'skip-link');
 await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
 report.interactions.push('Keyboard skip link moves focus to main');
 for(const route of ['/about/','/work/','/contact/','/']) {
  await Promise.all([page.waitForNavigation(),page.click(`#site-nav a[href="${route}"]`)]);
  assert.equal(new URL(page.url()).pathname,route);
 }
 await Promise.all([page.waitForNavigation(),page.click('a[href="/work/proxmpc/"]')]);
 assert.match(await page.$eval('main',e=>e.textContent),/Control core/);
 report.interactions.push('All four main navigation routes and ProxMPC case study reached by clicks');
 for(const width of [1440,390]) {
  await page.setViewport({width,height:900});
  await page.goto(base+'/');
  const research='.work-row a[href="/work/autonomous-vehicle-control/"]';
  assert.equal(await page.$$eval('a.work-row',rows=>rows.length),0);
  await page.hover(research);
  assert.match(await page.$eval(research,el=>getComputedStyle(el).textDecorationLine),/underline/);
  await Promise.all([page.waitForNavigation(),page.click(research)]);
  assert.equal(new URL(page.url()).pathname,'/work/autonomous-vehicle-control/');
  await page.goto(base+'/work/');
  assert.equal(await page.$$eval('a.work-row',rows=>rows.length),0);
  assert.equal(await page.$eval('.work-list',el=>getComputedStyle(el).borderTopWidth),'0px');
  assert.equal(await page.$eval('.page-intro',el=>getComputedStyle(el).borderBottomWidth),'1px');
  await page.$eval('.work-summary p',el=>el.click());
  assert.equal(new URL(page.url()).pathname,'/work/');
  for(const route of ['/work/marine-autonomy/','/work/proxmpc/','/work/autonomous-vehicle-control/']) {
   const selector=`.work-row a[href="${route}"]`;
   await page.hover(selector);
   assert.match(await page.$eval(selector,el=>getComputedStyle(el).textDecorationLine),/underline/);
   await Promise.all([page.waitForNavigation(),page.click(selector)]);
   assert.equal(new URL(page.url()).pathname,route);
   await page.goto(base+'/work/');
  }
 }
 report.interactions.push('Research and work CTAs underline on hover and navigate; row text stays inactive; single divider at desktop and mobile');
 await page.goto(base+'/contact/');
 assert.equal(await page.$eval('a[href^="mailto:"]',e=>e.getAttribute('href')),'mailto:simone.contorno@outlook.it');
 assert.equal(await page.$$eval('form',els=>els.length),0);
 const contactGroups=await page.$$eval('.contact-methods > section',sections=>sections.map(section=>({heading:section.querySelector('h2')?.textContent,links:[...section.querySelectorAll('a')].map(a=>a.getAttribute('href'))})));
 assert.deepEqual(contactGroups.map(group=>group.heading),['Email','Profiles']);
 assert.deepEqual(contactGroups[0].links,['mailto:simone.contorno@outlook.it']);
 assert.deepEqual(contactGroups[1].links,['https://www.linkedin.com/in/simone-contorno','https://github.com/simone-contorno']);
 report.interactions.push('Email and professional profiles have separate labelled sections');
 await browser.defaultBrowserContext().overridePermissions(base,['clipboard-read','clipboard-sanitized-write']);
 await page.click('[data-copy-email]');
 await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.startsWith('Email address copied.'));
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'simone.contorno@outlook.it');
 report.interactions.push('Real clipboard write/read succeeds; no submission form or delivery claim');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}}));
 await page.click('[data-copy-email]');
 await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.startsWith('Could not copy automatically.'));
 assert.equal(await page.$eval('.email-link',e=>e.textContent.includes('simone.contorno@outlook.it')),true);
 report.interactions.push('Clipboard denial produces manual-copy recovery and leaves email visible');
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.goto(base+'/');
 assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
 assert.equal(await page.$eval('.button',e=>getComputedStyle(e).transitionDuration),'0s');
 report.interactions.push('Reduced-motion mode checked');
 await page.setJavaScriptEnabled(false);
 await page.setViewport({width:320,height:800});
 await page.goto(base+'/');
 assert.equal(await page.$eval('#site-nav',e=>getComputedStyle(e).display!=='none'),true);
 await Promise.all([page.waitForNavigation(),page.click('#site-nav a[href="/contact/"]')]);
 assert.equal(await page.$eval('[data-copy-email]',e=>getComputedStyle(e).display),'none');
 assert.equal(await page.$eval('a[href^="mailto:"]',e=>!!e.href),true);
 await page.goto(base+'/work/autonomous-vehicle-control/');
 assert.match(await page.$eval('main',e=>e.textContent),/My Contribution/);
 report.interactions.push('JavaScript disabled: navigation, email and full case-study content remain usable');
 assert.deepEqual(errors,[],'Browser console/network failures');
 report.consoleAndNetworkErrors=errors;
 console.log(`PASS: ${report.pages.length} page/viewport checks; axe reports no violations. ${report.interactions.length} interaction scenarios passed.`);
} catch(e) {report.failures.push(e.stack);console.error(e);process.exitCode=1;}
finally {await writeFile(evidence+'/browser-report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
