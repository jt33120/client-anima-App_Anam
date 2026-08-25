#!/usr/bin/env node
import { readFileSync } from "node:fs";

/**
 * e2e-ligne-de-base.mjs — LA SUITE QUI VOIT DES PIXELS A UNE LIGNE DE BASE, COMME CELLE DE VITEST.
 *
 * ══ POURQUOI CE SCRIPT EXISTE ═══════════════════════════════════════════════════════════════════
 *
 * Le travail `navigateur` a été ajouté à la CI le 2026-08-25 et a rendu son premier verdict :
 * 73 passés, 17 échoués. Ces 17 défauts vivaient déjà — le commit qui a ajouté le travail ne
 * touchait qu'un fichier de CI. Ils étaient simplement INVISIBLES depuis que le stack Supabase
 * local a disparu des machines de développement (décision du 2026-08-24).
 *
 * Deux mauvaises sorties étaient possibles.
 *
 *   • LAISSER LE TRAVAIL ROUGE. Un « main » rouge en permanence détruit le signal : on ne sait plus
 *     dire si le commit d'après a cassé quelque chose de neuf. C'est le pire des deux mondes —
 *     l'inconfort du rouge sans l'information qu'il devrait porter.
 *   • LE RENDRE NON BLOQUANT. Un travail autorisé à échouer est un travail que personne ne lit.
 *
 * La troisième sortie est celle que la suite Vitest emploie déjà de fait : une LIGNE DE BASE. On
 * connaît le nombre d'échecs attendus, fichier par fichier, et la CI n'échoue que sur un échec
 * NOUVEAU. Le fichier `e2e/ligne-de-base.json` ne doit que décroître, et chaque ligne y porte le
 * motif de sa présence.
 *
 * ⚠️ ON COMPARE PAR FICHIER, PAS PAR TITRE DE TEST. Un titre se réécrit en corrigeant un test, et
 * la ligne de base deviendrait fausse à chaque reformulation — ce qui pousserait à la régénérer
 * machinalement, c'est-à-dire à graver n'importe quel état comme « normal ». Le fichier, lui, est
 * stable. Le prix est connu et écrit : un échec qui en REMPLACE un autre dans le même fichier passe
 * inaperçu. C'est le seul angle mort, et il se referme en faisant baisser les comptes.
 */

const [, , chemin] = process.argv;
if (!chemin) {
  console.error("usage : node scripts/e2e-ligne-de-base.mjs <rapport-playwright.json>");
  process.exit(2);
}

const rapport = JSON.parse(readFileSync(chemin, "utf-8"));
const base = JSON.parse(readFileSync("e2e/ligne-de-base.json", "utf-8"));
const tolere = base["echecs_tolerés"] ?? {};

/** Parcourt l'arbre de suites de Playwright et rend un compte d'échecs par `projet › fichier`. */
function compterEchecs(json) {
  const compte = new Map();
  let total = 0;
  let vus = 0;
  const visiter = (suite, fichier) => {
    const f = suite.file ?? fichier;
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        vus += 1;
        const echoue = (t.results ?? []).some((r) => r.status === "failed" || r.status === "timedOut");
        if (!echoue) continue;
        const cle = `${t.projectName} › ${f}`;
        compte.set(cle, (compte.get(cle) ?? 0) + 1);
        total += 1;
      }
    }
    for (const s of suite.suites ?? []) visiter(s, f);
  };
  for (const s of json.suites ?? []) visiter(s, s.file);
  return { compte, total, vus };
}

const { compte, total, vus } = compterEchecs(rapport);

// ⚠️ TÉMOIN D'ANTI-VACUITÉ. Un rapport vide — suite qui n'a pas démarré, format changé, mauvais
// chemin — donnerait ZÉRO échec et ce script dirait « tout va bien ». C'est exactement le mode de
// panne d'une garde qui compte : elle passe au vert en ne mesurant rien.
if (vus < 50) {
  console.error(`✘ le rapport ne contient que ${vus} tests : la suite n'a pas tourné, ou son format a changé.`);
  process.exit(1);
}

const nouveaux = [];
const ameliorations = [];
for (const [cle, n] of compte) {
  const attendu = tolere[cle] ?? 0;
  if (n > attendu) nouveaux.push(`${cle} : ${n} échecs, ${attendu} toléré(s)`);
}
for (const [cle, attendu] of Object.entries(tolere)) {
  const n = compte.get(cle) ?? 0;
  if (n < attendu) ameliorations.push(`${cle} : ${n} échecs au lieu de ${attendu} — abaisse la ligne de base`);
}

console.log(`— ${vus} tests joués, ${total} en échec (ligne de base : ${Object.values(tolere).reduce((a, b) => a + b, 0)}).`);
for (const a of ameliorations) console.log(`✓ ${a}`);

if (nouveaux.length > 0) {
  console.error("\n✘ ÉCHEC(S) AU-DELÀ DE LA LIGNE DE BASE :");
  for (const n of nouveaux) console.error(`   ${n}`);
  console.error("\nRéparer, ou écrire dans `e2e/ligne-de-base.json` pourquoi on ne répare pas et");
  console.error("quelle story le fait. On n'ajoute jamais une ligne pour faire passer un commit.");
  process.exit(1);
}

console.log("✓ aucun échec nouveau au navigateur.");
