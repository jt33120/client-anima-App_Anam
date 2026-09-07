import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
// Start the local harness before running: npx vite --config tests/visual-carnet/vite.config.mjs
const captureDirectory = process.env.CARNET_CAPTURE_DIR ?? '/tmp/anima-keyboard-captures';
const baseUrl = process.env.CARNET_BASE_URL ?? 'http://127.0.0.1:4179/';
await mkdir(captureDirectory, { recursive: true });
for (const [engine, type] of [['chromium',chromium],['webkit',webkit]]) {
  const browser = await type.launch({headless:true});
  for (const width of [390,1024]) for (const scenario of ['ios','android']) {
    const page = await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
    await page.addInitScript(() => {
      const model = {height:innerHeight,offsetTop:0,scale:1,width:innerWidth};
      const viewport = new EventTarget();
      for (const key of Object.keys(model)) Object.defineProperty(viewport,key,{get:()=>model[key]});
      Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
      window.__viewport = values => {Object.assign(model,values);viewport.dispatchEvent(new Event('resize'));};
    });
    await page.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"erreur":"Aperçu local sans serveur"}'}));
    await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Anam',exact:true}).click();
    await page.waitForTimeout(200);
    assert.equal(await page.getByRole('textbox',{name:'Ton message à Anam'}).evaluate(el=>el===document.activeElement),false,'Anam navigation must not focus the input');
    await page.getByRole('textbox',{name:'Ton message à Anam'}).fill('Je voudrais prendre le temps de comprendre ce qui me donne envie de me lever le matin. '.repeat(4));
    if (scenario==='android') await page.setViewportSize({width,height:430});
    await page.evaluate(scenario=>window.__viewport({height:430,offsetTop:scenario==='ios'?56:0}),scenario);
    await page.waitForTimeout(200);
    const metrics = await page.evaluate(()=> {
      const input=document.querySelector('textarea');
      const composer=input.parentElement;
      const film=document.querySelector('[class*="fil_"]');
      const scene=document.querySelector('main');
      return {
        keyboard:scene.hasAttribute('data-clavier-ouvert'),
        scene:scene.getBoundingClientRect().toJSON(),
        input:input.getBoundingClientRect().toJSON(),
        composer:composer.getBoundingClientRect().toJSON(),
        inputOutline:getComputedStyle(input).outlineStyle,
        envelopeOutline:getComputedStyle(composer).outlineStyle,
        lines:getComputedStyle(input).getPropertyValue('--lignes-composeur'),
        fieldValue:input.value,
        thread:film?.getBoundingClientRect().toJSON(),
        overflow:document.documentElement.scrollWidth>innerWidth,
      };
    });
    console.log(engine,width,scenario,JSON.stringify({ ...metrics, fieldValue: undefined }));
    assert.equal(metrics.keyboard,true);
    assert.equal(metrics.scene.height,430);
    assert.ok(metrics.composer.bottom<=metrics.scene.bottom+1,'composer stays above keyboard');
    assert.ok(metrics.composer.height<=105,'draft leaves space for reading');
    assert.equal(metrics.inputOutline,'none');
    assert.equal(metrics.envelopeOutline,'solid');
    assert.equal(metrics.overflow,false);
    await page.screenshot({path:`${captureDirectory}/${engine}-${scenario}-${width}-keyboard.png`,clip:{x:0,y:scenario==='ios'?56:0,width,height:430}});
    await page.evaluate(()=>window.__viewport({scale:1.5,height:280,offsetTop:80}));
    await page.waitForTimeout(50);
    assert.equal(await page.locator('main').evaluate(el=>el.hasAttribute('data-viewport-conversation')),false,'pinch zoom has native control');
    await page.evaluate(()=>window.__viewport({scale:1,height:844,offsetTop:0}));
    if(scenario==='android') await page.setViewportSize({width,height:844});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('main').evaluate(el=>el.hasAttribute('data-clavier-ouvert')),false,'closed keyboard restores navigation');
    assert.equal(await page.getByRole('textbox',{name:'Ton message à Anam'}).inputValue(),metrics.fieldValue,'viewport changes keep the draft');
    await page.screenshot({path:`${captureDirectory}/${engine}-${scenario}-${width}-closed.png`,fullPage:true});
    await page.close();
  }
  await browser.close();
}
