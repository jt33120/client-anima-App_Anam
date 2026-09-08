import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Parcours from "@/render/parcours/Parcours";
import ParcoursIndisponible from "@/render/parcours/ParcoursIndisponible";
import type { SuiviParcoursVue } from "@/render/parcours/types";

const SUIVI: SuiviParcoursVue = {
  revision: 2, pause: false, cap: "Retrouver de la place pour moi", synthese: "Prendre le temps de voir ce qui me ressource.",
  reperes: { ceQuiCompte: "Garder du temps pour lire", ceQuiAide: "Marcher dehors", aRespecter: "Des petits pas" },
  etapes: [{ id: "etape-1", titre: "Observer ce qui me fait du bien", pratiqueId: "pause-attention" }],
  niveauArbre: 1, majLe: "2026-09-08T12:00:00Z",
  evenements: [{ id: "evenement-1", type: "avancer", resume: "Tu as identifié une ressource qui t’aide.", titreEtape: "Nommer une ressource", niveauArbre: 1, creeLe: "2026-09-08T12:00:00Z" }],
};
const PRATIQUES = [{ id: "pause-attention", titre: "Une pause d’attention", href: "/pratiques/pause-attention" }];
const disponible = (suivi: SuiviParcoursVue) => new Response(JSON.stringify({ statut: "disponible", suivi }), { status: 200 });

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("le parcours lisible", () => {
  it("sépare absence et lecture indisponible, sans inventer de cap", () => {
    const { unmount } = render(<Parcours compteAttendu="compte-test" initial={null} pratiques={PRATIQUES} />);
    expect(screen.getByRole("link", { name: "Poser un premier cap avec Anam" }).getAttribute("href")).toBe("/?parcours=commencer");
    expect(screen.queryByText(SUIVI.cap)).toBeNull();
    unmount();
    render(<ParcoursIndisponible />);
    expect(screen.getByRole("heading", { name: "Ton parcours n’a pas pu s’ouvrir" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Poser un premier cap avec Anam" })).toBeNull();
  });

  it("relie les vrais prochains pas aux pratiques et l’historique à l’arbre", () => {
    render(<Parcours compteAttendu="compte-test" initial={SUIVI} pratiques={PRATIQUES} />);
    expect(screen.getByRole("heading", { name: SUIVI.cap })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ouvrir : Une pause d’attention" }).getAttribute("href")).toBe(PRATIQUES[0].href);
    expect(screen.getByRole("link", { name: "Voir mon arbre" }).getAttribute("href")).toBe("/?de=arbre");
    expect(screen.getByText("8 septembre 2026")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ajuster avec Anam" }).getAttribute("href")).toBe("/?parcours=ajuster");
    expect(screen.getByRole("link", { name: "Faire le point avec Anam" }).getAttribute("href")).toBe("/?parcours=faire_point");
  });

  it("une pratique inconnue n’acquiert pas de lien et le texte n’acquiert pas de HTML", () => {
    render(<Parcours compteAttendu="compte-test" initial={{ ...SUIVI, etapes: [{ id: "x", titre: "<script>aucun code</script>", pratiqueId: "https://externe.invalid" }] }} pratiques={PRATIQUES} />);
    expect(screen.getByText("<script>aucun code</script>")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /^Ouvrir/ })).toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });
});

describe("les repères et la pause restent sous la main de l’utilisatrice", () => {
  it("enregistre les trois repères avec la révision lue sans stockage navigateur", async () => {
    const fetchMock = vi.fn().mockResolvedValue(disponible({ ...SUIVI, revision: 3, reperes: { ...SUIVI.reperes, ceQuiCompte: "Mes mots nouveaux" } }));
    vi.stubGlobal("fetch", fetchMock);
    const stockage = vi.spyOn(Storage.prototype, "setItem");
    render(<Parcours compteAttendu="compte-test" initial={SUIVI} pratiques={PRATIQUES} />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier mes repères" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Ce qui compte pour moi" }), { target: { value: "Mes mots nouveaux" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer mes repères" }));
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: "reperes", revision: 2, reperes: { ...SUIVI.reperes, ceQuiCompte: "Mes mots nouveaux" } });
    expect(fetchMock.mock.calls[0][1].headers["X-Anam-Compte"]).toBe("compte-test");
    expect(screen.getByText("Mes mots nouveaux")).toBeTruthy();
    expect(stockage).not.toHaveBeenCalled();
  });

  it("compare les repères concurrents et exige un choix par différence avant d’enregistrer", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "conflit" }), { status: 409 }))
      .mockResolvedValueOnce(disponible({ ...SUIVI, revision: 3, cap: "Un cap ajusté ailleurs", reperes: { ...SUIVI.reperes, ceQuiAide: "Une ressource ajoutée ailleurs" } }))
      .mockResolvedValueOnce(disponible({ ...SUIVI, revision: 4, reperes: { ...SUIVI.reperes, ceQuiCompte: "Mon brouillon conservé", ceQuiAide: "Une ressource ajoutée ailleurs" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Parcours compteAttendu="compte-test" initial={SUIVI} pratiques={PRATIQUES} />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier mes repères" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Ce qui compte pour moi" }), { target: { value: "Mon brouillon conservé" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer mes repères" }));
    await screen.findByRole("alert");
    expect((screen.getByRole("button", { name: "Enregistrer mes repères" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Actualiser la version enregistrée" }));
    await screen.findByText("Un cap ajusté ailleurs");
    expect(fetchMock.mock.calls[1][1].headers["X-Anam-Compte"]).toBe("compte-test");
    expect((screen.getByRole("textbox", { name: "Ce qui compte pour moi" }) as HTMLTextAreaElement).value).toBe("Mon brouillon conservé");
    expect(screen.getByText("Une ressource ajoutée ailleurs")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Enregistrer mes repères" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Garder mon brouillon : Ce qui compte pour moi" }));
    expect((screen.getByRole("button", { name: "Enregistrer mes repères" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Reprendre la version enregistrée : Ce qui m’aide" }));
    expect((screen.getByRole("textbox", { name: "Ce qui m’aide" }) as HTMLTextAreaElement).value).toBe("Une ressource ajoutée ailleurs");
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer mes repères" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).revision).toBe(3);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).reperes).toEqual({ ...SUIVI.reperes, ceQuiCompte: "Mon brouillon conservé", ceQuiAide: "Une ressource ajoutée ailleurs" });
  });

  it("efface un repère seulement après enregistrement et conserve les autres", async () => {
    const fetchMock = vi.fn().mockResolvedValue(disponible({ ...SUIVI, revision: 3, reperes: { ...SUIVI.reperes, ceQuiAide: "" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Parcours compteAttendu="compte-test" initial={SUIVI} pratiques={PRATIQUES} />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier mes repères" }));
    fireEvent.click(screen.getByRole("button", { name: "Effacer ce repère : Ce qui m’aide" }));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer mes repères" }));
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).reperes).toEqual({ ...SUIVI.reperes, ceQuiAide: "" });
    expect(screen.queryByText("Marcher dehors")).toBeNull();
  });

  it("reçoit la pause du serveur et bloque les doubles soumissions", async () => {
    let terminer!: (response: Response) => void;
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(() => new Promise<Response>((resolve) => { terminer = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Parcours compteAttendu="compte-test" initial={SUIVI} pratiques={PRATIQUES} />);
    const bouton = screen.getByRole("button", { name: "Mettre mon parcours en pause" });
    fireEvent.click(bouton);
    fireEvent.click(bouton);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ action: "pause", revision: 2, pause: true });
    await act(async () => terminer(disponible({ ...SUIVI, revision: 3, pause: true })));
    expect(screen.getByText("En pause, à ta demande")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reprendre mon parcours" })).toBeTruthy();
  });

  it("garde les champs après une coupure réseau sans prétendre à une sauvegarde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    render(<Parcours compteAttendu="compte-test" initial={null} pratiques={PRATIQUES} />);
    fireEvent.click(screen.getByRole("button", { name: "Ajouter mes repères" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Ce qui m’aide" }), { target: { value: "Une ressource personnelle" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer mes repères" }));
    await screen.findByRole("alert");
    expect((screen.getByRole("textbox", { name: "Ce qui m’aide" }) as HTMLTextAreaElement).value).toBe("Une ressource personnelle");
    expect(screen.queryByText("Tes repères ont été enregistrés.")).toBeNull();
  });

  it("bloque tout nouvel envoi si le compte a changé sans transférer le brouillon", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "session_modifiee" }), { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Parcours compteAttendu="compte-test" initial={SUIVI} pratiques={PRATIQUES} />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier mes repères" }));
    const champ = screen.getByRole("textbox", { name: "Ce qui compte pour moi" });
    fireEvent.change(champ, { target: { value: "Les mots privés du premier compte" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer mes repères" }));
    await screen.findByRole("alert");
    expect((champ as HTMLTextAreaElement).value).toBe("Les mots privés du premier compte");
    expect((champ as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Recharger la page" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Actualiser la version enregistrée" })).toBeNull();
    fireEvent.submit(champ.closest("form")!);
    fireEvent.click(screen.getByRole("button", { name: "Mettre mon parcours en pause" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers["X-Anam-Compte"]).toBe("compte-test");
  });
});
