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
    carte("enneagramme", "Ton ennéagramme", "Ce texte ne doit pas vivre sur Aujourd’hui."),
  ],
  univers: univers(),
};

describe("[Aujourd’hui] le quotidien et les univers ont chacun leur place", () => {
  it("affiche le ciel et le mantra sous « Ce que le jour propose », mais aucune carte Anam ni profil stable", () => {
    render(<Bibliotheque bibliotheque={VUE} />);

    const quotidien = screen.getByRole("region", { name: "Ce que le jour propose" });
    expect(within(quotidien).getByText("14 août")).toBeTruthy();
    expect(within(quotidien).getByRole("article", { name: "Ton ciel du jour" })).toBeTruthy();
    expect(within(quotidien).getByRole("article", { name: "Le mantra du jour" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Anam" })).toBeNull();
    expect(screen.queryByRole("article", { name: "Ton ennéagramme" })).toBeNull();
    expect(screen.queryByText(/elle se manifeste/i)).toBeNull();
  });

  it("[LE BORD / D7] aucun second « Aujourd’hui » : la région porte déjà ce nom, la section ne le répète pas", () => {
    // Depuis le 2026-09-02 la RÉGION s'appelle « Aujourd’hui » (`lib/scene/regions.ts`, retour du
    // fondateur). Ce h2 disait le même mot quelques lignes sous le h1 : deux régions homonymes pour
    // un lecteur d'écran, deux titres pour une seule chose à l'œil. PRÉSENCE D'ABORD : la section
    // existe sous son nouveau nom, sinon les absences ci-dessous seraient vraies sur un composant vide.
    render(<Bibliotheque bibliotheque={VUE} />);
    expect(screen.getByRole("region", { name: "Ce que le jour propose" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Aujourd’hui" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Aujourd’hui" })).toBeNull();
    expect(screen.queryByText(/^Aujourd’hui$/)).toBeNull();
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

describe("[FR-031] Aujourd’hui ne fabrique ni compteur ni verrou", () => {
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

describe("[E3-S5] l’heure de naissance se propose sous la porte Astrologie", () => {
  /**
   * La seule invitation à ajouter son heure vivait dans la fiche du tronc, derrière un geste sur
   * l'arbre : qui n'y allait pas ne la voyait jamais. Depuis le 2026-09-02 la porte Astrologie de la
   * région d'accueil la porte aussi, DÉCIDÉE par le domaine (`lib/domain/univers-moi.ts`) : ici on
   * prouve seulement que le rendu dessine ce qu'on lui donne, sous la bonne porte, et rien de plus.
   */
  const ACTION_HEURE = { libelle: "Ajouter mon heure de naissance", url: "/heure-naissance" } as const;
  const avecHeureManquante = (): readonly UniversVue[] =>
    univers().map((u) => (u.cle === "astrologie" ? { ...u, action: ACTION_HEURE } : u));

  it("[LE CŒUR] le bouton est rendu depuis `univers.action`, sous SA porte, vers /heure-naissance", () => {
    render(<Bibliotheque bibliotheque={{ ...VUE, univers: avecHeureManquante() }} />);
    const lien = screen.getByRole("link", { name: ACTION_HEURE.libelle });
    expect(lien.getAttribute("href")).toBe(ACTION_HEURE.url);
    // Sous Astrologie et pas ailleurs : la porte qui contient le bouton est celle qui titre ainsi.
    const porte = lien.closest("article");
    expect(porte, "le bouton n'est pas dans une porte").not.toBeNull();
    expect(within(porte!).getByText("Astrologie")).toBeTruthy();
  });

  it("[LE BORD] sans action, aucun bouton : le rendu ne fabrique pas l’invitation lui-même", () => {
    // Mutation-cible : un `<Link>` vers /heure-naissance écrit en dur dans `PorteUnivers`.
    render(<Bibliotheque bibliotheque={VUE} />);
    expect(screen.queryByRole("link", { name: ACTION_HEURE.libelle })).toBeNull();
    expect(screen.queryByText(/heure de naissance/i)).toBeNull();
  });

  it("[LE BORD] deux portes peuvent porter chacune leur bouton, sans qu’aucune ne dise ce qui manque", () => {
    const { container } = render(<Bibliotheque bibliotheque={{ ...VUE, univers: avecHeureManquante() }} />);
    expect(screen.getByRole("link", { name: ACTION_HEURE.libelle })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Passer mon test d’ennéagramme" })).toBeTruthy();
    const texte = (container.textContent ?? "").toLowerCase();
    for (const mot of ["incomplet", "il te manque", "il manque", "il te reste", "%"]) {
      expect(texte, `« ${mot} » à l'écran`).not.toContain(mot);
    }
    expect(texte).not.toMatch(/\b\d+\s*(?:sur|\/)\s*\d+\b/);
  });
});
