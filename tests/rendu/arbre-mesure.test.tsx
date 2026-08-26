import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import { ARIA_CANEVAS } from "@/render/arbre/copie-arbre";
import { CANEVAS } from "@/render/arbre/geometrie";
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
/** Le handoff 1408×2503 prend toute la hauteur puis se centre dans la largeur disponible. */
const HAUTEUR_ATTENDUE = CONTENEUR.hauteur;
const LARGEUR_ATTENDUE = (CANEVAS.largeur / CANEVAS.hauteur) * HAUTEUR_ATTENDUE;
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

/** Le `.monde` est le parent direct du Canvas : on le trouve par le rôle, jamais par un nom de classe
 *  (les classes de CSS Modules sont hachées à la compilation — s'y accrocher rendrait la garde fragile). */
function monde(): HTMLElement {
  const canvas = screen.getByRole("img", { name: ARIA_CANEVAS });
  const parent = canvas.parentElement;
  if (!parent) throw new Error("le Canvas de l'arbre n'a pas de parent `.monde`");
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

  it("SCÉNARIO NOMINAL — graine puis PREMIÈRE branche : le MÊME canevas reste mesuré", () => {
    dimensionnerTout(CONTENEUR.largeur, CONTENEUR.hauteur);
    const { rerender } = render(<ArbreInteractif {...proprietes(scene([]))} />);
    const graine = screen.getByRole("img", { name: ARIA_CANEVAS });
    expect(graine.getAttribute("data-etape-arbre")).toBe("graine");
    expect(monde().style.width).toBe(`${LARGEUR_ATTENDUE}px`);

    // La première branche ne remplace pas le ciel par un second dessin : le bitmap déjà monté est recuit.
    rerender(<ArbreInteractif {...proprietes(scene([branche("a")]))} />);

    const m = monde();
    expect(screen.getByRole("img", { name: ARIA_CANEVAS })).toBe(graine);
    expect(graine.getAttribute("data-etape-arbre")).toBe("branches");
    expect(m.style.width, "un monde de 0px = un arbre INVISIBLE au scénario nominal").toBe(`${LARGEUR_ATTENDUE}px`);
    expect(m.style.height).toBe(`${HAUTEUR_ATTENDUE}px`);
    expect(m.style.left).toBe(`${GAUCHE_ATTENDUE}px`);
  });

  it("REPRISE DE PANNE — `indisponible` puis lecture réussie : le canevas apparaît et DOIT être mesuré", () => {
    dimensionnerTout(CONTENEUR.largeur, CONTENEUR.hauteur);
    const { rerender } = render(<ArbreInteractif {...proprietes(scene([], true))} />);
    expect(screen.queryByRole("img", { name: ARIA_CANEVAS })).toBeNull();

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
      `${(CANEVAS.largeur / CANEVAS.hauteur) * 300}px`,
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
