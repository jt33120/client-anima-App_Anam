import { indiceDuJour, type JourCivil } from "@/lib/astro/quotidien";
import type { TexteCorpus } from "@/lib/corpus/port";
import { terme, type CleTerme } from "./vocabulaire";

/**
 * bibliotheque.ts — LE MODÈLE DE L'ACCUEIL (Story 5.6, T3). Pur (AD-1) : zéro I/O, zéro Supabase,
 * zéro `server-only`. Il décide de l'ORDRE et de la MISE EN AVANT ; il ne lit rien et n'écrit rien.
 *
 * ── LA GARDE FR-031 EST LE TYPE, PAS UN TEST DE RENDU ──────────────────────────────────────────
 *
 * UX-DR-30 : « aucun badge, aucun compteur, aucun cadenas ». La façon naturelle de tester ça serait
 * de balayer le DOM à la recherche d'un chiffre — et c'est **impossible ici** : la carte des nombres
 * affiche des nombres, celle de l'ennéagramme affiche un type, celle du thème affiche des degrés
 * quand l'heure est connue. Un test lexical serait donc soit vide, soit faux.
 *
 * La 4.10 a déjà payé cette leçon sur l'arbitrage (`tests/arbitrage-frontiere.test.ts`) : « la façon
 * naturelle de faire fuir un compte est de l'ajouter au type qui traverse la frontière, donc c'est
 * le type qui garde. » Ici, `CarteBibliotheque` n'a **aucun champ** capable de porter une mesure —
 * pas de `badge`, pas de `compte`, pas de `total`, pas de `nouveau`, pas de `verrouille`. Il n'y a
 * nulle part où l'écrire, donc rien à masquer au rendu.
 *
 * ── ET AUCUNE CARTE INDISPONIBLE N'EST CONSTRUITE ──────────────────────────────────────────────
 *
 * Le corollaire du même choix : `cartesDisponibles` **retire** ce que le compte n'a pas, au lieu de
 * le construire puis de le verrouiller. C'est la traduction littérale du refus de conception
 * d'`EXPERIENCE.md` §511 — « teaser en permanence ce qu'on ne peut pas avoir contredit FR-057 ».
 * La disponibilité est DÉRIVÉE du glossaire (`vocabulaire.ts`) : une carte dont le terme est premium
 * est premium, sans drapeau à tenir à jour en double.
 */

/** Les cartes du socle. Une sixième se déclare ICI, jamais dans un composant. */
/**
 * ⚠️ « theme » ET « nombres » ONT ÉTÉ RETIRÉS LE 2026-08-25 (Story 7.7), et c'est le TYPE qui le
 * rend irréversible par distraction : les recréer ne compile pas tant qu'on ne les rajoute pas ici,
 * ce qui oblige à relire la décision.
 *
 * Retour de Julian : « Ton thème : ça sert à rien de le voir tous les jours » et « Pareil pour tes
 * nombres, ce n'est pas quelque chose qui change tous les jours ». Il avait raison, et le dépôt le
 * prouvait deux fois : « Ton thème » portait `texte: NON_ECRIT` EN DUR — donc une panne permanente
 * un jour sur cinq en position mise en avant — et la carte des nombres imposait une lecture de base
 * sur le chemin critique de l'écran le plus lourd, pour un contenu qui ne changera plus jamais.
 *
 * Ils ne sont pas PERDUS : la halte « Ton socle » (Story 7.5) les rend en ENTIER — les six nombres
 * avec leurs six textes au lieu d'un, et les dix corps au lieu de cinq.
 */
export type CleCarte = "mantra" | "horoscope" | "enneagramme";

/**
 * Une ligne de fait CALCULÉ, déjà mise en mots par le domaine — le rendu ne formate rien (AD-7).
 * `valeur` est du texte parce que « Balance » et « 7 » se présentent pareil : le rendu n'a pas à
 * savoir lequel est un nombre.
 */
export interface LigneFait {
  readonly intitule: string;
  readonly valeur: string;
}

export interface CarteBibliotheque {
  readonly cle: CleCarte;
  /** Le titre affiché. Source unique — sous `lib/`, donc balayé par le contrôle de voix (2.8). */
  readonly titre: string;
  /**
   * Le terme du glossaire quand la carte en porte un (FR-080), `null` sinon. C'est lui qui décide
   * de la disponibilité : pas de drapeau `premium` recopié ici, qui pourrait diverger.
   */
  readonly terme: CleTerme | null;
  /** Ce que le SOCLE a calculé. Vide = il n'y a rien de calculé à montrer (le mantra, par nature). */
  readonly faits: readonly LigneFait[];
  /** Ce qu'ANIMA a écrit — ou n'a pas encore écrit. L'union force à traiter le second cas (FR-054). */
  readonly texte: TexteCorpus;
  /**
   * CE QUE LE PRODUIT DIT DE SON PROPRE ÉTAT — troisième registre, ajouté le 2026-08-25 (Story 7.8).
   *
   * ══ POURQUOI IL FALLAIT UN TROISIÈME REGISTRE ══════════════════════════════════════════════
   *
   * Une carte portait deux choses : des FAITS calculés, et le TEXTE d'Anima. Un compte qui n'a pas
   * passé le test d'ennéagramme n'a ni l'un ni l'autre — et l'écran affichait donc « Anima n'a pas
   * encore écrit cette carte », à 100 % des comptes neufs. C'était FAUX : les neuf textes de type
   * SONT écrits depuis la Story 5.5. Ce qui manque n'est pas le texte, c'est le test.
   *
   * Retour de Julian, 2026-08-25 : « c'est à toi de dire : vous n'avez pas encore fait votre
   * ennéagramme, faites-le maintenant. » Le produit désignait un blocage chez quelqu'un d'autre là
   * où il y avait un geste à un clic, et personne ne pouvait le deviner.
   *
   * ⚠️ CE N'EST PAS UN TROISIÈME ÉTAT DE `texte`, ET C'EST TOUT LE SUJET. `lib/corpus/port.ts`
   * refuse d'exister un « texte par défaut » : glisser cette phrase dans `texte` la ferait paraître
   * sous la plume d'Anima, en `t-anam`, alors qu'elle n'est pas d'elle. Deux registres, deux
   * champs, deux styles de rendu — et FR-054/FR-086 tient sans dépendre de la discipline.
   *
   * ⚠️ ET CE N'EST PAS UNE PLACE POUR UNE MESURE (FR-031, DUR). `tests/bibliotheque-frontiere.test.ts`
   * refuse qu'une valeur d'`etat` porte un compte, un pourcentage ou une progression : c'est le
   * champ le plus tentant du type pour y écrire « 3 cartes sur 5 ».
   */
  readonly etat: string | null;
}

/**
 * L'ORDRE FIXE (AC1). Une constante, dans l'ordre d'`EXPERIENCE.md` §66 — aucun tri ne s'applique
 * entre ici et le rendu, hors la mise en tête de la carte du jour.
 *
 * ⚠️ UX-DR-30 pose un plancher de 3 et un plafond de 6. La borne est vérifiée au chargement du
 * module plutôt qu'en test : une septième carte ajoutée par une story future ne peut pas franchir
 * le plafond en silence.
 *
 * ⚠️ LE PLANCHER ÉTAIT DE 4, ET IL A ÉTÉ ABAISSÉ À 3 PAR DÉCISION ÉCRITE (2026-08-25), pas par
 * commodité. Retour de Julian : « Ton thème : ça sert à rien de le voir tous les jours » et
 * « Pareil pour tes nombres ». Les deux cartes quittent l'accueil pour la halte « Ton socle »
 * (Story 7.5), et le catalogue tombe à trois clés. La décision, son motif et son prix sont écrits
 * dans l'amendement du 2026-08-25 en fin d'`EXPERIENCE.md`, §3.
 *
 * ⚠️ CE QUE CETTE BORNE COMPTE : LES CLÉS DU CATALOGUE, DONC LES OBJETS DE CETTE GRILLE. L'ancienne
 * carte « Anam se manifeste » a été retirée : la conversation est déjà son espace et la répéter
 * ici brouillait la région d'accueil (« Moi » alors, « Aujourd’hui » depuis le 2026-09-02). La garde
 * dédiée `tests/rendu/carte-anam.test.tsx` empêche son retour.
 *
 * ⚠️ LES QUATRE VALEURS SONT SOLIDAIRES, ET LA CI LE VÉRIFIE. Le plancher est écrit ici (commentaire
 * ET assertion), ligne 144 d'`EXPERIENCE.md`, dans son amendement, et dans UX-DR-30
 * (`epics.md:220`). `tests/architecture-information.test.ts` échoue si l'une diverge : changer ce
 * nombre tout seul ne compile pas la décision, il la casse.
 */
export const CATALOGUE_CARTES: readonly CleCarte[] = Object.freeze([
  "mantra",
  "horoscope",
  "enneagramme",
]);

if (CATALOGUE_CARTES.length < 3 || CATALOGUE_CARTES.length > 6) {
  throw new Error(
    `bibliotheque : ${CATALOGUE_CARTES.length} cartes au catalogue — UX-DR-30 en exige 3 à 6`,
  );
}

const RANG = new Map(CATALOGUE_CARTES.map((c, i) => [c, i]));

/** Remet les cartes dans l'ordre du catalogue, quel que soit l'ordre d'arrivée. */
function ordreCatalogue(cartes: readonly CarteBibliotheque[]): readonly CarteBibliotheque[] {
  return [...cartes].sort((a, b) => (RANG.get(a.cle) ?? 99) - (RANG.get(b.cle) ?? 99));
}

/**
 * La carte a-t-elle quelque chose à montrer aujourd'hui ?
 *
 * Un fait calculé suffit : « Soleil en Balance » se tient tout seul, même sans le texte d'Anima.
 * Une carte sans fait ET sans texte — le mantra du jour tant que les 60 créneaux sont vides — n'a
 * rien. Elle reste AFFICHÉE (elle dit honnêtement ce qui manque, AC5), mais elle ne peut pas être
 * la carte mise en avant : ouvrir l'accueil sur une carte muette en tête serait absurde.
 */
export function estPresentable(carte: CarteBibliotheque): boolean {
  return carte.faits.length > 0 || carte.texte.statut === "ecrit";
}

/** Ce que ce compte peut avoir. Le premium est DÉRIVÉ du glossaire, jamais recopié (AC2/AC8). */
export function cartesDisponibles(
  cartes: readonly CarteBibliotheque[],
  aPremium: boolean,
): readonly CarteBibliotheque[] {
  if (aPremium) return cartes;
  return cartes.filter((c) => c.terme === null || !terme(c.terme).premium);
}

/**
 * LA CLÉ DE LA CARTE DU JOUR — exportée séparément, et c'est une décision de testabilité autant que
 * de conception.
 *
 * Même piège qu'en 5.4 pour `cleMantraDuJour` : **tant qu'aucun texte n'est écrit, deux cartes vides
 * sont indiscernables**. Une rotation cassée (« toujours la première ») resterait donc invisible
 * jusqu'au jour de la mise en ligne. Exposer la clé donne une porte par laquelle la rotation se
 * vérifie sans dépendre du contenu.
 *
 * La rotation ne prend QUE le jour civil (patron `indiceDuJour`) : aucun paramètre par lequel un
 * signal de comportement, une fraîcheur ou une donnée personnelle pourrait entrer. FR-033
 * (« jamais algorithmique ») devient une propriété de la signature, pas une consigne.
 *
 * Elle tourne sur les seules cartes PRÉSENTABLES (AC5). Prix à connaître : l'ensemble présentable
 * dépend de l'état du corpus, donc la carte d'un jour donné changera quand Anima écrira. Il n'y a
 * pas d'archive en v1 (`EXPERIENCE.md` §607), donc personne ne peut constater l'écart — mais c'est
 * un fait, pas un détail à taire.
 */
export function cleCarteDuJour(
  jour: JourCivil,
  cartes: readonly CarteBibliotheque[],
): CleCarte | null {
  const presentables = ordreCatalogue(cartes).filter(estPresentable);
  if (presentables.length === 0) return null;
  return presentables[indiceDuJour(jour, presentables.length)].cle;
}

export interface Bibliotheque {
  /** Les cartes dans l'ordre d'affichage : la carte du jour en tête, le reste au catalogue. */
  readonly cartes: readonly CarteBibliotheque[];
  /** Celle qui est mise en avant, ou `null` si aucune n'a rien à montrer aujourd'hui. */
  readonly enAvant: CleCarte | null;
}

/** L'assemblage final : ordre fixe + une seule carte en tête (AC1). */
export function assemblerBibliotheque(
  cartes: readonly CarteBibliotheque[],
  jour: JourCivil,
): Bibliotheque {
  const dansOrdre = ordreCatalogue(cartes);
  const enAvant = cleCarteDuJour(jour, cartes);
  if (enAvant === null) return { cartes: dansOrdre, enAvant: null };
  const tete = dansOrdre.filter((c) => c.cle === enAvant);
  const reste = dansOrdre.filter((c) => c.cle !== enAvant);
  return { cartes: [...tete, ...reste], enAvant };
}
