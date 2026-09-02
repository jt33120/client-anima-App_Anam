/**
 * tokens.ts — SOURCE DE VÉRITÉ UNIQUE du design system Anam (Story 1.2).
 *
 * Données pures, aucun import Next/infra → importable par les tests-gardes.
 * Les valeurs sont copiées à l'identique de DESIGN.md (frontmatter + §Colors),
 * où chaque paire de couleur a déjà un ratio WCAG calculé et vérifié.
 *
 * Règle : globals.css NE FAIT QUE refléter ce module. La garde de parité
 * (tests/tokens-parite.test.ts) échoue si le CSS diverge d'une seule valeur.
 * Les clés de couleur sont le NOM EXACT de la variable CSS (`fond` → `--fond`).
 *
 * ══ 2026-09-01 : LA PALETTE « SOFT BALANCE » (retour terrain n° 2, story E5-S1) ═══════════════
 * Julian, une image de palette à l'appui : « le fond est trop violet et trop sombre, il faut une
 * interface plus contrastée et lisible, avec le violet et le bleu ciel de la fleur de lotus, des
 * textures et des dégradés ; utilise la palette fournie ». Six teintes fournies : Ivory #F0EFEA,
 * Sky #D3DBF0, Gray #B8B5AC, Beige #E0D2C7, Periwinkle #7A90C9, Navy #1C2740.
 *
 * Ce qui a été décidé (D5 et D6, sprint-change-proposal-2026-08-31-retours-terrain-2.md) :
 *  - La nuit RESTE le mode natif : seule sa teinte change, de l'indigo (#0C0A1E) au navy de la
 *    palette. Un fond Ivory natif aurait été une refonte de doctrine (globals.css, DESIGN.md et
 *    tests/accessibilite.test.ts refusent tout thème jour), hors de la journée.
 *  - La palette brute ne tient pas le gate WCAG sur Ivory : Gray 1,78:1, Periwinkle 2,74:1.
 *    Elle est donc DÉCLINÉE par rôle, et chaque valeur ci-dessous porte son ratio recalculé avec
 *    ratioContraste() de app/styles/contraste.ts (tests/contraste.test.ts : 18/18 paires en nuit,
 *    9/9 en clair). Une valeur qui casse une paire rougit ce gate, donc la CI.
 *  - Sky est à la fois `accent` ET `lueur` : admis parce que la lueur n'est jamais cliquable
 *    (DESIGN.md §Colors), donc aucune ambiguïté d'action ne naît de la teinte partagée.
 *  - L'ancien violet survit en `nebuleuse` : un token de DÉCOR (1,13:1 sur fond), jamais sous du
 *    texte ni sur un contrôle. Il n'est consommé qu'à partir de E5-S2 (halo et couche nébuleuse
 *    de render/monde.module.css) ; la clé existe dès maintenant pour que la parité la garde.
 *  - PALETTE_LUNAIRE (render/arbre/MoteurArbreLunaire.ts) reste gelée (D6) : le bois #9A96BE
 *    tient 5,29:1 sur le navy, on relit à l'écran après déploiement plutôt que de la retoucher.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Couleurs — mode nuit (mode natif, tokens sans suffixe).
// Nuit NAVY « Soft Balance » depuis le 2026-09-01. Ratios recalculés (ratioContraste) :
// texte/fond 12,90 · texte-doux/fond 8,70 · accent/fond 10,72 · sur-accent/accent 10,72 ·
// bordure-forte/fond 4,71 · bordure-forte/surface-elevee 3,24 (la marge la plus serrée,
// seuil 3) · arbre-tronc/fond 4,43 · voile fond à 85 % sur image blanche : texte 8,06,
// texte-doux 5,43 (tests/voile.test.ts, tests/surimpression.test.ts).
// ─────────────────────────────────────────────────────────────────────────────
export const couleursNuit = {
  fond: "#1C2740", // Navy de la palette : le ciel. Ni noir, ni gris, ni l'indigo d'avant
  surface: "#26324D", // premier voile de nuit : le navy éclairci d'un cran
  "surface-elevee": "#33415E", // le navy clair de la palette : second et dernier niveau
  texte: "#F0EFEA", // Ivory : le blanc de la palette, jamais #FFFFFF (halation sur navy)
  // Le Gray #B8B5AC de la palette ne tient que 4,52:1 sous le voile du Seuil (fond à 85 % sur une
  // image blanche) : marge trop juste face à l'anti-crénelage. Éclairci d'un cran vers Ivory.
  "texte-doux": "#C9C6BD",
  bordure: "#33415E", // séparateur décoratif = surface-elevee (1,46:1, exempté WCAG 1.4.11)
  "bordure-forte": "#7A90C9", // Periwinkle : contour des contrôles + anneau de focus (4,71 sur fond)
  accent: "#D3DBF0", // Sky, le lotus : la couleur de l'ACTION seule (10,72 sur fond)
  "accent-doux": "#26324D", // aplat de mise en avant discret = surface (porte du texte `texte`)
  "sur-accent": "#1C2740", // encre navy sur remplissage Sky (10,72:1)
  "arbre-tronc": "#8C88B0", // écorce lunaire, argent violacé : la trace du violet dans l'UI
  "arbre-branche": "#A9B8E6", // bois clair, entre Periwinkle et Sky (7,56 sur fond)
  "arbre-feuillage": "#9CC5E8", // feuillage bleu-lune (8,18 sur fond)
  succes: "#86B79E", // inchangé : vert-jade éteint, en texte seulement (5,64 sur surface)
  alerte: "#D0A05C", // inchangé : ambre lunaire, en texte seulement (5,39 sur surface)
  lueur: "#D3DBF0", // = Sky, comme l'accent : la lueur n'est jamais cliquable, donc admis (D5)
  // L'ancien violet de la nuit galactique, gardé comme NÉBULEUSE : décor seulement (halo et
  // dégradé du monde, E5-S2). 1,13:1 sur fond : une nuance, pas une couleur. Jamais sous du texte.
  nebuleuse: "#2E2A5A",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Couleurs — mode accessibilité « contraste renforcé / imagerie atténuée ».
// PAS un thème jour. Mêmes clés/rôles que la nuit ; réaffectées aux var. CSS
// dans :root[data-a11y="contraste"] et @media (prefers-contrast: more).
// Depuis le 2026-09-01, c'est ICI que vivent Ivory et Beige : la palette Soft
// Balance re-tokenisée en clair, chaque teinte foncée jusqu'au seuil (9/9 paires,
// min 4,83 succes/fond ; texte-doux/surface-elevee 4,75 est la marge de texte la
// plus serrée). Le type impose la clé `nebuleuse` : en clair, le Beige, décor seul.
// ─────────────────────────────────────────────────────────────────────────────
export const couleursClair: Record<keyof typeof couleursNuit, string> = {
  fond: "#F0EFEA", // Ivory (texte navy à 12,90)
  surface: "#FFFFFF",
  "surface-elevee": "#D3DBF0", // Sky en aplat (le texte navy y tient à 10,72)
  texte: "#1C2740", // Navy
  "texte-doux": "#5F5D57", // le Gray foncé jusqu'à 5,72 sur Ivory (le Gray brut ne fait que 1,78)
  bordure: "#B8B5AC", // Gray : décoratif, exempté (1,78)
  "bordure-forte": "#4C63A8", // Periwinkle foncé : 4,99 sur Ivory, 4,15 sur surface-elevee
  accent: "#41579B", // Periwinkle foncé jusqu'à 5,96 sur Ivory (le brut ne fait que 2,74)
  "accent-doux": "#D3DBF0", // Sky
  "sur-accent": "#FFFFFF", // 6,86 sur accent
  "arbre-tronc": "#4C63A8", // 4,99 sur Ivory
  "arbre-branche": "#41579B", // 5,96 sur Ivory
  "arbre-feuillage": "#33415E", // 8,86 sur Ivory
  succes: "#3B7357", // inchangé, 4,83 sur Ivory (la paire la plus serrée du mode)
  alerte: "#8A5A16", // inchangé, 5,13 sur Ivory
  lueur: "#41579B", // = accent, même règle qu'en nuit
  nebuleuse: "#E0D2C7", // Beige : décor seulement (1,28 sur Ivory), jamais sous du texte
};

export type CleCouleur = keyof typeof couleursNuit;

// ─────────────────────────────────────────────────────────────────────────────
// Typographie — 8 rôles. Le sérif (Fraunces) = la voix d'Anam ; la grotesque
// (Inter) = l'interface et les mots de l'utilisatrice. Tailles en rem.
// ─────────────────────────────────────────────────────────────────────────────
export type Famille = "anam" | "ui"; // --police-anam (Fraunces) | --police-ui (Inter)

export interface RoleTypo {
  famille: Famille;
  tailleRem: number;
  tailleDesktopRem?: number; // ≥768px, si différent
  interligne: number;
  graisse: number; // jamais > 500 (règle dure DESIGN.md)
  /** Axes Fraunces pilotés en CSS ; absent pour Inter. */
  opsz?: number;
  soft?: number;
  wonk?: number;
  letterSpacingEm?: number;
}

export const echelleTypo = {
  display: { famille: "anam", tailleRem: 2, tailleDesktopRem: 2.5, interligne: 1.15, graisse: 400, opsz: 48, soft: 30, wonk: 0, letterSpacingEm: -0.01 },
  titre: { famille: "anam", tailleRem: 1.5, interligne: 1.25, graisse: 400, opsz: 32, soft: 30, wonk: 0 },
  "titre-sm": { famille: "anam", tailleRem: 1.125, interligne: 1.35, graisse: 500, opsz: 20, soft: 30, wonk: 0 },
  anam: { famille: "anam", tailleRem: 1.1875, interligne: 1.6, graisse: 400, opsz: 14, soft: 20, wonk: 0, letterSpacingEm: 0.005 },
  corps: { famille: "ui", tailleRem: 1, interligne: 1.65, graisse: 400 },
  meta: { famille: "ui", tailleRem: 0.8125, interligne: 1.45, graisse: 400 },
  surtitre: { famille: "ui", tailleRem: 0.75, interligne: 1.4, graisse: 500, letterSpacingEm: 0.06 },
  bouton: { famille: "ui", tailleRem: 0.9375, interligne: 1, graisse: 500, letterSpacingEm: 0.01 },
} as const satisfies Record<string, RoleTypo>;

export type CleRole = keyof typeof echelleTypo;

/** Bornes dures vérifiées par tests/typographie.test.ts (DESIGN.md §Typography). */
export const reglesTypo = {
  graisseMax: 500,
  interligneLectureMin: 1.6, // s'applique à `corps` et `anam`
  tailleMinRem: 0.8125, // 13px — plancher général
  // Exception documentée (DESIGN.md) : `surtitre` est une étiquette à 12px, posée
  // uniquement sur zone protégée/aplat, jamais sur un voile en dégradé.
  tailleMinExceptionRem: 0.75, // 12px
  rolesTailleReduite: ["surtitre"] as CleRole[],
  rolesLecture: ["corps", "anam"] as CleRole[],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Espacement — base 8px. Exposé en variables --esp-1..9 + nommés.
// ─────────────────────────────────────────────────────────────────────────────
export const espacement = {
  "esp-1": "4px",
  "esp-2": "8px",
  "esp-3": "12px",
  "esp-4": "16px",
  "esp-5": "24px",
  "esp-6": "32px",
  "esp-7": "48px",
  "esp-8": "64px",
  "esp-9": "96px",
  "marge-mobile": "20px",
  "marge-desktop": "48px",
  respiration: "40px",
  mesure: "32rem",
  "contenu-max": "40rem",
  "cible-tactile": "44px",
} as const;

export const rayon = {
  "rayon-sm": "4px",
  rayon: "8px",
  "rayon-md": "12px",
  "rayon-lg": "16px",
  "rayon-full": "9999px",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Mouvement — le fondu lent de la nuit. Une seule courbe, aucun rebond.
// ─────────────────────────────────────────────────────────────────────────────
export const mouvement = {
  dureeCourteMs: 180,
  dureeStandardMs: 320,
  dureeLongueMs: 700,
  dureeRespirationMs: 4200,
  courbe: "cubic-bezier(0.32, 0.08, 0.24, 1)",
  deriveMaxPx: 6, // translateY bas→haut optionnel, JAMAIS latéral
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Voile de lisibilité — le texte ne se pose JAMAIS sur une image sans voile
// (DESIGN.md §components.voile, UX-DR-39). Les opacités sont calibrées pour garantir
// le contraste WCAG AA sur imagerie, quel que soit l'arrière-plan (vérifié PAR CALCUL
// dans tests/voile.test.ts, pire cas = image blanche). `text-shadow` est interdit
// comme substitut. La couleur du voile suit --fond (donc s'adapte au mode -clair).
// ─────────────────────────────────────────────────────────────────────────────
export const voile = {
  // Opacité unique : tout le texte du Seuil tient dans la bande à cette densité, ce qui
  // garantit WCAG AA (≥ 4,5:1) sur imagerie quel que soit l'arrière-plan. Consommée pour
  // de vrai par .voile-seuil (var(--voile-opacite-texte-courant)) ; plus de token mort.
  opaciteTexteCourant: 0.85,
} as const;
