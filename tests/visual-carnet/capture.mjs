import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const output = process.argv[2] ?? process.env.CARNET_SCREENSHOT_DIR ?? join(tmpdir(), "anima-carnet-captures");
const origin = "http://127.0.0.1:4179";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    // The visual fixture must never reach a data API, even when exercising controls.
    await page.route("**/api/**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    for (const theme of ["papier", "nuit", "contraste"]) {
      await page.goto(origin, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Mes univers" }).waitFor();
      const switchName = theme === "nuit" ? "Passer au thème nuit" : "Passer au thème papier";
      const themeButton = page.getByRole("button", { name: switchName });
      if (await themeButton.count()) await themeButton.click();
      if (theme === "contraste") await page.evaluate(() => { document.documentElement.dataset.a11y = "contraste"; });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(output, `home-${width}-${theme}.png`) });
      await page.getByRole("region", { name: "Aujourd’hui", exact: true }).evaluate((element) => { element.scrollTop = element.scrollHeight; });
      await page.screenshot({ path: join(output, `univers-${width}-${theme}.png`) });
      results.push({ width, theme, errors: [...errors], overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
      await page.evaluate(() => { localStorage.removeItem("anam-carnet-theme"); });
    }
    for (const state of ["empty", "error", "dense", "loading"]) {
      await page.goto(`${origin}/?state=${state}`, { waitUntil: "domcontentloaded" });
      await page.getByRole("navigation", { name: "Régions" }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(output, `home-${width}-${state}.png`) });
      if (state === "loading") {
        await page.getByRole("region", { name: "Aujourd’hui", exact: true }).evaluate((element) => { element.scrollTop = element.scrollHeight; });
        await page.screenshot({ path: join(output, `univers-${width}-${state}.png`) });
      }
      results.push({ width, state, errors: [...errors], overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(join(output, "home-results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify({ output, results }, null, 2));
if (results.some((result) => result.errors.length || result.overflow)) process.exitCode = 1;
