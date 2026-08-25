import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { ETAPES } from "@/lib/domain/copie-guide";

/**
 * guide-cibles.test.ts — LE TOUR GUIDÉ NE DÉSIGNE QUE CE QUE LA SCÈNE REND (2026-08-25).
 *
 * ══ LE DÉFAUT ═══════════════════════════════════════════════════════════════════════════════════
 *
 * La dernière étape visait `a[href='/reperes']` et disait « "Repères" est là en haut de chaque
 * écran ». Le lien avait été retiré de la surimpression le 2026-08-23, quand Repères a été replié
 * dans `/aide`. L'étape a donc décrit une interface qui n'existait plus.
 *
 * ⚠️ ET LE PRODUIT ÉTAIT CONSTRUIT POUR NE PAS LE VOIR. `render/guide/Guide.tsx` franchit SANS
 * BRUIT une étape dont la cible est absente — c'est délibéré et juste (un compte sans arbre saute
 * l'étape de l'arbre). Mais ce mécanisme transforme « cette étape ment » en « cette étape ne
 * s'affiche pas ». Aucun test ne pouvait rougir. Pire : `premier-passage.tsx` rendait encore un
 * lien vers `/reperes`, et le tour se joue au premier passage — la cible était trouvée, l'étape
 * s'affichait, et elle était fausse.
 *
 * ══ LA PREMIÈRE VERSION DE CETTE GARDE ÉTAIT VERTE ET NE PROUVAIT RIEN ══════════════════════════
 *
 * Elle cherchait le jeton dans TOUT `render/` + `app/`, commentaires compris. Elle trouvait donc
 * « /reperes » dans `app/reperes/`, la halte de DESTINATION, et « Repères » dans trois commentaires
 * qui racontent justement son retrait. Le mutant du défaut d'origine a survécu, et c'est ce qui a
 * appris ce que cette garde devait mesurer.
 *
 * On mesure donc CE QUE LA SCÈNE REND : la clôture d'imports de `render/scene-dom.tsx`, décommentée.
 * Les hrefs sont résolus à travers les constantes (`href={URL_AIDE}` → « /aide »), sans quoi aucun
 * lien du produit ne serait vérifiable — ils passent tous par une constante.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

/** Les gardes testent le CODE, pas la prose : trois commentaires racontent le retrait de Repères. */
const sansCommentaires = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** Résout les imports d'un fichier (patron de `tests/csp-nempeche-pas-le-produit.test.ts`). */
function importsDe(fichier: string): string[] {
  const cibles: string[] = [];
  for (const m of lire(fichier).matchAll(/from\s+["']([^"']+)["']/g)) {
    const spec = m[1];
    let base: string | null = null;
    if (spec.startsWith("@/")) base = spec.slice(2);
    else if (spec.startsWith(".")) base = join(dirname(fichier), spec);
    if (!base) continue;
    for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
      if (existsSync(resolve(RACINE, base + ext))) {
        cibles.push(base + ext);
        break;
      }
    }
  }
  return cibles;
}

/** La clôture d'imports depuis la racine de la scène — ce qui est RÉELLEMENT monté autour du tour. */
function cloture(racine: string): string[] {
  const vus = new Set<string>();
  const pile = [racine];
  while (pile.length) {
    const f = pile.pop()!;
    if (vus.has(f)) continue;
    vus.add(f);
    for (const suivant of importsDe(f)) if (!vus.has(suivant)) pile.push(suivant);
  }
  return [...vus];
}

const SCENE = cloture("render/scene-dom.tsx");
const SOURCE_SCENE = SCENE.map((f) => sansCommentaires(lire(f))).join("\n");

/**
 * Toutes les constantes de chemin du dépôt (`export const URL_X = "/y"`). Sans elles, un `href`
 * serait invérifiable : aucun lien de ce produit n'écrit son URL en clair dans le JSX.
 */
function constantesDeChemin(): Map<string, string> {
  const carte = new Map<string, string>();
  const parcourir = (dossier: string) => {
    for (const e of readdirSync(resolve(RACINE, dossier))) {
      const p = join(dossier, e);
      if (statSync(resolve(RACINE, p)).isDirectory()) parcourir(p);
      else if (p.endsWith(".ts"))
        for (const m of lire(p).matchAll(/export const ([A-Z_0-9]+)\s*=\s*["'](\/[^"']*)["']/g))
          carte.set(m[1], m[2]);
    }
  };
  parcourir("lib");
  return carte;
}
const CHEMINS = constantesDeChemin();

/** Les hrefs que la scène rend RÉELLEMENT, constantes résolues. */
function hrefsDeLaScene(): Set<string> {
  const sortie = new Set<string>();
  for (const m of SOURCE_SCENE.matchAll(/href=\{([A-Z_0-9]+)\}/g)) {
    const v = CHEMINS.get(m[1]);
    if (v) sortie.add(v);
  }
  for (const m of SOURCE_SCENE.matchAll(/href=["']([^"']+)["']/g)) sortie.add(m[1]);
  return sortie;
}
const HREFS = hrefsDeLaScene();

/** Les classes de module que la scène pose (`s.porteSecours`, `${s.foo}`). */
function classesDeLaScene(): Set<string> {
  const sortie = new Set<string>();
  for (const m of SOURCE_SCENE.matchAll(/\bs\.([A-Za-z0-9_]+)/g)) sortie.add(m[1]);
  return sortie;
}
const CLASSES = classesDeLaScene();

/** Ce qu'une alternative de sélecteur exige, et de quelle nature. */
function exigence(part: string): { genre: "classe" | "href" | "balise"; jeton: string } {
  const classe = /\[class\*=['"]([^'"]+)['"]\]/.exec(part);
  if (classe) return { genre: "classe", jeton: classe[1] };
  const href = /\[href=['"]([^'"]+)['"]\]/.exec(part);
  if (href) return { genre: "href", jeton: href[1] };
  return { genre: "balise", jeton: part };
}

function satisfaite(selecteur: string): boolean {
  return selecteur.split(",").map((x) => x.trim()).some((part) => {
    const { genre, jeton } = exigence(part);
    if (genre === "href") return HREFS.has(jeton);
    if (genre === "classe") return [...CLASSES].some((c) => c.includes(jeton));

    // ⚠️ LE REPLI ACCEPTAIT N'IMPORTE QUELLE BALISE, ET UN MUTANT L'A DIT. `nav[aria-label='Régions']`
    // se contentait de trouver un `<nav` quelque part : renommer la barre en « Zones » sans toucher
    // au tour passait au vert. On exige désormais AUSSI la valeur de l'attribut — c'est elle qui
    // identifie l'élément, la balise ne fait que le typer.
    const attribut = /\[[a-z-]+=['"]([^'"]+)['"]\]/.exec(part);
    const balise = part.replace(/\[.*/, "").trim();
    const baliseOk = balise === "" || SOURCE_SCENE.includes(`<${balise}`);
    if (attribut) return baliseOk && SOURCE_SCENE.includes(attribut[1]);
    return baliseOk;
  });
}

describe("[2026-08-25] Chaque étape du tour désigne quelque chose que la SCÈNE rend", () => {
  const avecCible = ETAPES.filter((e) => e.cible !== null);

  it("[CONTRÔLE DU CONTRÔLE] la clôture de la scène est réelle, et elle a des liens et des classes", () => {
    // Sans ceci, tout ce fichier serait vert sur un corpus vide — le défaut que la version
    // précédente de cette garde a effectivement commis.
    expect(SCENE.length, "la clôture d’imports de la scène est vide").toBeGreaterThan(15);
    expect(HREFS.size, "aucun href résolu : les constantes ne se résolvent plus").toBeGreaterThan(3);
    expect(CLASSES.size, "aucune classe de module trouvée").toBeGreaterThan(20);
    expect(avecCible.length, "plus aucune étape ciblée").toBeGreaterThan(3);
  });

  it("[LE CŒUR] aucune cible ne vise un élément que la scène ne rend plus", () => {
    const orphelines = avecCible
      .filter((e) => !satisfaite(e.cible!))
      .map((e) => `« ${e.titre} » → ${e.cible}`);
    expect(
      orphelines,
      `des étapes désignent le vide : elles seront sautées en silence, ou pire, elles décriront ` +
        `une interface disparue —\n${orphelines.join("\n")}`,
    ).toEqual([]);
  });

  it("[LE CŒUR] et le tour ne NOMME pas une surface que la scène ne porte plus", () => {
    // Le vrai défaut était là : la cible existait encore (au premier passage), mais le TEXTE
    // parlait de « Repères en haut de chaque écran » alors que la surimpression ne le portait plus.
    const cites = new Set<string>();
    for (const e of ETAPES)
      for (const m of e.texte.matchAll(/«\s*([A-ZÀ-Ý][^»]{1,20}?)\s*»/g)) cites.add(m[1]);
    const introuvables = [...cites].filter((mot) => !SOURCE_SCENE.includes(mot));
    expect(
      introuvables,
      `le tour nomme des surfaces que la scène ne rend pas : ${introuvables.join(", ")}`,
    ).toEqual([]);
  });
});
