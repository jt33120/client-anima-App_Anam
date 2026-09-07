import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Synthetic branch projections only. The app computes every rendered stage itself.
const output = process.argv[2] ?? join(tmpdir(), 'anima-croissance');
const quick = process.argv[3] === 'quick';
const stages = quick ? [0, 4, 8, 15, 23, 31, 32, 33, 34] : Array.from({ length: 35 }, (_, index) => index);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const sourceFiles = ['render/arbre/ArbrePersonnel.tsx', 'render/arbre/ArbreInteractif.tsx', 'render/arbre/ancres-arbre-personnel.ts', 'render/arbre/croissance-personnelle.ts', 'render/arbre/arbre-personnel.module.css', 'render/arbre/arbre.module.css', 'render/arbre/metamorphose-planches.ts'];
const sourceHashes = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, createHash('sha256').update(await readFile(new URL('../../' + file, import.meta.url))).digest('hex')])));
const before = await sourceHashes();
const results = [];
const interactions = [];
let fatalError = null;
async function loaded(page) {
  const image = page.locator('[data-index-croissance] [data-planche] > img');
  await image.waitFor({ state: 'visible' });
  await image.evaluate((el) => el.decode());
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  return image.evaluate((el) => ({ src: el.getAttribute('src'), naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight, alt: el.alt }));
}
async function measure(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[data-branche-arbre], [data-groupe-branches]')];
    const targets = nodes.map((el) => { const r = el.getBoundingClientRect(); return { id: el.getAttribute('aria-label'), x: r.x, y: r.y, width: r.width, height: r.height }; });
    const overlaps = [];
    for (let a = 0; a < targets.length; a++) for (let b = a + 1; b < targets.length; b++) {
      const x = targets[a], y = targets[b];
      if (Math.min(x.x + x.width, y.x + y.width) > Math.max(x.x, y.x) + 0.5 && Math.min(x.y + x.height, y.y + y.height) > Math.max(x.y, y.y) + 0.5) overlaps.push([x.id, y.id]);
    }
    return { index: Number(document.querySelector('[data-index-croissance]')?.dataset.indexCroissance),
      overflow: document.documentElement.scrollWidth > innerWidth,
      targets, overlaps, tooSmall: targets.filter((target) => target.width < 43.5 || target.height < 43.5) };
  });
}
try {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
    const errors = [], api = [], failedAssets = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (!quick) page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', (response) => { if (response.status() >= 400 && response.url().includes('/marque/')) failedAssets.push(response.url()); });
    await page.route('**/api/**', (route) => { api.push(route.request().method() + ' ' + new URL(route.request().url()).pathname); return route.request().method() === 'GET' && new URL(route.request().url()).pathname === '/api/anam/plan'
      ? route.fulfill({ status: 200, contentType: 'application/json', body: '{"plan":[]}' })
      : route.fulfill({ status: 503, body: '{}' }); });
    for (const stage of width === 390 ? stages : [0, 4, 8, 15, 23, 31, 32, 33, 34]) {
      await page.goto(`http://127.0.0.1:4179/?tree=seed&treeStage=${stage}`, { waitUntil: 'domcontentloaded' });
      const image = await loaded(page);
      const metrics = await measure(page);
      await page.screenshot({ path: join(output, `chromium-${width}-stage-${String(stage).padStart(2, '0')}.png`) });
      results.push({ width, stage, image, ...metrics, errors: [...errors], api: [...api], failedAssets: [...failedAssets] });
      console.log(`${width} stage${stage}: rendered=${metrics.index}, targets=${metrics.targets.length}, overlaps=${metrics.overlaps.length}`);
    }
    if (width === 390) {
      await page.goto('http://127.0.0.1:4179/?tree=birth&treeBranches=2', { waitUntil: 'domcontentloaded' });
      await loaded(page);
      const region = page.getByRole('region', { name: 'Mon évolution', exact: true });
      const group = region.getByRole('button', { name: 'Voir les 2 branches proches', exact: true });
      await group.click();
      const panel = region.getByRole('group', { name: 'Branches proches', exact: true });
      const names = await panel.getByRole('button', { name: /^Branche :/ }).allTextContents();
      await page.screenshot({ path: join(output, 'chromium-390-grouped-branches.png') });
      const namedBranch = panel.getByRole('button', { name: 'Branche : Me faire confiance', exact: true });
      await namedBranch.click();
      await region.getByRole('group', { name: 'Fiche de branche', exact: true }).waitFor();
      await page.keyboard.press('Escape');
      await region.getByRole('group', { name: 'Fiche de branche', exact: true }).waitFor({ state: 'hidden' });
      const branchFocus = await namedBranch.evaluate((button) => button === document.activeElement);
      await page.keyboard.press('Escape');
      await panel.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Voir les 2 branches proches');
      const groupFocus = await group.evaluate((button) => button === document.activeElement);
      interactions.push({ width, kind: 'group', names, branchFocus, groupFocus, errors: [...errors], api: [...api] });
    }
    if (!quick) {
      await page.goto('http://127.0.0.1:4179/?tree=seed&treeStage=0&treeControls=1', { waitUntil: 'domcontentloaded' });
      await loaded(page);
      const live = [];
      for (const stage of [1, 3, 11, 12, 22, 23, 24, 25, 31, 32, 33, 34]) {
        await page.getByLabel('Projection synthétique', { exact: true }).selectOption(String(stage));
        await page.waitForFunction((expected) => Number(document.querySelector('[data-index-croissance]')?.dataset.indexCroissance) === expected, stage);
        await loaded(page); live.push((await measure(page)).index);
      }
      const before = await page.locator('[data-index-croissance]').getAttribute('data-index-croissance');
      const region = page.getByRole('region', { name: 'Mon évolution', exact: true });
      const branch = region.locator('[data-branche-arbre]').first();
      let actualBranchOpened = false;
      if (await branch.count()) {
        await branch.click();
        actualBranchOpened = await region.getByRole('button', { name: 'Voir dans la conversation', exact: true }).isVisible();
        await page.keyboard.press('Escape');
      }
      const zoomPlus = region.getByRole('button', { name: 'Agrandir l’arbre', exact: true });
      const zoomMinus = region.getByRole('button', { name: 'Réduire l’arbre', exact: true });
      const world = page.locator('[data-index-croissance]').locator('..');
      const transformBefore = await world.getAttribute('style');
      await zoomPlus.click(); const transformPlus = await world.getAttribute('style');
      await zoomMinus.click(); const transformMinus = await world.getAttribute('style');
      interactions.push({ width, live, before, after: await page.locator('[data-index-croissance]').getAttribute('data-index-croissance'), actualBranchOpened,
        zoomWorks: transformBefore !== transformPlus && transformPlus !== transformMinus, errors: [...errors], api: [...api] });
    }
    await page.close();
  }
} catch (error) { fatalError = error.stack ?? String(error); console.error(fatalError); }
finally { await browser.close(); }
const failures = results.filter((r) => r.index !== r.stage || r.errors.length || r.api.length || r.overlaps.length || r.tooSmall.length || r.overflow || r.image.naturalWidth !== 1024 || (!quick && r.failedAssets.length));
const after = await sourceHashes();
const sourceChanged = sourceFiles.filter((file) => before[file] !== after[file]);
const interactionFailures = interactions.filter((item) => item.errors.length || item.api.some((call) => !call.startsWith('GET /api/anam/plan')) || (item.kind === 'group' ? !item.branchFocus || !item.groupFocus || item.names.length !== 2 : !item.actualBranchOpened || !item.zoomWorks || item.before !== item.after));
await writeFile(join(output, 'croissance-results.json'), JSON.stringify({ before, after, sourceChanged, results, interactions, fatalError, failures: failures.length + interactionFailures.length }, null, 2));
if (fatalError || failures.length || interactionFailures.length) process.exitCode = 1;
console.log(JSON.stringify({ output, cases: results.length, interactions: interactions.length, failures: failures.length + interactionFailures.length, fatalError }));
