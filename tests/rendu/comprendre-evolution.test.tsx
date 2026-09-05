import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import ComprendreEvolution from "@/render/arbre/ComprendreEvolution";
import {
  ACTION_COMPRENDRE_EVOLUTION,
  ETAPES_EVOLUTION,
  LEGENDE_EXEMPLE_EVOLUTION,
} from "@/render/arbre/copie-arbre";
import type { ProjectionScene } from "@/lib/scene";
import { dimensionnerTout } from "./_outils";

afterEach(() => {
  cleanup();
  if (typeof localStorage !== "undefined") localStorage.clear();
});

const projection: ProjectionScene = {
  tronc: { present: true },
  branches: [
    {
      id: "branche-1",
      etat: "feuillaison",
      intensite: 0.5,
      extraitSourceId: "extrait-1",
      nom: "Ce qui revient",
      dateNaissance: "2026-09-01T12:00:00.000Z",
      extraitContenu: "Je remarque que ce thème revient.",
    },
  ],
};

const proprietes = {
  projection,
  camera: { pan: { x: 0, y: 0 }, zoom: 1 },
  brancheSelectionnee: null,
  onCadrer: vi.fn(),
  onOuvrirFiche: vi.fn(),
  onFermerFiche: vi.fn(),
  onVoirDansConversation: vi.fn(),
  onRenommer: vi.fn(async () => true),
};

describe("[RC-I2] comprendre Mon évolution", () => {
  it("présente les quatre étapes et un exemple ouvert, sans mécanique de récompense", async () => {
    const user = userEvent.setup();
    render(<ComprendreEvolution />);
    const ouverture = screen.getByRole("button", { name: ACTION_COMPRENDRE_EVOLUTION });

    await user.click(ouverture);
    const dialogue = screen.getByRole("dialog", { name: ACTION_COMPRENDRE_EVOLUTION });
    for (const etape of ETAPES_EVOLUTION) {
      expect(within(dialogue).getByRole("heading", { name: etape.titre })).toBeTruthy();
      expect(within(dialogue).getByText(etape.corps)).toBeTruthy();
    }
    expect(within(dialogue).getByRole("img", { name: /exemple d’arbre/i })).toBeTruthy();
    expect(within(dialogue).getByText(LEGENDE_EXEMPLE_EVOLUTION)).toBeTruthy();

    const texte = dialogue.textContent?.toLocaleLowerCase("fr") ?? "";
    for (const interdit of ["fruit", "trophée", "niveau", "%", "score", "série", "date d’achèvement"]) {
      expect(texte, `mécanique de récompense visible : ${interdit}`).not.toContain(interdit);
    }

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(ouverture);
  });

  it("reste accessible avec des branches en vue arbre comme en vue liste", async () => {
    dimensionnerTout(800, 600);
    const user = userEvent.setup();
    render(<ArbreInteractif {...proprietes} />);

    expect(screen.getByRole("button", { name: ACTION_COMPRENDRE_EVOLUTION })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /vue liste/i }));
    expect(screen.getByRole("button", { name: ACTION_COMPRENDRE_EVOLUTION })).toBeTruthy();
  });
});
