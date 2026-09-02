import { intensiteBornee, type BrancheProjetee } from "@/lib/scene";
import {
  CANEVAS,
  CENTRE_ARBRE,
  mulberry32Lunaire,
  type BranchePlacee,
  type GenerateurAleatoireLunaire,
  type GeometrieArbreLunaire,
  type JointLunaire,
  type PointLunaire,
  type SegmentLunaire,
  type SorteBoisLunaire,
} from "./geometrie";

/** Valeurs validées par le handoff — aucune couleur de thème ne doit les dériver. */
export const PALETTE_LUNAIRE = {
  ciel: "#0C0A1E",
  tronc: "#6A6690",
  branche: "#9A96BE",
  feuillage: "#8FB6D8",
  lueur: "#CDE4F8",
  accroche: "#8FC1EF",
} as const;

export const COUCHES_LUNAIRES = ["base", "wood", "leaf", "glow"] as const;

export function contenuEtapeLunaire(nombreBranches: number): {
  readonly graine: true;
  readonly arbre: boolean;
} {
  return { graine: true, arbre: nombreBranches > 0 };
}

const DPR_HANDOFF = 0.7;
const composantesHex = (hex: string): readonly [number, number, number] => {
  const valeur = Number.parseInt(hex.slice(1), 16);
  return [(valeur >> 16) & 255, (valeur >> 8) & 255, valeur & 255];
};
const NACRE = composantesHex(PALETTE_LUNAIRE.lueur).join(",");
const ACCROCHE = composantesHex(PALETTE_LUNAIRE.accroche).join(",");
const FEUILLAGE = composantesHex(PALETTE_LUNAIRE.feuillage);
const LUEUR = composantesHex(PALETTE_LUNAIRE.lueur);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (a: number, b: number, x: number) => {
  const u = clamp((x - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};

export function lumiereDeBranche(branche: BrancheProjetee): number {
  if (branche.etat === "naissance") return 0;
  if (branche.etat === "rayonnement") return 1;
  return intensiteBornee(branche.intensite);
}

/** Progression continue de la matière du bois, partagée par le moteur et ses gardes pures. */
export function echelleBoisLunaire(
  lumiere: number,
  largeurDeDepart = 24,
  echelleFinale = 1,
): number {
  // Le trait de naissance fait exactement 2 unités. La première forme pleine démarre donc avec la
  // même largeur à la base, au lieu de sauter brutalement de 2 à 5,76 unités (24 × 0,24).
  const echelleNaissance = Math.min(echelleFinale, 2 / Math.max(2, largeurDeDepart));
  return (
    echelleNaissance +
    (echelleFinale - echelleNaissance) * smooth(0, 0.55, intensiteBornee(lumiere))
  );
}

/** Une feuille devient visible au passage de son seuil propre, sans palier global de canopée. */
export function feuilleVisibleLunaire(position: number, lumiere: number): boolean {
  return position <= intensiteBornee(lumiere);
}

interface Couche {
  readonly canvas: HTMLCanvasElement;
  readonly contexte: CanvasRenderingContext2D;
}

interface PointPeint extends PointLunaire {
  nx: number;
  ny: number;
  dx: number;
  dy: number;
}

export interface FeuilleLunaire {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly u: number;
  readonly echelle: number;
  readonly forme: number;
  readonly ton: number;
}

interface SpriteFeuille {
  readonly canvas: HTMLCanvasElement;
  readonly baseX: number;
  readonly baseY: number;
  readonly largeur: number;
  readonly hauteur: number;
}

type FormeFeuille = { L: number; W: number; courbe: number };

function genererFeuillesLunaires(
  branche: BranchePlacee,
  rng: GenerateurAleatoireLunaire,
): readonly FeuilleLunaire[] {
  const bulbe = branche.bulbe;
  const base = branche.principale.pts[0];
  const portee = Math.hypot(bulbe.x - base.x, bulbe.y - base.y) + bulbe.r;
  const nombre = Math.round(bulbe.r * bulbe.r * 0.011);
  const feuilles: FeuilleLunaire[] = [];
  for (let i = 0; i < nombre; i++) {
    const angle = rng() * 6.2832;
    const rayon = Math.sqrt(rng()) * bulbe.r * 1.04;
    const x = bulbe.x + Math.cos(angle) * rayon;
    const y = bulbe.y + Math.sin(angle) * rayon * 0.92;
    const dx = x - base.x;
    const dy = y - base.y;
    const distance = Math.hypot(dx, dy) || 1;
    const ox = x - bulbe.x;
    const oy = y - bulbe.y;
    const distanceOrigine = Math.hypot(ox, oy) || 1;
    const rotation =
      Math.atan2(
        (dx / distance) * 0.45 + (ox / distanceOrigine) * 0.55,
        -(dy / distance) * 0.45 - (oy / distanceOrigine) * 0.55,
      ) +
      (rng() - 0.5) * 0.7;
    const hauteurLocale = clamp((bulbe.y - y) / bulbe.r + 0.5, 0, 1);
    const bord = clamp(rayon / bulbe.r, 0, 1);
    const ton = clamp(
      0.24 + 0.3 * hauteurLocale + 0.2 * bord + (rng() - 0.5) * 0.28,
      0,
      1,
    );
    feuilles.push({
      x,
      y,
      rotation,
      u: clamp(distance / portee, 0, 1),
      echelle: (0.5 + Math.pow(rng(), 1.4) * 0.95) * (bulbe.r / 118),
      forme: Math.floor(rng() * 6),
      ton: clamp(Math.floor(ton * 5), 0, 4),
    });
  }
  return feuilles;
}

/**
 * Reprend le flux partagé de `buildLeaves()` pour les treize routes officielles. Les extensions ont
 * leur propre flux stable : ajouter une 60e branche ne peut donc jamais déplacer les feuilles nées.
 */
export function construireFeuillesLunaires(
  geometrie: GeometrieArbreLunaire,
): ReadonlyMap<number, readonly FeuilleLunaire[]> {
  const feuilles = new Map<number, readonly FeuilleLunaire[]>();
  const rngCanonique = mulberry32Lunaire(geometrie.etatRngFeuillesCanoniques);
  for (const branche of geometrie.branches) {
    const rng =
      branche.rang < 13
        ? rngCanonique
        : mulberry32Lunaire(23 ^ Math.imul(branche.rang + 1, 0x9e3779b1));
    feuilles.set(branche.rang, genererFeuillesLunaires(branche, rng));
  }
  return feuilles;
}

function contexte2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  try {
    return canvas.getContext("2d");
  } catch {
    // jsdom, navigateur très ancien ou politique de rendu restrictive : le DOM accessible reste actif.
    return null;
  }
}

/**
 * Port de la classe Canvas du handoff. Le moteur est volontairement muet : il reçoit une géométrie
 * déjà associée à la projection et ne déclenche aucun geste. Les quatre bitmaps ne sont repeints que
 * lorsque la projection change ; la composition finale ne fait que quatre drawImage + les accroches.
 */
export class MoteurArbreLunaire {
  private readonly canvas: HTMLCanvasElement;
  private contexte: CanvasRenderingContext2D | null = null;
  private couches: Record<(typeof COUCHES_LUNAIRES)[number], Couche> | null = null;
  private sprites: readonly (readonly SpriteFeuille[])[] = [];
  private feuilles: ReadonlyMap<number, readonly FeuilleLunaire[]> = new Map();
  private signatureGeometrie: string | null = null;
  private signatureDynamique: string | null = null;
  private etapePeinte: string | null = null;
  private initialise = false;
  private readonly lumiere = { x: -0.52, y: -0.85 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  private creerCouche(): Couche | null {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(CANEVAS.largeur * DPR_HANDOFF);
    canvas.height = Math.ceil(CANEVAS.hauteur * DPR_HANDOFF);
    const contexte = contexte2d(canvas);
    if (!contexte) return null;
    contexte.scale(DPR_HANDOFF, DPR_HANDOFF);
    return { canvas, contexte };
  }

  private initialiser(): boolean {
    if (this.initialise) return Boolean(this.contexte && this.couches);
    this.initialise = true;
    this.canvas.width = Math.ceil(CANEVAS.largeur * DPR_HANDOFF);
    this.canvas.height = Math.ceil(CANEVAS.hauteur * DPR_HANDOFF);
    const contexte = contexte2d(this.canvas);
    if (!contexte) return false;
    contexte.scale(DPR_HANDOFF, DPR_HANDOFF);

    const base = this.creerCouche();
    const wood = this.creerCouche();
    const leaf = this.creerCouche();
    const glow = this.creerCouche();
    if (!base || !wood || !leaf || !glow) return false;

    this.contexte = contexte;
    this.couches = { base, wood, leaf, glow };
    this.sprites = this.creerSpritesFeuilles();
    return true;
  }

  mettreAJour(geometrie: GeometrieArbreLunaire, troncEnReserve: boolean): void {
    if (!this.initialiser() || !this.contexte || !this.couches) return;
    const signatureGeometrie = geometrie.branches
      .map(({ rang, bulbe }) => `${rang}:${bulbe.x}:${bulbe.y}:${bulbe.r}`)
      .join("|");
    if (this.signatureGeometrie !== signatureGeometrie) {
      this.feuilles = construireFeuillesLunaires(geometrie);
      this.signatureGeometrie = signatureGeometrie;
      this.signatureDynamique = null;
    }

    const contenu = contenuEtapeLunaire(geometrie.branches.length);
    const etape = `${troncEnReserve ? "reserve" : "plein"}:${contenu.arbre ? "arbre" : "graine"}`;
    let compositionSale = false;
    if (this.etapePeinte !== etape) {
      this.peindreBase(geometrie, troncEnReserve, contenu.arbre);
      this.etapePeinte = etape;
      compositionSale = true;
    }
    const signatureDynamique = geometrie.branches
      .map(({ rang, branche }) => `${rang}:${lumiereDeBranche(branche)}`)
      .join("|");
    if (this.signatureDynamique !== signatureDynamique) {
      this.rebake(geometrie.branches);
      this.signatureDynamique = signatureDynamique;
      compositionSale = true;
    }
    if (compositionSale) this.composer(geometrie.branches);
  }

  private effacer(contexte: CanvasRenderingContext2D): void {
    contexte.clearRect(0, 0, CANEVAS.largeur, CANEVAS.hauteur);
  }

  private tons(kind: SorteBoisLunaire) {
    if (kind === "trunk" || kind === "root") return { hi: "#918DB4", mid: PALETTE_LUNAIRE.tronc, lo: "#4C4870" };
    if (kind === "leader") return { hi: "#A8A4CA", mid: "#837FA9", lo: "#605C88" };
    return { hi: "#C0BDDA", mid: PALETTE_LUNAIRE.branche, lo: "#7A76A0" };
  }

  private teinteFeuille(lumiere: number): string {
    const valeur = clamp(lumiere, 0, 1);
    const paliers = [
      [38, 46, 78],
      [58, 82, 122],
      [98, 136, 178],
      FEUILLAGE,
      LUEUR,
    ];
    const segment = valeur * 4;
    const i = Math.min(3, Math.floor(segment));
    const f = segment - i;
    const a = paliers[i];
    const b = paliers[i + 1];
    return `rgb(${(a[0] + (b[0] - a[0]) * f) | 0},${(a[1] + (b[1] - a[1]) * f) | 0},${(a[2] + (b[2] - a[2]) * f) | 0})`;
  }

  private peindreSegment(
    contexte: CanvasRenderingContext2D,
    segment: SegmentLunaire,
    echelleLargeur: number,
    matiere = 1,
  ): void {
    const source = segment.pts;
    const points: PointPeint[] = source.map((p) => ({
      x: p.x,
      y: p.y,
      w: Math.max(1.1, p.w * echelleLargeur),
      nx: 0,
      ny: 0,
      dx: 0,
      dy: 0,
    }));
    if (points.length < 2) return;

    const gauche: { x: number; y: number }[] = [];
    const droite: { x: number; y: number }[] = [];
    for (let i = 0; i < points.length; i++) {
      const avant = points[Math.max(0, i - 1)];
      const apres = points[Math.min(points.length - 1, i + 1)];
      let dx = apres.x - avant.x;
      let dy = apres.y - avant.y;
      const longueur = Math.hypot(dx, dy) || 1;
      dx /= longueur;
      dy /= longueur;
      const nx = -dy;
      const ny = dx;
      const demi = points[i].w / 2;
      Object.assign(points[i], { nx, ny, dx, dy });
      gauche.push({ x: points[i].x + nx * demi, y: points[i].y + ny * demi });
      droite.push({ x: points[i].x - nx * demi, y: points[i].y - ny * demi });
    }

    const pointe = points.at(-1)!;
    const base = points[0];
    const milieu = points[points.length >> 1];
    const coteEclaire = milieu.nx * this.lumiere.x + milieu.ny * this.lumiere.y > 0 ? 1 : -1;
    const largeurMoyenne = (base.w + pointe.w) / 2;
    const tons = this.tons(segment.kind);

    if (matiere < 1 && (segment.kind === "trunk" || segment.kind === "root")) {
      // Même silhouette et contraste ; seule la richesse de matière (dégradé/stries) reste en réserve.
      contexte.fillStyle = tons.mid;
    } else if (largeurMoyenne >= 5) {
      const gradient = contexte.createLinearGradient(
        milieu.x + milieu.nx * milieu.w * 0.5 * coteEclaire,
        milieu.y + milieu.ny * milieu.w * 0.5 * coteEclaire,
        milieu.x - milieu.nx * milieu.w * 0.5 * coteEclaire,
        milieu.y - milieu.ny * milieu.w * 0.5 * coteEclaire,
      );
      gradient.addColorStop(0, tons.hi);
      gradient.addColorStop(0.42, tons.mid);
      gradient.addColorStop(1, tons.lo);
      contexte.fillStyle = gradient;
    } else {
      contexte.fillStyle = tons.mid;
    }

    contexte.beginPath();
    contexte.moveTo(gauche[0].x, gauche[0].y);
    for (let i = 1; i < gauche.length; i++) contexte.lineTo(gauche[i].x, gauche[i].y);
    contexte.quadraticCurveTo(
      pointe.x + pointe.dx * pointe.w * 0.75,
      pointe.y + pointe.dy * pointe.w * 0.75,
      droite.at(-1)!.x,
      droite.at(-1)!.y,
    );
    for (let i = droite.length - 2; i >= 0; i--) contexte.lineTo(droite[i].x, droite[i].y);
    contexte.quadraticCurveTo(
      base.x - base.dx * base.w * 0.6,
      base.y - base.dy * base.w * 0.6,
      gauche[0].x,
      gauche[0].y,
    );
    contexte.closePath();
    contexte.fill();

    const tracerLigne = (fraction: number, signe: number) => {
      contexte.beginPath();
      for (let i = 0; i < points.length; i++) {
        const decalage = (points[i].w / 2) * fraction;
        const x = points[i].x + points[i].nx * decalage * signe;
        const y = points[i].y + points[i].ny * decalage * signe;
        if (i) contexte.lineTo(x, y);
        else contexte.moveTo(x, y);
      }
      contexte.stroke();
    };

    if (largeurMoyenne >= 5 && matiere >= 1) {
      contexte.lineCap = "round";
      contexte.strokeStyle = "rgba(205,228,248,0.26)";
      contexte.lineWidth = Math.max(0.8, largeurMoyenne * 0.12);
      tracerLigne(0.6, coteEclaire);
      contexte.strokeStyle = "rgba(18,16,42,0.5)";
      contexte.lineWidth = Math.max(0.9, largeurMoyenne * 0.18);
      tracerLigne(0.58, -coteEclaire);
    }

    if (segment.stries && matiere >= 1) {
      for (const strie of segment.stries) {
        contexte.strokeStyle =
          strie.tone > 0
            ? `rgba(190,196,228,${strie.al})`
            : `rgba(20,18,46,${strie.al + 0.05})`;
        contexte.lineWidth = Math.max(0.8, largeurMoyenne * strie.wf);
        contexte.lineCap = "round";
        contexte.beginPath();
        for (let i = 0; i < points.length; i++) {
          const u = i / (points.length - 1);
          const decalage =
            (points[i].w / 2) * 0.85 * (strie.o + Math.sin(u * 4.2 + strie.ph) * 0.11);
          const x = points[i].x + points[i].nx * decalage;
          const y = points[i].y + points[i].ny * decalage;
          if (i) contexte.lineTo(x, y);
          else contexte.moveTo(x, y);
        }
        contexte.stroke();
      }
    }
  }

  private peindreTraitNu(contexte: CanvasRenderingContext2D, segment: SegmentLunaire): void {
    contexte.strokeStyle = "#4C4870";
    contexte.lineWidth = 2;
    contexte.lineCap = "round";
    contexte.lineJoin = "round";
    contexte.beginPath();
    segment.pts.forEach((point, i) => (i ? contexte.lineTo(point.x, point.y) : contexte.moveTo(point.x, point.y)));
    contexte.stroke();
  }

  private peindreJoint(contexte: CanvasRenderingContext2D, joint: JointLunaire): void {
    const r = Math.max(5, joint.r * 0.72);
    const gradient = contexte.createRadialGradient(
      joint.x + this.lumiere.x * r * 0.4,
      joint.y + this.lumiere.y * r * 0.4,
      r * 0.06,
      joint.x,
      joint.y,
      r,
    );
    gradient.addColorStop(0, "rgba(145,141,180,0.5)");
    gradient.addColorStop(0.42, "rgba(76,72,112,0.6)");
    gradient.addColorStop(1, "rgba(30,28,58,0)");
    contexte.fillStyle = gradient;
    contexte.beginPath();
    contexte.arc(joint.x, joint.y, r, 0, Math.PI * 2);
    contexte.fill();

    // Contre-ombre du handoff : elle ferme visuellement le raccord du côté opposé à la lune.
    const ox = joint.x - this.lumiere.x * r * 0.46;
    const oy = joint.y - this.lumiere.y * r * 0.46;
    const ombre = contexte.createRadialGradient(ox, oy, 0, ox, oy, r * 0.86);
    ombre.addColorStop(0, "rgba(10,9,26,0.22)");
    ombre.addColorStop(1, "rgba(10,9,26,0)");
    contexte.fillStyle = ombre;
    contexte.beginPath();
    contexte.arc(ox, oy, r * 0.86, 0, Math.PI * 2);
    contexte.fill();
  }

  /**
   * La graine au pied du tronc — appelée SEULEMENT quand l'arbre est là (voir `peindreBase`). À l'étape 0,
   * la graine est le SVG `GraineAttente` que `ArbreInteractif` superpose au canevas : ses proportions,
   * son inclinaison et ses teintes sont recopiées de cette fonction (viewBox 48, tokens de la palette).
   */
  private peindreGraine(contexte: CanvasRenderingContext2D): void {
    const y = CENTRE_ARBRE.solY + 7;
    const gradient = contexte.createRadialGradient(
      CENTRE_ARBRE.x - 8,
      y - 9,
      2,
      CENTRE_ARBRE.x,
      y,
      32,
    );
    gradient.addColorStop(0, PALETTE_LUNAIRE.lueur);
    gradient.addColorStop(0.28, "#918DB4");
    gradient.addColorStop(1, PALETTE_LUNAIRE.tronc);
    contexte.fillStyle = gradient;
    contexte.beginPath();
    contexte.ellipse(CENTRE_ARBRE.x, y, 24, 31, -0.18, 0, Math.PI * 2);
    contexte.fill();
    contexte.strokeStyle = "rgba(205,228,248,0.38)";
    contexte.lineWidth = 1.4;
    contexte.stroke();
  }

  private peindreBase(
    geometrie: GeometrieArbreLunaire,
    reserve: boolean,
    arbrePresent: boolean,
  ): void {
    if (!this.couches) return;
    const contexte = this.couches.base.contexte;
    this.effacer(contexte);

    if (arbrePresent) {
      contexte.save();
      contexte.translate(CENTRE_ARBRE.x, CENTRE_ARBRE.solY + 10);
      contexte.scale(1, 0.12);
      const ombre = contexte.createRadialGradient(0, 0, 0, 0, 0, 330);
      ombre.addColorStop(0, "rgba(6,5,18,0.5)");
      ombre.addColorStop(1, "rgba(6,5,18,0)");
      contexte.fillStyle = ombre;
      contexte.beginPath();
      contexte.arc(0, 0, 330, 0, Math.PI * 2);
      contexte.fill();
      contexte.restore();

      const ordre: Record<SorteBoisLunaire, number> = { root: 0, trunk: 1, leader: 2, branch: 3, twig: 4 };
      for (const segment of [...geometrie.statiques].sort((a, b) => ordre[a.kind] - ordre[b.kind])) {
        this.peindreSegment(contexte, segment, 1, reserve ? 0.55 : 1);
      }
      for (const joint of geometrie.joints) {
        if (joint.kind === "root" || joint.kind === "leader") this.peindreJoint(contexte, joint);
      }
      // La graine au pied de l'arbre reste dans le bitmap : immobile, elle n'a besoin d'aucune couche.
      this.peindreGraine(contexte);
    }
    // ⚠️ À L'ÉTAPE 0, AUCUNE GRAINE N'EST PEINTE ICI — et ce n'est pas un oubli. La graine « qui n'attend
    // que d'éclore » est désormais le SVG `GraineAttente`, superposé au canevas par `ArbreInteractif`
    // sous la MÊME condition (`branches.length === 0`, celle de `contenuEtapeLunaire`). La peindre aussi
    // dans le bitmap ferait deux graines au même point : une qui respire, une figée dessous. Le canevas
    // de l'étape 0 est donc entièrement transparent ; le ciel de la scène le traverse.
    // (Gardé par tests/rendu/moteur-arbre-lunaire.test.tsx et tests/rendu/graine-integree.test.tsx.)
  }

  private creerSpritesFeuilles(): readonly (readonly SpriteFeuille[])[] {
    const formes: readonly FormeFeuille[] = [
      { L: 44, W: 0.3, courbe: 0.05 },
      { L: 46, W: 0.42, courbe: -0.12 },
      { L: 40, W: 0.52, courbe: 0.14 },
      { L: 48, W: 0.34, courbe: 0 },
      { L: 38, W: 0.6, courbe: -0.07 },
      { L: 42, W: 0.46, courbe: 0.1 },
    ];
    const tons = [0.18, 0.36, 0.55, 0.76, 0.95];
    return formes.map((forme) => tons.map((ton) => this.creerSpriteFeuille(forme, ton)));
  }

  private creerSpriteFeuille(forme: FormeFeuille, lumiere: number): SpriteFeuille {
    const longueur = forme.L;
    const largeurMax = longueur * forme.W;
    const marge = 5;
    const largeur = Math.ceil(largeurMax * 2 + marge * 2 + Math.abs(forme.courbe) * longueur);
    const hauteur = Math.ceil(longueur + marge * 2);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(largeur * DPR_HANDOFF);
    canvas.height = Math.ceil(hauteur * DPR_HANDOFF);
    const contexte = contexte2d(canvas);
    const baseX = largeur / 2 - forme.courbe * longueur * 0.5;
    const baseY = hauteur - marge;
    if (!contexte) return { canvas, baseX, baseY, largeur, hauteur };
    contexte.scale(DPR_HANDOFF, DPR_HANDOFF);
    const pointeX = largeur / 2 + forme.courbe * longueur * 0.5;
    const pointeY = marge;
    const milieuX = (baseX + pointeX) / 2;
    const milieuY = (baseY + pointeY) / 2;
    const gradient = contexte.createLinearGradient(baseX, baseY, pointeX, pointeY);
    gradient.addColorStop(0, this.teinteFeuille(clamp(lumiere - 0.2, 0, 1)));
    gradient.addColorStop(0.45, this.teinteFeuille(lumiere));
    gradient.addColorStop(1, this.teinteFeuille(clamp(lumiere - 0.05, 0, 1)));
    contexte.fillStyle = gradient;
    contexte.beginPath();
    contexte.moveTo(baseX, baseY);
    contexte.quadraticCurveTo(milieuX + largeurMax, milieuY, pointeX, pointeY);
    contexte.quadraticCurveTo(milieuX - largeurMax, milieuY, baseX, baseY);
    contexte.closePath();
    contexte.fill();
    contexte.strokeStyle = lumiere > 0.5 ? "rgba(205,228,248,0.4)" : "rgba(20,18,44,0.4)";
    contexte.lineWidth = Math.max(0.8, longueur * 0.022);
    contexte.lineCap = "round";
    contexte.beginPath();
    contexte.moveTo(baseX, baseY);
    contexte.quadraticCurveTo(milieuX, milieuY, pointeX, pointeY);
    contexte.stroke();
    return { canvas, baseX, baseY, largeur, hauteur };
  }

  private lueurLeLong(
    contexte: CanvasRenderingContext2D,
    points: readonly PointLunaire[],
    fraction: number,
    force: number,
  ): void {
    if (fraction <= 0.002) return;
    const dernier = (points.length - 1) * clamp(fraction, 0, 1);
    const index = Math.floor(dernier);
    const reste = dernier - index;
    const sousPoints: PointLunaire[] = points.slice(0, index + 1);
    if (reste > 0.02 && index < points.length - 1) {
      const a = points[index];
      const b = points[index + 1];
      sousPoints.push({
        x: a.x + (b.x - a.x) * reste,
        y: a.y + (b.y - a.y) * reste,
        w: a.w + (b.w - a.w) * reste,
      });
    }
    if (sousPoints.length < 2) return;
    const passes: readonly [number, string, number, number][] = [
      [0.95, `rgba(120,160,215,${0.1 * force})`, 3, 26],
      [0.4, `rgba(160,196,232,${0.16 * force})`, 1.8, 13],
      [0.14, `rgba(${NACRE},${0.42 * force})`, 1, 4.4],
    ];
    for (const [facteur, couleur, min, max] of passes) {
      contexte.strokeStyle = couleur;
      for (let i = 1; i < sousPoints.length; i++) {
        const u = i / (sousPoints.length - 1);
        contexte.globalAlpha = 0.35 + 0.65 * smooth(0, 0.55, u < 0.9 ? 1 : (1 - u) / 0.1);
        contexte.lineWidth = Math.min(
          max,
          Math.max(min, ((sousPoints[i - 1].w + sousPoints[i].w) * 0.5) * facteur),
        );
        contexte.beginPath();
        contexte.moveTo(sousPoints[i - 1].x, sousPoints[i - 1].y);
        contexte.lineTo(sousPoints[i].x, sousPoints[i].y);
        contexte.stroke();
      }
    }
    contexte.globalAlpha = 1;
  }

  private cuireBranche(
    bois: CanvasRenderingContext2D,
    feuilles: CanvasRenderingContext2D,
    lueur: CanvasRenderingContext2D,
    branche: BranchePlacee,
    etat: number,
  ): void {
    if (etat <= 0.001) {
      this.peindreTraitNu(bois, branche.principale);
      branche.rameaux.forEach((rameau) => this.peindreTraitNu(bois, rameau));
      return;
    }

    const largeur = echelleBoisLunaire(etat, branche.principale.pts[0].w);
    this.peindreSegment(bois, branche.principale, largeur);
    for (const rameau of branche.rameaux) {
      if ((rameau.u0 ?? 0) <= etat + 0.06) {
        this.peindreSegment(
          bois,
          rameau,
          echelleBoisLunaire(etat, rameau.pts[0].w, 0.94),
        );
      } else this.peindreTraitNu(bois, rameau);
    }

    for (const feuille of this.feuilles.get(branche.rang) ?? []) {
      if (!feuilleVisibleLunaire(feuille.u, etat)) continue;
      const apparition = clamp((etat - feuille.u) / 0.16, 0, 1);
      const ton = clamp(feuille.ton + Math.round(etat * 1.5), 0, 4);
      const sprite = this.sprites[feuille.forme]?.[ton];
      if (!sprite) continue;
      const echelle = feuille.echelle * (0.36 + 0.64 * apparition);
      feuilles.save();
      feuilles.globalAlpha = apparition;
      feuilles.translate(feuille.x, feuille.y);
      feuilles.rotate(feuille.rotation);
      feuilles.scale(echelle, echelle);
      feuilles.drawImage(
        sprite.canvas,
        -sprite.baseX,
        -sprite.baseY,
        sprite.largeur,
        sprite.hauteur,
      );
      feuilles.restore();
    }

    lueur.save();
    lueur.globalCompositeOperation = "lighter";
    lueur.lineCap = "round";
    this.lueurLeLong(lueur, branche.principale.pts, etat, 1);
    for (const rameau of branche.rameaux) {
      const fraction = clamp((etat - (rameau.u0 ?? 0)) / 0.22, 0, 1);
      if (fraction > 0.02) this.lueurLeLong(lueur, rameau.pts, fraction, 0.7);
    }
    const bloom = smooth(0.45, 1, etat);
    if (bloom > 0.01) {
      const rayon = branche.bulbe.r * 1.5;
      lueur.globalAlpha = bloom * 0.3;
      const gradient = lueur.createRadialGradient(
        branche.bulbe.x,
        branche.bulbe.y,
        0,
        branche.bulbe.x,
        branche.bulbe.y,
        rayon,
      );
      gradient.addColorStop(0, `rgba(${NACRE},0.5)`);
      gradient.addColorStop(0.55, `rgba(${NACRE},0.16)`);
      gradient.addColorStop(1, `rgba(${NACRE},0)`);
      lueur.fillStyle = gradient;
      lueur.beginPath();
      lueur.arc(branche.bulbe.x, branche.bulbe.y, rayon, 0, Math.PI * 2);
      lueur.fill();
    }
    lueur.restore();
  }

  private rebake(branches: readonly BranchePlacee[]): void {
    if (!this.couches) return;
    const bois = this.couches.wood.contexte;
    const feuilles = this.couches.leaf.contexte;
    const lueur = this.couches.glow.contexte;
    this.effacer(bois);
    this.effacer(feuilles);
    this.effacer(lueur);
    for (const branche of branches) {
      this.cuireBranche(bois, feuilles, lueur, branche, lumiereDeBranche(branche.branche));
    }
  }

  private dessinerAccroche(contexte: CanvasRenderingContext2D, point: { x: number; y: number }): void {
    contexte.save();
    contexte.globalCompositeOperation = "lighter";
    const rayon = 30;
    const gradient = contexte.createRadialGradient(point.x, point.y, 0, point.x, point.y, rayon);
    gradient.addColorStop(0, `rgba(${NACRE},0.44)`);
    gradient.addColorStop(0.4, `rgba(${ACCROCHE},0.2)`);
    gradient.addColorStop(1, `rgba(${ACCROCHE},0)`);
    contexte.fillStyle = gradient;
    contexte.beginPath();
    contexte.arc(point.x, point.y, rayon, 0, Math.PI * 2);
    contexte.fill();
    contexte.fillStyle = PALETTE_LUNAIRE.accroche;
    contexte.beginPath();
    contexte.arc(point.x, point.y, 7, 0, Math.PI * 2);
    contexte.fill();
    contexte.fillStyle = `rgba(${NACRE},0.9)`;
    contexte.beginPath();
    contexte.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
    contexte.fill();
    contexte.restore();
  }

  private composer(branches: readonly BranchePlacee[]): void {
    if (!this.contexte || !this.couches) return;
    const contexte = this.contexte;
    this.effacer(contexte);
    for (const nom of COUCHES_LUNAIRES) {
      if (nom === "glow") {
        contexte.save();
        contexte.globalCompositeOperation = "lighter";
      }
      contexte.drawImage(this.couches[nom].canvas, 0, 0, CANEVAS.largeur, CANEVAS.hauteur);
      if (nom === "glow") contexte.restore();
    }
    branches.forEach((branche) => this.dessinerAccroche(contexte, branche.accroche));
  }
}
