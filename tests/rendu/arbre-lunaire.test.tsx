import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import { ARIA_CANEVAS, VIDE_TITRE } from "@/render/arbre/copie-arbre";
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

describe("Mon arbre — port lunaire réel", () => {
  it("l'étape 0 utilise le même Canvas transparent et aucun ancien SVG alternatif", () => {
    const { container } = monter([]);
    const canvas = screen.getByRole("img", { name: ARIA_CANEVAS });
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.getAttribute("data-etape-arbre")).toBe("graine");
    // ADAPTÉ : la graine « qui n'attend que d'éclore » est un SVG superposé au canevas (`GraineAttente`,
    // crochet `data-graine-attente`, tests/rendu/graine-integree.test.tsx) — le SEUL admis. L'ancien tronc
    // SVG alternatif, lui, reste interdit : on l'exclut par son crochet, pas par le nom de balise.
    expect(
      container.querySelector("svg:not([data-graine-attente])"),
      "l'ancien tronc SVG ne doit plus exister",
    ).toBeNull();
    expect(container.querySelector("[data-graine-attente]"), "la graine d'attente manque à l'étape 0").not.toBeNull();
    expect(screen.getByText(VIDE_TITRE)).toBeTruthy();
  });

  it("ne remplace pas le Canvas quand les branches apparaissent et rend les 20 actions DOM", () => {
    const { container } = monter(Array.from({ length: 20 }, (_, i) => branche(i)));
    expect(screen.getByRole("img", { name: ARIA_CANEVAS }).tagName).toBe("CANVAS");
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Branche : / })).toHaveLength(20);
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
