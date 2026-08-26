import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Story 3.4 (T5) — le GATE serveur d'allocation résiduelle dans la route. Non invocable en env node
 * (streaming + egress + Supabase) → gardes de LECTURE DE SOURCE sur l'ORDRE et les COURT-CIRCUITS :
 * le gate vit APRÈS la sécurité (la détresse le lève, AC6) et AVANT la génération/extraction FORT (un
 * tour coupé ne lance aucune génération conversationnelle), court-circuité si premium (AC5), et pose
 * `postPremiereSeance` au métrage. La détection sécurité, déjà consommée, reste comptabilisée hors quota.
 */

const racine = process.cwd();
function sansCommentaires(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const route = sansCommentaires(readFileSync(resolve(racine, "app/api/anam/message/route.ts"), "utf-8"));

describe("Story 3.4 (T5) — le gate d'allocation est ordonné APRÈS la sécurité, AVANT la génération", () => {
  it("le gate décide via la réservation SQL atomique du tour logique", () => {
    expect(route).toMatch(/const\s+admissionQuota\s*=\s*await deciderAdmissionQuota\(/);
  });

  it("ORDRE : sécurité évaluée → gate d'allocation → extraction FORT / génération", () => {
    // On ancre sur les USAGES (pas les imports en tête de fichier).
    const iSecurite = route.indexOf("securite = await evaluerSecuriteDuTour");
    const iGate = route.indexOf("admissionQuota = await deciderAdmissionQuota");
    const iExtraction = route.indexOf("requeteExtractionArc(messages)");
    const iGen = route.indexOf("egress = await diffuserSousEgressArt9");
    expect(iSecurite, "sécurité présente").toBeGreaterThan(-1);
    expect(iGate, "usage du gate présent").toBeGreaterThan(-1);
    expect(iGate, "le gate suit la sécurité (la détresse le lève, AC6)").toBeGreaterThan(iSecurite);
    expect(iGate, "le gate précède l'extraction FORT (aucun coût sur un tour coupé)").toBeLessThan(iExtraction);
    expect(iGate, "le gate précède la génération").toBeLessThan(iGen);
  });

  it("la coupure retourne la SEULE trame `quota` AVANT toute génération (aucun delta, aucun fin)", () => {
    const iQuota = route.indexOf('t: "quota"');
    const iGen = route.indexOf("egress = await diffuserSousEgressArt9");
    const iMetrage = route.indexOf('operation: "conversation"'); // le métrage principal, pas la détection
    expect(iQuota, "trame quota émise").toBeGreaterThan(-1);
    expect(iQuota, "la trame quota est renvoyée avant la génération").toBeLessThan(iGen);
    expect(iQuota, "la trame quota précède le métrage conversationnel (la sécurité peut être comptée)").toBeLessThan(iMetrage);
    // Le `return new Response(corpsQuota)` est bien IMBRIQUÉ sous le refus de réservation ET avant l'étage arc
    // (revue 3.4, F12 : une garde de simple PRÉSENCE laisserait passer une relocation du return hors du
    // bloc). On borne sa POSITION entre `if (!reservationAccordee)` et l'étage arc `if (etatArcCharge)`.
    const iIf = route.indexOf("if (!admissionQuota.autorisee)");
    const iRet = route.indexOf("return new Response(corpsQuota");
    const iArc = route.indexOf("if (etatArcCharge)");
    expect(iIf, "garde de refus d'admission présente").toBeGreaterThan(-1);
    expect(iRet, "return early corpsQuota présent").toBeGreaterThan(-1);
    expect(iArc, "entrée de l'étage arc présente").toBeGreaterThan(-1);
    expect(iRet, "le return corpsQuota suit le refus de réservation").toBeGreaterThan(iIf);
    expect(iRet, "le return corpsQuota précède l'étage arc (coupe AVANT toute génération)").toBeLessThan(iArc);
  });
});

describe("Story 3.4 (T5) — les court-circuits (AC5 premium, AC6 détresse) et le repli sûr", () => {
  it("BYPASS détresse : le gate reçoit la dérivation hors détresse complète", () => {
    // ⚠️ CETTE GARDE A GRAVÉ LE DÉFAUT (revue adversariale, R8). Elle exigeait littéralement
    // `if (!securite.limitesLevees && seanceClose)` — c'est-à-dire la MOITIÉ de « hors détresse ».
    // Il manquait le niveau effectif, et cette moitié coupait la conversation au tour qui éteint
    // l'épisode : `limites_levees` est déjà faux tandis que le verdict vaut encore 3. C'est la
    // troisième garde de ce dépôt qui rougit sur son propre correctif au lieu de rougir sur le
    // défaut. On mesure donc la RÈGLE : les deux signaux entrent, aucun n'est perdu.
    expect(route, "la dérivation « hors détresse » doit être nommée une fois").toMatch(
      /const horsDetresse = niveauSecurite === 0 && !securite\.limitesLevees;/,
    );
    expect(route).toMatch(/deciderAdmissionQuota\(\s*\{ horsDetresse, seanceClose \}/);
  });

  it("réutilise l'instantané premium unique et la limite lue à l'exécution", () => {
    expect(route).toMatch(/lirePremium:\s*\(\)\s*=>\s*premiumAuMomentAppel/);
    expect(route).toMatch(/lireLimite:\s*limiteAllocationResiduelle/);
  });

  it("borne la RPC et journalise un code technique sûr en repli", () => {
    expect(route).toMatch(/avecDelai\([\s\S]{0,240}?reserverTourResiduelDuMois\([\s\S]{0,240}?DELAI_RESERVATION_QUOTA_MS/);
    expect(route).toMatch(/admissionQuota\.etat === "repli"/);
    expect(route).toMatch(/code:\s*codeTechniqueReservationQuota\(admissionQuota\.erreur\)/);
  });

  it("limite non configurée : aucune RPC ni réservation", () => {
    // La preuve comportementale (aucun appel à `reserver`) vit dans admission-quota.test.ts.
    expect(route).toMatch(/lireLimite:\s*limiteAllocationResiduelle/);
  });
});

describe("Story 3.4 (T5) — post-séance dérivé de l'état CHARGÉ, métré sur la ligne principale (AC2)", () => {
  it("`seanceClose` dérive de `finProposee` de la trace CHARGÉE (avant avancerArc)", () => {
    expect(route).toMatch(/seanceClose\s*=\s*etatArcCharge\?\.finProposee/);
  });

  it("la trace est chargée UNE SEULE fois (partagée entre le gate et l'étage arc)", () => {
    const occurrences = route.match(/depotSeance\.charger\(\)/g) ?? [];
    expect(occurrences.length, "une seule lecture de trace (pas de double coût)").toBe(1);
  });

  it("le métrage PRINCIPAL porte `postPremiereSeance: tourAllocationResiduelle` (revue F10)", () => {
    // Marqué UNIQUEMENT quand le tour tire réellement sur l'allocation gratuite — jamais `seanceClose`
    // brut (qui compterait aussi les tours premium/détresse → un downgrade recompterait des tours illimités).
    const principal = route.slice(route.indexOf('operation: "conversation"'));
    expect(principal.slice(0, 600)).toMatch(/postPremiereSeance:\s*tourAllocationResiduelle/);
  });

  it("reprend une seule fois le marqueur décidé par la matrice comportementale", () => {
    const occurrences = route.match(/tourAllocationResiduelle\s*=/g) ?? [];
    expect(occurrences).toHaveLength(1);
    expect(route).toMatch(/tourAllocationResiduelle\s*=\s*admissionQuota\.tourAllocationResiduelle/);
  });

  it("la réservation reçoit utilisatrice, clé logique stable et limite d'exécution", () => {
    expect(route).toMatch(
      /reserverTourResiduelDuMois\(user\.id,\s*cleIdempotence,\s*limite\)/,
    );
  });
});
