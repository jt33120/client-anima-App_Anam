import { describe, it, expect } from "vitest";
import { clesEcrites, clesNonEcrites, lireTexte, textesEcrits } from "@/lib/corpus/port";
import {
  CLES_ARBRE_DE_VIE,
  CORPUS_ARBRE_DE_VIE,
  FAMILLES_ARBRE,
  FAMILLE_DE_LA_CLE,
  INTENSITES,
  LIBELLE_FAMILLE,
  cleArbre,
  texteDeArbre,
  texteDeLaDynamique,
  texteDeLaQualite,
  texteDuCheminDeVie,
  texteDuDefi,
  valeursPossibles,
} from "@/lib/corpus/arbre-de-vie";
import { CORPUS_NUMEROLOGIE } from "@/lib/corpus/numerologie";
import { CLES_ARBRE, calculerArbreDeVie, dynamiqueDeVie } from "@/lib/astro/arbre-de-vie";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";
import { defautsDeStructure } from "./_forme-corpus";

/**
 * LE CORPUS DE L'ARBRE DE VIE — couverture d'abord, forme ensuite.
 *
 * ══ CE QUE CETTE GARDE SURVEILLE EN PREMIER : LA COUVERTURE ════════════════════════════════════
 *
 * Le défaut qui coûte cher n'est pas un texte mal écrit — c'est un texte qui MANQUE pour une valeur
 * que le calcul peut réellement rendre. `lireTexte` JETTE sur une clé non déclarée : une valeur
 * oubliée dans `valeursPossibles` ne donne pas un écran vide, elle donne une page en erreur, le
 * jour où quelqu'un naît le bon jour du bon mois. Les domaines ne sont donc pas RECOPIÉS ici : ils
 * sont RECONSTRUITS en faisant tourner le vrai calcul sur un balayage de dates, et le corpus doit
 * les contenir.
 *
 * ══ [ANTI-VACUITÉ] ═════════════════════════════════════════════════════════════════════════════
 *
 * Les 111 créneaux sont ÉCRITS depuis le 2026-09-21, donc les balayages de forme et de lexique
 * mordent pour de bon. Les trois disciplines de la 5.2 restent en place pour la même raison qu'avant :
 * le détecteur de forme est éprouvé sur des chaînes FABRIQUÉES connues-mauvaises ET connues-bonnes,
 * la PRÉSENCE des 111 créneaux est assertée avant toute forme, et les textes sont exigés DISTINCTS
 * sans quoi un gabarit recopié 111 fois passerait tout.
 *
 * ⚠️ ET LA GARDE QUI N'EXISTE PAS. Aucun test ne peut vérifier que ces textes sont JUSTES, ni qu'ils
 * sont ceux d'Anima. Ils ont été écrits ici sur la décision du fondateur, comme les 222 autres le
 * 2026-08-23, et sa relecture reste due. Un vert sur ce fichier ne dit rien de plus que : la forme
 * tient, la voix ne dérape pas, et rien n'y prédit l'avenir de personne.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 1. La couverture — le calcul ne peut rien rendre que le corpus ne déclare
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LE CŒUR] tout ce que le calcul peut rendre a son créneau", () => {
  /**
   * Les valeurs réellement produites, famille par famille, en faisant tourner `calculerArbreDeVie`
   * sur un balayage de dates. Trois années aux racines numériques différentes suffisent : les
   * racines, le tronc, l'écorce et les défis ne dépendent que du triplet (jour, mois, année réduite).
   */
  const observees = new Map<string, Set<number>>();
  for (const f of FAMILLES_ARBRE) observees.set(f, new Set());
  for (let jour = 1; jour <= 31; jour++) {
    for (let mois = 1; mois <= 12; mois++) {
      for (const annee of [1900, 1963, 2018, 2024, 1999]) {
        const date = `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
        const arbre = calculerArbreDeVie({ date });
        const lire = (cle: (typeof CLES_ARBRE)[number]) => {
          const l = arbre.cles[cle];
          if (l.statut === "calcule") observees.get(FAMILLE_DE_LA_CLE[cle])!.add(l.valeur);
        };
        lire("racine_premiere");
        lire("racine_seconde");
        lire("tronc");
        lire("ecorce");
        for (const d of arbre.defis) observees.get("arbre_defi")!.add(d);
        const dyn = dynamiqueDeVie(date);
        if (dyn.statut === "calcule") observees.get("arbre_dynamique")!.add(dyn.valeur);
      }
    }
  }

  it("[CONTRÔLE DU CONTRÔLE] le balayage a bien produit des valeurs", () => {
    // Sans ceci, « toutes les valeurs observées sont déclarées » serait vrai d'un ensemble vide.
    expect(observees.get("arbre_racine")!.size, "aucune racine observée").toBeGreaterThanOrEqual(9);
    expect(observees.get("arbre_defi")!.size, "aucun défi observé").toBeGreaterThanOrEqual(8);
    expect(observees.get("arbre_dynamique")!.size, "aucune dynamique observée").toBeGreaterThan(0);
  });

  it("aucune valeur produite par le calcul n'échappe au domaine déclaré", () => {
    const orphelines: string[] = [];
    for (const [famille, valeurs] of observees) {
      const declarees = valeursPossibles(famille as (typeof FAMILLES_ARBRE)[number]);
      for (const v of valeurs) {
        if (!declarees.includes(v)) orphelines.push(`${famille} peut valoir ${v}, non déclaré`);
      }
    }
    expect(orphelines, `le calcul dépasse le corpus :\n${orphelines.join("\n")}`).toEqual([]);
  });

  it("les trois nombres du nom passent par les mêmes valeurs que le socle, maîtres compris", () => {
    // Branches, feuilles et cime réutilisent `reduire` : 11, 22 et 33 sont atteignables, et les
    // oublier ferait planter la page le jour où quelqu'un porte le bon nom.
    for (const famille of ["arbre_branches", "arbre_feuilles", "arbre_cime"] as const) {
      expect(valeursPossibles(famille)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
    }
    // Racine, tronc, écorce passent par `reduireSansMaitre` : un maître y est IMPOSSIBLE, pas rare.
    for (const famille of ["arbre_racine", "arbre_tronc", "arbre_ecorce"] as const) {
      expect(valeursPossibles(famille)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it("[LE ZÉRO EST UNE VALEUR] le défi 0 a son créneau, et il est lisible", () => {
    expect(valeursPossibles("arbre_defi")).toContain(0);
    expect(() => texteDuDefi(0)).not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 2. Les clés et le corpus
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("les 111 créneaux sont déclarés, gelés, et dans un seul des deux états", () => {
  it("[PRÉSENCE] 111 clés, toutes distinctes", () => {
    expect(CLES_ARBRE_DE_VIE).toHaveLength(111);
    expect(new Set(CLES_ARBRE_DE_VIE).size, "deux clés identiques").toBe(111);
    expect(clesEcrites(CORPUS_ARBRE_DE_VIE).length + clesNonEcrites(CORPUS_ARBRE_DE_VIE).length).toBe(111);
  });

  it("le compte se décompose exactement comme le README l'annonce", () => {
    const attendu: Record<string, number> = {
      arbre_racine: 9,
      arbre_tronc: 9,
      arbre_ecorce: 9,
      arbre_branches: 12,
      arbre_feuilles: 12,
      arbre_cime: 12,
      arbre_dynamique: 12,
      arbre_defi: 9,
      arbre_qualite: 27,
    };
    for (const famille of FAMILLES_ARBRE) {
      const n = CLES_ARBRE_DE_VIE.filter((c) => c.startsWith(`${famille}:`)).length;
      expect(n, `${famille} : ${n} créneaux au lieu de ${attendu[famille]}`).toBe(attendu[famille]);
    }
  });

  it("l'identifiant du corpus est en tirets, sinon l'inventaire ne le voit pas", () => {
    // `tests/corpus-etat.test.ts` recense par la regex `corpus("([a-z-]+)")` : un underscore rendrait
    // ce corpus invisible au recensement, et il échapperait à la vérification de complétude.
    expect(CORPUS_ARBRE_DE_VIE.identifiant).toBe("arbre-de-vie");
    expect(CORPUS_ARBRE_DE_VIE.identifiant).toMatch(/^[a-z-]+$/);
  });

  it("`cleArbre` jette hors domaine, au lieu de fabriquer une clé qui n'existe pas", () => {
    expect(() => cleArbre("arbre_racine", 11)).toThrow();
    expect(() => cleArbre("arbre_racine", 0)).toThrow();
    expect(() => cleArbre("arbre_defi", 9)).toThrow();
    expect(() => cleArbre("arbre_dynamique", 44)).toThrow();
    // Une qualité sans son palier, et un palier sur une famille qui n'en a pas : les deux sont des
    // défauts de code, pas des textes manquants.
    expect(() => cleArbre("arbre_qualite", 5)).toThrow();
    expect(() => cleArbre("arbre_tronc", 5, "absente")).toThrow();
  });

  it("le corpus et ses créneaux sont gelés", () => {
    expect(Object.isFrozen(CORPUS_ARBRE_DE_VIE.textes)).toBe(true);
    expect(Object.isFrozen(CLES_ARBRE_DE_VIE)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 3. Les jonctions
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("les jonctions calcul → texte ne fabriquent jamais de sens", () => {
  it("une clé non calculée n'a pas de créneau : on ne cherche pas le sens de ce qu'on n'a pas", () => {
    expect(
      texteDeArbre("branches", { statut: "non_calcule", raison: "prenom_de_naissance_absent" }),
    ).toBeNull();
    expect(texteDeLaDynamique({ statut: "non_calcule", raison: "nom_absent" })).toBeNull();
    expect(texteDuCheminDeVie({ statut: "non_calcule", raison: "nom_absent" })).toBeNull();
  });

  it("chaque clé calculée trouve son créneau, sans jeter, sur tout son domaine", () => {
    for (const cle of CLES_ARBRE) {
      const famille = FAMILLE_DE_LA_CLE[cle];
      for (const valeur of valeursPossibles(famille)) {
        expect(
          () => texteDeArbre(cle, { statut: "calcule", valeur, maitre: false }),
          `${cle} = ${valeur} n'a pas de créneau`,
        ).not.toThrow();
      }
    }
  });

  it("les deux racines partagent la MÊME famille, et c'est une décision", () => {
    // Un texte de racine doit donc se lire sous les deux positions. Si un jour Anima veut deux
    // textes distincts, c'est une famille de plus — et cette assertion est là pour que la décision
    // se prenne, au lieu que quelqu'un ajoute une clé au passage.
    expect(FAMILLE_DE_LA_CLE.racine_premiere).toBe("arbre_racine");
    expect(FAMILLE_DE_LA_CLE.racine_seconde).toBe("arbre_racine");
    expect(
      texteDeArbre("racine_premiere", { statut: "calcule", valeur: 3, maitre: false }),
    ).toEqual(texteDeArbre("racine_seconde", { statut: "calcule", valeur: 3, maitre: false }));
  });

  it("une qualité va vers son palier, et une absence a son propre texte", () => {
    expect(texteDeLaQualite({ valeur: 5, intensite: "absente" })).toEqual(
      lireTexte(CORPUS_ARBRE_DE_VIE, "arbre_qualite:5:absente"),
    );
    expect(texteDeLaQualite({ valeur: 5, intensite: "marquee" })).toEqual(
      lireTexte(CORPUS_ARBRE_DE_VIE, "arbre_qualite:5:marquee"),
    );
    for (const i of INTENSITES) {
      expect(CLES_ARBRE_DE_VIE).toContain(`arbre_qualite:5:${i}`);
    }
  });

  it("[LA DÉLÉGATION] le chemin de vie lit le corpus du socle, et n'a AUCUN créneau ici", () => {
    // Un même nombre ne peut pas porter deux textes à deux endroits du produit : le jour où ils
    // divergent, personne ne sait lequel fait foi.
    expect(texteDuCheminDeVie({ statut: "calcule", valeur: 3, maitre: false })).toEqual(
      lireTexte(CORPUS_NUMEROLOGIE, "chemin_de_vie:3"),
    );
    expect(CLES_ARBRE_DE_VIE.some((c) => c.startsWith("chemin_de_vie"))).toBe(false);
    expect(CLES_ARBRE_DE_VIE.some((c) => c.startsWith("arbre_chemin"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 4. La forme des textes — vacue aujourd'hui, mordante dès la première ligne d'Anima
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** Le marqueur qu'un texte de qualité ABSENTE doit porter, pour ne pas être celui de la présente. */
const MARQUEUR_ABSENCE = /manqu|absen|aucune|n’apparaît|n’est pas là/i;

function defautsDuCreneau(cle: string, texte: string): string[] {
  const [famille, valeurBrute, intensite] = cle.split(":");
  const libelle = LIBELLE_FAMILLE[famille as (typeof FAMILLES_ARBRE)[number]];
  return defautsDeStructure(libelle, Number(valeurBrute), texte, {
    marqueurRequis: intensite === "absente" ? MARQUEUR_ABSENCE : undefined,
  });
}

describe("les textes de l'arbre ont la forme que le fondateur a tranchée", () => {
  it("[CONTRÔLE DU CONTRÔLE] le détecteur mord sur des chaînes fabriquées", () => {
    // Sans ceci, la garde ci-dessous serait verte parce qu'il n'y a rien à vérifier, et elle le
    // resterait le jour où il y aurait tout à vérifier.
    const bonne = "Ta racine 3 demande de l’expression. Tu as besoin de créer et d’échanger.";
    expect(defautsDuCreneau("arbre_racine:3", bonne)).toEqual([]);

    expect(defautsDuCreneau("arbre_racine:3", bonne.replace("racine 3", "racine")).join()).toMatch(/^\(a\)/);
    expect(defautsDuCreneau("arbre_racine:3", bonne.replace("racine 3", "racine 7")).join()).toMatch(/^\(a\)/);
    expect(defautsDuCreneau("arbre_racine:3", bonne.replace(". Tu", " — tu")).join()).toMatch(/\(b\)/);
    expect(
      defautsDuCreneau("arbre_racine:3", `${bonne} ${"Le geste compte. ".repeat(20)}`).join(),
    ).toMatch(/\(c\) \d+ caractères/);
    expect(
      defautsDuCreneau("arbre_racine:3", "Ta racine 3 demande de l’expression et tu crées."),
    ).toEqual(["(c) 1 phrase(s), il en faut deux à quatre"]);
    expect(
      defautsDuCreneau("arbre_racine:3", "Votre racine 3 demande de l’expression. Vous créez."),
    ).toEqual(["(d) aucun tutoiement", "(d) vouvoiement"]);

    // Et le marqueur d'absence : un texte de qualité absente qui ne dit pas l'absence est refusé.
    const presente = "Ta qualité 5 te rend libre et mobile. Tu aimes bouger.";
    expect(defautsDuCreneau("arbre_qualite:5:marquee", presente)).toEqual([]);
    expect(defautsDuCreneau("arbre_qualite:5:absente", presente).join()).toMatch(/^\(e\)/);
    const absente = "Ta qualité 5 manque à ton nom. Tu peux la cultiver autrement.";
    expect(defautsDuCreneau("arbre_qualite:5:absente", absente)).toEqual([]);
  });

  it("[ÉTAT] le nombre de créneaux écrits est celui que le README annonce", () => {
    // La présence AVANT la forme : c'est cette ligne qui empêche les deux gardes suivantes de
    // redevenir vacues le jour où quelqu'un viderait la table en croyant faire le ménage.
    expect(clesEcrites(CORPUS_ARBRE_DE_VIE).length).toBe(111);
  });

  it("[LE CŒUR] chaque texte écrit a la structure demandée", () => {
    const refus: string[] = [];
    for (const cle of clesEcrites(CORPUS_ARBRE_DE_VIE)) {
      const t = lireTexte(CORPUS_ARBRE_DE_VIE, cle);
      if (t.statut !== "ecrit") continue;
      for (const d of defautsDuCreneau(cle, t.texte)) refus.push(`${cle} : ${d}`);
    }
    expect(refus, `textes hors structure :\n${refus.join("\n")}`).toEqual([]);
  });

  it("[LE CŒUR] aucun texte écrit ne porte de lexique interdit ni de prédiction", () => {
    const refus: string[] = [];
    for (const texte of textesEcrits(CORPUS_ARBRE_DE_VIE)) {
      for (const i of chercherInterdits(texte)) refus.push(`lexique « ${i.terme} » : ${texte}`);
      for (const p of chercherPredictions(texte)) refus.push(`prédiction « ${p.terme} » : ${texte}`);
      if (texte.includes("'")) refus.push(`apostrophe droite : ${texte}`);
    }
    expect(refus, `textes refusés :\n${refus.join("\n")}`).toEqual([]);
  });

  it("[DISTINCTS] deux créneaux ne portent jamais le même texte", () => {
    // Un gabarit recopié passerait toutes les propriétés de forme ci-dessus.
    const textes = textesEcrits(CORPUS_ARBRE_DE_VIE);
    expect(new Set(textes).size, "deux créneaux identiques").toBe(textes.length);
  });
});
