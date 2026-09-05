import {
  corpus,
  lireTexte,
  type Corpus,
  type TexteCorpus,
  creneau,
} from "./port";
import {
  TYPES,
  type ResultatTest,
  type TypeEnneagramme,
} from "../domain/enneagramme";

/**
 * enneagramme.ts — LES NEUF INTERPRÉTATIONS DE TYPE (Story 5.5, AC1 — FR-054).
 *
 * Quatrième corpus du produit, après la numérologie (69 créneaux), les mantras (60) et l'horoscope
 * (27). Même port, même format de clé `"<domaine>:<valeur>"` — décidé une fois en 5.2, où le
 * commentaire réservait déjà nommément la place de celui-ci.
 *
 * ⚠️ CE MODULE NE CONTIENT AUCUN TEXTE — MAIS LES NEUF SONT ÉCRITS. Cet en-tête a dit « tous
 * `non_ecrit` » bien après qu'Anima les a livrés : ils vivent dans `lib/corpus/textes-de-base.ts:108-117`
 * et `creneau()` les résout par clé. Même piège de lecture que dans `numerologie.ts`, corrigé le
 * même jour. L'état réel se lit dans `lib/corpus/README.md`, que `tests/corpus-etat.test.ts`
 * recalcule depuis le code — jamais dans un paragraphe.
 *
 * La règle, elle, n'a pas bougé : les remplir NOUS-MÊMES signerait du nom d'une personne réelle un
 * texte qu'elle n'a pas écrit (FR-086) ; les faire générer par un modèle serait la même faute en
 * pire (FR-047/FR-054). Un créneau resté vide s'affiche honnêtement comme non écrit — exactement
 * comme le socle annonce ce qu'il ne peut pas calculer sans l'heure de naissance.
 *
 * ══ NEUF, ET PAS UN DE PLUS ══════════════════════════════════════════════════════════════════════
 *
 * Ailes (18), instincts (27), flèches (18), croisement complet (54) : chacun est un produit
 * cartésien sur les neuf types. La 5.4 a écrit la règle en refusant les siens — on garde l'axe
 * qu'une personne identifie comme ELLE, on refuse le croisement. Et contrairement au mantra, le
 * texte est lu UNE FOIS, pas chaque matin : aucun cycle de rotation n'est nécessaire.
 *
 * Ajouter des clés plus tard ne casse rien et l'inventaire de complétude suit — mais on part d'ici.
 */

/** Le nombre de types. Nommé plutôt qu'écrit en dur : l'inventaire s'y adosse. */
export const CARDINAL_ENNEAGRAMME = 9;

/**
 * Lexique éditorial général. Le nom ouvre la lecture ; le numéro reste un repère secondaire.
 * Chaque définition décrit un mouvement possible, jamais une identité figée ni un diagnostic.
 */
export const LEXIQUE_ENNEAGRAMME = Object.freeze({
  1: Object.freeze({
    nom: "Le Juste",
    definition:
      "Recherche la cohérence et l’amélioration. Sa rigueur soutient la qualité ; son point de vigilance est une exigence qui peut devenir dure envers soi ou les autres.",
  }),
  2: Object.freeze({
    nom: "L’Aidant",
    definition:
      "Se rend disponible et perçoit vite les besoins relationnels. Sa générosité nourrit les liens ; son point de vigilance est d’oublier ou de taire ses propres besoins.",
  }),
  3: Object.freeze({
    nom: "L’Accomplisseur",
    definition:
      "Oriente son énergie vers l’action et les résultats. Son adaptabilité fait avancer les projets ; son point de vigilance est de confondre sa valeur avec ce qu’il réussit.",
  }),
  4: Object.freeze({
    nom: "Le Singulier",
    definition:
      "Cherche une expression authentique et sensible de l’expérience. Sa profondeur ouvre des nuances ; son point de vigilance est de laisser le manque éclipser ce qui est présent.",
  }),
  5: Object.freeze({
    nom: "L’Observateur",
    definition:
      "Prend du recul pour comprendre avant de s’engager. Sa capacité d’analyse apporte de la clarté ; son point de vigilance est de rester à distance quand l’action ou le lien appelle.",
  }),
  6: Object.freeze({
    nom: "Le Loyaliste",
    definition:
      "Anticipe les risques et protège ce qui compte. Sa vigilance rend fiable et solidaire ; son point de vigilance est de laisser le doute retarder une décision pourtant mûre.",
  }),
  7: Object.freeze({
    nom: "L’Enthousiaste",
    definition:
      "Explore les possibles avec curiosité et élan. Son inventivité ouvre des chemins ; son point de vigilance est de multiplier les options pour éviter une limite ou un inconfort.",
  }),
  8: Object.freeze({
    nom: "Le Protecteur",
    definition:
      "Va au contact avec franchise et intensité. Sa force défend les personnes et les causes ; son point de vigilance est de prendre toute la place ou tout le poids sur ses épaules.",
  }),
  9: Object.freeze({
    nom: "Le Médiateur",
    definition:
      "Cherche l’accord et sait accueillir plusieurs points de vue. Son calme facilite le lien ; son point de vigilance est d’effacer sa propre priorité pour maintenir la paix.",
  }),
} satisfies Record<TypeEnneagramme, { readonly nom: string; readonly definition: string }>);

export function lexiqueDuType(type: TypeEnneagramme) {
  return LEXIQUE_ENNEAGRAMME[type];
}

/**
 * La clé d'un créneau : `"enneagramme:4"`.
 *
 * JETTE hors domaine, comme `cleMantra` et `cleNombre`. Une clé fabriquée à partir d'un type
 * invalide n'est pas une absence de texte, c'est un défaut de code — et `lireTexte` la refuserait
 * de toute façon, plus loin et moins clairement.
 */
export function cleEnneagramme(type: number): string {
  if (!Number.isInteger(type) || type < 1 || type > CARDINAL_ENNEAGRAMME) {
    throw new Error(
      `corpus ennéagramme : type hors domaine (${type}) — attendu 1..${CARDINAL_ENNEAGRAMME}`,
    );
  }
  return `enneagramme:${type}`;
}

/** Les neuf clés, dans l'ordre des types. Exportée pour rendre la complétude mesurable. */
export const CLES_ENNEAGRAMME: readonly string[] = Object.freeze(
  TYPES.map((t) => `enneagramme:${t}`),
);

/**
 * ⚠️ TOUS LES CRÉNEAUX SONT `NON_ECRIT`. La table se construit depuis `CLES_ENNEAGRAMME` plutôt
 * qu'en neuf lignes recopiées : une liste écrite à la main finirait par diverger de la source.
 *
 * Anima écrit en remplaçant une entrée :
 *
 *     [cleEnneagramme(4)]: ecrit("…"),
 */
export const CORPUS_ENNEAGRAMME: Corpus = corpus(
  "enneagramme",
  Object.fromEntries(CLES_ENNEAGRAMME.map((cle) => [cle, creneau(cle)])),
);

/**
 * L'interprétation d'un type retenu.
 *
 * ⚠️ REND `null` QUAND IL N'Y A PAS DE TYPE, et c'est la troisième valeur qui compte. Le port ne
 * connaît que `ecrit` et `non_ecrit` ; ici il faut distinguer « Anima ne l'a pas encore écrit » de
 * « il n'y a rien à écrire, parce qu'aucun type n'a été retenu ». Confondre les deux ferait dire au
 * produit « ce texte n'est pas encore écrit » à quelqu'un dont le test n'a désigné personne — une
 * promesse de texte à venir, là où le résultat est un ex æquo qu'on lui doit d'expliquer.
 *
 * C'est la signature de jonction de la 5.2, à l'identique (`texteDe(nombre, lecture)`).
 */
export function texteDuType(resultat: ResultatTest): TexteCorpus | null {
  if (resultat.statut !== "retenu") return null;
  return lireTexte(CORPUS_ENNEAGRAMME, cleEnneagramme(resultat.type));
}

/** Variante directe, pour un type déjà retenu et relu depuis la base. */
export function texteDuTypeRetenu(type: TypeEnneagramme): TexteCorpus {
  return lireTexte(CORPUS_ENNEAGRAMME, cleEnneagramme(type));
}

export interface RepereEnneagramme {
  readonly type: TypeEnneagramme;
  readonly nom: string;
  readonly definition: string;
}

/**
 * Les repères que l'introduction peut déplier.
 *
 * Ces définitions générales viennent du lexique relu et existent indépendamment d'une lecture
 * personnelle. Un créneau de corpus non écrit ne doit donc jamais faire disparaître l'un des neuf
 * repères qui aide justement à comprendre le questionnaire.
 */
export function reperesPourIntroduction(): readonly RepereEnneagramme[] {
  return Object.freeze(
    TYPES.map((type) => {
      const lexique = lexiqueDuType(type);
      return Object.freeze({ type, nom: lexique.nom, definition: lexique.definition });
    }),
  );
}
