import { describe, it, expect } from "vitest";
import {
  AUTORITES,
  CLES_HUMAN_DESIGN,
  CORPUS_HUMAN_DESIGN,
  LIGNES,
  TYPES_HUMAN_DESIGN,
  cleAutorite,
  cleLigne,
  cleType,
  texteDeLAutorite,
  texteDeLaLigne,
  texteDuType,
} from "@/lib/corpus/human-design";
import { clesEcrites, clesNonEcrites } from "@/lib/corpus/port";
import { texteDeBase } from "@/lib/corpus/textes-de-base";
import {
  ARC_DESIGN_DEGRES,
  LARGEUR_LIGNE_DEGRES,
  autoriteDuTheme,
  typeDuTheme,
  type Autorite,
  type LignePorte,
  type TypeHumanDesign,
} from "@/lib/astro/human-design";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";

/**
 * corpus-human-design.test.ts — LES DIX-HUIT TEXTES DU HUMAN DESIGN (2026-09-03, FR-054).
 *
 * ⚠️ CE QUE CETTE GARDE SURVEILLE EN PREMIER : LA COUVERTURE. Le corpus doit avoir un texte pour
 * TOUTE valeur que le calcul peut rendre — sans quoi `lireTexte` JETTE (une clé non déclarée est un
 * défaut de code, par décision de `port.ts`), et la page tombe sur un thème parfaitement valide.
 *
 * C'est pour ça que les listes ci-dessous sont comparées aux SIGNATURES DU CALCUL et non recopiées :
 * un sixième type ajouté à `lib/astro/human-design.ts` casse ce fichier, jamais la production.
 */

describe("[LE CŒUR] le corpus couvre TOUT ce que le calcul peut rendre", () => {
  it("[CONTRÔLE DU CONTRÔLE] dix-huit créneaux DÉCLARÉS, pas zéro", () => {
    expect(TYPES_HUMAN_DESIGN).toHaveLength(5);
    expect(AUTORITES).toHaveLength(7);
    expect(LIGNES).toHaveLength(6);
    expect(CLES_HUMAN_DESIGN).toHaveLength(18);
    expect(Object.keys(CORPUS_HUMAN_DESIGN.textes)).toHaveLength(18);
  });

  it("[LE CŒUR] les cinq types du calcul ont chacun leur texte", () => {
    // ⚠️ Les types sont CONSTRUITS par `typeDuTheme` sur des cas réels, jamais recopiés d'une liste :
    // une liste recopiée resterait verte le jour où le calcul rendrait une sixième valeur.
    const parLeCalcul = new Set<TypeHumanDesign>([
      typeDuTheme([], []),
      typeDuTheme(["sacral"], []),
      typeDuTheme(["sacral", "gorge"], [[34, 20]]),
      typeDuTheme(["rate", "gorge"], [[57, 20]]),
      typeDuTheme(["coeur", "gorge"], [[21, 45]]),
    ]);
    expect(parLeCalcul.size, "les cinq types ne sont pas tous atteints par ces cas").toBe(5);
    for (const type of parLeCalcul) {
      expect(TYPES_HUMAN_DESIGN, `type non couvert : ${type}`).toContain(type);
      expect(texteDeBase(cleType(type)), `texte manquant : ${type}`).toBeTruthy();
    }
  });

  it("[LE CŒUR] les sept autorités du calcul ont chacune leur texte", () => {
    const parLeCalcul = new Set<Autorite>([
      autoriteDuTheme(["plexus_solaire", "sacral"]),
      autoriteDuTheme(["sacral", "rate"]),
      autoriteDuTheme(["rate", "coeur"]),
      autoriteDuTheme(["coeur", "identite"]),
      autoriteDuTheme(["identite", "gorge"]),
      autoriteDuTheme(["gorge", "ajna"]),
      autoriteDuTheme([]),
    ]);
    expect(parLeCalcul.size, "les sept autorités ne sont pas toutes atteintes").toBe(7);
    for (const autorite of parLeCalcul) {
      expect(AUTORITES, `autorité non couverte : ${autorite}`).toContain(autorite);
      expect(texteDeBase(cleAutorite(autorite)), `texte manquant : ${autorite}`).toBeTruthy();
    }
  });

  it("[LE CŒUR] les six lignes ont chacune leur texte", () => {
    for (const ligne of [1, 2, 3, 4, 5, 6] as LignePorte[]) {
      expect(LIGNES).toContain(ligne);
      expect(texteDeBase(cleLigne(ligne)), `texte manquant : ligne ${ligne}`).toBeTruthy();
    }
  });

  it("[LE CŒUR] tous les couples de lignes se composent, y compris hors des douze profils", () => {
    // ⚠️ LA RAISON D'ÊTRE DES SIX CRÉNEAUX DE LIGNE. Un corpus des douze profils canoniques
    // (`4/6`, `1/3`…) serait complet tant que l'arc de design se comporte comme prévu, et jetterait
    // le jour où un cas limite produirait un treizième couple. Ici, les TRENTE-SIX se lisent.
    let lus = 0;
    for (const p of LIGNES) for (const d of LIGNES) {
      expect(texteDeLaLigne(p).statut).toBe("ecrit");
      expect(texteDeLaLigne(d).statut).toBe("ecrit");
      lus += 1;
    }
    expect(lus).toBe(36);
    // Le témoin qui rend l'argument vérifiable plutôt que déclamé : l'arc vaut bien 88° et il ne
    // tombe PAS sur un nombre entier de lignes, donc la ligne de design décale de deux ou trois.
    expect(ARC_DESIGN_DEGRES).toBe(88);
    expect(Number.isInteger(ARC_DESIGN_DEGRES / LARGEUR_LIGNE_DEGRES)).toBe(false);
  });

  it("[LE BORD] une valeur hors domaine JETTE, dans les trois familles", () => {
    expect(() => cleType("gourou" as TypeHumanDesign)).toThrow(/hors domaine/);
    expect(() => cleAutorite("cosmique" as Autorite)).toThrow(/hors domaine/);
    expect(() => cleLigne(7 as LignePorte)).toThrow(/hors domaine/);
  });
});

describe("[LE CŒUR] la forme du corpus", () => {
  it("chaque créneau est dans UN des deux états — jamais un trou", () => {
    const ecrites = clesEcrites(CORPUS_HUMAN_DESIGN);
    const nonEcrites = clesNonEcrites(CORPUS_HUMAN_DESIGN);
    expect(ecrites.length + nonEcrites.length).toBe(18);
    expect([...ecrites, ...nonEcrites].sort()).toEqual([...CLES_HUMAN_DESIGN].sort());
  });

  it("le corpus est GELÉ et porte son identifiant", () => {
    expect(Object.isFrozen(CORPUS_HUMAN_DESIGN)).toBe(true);
    expect(Object.isFrozen(CORPUS_HUMAN_DESIGN.textes)).toBe(true);
    expect(CORPUS_HUMAN_DESIGN.identifiant).toBe("human-design");
  });

  it("[LE CŒUR] les dix-huit textes sont DEUX À DEUX DISTINCTS", () => {
    const textes = CLES_HUMAN_DESIGN.map((cle) => texteDeBase(cle));
    expect(textes.filter((t) => t !== undefined)).toHaveLength(18);
    expect(new Set(textes).size, "deux créneaux portent le même texte").toBe(18);
  });

  it("aucun texte n’entre AILLEURS que par la table de base", () => {
    for (const cle of clesEcrites(CORPUS_HUMAN_DESIGN)) {
      expect(texteDeBase(cle), `${cle} ne vient pas de la table de base`).toBeTruthy();
    }
  });

  it("la jonction rend bien le créneau demandé", () => {
    // Asserter la CLÉ, jamais seulement le texte : la parade léguée par la 5.5.
    expect(texteDuType("projecteur")).toEqual(
      { statut: "ecrit", texte: texteDeBase("human-design:type:projecteur")! },
    );
    expect(texteDeLAutorite("splenique")).toEqual(
      { statut: "ecrit", texte: texteDeBase("human-design:autorite:splenique")! },
    );
    expect(texteDeLaLigne(6)).toEqual(
      { statut: "ecrit", texte: texteDeBase("human-design:ligne:6")! },
    );
  });
});

describe("[LE BORD] la voix des dix-huit textes", () => {
  const textes = CLES_HUMAN_DESIGN.map((cle) => texteDeBase(cle) ?? "");

  it("aucun lexique interdit, aucune prédiction", () => {
    for (const texte of textes) {
      expect(chercherInterdits(texte), `lexique : « ${texte.slice(0, 50)}… »`).toEqual([]);
      expect(chercherPredictions(texte), `prédiction : « ${texte.slice(0, 50)}… »`).toEqual([]);
    }
  });

  it("le texte dit CE QUE LE SYSTÈME DÉCRIT, jamais ce qui serait mesuré", () => {
    // Le Human Design est une construction symbolique. Un texte qui dirait « ton corps fonctionne
    // ainsi » ferait passer une convention pour un fait ; ces dix-huit-là nomment leur source.
    for (const texte of textes) {
      expect(texte, `${texte.slice(0, 40)}… ne nomme pas sa source`).toMatch(/système/);
    }
  });

  it("des apostrophes typographiques, aucun tiret cadratin, et de la concision", () => {
    for (const texte of textes) {
      expect(texte, texte.slice(0, 40)).not.toContain("'");
      expect(texte, texte.slice(0, 40)).not.toContain("—");
      expect(texte.length, `trop long : ${texte.slice(0, 40)}…`).toBeLessThanOrEqual(360);
    }
  });

  it("[ANTI-VACUITÉ] les gardes de voix mordent vraiment", () => {
    expect(chercherInterdits("une thérapie pour ton anxiété")).not.toEqual([]);
    expect(chercherPredictions("tu verras que cela s’arrangera")).not.toEqual([]);
  });
});
