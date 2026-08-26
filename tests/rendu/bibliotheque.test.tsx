import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Bibliotheque from "@/render/accueil/Bibliotheque";
import type { BibliothequeVue, CarteVue, UniversVue } from "@/render/accueil/types";

const carte = (cle: string, titre: string, texte: string): CarteVue => ({
  cle,
  titre,
  faits: [],
  texte: { statut: "ecrit", texte },
  etat: null,
});

const univers = (avecActionEnneagramme = true): readonly UniversVue[] => [
  {
    cle: "astrologie",
    titre: "Astrologie",
    accroche: "Ton ciel de naissance.",
    url: "/socle?univers=astrologie",
    action: null,
  },
  {
    cle: "numerologie",
    titre: "Numérologie",
    accroche: "Tes nombres de naissance.",
    url: "/socle?univers=numerologie",
    action: null,
  },
  {
    cle: "psychologie",
    titre: "Psychologie",
    accroche: "Tes repères psychologiques.",
    url: "/psychologie",
    action: avecActionEnneagramme
      ? { libelle: "Passer mon test d’ennéagramme", url: "/enneagramme" }
      : null,
  },
];

const VUE: BibliothequeVue = {
  jour: { a: 2026, m: 8, j: 14 },
  enAvant: "horoscope",
  cartes: [
    carte("mantra", "Le mantra du jour", "Remarque ce qui tient."),
    carte("horoscope", "Ton ciel du jour", "La Lune ralentit le rythme."),
    carte("enneagramme", "Ton ennéagramme", "Ce texte ne doit pas vivre sur Moi."),
  ],
  univers: univers(),
};

describe("[Moi] le quotidien et les univers ont chacun leur place", () => {
  it("affiche le ciel et le mantra sous Aujourd’hui, mais aucune carte Anam ni profil stable", () => {
    render(<Bibliotheque bibliotheque={VUE} />);

    const quotidien = screen.getByRole("region", { name: "Aujourd’hui" });
    expect(within(quotidien).getByText("14 août")).toBeTruthy();
    expect(within(quotidien).getByRole("article", { name: "Ton ciel du jour" })).toBeTruthy();
    expect(within(quotidien).getByRole("article", { name: "Le mantra du jour" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Anam" })).toBeNull();
    expect(screen.queryByRole("article", { name: "Ton ennéagramme" })).toBeNull();
    expect(screen.queryByText(/elle se manifeste/i)).toBeNull();
  });

  it("rend trois portes stables avec des destinations explicites", () => {
    render(<Bibliotheque bibliotheque={VUE} />);

    expect(screen.getByRole("heading", { name: "Tes univers" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Astrologie/i }).getAttribute("href")).toBe(
      "/socle?univers=astrologie",
    );
    expect(screen.getByRole("link", { name: /Numérologie/i }).getAttribute("href")).toBe(
      "/socle?univers=numerologie",
    );
    expect(screen.getByRole("link", { name: /Psychologie/i }).getAttribute("href")).toBe("/psychologie");
    expect(screen.queryByRole("link", { name: /Human Design/i })).toBeNull();
  });
});

describe("[Ennéagramme] l’action absente auparavant est impossible à manquer", () => {
  it("mène directement au questionnaire quand le test n’est pas passé", () => {
    render(<Bibliotheque bibliotheque={VUE} />);
    expect(
      screen.getByRole("link", { name: "Passer mon test d’ennéagramme" }).getAttribute("href"),
    ).toBe("/enneagramme");
  });

  it("retire seulement le CTA quand un résultat existe, pas l’univers Psychologie", () => {
    render(<Bibliotheque bibliotheque={{ ...VUE, univers: univers(false) }} />);
    expect(screen.queryByRole("link", { name: "Passer mon test d’ennéagramme" })).toBeNull();
    expect(screen.getByRole("link", { name: /Psychologie/i }).getAttribute("href")).toBe("/psychologie");
  });
});

describe("[FR-031] Moi ne fabrique ni compteur ni verrou", () => {
  it("ne rend aucun compte d’objets ni vocabulaire premium", () => {
    const { container } = render(<Bibliotheque bibliotheque={VUE} />);
    const texte = (container.textContent ?? "").toLowerCase();
    expect(texte).not.toMatch(/\b\d+\s*(cartes?|nouvelles?|restantes?)\b/i);
    expect(texte).not.toMatch(/\b\d+\s*\/\s*\d+\b/);
    for (const mot of ["verrouill", "débloqu", "cadenas", "premium", "réservé aux"]) {
      expect(texte).not.toContain(mot);
    }
  });
});
