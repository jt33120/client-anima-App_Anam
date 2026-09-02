// @vitest-environment jsdom
/**
 * remplissage-etoiles — gardes du module PUR « le seuil qui se remplit d'étoiles ».
 *
 * POURQUOI `@vitest-environment jsdom` EN TÊTE : `vitest.config.ts` route `tests/**\/*.test.ts` vers
 * le projet `node` (le projet `rendu` ne prend que les `.test.tsx`). Ce module n'a pas de composant
 * à monter — il lui faut seulement `document`, un `<canvas>` et `requestAnimationFrame`, que la
 * pragma fournit sans tirer Testing Library ni `_installation.ts`.
 *
 * POURQUOI UN DOUBLE DE CONTEXTE 2D ICI PLUTÔT QUE CELUI DU MOTEUR ARBRE : le sien est local à son
 * fichier et n'observe pas ce qui compte pour cette doctrine — l'opération de composition AU MOMENT
 * de chaque `drawImage`, les affectations à `shadowBlur`/`filter` (interdites), et un `getImageData`
 * synthétique pour dessiner une silhouette connue au pixel. Il est volontairement petit.
 *
 * La doctrine gardée (cf. l'en-tête du module) : un canvas = une couche ; boucle rAF pilotée par
 * l'horloge, qui s'ARRÊTE à la fin ; pause quand l'onglet est caché ; `reduce-motion` = état final
 * sans boucle ; sprite tamponné par `drawImage` en « lighter », jamais `arc` + `shadowBlur`.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aleatoireDeterministe,
  ALPHA_MINIMAL,
  cadreContenu,
  composantesRgb,
  creerSprite,
  DEBUT_FONDU_IMAGE,
  demarrerRemplissage,
  DIAMETRE_ETOILE,
  easeInOutCubic,
  echantillonnerAlpha,
  echantillonnerSilhouette,
  fonduImageA,
  HAUTEUR_SEUIL,
  LARGEUR_SEUIL,
  LUEUR_DEFAUT,
  MAX_ETOILES_DEFAUT,
  PART_VOL,
  PHYSIQUE_MAX,
  positionsA,
  preparerChamp,
  tailleCanvas,
} from "@/render/seuil/remplissage-etoiles";

// ── Silhouettes synthétiques ─────────────────────────────────────────────────────────────────────

type Alpha = (x: number, y: number) => number;

/** Octets RGBA d'une image `largeur × hauteur` dont seul l'alpha est signifiant. */
function rgba(largeur: number, hauteur: number, alphaDe: Alpha): Uint8ClampedArray {
  const donnees = new Uint8ClampedArray(largeur * hauteur * 4);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) donnees[(y * largeur + x) * 4 + 3] = alphaDe(x, y);
  }
  return donnees;
}

/**
 * Une petite silhouette 30×40 aux bords CHOISIS pour éprouver le seuil strict : une colonne à
 * alpha 128 exactement (exclue), une colonne à 129 (incluse), un corps plein à 255.
 */
const PETITE: Alpha = (x, y) => {
  if (x === 3) return ALPHA_MINIMAL; // = 128 : PAS silhouette (le seuil est strict)
  if (x === 27 && y >= 10) return ALPHA_MINIMAL + 1; // = 129 : silhouette
  if (x >= 6 && x < 24 && y >= 10 && y < 38) return 255;
  return 0;
};
/**
 * Nombre de cellules attendues à pas 3 : le corps donne 6 colonnes (x = 6…21) × 9 lignes
 * (y = 12…36) ; la colonne 27 donne 10 cellules (y = 12…39 — 39 est encore dans l'image de 40).
 */
const PETITE_ATTENDUES = 6 * 9 + 10;

/** Un « corps » plein dans la boîte de l'asset 200×260 : x ∈ [60, 140), y ∈ [20, 250). */
const CORPS: Alpha = (x, y) => (x >= 60 && x < 140 && y >= 20 && y < 250 ? 255 : 0);

const cibleY = (cibles: Float32Array, i: number) => cibles[i * 2 + 1];
const cibleX = (cibles: Float32Array, i: number) => cibles[i * 2];

// ── Double du contexte 2D ────────────────────────────────────────────────────────────────────────

interface Dessin {
  readonly source: unknown;
  readonly composition: string;
  readonly alpha: number;
  readonly args: readonly number[];
}
interface TraceCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly contexte: CanvasRenderingContext2D;
  readonly appels: Record<string, number>;
  readonly dessins: Dessin[];
  /** Affectations à `shadowBlur` / `filter` — la doctrine les interdit toutes. */
  readonly interdites: string[];
  readonly lecturesPixels: Array<readonly [number, number]>;
}

function installerContexte(alphaDe: Alpha) {
  const parCanvas = new Map<HTMLCanvasElement, TraceCanvas>();
  const ordre: TraceCanvas[] = [];

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    const deja = parCanvas.get(this);
    if (deja) return deja.contexte;

    const appels: Record<string, number> = {};
    const compter = (nom: string) => {
      appels[nom] = (appels[nom] ?? 0) + 1;
    };
    const etat = { composition: "source-over", alpha: 1 };
    const dessins: Dessin[] = [];
    const interdites: string[] = [];
    const lecturesPixels: Array<readonly [number, number]> = [];

    const contexte = {
      fillStyle: "",
      get globalCompositeOperation() {
        return etat.composition;
      },
      set globalCompositeOperation(v: string) {
        etat.composition = v;
      },
      get globalAlpha() {
        return etat.alpha;
      },
      set globalAlpha(v: number) {
        etat.alpha = v;
      },
      get shadowBlur() {
        return 0;
      },
      set shadowBlur(_v: number) {
        interdites.push("shadowBlur");
      },
      get filter() {
        return "none";
      },
      set filter(_v: string) {
        interdites.push("filter");
      },
      arc: () => compter("arc"),
      beginPath: () => compter("beginPath"),
      fill: () => compter("fill"),
      clearRect: () => compter("clearRect"),
      fillRect: () => compter("fillRect"),
      createRadialGradient: () => {
        compter("createRadialGradient");
        return { addColorStop: () => compter("addColorStop") };
      },
      drawImage: (source: unknown, ...args: number[]) => {
        compter("drawImage");
        dessins.push({ source, composition: etat.composition, alpha: etat.alpha, args });
      },
      getImageData: (_x: number, _y: number, l: number, h: number) => {
        compter("getImageData");
        lecturesPixels.push([l, h]);
        // jsdom n'a pas `ImageData` : le module ne lit que `.data`, un objet nu suffit.
        return { data: rgba(l, h, alphaDe), width: l, height: h };
      },
    } as unknown as CanvasRenderingContext2D;

    const trace: TraceCanvas = { canvas: this, contexte, appels, dessins, interdites, lecturesPixels };
    parCanvas.set(this, trace);
    ordre.push(trace);
    return contexte;
  });

  const traceDe = (canvas: HTMLCanvasElement): TraceCanvas => {
    const t = parCanvas.get(canvas);
    if (!t) throw new Error("ce canvas n'a jamais demandé de contexte");
    return t;
  };
  return { ordre, traceDe };
}

// ── rAF pilotable + horloge injectée ─────────────────────────────────────────────────────────────

function installerTrames() {
  const attente = new Map<number, FrameRequestCallback>();
  let prochain = 0;
  const demander = vi.fn((cb: FrameRequestCallback) => {
    attente.set(++prochain, cb);
    return prochain;
  });
  const annuler = vi.fn((id: number) => {
    attente.delete(id);
  });
  vi.stubGlobal("requestAnimationFrame", demander);
  vi.stubGlobal("cancelAnimationFrame", annuler);
  return {
    demander,
    annuler,
    enAttente: () => attente.size,
    /** Rend la trame en attente SANS la jouer — pour simuler une trame périmée qui arrive quand même. */
    derober: () => {
      const cb = [...attente.values()].at(-1);
      if (!cb) throw new Error("aucune trame en attente");
      return cb;
    },
    /** Joue toutes les trames en attente (une seule en pratique) à l'instant courant. */
    jouer: (t: number) => {
      const cbs = [...attente.values()];
      attente.clear();
      for (const cb of cbs) cb(t);
    },
  };
}

/** Sprite = toute source de `drawImage` qui est un canvas (l'image, elle, est un `<img>`). */
const dessinsDeSprite = (t: TraceCanvas) => t.dessins.filter((d) => d.source instanceof HTMLCanvasElement);
const dessinsDImage = (t: TraceCanvas) => t.dessins.filter((d) => d.source instanceof HTMLImageElement);

const microtache = () => new Promise<void>((r) => queueMicrotask(r));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("remplissage-etoiles — la couleur du halo vient du jeton, jamais d'une teinte en dur", () => {
  /* Revue du 2026-09-02 : le sprite portait encore l'ancienne lueur (#CDE4F8) après le passage à
     Soft Balance. Un canvas ne lit pas `--lueur` tout seul : la couleur est une option, lue par
     l'appelant, et le module n'a plus qu'une valeur de repli, celle de la palette courante. */
  function documentFactice() {
    const arrets: string[] = [];
    const ctx = {
      createRadialGradient: () => ({ addColorStop: (_o: number, c: string) => arrets.push(c) }),
      fillRect: () => undefined,
      set fillStyle(_v: unknown) {},
    };
    const doc = {
      createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
    } as unknown as Document;
    return { doc, arrets };
  }

  it("[LE CŒUR] convertit #RRGGBB et #RGB en composantes, et retombe sur la lueur Soft Balance sinon", () => {
    expect(composantesRgb("#7A90C9")).toBe("122, 144, 201");
    expect(composantesRgb("  #D3DBF0 ")).toBe("211, 219, 240");
    expect(composantesRgb("#fff")).toBe("255, 255, 255");
    expect(composantesRgb("")).toBe(composantesRgb(LUEUR_DEFAUT));
    expect(composantesRgb("rgb(1, 2, 3)")).toBe(composantesRgb(LUEUR_DEFAUT));
    expect(LUEUR_DEFAUT, "le repli est la lueur de la palette courante, pas l'ancienne").toBe("#D3DBF0");
  });

  it("[LE CŒUR] le sprite peint le halo dans la couleur demandée, et l'ancienne lueur n'apparaît plus", () => {
    const { doc, arrets } = documentFactice();
    expect(creerSprite(doc, 8, "#7A90C9")).not.toBeNull();
    expect(arrets).toEqual(["rgba(255, 255, 255, 1)", "rgba(122, 144, 201, 0.85)", "rgba(122, 144, 201, 0)"]);
    const { doc: doc2, arrets: arrets2 } = documentFactice();
    creerSprite(doc2, 8);
    expect(arrets2.join(" ")).toContain("211, 219, 240");
    expect(arrets2.join(" "), "l'ancienne lueur #CDE4F8 (205, 228, 248) ne doit plus être peinte").not.toContain("205, 228, 248");
  });

  it("[LE CŒUR] `demarrerRemplissage` transmet `couleur` au sprite", () => {
    // Le module source doit passer `options.couleur` à `creerSprite` : sinon l'option est morte.
    const src = readFileSync(resolve(process.cwd(), "render/seuil/remplissage-etoiles.ts"), "utf-8");
    expect(src).toMatch(/creerSprite\([^)]*options\.couleur\)/);
    // Et l'appelant du seuil lit bien le jeton sur le canvas.
    const avatar = readFileSync(resolve(process.cwd(), "render/seuil/AvatarSeuil.tsx"), "utf-8");
    expect(avatar).toMatch(/getPropertyValue\("--lueur"\)/);
    expect(avatar).toMatch(/couleur:/);
  });
});

describe("remplissage-etoiles — échantillonnage de la silhouette", () => {
  it("[LE CŒUR] ne garde que les pixels dont l'alpha DÉPASSE 128, sur la grille du pas", () => {
    const cibles = echantillonnerAlpha(rgba(30, 40, PETITE), 30, 40, 3, aleatoireDeterministe(7));
    expect(cibles.length / 2, "une cible par cellule de silhouette").toBe(PETITE_ATTENDUES);
    for (let i = 0; i < cibles.length / 2; i++) {
      const x = cibleX(cibles, i);
      const y = cibleY(cibles, i);
      expect(x % 3, "x sur la grille").toBe(0);
      expect(y % 3, "y sur la grille").toBe(0);
      expect(PETITE(x, y), `alpha strictement > 128 en (${x}, ${y})`).toBeGreaterThan(ALPHA_MINIMAL);
      expect(x, "la colonne à alpha 128 exactement est EXCLUE").not.toBe(3);
    }
    // La colonne à 129 est INCLUSE : le seuil est strict dans les deux sens.
    const colonne27 = [...Array(cibles.length / 2).keys()].filter((i) => cibleX(cibles, i) === 27);
    expect(colonne27.length).toBe(10);
  });

  it("[LE CŒUR] respecte le pas : pas 1 sur un carré plein donne une cible par pixel, pas 2 une sur quatre", () => {
    const plein = rgba(4, 4, () => 255);
    expect(echantillonnerAlpha(plein, 4, 4, 1, aleatoireDeterministe(1)).length / 2).toBe(16);
    expect(echantillonnerAlpha(plein, 4, 4, 2, aleatoireDeterministe(1)).length / 2).toBe(4);
  });

  it("[LE CŒUR] plafonne à maxEtoiles — et le sous-ensemble gardé est réparti sur TOUTE la silhouette", () => {
    const cibles = echantillonnerAlpha(rgba(30, 40, PETITE), 30, 40, 3, aleatoireDeterministe(7), 10);
    expect(cibles.length / 2).toBe(10);
    const ys = [...Array(10).keys()].map((i) => cibleY(cibles, i));
    // Sans le MÉLANGE avant la troncature, on garderait « les dix premières cellules » : toutes en
    // haut (y = 12). Le plafond doit garder un échantillon uniforme, du bas comme du haut.
    expect(Math.min(...ys), "des cibles du haut").toBeLessThan(24);
    expect(Math.max(...ys), "des cibles du bas").toBeGreaterThan(24);
    for (let i = 0; i < 10; i++) {
      expect(PETITE(cibleX(cibles, i), cibleY(cibles, i))).toBeGreaterThan(ALPHA_MINIMAL);
    }
  });

  it("[LE CŒUR] les cibles sont rangées du BAS vers le HAUT (y décroissant) — c'est l'ordre d'arrivée", () => {
    const cibles = echantillonnerAlpha(rgba(200, 260, CORPS), 200, 260, 3, aleatoireDeterministe(3), 300);
    expect(cibles.length / 2).toBe(300);
    for (let i = 1; i < 300; i++) {
      expect(cibleY(cibles, i), `y[${i}] ≤ y[${i - 1}]`).toBeLessThanOrEqual(cibleY(cibles, i - 1));
    }
    expect(cibleY(cibles, 0), "la première est tout en bas").toBeGreaterThanOrEqual(240);
    expect(cibleY(cibles, 299), "la dernière est tout en haut").toBeLessThanOrEqual(30);
  });

  it("[LE CŒUR] même graine → même ciel ; autre graine → autre sous-ensemble (déterminisme injecté)", () => {
    const donnees = rgba(200, 260, CORPS);
    const a = echantillonnerAlpha(donnees, 200, 260, 3, aleatoireDeterministe(42), 100);
    const b = echantillonnerAlpha(donnees, 200, 260, 3, aleatoireDeterministe(42), 100);
    const c = echantillonnerAlpha(donnees, 200, 260, 3, aleatoireDeterministe(43), 100);
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
  });

  it("[ANTI-VACUITÉ] une image entièrement transparente ne donne AUCUNE cible", () => {
    const cibles = echantillonnerAlpha(rgba(30, 40, () => 0), 30, 40, 3, aleatoireDeterministe(1));
    expect(cibles.length).toBe(0);
  });

  it("[LE CŒUR] `echantillonnerSilhouette` lit les pixels par un tampon hors écran et délègue à la fonction pure", () => {
    const { ordre } = installerContexte(PETITE);
    const cibles = echantillonnerSilhouette(new Image(), 30, 40, 3, aleatoireDeterministe(7));
    expect(cibles.length / 2).toBe(PETITE_ATTENDUES);
    expect(ordre.length, "un seul tampon hors écran").toBe(1);
    expect(ordre[0].lecturesPixels, "lu à la taille demandée").toEqual([[30, 40]]);
    expect(ordre[0].canvas.width).toBe(30);
    expect(ordre[0].canvas.height).toBe(40);
  });

  it("[ANTI-VACUITÉ] sans contexte 2D, `echantillonnerSilhouette` rend un tableau vide — jamais une exception", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null);
    expect(echantillonnerSilhouette(new Image(), 30, 40, 3, aleatoireDeterministe(1)).length).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("remplissage-etoiles — la simulation (pure, sans canvas)", () => {
  const cibles = echantillonnerAlpha(rgba(200, 260, CORPS), 200, 260, 3, aleatoireDeterministe(11), 400);
  const champ = preparerChamp(cibles, 200, 260, aleatoireDeterministe(12));
  const n = champ.nombre;
  const distanceALaCible = (positions: Float32Array, i: number) =>
    Math.hypot(positions[i * 3] - cibleX(cibles, i), positions[i * 3 + 1] - cibleY(cibles, i));

  it("[LE CŒUR] à t = 0, aucune étoile n'est à sa cible (et aucune n'est visible)", () => {
    const positions = positionsA(champ, 0, new Float32Array(n * 3));
    for (let i = 0; i < n; i++) {
      expect(distanceALaCible(positions, i), `étoile ${i} loin de sa cible`).toBeGreaterThan(20);
      expect(positions[i * 3 + 2], `étoile ${i} encore éteinte`).toBe(0);
    }
  });

  it("[LE CŒUR] à t = durée, TOUTES sont à leur cible (< 0,5 px) et pleinement allumées", () => {
    const positions = positionsA(champ, 1, new Float32Array(n * 3));
    for (let i = 0; i < n; i++) {
      expect(distanceALaCible(positions, i), `étoile ${i} arrivée`).toBeLessThan(0.5);
      expect(positions[i * 3 + 2]).toBe(1);
    }
  });

  it("[LE CŒUR] le remplissage est bas → haut : les cibles basses arrivent AVANT les hautes", () => {
    const ys = [...Array(n).keys()].map((i) => cibleY(cibles, i));
    const tries = [...ys].sort((a, b) => a - b);
    const mediane = tries[Math.floor(n / 2)];
    const quartHaut = tries[Math.floor(n / 4)]; // les 25 % de cibles les plus HAUTES ont y ≤ ce seuil

    // Aux trois quarts du temps, tout le bas de la silhouette est en place…
    const positions = positionsA(champ, 0.75, new Float32Array(n * 3));
    let bassesArrivees = 0;
    let basses = 0;
    let hautesArrivees = 0;
    let hautes = 0;
    for (let i = 0; i < n; i++) {
      const arrivee = distanceALaCible(positions, i) < 0.5;
      if (ys[i] >= mediane) {
        basses++;
        if (arrivee) bassesArrivees++;
      }
      if (ys[i] <= quartHaut) {
        hautes++;
        if (arrivee) hautesArrivees++;
      }
    }
    expect(basses).toBeGreaterThan(100);
    expect(hautes).toBeGreaterThan(50);
    expect(bassesArrivees, "toute la moitié basse est arrivée").toBe(basses);
    // …et le quart le plus haut n'a pas encore touché sa cible.
    expect(hautesArrivees, "aucune du quart haut n'est arrivée").toBe(0);

    // Et le délai moyen croît de bande en bande, du bas vers le haut (le front monte).
    const bandes = [0, 0, 0, 0];
    const comptes = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      const b = Math.min(3, Math.floor(((260 - ys[i]) / 260) * 4));
      bandes[b] += champ.delais[i];
      comptes[b]++;
    }
    const moyennes = bandes.map((s, b) => s / Math.max(1, comptes[b]));
    expect(moyennes[0]).toBeLessThan(moyennes[1]);
    expect(moyennes[1]).toBeLessThan(moyennes[2]);
    expect(moyennes[2]).toBeLessThan(moyennes[3]);
  });

  it("[LE CŒUR] les délais sont bornés : la dernière étoile arrive à la fin, jamais après", () => {
    let max = 0;
    for (let i = 0; i < n; i++) max = Math.max(max, champ.delais[i]);
    expect(max).toBeLessThanOrEqual(1 - PART_VOL + 1e-6);
    expect(max, "la plage des délais est bien utilisée").toBeGreaterThan(1 - PART_VOL - 0.05);
  });

  it("[LE CŒUR] les origines sont HORS de la silhouette, surtout dans le ciel", () => {
    let dansLeCiel = 0;
    for (let i = 0; i < n; i++) {
      const ox = champ.origines[i * 2];
      const oy = champ.origines[i * 2 + 1];
      expect(Math.hypot(ox - 100, oy - 130), `origine ${i} loin du centre`).toBeGreaterThanOrEqual(0.75 * 260 - 1e-3);
      if (oy < 130) dansLeCiel++;
    }
    expect(dansLeCiel / n, "au moins la moitié viennent d'au-dessus").toBeGreaterThan(0.55);
  });

  it("[LE CŒUR] à mi-parcours, une partie SEULEMENT des étoiles est visible — l'animation est lente, pas un flash", () => {
    const positions = positionsA(champ, 0.5, new Float32Array(n * 3));
    const visibles = [...Array(n).keys()].filter((i) => positions[i * 3 + 2] > 0).length;
    const arrivees = [...Array(n).keys()].filter((i) => distanceALaCible(positions, i) < 0.5).length;
    expect(visibles).toBeGreaterThan(n * 0.5);
    expect(visibles).toBeLessThan(n);
    expect(arrivees).toBeGreaterThan(0);
    expect(arrivees).toBeLessThan(n * 0.5);
  });

  it("[LE CŒUR] easeInOutCubic : 0 en 0, ½ en ½, 1 en 1, monotone, bornée hors [0, 1]", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
    let precedent = 0;
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const v = easeInOutCubic(t);
      expect(v).toBeGreaterThanOrEqual(precedent);
      precedent = v;
    }
  });

  it("[LE CŒUR] le fondu de l'image commence à DEBUT_FONDU_IMAGE et vaut 1 à la fin", () => {
    expect(fonduImageA(0)).toBe(0);
    expect(fonduImageA(DEBUT_FONDU_IMAGE)).toBe(0);
    expect(fonduImageA((DEBUT_FONDU_IMAGE + 1) / 2)).toBeCloseTo(0.5, 10);
    expect(fonduImageA(1)).toBe(1);
  });

  it("[LE CŒUR] plafonds de taille : DPR 2 au plus, et jamais plus que 400×520 physiques", () => {
    expect(tailleCanvas(200, 260, 1)).toEqual({ largeur: 200, hauteur: 260, echelle: 1 });
    expect(tailleCanvas(200, 260, 2)).toEqual({ largeur: 400, hauteur: 520, echelle: 2 });
    expect(tailleCanvas(200, 260, 3), "DPR 3 plafonné à 2").toEqual({ largeur: 400, hauteur: 520, echelle: 2 });
    const grand = tailleCanvas(300, 390, 2);
    expect(grand.largeur, "surface plafonnée").toBeLessThanOrEqual(PHYSIQUE_MAX.largeur);
    expect(grand.hauteur).toBeLessThanOrEqual(PHYSIQUE_MAX.hauteur);
    expect(grand.echelle).toBeCloseTo(4 / 3, 10);
    expect(tailleCanvas(200, 260, Number.NaN).echelle, "un DPR absurde vaut 1").toBe(1);
  });

  it("[LE CŒUR] le cadre « contain » suit la même règle que `.imageAnamImg` (object-fit: contain)", () => {
    const cadre = cadreContenu(200, 260, 240, 300);
    expect(cadre.hauteur).toBeCloseTo(300, 6);
    expect(cadre.largeur).toBeCloseTo(200 * (300 / 260), 6);
    expect(cadre.y).toBe(0);
    expect(cadre.x).toBeCloseTo((240 - cadre.largeur) / 2, 6);
    expect(cadreContenu(0, 0, 240, 300), "image sans taille : toute la boîte").toEqual({ x: 0, y: 0, largeur: 240, hauteur: 300 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════

describe("remplissage-etoiles — demarrerRemplissage (la boucle, jsdom + contexte doublé)", () => {
  let trames: ReturnType<typeof installerTrames>;
  let contexte: ReturnType<typeof installerContexte>;
  let horloge: { t: number };
  let canvas: HTMLCanvasElement;
  let image: HTMLImageElement;
  const DUREE = 4500;
  const options = () => ({
    dureeMs: DUREE,
    aleatoire: aleatoireDeterministe(5),
    maintenant: () => horloge.t,
    reduceMotion: false,
  });

  beforeEach(() => {
    contexte = installerContexte(CORPS);
    trames = installerTrames();
    horloge = { t: 1000 };
    canvas = document.createElement("canvas");
    image = new Image(); // jsdom : `complete` vaut true sans `src` → chemin synchrone
  });

  it("[LE CŒUR] une trame par rAF, pilotée par l'HORLOGE : l'avancement suit le temps, pas le compte de trames", () => {
    const { arreter } = demarrerRemplissage(canvas, image, options());
    expect(trames.demander, "une seule trame demandée au départ").toHaveBeenCalledTimes(1);
    const t = contexte.traceDe(canvas);

    trames.jouer(horloge.t); // t = 0 : rien n'est encore parti
    expect(t.appels.clearRect).toBe(1);
    expect(dessinsDeSprite(t).length).toBe(0);
    expect(trames.enAttente(), "la trame suivante est demandée").toBe(1);

    // Dix trames sans que l'horloge n'avance : l'avancement ne bouge PAS (il n'est pas compté en trames).
    for (let i = 0; i < 10; i++) trames.jouer(horloge.t);
    expect(dessinsDeSprite(t).length).toBe(0);

    horloge.t += DUREE / 2;
    trames.jouer(horloge.t);
    const aMiParcours = dessinsDeSprite(t).length;
    expect(aMiParcours, "à mi-parcours, une partie des étoiles").toBeGreaterThan(0);
    expect(aMiParcours).toBeLessThan(MAX_ETOILES_DEFAUT);
    arreter();
  });

  it("[LE CŒUR] `reduceMotion: true` → aucun rAF, UN seul dessin : l'état FINAL (silhouette pleine, image dessous), `termine` résolue", async () => {
    const { termine } = demarrerRemplissage(canvas, image, { ...options(), reduceMotion: true });
    expect(trames.demander).not.toHaveBeenCalled();
    const t = contexte.traceDe(canvas);
    expect(t.appels.clearRect, "un seul dessin").toBe(1);
    expect(dessinsDeSprite(t).length, "TOUTES les étoiles, à leur place").toBe(MAX_ETOILES_DEFAUT);
    for (const d of dessinsDeSprite(t)) expect(d.alpha).toBe(1);
    const img = dessinsDImage(t);
    expect(img.length, "l'image de l'avatar dessous").toBe(1);
    expect(img[0].alpha, "pleinement visible").toBe(1);
    await termine; // résolue tout de suite — sinon ce test expire
  });

  it("[LE CŒUR] `reduceMotion` absent → la préférence système décide (matchMedia), et jsdom sans matchMedia = animation", () => {
    const anime = demarrerRemplissage(canvas, image, {
      dureeMs: DUREE,
      aleatoire: aleatoireDeterministe(5),
      maintenant: () => horloge.t,
    });
    expect(trames.demander, "sans matchMedia, on anime").toHaveBeenCalledTimes(1);
    trames.jouer(horloge.t);
    anime.arreter(); // sinon son écouteur `visibilitychange` survivrait sur le `document` partagé des tests

    vi.stubGlobal("matchMedia", (requete: string) => ({ matches: requete.includes("reduce"), media: requete }));
    const autre = document.createElement("canvas");
    demarrerRemplissage(autre, image, { dureeMs: DUREE, aleatoire: aleatoireDeterministe(5), maintenant: () => horloge.t });
    expect(trames.demander, "la préférence « moins de mouvement » est HONORÉE : pas de trame de plus").toHaveBeenCalledTimes(2);
    expect(contexte.traceDe(autre).appels.clearRect, "mais l'état final est dessiné — jamais rien de vide").toBe(1);
  });

  it("[LE CŒUR] `arreter()` annule le rAF et empêche tout dessin ultérieur — même si une trame périmée arrive quand même", async () => {
    const { arreter, termine } = demarrerRemplissage(canvas, image, options());
    const t = contexte.traceDe(canvas);
    trames.jouer(horloge.t);
    expect(t.appels.clearRect).toBe(1);

    const perimee = trames.derober(); // on garde la référence AVANT l'annulation
    const idEnAttente = trames.demander.mock.results.at(-1)?.value as number;
    arreter();
    expect(trames.annuler).toHaveBeenCalledWith(idEnAttente);
    expect(trames.enAttente()).toBe(0);

    horloge.t += 1000;
    perimee(horloge.t); // un navigateur ne la livrerait pas ; s'il le faisait, elle ne doit rien peindre
    expect(t.appels.clearRect, "aucun dessin après l'arrêt").toBe(1);
    expect(trames.demander, "aucune nouvelle trame demandée").toHaveBeenCalledTimes(2);

    arreter(); // idempotent
    expect(trames.annuler).toHaveBeenCalledTimes(1);
    await termine; // l'arrêt résout la promesse : elle ne reste jamais pendante
  });

  it("[LE CŒUR] la boucle s'arrête D'ELLE-MÊME après la durée : plus aucun rAF après `termine`", async () => {
    const { termine } = demarrerRemplissage(canvas, image, options());
    let resolue = false;
    void termine.then(() => {
      resolue = true;
    });
    const t = contexte.traceDe(canvas);

    // On avance par pas de 100 ms jusqu'à dépasser la durée.
    let trame = 0;
    while (horloge.t < 1000 + DUREE + 300) {
      trames.jouer(horloge.t);
      trame++;
      horloge.t += 100;
    }
    await microtache();
    expect(resolue, "`termine` est résolue").toBe(true);
    expect(trames.enAttente(), "plus aucune trame en attente").toBe(0);
    const demandes = trames.demander.mock.calls.length;
    expect(demandes, "une demande par trame jouée avant la fin, aucune après").toBeLessThan(trame);

    // La dernière trame est l'état final : toutes les étoiles en place, l'image pleine.
    const derniereTrame = dessinsDeSprite(t).slice(-MAX_ETOILES_DEFAUT);
    expect(derniereTrame.length).toBe(MAX_ETOILES_DEFAUT);
    for (const d of derniereTrame) expect(d.alpha).toBe(1);
    expect(dessinsDImage(t).at(-1)?.alpha).toBe(1);

    // Et rien ne repart : jouer encore ne dessine rien (il n'y a rien à jouer).
    const dessins = t.appels.clearRect;
    trames.jouer(horloge.t);
    expect(t.appels.clearRect).toBe(dessins);
    expect(trames.demander).toHaveBeenCalledTimes(demandes);
  });

  it("[LE CŒUR] avant la fin, `termine` n'est PAS résolue — elle dit quelque chose", async () => {
    const { termine, arreter } = demarrerRemplissage(canvas, image, options());
    let resolue = false;
    void termine.then(() => {
      resolue = true;
    });
    trames.jouer(horloge.t);
    horloge.t += DUREE / 2;
    trames.jouer(horloge.t);
    await microtache();
    expect(resolue).toBe(false);
    arreter();
  });

  it("[LE CŒUR] onglet caché → la trame en attente est annulée et le temps ne court plus ; retour → reprise SANS saut", () => {
    let visibilite: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibilite });
    try {
      const { arreter } = demarrerRemplissage(canvas, image, options());
      const t = contexte.traceDe(canvas);
      trames.jouer(horloge.t);
      expect(trames.enAttente()).toBe(1);

      horloge.t += 500;
      visibilite = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
      expect(trames.annuler, "la trame en attente est annulée").toHaveBeenCalledTimes(1);
      expect(trames.enAttente(), "rien ne tourne pendant que l'onglet est caché").toBe(0);

      // 3 s cachés : sans pause, on serait à (500 + 3000) / 4500 = 0,78 → l'image serait déjà là.
      horloge.t += 3000;
      visibilite = "visible";
      document.dispatchEvent(new Event("visibilitychange"));
      expect(trames.enAttente(), "une trame est redemandée au retour").toBe(1);
      trames.jouer(horloge.t);
      expect(dessinsDImage(t).length, "le temps caché n'a PAS compté : l'image n'affleure pas encore").toBe(0);
      const visibles = dessinsDeSprite(t).length;
      expect(visibles, "on est à ~0,11 d'avancement : peu d'étoiles").toBeLessThan(MAX_ETOILES_DEFAUT / 2);

      // Un second `visibilitychange` « visible » sans passage caché ne redemande rien de plus.
      document.dispatchEvent(new Event("visibilitychange"));
      expect(trames.enAttente()).toBe(1);
      arreter();
    } finally {
      delete (document as unknown as Record<string, unknown>).visibilityState;
    }
  });

  it("[ANTI-VACUITÉ] les étoiles sont TAMPONNÉES par `drawImage` d'un sprite pré-rendu — pas d'`arc`, jamais `shadowBlur` ni `filter`", () => {
    const { arreter } = demarrerRemplissage(canvas, image, options());
    const t = contexte.traceDe(canvas);
    horloge.t += DUREE; // état final : toutes les étoiles
    trames.jouer(horloge.t);

    const sprites = dessinsDeSprite(t);
    expect(sprites.length).toBe(MAX_ETOILES_DEFAUT);
    const sprite = sprites[0].source as HTMLCanvasElement;
    expect(sprites.every((d) => d.source === sprite), "UN sprite, réutilisé").toBe(true);
    expect(t.appels.arc ?? 0, "aucun `arc` sur le canvas principal").toBe(0);
    expect(t.interdites, "ni shadowBlur ni filter").toEqual([]);
    // Le sprite lui-même : un dégradé radial rendu UNE fois, sans arc ni flou.
    const ts = contexte.traceDe(sprite);
    expect(ts.appels.createRadialGradient).toBe(1);
    expect(ts.appels.fillRect).toBe(1);
    expect(ts.interdites).toEqual([]);
    // Coordonnées ENTIÈRES : pas de rééchantillonnage bilinéaire du sprite à chaque tampon.
    for (const d of sprites) {
      expect(d.args.length, "forme à 3 arguments : sans mise à l'échelle").toBe(2);
      expect(Number.isInteger(d.args[0]) && Number.isInteger(d.args[1]), "entier").toBe(true);
    }
    arreter();
  });

  it("[ANTI-VACUITÉ] `globalCompositeOperation` vaut « lighter » PENDANT le dessin des étoiles, « source-over » pour l'image dessous — et est rendue à « source-over » après", () => {
    const { arreter } = demarrerRemplissage(canvas, image, options());
    const t = contexte.traceDe(canvas);
    horloge.t += DUREE * 0.9; // image en cours de fondu ET étoiles en vol
    trames.jouer(horloge.t);

    const sprites = dessinsDeSprite(t);
    expect(sprites.length).toBeGreaterThan(0);
    expect(sprites.every((d) => d.composition === "lighter")).toBe(true);
    const img = dessinsDImage(t);
    expect(img.length).toBe(1);
    expect(img[0].composition).toBe("source-over");
    expect(img[0].alpha).toBeGreaterThan(0);
    expect(img[0].alpha).toBeLessThan(1);
    expect(t.contexte.globalCompositeOperation, "l'état est rendu propre après la trame").toBe("source-over");
    expect(t.contexte.globalAlpha).toBe(1);
    arreter();
  });

  it("[LE CŒUR] taille : DPR 2 → 400×520 physiques, sprite de DIAMETRE_ETOILE × 2 ; DPR 3 → pareil (plafond)", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    const { arreter } = demarrerRemplissage(canvas, image, options());
    expect(canvas.width).toBe(PHYSIQUE_MAX.largeur);
    expect(canvas.height).toBe(PHYSIQUE_MAX.hauteur);
    horloge.t += DUREE;
    trames.jouer(horloge.t);
    const sprite = dessinsDeSprite(contexte.traceDe(canvas))[0].source as HTMLCanvasElement;
    expect(sprite.width).toBe(DIAMETRE_ETOILE * 2);
    expect(sprite.height).toBe(DIAMETRE_ETOILE * 2);
    arreter();
  });

  it("[LE CŒUR] sans taille fournie, la boîte est celle de l'asset 1x (200×260) ; avec, c'est la sienne — et l'échantillonnage suit", () => {
    const { arreter } = demarrerRemplissage(canvas, image, options());
    expect(canvas.width).toBe(LARGEUR_SEUIL);
    expect(canvas.height).toBe(HAUTEUR_SEUIL);
    arreter();

    const autre = document.createElement("canvas");
    const r = demarrerRemplissage(autre, image, { ...options(), largeur: 240, hauteur: 300 });
    expect(autre.width).toBe(240);
    expect(autre.height).toBe(300);
    // Le tampon d'échantillonnage a la taille du cadre « contain » de l'image dans cette boîte.
    // Chaque lancement crée SON tampon : c'est le dernier qui correspond à la boîte 240×300.
    const tampon = contexte.ordre.filter((tr) => tr.lecturesPixels.length > 0).at(-1);
    expect(tampon).toBeDefined();
    expect(tampon?.canvas).not.toBe(autre);
    const cadre = cadreContenu(LARGEUR_SEUIL, HAUTEUR_SEUIL, 240, 300);
    expect(tampon?.lecturesPixels.at(-1)).toEqual([Math.round(cadre.largeur), Math.round(cadre.hauteur)]);
    r.arreter();
  });

  it("[LE CŒUR] le plafond d'étoiles borne le nombre de `drawImage` par trame", () => {
    const { arreter } = demarrerRemplissage(canvas, image, { ...options(), maxEtoiles: 40 });
    horloge.t += DUREE;
    trames.jouer(horloge.t);
    expect(dessinsDeSprite(contexte.traceDe(canvas)).length).toBe(40);
    arreter();
  });

  it("[ANTI-VACUITÉ] aucun `setInterval` ni `setTimeout` — la boucle est rAF, et rien d'autre", () => {
    const intervalle = vi.spyOn(globalThis, "setInterval");
    const delai = vi.spyOn(globalThis, "setTimeout");
    demarrerRemplissage(canvas, image, options());
    while (horloge.t < 1000 + DUREE + 100) {
      trames.jouer(horloge.t);
      horloge.t += 250;
    }
    expect(intervalle).not.toHaveBeenCalled();
    expect(delai).not.toHaveBeenCalled();
  });

  it("[ANTI-VACUITÉ] aucune écoute ne survit à la fin ni à l'arrêt (`visibilitychange` est retiré)", () => {
    const ajouter = vi.spyOn(document, "addEventListener");
    const retirer = vi.spyOn(document, "removeEventListener");

    const a = demarrerRemplissage(canvas, image, options());
    expect(ajouter).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    a.arreter();
    expect(retirer).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

    const autre = document.createElement("canvas");
    demarrerRemplissage(autre, image, options());
    horloge.t += DUREE;
    trames.jouer(horloge.t); // fin naturelle
    expect(retirer).toHaveBeenCalledTimes(2);
  });

  it("[ANTI-VACUITÉ] sans contexte 2D sur le canvas cible, rien ne tourne et `termine` est résolue (l'intégrateur garde son repli)", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null);
    const { termine } = demarrerRemplissage(canvas, image, options());
    expect(trames.demander).not.toHaveBeenCalled();
    await termine;
  });

  it("[LE CŒUR] une image pas encore décodée : on attend son `load` avant de partir, et `arreter()` avant le `load` n'a aucun effet secondaire", () => {
    Object.defineProperty(image, "complete", { configurable: true, get: () => false });
    const { arreter } = demarrerRemplissage(canvas, image, options());
    expect(trames.demander, "rien tant que l'image n'est pas là").not.toHaveBeenCalled();
    expect(() => contexte.traceDe(canvas), "aucun contexte demandé").toThrow();

    image.dispatchEvent(new Event("load"));
    expect(trames.demander, "la boucle part au `load`").toHaveBeenCalledTimes(1);
    arreter();

    // Et un arrêt AVANT le load : le load ne relance rien.
    const autre = document.createElement("canvas");
    const b = demarrerRemplissage(autre, image, options());
    b.arreter();
    image.dispatchEvent(new Event("load"));
    expect(trames.demander).toHaveBeenCalledTimes(1);
  });
});
