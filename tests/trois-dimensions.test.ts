import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { texteVisible } from "./_absence";

/**
 * trois-dimensions.test.ts — LE MOT COMMUN AUX TROIS LIEUX EST « DIMENSION » (fondateur, 2026-09-02).
 *
 * ══ POURQUOI CETTE GARDE EXISTE ══════════════════════════════════════════════════════════════════
 *
 * Le produit présente ses trois lieux (Anam, Mon arbre, Moi) sous un nom collectif, à DEUX endroits
 * visibles : le `<h2>` du bloc d'accueil (`render/premier-passage.tsx`) et la section de la halte
 * Repères (`render/reperes/Reperes.tsx`, nom accessible + `<h2>`), dont la copie (`copie-reperes.ts`)
 * reprend le mot dans ses phrases. Ce nom collectif était « places » ; le fondateur a demandé
 * « dimensions ». Un mot qui change à un endroit et pas à l'autre fabrique deux vocabulaires pour un
 * seul produit — exactement le défaut que `tests/scene-modele.test.ts` [7.9] refuse pour les noms
 * des lieux eux-mêmes. Ici, c'est leur nom COLLECTIF qu'on tient.
 *
 * ⚠️ « place » RESTE UN MOT FRANÇAIS ORDINAIRE. La garde ne bannit pas le mot : elle refuse les
 * seules formes qui NOMMAIENT les trois lieux (« trois places », « d’une place à l’autre »,
 * « changer de place »). « à sa place », « en place » restent libres.
 *
 * Les commentaires sont retirés avant la lecture (`texteVisible`) : un avertissement qui NOMME
 * l'ancien mot, comme celui posé au-dessus de chaque `<h2>`, ne doit pas déclencher la garde.
 *
 * `e2e/` n'est PAS lu ici : les specs navigateur ont leur propre garde de noms dans
 * `scene-modele.test.ts`, et elles appartiennent à un autre chantier.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

const ACCUEIL = "render/premier-passage.tsx";
const REPERES = "render/reperes/Reperes.tsx";
const COPIE_REPERES = "lib/domain/copie-reperes.ts";

/** Les formes qui désignaient les trois lieux sous l'ancien mot. Aucune ne doit atteindre l'écran. */
const ANCIENNES_FORMES: readonly RegExp[] = [
  /\btrois places\b/i,
  /\bd’une place à l’autre\b/,
  /\bd'une place à l'autre\b/,
  /\bchanger de place\b/,
];

/** Ce qui, dans un fichier, désigne encore les lieux sous l'ancien mot — vide si rien. */
function fautesDe(fragments: readonly string[]): string[] {
  const fautes: string[] = [];
  for (const fragment of fragments) {
    for (const forme of ANCIENNES_FORMES) {
      const m = forme.exec(fragment);
      if (m) fautes.push(`« ${m[0]} » dans « ${fragment.trim().slice(0, 60)} »`);
    }
  }
  return fautes;
}

describe("[fondateur 2026-09-02] les trois lieux s'appellent « dimensions », pas « places »", () => {
  it("[LE CŒUR] aucune surface ne nomme plus les trois lieux « places »", () => {
    for (const fichier of [ACCUEIL, REPERES, COPIE_REPERES]) {
      expect(fautesDe(texteVisible(lire(fichier))), `${fichier} : l'ancien mot est revenu`).toEqual([]);
    }
  });

  it("[LE CŒUR] le bloc d'accueil s'intitule « Trois dimensions », et rien d'autre", () => {
    // Le `<h2>` est le seul texte de titre du bloc ; on exige le libellé EXACT, majuscule comprise,
    // parce que c'est un nom accessible : un lecteur d'écran l'annonce tel quel.
    const visibles = texteVisible(lire(ACCUEIL));
    expect(visibles, "le titre du bloc d'accueil ne dit plus « Trois dimensions »").toContain(
      "Trois dimensions",
    );
  });

  it("[LE CŒUR] la halte Repères le dit sous le même mot, au nom accessible ET au <h2>", () => {
    // Deux occurrences exactes : `aria-label="Les trois dimensions"` (une chaîne) et
    // `<h2>Les trois dimensions</h2>` (un texte JSX). Une seule des deux, et le lecteur d'écran
    // annoncerait une région sous un nom et un titre sous un autre.
    const exactes = texteVisible(lire(REPERES)).filter((t) => t === "Les trois dimensions");
    expect(exactes, "nom accessible et <h2> de la section doivent dire « Les trois dimensions »").toHaveLength(2);
  });

  it("[LE CŒUR] la copie de Repères circule « d’une dimension à l’autre »", () => {
    // Le mode d'emploi explique le geste latéral sous le mot du titre juste au-dessus.
    const tout = texteVisible(lire(COPIE_REPERES)).join("\n");
    expect(tout).toContain("d’une dimension à l’autre");
    expect(tout).toContain("changer de dimension");
  });

  it("[ANTI-VACUITÉ] le refus mord : l'ancien mot planté dans un texte visible est vu", () => {
    // Sans ce témoin, une expression régulière mal écrite laisserait la garde verte à jamais.
    expect(fautesDe(["Trois places"])).toHaveLength(1);
    expect(fautesDe(["Les trois places"])).toHaveLength(1);
    expect(fautesDe(["glisser d’une place à l’autre"])).toHaveLength(1);
    expect(fautesDe(["Pour changer de place depuis là"])).toHaveLength(1);
    // Et le mot ordinaire reste libre : ce n'est pas « place » qu'on refuse, c'est l'ancien nom.
    expect(fautesDe(["Ils restent ici, à leur place.", "quelque chose n’est pas en place"])).toEqual([]);
  });

  it("[ANTI-VACUITÉ] les commentaires sont bien retirés avant la lecture", () => {
    // Les avertissements posés au-dessus des <h2> CITENT « Trois places » : si l'extracteur les
    // laissait passer, la garde du cœur serait rouge sur son propre mode d'emploi.
    for (const fichier of [ACCUEIL, REPERES, COPIE_REPERES]) {
      expect(lire(fichier), `${fichier} : le commentaire témoin a disparu`).toMatch(/places/i);
    }
  });
});
