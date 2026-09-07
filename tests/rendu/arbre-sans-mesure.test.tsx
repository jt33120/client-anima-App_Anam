import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import type { BrancheProjetee, ProjectionScene } from "@/lib/scene";
import { dimensionnerTout } from "./_outils";

/** The personal drawing grows, but its internal index never becomes a displayed score.
 * Counts only distinguish overlapping branch targets; they are navigation, not maturity. */

const NB_BRANCHES = 7; // choisi pour ne coïncider avec aucun chiffre des dates de test

const branche = (i: number): BrancheProjetee => ({
  id: `b${i}`,
  etat: i % 3 === 0 ? "naissance" : i % 3 === 1 ? "feuillaison" : "rayonnement",
  intensite: 0.4,
  extraitSourceId: `extrait-${i}`,
  nom: `ce que j'ai compris, numéro ${"un deux trois quatre cinq six sept".split(" ")[i]}`,
  dateNaissance: "2026-03-11T10:00:00.000Z",
  extraitContenu: "je crois que je m'en veux depuis longtemps",
});

const scene = (n: number): ProjectionScene => ({
  tronc: { present: true },
  branches: Array.from({ length: n }, (_, i) => branche(i)),
});

function proprietes(projection: ProjectionScene) {
  return {
    projection,
    camera: { pan: { x: 0, y: 0 }, zoom: 1 },
    brancheSelectionnee: null,
    onCadrer: vi.fn(),
    onOuvrirFiche: vi.fn(),
    onFermerFiche: vi.fn(),
    onVoirDansConversation: vi.fn(),
    onRenommer: vi.fn(async () => true),
  };
}

/** Tout ce que l'utilisatrice LIT : le texte visible + les libellés annoncés aux lecteurs d'écran. */
function texteLu(racine: HTMLElement): string {
  const etiquettes = [...racine.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label") ?? "");
  const alternatives = [...racine.querySelectorAll("img[alt]")].map((e) => e.getAttribute("alt") ?? "");
  return `${racine.textContent ?? ""} ${etiquettes.join(" ")} ${alternatives.join(" ")}`;
}

describe("la croissance personnelle n’affiche aucune mesure de maturité", () => {
  it("aucun indice de maturité ni décompte global hors des groupes de navigation", () => {
    dimensionnerTout(800, 600);
    const { container } = render(<ArbreInteractif {...proprietes(scene(NB_BRANCHES))} />);
    for (const groupe of container.querySelectorAll<HTMLElement>("[data-groupe-branches]")) {
      const nombre = groupe.dataset.groupeBranches!.split(" ").length;
      expect(groupe.textContent).toBe(String(nombre));
      expect(groupe.getAttribute("aria-label")).toBe(`Voir les ${nombre} branches proches`);
    }
    const copie = container.cloneNode(true) as HTMLElement;
    copie.querySelectorAll("[data-groupe-branches]").forEach((groupe) => groupe.remove());
    const lu = texteLu(copie);

    expect(lu, `un chiffre affiché dans la vue arbre : « ${lu.trim()} »`).not.toMatch(/\d/);
    expect(lu).not.toContain("%");
  });

  it("aucun POURCENTAGE dans la vue liste non plus (elle porte des dates, pas des mesures)", async () => {
    dimensionnerTout(800, 600);
    render(<ArbreInteractif {...proprietes(scene(NB_BRANCHES))} />);
    // La bascule vers la vue liste est le doublage non-spatial (AC8).
    screen.getByRole("button", { name: /vue liste/i }).click();

    const lu = texteLu(document.body);
    expect(lu).not.toContain("%");
    // Le nombre de branches ne doit apparaître nulle part comme un décompte.
    expect(lu, "le nombre de branches est affiché comme un décompte").not.toMatch(
      new RegExp(`(^|\\D)${NB_BRANCHES}(\\D|$)`),
    );
  });

  it("[MÉTA] la garde MORD : un chiffre injecté dans le même texte serait attrapé", () => {
    // Contrôle positif du prédicat lui-même : sans lui, un `.not.toMatch` sur du texte vide passerait
    // toujours et la garde serait creuse (le reproche exact fait à la version précédente).
    expect("Progression : 45 %").toMatch(/\d/);
    expect(`${NB_BRANCHES} branches nommées`).toMatch(new RegExp(`(^|\\D)${NB_BRANCHES}(\\D|$)`));
    const support = document.createElement("div");
    const image = document.createElement("img");
    image.alt = "Ton évolution : 23 %";
    support.append(image);
    expect(texteLu(support)).toMatch(/\d/);
    expect(texteLu(support)).toContain("%");
  });
});
