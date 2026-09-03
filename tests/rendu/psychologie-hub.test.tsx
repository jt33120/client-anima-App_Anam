import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PsychologieHub, { type ModuleVue } from "@/render/psychologie/PsychologieHub";
import * as copie from "@/lib/domain/copie-psychologie";

/**
 * psychologie-hub.test.tsx — LA HALTE DE PSYCHOLOGIE, MONTÉE.
 *
 * ══ CE FICHIER A CHANGÉ DE VÉRITÉ LE 2026-09-03, ET C'EST LE BON GENRE DE CHANGEMENT ════════════
 *
 * Il exigeait qu'AUCUN lien ne mène au Big Five ni au Human Design : les deux étaient des vitrines,
 * et promettre une porte qui n'existait pas aurait été le défaut. Les deux modules sont maintenant
 * livrés — la garde deviendrait un mensonge en sens inverse.
 *
 * Ce qui ne bouge pas, et que ce fichier mesure toujours : le hub ne DÉCIDE de rien. Il ne déduit
 * pas « disponible » de la présence d'une URL, il ne réordonne pas les modules, et il ne fabrique
 * pas une porte pour un module dont la lecture a échoué. La page décide, le hub dessine.
 */

const METHODE = { titre: copie.METHODE_TITRE, corps: copie.METHODE_CORPS };

const module = (partiel: Partial<ModuleVue> & Pick<ModuleVue, "cle" | "titre">): ModuleVue => ({
  etiquette: "Disponible",
  glyphe: "✦",
  corps: null,
  porte: null,
  actif: true,
  ...partiel,
});

const ENNEAGRAMME_A_FAIRE = module({
  cle: "enneagramme",
  titre: copie.ENNEAGRAMME_TITRE,
  corps: copie.ENNEAGRAMME_ABSENT,
  porte: { libelle: copie.ENNEAGRAMME_ACTION, href: "/enneagramme" },
});

const monter = (modules: readonly ModuleVue[]) =>
  render(
    <PsychologieHub introduction={copie.PSYCHOLOGIE_INTRO} modules={modules} methode={METHODE} />,
  );

describe("[LE CŒUR] chaque module dit son état et porte sa porte", () => {
  it("un module à faire montre son texte et son lien", () => {
    monter([ENNEAGRAMME_A_FAIRE]);
    expect(screen.getByText(/tu n’as pas encore passé le test/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: copie.ENNEAGRAMME_ACTION }).getAttribute("href")).toBe(
      "/enneagramme",
    );
  });

  it("un module déjà conclu garde sa porte de relecture", () => {
    monter([
      module({
        cle: "enneagramme",
        titre: copie.ENNEAGRAMME_TITRE,
        corps: "Ton résultat retenu est le type 4.",
        porte: { libelle: copie.ENNEAGRAMME_VOIR, href: "/enneagramme" },
      }),
    ]);
    expect(screen.getByText(/type 4/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: copie.ENNEAGRAMME_VOIR }).getAttribute("href")).toBe(
      "/enneagramme",
    );
  });

  it("[LE CŒUR] un module sans porte n’en fabrique aucune", () => {
    // ⚠️ MUTATION-CIBLE : déduire la porte d'un `href` construit depuis `cle`. Le hub afficherait
    // alors un lien pour un module dont la lecture vient d'échouer, et le clic mènerait à une page
    // qui redirait la même panne — en promettant en chemin qu'il y avait quelque chose à voir.
    monter([
      module({
        cle: "enneagramme",
        titre: copie.ENNEAGRAMME_TITRE,
        corps: copie.ENNEAGRAMME_INDISPONIBLE,
        porte: null,
      }),
    ]);
    expect(screen.getByText(/je n’arrive pas à relire/i)).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("[LE CŒUR] les trois modules livrés sont atteignables", () => {
  const TROIS: readonly ModuleVue[] = [
    ENNEAGRAMME_A_FAIRE,
    module({
      cle: "big-five",
      titre: copie.BIG_FIVE_TITRE,
      glyphe: "✧",
      corps: copie.BIG_FIVE_ABSENT,
      porte: { libelle: copie.BIG_FIVE_ACTION, href: "/big-five" },
    }),
    module({
      cle: "human-design",
      titre: copie.HUMAN_DESIGN_TITRE,
      glyphe: "◇",
      corps: copie.HUMAN_DESIGN_CORPS,
      porte: { libelle: copie.HUMAN_DESIGN_ACTION, href: "/human-design" },
    }),
  ];

  it("chacun porte son titre et mène à sa halte", () => {
    monter(TROIS);
    for (const titre of [copie.ENNEAGRAMME_TITRE, copie.BIG_FIVE_TITRE, copie.HUMAN_DESIGN_TITRE]) {
      expect(screen.getByRole("heading", { name: titre })).toBeTruthy();
    }
    const liens = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
    expect(liens).toEqual(["/enneagramme", "/big-five", "/human-design"]);
  });

  it("[LE CŒUR] l’ORDRE reçu est l’ordre rendu — le hub ne trie rien", () => {
    // Sans ceci, un tri « les disponibles d'abord » pourrait s'ajouter un jour et déplacer les
    // vignettes sous les doigts de quelqu'un qui connaît sa page.
    const { container } = monter(TROIS);
    const titres = [...container.querySelectorAll("h2")].map((h) => h.textContent);
    expect(titres).toEqual([
      copie.ENNEAGRAMME_TITRE,
      copie.BIG_FIVE_TITRE,
      copie.HUMAN_DESIGN_TITRE,
      copie.METHODE_TITRE,
    ]);
  });

  it("[LE BORD] le Human Design annonce l’heure manquante sans fermer sa porte", () => {
    // La halte elle-même explique ce qui manque et propose `/heure-naissance`. Fermer la porte ici
    // obligerait à écrire deux fois la même explication.
    monter([
      module({
        cle: "human-design",
        titre: copie.HUMAN_DESIGN_TITRE,
        corps: copie.HUMAN_DESIGN_SANS_HEURE,
        porte: { libelle: copie.HUMAN_DESIGN_ACTION, href: "/human-design" },
      }),
    ]);
    expect(screen.getByText(/heure de naissance/i)).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/human-design");
  });
});

describe("[LE BORD] la section de méthode est toujours là, et n’est pas un module", () => {
  it("elle se rend même sans aucun module, et ne porte jamais de porte", () => {
    const { container } = monter([]);
    const methode = screen.getByRole("heading", { name: copie.METHODE_TITRE }).closest("section");
    expect(methode).toBeTruthy();
    expect(within(methode!).queryByRole("link")).toBeNull();
    expect(container.textContent).toContain(copie.PSYCHOLOGIE_INTRO);
  });
});
