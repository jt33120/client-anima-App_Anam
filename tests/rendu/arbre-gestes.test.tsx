import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import {
  ACTION_RENOMMER,
  ACTION_CENTRER,
  CHAMP_RENOMMER_LABEL,
  VIDE_TITRE,
  BASCULE_LISTE,
} from "@/render/arbre/copie-arbre";
import type { BrancheProjetee, ProjectionScene } from "@/lib/scene";
import { dimensionnerTout } from "./_outils";

/**
 * Story 4.6 — LES GESTES sur le canevas, montés pour de vrai. Quatre défauts de la RE-REVUE, tous
 * indétectables en lisant la source :
 *  • réduire les zones denses empêchait leur chevauchement, mais violait le plancher tactile de 44 px :
 *    le zoom, le clavier et la vue liste portent désormais la désambiguïsation sans réduire la cible ;
 *  • le canevas étant l'ANCÊTRE de la fiche, les flèches et les glissers émis DANS le champ de renommage
 *    remontaient au canevas et déplaçaient l'arbre au lieu du curseur ;
 *  • sans capture de pointeur, un bouton relâché hors du canevas laissait l'arbre suivre le curseur ;
 *  • le recadrage au double-clic ne pouvait JAMAIS se déclencher (la couche de fiche captait le 2e appui).
 */

const branche = (i: number): BrancheProjetee => ({
  id: `b${i}`,
  etat: "naissance",
  intensite: 0,
  extraitSourceId: `extrait-${i}`,
  nom: `branche ${i}`,
  dateNaissance: "2026-03-11T10:00:00.000Z",
});

const scene = (n: number): ProjectionScene => ({
  tronc: { present: true },
  branches: Array.from({ length: n }, (_, i) => branche(i)),
});

function monter(
  n: number,
  extra: Partial<Record<string, unknown>> = {},
  viewport = { largeur: 800, hauteur: 600 },
) {
  dimensionnerTout(viewport.largeur, viewport.hauteur);
  const props = {
    projection: scene(n),
    camera: { pan: { x: 0, y: 0 }, zoom: 1 },
    brancheSelectionnee: null as string | null,
    onCadrer: vi.fn(),
    onOuvrirFiche: vi.fn(),
    onFermerFiche: vi.fn(),
    onVoirDansConversation: vi.fn(),
    onRenommer: vi.fn(async () => true),
    ...extra,
  };
  const vue = render(<ArbreInteractif {...props} />);
  return { ...vue, props };
}

/** Les accroches et leur taille déclarée à l'écran (px). */
function accroches() {
  return screen.getAllByRole("button", { name: /^Branche : / }).map((b) => {
    const el = b as HTMLElement;
    return {
      el,
      taille: parseFloat(el.style.width) || 44,
    };
  });
}

describe("[WCAG / revue] chaque branche garde une cible tactile de 44 px", () => {
  const viewports = [
    { largeur: 390, hauteur: 844 },
    { largeur: 768, hauteur: 1024 },
    { largeur: 1440, hauteur: 900 },
  ];
  for (const viewport of viewports) {
    for (const n of [1, 13, 60]) {
      it(`${n} branches à ${viewport.largeur}px restent toutes à 44×44 px`, () => {
        monter(n, {}, viewport);
        const cibles = accroches();
        expect(cibles).toHaveLength(n);
        for (const cible of cibles) {
          expect(cible.taille).toBe(44);
          expect(parseFloat(cible.el.style.height)).toBe(44);
        }
      });
    }
  }

  it("le contre-zoom conserve 44 px écran tout en séparant les ancres", () => {
    monter(60, { camera: { pan: { x: 0, y: 0 }, zoom: 3 } });
    for (const cible of accroches()) {
      expect(cible.taille).toBe(44);
      expect(cible.el.style.transform).toContain(`scale(${1 / 3})`);
    }
  });

  it("les 60 cibles restent activables au clavier malgré les recouvrements spatiaux", () => {
    const { props } = monter(60);
    for (const cible of accroches()) fireEvent.click(cible.el, { detail: 0 });
    expect(props.onOuvrirFiche).toHaveBeenCalledTimes(60);
    expect(new Set(props.onOuvrirFiche.mock.calls.map(([id]) => id))).toEqual(
      new Set(Array.from({ length: 60 }, (_, i) => `b${i}`)),
    );
  });

  it("la vue liste fournit 60 accès non spatiaux à pleine taille", async () => {
    const u = userEvent.setup();
    monter(60);
    await u.click(screen.getByRole("button", { name: BASCULE_LISTE }));
    expect(screen.getAllByRole("listitem")).toHaveLength(60);
  });
});

describe("[re-revue] un geste fait DANS la fiche n'est pas un geste sur l'arbre", () => {
  it("les flèches tapées dans le champ de renommage ne déplacent PAS l'arbre", async () => {
    const u = userEvent.setup();
    const { props } = monter(3, { brancheSelectionnee: "b0" });

    await u.click(screen.getByRole("button", { name: ACTION_RENOMMER }));
    const champ = await screen.findByLabelText(CHAMP_RENOMMER_LABEL);
    await u.type(champ, "un nom");
    props.onCadrer.mockClear();

    await u.keyboard("{ArrowLeft}{ArrowRight}{ArrowUp}{ArrowDown}");
    expect(props.onCadrer, "les flèches ont déplacé l'arbre au lieu du curseur").not.toHaveBeenCalled();
  });

  it("un glisser commencé DANS la fiche ne déplace pas l'arbre", async () => {
    const u = userEvent.setup();
    const { props } = monter(3, { brancheSelectionnee: "b0" });
    await u.click(screen.getByRole("button", { name: ACTION_RENOMMER }));
    const champ = await screen.findByLabelText(CHAMP_RENOMMER_LABEL);
    props.onCadrer.mockClear();

    fireEvent.pointerDown(champ, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(champ, { pointerId: 1, clientX: 200, clientY: 160 });
    expect(props.onCadrer, "sélectionner du texte a fait glisser l'arbre").not.toHaveBeenCalled();
  });
});

describe("[re-revue] le pointeur est CAPTURÉ : un relâchement hors cadre n'arme pas un pan fantôme", () => {
  it("après un pointerup, un mouvement de souris SANS bouton ne déplace plus l'arbre", () => {
    const { props, container } = monter(3);
    const canevas = container.querySelector("[role='group']") as HTMLElement;

    fireEvent.pointerDown(canevas, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canevas, { pointerId: 1, clientX: 200, clientY: 200 });
    expect(props.onCadrer, "le pan normal doit fonctionner").toHaveBeenCalled();

    fireEvent.pointerUp(canevas, { pointerId: 1, clientX: 200, clientY: 200 });
    props.onCadrer.mockClear();
    fireEvent.pointerMove(canevas, { pointerId: 1, clientX: 400, clientY: 400 });
    expect(props.onCadrer, "l'arbre suit le curseur sans bouton pressé").not.toHaveBeenCalled();
  });

  it("un glisser bloque son clic de relâchement, mais jamais le clic clavier qui suit", () => {
    const { props, container } = monter(1);
    const canevas = container.querySelector("[role='group']") as HTMLElement;
    const branche = screen.getByRole("button", { name: /^Branche : / });

    fireEvent.pointerDown(canevas, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canevas, { pointerId: 1, clientX: 180, clientY: 180 });
    fireEvent.pointerUp(canevas, { pointerId: 1, clientX: 180, clientY: 180 });
    fireEvent.click(branche, { detail: 1 });
    expect(props.onOuvrirFiche, "le clic terminal du glisser a ouvert une fiche").not.toHaveBeenCalled();

    fireEvent.click(branche, { detail: 0 });
    expect(props.onOuvrirFiche, "un glisser antérieur a condamné l'accès clavier").toHaveBeenCalledWith("b0");
  });

  it("un pincement qui commence à distance nulle ne produit jamais un zoom infini", () => {
    const { props, container } = monter(1);
    const canevas = container.querySelector("[role='group']") as HTMLElement;

    fireEvent.pointerDown(canevas, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(canevas, { pointerId: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canevas, { pointerId: 2, clientX: 140, clientY: 100 });

    for (const [camera] of props.onCadrer.mock.calls) {
      expect(Number.isFinite((camera as { zoom: number }).zoom)).toBe(true);
    }
  });
});

describe("[étape graine] la copie défile sans piloter le zoom derrière elle", () => {
  it("la molette dans la carte vide reste à la carte", () => {
    const { props } = monter(0);
    const texte = screen.getByText(VIDE_TITRE);
    const evenement = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 120 });

    texte.dispatchEvent(evenement);

    expect(evenement.defaultPrevented).toBe(false);
    expect(props.onCadrer).not.toHaveBeenCalled();
  });
});

describe("[re-revue] le recadrage d'une branche est ATTEIGNABLE", () => {
  it("la fiche porte une action de recadrage, qui ferme la fiche ET cadre", async () => {
    const u = userEvent.setup();
    const { props } = monter(3, { brancheSelectionnee: "b1" });

    await u.click(screen.getByRole("button", { name: ACTION_CENTRER }));
    expect(props.onFermerFiche).toHaveBeenCalled();
    await waitFor(() => expect(props.onCadrer).toHaveBeenCalled());
    const camera = props.onCadrer.mock.calls.at(-1)![0] as { zoom: number };
    expect(camera.zoom, "le recadrage doit rapprocher").toBeGreaterThan(1);
  });

  it("le double-clic MORT a bien disparu de l'accroche", () => {
    monter(3);
    // Un double-clic ne doit plus rien tenter : il ouvrait la fiche, puis son 2e appui était capté par la
    // couche de fiche. On vérifie qu'il n'appelle pas `onCadrer` (l'ancien comportement mort).
    const { props } = monter(3);
    fireEvent.dblClick(accroches()[0].el);
    expect(props.onCadrer).not.toHaveBeenCalled();
  });
});
