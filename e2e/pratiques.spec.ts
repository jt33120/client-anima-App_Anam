import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { attendreLePortail, entrerDansLaRegion, ouvrirUnCompteNeuf } from "./_entrer";
import { PRATIQUES } from "../lib/domain/pratiques";
import { TITRE_HALTE_BIG_FIVE } from "../lib/domain/big-five-items";

async function capturerAuxTroisLargeurs(page: Page, testInfo: TestInfo, nom: string) {
  for (const largeur of [390, 768, 1440]) {
    await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 1000 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${nom}-${largeur}.png`), fullPage: true });
  }
}

test.describe("Pratiques", () => {
  test("un compte choisit une pratique et revient vers un brouillon Anam sans envoyer sa note", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const erreurs: string[] = [];
    page.on("pageerror", (error) => erreurs.push(error.message));
    await ouvrirUnCompteNeuf(page);
    await entrerDansLaRegion(page, "Aujourd’hui");
    await page.getByRole("link", { name: /^Pratiques/ }).click();
    await expect(page).toHaveURL(/\/pratiques$/);
    await expect(page.getByRole("heading", { level: 1, name: "Pratiques" })).toBeVisible();
    for (const pratique of PRATIQUES) {
      await expect(page.getByRole("link", { name: pratique.titre, exact: true })).toHaveAttribute("href", pratique.href);
    }
    await capturerAuxTroisLargeurs(page, testInfo, "catalogue");

    await page.getByRole("link", { name: "Respirer doucement", exact: true }).click();
    await page.getByRole("button", { name: "Commencer", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Te poser" })).toBeFocused();
    await page.getByRole("button", { name: "Étape suivante" }).click();
    await page.getByRole("button", { name: "Lancer le minuteur" }).click();
    await page.getByRole("button", { name: "Mettre en pause" }).click();
    await expect(page.getByRole("heading", { name: "Laisser le souffle se faire" })).toBeVisible();
    await capturerAuxTroisLargeurs(page, testInfo, "lecteur");
    await page.getByRole("button", { name: "Étape suivante" }).click();
    await page.getByRole("button", { name: "Terminer l’exercice" }).click();
    await expect(page.getByRole("heading", { name: "Prends le temps de revenir" })).toBeFocused();
    const note = "Une note privée de test, jamais envoyée";
    await page.getByRole("textbox", { name: /Un mot pour toi/ }).fill(note);
    await expect(page.getByRole("link", { name: /En parler à Anam/ })).toHaveAttribute("href", "/?pratique=respiration-douce");

    const envois: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && new URL(request.url()).pathname === "/api/anam/message") envois.push(request.postData() ?? "");
    });
    await page.getByRole("link", { name: /En parler à Anam/ }).click();
    await attendreLePortail(page);
    const champ = page.getByRole("textbox", { name: /ton message à anam/i });
    await expect(champ).toBeVisible();
    await expect(champ).toHaveValue(/Respirer doucement/);
    expect(await champ.inputValue()).not.toContain(note);
    expect(envois).toEqual([]);
    expect(erreurs).toEqual([]);
  });

  test("le catalogue et les exercices exigent une session", async ({ page }) => {
    for (const destination of ["/pratiques", "/pratiques/pause-attention"]) {
      await page.goto(destination);
      await expect(page).toHaveURL(/\/entrer(?:\?|$)/);
    }
  });

  test("une proposition reçue dans le chat ouvre le questionnaire existant", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await ouvrirUnCompteNeuf(page);
    await entrerDansLaRegion(page, "Anam");

    // Le navigateur et les écrans sont réels ; seul le transport de cette réponse est simulé.
    // Ce scénario prouve le parcours demande → carte → destination, pas l’appel natif du modèle.
    const demandes: string[] = [];
    await page.route("**/api/anam/message", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      demandes.push(route.request().postData() ?? "");
      const trames = [
        { t: "delta", c: "Si tu le souhaites, tu peux explorer ces repères pour mieux te connaître." },
        { t: "pratique", pratiqueId: "big-five" },
        { t: "fin" },
      ];
      await route.fulfill({ status: 200, contentType: "application/x-ndjson", body: `${trames.map((trame) => JSON.stringify(trame)).join("\n")}\n` });
    });

    const champ = page.getByRole("textbox", { name: /ton message à anam/i });
    await champ.fill("Peux-tu me proposer un questionnaire pour mieux me connaître ?");
    await page.getByRole("button", { name: /envoyer/i }).click();
    const pratique = PRATIQUES.find((p) => p.id === "big-five")!;
    const carte = page.getByRole("complementary", { name: `Pratique proposée : ${pratique.titre}` });
    await expect(carte).toBeVisible();
    await expect(carte.getByRole("heading", { name: pratique.titre })).toBeVisible();
    await expect(carte.getByRole("link", { name: "Explorer ces repères" })).toHaveAttribute("href", "/big-five?de=anam");
    expect(demandes).toHaveLength(1);
    expect(new URL(page.url()).pathname).toBe("/");
    await champ.blur();
    for (const largeur of [390, 768, 1440]) {
      await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 1000 });
      await carte.scrollIntoViewIfNeeded();
      await expect(carte).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`carte-chat-transport-simule-${largeur}.png`), fullPage: true });
    }
    await carte.getByRole("link", { name: "Explorer ces repères" }).click();
    await expect(page).toHaveURL(/\/big-five\?de=anam$/);
    await expect(page.getByRole("heading", { level: 1, name: TITRE_HALTE_BIG_FIVE })).toBeVisible();
  });
});
