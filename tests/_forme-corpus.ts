/**
 * _forme-corpus.ts — LA RÈGLE DE FORME D'UNE LECTURE DE CORPUS, ÉCRITE UNE SEULE FOIS.
 *
 * ⚠️ FICHIER D'OUTILLAGE, PAS UN TEST. Le préfixe `_` suit la convention du dossier (`_absence.ts`,
 * `_imports.ts`, `_semis.ts`) et `vitest.config.ts` n'inclut que `tests/**\/*.test.ts` : rien ici
 * n'est collecté, et rien ici n'est éprouvé tout seul. Les blocs `[CONTRÔLE DU CONTRÔLE]` qui
 * prouvent que ces détecteurs MORDENT vivent chez les appelants, et c'est voulu : une fonction de
 * garde sans son contrôle est une garde qui peut être verte pour une mauvaise raison.
 *
 * ── POURQUOI ELLE A DÉMÉNAGÉ ICI (2026-09-21) ─────────────────────────────────────────────────
 *
 * Elle vivait dans `tests/corpus-architecture.test.ts`, câblée sur les six familles de `NomNombre`.
 * L'arbre de vie en ajoute dix autres, avec exactement les mêmes exigences d'écriture. La recopier
 * aurait fait vivre la règle à deux endroits — et les corrections Unicode du 2026-09-02
 * (« fêtes », « bâton », « têtes » lus comme des « tes »/« ton ») sont précisément ce qu'on ne veut
 * pas voir diverger. Elle est donc paramétrée par le LIBELLÉ de la famille au lieu d'une table
 * fermée, et rien d'autre n'a changé.
 *
 * ── LA RÈGLE, TELLE QUE LE FONDATEUR L'A TRANCHÉE LE 2026-08-31 ───────────────────────────────
 *
 *   (a) la PREMIÈRE phrase nomme la famille ET le nombre (« chemin de vie 7 », « racine 3 ») ;
 *   (b) aucun tiret cadratin « — » ni demi-cadratin « – » ;
 *   (c) 360 caractères au plus, et deux à quatre phrases ;
 *   (d) tutoiement (« tu », « ton », « ta », « tes »), jamais de vouvoiement.
 *
 * Elle ne dit RIEN de la justesse du texte, de sa bienveillance, ni de ce qu'il affirme : ça, c'est
 * la relecture d'Anima, toujours due. Et elle n'affaiblit aucune garde existante — le lexique, la
 * prédiction et l'apostrophe restent tenus par leurs propres tests, sur les mêmes textes.
 */

/** « Beaucoup plus concis » : la borne est nommée, mesurée en points de code, pas en octets. */
export const LONGUEUR_MAX_LECTURE = 360;

export function premierePhrase(texte: string): string {
  return texte.split(/(?<=[.!?])\s+/)[0] ?? "";
}

export function nombreDePhrases(texte: string): number {
  return texte.split(/[.!?]+(?:\s+|$)/).filter((p) => p.trim().length > 0).length;
}

export interface OptionsFormeCorpus {
  /**
   * Un marqueur que le texte DOIT contenir, pour les familles dont deux variantes partagent le même
   * libellé et la même valeur. L'arbre de vie en a une paire : « ta qualité 5 » se dit d'une manière
   * quand la lettre est là et d'une autre quand elle manque, et sans ce marqueur les deux textes
   * seraient interchangeables sans que rien ne rougisse.
   */
  readonly marqueurRequis?: RegExp;
}

/**
 * Les défauts de forme d'une lecture — vide si elle a la structure demandée. Écrit UNE fois.
 *
 * `libelle` est le nom de la famille tel qu'il doit apparaître dans la première phrase, en
 * minuscules : « chemin de vie », « année personnelle », « racine », « écorce »…
 */
export function defautsDeStructure(
  libelle: string,
  valeur: number,
  texte: string,
  options?: OptionsFormeCorpus,
): string[] {
  const defauts: string[] = [];
  // ⚠️ FRONTIÈRES UNICODE, ET PAS `\b`. Mesuré le 2026-09-21 sur la famille « écorce » : `\b` est
  // ASCII, donc il n'y a AUCUNE frontière entre une espace et un « é ». `\bécorce` ne matche jamais,
  // et les neuf textes de cette famille étaient refusés alors qu'ils disaient exactement ce qu'on
  // leur demandait. Les six familles du socle commencent toutes par une lettre ASCII : le trou
  // existait depuis le début et ne pouvait pas se voir. C'est le même défaut que la revue du
  // 2026-09-02 a corrigé sur le détecteur de tutoiement, dans ce fichier, quelques lignes plus bas.
  const attendu = new RegExp(`(?<![\\p{L}\\d])${libelle} ${valeur}(?![\\p{L}\\d])`, "iu");
  if (!attendu.test(premierePhrase(texte))) {
    defauts.push(`(a) la première phrase ne dit pas « ${libelle} ${valeur} »`);
  }
  if (/[—–]/.test(texte)) defauts.push("(b) tiret cadratin ou demi-cadratin");
  const longueur = [...texte].length;
  if (longueur > LONGUEUR_MAX_LECTURE) defauts.push(`(c) ${longueur} caractères, plus de ${LONGUEUR_MAX_LECTURE}`);
  const phrases = nombreDePhrases(texte);
  if (phrases < 2 || phrases > 4) defauts.push(`(c) ${phrases} phrase(s), il en faut deux à quatre`);
  // Frontières UNICODE : `\b` est ASCII et laissait passer « fêtes », « bâton », « têtes » comme
  // des « tes »/« ton » (revue du 2026-09-02). L'apostrophe typographique compte comme lettre
  // (« t’attend » n'est pas « ta »).
  if (!/(?<![\p{L}’])(?:tu|ton|ta|tes)(?![\p{L}])/iu.test(texte)) defauts.push("(d) aucun tutoiement");
  // « rendez-VOUS » n'est pas un vouvoiement — même précaution que `qa-visuelle-19-aout.test.ts`.
  if (/(?<![\p{L}-])(?:vous|vos|votre)(?![\p{L}])/iu.test(texte)) defauts.push("(d) vouvoiement");
  if (options?.marqueurRequis && !options.marqueurRequis.test(texte)) {
    defauts.push(`(e) le texte ne porte pas son marqueur ${options.marqueurRequis}`);
  }
  return defauts;
}
