import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PsychologieHub from "@/render/psychologie/PsychologieHub";
import * as copie from "@/lib/domain/copie-psychologie";

const COPIE = {
  introduction: copie.PSYCHOLOGIE_INTRO,
  titreEnneagramme: copie.ENNEAGRAMME_TITRE,
  absenceEnneagramme: copie.ENNEAGRAMME_ABSENT,
  enCoursEnneagramme: copie.ENNEAGRAMME_EN_COURS,
  indisponibleEnneagramme: copie.ENNEAGRAMME_INDISPONIBLE,
  actionEnneagramme: copie.ENNEAGRAMME_ACTION,
  reprendreEnneagramme: copie.ENNEAGRAMME_REPRENDRE,
  voirEnneagramme: copie.ENNEAGRAMME_VOIR,
  titreBigFive: copie.BIG_FIVE_TITRE,
  corpsBigFive: copie.BIG_FIVE_CORPS,
  titreHumanDesign: copie.HUMAN_DESIGN_TITRE,
  corpsHumanDesign: copie.HUMAN_DESIGN_CORPS,
  titreMethode: copie.METHODE_TITRE,
  corpsMethode: copie.METHODE_CORPS,
};

describe("[Psychologie] les capacités réelles et futures ne sont pas confondues", () => {
  it("rend l'Ennéagramme actionnable quand le test n'est pas passé", () => {
    render(<PsychologieHub enneagramme={{ statut: "a-faire", detail: null }} copie={COPIE} />);
    expect(screen.getByText(/tu n’as pas encore passé le test/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: copie.ENNEAGRAMME_ACTION }).getAttribute("href")).toBe(
      "/enneagramme",
    );
  });

  it("montre le résultat existant et garde la porte de relecture", () => {
    render(
      <PsychologieHub
        enneagramme={{ statut: "connu", detail: "Ton résultat retenu est le type 4." }}
        copie={COPIE}
      />,
    );
    expect(screen.getByText(/type 4/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: copie.ENNEAGRAMME_VOIR }).getAttribute("href")).toBe(
      "/enneagramme",
    );
  });

  it("propose de reprendre une tentative sans la présenter comme absente", () => {
    render(<PsychologieHub enneagramme={{ statut: "en-cours", detail: null }} copie={COPIE} />);
    expect(screen.getByText(/tes réponses sont enregistrées/i)).toBeTruthy();
    expect(screen.queryByText(/tu n’as pas encore passé/i)).toBeNull();
    expect(screen.getByRole("link", { name: copie.ENNEAGRAMME_REPRENDRE }).getAttribute("href")).toBe(
      "/enneagramme",
    );
  });

  it("ferme le CTA quand la lecture est indisponible", () => {
    render(<PsychologieHub enneagramme={{ statut: "indisponible", detail: null }} copie={COPIE} />);
    expect(screen.getByText(/je n’arrive pas à relire/i)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /test|résultat/i })).toBeNull();
  });

  it("ne présente ni Big Five ni Human Design comme un diagnostic déjà disponible", () => {
    const { container } = render(
      <PsychologieHub enneagramme={{ statut: "a-faire", detail: null }} copie={COPIE} />,
    );
    expect(screen.getByRole("heading", { name: "Big Five" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Human Design" })).toBeTruthy();
    expect(container.textContent).toMatch(/doivent encore être validées/i);
    expect(container.textContent).toMatch(/ce n’est pas un QCM/i);
    expect(screen.queryByRole("link", { name: /Big Five|Human Design/i })).toBeNull();
  });
});
