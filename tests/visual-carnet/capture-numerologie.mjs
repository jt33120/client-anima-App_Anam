import { chromium, webkit, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const dir = new URL('../../design/reviews/night-numerology/', import.meta.url).pathname;
await mkdir(dir, { recursive: true });
const base = process.env.CARNET_BASE_URL ?? 'http://127.0.0.1:4179';
const fixture = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', annee: 2026, note: null, partageAnam: false,
  guidanceAnnee: 'Cette année pourrait t’inviter à donner une forme concrète à ce qui compte pour toi. Ton chemin de vie ouvre une piste durable : comprendre avant de choisir. Essaie de réserver un moment chaque semaine pour un projet personnel, puis observe ce qui te donne envie de continuer.',
  visionLongTerme: 'Dans la durée, tu pourrais rechercher un équilibre entre ton besoin d’autonomie et ton envie de construire avec les autres. Avancer par essais modestes peut t’aider à trouver ta propre manière de t’engager. Cette perspective symbolique reste à confronter à tes envies réelles.',
  portrait: 'Tes nombres évoquent une curiosité discrète et un besoin possible de comprendre les choses en profondeur. Tu pourrais apprécier les liens sincères tout en ayant besoin de temps seul. À l’inverse, trop réfléchir peut parfois retarder un premier pas. Reconnais-tu cette tension dans ton quotidien ? Ce portrait est une hypothèse symbolique, pas une description certaine de toi.',
};
const results = [];
for (const [engine, driver] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await driver.launch();
  try {
    for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      const calls = [];
      let lecture = null;
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => localStorage.setItem('anam-carnet-theme', 'papier'));
      await page.route('**/api/**', async route => {
        if (!route.request().url().endsWith('/api/numerologie')) return route.fulfill({ status: 200, json: {} });
        const method = route.request().method();
        calls.push(method);
        if (method === 'POST') lecture = { ...fixture };
        if (method === 'PATCH') {
          const body = route.request().postDataJSON();
          lecture = { ...lecture, note: body.note, partageAnam: body.note === 5 && body.partagerAnam };
        }
        return route.fulfill({ json: { lecture } });
      });
      await page.goto(`${base}/socle?univers=numerologie`, { waitUntil: 'networkidle' });
      await expect(page.getByRole('button', { name: 'Créer ma lecture' })).toBeVisible();
      expect(calls).toEqual(['GET']);
      await expect(page.locator('html')).toHaveAttribute('data-carnet-theme', 'nuit');
      const headings = await page.locator('[aria-label="Tes deux repères essentiels"] h3').allTextContents();
      expect(headings[0]).toMatch(/chemin de vie/i);
      expect(headings[1]).toMatch(/année personnelle/i);
      const extras = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Tes autres nombres et le détail des lectures' }) }).first();
      expect(await extras.getAttribute('open')).toBeNull();
      await page.screenshot({ path: `${dir}/${engine}-${width}-empty.png`, fullPage: true });
      await page.getByRole('button', { name: 'Créer ma lecture' }).click();
      await expect(page.getByRole('heading', { name: 'Ce que tes nombres évoquent de toi' })).toBeVisible();
      await page.screenshot({ path: `${dir}/${engine}-${width}-reading.png`, fullPage: true });
      const rate = async n => {
        const radio = page.getByRole('radio', { name: new RegExp(`^${n} sur 5`) });
        await radio.locator('..').click();
        await expect(radio).toBeChecked();
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      };
      await rate(4);
      await expect(page.getByRole('button', { name: 'Confier ce portrait à Anam' })).toHaveCount(0);
      await rate(5);
      await page.getByRole('button', { name: 'Confier ce portrait à Anam' }).click();
      await expect(page.getByRole('button', { name: 'Retirer le partage avec Anam' })).toBeVisible();
      await page.screenshot({ path: `${dir}/${engine}-${width}-shared.png`, fullPage: true });
      await page.getByRole('button', { name: 'Retirer le partage avec Anam' }).click();
      await expect(page.getByRole('button', { name: 'Confier ce portrait à Anam' })).toBeVisible();
      await page.getByRole('button', { name: 'Confier ce portrait à Anam' }).click();
      await rate(3);
      await expect(page.getByRole('button', { name: 'Retirer le partage avec Anam' })).toHaveCount(0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect(overflow).toBe(false);
      const targets = await page.locator('label:has(input[type="radio"])').evaluateAll(labels => labels.map(el => ({width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height})));
      expect(targets.every(box => box.width >= 44 && box.height >= 44)).toBe(true);
      await page.goto(`${base}/socle?univers=astrologie`, { waitUntil: 'networkidle' });
      const text = await page.locator('main').innerText();
      expect(text.indexOf('Tes trois repères')).toBeLessThan(text.indexOf('Ta carte du ciel'));
      expect(text).not.toContain('Ce qui manque et pourquoi');
      await page.screenshot({ path: `${dir}/${engine}-${width}-astrology.png`, fullPage: true });
      await page.goto(base, { waitUntil: 'networkidle' });
      await expect(page.getByRole('button', { name: 'Papier', exact: true })).toHaveCount(0);
      if (width === 390) {
        await page.getByRole('button', { name: 'Lire plus', exact: true }).first().click();
        await expect(page.getByRole('button', { name: 'Réduire', exact: true }).first()).toBeVisible();
      }
      expect(errors).toEqual([]);
      results.push({ engine, width, height, targets, calls, overflow, errors, sharing: '4 excluded, 5 explicit, withdraw and lower rating revoke' });
      console.log(`${engine} ${width}: OK`);
      await page.close();
    }
  } finally { await browser.close(); }
}
await writeFile(`${dir}/results.json`, JSON.stringify(results, null, 2));
