import type { Corps, EphemerisPort } from "./port";
import {
  normaliserDegres,
  resoudreInstant,
  type EntreesNaissance,
  type RaisonSansHeure,
} from "./theme-natal";

/**
 * human-design.ts — LE CALCUL DU HUMAN DESIGN (2026-09-03).
 *
 * Module PUR, comme `theme-natal.ts` et `numerologie.ts` : aucune I/O, aucun `server-only`, aucun
 * Supabase, aucun `@/lib/ai/*`. Il rend des NOMBRES et des énumérations — jamais une phrase. Le
 * SENS vit dans `lib/corpus/human-design.ts`, et la garde d'absence de `astro-architecture.test.ts`
 * continue de surveiller l'apparition d'un champ de texte dans le socle.
 *
 * ══ CE QU'EST UN THÈME DE HUMAN DESIGN, EN UNE LECTURE ═════════════════════════════════════════
 *
 * Deux thèmes, pas un :
 *
 *   • LA PERSONNALITÉ — les positions à l'instant de la naissance, exactement celles du thème natal ;
 *   • LE DESIGN — les positions à l'instant où le Soleil était 88 DEGRÉS d'arc plus tôt, soit
 *     environ 88 jours avant. Ce n'est pas « trois mois avant » : c'est un arc solaire, et il se
 *     résout par itération (voir `instantDeDesign`).
 *
 * Chaque planète tombe dans une des 64 PORTES de la roue, et dans une des 6 LIGNES de cette porte.
 * Deux portes qui se font face forment un CANAL ; un canal complet DÉFINIT les deux centres qu'il
 * relie. De la carte des centres définis se déduisent le TYPE, l'AUTORITÉ et le PROFIL.
 *
 * ══ LA ROUE EST LA SEULE CHOSE QU'ON NE PEUT PAS DÉDUIRE ═══════════════════════════════════════
 *
 * L'ordre des 64 portes autour du zodiaque et le point de départ de la roue sont une CONVENTION du
 * système, pas un résultat de calcul. Tout le reste en découle : une roue décalée d'un cran rend
 * chaque lecture fausse sans qu'aucune ligne ne plante.
 *
 * Elle est donc ancrée sur trois repères canoniques, et `tests/human-design.test.ts` les vérifie :
 *
 *   • la porte 41 ouvre la roue à 2°00' du Verseau (302°) ;
 *   • la porte 25 court de 358°15' à 3°52' — donc à cheval sur l'équinoxe ;
 *   • la porte 1 commence à 13°15' du Scorpion (223°15').
 *
 * Les trois tombent juste avec la table ci-dessous. C'est ce qui la valide, et c'est pourquoi ils
 * sont écrits ici plutôt que dans un commentaire du test : le jour où quelqu'un « corrige » l'ordre,
 * ces trois lignes disent ce qui était vrai.
 *
 * ══ SANS L'HEURE DE NAISSANCE, IL N'Y A PAS DE THÈME ═══════════════════════════════════════════
 *
 * Une LIGNE fait 0,9375° d'arc, que le Soleil parcourt en 23 heures. Sans l'heure, l'instant retenu
 * est midi (`resoudreInstant`) et la ligne du Soleil — donc la moitié du profil — est un tirage à
 * pile ou face. La Lune, elle, traverse deux portes et demie dans la journée.
 *
 * Le module REFUSE donc, plutôt que de rendre un thème plausible et faux. C'est la même règle que
 * les angles du thème natal, appliquée à un système qui n'a aucune partie robuste à l'heure près.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// La roue des 64 portes
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** Une porte de la roue, `1..64`. */
export type NumeroPorte = number;

/** Une ligne dans une porte, `1..6`. Le profil n'est fait que de deux d'entre elles. */
export type LignePorte = 1 | 2 | 3 | 4 | 5 | 6;

/** L'origine de la roue : 2°00' du Verseau, où commence la porte 41. */
export const ORIGINE_ROUE_DEGRES = 302;

/** 360 / 64. Toutes les portes ont la même largeur — la roue n'est pas le zodiaque. */
export const LARGEUR_PORTE_DEGRES = 360 / 64;

/** 5,625 / 6. Une ligne, l'unité la plus fine du système. */
export const LARGEUR_LIGNE_DEGRES = LARGEUR_PORTE_DEGRES / 6;

/**
 * LES 64 PORTES DANS L'ORDRE ZODIACAL, à partir de 2° du Verseau.
 *
 * ⚠️ CET ORDRE N'EST PAS TRIABLE, ET IL N'EST PAS DÉDUCTIBLE. Ce n'est ni la suite des nombres, ni
 * l'ordre du Yi King classique : c'est la séquence du mandala, et elle se recopie. La seule façon
 * de la vérifier est de retomber sur des bornes connues, ce que fait le test.
 */
export const PORTES_ROUE: readonly NumeroPorte[] = Object.freeze([
  41, 19, 13, 49, 30, 55, 37, 63,
  22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35,
  45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64,
  47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5,
  26, 11, 10, 58, 38, 54, 61, 60,
]);

/** Où tombe une longitude écliptique : sa porte et sa ligne. */
export interface PositionRoue {
  readonly porte: NumeroPorte;
  readonly ligne: LignePorte;
}

/**
 * La porte et la ligne d'une longitude.
 *
 * ⚠️ LE MODULO EST PRIS SUR L'ÉCART À L'ORIGINE, jamais sur la longitude elle-même. Calculer
 * `floor(longitude / 5.625)` donnerait une roue qui commence à 0° du Bélier : toutes les portes
 * seraient décalées de dix crans, et chaque thème serait faux d'un bout à l'autre.
 */
export function positionSurLaRoue(longitude: number): PositionRoue {
  const depuisOrigine = normaliserDegres(longitude - ORIGINE_ROUE_DEGRES);
  const index = Math.floor(depuisOrigine / LARGEUR_PORTE_DEGRES);
  const dansLaPorte = depuisOrigine - index * LARGEUR_PORTE_DEGRES;
  // `min(…, 5)` ferme le cas de bord de l'arrondi flottant : une longitude à un milliardième sous
  // la borne haute d'une porte donnerait la ligne 7, qui n'existe pas.
  const ligne = Math.min(5, Math.floor(dansLaPorte / LARGEUR_LIGNE_DEGRES)) + 1;
  return Object.freeze({ porte: PORTES_ROUE[index], ligne: ligne as LignePorte });
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les corps activés, et les deux thèmes
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Les treize activations d'un thème.
 *
 * ⚠️ LA TERRE ET LE NŒUD SUD NE SONT PAS DES CORPS D'ÉPHÉMÉRIDE, ce sont des OPPOSÉS. La Terre est
 * le Soleil à 180°, le nœud Sud le nœud Nord à 180° : les demander à la source rendrait
 * `non_calcule` et amputerait le thème de quatre activations sur vingt-six.
 */
export type CorpsHumanDesign = Corps | "terre" | "noeud_sud";

/** Les corps lus dans l'éphéméride, dans l'ordre où le système les nomme. */
const CORPS_LUS: readonly Corps[] = Object.freeze([
  "soleil",
  "lune",
  "noeud_vrai",
  "mercure",
  "venus",
  "mars",
  "jupiter",
  "saturne",
  "uranus",
  "neptune",
  "pluton",
]);

/** Laquelle des deux roues porte une activation. */
export type Roue = "personnalite" | "design";

export interface Activation {
  readonly roue: Roue;
  readonly corps: CorpsHumanDesign;
  readonly porte: NumeroPorte;
  readonly ligne: LignePorte;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// L'instant de design — 88 degrés d'arc solaire avant la naissance
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** L'arc que le Soleil doit avoir parcouru entre le design et la naissance. */
export const ARC_DESIGN_DEGRES = 88;

/** Vitesse moyenne du Soleil, en degrés par jour. Sert d'amorce, jamais de résultat. */
const DEGRES_PAR_JOUR = 360 / 365.2422;

const MS_PAR_JOUR = 86_400_000;

/** L'écart signé le plus court entre deux longitudes, dans `]-180, 180]`. */
function ecartSigne(de: number, vers: number): number {
  const brut = normaliserDegres(vers - de);
  return brut > 180 ? brut - 360 : brut;
}

/**
 * L'instant où le Soleil était 88° avant sa position de naissance.
 *
 * ⚠️ CE N'EST PAS « 88 JOURS AVANT », et l'approximation ne tient pas. La Terre va plus vite au
 * périhélie qu'à l'aphélie : l'écart entre l'arc et les jours atteint plus d'un degré et demi selon
 * la saison de naissance, soit une porte et demie. Un thème sur trois changerait de porte solaire.
 *
 * On résout donc par ITÉRATION : on part de 88 jours, on mesure l'écart réel à la cible, on corrige
 * de `écart / vitesse`, et on recommence. La convergence est quadratique en pratique — trois passes
 * suffisent — mais la boucle est BORNÉE et son résultat VÉRIFIÉ : une éphéméride qui refuserait de
 * rendre le Soleil ferait tourner un `while (true)` sans fin.
 */
export function instantDeDesign(
  instantNaissance: Date,
  ephemeride: EphemerisPort,
): Date | null {
  const soleilA = (t: Date): number | null => {
    const lecture = ephemeride.longitudeEcliptique("soleil", t);
    return lecture.statut === "calcule" ? lecture.longitude : null;
  };

  const natal = soleilA(instantNaissance);
  if (natal === null) return null;
  const cible = normaliserDegres(natal - ARC_DESIGN_DEGRES);

  let t = new Date(instantNaissance.getTime() - (ARC_DESIGN_DEGRES / DEGRES_PAR_JOUR) * MS_PAR_JOUR);
  for (let passe = 0; passe < 8; passe++) {
    const actuel = soleilA(t);
    if (actuel === null) return null;
    const ecart = ecartSigne(actuel, cible);
    // Un cent-millième de degré : quatre ordres de grandeur sous la largeur d'une ligne, donc
    // aucune ambiguïté de porte possible.
    if (Math.abs(ecart) < 1e-5) return t;
    t = new Date(t.getTime() + (ecart / DEGRES_PAR_JOUR) * MS_PAR_JOUR);
  }
  // Huit passes sans converger n'arrive pas sur une éphéméride saine. Rendre `null` plutôt qu'un
  // instant « à peu près » : un design faux se lit exactement comme un design juste.
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les canaux et les centres
// ══════════════════════════════════════════════════════════════════════════════════════════════

export type NomCentre =
  | "tete"
  | "ajna"
  | "gorge"
  | "identite"
  | "coeur"
  | "sacral"
  | "rate"
  | "plexus_solaire"
  | "racine";

/**
 * LES NEUF CENTRES ET LEURS PORTES. Les 64 portes s'y répartissent sans reste et sans doublon —
 * `tests/human-design.test.ts` le vérifie, parce qu'une porte oubliée rendrait un centre
 * indéfinissable et qu'une porte en double le définirait deux fois.
 */
export const PORTES_PAR_CENTRE: Readonly<Record<NomCentre, readonly NumeroPorte[]>> = Object.freeze({
  tete: Object.freeze([64, 61, 63]),
  ajna: Object.freeze([47, 24, 4, 17, 43, 11]),
  gorge: Object.freeze([62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16]),
  identite: Object.freeze([1, 13, 25, 46, 2, 15, 10, 7]),
  coeur: Object.freeze([21, 40, 26, 51]),
  sacral: Object.freeze([34, 5, 14, 29, 59, 9, 3, 42, 27]),
  rate: Object.freeze([48, 57, 44, 50, 32, 28, 18]),
  plexus_solaire: Object.freeze([36, 22, 37, 6, 49, 55, 30]),
  racine: Object.freeze([58, 38, 54, 53, 60, 52, 19, 39, 41]),
});

/**
 * LES QUATRE MOTEURS. Ce sont eux qui décident du type : un moteur relié à la gorge donne un être
 * qui initie, un moteur sans lien à la gorge donne un être qui répond ou qui guide.
 */
export const CENTRES_MOTEURS: readonly NomCentre[] = Object.freeze([
  "sacral",
  "coeur",
  "plexus_solaire",
  "racine",
]);

/** Un canal : deux portes qui se font face. Les 36 sont écrits dans l'ordre de la porte basse. */
export interface Canal {
  readonly portes: readonly [NumeroPorte, NumeroPorte];
}

/**
 * LES 36 CANAUX. Table recopiée, comme la roue : rien ici ne se déduit, tout se vérifie. Le test
 * exige qu'ils soient 36, que chaque porte citée existe, et que les deux extrémités d'un canal
 * appartiennent à deux centres DIFFÉRENTS — un canal qui boucle sur son centre ne le relierait à
 * rien et passerait pourtant inaperçu.
 */
export const CANAUX: readonly (readonly [NumeroPorte, NumeroPorte])[] = Object.freeze([
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59],
  [7, 31], [9, 52], [10, 20], [10, 34], [10, 57], [11, 56],
  [12, 22], [13, 33], [16, 48], [17, 62], [18, 58], [19, 49],
  [20, 34], [20, 57], [21, 45], [23, 43], [24, 61], [25, 51],
  [26, 44], [27, 50], [28, 38], [29, 46], [30, 41], [32, 54],
  [34, 57], [35, 36], [37, 40], [39, 55], [42, 53], [47, 64],
] as const);

/** Le centre auquel appartient une porte. Jette hors domaine : une porte inconnue est un défaut. */
export function centreDeLaPorte(porte: NumeroPorte): NomCentre {
  for (const [centre, portes] of Object.entries(PORTES_PAR_CENTRE) as [NomCentre, readonly NumeroPorte[]][]) {
    if (portes.includes(porte)) return centre;
  }
  throw new Error(`human-design : porte hors roue « ${porte} »`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le type, l'autorité, le profil
// ══════════════════════════════════════════════════════════════════════════════════════════════

export type TypeHumanDesign =
  | "generateur"
  | "generateur_manifesteur"
  | "manifesteur"
  | "projecteur"
  | "reflecteur";

export type Autorite =
  | "emotionnelle"
  | "sacrale"
  | "splenique"
  | "ego"
  | "auto_projetee"
  | "mentale"
  | "lunaire";

/**
 * Un moteur atteint-il la gorge par des canaux définis ?
 *
 * ⚠️ C'EST UN PARCOURS DE GRAPHE, PAS UN VOISINAGE. Un moteur relié à la gorge PAR UN AUTRE CENTRE
 * compte : Racine → Rate → Gorge fait un manifesteur aussi sûrement qu'un canal direct. Se contenter
 * des canaux qui touchent la gorge classerait ces thèmes en projecteurs, et le type est la première
 * chose que le système dit de quelqu'un.
 */
function moteurRelieALaGorge(canauxDefinis: readonly (readonly [NumeroPorte, NumeroPorte])[]): boolean {
  const voisins = new Map<NomCentre, Set<NomCentre>>();
  for (const [a, b] of canauxDefinis) {
    const ca = centreDeLaPorte(a);
    const cb = centreDeLaPorte(b);
    if (!voisins.has(ca)) voisins.set(ca, new Set());
    if (!voisins.has(cb)) voisins.set(cb, new Set());
    voisins.get(ca)!.add(cb);
    voisins.get(cb)!.add(ca);
  }

  const vus = new Set<NomCentre>(["gorge"]);
  const aVisiter: NomCentre[] = ["gorge"];
  while (aVisiter.length > 0) {
    const centre = aVisiter.pop()!;
    for (const suivant of voisins.get(centre) ?? []) {
      if (vus.has(suivant)) continue;
      vus.add(suivant);
      aVisiter.push(suivant);
    }
  }
  // La gorge n'est atteinte que si elle porte elle-même un canal : sans cela `vus` ne contient
  // qu'elle, et aucun moteur n'y figure.
  return CENTRES_MOTEURS.some((moteur) => vus.has(moteur));
}

/** Le type, déduit des centres définis et de la connexion des moteurs à la gorge. */
export function typeDuTheme(
  centresDefinis: readonly NomCentre[],
  canauxDefinis: readonly (readonly [NumeroPorte, NumeroPorte])[],
): TypeHumanDesign {
  // Aucun centre défini : le seul cas où le thème n'a pas de moteur du tout.
  if (centresDefinis.length === 0) return "reflecteur";

  const relie = moteurRelieALaGorge(canauxDefinis);
  if (centresDefinis.includes("sacral")) {
    return relie ? "generateur_manifesteur" : "generateur";
  }
  return relie ? "manifesteur" : "projecteur";
}

/**
 * L'autorité, par ORDRE DE PRIORITÉ — et l'ordre EST la règle.
 *
 * Un thème peut avoir le plexus solaire ET le sacral définis ; l'autorité est alors émotionnelle,
 * jamais sacrale. Écrire ces cas comme une suite de `if` dans le bon ordre est la seule forme qui
 * ne se contredit pas : une table associative laisserait le doute sur ce qui gagne.
 */
export function autoriteDuTheme(centresDefinis: readonly NomCentre[]): Autorite {
  const defini = (c: NomCentre) => centresDefinis.includes(c);
  if (defini("plexus_solaire")) return "emotionnelle";
  if (defini("sacral")) return "sacrale";
  if (defini("rate")) return "splenique";
  if (defini("coeur")) return "ego";
  if (defini("identite")) return "auto_projetee";
  // Un thème sans aucun de ces cinq centres n'a pas d'autorité intérieure : il en reste une
  // mentale, sauf s'il n'a AUCUN centre défini, et il est alors lunaire (le réflecteur).
  return centresDefinis.length === 0 ? "lunaire" : "mentale";
}

export interface Profil {
  readonly personnalite: LignePorte;
  readonly design: LignePorte;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le thème
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** Pourquoi un thème n'a pas pu être calculé. Fermé, comme toutes les absences du socle. */
export type RaisonSansHumanDesign =
  | "heure_inconnue"
  | "instant_de_design_introuvable"
  | "ephemeride_muette";

export interface ThemeHumanDesign {
  readonly schema: 1;
  readonly adaptateur: string;
  readonly activations: readonly Activation[];
  /** Les portes activées, triées. Une porte activée deux fois (par les deux roues) n'apparaît qu'une. */
  readonly portesDefinies: readonly NumeroPorte[];
  readonly canauxDefinis: readonly (readonly [NumeroPorte, NumeroPorte])[];
  readonly centresDefinis: readonly NomCentre[];
  readonly type: TypeHumanDesign;
  readonly autorite: Autorite;
  readonly profil: Profil;
}

export type ResultatHumanDesign =
  | { readonly statut: "calcule"; readonly theme: ThemeHumanDesign }
  | { readonly statut: "indisponible"; readonly raison: RaisonSansHumanDesign };

/** Les activations d'une roue, à un instant donné. `null` si l'éphéméride ne rend pas le Soleil. */
function activationsA(
  instant: Date,
  roue: Roue,
  ephemeride: EphemerisPort,
): readonly Activation[] | null {
  const activations: Activation[] = [];
  let soleil: number | null = null;
  let noeudNord: number | null = null;

  for (const corps of CORPS_LUS) {
    const lecture = ephemeride.longitudeEcliptique(corps, instant);
    if (lecture.statut !== "calcule") {
      // Le Soleil et le nœud portent chacun leur opposé : sans eux, quatre activations sur treize
      // manquent et le profil n'existe pas. Les autres corps peuvent manquer sans casser la lecture
      // (une source sans Pluton reste une source).
      if (corps === "soleil" || corps === "noeud_vrai") return null;
      continue;
    }
    if (corps === "soleil") soleil = lecture.longitude;
    if (corps === "noeud_vrai") noeudNord = lecture.longitude;
    const { porte, ligne } = positionSurLaRoue(lecture.longitude);
    activations.push(Object.freeze({ roue, corps, porte, ligne }));
  }

  if (soleil === null || noeudNord === null) return null;

  for (const [nom, longitude] of [
    ["terre", normaliserDegres(soleil + 180)],
    ["noeud_sud", normaliserDegres(noeudNord + 180)],
  ] as const) {
    const { porte, ligne } = positionSurLaRoue(longitude);
    activations.push(Object.freeze({ roue, corps: nom, porte, ligne }));
  }

  return Object.freeze(activations);
}

/** La ligne du Soleil d'une roue — la moitié du profil. */
function ligneDuSoleil(activations: readonly Activation[]): LignePorte {
  const soleil = activations.find((a) => a.corps === "soleil");
  // `activationsA` rend `null` sans Soleil : à ce point il existe forcément.
  return soleil!.ligne;
}

/**
 * LE THÈME DE HUMAN DESIGN.
 *
 * Fonction pure : mêmes entrées + même port ⇒ même sortie, toujours (FR-047). Aucun identifiant
 * d'utilisatrice, aucun client de base, aucun contexte — la même frontière que `horoscopeDuJour`,
 * et pour la même raison.
 */
export function calculerHumanDesign(
  entrees: EntreesNaissance,
  ephemeride: EphemerisPort,
): ResultatHumanDesign {
  const { instantUtc, heureConnue } = resoudreInstant(entrees);

  // ⚠️ LE REFUS EST LA PREMIÈRE LIGNE, ET IL EST DÉFINITIF. Une ligne fait 0,9375° d'arc solaire,
  // soit 23 heures : sans l'heure, la moitié du profil est un tirage à pile ou face et la Lune a
  // traversé deux portes. Il n'existe pas de « thème partiel » ici — voir l'en-tête.
  if (!heureConnue) return { statut: "indisponible", raison: "heure_inconnue" };

  const personnalite = activationsA(instantUtc, "personnalite", ephemeride);
  if (personnalite === null) return { statut: "indisponible", raison: "ephemeride_muette" };

  const instantDesign = instantDeDesign(instantUtc, ephemeride);
  if (instantDesign === null) {
    return { statut: "indisponible", raison: "instant_de_design_introuvable" };
  }
  const design = activationsA(instantDesign, "design", ephemeride);
  if (design === null) return { statut: "indisponible", raison: "ephemeride_muette" };

  const activations = Object.freeze([...personnalite, ...design]);
  const portesDefinies = Object.freeze(
    [...new Set(activations.map((a) => a.porte))].sort((x, y) => x - y),
  );

  const canauxDefinis = Object.freeze(
    CANAUX.filter(([a, b]) => portesDefinies.includes(a) && portesDefinies.includes(b)),
  );

  const centresDefinis = Object.freeze(
    (Object.keys(PORTES_PAR_CENTRE) as NomCentre[]).filter((centre) =>
      canauxDefinis.some(([a, b]) => centreDeLaPorte(a) === centre || centreDeLaPorte(b) === centre),
    ),
  );

  return {
    statut: "calcule",
    theme: Object.freeze({
      schema: 1,
      adaptateur: ephemeride.identifiant,
      activations,
      portesDefinies,
      canauxDefinis,
      centresDefinis,
      type: typeDuTheme(centresDefinis, canauxDefinis),
      autorite: autoriteDuTheme(centresDefinis),
      profil: Object.freeze({
        personnalite: ligneDuSoleil(personnalite),
        design: ligneDuSoleil(design),
      }),
    }),
  };
}

/**
 * L'heure manque-t-elle, et le dire à qui de droit.
 *
 * Exportée pour que la couche qui affiche puisse proposer la MÊME porte que l'astrologie
 * (`/heure-naissance`) sans avoir à connaître `RaisonSansHumanDesign`.
 *
 * ⚠️ LE PARAMÈTRE EST PLUS LARGE QUE `ResultatHumanDesign`, ET C'EST VOULU. La couche de lecture
 * ajoute ses propres absences (`naissance_absente`, `lecture_impossible`) que le socle n'a aucune
 * raison de connaître — il ne lit pas de base. Accepter n'importe quelle raison ici évite de
 * recopier ce prédicat d'un étage à l'autre, et une copie de ce genre finit toujours par ne
 * répondre qu'à moitié à la question qu'elle porte.
 */
export function manqueLHeurePourHumanDesign(
  resultat:
    | { readonly statut: "calcule" }
    | { readonly statut: "indisponible"; readonly raison: string },
): boolean {
  return resultat.statut === "indisponible" && resultat.raison === "heure_inconnue";
}

/** Réexporté pour que l'appelant n'ait pas à importer `theme-natal` pour une seule union. */
export type { RaisonSansHeure };
