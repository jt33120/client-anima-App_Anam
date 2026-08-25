import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * architecture-information.test.ts — [7.1] LA DÉCISION D'ARCHITECTURE DE L'INFORMATION NE SE PÉRIME
 * PAS EN SILENCE (2026-08-25).
 *
 * ══ CE QUE CETTE GARDE EXISTE POUR EMPÊCHER ═════════════════════════════════════════════════════
 *
 * L'Epic 7 construit une coquille d'application — un menu de compte, une halte « Ton socle » — que
 * `EXPERIENCE.md` spécifiait depuis le 2026-07-21 et qui n'a jamais été bâtie. Onze stories vont
 * s'appuyer sur des décisions écrites dans un document que personne ne relit à chaque commit. Un
 * document de spécification qui dérive de son code est exactement ce qui a coûté une demi-journée le
 * 2026-08-25 : `lib/corpus/README.md` annonçait zéro texte écrit alors qu'il y en avait 189, et une
 * investigation a déclaré BLOQUÉ un chantier faisable (voir `tests/corpus-etat.test.ts`).
 *
 * ⚠️ LE DÉFAUT VISÉ EST PRÉCIS : LE PLANCHER DES CARTES VIT À **CINQ** ENDROITS. Ligne 144
 * d'`EXPERIENCE.md`, dans son amendement du 2026-08-25 (§3), dans UX-DR-30 (`epics.md:220`), dans le
 * commentaire de `lib/domain/bibliotheque.ts`, et dans l'assertion de ce même module. Sans cette
 * garde, le `throw` du module est le SEUL arbitre : quelqu'un qui le déplace de 4 à 3 parce que « ça
 * ne passe plus » a changé une décision d'UX sans que rien ne le dise, et les quatre textes qui
 * l'expliquent continuent d'annoncer l'ancienne valeur.
 *
 * ⚠️ CE TEST LIT DES NOMBRES, PAS DES CHAÎNES. Chercher la présence du texte « 3 à 6 » quelque part
 * serait vert le jour où l'assertion dirait 4 : les deux cohabiteraient sans se contredire. On
 * EXTRAIT les cinq valeurs et on exige qu'elles soient égales — c'est la seule forme qui tue son
 * mutant dans les deux sens (monter l'une, descendre l'autre).
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

const EXPERIENCE = lire("_bmad-output/planning-artifacts/ux-designs/ux-Anima-2026-07-21/EXPERIENCE.md");
const EPICS = lire("_bmad-output/planning-artifacts/epics.md");
const BIBLIOTHEQUE = lire("lib/domain/bibliotheque.ts");

/** La section datée, isolée du reste du document : tout ce qui la suit lui appartient. */
const AMENDEMENT = (() => {
  const debut = EXPERIENCE.indexOf("## Amendement du 2026-08-25");
  return debut < 0 ? "" : EXPERIENCE.slice(debut);
})();

/**
 * ⚠️ ON DÉPOUILLE LES COMMENTAIRES AVANT DE CHERCHER L'ASSERTION. La leçon a été payée trois fois
 * le 2026-08-25 : une garde qui compte des occurrences dans un fichier compte aussi celles de ses
 * propres commentaires, et se met à mesurer la prose au lieu du code.
 */
const CODE_SEUL = BIBLIOTHEQUE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Extrait un couple (plancher, plafond) ; `null` si le motif a disparu — c'est un échec, pas un zéro. */
function bornes(source: string, motif: RegExp): { plancher: number; plafond: number } | null {
  const m = source.match(motif);
  return m ? { plancher: Number(m[1]), plafond: Number(m[2]) } : null;
}

const LIGNE_144 = EXPERIENCE.split("\n")[143] ?? "";
/** La ligne 86 : l'ordre invariable du menu de compte. Citée par son numéro dans tout le dépôt. */
const LIGNE_86 = EXPERIENCE.split("\n")[85] ?? "";
const LIGNE_UX_DR_30 = EPICS.split("\n").find((l) => l.startsWith("- UX-DR-30 :")) ?? "";

const SOURCES_DU_PLANCHER: ReadonlyArray<{ ou: string; valeur: { plancher: number; plafond: number } | null }> = [
  {
    ou: "EXPERIENCE.md ligne 144 · Carte de bibliothèque",
    valeur: bornes(LIGNE_144, /\*\*(\d+) à (\d+) maximum\*\*/),
  },
  {
    ou: "EXPERIENCE.md · amendement du 2026-08-25 §3",
    valeur: bornes(AMENDEMENT, /Bornes retenues : (\d+) minimum, (\d+) maximum/),
  },
  {
    ou: "epics.md · UX-DR-30",
    valeur: bornes(LIGNE_UX_DR_30, /Cartes de bibliothèque \(accueil\) : \*\*(\d+) à (\d+)\*\* objets max/),
  },
  {
    ou: "lib/domain/bibliotheque.ts · commentaire",
    valeur: bornes(BIBLIOTHEQUE, /plancher de (\d+) et un plafond de (\d+)/),
  },
  {
    ou: "lib/domain/bibliotheque.ts · assertion",
    valeur: bornes(CODE_SEUL, /CATALOGUE_CARTES\.length < (\d+) \|\| CATALOGUE_CARTES\.length > (\d+)/),
  },
];

describe("[7.1 · CONTRÔLE DU CONTRÔLE] la garde a bien quelque chose sous les yeux", () => {
  it("les trois documents ont été lus et ne sont pas vides", () => {
    expect(EXPERIENCE.length, "EXPERIENCE.md").toBeGreaterThan(10_000);
    expect(EPICS.length, "epics.md").toBeGreaterThan(10_000);
    expect(BIBLIOTHEQUE.length, "lib/domain/bibliotheque.ts").toBeGreaterThan(1_000);
  });

  it("la section datée existe — sans elle, tous les refus ci-dessous seraient vrais sur une chaîne vide", () => {
    expect(AMENDEMENT, "amendement du 2026-08-25 introuvable en fin d'EXPERIENCE.md").not.toBe("");
    expect(AMENDEMENT.length).toBeGreaterThan(2_000);
  });

  it("les cinq extracteurs de plancher ont tous trouvé leur motif", () => {
    for (const s of SOURCES_DU_PLANCHER) {
      expect(s.valeur, `motif de plancher introuvable — ${s.ou}`).not.toBeNull();
    }
  });

  it("le dépouillement des commentaires n'a pas mangé le code", () => {
    // Sans ce témoin, un `CODE_SEUL` vide rendrait l'extraction de l'assertion nulle, et le test
    // précédent dirait « motif introuvable » sans qu'on sache que c'est le dépouillement le coupable.
    expect(CODE_SEUL).toContain("export const CATALOGUE_CARTES");
    expect(CODE_SEUL).not.toContain("plancher de 3 et un plafond de 6");
  });
});

describe("[7.1/AC2 DUR] les cinq écritures du plancher disent le même nombre", () => {
  it("plancher et plafond sont identiques aux cinq endroits", () => {
    const reference = SOURCES_DU_PLANCHER[0].valeur;
    expect(reference).not.toBeNull();
    for (const s of SOURCES_DU_PLANCHER) {
      expect(s.valeur, s.ou).toEqual(reference);
    }
  });

  it("le catalogue réel respecte la borne qu'il déclare", () => {
    // La borne est vérifiée au chargement du module ; ce test prouve que le module CHARGE, donc que
    // l'assertion écrite ci-dessus est celle que l'application exécute vraiment.
    const bornesCode = SOURCES_DU_PLANCHER[4].valeur;
    expect(bornesCode).not.toBeNull();
    const cles = BIBLIOTHEQUE.match(/export const CATALOGUE_CARTES[\s\S]*?\]\);/)?.[0] ?? "";
    const compte = (cles.match(/^\s*"[a-z_]+",$/gm) ?? []).length;
    expect(compte, "le catalogue extrait est vide — l'extracteur a cassé").toBeGreaterThan(0);
    expect(compte).toBeGreaterThanOrEqual(bornesCode!.plancher);
    expect(compte).toBeLessThanOrEqual(bornesCode!.plafond);
  });
});

describe("[7.1/AC1] « Ton socle » est entrée dans l'architecture de l'information", () => {
  it("l'amendement porte la ligne du tableau, au format des onze autres", () => {
    const ligne = AMENDEMENT.split("\n").find((l) => l.startsWith("| **Ton socle** |")) ?? "";
    expect(ligne, "aucune ligne « Ton socle » dans le tableau de l'amendement").not.toBe("");
    const cellules = ligne.split("|").slice(1, -1).map((c) => c.trim());
    expect(cellules.length, "le tableau d'architecture de l'information a trois colonnes").toBe(3);
    for (const c of cellules) expect(c.length, `cellule vide dans « ${ligne} »`).toBeGreaterThan(3);
  });

  it("le menu de compte de la ligne 86 porte « Ton socle » en DEUXIÈME position", () => {
    const apresDeuxPoints = LIGNE_86.slice(LIGNE_86.indexOf("invariable :") + "invariable :".length);
    const entrees = apresDeuxPoints
      .split(",")
      .map((e) => e.replace(/\*|\.|\s*\(.*$|\s*\*\(.*$/g, "").trim())
      .filter((e) => e.length > 0);
    expect(entrees.length, "l'ordre du menu n'a pas été extrait").toBeGreaterThanOrEqual(9);
    expect(entrees[0], "FR-077 : l'aide est la première entrée, toujours").toBe("Aide et ressources");
    expect(entrees[1], "« Ton socle » est la deuxième entrée (amendement §1)").toBe("Ton socle");
  });

  it("la halte est une entrée de premier rang, pas une sous-entrée de Réglages", () => {
    // Mutation-cible : ranger « Ton socle » sous Réglages. La ligne 86 ne le porterait plus, et
    // l'assertion de position ci-dessus rougirait déjà — celle-ci nomme la raison.
    expect(AMENDEMENT).toMatch(
      /entrée de premier rang du menu de compte, pas une sous-entrée de Réglages/,
    );
  });
});

describe("[7.1/AC3-AC4] le refus de la grille d'icônes-rubriques, et le prix de l'issue inverse", () => {
  it("le refus est écrit, et il nomme les deux lignes qui le fondent", () => {
    expect(AMENDEMENT).toContain("[REFUS TENU]");
    expect(AMENDEMENT, "le refus doit citer la ligne 144").toMatch(/ligne 144|lignes 144/);
    expect(AMENDEMENT, "le refus doit citer la ligne 505").toMatch(/505/);
  });

  it("la garde de frontière est nommée comme non amendable par cet epic", () => {
    expect(AMENDEMENT).toContain("tests/bibliotheque-frontiere.test.ts");
  });

  it("la seconde issue est écrite ET chiffrée — sinon l'arbitrage se refera à chaud", () => {
    // ⚠️ CE TEST EST LA MOITIÉ QUI COMPTE. Écrire un refus est facile ; ce qui empêche un refus de
    // se faire contourner un soir d'agacement, c'est que l'alternative soit déjà sur la table avec
    // son prix. Un amendement qui ne porterait QUE le refus passerait les deux tests précédents.
    expect(AMENDEMENT, "l'issue B doit être nommée").toMatch(/Issue B/);
    expect(AMENDEMENT, "l'issue B REMPLACE, elle ne s'ajoute jamais").toMatch(/REMPLACE/);
    for (const prix of [
      "lib/domain/bibliotheque.ts",
      "tests/bibliotheque-frontiere.test.ts",
      "7.7",
      "7.10",
    ]) {
      expect(AMENDEMENT, `le prix de l'issue B doit nommer ${prix}`).toContain(prix);
    }
  });
});

describe("[7.1/AC5-AC6] la région reste un lieu, et il n'y a qu'une surface de compte", () => {
  it("le renommage en « Moi » est acté avec sa clause de non-conversion", () => {
    expect(AMENDEMENT).toMatch(/« Moi »/);
    expect(AMENDEMENT).toMatch(/« Mon arbre »/);
    expect(AMENDEMENT, "aucune rubrique nominative au-dessus du pli").toMatch(/au-dessus du pli/);
    expect(AMENDEMENT, "FR-031 tient sur la région renommée").toMatch(/FR-031/);
  });

  it("le sort de /profil est tranché, et son formulaire de nom n'est pas perdu", () => {
    // Mutation-cible : écrire « /profil disparaît » sans dire où va le formulaire de nom. Le prénom
    // deviendrait alors incorrigible — une fonctionnalité perdue par omission d'écriture.
    expect(AMENDEMENT).toMatch(/`\/profil` disparaît/);
    expect(AMENDEMENT, "le formulaire de nom doit avoir une destination écrite").toMatch(
      /formulaire de nom[\s\S]{0,400}\/reglages/,
    );
  });
});
