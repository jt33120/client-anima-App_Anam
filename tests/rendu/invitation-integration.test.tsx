import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Conversation from "@/render/conversation/Conversation";
import { PHRASE_INVITATION } from "@/lib/domain/arbitrage-ouverture";
import { ACTION_ALLER_VERS_BRANCHE } from "@/render/conversation/copie-proposition";
import { actionAvecOuverture } from "./_ouverture";

vi.mock("@/render/conversation/useFluxAnam", () => ({
  useFluxAnam: () => ({ prepare: false, enCours: false, envoyer: vi.fn() }),
}));

afterEach(() => vi.unstubAllGlobals());

const INVITATION = {
  type: "invitation" as const,
  phrase: PHRASE_INVITATION,
  brancheCibleId: "b-la-plus-ancienne",
};
const PROPOSITION = {
  type: "proposition" as const,
  signalId: "sig-1",
  phrase: "Il s'est passé quelque chose hier.",
};

describe("[AC5 DUR] rien de chiffré n'atteint l'écran", () => {
  it("[LE CŒUR] aucun chiffre ni quantificateur de branches dans le fil", async () => {
    const { container } = render(
      <Conversation onReclamerOuvertureQuotidienne={actionAvecOuverture(INVITATION)} />,
    );
    await screen.findAllByText(PHRASE_INVITATION);
    const texte = (container.textContent ?? "").toLowerCase();
    expect(texte).not.toMatch(/\d/);
    for (const mot of ["plusieurs", "trois", "branches", "en cours", "ouvertes"]) {
      expect(texte, `« ${mot} » compte, même sans chiffre`).not.toContain(mot);
    }
  });
});

describe("[AC4] en conversation, jamais en bandeau — et elle mène quelque part", () => {
  it("l'invitation est un TOUR DU FIL", async () => {
    render(<Conversation onReclamerOuvertureQuotidienne={actionAvecOuverture(INVITATION)} />);
    const bloc = await screen.findByRole("article", { name: /branche attend/i });
    expect(bloc.textContent).toContain(PHRASE_INVITATION);
  });

  it("[LE CŒUR] le geste emmène vers LA branche visée, pas vers une liste", async () => {
    const onAller = vi.fn();
    render(
      <Conversation
        onReclamerOuvertureQuotidienne={actionAvecOuverture(INVITATION)}
        onAllerVersBranche={onAller}
      />,
    );
    await userEvent.click(await screen.findByRole("button", { name: ACTION_ALLER_VERS_BRANCHE }));
    expect(onAller).toHaveBeenCalledWith("b-la-plus-ancienne");
    expect(onAller).toHaveBeenCalledTimes(1);
  });

  it("aucun bouton pour la refuser", async () => {
    render(
      <Conversation
        onReclamerOuvertureQuotidienne={actionAvecOuverture(INVITATION)}
        onAllerVersBranche={vi.fn()}
      />,
    );
    const bloc = await screen.findByRole("article", { name: /branche attend/i });
    const boutons = within(bloc).getAllByRole("button");
    expect(boutons).toHaveLength(1);
    expect(boutons[0].textContent).toBe(ACTION_ALLER_VERS_BRANCHE);
  });
});

describe("[REVUE 4.10] le vrai chemin réactif suit le geste serveur", () => {
  it("une proposition garde Oui/Non et son champ de nommage", async () => {
    render(<Conversation onReclamerOuvertureQuotidienne={actionAvecOuverture(PROPOSITION)} />);
    expect(await screen.findAllByText(PROPOSITION.phrase)).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "Oui" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Non" })).toBeTruthy();
  });

  it("[LE CŒUR] après une naissance confirmée, réévalue puis affiche l'invitation", async () => {
    const onBrancheCreee = vi.fn();
    const chargerCourante = vi.fn(async () => ({
      statut: "disponible" as const,
      ouverture: INVITATION,
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    render(
      <Conversation
        onReclamerOuvertureQuotidienne={actionAvecOuverture(PROPOSITION)}
        onChargerOuvertureCourante={chargerCourante}
        onBrancheCreee={onBrancheCreee}
      />,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Oui" }));
    await userEvent.type(screen.getByLabelText("Comment tu l’appelles ?"), "Un nouvel élan");
    await userEvent.click(screen.getByRole("button", { name: "Nommer" }));

    await waitFor(() => expect(onBrancheCreee).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(chargerCourante).toHaveBeenCalledTimes(1));
    expect(await screen.findAllByText(PHRASE_INVITATION)).not.toHaveLength(0);
  });

  it("sans action d'ouverture, le fil reste vide", () => {
    const { container } = render(<Conversation />);
    expect(container.querySelectorAll("article")).toHaveLength(0);
  });
});
