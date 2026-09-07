import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import { PLANCHES_METAMORPHOSE } from "@/render/arbre/metamorphose-planches";
import type { BrancheProjetee, ProjectionScene } from "@/lib/scene";
import { dimensionnerTout } from "./_outils";

const branche: BrancheProjetee = {
  id: "a", etat: "naissance", intensite: 0, extraitSourceId: "extrait-a", nom: "Première branche",
};
const scene = (branches: readonly BrancheProjetee[], indisponible?: true): ProjectionScene =>
  ({ tronc: { present: true }, branches, ...(indisponible ? { indisponible } : {}) });
const gestes = {
  camera: { pan: { x: 0, y: 0 }, zoom: 1 }, brancheSelectionnee: null,
  onCadrer: vi.fn(), onOuvrirFiche: vi.fn(), onFermerFiche: vi.fn(),
  onVoirDansConversation: vi.fn(), onRenommer: vi.fn(async () => true),
};

afterEach(() => vi.restoreAllMocks());

describe("la graine personnelle intégrée au monde de l’arbre", () => {
  it("présente la première illustration préservée, sans deuxième graine ni moteur superposé", () => {
    dimensionnerTout(800, 600);
    const contexte = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    const { container } = render(<ArbreInteractif {...gestes} projection={scene([])} />);
    const cadre = container.querySelector('[data-index-croissance="0"]');
    expect(cadre?.getAttribute("data-etape-arbre")).toBe("graine");
    expect(cadre?.querySelectorAll("img")).toHaveLength(1);
    expect(decodeURIComponent(cadre?.querySelector("img")?.getAttribute("src") ?? "")).toContain(PLANCHES_METAMORPHOSE[0].src);
    expect(container.querySelector("canvas, [data-graine-attente]")).toBeNull();
    expect(contexte).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Voir la graine éclore" })).toBeTruthy();
  });

  it("la première branche remplace la graine par son éclosion dans le même monde mesuré", () => {
    dimensionnerTout(800, 600);
    const { container, rerender } = render(<ArbreInteractif {...gestes} projection={scene([])} />);
    const monde = container.querySelector("[data-index-croissance]")?.parentElement;
    const imageGraine = container.querySelector("[data-index-croissance] img");
    rerender(<ArbreInteractif {...gestes} projection={scene([branche])} />);
    const cadre = container.querySelector('[data-index-croissance="1"]');
    expect(cadre?.parentElement).toBe(monde);
    expect(monde?.style.height).toBe("600px");
    expect(decodeURIComponent(cadre?.querySelector("img")?.getAttribute("src") ?? "")).toContain(PLANCHES_METAMORPHOSE[1].src);
    expect(imageGraine?.isConnected).toBe(false);
    expect(container.querySelector("canvas, [data-graine-attente]")).toBeNull();
    expect(screen.getByRole("button", { name: "Branche : Première branche" })).toBeTruthy();
  });

  it("une lecture indisponible ne présente aucune fausse graine ni illustration personnelle", () => {
    dimensionnerTout(800, 600);
    const { container } = render(<ArbreInteractif {...gestes} projection={scene([], true)} />);
    expect(container.querySelector("[data-index-croissance], canvas, [data-graine-attente]")).toBeNull();
    expect(screen.queryByRole("button", { name: "Voir la graine éclore" })).toBeNull();
  });
});
