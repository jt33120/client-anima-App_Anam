import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import FicheSocle from "@/render/socle/FicheSocle";
import type { FicheSocleVue } from "@/render/socle/types";
import { ficheSocle } from "@/lib/domain/fiche-socle";
import {
  INTRODUCTION,
  TITRE_NOMBRES,
  TITRE_CIEL,
  TITRE_ANGLES,
  TITRE_MAISONS,
  TITRE_TYPE,
  TITRE_MANQUES,
  SENS_DU_CIEL_NON_ECRIT,
} from "@/lib/domain/copie-socle";
import { MESSAGE_TYPE_SANS_TEXTE, MESSAGE_TYPE_ABSENT } from "@/lib/domain/enneagramme-items";
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
  titreNombres: TITRE_NOMBRES,
  titreCiel: TITRE_CIEL,
  titreAngles: TITRE_ANGLES,
  titreMaisons: TITRE_MAISONS,
  titreType: TITRE_TYPE,
  titreManques: TITRE_MANQUES,
  sensDuCielNonEcrit: SENS_DU_CIEL_NON_ECRIT,
  typeSansTexte: MESSAGE_TYPE_SANS_TEXTE,
};

const complete = ficheSocle(
  calculerNumerologie({ date: "1990-06-15", nomComplet: "Marie Claire Dubois" }, 2026),
  calculerThemeNatal(AVEC_HEURE, ephemeride),
  4,
  { nombres: null, ciel: null },
) as unknown as FicheSocleVue;

const sansHeureNiNom = ficheSocle(
  calculerNumerologie({ date: "1990-06-15", nomComplet: null }, 2026),
  calculerThemeNatal(SANS_HEURE, ephemeride),
  null,
  { nombres: null, ciel: null },
) as unknown as FicheSocleVue;

const dessiner = (fiche: FicheSocleVue) => render(<FicheSocle fiche={fiche} copie={COPIE} />);

afterEach(cleanup);

describe("[7.5/AC4] le milieu du ciel arrive à l'écran", () => {
  it("[LE CŒUR] l'ascendant ET le milieu du ciel sont dans le DOM", () => {
    const { container } = dessiner(complete);
    const texte = container.textContent ?? "";
    expect(texte).toContain("Ascendant");
    expect(texte, "le milieu du ciel est calculé depuis la 5.1 et n'avait jamais été affiché").toContain(
      "Milieu du ciel",
    );
  });

  it("les douze cuspides sont rendues, et nommées", () => {
    const { container } = dessiner(complete);
    const texte = container.textContent ?? "";
    for (const nom of ["première maison", "sixième maison", "douzième maison"]) {
      expect(texte, `cuspide manquante : ${nom}`).toContain(nom);
    }
  });
});

describe("[7.5/AC1] les six nombres, avec leurs six textes", () => {
  it("[LE CŒUR] six entrées de nombre, et chacune porte un texte non vide", () => {
    const { container } = dessiner(complete);
    const entrees = container.querySelectorAll("li[class*='entree']");
    expect(entrees.length, "six nombres calculés doivent donner six entrées à l'écran").toBe(6);
    for (const e of entrees) {
      const anam = e.querySelector("p[class*='texte']");
      expect(anam, "un nombre sans son texte est FR-055 non tenu").not.toBeNull();
      expect((anam!.textContent ?? "").length).toBeGreaterThan(20);
    }
  });

  it("les six intitulés sont là, pas seulement le chemin de vie", () => {
    const texte = dessiner(complete).container.textContent ?? "";
    for (const nom of ["Chemin de vie", "Expression", "Intime", "Personnalité", "Jour de naissance", "Année personnelle"]) {
      expect(texte, `intitulé manquant : ${nom}`).toContain(nom);
    }
  });
});

describe("[7.5/AC3] le ciel entier, plus jamais cinq corps", () => {
  it("[LE CŒUR] Jupiter, Saturne, Uranus, Neptune et Pluton paraissent", () => {
    const texte = dessiner(complete).container.textContent ?? "";
    for (const corps of ["Jupiter", "Saturne", "Uranus", "Neptune", "Pluton"]) {
      expect(texte, `${corps} manque — la carte en montrait cinq, la halte les montre tous`).toContain(corps);
    }
  });

  it("les maisons accompagnent les positions quand les angles existent", () => {
    const { container } = dessiner(complete);
    const positions = container.querySelectorAll("li[class*='position']");
    expect(positions.length).toBeGreaterThan(10);
    const avecMaison = [...positions].filter((p) => (p.textContent ?? "").includes("maison"));
    expect(avecMaison.length, "avec l'heure, chaque corps occupe une maison").toBeGreaterThan(9);
  });
});

describe("[7.5/AC2] une absence se DIT — jamais un tiret, jamais une ligne vide", () => {
  it("[LE CŒUR] sans nom, les nombres manquants portent leur phrase ET leur lien", () => {
    const { container } = dessiner(sansHeureNiNom);
    const manques = container.querySelectorAll("div[class*='manque']");
    expect(manques.length, "aucune absence dite : le défaut est le silence, pas l'absence").toBeGreaterThan(0);
    const liens = container.querySelectorAll("a[href='/profil']");
    expect(liens.length, "une absence réparable sans lien est un reproche déguisé").toBeGreaterThan(0);
  });

  it("aucune valeur n'est remplacée par un tiret ou un « non disponible »", () => {
    // ⚠️ LA PREMIÈRE VERSION REFUSAIT TOUT TIRET CADRATIN DANS LE TEXTE DE LA PAGE, et rougissait
    // sur « ce n'est pas une donnée qui manque — c'est une limite de la notion ». Un tiret DANS une
    // phrase est de la ponctuation ; ce que FR-050 refuse, c'est un tiret À LA PLACE d'une valeur.
    // Une garde qui confond les deux devient impossible à satisfaire, et la pression est alors de
    // l'assouplir jusqu'à ce qu'elle ne garde plus rien. On regarde donc les ÉLÉMENTS, pas la chaîne.
    const { container } = dessiner(sansHeureNiNom);
    expect((container.textContent ?? "").toLowerCase()).not.toContain("non disponible");
    const creux = [...container.querySelectorAll("span, p, li")].filter((e) =>
      /^[\s—–\-.·]*$/.test(e.textContent ?? ""),
    );
    expect(creux.map((e) => e.outerHTML), "un élément vide ou réduit à un tiret tient lieu de valeur").toEqual([]);
  });

  it("sans heure, l'aveu de la 5.3 est affiché avec son lien vers /heure-naissance", () => {
    const { container } = dessiner(sansHeureNiNom);
    expect(container.textContent ?? "").toContain("Il me manque ton heure de naissance");
    expect(container.querySelectorAll("a[href='/heure-naissance']").length).toBeGreaterThan(0);
  });
});

describe("[7.5/AC5] le sens du ciel n'est pas écrit, et la page le DIT", () => {
  it("[LE CŒUR] l'aveu paraît dès qu'une position est affichée", () => {
    const texte = dessiner(complete).container.textContent ?? "";
    expect(texte, "un tableau d'éphémérides muet est exactement ce que la 5.6 a refusé").toContain(
      SENS_DU_CIEL_NON_ECRIT,
    );
  });

  it("mais PAS quand il n'y a aucune position à qualifier", () => {
    const vide = ficheSocle(null, null, null, { nombres: "panne", ciel: "panne" }) as unknown as FicheSocleVue;
    expect(dessiner(vide).container.textContent ?? "").not.toContain(SENS_DU_CIEL_NON_ECRIT);
  });
});

describe("[7.5 · 7.8] le type — Anima cesse d'être accusée d'un vide qui n'est pas le sien", () => {
  it("[LE CŒUR] sans type, c'est le TEST qui est nommé, et le lien y mène", () => {
    const { container } = dessiner(sansHeureNiNom);
    const texte = container.textContent ?? "";
    expect(texte).toContain(MESSAGE_TYPE_ABSENT);
    expect(texte, "l'ancien message accusait Anima d'un texte qu'elle a pourtant écrit").not.toContain(
      "Anima n’a pas encore écrit cette carte",
    );
    expect(container.querySelectorAll("a[href='/enneagramme']").length).toBe(1);
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

describe("[7.5] la structure du document", () => {
  it("trois sections, chacune avec un titre accessible", () => {
    const { container } = dessiner(complete);
    const sections = container.querySelectorAll("section[aria-labelledby]");
    expect(sections.length).toBe(3);
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
