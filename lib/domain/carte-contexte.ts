/**
 * carte-contexte.ts — CE QU'ANAM COMPREND, ET QUI NE SE MONTRE JAMAIS (retour du 2026-08-25).
 *
 * ══ LE CONSTAT ═══════════════════════════════════════════════════════════════════════════════════
 *
 * « Je veux une architecture de contexte pour qu'Anam soit vraiment utile, une architecture de
 * mémoire et de compacting intelligente pour garder ce qui est important et enlever le bruit. »
 *
 * L'arc de séance (2.7) COMPTE déjà : trois sujets abordés, deux reformulations, une confirmation.
 * Mais il ne sait rien de CE QUI a été dit. Et `contexte-anam` (2026-08-20) porte des faits retenus
 * — une liste plate, du plus récent au plus ancien, qui grossit sans jamais se structurer.
 *
 * Il manquait la couche qui comprend : ce qui l'amène, ce qui l'a déclenché, ce qui l'entretient,
 * ce qui la protège. Un praticien la construit en silence ; elle s'appelle une formulation de cas.
 *
 * ══ LES CINQ CHAMPS, ET POURQUOI CEUX-LÀ ════════════════════════════════════════════════════════
 *
 * Ce sont ceux du modèle « 5P », employé comme carte de contexte — jamais comme un jugement. Julian
 * en avait décrit deux sans les nommer : « savoir si c'est un déclencheur qui l'a poussée à nous
 * amener » est le PRÉCIPITANT ; « la vérité derrière ce qui se cache » est le PERPÉTUANT.
 *
 * ⚠️ CE N'EST PAS UN DIAGNOSTIC, et la distinction n'est pas cosmétique : une formulation décrit des
 * MÉCANISMES et des APPUIS, une par une, réfutables. Elle ne classe personne, elle n'explique pas
 * qui elle est, et elle ne prédit rien (FR-023).
 *
 * ══ TROIS RÈGLES QUI TIENNENT LA COUCHE ═════════════════════════════════════════════════════════
 *
 *   1. ELLE NE SE MONTRE JAMAIS DANS LE PRODUIT (décision Julian, 2026-08-25). Aucun écran, et Anam
 *      ne la récite pas. Montrer une formulation la transforme en verdict — c'est FR-023 qui tombe.
 *      ⚠️ ELLE RESTE DANS L'EXPORT DE DONNÉES : le droit d'accès (RGPD art. 15) porte sur toute
 *      donnée personnelle, et une carte tenue sur quelqu'un en est une. L'export est une voie
 *      légale, pas une surface produit — les deux décisions ne se contredisent pas.
 *   2. AUCUN CHIFFRE (FR-031). Ni « trois fois », ni « depuis deux semaines », ni « la plupart du
 *      temps ». Un compte dans la carte ressort dans la bouche d'Anam, et le produit ne compte
 *      jamais ce qu'une personne a ou n'a pas.
 *   3. ELLE PORTE SES MOTS. Une reformulation par un modèle qu'on lui ressert plus tard est un
 *      verdict qu'elle n'a jamais prononcé.
 *
 * Module PUR (AD-1) : aucune I/O, aucune horloge. La matière lui arrive déjà lue.
 */

import type { MessageIa } from "@/lib/ai/port";

/**
 * Les cinq champs. Tous facultatifs : une carte vide est l'état normal d'un premier passage, et
 * `null` s'y lit « on ne sait pas » — jamais « il n'y a rien ».
 */
export interface CarteContexte {
  /** Ce qui est amené : ce dont elle parle, dans ses mots. */
  readonly presentant: string | null;
  /** LE DÉCLENCHEUR : ce qui s'est passé juste avant, et qui explique le « pourquoi maintenant ». */
  readonly precipitant: string | null;
  /** Ce qui rendait ça possible, plus anciennement. Le champ le plus risqué : il ressemble à une cause. */
  readonly predisposant: string | null;
  /** Ce qui l'ENTRETIENT aujourd'hui. Le plus utile des cinq. */
  readonly perpetuant: string | null;
  /** Ses appuis : ce qui tient déjà, ce qu'elle sait faire, qui est là. */
  readonly protecteur: string | null;
}

export const CARTE_VIDE: CarteContexte = Object.freeze({
  presentant: null,
  precipitant: null,
  predisposant: null,
  perpetuant: null,
  protecteur: null,
});

/** Les clés, dans l'ordre où elles se lisent. Source unique — la base, l'export et la consigne s'y adossent. */
export const CHAMPS_CARTE = Object.freeze([
  "presentant",
  "precipitant",
  "predisposant",
  "perpetuant",
  "protecteur",
] as const);

export type ChampCarte = (typeof CHAMPS_CARTE)[number];

/** L'intitulé humain de chaque champ — employé dans la consigne ET dans l'export. Jamais à l'écran. */
export const INTITULE_CHAMP: Readonly<Record<ChampCarte, string>> = Object.freeze({
  presentant: "Ce qu’elle amène",
  precipitant: "Ce qui l’a déclenché",
  predisposant: "Ce qui rendait ça possible",
  perpetuant: "Ce qui l’entretient",
  protecteur: "Ce qui tient déjà",
});

/** Une carte est vide quand aucun de ses champs n'est renseigné. */
export function carteEstVide(c: CarteContexte): boolean {
  return CHAMPS_CARTE.every((k) => !c[k]);
}

/**
 * LA LONGUEUR MAXIMALE D'UN CHAMP.
 *
 * ⚠️ ELLE EXISTE POUR UNE RAISON DE COMPORTEMENT, PAS DE STOCKAGE. Au-delà de quelques lignes, un
 * modèle se met à RÉCITER le contexte au lieu de s'en servir — il dit « je vois que tu as parlé de
 * X, Y et Z » et la conversation devient un inventaire. C'est le même constat que les bornes de
 * `contexte-anam`, et il a déjà coûté une fois.
 */
export const CARTE_CHAMP_MAX = 240;

/**
 * ══ LE COMPACTAGE ═══════════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ IL SE DÉCLENCHE SUR LA LONGUEUR, PAS SUR L'HORLOGE — et c'est la décision de Julian, meilleure
 * que ce qui avait été proposé. Un job quotidien met tout le monde au même rythme et paie pour des
 * gens qui n'ont rien dit. Un seuil de longueur suit l'usage : quelqu'un qui parle beaucoup compacte
 * souvent, quelqu'un qui dit trois phrases par semaine ne compacte jamais. « Pour maximiser la
 * capacité de l'IA et s'adapter au rythme de chacun. »
 *
 * On mesure des CARACTÈRES et non des jetons : c'est déterministe, sans dépendance à un tokeniseur,
 * et l'ordre de grandeur suffit — le seuil n'est pas une limite dure de contexte, c'est le moment où
 * relire tout le verbatim cesse d'être le bon usage de la place.
 *
 * ⚠️ ET IL NE S'EXÉCUTE JAMAIS PENDANT QU'ELLE ATTEND. Le compactage est décidé sur le tour, et
 * lancé APRÈS que la réponse est partie. Un appel modèle de plus avant de répondre, c'est deux
 * secondes ajoutées au pire moment — juste avant qu'une réponse intime paraisse.
 */
export const BUDGET_COMPACTAGE_CARACTERES = 6000;

/** En dessous de ce nombre de tours, on ne compacte pas : il n'y a pas encore de matière à résumer. */
export const PLANCHER_COMPACTAGE_TOURS = 6;

export interface MatiereCompactage {
  /** Les longueurs, en caractères, des tours NON ENCORE compactés. */
  readonly longueurs: readonly number[];
}

/**
 * Faut-il compacter ? Deux conditions, et les deux comptent.
 *
 * Le PLANCHER évite de résumer trois phrases — un résumé de trois phrases est plus long que les
 * trois phrases, et il en perd les mots. Le BUDGET évite de laisser grossir indéfiniment : sans
 * promotion ni élagage, une mémoire se dégrade au lieu de s'enrichir.
 */
export function doitCompacter(m: MatiereCompactage): boolean {
  if (m.longueurs.length < PLANCHER_COMPACTAGE_TOURS) return false;
  return m.longueurs.reduce((t, n) => t + n, 0) >= BUDGET_COMPACTAGE_CARACTERES;
}

/**
 * Un tour tel que le compactage a besoin de le voir. STRUCTUREL, et volontairement plus étroit que
 * `TourFil` : le domaine ne connaît ni `id`, ni la forme d'une ligne de base (AD-1).
 */
export interface TourCompactable {
  readonly role: "utilisatrice" | "anam";
  readonly texte: string;
  readonly creeLe: string;
}

export interface TrancheCompactage {
  readonly tours: readonly TourCompactable[];
  /** La borne à écrire : l'instant du DERNIER tour inclus. `null` quand il n'y a rien à compacter. */
  readonly borne: string | null;
}

/**
 * Découpe la tranche à compacter MAINTENANT, dans l'ordre du plus ancien au plus récent.
 *
 * ⚠️ ELLE INCLUT TOUJOURS AU MOINS UN TOUR, ET C'EST UNE GARDE CONTRE UN BLOCAGE PERMANENT. Un seul
 * tour plus long que le budget — un long message écrit d'une traite, ce qui arrive précisément les
 * soirs qui comptent — laisserait sinon la tranche VIDE : la borne n'avancerait jamais, le seuil
 * resterait franchi, et le compactage se relancerait à chaque tour, éternellement, sur le même
 * verbatim. Un coût qui se répète sans jamais rien produire, et rien pour le dire.
 *
 * Ce que le budget borne, c'est donc la taille d'UNE passe, pas la taille d'un tour. Le reste du
 * retard sera repris à la passe suivante : le compactage avance par tranches, il ne rattrape pas
 * tout d'un coup.
 */
export function tranchePourCompactage(
  tours: readonly TourCompactable[],
  budget: number = BUDGET_COMPACTAGE_CARACTERES,
): TrancheCompactage {
  if (tours.length === 0) return { tours: [], borne: null };
  const retenus: TourCompactable[] = [];
  let total = 0;
  for (const t of tours) {
    if (retenus.length > 0 && total + t.texte.length > budget) break;
    retenus.push(t);
    total += t.texte.length;
  }
  return { tours: retenus, borne: retenus[retenus.length - 1].creeLe };
}

/**
 * ══ LA CONSIGNE QUI PORTE LA CARTE DANS LA CONVERSATION ═════════════════════════════════════════
 *
 * `null` quand la carte est vide : une consigne qui dit « tu ne sais rien de ses mécanismes » est du
 * bruit, et `contexte-anam` dit déjà l'ignorance là où elle compte.
 *
 * ⚠️ SA PLACE DANS L'ORDRE EST UNE GARDE, comme celle du contexte. Elle vient APRÈS la voix et le
 * contexte, et AVANT la phase et la détresse : ce qu'on lui APPREND ne peut pas primer sur ce qu'on
 * lui INTERDIT.
 */
export function consigneCarte(c: CarteContexte): MessageIa | null {
  if (carteEstVide(c)) return null;

  const l: string[] = [];
  l.push(
    "CE QUE TU AS COMPRIS D’ELLE JUSQU’ICI. Ce bloc est à toi seule : il ne s’affiche nulle part, " +
      "et elle ne l’a jamais lu.",
  );
  l.push(
    "Tu ne le récites JAMAIS, tu ne l’annonces jamais, et tu ne le lui présentes jamais comme un " +
      "portrait. Chaque ligne est une hypothèse que tu peux avoir mal comprise : si ce qu’elle dit " +
      "la contredit, c’est elle qui a raison, et tu repars de sa version.",
  );
  l.push("");

  for (const k of CHAMPS_CARTE) {
    const v = c[k];
    if (v) l.push(`${INTITULE_CHAMP[k]} : ${v}`);
  }

  l.push("");
  l.push(
    "Tu t’en sers pour ne pas lui faire tout répéter, et pour savoir où tu en es. Tu ne t’en sers " +
      "ni pour lui prouver que tu te souviens, ni pour lui expliquer qui elle est.",
  );

  return { role: "system", content: l.join("\n") };
}
