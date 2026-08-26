/**
 * Géométrie du handoff « Arbre de Vie Lunaire ».
 *
 * Le prototype officiel est un Canvas logique 1408 × 2503. Cette géométrie est pure et partagée
 * par la peinture Canvas et les boutons DOM : une accroche ne peut donc pas dériver du bois qu'elle
 * rend adressable. Les treize premiers rangs reprennent les bulbes et routes validés au pixel près.
 * Les rangs suivants sont ajoutés de façon déterministe, sans déplacer les précédents ni tronquer la
 * projection métier.
 */

import type { BrancheProjetee } from "@/lib/scene/projection";

export const CANEVAS = { largeur: 1408, hauteur: 2503 } as const;
export const CENTRE_ARBRE = { x: 704, solY: 1360 } as const;

export type SorteBoisLunaire = "root" | "trunk" | "leader" | "branch" | "twig";

export interface PointLunaire {
  readonly x: number;
  readonly y: number;
  readonly w: number;
}

export interface StrieLunaire {
  readonly o: number;
  readonly tone: 1 | -1;
  readonly wf: number;
  readonly ph: number;
  readonly al: number;
}

export interface SegmentLunaire {
  readonly pts: readonly PointLunaire[];
  readonly kind: SorteBoisLunaire;
  readonly stries?: readonly StrieLunaire[];
  /** Position du rameau le long de sa branche principale, pour la montée de lumière. */
  readonly u0?: number;
}

export interface JointLunaire {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly kind: SorteBoisLunaire;
}

export interface BulbeLunaire {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface BranchePlacee {
  readonly branche: BrancheProjetee;
  readonly rang: number;
  /** Centre du bulbe de canopée — conservé sous x/y pour les appelants historiques. */
  readonly x: number;
  readonly y: number;
  readonly bulbe: BulbeLunaire;
  readonly accroche: { readonly x: number; readonly y: number };
  readonly fourche: { readonly x: number; readonly y: number };
  readonly principale: SegmentLunaire;
  readonly rameaux: readonly SegmentLunaire[];
  /** Distance logique à l'accroche la plus proche ; Infinity quand la branche est seule. */
  readonly ecartVoisin: number;
}

export interface GeometrieArbreLunaire {
  readonly statiques: readonly SegmentLunaire[];
  readonly joints: readonly JointLunaire[];
  readonly branches: readonly BranchePlacee[];
  /** État du RNG officiel juste après les 13 branches, donc juste avant `buildLeaves()`. */
  readonly etatRngFeuillesCanoniques: number;
}

type Point = { x: number; y: number };
type SegmentMutable = {
  pts: PointLunaire[];
  kind: SorteBoisLunaire;
  stries?: StrieLunaire[];
  u0?: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export interface GenerateurAleatoireLunaire {
  (): number;
  readonly etat: () => number;
}

export function mulberry32Lunaire(a: number): GenerateurAleatoireLunaire {
  const suivant = function suivant() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Object.assign(suivant, { etat: () => a });
}

const BULBES_PROTOTYPE: readonly BulbeLunaire[] = [
  { x: 704, y: 250, r: 180 },
  { x: 452, y: 340, r: 158 },
  { x: 956, y: 335, r: 158 },
  { x: 286, y: 470, r: 146 },
  { x: 1122, y: 465, r: 146 },
  { x: 590, y: 420, r: 148 },
  { x: 818, y: 415, r: 148 },
  { x: 360, y: 640, r: 150 },
  { x: 1048, y: 635, r: 150 },
  { x: 560, y: 610, r: 138 },
  { x: 848, y: 605, r: 138 },
  { x: 430, y: 830, r: 132 },
  { x: 978, y: 825, r: 132 },
] as const;

const FOURCHE = { x: 704, y: 1060 } as const;
const HUB_GAUCHE = { x: 556, y: 900 } as const;
const HUB_DROIT = { x: 852, y: 895 } as const;
const HUB_CENTRE = { x: 704, y: 860 } as const;

const ROUTES_CANONIQUES: readonly { hub: Point; bulbe: number }[] = [
  { hub: HUB_CENTRE, bulbe: 0 },
  { hub: HUB_CENTRE, bulbe: 5 },
  { hub: HUB_CENTRE, bulbe: 6 },
  { hub: HUB_GAUCHE, bulbe: 1 },
  { hub: HUB_GAUCHE, bulbe: 3 },
  { hub: HUB_GAUCHE, bulbe: 7 },
  { hub: HUB_GAUCHE, bulbe: 9 },
  { hub: HUB_GAUCHE, bulbe: 11 },
  { hub: HUB_DROIT, bulbe: 2 },
  { hub: HUB_DROIT, bulbe: 4 },
  { hub: HUB_DROIT, bulbe: 8 },
  { hub: HUB_DROIT, bulbe: 10 },
  { hub: HUB_DROIT, bulbe: 12 },
] as const;

/** Ordre exact dans lequel le prototype associe états et bulbes. */
export const BULBES_CANONIQUES: readonly BulbeLunaire[] = ROUTES_CANONIQUES.map(
  ({ bulbe }) => BULBES_PROTOTYPE[bulbe],
);

function hubLePlusProche(bulbe: BulbeLunaire): Point {
  const hubs = [HUB_GAUCHE, HUB_CENTRE, HUB_DROIT] as const;
  return hubs.reduce((meilleur, hub) =>
    Math.hypot(hub.x - bulbe.x, hub.y - bulbe.y) < Math.hypot(meilleur.x - bulbe.x, meilleur.y - bulbe.y)
      ? hub
      : meilleur,
  );
}

/**
 * Emplacement supplémentaire : 96 candidats fixes dans l'ellipse de canopée, puis choix de celui
 * qui maximise sa distance normalisée aux bulbes déjà attribués. Le calcul ne dépend que du rang et
 * des rangs antérieurs ; ajouter une branche ne réorganise donc jamais l'arbre.
 */
function bulbeSupplementaire(rang: number, precedents: readonly BulbeLunaire[]): BulbeLunaire {
  const niveau = Math.floor((rang - BULBES_CANONIQUES.length) / BULBES_CANONIQUES.length);
  const r = Math.max(56, 108 - niveau * 5);
  const rng = mulberry32Lunaire(23023 + rang * 7919);
  let meilleur: BulbeLunaire = { x: CENTRE_ARBRE.x, y: 560, r };
  let meilleurScore = -Infinity;

  for (let i = 0; i < 96; i++) {
    const angle = rng() * Math.PI * 2;
    const rayon = Math.sqrt(0.1 + rng() * 0.9);
    const candidat: BulbeLunaire = {
      x: Math.round(CENTRE_ARBRE.x + Math.cos(angle) * rayon * 540),
      y: Math.round(555 + Math.sin(angle) * rayon * 390),
      r,
    };
    const score = Math.min(
      ...precedents.map((p) => Math.hypot(candidat.x - p.x, candidat.y - p.y) / ((candidat.r + p.r) / 2)),
    );
    if (score > meilleurScore) {
      meilleur = candidat;
      meilleurScore = score;
    }
  }
  return meilleur;
}

/**
 * L'ordre réseau n'est jamais une identité visuelle. Une date parseable prend sa place chronologique ;
 * une date absente ou invalide vient après toutes les dates valides. À date égale — ou dans ce groupe
 * de repli — l'id départage en ordre binaire, stable quel que soit le navigateur ou la locale.
 */
function ordonnerBranchesLunaires(
  branches: readonly BrancheProjetee[],
): readonly BrancheProjetee[] {
  const horodatage = (branche: BrancheProjetee): number | null => {
    if (!branche.dateNaissance) return null;
    const valeur = Date.parse(branche.dateNaissance);
    return Number.isFinite(valeur) ? valeur : null;
  };
  const comparerId = (a: string, b: string) => (a === b ? 0 : a < b ? -1 : 1);

  return [...branches].sort((a, b) => {
    const dateA = horodatage(a);
    const dateB = horodatage(b);
    if (dateA !== null && dateB !== null && dateA !== dateB) return dateA - dateB;
    if (dateA !== null && dateB === null) return -1;
    if (dateA === null && dateB !== null) return 1;
    return comparerId(a.id, b.id);
  });
}

export function construireGeometrieLunaire(branches: readonly BrancheProjetee[]): GeometrieArbreLunaire {
  const branchesOrdonnees = ordonnerBranchesLunaires(branches);
  const rng = mulberry32Lunaire(23);
  const statiques: SegmentMutable[] = [];
  const joints: JointLunaire[] = [];

  const stries = (n: number): StrieLunaire[] =>
    Array.from({ length: n }, () => ({
      o: rng() * 1.5 - 0.75,
      tone: rng() < 0.5 ? (1 as const) : (-1 as const),
      wf: 0.05 + rng() * 0.07,
      ph: rng() * 6.28,
      al: 0.1 + rng() * 0.14,
    }));

  const limb = (
    x0: number,
    y0: number,
    cx1: number,
    cy1: number,
    x1: number,
    y1: number,
    w0: number,
    w1: number,
    kind: SorteBoisLunaire,
    taper = 1.1,
  ): SegmentMutable => {
    const steps = Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0) / 11));
    const pts: PointLunaire[] = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const iu = 1 - u;
      pts.push({
        x: iu * iu * x0 + 2 * iu * u * cx1 + u * u * x1,
        y: iu * iu * y0 + 2 * iu * u * cy1 + u * u * y1,
        w: w1 + (w0 - w1) * Math.pow(iu, taper),
      });
    }
    return { pts, kind, ...(w0 > 16 ? { stries: stries(Math.round(3 + w0 / 12)) } : {}) };
  };

  // Tronc : même silhouette, même sinuosité et même plongée sous le sol que le handoff.
  const tBot = CENTRE_ARBRE.solY + 210;
  const tTop = FOURCHE.y;
  const trunkW = (y: number) => {
    const d = y - CENTRE_ARBRE.solY;
    const sigma = d <= 0 ? 322 : 168;
    return 36 + 70 * Math.exp(-Math.pow(d / sigma, 2));
  };
  const trunkX = (y: number) => {
    const u = clamp((tBot - y) / (tBot - tTop), 0, 1);
    const enveloppe = Math.sin(u * Math.PI);
    return (
      CENTRE_ARBRE.x +
      (Math.sin(u * 3.2 + 0.5) * 9 + Math.sin(u * 1.6 + 0.25) * 26) * enveloppe
    );
  };
  const troncPts: PointLunaire[] = [];
  for (let i = 0; i <= 54; i++) {
    const y = tBot + (tTop - tBot) * (i / 54);
    troncPts.push({ x: trunkX(y), y, w: trunkW(y) });
  }
  statiques.push({ pts: troncPts, kind: "trunk", stries: stries(13) });

  // Racines : port littéral de l'éventail elliptique et de ses raccords concaves.
  const RX = 596;
  const RY = 980;
  const origine = { x: CENTRE_ARBRE.x, y: CENTRE_ARBRE.solY - 16 };
  const distanceNormalisee = (x: number, y: number) =>
    Math.hypot((x - origine.x) / RX, (y - origine.y) / RY);
  const pousserRacine = (x: number, y: number, angle: number, w: number, profondeur: number, span: number, colle: boolean): void => {
    const reste =
      (1 - distanceNormalisee(x, y)) * (RX * Math.abs(Math.cos(angle)) + RY * Math.abs(Math.sin(angle)));
    if (reste < 44 || w < 2.4 || profondeur > 5) return;
    const longueur = Math.min(reste, 104 + rng() * 74);
    const a1 = angle + (rng() - 0.5) * 0.16;
    const courbe = (rng() - 0.5) * 0.9;
    const ex = x + Math.cos(a1) * longueur;
    const ey = y + Math.sin(a1) * longueur;
    const mx = colle
      ? x + (ex - x) * 0.12
      : x + Math.cos(angle) * longueur * 0.5 - Math.sin(angle) * longueur * 0.16 * courbe;
    const my = colle
      ? y + Math.max(Math.abs(ey - y) * 0.7, longueur * 0.46)
      : y + Math.sin(angle) * longueur * 0.5 + Math.cos(angle) * longueur * 0.16 * courbe;
    const boutW = Math.max(1.8, w * (profondeur === 0 ? 0.66 : 0.8));
    const segment = limb(x, y, mx, my, ex, ey, w, boutW, "root", 1.46);
    statiques.push(segment);
    const pointe = segment.pts.at(-1)!;
    const enfants = profondeur < 4 && rng() < 0.86 ? 2 : 1;
    if (enfants > 1 || profondeur < 3) {
      joints.push({ x: pointe.x, y: pointe.y, r: Math.max(7, boutW * 1.35), kind: "root" });
    }
    for (let i = 0; i < enfants; i++) {
      const direction = enfants === 1 ? (rng() - 0.5) * 0.5 : i ? 1 : -1;
      pousserRacine(
        pointe.x,
        pointe.y,
        a1 + direction * span * (0.42 + rng() * 0.6),
        boutW * (enfants === 1 ? 0.95 : 0.8),
        profondeur + 1,
        span * 0.64,
        false,
      );
    }
  };
  for (const signe of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const u = clamp((i + (rng() - 0.5) * 0.5) / 6, 0, 1);
      const y = CENTRE_ARBRE.solY - 76 + u * 232;
      const w = trunkW(y);
      const x = trunkX(y);
      const base = 0.16 + u * 1.2;
      pousserRacine(
        x + signe * w * 0.4,
        y,
        signe > 0 ? base : Math.PI - base,
        w * (0.3 + 0.16 * u) * (0.85 + rng() * 0.3),
        0,
        0.5,
        true,
      );
    }
  }
  pousserRacine(trunkX(tBot), tBot - 8, Math.PI / 2, trunkW(tBot) * 0.86, 0, 0.42, false);

  // Charpente permanente et fenêtre centrale en cœur.
  statiques.push(limb(FOURCHE.x, FOURCHE.y, FOURCHE.x - 52, FOURCHE.y - 96, HUB_GAUCHE.x, HUB_GAUCHE.y, 52, 31, "leader", 1.3));
  statiques.push(limb(FOURCHE.x, FOURCHE.y, FOURCHE.x + 52, FOURCHE.y - 96, HUB_DROIT.x, HUB_DROIT.y, 52, 31, "leader", 1.3));
  statiques.push(limb(FOURCHE.x, FOURCHE.y, FOURCHE.x, FOURCHE.y - 130, HUB_CENTRE.x, HUB_CENTRE.y, 45, 31, "leader", 1.3));
  joints.push({ x: FOURCHE.x, y: FOURCHE.y, r: 56, kind: "leader" });

  const pousserRameau = (
    sortie: SegmentMutable[],
    x: number,
    y: number,
    angle: number,
    longueur: number,
    w: number,
    profondeur: number,
    u0: number,
  ): void => {
    const a1 = angle + (rng() - 0.5) * 0.4;
    const mx = x + Math.cos(angle) * longueur * 0.5;
    const my = y + Math.sin(angle) * longueur * 0.5;
    const ex = x + Math.cos(a1) * longueur;
    const ey = y + Math.sin(a1) * longueur;
    const segment = limb(x, y, mx, my, ex, ey, w, Math.max(2.4, w * 0.6), "twig", 1.3);
    segment.u0 = u0;
    sortie.push(segment);
    if (profondeur >= 2 || w < 5) return;
    const pointe = segment.pts.at(-1)!;
    for (let i = 0; i < 2; i++) {
      const nouvelAngle = a1 + (i - 0.5) * (0.5 + rng() * 0.42) + (rng() - 0.5) * 0.2;
      pousserRameau(
        sortie,
        pointe.x,
        pointe.y,
        nouvelAngle,
        longueur * (0.68 + rng() * 0.16),
        Math.max(2.4, w * 0.6) * 0.94,
        profondeur + 1,
        Math.min(1, u0 + 0.12),
      );
    }
  };

  // Même avec 0 à 12 branches réelles, on déroule les treize routes du handoff en mémoire : l'état
  // du RNG au départ des feuilles reste ainsi exactement celui du prototype et ne dépend pas du
  // nombre courant de branches. Les géométries factices ne quittent jamais cette fonction.
  const nombreAConstruire = Math.max(BULBES_CANONIQUES.length, branchesOrdonnees.length);
  const bulbes: BulbeLunaire[] = [...BULBES_CANONIQUES];
  while (bulbes.length < nombreAConstruire) bulbes.push(bulbeSupplementaire(bulbes.length, bulbes));

  let etatRngFeuillesCanoniques = rng.etat();

  const construites: Omit<BranchePlacee, "ecartVoisin">[] = Array.from(
    { length: nombreAConstruire },
    (_, rang) => {
      const branche: BrancheProjetee = branchesOrdonnees[rang] ?? {
        id: `__construction-canonique-${rang}`,
        etat: "naissance",
        intensite: 0,
        extraitSourceId: `__construction-canonique-${rang}`,
      };
      const bulbe = bulbes[rang];
      const hub =
        rang < ROUTES_CANONIQUES.length
          ? ROUTES_CANONIQUES[rang].hub
          : hubLePlusProche(bulbe);
      const dx = bulbe.x - hub.x;
      const dy = bulbe.y - hub.y;
      const distance = Math.hypot(dx, dy) || 1;
      const px = -dy / distance;
      const py = dx / distance;
      const courbe = (rng() - 0.5) * 0.5 * distance;
      const mx = (hub.x + bulbe.x) / 2 + px * courbe * 0.4;
      const my = (hub.y + bulbe.y) / 2 + py * courbe * 0.4 - 14;
      const niveau = Math.max(0, Math.floor((rang - 13) / 13));
      const w0 = rang < 13 ? 24 : Math.max(12, 19 - niveau);
      const principale = limb(
        hub.x,
        hub.y,
        mx,
        my,
        bulbe.x + (rng() - 0.5) * 24,
        bulbe.y + (rng() - 0.5) * 20,
        w0,
        rang < 13 ? 6.5 : 4.8,
        "branch",
        1.34,
      );
      const rameaux: SegmentMutable[] = [];
      const nombreRameaux =
        rang < 13 ? 2 + (rng() < 0.5 ? 1 : 0) : 1 + (rng() < 0.66 ? 1 : 0);
      for (let k = 0; k < nombreRameaux; k++) {
        const index = Math.floor(principale.pts.length * (0.48 + rng() * 0.48));
        const point = principale.pts[Math.min(principale.pts.length - 1, index)];
        const angle =
          Math.atan2(bulbe.y - point.y, bulbe.x - point.x) + (rng() - 0.5) * 1.35;
        pousserRameau(
          rameaux,
          point.x,
          point.y,
          angle,
          bulbe.r * (0.4 + rng() * 0.42),
          Math.min(point.w * 0.8, rang < 13 ? 10.5 : 8),
          0,
          index / (principale.pts.length - 1),
        );
      }
      // Le handoff fixe l'ancre à 14 %. Les rangs supplémentaires étagent légèrement leur ancre afin
      // de ne pas superposer des dizaines de cibles autour des trois hubs historiques.
      const fractionAccroche = rang < 13 ? 0.14 : Math.min(0.42, 0.2 + niveau * 0.035);
      const indexAccroche = Math.max(
        1,
        Math.floor(principale.pts.length * fractionAccroche),
      );
      const accroche = principale.pts[indexAccroche];
      if (rang === BULBES_CANONIQUES.length - 1) etatRngFeuillesCanoniques = rng.etat();
      return {
        branche,
        rang,
        x: bulbe.x,
        y: bulbe.y,
        bulbe,
        accroche: { x: accroche.x, y: accroche.y },
        fourche: hub,
        principale,
        rameaux,
      };
    },
  );
  const sansEcart = construites.slice(0, branchesOrdonnees.length);

  const placees: BranchePlacee[] = sansEcart.map((placee, i) => {
    let ecartVoisin = Infinity;
    for (let j = 0; j < sansEcart.length; j++) {
      if (i === j) continue;
      ecartVoisin = Math.min(
        ecartVoisin,
        Math.hypot(
          placee.accroche.x - sansEcart[j].accroche.x,
          placee.accroche.y - sansEcart[j].accroche.y,
        ),
      );
    }
    return { ...placee, ecartVoisin };
  });

  return { statiques, joints, branches: placees, etatRngFeuillesCanoniques };
}

export function placerBranches(branches: readonly BrancheProjetee[]): BranchePlacee[] {
  return [...construireGeometrieLunaire(branches).branches];
}
