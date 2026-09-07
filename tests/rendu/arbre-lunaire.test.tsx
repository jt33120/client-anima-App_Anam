import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import { PLANCHES_METAMORPHOSE } from "@/render/arbre/metamorphose-planches";
import type { BrancheProjetee, ProjectionScene } from "@/lib/scene";
import { dimensionnerTout } from "./_outils";

const branche = (i: number): BrancheProjetee => ({
  id: `b-${i}`,
  etat: i % 3 === 0 ? "naissance" : i % 3 === 1 ? "feuillaison" : "rayonnement",
  intensite: i % 3 === 1 ? 0.58 : i % 3 === 2 ? 1 : 0,
  extraitSourceId: `source-${i}`,
  nom: `Branche ${i}`,
});

function monter(branches: readonly BrancheProjetee[], troncIncomplet = false) {
  dimensionnerTout(900, 700);
  const projection: ProjectionScene = {
    tronc: troncIncomplet
      ? { present: true, incomplet: { phrase: "Une matière reste en réserve.", ouTrouver: "Sur un acte." } }
      : { present: true },
    branches,
  };
  const props = {
    projection,
    camera: { pan: { x: 0, y: 0 }, zoom: 1 },
    brancheSelectionnee: null,
    onCadrer: vi.fn(),
    onOuvrirFiche: vi.fn(),
    onFermerFiche: vi.fn(),
    onVoirDansConversation: vi.fn(),
    onRenommer: vi.fn(async () => true),
  };
  return { ...render(<ArbreInteractif {...props} />), props };
}

describe("Mon arbre — illustration personnelle et accès réels", () => {
  it("l’étape 0 présente la graine illustrée seule dans le cadre personnel", () => {
    const { container } = monter([]);
    const dessin = container.querySelector('[data-index-croissance="0"]');
    expect(dessin?.getAttribute("data-etape-arbre")).toBe("graine");
    expect(decodeURIComponent(dessin?.querySelector("img")?.getAttribute("src") ?? "")).toContain(PLANCHES_METAMORPHOSE[0].src);
    expect(container.querySelector("canvas, svg, [data-graine-attente]")).toBeNull();
    expect(screen.getByText("Tout commence ici.")).toBeTruthy();
  });

  it("conserve les 20 branches via les cibles individuelles, leurs groupes et la liste", () => {
    const { container } = monter(Array.from({ length: 20 }, (_, i) => branche(i)));
    expect(container.querySelector("[data-index-croissance] img")).not.toBeNull();
    const ids = [...container.querySelectorAll<HTMLElement>("[data-branche-arbre], [data-groupe-branches]")]
      .flatMap((cible) => (cible.dataset.brancheArbre ?? cible.dataset.groupeBranches ?? "").split(" "));
    expect(ids.sort()).toEqual(Array.from({ length: 20 }, (_, i) => `b-${i}`).sort());
    const groupe = container.querySelector<HTMLButtonElement>("[data-groupe-branches]");
    expect(groupe).not.toBeNull();
    fireEvent.click(groupe!);
    expect(within(screen.getByRole("group", { name: "Branches proches" })).getAllByRole("button", { name: /^Branche : / }))
      .toHaveLength(groupe!.dataset.groupeBranches!.split(" ").length);
    fireEvent.click(screen.getByRole("button", { name: "Fermer les branches proches" }));
    fireEvent.click(screen.getByRole("button", { name: /vue liste/i }));
    expect(screen.getAllByRole("button", { name: "Voir dans la conversation" })).toHaveLength(20);
  });

  it("conserve l'ouverture de fiche par le bouton DOM superposé", () => {
    const { props } = monter([branche(0)]);
    fireEvent.click(screen.getByRole("button", { name: "Branche : Branche 0" }));
    expect(props.onOuvrirFiche).toHaveBeenCalledWith("b-0");
  });

  it("conserve un chemin nommé vers le tronc quand sa matière est en réserve", () => {
    monter([], true);
    expect(screen.getByRole("button", { name: /heure de naissance/i })).toBeTruthy();
  });
});
