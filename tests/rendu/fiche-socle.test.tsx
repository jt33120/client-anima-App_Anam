import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import FicheSocle from "@/render/socle/FicheSocle";
import type { FicheSocleVue, HoroscopeVue } from "@/render/socle/types";
import { ficheSocle } from "@/lib/domain/fiche-socle";
import {
  INTRODUCTION,
  TITRE_APERCU,
  TITRE_NOMBRES,
  TITRE_ENTREES_NUMEROLOGIE,
  TITRE_METHODE_NUMEROLOGIE,
  TITRE_LECTURE_NUMEROLOGIE,
  TITRE_CIEL,
  TITRE_ANGLES,
  TITRE_MAISONS,
  TITRE_TYPE,
  TITRE_MANQUES,
  TITRE_PORTES,
  SENS_DU_CIEL_NON_ECRIT,
  LECTURE_NUMEROLOGIE_NON_ECRITE,
  NAISSANCE_ABSENTE,
  BOUTON_AJOUTER_HEURE,
  RESUME_DETAIL_HEURE,
  TITRE_DETAIL_POSITIONS,
  CIEL_DU_JOUR_NON_ECRIT,
} from "@/lib/domain/copie-socle";
import { MESSAGE_TYPE_SANS_TEXTE, MESSAGE_TYPE_ABSENT } from "@/lib/domain/enneagramme-items";
import { MESSAGE_SANS_HEURE, OU_TROUVER_SON_HEURE, BULLE_SANS_HEURE } from "@/lib/domain/message-sans-heure";
import type { HoroscopeDuJour } from "@/lib/astro/quotidien";
import { calculerNumerologie } from "@/lib/astro/numerologie";
import { calculerThemeNatal, type EntreesNaissance } from "@/lib/astro/theme-natal";
import { ephemerideAstronomyEngine } from "@/lib/astro/adapters/astronomy-engine";

/**
 * fiche-socle.test.tsx — [7.5] CE QUI ARRIVE VRAIMENT À L'ÉCRAN.
 *
 * ⚠️ CE FICHIER PART DU DOMAINE RÉEL, PAS D'UN FAUX MODÈLE DE VUE. Un fixture écrit à la main
 * prouverait que le composant sait dessiner un objet — pas que l'objet que le produit fabrique
 * arrive au pixel. Le défaut visé est exactement celui-là : `milieuDuCiel` est CALCULÉ depuis la
 * Story 5.1 et n'avait, au 2026-08-25, aucune occurrence sous `render/` ni `app/`. Il traversait
 * toute la chaîne et mourait avant le DOM, sans qu'une ligne ne rougisse.
 */

const ephemeride = ephemerideAstronomyEngine();
const AVEC_HEURE: EntreesNaissance = {
  date: "1990-06-15",
  heure: "07:15",
  fuseau: "Europe/Paris",
  latitude: 48.8566,
  longitude: 2.3522,
};
const SANS_HEURE: EntreesNaissance = { ...AVEC_HEURE, heure: null };

const COPIE = {
  introduction: INTRODUCTION,
  titreApercu: TITRE_APERCU,
  titreNombres: TITRE_NOMBRES,
  titreEntreesNumerologie: TITRE_ENTREES_NUMEROLOGIE,
  titreMethodeNumerologie: TITRE_METHODE_NUMEROLOGIE,
  titreLectureNumerologie: TITRE_LECTURE_NUMEROLOGIE,
  titreCiel: TITRE_CIEL,
  titreAngles: TITRE_ANGLES,
  titreMaisons: TITRE_MAISONS,
  titreType: TITRE_TYPE,
  titreManques: TITRE_MANQUES,
  titrePortes: TITRE_PORTES,
  sensDuCielNonEcrit: SENS_DU_CIEL_NON_ECRIT,
  typeSansTexte: MESSAGE_TYPE_SANS_TEXTE,
  boutonAjouterHeure: BOUTON_AJOUTER_HEURE,
  resumeDetailHeure: RESUME_DETAIL_HEURE,
  titreDetailPositions: TITRE_DETAIL_POSITIONS,
  cielDuJourNonEcrit: CIEL_DU_JOUR_NON_ECRIT,
};

const complete = ficheSocle(
  calculerNumerologie({ date: "1990-06-15", nomComplet: "Marie Claire Dubois" }, 2026),
  calculerThemeNatal(AVEC_HEURE, ephemeride),
  4,
  { nombres: null, ciel: null },
  { date: "1990-06-15", nomComplet: "Marie Claire Dubois" },
) as unknown as FicheSocleVue;

const sansHeureNiNom = ficheSocle(
  calculerNumerologie({ date: "1990-06-15", nomComplet: null }, 2026),
  calculerThemeNatal(SANS_HEURE, ephemeride),
  null,
  { nombres: null, ciel: null },
  { date: "1990-06-15", nomComplet: null },
) as unknown as FicheSocleVue;

const corpusNumerologieVide: FicheSocleVue = {
  ...complete,
  nombres: {
    ...complete.nombres,
    lecturesSymboliques: [],
    noteLectureSymbolique: LECTURE_NUMEROLOGIE_NON_ECRITE,
  },
};

const dessiner = (fiche: FicheSocleVue, mode: "tout" | "astrologie" | "numerologie" = "tout") =>
  render(<FicheSocle fiche={fiche} copie={COPIE} mode={mode} />);

/** Le `<details>` « Lecture symbolique d'Anima », reconnu par son résumé — pas par sa position. */
const pliDeLecture = (container: HTMLElement) =>
  [...container.querySelectorAll("details")].find((detail) =>
    (detail.querySelector("summary")?.textContent ?? "").includes(TITRE_LECTURE_NUMEROLOGIE),
  );

afterEach(cleanup);

describe("[7.5/AC4] le milieu du ciel arrive à l'écran", () => {
  it("[LE CŒUR] l'ascendant ET le milieu du ciel sont dans le DOM", () => {
    const { container } = dessiner(complete, "astrologie");
    const texte = container.textContent ?? "";
    expect(texte).toContain("Ascendant");
    expect(texte, "le milieu du ciel est calculé depuis la 5.1 et n'avait jamais été affiché").toContain(
      "Milieu du ciel",
    );
  });

  it("les douze cuspides sont rendues, et nommées", () => {
    const { container } = dessiner(complete, "astrologie");
    const texte = container.textContent ?? "";
    for (const nom of ["première maison", "sixième maison", "douzième maison"]) {
      expect(texte, `cuspide manquante : ${nom}`).toContain(nom);
    }
  });
});

describe("[7.5 · 13.9] les six nombres, avec leurs six preuves de calcul", () => {
  it("[LE CŒUR] six entrées de nombre, et chacune ouvre son calcul", () => {
    const { container } = dessiner(complete, "numerologie");
    const entrees = container.querySelectorAll("li[class*='entree']");
    expect(entrees.length, "six nombres calculés doivent donner six entrées à l'écran").toBe(6);
    for (const e of entrees) {
      const calcul = e.querySelector("details[class*='calcul']");
      expect(calcul, "un résultat sans preuve arithmétique n'est pas vérifiable").not.toBeNull();
      expect(calcul?.textContent ?? "").toContain("Voir le calcul");
    }
  });

  /**
   * ⚠️ LA PREUVE EST HORS DU PLI, ET C'EST LA MOITIÉ QUI COMPTE (retour du 2026-08-30).
   *
   * Le test au-dessus exige qu'un calcul EXISTE. Il était vert quand le calcul vivait entièrement
   * dans un `<details>` fermé — c'est-à-dire quand la seule chose visible d'un nombre était sa
   * valeur, juste au-dessus d'une « Lecture symbolique d'Anima » qui, elle, promettait de parler
   * de soi. « Exister » et « se voir » ne sont pas la même exigence, et le défaut rapporté
   * (« trop d'interprétation, pas assez de factuel ») vivait exactement dans cet écart.
   *
   * On vérifie donc que la ligne qui PROUVE le résultat est rendue HORS du `<details>`.
   */
  it("[LE CŒUR] la ligne qui prouve le résultat se lit sans ouvrir quoi que ce soit", () => {
    const { container } = dessiner(complete, "numerologie");
    const entrees = container.querySelectorAll("li[class*='entree']");
    expect(entrees.length).toBe(6);
    for (const e of entrees) {
      const replie = e.querySelector("details[class*='calcul']");
      const horsDuPli = e.querySelector("p[class*='preuveCalcul']");
      expect(horsDuPli, "la preuve est restée sous le pli — le nombre se lit encore comme un verdict").not.toBeNull();
      const preuve = horsDuPli?.textContent ?? "";
      // Une preuve arithmétique porte une flèche de réduction : c'est ce qui la distingue d'une
      // étiquette. Sans cette assertion, un `<p>` vide ou décoratif rendrait le test vert.
      expect(preuve, `preuve non arithmétique : « ${preuve} »`).toMatch(/→/);
      expect(replie, "le pas-à-pas complet doit rester disponible").not.toBeNull();
      expect(replie?.contains(horsDuPli!), "la preuve est DANS le pli, donc toujours cachée").toBe(false);
    }
  });

  it("[ANTI-VACUITÉ] la preuve visible est bien la dernière ligne de la trace, pas un texte inventé", () => {
    // Sans ce témoin, `<p class="preuveCalcul">→</p>` passerait le test précédent.
    const { container } = dessiner(complete, "numerologie");
    const premiere = container.querySelector("li[class*='entree']");
    const preuve = premiere?.querySelector("p[class*='preuveCalcul']")?.textContent ?? "";
    const lignes = complete.nombres.nombres[0].calcul;
    expect(lignes.length, "le doublage de test ne porte aucune trace").toBeGreaterThan(0);
    expect(preuve).toBe(lignes[lignes.length - 1]);
  });

  it("les six intitulés sont là, pas seulement le chemin de vie", () => {
    const texte = dessiner(complete, "numerologie").container.textContent ?? "";
    for (const nom of ["Chemin de vie", "Expression", "Intime", "Personnalité", "Jour de naissance", "Année personnelle"]) {
      expect(texte, `intitulé manquant : ${nom}`).toContain(nom);
    }
  });

  it("sépare la méthode de la lecture symbolique et ne répète qu'une note de corpus", () => {
    const { container } = dessiner(corpusNumerologieVide, "numerologie");
    expect(container.textContent ?? "").toContain(TITRE_METHODE_NUMEROLOGIE);
    expect(container.textContent ?? "").toContain(TITRE_LECTURE_NUMEROLOGIE);
    expect(container.querySelectorAll("p").length).toBeGreaterThan(0);
    expect((container.textContent ?? "").split(LECTURE_NUMEROLOGIE_NON_ECRITE).length - 1).toBe(1);
  });

  it("garde les lectures écrites derrière un seul dévoilement optionnel", () => {
    const { container } = dessiner(complete, "numerologie");
    const lecture = [...container.querySelectorAll("details")].find((detail) =>
      (detail.querySelector("summary")?.textContent ?? "").includes(TITRE_LECTURE_NUMEROLOGIE),
    );
    expect(lecture).toBeDefined();
    expect(lecture?.open).toBe(false);
    expect(lecture?.querySelectorAll("article")).toHaveLength(6);
  });

  /**
   * Retour du fondateur (2026-09-02) : « rajoute le chiffre à côté de ce à quoi il correspond,
   * exemple : Chemin de vie (7) ». Sous le pli, la grille n'est plus sous les yeux : un article
   * coiffé de « Chemin de vie » au-dessus de « Ton chemin de vie 4 symbolise… » oblige à remonter
   * pour savoir de quel 4 on parle. Le titre et le texte doivent se répondre sans quitter le pli.
   */
  it("[LE CŒUR] sous le pli, chacun des six articles est coiffé de son nombre — « Chemin de vie (4) »", () => {
    const { container } = dessiner(complete, "numerologie");
    const articles = [...(pliDeLecture(container)?.querySelectorAll("article") ?? [])];
    expect(articles).toHaveLength(6);
    for (const article of articles) {
      const titre = article.querySelector("h3")?.textContent ?? "";
      const decoupe = titre.match(/^(.+) \((\d+)\)$/);
      expect(decoupe, `intitulé sans nombre : « ${titre} »`).not.toBeNull();
      // Le nombre du titre est celui de la grille, recalculé depuis la fiche — jamais une valeur
      // inventée par le rendu. Mutations-cibles : suffixe retiré, ou valeur d'un autre nombre.
      const nombre = complete.nombres.nombres.find((n) => n.intitule === decoupe![1]);
      expect(nombre, `« ${decoupe![1]} » ne correspond à aucun nombre de la grille`).toBeDefined();
      expect(decoupe![2], titre).toBe(nombre!.valeur);
    }
  });

  it("[ANTI-VACUITÉ] la grille garde son intitulé nu : « (4) » ne se répète pas sous un 4 en grand", () => {
    // Le retour vise la lecture, pas la grille. Une étiquette « Chemin de vie (4) » au-dessus d'un
    // 4 en `t-display` dirait deux fois la même chose — et FR-031 lit de travers tout doublon.
    const { container } = dessiner(complete, "numerologie");
    const etiquettes = [...container.querySelectorAll("li[class*='entree'] p[class*='etiquette']")];
    expect(etiquettes).toHaveLength(6);
    for (const e of etiquettes) expect(e.textContent ?? "").not.toMatch(/\(/);
  });

  it("[ANTI-VACUITÉ] sans nom, les lectures restantes portent leur nombre et aucune parenthèse n'est vide", () => {
    // Un nombre non calculé n'a pas de valeur : ni « Expression () », ni article orphelin. Les
    // trois nombres de lettres restent des manques DITS (AC2), et les trois de date gardent leur
    // lecture, avec leur nombre.
    const { container } = dessiner(sansHeureNiNom, "numerologie");
    const titres = [...(pliDeLecture(container)?.querySelectorAll("article h3") ?? [])].map(
      (h) => h.textContent ?? "",
    );
    expect(titres.length, "les nombres de date gardent leur lecture").toBeGreaterThan(0);
    expect(titres.length, "les nombres de lettres ne peuvent pas avoir de lecture sans nom").toBeLessThan(6);
    for (const t of titres) expect(t).toMatch(/^\S.* \(\d+\)$/);
    expect(container.textContent ?? "").not.toMatch(/\(\s*\)|undefined|NaN/);
  });
});

describe("[7.5/AC3] le ciel entier, plus jamais cinq corps", () => {
  it("[LE CŒUR] Jupiter, Saturne, Uranus, Neptune et Pluton paraissent", () => {
    const texte = dessiner(complete, "astrologie").container.textContent ?? "";
    for (const corps of ["Jupiter", "Saturne", "Uranus", "Neptune", "Pluton"]) {
      expect(texte, `${corps} manque — la carte en montrait cinq, la halte les montre tous`).toContain(corps);
    }
  });

  it("les maisons accompagnent les positions quand les angles existent", () => {
    const { container } = dessiner(complete, "astrologie");
    const positions = container.querySelectorAll("li[class*='position']");
    expect(positions.length).toBeGreaterThan(10);
    const avecMaison = [...positions].filter((p) => (p.textContent ?? "").includes("maison"));
    expect(avecMaison.length, "avec l'heure, chaque corps occupe une maison").toBeGreaterThan(9);
  });
});

describe("[13.7] la carte natale exacte et son équivalent textuel", () => {
  it("nomme le SVG et projette chaque longitude servie par le domaine", () => {
    const { container } = dessiner(complete, "astrologie");
    const svg = container.querySelector("svg[role='img']");
    expect(svg).not.toBeNull();
    expect(svg?.querySelector("title")?.textContent).toContain("Carte exacte");
    expect(svg?.querySelector("desc")?.textContent).toContain("mêmes positions en texte");
    for (const position of complete.ciel.positions) {
      if (!position.projection) continue;
      expect(svg?.querySelector(`g[transform='rotate(${position.projection} 160 160)']`), position.cle).not.toBeNull();
      expect(container.textContent ?? "", position.cle).toContain(`Longitude : ${position.longitude}`);
    }
  });

  it("ne dessine aucune carte précise quand l'heure manque", () => {
    const { container } = dessiner(sansHeureNiNom, "astrologie");
    expect(container.querySelector("svg[role='img']")).toBeNull();
    expect(container.textContent ?? "").toContain("Il me manque ton heure de naissance");
  });
});

describe("[7.5/AC2] une absence se DIT — jamais un tiret, jamais une ligne vide", () => {
  it("[LE CŒUR] sans nom, les nombres manquants portent leur phrase ET leur lien", () => {
    const { container } = dessiner(sansHeureNiNom, "numerologie");
    const manques = container.querySelectorAll("div[class*='manque']");
    expect(manques.length, "aucune absence dite : le défaut est le silence, pas l'absence").toBeGreaterThan(0);
    const liens = container.querySelectorAll("a[href='/reglages']");
    expect(liens.length, "une absence réparable sans lien est un reproche déguisé").toBeGreaterThan(0);
  });

  it("aucune valeur n'est remplacée par un tiret ou un « non disponible »", () => {
    // ⚠️ LA PREMIÈRE VERSION REFUSAIT TOUT TIRET CADRATIN DANS LE TEXTE DE LA PAGE, et rougissait
    // sur « ce n'est pas une donnée qui manque — c'est une limite de la notion ». Un tiret DANS une
    // phrase est de la ponctuation ; ce que FR-050 refuse, c'est un tiret À LA PLACE d'une valeur.
    // Une garde qui confond les deux devient impossible à satisfaire, et la pression est alors de
    // l'assouplir jusqu'à ce qu'elle ne garde plus rien. On regarde donc les ÉLÉMENTS, pas la chaîne.
    const { container } = dessiner(sansHeureNiNom, "numerologie");
    expect((container.textContent ?? "").toLowerCase()).not.toContain("non disponible");
    const creux = [...container.querySelectorAll("span, p, li")].filter((e) =>
      /^[\s—–\-.·]*$/.test(e.textContent ?? ""),
    );
    expect(creux.map((e) => e.outerHTML), "un élément vide ou réduit à un tiret tient lieu de valeur").toEqual([]);
  });

  it("sans heure, l'aveu de la 5.3 est affiché avec son lien vers /heure-naissance", () => {
    const { container } = dessiner(sansHeureNiNom, "astrologie");
    expect(container.textContent ?? "").toContain("Il me manque ton heure de naissance");
    expect(container.querySelectorAll("a[href='/heure-naissance']").length).toBeGreaterThan(0);
  });
});

describe("[7.5/AC5] le sens du ciel n'est pas écrit, et la page le DIT", () => {
  it("[LE CŒUR] l'aveu paraît dès qu'une position est affichée", () => {
    const texte = dessiner(complete, "astrologie").container.textContent ?? "";
    expect(texte, "un tableau d'éphémérides muet est exactement ce que la 5.6 a refusé").toContain(
      SENS_DU_CIEL_NON_ECRIT,
    );
  });

  it("mais PAS quand il n'y a aucune position à qualifier", () => {
    const vide = ficheSocle(null, null, null, { nombres: "panne", ciel: "panne" }) as unknown as FicheSocleVue;
    expect(dessiner(vide, "astrologie").container.textContent ?? "").not.toContain(SENS_DU_CIEL_NON_ECRIT);
  });
});

describe("[13.6] le type reste un repère résumé dans la porte Psychologie", () => {
  it("[LE CŒUR] sans type, l'aperçu dit l'absence sans accuser le corpus", () => {
    const { container } = dessiner(sansHeureNiNom);
    const texte = container.textContent ?? "";
    expect(texte).toContain("Aucun type retenu pour le moment.");
    expect(texte, "l'ancien message accusait Anima d'un texte qu'elle a pourtant écrit").not.toContain(
      "Anima n’a pas encore écrit cette carte",
    );
    expect(container.querySelectorAll("a[href='/psychologie']").length).toBe(1);
  });

  it("avec un type, son texte de corpus paraît et l'invitation disparaît", () => {
    const texte = dessiner(complete).container.textContent ?? "";
    expect(texte).toContain("Type 4");
    expect(texte).not.toContain(MESSAGE_TYPE_ABSENT);
  });
});

describe("[7.5/AC8 · FR-031] rien à l'écran ne compte quoi que ce soit", () => {
  it("[LE CŒUR] aucune tournure de complétude, aucune jauge, aucun « x sur y »", () => {
    for (const fiche of [complete, sansHeureNiNom]) {
      const texte = (dessiner(fiche).container.textContent ?? "").toLowerCase();
      for (const tournure of [/\d+\s*(?:sur|\/)\s*\d+/, /%/, /taux de/, /complétude/, /progression/]) {
        expect(texte, `tournure de complétude à l'écran : ${tournure}`).not.toMatch(tournure);
      }
      cleanup();
    }
  });

  it("aucun élément de mesure n'est rendu — ni progress, ni meter", () => {
    const { container } = dessiner(complete);
    expect(container.querySelectorAll("progress, meter").length).toBe(0);
    expect(container.querySelectorAll("[role='progressbar']").length).toBe(0);
  });
});

describe("[7.5 · 7.2] les deux portes du socle", () => {
  it("[LE CŒUR] elles sont là MÊME quand rien ne manque", () => {
    // ⚠️ C'EST LE CŒUR PARCE QUE C'EST LE CAS QU'ON OUBLIE. Une porte qui n'apparaît qu'en cas de
    // problème est une porte qu'on ne trouve pas quand on la cherche — et depuis la Story 7.2, ces
    // deux-là ne vivent plus dans `/profil` : c'est ici, ou nulle part.
    const { container } = dessiner(complete);
    const portes = container.querySelectorAll("li[class*='porte']");
    expect(portes.length).toBe(3);
    const cibles = [...portes].flatMap((p) => [...p.querySelectorAll("a")].map((a) => a.getAttribute("href")));
    // ⚠️ LA PORTE « TON NOM » EST LÀ PARCE QUE LA 7.3 A RETIRÉ LE MOT « Profil » DE LA
    // SURIMPRESSION, et la 7.3b a supprimé la page. Sans elle, changer son prénom n'aurait plus
    // aucun chemin visible dans le produit — une fonctionnalité perdue par déplacement.
    expect(cibles.sort()).toEqual(["/enneagramme", "/heure-naissance", "/reglages"]);
    // ⚠️ ET LES TITRES, PAS SEULEMENT LES CIBLES — un mutant l'a exigé. Vérifier les seules URL
    // laissait passer une porte renommée en n'importe quoi : le lien menait au bon endroit et ne
    // disait plus où il menait, ce qui est une porte perdue pour qui la cherche des yeux.
    const titres = [...portes].map((p) => (p.querySelector("a")?.textContent ?? "").trim()).sort();
    expect(titres).toEqual(["Ton heure de naissance", "Ton nom", "Ton type"]);
  });

  it("chaque porte dit ce qu'il y a derrière", () => {
    const { container } = dessiner(complete);
    for (const porte of container.querySelectorAll("li[class*='porte']")) {
      expect((porte.textContent ?? "").length, "une porte sans phrase est une ligne de menu").toBeGreaterThan(50);
    }
  });
});

describe("[13.6] la structure résumée du document", () => {
  it("rend les trois univers comme des portes entières vers leur détail", () => {
    const { container } = dessiner(complete);
    expect(container.querySelectorAll("a[href='/socle?univers=numerologie']")).toHaveLength(1);
    expect(container.querySelectorAll("a[href='/socle?univers=astrologie']")).toHaveLength(1);
    expect(container.querySelectorAll("a[href='/psychologie']")).toHaveLength(1);
    expect(container.querySelectorAll("a[class*='porteApercu'] svg[aria-hidden='true']")).toHaveLength(3);
  });

  it("un aperçu et les portes de correction, chacun avec un titre accessible", () => {
    const { container } = dessiner(complete);
    const sections = container.querySelectorAll("section[aria-labelledby]");
    expect(sections.length, "aperçu puis portes de correction").toBe(2);
    for (const sec of sections) {
      const id = sec.getAttribute("aria-labelledby")!;
      const titre = container.querySelector(`#${id}`);
      expect(titre, `aucun titre pour la section ${id}`).not.toBeNull();
      expect((titre!.textContent ?? "").length).toBeGreaterThan(3);
    }
  });

  it("l'introduction dit d'où viennent ces données — et qu'elles ne viennent pas d'un modèle", () => {
    expect(dessiner(complete).container.textContent ?? "").toContain(INTRODUCTION);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Retour du 2026-09-01 — l'horoscope d'abord, l'heure bien avant, les positions repliées
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * « bouton ton heure de naissance bien avant … La première information c'est l'horoscope … Toggle
 * et cache les positions en texte. » Trois exigences d'ORDRE et de PLI, que seul le DOM peut
 * prouver : un test de domaine ne sait pas ce qui précède quoi à l'écran.
 *
 * Les textes d'horoscope sont posés À LA MAIN sur le modèle de vue : le corpus du jour est celui
 * qu'il est, et ce fichier garde que le rendu montre CE QU'ON LUI DONNE, écrit ou non écrit. Le
 * passage du domaine réel est éprouvé une fois, avec un vrai `HoroscopeDuJour`.
 */
const HOROSCOPE_ECRIT: HoroscopeVue = {
  titre: "Ton ciel du jour",
  texte: { statut: "ecrit", texte: "Le ciel du jour, tel qu’il est écrit dans le corpus." },
};
const HOROSCOPE_NON_ECRIT: HoroscopeVue = { titre: "Ton ciel du jour", texte: { statut: "non_ecrit" } };

const avecCielDuJour = (fiche: FicheSocleVue, horoscope: HoroscopeVue | null): FicheSocleVue => ({
  ...fiche,
  ciel: { ...fiche.ciel, horoscope },
});

const HOROSCOPE_REEL: HoroscopeDuJour = {
  jour: { a: 2026, m: 9, j: 1 },
  ciel: {} as never,
  configurations: [],
  luneRelative: { statut: "calcule", distance: 3 } as never,
};

const sectionCiel = (container: HTMLElement) => container.querySelector("section[aria-labelledby='socle-ciel']")!;
const carteJour = (container: HTMLElement) => container.querySelector("article[class*='carteJour']");
/** `a` précède `b` dans l'ordre du document. */
const precede = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
/** Le `<details>` reconnu par son résumé, jamais par sa position. */
const pli = (racine: ParentNode, resume: string) =>
  [...racine.querySelectorAll("details")].find((d) => (d.querySelector("summary")?.textContent ?? "") === resume);

describe("[retour 2026-09-01] l'heure de naissance, bien avant", () => {
  it("[LE CŒUR] sans heure, le bouton vers /heure-naissance est le PREMIER lien de la section, et il précède l'horoscope", () => {
    const { container } = dessiner(avecCielDuJour(sansHeureNiNom, HOROSCOPE_ECRIT), "astrologie");
    const section = sectionCiel(container);
    const liens = [...section.querySelectorAll("a")];
    expect(liens.length, "aucun lien dans la section").toBeGreaterThan(0);
    expect(liens[0].getAttribute("href")).toBe("/heure-naissance");
    expect(liens[0].textContent).toBe(BOUTON_AJOUTER_HEURE);
    // Mutation-cible : remettre l'appel EN BAS, là où il vivait. L'horoscope et le bouton existent
    // toujours, mais dans l'ordre d'avant.
    const carte = carteJour(container);
    expect(carte, "pas de « Ton ciel du jour » à précéder").not.toBeNull();
    expect(precede(liens[0], carte!), "le bouton doit précéder l'horoscope").toBe(true);
    // Et la bulle, dans la voix d'Anam, précède le bouton.
    const bulle = [...section.querySelectorAll("p")].find((p) => p.textContent === BULLE_SANS_HEURE);
    expect(bulle, "la bulle courte manque").toBeDefined();
    expect(bulle!.className).toMatch(/t-anam/);
    expect(precede(bulle!, liens[0])).toBe(true);
  });

  it("[LE CŒUR] avec l'heure, aucun appel : ni bulle, ni bouton, ni lien vers /heure-naissance", () => {
    const { container } = dessiner(avecCielDuJour(complete, HOROSCOPE_ECRIT), "astrologie");
    const section = sectionCiel(container);
    expect(section.querySelectorAll("a[href='/heure-naissance']").length).toBe(0);
    expect(section.textContent ?? "").not.toContain(BULLE_SANS_HEURE);
    expect(section.textContent ?? "").not.toContain(BOUTON_AJOUTER_HEURE);
  });

  it("[LE CŒUR] l'aveu long et « où la trouver » restent, sous un pli FERMÉ, après le bouton (FR-050)", () => {
    const { container } = dessiner(avecCielDuJour(sansHeureNiNom, HOROSCOPE_ECRIT), "astrologie");
    const section = sectionCiel(container);
    const detail = pli(section, RESUME_DETAIL_HEURE);
    expect(detail, "le pli de l'aveu manque").toBeDefined();
    expect(detail!.hasAttribute("open"), "le pli doit être fermé par défaut").toBe(false);
    expect(detail!.textContent ?? "").toContain(MESSAGE_SANS_HEURE);
    expect(detail!.textContent ?? "").toContain(OU_TROUVER_SON_HEURE);
    const bouton = section.querySelector("a[href='/heure-naissance']")!;
    expect(precede(bouton, detail!), "le pli vient SOUS le bouton").toBe(true);
    // Et l'aveu ne paraît NULLE PART hors du pli : le remettre en clair au-dessus serait revenir en arrière.
    for (const p of section.querySelectorAll("p")) {
      if (p.textContent === MESSAGE_SANS_HEURE || p.textContent === OU_TROUVER_SON_HEURE) {
        expect(p.closest("details"), "l'aveu long est rendu hors du pli").not.toBeNull();
      }
    }
  });
});

describe("[retour 2026-09-01] l'horoscope d'abord", () => {
  it("[LE CŒUR] « Ton ciel du jour » précède la carte natale (le SVG)", () => {
    const { container } = dessiner(avecCielDuJour(complete, HOROSCOPE_ECRIT), "astrologie");
    const carte = carteJour(container);
    const svg = container.querySelector("svg[role='img']");
    expect(carte).not.toBeNull();
    expect(svg, "avec l'heure, la carte exacte est là").not.toBeNull();
    expect(precede(carte!, svg!), "l'horoscope doit précéder le SVG").toBe(true);
    expect(carte!.querySelector("h3")?.textContent).toBe("Ton ciel du jour");
  });

  it("[ANTI-VACUITÉ] le texte rendu est CELUI DE LA FICHE, dans la voix d'Anam", () => {
    // Sans ce témoin, un bloc « Ton ciel du jour » vide ou décoratif passerait les tests d'ordre.
    const { container } = dessiner(avecCielDuJour(complete, HOROSCOPE_ECRIT), "astrologie");
    const parole = carteJour(container)!.querySelector("p");
    expect(parole?.textContent).toBe(HOROSCOPE_ECRIT.texte.statut === "ecrit" ? HOROSCOPE_ECRIT.texte.texte : "");
    expect(parole?.className, "ce sont les mots d'Anima : t-anam").toMatch(/t-anam/);
    expect(container.textContent ?? "").not.toContain(CIEL_DU_JOUR_NON_ECRIT);
  });

  it("[ANTI-VACUITÉ] non écrit : la phrase de l'accueil, JAMAIS un texte inventé, jamais en t-anam", () => {
    const { container } = dessiner(avecCielDuJour(complete, HOROSCOPE_NON_ECRIT), "astrologie");
    const carte = carteJour(container)!;
    const paragraphes = [...carte.querySelectorAll("p")];
    expect(paragraphes).toHaveLength(1);
    expect(paragraphes[0].textContent).toBe(CIEL_DU_JOUR_NON_ECRIT);
    // Mutation-cible : `?? "…"` ou un repli « Le ciel est calme aujourd'hui » : une citation
    // inventée, attribuée à une personne réelle (FR-054/FR-086).
    expect(carte.querySelector(".t-anam, [class*='t-anam']")).toBeNull();
  });

  it("sans thème (date de naissance absente), aucun « Ton ciel du jour » : la raison suffit", () => {
    const vide = ficheSocle(null, null, null, { nombres: NAISSANCE_ABSENTE, ciel: NAISSANCE_ABSENTE }) as unknown as FicheSocleVue;
    const { container } = dessiner(vide, "astrologie");
    expect(carteJour(container)).toBeNull();
    expect(container.textContent ?? "").toContain(NAISSANCE_ABSENTE);
    expect(container.textContent ?? "").not.toContain("Ton ciel du jour");
  });

  it("[LE CŒUR] le domaine RÉEL transporte un vrai `HoroscopeDuJour` jusqu'au DOM", () => {
    // Le reste de ce bloc pose le texte à la main ; ce témoin prouve que la chaîne complète tient.
    const fiche = ficheSocle(
      calculerNumerologie({ date: "1990-06-15", nomComplet: null }, 2026),
      calculerThemeNatal(SANS_HEURE, ephemeride),
      null,
      { nombres: null, ciel: null },
      { date: "1990-06-15", nomComplet: null },
      HOROSCOPE_REEL,
    ) as unknown as FicheSocleVue;
    const { container } = dessiner(fiche, "astrologie");
    const carte = carteJour(container);
    expect(carte).not.toBeNull();
    expect(carte!.querySelector("h3")?.textContent).toBe(fiche.ciel.horoscope!.titre);
    const attendu = fiche.ciel.horoscope!.texte;
    expect(carte!.querySelector("p")?.textContent).toBe(attendu.statut === "ecrit" ? attendu.texte : CIEL_DU_JOUR_NON_ECRIT);
  });

  it("les modes « tout » et « numérologie » ne changent pas : ni appel, ni ciel du jour", () => {
    for (const mode of ["tout", "numerologie"] as const) {
      const { container } = dessiner(avecCielDuJour(sansHeureNiNom, HOROSCOPE_ECRIT), mode);
      expect(carteJour(container), mode).toBeNull();
      expect(container.textContent ?? "", mode).not.toContain(BOUTON_AJOUTER_HEURE);
      expect(container.textContent ?? "", mode).not.toContain(BULLE_SANS_HEURE);
      cleanup();
    }
  });
});

describe("[retour 2026-09-01] les positions, repliées", () => {
  it("[LE CŒUR] positions, angles et maisons vivent sous UN SEUL <details> sans attribut `open`", () => {
    const { container } = dessiner(avecCielDuJour(complete, HOROSCOPE_ECRIT), "astrologie");
    const section = sectionCiel(container);
    const detail = pli(section, TITRE_DETAIL_POSITIONS);
    expect(detail, "le pli « Le détail des positions » manque").toBeDefined();
    expect(detail!.hasAttribute("open"), "il doit être FERMÉ par défaut").toBe(false);
    // Mutation-cible : laisser une des trois listes hors du pli. Chaque ligne de position est
    // reconnue par sa classe (comme le test [7.5/AC3] plus haut), et chacune doit être dedans.
    const lignes = section.querySelectorAll("li[class*='position']");
    expect(lignes.length).toBeGreaterThan(10);
    for (const ligne of lignes) expect(detail!.contains(ligne), ligne.textContent ?? "").toBe(true);
    for (const titre of ["Les positions, en texte", TITRE_ANGLES, TITRE_MAISONS]) {
      expect(detail!.textContent ?? "", `${titre} hors du pli`).toContain(titre);
    }
    // Un seul pli pour les trois : pas un `<details>` dans un `<details>`.
    expect(detail!.querySelectorAll("details").length).toBe(0);
  });

  it("[LE CŒUR] l'aveu du corpus (« ce qu'elles racontent n'est pas encore écrit ») ne paraît QUE sous le pli", () => {
    const { container } = dessiner(avecCielDuJour(complete, HOROSCOPE_ECRIT), "astrologie");
    const section = sectionCiel(container);
    const notes = [...section.querySelectorAll("p")].filter((p) => p.textContent === SENS_DU_CIEL_NON_ECRIT);
    expect(notes, "l'aveu du corpus a disparu").toHaveLength(1);
    expect(notes[0].closest("details")?.querySelector("summary")?.textContent).toBe(TITRE_DETAIL_POSITIONS);
  });

  it("l'ordre complet, avec l'heure : horoscope, carte, pli des positions", () => {
    const { container } = dessiner(avecCielDuJour(complete, HOROSCOPE_ECRIT), "astrologie");
    const section = sectionCiel(container);
    const carte = carteJour(container)!;
    const svg = section.querySelector("svg[role='img']")!;
    const detail = pli(section, TITRE_DETAIL_POSITIONS)!;
    expect(precede(carte, svg)).toBe(true);
    expect(precede(svg, detail)).toBe(true);
  });

  it("sans heure, pas de carte exacte, mais les positions certaines restent lisibles sous le pli", () => {
    const { container } = dessiner(avecCielDuJour(sansHeureNiNom, HOROSCOPE_ECRIT), "astrologie");
    const section = sectionCiel(container);
    expect(section.querySelector("svg[role='img']")).toBeNull();
    const detail = pli(section, TITRE_DETAIL_POSITIONS);
    expect(detail).toBeDefined();
    expect(detail!.textContent ?? "").toContain("Soleil");
    // Le pli des positions vient APRÈS l'appel à l'heure et l'horoscope.
    expect(precede(carteJour(container)!, detail!)).toBe(true);
  });
});
