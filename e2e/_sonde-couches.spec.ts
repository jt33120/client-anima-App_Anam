import { test, expect, type Page } from "@playwright/test";
import { ouvrirUnCompteNeuf } from "./_entrer";

/**
 * _sonde-couches.spec.ts — SONDE TEMPORAIRE, SECOND TOUR : COMMENT RENDRE LES ÉTOILES GRATUITES ?
 *
 * ⚠️ CE FICHIER EST UN INSTRUMENT, PAS UNE GARDE. Il échoue volontairement — c'est le seul canal par
 * lequel ses nombres arrivent jusqu'au rapport de la CI — et il se supprime dès son verdict lu.
 *
 * ══ CE QUE LE PREMIER TOUR A ÉTABLI (2026-08-26, mesuré, plus supposé) ════════════════════════
 *
 * Référence = une halte statique du même produit.  mobile 62 im/s · bureau 61 im/s.
 *
 *                    tel quel   sans étoiles   sans arbre   sans grain
 *   mobile  seuil        5           62             8           10
 *   mobile  « Moi »     16           62             7           29
 *   bureau  seuil       48           60            60           46
 *   bureau  « Moi »     57           61            60           58
 *
 * **Retirer le champ d'étoiles rend TOUTE la vitesse de référence, sur les deux appareils.** Les
 * quatre-vingts `<span>` coûtent à eux seuls 57 des 62 images par seconde du mobile. Ce n'est plus
 * un suspect : c'est la cause, et les deux autres colonnes ne sont que du bruit de reconstruction
 * de l'arbre de couches (éteindre un élément coûte plus, pendant la mesure, que l'élément lui-même).
 *
 * ══ CE QUE CE SECOND TOUR DOIT TRANCHER ═══════════════════════════════════════════════════════
 *
 * L'explication la plus économe de ce profil : quatre-vingts éléments qui animent `opacity` sans
 * être PROMUS en couches de composition. Le navigateur les REPEINT alors à chaque trame, et
 * repeindre une étoile oblige à repeindre ce qu'il y a dessous — d'où le fait que retirer l'arbre
 * rende presque autant que retirer les étoiles au premier tour sur bureau : ce n'est pas l'arbre
 * qui coûte, c'est la SURFACE que les étoiles obligent à refaire.
 *
 * Si c'est vrai, alors `will-change: opacity` — une déclaration, aucun changement visuel, aucune
 * étoile perdue — suffit. Si c'est faux, ou si quatre-vingts couches promues dépassent le budget du
 * compositeur, il faudra en réduire le nombre, et l'image changera un peu.
 *
 * ⚠️ ON NE CHOISIT PAS ENTRE CES DEUX MONDES EN RAISONNANT. Trois hypothèses ont déjà été réfutées
 * par la mesure en vingt-quatre heures — dont une dont la prédiction écrite disait exactement
 * l'inverse de ce que la mesure a dit. Cette sonde essaie donc les cinq remèdes DANS LE MÊME
 * PASSAGE, chacun avec son témoin, et laisse les nombres trancher.
 */

/** Images par seconde sur 1,5 s de `requestAnimationFrame`. Même instrument que `fluidite.spec.ts`. */
const imagesParSeconde = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((res) => {
        let n = 0;
        const t0 = performance.now();
        const tic = () => {
          n++;
          if (performance.now() - t0 < 1500) requestAnimationFrame(tic);
          else res(Math.round((n * 1000) / (performance.now() - t0)));
        };
        requestAnimationFrame(tic);
      }),
  );

/** Ce que chaque remède injecte, et la preuve qu'il a réellement pris. */
type Remede = {
  readonly nom: string;
  readonly css: string;
  /** Rend `true` si la page montre bien l'effet attendu. Sans ça, « aucun gain » serait ambigu. */
  readonly temoin: () => boolean;
};

const REMEDES: readonly Remede[] = [
  {
    nom: "will-change",
    css: `[class*="etoile"]:not([class*="etoiles"]) { will-change: opacity; }`,
    temoin: () => {
      const e = document.querySelector('[class*="etoile"]:not([class*="etoiles"])');
      return !!e && getComputedStyle(e).willChange.includes("opacity");
    },
  },
  {
    nom: "translateZ",
    css: `[class*="etoile"]:not([class*="etoiles"]) { transform: translateZ(0); will-change: transform, opacity; }`,
    temoin: () => {
      const e = document.querySelector('[class*="etoile"]:not([class*="etoiles"])');
      return !!e && getComputedStyle(e).transform !== "none";
    },
  },
  {
    nom: "40 étoiles",
    css: `[class*="etoiles"] > *:nth-child(n+41) { display: none; }`,
    temoin: () =>
      [...document.querySelectorAll('[class*="etoiles"] > *')].filter(
        (n) => getComputedStyle(n).display !== "none",
      ).length === 40,
  },
  {
    nom: "16 étoiles",
    css: `[class*="etoiles"] > *:nth-child(n+17) { display: none; }`,
    temoin: () =>
      [...document.querySelectorAll('[class*="etoiles"] > *')].filter(
        (n) => getComputedStyle(n).display !== "none",
      ).length === 16,
  },
  {
    // Le TÉMOIN HAUT de la mesure : on sait déjà qu'il rend 62. S'il ne le rend pas ce coup-ci,
    // c'est la machine qui a changé, pas le remède — et aucun des quatre autres nombres ne veut
    // rien dire. Un point de calage coûte deux secondes et sauve une lecture entière.
    nom: "aucune animation",
    css: `[class*="etoile"]:not([class*="etoiles"]) { animation: none !important; }`,
    temoin: () => {
      const e = document.querySelector('[class*="etoile"]:not([class*="etoiles"])');
      return !!e && getComputedStyle(e).animationName === "none";
    },
  },
];

/** Applique un remède, mesure, retire — et rend `null` si son témoin n'a pas tenu. */
async function avecLeRemede(page: Page, r: Remede): Promise<number | null> {
  await page.evaluate((css) => {
    const style = document.createElement("style");
    style.id = "sonde-remede";
    style.textContent = css;
    document.head.appendChild(style);
  }, r.css);

  // Le témoin est sérialisé et évalué DANS la page : Playwright accepte une expression texte, ce
  // qui évite de reconstruire une fonction côté navigateur.
  const aPris = (await page.evaluate(`(${r.temoin.toString()})()`)) as boolean;

  if (!aPris) {
    await page.evaluate(() => document.getElementById("sonde-remede")?.remove());
    return null;
  }

  await page.waitForTimeout(600);
  const im = await imagesParSeconde(page);
  await page.evaluate(() => document.getElementById("sonde-remede")?.remove());
  await page.waitForTimeout(600);
  return im;
}

test("[SONDE 2] quel remède rend les étoiles gratuites — à supprimer une fois lue", async ({ page }) => {
  // Cinq remèdes, chacun encadré de deux pauses et d'une mesure de 1,5 s, plus l'ouverture d'un
  // compte : très au-delà des 45 s par défaut. La leçon du premier tour, qui les a dépassées.
  test.setTimeout(240_000);

  await ouvrirUnCompteNeuf(page);

  await page.goto("/aide");
  await page.waitForTimeout(900);
  const reference = await imagesParSeconde(page);

  // ⚠️ ON MESURE AU SEUIL, ET C'EST LE PIRE ENDROIT — DONC LE BON. C'est là que le mobile rend
  // 5 im/s : un remède qui n'y fait rien ne sert à rien ailleurs.
  await page.goto("/");
  await page.waitForTimeout(1400);

  // Témoin d'entrée : les étoiles sont bien là et bien animées. Sans lui, cinq remèdes sans effet
  // seraient indiscernables d'une page qui n'a jamais eu d'étoiles.
  const combien = await page.evaluate(
    () => document.querySelectorAll('[class*="etoiles"] > *').length,
  );
  expect(combien, "aucune étoile à l'écran : les cinq mesures qui suivent ne prouveraient rien").toBeGreaterThan(60);

  const telQuel = await imagesParSeconde(page);

  const releves: string[] = [];
  for (const r of REMEDES) {
    const im = await avecLeRemede(page, r);
    releves.push(`${r.nom} ${im === null ? "TÉMOIN ROMPU" : im}`);
  }

  // ⚠️ ÉCHEC DÉLIBÉRÉ : seul canal vers le rapport.
  expect(
    [],
    `SONDE 2 — référence /aide ${reference} im/s · ${combien} étoiles · seuil tel quel ${telQuel} im/s\n` +
      `  ${releves.join(" | ")}`,
  ).toEqual(["ceci échoue exprès : lire les deux lignes ci-dessus, puis supprimer ce fichier"]);
});
