import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

// Run against the offline Vite harness on :4179. All API requests are intercepted.
// node tests/visual-carnet/capture-tree.mjs [output-directory] [full|quick|ui|detail|profile]
// Full captures the real lifecycle, accessibility variants, details, zoom and four illustrative halts.
// Source hashes make concurrent renderer changes visible in the resulting evidence.
const project = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const output = process.argv[2] ?? join(tmpdir(), "anima-tree-captures");
const mode = process.argv[3] ?? "full";
const haltes = ["La graine", "L’éclosion", "Les premières racines", "La première pousse", "Le jeune arbre", "Le déploiement", "L’arbre de vie", "La pleine lumière"];
const samples = ["seed", "birth", "leaf-low", "leaf-high", "leaf-full", "radiant", "mixed", "dense", "error", "reserved"];
const sourceFiles = ["render/arbre/MoteurArbreLunaire.ts", "render/arbre/geometrie.ts", "render/arbre/ArbreLunaire.tsx", "render/arbre/ArbreInteractif.tsx", "render/arbre/ComprendreEvolution.tsx", "render/arbre/GraineAttente.tsx", "render/arbre/arbre.module.css", "render/monde.module.css"];
const sourceHashes = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, createHash("sha256").update(await readFile(resolve(project, file))).digest("hex")])));
const before = await sourceHashes();
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
let fatalError = null;
const scenarios = [
  ...samples.map((tree) => ({ tree, variant: "base", reducedMotion: "reduce" })),
  { tree: "leaf-full", variant: "dense-leaves", treeBranches: 24, reducedMotion: "reduce" },
  { tree: "dense", variant: "list", reducedMotion: "reduce" },
  { tree: "mixed", variant: "paper", reducedMotion: "reduce" },
  { tree: "radiant", variant: "paper", reducedMotion: "reduce" },
  { tree: "radiant", variant: "detail", reducedMotion: "reduce" },
  { tree: "seed", variant: "stored-list", reducedMotion: "reduce" },
  { tree: "mixed", variant: "contrast", reducedMotion: "reduce" },
  { tree: "radiant", variant: "contrast", reducedMotion: "reduce" },
  { tree: "seed", variant: "motion", reducedMotion: "no-preference" },
  { tree: "radiant", variant: "motion", reducedMotion: "no-preference" },
  { tree: "mixed", variant: "zoom", reducedMotion: "reduce" },
  ...haltes.map((halte, index) => ({ tree: "mixed", variant: `explore-${index}`, halte, reducedMotion: "reduce" })),
];
const interactiveScenarios = [
  { tree: "seed", variant: "base", reducedMotion: "reduce" },
  { tree: "mixed", variant: "base", reducedMotion: "reduce" },
  ...scenarios.filter(({ variant }) => variant === "zoom" || variant.startsWith("explore-")),
];
const failed = (result) => result.errors.length || result.viewportOverflow || result.focusRestored === false
  || result.zoom?.passed === false || result.drag?.passed === false || result.exploration?.passed === false || result.profile?.idlePaintCalls > 0;
try {
  for (const width of [390, 768, 1440]) {
    const selected = mode === "quick"
      ? width === 390
        ? [{ tree: "mixed", variant: "base", reducedMotion: "reduce" }]
        : width === 1440
          ? [{ tree: "radiant", variant: "base", reducedMotion: "reduce" }, { tree: "leaf-full", variant: "canopy", treeBranches: 13, reducedMotion: "reduce" }]
          : []
      : mode === "ui" ? (width === 768 ? [] : interactiveScenarios)
        : mode === "detail" ? (width === 390 ? scenarios.filter(({ variant }) => variant === "detail") : [])
        : mode === "profile" ? (width === 768 ? [] : [{ tree: width === 390 ? "mixed" : "dense", variant: "profile", reducedMotion: "no-preference" }])
          : scenarios;
    for (const scenario of selected) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: scenario.reducedMotion });
      const errors = [];
      const requests = [];
      if (scenario.variant === "profile") await page.addInitScript(() => {
        window.__treePaint = { calls: 0, apiDurationMs: 0 };
        for (const method of ["clearRect", "fill", "stroke", "drawImage"]) {
          const original = CanvasRenderingContext2D.prototype[method];
          CanvasRenderingContext2D.prototype[method] = function (...args) {
            const start = performance.now();
            try { return original.apply(this, args); }
            finally { window.__treePaint.calls += 1; window.__treePaint.apiDurationMs += performance.now() - start; }
          };
        }
      });
      const cdp = scenario.variant === "profile" ? await page.context().newCDPSession(page) : null;
      if (cdp) await cdp.send("Performance.enable");
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await page.route("**/api/**", (route) => {
        requests.push({ method: route.request().method(), path: new URL(route.request().url()).pathname });
        if (route.request().method() === "GET" && new URL(route.request().url()).pathname === "/api/anam/plan") {
          return route.fulfill({ status: 200, contentType: "application/json", body: '{"plan":[]}' });
        }
        return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
      });
      const query = new URLSearchParams({ tree: scenario.tree });
      if (scenario.treeBranches) query.set("treeBranches", String(scenario.treeBranches));
      if (scenario.variant === "list" || scenario.variant === "stored-list") query.set("treeView", "list");
      await page.goto(`http://127.0.0.1:4179/?${query}`, { waitUntil: "domcontentloaded" });
      const region = page.getByRole("region", { name: "Mon évolution", exact: true });
      await region.waitFor();
      await page.getByRole("navigation", { name: "Régions" }).getByRole("button", { name: "Mon évolution", exact: true }).click();
      if (scenario.variant === "paper") await page.getByRole("button", { name: "Passer au thème papier" }).click();
      if (scenario.variant === "detail") {
        await region.getByRole("button", { name: "Branche : Me faire confiance", exact: true }).click();
        await region.getByRole("group", { name: "Fiche de branche" }).waitFor();
      }
      if (scenario.variant === "contrast") await page.evaluate(() => { document.documentElement.dataset.a11y = "contraste"; });
      let exploration = null;
      if (scenario.halte) {
        await region.getByRole("button", { name: "Comprendre mon évolution", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Comprendre mon évolution", exact: true });
        await dialog.waitFor();
        const group = dialog.getByRole("group", { name: "Choisir une illustration" });
        const label = `Voir l’illustration ${String(haltes.indexOf(scenario.halte) + 1).padStart(2, "0")} : ${scenario.halte}`;
        await group.getByRole("button", { name: label, exact: true }).click();
        await dialog.locator("[data-planche] img").waitFor({ state: "visible" });
        await dialog.locator("[data-planche] img").evaluate((image) => image.decode());
        exploration = {
          selected: await group.getByRole("button", { pressed: true }).getAttribute("aria-label"),
          illustration: await dialog.getByRole("img").first().getAttribute("alt"),
        };
        exploration.passed = exploration.selected === label;
      }
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      if (scenario.variant === "motion") await page.waitForTimeout(900);
      let zoom = null;
      if (scenario.variant === "zoom") {
        const transform = () => region.locator("canvas").evaluate((canvas) => getComputedStyle(canvas.parentElement).transform);
        const targetSizes = () => region.locator('button[aria-label^="Branche :"]').evaluateAll((buttons) => buttons.map((button) => {
          const bounds = button.getBoundingClientRect(); return { width: bounds.width, height: bounds.height };
        }));
        const initial = await transform();
        await region.locator("[data-commandes-arbre] button").nth(1).click();
        const enlarged = await transform();
        const enlargedTargets = await targetSizes();
        await region.locator("[data-commandes-arbre] button").nth(0).click();
        const restored = await transform();
        const restoredTargets = await targetSizes();
        zoom = { initial, enlarged, restored, enlargedTargets, restoredTargets,
          passed: initial !== enlarged && initial === restored && [...enlargedTargets, ...restoredTargets].every(({ width, height }) => width >= 43.99 && height >= 43.99) };
      }
      let profile = null;
      if (cdp) {
        await page.waitForTimeout(800);
        const initial = await cdp.send("Performance.getMetrics");
        const paintBefore = await page.evaluate(() => window.__treePaint);
        await page.waitForTimeout(1500);
        const idle = await cdp.send("Performance.getMetrics");
        const paintAfter = await page.evaluate(() => window.__treePaint);
        const value = (metrics, name) => metrics.metrics.find((metric) => metric.name === name)?.value ?? null;
        profile = { initialPaintCalls: paintBefore.calls, initialPaintApiDurationMs: paintBefore.apiDurationMs,
          initialScriptDurationMs: value(initial, "ScriptDuration") * 1000,
          initialTaskDurationMs: value(initial, "TaskDuration") * 1000,
          idleWindowMs: 1500, idlePaintCalls: paintAfter.calls - paintBefore.calls,
          idleScriptDurationMs: (value(idle, "ScriptDuration") - value(initial, "ScriptDuration")) * 1000,
          idleTaskDurationMs: (value(idle, "TaskDuration") - value(initial, "TaskDuration")) * 1000 };
      }
      const metrics = await region.evaluate((element) => {
        const rect = (node) => { const r = node?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null; };
        const canvas = [...element.querySelectorAll("canvas")].find((node) => !node.closest('[role="dialog"], dialog'));
        return {
          stage: canvas?.getAttribute("data-etape-arbre") ?? null,
          canvas: rect(canvas),
          bitmap: canvas ? { width: canvas.width, height: canvas.height } : null,
          targets: element.querySelectorAll('button[aria-label^="Branche :"]').length,
          targetMetrics: [...element.querySelectorAll('button[aria-label^="Branche :"]')].map((button) => {
            const bounds = button.getBoundingClientRect();
            const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
            return { name: button.getAttribute("aria-label"), bounds: rect(button), centerHit: hit === button || button.contains(hit) };
          }),
          text: element.innerText,
          viewportOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const filename = `tree-${width}-${scenario.tree}-${scenario.variant}.png`;
      await page.screenshot({ path: join(output, filename) });
      let focusRestored = null;
      let drag = null;
      if (scenario.variant === "detail") {
        await page.keyboard.press("Escape");
        await region.getByRole("group", { name: "Fiche de branche" }).waitFor({ state: "hidden" });
        focusRestored = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Branche : Me faire confiance");
        const branch = region.getByRole("button", { name: "Branche : Me faire confiance", exact: true });
        const bounds = await branch.boundingBox();
        const transform = () => region.locator("canvas").evaluate((canvas) => getComputedStyle(canvas.parentElement).transform);
        const initial = await transform();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width / 2 + 24, bounds.y + bounds.height / 2 + 28, { steps: 4 });
        await page.mouse.up();
        const after = await transform();
        const ficheVisible = await region.getByRole("group", { name: "Fiche de branche" }).isVisible();
        drag = { initial, after, ficheVisible, passed: initial !== after && !ficheVisible };
      }
      if (scenario.halte) {
        const dialog = page.getByRole("dialog", { name: "Comprendre mon évolution", exact: true });
        exploration.navigationHits = await dialog.evaluate(() => {
          const nav = document.querySelector('nav[aria-label="Régions"]');
          if (!nav) return [];
          return [...nav.querySelectorAll("button")].map((button) => {
            const bounds = button.getBoundingClientRect();
            const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
            return { button: button.textContent?.trim(), hit: hit?.tagName ?? null, covered: hit !== null && !nav.contains(hit) };
          });
        });
        exploration.navigationCovered = exploration.navigationHits.length > 0 && exploration.navigationHits.every(({ covered }) => covered);
        await dialog.locator("summary").filter({ hasText: "Ce que raconte mon arbre" }).click();
        const lastParagraph = dialog.locator("p").last();
        await lastParagraph.scrollIntoViewIfNeeded();
        exploration.lastTextVisible = await lastParagraph.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const dialogBounds = element.closest('[role="dialog"], dialog').getBoundingClientRect();
          return bounds.top >= Math.max(0, dialogBounds.top) - 1 && bounds.bottom <= Math.min(innerHeight, dialogBounds.bottom) + 1;
        });
        exploration.detailFilename = `tree-${width}-${scenario.tree}-${scenario.variant}-text.png`;
        await page.screenshot({ path: join(output, exploration.detailFilename) });
        exploration.passed = exploration.passed && exploration.navigationCovered && exploration.lastTextVisible;
        await page.keyboard.press("Escape");
        await page.getByRole("dialog", { name: "Comprendre mon évolution", exact: true }).waitFor({ state: "hidden" });
        focusRestored = await page.evaluate(() => document.activeElement?.textContent?.trim() === "Comprendre mon évolution");
      }
      const result = { width, ...scenario, filename, errors, requests, focusRestored, exploration, zoom, drag, profile, ...metrics };
      results.push(result);
      console.log(`${filename}: ${failed(result) ? "ERROR" : "ok"}, stage=${metrics.stage}, targets=${metrics.targets}`);
      await page.close();
    }
  }
} catch (error) {
  fatalError = error instanceof Error ? error.message : String(error);
  console.error(fatalError);
} finally {
  await browser.close();
}
const after = await sourceHashes();
const sourceChanged = sourceFiles.filter((file) => before[file] !== after[file]);
await writeFile(join(output, "tree-results.json"), JSON.stringify({ generatedAt: new Date().toISOString(), before, after, sourceChanged, fatalError, results }, null, 2));
console.log(JSON.stringify({ output, scenarios: results.length, sourceChanged, fatalError, failures: results.filter(failed).length }));
if (fatalError || results.some(failed)) process.exitCode = 1;
