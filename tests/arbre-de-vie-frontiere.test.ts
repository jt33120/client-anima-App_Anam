import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * LA FRONTIÈRE DOMAINE ↔ RENDU DE LA HALTE « TON ARBRE DE VIE » (AD-7/AD-10, FR-031 DUR).
 *
 * ⚠️ CE FICHIER EXISTE PARCE QUE `tests/socle-frontiere.test.ts` NE PEUT PAS NOUS COUVRIR. Sa liste
 * `DECLARATIONS` est CODÉE EN DUR sur `fiche-socle.ts`, `render/socle/types.ts` et
 * `bibliotheque.ts` : un écran neuf avec sa propre frontière n'est vu par aucune de ses gardes.
 * Sans ce fichier, FR-031 cesserait d'être PROUVÉ pour la moitié de la numérologie, et personne ne
 * le remarquerait parce que rien ne rougirait.
 *
 * Trois choses sont tenues ici, et une quatrième qui n'existe pas dans le socle :
 *
 *   1. aucun champ ne porte le nom d'une mesure, DES DEUX CÔTÉS ;
 *   2. les deux formes coïncident champ pour champ — un champ ajouté d'un seul côté compile, et le
 *      rendu cesse simplement d'afficher quelque chose : le mode de panne le plus silencieux ;
 *   3. le rendu n'importe ni `lib/domain`, ni `lib/corpus`, ni `lib/data`, ni `@/app` ;
 *   4. ⚠️ ZÉRO CHAMP NUMÉRIQUE, là où le socle en tolère un (`type`, qui est une identité). Ici,
 *      tout nombre traverse déjà mis en mots : il n'y a littéralement aucune porte par où un compte
 *      de lettres pourrait entrer.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

const DOMAINE = lire("lib/domain/fiche-arbre-de-vie.ts");
const RENDU = lire("render/arbre-de-vie/types.ts");

/** Extrait le corps d'une déclaration `export interface X {` … `}` (première accolade fermante seule). */
function corpsInterface(source: string, nom: string): string {
  const debut = source.indexOf(`export interface ${nom} {`);
  if (debut < 0) return "";
  const fin = source.indexOf("\n}", debut);
  return fin < 0 ? "" : source.slice(debut, fin);
}

/** Les noms de champs déclarés, commentaires retirés — sinon on compare de la prose. */
function champs(corps: string): string[] {
  const sansCommentaires = corps.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  return [...sansCommentaires.matchAll(/^\s*readonly\s+([A-Za-z_]\w*)\??\s*:/gm)]
    .map((m) => m[1])
    .sort();
}

/** La même liste que `socle-frontiere`, recopiée volontairement : une garde ne s'importe pas. */
const MESURES = [
  "badge",
  "compte",
  "compteur",
  "total",
  "nouveau",
  "verrouille",
  "cadenas",
  "restant",
  "quantite",
  "progression",
  "completude",
  "pourcentage",
  "taux",
  "jauge",
  "etape",
];

const APPARIEMENTS: ReadonlyArray<[string, string]> = [
  ["ReparationFiche", "ReparationVue"],
  ["ManqueFiche", "ManqueVue"],
  ["PartieArbreFiche", "PartieArbreVue"],
  ["DefiFiche", "DefiVue"],
  ["QualiteFiche", "QualiteVue"],
  ["PastilleFiche", "PastilleVue"],
  ["FicheArbreDeVie", "FicheArbreDeVieVue"],
];

const DECLARATIONS = APPARIEMENTS.flatMap(([d, r]) => [
  { ou: `domaine ${d}`, corps: corpsInterface(DOMAINE, d) },
  { ou: `rendu ${r}`, corps: corpsInterface(RENDU, r) },
]);

describe("[FR-031 DUR] aucune des deux déclarations ne peut porter une mesure", () => {
  it("[CONTRÔLE DU CONTRÔLE] les quatorze déclarations ont bien été extraites", () => {
    // Sans ce témoin, tous les refus ci-dessous seraient vrais sur des chaînes vides — le mode
    // d'échec exact d'une garde dont l'extracteur casse.
    expect(DECLARATIONS).toHaveLength(14);
    for (const d of DECLARATIONS) {
      expect(d.corps, `déclaration introuvable : ${d.ou}`).not.toBe("");
      expect(champs(d.corps).length, `${d.ou} : aucun champ extrait`).toBeGreaterThan(0);
    }
  });

  it("[LE CŒUR] aucun champ ne porte le nom d'une mesure, des DEUX côtés", () => {
    for (const d of DECLARATIONS) {
      for (const champ of champs(d.corps)) {
        const nu = champ.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        for (const mesure of MESURES) {
          expect(
            nu.includes(mesure),
            `${d.ou} : le champ \`${champ}\` porte une mesure (${mesure})`,
          ).toBe(false);
        }
      }
    }
  });

  it("[LE CŒUR] les deux formes coïncident, champ pour champ", () => {
    for (const [d, r] of APPARIEMENTS) {
      expect(champs(corpsInterface(RENDU, r)), `${d} ≠ ${r}`).toEqual(
        champs(corpsInterface(DOMAINE, d)),
      );
    }
  });

  it("[FR-031] ZÉRO champ numérique dans toute la frontière, des deux côtés", () => {
    // Plus strict que le socle, qui tolère `type` parce qu'un type d'ennéagramme est une identité.
    // Ici le seul nombre qui aurait pu traverser est un COMPTE DE LETTRES DANS UN NOM, et il n'y a
    // aucune raison de lui laisser une porte : les valeurs arrivent en chaînes, les intensités en
    // énumérations déjà mises en mots.
    const porteurDeNombre = (source: string) => {
      const sansCommentaires = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      return [...sansCommentaires.matchAll(/^\s*readonly\s+([A-Za-z_]\w*)\??\s*:\s*([^;]+);/gm)]
        .filter(([, , forme]) => /\bnumber\b/.test(forme))
        .map(([, champ]) => champ)
        .sort();
    };
    expect(porteurDeNombre(DOMAINE), "domaine : un champ numérique est apparu").toEqual([]);
    expect(porteurDeNombre(RENDU), "rendu : un champ numérique est apparu").toEqual([]);
  });
});

describe("[AD-7/AD-10] le rendu de l'arbre ne connaît aucune couche de décision", () => {
  const FICHIERS_RENDU = (
    readdirSync(resolve(RACINE, "render/arbre-de-vie"), { encoding: "utf-8" }) as string[]
  ).map((f) => `render/arbre-de-vie/${f}`);

  it("[CONTRÔLE DU CONTRÔLE] le dossier a bien été balayé", () => {
    // Découvert, jamais énuméré : un fichier ajouté demain tombe sous la garde tout seul.
    expect(FICHIERS_RENDU.length, "dossier de rendu vide").toBeGreaterThanOrEqual(4);
    expect(FICHIERS_RENDU).toContain("render/arbre-de-vie/types.ts");
    expect(FICHIERS_RENDU).toContain("render/arbre-de-vie/FicheArbreDeVie.tsx");
  });

  it("aucun fichier n'importe lib/domain, lib/corpus, lib/data, lib/astro ni app", () => {
    for (const f of FICHIERS_RENDU.filter((f) => /\.tsx?$/.test(f))) {
      const src = lire(f);
      expect(src, `${f} importe une couche de décision`).not.toMatch(
        /from\s+["']@\/(?:lib\/(?:domain|corpus|data|astro)|app)/,
      );
    }
  });

  it("[FR-054/FR-086] le rendu ne fabrique AUCUN texte de corpus", () => {
    // Le défaut ciblé : un `?? ""` ou un `|| "Pas encore écrit"` qui ferait dire au rendu ce qu'il
    // n'a pas reçu. La phrase du silence descend par propriété, parce qu'elle parle au nom d'Anima.
    // ⚠️ COMMENTAIRES RETIRÉS. Ce dépôt EXPLIQUE ses interdits en prose, et le commentaire qui dit
    // « on n'écrit jamais “pas encore écrit” ici » est précisément ce qu'on veut GARDER : une garde
    // qui compte sa propre documentation mesure la documentation. Même précaution que
    // `tests/arbre-sans-fruit.test.ts`.
    const src = lire("render/arbre-de-vie/FicheArbreDeVie.tsx")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    expect(src, "le rendu complète un texte absent").not.toMatch(/\.texte\s*(?:\?\?|\|\|)/);
    expect(src, "une phrase de corpus est écrite en dur").not.toMatch(/pas encore écrit/i);
  });

  it("[VOIX] seul le corpus porte `t-anam` ; l'absence se dit en voix produit", () => {
    // Faire dire par Anima qu'Anima n'a pas écrit serait déjà lui prêter une phrase (FR-086).
    const src = lire("render/arbre-de-vie/FicheArbreDeVie.tsx");
    expect(src).toMatch(/t-anam \$\{s\.texte\}/);
    expect(src).toMatch(/t-corps \$\{s\.nonEcrit\}/);
  });
});

describe("[PERFORMANCE] la feuille de style de l'arbre n'a aucune propriété coûteuse", () => {
  it("ni flou, ni ombre portée, ni fusion de calques", () => {
    // Un flou plein écran a fait tomber l'application à quatre images par seconde le 2026-08-20.
    // La page est statique aujourd'hui ; la règle est là pour le jour où quelqu'un l'animera.
    const css = lire("render/arbre-de-vie/arbre-de-vie.module.css").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );
    for (const propriete of [
      "backdrop-filter",
      "filter:",
      "box-shadow",
      "drop-shadow",
      "mix-blend-mode",
      "animation",
    ]) {
      expect(css, `propriété coûteuse : ${propriete}`).not.toContain(propriete);
    }
  });

  it("les sept prises portent la cible tactile, et le dessin reste muet", () => {
    const css = lire("render/arbre-de-vie/arbre-de-vie.module.css");
    expect(css, "la pastille doit tenir 44 px à toutes les échelles").toMatch(
      /\.pastille\s*\{[^}]*min-height:\s*var\(--cible-tactile\)/,
    );
    const svg = lire("render/arbre-de-vie/SchemaArbre.tsx");
    expect(svg, "le dessin doit être annoncé comme une image").toMatch(/role="img"/);
    expect(svg, "aucun élément du dessin ne doit être focalisable").not.toMatch(
      /<(?:path|ellipse|circle|g)[^>]*tabIndex/,
    );
  });
});
