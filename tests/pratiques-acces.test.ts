import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, signOut, etape } = vi.hoisted(() => ({
  getUser: vi.fn(), signOut: vi.fn(), etape: vi.fn(),
}));
vi.mock("@/lib/data/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser, signOut } }) }));
vi.mock("@/app/(auth)/etat-onboarding", () => ({ etapeOnboardingPour: etape }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirection:${url}`); } }));
import { verifierAccesPratiques } from "@/app/pratiques/_acces";

beforeEach(() => {
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "compte-autorise" } } });
  signOut.mockReset().mockResolvedValue({ error: null });
  etape.mockReset().mockResolvedValue("suite");
});

describe("la garde de chaque page Pratiques", () => {
  it("exige une session avant toute lecture de l’onboarding", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(verifierAccesPratiques()).rejects.toThrow("redirection:/entrer");
    expect(etape).not.toHaveBeenCalled();
  });
  it.each([
    ["barre", "/barriere"], ["mineur", "/entrer?refus=age"], ["naissance", "/naissance"],
    ["consentement", "/consentement"], ["revoque", "/consentement/revoque"],
  ])("respecte l’état %s", async (etat, destination) => {
    etape.mockResolvedValue(etat);
    await expect(verifierAccesPratiques()).rejects.toThrow(`redirection:${destination}`);
    expect(signOut).toHaveBeenCalledTimes(etat === "mineur" ? 1 : 0);
  });
  it("ouvre pour un compte autorisé", async () => {
    await expect(verifierAccesPratiques()).resolves.toBeUndefined();
    expect(etape).toHaveBeenCalledWith(expect.anything(), "compte-autorise");
  });
});
