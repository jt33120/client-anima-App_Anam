import { describe, expect, it, vi } from "vitest";
import { deciderAdmissionQuota } from "@/lib/domain/admission-quota";

function deps(overrides: Partial<Parameters<typeof deciderAdmissionQuota>[1]> = {}) {
  return {
    lirePremium: vi.fn(async () => false as boolean | null),
    lireLimite: vi.fn(() => 1 as number | null),
    reserver: vi.fn(async () => true),
    ...overrides,
  };
}

describe("deciderAdmissionQuota — matrice comportementale", () => {
  it.each([
    { horsDetresse: false, seanceClose: true },
    { horsDetresse: true, seanceClose: false },
  ])("court-circuite sécurité et première séance sans aucune dépendance", async (contexte) => {
    const d = deps();
    await expect(deciderAdmissionQuota(contexte, d)).resolves.toEqual({
      autorisee: true,
      tourAllocationResiduelle: false,
      etat: "bypass",
    });
    expect(d.lirePremium).not.toHaveBeenCalled();
    expect(d.lireLimite).not.toHaveBeenCalled();
    expect(d.reserver).not.toHaveBeenCalled();
  });

  it.each([true, null])("court-circuite premium/doute entitlement (%s) sans RPC", async (premium) => {
    const d = deps({ lirePremium: vi.fn(async () => premium) });
    await expect(
      deciderAdmissionQuota({ horsDetresse: true, seanceClose: true }, d),
    ).resolves.toEqual({ autorisee: true, tourAllocationResiduelle: false, etat: "bypass" });
    expect(d.lireLimite).not.toHaveBeenCalled();
    expect(d.reserver).not.toHaveBeenCalled();
  });

  it("la configuration absente admet sans RPC mais conserve le marqueur historique d'éligibilité", async () => {
    const d = deps({ lireLimite: vi.fn(() => null) });
    await expect(
      deciderAdmissionQuota({ horsDetresse: true, seanceClose: true }, d),
    ).resolves.toEqual({
      autorisee: true,
      tourAllocationResiduelle: true,
      etat: "non_configuree",
    });
    expect(d.reserver).not.toHaveBeenCalled();
  });

  it.each([
    { accordee: true, etat: "reservee" },
    { accordee: false, etat: "refusee" },
  ] as const)("propage exactement la décision atomique $etat", async ({ accordee, etat }) => {
    const d = deps({ reserver: vi.fn(async () => accordee) });
    await expect(
      deciderAdmissionQuota({ horsDetresse: true, seanceClose: true }, d),
    ).resolves.toEqual({ autorisee: accordee, tourAllocationResiduelle: true, etat });
    expect(d.reserver).toHaveBeenCalledOnce();
    expect(d.reserver).toHaveBeenCalledWith(1);
  });

  it("transforme une panne de réservation en accès fail-open observable", async () => {
    const panne = new Error("timeout");
    const d = deps({ reserver: vi.fn(async () => { throw panne; }) });
    await expect(
      deciderAdmissionQuota({ horsDetresse: true, seanceClose: true }, d),
    ).resolves.toEqual({
      autorisee: true,
      tourAllocationResiduelle: true,
      etat: "repli",
      erreur: panne,
    });
  });
});
