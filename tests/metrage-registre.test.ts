import { beforeEach, describe, expect, it, vi } from "vitest";

const doubles = vi.hoisted(() => ({
  upsert: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/data/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ from: doubles.from }),
}));

import { metrerUsageIa } from "@/lib/ai/metrage";

describe("metrerUsageIa — registre central", () => {
  beforeEach(() => {
    doubles.upsert.mockReset().mockResolvedValue({ error: null });
    doubles.from.mockReset().mockReturnValue({ upsert: doubles.upsert });
  });

  it("persiste les dimensions, le tarif exact et l'idempotence sans aucune clé fournisseur", async () => {
    await metrerUsageIa({
      utilisatriceId: "00000000-0000-4000-8000-000000000001",
      cleIdempotence: "tour-1:detection_detresse",
      operation: "detection_detresse",
      capacite: "detection",
      tier: "fort",
      modele: "mistral-large-2512",
      tokensEntree: 1_000_000,
      tokensSortie: 1_000_000,
      premiumAuMomentAppel: true,
      exempteQuota: true,
      comptabiliseFinancierement: true,
    });

    expect(doubles.from).toHaveBeenCalledWith("usage_ia");
    expect(doubles.upsert).toHaveBeenCalledWith(
      {
        utilisatrice_id: "00000000-0000-4000-8000-000000000001",
        cle_idempotence: "tour-1:detection_detresse",
        operation: "detection_detresse",
        capacite: "detection",
        tier: "fort",
        modele: "mistral-large-2512",
        tokens_entree: 1_000_000,
        tokens_sortie: 1_000_000,
        post_premiere_seance: false,
        unite_usage: "token",
        premium_au_moment_appel: true,
        exempte_quota: true,
        comptabilise_financierement: true,
        tarif_version: "mistral-public-2026-08-26",
        tarif_connu: true,
        devise: "USD",
        prix_entree_usd_par_million: "0.50000000",
        prix_sortie_usd_par_million: "1.50000000",
        cout_usd: "2.000000000",
      },
      { onConflict: "utilisatrice_id,cle_idempotence", ignoreDuplicates: true },
    );
    const ligne = doubles.upsert.mock.calls[0][0] as Record<string, unknown>;
    for (const cleInterdite of ["api_key", "provider_key", "cle_fournisseur"]) {
      expect(ligne).not.toHaveProperty(cleInterdite);
    }
  });

  it("reste best-effort si Supabase refuse l'écriture", async () => {
    const erreur = vi.spyOn(console, "error").mockImplementation(() => undefined);
    doubles.upsert.mockResolvedValue({ error: { code: "08006" } });

    await expect(
      metrerUsageIa({
        utilisatriceId: "00000000-0000-4000-8000-000000000001",
        cleIdempotence: "tour-2",
        operation: "conversation",
        capacite: "echange",
        tier: "leger",
        modele: "factice",
        tokensEntree: 1,
        tokensSortie: 1,
        premiumAuMomentAppel: null,
        exempteQuota: false,
        comptabiliseFinancierement: true,
      }),
    ).resolves.toBeUndefined();
    expect(erreur).toHaveBeenCalledWith("usage_ia métrage échoué", { code: "08006" });
    erreur.mockRestore();
  });
});
