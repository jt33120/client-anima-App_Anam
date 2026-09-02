import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { ETAPES } from "@/lib/domain/copie-guide";
import { ENTREES_MENU } from "@/lib/domain/menu-compte";
import { REGIONS, nomDeRegion } from "@/lib/scene";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";

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
    // ⚠️ UN SEUIL NUMÉRIQUE DÉRIVE, ET IL A DÉRIVÉ (2026-08-25). Il valait « > 3 » quand la
    // surimpression portait quatre liens ; la Story 7.3 a retiré « Profil » au profit d'un glyphe,
    // et ce témoin est passé au rouge — pour une bonne raison mécanique, mais sans rien dire de ce
    // qui manquait. Un témoin d'anti-vacuité doit prouver que le RÉSOLVEUR marche, pas qu'un compte
    // n'a pas bougé. On nomme donc les chemins qu'il doit savoir résoudre : s'il en trouve moins,
    // c'est le résolveur qui est cassé, et le message le dit.
    expect(
      [...HREFS].sort(),
      "le résolveur de constantes ne retrouve plus les chemins permanents de la scène",
    ).toEqual(expect.arrayContaining(["/aide", "/abonnement"]));
    expect(HREFS.size, "aucun href résolu : les constantes ne se résolvent plus").toBeGreaterThan(1);
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
    const CITATION = /«\s*([A-ZÀ-Ý][^»]{1,20}?)\s*»/g;
    const cites = new Set<string>();
    for (const e of ETAPES) for (const m of e.texte.matchAll(CITATION)) cites.add(m[1]);

    // ⚠️ DEPUIS LE 2026-09-01, LE TOUR PEUT NE CITER AUCUNE SURFACE ENTRE GUILLEMETS : les cinq
    // étapes courtes nomment le socle et les univers sans « ». `cites` peut donc être vide, et
    // cette garde verte pour une mauvaise raison. On prouve l'extracteur sur une phrase fabriquée
    // pour qu'elle morde le jour où une citation revient, plutôt que de la retirer.
    expect([...`Il t’attend dans « Ton socle », en entier.`.matchAll(CITATION)].map((m) => m[1])).toEqual([
      "Ton socle",
    ]);

    // ⚠️ CE QUE « LA SCÈNE PORTE » A GRANDI LE 2026-08-25, ET LA GARDE DOIT SUIVRE — sans quoi elle
    // interdirait de parler de ce qui est désormais atteignable.
    //
    // La scène rend une FEUILLE de menu (Story 7.3) dont les entrées descendent de
    // `lib/domain/menu-compte.ts` par propriété : `render/` n'a pas le droit d'importer le domaine
    // (AD-7/AD-10), donc leurs libellés n'apparaissent PAS dans la clôture d'imports de la scène.
    // Chercher « Ton socle » dans le seul code de rendu revenait à ignorer neuf portes réelles.
    //
    // Ce n'est pas un assouplissement : le corpus de référence est toujours fermé et vérifié —
    // il compte maintenant deux sources au lieu d'une, et chacune est ce que la scène rend
    // vraiment. Un mot inventé reste introuvable dans les deux.
    const portees = SOURCE_SCENE + "\n" + ENTREES_MENU.map((e) => `${e.titre} ${e.quoi}`).join("\n");
    const introuvables = [...cites].filter((mot) => !portees.includes(mot));
    expect(
      introuvables,
      `le tour nomme des surfaces que la scène ne rend pas : ${introuvables.join(", ")}`,
    ).toEqual([]);
  });
});

/**
 * ══ [FONDATEUR 2026-09-01] LE TOUR EST COURT, HUMAIN, ET COMPTE CINQ ÉTAPES ═════════════════════
 *
 * Retour terrain, mot pour mot : « Les textes du tutoriel ne sont pas clairs, trop générés par IA.
 * Pas de "-". Trop directif. Il faut que les gens se sentent en confiance. [...] Retire l'étape
 * "Et si tu perds le fil". Beaucoup plus concis, une ou deux phrases très simples par étape. »
 *
 * Ce qui se mesure ici est de la FORME, sans lire le sens : le nombre d'étapes, le nombre de
 * phrases et de caractères, l'absence de tiret, la présence de la phrase du fondateur sur l'arbre,
 * l'absence de futur adressé (FR-053), et l'absence de collision entre un titre d'étape et un
 * <h2> de l'écran où la bulle se pose. La chaleur et la clarté restent une relecture humaine ;
 * ces gardes empêchent seulement que le tour regrossisse sans qu'on le décide.
 *
 * ⚠️ GARDES D'ABSENCE, DONC ÉPROUVÉES POUR ELLES-MÊMES : le compteur de phrases, le détecteur de
 * tiret et l'extracteur de <h2> sont chacun vérifiés sur des chaînes fabriquées connues-mauvaises
 * ET connues-bonnes, sans quoi une expression régulière cassée laisserait tout au vert.
 */
describe("[fondateur 2026-09-01] le tour tient en cinq étapes d'une ou deux phrases, sans tiret", () => {
  const TIRET = /[—–]/;
  /** « Une ou deux phrases très simples » : la borne est nommée, pas devinée. */
  const PHRASES_MAX = 2;
  /** Mesuré en points de code, pas en octets : « é » et « ’ » comptent pour un. */
  const CARACTERES_MAX = 200;
  /** Même découpe que `tests/corpus-architecture.test.ts` : un point, un `!` ou un `?` final. */
  const nombreDePhrases = (texte: string) =>
    texte.split(/[.!?]+(?:\s+|$)/).filter((p) => p.trim().length > 0).length;

  /** Les <h2> LITTÉRAUX que l'accueil rend : c'est là que se posent les trois premières bulles. */
  const FICHIERS_ACCUEIL = ["render/premier-passage.tsx", "render/accueil/Bibliotheque.tsx"];
  const h2Rendus = (src: string) =>
    [...sansCommentaires(src).matchAll(/<h2\b[^>]*>\s*([^<{]+?)\s*<\/h2>/g)].map((m) => m[1]);
  const H2_ACCUEIL = FICHIERS_ACCUEIL.flatMap((f) => h2Rendus(lire(f)));
  /**
   * Les NOMS DE RÉGION, lus au catalogue et jamais recopiés ici (`tests/scene-modele.test.ts` [7.9]).
   *
   * ⚠️ POURQUOI ILS COMPTENT COMME DES TITRES (2026-09-02). La région d'accueil s'appelle
   * « Aujourd’hui » depuis le retour du fondateur (E1-S4), et son <h1> dit ce nom sur l'écran même
   * où se posent les trois premières bulles. Un titre d'étape qui reprendrait un nom de région
   * redoublerait ce <h1> exactement comme il redoublerait un <h2> : deux entêtes de même nom sur un
   * écran, et un lecteur d'écran ne les distingue plus. C'est le mot que E1-S5 interdit nommément
   * pour l'étape 3. Lire le catalogue plutôt que recopier le nom fait suivre cette garde au prochain
   * renommage sans qu'une ligne change ; le h2 interne de la section quotidienne, lui, dit
   * « Ce que le jour propose » (décision D7) précisément pour ne plus porter le nom de la région.
   *
   * ⚠️ « Anam » EST EXCLU, pour la raison qu'écrit `tests/scene-modele.test.ts` : c'est le nom du
   * PRODUIT autant que celui d'une région, et l'étape qui présente Anam s'intitule « Anam » par
   * décision du fondateur (E1-S5). Le <h1> de cette région et ce titre disent le même mot parce
   * qu'ils désignent la même personne, pas parce qu'un titre a été recopié d'un entête. Les noms
   * qui BOUGENT, eux, sont tous couverts.
   */
  const NOM_DU_PRODUIT = "Anam";
  const NOMS_DE_REGION = REGIONS.map((r) => r.nom).filter((n) => n !== NOM_DU_PRODUIT);
  /** Tout ce qu'un titre d'étape n'a pas le droit de répéter : les <h2> de l'accueil et les régions. */
  const TITRES_INTERDITS = [...H2_ACCUEIL, ...NOMS_DE_REGION];

  it("[LE CŒUR] cinq étapes, et plus aucune sur le « ? » de secours", () => {
    expect(ETAPES, "le tour a regrossi, ou une étape a disparu sans qu'on le décide").toHaveLength(5);
    // L'étape retirée visait `[class*='porteSecours']` et s'appelait « Et si tu perds le fil ».
    // Le « ? » reste sur chaque écran (FR-077) : il n'a pas besoin d'un tour pour exister.
    expect(ETAPES.map((e) => e.titre)).not.toContain("Et si tu perds le fil");
    expect(ETAPES.filter((e) => e.cible?.includes("porteSecours")).map((e) => e.titre)).toEqual([]);
    // Et l'ordre du parcours tient : on atterrit sur l'accueil, on finit sur l'arbre.
    expect(ETAPES[0].region).toBe("accueil");
    expect(ETAPES[ETAPES.length - 1].region).toBe("arbre");
  });

  it("[LE CŒUR] chaque étape tient en une ou deux phrases et 200 caractères au plus", () => {
    const trop = ETAPES.filter(
      (e) => nombreDePhrases(e.texte) > PHRASES_MAX || [...e.texte].length > CARACTERES_MAX,
    ).map((e) => `« ${e.titre} » : ${nombreDePhrases(e.texte)} phrases, ${[...e.texte].length} caractères`);
    expect(trop, "le tour est redevenu verbeux").toEqual([]);
    // Et jamais une étape vide : « une ou deux » commence à une.
    for (const e of ETAPES) expect(nombreDePhrases(e.texte), `« ${e.titre} » est vide`).toBeGreaterThan(0);
    // Un titre est un nom, pas une phrase : court, sans ponctuation finale.
    for (const e of ETAPES) {
      expect([...e.titre].length, `le titre « ${e.titre} » est trop long`).toBeLessThanOrEqual(30);
      expect(e.titre, `le titre « ${e.titre} » se termine comme une phrase`).not.toMatch(/[.!?]$/);
    }
  });

  it("[LE CŒUR] aucun tiret cadratin ni demi-cadratin, ni dans les étapes ni dans aucune chaîne du module", () => {
    for (const e of ETAPES) {
      expect(e.titre, `un tiret dans le titre « ${e.titre} »`).not.toMatch(TIRET);
      expect(e.texte, `un tiret dans « ${e.titre} »`).not.toMatch(TIRET);
    }
    // Les libellés de boutons aussi : le source est lu commentaires retirés, pour qu'un tiret glissé
    // dans une chaîne future rougisse sans qu'on pense à l'exercer (patron d'`ouverture-seance`).
    expect(sansCommentaires(lire("lib/domain/copie-guide.ts"))).not.toMatch(TIRET);
  });

  it("[LE CŒUR] le tour tutoie, au présent, et ne s'adresse à personne au futur (FR-053)", () => {
    for (const e of ETAPES) {
      expect(e.texte, `« ${e.titre} » ne tutoie pas`).toMatch(/(?<![\p{L}’])(?:tu|te|ton|ta|tes|toi)(?![\p{L}])|(?<![\p{L}])t’/iu);
      const trouvees = chercherPredictions(`${e.titre}. ${e.texte}`);
      expect(trouvees, `« ${e.titre} » prédit : ${JSON.stringify(trouvees)}`).toEqual([]);
    }
    // Contrôle du contrôle : la version que « tu verras » aurait donnée est bien attrapée.
    expect(chercherPredictions("Tu verras, il grandira avec toi.").length).toBeGreaterThan(0);
  });

  it("[LE CŒUR] l'étape de l'arbre dit la phrase du fondateur : il « grandit et évolue avec toi »", () => {
    // « Au fur et à mesure que tu as des compréhensions, l'arbre grandit et évolue avec toi. »
    // Le mot « compréhensions » et le fragment final sont tenus tels quels : c'est la promesse
    // qu'il a choisie, pas une paraphrase.
    const arbre = ETAPES.filter((e) => e.region === "arbre");
    expect(arbre, "le tour ne passe plus par l'arbre").toHaveLength(1);
    expect(arbre[0].texte).toContain("compréhensions");
    expect(arbre[0].texte).toContain("grandit et évolue avec toi");
  });

  it("[LE CŒUR] aucun titre d'étape ne répète un <h2> rendu sur l'accueil, ni un nom de région", () => {
    // ⚠️ POURQUOI : la bulle du tour porte un <h2> (`render/guide/Guide.tsx`, `guide-titre`), et
    // les trois premières étapes se posent sur l'accueil, qui en rend déjà : « Trois dimensions »
    // (premier passage, exactement quand le tour se joue) et « Ce que le jour propose » (section
    // quotidienne, qui disait « Aujourd’hui » jusqu'au 2026-09-02 : ce mot est devenu le nom de la
    // RÉGION, donc son <h1>, et le h2 a cédé la place, décision D7). Deux entêtes de même nom sur un
    // écran, et un lecteur d'écran ne les distingue plus : c'est ce qui est arrivé le 2026-08-25
    // avec « Trois places ». Les titres sont donc comparés aux <h2> RÉELLEMENT rendus et aux noms
    // de région RÉELLEMENT catalogués, pas à une liste recopiée ici.
    expect(
      H2_ACCUEIL,
      "l'extracteur ne retrouve plus les <h2> connus de l'accueil : la garde ne mesure rien",
    ).toEqual(expect.arrayContaining(["Trois dimensions", "Ce que le jour propose"]));
    expect(NOMS_DE_REGION.length, "aucun nom de région lu au catalogue : la garde ne mesure rien").toBeGreaterThan(0);
    const collisions = ETAPES.map((e) => e.titre).filter((t) => TITRES_INTERDITS.includes(t));
    expect(collisions, "un titre d'étape porte le même nom qu'un <h2> de l'accueil ou qu'une région").toEqual([]);
  });

  it("[ANTI-VACUITÉ] le compteur de phrases, le détecteur de tiret et l'extracteur de <h2> mordent", () => {
    expect(nombreDePhrases("Une. Deux ! Trois ?")).toBe(3);
    expect(nombreDePhrases("Ici, ce qui change : ton ciel, ton mantra. Le reste t’attend.")).toBe(2);
    expect(nombreDePhrases("Une seule phrase sans point final")).toBe(1);
    expect(TIRET.test("Ton thème — en entier")).toBe(true);
    expect(TIRET.test("de 9 h – 12 h")).toBe(true);
    expect(TIRET.test("Ton socle, lui : en entier. Un trait-d’union reste libre.")).toBe(false);
    expect(h2Rendus(`<h2 id="x" className={\`a \${s.b}\`}>Aujourd’hui</h2><h2>{carte.titre}</h2>`)).toEqual([
      "Aujourd’hui",
    ]);
    expect(h2Rendus(`{/* <h2>Trois places</h2> */}<h3>Pas un h2</h3>`)).toEqual([]);
    // Et la liste des titres interdits porte bien le nom de la région d'accueil, lu au catalogue :
    // un titre d'étape fabriqué avec ce nom serait une collision.
    const fabrique = [nomDeRegion("accueil")].filter((t) => TITRES_INTERDITS.includes(t));
    expect(fabrique, "un titre d'étape au nom de la région d'accueil passerait").toHaveLength(1);
  });
});
