import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COOKIE_DEVERROUILLAGE,
  OPTIONS_COOKIE_DEVERROUILLAGE,
  authentificationRecente,
  destinationInterne,
  passkeyRequise,
  passkeysActives,
  routeExempteeDuVerrou,
  sessionDeverrouillee,
} from "@/lib/auth/verrou-prive";

describe("le verrou privé", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("reste fermé par défaut et ne s'active que par une décision explicite", () => {
    expect(passkeysActives({})).toBe(false);
    expect(passkeysActives({ ANIMA_PASSKEYS: "true" })).toBe(false);
    expect(passkeysActives({ ANIMA_PASSKEYS: "oui" })).toBe(true);
  });

  it.each([
    ["https://ailleurs.example", "/"],
    ["//ailleurs.example", "/"],
    ["/\\ailleurs.example", "/"],
    ["javascript:alert(1)", "/"],
    ["", "/"],
    ["/moi?depuis=socle#ici", "/moi?depuis=socle#ici"],
  ])("ramène la destination %s vers %s", (entree, attendue) => {
    expect(destinationInterne(entree)).toBe(attendue);
  });

  it("n'exige la passkey que lorsque la métadonnée Auth vaut le booléen vrai", () => {
    expect(passkeyRequise({ app_metadata: { anima_passkey_required: true } })).toBe(true);
    expect(passkeyRequise({ app_metadata: { anima_passkey_required: "true" } })).toBe(false);
    expect(passkeyRequise({ app_metadata: {} })).toBe(false);
    expect(passkeyRequise(null)).toBe(false);
  });

  it("n'ouvre qu'avec la même session signée et une AMR passkey", () => {
    const claims = {
      session_id: "session-1",
      amr: [{ method: "passkey", timestamp: 1_700_000_000 }],
    };
    expect(sessionDeverrouillee(claims, "session-1")).toBe(true);
    expect(sessionDeverrouillee(claims, "session-2")).toBe(false);
    expect(sessionDeverrouillee({ ...claims, amr: ["otp"] }, "session-1")).toBe(false);
    expect(sessionDeverrouillee(null, "session-1")).toBe(false);
  });

  it("accepte une authentification récente détaillée ou un AMR RFC accompagné d'un iat récent", () => {
    const maintenant = 1_700_000_900;
    expect(
      authentificationRecente(
        { amr: [{ method: "magiclink", timestamp: maintenant - 60 }] },
        new Set(["magiclink", "otp"]),
        15 * 60,
        maintenant,
      ),
    ).toBe(true);
    expect(
      authentificationRecente(
        { amr: ["otp"], iat: maintenant - 60 },
        new Set(["magiclink", "otp"]),
        15 * 60,
        maintenant,
      ),
    ).toBe(true);
    expect(
      authentificationRecente(
        { amr: [{ method: "otp", timestamp: maintenant - 901 }] },
        new Set(["otp"]),
        15 * 60,
        maintenant,
      ),
    ).toBe(false);
  });

  it.each([
    "/entrer",
    "/auth/confirm",
    "/verrou",
    "/securiser",
    "/securiser/recuperer",
    "/naissance",
    "/consentement",
    "/consentement/revoque",
    "/barriere",
    "/aide",
    "/cgu",
    "/desabonnement",
    "/api/verrou",
  ])("laisse la porte de sortie et les parcours d'auth accessibles : %s", (route) => {
    expect(routeExempteeDuVerrou(route)).toBe(true);
  });

  it.each(["/", "/moi", "/socle", "/astrologie", "/api/anam/message", "/reglages"])(
    "protège les surfaces personnelles : %s",
    (route) => expect(routeExempteeDuVerrou(route)).toBe(false),
  );

  it("utilise un cookie HttpOnly de session, sans durée persistante", () => {
    expect(COOKIE_DEVERROUILLAGE).toBe("anam_deverrouillage");
    expect(OPTIONS_COOKIE_DEVERROUILLAGE).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(OPTIONS_COOKIE_DEVERROUILLAGE).not.toHaveProperty("maxAge");
    expect(OPTIONS_COOKIE_DEVERROUILLAGE.secure).toBe(true);
  });
});
