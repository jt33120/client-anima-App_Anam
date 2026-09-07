import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import ComprendreEvolution from "@/render/arbre/ComprendreEvolution";
import {
  ACTION_COMPRENDRE_EVOLUTION,
  ETAPES_EVOLUTION,
  FERMER_COMPRENDRE_EVOLUTION,
} from "@/render/arbre/copie-arbre";
import { PLANCHES_METAMORPHOSE } from "@/render/arbre/metamorphose-planches";
import type { ProjectionScene } from "@/lib/scene";
import { dimensionnerTout } from "./_outils";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
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
  it("ouvre la galerie à la graine, conserve l’explication métier et rend le focus à la fermeture", async () => {
    const user = userEvent.setup();
    render(<ComprendreEvolution />);
    const ouverture = screen.getByRole("button", { name: ACTION_COMPRENDRE_EVOLUTION });

    await user.click(ouverture);
    const dialogue = screen.getByRole("dialog", { name: ACTION_COMPRENDRE_EVOLUTION });
    expect(within(dialogue).getByAltText(PLANCHES_METAMORPHOSE[0].alt)).toBeTruthy();
    await user.click(within(dialogue).getByText("Ce que raconte mon arbre"));
    for (const etape of ETAPES_EVOLUTION) {
      expect(within(dialogue).getByRole("heading", { name: etape.titre })).toBeTruthy();
      expect(within(dialogue).getByText(etape.corps)).toBeTruthy();
    }

    const texte = dialogue.textContent?.toLocaleLowerCase("fr") ?? "";
    for (const interdit of ["fruit", "trophée", "niveau", "%", "score", "date d’achèvement"]) {
      expect(texte, `mécanique de récompense visible : ${interdit}`).not.toContain(interdit);
    }

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(ouverture);
  });

  it("propose l’éclosion depuis la graine, ouvre la deuxième image et revient au bon déclencheur", async () => {
    dimensionnerTout(390, 620);
    const requetes = vi.fn();
    vi.stubGlobal("fetch", requetes);
    const user = userEvent.setup();
    render(<ArbreInteractif {...proprietes} projection={{ tronc: { present: true }, branches: [] }} />);
    const ouverture = screen.getByRole("button", { name: "Voir la graine éclore" });
    await user.click(ouverture);
    const dialogue = screen.getByRole("dialog");
    expect(within(dialogue).getByAltText(PLANCHES_METAMORPHOSE[1].alt)).toBeTruthy();
    expect(within(dialogue).getByRole<HTMLSelectElement>("combobox", { name: "Choisir une étape" }).value).toBe("1");
    await user.click(within(dialogue).getByRole("button", { name: FERMER_COMPRENDRE_EVOLUTION }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(ouverture);
    expect(screen.queryAllByRole("button", { name: /^Branche :/ })).toHaveLength(0);
    expect(requetes).not.toHaveBeenCalled();
    expect(proprietes.onOuvrirFiche).not.toHaveBeenCalled();
    expect(proprietes.onRenommer).not.toHaveBeenCalled();
  });

  it("reste accessible avec des branches en vue arbre comme en vue liste", async () => {
    dimensionnerTout(800, 600);
    const user = userEvent.setup();
    render(<ArbreInteractif {...proprietes} />);

    expect(screen.getByRole("button", { name: ACTION_COMPRENDRE_EVOLUTION })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /vue liste/i }));
    expect(screen.getByRole("button", { name: ACTION_COMPRENDRE_EVOLUTION })).toBeTruthy();
  });

  it("explorer les images ne change ni les branches personnelles ni leur lien vers la conversation", async () => {
    dimensionnerTout(800, 600);
    const requetes = vi.fn();
    vi.stubGlobal("fetch", requetes);
    const avant = JSON.stringify(projection);
    const user = userEvent.setup();
    render(<ArbreInteractif {...proprietes} />);
    await user.click(screen.getByRole("button", { name: ACTION_COMPRENDRE_EVOLUTION }));
    const dialogue = screen.getByRole("dialog");
    await user.selectOptions(within(dialogue).getByRole("combobox", { name: "Choisir une étape" }), "31");
    await user.keyboard("{Escape}");
    const branche = screen.getByRole("button", { name: "Branche : Ce qui revient" });
    expect(screen.getAllByRole("button", { name: /^Branche :/ })).toHaveLength(1);
    expect(JSON.stringify(projection)).toBe(avant);
    expect(proprietes.onOuvrirFiche).not.toHaveBeenCalled();
    expect(proprietes.onRenommer).not.toHaveBeenCalled();
    expect(requetes).not.toHaveBeenCalled();

    await user.click(branche);
    expect(proprietes.onOuvrirFiche).toHaveBeenCalledExactlyOnceWith("branche-1");
    await user.click(screen.getByRole("button", { name: /vue liste/i }));
    expect(screen.getByText("Ce qui revient")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Voir dans la conversation" }));
    expect(proprietes.onVoirDansConversation).toHaveBeenCalledExactlyOnceWith("extrait-1");
  });
});
