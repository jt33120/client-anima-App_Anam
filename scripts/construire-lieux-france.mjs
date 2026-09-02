#!/usr/bin/env node
/**
 * construire-lieux-france.mjs — FABRIQUE le référentiel des lieux de naissance (Story 5.3, T2).
 *
 * ── POURQUOI UN SCRIPT, ET PAS UNE LISTE ÉCRITE ────────────────────────────────────────────────
 *
 * Une longitude fausse de 2° décale l'ascendant de ~2° : plausible, invérifiable, faux. C'est la
 * règle Chiron (`lib/astro/adapters/astronomy-engine.ts`) appliquée à la géographie — sauf qu'ici,
 * contrairement à Chiron, une source publique EXISTE. Aucune coordonnée de ce dépôt n'est donc
 * écrite de mémoire, ni par un humain, ni par un modèle : elles viennent toutes d'ici. Même règle
 * pour les populations et les noms de départements ajoutés pour départager les homonymes.
 *
 * SOURCE : `geo.api.gouv.fr`, l'API géographique de l'État — données INSEE (Code officiel
 * géographique) et IGN, sous **Licence Ouverte Etalab 2.0** (réutilisation libre, attribution).
 *
 * ── USAGE ──────────────────────────────────────────────────────────────────────────────────────
 *
 *     node scripts/construire-lieux-france.mjs
 *
 * (Derrière un proxy sortant que `fetch` de Node ignore : `NODE_USE_ENV_PROXY=1 node …`.)
 *
 * Écrit `lib/astro/adapters/communes-france.json`. À rejouer quand le Code officiel géographique
 * bouge (fusions de communes) ou qu'un recensement est publié — jamais à éditer à la main.
 *
 * ── CE QUE LE FICHIER CONTIENT ─────────────────────────────────────────────────────────────────
 *
 *   • `communes` : `[nom, codeInsee, latitude, longitude, population]`. La population sert au
 *     CLASSEMENT entre homonymes (quatre « Saint-Denis » : La Réunion et la Seine-Saint-Denis
 *     avant l'Aude et le Gard) ; `0` quand la source n'en publie pas (Terres australes, Clipperton).
 *   • `departements` : `[code, nom]`. Les 101 départements de `/departements`, COMPLÉTÉS par les
 *     collectivités et territoires que cet endpoint ne liste pas mais que les communes portent
 *     (Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin, Wallis et Futuna, Polynésie
 *     française, Nouvelle-Calédonie — et les Terres australes et Clipperton, que l'adaptateur
 *     écarte de toute façon) : 109 entrées. Sans ce complément, une naissance à Papeete n'aurait
 *     pas de département nommé. Tout vient de la source ; rien n'est complété à la main.
 *
 * ── CE QUE LE FICHIER NE CONTIENT PAS ──────────────────────────────────────────────────────────
 *
 *   • Aucun fuseau horaire. Le fuseau se DÉDUIT du code INSEE (`lib/astro/lieux.ts`), pour une
 *     raison de vérifiabilité : une table de fuseaux figée dans un fichier de données ne peut être
 *     contrôlée par personne, alors qu'une table dans le code est confrontée à la base de fuseaux
 *     de la plateforme par `tests/lieux.test.ts`.
 *   • Aucun code de département par commune : il se déduit du code INSEE (`codeDepartement`), et
 *     ce script PROUVE la règle en la confrontant, pour chaque commune, au `departement.code` que
 *     la source renvoie. Une divergence, et rien n'est écrit.
 *   • Aucun code postal : ce n'est pas un discriminant (plusieurs par commune, partagés entre
 *     communes voisines).
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE_COMMUNES =
  "https://geo.api.gouv.fr/communes?fields=nom,code,centre,population,departement&format=json&geometry=centre";
const SOURCE_DEPARTEMENTS = "https://geo.api.gouv.fr/departements?fields=nom,code";
const SORTIE = resolve(process.cwd(), "lib/astro/adapters/communes-france.json");

/** Une réponse tronquée produirait un référentiel silencieusement amputé — d'où le plancher. */
async function lire(url, plancher) {
  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error(`geo.api.gouv.fr a répondu ${reponse.status} sur ${url} — rien n'a été écrit.`);
  }
  const brut = await reponse.json();
  if (!Array.isArray(brut) || brut.length < plancher) {
    // Des femmes nées dans une commune réelle ne la trouveraient pas, et personne ne saurait pourquoi.
    throw new Error(`réponse inattendue (${brut?.length} entrées, ${plancher} attendues au moins) — rien n'a été écrit.`);
  }
  return brut;
}

const brutCommunes = await lire(SOURCE_COMMUNES, 30000);
const brutDepartements = await lire(SOURCE_DEPARTEMENTS, 101);

// ── La règle `codeDepartement`, CONFRONTÉE à la source ──────────────────────────────────────────
//
// Miroir de `codeDepartement` (`lib/astro/lieux.ts`) : deux caractères, trois outre-mer (97x, 98x).
// Le script ne l'importe pas (fichier TypeScript) ; il la RÉPÈTE et la vérifie sur les 35 000
// communes — si la copie ou l'original dérivait, le référentiel ne serait pas écrit.
const codeDepartement = (code) =>
  code.startsWith("97") || code.startsWith("98") ? code.slice(0, 3) : code.slice(0, 2);

const divergences = brutCommunes.filter(
  (c) => c?.departement?.code && codeDepartement(c.code) !== c.departement.code,
);
if (divergences.length > 0) {
  throw new Error(
    `la règle codeDepartement diverge de la source pour ${divergences.length} commune(s), ` +
      `ex. ${divergences[0].code} → ${divergences[0].departement.code} — rien n'a été écrit.`,
  );
}

// ── Le référentiel des départements : `/departements` ∪ ce que portent les communes ────────────
const departements = new Map(brutDepartements.map((d) => [d.code, d.nom]));
for (const c of brutCommunes) {
  if (c?.departement?.code && c?.departement?.nom && !departements.has(c.departement.code)) {
    departements.set(c.departement.code, c.departement.nom);
  }
}

// Une commune sans département nommé n'est tolérée que si la source elle-même n'en donne pas
// (Terres australes, Clipperton — où personne ne naît, et que l'adaptateur écarte faute de fuseau).
const sansDepartement = brutCommunes.filter((c) => !departements.has(codeDepartement(c.code)));
const trahies = sansDepartement.filter((c) => c?.departement?.code);
if (trahies.length > 0) {
  throw new Error(`${trahies.length} commune(s) avec un département que le référentiel ne nomme pas — rien n'a été écrit.`);
}

/** `[nom, codeInsee, latitude, longitude, population]` — 4 décimales ≈ 11 m, très au-delà du besoin. */
const communes = brutCommunes
  .filter((c) => c?.nom && c?.code && Array.isArray(c?.centre?.coordinates))
  .map((c) => [
    c.nom,
    c.code,
    Math.round(c.centre.coordinates[1] * 1e4) / 1e4,
    Math.round(c.centre.coordinates[0] * 1e4) / 1e4,
    Number.isInteger(c.population) && c.population >= 0 ? c.population : 0,
  ])
  .sort((a, b) => String(a[1]).localeCompare(String(b[1])));

if (communes.length !== brutCommunes.length) {
  throw new Error(`${brutCommunes.length - communes.length} communes sans centroïde — rien n'a été écrit.`);
}

writeFileSync(
  SORTIE,
  JSON.stringify({
    source: SOURCE_COMMUNES,
    source_departements: SOURCE_DEPARTEMENTS,
    licence: "Licence Ouverte / Open Licence 2.0 (Etalab) — données INSEE / IGN",
    genere_par: "scripts/construire-lieux-france.mjs",
    format: "[nom, codeInsee, latitude, longitude, population]",
    format_departements: "[code, nom]",
    departements: [...departements].sort(([a], [b]) => a.localeCompare(b)),
    communes,
  }) + "\n",
);

const sansPopulation = communes.filter((c) => c[4] === 0).map((c) => c[1]);
console.info(`${communes.length} communes et ${departements.size} départements écrits dans ${SORTIE}`);
console.info(`  sans population (0) : ${sansPopulation.join(", ") || "aucune"}`);
console.info(`  sans département nommé : ${sansDepartement.map((c) => c.code).join(", ") || "aucune"}`);
