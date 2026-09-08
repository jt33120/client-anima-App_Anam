import {chromium,webkit,expect} from '@playwright/test';
import{mkdir,writeFile}from'node:fs/promises';
const dir=new URL('../../design/reviews/lotus-actions/',import.meta.url).pathname;
await mkdir(dir,{recursive:true});const results=[];
for(const [engine,driver]of[['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch();
 try{for(const width of[390,768,1440])for(const mode of['ready','loading','cooldown','error',...(width===390?['reduced']:[])]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));let held;
  await page.route('**/api/**',route=>{
   if(!route.request().url().endsWith('/api/numerologie'))return route.fulfill({json:{}});
   if(route.request().method()==='POST'){held=route;return;}
   if(mode==='error')return route.fulfill({status:503,json:{message:'Ta lecture n’a pas pu être retrouvée. Réessaie.'}});
   return route.fulfill({json:mode==='cooldown'?{lecture:null,statut:'patience',reessaiApres:120}:{lecture:null,statut:'absente'}});
  });
  await page.goto('http://127.0.0.1:4179/socle?univers=numerologie',{waitUntil:'domcontentloaded'});
  let bouton=page.getByRole('button',{name:mode==='error'?'Recharger ma lecture':'Créer ma lecture',exact:true});await bouton.waitFor();
  if(mode==='loading'||mode==='reduced'){
   await bouton.click();bouton=page.getByRole('button',{name:'Ta lecture prend forme…'});await expect(bouton).toBeDisabled();
   await page.waitForTimeout(1200);
  }
  await bouton.scrollIntoViewIfNeeded();
  const metrics=await bouton.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,animations:el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length,hasLotus:!!el.querySelector('svg'),busy:el.getAttribute('aria-busy')}));
  expect(metrics.height).toBeGreaterThanOrEqual(44);expect(metrics.hasLotus).toBe(true);
  if(mode==='loading')expect(metrics.animations).toBeGreaterThan(0);
  if(mode==='reduced'||mode==='ready'||mode==='cooldown')expect(metrics.animations).toBe(0);
  if(mode!=='error')await expect(page.getByRole('alert')).toHaveCount(0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);expect(overflow).toBe(false);
  await page.screenshot({path:`${dir}/${engine}-${width}-${mode}.png`});
  expect(errors).toEqual([]);results.push({engine,width,mode,metrics,overflow,errors});
  if(held)await held.fulfill({status:503,json:{code:'generation_indisponible',statut:'patience',reessaiApres:120}});
  await page.close();console.log(`${engine} ${width} ${mode}: OK`);
 }}finally{await browser.close();}
}
await writeFile(`${dir}/results.json`,JSON.stringify(results,null,2));
