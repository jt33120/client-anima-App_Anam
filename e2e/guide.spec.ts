import { test, expect, type Page } from "@playwright/test";
import { ouvrirUnCompteNeuf } from "./_entrer";

/**
 * guide.spec.ts — LE TOUR GUIDÉ DÉSIGNE VRAIMENT (retour du 2026-08-20)
 *
 * « Le tutoriel doit me guider dans l'application, pas être juste une liste de texte, elle doit
 * mettre en évidence certaines parties, entourer, l'utilisateur clique sur suivant et on avance. »
 *
 * ══ CE QUI SE MESURE, ET POURQUOI DES BOÎTES ═════════════════════════════════════════════════
 *
 * La différence entre un tour et cinq boîtes de texte n'est pas dans la copie : elle est dans le
 * fait que le projecteur COÏNCIDE avec l'élément dont on parle. Une garde qui vérifierait la
 * présence des textes serait verte sur six modales posées au hasard — c'est-à-dire sur l'objet
 * qu'on refuse. On mesure donc des rectangles : celui du trou contre celui de la cible.
 */

const dialogue = (page: Page) => page.getByRole("dialog");

/** La graine de l'étape 0 de l'arbre — même sélecteur que la cible du tour (`copie-guide.ts`). */
const GRAINE = "[class*='graineAttente']";

/** Le rectangle du trou de projecteur, et celui de l'élément qu'il prétend désigner. */
const coincidence = (page: Page, selecteurCible: string) =>
  page.evaluate((sel) => {
    const trou = document.querySelector("[class*='_trou']");
    const cible = document.querySelector(sel);
    if (!trou || !cible) return null;
    const a = trou.getBoundingClientRect();
    const b = cible.getBoundingClientRect();
    return {
      ecartTop: Math.abs(a.top - b.top),
      ecartBas: Math.abs(a.bottom - b.bottom),
      ecartGauche: Math.abs(a.left - b.left),
      ecartDroite: Math.abs(a.right - b.right),
    };
  }, selecteurCible);

async function arriverDansLeMonde(page: Page) {
  await ouvrirUnCompteNeuf(page);
  await page.goto("/");
  await page.getByRole("button", { name: /commencer/i }).click();
  await page.waitForTimeout(1600);
}

test.describe("Le tour guidé", () => {
  test("[IL S'OUVRE SEUL] à la première arrivée, sans avoir été cherché", async ({
    page,
  }) => {
    await arriverDansLeMonde(page);
    await expect(
      dialogue(page),
      "personne ne va chercher un tutoriel le jour où il en a le plus besoin",
    ).toBeVisible();
    await expect(
      dialogue(page).getByRole("heading", { level: 2 }),
    ).toBeVisible();
  });

  test("[IL DÉSIGNE] le projecteur coïncide avec l'élément dont il parle", async ({
    page,
  }) => {
    // ⚠️ C'EST LA PROPRIÉTÉ QUI SÉPARE UN TOUR D'UNE PILE DE MODALES. Sans elle, cinq boîtes de
    // texte posées au centre de l'écran passeraient toutes les autres gardes de ce fichier.
    await arriverDansLeMonde(page);
    await dialogue(page).getByRole("button", { name: "Suivant" }).click();
    await page.waitForTimeout(1100);

    await expect(
      dialogue(page).getByRole("heading", { name: "Ta barre" }),
    ).toBeVisible();
    const e = await coincidence(page, "nav[aria-label='Régions']");
    expect(e, "aucun projecteur, ou aucune barre à désigner").not.toBeNull();
    // Le trou est ÉLARGI d'un souffle (8 px) : collé au pixel, il étrangle l'élément.
    for (const [nom, valeur] of Object.entries(e!)) {
      expect(
        valeur,
        `le projecteur est à côté de sa cible (${nom} = ${valeur} px)`,
      ).toBeLessThanOrEqual(14);
    }
  });

  test("[IL NE CACHE PAS CE QU'IL MONTRE] la bulle ne recouvre jamais le projecteur", async ({
    page,
  }) => {
    // ⚠️ NÉ D'UN DÉFAUT MESURÉ. La bulle se plaçait avec une hauteur SUPPOSÉE (232 px) : dès qu'un
    // texte passait à cinq lignes, elle débordait sur l'élément qu'elle désignait — donc sur la
    // barre, dans l'étape qui parle de la barre. Le texte est de la copie : il changera encore.
    await arriverDansLeMonde(page);
    const chevauchements: string[] = [];
    const designees: string[] = [];
    const tropLarges: string[] = [];
    let coincidenceGraine: Awaited<ReturnType<typeof coincidence>> = null;
    for (let i = 0; i < 6; i++) {
      const r = await page.evaluate(() => {
        const trou = document.querySelector("[class*='_trou']");
        const bulle = document.querySelector("[class*='_bulle']");
        const titre = bulle?.querySelector("h2")?.textContent ?? "?";
        if (!trou || !bulle) return null;
        const a = trou.getBoundingClientRect();
        const b = bulle.getBoundingClientRect();
        if (a.width < 4) return null; // étape sans cible : la bulle EST au centre, c'est voulu
        const recouvre =
          a.top < b.bottom &&
          a.bottom > b.top &&
          a.left < b.right &&
          a.right > b.left;
        // L'AIRE du trou, rapportée à celle du cadre — pas sa hauteur. Voir la garde plus bas.
        return {
          titre,
          recouvre,
          part: (a.width * a.height) / (window.innerWidth * window.innerHeight),
        };
      });
      if (r) {
        designees.push(r.titre);
        if (r.recouvre) chevauchements.push(r.titre);
        if (r.part > 0.6) tropLarges.push(`${r.titre} (${Math.round(r.part * 100)} %)`);
        // La désignation de la graine est MESURÉE, pas déduite du titre de la bulle : `designees`
        // ne lit que la copie, et un sélecteur qui viserait un autre élément de l'arbre afficherait
        // le même titre sans que rien ne rougisse. Même contrôle et même tolérance que « Ta barre ».
        if (r.titre === "Ta graine") coincidenceGraine = await coincidence(page, GRAINE);
      }
      const suivant = dialogue(page).getByRole("button", {
        name: /Suivant|J’ai compris/,
      });
      if (!(await suivant.count())) break;
      await suivant.click();
      await page.waitForTimeout(1100);
    }
    expect(
      chevauchements,
      `la bulle recouvre ce qu’elle désigne : ${chevauchements.join(", ")}`,
    ).toEqual([]);
    // ⚠️ ET LA GARDE QUI EMPÊCHE CE TEST DE SE VIDER. « Aucun chevauchement » est AUSSI vrai quand
    // l'étape ne s'affiche plus : `Guide.tsx` franchit sans bruit une étape dont la cible est
    // absente. Le correctif du 2026-09-05 change précisément cette cible — si elle se démonte un
    // jour, on veut une ligne rouge, pas un test vert sur un tour amputé.
    expect(
      designees,
      `le tour n’a pas désigné « Ta graine » : étapes vues = ${designees.join(", ") || "aucune"}`,
    ).toContain("Ta graine");

    // ⚠️ UN PROJECTEUR QUI ÉCLAIRE TOUT NE DÉSIGNE PLUS RIEN — ET C'EST L'AIRE QUI LE DIT, PAS LA
    // HAUTEUR. Première version de cette garde, le 2026-09-05 : `hauteur / hauteur du cadre`. Elle
    // a rougi le jour même sur `bureau › Ta barre`, et à raison de sa mesure — au-delà de 1024 px,
    // `nav[aria-label='Régions']` n'est plus la barre du bas mais un rail VERTICAL qui prend toute
    // la hauteur (`render/monde.module.css`, et `e2e/barre-basse.spec.ts` mesure déjà
    // `nav.height > innerHeight * 0.8`). Un rail de 134 px de large sur 900 de haut est une
    // désignation parfaitement honnête ; mesurée sur un seul axe, elle valait 100 %.
    //
    // L'aire sépare les deux sans ambiguïté : le rail bureau et la barre mobile pèsent moins de
    // 10 % du cadre, la graine moins de 1 %, tandis que `.canevas` — la cible morte qui a causé
    // tout ceci — en occupait 70 à 81 % sur toute la largeur.
    //
    // ⚠️ ET ELLE S'ACCUMULE AU LIEU DE LEVER DANS LA BOUCLE. Posée comme un `expect` à l'intérieur,
    // elle tuait le test à la deuxième étape : les deux gardes ci-dessus n'étaient alors JAMAIS
    // évaluées sur bureau, et l'échec se glissait dans la tolérance que l'ancien venait de libérer
    // — invisible pour le comparateur, qui compte par fichier (`scripts/e2e-ligne-de-base.mjs`).
    expect(
      tropLarges,
      `un projecteur éclaire presque tout le cadre au lieu de désigner : ${tropLarges.join(", ")}`,
    ).toEqual([]);

    expect(
      coincidenceGraine,
      "l’étape « Ta graine » n’a pas trouvé la graine : le projecteur ne coïncide avec rien",
    ).not.toBeNull();
    for (const [nom, valeur] of Object.entries(coincidenceGraine!)) {
      expect(
        valeur,
        `le projecteur de « Ta graine » est à côté de la graine (${nom} = ${valeur} px)`,
      ).toBeLessThanOrEqual(14);
    }
  });

  test("[IL VOYAGE] « Suivant » emmène dans les autres régions, puis se termine", async ({
    page,
  }) => {
    await arriverDansLeMonde(page);
    const regions = new Set<string>();
    for (let i = 0; i < 8; i++) {
      regions.add(
        (await page.evaluate(
          () =>
            [...document.querySelectorAll("section[aria-label]")]
              .filter((s) => !s.hasAttribute("inert"))
              .map((s) => s.getAttribute("aria-label"))[0] ?? "?",
        )) ?? "?",
      );
      const suivant = dialogue(page).getByRole("button", {
        name: /Suivant|J’ai compris/,
      });
      if (!(await suivant.count())) break;
      await suivant.click();
      await page.waitForTimeout(1100);
    }
    // ⚠️ LES DEUX CÔTÉS SONT TRIÉS (2026-08-26). L'attendu était `["Accueil", "Anam", "L'arbre"]` —
    // déjà dans l'ordre alphabétique, donc identique au trié PAR COÏNCIDENCE. Le renommage en
    // « Moi » a défait la coïncidence, et ce test a rougi sur un tour parfaitement correct.
    // Un `.sort()` d'un seul côté est une comparaison qui marche tant que l'alphabet coopère.
    expect(
      [...regions].sort(),
      "le tour reste sur un seul écran : il explique au lieu de guider",
    ).toEqual(["Aujourd’hui", "Anam", "Mon arbre"].sort());
    await expect(dialogue(page), "le tour ne se termine jamais").toHaveCount(0);
  });

  test("[IL NE REVIENT PAS SEUL] mais il se refait depuis l’aide", async ({
    page,
  }) => {
    await arriverDansLeMonde(page);
    await dialogue(page)
      .getByRole("button", { name: "Passer le tour" })
      .click();
    await expect(dialogue(page)).toHaveCount(0);

    await page.waitForTimeout(1200);
    await page.reload();
    await page.waitForTimeout(1600);
    await expect(
      dialogue(page),
      "une aide qu’on ne peut pas faire taire cesse d’en être une",
    ).toHaveCount(0);

    // ⚠️ CE TEST CLIQUAIT LE MAUVAIS LIEN PENDANT DES JOURS, ET IL LE FAISAIT SANS BRUIT
    // (mesuré le 2026-09-05). Il cherchait `getByRole("link", { name: "Repères" })`. Repères a été
    // replié dans `/aide` le 2026-08-23 : plus aucun lien ne porte ce nom. Mais Playwright compare
    // par SOUS-CHAÎNE quand on ne dit pas `exact` — et la porte d'univers « Psychologie » porte
    // pour accroche « Ton ennéagramme et des repères dont la méthode reste visible »
    // (`lib/domain/univers-moi.ts`). Le locator résolvait donc cette porte, le clic RÉUSSISSAIT, et
    // le test quittait la scène vers `/psychologie` — d'où l'expiration sur la ligne SUIVANTE, pas
    // sur celle-ci. C'est aussi pourquoi `tests/e2e-libelles-vivants.test.ts` n'a rien vu : le
    // libellé existe bel et bien dans le produit, simplement ailleurs.
    //
    // On passe donc par la porte de secours PERMANENTE (`render/surimpression.tsx`,
    // `aria-label="Aide"`, FR-077), et `exact` ferme la classe : plus aucun locator de ce fichier
    // ne peut se recentrer par accident sur un texte qui contient le mot cherché.
    await page.getByRole("link", { name: "Aide", exact: true }).click();
    await page.getByRole("link", { name: /Faire le tour/ }).click();
    await page.waitForTimeout(1600);
    await expect(
      dialogue(page),
      "le tour ne se relance pas depuis Repères",
    ).toBeVisible();
    // ⚠️ ET L'URL EST NETTOYÉE : sans ça, un rechargement — ou un lien partagé — relance le tour
    // indéfiniment.
    expect(
      new URL(page.url()).search,
      "le paramètre `tour` reste dans l’URL",
    ).toBe("");
  });

  test("[ÉCHAP FERME] une surimpression bloquante sans sortie au clavier est un piège", async ({
    page,
  }) => {
    await arriverDansLeMonde(page);
    await expect(dialogue(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialogue(page)).toHaveCount(0);
  });
});
