import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Conversation, { fusionnerEntreeDuJour } from "@/render/conversation/Conversation";
import type {
  ResultatOuvertureDuJour,
  Tour,
  TourHistorique,
} from "@/render/conversation/types";

const fluxControle = vi.hoisted(() => ({
  prepare: false,
  enCours: false,
  envoyer: vi.fn(),
}));

vi.mock("@/render/conversation/useFluxAnam", () => ({
  useFluxAnam: () => fluxControle,
}));

beforeEach(() => {
  fluxControle.prepare = false;
  fluxControle.enCours = false;
  fluxControle.envoyer.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * fil-retrouve.test.tsx — LE FIL REMIS À L'ÉCRAN (QA tour 1, T3).
 *
 * `depot-fil.test.ts` prouve que la base rend les bons tours, dans le bon ordre. Ce fichier prouve
 * la chose complémentaire, et ce n'est pas la même : **qu'ils atteignent l'écran**. C'est très
 * exactement l'écart qui a produit le défaut — le journal était écrit depuis la 4.1, et personne ne
 * le remontait.
 */

const HISTORIQUE: readonly TourHistorique[] = [
  { id: "h1", role: "utilisatrice", texte: "je reprends là où on s'était arrêtées" },
  { id: "h2", role: "anam", texte: "j'ai lu jusqu'au bout" },
  { id: "h3", role: "utilisatrice", texte: "le long message qu'on écrit une fois" },
];

type OuvertureTerminee = Extract<
  ResultatOuvertureDuJour,
  { readonly statut: "ouverte" | "deja-commencee" }
>;

const ouverturePersistante = (
  tour: TourHistorique & { readonly role: "anam" },
): OuvertureTerminee => ({
  statut: "ouverte",
  jourParis: "2026-08-26",
  rearmementMs: 60_000,
  tours: [{ ...tour, separateurAvant: true }],
  ouverture: null,
});

describe("[QA T3] au montage, le fil déjà écrit est LÀ", () => {
  it("[LE CŒUR] les trois tours paraissent, dans l'ordre reçu", () => {
    // Mutation-cible : ne pas amorcer l'état avec l'historique. C'est l'état d'avant, et il laissait
    // toute la suite verte — le fil vivait entièrement dans l'état local du composant.
    render(<Conversation historique={HISTORIQUE} />);
    for (const t of HISTORIQUE) expect(screen.getByText(t.texte), t.texte).toBeTruthy();
  });

  it("l'ordre du DOM est l'ordre reçu — le rendu ne trie rien", () => {
    const { container } = render(<Conversation historique={HISTORIQUE} />);
    const texte = container.textContent ?? "";
    const positions = HISTORIQUE.map((t) => texte.indexOf(t.texte));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("place « Aujourd'hui » exactement avant le premier tour marqué par le serveur", () => {
    const avecRepere: readonly TourHistorique[] = [
      HISTORIQUE[0],
      { ...HISTORIQUE[1], separateurAvant: true },
      HISTORIQUE[2],
    ];
    const { container } = render(<Conversation historique={avecRepere} />);
    expect(screen.getAllByRole("separator", { name: "Aujourd’hui" })).toHaveLength(1);
    const texte = container.textContent ?? "";
    expect(texte.indexOf(HISTORIQUE[0].texte)).toBeLessThan(texte.indexOf("Aujourd’hui"));
    expect(texte.indexOf("Aujourd’hui")).toBeLessThan(texte.indexOf(HISTORIQUE[1].texte));
  });

  it("l’événement porte le bonjour dans UNE parole, seulement quand Anam est visible", async () => {
    const phrase = "Te voilà. On peut aussi laisser un peu d’espace aujourd’hui.";
    const reclamer = vi.fn(async (): Promise<ResultatOuvertureDuJour> => ({
      statut: "ouverte",
      jourParis: "2026-08-26",
      rearmementMs: 60_000,
      tours: [{ id: "bonjour-db", role: "anam", texte: phrase, separateurAvant: true }],
      ouverture: {
        tourId: "bonjour-db",
        donnees: { type: "pause", phrase },
      },
    }));
    const { rerender } = render(
      <Conversation
        historique={HISTORIQUE}
        regionActive={false}
        onReclamerOuvertureQuotidienne={reclamer}
      />,
    );
    expect(screen.queryByText(phrase)).toBeNull();
    expect(screen.queryByText(/laisser un peu d’espace/)).toBeNull();
    await act(async () => Promise.resolve());
    expect(reclamer).not.toHaveBeenCalled();
    rerender(
      <Conversation
        historique={HISTORIQUE}
        regionActive
        onReclamerOuvertureQuotidienne={reclamer}
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement).disabled,
      "le premier frame visible doit déjà bloquer l'envoi",
    ).toBe(true);
    await waitFor(() => expect(reclamer).toHaveBeenCalledTimes(1));
    await screen.findAllByText(phrase);
    expect(
      [...document.querySelectorAll("p.t-anam")].filter(
        (element) => element.textContent === phrase,
      ),
    ).toHaveLength(1);
    expect(screen.getAllByRole("separator", { name: "Aujourd’hui" })).toHaveLength(1);
  });

  it("ne réclame ni n'affiche l'ouverture quotidienne tant que la région Anam reste cachée", async () => {
    const reclamer = vi.fn(async (): Promise<ResultatOuvertureDuJour> =>
      ouverturePersistante({
        id: "ouverture-du-jour",
        role: "anam",
        texte: "Te voilà. Qu’est-ce qui t’occupe aujourd’hui ?",
      }),
    );
    render(
      <Conversation
        regionActive={false}
        onReclamerOuvertureQuotidienne={reclamer}
      />,
    );

    await act(async () => Promise.resolve());
    expect(reclamer).not.toHaveBeenCalled();
    expect(screen.queryByText(/Qu’est-ce qui t’occupe aujourd’hui/)).toBeNull();
  });

  it("en entrant chez Anam, attend la ligne persistée puis l'affiche sous Aujourd'hui", async () => {
    let rendre: ((resultat: ResultatOuvertureDuJour) => void) | undefined;
    const reclamer = vi.fn(
      () => new Promise<ResultatOuvertureDuJour>((resolve) => { rendre = resolve; }),
    );
    const { rerender } = render(
      <Conversation
        regionActive={false}
        onReclamerOuvertureQuotidienne={reclamer}
      />,
    );

    rerender(
      <Conversation
        regionActive
        onReclamerOuvertureQuotidienne={reclamer}
      />,
    );
    await waitFor(() => expect(reclamer).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("La ligne persistée.")).toBeNull();

    await act(async () => {
      rendre?.(
        ouverturePersistante({
          id: "ligne-db",
          role: "anam",
          texte: "La ligne persistée.",
        }),
      );
    });
    await waitFor(() =>
      expect(
        [...document.querySelectorAll("p.t-anam")].some(
          (element) => element.textContent === "La ligne persistée.",
        ),
      ).toBe(true),
    );
    expect(screen.getAllByRole("separator", { name: "Aujourd’hui" })).toHaveLength(1);
  });

  it("déduplique la ligne gagnante si un rafraîchissement l'avait déjà remise dans le fil", async () => {
    const tour: TourHistorique & { readonly role: "anam" } = {
      id: "meme-ligne",
      role: "anam",
      texte: "Une seule fois.",
      separateurAvant: true,
    };
    const reclamer = vi.fn(async () => ouverturePersistante(tour));
    const { container } = render(
      <Conversation
        historique={[tour]}
        regionActive
        onReclamerOuvertureQuotidienne={reclamer}
      />,
    );
    await waitFor(() => expect(reclamer).toHaveBeenCalledTimes(1));
    expect(
      [...container.querySelectorAll("p.t-anam")].filter(
        (element) => element.textContent === "Une seule fois.",
      ),
    ).toHaveLength(1);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("");
  });

  it("ne rend ni ne consomme la métadonnée d'une ouverture sortie de la fenêtre du fil", async () => {
    const annoncerSocle = vi.fn();
    const phraseFantome = "Ton socle est complet, mais cette ligne n'est plus dans la fenêtre.";
    const reclamer = vi.fn(async (): Promise<ResultatOuvertureDuJour> => ({
      statut: "deja-commencee",
      jourParis: "2026-08-26",
      rearmementMs: 60_000,
      tours: [
        {
          id: "tour-recent",
          role: "utilisatrice",
          texte: "Une parole plus récente.",
          separateurAvant: true,
        },
      ],
      ouverture: {
        tourId: "anam:ouverture-jour:2026-08-26",
        donnees: { type: "socle-complete", phrase: phraseFantome },
      },
    }));

    const { container } = render(
      <Conversation
        regionActive
        onReclamerOuvertureQuotidienne={reclamer}
        onSocleAnnonce={annoncerSocle}
      />,
    );

    await waitFor(() => expect(reclamer).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect((screen.getByRole("textbox", { name: "Ton message à Anam" }) as HTMLTextAreaElement).disabled).toBe(false),
    );
    expect(screen.queryByText(phraseFantome)).toBeNull();
    expect(annoncerSocle).not.toHaveBeenCalled();
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("");
  });

  it("remplace l'ouverture persistée à SA position et laisse le serveur gagner sur le texte et l'état", () => {
    const precedents: readonly Tour[] = [
      {
        id: "anam:ouverture-jour:2026-08-27",
        role: "anam",
        texte: "Ancienne forme locale.",
        etat: "flux",
        separateurAvant: true,
      },
      {
        id: "anam:tour-apres",
        role: "anam",
        texte: "Partiel local obsolète.",
        etat: "echec",
      },
    ];
    const serveur: readonly TourHistorique[] = [
      {
        id: "anam:ouverture-jour:2026-08-27",
        role: "anam",
        texte: "La parole persistée fait foi.",
        separateurAvant: true,
      },
      {
        id: "anam:tour-apres",
        role: "anam",
        texte: "La réponse complète du serveur.",
      },
    ];

    const fusion = fusionnerEntreeDuJour(precedents, serveur, {
      tourId: "anam:ouverture-jour:2026-08-27",
      donnees: {
        type: "invitation",
        phrase: "Une candidate ne doit pas écraser le journal.",
        brancheCibleId: "branche-1",
      },
    });

    expect(fusion.map((tour) => tour.id)).toEqual([
      "anam:ouverture-jour:2026-08-27",
      "anam:tour-apres",
    ]);
    expect(fusion[0]).toMatchObject({
      role: "invitation-integration",
      phrase: "La parole persistée fait foi.",
      separateurAvant: true,
    });
    expect(fusion[1]).toMatchObject({
      role: "anam",
      texte: "La réponse complète du serveur.",
      etat: "complet",
    });
    expect(fusion.filter((tour) => tour.separateurAvant)).toHaveLength(1);
  });

  it("insère les nouveaux tours serveur dans leur ordre sans perdre les intervalles locaux", () => {
    const precedents: readonly Tour[] = [
      { id: "ancien-a", role: "anam", texte: "A local", etat: "echec" },
      {
        id: "bilan-local",
        role: "bilan",
        ancreId: "ancien-a",
        titre: "Bloc local",
        points: ["Il reste auprès de son ancre."],
      },
      { id: "ancien-b", role: "utilisatrice", texte: "B local" },
      {
        id: "carte-locale",
        role: "carte",
        cle: "lune",
        description: "Une carte locale",
        separateurAvant: true,
      },
      { id: "post", role: "utilisatrice", texte: "Post local" },
    ];
    const serveur: readonly TourHistorique[] = [
      { id: "ancien-a", role: "anam", texte: "A serveur" },
      { id: "nouveau", role: "utilisatrice", texte: "Nouveau tour distant" },
      { id: "ancien-b", role: "utilisatrice", texte: "B serveur" },
      {
        id: "anam:ouverture-jour:2026-08-27",
        role: "anam",
        texte: "Ouverture du jour",
        separateurAvant: true,
      },
      { id: "post", role: "utilisatrice", texte: "Post serveur" },
    ];

    const fusion = fusionnerEntreeDuJour(precedents, serveur, {
      tourId: "anam:ouverture-jour:2026-08-27",
      donnees: { type: "pause", phrase: "Candidate locale" },
    });

    expect(fusion.map((tour) => tour.id)).toEqual([
      "ancien-a",
      "bilan-local",
      "nouveau",
      "ancien-b",
      "carte-locale",
      "anam:ouverture-jour:2026-08-27",
      "post",
    ]);
    expect(fusion.find((tour) => tour.id === "ancien-a")).toMatchObject({
      role: "anam",
      texte: "A serveur",
      etat: "complet",
    });
    expect(fusion.find((tour) => tour.id === "post")).toMatchObject({
      role: "utilisatrice",
      texte: "Post serveur",
    });
    expect(fusion.filter((tour) => tour.separateurAvant).map((tour) => tour.id)).toEqual([
      "anam:ouverture-jour:2026-08-27",
    ]);
  });

  it("au lendemain, rebase les tours stables et déplace le seul repère sans doublon", () => {
    const precedents: readonly Tour[] = [
      {
        id: "utilisatrice:11111111-1111-4111-8111-111111111111",
        role: "utilisatrice",
        texte: "Mon message local",
        separateurAvant: true,
      },
      {
        id: "anam:11111111-1111-4111-8111-111111111111",
        role: "anam",
        texte: "La réponse locale",
        etat: "complet",
      },
    ];
    const serveur: readonly TourHistorique[] = [
      {
        id: "utilisatrice:11111111-1111-4111-8111-111111111111",
        role: "utilisatrice",
        texte: "Mon message local",
      },
      {
        id: "anam:11111111-1111-4111-8111-111111111111",
        role: "anam",
        texte: "La réponse locale",
      },
      {
        id: "anam:ouverture-jour:2026-08-27",
        role: "anam",
        texte: "Te revoilà.",
        separateurAvant: true,
      },
    ];

    const fusion = fusionnerEntreeDuJour(precedents, serveur, null);
    expect(fusion.map((tour) => tour.id)).toEqual(serveur.map((tour) => tour.id));
    expect(fusion.filter((tour) => tour.separateurAvant)).toHaveLength(1);
    expect(fusion.find((tour) => tour.separateurAvant)?.id).toBe(
      "anam:ouverture-jour:2026-08-27",
    );
  });

  it("arme minuit pendant un flux mais diffère l'action quotidienne jusqu'à la fin du flux", async () => {
    vi.useFakeTimers();
    const reclamer = vi
      .fn<() => Promise<ResultatOuvertureDuJour>>()
      .mockResolvedValueOnce({
        ...ouverturePersistante({
          id: "ouverture-jour-1",
          role: "anam",
          texte: "Premier jour.",
        }),
        rearmementMs: 100,
      })
      .mockResolvedValueOnce(
        ouverturePersistante({
          id: "ouverture-jour-2",
          role: "anam",
          texte: "Deuxième jour.",
        }),
      );
    const vue = (regionActive = true) => (
      <Conversation
        regionActive={regionActive}
        onReclamerOuvertureQuotidienne={reclamer}
      />
    );
    const { rerender, unmount } = render(vue());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(reclamer).toHaveBeenCalledTimes(1);

    fluxControle.enCours = true;
    rerender(vue());
    await act(async () => { vi.advanceTimersByTime(100); });

    expect(reclamer).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement).disabled,
      "le jour est dû : le composeur reste bloqué pendant le flux existant",
    ).toBe(true);

    fluxControle.enCours = false;
    rerender(vue());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(reclamer).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText("Deuxième jour.")).not.toHaveLength(0);
    unmount();
  });

  it("oublie les clés d'événement au nouveau jour, sans rejouer deux fois dans le même jour", async () => {
    const invitation = {
      type: "invitation" as const,
      phrase: "Une branche attend encore un peu.",
      brancheCibleId: "branche-stable",
    };
    const proposition = {
      type: "proposition" as const,
      phrase: "Quelque chose pourrait prendre forme.",
      signalId: "signal-jour-2",
    };
    const reclamer = vi
      .fn<() => Promise<ResultatOuvertureDuJour>>()
      .mockResolvedValueOnce({
        statut: "ouverte",
        jourParis: "2026-08-26",
        rearmementMs: 10,
        tours: [
          {
            id: "anam:ouverture-jour:2026-08-26",
            role: "anam",
            texte: invitation.phrase,
            separateurAvant: true,
          },
        ],
        ouverture: {
          tourId: "anam:ouverture-jour:2026-08-26",
          donnees: invitation,
        },
      })
      .mockResolvedValueOnce({
        statut: "ouverte",
        jourParis: "2026-08-27",
        rearmementMs: 60_000,
        tours: [
          {
            id: "anam:ouverture-jour:2026-08-27",
            role: "anam",
            texte: proposition.phrase,
            separateurAvant: true,
          },
        ],
        ouverture: {
          tourId: "anam:ouverture-jour:2026-08-27",
          donnees: proposition,
        },
      });
    const chargerCourante = vi.fn(async () => ({
      statut: "disponible" as const,
      ouverture: invitation,
    }));
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));

    render(
      <Conversation
        regionActive
        onReclamerOuvertureQuotidienne={reclamer}
        onChargerOuvertureCourante={chargerCourante}
      />,
    );
    await waitFor(() => expect(reclamer).toHaveBeenCalledTimes(2));
    expect(screen.getAllByRole("article", { name: "Une branche attend" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Oui" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Comment tu l’appelles ?" }), {
      target: { value: "La suite" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Nommer" }));

    await waitFor(() => expect(chargerCourante).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getAllByRole("article", { name: "Une branche attend" })).toHaveLength(2),
    );
  });

  it("un incident garde l'envoi bloqué et offre un retry explicite, sans boucle automatique", async () => {
    const reclamer = vi
      .fn<() => Promise<ResultatOuvertureDuJour>>()
      .mockResolvedValueOnce({ statut: "incident-temporaire" })
      .mockResolvedValueOnce(
        ouverturePersistante({
          id: "reprise-db",
          role: "anam",
          texte: "L’ouverture a repris.",
        }),
      );
    render(
      <Conversation regionActive onReclamerOuvertureQuotidienne={reclamer} />,
    );
    await waitFor(() => expect(reclamer).toHaveBeenCalledTimes(1));
    const retry = await screen.findByRole("button", { name: "Réessayer" });
    expect((screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement).disabled).toBe(true);
    expect(reclamer).toHaveBeenCalledTimes(1);

    fireEvent.click(retry);
    await waitFor(() => expect(reclamer).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText("L’ouverture a repris.")).not.toHaveLength(0);
  });

  it("borne un bail occupé à trois appels espacés puis attend un nouveau geste", async () => {
    vi.useFakeTimers();
    const reclamer = vi.fn<() => Promise<ResultatOuvertureDuJour>>(async () => ({
      statut: "en-cours",
      reessayerApresMs: 5_000,
    }));
    render(<Conversation regionActive onReclamerOuvertureQuotidienne={reclamer} />);

    await act(async () => Promise.resolve());
    expect(reclamer).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(5_000));
    expect(reclamer).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(reclamer).toHaveBeenCalledTimes(3);
    expect(screen.getByText(/L’ouverture du jour prend plus de temps/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Ton message à Anam"), {
      target: { value: "Je peux continuer." },
    });
    expect((screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement).disabled).toBe(true);

    await act(async () => vi.advanceTimersByTimeAsync(60_000));
    expect(reclamer).toHaveBeenCalledTimes(3);
  });

  it("propose la reconnexion quand la session n'est plus valide", async () => {
    const reclamer = vi.fn<() => Promise<ResultatOuvertureDuJour>>(async () => ({
      statut: "session-expiree",
    }));
    render(<Conversation regionActive onReclamerOuvertureQuotidienne={reclamer} />);

    expect(await screen.findByText("Ta session a expiré.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Me reconnecter" }).getAttribute("href")).toBe("/entrer");
    expect(screen.queryByText(/Anam n’a pas pu ouvrir/)).toBeNull();
  });

  it("sortir puis revenir pendant une réclamation en vol ne lance pas un second appel", async () => {
    let rendre: ((resultat: ResultatOuvertureDuJour) => void) | undefined;
    const reclamer = vi.fn(
      () => new Promise<ResultatOuvertureDuJour>((resolve) => { rendre = resolve; }),
    );
    const { rerender } = render(
      <Conversation regionActive onReclamerOuvertureQuotidienne={reclamer} />,
    );
    await waitFor(() => expect(reclamer).toHaveBeenCalledTimes(1));

    rerender(<Conversation regionActive={false} onReclamerOuvertureQuotidienne={reclamer} />);
    rerender(<Conversation regionActive onReclamerOuvertureQuotidienne={reclamer} />);
    await act(async () => Promise.resolve());
    expect(reclamer).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("Ton message à Anam"), {
      target: { value: "Je suis là." },
    });
    expect((screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      rendre?.({
        statut: "deja-commencee",
        jourParis: "2026-08-26",
        rearmementMs: 60_000,
        tours: [],
        ouverture: null,
      });
    });
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(reclamer).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Anam prépare sa réponse.")).toBeNull();
  });

  it("sans historique, rien n'apparaît — et surtout aucune bulle vide", () => {
    // Le contrôle négatif : un composant qui rendrait un tour par défaut mettrait une bulle vide
    // dans le fil, ce qui se lit comme un message effacé — l'angoisse même qu'on répare.
    const { container } = render(<Conversation />);
    expect(container.querySelectorAll("li").length).toBe(0);
  });

  it("un tour d'Anam retrouvé n'affiche PAS d'état d'attente", () => {
    // ⚠️ Ils SONT complets : écrits, streamés, gravés. Les remettre en `flux` afficherait un curseur
    // qui n'attend rien — et une réponse qui semble en cours de rédaction depuis hier.
    const { container } = render(<Conversation historique={[HISTORIQUE[1]]} />);
    expect(container.querySelector("[aria-busy='true']")).toBeNull();
    expect((container.textContent ?? "").toLowerCase()).not.toContain("écrit");
  });

  it("[FR-034] aucun ÉVÉNEMENT de séance n'est rejoué avec le fil", () => {
    // Ni bilan, ni carte d'abonnement, ni ressources : ce sont des événements de SÉANCE, pas du
    // journal. Les rejouer ferait réapparaître une carte d'abonnement à chaque rechargement — la
    // relance exacte que FR-034 interdit.
    const { container } = render(<Conversation historique={HISTORIQUE} />);
    const texte = (container.textContent ?? "").toLowerCase();
    for (const interdit of ["abonn", "3114", "bilan", "sos amitié"]) {
      expect(texte, `« ${interdit} » n'a rien à faire dans un fil retrouvé`).not.toContain(interdit);
    }
  });
});
