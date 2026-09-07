import { webkit } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
// Local synthetic fixtures only. Run with --full after all 32 assets are available.
const full = process.argv.includes('--full');
const output = join(tmpdir(), full ? 'anima-growth-webkit-full' : 'anima-growth-webkit-first-four');
const stages = Array.from({length: full ? 32 : 4}, (_,index) => index);
const result = { engine:'WebKit', mode:full?'32 drawings':'preserved first four', viewport:{width:390,height:844}, errors:[],api:[],snapshots:[],assets:[],assertions:[] };
await mkdir(output,{recursive:true});
const browser = await webkit.launch({headless:true});
let page;
async function setup(query){
 const context = await browser.newContext({viewport:result.viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const p = await context.newPage();
 p.on('pageerror',e=>result.errors.push(e.message));
 p.on('response',r=>{if(/\/marque\/(croissance|metamorphose)\//.test(r.url()))result.assets.push({path:new URL(r.url()).pathname,status:r.status()});});
 await p.route('**/api/**',r=>{result.api.push({method:r.request().method(),path:new URL(r.request().url()).pathname});return r.fulfill({status:503,body:'{}'});});
 await p.goto(`http://127.0.0.1:4179/?${query.includes('tree=')?'':'tree=seed&'}${query}`,{waitUntil:'domcontentloaded'});
 return p;
}
async function ready(p,stage){
 await p.waitForFunction(i=>document.querySelector('[data-index-croissance]')?.dataset.indexCroissance===String(i),stage);
 const image=p.locator('[data-index-croissance] [data-planche] > img');
 await image.waitFor({state:'visible'}); await image.evaluate(img=>img.decode());
 await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
 assert.equal(await image.evaluate(img=>img.naturalWidth),1024);
 return image;
}
async function snapshot(p,label){
 const metrics=await p.evaluate(()=>{
  const targets=[...document.querySelectorAll('[data-branche-arbre],[data-groupe-branches]')].map(el=>{const r=el.getBoundingClientRect();return {id:el.dataset.brancheArbre,ids:el.dataset.groupeBranches,name:el.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height,reachable:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
  const overlaps=[];for(let a=0;a<targets.length;a++)for(let b=a+1;b<targets.length;b++){const x=targets[a],y=targets[b];if(Math.min(x.x+x.width,y.x+y.width)>Math.max(x.x,y.x)+.5&&Math.min(x.y+x.height,y.y+y.height)>Math.max(x.y,y.y)+.5)overlaps.push([x.name,y.name]);}
  return {index:document.querySelector('[data-index-croissance]')?.dataset.indexCroissance,overflow:document.documentElement.scrollWidth>innerWidth,targets,overlaps,active:{tag:document.activeElement?.tagName,label:document.activeElement?.getAttribute('aria-label'),text:document.activeElement?.textContent?.slice(0,70)}};
 });
 assert.equal(metrics.overflow,false,`${label} overflow`);assert.deepEqual(metrics.overlaps,[],`${label} overlapping main targets`);
 assert(metrics.targets.every(t=>t.width>=43.9&&t.height>=43.9),`${label} target size`);
 result.snapshots.push({label,...metrics});await p.screenshot({path:`${output}/${label}.png`});
}
try{
 page=await setup('treeStage=0&treeControls=1');
 await ready(page,0);
 await page.locator('[data-index-croissance] [aria-hidden] img').evaluate(img=>img.decode());
 result.coldAssets=[...new Set(result.assets.map(asset=>asset.path))];
 assert.deepEqual(result.coldAssets.sort(),['/marque/metamorphose/01-graine.webp','/marque/metamorphose/02-eclosion.webp']);
 result.assertions.push('Cold personal tree requests only its current illustration and the immediately following preload.');
 for(const stage of stages){
  if(stage)await page.getByLabel('Projection synthétique',{exact:true}).selectOption(String(stage));
  await ready(page,stage);if(!full||[0,3,4,8,15,23,31].includes(stage))await snapshot(page,`main-${String(stage).padStart(2,'0')}`);
 }
 result.assertions.push(`Actual projected props change the main image on the same page through ${stages.length} stages.`);
 await page.close();
 page=await setup('treeStage=0');await ready(page,0);
 const trigger=page.getByRole('button',{name:'Voir la graine éclore',exact:true});await trigger.tap();
 const dialog=page.getByRole('dialog');const select=dialog.getByLabel('Choisir une étape',{exact:true});
 assert.equal(await select.inputValue(),'1');assert.equal(await select.locator('option').count(),32);
 for(const index of stages){
  await select.selectOption(String(index));
  const image=dialog.locator('[data-planche] > img');await image.waitFor({state:'visible'});await image.evaluate(img=>img.decode());
  assert.equal(await image.evaluate(img=>img.naturalWidth),1024);
  assert.equal(await dialog.getByRole('button',{name:'Image précédente',exact:true}).isDisabled(),index===0);
  assert.equal(await dialog.getByRole('button',{name:'Image suivante',exact:true}).isDisabled(),index===31);
 }
 await select.selectOption('1');
 await dialog.getByRole('button',{name:'Image précédente',exact:true}).focus();await page.keyboard.press('Enter');
 assert.equal(await select.inputValue(),'0');assert(await select.evaluate(el=>el===document.activeElement));
 if(full){await select.selectOption('30');await dialog.getByRole('button',{name:'Image suivante',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await select.inputValue(),'31');assert(await select.evaluate(el=>el===document.activeElement));await dialog.locator('[data-planche] > img').evaluate(img=>img.decode());}
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await trigger.evaluate(el=>el===document.activeElement));
 result.assertions.push('Seed CTA opens index 1; native select lists 32 images; endpoint keyboard focus and Escape return correctly.');
 await page.close();
 page=await setup('treeStage=3');await ready(page,3);
 const region=page.getByRole('region',{name:'Mon évolution',exact:true});
 const target=region.locator('[data-branche-arbre]').first();await target.tap();
 await region.getByRole('button',{name:'Voir dans la conversation',exact:true}).waitFor({state:'visible'});
 await page.keyboard.press('Escape');await page.waitForFunction(el=>el===document.activeElement,await target.elementHandle());
 const world=page.locator('[data-index-croissance]').locator('..');const before=await world.getAttribute('style');
 await region.getByRole('button',{name:'Agrandir l’arbre',exact:true}).tap();const plus=await world.getAttribute('style');
 await region.getByRole('button',{name:'Réduire l’arbre',exact:true}).tap();const minus=await world.getAttribute('style');
 assert(before!==plus&&plus!==minus);assert.equal(await page.locator('[data-index-croissance]').getAttribute('data-index-croissance'),'3');
 result.assertions.push('Real branch target opens its source actions, Escape restores it, zoom changes the camera without changing growth.');
 await snapshot(page,'main-03-after-zoom');await page.close();
 page=await setup('tree=birth&treeBranches=2');await ready(page,2);
 const garden=page.getByRole('region',{name:'Mon évolution',exact:true});
 const group= garden.getByRole('button',{name:'Voir les 2 branches proches',exact:true});await group.tap();
 const choices=garden.getByRole('group',{name:'Branches proches',exact:true});
 await choices.getByRole('button',{name:/^Branche : /}).first().tap();
 result.groupSheetTargets=await garden.locator('[data-couche-fiche] button').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {name:el.getAttribute('aria-label')||el.textContent.trim(),reachable:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),x:r.x,y:r.y,width:r.width,height:r.height};}));
 assert(result.groupSheetTargets.every(target=>target.reachable),'Grouped-branch sheet commands must receive pointer hits');
 await garden.getByRole('button',{name:'Centrer sur cette branche',exact:true}).tap();
 await choices.waitFor({state:'hidden'});
 const keyboardGarden=garden.getByRole('group',{name:/^Zone de l’arbre/});
 await page.waitForFunction(el=>el===document.activeElement,await keyboardGarden.elementHandle());
 const framed=await page.locator('[data-index-croissance]').locator('..').getAttribute('style');
 await page.keyboard.press('ArrowRight');
 const moved=await page.locator('[data-index-croissance]').locator('..').getAttribute('style');
 assert.notEqual(framed,moved);
 result.assertions.push('A grouped birth opens its real branch sheet; centering closes the panel, focuses the keyboard garden and arrow movement still works.');
 await snapshot(page,'group-centered-keyboard');await page.close();
 page=await setup('tree=birth&treeBranches=2');await ready(page,2);
 const grouped=page.getByRole('button',{name:'Voir les 2 branches proches',exact:true});
 const rect=await grouped.boundingBox();const panBefore=await page.locator('[data-index-croissance]').locator('..').getAttribute('style');
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+15,rect.y+rect.height/2,{steps:5});await page.mouse.up();
 result.groupDrag={panelOpened:await page.getByRole('group',{name:'Branches proches',exact:true}).count()>0,panChanged:panBefore!==await page.locator('[data-index-croissance]').locator('..').getAttribute('style')};
 assert.deepEqual(result.groupDrag,{panelOpened:false,panChanged:true});
 await grouped.focus();await page.keyboard.press('Enter');
 await page.getByRole('group',{name:'Branches proches',exact:true}).waitFor();
 await page.keyboard.press('Escape');
 await page.waitForFunction(el=>el===document.activeElement,await grouped.elementHandle());
 result.assertions.push('Dragging a grouped target pans without a false opening; subsequent Enter opens it and Escape restores focus.');
 await snapshot(page,'group-drag');await page.close();
 // A fresh route disables cache. Failure is local and never involves real personal APIs.
 page=await setup('treeStage=0');let blocked=0;
 await page.route('**/marque/metamorphose/04-pousse.webp',r=>blocked++===0?r.abort('failed'):r.continue());
 await page.goto('http://127.0.0.1:4179/?tree=seed&treeStage=3',{waitUntil:'domcontentloaded'});
 const retry=page.getByRole('button',{name:'Réessayer l’image',exact:true});await retry.waitFor();await snapshot(page,'main-error');
 await retry.tap();await ready(page,3);assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Ton arbre');await snapshot(page,'main-retry');
 result.assertions.push('Main image request failure exposes a retry; successful retry keeps focus on the stable personal-tree group.');
 assert.deepEqual(result.errors,[]);assert(result.api.every(request=>request.method==='GET'),'No API mutation is permitted');
 console.log(JSON.stringify({output,screenshots:result.snapshots.length,errors:result.errors,api:result.api,assertions:result.assertions}));
}catch(error){result.failure=String(error.stack??error);if(page)await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});throw error;}
finally{await writeFile(`${output}/results.json`,JSON.stringify(result,null,2));await browser.close();}
