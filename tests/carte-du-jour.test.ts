import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { couleursNuit, couleursClair } from "@/app/styles/tokens";
import { ratioContraste } from "@/app/styles/contraste";

/**
 * LE CODE COULEUR DU JOUR (2026-09-02).
 *
 * Retour de Julian : « ce bleu magique fleur de lotus est utilisé pour les champs d'aujourd'hui,
 * c'est notre code couleur. » Deux cartes le portent, sur deux écrans : « Ton ciel du jour » et
 * « Le mantra du jour » sur l'accueil, « Ton ciel du jour » dans la halte du socle.
 *
 * ── CE QUE CE FICHIER GARDE, ET QUE `contraste.test.ts` NE PEUT PAS GARDER ─────────────────────
 *
 * Le gate de contraste mesure des PAIRES DE JETONS. Il ne voit ni le dégradé, ni quelle règle CSS
 * consomme quel jeton. Or les deux modes d'échec de cette story sont exactement là :
 *
 *   1. LE BAS DU DÉGRADÉ. La carte n'est pas un aplat : elle va du lotus vers un lotus assombri.
 *      C'est le point le PLUS SOMBRE qui décide de la lisibilité de l'encre douce, et il n'existe
 *      dans aucun jeton — il est calculé par `color-mix`. Personne ne le mesurerait jamais ;
 *   2. UNE ENCRE OUBLIÉE. Une seule règle laissée en `--texte` dans une carte du jour donne de
 *      l'Ivory sur du Sky : 1,20:1, illisible, et rien ne rougit puisque les deux jetons sont
 *      parfaitement valides ailleurs. C'est le défaut le plus probable de toute cette story, et
 *      le plus silencieux.
 */

const racine = process.cwd();
const lire = (f: string) => readFileSync(resolve(racine, f), "utf-8");

/** `color-mix(in srgb, <encre> X%, <jour>)` en sRGB, la formule que le navigateur applique. */
function melange(part: number, encre: string, jour: string): string {
  const composantes = (hex: string) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [ra, ga, ba] = composantes(encre);
  const [rb, gb, bb] = composantes(jour);
  return (
    "#" +
    [
      [ra, rb],
      [ga, gb],
      [ba, bb],
    ]
      .map(([a, b]) => Math.round(a * part + b * (1 - part)).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** La part de `--sur-jour` au bas du dégradé des cartes, telle qu'elle est écrite dans les CSS. */
const PART_BAS_DEGRADE = 0.05;

describe("[LE CŒUR] le bas du dégradé reste lisible, alors qu'aucun jeton ne le nomme", () => {
  for (const [mode, palette] of [
    ["nuit", couleursNuit],
    ["clair", couleursClair],
  ] as const) {
    const bas = melange(PART_BAS_DEGRADE, palette["sur-jour"], palette.jour);

    it(`${mode} : l'encre tient sur le point le plus sombre de la carte`, () => {
      expect(ratioContraste(palette["sur-jour"], bas)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${mode} : l'encre DOUCE aussi, et c'est elle la marge serrée`, () => {
      // 4,76 à 5 %. À 10 % elle tombe à 4,34 : le pourcentage du CSS n'est pas décoratif, et
      // l'augmenter « pour voir le grain » casse cette ligne avant de casser un écran.
      expect(ratioContraste(palette["sur-jour-doux"], bas)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("[ANTI-VACUITÉ] le calcul du mélange n'est pas l'identité", () => {
    // Sans ce témoin, un `melange` qui rendrait `jour` tel quel ferait passer les quatre tests
    // ci-dessus sans jamais mesurer le dégradé.
    expect(melange(PART_BAS_DEGRADE, couleursNuit["sur-jour"], couleursNuit.jour)).not.toBe(
      couleursNuit.jour,
    );
    expect(ratioContraste(couleursNuit["sur-jour-doux"], couleursNuit.jour)).toBeGreaterThan(
      ratioContraste(
        couleursNuit["sur-jour-doux"],
        melange(PART_BAS_DEGRADE, couleursNuit["sur-jour"], couleursNuit.jour),
      ),
    );
  });
});

describe("[LE BORD] aucune encre du mode sombre ne survit dans une carte du jour", () => {
  /** Le bloc CSS d'une carte : de sa déclaration jusqu'à la règle qui ne la concerne plus. */
  function bloc(source: string, debut: string, fin: string | null): string {
    const i = source.indexOf(debut);
    expect(i, `bloc introuvable : ${debut}`).toBeGreaterThan(-1);
    if (fin === null) return source.slice(i);
    const j = source.indexOf(fin, i);
    expect(j, `fin de bloc introuvable : ${fin}`).toBeGreaterThan(i);
    return source.slice(i, j);
  }

  const accueil = lire("render/accueil/accueil.module.css");
  const socle = lire("render/socle/socle.module.css");

  // Accueil : toutes les cartes de la feuille SONT les cartes du jour (le composant `Carte` n'est
  // monté que dans « Ce que le jour propose »), et leurs règles vont jusqu'au bas du fichier.
  const carteAccueil = bloc(accueil, ".carte {", null);
  // Socle : de la carte à la règle nue de la mention. La borne est ancrée en début de ligne, sinon
  // elle mordrait sur `.carteJour .mentionModele` et couperait le bloc en son milieu.
  const carteSocle = bloc(socle, ".carteJour {", "\n.mentionModele {");

  it("[ANTI-VACUITÉ] les deux blocs ont bien été découpés", () => {
    expect(carteAccueil.length).toBeGreaterThan(400);
    expect(carteSocle.length).toBeGreaterThan(200);
    expect(carteAccueil).toContain("--jour");
    expect(carteSocle).toContain("--jour");
  });

  for (const [ou, bloque] of [
    ["accueil", carteAccueil],
    ["socle", carteSocle],
  ] as const) {
    it(`${ou} : aucune règle ne peint en \`--texte\` ni en \`--texte-doux\``, () => {
      // Mutation-cible : remettre `color: var(--texte)` sur un titre de carte. Ivory sur Sky,
      // 1,20:1 — et les deux jetons restent parfaitement valides partout ailleurs.
      const fautes = [...bloque.matchAll(/color:\s*var\(--(texte(?:-doux)?)\)/g)].map((m) => m[1]);
      expect(fautes, `encre du mode sombre dans une carte du jour (${ou})`).toEqual([]);
    });

    it(`${ou} : la carte ne se peint pas avec le jeton de l'ACTION`, () => {
      // L'accent est la couleur de l'action et d'elle seule (QA du 2026-08-19). Un aplat peint
      // avec lui ferait dériver les deux sens ensemble, et un lien posé dessus disparaîtrait.
      expect(bloque).not.toMatch(/var\(--accent\b/);
    });
  }
});
