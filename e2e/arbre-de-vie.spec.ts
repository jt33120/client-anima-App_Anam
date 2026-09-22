import { test, expect, type Page } from "@playwright/test";
import { ouvrirUnCompteNeuf } from "./_entrer";
import {
  TITRE_HALTE,
  TITRE_TRIANGLE,
  TITRE_QUALITES,
  TITRE_METHODE,
  NAISSANCE_ABSENTE,
} from "../lib/domain/copie-arbre-de-vie";

/**
 * arbre-de-vie.spec.ts — LA HALTE DANS UN VRAI NAVIGATEUR.
 *
 * ⚠️ CE QUE JSDOM NE PEUT PAS MESURER, ET QUI EST TOUT L'INTÉRÊT DE CE FICHIER : la géométrie. Les
 * sept prises du dessin sont posées en POURCENTAGE par-dessus un SVG, et jsdom ne calcule aucune
 * boîte. Une ancre qui aurait dérivé hors du cadre, ou deux cibles qui se recouvrent, ne se voient
 * qu'ici. Le reste (le contrat d'ancre, les absences, FR-031) est déjà tenu par
 * `tests/rendu/arbre-de-vie.test.tsx`, qui coûte des millisecondes au lieu d'une minute.
 *
 * ⚠️ LES LIBELLÉS SONT IMPORTÉS, JAMAIS RECOPIÉS. Le 2026-09-04, 90 tests sur 104 ont échoué sur un
 * seul libellé renommé et cherché à la main. `tests/e2e-libelles-vivants.test.ts` garde la règle.
 */

/** La halte ne s'atteint qu'authentifiée : sans session, c'est la porte d'entrée. */
async function allerSurLaHalte(page: Page) {
  await page.goto("/arbre-de-vie");
  await expect(page.getByRole("heading", { level: 1, name: TITRE_HALTE })).toBeVisible();
}

// ⚠️ LE NOM DU BLOC NE DIT PAS « L’arbre » : c’est l’ANCIEN nom de la région « Mon évolution »,
// et `tests/scene-modele.test.ts` refuse qu’il survive dans `e2e/` — une spec qui cherche un nom
// de région disparu attend quarante-cinq secondes avant d’échouer sans rien dire.
test.describe("Ton arbre de vie", () => {
  test("hors session, la halte renvoie à la porte d’entrée", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/arbre-de-vie");
    await expect(page).toHaveURL(/\/entrer/);
  });

  test("un compte neuf voit la halte, ses sept prises, et aucune ne sort du cadre", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const erreurs: string[] = [];
    page.on("pageerror", (error) => erreurs.push(error.message));

    await ouvrirUnCompteNeuf(page);
    await allerSurLaHalte(page);

    // Un compte neuf n'a pas encore donné sa date de naissance dans tous les parcours : la halte
    // doit alors le DIRE, et ne pas dessiner d'arbre vide. Les deux états sont légitimes ici.
    const sansNaissance = await page.getByText(NAISSANCE_ABSENTE).isVisible().catch(() => false);
    if (sansNaissance) {
      await expect(page.locator("svg[role='img']")).toHaveCount(0);
      expect(erreurs, `erreurs de page : ${erreurs.join(" | ")}`).toEqual([]);
      return;
    }

    await expect(page.getByRole("heading", { name: TITRE_TRIANGLE })).toBeVisible();
    await expect(page.getByRole("heading", { name: TITRE_QUALITES })).toBeVisible();
    await expect(page.getByText(TITRE_METHODE)).toBeVisible();

    const figure = page.locator("figure").first();
    const prises = figure.locator("a[href^='#']");
    await expect(prises).toHaveCount(7);

    // ── LA MESURE QUE SEUL UN NAVIGATEUR PEUT FAIRE ──────────────────────────────────────────
    const cadre = (await figure.boundingBox())!;
    for (let i = 0; i < 7; i++) {
      const boite = (await prises.nth(i).boundingBox())!;
      expect(boite.width, "une prise est sous la cible tactile").toBeGreaterThanOrEqual(44);
      expect(boite.height, "une prise est sous la cible tactile").toBeGreaterThanOrEqual(44);
      const centreX = boite.x + boite.width / 2;
      const centreY = boite.y + boite.height / 2;
      expect(centreX, "une prise est sortie du cadre par la gauche").toBeGreaterThanOrEqual(cadre.x);
      expect(centreX, "une prise est sortie du cadre par la droite").toBeLessThanOrEqual(
        cadre.x + cadre.width,
      );
      expect(centreY, "une prise est sortie du cadre par le haut").toBeGreaterThanOrEqual(cadre.y);
      expect(centreY, "une prise est sortie du cadre par le bas").toBeLessThanOrEqual(
        cadre.y + cadre.height,
      );
    }

    // Toucher une prise amène à sa section. C'est le geste que la halte promet.
    const ancre = await prises.first().getAttribute("href");
    await prises.first().click();
    await expect(page.locator(ancre!)).toBeInViewport();

    for (const largeur of [390, 768, 1440]) {
      await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 1000 });
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        )
        .toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`arbre-de-vie-${largeur}.png`),
        fullPage: true,
      });
    }

    expect(erreurs, `erreurs de page : ${erreurs.join(" | ")}`).toEqual([]);
  });
});
