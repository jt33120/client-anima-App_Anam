import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import FicheArbreDeVie from "@/render/arbre-de-vie/FicheArbreDeVie";
import type { CopieArbreDeVieVue, FicheArbreDeVieVue } from "@/render/arbre-de-vie/types";
import { ficheArbreDeVie } from "@/lib/domain/fiche-arbre-de-vie";
import * as copie from "@/lib/domain/copie-arbre-de-vie";
import { CLES_ARBRE } from "@/lib/astro/arbre-de-vie";
import { NON_ECRIT } from "@/lib/corpus/port";

/**
 * arbre-de-vie.test.tsx — CE QUI ARRIVE VRAIMENT À L'ÉCRAN.
 *
 * ⚠️ CE FICHIER PART DU DOMAINE RÉEL, PAS D'UN FAUX MODÈLE DE VUE. Un fixture écrit à la main
 * prouverait que le composant sait dessiner un objet, pas que l'objet que le produit fabrique
 * arrive jusqu'au pixel. C'est la leçon de `fiche-socle.test.tsx`, où un champ calculé depuis des
 * semaines mourait avant le DOM sans qu'une ligne ne rougisse.
 *
 * Le défaut que RIEN D'AUTRE ne peut voir ici : une ancre morte. Une pastille qui pointe vers un
 * `#identifiant` sans section correspondante ne casse ni le type, ni la compilation, ni le rendu
 * serveur. Elle ne fait rien, et « elle ne fait rien » est exactement ce dont personne ne se
 * plaint en revue.
 */

const COPIE: CopieArbreDeVieVue = {
  surtitre: copie.SURTITRE,
  introduction: copie.INTRODUCTION,
  distinction: copie.DISTINCTION_AVEC_L_EVOLUTION,
  titreSchema: copie.TITRE_SCHEMA,
  descriptionSchema: copie.DESCRIPTION_SCHEMA,
  titreTriangle: copie.TITRE_TRIANGLE,
  introductionTriangle: copie.INTRODUCTION_TRIANGLE,
  titreComportement: copie.TITRE_COMPORTEMENT,
  introductionComportement: copie.INTRODUCTION_COMPORTEMENT,
  titreDynamique: copie.TITRE_DYNAMIQUE,
  titreDefis: copie.TITRE_DEFIS,
  introductionDefis: copie.INTRODUCTION_DEFIS,
  titreQualites: copie.TITRE_QUALITES,
  introductionQualites: copie.INTRODUCTION_QUALITES,
  titreCheminDeVie: copie.TITRE_CHEMIN_DE_VIE,
  titreMethode: copie.TITRE_METHODE,
  texteNonEcrit: copie.TEXTE_NON_ECRIT,
};

/** Le vecteur d'Anima, celui du rapport « Milian » (voir `tests/arbre-de-vie.test.ts`). */
const COMPLET = {
  date: "2018-07-12",
  nomComplet: "Milian Dupont",
  prenomDeNaissance: "Milian",
};

function dessiner(fiche: FicheArbreDeVieVue) {
  return render(<FicheArbreDeVie fiche={fiche} copie={COPIE} />);
}

/** Le pont domaine → rendu. Les deux formes coïncident (garde : `arbre-de-vie-frontiere`). */
function vue(entrees: typeof COMPLET | null, indisponible: string | null = null) {
  return ficheArbreDeVie(entrees, indisponible) as unknown as FicheArbreDeVieVue;
}

afterEach(cleanup);

describe("[LE CŒUR] le contrat d'ancre : chaque pastille mène quelque part", () => {
  it("les sept href pointent vers sept identifiants qui existent dans la page", () => {
    const { container } = dessiner(vue(COMPLET));
    const liens = [...container.querySelectorAll("figure a[href^='#']")];
    expect(liens, "sept prises attendues sur le dessin").toHaveLength(7);
    for (const lien of liens) {
      const ancre = lien.getAttribute("href")!.slice(1);
      expect(
        container.querySelector(`#${ancre}`),
        `ancre morte : aucune section « ${ancre} »`,
      ).not.toBeNull();
    }
  });

  it("l'ordre du DOM est celui du récit, du sol vers la cime", () => {
    // Un parcours au clavier doit lire la même histoire que l'œil (WCAG 2.4.3). Le CSS déplace les
    // prises, il ne les réordonne pas — et c'est ici qu'on s'en assure.
    const { container } = dessiner(vue(COMPLET));
    const ancres = [...container.querySelectorAll("figure a[href^='#']")].map((a) =>
      a.getAttribute("href")!.slice(1),
    );
    expect(ancres).toEqual(CLES_ARBRE.map((c) => c.replace(/_/g, "-")));
  });

  it("le dessin est annoncé comme une image, et rien dedans ne se tabule", () => {
    const { container } = dessiner(vue(COMPLET));
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.querySelector("title")?.textContent).toBe(copie.TITRE_SCHEMA);
    expect(svg.querySelector("desc")?.textContent).toBe(copie.DESCRIPTION_SCHEMA);
    expect(svg.querySelectorAll("[tabindex]")).toHaveLength(0);
    expect(svg.querySelectorAll("a, button")).toHaveLength(0);
  });
});

describe("[FR-031 DUR] rien à l'écran ne se lit comme une mesure", () => {
  it("aucun pourcentage, aucune fraction, aucun mot de mesure dans le DOM rendu", () => {
    const { container } = dessiner(vue(COMPLET));
    const lu = container.textContent ?? "";
    expect(lu, "un pourcentage est apparu").not.toMatch(/%/);
    expect(lu, "une fraction du type « 4 sur 9 » est apparue").not.toMatch(/\d+\s*sur\s*\d/);
    for (const mot of ["compteur", "pourcentage", "jauge", "score", "badge", "progression"]) {
      expect(lu.toLowerCase(), `mot de mesure à l’écran : ${mot}`).not.toContain(mot);
    }
  });

  it("les qualités disent une présence, jamais un nombre de lettres", () => {
    const { container } = dessiner(vue(COMPLET));
    // ⚠️ ON REGARDE LA SECTION DES QUALITÉS, PAS TOUTE LA PAGE. Le balayage large refusait
    // « le même nombre, lu deux fois » dans la méthode de calcul, qui ne compte rien du tout :
    // une garde qui mord sur une phrase juste finit par se faire désarmer en entier.
    const section = container.querySelector("[aria-labelledby='arbre-qualites']")!;
    const lu = section.textContent ?? "";
    // Les trois libellés possibles sont des phrases, pas des comptes. Au moins un doit paraître.
    const libelles = Object.values(copie.INTENSITE_LIBELLE);
    expect(libelles.some((l) => lu.includes(l)), "aucune présence de qualité affichée").toBe(true);
    // ⚠️ ON CHERCHE UN COMPTE DE LETTRES, PAS LE MOT « fois ». Une première version refusait
    // « en disant une fois ce que tu vaux », qui ne compte rien du tout : une garde qui mord sur
    // une phrase juste finit par se faire désarmer en entier, et c'est ainsi qu'elles meurent.
    expect(lu, "un compte de lettres est apparu").not.toMatch(/\d+\s*lettres?\b/i);
    expect(lu, "une fraction de qualités est apparue").not.toMatch(/\bsur\s*(?:neuf|9)\b/i);
  });

  it("les quatre défis ne portent AUCUN rang", () => {
    // Quatre défis numérotés se liraient comme quatre paliers à franchir, avec un « où j'en suis »
    // implicite : soit la barre de progression que le produit a remplacée par un arbre.
    const { container } = dessiner(vue(COMPLET));
    const lu = container.textContent ?? "";
    expect(lu).toContain(copie.TITRE_DEFIS);
    expect(lu, "un défi porte un rang").not.toMatch(/défi\s*n[°o]?\s*\d/i);
    expect(lu, "un défi porte un rang").not.toMatch(/(?:premier|deuxième|troisième|quatrième) défi/i);
  });
});

describe("[FR-050] une absence se dit, elle ne se creuse pas", () => {
  it("sans prénom de naissance, SEULES les branches manquent, et elles portent leur lien", () => {
    const { container } = dessiner(
      vue({ date: COMPLET.date, nomComplet: COMPLET.nomComplet, prenomDeNaissance: null } as never),
    );
    const lu = container.textContent ?? "";
    expect(lu).toContain(copie.RAISON_CLE.prenom_de_naissance_absent);
    // Le lien NOMME ce qui manque : « Ton nom complet » enverrait remplir un champ déjà rempli.
    expect(lu).toContain(copie.REPARATION_PRENOM.libelle);
    expect(
      container.querySelector(`a[href="${copie.REPARATION_PRENOM.url}"]`),
      "une absence réparable sans son lien est un reproche déguisé",
    ).not.toBeNull();

    // Les six autres parties gardent leur nombre : un manque ne contamine pas ses voisines.
    for (const cle of CLES_ARBRE.filter((c) => c !== "branches")) {
      const section = container.querySelector(`#${cle.replace(/_/g, "-")}`)!;
      expect(section.textContent, `${cle} a perdu son nombre`).toMatch(/\d/);
    }
  });

  it("jamais un tiret à la place d'un nombre absent", () => {
    const { container } = dessiner(
      vue({ date: COMPLET.date, nomComplet: null, prenomDeNaissance: null } as never),
    );
    const branches = container.querySelector("#branches")!;
    expect(branches.textContent, "un tiret cadratin sert de nombre").not.toMatch(/[—–]/);
    expect(branches.textContent).toContain(copie.INTITULE_CLE.branches);
  });

  it("sans date de naissance, AUCUN arbre n'est dessiné", () => {
    // Un arbre affiché vide se lirait comme une perte de données, pas comme un parcours inachevé.
    const { container } = dessiner(vue(null, copie.NAISSANCE_ABSENTE));
    expect(container.querySelector("svg"), "un arbre vide a été dessiné").toBeNull();
    expect(container.textContent).toContain(copie.NAISSANCE_ABSENTE);
    expect(container.querySelector(`a[href="${copie.PORTE_NAISSANCE.url}"]`)).not.toBeNull();
  });

  it("une panne de lecture ne se confond pas avec une date jamais donnée", () => {
    const { container } = dessiner(vue(null, copie.ARBRE_INDISPONIBLE));
    expect(container.textContent).toContain(copie.ARBRE_INDISPONIBLE);
    // Aucune porte vers un formulaire déjà rempli : un incident n'est pas une démarche à refaire.
    expect(container.querySelector(`a[href="${copie.PORTE_NAISSANCE.url}"]`)).toBeNull();
  });
});

describe("[FR-054/FR-086] le silence du corpus se dit en voix produit", () => {
  it("avec le corpus réel, chaque partie porte un texte d'Anima, et aucun n'est vide", () => {
    const { container } = dessiner(vue(COMPLET));
    const paragraphes = [...container.querySelectorAll(".t-anam")];
    expect(paragraphes.length, "aucun texte d’Anima à l’écran").toBeGreaterThanOrEqual(7);
    for (const p of paragraphes) {
      expect(p.textContent?.trim().length, "un paragraphe d’Anima est vide").toBeGreaterThan(20);
    }
    expect(
      container.textContent,
      "la phrase du silence paraît alors que tout est écrit",
    ).not.toContain(copie.TEXTE_NON_ECRIT);
  });

  it("[LE CHEMIN DU SILENCE] un créneau vide se dit en voix produit, jamais en t-anam vide", () => {
    /**
     * ⚠️ LE LECTEUR EST INJECTÉ, ET C'EST LA SEULE FAÇON DE TENIR CETTE GARDE MAINTENANT. Les 111
     * créneaux sont écrits : sans injection, cette branche ne serait plus jamais exercée, et elle
     * casserait en silence le jour où Anima viderait une entrée pour la réécrire.
     */
    const fiche = ficheArbreDeVie(COMPLET, null, (_cle, lecture) =>
      lecture.statut === "calcule" ? NON_ECRIT : null,
    ) as unknown as FicheArbreDeVieVue;
    const { container } = dessiner(fiche);
    expect(container.textContent).toContain(copie.TEXTE_NON_ECRIT);
    // La phrase est en voix PRODUIT : faire dire par Anima qu’Anima n’a pas écrit serait déjà lui
    // prêter une phrase (FR-086).
    const silence = [...container.querySelectorAll("p")].find((p) =>
      p.textContent?.includes(copie.TEXTE_NON_ECRIT),
    );
    expect(silence?.className).toContain("t-corps");
    expect(silence?.className).not.toContain("t-anam");
  });

  it("la distinction avec « Mon évolution » est dite en tête, et sans lien", () => {
    // Elle situe, elle n'invite pas : un lien depuis cette page vers la région arbre inviterait à
    // chercher le même arbre des deux côtés.
    const { container } = dessiner(vue(COMPLET));
    expect(container.textContent).toContain(copie.DISTINCTION_AVEC_L_EVOLUTION);
    expect(container.querySelector('a[href="/"]')).toBeNull();
  });

  it("la méthode de calcul reste visible, repliée", () => {
    const { container } = dessiner(vue(COMPLET));
    const lu = container.textContent ?? "";
    expect(lu).toContain(copie.TITRE_METHODE);
    for (const convention of copie.CONVENTIONS) expect(lu).toContain(convention);
  });
});

describe("le vecteur du rapport d'Anima arrive bien à l'écran", () => {
  it("les nombres de « Milian » se lisent dans leurs sections", () => {
    const { container } = dessiner(vue(COMPLET));
    const nombreDe = (ancre: string) =>
      container.querySelector(`#${ancre} .${"nombre"}`)?.textContent ??
      container.querySelector(`#${ancre}`)?.textContent ??
      "";
    expect(nombreDe("racine-premiere")).toContain("3");
    expect(nombreDe("racine-seconde")).toContain("7");
    expect(nombreDe("tronc")).toContain("1");
    expect(nombreDe("ecorce")).toContain("3");
    expect(nombreDe("branches")).toContain("4");
    expect(nombreDe("chemin-de-vie")).toContain("3");
  });

  it("un nombre maître s'écrit avec sa réduction, « 11/2 »", () => {
    const { container } = dessiner(vue(COMPLET));
    expect(container.querySelector("#dynamique-de-vie")?.textContent).toContain("11/2");
  });
});
