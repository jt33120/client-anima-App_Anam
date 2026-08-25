import { test, expect, type Page } from "@playwright/test";
import { ouvrirUnCompteNeuf, passerLeTour } from "./_entrer";

/**
 * fluidite.spec.ts — LA SCÈNE NE COÛTE PAS PLUS QU'UN DOCUMENT (mesuré le 2026-08-20)
 *
 * ══ CE QUI EST ARRIVÉ ═════════════════════════════════════════════════════════════════════════
 *
 * En rendant le fond « plus immersif », une voie lactée a été ajoutée : une bande diagonale
 * `filter: blur(44px)` sur un élément débordant de 20 % du viewport. Sur une capture d'écran, le
 * résultat était exactement celui voulu. À l'usage, l'application tombait à **4 images/seconde au
 * repos** — le navigateur devant recomposer un flou plein écran à chaque trame, puisque les étoiles
 * scintillent et que le canevas de l'arbre se peint derrière.
 *
 * ⚠️ AUCUNE DES GARDES DE CE DÉPÔT NE POUVAIT LE VOIR. Les tests de rendu ne composent rien ; les
 * gardes de pixels comparent des images FIXES, et l'image était juste ; les gardes de boîtes
 * mesurent une mise en page, qui était juste aussi. Un défaut de FLUIDITÉ n'est ni une position ni
 * une couleur : c'est un coût par trame, et il faut le compter.
 *
 * ══ POURQUOI LE SEUIL EST RELATIF, ET NON GRAVÉ ═══════════════════════════════════════════════
 *
 * Un nombre d'images/seconde absolu dépend de la machine, de la charge, du navigateur : gravé ici,
 * il rougirait un matin sans qu'une ligne du produit ait changé — c'est la leçon déjà écrite dans
 * `conversation-attente.spec.ts`. On mesure donc d'abord une RÉFÉRENCE sur `/aide`, qui est un
 * document statique du même produit, puis on exige que la scène s'en approche. Le rapport, lui, ne
 * dépend d'aucune machine : avec le flou il valait 0,13 ; sans lui, 1,0.
 */

/** Images par seconde, mesurées sur 1,5 s de `requestAnimationFrame`. */
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

/** En deçà de cette part de la référence, la scène coûte trop cher par trame. */
const PART_MINIMALE = 0.6;

test("[LE COÛT PAR TRAME] la scène reste fluide sur chacune de ses régions", async ({ page }) => {
  await ouvrirUnCompteNeuf(page);

  // La RÉFÉRENCE : une halte du même produit, sans canevas, sans étoiles, sans dégradés animés.
  await page.goto("/aide");
  await page.waitForTimeout(900);
  const reference = await imagesParSeconde(page);
  expect(reference, "témoin : même un document statique ne tourne pas — la mesure ne dirait rien").toBeGreaterThan(8);

  await page.goto("/");
  await page.waitForTimeout(1400);
  const releves: Record<string, number> = { seuil: await imagesParSeconde(page) };

  await page.getByRole("button", { name: /entrer dans le monde/i }).click();
  await passerLeTour(page);
  const barre = page.getByRole("navigation", { name: "Régions" });
  // ⚠️ LA LISTE EST EN DUR ICI, ET C'EST UN PIÈGE CONNU (Story 7.9, AC4). Le 2026-08-25, les
  // régions ont été renommées : si un nom de cette liste cesse d'exister, `getByRole` ne trouve
  // rien, la boucle ne mesure RIEN — et une boucle qui ne mesure rien passe au VERT. Le test se
  // serait vidé sans une ligne rouge. On compte donc ce qui a réellement été mesuré, à la fin.
  const mesurees: string[] = [];
  for (const region of ["Moi", "Anam", "Mon arbre"]) {
    await barre.getByRole("button", { name: region, exact: true }).click();
    await page.waitForTimeout(1200);
    releves[region] = await imagesParSeconde(page);
    mesurees.push(region);
  }

  // ⚠️ LE TÉMOIN AVANT LE VERDICT. Sans lui, une boucle qui n'a rien parcouru rend un `releves`
  // vide, `trop` vaut `[]`, et le test passe en n'ayant mesuré aucune région.
  expect(
    mesurees,
    "la boucle n'a pas parcouru les trois régions : le test se serait vidé au lieu d'échouer",
  ).toEqual(["Moi", "Anam", "Mon arbre"]);
  expect(Object.keys(releves), "un relevé manque").toHaveLength(3);

  const trop = Object.entries(releves).filter(([, v]) => v < reference * PART_MINIMALE);
  expect(
    trop.map(([nom, v]) => `${nom} : ${v} im/s`),
    `la scène rame par rapport à un document du même produit (${reference} im/s) :\n` +
      Object.entries(releves)
        .map(([n, v]) => `  ${n} → ${v} im/s`)
        .join("\n"),
  ).toEqual([]);
});

test("[PENDANT LE TOUR AUSSI] l'écran qui apprend le produit ne doit pas saccader", async ({ page }) => {
  // ⚠️ LE PIRE ENDROIT POUR UNE SACCADE. Le tour guidé est le premier écran qu'une personne voit
  // en entrant, et le seul dont le propos est de mettre en confiance. Il porte en plus quatre
  // volets et un contour qui se déplacent d'une étape à l'autre : c'est la surface la plus
  // susceptible de coûter cher, et celle où ça se pardonne le moins.
  await ouvrirUnCompteNeuf(page);
  await page.goto("/aide");
  await page.waitForTimeout(900);
  const reference = await imagesParSeconde(page);

  await page.goto("/");
  await page.getByRole("button", { name: /entrer dans le monde/i }).click();
  await page.waitForTimeout(1500);
  await expect(page.getByRole("dialog"), "témoin : le tour n’est pas ouvert").toBeVisible();

  const pendant = await imagesParSeconde(page);
  expect(
    pendant,
    `le tour tourne à ${pendant} im/s contre ${reference} pour un document statique`,
  ).toBeGreaterThanOrEqual(reference * PART_MINIMALE);
});

/**
 * ⚠️ LE TROISIÈME CAS — MESURÉ PENDANT UN DÉFILEMENT (Story 11.1, 2026-08-25).
 *
 * Les deux cas ci-dessus mesurent AU REPOS et pendant le tour guidé. Ni l'un ni l'autre ne verrait
 * l'effet le plus coûteux qu'on s'apprête à livrer : un voile de fond sous un arbre (Story 11.2) et
 * un bandeau qui se fond au défilement (Story 7.10). Un fond ne coûte presque rien tant que rien ne
 * bouge devant lui ; il coûte tout quand la page défile, parce que le navigateur doit alors le
 * recomposer à chaque trame.
 *
 * C'est le cas exact du flou de la voie lactée : au repos il tenait, et c'est en défilant que
 * l'application tombait à 4 images/seconde.
 *
 * ⚠️ CETTE GARDE EST ÉCRITE AVANT LES DEUX EFFETS QU'ELLE DOIT SURVEILLER, ET CE N'EST PAS UN
 * DÉTAIL D'ORDONNANCEMENT. Écrite après, elle graverait le coût livré comme normal.
 */
async function imagesParSecondePendantDefilement(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((res) => {
        const region = document.querySelector('[class*="regionActive"]') as HTMLElement | null;
        let n = 0;
        let sens = 1;
        const t0 = performance.now();
        const tic = () => {
          n++;
          // Un défilement PROGRAMMÉ, qui va et vient : c'est ce qui force la recomposition du fond
          // à chaque trame, exactement comme un doigt le ferait.
          if (region) {
            region.scrollTop += 24 * sens;
            if (region.scrollTop <= 0 || region.scrollTop >= region.scrollHeight - region.clientHeight) sens = -sens;
          } else {
            window.scrollBy(0, 24 * sens);
          }
          if (performance.now() - t0 < 1600) requestAnimationFrame(tic);
          else res(Math.round((n * 1000) / (performance.now() - t0)));
        };
        requestAnimationFrame(tic);
      }),
  );
}

test("[PENDANT UN DÉFILEMENT] un fond ne coûte rien au repos et tout quand la page bouge", async ({ page }) => {
  await ouvrirUnCompteNeuf(page);

  // La référence est prise DANS LES MÊMES CONDITIONS — en défilant elle aussi. Comparer un
  // défilement à un repos mesurerait le défilement, pas la scène.
  await page.goto("/aide");
  await page.waitForTimeout(900);
  const reference = await imagesParSecondePendantDefilement(page);
  expect(reference, "témoin : la référence elle-même ne tient pas — machine trop chargée").toBeGreaterThan(8);

  await page.goto("/");
  await page.getByRole("button", { name: /entrer dans le monde/i }).click();
  await passerLeTour(page);
  const barre = page.getByRole("navigation", { name: "Régions" });

  const releves: Record<string, number> = {};
  const mesurees: string[] = [];
  // Les deux régions que les Stories 11.2 et 7.10 vont repeindre. « Anam » est hors du cas : son
  // fil a son propre défilement, éprouvé par `conversation-attente.spec.ts`.
  for (const region of ["Moi", "Mon arbre"]) {
    await barre.getByRole("button", { name: region, exact: true }).click();
    await page.waitForTimeout(1000);
    releves[region] = await imagesParSecondePendantDefilement(page);
    mesurees.push(region);
  }

  expect(
    mesurees,
    "la boucle n'a pas parcouru les deux régions : le test se serait vidé au lieu d'échouer",
  ).toEqual(["Moi", "Mon arbre"]);

  const trop = Object.entries(releves).filter(([, v]) => v < reference * PART_MINIMALE);
  expect(
    trop.map(([nom, v]) => `${nom} : ${v} im/s`),
    `une région rame EN DÉFILANT par rapport à un document du même produit (${reference} im/s) :\n` +
      Object.entries(releves)
        .map(([n, v]) => `  ${n} → ${v} im/s`)
        .join("\n"),
  ).toEqual([]);
});
