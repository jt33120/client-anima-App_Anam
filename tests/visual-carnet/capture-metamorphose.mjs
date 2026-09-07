import { chromium, webkit } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

// Start the offline Vite harness first. All application API calls stay intercepted locally.
// node tests/visual-carnet/capture-metamorphose.mjs [output-directory] [quick|chromium|full]
const project = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const output = process.argv[2] ?? join(tmpdir(), "anima-metamorphose");
const quick = process.argv[3] === "quick";
const files = ["render/arbre/MetamorphoseArbre.tsx", "render/arbre/ComprendreEvolution.tsx", "render/arbre/metamorphose.module.css", "render/arbre/ArbreInteractif.tsx", "render/arbre/arbre.module.css", "render/arbre/metamorphose-planches.ts", "app/styles/carnet-tokens.css"];
const hashes = async () => Object.fromEntries(await Promise.all(files.map(async (file) => [file, createHash("sha256").update(await readFile(join(project, file))).digest("hex")])));
const before = await hashes();
const results = [];
const contexts = [];
let fatalError = null;
await mkdir(output, { recursive: true });
const readImage = async (page) => {
  await page.locator('[role="dialog"] [data-planche] img').waitFor({ state: "visible" });
  await page.locator('[role="dialog"] [data-planche] img').evaluate((image) => image.decode());
  return page.locator('[role="dialog"] [data-planche] img').evaluate((image) => {
    const bounds = image.getBoundingClientRect();
    const css = getComputedStyle(image);
    return { id: image.parentElement.dataset.planche, src: image.getAttribute("src"), alt: image.alt,
      naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
      opacity: css.opacity, visibility: css.visibility, objectFit: css.objectFit,
      bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } };
  });
};
const capture = async (page, filename) => {
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[role="dialog"]').evaluateAll((dialogs) => Promise.all(dialogs.flatMap((dialog) => dialog.getAnimations()).map((animation) => animation.finished.catch(() => {}))));
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  await page.screenshot({ path: join(output, filename) });
};
try {
  for (const [engine, type] of quick || process.argv[3] === "chromium" ? [["chromium", chromium]] : [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await type.launch({ headless: true });
    try {
      for (const width of engine === "webkit" ? [390] : [390, 768, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: "reduce" });
        const errors = [];
        const api = [];
        const assets = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
        page.on("request", (request) => { if (/\/marque\/(metamorphose|croissance)\//.test(request.url())) assets.push(new URL(request.url()).pathname); });
        await page.route("**/api/**", (route) => { api.push(route.request().method() + " " + new URL(route.request().url()).pathname); return route.fulfill({ status: 503, body: "{}", contentType: "application/json" }); });
        await page.goto("http://127.0.0.1:4179/?tree=seed", { waitUntil: "domcontentloaded" });
        const region = page.getByRole("region", { name: "Mon évolution", exact: true });
        await region.waitFor();
        await page.getByRole("navigation", { name: "Régions" }).getByRole("button", { name: "Mon évolution", exact: true }).click();
        await region.locator('[data-index-croissance] [data-planche] > img').waitFor({ state: "visible" });
        await region.locator('[data-index-croissance] [data-planche] > img').evaluate((image) => image.decode());
        const cta = region.getByRole("button", { name: "Voir la graine éclore", exact: true });
        const ctaBounds = await cta.boundingBox();
        const assetsBeforeOpen = [...assets];
        await capture(page, `${engine}-${width}-seed.png`);
        await cta.click();
        const dialog = page.getByRole("dialog", { name: "Comprendre mon évolution", exact: true });
        await dialog.waitFor();
        const entry = await readImage(page);
        const following = dialog.getByRole("button", { name: "Image suivante", exact: true });
        const navigationBounds = await following.boundingBox();
        await capture(page, `${engine}-${width}-entry.png`);
        await following.click();
        const advanced = await readImage(page);
        await dialog.getByRole("button", { name: "Image précédente", exact: true }).click();
        const returned = await readImage(page);
        const choices = dialog.getByLabel("Choisir une étape", { exact: true });
        const stages = [];
        for (const position of quick ? [0, 31] : width === 390 ? Array.from({ length: 32 }, (_, index) => index) : [1, 15, 31]) {
          await choices.selectOption(String(position));
          const illustration = await readImage(page);
          const selected = await choices.inputValue();
          if (quick || [1, 15, 31].includes(position)) await capture(page, `${engine}-${width}-${position + 1}-${illustration.id}.png`);
          stages.push({ position, ...illustration, selected,
            previousDisabled: await dialog.getByRole("button", { name: "Image précédente", exact: true }).isDisabled(),
            nextDisabled: await following.isDisabled() });
        }
        const families = [];
        for (const [name, expected] of [["Éclosion", 0], ["Croissance", 4], ["Canopée", 16], ["Lumière", 24]]) {
          const shortcut = dialog.getByRole("button", { name: `Voir la famille : ${name}`, exact: true });
          await shortcut.click();
          await readImage(page);
          families.push({ name, expected, selected: Number(await choices.inputValue()), pressed: await shortcut.getAttribute("aria-pressed") });
        }
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        const focusRestored = await cta.evaluate((button) => document.activeElement === button);
        const personalStage = await region.locator("[data-index-croissance]").getAttribute("data-etape-arbre");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        const result = { engine, width, ctaBounds, navigationBounds, assetsBeforeOpen, entry, advanced, returned, stages, families, focusRestored, personalStage, assets: [...new Set(assets)], api, errors, overflow };
        results.push(result);
        console.log(`${engine} ${width}: ${stages.length} stages, entry=${entry.id}, focus=${focusRestored}, errors=${errors.length}`);
        await page.close();

        if (!quick && width === 390) for (const context of [
          { tree: "seed", variant: "papier" }, { tree: "seed", variant: "contraste" },
          { tree: "mixed", variant: "branches" }, { tree: "dense", variant: "liste" },
          { tree: "seed", variant: "reserve" }, { tree: "error", variant: "erreur" },
        ]) {
          const sample = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: "reduce" });
          const contextErrors = [];
          const contextApi = [];
          sample.on("pageerror", (error) => contextErrors.push(error.message));
          sample.on("console", (message) => { if (message.type() === "error") contextErrors.push(message.text()); });
          await sample.route("**/api/**", (route) => { contextApi.push(route.request().method() + " " + new URL(route.request().url()).pathname); return route.fulfill({ status: 503, body: "{}", contentType: "application/json" }); });
          const params = new URLSearchParams({ tree: context.tree });
          if (context.variant === "liste") params.set("treeView", "list");
          if (context.variant === "reserve") params.set("treeReserve", "1");
          await sample.goto(`http://127.0.0.1:4179/?${params}`, { waitUntil: "domcontentloaded" });
          const personal = sample.getByRole("region", { name: "Mon évolution", exact: true });
          await personal.waitFor();
          await sample.getByRole("navigation", { name: "Régions" }).getByRole("button", { name: "Mon évolution", exact: true }).click();
          if (context.variant === "papier") await sample.getByRole("button", { name: "Passer au thème papier" }).click();
          if (context.variant === "contraste") await sample.evaluate(() => { document.documentElement.dataset.a11y = "contraste"; });
          const beforeText = await personal.innerText();
          const sourceStage = await personal.locator("[data-index-croissance]").count() ? await personal.locator("[data-index-croissance]").getAttribute("data-etape-arbre") : null;
          await capture(sample, `${engine}-${width}-${context.variant}-before.png`);
          const opener = personal.getByRole("button", { name: context.variant === "reserve" ? "Voir la graine éclore" : "Comprendre mon évolution", exact: true });
          await opener.click();
          const modal = sample.getByRole("dialog", { name: "Comprendre mon évolution", exact: true });
          await modal.waitFor();
          await modal.getByLabel("Choisir une étape", { exact: true }).selectOption("23");
          const illustration = await readImage(sample);
          const covered = await sample.evaluate(() => {
            const nav = document.querySelector('nav[aria-label="Régions"]');
            return [...nav.querySelectorAll("button")].every((button) => {
              const r = button.getBoundingClientRect();
              const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
              return hit && !nav.contains(hit);
            });
          });
          await capture(sample, `${engine}-${width}-${context.variant}-gallery.png`);
          await sample.keyboard.press("Escape");
          await modal.waitFor({ state: "hidden" });
          const focus = await opener.evaluate((button) => document.activeElement === button);
          const unchanged = beforeText === await personal.innerText();
          const contextOverflow = await sample.evaluate(() => document.documentElement.scrollWidth > innerWidth);
          contexts.push({ engine, width, ...context, sourceStage, illustration, covered, focus, unchanged, overflow: contextOverflow, errors: contextErrors, api: contextApi });
          console.log(`${engine} ${width} ${context.variant}: focus=${focus}, unchanged=${unchanged}, covered=${covered}`);
          await sample.close();
        }
      }
    } finally { await browser.close(); }
  }
} catch (error) {
  fatalError = error instanceof Error ? error.message : String(error);
  console.error(fatalError);
}
const after = await hashes();
const sourceChanged = files.filter((file) => before[file] !== after[file]);
const failures = results.filter((r) => r.errors.length || r.api.length || r.overflow || !r.focusRestored || r.personalStage !== "graine" || r.entry.id !== "eclosion" || r.advanced.id !== "enracinement" || r.returned.id !== "eclosion" || r.families.some((family) => family.expected !== family.selected || family.pressed !== "true"));
const contextFailures = contexts.filter((r) => r.errors.length || r.api.length || r.overflow || !r.covered || !r.focus || !r.unchanged);
await writeFile(join(output, "metamorphose-results.json"), JSON.stringify({ before, after, sourceChanged, fatalError, results, contexts }, null, 2));
console.log(JSON.stringify({ output, scenarios: results.length, contexts: contexts.length, sourceChanged, fatalError, failures: failures.length + contextFailures.length }));
if (fatalError || failures.length || contextFailures.length) process.exitCode = 1;
