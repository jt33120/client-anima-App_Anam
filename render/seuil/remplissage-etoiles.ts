/**
 * remplissage-etoiles — le seuil qui se remplit d'étoiles (module PUR, pas encore intégré).
 *
 * ══ CE QUE ÇA FAIT ═════════════════════════════════════════════════════════════════════════════
 *
 * Des étoiles partent du ciel autour de la silhouette d'Anam et convergent LENTEMENT vers elle,
 * jusqu'à la remplir du bas vers le haut ; puis l'image de l'avatar affleure en fondu dessous.
 * Retour du fondateur : « un effet wow, plénitude et confiance, animation lente ; un asset d'Anam
 * qui se remplit d'étoiles ; un écran de chargement beau et long » — 4 à 6 secondes.
 *
 * ══ POURQUOI UN CANVAS, ET UN SEUL ══════════════════════════════════════════════════════════════
 *
 * La mesure des couches du 2026-08-26 (`e2e/ligne-de-base.json`, « _mesure_des_couches ») a rendu
 * son verdict : QUATRE-VINGTS `<span>` d'étoiles coûtaient 57 des 62 images par seconde du mobile.
 * Cinq cents étoiles en DOM seraient donc un naufrage. Un canvas est UNE couche composée : le
 * navigateur ne repeint qu'un bitmap, quelle que soit la quantité d'étoiles dedans. C'est toute la
 * raison d'être de ce module — et la doctrine ci-dessous en découle :
 *
 *   • boucle `requestAnimationFrame` pilotée par le TEMPS (`performance.now()`, injectable), jamais
 *     par le compte de trames : la durée est la même sur un écran 60 Hz et 120 Hz ;
 *   • la boucle S'ARRÊTE à la fin — zéro coût au repos ; aucun `setInterval` ;
 *   • `cancelAnimationFrame` à l'arrêt, pause quand l'onglet est caché (`visibilitychange`) ;
 *   • DPR plafonné à 2 et surface physique plafonnée (~400×520) : un tampon plus petit est moins
 *     cher à repeindre, c'est ce que la mesure a montré à propos du tampon de l'arbre ;
 *   • un SPRITE d'étoile pré-rendu (dégradé radial sur un petit canvas) dessiné par `drawImage`
 *     à coordonnées entières — jamais `arc` + `shadowBlur`/`filter` par étoile, qui sont les deux
 *     opérations les plus chères du 2D ;
 *   • `globalCompositeOperation = "lighter"` : les étoiles qui se chevauchent s'ADDITIONNENT en
 *     lumière au lieu de se recouvrir, c'est ce qui donne la plénitude ;
 *   • `prefers-reduced-motion: reduce` → AUCUNE boucle : on dessine l'état final une fois. Jamais
 *     `display:none`, jamais rien de vide — la silhouette pleine est l'état de repos légitime ;
 *   • aucun style inline (CSP), aucun `will-change` (le dépôt n'en tolère qu'un, mesuré, dans
 *     `monde.module.css`), aucune requête réseau, aucune dépendance npm.
 *
 * ══ DÉCOUPAGE ═══════════════════════════════════════════════════════════════════════════════════
 *
 * La SIMULATION est pure (positions à l'instant t depuis les cibles, délais, courbe) pour être
 * éprouvée sans canvas réel ; le DESSIN ne fait que projeter ces positions ; l'orchestration
 * (`demarrerRemplissage`) tient la boucle, la pause et l'arrêt. Générateur pseudo-aléatoire et
 * horloge sont injectables : les tests sont reproductibles au pixel.
 */
import { mulberry32Lunaire } from "@/render/arbre/geometrie";

// ── Paramètres (les trois que l'intégrateur règle : durée, densité, taille) ──────────────────────

/** Taille logique (px CSS) de l'asset `public/scene/seuil/anam-seuil.png` — le 1x fait 200×260. */
export const LARGEUR_SEUIL = 200;
export const HAUTEUR_SEUIL = 260;

/** DURÉE. 4,5 s : dans la fourchette « 4 à 6 s » demandée, côté court pour que l'attente reste douce. */
export const DUREE_DEFAUT_MS = 4500;

/**
 * DENSITÉ. Le pas de la grille d'échantillonnage (px logiques) et le plafond d'étoiles. À pas 3
 * sur 200×260, la silhouette offre ~2 000 candidats ; on en garde 500 au hasard — assez pour
 * paraître pleine avec un sprite de 8 px, pas plus que ce qu'un mobile dessine sans peine.
 */
export const PAS_DEFAUT = 3;
export const MAX_ETOILES_DEFAUT = 500;

/** Un pixel compte comme « silhouette » quand son alpha DÉPASSE ce seuil (strictement). */
export const ALPHA_MINIMAL = 128;

/** TAILLE. Plafonds physiques : DPR 2 au plus, et jamais plus que le 2x de l'asset (400×520). */
export const DPR_MAX = 2;
export const PHYSIQUE_MAX = { largeur: 400, hauteur: 520 } as const;

/** Diamètre d'une étoile en px CSS (le sprite est pré-rendu à `diamètre × échelle` px physiques). */
export const DIAMETRE_ETOILE = 8;

/** Part de la durée totale que dure le VOL d'une étoile (le reste est son délai de départ). */
export const PART_VOL = 0.45;

/** Gigue ajoutée au délai (fraction de la plage des délais) : adoucit le front bas→haut. */
export const GIGUE_DELAI = 0.04;

/** L'image de l'avatar affleure en fondu de cet avancement jusqu'à 1. */
export const DEBUT_FONDU_IMAGE = 0.72;

// ── Types ────────────────────────────────────────────────────────────────────────────────────────

export interface OptionsRemplissage {
  /** Durée totale de l'animation (ms). Défaut : `DUREE_DEFAUT_MS`. */
  dureeMs?: number;
  /** Pas de la grille d'échantillonnage (px logiques). Défaut : `PAS_DEFAUT`. */
  pas?: number;
  /** Plafond d'étoiles. Défaut : `MAX_ETOILES_DEFAUT`. */
  maxEtoiles?: number;
  /** Taille logique du canvas (px CSS). Défaut : `clientWidth/Height` du canvas, sinon l'asset 1x. */
  largeur?: number;
  hauteur?: number;
  /** Générateur pseudo-aléatoire dans [0, 1). Défaut : `mulberry32` graine `Date.now()`. */
  aleatoire?: () => number;
  /** Horloge (ms). Défaut : `performance.now()`. */
  maintenant?: () => number;
  /** Force le mode « moins de mouvement ». Défaut : `matchMedia("(prefers-reduced-motion: reduce)")`. */
  reduceMotion?: boolean;
}

/** Le champ d'étoiles préparé : tout ce dont la simulation a besoin, sans canvas. */
export interface ChampEtoiles {
  readonly nombre: number;
  /** Cibles (x, y) par étoile, DANS L'ORDRE D'ARRIVÉE (bas → haut). */
  readonly cibles: Float32Array;
  /** Origines (x, y) par étoile : un point du ciel autour de la silhouette. */
  readonly origines: Float32Array;
  /** Délai de départ par étoile, normalisé dans [0, 1 − PART_VOL]. */
  readonly delais: Float32Array;
}

export interface Remplissage {
  /** Annule la trame en attente et empêche tout dessin ultérieur. Idempotent. */
  arreter: () => void;
  /** Résolue à la fin naturelle de l'animation — ou à `arreter()`, pour ne jamais rester pendante. */
  termine: Promise<void>;
}

/** Cadre « contain » de l'image dans la boîte logique, en px logiques. */
export interface Cadre {
  readonly x: number;
  readonly y: number;
  readonly largeur: number;
  readonly hauteur: number;
}

// ── Outils purs ──────────────────────────────────────────────────────────────────────────────────

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Départ et arrivée en douceur — la lenteur demandée se joue ici, pas dans la durée seule. */
export function easeInOutCubic(t: number): number {
  const u = clamp(t, 0, 1);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

/** Générateur déterministe partagé avec l'arbre (`geometrie.ts`) : même graine, même ciel. */
export function aleatoireDeterministe(graine: number): () => number {
  return mulberry32Lunaire(graine);
}

/**
 * Taille PHYSIQUE du canvas et échelle physique/logique. Le DPR est plafonné à `DPR_MAX`, puis
 * l'échelle est réduite pour que la surface ne dépasse jamais `PHYSIQUE_MAX` — sur un téléphone à
 * DPR 3 affichant la silhouette à 300 px de large, on dessine quand même dans 400×520.
 */
export function tailleCanvas(
  largeur: number,
  hauteur: number,
  dpr: number,
): { readonly largeur: number; readonly hauteur: number; readonly echelle: number } {
  const l = Math.max(1, largeur);
  const h = Math.max(1, hauteur);
  let echelle = clamp(Number.isFinite(dpr) && dpr > 0 ? dpr : 1, 0.5, DPR_MAX);
  echelle = Math.min(echelle, PHYSIQUE_MAX.largeur / l, PHYSIQUE_MAX.hauteur / h);
  return { largeur: Math.round(l * echelle), hauteur: Math.round(h * echelle), echelle };
}

/** Le cadre `object-fit: contain` de l'image dans la boîte — même règle que `.imageAnamImg`. */
export function cadreContenu(
  largeurImage: number,
  hauteurImage: number,
  largeurBoite: number,
  hauteurBoite: number,
): Cadre {
  if (largeurImage <= 0 || hauteurImage <= 0) {
    return { x: 0, y: 0, largeur: largeurBoite, hauteur: hauteurBoite };
  }
  const ratio = Math.min(largeurBoite / largeurImage, hauteurBoite / hauteurImage);
  const largeur = largeurImage * ratio;
  const hauteur = hauteurImage * ratio;
  return { x: (largeurBoite - largeur) / 2, y: (hauteurBoite - hauteur) / 2, largeur, hauteur };
}

// ── Échantillonnage de la silhouette ─────────────────────────────────────────────────────────────

/**
 * Cibles (x, y) des pixels de silhouette, à partir des octets RGBA d'une image `largeur × hauteur`.
 * PURE : c'est elle que les tests éprouvent sans canvas.
 *
 *   1. on parcourt la grille au `pas` donné et on garde les pixels dont l'alpha dépasse
 *      `ALPHA_MINIMAL` — le bord plumeux de l'asset (matte rembg) est ainsi exclu ;
 *   2. on MÉLANGE (Fisher–Yates avec le générateur injecté) puis on tronque à `maxEtoiles` : le
 *      sous-ensemble gardé est uniforme sur toute la silhouette, pas « les premières lignes » ;
 *   3. on TRIE par y décroissant, tri STABLE : l'ordre du tableau devient l'ordre d'arrivée, du bas
 *      vers le haut — et deux cibles de même hauteur restent dans un ordre aléatoire.
 *
 * Le remplissage bas→haut vit ICI, et la simulation s'en remet à l'ordre du tableau.
 */
export function echantillonnerAlpha(
  donnees: Uint8ClampedArray,
  largeur: number,
  hauteur: number,
  pas: number,
  aleatoire: () => number,
  maxEtoiles: number = MAX_ETOILES_DEFAUT,
): Float32Array {
  const p = Math.max(1, Math.floor(pas));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < hauteur; y += p) {
    for (let x = 0; x < largeur; x += p) {
      if (donnees[(y * largeur + x) * 4 + 3] > ALPHA_MINIMAL) {
        xs.push(x);
        ys.push(y);
      }
    }
  }

  // Mélange de Fisher–Yates — sur les INDICES, pour ne déplacer qu'un entier par échange.
  const indices = xs.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1));
    const t = indices[i];
    indices[i] = indices[j];
    indices[j] = t;
  }
  const gardes = indices.slice(0, Math.max(0, Math.floor(maxEtoiles)));

  // Tri stable par y décroissant : le bas de la silhouette d'abord.
  gardes.sort((a, b) => ys[b] - ys[a]);

  const cibles = new Float32Array(gardes.length * 2);
  for (let i = 0; i < gardes.length; i++) {
    cibles[i * 2] = xs[gardes[i]];
    cibles[i * 2 + 1] = ys[gardes[i]];
  }
  return cibles;
}

function contexte2d(
  canvas: HTMLCanvasElement,
  options?: CanvasRenderingContext2DSettings,
): CanvasRenderingContext2D | null {
  try {
    return canvas.getContext("2d", options);
  } catch {
    // jsdom sans le paquet `canvas`, navigateur très ancien ou politique restrictive.
    return null;
  }
}

/**
 * Enveloppe canvas de `echantillonnerAlpha` : dessine l'image dans un tampon hors écran de
 * `largeur × hauteur` px et lit ses pixels. Rend un tableau VIDE (jamais une exception) si le
 * contexte manque ou si la lecture est refusée (canvas souillé) — l'animation dégénère alors en un
 * simple fondu de l'image, ce qui n'est jamais un écran vide.
 */
export function echantillonnerSilhouette(
  image: CanvasImageSource,
  largeur: number,
  hauteur: number,
  pas: number,
  aleatoire: () => number,
  maxEtoiles: number = MAX_ETOILES_DEFAUT,
): Float32Array {
  const l = Math.max(1, Math.round(largeur));
  const h = Math.max(1, Math.round(hauteur));
  if (typeof document === "undefined") return new Float32Array(0);
  const tampon = document.createElement("canvas");
  tampon.width = l;
  tampon.height = h;
  const ctx = contexte2d(tampon, { willReadFrequently: true });
  if (!ctx) return new Float32Array(0);
  try {
    ctx.drawImage(image, 0, 0, l, h);
    const { data } = ctx.getImageData(0, 0, l, h);
    return echantillonnerAlpha(data, l, h, pas, aleatoire, maxEtoiles);
  } catch {
    // image pas encore décodée, ou canvas souillé par une origine étrangère : pas d'étoiles.
    return new Float32Array(0);
  }
}

// ── Simulation (pure) ────────────────────────────────────────────────────────────────────────────

/**
 * Prépare le champ : une origine dans le ciel et un délai de départ par étoile.
 *
 * ORIGINES — un point sur une couronne autour du centre de la boîte, rayon entre 0,75 et 1,25 fois
 * la plus grande dimension : presque toujours HORS du canvas, donc l'étoile ENTRE par un bord. Les
 * angles couvrent surtout le haut (−1,25 π … 0,25 π en repère écran) : c'est du ciel qu'elles
 * viennent, quelques-unes des côtés, presque aucune du sol.
 *
 * DÉLAIS — par RANG dans le tableau (donc bas → haut, cf. `echantillonnerAlpha`), et non par valeur
 * de y : le débit d'étoiles est constant, les jambes étroites se remplissent vite, le torse plus
 * lentement — c'est le rythme d'un liquide qui monte. Une gigue bornée adoucit le front. Le délai
 * maximal vaut exactement 1 − PART_VOL : la dernière étoile arrive à la fin, pas après.
 */
export function preparerChamp(
  cibles: Float32Array,
  largeur: number,
  hauteur: number,
  aleatoire: () => number,
): ChampEtoiles {
  const nombre = cibles.length >> 1;
  const origines = new Float32Array(nombre * 2);
  const delais = new Float32Array(nombre);
  const cx = largeur / 2;
  const cy = hauteur / 2;
  const portee = Math.max(largeur, hauteur);
  for (let i = 0; i < nombre; i++) {
    const angle = -Math.PI / 2 + (aleatoire() - 0.5) * 1.5 * Math.PI;
    const rayon = portee * (0.75 + 0.5 * aleatoire());
    origines[i * 2] = cx + rayon * Math.cos(angle);
    origines[i * 2 + 1] = cy + rayon * Math.sin(angle);
    const rang = nombre > 1 ? i / (nombre - 1) : 0;
    delais[i] = (1 - PART_VOL) * (rang * (1 - GIGUE_DELAI) + aleatoire() * GIGUE_DELAI);
  }
  return { nombre, cibles, origines, delais };
}

/**
 * Positions et opacités à un avancement donné (0 → 1). Écrit dans `sortie` (3 valeurs par étoile :
 * x, y, opacité) et la rend — aucune allocation par trame.
 *
 * Une étoile qui n'est pas encore partie est invisible (opacité 0) ; elle s'allume sur le premier
 * cinquième de son vol ; à l'arrivée elle est EXACTEMENT sur sa cible (la courbe vaut 1 en 1).
 */
export function positionsA(champ: ChampEtoiles, avancement: number, sortie: Float32Array): Float32Array {
  const { nombre, cibles, origines, delais } = champ;
  for (let i = 0; i < nombre; i++) {
    const p = clamp((avancement - delais[i]) / PART_VOL, 0, 1);
    const e = easeInOutCubic(p);
    const ox = origines[i * 2];
    const oy = origines[i * 2 + 1];
    sortie[i * 3] = ox + (cibles[i * 2] - ox) * e;
    sortie[i * 3 + 1] = oy + (cibles[i * 2 + 1] - oy) * e;
    sortie[i * 3 + 2] = Math.min(1, p * 5);
  }
  return sortie;
}

/** Opacité de l'image de l'avatar : 0 avant `DEBUT_FONDU_IMAGE`, 1 à la fin, adoucie entre. */
export function fonduImageA(avancement: number): number {
  const u = clamp((avancement - DEBUT_FONDU_IMAGE) / (1 - DEBUT_FONDU_IMAGE), 0, 1);
  return u * u * (3 - 2 * u);
}

// ── Dessin ───────────────────────────────────────────────────────────────────────────────────────

/**
 * Le sprite d'étoile : un dégradé radial rendu UNE fois sur un petit canvas, puis tamponné par
 * `drawImage`. Cœur blanc, halo nacré (la `lueur` de la palette lunaire, #CDE4F8), bord transparent.
 */
export function creerSprite(doc: Document, diametre: number): HTMLCanvasElement | null {
  const d = Math.max(2, Math.round(diametre));
  const sprite = doc.createElement("canvas");
  sprite.width = d;
  sprite.height = d;
  const ctx = contexte2d(sprite);
  if (!ctx) return null;
  const r = d / 2;
  const degrade = ctx.createRadialGradient(r, r, 0, r, r, r);
  degrade.addColorStop(0, "rgba(255, 255, 255, 1)");
  degrade.addColorStop(0.35, "rgba(205, 228, 248, 0.85)");
  degrade.addColorStop(1, "rgba(205, 228, 248, 0)");
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, d, d);
  return sprite;
}

export interface SceneRemplissage {
  readonly image: CanvasImageSource;
  readonly cadre: Cadre;
  readonly champ: ChampEtoiles;
  readonly sprite: HTMLCanvasElement | null;
  /** Tampon réutilisé par `positionsA` (3 valeurs par étoile). */
  readonly positions: Float32Array;
  /** Échelle physique/logique et taille physique du canvas. */
  readonly echelle: number;
  readonly largeur: number;
  readonly hauteur: number;
}

/**
 * Une trame : l'image en fondu DESSOUS (source-over), puis les étoiles en lumière additive
 * (`lighter`), tamponnées à coordonnées ENTIÈRES — un `drawImage` à coordonnée fractionnaire
 * force un rééchantillonnage bilinéaire de tout le sprite.
 */
export function dessinerTrame(ctx: CanvasRenderingContext2D, scene: SceneRemplissage, avancement: number): void {
  const { image, cadre, champ, sprite, positions, echelle, largeur, hauteur } = scene;
  ctx.clearRect(0, 0, largeur, hauteur);

  const fondu = fonduImageA(avancement);
  if (fondu > 0) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = fondu;
    ctx.drawImage(
      image,
      Math.round(cadre.x * echelle),
      Math.round(cadre.y * echelle),
      Math.round(cadre.largeur * echelle),
      Math.round(cadre.hauteur * echelle),
    );
  }

  if (sprite && champ.nombre > 0) {
    positionsA(champ, avancement, positions);
    const rayon = sprite.width / 2;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < champ.nombre; i++) {
      const opacite = positions[i * 3 + 2];
      if (opacite <= 0) continue;
      ctx.globalAlpha = opacite;
      ctx.drawImage(
        sprite,
        Math.round(positions[i * 3] * echelle - rayon),
        Math.round(positions[i * 3 + 1] * echelle - rayon),
      );
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

// ── Orchestration ────────────────────────────────────────────────────────────────────────────────

function prefereMoinsDeMouvement(): boolean {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false; // un `matchMedia` absent ou capricieux ne décide pas à la place de la personne
  }
}

/**
 * Lance le remplissage sur `canvas` à partir de `image` (l'asset seuil, déjà décodé de préférence :
 * s'il ne l'est pas encore, on attend son `load` — ou son `error` — avant de partir).
 *
 * Rend tout de suite `{ arreter, termine }`. La boucle rAF est pilotée par l'horloge injectée,
 * se met en pause quand le document est caché (le temps ne court pas pendant la pause), et
 * S'ARRÊTE d'elle-même à la fin : après `termine`, plus aucune trame n'est demandée.
 */
export function demarrerRemplissage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: OptionsRemplissage = {},
): Remplissage {
  const dureeMs = Math.max(1, options.dureeMs ?? DUREE_DEFAUT_MS);
  const pas = options.pas ?? PAS_DEFAUT;
  const maxEtoiles = options.maxEtoiles ?? MAX_ETOILES_DEFAUT;
  const aleatoire = options.aleatoire ?? mulberry32Lunaire(Date.now() >>> 0);
  const maintenant = options.maintenant ?? (() => performance.now());
  const reduceMotion = options.reduceMotion ?? prefereMoinsDeMouvement();
  const doc = canvas.ownerDocument;

  let resoudre: () => void = () => {};
  const termine = new Promise<void>((r) => {
    resoudre = r;
  });

  // ── État de la boucle ──
  let actif = true;
  let idTrame = 0;
  let origine = 0; // instant (horloge injectée) où l'avancement vaut 0
  let debutPause: number | null = null;
  let dessiner: ((avancement: number) => void) | null = null;

  const surVisibilite = () => {
    if (!actif) return;
    if (doc.visibilityState === "hidden") {
      if (idTrame) {
        cancelAnimationFrame(idTrame);
        idTrame = 0;
      }
      debutPause ??= maintenant();
    } else if (debutPause !== null) {
      // Le temps passé caché ne compte pas : on reprend là où on s'était arrêté, sans saut.
      origine += maintenant() - debutPause;
      debutPause = null;
      if (!idTrame) idTrame = requestAnimationFrame(trame);
    }
  };

  const finir = () => {
    actif = false;
    if (idTrame) {
      cancelAnimationFrame(idTrame);
      idTrame = 0;
    }
    doc.removeEventListener("visibilitychange", surVisibilite);
    image.removeEventListener("load", lancer);
    image.removeEventListener("error", lancer);
    resoudre();
  };

  const trame = () => {
    idTrame = 0;
    if (!actif || !dessiner) return; // une trame déjà annulée qui arriverait quand même ne dessine pas
    const avancement = Math.min(1, (maintenant() - origine) / dureeMs);
    dessiner(avancement);
    if (avancement >= 1) {
      finir(); // la boucle s'arrête d'elle-même : zéro coût au repos
      return;
    }
    idTrame = requestAnimationFrame(trame);
  };

  function lancer() {
    if (!actif || dessiner) return;

    const largeur = options.largeur ?? (canvas.clientWidth || LARGEUR_SEUIL);
    const hauteur = options.hauteur ?? (canvas.clientHeight || HAUTEUR_SEUIL);
    const dpr = typeof devicePixelRatio === "number" ? devicePixelRatio : 1;
    const taille = tailleCanvas(largeur, hauteur, dpr);
    canvas.width = taille.largeur;
    canvas.height = taille.hauteur;

    const ctx = contexte2d(canvas);
    if (!ctx) {
      // Sans contexte 2D on ne peut rien peindre : l'intégrateur garde son repli (`ImageAnam`).
      finir();
      return;
    }

    const cadre = cadreContenu(
      image.naturalWidth || LARGEUR_SEUIL,
      image.naturalHeight || HAUTEUR_SEUIL,
      largeur,
      hauteur,
    );
    const cibles = echantillonnerSilhouette(image, cadre.largeur, cadre.hauteur, pas, aleatoire, maxEtoiles);
    // Les cibles sont dans le repère du cadre : on les ramène dans celui de la boîte.
    for (let i = 0; i < cibles.length; i += 2) {
      cibles[i] += cadre.x;
      cibles[i + 1] += cadre.y;
    }
    const champ = preparerChamp(cibles, largeur, hauteur, aleatoire);
    const scene: SceneRemplissage = {
      image,
      cadre,
      champ,
      sprite: creerSprite(doc, DIAMETRE_ETOILE * taille.echelle),
      positions: new Float32Array(champ.nombre * 3),
      echelle: taille.echelle,
      largeur: taille.largeur,
      hauteur: taille.hauteur,
    };
    dessiner = (avancement) => dessinerTrame(ctx, scene, avancement);

    if (reduceMotion) {
      // Aucune boucle : l'état FINAL, une fois. La silhouette pleine, l'image dessous.
      dessiner(1);
      finir();
      return;
    }

    origine = maintenant();
    doc.addEventListener("visibilitychange", surVisibilite);
    if (doc.visibilityState === "hidden") {
      debutPause = origine; // on démarre caché : la première trame attendra le retour
    } else {
      idTrame = requestAnimationFrame(trame);
    }
  }

  if (image.complete) {
    lancer();
  } else {
    image.addEventListener("load", lancer, { once: true });
    image.addEventListener("error", lancer, { once: true });
  }

  return {
    arreter: () => {
      if (actif) finir();
    },
    termine,
  };
}
