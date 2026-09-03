import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { couleursNuit, couleursClair } from "@/app/styles/tokens";
import { ratioContraste } from "@/app/styles/contraste";

/**
 * LA PALETTE VIVANTE (2026-09-03).
 *
 * Retour de Julian, la palette « Soft Balance » à l'appui : « moins unicouleur, avec plus de
 * contraste ; des dégradés et des motifs, par exemple fleur de lotus, du texte qui scintille ;
 * cette palette mais plus magique, vivante ».
 *
 * Trois choses en sont sorties, et chacune a un mode d'échec silencieux que ce fichier tient :
 *
 * (Le lotus de fond, ajouté le matin même, a été retiré l'après-midi : « je ne suis pas fan de la
 * fleur de lotus en fond ». Sa garde est partie avec lui — une garde sans objet est une garde qui
 * ment.)
 *
 *   1. `--aube`, le SECOND TON, chaud. Son danger n'est pas d'être laid, c'est de finir sous du
 *      texte : à 1,4:1 sur le fond, une phrase peinte avec lui serait illisible, et aucune paire
 *      du gate de contraste ne le verrait puisqu'il n'entre dans aucune ;
 *   2. LE LOTUS du ciel. Son danger est de se mettre à bouger : la scène a une liste écrite de ce
 *      qu'on n'anime jamais, et un motif qui pulse derrière une conversation est un battement dans
 *      le champ de vision de quelqu'un qui écrit ;
 *   3. LE SCINTILLEMENT. Deux dangers : qu'il devienne un balayage (la forme que la charte du
 *      calme refuse), et qu'il survive à `prefers-reduced-motion`.
 */

const racine = process.cwd();
const lire = (f: string) => readFileSync(resolve(racine, f), "utf-8");
/** Le code seul : une prose qui NOMME l'interdit ne doit pas déclencher la garde. */
const codeSeul = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, " ");

describe("[LE CŒUR] le second ton est un décor, et il le reste", () => {
  it("`--aube` existe dans les deux palettes, et n'est pas un bleu de plus", () => {
    for (const [mode, palette] of [
      ["nuit", couleursNuit],
      ["clair", couleursClair],
    ] as const) {
      const aube = palette.aube;
      expect(aube, `${mode} : le second ton a disparu`).toBeTruthy();
      // Une teinte chaude a plus de rouge que de bleu. C'est la mesure la plus simple de « ce
      // n'est pas encore du bleu », et la seule qui survive à un ajustement de nuance.
      const [r, , b] = [1, 3, 5].map((i) => parseInt(aube.slice(i, i + 2), 16));
      expect(r, `${mode} : « aube » est repassée du côté froid (${aube})`).toBeGreaterThan(b);
    }
  });

  it("[LE BORD] il ne porte jamais de texte, dans aucune feuille", () => {
    // Mutation-cible : `color: var(--aube)` sur une note en retrait. Joli sur une maquette,
    // illisible à l'écran, et invisible au gate de contraste.
    const feuilles = [
      "app/styles/globals.css",
      "render/monde.module.css",
      "render/socle/socle.module.css",
      "render/accueil/accueil.module.css",
    ];
    const fautives = feuilles.filter((f) => /color:\s*var\(--aube\)/.test(codeSeul(lire(f))));
    expect(fautives, `« aube » est passée sous du texte : ${fautives.join(", ")}`).toEqual([]);
  });

  it("[ANTI-VACUITÉ] il est bel et bien employé, sinon la garde ne garde rien", () => {
    const monde = codeSeul(lire("render/monde.module.css"));
    expect(monde, "le second ton n'est utilisé nulle part dans le ciel").toContain("var(--aube)");
  });
});

describe("[LE CŒUR] le scintillement est une respiration de lumière, pas un balayage", () => {
  const styles = codeSeul(lire("app/styles/globals.css"));
  const keyframes = styles.slice(
    styles.indexOf("@keyframes scintillement"),
    styles.indexOf(".scintillement {"),
  );

  it("[ANTI-VACUITÉ] l'animation a été trouvée", () => {
    expect(keyframes.length).toBeGreaterThan(60);
    expect(keyframes).toContain("opacity");
  });

  it("il ne déplace rien : ni transform, ni balayage, ni filtre", () => {
    // Mutation-cible : le scintillement « classique », une bande de lumière qui traverse le mot
    // (`background-position` animée sur un dégradé). Elle attire l'œil à chaque tour, sur un écran
    // qu'on regarde déjà.
    for (const interdit of ["transform", "background-position", "filter"]) {
      expect(
        new RegExp(`\\b${interdit}\\s*:`).test(keyframes),
        `« ${interdit} » dans le scintillement : ce n'est plus une lumière, c'est un mouvement`,
      ).toBe(false);
    }
  });

  it("[LE CŒUR] c'est un HALO qui respire, jamais le texte lui-même", () => {
    // La lisibilité du seuil est garantie par une bande opaque calculée (`tests/voile.test.ts`).
    // Une opacité animée SUR le texte lui ferait perdre son contraste mesuré la moitié du temps,
    // et une ombre portée serait le faux-semblant qui viendrait un jour remplacer la bande.
    const regle = styles.slice(styles.indexOf(".scintillement {"), styles.indexOf("@media (prefers-reduced-motion"));
    expect(regle, "la règle du scintillement est introuvable").not.toBe("");
    expect(regle).toContain(".scintillement::after");
    // L'animation est portée par le pseudo-élément, pas par l'élément de texte.
    const surLElement = /\.scintillement\s*\{[^}]*animation\s*:/.test(regle);
    expect(surLElement, "le texte lui-même est animé").toBe(false);
    expect(styles, "une ombre portée est revenue sur le texte").not.toMatch(/text-shadow\s*:/);
  });

  it("il est plus lent que la respiration : une braise, pas une alerte", () => {
    const duree = (nom: string) =>
      Number(new RegExp(`--duree-${nom}:\\s*(\\d+)ms`).exec(styles)?.[1] ?? 0);
    expect(duree("scintillement"), "durée du scintillement introuvable").toBeGreaterThan(0);
    expect(duree("scintillement")).toBeGreaterThan(duree("respiration"));
  });

  it("[LE BORD] `prefers-reduced-motion` l'arrête, comme la respiration", () => {
    const bloc = styles.slice(styles.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(bloc).toContain(".scintillement");
    // La règle qui suit la mention doit bien être un arrêt, pas un simple ralentissement.
    const apres = bloc.slice(bloc.indexOf(".scintillement"));
    expect(apres.slice(0, 120)).toContain("animation: none");
    // C'est le HALO qu'on arrête, pas une règle homonyme.
    expect(bloc).toContain(".scintillement::after");
  });

  it("[LE BORD] un seul texte scintille dans tout le produit", () => {
    // La charte n'admettait qu'un mouvement en boucle ; en ouvrir un second est une décision du
    // fondateur, l'étendre à toutes les pages n'en est pas une. Si un deuxième écran en veut, cette
    // ligne est là pour que la question se pose.
    const rendu = ["render/scene-dom.tsx"].map(lire).join("\n");
    const occurrences = [...rendu.matchAll(/className="[^"]*\bscintillement\b/g)];
    expect(occurrences.length, "le scintillement s'est répandu hors du seuil").toBe(1);
  });
});

describe("[LE BORD] la palette reste lisible malgré ses nouvelles couches", () => {
  it("le second ton n'a pas déplacé les paires mesurées", () => {
    // Ceinture : le gate de contraste vit dans son fichier, mais un ajout de token qui ferait
    // chuter une paire doit rougir ici aussi, là où l'ajout a été décidé.
    for (const palette of [couleursNuit, couleursClair]) {
      expect(ratioContraste(palette.texte, palette.fond)).toBeGreaterThanOrEqual(4.5);
      expect(ratioContraste(palette["texte-doux"], palette.fond)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
