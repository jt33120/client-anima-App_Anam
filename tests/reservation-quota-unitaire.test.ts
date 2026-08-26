import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/data/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

import {
  codeTechniqueReservationQuota,
  premierJourMoisUtc,
  reserverTourResiduelDuMois,
} from "@/lib/data/lire-allocation";

const UTILISATRICE = "22222222-2222-4222-8222-222222222222";
const CLE = "33333333-3333-4333-8333-333333333333";
const AUTRE_CLE = "44444444-4444-4444-8444-444444444444";

beforeEach(() => rpc.mockReset());

describe("reserverTourResiduelDuMois — contrat pur de la RPC atomique", () => {
  it("transmet identité, clé logique et limite puis conserve le booléen SQL", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await expect(reserverTourResiduelDuMois(UTILISATRICE, CLE, 7)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("reserver_quota_ia_atomique", {
      p_utilisatrice: UTILISATRICE,
      p_cle_idempotence: CLE,
      p_limite: 7,
    });

    rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(reserverTourResiduelDuMois(UTILISATRICE, AUTRE_CLE, 7)).resolves.toBe(false);
  });

  it("canonise la clé avant RPC et refuse une clé non UUID", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await expect(reserverTourResiduelDuMois(UTILISATRICE, CLE.toUpperCase(), 1)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith(
      "reserver_quota_ia_atomique",
      expect.objectContaining({ p_cle_idempotence: CLE }),
    );
    await expect(reserverTourResiduelDuMois(UTILISATRICE, "meme-tour", 1)).rejects.toThrow(
      "invalide",
    );
  });

  it("lève sur erreur SQL ou réponse ambiguë afin que la route applique son fail-open", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "57014" } });
    await expect(reserverTourResiduelDuMois(UTILISATRICE, CLE, 1)).rejects.toMatchObject({
      name: "ErreurReservationQuota",
      codeTechnique: "57014",
    });

    rpc.mockResolvedValueOnce({ data: "true", error: null });
    await expect(reserverTourResiduelDuMois(UTILISATRICE, CLE, 1)).rejects.toMatchObject({
      codeTechnique: "forme_invalide",
    });
  });

  it("refuse les entrées invalides avant tout accès réseau", async () => {
    await expect(reserverTourResiduelDuMois("", CLE, 1)).rejects.toThrow("invalide");
    await expect(reserverTourResiduelDuMois(UTILISATRICE, "", 1)).rejects.toThrow("invalide");
    await expect(reserverTourResiduelDuMois(UTILISATRICE, CLE, -1)).rejects.toThrow("limite");
    await expect(
      reserverTourResiduelDuMois(UTILISATRICE, CLE, Number.MAX_SAFE_INTEGER + 1),
    ).rejects.toThrow("limite");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("accepte toute limite entière sûre, au-delà de la plage int4", async () => {
    const limite = 2_147_483_648;
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await expect(reserverTourResiduelDuMois(UTILISATRICE, CLE, limite)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith(
      "reserver_quota_ia_atomique",
      expect.objectContaining({ p_limite: limite }),
    );
  });

  it("borne l'observabilité aux codes techniques sans contenu ni identifiant", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "détail sensible" } });
    const erreur = await reserverTourResiduelDuMois(UTILISATRICE, CLE, 1).catch((e) => e);
    expect(codeTechniqueReservationQuota(erreur)).toBe("42501");
    expect(codeTechniqueReservationQuota(new Error("reservation_quota_timeout"))).toBe("timeout");
    expect(codeTechniqueReservationQuota(new Error("autre"))).toBe("inconnu");
    expect((erreur as Error).message).not.toContain("détail sensible");
  });

  it("calcule le mois par UTC, y compris de part et d'autre d'un changement de mois", () => {
    expect(premierJourMoisUtc(new Date("2026-08-31T23:59:59.999Z"))).toBe("2026-08-01");
    expect(premierJourMoisUtc(new Date("2026-09-01T00:00:00.000Z"))).toBe("2026-09-01");
    expect(premierJourMoisUtc(new Date("2026-12-31T23:59:59.999Z"))).toBe("2026-12-01");
    expect(premierJourMoisUtc(new Date("2027-01-01T00:00:00.000Z"))).toBe("2027-01-01");
    expect(() => premierJourMoisUtc(new Date("invalide"))).toThrow("date");
  });
});
