/**
 * _dates-paris.ts — LES DATES DE NAISSANCE SE CALCULENT DANS LE CALENDRIER DE LA BASE.
 *
 * ══ POURQUOI CE MODULE EXISTE ═══════════════════════════════════════════════════════════════════
 *
 * Le déclencheur de majorité (`0048_majorite_dans_le_trigger.sql`) pose
 * `v_aujourdhui := (now() at time zone 'Europe/Paris')::date` — le jour CIVIL du produit. Un test
 * qui calcule ses dates avec `new Date().toISOString()` travaille, lui, en **UTC**.
 *
 * Entre 22 h et minuit UTC — soit 0 h à 2 h à Paris en été — Paris est DÉJÀ le lendemain. Les deux
 * bornes différaient alors d'un jour exactement, et la CI rougissait **deux heures par nuit, tous
 * les jours**, sans qu'une ligne du produit ait changé (mesuré le 2026-08-25 à 22 h 13 UTC).
 *
 * ⚠️ UN TEST QUI ÉCHOUE SUR UNE HORLOGE EST PIRE QU'UN TEST ABSENT : il apprend à ne plus lire le
 * rouge. C'est la même leçon que le test de poussée « capricieux » du 2026-08-25 — qui n'était pas
 * capricieux non plus.
 *
 * Extrait ici plutôt que laissé dans le fichier de test SQL pour une raison précise : sous cette
 * forme, `tests/dates-paris.test.ts` peut l'éprouver **à toutes les heures du jour**, sans base.
 */

/** Le jour civil de Paris, au format `AAAA-MM-JJ` — celui que la base compare. */
export function jourCivilParisIso(maintenant: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(maintenant);
}

/**
 * Une date de naissance située `annees` avant le jour civil de Paris, décalée de `decalageJours`.
 *
 * ⚠️ MIDI UTC COMME ANCRAGE, ET CE N'EST PAS ARBITRAIRE. On repart du jour civil de Paris posé à
 * 12 h UTC : à cette heure-là, aucun fuseau de la planète ne fait basculer la date, donc les
 * additions de jours et d'années ne peuvent pas glisser d'un cran par effet de bord.
 */
export function dateNaissanceParis(annees: number, decalageJours = 0, maintenant: Date = new Date()): string {
  const d = new Date(`${jourCivilParisIso(maintenant)}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - annees);
  d.setUTCDate(d.getUTCDate() + decalageJours);
  return d.toISOString().slice(0, 10);
}
