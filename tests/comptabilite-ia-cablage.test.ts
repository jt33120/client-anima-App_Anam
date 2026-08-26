import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const lire = (chemin: string) => readFileSync(resolve(process.cwd(), chemin), "utf-8");
const route = lire("app/api/anam/message/route.ts");
const synthese = lire("lib/ordonnanceur/jobs/synthese.ts");
const allocation = lire("lib/data/lire-allocation.ts");
const pipeline = lire("lib/safety/pipeline.ts");
const migration = lire("supabase/migrations/0081_comptabilite_ia.sql");
const migrationQuota = lire("supabase/migrations/0083_reservation_quota_ia_atomique.sql");

function appelPour(source: string, operation: string): string {
  const ancre = `operation: "${operation}"`;
  const index = source.indexOf(ancre);
  expect(index, `opération ${operation} câblée`).toBeGreaterThan(-1);
  return source.slice(Math.max(0, index - 260), index + 620);
}

describe("comptabilité IA — garde de câblage serveur", () => {
  it("la détection est financièrement comptée mais ne peut jamais consommer le quota", () => {
    const appel = appelPour(route, "detection_detresse");
    expect(appel).toContain('cleIdempotence: `${cleIdempotence}:detection_detresse`');
    expect(appel).toMatch(/capacite:\s*"detection"/);
    expect(appel).toMatch(/premiumAuMomentAppel:\s*await premiumAuMomentAppel/);
    expect(appel).toMatch(/exempteQuota:\s*true/);
    expect(appel).toMatch(/comptabiliseFinancierement:\s*true/);
    const iPublication = pipeline.indexOf("deps.publierUsageDetection?.(detection.usage)");
    const iPlancher = pipeline.indexOf("await depot.plancherEpisode()");
    expect(iPublication).toBeGreaterThan(-1);
    expect(iPlancher).toBeGreaterThan(-1);
    expect(iPublication).toBeLessThan(iPlancher);
  });

  it("la réponse conversationnelle de sécurité est elle aussi hors quota", () => {
    const appel = appelPour(route, "conversation");
    expect(appel).toMatch(/capacite:\s*capaciteGeneration/);
    expect(appel).toMatch(/exempteQuota:\s*!horsDetresse/);
    expect(appel).toMatch(/postPremiereSeance:\s*tourAllocationResiduelle/);
  });

  it("la synthèse utilise une clé stable par période et le même contrat financier", () => {
    const appel = appelPour(synthese, "synthese_periodique");
    expect(appel).toContain('cleIdempotence: `synthese:${periode.debut}:${periode.fin}`');
    expect(appel).toMatch(/capacite:\s*"synthese"/);
    expect(appel).toMatch(/premiumAuMomentAppel:\s*true/);
    expect(appel).toMatch(/exempteQuota:\s*true/);
    expect(appel).toMatch(/comptabiliseFinancierement:\s*true/);
  });

  it("le schéma stocke un coût numeric et aucune clé fournisseur par personne", () => {
    expect(migration).toMatch(/cout_usd\s+numeric\(20,\s*12\)/);
    expect(migration).toMatch(/prix_entree_usd_par_million\s+numeric\(20,\s*8\)/);
    expect(migration).toMatch(/prix_sortie_usd_par_million\s+numeric\(20,\s*8\)/);
    expect(migration).not.toMatch(/api[_ ]?key|provider[_ ]?key|cle_fournisseur/i);
  });

  it("borne les écritures nouvelles sans faire échouer la migration sur un compteur historique", () => {
    expect(migration).toMatch(/alter column tokens_entree type bigint/);
    expect(migration).toMatch(/usage_ia_tokens_non_negatifs[\s\S]{0,120}?not valid/);
    expect(migration).toMatch(/usage_ia_operation_connue/);
    expect(migration).toMatch(
      /not tarif_connu[\s\S]{0,180}?prix_entree_usd_par_million is null[\s\S]{0,180}?cout_usd is null/,
    );
  });

  it("le quota lit son registre séparé ; les marqueurs financiers ne servent qu'au backfill", () => {
    expect(allocation).toMatch(/\.from\("reservation_quota_ia"\)/);
    expect(allocation).not.toMatch(/\.from\("usage_ia"\)/);
    expect(migrationQuota).toMatch(/from public\.usage_ia/);
    expect(migrationQuota).toMatch(/post_premiere_seance = true/);
    expect(migrationQuota).toMatch(/exempte_quota = false/);
  });
});
