import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * design-centralise.test.ts — UNE SEULE SOURCE POUR TOUT LE STYLE (2026-09-03).
 *
 * Retour de Julian : « pour le front, que toutes les couleurs et le design soient dans des CSS de
 * design qu'il suffit de modifier pour modifier l'ensemble du style du projet, plutôt que des
 * styles définis dans les pages du front. Ça sera plus propre et plus facile à modifier. »
 *
 * ── CE QUI EXISTAIT DÉJÀ, ET CE QUI MANQUAIT ───────────────────────────────────────────────────
 *
 * La promesse était DÉJÀ tenue à 99 % : sur 37 feuilles, deux seulement portaient une couleur
 * écrite à la main (deux ombres noires), et `app/layout.tsx` recopiait `--fond` pour la barre du
 * système. Ce qui manquait n'était pas la discipline, c'était la GARDE : `couleurs-tokenisees`
 * ne couvrait QUE quatre feuilles nommées, et rien n'empêchait la trente-cinquième d'écrire un
 * `#3A4B6C` demain.
 *
 * Une propriété vraie sans garde n'est pas une propriété : c'est une coïncidence qui dure.
 *
 * ── CE QUE CE FICHIER TIENT ────────────────────────────────────────────────────────────────────
 *
 *   1. AUCUNE COULEUR BRUTE dans AUCUNE feuille du produit — découverte récursive, pas une liste ;
 *   2. AUCUNE COULEUR dans un style en ligne : `style={{ color: … }}` remet une décision de design
 *      dans une page, exactement ce que le retour refuse ;
 *   3. LA BARRE DU SYSTÈME lit le jeton au lieu de le recopier.
 *
 * Il ne garde PAS les distances (`padding: clamp(28px, 8vw, 52px)`, un rayon en pixels). Les
 * exiger toutes en jetons rendrait rouge une trentaine de valeurs légitimes — une garde qu'on
 * apprend à contourner ne garde plus rien. La COULEUR, elle, n'a aucune exception défendable.
 *
 * ── CE QU'IL NE TIENT PAS, ET POURQUOI ─────────────────────────────────────────────────────────
 *
 * Les deux palettes de CANEVAS (`PALETTE_LUNAIRE` dans `render/arbre/MoteurArbreLunaire.ts`, et les
 * dégradés de `render/arbre-vivant.tsx`) restent hors jetons. Ce ne sont pas des couleurs
 * d'interface : ce sont des valeurs d'un handoff d'illustration, gelées par décision (D6) et
 * éprouvées au hex près par `tests/arbre-lunaire.test.ts`. Les brancher sur la palette reviendrait
 * à laisser une retouche de thème repeindre un dessin. C'est écrit ici pour que l'exception soit
 * VUE plutôt que découverte.
 */

const RACINE = process.cwd();
const lire = (p: string) => readFileSync(resolve(RACINE, p), "utf-8");

/** Toutes les feuilles du produit, découvertes — jamais une liste, qui oublierait la suivante. */
function feuilles(dir: string, trouvees: string[] = []): string[] {
  for (const entree of readdirSync(resolve(RACINE, dir), { withFileTypes: true })) {
    const chemin = `${dir}/${entree.name}`;
    if (entree.isDirectory()) feuilles(chemin, trouvees);
    else if (entree.name.endsWith(".css")) trouvees.push(chemin);
  }
  return trouvees;
}

/** Les composants du front, découverts de la même façon. */
function composants(dir: string, trouves: string[] = []): string[] {
  for (const entree of readdirSync(resolve(RACINE, dir), { withFileTypes: true })) {
    const chemin = `${dir}/${entree.name}`;
    if (entree.isDirectory()) composants(chemin, trouves);
    else if (entree.name.endsWith(".tsx")) trouves.push(chemin);
  }
  return trouves;
}

/**
 * Le CODE seul : commentaires et URI `data:` blanchis (jamais retirés, pour que les numéros de
 * ligne restent ceux du fichier qu'on ouvrira). Même règle que `couleurs-tokenisees`.
 */
function codeSeul(css: string): string {
  const blanchir = (s: string) => s.replace(/[^\n]/g, " ");
  return css
    .replace(/\/\*[\s\S]*?\*\//g, blanchir)
    .replace(/url\(\s*"data:[^"]*"\s*\)/g, blanchir)
    .replace(/url\(\s*'data:[^']*'\s*\)/g, blanchir)
    .replace(/url\(\s*data:[^)]*\)/g, blanchir);
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FONCTION = /\b(?:rgb|hsl)a?\(/gi;

/**
 * LE FICHIER DE DESIGN — le seul endroit du produit où une couleur a le droit d'être écrite.
 *
 * `globals.css` est le REFLET de `app/styles/tokens.ts` (la parité le vérifie valeur par valeur) :
 * c'est donc bien un seul endroit à modifier, en deux fichiers tenus ensemble.
 */
const FICHIER_DE_DESIGN = "app/styles/globals.css";

describe("[LE CŒUR] une seule feuille porte des couleurs, toutes les autres n'ont que des jetons", () => {
  const toutes = [...feuilles("app"), ...feuilles("render")].sort();

  it("[ANTI-VACUITÉ] le balayage trouve bien les feuilles du produit", () => {
    // Sans ce témoin, une découverte cassée rendrait tous les refus ci-dessous vrais sur zéro
    // fichier — le mode d'échec exact d'une garde par balayage.
    expect(toutes.length).toBeGreaterThan(30);
    expect(toutes).toContain(FICHIER_DE_DESIGN);
    expect(toutes).toContain("render/monde.module.css");
  });

  it("aucune couleur brute hors du fichier de design", () => {
    // Mutation-cible : `color: #C9C6BD` dans n'importe quelle feuille. C'est la copie d'un jeton
    // prise un jour donné, et elle restera juste-en-apparence après la prochaine retouche.
    const fautives: string[] = [];
    for (const f of toutes) {
      if (f === FICHIER_DE_DESIGN) continue;
      codeSeul(lire(f))
        .split("\n")
        .forEach((ligne, i) => {
          for (const m of ligne.matchAll(HEX)) fautives.push(`${f} L${i + 1} ${m[0]}`);
          for (const m of ligne.matchAll(FONCTION)) fautives.push(`${f} L${i + 1} ${m[0]}`);
        });
    }
    expect(fautives, `couleurs hors du fichier de design :\n${fautives.join("\n")}`).toEqual([]);
  });

  it("[ANTI-VACUITÉ] le motif mord vraiment sur une couleur plantée", () => {
    const planté = codeSeul(".x { color: #C9C6BD; background: rgba(0,0,0,.2); }");
    expect([...planté.matchAll(HEX)].length).toBe(1);
    expect([...planté.matchAll(FONCTION)].length).toBe(1);
  });
});

describe("[LE BORD] aucune décision de design ne redescend dans une page", () => {
  const pages = [...composants("app"), ...composants("render")];

  it("[ANTI-VACUITÉ] les composants du front sont bien balayés", () => {
    expect(pages.length).toBeGreaterThan(30);
  });

  it("aucun style en ligne ne porte une couleur", () => {
    // Les styles en ligne restants ne font que de la MISE EN PAGE (`display`, `flex`, une variable
    // CSS passée à un composant). C'est la COULEUR qui n'a rien à y faire : elle appartient au
    // fichier de design, et une page qui en décide est un second endroit à relire.
    const fautives: string[] = [];
    for (const f of pages) {
      const src = lire(f).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ");
      for (const m of src.matchAll(/style=\{\{([^}]*)\}\}/g)) {
        if (/\b(color|background|border|boxShadow|fill|stroke)\w*\s*:/i.test(m[1])) {
          fautives.push(`${f} → ${m[1].trim().slice(0, 60)}`);
        }
      }
    }
    expect(fautives, `couleur décidée dans une page :\n${fautives.join("\n")}`).toEqual([]);
  });

  it("la couleur de la barre du système est LUE dans les jetons, pas recopiée", () => {
    // Mutation-cible : `themeColor: "#1C2740"`. Vrai le jour où on l'écrit, faux au premier
    // changement de fond — et personne ne regarde la barre d'état en relisant une palette.
    const layout = lire("app/layout.tsx");
    expect(layout).toContain("themeColor: couleursNuit.fond");
    expect(layout, "une couleur écrite à la main est revenue dans le layout").not.toMatch(
      /themeColor:\s*"#/,
    );
  });
});

describe("[LE BORD] les exceptions sont NOMMÉES, pas découvertes", () => {
  it("les deux palettes de canevas sont les seules, et elles sont écrites ici", () => {
    // Ce ne sont pas des couleurs d'interface : ce sont des valeurs d'un handoff d'illustration,
    // gelées par décision (D6). Cette garde existe pour qu'une TROISIÈME île ne s'ouvre pas en
    // silence : le jour où un composant neuf peint au hex, ce test le nomme.
    // (Le moteur `render/arbre/MoteurArbreLunaire.ts` porte la troisième, `PALETTE_LUNAIRE` ; il
    // n'est pas un `.tsx`, donc hors de ce balayage, et `tests/arbre-lunaire.test.ts` l'éprouve
    // déjà au hex près.)
    const iles = composants("render")
      .filter((f) =>
        /#[0-9a-fA-F]{6}\b/.test(lire(f).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ")),
      )
      .sort();
    expect(iles, "une île de couleur s'est ouverte dans un composant").toEqual([
      "render/arbre-vivant.tsx",
      "render/conversation/LotusAttente.tsx",
    ]);
  });
});
