import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();
const getClaims = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser, getClaims } }),
}));

const { updateSession } = await import("@/lib/data/supabase/middleware");

function requete(path: string, cookie?: string) {
  return new NextRequest(`https://anima.example${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

beforeEach(() => {
  vi.stubEnv("ANIMA_PASSKEYS", "oui");
  getUser.mockReset().mockResolvedValue({
    data: {
      user: {
        id: "u1",
        app_metadata: { anima_passkey_required: true },
      },
    },
    error: null,
  });
  getClaims.mockReset().mockResolvedValue({
    data: {
      claims: {
        session_id: "session-1",
        amr: [{ method: "passkey", timestamp: 1_700_000_000 }],
      },
    },
    error: null,
  });
});

afterEach(() => vi.unstubAllEnvs());

describe("la garde passkey du proxy", () => {
  it("redirige une page personnelle sans marqueur de cette session", async () => {
    const response = await updateSession(requete("/moi?onglet=socle"));
    expect(response.status).toBe(303);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/verrou");
    expect(location.searchParams.get("vers")).toBe("/moi?onglet=socle");
  });

  it("rend 423 à une API pour ne jamais rejouer un POST sensible", async () => {
    const response = await updateSession(requete("/api/anam/message"));
    expect(response.status).toBe(423);
    expect(await response.json()).toEqual({
      code: "verrouille",
      message: "Déverrouille Anam pour continuer.",
    });
  });

  it("laisse passer quand le cookie correspond au session_id signé et à l'AMR passkey", async () => {
    const response = await updateSession(
      requete("/moi", "anam_deverrouillage=session-1"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/verrou", "/securiser", "/securiser/recuperer", "/entrer", "/api/verrou"])(
    "ne ferme jamais la route de sortie %s",
    async (path) => {
      const response = await updateSession(requete(path));
      expect(response.status).toBe(200);
    },
  );

  it("ne change aucun comportement tant que la porte de déploiement est fermée", async () => {
    vi.stubEnv("ANIMA_PASSKEYS", "");
    const response = await updateSession(requete("/moi"));
    expect(response.status).toBe(200);
    expect(getClaims).not.toHaveBeenCalled();
  });
});
