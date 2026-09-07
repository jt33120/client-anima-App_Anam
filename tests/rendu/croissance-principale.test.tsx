import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import ArbrePersonnel from "@/render/arbre/ArbrePersonnel";
import SceneDom from "@/render/scene-dom";
import { PLANCHES_METAMORPHOSE } from "@/render/arbre/metamorphose-planches";
import type { BrancheProjetee, ProjectionScene } from "@/lib/scene";
import { ACTION_SEUIL, ALT_AVATAR_SEUIL, TAGLINE_SEUIL, TITRE_SEUIL } from "@/lib/domain/copie-seuil";
import { GROUPES_MENU, LIBELLE_GLYPHE, TITRE_FEUILLE, LIBELLE_FERMER } from "@/lib/domain/menu-compte";
import { dimensionnerTout } from "./_outils";

const navigation = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => navigation }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  if (typeof localStorage !== "undefined") localStorage.clear();
});

const branche = (id: string, intensite = 0, etat: BrancheProjetee["etat"] = intensite > 0 ? "feuillaison" : "naissance"): BrancheProjetee =>
  ({ id, intensite, etat, nom: `Thème ${id}`, extraitSourceId: `extrait-${id}`, dateNaissance: "2026-09-07T09:00:00Z" });
const projection = (branches: readonly BrancheProjetee[]): ProjectionScene => ({ tronc: { present: true }, branches });
const gestes = {
  camera: { pan: { x: 0, y: 0 }, zoom: 1 }, brancheSelectionnee: null,
  onCadrer: vi.fn(), onOuvrirFiche: vi.fn(), onFermerFiche: vi.fn(),
  onVoirDansConversation: vi.fn(), onRenommer: vi.fn(async () => true),
};
const scene = {
  jourAccueil: { a: 2026, m: 9, j: 7 }, seuilDejaFranchi: true,
  menu: { groupes: GROUPES_MENU, libelleGlyphe: LIBELLE_GLYPHE, titreFeuille: TITRE_FEUILLE, libelleFermer: LIBELLE_FERMER },
  copieSeuil: { titre: TITRE_SEUIL, tagline: TAGLINE_SEUIL, action: ACTION_SEUIL, altAvatar: ALT_AVATAR_SEUIL },
};

function verifierDessin(container: HTMLElement, index: number) {
  const dessin = container.querySelector<HTMLElement>("[data-index-croissance]");
  expect(dessin?.dataset.indexCroissance).toBe(String(index));
  const image = dessin?.querySelector("img");
  expect(decodeURIComponent(image?.getAttribute("src") ?? "")).toContain(PLANCHES_METAMORPHOSE[index].src);
}

describe("croissance de l’arbre principal", () => {
  it("change réellement d’image quand les branches projetées avancent, tout en gardant leurs accès", async () => {
    dimensionnerTout(390, 620);
    const requetes = vi.fn();
    vi.stubGlobal("fetch", requetes);
    const user = userEvent.setup();
    const { container, rerender } = render(<ArbreInteractif {...gestes} projection={projection([])} />);
    verifierDessin(container, 0);
    const parcours = [
      { branches: [branche("a")], index: 1 },
      { branches: [branche("a", 0.2)], index: 3 },
      { branches: [branche("a", 1), branche("b", 1)], index: 22 },
      { branches: [branche("a", 1), branche("b", 1), branche("c")], index: 23 },
      { branches: [branche("a", 1), branche("b", 1), branche("c", 0, "rayonnement")], index: 24 },
    ];
    for (const etape of parcours) {
      rerender(<ArbreInteractif {...gestes} projection={projection(etape.branches)} />);
      verifierDessin(container, etape.index);
      const ids = [...container.querySelectorAll<HTMLElement>("[data-branche-arbre], [data-groupe-branches]")]
        .flatMap((cible) => (cible.dataset.brancheArbre ?? cible.dataset.groupeBranches ?? "").split(" "));
      expect(ids.sort()).toEqual(etape.branches.map(({ id }) => id).sort());
    }
    const groupeA = [...container.querySelectorAll<HTMLButtonElement>("[data-groupe-branches]")]
      .find((groupe) => groupe.dataset.groupeBranches?.split(" ").includes("a"));
    if (groupeA) await user.click(groupeA);
    await user.click(screen.getByRole("button", { name: "Branche : Thème a" }));
    expect(gestes.onOuvrirFiche).toHaveBeenCalledExactlyOnceWith("a");
    await user.click(screen.getByRole("button", { name: /vue liste/i }));
    expect(screen.getByText("Thème a")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Voir dans la conversation" })[0]);
    expect(gestes.onVoirDansConversation).toHaveBeenCalledWith("extrait-a");
    expect(requetes).not.toHaveBeenCalled();
  });

  it("annonce une image indisponible puis réessaie le dessin personnel courant", async () => {
    render(<ArbrePersonnel index={3} troncEnReserve={false} ariaLabel="Mon arbre." />);
    const image = () => screen.getByAltText(`Mon arbre. ${PLANCHES_METAMORPHOSE[3].alt}`);
    fireEvent.error(image());
    expect(screen.getByText("L’image de ton arbre n’a pas pu être chargée.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer l’image" }));
    expect(screen.queryByText("L’image de ton arbre n’a pas pu être chargée.")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("group", { name: "Ton arbre" }));
    fireEvent.load(image());
    await waitFor(() => expect(screen.queryByText("Chargement de ton arbre…")).toBeNull());
  });

  it("prolonge le même arbre avec les trois lumières célestes tout en conservant les accès aux branches", () => {
    dimensionnerTout(390, 620);
    const rayonnantes = (nombre: number) => Array.from({ length: nombre }, (_, i) => branche(`lumiere-${i}`, 1, "rayonnement"));
    const { container, rerender } = render(<ArbreInteractif {...gestes} projection={projection(rayonnantes(8))} />);
    verifierDessin(container, 31);

    for (const nombre of [9, 10, 11, 12]) {
      const branches = rayonnantes(nombre);
      rerender(<ArbreInteractif {...gestes} projection={projection(branches)} />);
      verifierDessin(container, 23 + Math.min(nombre, 11));
      const ids = [...container.querySelectorAll<HTMLElement>("[data-branche-arbre], [data-groupe-branches]")]
        .flatMap((cible) => (cible.dataset.brancheArbre ?? cible.dataset.groupeBranches ?? "").split(" "));
      expect(ids.sort()).toEqual(branches.map(({ id }) => id).sort());
    }
  });

  it("désambiguïse deux naissances proches et garde la fiche et le retour au groupe accessibles", async () => {
    dimensionnerTout(390, 620);
    const user = userEvent.setup();
    const donnees = projection([branche("a"), branche("b")]);
    const { rerender } = render(<ArbreInteractif {...gestes} projection={donnees} />);
    const groupe = screen.getByRole("button", { name: "Voir les 2 branches proches" });
    await user.click(groupe);
    const panneau = screen.getByRole("group", { name: "Branches proches" });
    const choix = within(panneau).getByRole("button", { name: "Branche : Thème b" });
    await user.click(choix);
    expect(gestes.onOuvrirFiche).toHaveBeenCalledExactlyOnceWith("b");
    rerender(<ArbreInteractif {...gestes} projection={donnees} brancheSelectionnee="b" />);
    expect(screen.getByRole("button", { name: "Voir dans la conversation" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(gestes.onFermerFiche).toHaveBeenCalledOnce();
    rerender(<ArbreInteractif {...gestes} projection={donnees} />);
    await waitFor(() => expect(document.activeElement).toBe(choix));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("group", { name: "Branches proches" })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(groupe));
  });

  it("déplace l’arbre depuis un groupe sans ouvrir son panneau au relâchement", () => {
    dimensionnerTout(390, 620);
    render(<ArbreInteractif {...gestes} projection={projection([branche("a"), branche("b")])} />);
    const groupe = screen.getByRole("button", { name: "Voir les 2 branches proches" });
    fireEvent.pointerDown(groupe, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(groupe, { pointerId: 1, clientX: 115, clientY: 100 });
    fireEvent.pointerUp(groupe, { pointerId: 1, clientX: 115, clientY: 100 });
    fireEvent.click(groupe, { detail: 1 });
    expect(gestes.onCadrer).toHaveBeenCalled();
    expect(screen.queryByRole("group", { name: "Branches proches" })).toBeNull();
    fireEvent.click(groupe, { detail: 0 });
    expect(screen.getByRole("group", { name: "Branches proches" })).toBeTruthy();
  });

  it("rafraîchit les données à l’entrée dans Mon évolution et adopte la nouvelle projection serveur", async () => {
    dimensionnerTout(390, 620);
    const user = userEvent.setup();
    const { container, rerender } = render(<SceneDom {...scene} projection={projection([branche("a")])} />);
    const regions = within(screen.getByRole("navigation", { name: "Régions" }));
    expect(navigation.refresh).not.toHaveBeenCalled();
    await user.click(regions.getByRole("button", { name: "Mon évolution" }));
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
    verifierDessin(container, 1);

    rerender(<SceneDom {...scene} projection={projection([branche("a", 0.2)])} />);
    verifierDessin(container, 3);
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
    await user.click(regions.getByRole("button", { name: "Mon évolution" }));
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
    await user.click(regions.getByRole("button", { name: "Anam" }));
    await user.click(regions.getByRole("button", { name: "Mon évolution" }));
    expect(navigation.refresh).toHaveBeenCalledTimes(2);
  });
});
