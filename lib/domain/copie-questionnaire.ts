/**
 * copie-questionnaire.ts — LES MOTS DES DEUX QUESTIONNAIRES (2026-09-03).
 *
 * ══ POURQUOI CETTE COPIE A QUITTÉ LE COMPOSANT ═════════════════════════════════════════════════
 *
 * `app/enneagramme/test-court.tsx` portait ses phrases en dur. Tant qu'il n'existait qu'un
 * questionnaire, c'était tenable ; le jour où le Big Five est arrivé avec le même écran, la seule
 * façon de partager le composant sans partager les mots était de faire DESCENDRE les mots du
 * serveur. C'est de toute façon la règle du dépôt : `render/` ne peut importer ni `@/lib/domain` ni
 * `@/lib/corpus`, et une copie recopiée dans un module de rendu est une divergence en attente.
 *
 * ⚠️ CE N'EST PAS DU CORPUS. Ces phrases disent l'ÉTAT DU PRODUIT (« tes réponses sont
 * enregistrées »), jamais ce qu'un résultat SIGNIFIE — ça, c'est `lib/corpus/`, et c'est Anima qui
 * l'écrit (FR-054, FR-086). Les deux registres ne se mélangent pas : celui-ci se rend en `t-corps`,
 * jamais en `t-anam`.
 */

/** Tout ce qu'un questionnaire dit de lui-même, hors énoncés et hors résultat. */
export interface CopieQuestionnaire {
  readonly commencer: string;
  readonly libelleCommencer: string;
  readonly libelleQuestionnaire: string;
  /** L'état « aucun résultat ne peut être retenu sans l'inventer ». */
  readonly libelleSansResultat: string;
  readonly titreSansResultat: string;
  readonly corpsSansResultat: readonly string[];
  readonly reprendre: string;
  /** L'attente entre le dernier énoncé et le résultat. */
  readonly enregistrement: string;
  readonly enregistre: string;
  readonly voir: string;
  readonly erreurReponse: string;
}

export const COPIE_QUESTIONNAIRE_ENNEAGRAMME: CopieQuestionnaire = Object.freeze({
  commencer: "Commencer",
  libelleCommencer: "Commencer l’exploration",
  libelleQuestionnaire: "Le questionnaire",
  libelleSansResultat: "Résultat sans type",
  titreSansResultat: "Le résultat reste ouvert",
  corpsSansResultat: Object.freeze([
    "Tes réponses ne permettent pas de retenir un type sans en inventer un. C’est un résultat valable : aucun type n’est enregistré.",
    "Tu peux t’arrêter ici ou reprendre depuis le début.",
  ]),
  reprendre: "Reprendre depuis le début",
  enregistrement: "Enregistrement…",
  enregistre: "Tes réponses sont enregistrées.",
  voir: "Voir ce qui ressort",
  erreurReponse: "Ta réponse n’est pas encore enregistrée.",
});

/**
 * ⚠️ LE BIG FIVE NE DIT PAS « AUCUN TYPE » — il n'en désigne aucun. Recopier la phrase de
 * l'ennéagramme aurait annoncé un type absent à quelqu'un qui n'en attendait pas, et c'est ce que
 * deux jeux de mots séparés évitent structurellement. Ce qui manque ici, ce sont des AVIS : trop de
 * « je ne sais pas » sur un même axe, et le produit préfère ne rien dire de cet axe-là.
 */
export const COPIE_QUESTIONNAIRE_BIG_FIVE: CopieQuestionnaire = Object.freeze({
  commencer: "Commencer",
  libelleCommencer: "Commencer l’inventaire",
  libelleQuestionnaire: "L’inventaire",
  libelleSansResultat: "Résultat sans position",
  titreSansResultat: "Le résultat reste ouvert",
  corpsSansResultat: Object.freeze([
    "Sur au moins un des cinq axes, tu as répondu « je ne sais pas » trop souvent pour qu’une position ait un sens. Rien n’est enregistré : c’est un résultat valable.",
    "Tu peux t’arrêter ici ou reprendre depuis le début.",
  ]),
  reprendre: "Reprendre depuis le début",
  enregistrement: "Enregistrement…",
  enregistre: "Tes réponses sont enregistrées.",
  voir: "Voir ce qui ressort",
  erreurReponse: "Ta réponse n’est pas encore enregistrée.",
});
