import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CarteAnam from "@/render/accueil/CarteAnam";
import Bibliotheque from "@/render/accueil/Bibliotheque";
import type { BibliothequeVue, CarteAnamVue, CarteVue } from "@/render/accueil/types";
import { CATALOGUE_CARTES } from "@/lib/domain/bibliotheque";

/**
 * carte-anam.test.tsx — LA CARTE D'ANAM MONTÉE POUR DE VRAI (Story 6.3, T5 · AC6, AC7).
 *
 * `carte-anam.test.ts` prouve que le MODÈLE choisit la bonne ligne et se tait quand il faut. Ce
 * fichier prouve la chose complémentaire, et ce n'est pas la même : **ce qui atteint l'écran** — et
 * surtout les chemins par lesquels une pastille pourrait exister sans jamais s'écrire (une classe qui
 * s'allume, un `aria-label`, un `aria-live`, un attribut de comptage).
 *
 * C'est la raison d'être du projet `rendu` : une garde de source reste verte alors que l'écran ment.
 */

const NEUTRE: CarteAnamVue = {
  titre: "Anam",
  presence: "Elle se manifeste quand elle a quelque chose de précis à dire.",
  ligne: null,
};

const AVEC_MOTIF: CarteAnamVue = { ...NEUTRE, ligne: "Ta synthèse est prête — elle va jusqu'au 15 août 2026." };

describe("[AC6] neutre, puis spécifique — et la SEULE différence est une ligne de texte", () => {
  it("sans motif : le titre et la phrase invariante, rien d'autre", () => {
    render(<CarteAnam carte={NEUTRE} />);
    expect(screen.getByRole("heading", { level: 2, name: "Anam" })).toBeTruthy();
    expect(screen.getByText(NEUTRE.presence)).toBeTruthy();
  });

  it("avec motif : EXACTEMENT une ligne de plus", () => {
    // Mutation-cible : rendre la ligne deux fois (résumé + détail), ou la rendre aussi quand elle est
    // `null`. AC6 dit « exactement une », et « exactement » se compte.
    const neutre = render(<CarteAnam carte={NEUTRE} />);
    const avant = neutre.container.querySelectorAll("p").length;
    neutre.unmount();

    const { container } = render(<CarteAnam carte={AVEC_MOTIF} />);
    expect(container.querySelectorAll("p").length - avant).toBe(1);
    expect(screen.getByText(AVEC_MOTIF.ligne!)).toBeTruthy();
  });

  it("[LE TEST QUI COMPTE] rien d'AUTRE ne change entre les deux états", () => {
    // ⚠️ LA PASTILLE SANS LE MOT. Le geste naturel, et celui que ce test interdit : allumer une
    // classe d'accent quand Anam a quelque chose à dire. Ce serait un badge — il n'aurait simplement
    // pas de texte. On compare donc les DEUX rendus, attribut par attribut, hors le texte lui-même.
    // ⚠️ L'EMPREINTE NE LISAIT QUE LA RACINE (revue Epic 6, R6). Allumer la classe sur un ENFANT —
    // `<p className={`… ${carte.ligne ? s.accent : ""}`}>` — laissait les deux empreintes égales
    // pendant que la pastille s'allumait. La propriété centrale de ce fichier était exactement celle
    // qui n'était pas prouvée. On parcourt donc TOUS les éléments, racine comprise.
    const empreintes = (c: CarteAnamVue) => {
      const { container, unmount } = render(<CarteAnam carte={c} />);
      const traces = [...container.querySelectorAll("*")].map(
        (el) =>
          `${el.tagName}:` +
          [...el.attributes].map((a) => `${a.name}=${a.value}`).sort().join(","),
      );
      unmount();
      return traces;
    };

    // ⚠️ INCLUSION, PAS ÉGALITÉ — et il a fallu un test rouge pour l'apprendre. La carte avec motif
    // rend un `<p>` DE PLUS (la ligne), ce qui est licite et voulu. Ce qui ne l'est pas, c'est qu'un
    // élément DÉJÀ PRÉSENT change d'attributs. On exige donc que chaque signature du rendu neutre se
    // retrouve intacte dans l'autre : le mutant `${carte.ligne ? s.accent : ""}` modifie la classe du
    // `<p>` de présence, sa signature neutre disparaît, et la garde rougit.
    const avec = empreintes(AVEC_MOTIF);
    for (const signature of empreintes(NEUTRE)) {
      expect(
        avec,
        `un élément change d'attributs quand Anam a quelque chose à dire : ${signature}`,
      ).toContain(signature);
    }
  });

  it("la ligne paraît TELLE QUELLE — le rendu ne formate ni date ni mot (AD-7)", () => {
    // Mutation-cible : une date reformatée, une majuscule ajoutée, un préfixe « Nouveau : ».
    const carte: CarteAnamVue = { ...NEUTRE, ligne: "Pour aujourd'hui : si je bloque, alors j'écris." };
    render(<CarteAnam carte={carte} />);
    expect(screen.getByText(carte.ligne!).textContent).toBe(carte.ligne);
  });
});

describe("[AC6 · FR-031] aucune pastille, aucun compteur, par AUCUN chemin", () => {
  for (const [nom, carte] of [
    ["neutre", NEUTRE],
    ["avec motif", AVEC_MOTIF],
  ] as const) {
    it(`${nom} : aucun attribut d'accessibilité ne porte un compte ni une annonce`, () => {
      const { container } = render(<CarteAnam carte={carte} />);
      for (const el of container.querySelectorAll("*")) {
        for (const attr of el.attributes) {
          // `aria-live` transformerait la carte en notification qui s'annonce. Elle n'annonce pas :
          // elle est là. Et aucun attribut ARIA de comptage n'a sa place ici.
          expect(attr.name, `${attr.name} sur <${el.tagName.toLowerCase()}>`).not.toMatch(
            /^aria-(live|setsize|posinset|valuenow|valuetext|badge)$/,
          );
          if (attr.name.startsWith("aria-") || attr.name === "title") {
            expect(attr.value, `${attr.name}="${attr.value}"`).not.toMatch(/\d/);
          }
        }
      }
    });
  }

  it("la carte NEUTRE ne porte aucun chiffre, nulle part", () => {
    // AC6 : « sans pastille, sans compteur, sans chiffre, y compris dans ses attributs
    // d'accessibilité ». La carte AVEC motif, elle, porte une DATE — un jour n'est pas un compte,
    // et l'interdire rendrait la spécificité impossible.
    const { container } = render(<CarteAnam carte={NEUTRE} />);
    expect(container.textContent ?? "").not.toMatch(/\d/);
  });

  it("aucun vocabulaire de notification (AC5 : rien qui ressemble à une relance)", () => {
    const { container } = render(<CarteAnam carte={AVEC_MOTIF} />);
    const texte = (container.textContent ?? "").toLowerCase();
    for (const interdit of ["nouveau", "non lu", "en attente", "reviens", "tu nous manques", "notification"]) {
      expect(texte, `« ${interdit} » n'a rien à faire sur cette carte`).not.toContain(interdit);
    }
  });
});

describe("[UX-DR-30] la borne compte les objets RENDUS, pas les entrées du catalogue", () => {
  const carte = (cle: string): CarteVue => ({
    cle,
    titre: `Titre ${cle}`,
    faits: [],
    texte: { statut: "non_ecrit" },
    etat: null,
  });

  const vue = (cles: readonly string[]): BibliothequeVue => ({
    jour: { a: 2026, m: 8, j: 14 },
    enAvant: cles[0] ?? null,
    cartes: cles.map(carte),
    anam: NEUTRE,
  });

  it("[LE CŒUR] l'accueil RÉEL rend le catalogue, plus la carte d'Anam — pas un objet de plus", () => {
    // ⚠️ CE TEST EXISTE PARCE QUE LA BORNE ÉTAIT MESURÉE AU MAUVAIS ENDROIT (Story 6.3, D8).
    // `assertCatalogueBorne` vérifie `CATALOGUE_CARTES.length` pendant que l'écran rend une carte
    // de PLUS. Une carte de catalogue ajoutée passait donc sous le plafond du module et le
    // franchissait à l'écran, avec un build vert.
    //
    // ⚠️ ET IL FABRIQUAIT SON PROPRE ACCUEIL, CE QUI ÉTAIT LA MOITIÉ DU DÉFAUT (corrigé le
    // 2026-08-25, Story 7.7). Il rendait `["theme","mantra","horoscope","nombres","enneagramme"]`
    // — cinq clés écrites à la main — et attendait six objets. Le 2026-08-25, « theme » et
    // « nombres » ont quitté le catalogue : le test est resté VERT en éprouvant un accueil qui
    // n'existe plus. Il lit désormais le catalogue réel.
    const { container } = render(<Bibliotheque bibliotheque={vue([...CATALOGUE_CARTES])} />);
    expect(container.querySelectorAll("article").length).toBe(CATALOGUE_CARTES.length + 1);
  });

  it("le plancher décidé est tenu — la grille plus la carte d'Anam", () => {
    // Le plancher vaut sur le CATALOGUE (amendement d'`EXPERIENCE.md` §3) ; ce qui borne l'écran,
    // c'est que l'accueil ne rende jamais plus que le catalogue plus la carte d'Anam.
    const { container } = render(<Bibliotheque bibliotheque={vue([...CATALOGUE_CARTES])} />);
    expect(CATALOGUE_CARTES.length, "le catalogue est passé sous son plancher").toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll("article").length).toBe(CATALOGUE_CARTES.length + 1);
  });

  it("la carte d'Anam est rendue HORS de la grille — elle n'entre pas dans la rotation", () => {
    // Mutation-cible : la glisser dans la `<ul>`. Elle deviendrait alors une carte du catalogue pour
    // le CSS (`.item:first-child` prend toute la largeur) et pourrait se retrouver en tête.
    const { container } = render(<Bibliotheque bibliotheque={vue(["mantra", "horoscope"])} />);
    expect(container.querySelectorAll("ul article").length, "la grille ne contient que le catalogue").toBe(2);
    expect(container.querySelectorAll("article").length).toBe(3);
  });
});
