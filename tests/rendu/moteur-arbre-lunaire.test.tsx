import { afterEach, describe, expect, it, vi } from "vitest";
import type { BrancheProjetee } from "@/lib/scene/projection";
import {
  CANEVAS,
  construireGeometrieLunaire,
} from "@/render/arbre/geometrie";
import { MoteurArbreLunaire } from "@/render/arbre/MoteurArbreLunaire";

interface GradientTrace {
  readonly arguments: readonly number[];
  readonly stops: [number, string][];
}

interface TraceCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly appels: Record<string, number>;
  readonly arcs: number[][];
  readonly ellipses: number[][];
  readonly moveTo: [number, number][];
  readonly lineTo: [number, number][];
  readonly lineWidths: number[];
  readonly drawSources: CanvasImageSource[];
  readonly gradientsLineaires: GradientTrace[];
  readonly gradientsRadiaux: GradientTrace[];
}

function installerContexte(): {
  readonly ordre: readonly TraceCanvas[];
  readonly traceDe: (canvas: HTMLCanvasElement) => TraceCanvas;
} {
  const parCanvas = new Map<HTMLCanvasElement, TraceCanvas>();
  const ordre: TraceCanvas[] = [];

  const traceDe = (canvas: HTMLCanvasElement): TraceCanvas => {
    const trace = parCanvas.get(canvas);
    if (!trace) throw new Error("Canvas non initialisé dans l'instrumentation");
    return trace;
  };

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    const deja = parCanvas.get(this);
    if (deja) return deja as unknown as CanvasRenderingContext2D;

    const trace: TraceCanvas = {
      canvas: this,
      appels: {},
      arcs: [],
      ellipses: [],
      moveTo: [],
      lineTo: [],
      lineWidths: [],
      drawSources: [],
      gradientsLineaires: [],
      gradientsRadiaux: [],
    };
    parCanvas.set(this, trace);
    ordre.push(trace);

    const compter = (nom: string) => {
      trace.appels[nom] = (trace.appels[nom] ?? 0) + 1;
    };
    const gradient = (destination: GradientTrace[], args: number[]) => {
      const resultat: GradientTrace = { arguments: args, stops: [] };
      destination.push(resultat);
      return {
        addColorStop: (position: number, couleur: string) => {
          compter("addColorStop");
          resultat.stops.push([position, couleur]);
        },
      };
    };
    const contexte = {
      arc: (...args: number[]) => {
        compter("arc");
        trace.arcs.push(args);
      },
      beginPath: () => compter("beginPath"),
      clearRect: () => compter("clearRect"),
      closePath: () => compter("closePath"),
      createLinearGradient: (...args: number[]) => gradient(trace.gradientsLineaires, args),
      createRadialGradient: (...args: number[]) => gradient(trace.gradientsRadiaux, args),
      drawImage: (source: CanvasImageSource) => {
        compter("drawImage");
        trace.drawSources.push(source);
      },
      ellipse: (...args: number[]) => {
        compter("ellipse");
        trace.ellipses.push(args);
      },
      fill: () => compter("fill"),
      lineTo: (x: number, y: number) => {
        compter("lineTo");
        trace.lineTo.push([x, y]);
      },
      moveTo: (x: number, y: number) => {
        compter("moveTo");
        trace.moveTo.push([x, y]);
      },
      quadraticCurveTo: () => compter("quadraticCurveTo"),
      restore: () => compter("restore"),
      rotate: () => compter("rotate"),
      save: () => compter("save"),
      scale: () => compter("scale"),
      stroke: () => compter("stroke"),
      translate: () => compter("translate"),
    } as unknown as CanvasRenderingContext2D;
    Object.defineProperty(contexte, "lineWidth", {
      configurable: true,
      get: () => trace.lineWidths.at(-1) ?? 1,
      set: (valeur: number) => trace.lineWidths.push(valeur),
    });
    return contexte;
  });

  return { ordre, traceDe };
}

const branches = (nombre: number): BrancheProjetee[] =>
  Array.from({ length: nombre }, (_, rang) => ({
    id: `branche-${rang}`,
    extraitSourceId: `source-${rang}`,
    nom: `Branche ${rang}`,
    etat:
      rang % 3 === 0 ? "naissance" : rang % 3 === 1 ? "feuillaison" : "rayonnement",
    intensite: (rang % 10) / 10,
  }));

const brancheFeuillaison = (intensite: number): BrancheProjetee => ({
  id: "branche-0",
  extraitSourceId: "source-0",
  nom: "Branche 0",
  etat: "feuillaison",
  intensite,
});

afterEach(() => vi.restoreAllMocks());

describe("moteur Canvas lunaire — exécution réelle des chemins de peinture", () => {
  it("l'étape 0 compose quatre couches transparentes mais ne peint que la graine", () => {
    const instrumentation = installerContexte();
    const canvas = document.createElement("canvas");
    const moteur = new MoteurArbreLunaire(canvas);

    moteur.mettreAJour(construireGeometrieLunaire([]), false);

    const [principal, base, bois, feuilles, lueur] = instrumentation.ordre;
    expect(base.ellipses).toContainEqual([
      CANEVAS.largeur / 2,
      1367,
      24,
      31,
      -0.18,
      0,
      Math.PI * 2,
    ]);
    expect(base.arcs, "l'ombre de contact ferait déjà apparaître l'ancien arbre").toEqual([]);
    expect(base.lineTo, "la charpente ne doit pas apparaître à l'étape graine").toEqual([]);
    expect(bois.lineTo).toEqual([]);
    expect(feuilles.drawSources).toEqual([]);
    expect(lueur.arcs).toEqual([]);
    expect(principal.drawSources).toEqual([
      base.canvas,
      bois.canvas,
      feuilles.canvas,
      lueur.canvas,
    ]);
    expect(canvas.width).toBe(Math.ceil(CANEVAS.largeur * 0.7));
    expect(canvas.height).toBe(Math.ceil(CANEVAS.hauteur * 0.7));
  });

  it("peint les 60 branches dans les quatre couches, avec joints et lumière du handoff", () => {
    const instrumentation = installerContexte();
    const canvas = document.createElement("canvas");
    const moteur = new MoteurArbreLunaire(canvas);

    moteur.mettreAJour(construireGeometrieLunaire(branches(60)), false);

    const [principal, base, bois, feuilles, lueur] = instrumentation.ordre;
    expect(bois.lineTo.length, "le bois lunaire n'a pas été peint").toBeGreaterThan(0);
    expect(feuilles.drawSources.length, "aucune feuille n'a été cuite").toBeGreaterThan(0);
    expect(lueur.arcs.length, "le rayonnement n'a pas été peint").toBeGreaterThan(0);
    expect(
      base.gradientsRadiaux.some((gradient) =>
        gradient.stops.some(([, couleur]) => couleur === "rgba(10,9,26,0.22)"),
      ),
      "la contre-ombre des joints du handoff a disparu",
    ).toBe(true);
    expect(principal.drawSources.slice(-4)).toEqual([
      base.canvas,
      bois.canvas,
      feuilles.canvas,
      lueur.canvas,
    ]);
  });

  it("un changement de réserve ne recuit ni bois, ni feuilles, ni lueurs", () => {
    const instrumentation = installerContexte();
    const canvas = document.createElement("canvas");
    const moteur = new MoteurArbreLunaire(canvas);
    const geometrie = construireGeometrieLunaire(branches(60));

    moteur.mettreAJour(geometrie, false);
    const [principal, base, bois, feuilles, lueur] = instrumentation.ordre;
    const avant = {
      principal: principal.appels.clearRect,
      base: base.appels.clearRect,
      bois: bois.appels.clearRect,
      feuilles: feuilles.appels.clearRect,
      lueur: lueur.appels.clearRect,
      gradientsBase: base.gradientsLineaires.length,
    };

    moteur.mettreAJour(geometrie, true);

    expect(base.appels.clearRect).toBe(avant.base + 1);
    expect(bois.appels.clearRect).toBe(avant.bois);
    expect(feuilles.appels.clearRect).toBe(avant.feuilles);
    expect(lueur.appels.clearRect).toBe(avant.lueur);
    expect(principal.appels.clearRect).toBe(avant.principal + 1);
    const gradientsReserve = base.gradientsLineaires.length - avant.gradientsBase;
    expect(
      gradientsReserve,
      "la réserve doit réellement alléger la matière du tronc et des racines",
    ).toBeLessThan(avant.gradientsBase);

    moteur.mettreAJour(geometrie, true);
    expect(principal.appels.clearRect, "un état identique a été recomposé").toBe(
      avant.principal + 1,
    );
  });

  it("la première forme pleine rejoint le trait de naissance sans saut d'épaisseur", () => {
    const instrumentationNue = installerContexte();
    const canvasNu = document.createElement("canvas");
    new MoteurArbreLunaire(canvasNu).mettreAJour(
      construireGeometrieLunaire([brancheFeuillaison(0.001)]),
      false,
    );
    const boisNu = instrumentationNue.ordre[2];
    expect(boisNu.lineWidths).toContain(2);

    vi.restoreAllMocks();
    const instrumentationPleine = installerContexte();
    const canvasPlein = document.createElement("canvas");
    const geometrie = construireGeometrieLunaire([brancheFeuillaison(0.001001)]);
    new MoteurArbreLunaire(canvasPlein).mettreAJour(geometrie, false);
    const boisPlein = instrumentationPleine.ordre[2];
    const base = geometrie.branches[0].principale.pts[0];
    const premierBord = boisPlein.moveTo[0];
    const demiLargeur = Math.hypot(premierBord[0] - base.x, premierBord[1] - base.y);

    expect(demiLargeur, "le bois plein a sauté loin du trait de 2 unités").toBeCloseTo(1, 3);
  });
});
