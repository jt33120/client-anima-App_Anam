import { intensiteBornee, type BrancheProjetee } from "@/lib/scene";
import tokens from "@/design/tokens.json";
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

const MATIERE = tokens.arbre;

/** Palette du jardin, issue de la même source que les surfaces et les commandes DOM. */
export const PALETTE_LUNAIRE = {
  ciel: tokens.shared["carnet-jardin"],
  tronc: MATIERE.bois,
  branche: MATIERE.boisClair,
  feuillage: MATIERE.feuilleCiel,
  lueur: MATIERE.nacre,
  accroche: MATIERE.feuilleCiel,
} as const;

export const COUCHES_LUNAIRES = ["base", "wood", "leaf", "glow"] as const;

export function contenuEtapeLunaire(nombreBranches: number): {
  readonly graine: true;
  readonly arbre: boolean;
} {
  return { graine: true, arbre: nombreBranches > 0 };
}

/**
 * Résolution bornée : le canevas logique est peint à 0,7 pixel par unité, sans multiplier le DPR.
 */
export const ECHELLE_HANDOFF = 0.7;
const composantesHex = (hex: string): readonly [number, number, number] => {
  const valeur = Number.parseInt(hex.slice(1), 16);
  return [(valeur >> 16) & 255, (valeur >> 8) & 255, valeur & 255];
};
const NACRE = composantesHex(PALETTE_LUNAIRE.lueur).join(",");
const ACCROCHE = composantesHex(PALETTE_LUNAIRE.accroche).join(",");
const alpha = (couleur: string, opacite: number) => `rgba(${composantesHex(couleur).join(",")},${opacite})`;
const melanger = (a: string, b: string, proportion: number) => {
  const debut = composantesHex(a);
  const fin = composantesHex(b);
  return `rgb(${debut.map((c, i) => Math.round(c + (fin[i] - c) * proportion)).join(",")})`;
};
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

/** L'illumination est déclarée par la personne ; une feuillaison complète ne la déduit jamais. */
export function rayonnementDeBranche(branche: BrancheProjetee): boolean {
  return branche.etat === "rayonnement";
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

type FormeFeuille = { L: number; W: number; courbe: number; couleur: string };

function genererFeuillesLunaires(
  branche: BranchePlacee,
  rng: GenerateurAleatoireLunaire,
): readonly FeuilleLunaire[] {
  const bulbe = branche.bulbe;
  const supports = branche.rameaux.length ? branche.rameaux : [branche.principale];
  const nombre = Math.min(520, Math.round(bulbe.r * bulbe.r * 0.0065));
  const feuilles: FeuilleLunaire[] = [];
  for (let i = 0; i < nombre; i++) {
    // Chaque pétiole part d'une ramille réelle. Les touffes suivent les fourches et laissent des
    // trouées, au lieu de remplir des disques sans relation avec la structure du bois.
    const support = supports[Math.floor(rng() * supports.length)];
    const progression = 0.24 + Math.pow(rng(), 0.68) * 0.76;
    const index = Math.min(support.pts.length - 2, Math.floor(progression * (support.pts.length - 1)));
    const point = support.pts[index];
    const suivant = support.pts[index + 1];
    const direction = Math.atan2(suivant.y - point.y, suivant.x - point.x);
    const cote = i % 2 ? 1 : -1;
    const petiole = 2 + rng() * 14;
    const x = point.x - Math.sin(direction) * petiole * cote;
    const y = point.y + Math.cos(direction) * petiole * cote;
    const rotation = direction + Math.PI / 2 + cote * (0.45 + rng() * 0.65);
    const hauteurLocale = clamp((bulbe.y - y) / bulbe.r + 0.5, 0, 1);
    const ton = clamp(0.27 + 0.3 * hauteurLocale + progression * 0.17 + (rng() - 0.5) * 0.35, 0, 1);
    feuilles.push({
      x,
      y,
      rotation,
      u: clamp(0.04 + (support.u0 ?? 0.5) * 0.62 + progression * 0.22, 0, 0.92),
      echelle: (0.65 + Math.pow(rng(), 1.2) * 0.82) * clamp(bulbe.r / 210, 0.7, 1.3),
      forme: rng() < 0.07 ? 5 : Math.floor(rng() * 5),
      ton: clamp(Math.floor(ton * 5), 0, 4),
    });
  }
  return feuilles;
}

/**
 * Conserve un flux partagé pour les treize routes fixes. Les extensions ont
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
 * Le moteur est volontairement muet : il reçoit une géométrie
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
  private readonly echelle: number;

  /** Le portail peut demander une résolution inférieure à celle du jardin agrandissable. */
  constructor(canvas: HTMLCanvasElement, echelle: number = ECHELLE_HANDOFF) {
    this.canvas = canvas;
    this.echelle = echelle;
  }

  private creerCouche(): Couche | null {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(CANEVAS.largeur * this.echelle);
    canvas.height = Math.ceil(CANEVAS.hauteur * this.echelle);
    const contexte = contexte2d(canvas);
    if (!contexte) return null;
    contexte.scale(this.echelle, this.echelle);
    return { canvas, contexte };
  }

  private initialiser(): boolean {
    if (this.initialise) return Boolean(this.contexte && this.couches);
    this.initialise = true;
    this.canvas.width = Math.ceil(CANEVAS.largeur * this.echelle);
    this.canvas.height = Math.ceil(CANEVAS.hauteur * this.echelle);
    const contexte = contexte2d(this.canvas);
    if (!contexte) return false;
    contexte.scale(this.echelle, this.echelle);

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
    const charpente = [...new Set(geometrie.branches.map(({ fourche }) => `${fourche.x}:${fourche.y}`))].sort().join("|");
    const etape = `${troncEnReserve ? "reserve" : "plein"}:${contenu.arbre ? "arbre" : "graine"}:${charpente}`;
    let compositionSale = false;
    if (this.etapePeinte !== etape) {
      this.peindreBase(geometrie, troncEnReserve, contenu.arbre);
      this.etapePeinte = etape;
      compositionSale = true;
    }
    const signatureDynamique = geometrie.branches
      .map(({ rang, branche }) => `${rang}:${lumiereDeBranche(branche)}:${rayonnementDeBranche(branche)}`)
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

  private tons() {
    return { hi: MATIERE.boisClair, mid: MATIERE.bois, lo: MATIERE.boisOmbre };
  }

  private teinteFeuille(lumiere: number, couleur: string): string {
    return melanger(MATIERE.feuilleOmbre, couleur, 0.16 + clamp(lumiere, 0, 1) * 0.84);
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
    const tons = this.tons();

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
      gradient.addColorStop(0.24, tons.hi);
      gradient.addColorStop(0.5, tons.mid);
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
      contexte.strokeStyle = alpha(MATIERE.nacre, 0.13);
      contexte.lineWidth = Math.max(0.6, largeurMoyenne * 0.032);
      tracerLigne(0.6, coteEclaire);
      contexte.strokeStyle = alpha(MATIERE.boisOmbre, 0.24);
      contexte.lineWidth = Math.max(0.6, largeurMoyenne * 0.055);
      tracerLigne(0.58, -coteEclaire);
    }

    if (segment.stries && matiere >= 1) {
      for (const strie of segment.stries) {
        contexte.strokeStyle =
          strie.tone > 0
            ? alpha(MATIERE.nacre, strie.al)
            : alpha(MATIERE.boisOmbre, strie.al + 0.04);
        contexte.lineWidth = Math.max(0.45, largeurMoyenne * strie.wf);
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
    contexte.strokeStyle = alpha(MATIERE.boisClair, 0.66);
    contexte.lineWidth = 2;
    contexte.lineCap = "round";
    contexte.lineJoin = "round";
    contexte.beginPath();
    segment.pts.forEach((point, i) => (i ? contexte.lineTo(point.x, point.y) : contexte.moveTo(point.x, point.y)));
    contexte.stroke();
  }

  private peindreJoint(contexte: CanvasRenderingContext2D, joint: JointLunaire): void {
    const r = Math.max(3, joint.r * 0.58);
    const gradient = contexte.createRadialGradient(
      joint.x + this.lumiere.x * r * 0.4,
      joint.y + this.lumiere.y * r * 0.4,
      r * 0.06,
      joint.x,
      joint.y,
      r,
    );
    gradient.addColorStop(0, alpha(MATIERE.boisClair, 0.18));
    gradient.addColorStop(0.42, alpha(MATIERE.boisOmbre, 0.24));
    gradient.addColorStop(1, alpha(MATIERE.boisOmbre, 0));
    contexte.fillStyle = gradient;
    contexte.beginPath();
    contexte.arc(joint.x, joint.y, r, 0, Math.PI * 2);
    contexte.fill();

    // Une ombre locale raccorde les fourches sans les cercler.
    const ox = joint.x - this.lumiere.x * r * 0.46;
    const oy = joint.y - this.lumiere.y * r * 0.46;
    const ombre = contexte.createRadialGradient(ox, oy, 0, ox, oy, r * 0.86);
    ombre.addColorStop(0, alpha(MATIERE.boisOmbre, 0.18));
    ombre.addColorStop(1, alpha(MATIERE.boisOmbre, 0));
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
    gradient.addColorStop(0.28, MATIERE.boisClair);
    gradient.addColorStop(1, PALETTE_LUNAIRE.tronc);
    contexte.fillStyle = gradient;
    contexte.beginPath();
    contexte.ellipse(CENTRE_ARBRE.x, y, 24, 31, -0.18, 0, Math.PI * 2);
    contexte.fill();
    contexte.strokeStyle = alpha(MATIERE.nacre, 0.28);
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
      ombre.addColorStop(0, alpha(PALETTE_LUNAIRE.ciel, 0.56));
      ombre.addColorStop(1, alpha(PALETTE_LUNAIRE.ciel, 0));
      contexte.fillStyle = ombre;
      contexte.beginPath();
      contexte.arc(0, 0, 330, 0, Math.PI * 2);
      contexte.fill();
      contexte.restore();

      const ordre: Record<SorteBoisLunaire, number> = { root: 0, trunk: 1, leader: 2, branch: 3, twig: 4 };
      for (const segment of [...geometrie.statiques].sort((a, b) => ordre[a.kind] - ordre[b.kind])) {
        if (segment.kind === "leader") {
          const pointe = segment.pts.at(-1)!;
          const porteUneBranche = geometrie.branches.some(({ fourche }) => fourche.x === pointe.x && fourche.y === pointe.y);
          if (!porteUneBranche) continue;
        }
        if (segment.kind === "root") {
          const profondeur = (segment.pts[0].y - CENTRE_ARBRE.solY) / 490;
          contexte.globalAlpha = 0.76 * (1 - clamp(profondeur, 0, 1) * 0.7);
        }
        this.peindreSegment(contexte, segment, 1, reserve ? 0.55 : 1);
        contexte.globalAlpha = 1;
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
      { L: 37, W: 0.3, courbe: 0.08, couleur: MATIERE.feuilleCiel },
      { L: 42, W: 0.35, courbe: -0.14, couleur: MATIERE.feuilleLavande },
      { L: 34, W: 0.42, courbe: 0.16, couleur: MATIERE.feuilleCiel },
      { L: 40, W: 0.28, courbe: -0.06, couleur: MATIERE.feuilleCiel },
      { L: 33, W: 0.46, courbe: -0.09, couleur: MATIERE.feuilleLavande },
      { L: 35, W: 0.38, courbe: 0.12, couleur: MATIERE.feuilleRose },
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
    canvas.width = Math.ceil(largeur * this.echelle);
    canvas.height = Math.ceil(hauteur * this.echelle);
    const contexte = contexte2d(canvas);
    const baseX = largeur / 2 - forme.courbe * longueur * 0.5;
    const baseY = hauteur - marge;
    if (!contexte) return { canvas, baseX, baseY, largeur, hauteur };
    contexte.scale(this.echelle, this.echelle);
    const pointeX = largeur / 2 + forme.courbe * longueur * 0.5;
    const pointeY = marge;
    const milieuX = (baseX + pointeX) / 2;
    const milieuY = (baseY + pointeY) / 2;
    const gradient = contexte.createLinearGradient(baseX, baseY, pointeX, pointeY);
    gradient.addColorStop(0, this.teinteFeuille(clamp(lumiere - 0.28, 0, 1), forme.couleur));
    gradient.addColorStop(0.48, this.teinteFeuille(lumiere, forme.couleur));
    gradient.addColorStop(1, this.teinteFeuille(clamp(lumiere + 0.12, 0, 1), forme.couleur));
    contexte.fillStyle = gradient;
    contexte.beginPath();
    contexte.moveTo(baseX, baseY);
    contexte.quadraticCurveTo(milieuX + largeurMax, milieuY, pointeX, pointeY);
    contexte.quadraticCurveTo(milieuX - largeurMax, milieuY, baseX, baseY);
    contexte.closePath();
    contexte.fill();
    contexte.strokeStyle = alpha(lumiere > 0.5 ? MATIERE.nacre : MATIERE.feuilleOmbre, 0.23);
    contexte.lineWidth = Math.max(0.6, longueur * 0.018);
    contexte.lineCap = "round";
    contexte.beginPath();
    contexte.moveTo(baseX, baseY);
    contexte.quadraticCurveTo(milieuX, milieuY, pointeX, pointeY);
    contexte.stroke();
    // Nervures secondaires fines, cuites une fois dans les trente sprites réutilisables.
    contexte.strokeStyle = alpha(MATIERE.nacre, 0.11);
    contexte.lineWidth = 0.55;
    for (let i = 1; i <= 3; i++) {
      const u = i / 4;
      const x = baseX + (pointeX - baseX) * u;
      const y = baseY + (pointeY - baseY) * u;
      for (const cote of [-1, 1]) {
        contexte.beginPath();
        contexte.moveTo(x, y);
        contexte.quadraticCurveTo(x + cote * largeurMax * 0.3, y - longueur * 0.06, x + cote * largeurMax * Math.sin(Math.PI * u) * 0.65, y - longueur * 0.11);
        contexte.stroke();
      }
    }
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
      [0.95, alpha(MATIERE.feuilleLavande, 0.1 * force), 3, 20],
      [0.4, alpha(MATIERE.feuilleCiel, 0.15 * force), 1.8, 10],
      [0.14, alpha(MATIERE.nacre, 0.3 * force), 0.7, 3],
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
      const ton = clamp(feuille.ton + Math.round(etat * 0.75), 0, 4);
      const sprite = this.sprites[feuille.forme]?.[ton];
      if (!sprite) continue;
      const echelle = feuille.echelle * (0.36 + 0.64 * apparition);
      feuilles.save();
      feuilles.globalAlpha = apparition * (0.76 + feuille.ton * 0.05);
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

    if (!rayonnementDeBranche(branche.branche)) return;

    lueur.save();
    lueur.globalCompositeOperation = "lighter";
    lueur.lineCap = "round";
    this.lueurLeLong(lueur, branche.principale.pts, etat, 0.7);
    for (const rameau of branche.rameaux) {
      const fraction = clamp((etat - (rameau.u0 ?? 0)) / 0.22, 0, 1);
      if (fraction > 0.02) this.lueurLeLong(lueur, rameau.pts, fraction, 0.4);
    }
    const bloom = smooth(0.45, 1, etat);
    if (bloom > 0.01) {
      const rayon = branche.bulbe.r * 1.6;
      lueur.globalAlpha = bloom * 0.62;
      const gradient = lueur.createRadialGradient(
        branche.bulbe.x,
        branche.bulbe.y,
        0,
        branche.bulbe.x,
        branche.bulbe.y,
        rayon,
      );
      gradient.addColorStop(0, alpha(MATIERE.feuilleLavande, 0.32));
      gradient.addColorStop(0.55, alpha(MATIERE.feuilleCiel, 0.16));
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
