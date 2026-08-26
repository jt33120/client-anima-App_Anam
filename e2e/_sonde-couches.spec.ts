import { test, expect, type Page } from "@playwright/test";
import { ouvrirUnCompteNeuf, passerLeTour } from "./_entrer";

/**
 * _sonde-couches.spec.ts — SONDE TEMPORAIRE : QUELLE COUCHE COÛTE LES TRAMES ? (2026-08-26)
 *
 * ⚠️ CE FICHIER EST UN INSTRUMENT, PAS UNE GARDE. Il est destiné à être SUPPRIMÉ dès que son
 * verdict est lu. Il échoue volontairement, parce que c'est la seule façon dont le comparateur de
 * la CI imprime ses nombres : un test vert ne dit rien dans le rapport JSON.
 *
 * ══ POURQUOI ══════════════════════════════════════════════════════════════════════════════════
 *
 * `fluidite.spec.ts` mesure un coût par région, et le mesure bien. Mais il ne dit pas D'OÙ vient
 * le coût, et les trois expériences menées le 2026-08-26 ont montré que je ne sais pas le deviner :
 *   • le `drop-shadow` de l'arbre — soupçonné, mesuré, INNOCENTÉ (5 → 6 im/s) ;
 *   • le `mix-blend-mode` du grain — CONFIRMÉ, et il ne figurait même pas dans mon inventaire ;
 *   • le tampon du canevas — réduit de 2816 à 416 px : la prédiction écrite disait « le seuil et
 *     Anam montent » et la mesure a dit exactement l'inverse (ce sont Moi et Mon arbre, où la
 *     couche est à `opacity: 0`, qui sont passés de 11 à 16).
 *
 * Trois hypothèses, une seule juste, et à chaque fois une poussée entière pour l'apprendre. Docker
 * étant éteint sur cette machine, la CI est le seul instrument : autant lui faire éteindre chaque
 * couche À SON TOUR dans le même passage, plutôt qu'une hypothèse par poussée.
 *
 * ══ CE QU'IL RESTE À EXPLIQUER ════════════════════════════════════════════════════════════════
 *
 * Sur mobile, une région où l'arbre est INVISIBLE (`opacity: 0`) plafonne à 16 im/s. Rien n'y est
 * peint de la scène, et pourtant il manque les trois quarts des trames. Quelque chose tourne en
 * permanence, sur toutes les régions. Le seul candidat visible en CSS est le champ d'étoiles :
 * QUATRE-VINGTS `<span>`, chacun portant sa propre animation `opacity` infinie — donc, très
 * probablement, quatre-vingts couches de composition à recomposer à chaque trame.
 *
 * ⚠️ MAIS C'EST UNE HYPOTHÈSE, ET LES DEUX PREMIÈRES ÉTAIENT FAUSSES. D'où cette sonde.
 *
 * ══ CE QUI REND LA MESURE CONCLUSIVE ══════════════════════════════════════════════════════════
 *
 * Chaque suppression est un SEUL changement par rapport au relevé de référence, et chacune porte
 * son TÉMOIN : on vérifie que l'élément existait AVANT et qu'il est réellement devenu invisible
 * APRÈS. Sans ce témoin, « éteindre la couche n'a rien changé » est indiscernable de « le sélecteur
 * ne visait rien » — c'est exactement la panne du parcours au clavier trouvée hier, où une boucle
 * qui ne s'arrêtait nulle part concluait qu'une page était inatteignable.
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

/**
 * Éteint une couche, MESURE, puis rallume — et renvoie `null` si le témoin n'a pas tenu.
 *
 * `display: none` plutôt que `opacity: 0` : une couche à opacité nulle est toujours composée, et
 * c'est précisément ce qu'on cherche à chiffrer. On veut la retirer de l'arbre de rendu.
 */
async function sansLaCouche(page: Page, selecteur: string): Promise<number | null> {
  const present = await page.evaluate((s) => document.querySelectorAll(s).length, selecteur);
  if (present === 0) return null; // le sélecteur ne visait rien : la mesure ne prouverait rien.

  await page.evaluate((s) => {
    const style = document.createElement("style");
    style.id = "sonde-extinction";
    style.textContent = `${s} { display: none !important; }`;
    document.head.appendChild(style);
  }, selecteur);

  const eteint = await page.evaluate(
    (s) => [...document.querySelectorAll(s)].every((n) => getComputedStyle(n).display === "none"),
    selecteur,
  );
  if (!eteint) {
    await page.evaluate(() => document.getElementById("sonde-extinction")?.remove());
    return null; // la règle n'a pas pris : idem.
  }

  await page.waitForTimeout(500);
  const im = await imagesParSeconde(page);
  await page.evaluate(() => document.getElementById("sonde-extinction")?.remove());
  await page.waitForTimeout(500);
  return im;
}

const ETOILES = '[class*="etoiles"]';
const ARBRE = '[class*="arbreMonde"]';
const GRAIN = '[class*="grain"]';

/** Les quatre relevés d'un même endroit : tel quel, puis chaque couche éteinte à son tour. */
async function releverIci(page: Page, nom: string): Promise<string> {
  const tel = await imagesParSeconde(page);
  const sansEtoiles = await sansLaCouche(page, ETOILES);
  const sansArbre = await sansLaCouche(page, ARBRE);
  const sansGrain = await sansLaCouche(page, GRAIN);
  const dire = (v: number | null) => (v === null ? "témoin ROMPU" : `${v}`);
  return (
    `${nom} : tel quel ${tel} | sans étoiles ${dire(sansEtoiles)} | ` +
    `sans arbre ${dire(sansArbre)} | sans grain ${dire(sansGrain)}`
  );
}

test("[SONDE] quelle couche mange les trames — à supprimer une fois lue", async ({ page }) => {
  await ouvrirUnCompteNeuf(page);

  await page.goto("/aide");
  await page.waitForTimeout(900);
  const reference = await imagesParSeconde(page);

  await page.goto("/");
  await page.waitForTimeout(1400);
  const auSeuil = await releverIci(page, "seuil");

  await page.getByRole("button", { name: /entrer dans le monde/i }).click();
  await passerLeTour(page);
  await page.waitForTimeout(1200);
  const aMoi = await releverIci(page, "Moi");

  // ⚠️ ÉCHEC DÉLIBÉRÉ : c'est le seul canal par lequel ces nombres arrivent jusqu'au rapport.
  // Les nombres sont dans le MESSAGE, pas seulement dans la valeur comparée : le comparateur de la
  // CI imprime le message en premier, et c'est la partie qui survit à sa troncature.
  expect(
    [],
    `SONDE DES COUCHES — référence /aide ${reference} im/s\n  ${auSeuil}\n  ${aMoi}`,
  ).toEqual(["ceci échoue exprès : lire les trois lignes ci-dessus, puis supprimer ce fichier"]);
});
