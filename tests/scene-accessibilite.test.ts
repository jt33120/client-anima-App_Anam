import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Story 1.7 — accessibilité de la scène (AC3/AC4), gardée par lecture du CSS et du composant
 * de rendu. Verrouille en particulier le FIX du bug du prototype : sous prefers-reduced-motion,
 * le changement de région est instantané (transition de région neutralisée), et la parallaxe
 * au pointeur a bien été retirée.
 */

const racine = process.cwd();

/** Retire /* *​/ et // (sans toucher aux :// des URLs) : les gardes testent le CODE,
 *  pas la prose (un commentaire « parallaxe retirée » ne doit pas faire échouer la garde). */
function sansCommentaires(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const css = sansCommentaires(readFileSync(resolve(racine, "render/monde.module.css"), "utf-8"));
const scene = sansCommentaires(readFileSync(resolve(racine, "render/scene-dom.tsx"), "utf-8"));

describe("[2026-08-25] La région courante se voit — et le CSS suit le DOM, pas l’inverse", () => {
  /**
   * ⚠️ CE SÉLECTEUR N'A JAMAIS RIEN SÉLECTIONNÉ, ET RIEN NE LE DISAIT.
   *
   * `scene-dom.tsx` pose `aria-current="location"` sur l'onglet de la région active — la valeur
   * juste, puisqu'on désigne un LIEU dans une scène et non une étape ou une page. Le CSS, lui,
   * ciblait `[aria-current="true"]`. Résultat : depuis la Story 1.7, la barre de régions affichait
   * trois libellés strictement identiques, et rien à l'écran ne disait dans laquelle on se trouvait.
   *
   * Un sélecteur CSS qui ne mord sur rien est le défaut le plus silencieux qui soit : il ne casse
   * pas, il ne lève pas, il ne rougit pas — il ne fait simplement rien, pour toujours.
   *
   * ⚠️ CETTE GARDE NE FIGE PAS LA VALEUR. Elle la LIT dans le composant et exige que le sélecteur
   * la suive. Écrire `expect(css).toMatch(/location/)` aurait interdit de changer d'avis sur la
   * valeur ARIA ; ce qu'on protège, c'est que les deux ne DIVERGENT pas.
   */
  const valeurDom = /aria-current=\{[^}]*\?\s*"([a-z]+)"/.exec(scene)?.[1];

  it("le composant pose bien une valeur `aria-current` sur l’onglet actif", () => {
    expect(valeurDom, "plus aucun `aria-current` dans la barre de régions").toBeTruthy();
  });

  it("[LE CŒUR] le sélecteur CSS cible EXACTEMENT la valeur que le DOM écrit", () => {
    const selecteurs = [...css.matchAll(/\[aria-current="([a-z]+)"\]/g)].map((m) => m[1]);
    expect(selecteurs.length, "plus aucun style d’onglet actif : la région courante redevient invisible").toBeGreaterThan(0);
    for (const s of selecteurs) {
      expect(s, `le CSS cible "${s}" alors que le DOM écrit "${valeurDom}" — le sélecteur ne mord sur rien`).toBe(valeurDom);
    }
  });

  it("et l’onglet actif se distingue RÉELLEMENT des autres (une déclaration, pas un bloc vide)", () => {
    // Anti-vacuité : un sélecteur juste dont le bloc est vide ne distingue rien non plus.
    const bloc = new RegExp(`\\[aria-current="${valeurDom}"\\]\\s*\\{([^}]*)\\}`).exec(css);
    expect(bloc, "le bloc de l’onglet actif a disparu").not.toBeNull();
    expect(bloc![1].trim().length, "le bloc de l’onglet actif est vide").toBeGreaterThan(0);
  });
});

describe("Fondu de région + reduced-motion (AC1/AC4)", () => {
  it("la région se relie en FONDU (transition d'opacité sur --duree-longue)", () => {
    expect(css).toMatch(/\.region\b[\s\S]*?transition:[\s\S]*?opacity/);
    expect(css).toMatch(/--duree-longue/);
  });

  it("un bloc @media (prefers-reduced-motion: reduce) existe dans le rendu", () => {
    expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
  });

  it("sous reduced-motion, le changement de région est INSTANTANÉ (transition région = none)", () => {
    // Le bug du prototype : la transition d'opacité de région n'était pas neutralisée.
    expect(css).toMatch(
      /prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\.region[\s\S]*?transition:\s*none/,
    );
  });

  it("aucune parallaxe résiduelle (retirée — différée hors modèle, SPINE L272)", () => {
    expect(css).not.toMatch(/parallax/i);
    expect(scene).not.toMatch(/parallax/i);
    expect(scene).not.toMatch(/mousemove/);
  });
});

describe("Doublage non-spatial + focus (AC3)", () => {
  it("une navigation NOMMÉE (<nav aria-label>) tirée du modèle expose des liens", () => {
    expect(scene).toMatch(/<nav[^>]*aria-label=/);
    expect(scene).toMatch(/REGIONS\.map/);
  });

  it("les régions inactives sont retirées du focus et du lecteur (aria-hidden + inert)", () => {
    expect(scene).toMatch(/aria-hidden=/);
    expect(scene).toMatch(/\binert\b/);
  });

  it("le focus est déplacé vers l'entête de la région activée", () => {
    expect(scene).toMatch(/\.focus\(\)/);
  });

  it("l'anneau de focus est visible partout et JAMAIS supprimé (outline présent, aucun outline: none)", () => {
    expect(css).toMatch(/outline:\s*2px/);
    expect(css).not.toMatch(/outline:\s*none/);
  });

  it("aucune ombre portée de texte (le voile porte la lisibilité — AC5)", () => {
    expect(css).not.toMatch(/text-shadow\s*:/);
  });
});

/**
 * ══ [2026-08-26] LA PROMOTION DES ÉTOILES, ET SON RELÂCHEMENT ═════════════════════════════════
 *
 * Mesuré trois fois de suite en CI : le champ d'étoiles coûte 57 des 62 images par seconde du
 * mobile — 5 im/s au seuil avec lui, 62 sans (`e2e/ligne-de-base.json`,
 * `_mesure_des_couches_2026-08-26`). Quatre-vingts animations d'`opacity` qui ne sont pas promues
 * en couches obligent le navigateur à repeindre, à chaque trame, tout ce qu'il y a dessous.
 *
 * `will-change: opacity` demande cette promotion. Il doit être RELÂCHÉ sous
 * `prefers-reduced-motion` : `animation: none` fige le ciel, mais la promotion, elle, resterait —
 * quatre-vingts couches et leurs tampons retenus pour une image immobile, à la charge de la
 * personne qui a précisément demandé qu'il n'y ait plus rien à animer.
 *
 * ⚠️ AUCUNE GARDE DE PIXELS NE PEUT VOIR CE DÉFAUT. `will-change` ne peint rien. La comparaison
 * octet à octet de `e2e/barre-basse.spec.ts`, qui photographie pourtant cet écran exact sous
 * `prefers-reduced-motion`, resterait identique. Ce relâchement n'est tenu que par ici.
 *
 * ⚠️ ET LA GARDE DÉPOUILLE LES COMMENTAIRES AVANT DE LIRE — `css` l'a déjà fait en tête de
 * fichier. Ce n'est pas une précaution de principe : les commentaires que je viens d'écrire dans
 * `monde.module.css` contiennent LITTÉRALEMENT les chaînes `will-change: opacity` et
 * `will-change`. Une garde qui lirait la source brute passerait au vert sur un mutant qui a retiré
 * la déclaration mais gardé la prose qui l'explique. C'est la cinquième fois que ce piège se
 * présente dans ce dépôt ; c'est la cinquième fois qu'il est désamorcé de la même façon.
 */
describe("[2026-08-26] Le champ d'étoiles est promu, et dé-promu quand on demande moins de mouvement", () => {
  /** Le bloc `.etoile` DE BASE, hors média-requête : du sélecteur à son accolade fermante. */
  const etoileDeBase = /\n\.etoile\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

  /** Le contenu du bloc `@media (prefers-reduced-motion: reduce)`, accolades équilibrées. */
  const blocReduit = (() => {
    const i = css.search(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
    if (i < 0) return "";
    let p = 0;
    const j = css.indexOf("{", i);
    for (let k = j; k < css.length; k++) {
      if (css[k] === "{") p++;
      else if (css[k] === "}") {
        p--;
        if (p === 0) return css.slice(j + 1, k);
      }
    }
    return "";
  })();

  it("témoin : les deux blocs ont bien été isolés", () => {
    // Sans ce témoin, une regex qui ne mord sur rien rendrait "" et les deux tests suivants
    // liraient le vide — verts pour toujours, sur n'importe quel code.
    expect(etoileDeBase, "bloc `.etoile` de base introuvable").toMatch(/background/);
    expect(blocReduit, "bloc reduced-motion introuvable").toMatch(/\.etoile/);
  });

  it("[LE CŒUR] `.etoile` demande sa propre couche — sinon chaque scintillement repeint la scène", () => {
    expect(
      etoileDeBase,
      "`will-change: opacity` a disparu de `.etoile` : les quatre-vingts animations retombent dans " +
        "le tampon partagé, et la scène est retombée à 5 im/s sur mobile (mesuré le 2026-08-26)",
    ).toMatch(/will-change:\s*opacity/);
  });

  it("[LE CŒUR] et sous reduced-motion elle la RELÂCHE — un ciel figé ne retient pas ses tampons", () => {
    const regleEtoile = /\.etoile\s*\{([^}]*)\}/.exec(blocReduit)?.[1] ?? "";
    expect(regleEtoile, "plus de règle `.etoile` sous reduced-motion").toMatch(/animation:\s*none/);
    expect(
      regleEtoile,
      "le ciel est figé mais sa promotion est maintenue : quatre-vingts couches retenues pour une " +
        "image immobile, à la charge de qui a demandé moins de mouvement",
    ).toMatch(/will-change:\s*auto/);
  });

  it("le témoin inverse : la garde lit bien le CODE et non la prose qui l'entoure", () => {
    // `css` est dépouillé de ses commentaires en tête de fichier. On le prouve ici plutôt que de
    // l'affirmer : la source BRUTE contient la chaîne dans un commentaire, la source dépouillée ne
    // doit la contenir QUE dans une déclaration. Si `sansCommentaires` cessait d'opérer, ce test
    // rougirait — et les deux ci-dessus deviendraient des passoires sans que rien ne le dise.
    const brut = readFileSync(resolve(racine, "render/monde.module.css"), "utf-8");
    const dansUnCommentaire = /\*[^\n]*will-change/.test(brut);
    expect(dansUnCommentaire, "la prose ne parle plus de `will-change` : ce témoin ne prouve plus rien").toBe(true);
    expect(
      /\*[^\n]*will-change/.test(css),
      "`sansCommentaires` n'opère plus : les gardes ci-dessus liraient les commentaires",
    ).toBe(false);
  });
});
