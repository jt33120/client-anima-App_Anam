import { chromium, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const dir=new URL('../../design/reviews/launch-portal/', import.meta.url).pathname;
await mkdir(dir,{recursive:true});
const results=[];
for(const [engine, driver] of [['chromium',chromium],['webkit',webkit]]){
const browser=await driver.launch();
try {
for(const [width,height,mode] of [[390,844,'nuit'],[768,1024,'nuit'],[1440,900,'nuit'],[390,844,'papier'],[390,844,'reduit'],[390,844,'contraste'],[844,390,'nuit'],[390,844,'absent']]){
const page=await browser.newPage({viewport:{width,height},reducedMotion:mode==='reduit'?'reduce':'no-preference'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.clock.install({time:new Date('2026-09-08T12:00:00Z')});
await page.clock.pauseAt(new Date('2026-09-08T12:00:00Z'));
if(mode==='absent')await page.route('**/scene/**',r=>r.request().url().match(/\/(veille|portail)\//)?r.abort():r.continue());
await page.goto(`${process.env.CARNET_BASE_URL ?? 'http://127.0.0.1:4179'}/?portail=1`,{waitUntil:'load'});
await page.evaluate(mode=>{
 if(mode==='papier')document.documentElement.dataset.carnetTheme='papier';
 if(mode==='contraste')document.documentElement.dataset.a11y='contraste';
 for(const a of document.getAnimations()) {a.pause();a.currentTime=1600;}
},mode);
const portal=page.locator('[data-portail-anam]');
await portal.waitFor();
await page.screenshot({path:`${dir}/${engine}-${width}-${mode}.png`});
const metrics=await portal.evaluate(el=>({
 overflow:document.documentElement.scrollWidth>innerWidth,
 pointerEvents:getComputedStyle(el).pointerEvents,
 image:!!el.querySelector('img'),
 portraitBottom:el.querySelector('picture')?.getBoundingClientRect().bottom ?? null,
 signatureTop:el.querySelector('p')?.getBoundingClientRect().top ?? null,
 animationCount:el.getAnimations({subtree:true}).length,
 scene:el.children[1].getBoundingClientRect().toJSON()
}));
if(metrics.overflow)throw Error('horizontal overflow');
if(metrics.portraitBottom!==null && metrics.portraitBottom>metrics.signatureTop)throw Error('portrait overlaps signature');
if(metrics.scene.top<0 || metrics.scene.bottom>height)throw Error('scene outside viewport');
if(metrics.pointerEvents!=='none')throw Error('pointer interception');
if(mode==='reduit' && metrics.animationCount)throw Error('reduced motion still animates');
await page.clock.runFor(mode==='reduit'?1100:3000);
if(await portal.count())throw Error('portal stayed too long');
if(errors.length)throw Error(errors.join('\n'));
results.push({engine,width,height,mode,...metrics,exit:'OK',errors});
console.log(`${engine} ${width} ${mode}: OK`);
await page.close();
}
const slow=await browser.newPage({viewport:{width:390,height:844}});
await slow.clock.install({time:new Date('2026-09-08T12:00:00Z')});
await slow.clock.pauseAt(new Date('2026-09-08T12:00:00Z'));
const held=[];
await slow.route('**/scene/portail/**',route=>{held.push(route);});
await slow.goto(`${process.env.CARNET_BASE_URL ?? 'http://127.0.0.1:4179'}/?portail=1`,{waitUntil:'domcontentloaded'});
await slow.locator('[data-portail-anam]').waitFor();
await slow.clock.runFor(6800);
if(await slow.locator('[data-portail-anam]').count())throw Error('slow resource blocks portal');
for(const route of held)await route.abort();
results.push({engine,mode:'slow resource',exit:'OK'});
console.log(`${engine} slow resource: OK`);
await slow.close();
}finally{await browser.close();}
}
await writeFile(`${dir}/results.json`,JSON.stringify(results,null,2));
