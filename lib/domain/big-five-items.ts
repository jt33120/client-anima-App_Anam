import type { NiveauReponse } from "./echelle-likert";
import type { Facteur, ItemBaremeBigFive } from "./big-five";

/**
 * big-five-items.ts — LES VINGT ÉNONCÉS (2026-09-03).
 *
 * Même forme et mêmes refus que `enneagramme-items.ts` :
 *
 *   • LE FACTEUR NE DESCEND JAMAIS AVEC L'ÉNONCÉ (`itemsPourAffichage`). Servir le barème dans le
 *     HTML, c'est laisser voir ce que chaque phrase pèse, et le savoir EN RÉPONDANT ;
 *   • L'ORDRE MÊLE LES FACTEURS. Cinq blocs de quatre rendraient la grille lisible à l'œil nu ;
 *   • AUCUN INDICATEUR DE PROGRESSION à l'écran (FR-031), donc un test court : vingt énoncés.
 *
 * ── QUATRE PAR FACTEUR, DONT DEUX INVERSÉS ─────────────────────────────────────────────────────
 *
 * Deux ne suffisent pas ici, contrairement à l'ennéagramme : on ne cherche pas le plus grand des
 * neuf, on situe chacun des cinq sur son axe, et une position se décide à une réponse près quand il
 * n'y en a que deux. Quatre, dont deux écrits à l'envers, est le plus petit jeu qui résiste à la
 * tendance à acquiescer (voir `inverse` dans `big-five.ts`).
 *
 * ── LA VOIX DES ÉNONCÉS ────────────────────────────────────────────────────────────────────────
 *
 * Des SITUATIONS, jamais des étiquettes. « Es-tu quelqu'un d'anxieux » demande à la personne de se
 * juger, avec un mot que le produit s'interdit ; « une contrariété t'arrive en début de journée, à
 * quelle fréquence l'as-tu oubliée le soir » demande un fait qu'elle peut observer.
 */

export interface ItemBigFive extends ItemBaremeBigFive {
  readonly texte: string;
}

export const ITEMS_BIG_FIVE: readonly ItemBigFive[] = Object.freeze([
  { id: "b01", facteur: "ouverture", inverse: false, texte: "Une idée nouvelle passe dans une conversation. À quelle fréquence vas-tu la creuser de ton côté ensuite ?" },
  { id: "b02", facteur: "conscience", inverse: false, texte: "Tu t’engages sur une date. À quelle fréquence t’y tiens-tu sans qu’on ait à te relancer ?" },
  { id: "b03", facteur: "extraversion", inverse: false, texte: "Une soirée réunit des gens que tu connais peu. À quelle fréquence en repars-tu avec plus d’énergie qu’en arrivant ?" },
  { id: "b04", facteur: "agreabilite", inverse: false, texte: "Quelqu’un défend un avis opposé au tien. À quelle fréquence cherches-tu d’abord ce qu’il a de juste ?" },
  { id: "b05", facteur: "stabilite", inverse: false, texte: "Une contrariété arrive en début de journée. À quelle fréquence l’as-tu laissée derrière toi le soir ?" },

  { id: "b06", facteur: "ouverture", inverse: true, texte: "Tu choisis un restaurant, un film, un trajet. À quelle fréquence reprends-tu ce que tu connais déjà ?" },
  { id: "b07", facteur: "conscience", inverse: true, texte: "Une tâche sans échéance t’attend. À quelle fréquence la repousses-tu au lendemain ?" },
  { id: "b08", facteur: "extraversion", inverse: true, texte: "Un week-end s’ouvre sans rien de prévu. À quelle fréquence préfères-tu le passer seul ?" },
  { id: "b09", facteur: "agreabilite", inverse: true, texte: "On te demande un service qui t’arrange mal. À quelle fréquence refuses-tu sans y revenir ?" },
  { id: "b10", facteur: "stabilite", inverse: true, texte: "Une réponse que tu attends tarde à venir. À quelle fréquence y repenses-tu plusieurs fois dans la journée ?" },

  { id: "b11", facteur: "ouverture", inverse: false, texte: "Tu tombes sur un sujet dont tu ne sais rien. À quelle fréquence lis-tu plus loin que le premier paragraphe ?" },
  { id: "b12", facteur: "conscience", inverse: false, texte: "Tu commences quelque chose de long. À quelle fréquence prépares-tu les étapes avant de t’y mettre ?" },
  { id: "b13", facteur: "extraversion", inverse: false, texte: "Un silence s’installe dans un groupe. À quelle fréquence est-ce toi qui reprends la parole ?" },
  { id: "b14", facteur: "agreabilite", inverse: false, texte: "Quelqu’un raconte une difficulté. À quelle fréquence poses-tu des questions avant de donner ton avis ?" },
  { id: "b15", facteur: "stabilite", inverse: false, texte: "Un imprévu bouscule ton programme. À quelle fréquence te réorganises-tu sans que ça te pèse ?" },

  { id: "b16", facteur: "ouverture", inverse: true, texte: "Une manière de faire fonctionne depuis longtemps. À quelle fréquence préfères-tu la garder telle quelle ?" },
  { id: "b17", facteur: "conscience", inverse: true, texte: "Tu ranges après avoir terminé. À quelle fréquence laisses-tu les choses en l’état pour plus tard ?" },
  { id: "b18", facteur: "extraversion", inverse: true, texte: "Une invitation arrive pour un grand groupe. À quelle fréquence cherches-tu une raison de ne pas y aller ?" },
  { id: "b19", facteur: "agreabilite", inverse: true, texte: "Une discussion tourne au désaccord. À quelle fréquence tiens-tu ta position jusqu’au bout ?" },
  { id: "b20", facteur: "stabilite", inverse: true, texte: "Tu repenses à une conversation passée. À quelle fréquence te dis-tu que tu aurais dû répondre autrement ?" },
] as const);

/**
 * Les libellés de l'échelle, descendus du serveur avec les questions.
 *
 * ⚠️ RECOPIÉS DE L'ENNÉAGRAMME, ET C'EST DÉLIBÉRÉ. `render/` ne peut importer ni `@/lib/domain` ni
 * `@/lib/corpus` : les deux tests ont donc chacun besoin des libellés dans leur propre descente.
 * Les partager demanderait un module commun de COPIE, alors que ce qui est commun ici est
 * l'ÉCHELLE (déjà partagée, `echelle-likert.ts`) et non les mots. `tests/big-five.test.ts` exige
 * seulement qu'ils restent identiques à ceux de l'ennéagramme : deux échelles qui divergeraient
 * feraient deux tests qui ne se lisent plus pareil.
 */
export const LIBELLES_NIVEAU_BIG_FIVE: Readonly<Record<NiveauReponse, string>> = Object.freeze({
  0: "Jamais ou presque",
  1: "Parfois",
  2: "Souvent",
  3: "Presque toujours",
});

export const LIBELLE_INCONNU_BIG_FIVE = "Je ne sais pas";

/** Ce qu'un énoncé montre à l'écran : son identité et sa phrase. Jamais son facteur. */
export interface ItemAfficheBigFive {
  readonly id: string;
  readonly texte: string;
}

export function itemsPourAffichageBigFive(): readonly ItemAfficheBigFive[] {
  return Object.freeze(
    ITEMS_BIG_FIVE.map(({ id, texte }) => Object.freeze({ id, texte })),
  );
}

/** Le barème nu, pour le calcul. Le texte n'y entre pas : `conclure` n'en a pas besoin. */
export function baremeBigFive(): readonly ItemBaremeBigFive[] {
  return Object.freeze(
    ITEMS_BIG_FIVE.map(({ id, facteur, inverse }) => Object.freeze({ id, facteur, inverse })),
  );
}

/** Les intitulés des cinq facteurs, tels qu'ils s'affichent. */
export const FACTEUR_LIBELLE: Readonly<Record<Facteur, string>> = Object.freeze({
  ouverture: "Ouverture",
  conscience: "Application",
  extraversion: "Extraversion",
  agreabilite: "Accord",
  stabilite: "Stabilité",
});

/**
 * Ce que l'écran dit quand le test n'a pas été passé.
 *
 * ⚠️ CE N'EST PAS UN TEXTE DE CORPUS. Le corpus dit ce qu'un facteur SIGNIFIE — c'est Anima qui
 * l'écrit. Cette phrase-ci dit l'ÉTAT DU PRODUIT, et se rend dans un autre registre (Story 7.8).
 * Aucune mesure, aucun « incomplet » : le test n'est pas commencé, ce n'est pas un manque.
 */
export const MESSAGE_BIG_FIVE_ABSENT =
  "Tu n’as pas encore passé cet inventaire. Vingt situations, et tu peux t’arrêter en route.";

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Ce que la halte dit d'elle-même
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// ⚠️ CE N'EST PAS DU CORPUS. Ces phrases disent CE QU'EST L'OUTIL et ce qu'il ne prouve pas ; le
// SENS d'un résultat vit dans `lib/corpus/big-five.ts`. Les deux registres ne se mélangent pas.

export const INTRODUCTION_BIG_FIVE =
  "Le Big Five décrit la personnalité sur cinq axes indépendants plutôt qu’en catégories. C’est " +
  "le modèle le plus étudié par la recherche en psychologie, et le seul de cette halte à ne pas " +
  "ranger les gens dans des cases.";

export const LIMITE_BIG_FIVE =
  "Cette version courte situe chaque axe entre trois positions, jamais par un score ni un " +
  "pourcentage. Le résultat décrit des tendances, il ne prouve rien de qui tu es, et il peut " +
  "rester ouvert sur un axe dont tu as peu dit.";

export const ANNONCE_DU_TEST_BIG_FIVE =
  "Vingt situations. Pour chacune, indique ce qui t’arrive le plus souvent. Tu peux répondre " +
  "« Je ne sais pas » : cette réponse reste inconnue et ne vaut jamais zéro. Tu peux aussi " +
  "t’arrêter et reprendre plus tard : ce que tu as posé reste là.";

/**
 * ⚠️ CE MESSAGE EXISTE POUR LA MÊME RAISON QUE SON JUMEAU DE L'ENNÉAGRAMME. Un créneau vide n'est
 * pas un défaut du produit, et l'écran le dit dans la voix du PRODUIT — jamais dans celle d'Anam,
 * et jamais en accusant Anima d'un vide qui n'est pas le sien.
 */
export const MESSAGE_FACTEUR_SANS_TEXTE =
  "Anima n’a pas encore écrit ce qu’elle voit sur cet axe. Son texte se posera ici.";

/** Les trois positions, telles qu'elles se lisent à l'écran. Aucun nombre, aucune jauge (FR-031). */
export const POSITION_LIBELLE: Readonly<Record<"bas" | "median" | "haut", string>> = Object.freeze({
  bas: "Plutôt bas",
  median: "Au milieu",
  haut: "Plutôt haut",
});

export const TITRE_HALTE_BIG_FIVE = "Situer tes cinq axes";
export const REFAIRE_BIG_FIVE = "Refaire l’inventaire";
export const EFFACER_BIG_FIVE = "Effacer";
export const ORIGINE_BIG_FIVE = "C’est ce qui ressort de tes réponses.";
