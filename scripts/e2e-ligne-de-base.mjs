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

/**
 * ⚠️ LES DEUX CÔTÉS SONT NORMALISÉS, ET LA PREMIÈRE VERSION NE L'ÉTAIT PAS (corrigé le 2026-08-25).
 *
 * Playwright rapporte ses fichiers RELATIVEMENT à `testDir` — `fluidite.spec.ts` — pendant que la
 * ligne de base, écrite à la main depuis un log, portait `e2e/fluidite.spec.ts`. Aucune clé ne
 * correspondait : chaque entrée de la ligne de base paraissait « améliorée à 0 », chaque échec réel
 * paraissait NOUVEAU, et la CI rougissait sur exactement les 17 échecs qu'elle était censée
 * tolérer. Le mécanisme entier ne mesurait rien.
 *
 * C'est le mode d'échec d'une garde qui compare deux chaînes venues de deux mondes : elle ne dit
 * jamais « je ne trouve pas la clé », elle dit « tout a changé ».
 *
 * ⚠️ ET CE SCRIPT AVAIT ÉTÉ « ÉPROUVÉ » AVANT D'ÊTRE LIVRÉ, SUR CINQ RAPPORTS FABRIQUÉS — identique,
 * régression, aggravation, amélioration, vide — dont les codes de sortie avaient été vérifiés un par
 * un. Il est passé les cinq fois, et il ne marchait pas.
 *
 * La raison est instructive : les rapports fabriqués avaient été écrits DANS MON FORMAT DE CLÉ, pas
 * dans celui de Playwright. Une épreuve construite sur la même hypothèse que le code ne peut pas
 * réfuter cette hypothèse — elle la confirme, avec l'apparence de la rigueur. Le seul témoin qui
 * comptait était un VRAI rapport, et il n'est arrivé qu'en CI.
 *
 * Quand une épreuve et le code partagent leur auteur, ils partagent aussi leurs angles morts.
 */
const normaliser = (f) => String(f).replace(/^\.?\//, "").replace(/^e2e\//, "");

/** Parcourt l'arbre de suites de Playwright et rend un compte d'échecs par `projet › fichier`. */
function compterEchecs(json) {
  const compte = new Map();
  // ⚠️ ON RETIENT AUSSI LES TITRES, ET C'EST UN CORRECTIF DE MÉCANISME (2026-08-26). La première
  // version ne rendait que des COMPTES par fichier. Quand la CI a rougi pour de bon, le journal
  // disait « fluidite.spec.ts : 3 échecs, 2 tolérés » — et rien de plus. Impossible de savoir
  // LEQUEL des trois était le nouveau, donc impossible de diagnostiquer sans relancer.
  //
  // Le rapport JSON contenait l'information depuis le début ; c'est le comparateur qui la jetait.
  // Une garde qui dit qu'il y a un problème sans dire lequel oblige à refaire le travail qu'elle
  // vient de faire.
  const titres = new Map();
  let total = 0;
  let vus = 0;
  const visiter = (suite, fichier, chemin) => {
    const f = suite.file ?? fichier;
    const nom = [chemin, suite.title].filter(Boolean).join(" › ");
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        vus += 1;
        const echoue = (t.results ?? []).some((r) => r.status === "failed" || r.status === "timedOut");
        if (!echoue) continue;
        const cle = `${t.projectName} › ${normaliser(f)}`;
        compte.set(cle, (compte.get(cle) ?? 0) + 1);
        if (!titres.has(cle)) titres.set(cle, []);
        titres.get(cle).push([nom, spec.title].filter(Boolean).join(" › "));
        total += 1;
      }
    }
    for (const s of suite.suites ?? []) visiter(s, f, nom);
  };
  for (const s of json.suites ?? []) visiter(s, s.file, "");
  return { compte, titres, total, vus };
}

const { compte, titres, total, vus } = compterEchecs(rapport);

// ⚠️ TÉMOIN D'ANTI-VACUITÉ. Un rapport vide — suite qui n'a pas démarré, format changé, mauvais
// chemin — donnerait ZÉRO échec et ce script dirait « tout va bien ». C'est exactement le mode de
// panne d'une garde qui compte : elle passe au vert en ne mesurant rien.
if (vus < 50) {
  console.error(`✘ le rapport ne contient que ${vus} tests : la suite n'a pas tourné, ou son format a changé.`);
  process.exit(1);
}

// La ligne de base est normalisée de la MÊME façon : elle peut donc s'écrire avec ou sans `e2e/`.
const tolerees = new Map(
  Object.entries(tolere).map(([cle, n]) => {
    const [projet, fichier] = cle.split("›").map((x) => x.trim());
    return [`${projet} › ${normaliser(fichier)}`, n];
  }),
);

const nouveaux = [];
const ameliorations = [];
for (const [cle, n] of compte) {
  const attendu = tolerees.get(cle) ?? 0;
  if (n > attendu) nouveaux.push(`${cle} : ${n} échecs, ${attendu} toléré(s)`);
}
for (const [cle, attendu] of tolerees) {
  const n = compte.get(cle) ?? 0;
  if (n < attendu) ameliorations.push(`${cle} : ${n} échecs au lieu de ${attendu} — abaisse la ligne de base`);
}

console.log(`— ${vus} tests joués, ${total} en échec (ligne de base : ${Object.values(tolere).reduce((a, b) => a + b, 0)}).`);
for (const a of ameliorations) console.log(`✓ ${a}`);

if (nouveaux.length > 0) {
  console.error("\n✘ ÉCHEC(S) AU-DELÀ DE LA LIGNE DE BASE :");
  for (const n of nouveaux) console.error(`   ${n}`);

  // Le détail, dans le journal, tout de suite : sans lui il faut relancer la suite pour savoir quoi
  // regarder — c'est-à-dire refaire le travail que la CI vient de faire.
  console.error("\n   Tests en échec dans ces fichiers :");
  for (const n of nouveaux) {
    const cle = n.split(" : ")[0];
    for (const titre of titres.get(cle) ?? []) console.error(`     · ${cle} — ${titre}`);
  }
  console.error("\nRéparer, ou écrire dans `e2e/ligne-de-base.json` pourquoi on ne répare pas et");
  console.error("quelle story le fait. On n'ajoute jamais une ligne pour faire passer un commit.");
  process.exit(1);
}

console.log("✓ aucun échec nouveau au navigateur.");
