import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  ficheSocle,
  sectionNombres,
  sectionCiel,
  sectionType,
} from "@/lib/domain/fiche-socle";
import {
  RAISON_NOMBRE,
  RAISON_ANGLES,
  RAISON_CORPS,
  URL_CORRIGER_LE_NOM,
  URL_AJOUTER_SON_HEURE,
  SENS_DU_CIEL_NON_ECRIT,
  LECTURE_NUMEROLOGIE_NON_ECRITE,
  INTRODUCTION,
} from "@/lib/domain/copie-socle";
import { URL_PASSER_LE_TEST, MESSAGE_TYPE_ABSENT } from "@/lib/domain/enneagramme-items";
import { MESSAGE_SANS_HEURE, OU_TROUVER_SON_HEURE } from "@/lib/domain/message-sans-heure";
import { calculerNumerologie, NOMBRES } from "@/lib/astro/numerologie";
import { calculerThemeNatal, type EntreesNaissance } from "@/lib/astro/theme-natal";
import { ephemerideAstronomyEngine } from "@/lib/astro/adapters/astronomy-engine";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";
import { carteHoroscope } from "@/lib/domain/cartes-socle";
import { BULLE_SANS_HEURE } from "@/lib/domain/message-sans-heure";
import {
  INTRODUCTION_ASTROLOGIE,
  INTRODUCTION_NUMEROLOGIE,
  BOUTON_COMPLETER_CIEL,
  RESUME_DETAIL_HEURE,
  TITRE_DETAIL_POSITIONS,
  CIEL_DU_JOUR_NON_ECRIT,
  TITRE_LECTURE_NUMEROLOGIE,
  LECTURE_NUMEROLOGIE_PARTIELLE,
} from "@/lib/domain/copie-socle";
import type { HoroscopeDuJour } from "@/lib/astro/quotidien";

/**
 * fiche-socle.test.ts — [7.5] LA PREMIÈRE FOIS QUE FR-055 EST TENU.
 *
 * ══ CE QUE CE FICHIER GARDE, ET QUI N'A JAMAIS ÉTÉ GARDÉ ════════════════════════════════════════
 *
 * FR-055 promet la numérologie COMPLÈTE, gratuite à vie. Au 2026-08-25 le produit en affichait
 * **un sixième** : `carteNombres` ne porte que le chemin de vie. Les 69 créneaux sont écrits ; cinq
 * textes sur six n'étaient lisibles nulle part. Le test « six sur six » ci-dessous est la garde de
 * cette promesse — et il compte, il ne se contente pas de vérifier qu'il y en a « plusieurs ».
 *
 * De même : `milieuDuCiel` est calculé depuis la 5.1 et n'avait AUCUNE occurrence sous `render/` ni
 * `app/`. Cinq corps sur douze paraissaient. Ces deux absences-là ne rougissaient nulle part parce
 * qu'aucun test n'affirmait qu'elles devaient paraître.
 */

const ephemeride = ephemerideAstronomyEngine();

const AVEC_HEURE: EntreesNaissance = {
  date: "1990-06-15",
  heure: "07:15",
  fuseau: "Europe/Paris",
  latitude: 48.8566,
  longitude: 2.3522,
};
const SANS_HEURE: EntreesNaissance = { date: "1990-06-15", heure: null, fuseau: "Europe/Paris", latitude: 48.8566, longitude: 2.3522 };

const themeComplet = calculerThemeNatal(AVEC_HEURE, ephemeride);
const themeSansHeure = calculerThemeNatal(SANS_HEURE, ephemeride);

const NUM_COMPLETE = calculerNumerologie({ date: "1990-06-15", nomComplet: "Marie Claire Dubois" }, 2026);
const NUM_SANS_NOM = calculerNumerologie({ date: "1990-06-15", nomComplet: null }, 2026);
const ENTREES_NUM_COMPLETE = { date: "1990-06-15", nomComplet: "Marie Claire Dubois" };

const RIEN = { nombres: null, ciel: null };

// ══════════════════════════════════════════════════════════════════════════════════════════════
// AC1 — les SIX nombres, avec leurs SIX textes
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.5 · 13.9] les six nombres et leur lecture sont deux couches distinctes", () => {
  it("[CONTRÔLE DU CONTRÔLE] le jeu d'essai a bien ses six nombres calculés", () => {
    // Sans ce témoin, « six sur six » serait vrai sur un jeu qui n'en produit que trois — et le
    // test mesurerait le jeu d'essai, pas le module.
    for (const n of NOMBRES) {
      expect(NUM_COMPLETE.nombres[n].statut, `le nombre ${n} n'est pas calculé dans le jeu d'essai`).toBe("calcule");
    }
    expect(NOMBRES.length).toBe(6);
  });

  it("[LE CŒUR] les six résultats et les textes réellement écrits restent distincts", () => {
    const section = sectionNombres(NUM_COMPLETE, null, ENTREES_NUM_COMPLETE);
    expect(section.nombres.length, "six nombres calculés doivent produire six lignes").toBe(6);
    expect(section.manquants).toHaveLength(0);
    expect(section.lecturesSymboliques).toHaveLength(6);
    expect(section.noteLectureSymbolique).toBeNull();
  });

  it("les six sont dans l'ordre du catalogue, pas dans celui de l'objet", () => {
    const section = sectionNombres(NUM_COMPLETE, null);
    expect(section.nombres.map((n) => n.cle)).toEqual([...NOMBRES]);
  });

  it("chaque résultat porte sa preuve arithmétique, pas une interprétation", () => {
    const section = sectionNombres(NUM_COMPLETE, null, ENTREES_NUM_COMPLETE);
    for (const nombre of section.nombres) expect(nombre.calcul.length, nombre.cle).toBeGreaterThan(0);
    expect(section.nombres.find((nombre) => nombre.cle === "chemin_de_vie")?.calcul.join(" ")).toContain("Total :");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Retour du 2026-09-02 — sous le pli, chaque lecture dit le nombre qu'elle lit
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[retour 2026-09-02] l'intitulé d'une lecture symbolique porte son nombre : « Chemin de vie (7) »", () => {
  // POURQUOI : la « Lecture symbolique d'Anima » vit sous un `<details>` fermé, loin de la grille
  // où le nombre s'affiche en grand. Un article coiffé de « Chemin de vie » au-dessus de « Ton
  // chemin de vie 4 symbolise… » oblige à remonter pour savoir de quel 4 on parle. Le fondateur
  // demande le chiffre À CÔTÉ de ce à quoi il correspond — et c'est l'intitulé qui le porte, pas
  // un champ de plus : la frontière de rendu (`socle-frontiere.test.ts`) ne bouge pas.
  const section = sectionNombres(NUM_COMPLETE, null, ENTREES_NUM_COMPLETE);

  it("[CONTRÔLE DU CONTRÔLE] le jeu d'essai porte au moins un nombre maître, sinon « (11) » ne serait jamais éprouvé", () => {
    // Sans ce témoin, la règle « jamais (11/2) » ci-dessous serait vraie sur un jeu sans maître.
    const maitres = NOMBRES.filter((n) => {
      const lecture = NUM_COMPLETE.nombres[n];
      return lecture.statut === "calcule" && lecture.maitre;
    });
    expect(maitres.length, "le jeu d'essai ne porte aucun nombre maître").toBeGreaterThan(0);
  });

  it("[LE CŒUR] les six intitulés se terminent par la valeur du nombre de même clé, entre parenthèses", () => {
    expect(section.lecturesSymboliques).toHaveLength(6);
    for (const lecture of section.lecturesSymboliques) {
      const nombre = section.nombres.find((n) => n.cle === lecture.cle);
      expect(nombre, `${lecture.cle} : une lecture sans nombre calculé`).toBeDefined();
      // Recalculé depuis la fiche, jamais codé en dur : changer l'année de référence ou le nom du
      // jeu d'essai ne doit pas faire mentir cette garde. Mutations-cibles : retirer le suffixe
      // (« Chemin de vie ») ou y mettre la valeur d'un autre nombre — les deux rougissent ici.
      expect(lecture.intitule).toBe(`${nombre!.intitule} (${nombre!.valeur})`);
    }
  });

  it("un nombre maître s'écrit « Expression (11) », jamais « (11/2) » — la réduction est déjà dans le texte", () => {
    // « 11/2 » a la forme d'un compte (FR-031 refuse `\d+/\d+`), et le texte du corpus dit déjà
    // « ce nombre maître se lit aussi comme un 2 ». On n'écrit donc que le nombre conservé.
    for (const lecture of section.lecturesSymboliques) {
      const brut = NUM_COMPLETE.nombres[lecture.cle];
      if (brut.statut !== "calcule" || !brut.maitre) continue;
      expect(lecture.intitule).toBe(`${section.nombres.find((n) => n.cle === lecture.cle)!.intitule} (${brut.valeur})`);
      expect(lecture.intitule).not.toMatch(/\//);
    }
  });

  it("le libellé et le texte se répondent : la première phrase du texte nomme le même nombre", () => {
    // Le corpus commence chaque lecture par « Ton chemin de vie 7 symbolise… ». Si le nombre du
    // titre et celui de la phrase divergeaient, la page contredirait sa propre lecture.
    for (const lecture of section.lecturesSymboliques) {
      const valeur = lecture.intitule.match(/ \((\d+)\)$/)?.[1];
      expect(valeur, `intitulé sans nombre : « ${lecture.intitule} »`).toBeDefined();
      const premierePhrase = lecture.texte.split(/[.!?]/)[0];
      expect(premierePhrase, lecture.cle).toMatch(new RegExp(`(^|\\D)${valeur}(\\D|$)`));
    }
  });

  it("[ANTI-VACUITÉ] sans nom, aucune lecture orpheline ni parenthèse vide — les trois nombres de lettres restent des MANQUES", () => {
    // Le suffixe est fabriqué depuis la valeur calculée. Un nombre non calculé n'a pas de valeur :
    // il ne doit pas produire « Expression () », « Expression (undefined) », ni aucun article.
    const sansNom = sectionNombres(NUM_SANS_NOM, null);
    const manquants = new Set(sansNom.manquants.map((m) => m.cle));
    expect(manquants.size, "sans nom, il doit y avoir des manques — sinon la garde est vide").toBeGreaterThan(0);
    expect(sansNom.lecturesSymboliques.length, "les nombres de date gardent leur lecture").toBeGreaterThan(0);
    for (const lecture of sansNom.lecturesSymboliques) {
      expect(manquants.has(lecture.cle), `${lecture.cle} : une lecture pour un nombre non calculé`).toBe(false);
      expect(lecture.intitule).toMatch(/^\S.* \(\d+\)$/);
      expect(lecture.intitule).not.toMatch(/\(\s*\)|undefined|null|NaN/);
    }
    for (const manque of sansNom.manquants) {
      expect(manque.intitule, `${manque.cle} : un manque ne porte pas de nombre`).not.toMatch(/\(/);
    }
  });
});

describe("[13.9] les entrées et conventions sont traçables", () => {
  it("montre exactement la date, le nom et l'année utilisés", () => {
    const section = sectionNombres(NUM_COMPLETE, null, ENTREES_NUM_COMPLETE);
    expect(section.entrees).toEqual([
      { intitule: "Date de naissance", valeur: "15/06/1990" },
      { intitule: "Nom de naissance", valeur: "Marie Claire Dubois" },
      { intitule: "Année de référence", valeur: "2026" },
    ]);
  });

  it("déclare la table, la réduction séparée, les maîtres, Y et la bascule annuelle", () => {
    const texte = sectionNombres(NUM_COMPLETE, null, ENTREES_NUM_COMPLETE).conventions.join(" ");
    for (const attendu of ["pythagoricienne", "séparément", "11, 22 et 33", "lettre Y", "1er janvier"]) {
      expect(texte).toContain(attendu);
    }
  });

  it("ne répète qu'une seule note quand tout le corpus symbolique est vide", () => {
    const section = sectionNombres(
      NUM_COMPLETE,
      null,
      ENTREES_NUM_COMPLETE,
      () => ({ statut: "non_ecrit" }),
    );
    expect(section.lecturesSymboliques).toHaveLength(0);
    const occurrences = JSON.stringify(section).split(LECTURE_NUMEROLOGIE_NON_ECRITE).length - 1;
    expect(occurrences).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// AC2 — une absence se DIT, elle ne se creuse pas
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.5/AC2] un nombre absent dit sa raison et porte le lien qui la répare", () => {
  it("[LE CŒUR] sans nom complet, les trois nombres de lettres sont DITS, jamais absents en creux", () => {
    const section = sectionNombres(NUM_SANS_NOM, null);
    const manquants = section.manquants.map((m) => m.cle);
    expect(manquants).toContain("expression");
    expect(manquants).toContain("intime");
    expect(manquants).toContain("personnalite");
    // Et les trois qui ne dépendent que de la date, eux, sont bien là : sinon la garde ci-dessus
    // serait vraie sur une section entièrement vide.
    expect(section.nombres.map((n) => n.cle)).toContain("chemin_de_vie");
  });

  it("chaque absence porte une phrase pleine, et JAMAIS un tiret ou un « non disponible »", () => {
    const section = sectionNombres(NUM_SANS_NOM, null);
    expect(section.manquants.length).toBeGreaterThan(0);
    for (const m of section.manquants) {
      expect(m.raison.length, `${m.cle} : raison trop courte pour être une phrase`).toBeGreaterThan(40);
      expect(m.raison).not.toMatch(/^[—–-]$/);
      expect(m.raison.toLowerCase()).not.toContain("non disponible");
      expect(m.reparation, `${m.cle} : une absence réparable sans lien est un reproche déguisé`).not.toBeNull();
      expect(m.reparation!.url).toBe(URL_CORRIGER_LE_NOM.url);
    }
  });

  it("les quatre raisons du corpus de copie sont toutes des phrases distinctes", () => {
    const phrases = Object.values(RAISON_NOMBRE);
    expect(phrases).toHaveLength(4);
    expect(new Set(phrases).size, "deux raisons différentes ne peuvent pas dire la même chose").toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// AC3 — les corps, tous, avec signe / degré / maison
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.5/AC3] le ciel entier, plus jamais cinq corps", () => {
  it("[LE CŒUR] les dix classiques paraissent — Jupiter à Pluton pour la première fois", () => {
    const ciel = sectionCiel(themeComplet, null);
    const cles = ciel.positions.map((p) => p.cle);
    for (const c of ["soleil", "lune", "mercure", "venus", "mars", "jupiter", "saturne", "uranus", "neptune", "pluton"]) {
      expect(cles, `${c} manque à la halte`).toContain(c);
    }
    // Mutation-cible : revenir à `CORPS_DE_CARTE` (cinq). Le compte exact tue ce mutant-là.
    expect(ciel.positions.length).toBeGreaterThanOrEqual(10);
  });

  it("les deux nœuds lunaires paraissent, et ils sont NOMMÉS distinctement", () => {
    const ciel = sectionCiel(themeComplet, null);
    const intitules = ciel.positions.map((p) => p.intitule);
    expect(intitules.filter((i) => i.includes("Nœud")).length).toBe(2);
    expect(new Set(intitules).size, "deux corps ne peuvent pas porter le même nom").toBe(intitules.length);
  });

  it("le degré n'est rendu QUE sous `heure_connue`", () => {
    const avec = sectionCiel(themeComplet, null).positions.find((p) => p.cle === "soleil")!;
    const sans = sectionCiel(themeSansHeure, null).positions.find((p) => p.cle === "soleil")!;
    expect(avec.valeur, "avec l'heure, le degré se lit").toMatch(/\d+°/);
    expect(sans.valeur, "sans l'heure, un degré serait une précision inventée").not.toMatch(/°/);
  });

  it("la maison n'existe que si les angles existent", () => {
    expect(sectionCiel(themeComplet, null).positions.every((p) => p.maison !== null)).toBe(true);
    expect(sectionCiel(themeSansHeure, null).positions.every((p) => p.maison === null)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// AC4 — ascendant, milieu du ciel, douze cuspides
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.5/AC4] les angles, dont un qui n'avait jamais été affiché", () => {
  it("[LE CŒUR] le milieu du ciel paraît — il était calculé et invisible depuis la 5.1", () => {
    const ciel = sectionCiel(themeComplet, null);
    const intitules = ciel.angles.map((a) => a.intitule);
    expect(intitules).toContain("Ascendant");
    expect(intitules).toContain("Milieu du ciel");
  });

  it("les douze cuspides sont là, en signes entiers, sans degré", () => {
    const ciel = sectionCiel(themeComplet, null);
    expect(ciel.cuspides).toHaveLength(12);
    // En signes entiers une maison commence au 0° de son signe : un degré ici serait un bruit.
    for (const c of ciel.cuspides) expect(c.valeur).not.toMatch(/°/);
    expect(new Set(ciel.cuspides.map((c) => c.intitule)).size, "douze intitulés distincts").toBe(12);
  });

  it("sans heure, ni angles ni cuspides — et le manque est DIT", () => {
    const ciel = sectionCiel(themeSansHeure, null);
    expect(ciel.angles).toHaveLength(0);
    expect(ciel.cuspides).toHaveLength(0);
    expect(ciel.manques.length, "le silence sur une absence est le défaut, pas l'absence").toBeGreaterThan(0);
  });
});

describe("[13.7] la projection natale ne dépasse jamais la précision disponible", () => {
  it("porte les longitudes exactes comme texte et comme coordonnées SVG quand l'heure est connue", () => {
    const ciel = sectionCiel(themeComplet, null);
    expect(ciel.projection).not.toBeNull();
    expect(ciel.projection?.description).toContain("mêmes positions en texte");
    for (const position of ciel.positions) {
      expect(position.longitude).toMatch(/^\d{1,3},\d{2}°$/);
      expect(position.projection).toMatch(/^\d{1,3}\.\d{6}$/);
    }
  });

  it("retire la carte et les degrés exacts quand l'heure n'est pas connue", () => {
    const ciel = sectionCiel(themeSansHeure, null);
    expect(ciel.projection).toBeNull();
    expect(ciel.positions.every((position) => position.longitude === null && position.projection === null)).toBe(true);
  });
});

describe("[13.6] le socle est un aperçu, chaque détail reste à un geste", () => {
  it("construit les trois portes dans la grammaire des univers de Moi", () => {
    const fiche = ficheSocle(NUM_COMPLETE, themeComplet, 4, RIEN, ENTREES_NUM_COMPLETE);
    expect(fiche.apercus.map((apercu) => apercu.cle)).toEqual(["numerologie", "astrologie", "psychologie"]);
    expect(fiche.apercus.map((apercu) => apercu.url)).toEqual([
      "/socle?univers=numerologie",
      "/socle?univers=astrologie",
      "/psychologie",
    ]);
    expect(fiche.apercus.every((apercu) => apercu.faits.length > 0)).toBe(true);
  });

  it("ne promet pas de carte exacte lorsque l'heure n'autorise pas cette précision", () => {
    const fiche = ficheSocle(NUM_COMPLETE, themeSansHeure, null, RIEN, ENTREES_NUM_COMPLETE);
    const astrologie = fiche.apercus.find((apercu) => apercu.cle === "astrologie");
    expect(astrologie?.accroche).toContain("sans inventer la précision");
    expect(astrologie?.accroche).not.toContain("carte exacte");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// AC6 — une seule vérité par absence
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.5/AC6] la halte RÉUTILISE `socle-incomplet` et `message-sans-heure`", () => {
  it("[LE CŒUR] l'aveu est la constante de la 5.3, mot pour mot — pas une reformulation", () => {
    const ciel = sectionCiel(themeSansHeure, null);
    expect(ciel.sansHeure).not.toBeNull();
    expect(ciel.sansHeure!.aveu).toBe(MESSAGE_SANS_HEURE);
    expect(ciel.sansHeure!.ouChercher).toBe(OU_TROUVER_SON_HEURE);
    expect(ciel.sansHeure!.reparation.url).toBe("/heure-naissance");
  });

  it("un thème complet ne porte AUCUN aveu d'heure manquante", () => {
    expect(sectionCiel(themeComplet, null).sansHeure).toBeNull();
  });

  it("[LE PIÈGE DU PÔLE] une absence irréparable ne porte pas de lien d'invitation", () => {
    // Au pôle exact, l'ascendant n'existe pas : aucune heure ne le fera exister. Inviter à la
    // mairie serait faire porter à quelqu'un une limite de la notion. C'est `reparableParLHeure`
    // qui tranche, et cette halte lui obéit au lieu de relire `angles.statut`.
    const pole = calculerThemeNatal({ ...AVEC_HEURE, latitude: 90, longitude: 0 }, ephemeride);
    const ciel = sectionCiel(pole, null);
    const angles = ciel.manques.find((m) => m.intitule.includes("ascendant"));
    expect(angles, "l'absence des angles doit être listée").toBeDefined();
    expect(angles!.reparation, "au pôle, aucune heure ne répare — donc aucun lien").toBeNull();
    expect(ciel.sansHeure, "et aucun aveu d'heure manquante non plus").toBeNull();
  });

  it("les raisons d'angles et de corps couvrent leurs unions ENTIÈRES", () => {
    expect(Object.keys(RAISON_ANGLES)).toHaveLength(5);
    expect(Object.keys(RAISON_CORPS)).toHaveLength(3);
    for (const p of [...Object.values(RAISON_ANGLES), ...Object.values(RAISON_CORPS)]) {
      expect(p.length).toBeGreaterThan(40);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// AC5 — le sens n'est pas écrit, et la page le dit
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.5/AC5] le corpus de thème natal est vide, et ce vide est ASSUMÉ", () => {
  it("[CONTRÔLE DU CONTRÔLE] il n'existe toujours aucune clé de thème natal dans le corpus", () => {
    // Le jour où Anima écrit ces textes, ce test rougit — et c'est exactement ce qu'on veut : la
    // page devra alors les afficher au lieu d'annoncer un vide qui n'existe plus.
    const base = readFileSync(resolve(process.cwd(), "lib/corpus/textes-de-base.ts"), "utf-8");
    expect(base).not.toMatch(/"signe:[a-z_]+:[a-z_]+"/);
  });

  it("l'aveu ne fabrique aucun sens et nomme Anima comme seule autrice", () => {
    expect(SENS_DU_CIEL_NON_ECRIT).toContain("Anima");
    expect(SENS_DU_CIEL_NON_ECRIT.length).toBeGreaterThan(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le type — et le vide dont Anima était accusée
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.5 · 7.8] le type : c'est le test qui manque, pas le texte", () => {
  it("[LE CŒUR] sans type, la phrase désigne le TEST — jamais un vide du corpus", () => {
    const section = sectionType(null);
    expect(section.absence).not.toBeNull();
    expect(section.absence!.phrase).toBe(MESSAGE_TYPE_ABSENT);
    expect(section.absence!.reparation.url).toBe(URL_PASSER_LE_TEST.url);
    expect(section.absence!.phrase.toLowerCase()).not.toContain("anima n’a pas encore écrit");
    expect(section.texte, "sans type, il n'y a pas de texte à montrer — pas même NON_ECRIT").toBeNull();
  });

  it("avec un type, son texte de corpus est rendu", () => {
    const section = sectionType(4);
    expect(section.valeur).toBe("Type 4");
    expect(section.texte).not.toBeNull();
    expect(section.absence).toBeNull();
    expect(section.texte!.statut, "les neuf textes de type sont écrits").toBe("ecrit");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les gardes transversales
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.5] les gardes de voix et de chemins", () => {
  it("[LE CŒUR] chaque URL de la halte mène à une page qui EXISTE", () => {
    // ⚠️ La leçon du 2026-08-25 : le tour guidé désignait `/reperes` deux jours après le retrait du
    // lien, et rien n'a rougi. Une constante d'URL qui ne pointe nulle part est un lien mort en
    // production, et c'est un défaut qu'aucun test de rendu ne voit.
    const portes = [URL_CORRIGER_LE_NOM, URL_AJOUTER_SON_HEURE, URL_PASSER_LE_TEST];
    expect(portes.length).toBe(3);
    for (const p of portes) {
      const chemin = resolve(process.cwd(), `app${p.url}/page.tsx`);
      expect(existsSync(chemin), `${p.url} ne correspond à aucune page (${chemin})`).toBe(true);
      expect(p.libelle.length, `${p.url} : un lien sans libellé lisible`).toBeGreaterThan(3);
    }
  });

  it("aucune phrase de la halte ne prédit quoi que ce soit (FR-053/FR-020)", () => {
    const toutes = [
      INTRODUCTION,
      SENS_DU_CIEL_NON_ECRIT,
      MESSAGE_TYPE_ABSENT,
      ...Object.values(RAISON_NOMBRE),
      ...Object.values(RAISON_ANGLES),
      ...Object.values(RAISON_CORPS),
    ];
    expect(toutes.length).toBeGreaterThan(12);
    for (const phrase of toutes) {
      expect(chercherPredictions(phrase), `prédiction dans « ${phrase.slice(0, 60)}… »`).toEqual([]);
    }
  });

  it("[FR-031 DUR] la fiche ne porte AUCUN compte, sur aucune section", () => {
    // ⚠️ LA PREMIÈRE VERSION DE CETTE GARDE INTERDISAIT LE MOT « complet » DANS LE JSON, et elle
    // rougissait sur « Ton nom complet » — le libellé d'un lien. Une garde qui interdit un mot
    // plutôt qu'une MESURE devient impossible à satisfaire dès qu'un mot légitime le contient, et
    // la pression est alors d'assouplir la garde. On mesure donc ce qu'on veut vraiment refuser :
    // une VALEUR numérique (autre que le type d'ennéagramme, qui est une identité, pas un compte)
    // et les tournures de complétude.
    const fiche = ficheSocle(NUM_SANS_NOM, themeSansHeure, 4, RIEN);

    const nombresTrouves: string[] = [];
    const parcourir = (v: unknown, chemin: string) => {
      if (typeof v === "number") nombresTrouves.push(chemin);
      else if (Array.isArray(v)) v.forEach((e, i) => parcourir(e, `${chemin}[${i}]`));
      else if (v && typeof v === "object") {
        for (const [k, e] of Object.entries(v)) parcourir(e, `${chemin}.${k}`);
      }
    };
    parcourir(fiche, "fiche");
    // Le SEUL nombre autorisé est le type retenu. Tout autre champ numérique serait la place où
    // loger un compte — c'est la leçon de la 4.10 : le compte fuit par le type.
    expect(nombresTrouves, "un champ numérique inattendu est une place où loger un compte").toEqual([
      "fiche.type.type",
    ]);

    const serialise = JSON.stringify(fiche).toLowerCase();
    for (const tournure of [/\d+\s*(?:sur|\/)\s*\d+/, /%/, /taux de/, /complétude/, /progression/]) {
      expect(serialise, `tournure de complétude : ${tournure}`).not.toMatch(tournure);
    }
  });

  it("une panne de lecture se dit comme une panne, pas comme un vide", () => {
    const fiche = ficheSocle(null, null, null, { nombres: "panne A", ciel: "panne B" });
    expect(fiche.nombres.indisponible).toBe("panne A");
    expect(fiche.ciel.indisponible).toBe("panne B");
    expect(fiche.nombres.nombres).toHaveLength(0);
    expect(fiche.ciel.positions).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Retour du 2026-09-01 — l'horoscope d'abord, l'heure bien avant (univers Astrologie)
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Un horoscope du jour MINIMAL, comme dans `tests/cartes-socle.test.ts` : la halte ne lit ni le
 * ciel ni les configurations, elle transporte ce que `carteHoroscope` en fait. Le jour porte trois
 * NOMBRES, et c'est voulu : la garde FR-031 plus bas doit prouver qu'ils ne traversent pas.
 */
const HOROSCOPE: HoroscopeDuJour = {
  jour: { a: 2026, m: 9, j: 1 },
  ciel: {} as never,
  configurations: [],
  luneRelative: { statut: "calcule", distance: 3 } as never,
};

describe("[retour 2026-09-01] « Ton ciel du jour » traverse la fiche, à l'identique de l'accueil", () => {
  it("[CONTRÔLE DU CONTRÔLE] la carte de l'accueil existe et porte un titre", () => {
    // Sans ce témoin, « la même carte » serait vrai de deux objets vides.
    const carte = carteHoroscope(HOROSCOPE);
    expect(carte.titre).toBe("Ton ciel du jour");
    expect(["ecrit", "non_ecrit"]).toContain(carte.texte.statut);
  });

  it("[LE CŒUR] la fiche porte le titre et le texte de `carteHoroscope`, sans autre mise en mots", () => {
    // Mutations-cibles : rendre `null` malgré l'horoscope ; un titre recopié à la main ; un texte
    // choisi autrement que la carte (dominante, sinon Lune relative, sinon NON_ECRIT).
    const carte = carteHoroscope(HOROSCOPE);
    const ciel = sectionCiel(themeSansHeure, null, HOROSCOPE);
    expect(ciel.horoscope).toEqual({ titre: carte.titre, texte: carte.texte });
    expect(Object.isFrozen(ciel.horoscope)).toBe(true);
  });

  it("sans horoscope reçu, le bloc n'existe pas (il n'est pas « non écrit »)", () => {
    // Une panne d'éphéméride du jour n'est pas un silence d'Anima : accuser l'autrice d'une panne
    // de calcul serait le mensonge inverse de celui de la revue 4.6.
    expect(sectionCiel(themeSansHeure, null).horoscope).toBeNull();
    expect(sectionCiel(themeComplet, null, null).horoscope).toBeNull();
  });

  it("sans thème (naissance absente, panne), pas de ciel du jour même si l'appelant en a un", () => {
    expect(sectionCiel(null, "panne", HOROSCOPE).horoscope).toBeNull();
  });

  it("[LE CŒUR] `ficheSocle` transporte l'horoscope jusqu'à la section du ciel", () => {
    const fiche = ficheSocle(NUM_SANS_NOM, themeSansHeure, null, RIEN, undefined, HOROSCOPE);
    expect(fiche.ciel.horoscope?.titre).toBe("Ton ciel du jour");
    // Et sans le sixième argument, rien : les modes « tout » et « numérologie » ne le lisent pas.
    expect(ficheSocle(NUM_SANS_NOM, themeSansHeure, null, RIEN).ciel.horoscope).toBeNull();
  });

  it("[FR-031 DUR] avec l'horoscope, le SEUL nombre de la fiche reste le type : le jour civil ne traverse pas", () => {
    // `HoroscopeDuJour.jour` porte trois nombres. Mutation-cible : transporter la carte entière, ou
    // ajouter `jour` à `HoroscopeFiche` « pour la date » : le compte fuirait par le type (4.10).
    const fiche = ficheSocle(NUM_SANS_NOM, themeSansHeure, 4, RIEN, undefined, HOROSCOPE);
    const nombresTrouves: string[] = [];
    const parcourir = (v: unknown, chemin: string) => {
      if (typeof v === "number") nombresTrouves.push(chemin);
      else if (Array.isArray(v)) v.forEach((e, i) => parcourir(e, `${chemin}[${i}]`));
      else if (v && typeof v === "object") {
        for (const [k, e] of Object.entries(v)) parcourir(e, `${chemin}.${k}`);
      }
    };
    parcourir(fiche, "fiche");
    expect(nombresTrouves).toEqual(["fiche.type.type"]);
  });

  it("[LE CŒUR] le silence du jour est MOT POUR MOT celui de la carte de l'accueil", () => {
    // La halte et l'accueil montrent la même carte ; deux silences différents se liraient comme
    // une panne d'un côté et un vide de l'autre. Le rendu de l'accueil porte la phrase en dur
    // (`render/accueil/Bibliotheque.tsx`) : on vérifie qu'elle y est, à l'identique.
    const accueil = readFileSync(resolve(process.cwd(), "render/accueil/Bibliotheque.tsx"), "utf-8");
    expect(accueil).toContain(CIEL_DU_JOUR_NON_ECRIT);
  });
});

describe("[retour 2026-09-01] l'appel à l'heure : une seule vérité, en tête", () => {
  it("[LE CŒUR] sans heure, la fiche porte la bulle de `/heure-naissance`, mot pour mot", () => {
    // Mutation-cible : une seconde phrase écrite ici « pour la halte ». Deux vérités concurrentes
    // sur la même absence sont un défaut ; celle-ci est déjà écrite et déjà affichée ailleurs.
    const ciel = sectionCiel(themeSansHeure, null);
    expect(ciel.sansHeure?.appel).toBe(BULLE_SANS_HEURE);
    expect(ciel.sansHeure?.reparation.url).toBe("/heure-naissance");
  });

  it("avec l'heure, aucun appel", () => {
    expect(sectionCiel(themeComplet, null).sansHeure).toBeNull();
  });

  it("[CONTRÔLE DU CONTRÔLE] la bulle est courte, et c'est sa raison d'être", () => {
    // Si elle grandissait jusqu'à la taille de l'aveu, on aurait remis l'aveu en tête sous un autre nom.
    expect(BULLE_SANS_HEURE.length).toBeGreaterThan(40);
    expect(BULLE_SANS_HEURE.length).toBeLessThan(MESSAGE_SANS_HEURE.length / 2);
  });
});

describe("[retour 2026-09-01] la nouvelle copie de l'univers Astrologie passe les gardes de voix", () => {
  const NOUVELLES: ReadonlyArray<[string, string]> = [
    ["INTRODUCTION_ASTROLOGIE", INTRODUCTION_ASTROLOGIE],
    ["INTRODUCTION_NUMEROLOGIE", INTRODUCTION_NUMEROLOGIE],
    ["BOUTON_COMPLETER_CIEL", BOUTON_COMPLETER_CIEL],
    ["RESUME_DETAIL_HEURE", RESUME_DETAIL_HEURE],
    ["TITRE_DETAIL_POSITIONS", TITRE_DETAIL_POSITIONS],
    ["CIEL_DU_JOUR_NON_ECRIT", CIEL_DU_JOUR_NON_ECRIT],
    ["TITRE_LECTURE_NUMEROLOGIE", TITRE_LECTURE_NUMEROLOGIE],
  ];

  it("[PRÉSENCE AVANT ABSENCE] les sept constantes existent et ne sont pas vides", () => {
    for (const [nom, texte] of NOUVELLES) expect(texte.length, nom).toBeGreaterThan(3);
  });

  it.each(NOUVELLES)("%s : aucune prédiction, aucun tiret, apostrophe typographique, aucune mesure", (nom, texte) => {
    expect(chercherPredictions(texte), `${nom} prédit`).toEqual([]);
    // Interdits dans tout texte affiché depuis le 2026-09-01 : le tiret cadratin et le demi-cadratin.
    expect(texte, `${nom} porte un tiret`).not.toMatch(/[—–]/);
    expect(texte, `${nom} porte une apostrophe droite`).not.toMatch(/'/);
    // FR-031 : ni pourcentage, ni « débloqué », ni « x sur y ».
    expect(texte.toLowerCase(), nom).not.toMatch(/%|débloqu|\d+\s*(?:sur|\/)\s*\d+/);
  });

  it("[LE CŒUR] l'introduction du ciel est COURTE et tutoie", () => {
    // « L'app est beaucoup trop verbeuse » : la phrase d'avant faisait 128 caractères et nommait
    // « ton heure » à des comptes qui n'en ont pas. Mutation-cible : la remettre.
    expect([...INTRODUCTION_ASTROLOGIE].length).toBeLessThan(100);
    expect(INTRODUCTION_ASTROLOGIE).toMatch(/\b(?:tu|ton|ta|tes)\b/i);
    expect(INTRODUCTION_ASTROLOGIE).not.toMatch(/heure/i);
    expect(INTRODUCTION_ASTROLOGIE, "la garantie « pas un modèle » reste").toMatch(/modèle/i);
  });

  it("[FR-086] « Lecture symbolique » ne signe plus personne, et la note d'état garde Anima", () => {
    // Les 69 lectures sont des textes de départ non signés : le TITRE ne peut pas les attribuer.
    // Les NOTES, elles, décrivent un état (ce qu'Anima n'a pas encore écrit), pas une signature :
    // elles restent. Ce témoin prouve que la garde vise le titre, pas le mot « Anima ».
    expect(TITRE_LECTURE_NUMEROLOGIE).toBe("Lecture symbolique");
    expect(TITRE_LECTURE_NUMEROLOGIE).not.toMatch(/anima/i);
    expect(LECTURE_NUMEROLOGIE_NON_ECRITE).toMatch(/anima/i);
    expect(LECTURE_NUMEROLOGIE_PARTIELLE).toMatch(/anima/i);
  });
});
