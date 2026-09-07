import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import { CADRE_ARBRE_PERSONNEL } from "@/render/arbre/ancres-arbre-personnel";
import type { BrancheProjetee, ProjectionScene } from "@/lib/scene";
import { dimensionnerTout, notifierRedimensionnement, abonnementsVivants } from "./_outils";

/**
 * Story 4.6 — LA MESURE DU PORTRAIT EFFECTIF, montée pour de vrai (jsdom).
 *
 * Pourquoi ce fichier existe : la RE-REVUE a trouvé que l'arbre était INVISIBLE dans le scénario
 * NOMINAL de la story (nouvelle utilisatrice → 0 branche → elle nomme la première), et qu'aucune
 * garde ne virait au rouge. La garde d'alors, `tests/arbre-rendu.test.ts`, n'assertait que la
 * PRÉSENCE des chaînes « ResizeObserver » et « width: boite.largeur » dans la source : elle prouvait
 * le CÂBLAGE, jamais l'EXÉCUTION. Le seul moyen de prouver qu'un arbre est visible est de le monter.
 *
 * L'invariant tenu ici : dès que le canevas est à l'écran, il est MESURÉ — quel que soit le chemin
 * par lequel il est arrivé (montage direct, apparition après la première branche, reprise de panne).
 */

const CONTENEUR = { largeur: 800, hauteur: 600 };
/** Le portrait personnel 1024×1536 prend toute la hauteur puis se centre dans la largeur disponible. */
const HAUTEUR_ATTENDUE = CONTENEUR.hauteur;
const LARGEUR_ATTENDUE = (CADRE_ARBRE_PERSONNEL.largeur / CADRE_ARBRE_PERSONNEL.hauteur) * HAUTEUR_ATTENDUE;
const GAUCHE_ATTENDUE = (CONTENEUR.largeur - LARGEUR_ATTENDUE) / 2;

const branche = (id: string): BrancheProjetee => ({
  id,
  etat: "naissance",
  intensite: 0,
  extraitSourceId: `extrait-${id}`,
  nom: `branche ${id}`,
});

const scene = (branches: readonly BrancheProjetee[], indisponible?: true): ProjectionScene =>
  indisponible ? { tronc: { present: true }, branches, indisponible } : { tronc: { present: true }, branches };

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

/** Le cadre personnel partage le monde mesuré avec les cibles, indépendamment de l’image. */
function monde(): HTMLElement {
  const parent = document.querySelector<HTMLElement>("[data-index-croissance]")?.parentElement;
  if (!parent) throw new Error("l’illustration de l’arbre n’a pas de monde mesuré");
  return parent;
}

describe("[HAUTE / re-revue] le canevas de l'arbre est MESURÉ dès qu'il est à l'écran", () => {
  it("TÉMOIN — monté directement avec une branche, le monde prend le portrait effectif", () => {
    dimensionnerTout(CONTENEUR.largeur, CONTENEUR.hauteur);
    render(<ArbreInteractif {...proprietes(scene([branche("a")]))} />);

    const m = monde();
    expect(m.style.width).toBe(`${LARGEUR_ATTENDUE}px`);
    expect(m.style.height).toBe(`${HAUTEUR_ATTENDUE}px`);
    expect(m.style.left).toBe(`${GAUCHE_ATTENDUE}px`);
  });

  it("SCÉNARIO NOMINAL — graine puis PREMIÈRE branche : le MÊME monde reste mesuré", () => {
    dimensionnerTout(CONTENEUR.largeur, CONTENEUR.hauteur);
    const { rerender } = render(<ArbreInteractif {...proprietes(scene([]))} />);
    const graine = document.querySelector("[data-index-croissance]")!;
    const mondeInitial = monde();
    expect(graine.getAttribute("data-etape-arbre")).toBe("graine");
    expect(monde().style.width).toBe("100%");

    // L’image change, mais le monde et les coordonnées des cibles restent mesurés.
    rerender(<ArbreInteractif {...proprietes(scene([branche("a")]))} />);

    const m = monde();
    expect(m).toBe(mondeInitial);
    expect(graine.getAttribute("data-etape-arbre")).toBe("branches");
    expect(m.style.width, "un monde de 0px = un arbre INVISIBLE au scénario nominal").toBe(`${LARGEUR_ATTENDUE}px`);
    expect(m.style.height).toBe(`${HAUTEUR_ATTENDUE}px`);
    expect(m.style.left).toBe(`${GAUCHE_ATTENDUE}px`);
  });

  it("REPRISE DE PANNE — `indisponible` puis lecture réussie : le canevas apparaît et DOIT être mesuré", () => {
    dimensionnerTout(CONTENEUR.largeur, CONTENEUR.hauteur);
    const { rerender } = render(<ArbreInteractif {...proprietes(scene([], true))} />);
    expect(document.querySelector("[data-index-croissance]")).toBeNull();

    rerender(<ArbreInteractif {...proprietes(scene([branche("a")]))} />);
    expect(monde().style.width).toBe(`${LARGEUR_ATTENDUE}px`);
  });

  it("le monde SUIT le redimensionnement de la fenêtre (l'abonnement n'est pas décoratif)", () => {
    dimensionnerTout(CONTENEUR.largeur, CONTENEUR.hauteur);
    render(<ArbreInteractif {...proprietes(scene([branche("a")]))} />);
    expect(monde().style.width).toBe(`${LARGEUR_ATTENDUE}px`);

    // La fenêtre rétrécit (rotation, clavier virtuel, fenêtre redimensionnée). La notification vient
    // du navigateur, hors du cycle de React : `act` force la purge de la mise à jour qu'elle déclenche.
    dimensionnerTout(400, 300);
    act(() => notifierRedimensionnement());
    expect(monde().style.width, "le composant doit RÉAGIR à la notification, pas seulement s'y abonner").toBe(
      `${(CADRE_ARBRE_PERSONNEL.largeur / CADRE_ARBRE_PERSONNEL.hauteur) * 300}px`,
    );
  });

  it("l'abonnement au redimensionnement est LIBÉRÉ au démontage (aucune fuite d'écouteur)", () => {
    dimensionnerTout(CONTENEUR.largeur, CONTENEUR.hauteur);
    const { unmount } = render(<ArbreInteractif {...proprietes(scene([branche("a")]))} />);
    expect(abonnementsVivants()).toBeGreaterThan(0);
    unmount();
    expect(abonnementsVivants()).toBe(0);
  });
});
