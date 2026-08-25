import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ENTREES_MENU, HORS_MENU, type EntreeMenu } from "@/lib/domain/menu-compte";
import { HALTES } from "@/lib/domain/pied-halte";

/**
 * menu-compte-frontiere.test.ts — [7.2 · FR-031 DUR · FR-077] LE CATALOGUE DU MENU DE COMPTE.
 *
 * ══ CETTE GARDE EST ÉCRITE AVANT LE COMPOSANT, ET C'EST LA MOITIÉ DE LA STORY ══════════════════
 *
 * Une garde écrite APRÈS le composant garde ce que le composant fait déjà : elle grave l'existant,
 * y compris ses défauts. Écrite avant, elle dit ce que le composant aura le droit de faire. La 7.3
 * dessinera la feuille ; ce fichier fixe d'avance ce qu'elle ne pourra pas y mettre.
 *
 * ⚠️ LE DÉFAUT VISÉ EST NOMMÉ : LE COMPTE FUIT PAR LE TYPE. C'est la leçon de la 4.10
 * (`arbitrage-frontiere`) puis de la 5.6 (`bibliotheque-frontiere`). La façon naturelle de poser une
 * pastille de non-lu sur « La synthèse » n'est pas d'écrire du CSS : c'est d'ajouter `aDuNouveau` au
 * type, et le rendu suit tout seul. S'il n'existe aucun champ où l'écrire, il n'y a rien à masquer.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

describe("[7.2/AC1] l'ordre est invariable, et il est vérifié POSITION PAR POSITION", () => {
  it("[LE CŒUR] les neuf entrées, dans l'ordre exact d'EXPERIENCE.md ligne 86 (amendée)", () => {
    // ⚠️ `toEqual` SUR UN TABLEAU, PAS `toContain` NEUF FOIS. L'appartenance à un ensemble serait
    // vraie sur n'importe quel tri — alphabétique, par fréquence, par récence — et c'est
    // précisément ce qu'« invariable » interdit : atteindre une entrée sans la lire, au bout de
    // trois usages, suppose qu'elle ne bouge jamais.
    expect(ENTREES_MENU.map((e: EntreeMenu) => e.titre)).toEqual([
      "Aide et ressources",
      "Ton socle",
      "Ce qu’Anam retient",
      "La synthèse",
      "Mes lectures",
      "L’abonnement",
      "Mes données",
      "Ce que j’ai accepté",
      "Réglages",
    ]);
  });

  it("[FR-077] « Aide et ressources » est PREMIÈRE, et elle mène à /aide", () => {
    expect(ENTREES_MENU[0].titre).toBe("Aide et ressources");
    expect(ENTREES_MENU[0].url).toBe("/aide");
  });

  it("[amendement du 2026-08-25 §1] « Ton socle » est DEUXIÈME", () => {
    expect(ENTREES_MENU[1].titre).toBe("Ton socle");
    expect(ENTREES_MENU[1].url).toBe("/socle");
  });

  it("le catalogue est gelé — un tri en place ne peut pas le réordonner", () => {
    expect(Object.isFrozen(ENTREES_MENU)).toBe(true);
  });
});

describe("[7.2/AC5 DUR · FR-031] aucun champ où loger un compte", () => {
  const SOURCE = lire("lib/domain/menu-compte.ts");

  function corpsInterface(source: string, nom: string): string {
    const debut = source.indexOf(`export interface ${nom} {`);
    if (debut < 0) return "";
    const fin = source.indexOf("\n}", debut);
    return fin < 0 ? "" : source.slice(debut, fin);
  }

  const CORPS = corpsInterface(SOURCE, "EntreeMenu");

  it("[CONTRÔLE DU CONTRÔLE] la déclaration a bien été extraite", () => {
    // Sans ce témoin, tous les refus ci-dessous seraient vrais sur une chaîne vide.
    expect(CORPS, "`EntreeMenu` introuvable").not.toBe("");
    expect(CORPS).toContain("readonly titre");
  });

  it("[LE CŒUR] trois champs, tous des chaînes — pas un de plus", () => {
    const sansCommentaires = CORPS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const champs = [...sansCommentaires.matchAll(/^\s*readonly\s+([A-Za-z_]\w*)\??\s*:\s*([^;]+);/gm)];
    expect(champs.map((m) => m[1]).sort()).toEqual(["quoi", "titre", "url"]);
    for (const [, nom, forme] of champs) {
      expect(forme.trim(), `\`${nom}\` n'est pas une chaîne`).toBe("string");
    }
  });

  it("aucune valeur du catalogue ne porte de compte ni de tournure d'état", () => {
    const texte = JSON.stringify(ENTREES_MENU).toLowerCase();
    for (const tournure of [/\d+\s*(?:sur|\/)\s*\d+/, /%/, /\bnouveau\b/, /\bnouvelles?\b/, /non lus?/]) {
      expect(texte, `tournure d'état dans le catalogue : ${tournure}`).not.toMatch(tournure);
    }
  });
});

describe("[7.2/AC2-AC3] ce qui entre, ce qui n'entre pas, et pourquoi", () => {
  it("[LE CŒUR] chaque URL du catalogue mène à une page qui EXISTE", () => {
    for (const e of ENTREES_MENU) {
      const direct = resolve(RACINE, `app${e.url}/page.tsx`);
      const groupe = resolve(RACINE, `app/(auth)${e.url}/page.tsx`);
      expect(
        existsSync(direct) || existsSync(groupe),
        `${e.titre} → ${e.url} ne correspond à aucune page`,
      ).toBe(true);
    }
  });

  it("[AC3] `/ancrages` n'est PAS dans le menu, et le motif est écrit", () => {
    expect(ENTREES_MENU.map((e) => e.url)).not.toContain("/ancrages");
    expect(HORS_MENU.ancrages, "une exclusion sans motif est un oubli déguisé en décision").toMatch(
      /aucun ancrage n’est écrit/,
    );
  });

  it("[amendement §1] l'heure de naissance et le type sont sous la halte, pas dans le menu", () => {
    const urls = ENTREES_MENU.map((e) => e.url);
    expect(urls).not.toContain("/heure-naissance");
    expect(urls).not.toContain("/enneagramme");
    for (const cle of ["heure-naissance", "enneagramme"]) {
      expect(HORS_MENU[cle], `${cle} : exclusion sans motif`).toBeDefined();
      expect(HORS_MENU[cle].length).toBeGreaterThan(40);
    }
  });

  it("[INVENTAIRE] toute halte du produit est dans le menu OU exclue avec un motif", () => {
    // ⚠️ MÊME RENVERSEMENT DE CHARGE QUE `pied-halte.test.ts` : on ne compte pas sur la discipline
    // de celui qui ajoutera la prochaine page pour qu'il se demande si elle a sa place ici. Sans
    // cet inventaire, une halte livrée demain resterait atteignable par URL seule — exactement la
    // dette que cette story solde, et elle se reconstituerait en silence.
    const dansLeMenu = new Set(ENTREES_MENU.map((e) => e.url.replace(/^\//, "")));
    const orphelines = HALTES.filter((h) => !dansLeMenu.has(h) && !(h in HORS_MENU));
    expect(orphelines, "halte(s) sans verdict — ajoute-les à ENTREES_MENU ou à HORS_MENU").toEqual([]);
  });

  it("aucune exclusion ne désigne une halte qui n'existe plus", () => {
    const fantomes = Object.keys(HORS_MENU).filter((h) => !HALTES.includes(h as never));
    expect(fantomes, "exclusion(s) sans objet").toEqual([]);
  });
});

describe("[7.2/AC6] il n'existe qu'UNE seule liste d'entrées de compte dans le dépôt", () => {
  it("[LE CŒUR] `/profil` a disparu, et son formulaire de nom N'EST PAS PERDU", () => {
    // Deux listes divergent au premier ajout : une entrée nouvelle dans l'une, absente de l'autre,
    // et rien ne rougit. C'est ce qui s'est passé entre `/profil` (2026-08-23) et l'ordre
    // d'`EXPERIENCE.md` écrit un mois plus tôt. La 7.3b a supprimé la page ; ce test garde
    // désormais le DÉMÉNAGEMENT, qui est l'endroit où une fonctionnalité se perd en silence.
    expect(existsSync(resolve(RACINE, "app/profil/page.tsx")), "`/profil` existe encore").toBe(false);
    expect(existsSync(resolve(RACINE, "lib/domain/copie-profil.ts")), "sa copie existe encore").toBe(false);
    expect(existsSync(resolve(RACINE, "render/profil")), "son rendu existe encore").toBe(false);

    // ⚠️ ET LA MOITIÉ QUI COMPTE : ce qui n'existait NULLE PART AILLEURS est arrivé quelque part.
    const reglages = lire("lib/domain/copie-reglages.ts");
    for (const cle of ["SECTION_NOM", "LABEL_PRENOM", "LABEL_NOM_COMPLET", "NOM_PREVIENT_LES_NOMBRES"]) {
      expect(reglages, `${cle} a disparu avec /profil au lieu de déménager`).toContain(`export const ${cle}`);
    }
    // ⚠️ ON REFUSE UN MONTAGE CONDITIONNEL, ET UN MUTANT L'A EXIGÉ. La première version cherchait
    // `<FormulaireNom` n'importe où : `{false && <FormulaireNom` la laissait VERTE, et le
    // formulaire n'était plus rendu du tout. Deuxième fois de la journée qu'une garde lit un texte
    // au lieu d'un câblage (voir P9 sur `entrees={ENTREES_MENU}`).
    const page = lire("app/reglages/page.tsx");
    const i = page.indexOf("<FormulaireNom");
    expect(i, "le formulaire n'est pas monté").toBeGreaterThan(-1);
    const avant = page.slice(Math.max(0, i - 60), i);
    expect(avant, "le formulaire est monté sous condition — il doit l'être toujours").not.toMatch(/&&|\?\s*$/);
    expect(page, "l'action d'enregistrement n'est pas branchée").toMatch(/enregistrer=\{\s*enregistrerNom\s*\}/);
    expect(lire("app/reglages/actions.ts"), "l'action d'enregistrement n'a pas suivi").toContain(
      "export async function enregistrerNom",
    );
  });

  it("[LE CŒUR] aucun autre module ne déclare un catalogue d'entrées de compte", () => {
    // Balayage RÉCURSIF de `lib/domain` : une liste en dur ailleurs serait la seconde vérité.
    const suspects: string[] = [];
    const parcourir = (dossier: string) => {
      for (const f of readdirSync(resolve(RACINE, dossier), { withFileTypes: true })) {
        const chemin = `${dossier}/${f.name}`;
        if (f.isDirectory()) parcourir(chemin);
        else if (f.name.endsWith(".ts") && chemin !== "lib/domain/menu-compte.ts") {
          const src = lire(chemin).replace(/\/\*[\s\S]*?\*\//g, "");
          // Le motif d'une liste d'entrées : au moins trois URL de haltes dans une même constante.
          const urls = (src.match(/url:\s*"\/(memoire|synthese|lectures|abonnement|mes-donnees|reglages|socle|aide)"/g) ?? []).length;
          if (urls >= 3) suspects.push(chemin);
        }
      }
    };
    parcourir("lib/domain");
    expect(suspects, "seconde liste d'entrées de compte").toEqual([]);
  });

  it("[ANTI-VACUITÉ] le détecteur ci-dessus attrape bien une liste — sur le vrai catalogue", () => {
    // Sans ce témoin, le balayage pourrait ne rien trouver parce que son motif est cassé, et le
    // test précédent serait vert pour la pire des raisons.
    const src = lire("lib/domain/menu-compte.ts");
    const urls = (src.match(/url:\s*"\/(memoire|synthese|lectures|abonnement|mes-donnees|reglages|socle|aide)"/g) ?? []).length;
    expect(urls, "le motif de détection ne reconnaît même pas le catalogue réel").toBeGreaterThanOrEqual(3);
  });

  it("[LE CŒUR] la feuille du menu consomme le catalogue au lieu d'en porter un", () => {
    // ⚠️ ON VÉRIFIE LE CÂBLAGE, PAS L'IMPORT — ET UN MUTANT L'A PROUVÉ le 2026-08-25. La première
    // version cherchait la chaîne « ENTREES_MENU » n'importe où dans le fichier : remplacer
    // `entrees={ENTREES_MENU}` par `entrees={[]}` la laissait VERTE, puisque la ligne d'import
    // contient toujours le mot. La surface servait alors un menu vide, et rien ne rougissait.
    //
    // La cible a changé avec la 7.3b (`/profil` a disparu) ; l'invariant, lui, n'a pas bougé.
    const src = lire("app/page.tsx");
    expect(src, "le catalogue n'est pas branché sur la scène").toMatch(/entrees:\s*ENTREES_MENU/);
  });
});
