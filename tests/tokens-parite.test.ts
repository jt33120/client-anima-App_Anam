import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { couleursNuit, couleursClair, type CleCouleur } from "@/app/styles/tokens";

/**
 * GARDE ANTI-DÉRIVE (AC1) : globals.css ne doit jamais s'écarter de tokens.ts.
 * On parse les blocs :root (nuit), :root[data-a11y="contraste"] (-clair, déclencheur
 * manuel) et @media (prefers-contrast: more) (-clair, déclencheur système) et on
 * vérifie chaque variable de couleur. tokens.ts est ainsi la source IMPOSÉE.
 *
 * Le troisième bloc est gardé depuis la palette « Soft Balance » (E5-S1, retour terrain
 * du 2026-09-01) : voir le dernier describe pour ce qui pouvait passer inaperçu avant.
 */

const css = readFileSync(resolve(process.cwd(), "app/styles/globals.css"), "utf-8");

function extraireBloc(selecteur: RegExp): string {
  const m = selecteur.exec(css);
  if (!m) throw new Error(`Bloc CSS introuvable pour ${selecteur}`);
  return m[1];
}

function valeurVar(bloc: string, nom: CleCouleur): string | null {
  const m = new RegExp(`--${nom}:\\s*(#[0-9A-Fa-f]{6})`).exec(bloc);
  return m ? m[1].toUpperCase() : null;
}

describe("Parité tokens.ts ↔ globals.css — mode nuit", () => {
  const bloc = extraireBloc(/:root\s*\{([^}]*)\}/); // 1er :root = bloc nuit
  for (const cle of Object.keys(couleursNuit) as CleCouleur[]) {
    it(`--${cle} = ${couleursNuit[cle]}`, () => {
      expect(valeurVar(bloc, cle)).toBe(couleursNuit[cle].toUpperCase());
    });
  }
});

describe("Parité tokens.ts ↔ globals.css — mode accessibilité (-clair)", () => {
  const bloc = extraireBloc(/:root\[data-a11y="contraste"\]\s*\{([^}]*)\}/);
  for (const cle of Object.keys(couleursClair) as CleCouleur[]) {
    it(`--${cle} = ${couleursClair[cle]}`, () => {
      expect(valeurVar(bloc, cle)).toBe(couleursClair[cle].toUpperCase());
    });
  }
});

describe("Parité tokens.ts ↔ globals.css — @media (prefers-contrast: more), le chemin ACTIF", () => {
  // ══ POURQUOI UN TROISIÈME BLOC (E5-S1, palette Soft Balance, 2026-09-01) ══════════════════════
  // Le bloc `:root[data-a11y="contraste"]` est le déclencheur MANUEL (réglage « Lisibilité
  // renforcée »). Le bloc `@media (prefers-contrast: more)` est celui que le SYSTÈME déclenche :
  // c'est le chemin que rencontre réellement une personne qui a réglé son téléphone, et il recopie
  // les mêmes dix-sept valeurs une seconde fois. Jusqu'à la palette Soft Balance, aucune garde ne
  // le lisait : on pouvait changer la nuit ET le bloc manuel, passer la parité au vert, et laisser
  // le chemin système sur l'ancienne palette (mesuré : les deux describe ci-dessus ne citent que
  // le premier `:root` et le bloc `[data-a11y="contraste"]`).
  //
  // ⚠️ MUTATION-CIBLE : un seul hex divergent dans ce bloc, ou une clé oubliée (`--nebuleuse`
  // absente rend `valeurVar` nul), et ce describe rougit. La regex exige la structure exacte
  // `@media (prefers-contrast: more) { :root:not([data-a11y="nuit"]) { … } }` : renommer le
  // sélecteur casse aussi, et c'est voulu (tests/accessibilite.test.ts garde la présence du media
  // query, ce test-ci garde ses VALEURS).
  const bloc = extraireBloc(
    /@media\s*\(prefers-contrast:\s*more\)\s*\{\s*:root:not\(\[data-a11y="nuit"\]\)\s*\{([^}]*)\}/,
  );
  for (const cle of Object.keys(couleursClair) as CleCouleur[]) {
    it(`--${cle} = ${couleursClair[cle]}`, () => {
      expect(valeurVar(bloc, cle)).toBe(couleursClair[cle].toUpperCase());
    });
  }
});
