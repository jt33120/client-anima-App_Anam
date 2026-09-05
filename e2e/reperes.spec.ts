import { test, expect } from "@playwright/test";
import { attendreLePortail, ouvrirUnCompteNeuf, passerLeTour } from "./_entrer";

/**
 * reperes.spec.ts — LE LIEU S'EXPLIQUE, ET ÇA SE RELIT (QA manuelle du 2026-08-19)
 *
 * « Là on est lancé dans le grand bain, on comprend rien. » Le seuil disait une phrase, l'accueil
 * présentait trois noms UNE fois (H4), et rien ne se relisait ensuite. Le manque n'était pas une
 * affaire de copie : il n'existait aucun ENDROIT où revenir.
 *
 * ══ LA DEMANDE DISAIT « SUR AIDE » ═══════════════════════════════════════════════════════════
 *
 * `/aide` est la porte de secours : publique, sans compte, sans session, atteinte en détresse,
 * ouverte sur une sortie rapide et des lignes tenues par des personnes (FR-077, AD-9, AD-15). Y
 * poser le mode d'emploi AVANT les ressources ferait tomber quelqu'un en danger sur « comment ça
 * marche » avant les numéros humains. Depuis la décision du 2026-08-23, les repères sont repliés
 * APRÈS les ressources dans `/aide`, tandis que `/reperes` conserve une lecture dédiée du produit.
 */

test.describe("Repères", () => {
  test("[PARTOUT] le chemin existe depuis chaque région, et « Aide » reste le dernier", async ({
    page,
  }) => {
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await attendreLePortail(page);

    // ⚠️ AU SEUIL AUSSI. Les repères sont atteints par la porte « Aide », permanente et
    // indépendante du menu ; le mot « Repères » n'est plus un lien de la surimpression.
    await expect(
      page.getByRole("link", { name: "Aide", exact: true }),
      "le seuil n'offre aucun chemin vers l'explication",
    ).toBeVisible();

    await page.getByRole("button", { name: /commencer/i }).click();
    await passerLeTour(page);
    const barre = page.getByRole("navigation", { name: "Régions" });
    for (const region of ["Aujourd’hui", "Anam", "Mon évolution"]) {
      await barre.getByRole("button", { name: region, exact: true }).click();
      await expect(
        page.getByRole("link", { name: "Aide", exact: true }),
        `aucun chemin vers l'explication depuis « ${region} »`,
      ).toBeVisible();

      // FR-077 — la porte de secours ne cède sa place à rien, et rien ne se glisse après elle.
      const ordre = await page.evaluate(() =>
        [...document.querySelectorAll('[class*="surimpression"] a')].map((a) =>
          a.getAttribute("aria-label") ?? (a.textContent ?? "").trim(),
        ),
      );
      expect(ordre[ordre.length - 1], `dans « ${region} », « Aide » n'est plus le dernier lien`).toBe(
        "Aide",
      );
    }
  });

  test("[CE QU'ELLE EXPLIQUE] les trois dimensions, le geste, et qui écrit quoi", async ({ page }) => {
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await attendreLePortail(page);
    await page.getByRole("link", { name: "Aide", exact: true }).click();
    await page.waitForURL(/\/aide/);

    await expect(page.getByRole("heading", { name: "Aide", level: 1 })).toBeVisible();
    const panneau = page.locator("#reperes");
    await expect(panneau.getByRole("heading", { name: "Repères", level: 2 })).toBeVisible();

    // Les trois noms sont ceux de la barre : ce qu'on vient de lire est atteignable sous le même mot.
    await expect(panneau.locator("dl").getByRole("term")).toHaveText([
      "Anam",
      "Mon évolution",
      "Aujourd’hui",
    ]);

    // Le geste ajouté le même jour est EXPLIQUÉ, pas seulement disponible : un geste qu'on ne
    // découvre qu'en tâtonnant n'existe pas pour qui ne tâtonne pas.
    await expect(
      panneau.getByText(/glisser/i),
      "le glissement latéral n'est expliqué nulle part",
    ).toBeVisible();

    // FR-054/FR-086 — la frontière entre ce qu'écrit le modèle et ce qu'écrit Anima.
    const qui = panneau;
    await expect(qui.getByText(/intelligence artificielle/i)).toBeVisible();
    await expect(qui.getByText(/à la main/i)).toBeVisible();

    // On revient d'où l'on vient, sans passer par l'historique du navigateur.
    await page.getByRole("link", { name: /Retour/ }).click();
    await expect(page.getByRole("heading", { name: /^Aujourd’hui$|^Anam$|^Mon évolution$/, level: 1 })).toBeVisible();
  });

  test("[LA PORTE DE SECOURS RESTE PRIORITAIRE] ses ressources précèdent les repères", async ({
    page,
  }) => {
    // `/aide` porte aussi les repères depuis la décision du 2026-08-23, mais seulement APRÈS les
    // ressources humaines. La porte de secours reste donc ce qu'on rencontre en premier ; la page
    // dédiée `/reperes` garde, elle, une lecture du produit sans contenu de crise.
    await ouvrirUnCompteNeuf(page);

    await page.goto("/aide");
    await expect(
      page.getByRole("button", { name: /quitter/i }),
      "témoin : /aide n'est plus la porte de secours, la comparaison ne prouve rien",
    ).toBeVisible();
    const ressourcesAvantReperes = await page.evaluate(() => {
      const ressources = document.querySelector('section[aria-label="Ressources"]');
      const reperes = document.querySelector("#reperes");
      return Boolean(
        ressources &&
          reperes &&
          (ressources.compareDocumentPosition(reperes) & Node.DOCUMENT_POSITION_FOLLOWING),
      );
    });
    expect(
      ressourcesAvantReperes,
      "les repères passent avant les ressources humaines sur la porte de secours",
    ).toBe(true);

    await page.goto("/reperes");
    const reperes = (
      await page.locator('main:not([aria-hidden="true"])').innerText()
    ).toLowerCase();
    expect(
      /suicide|urgence|3114|numéro/.test(reperes),
      "/reperes s'est mise à porter des ressources de crise : elles vivent à un seul endroit (AD-9)",
    ).toBe(false);
    // Elle DÉSIGNE la porte, sans la remplacer.
    expect(
      /«\s*aide\s*»/.test(reperes),
      "/reperes ne dit nulle part où aller si ça ne va pas",
    ).toBe(true);
  });
});
