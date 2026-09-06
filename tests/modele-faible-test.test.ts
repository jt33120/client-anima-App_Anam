import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { autorisationModeleFaibleTest } from "@/lib/ai/modele-faible-test";

const JULIAN = "11111111-1111-4111-8111-111111111111";
const AUTRE = "22222222-2222-4222-8222-222222222222";

describe("modèle faible — autorisation temporaire du test privé", () => {
  it("reste inactif par défaut", () => {
    expect(autorisationModeleFaibleTest(JULIAN, {})).toBe("inactive");
  });

  it("autorise uniquement l'identifiant serveur déclaré", () => {
    const env = {
      ANIMA_MODELE_FAIBLE_TEST: "oui",
      ANIMA_TESTEUR_MODELE_FAIBLE_ID: JULIAN,
      ANIMA_INDEXABLE: "",
    };
    expect(autorisationModeleFaibleTest(JULIAN, env)).toBe("autorisee");
    expect(autorisationModeleFaibleTest(AUTRE, env)).toBe("refusee");
  });

  it("compare les UUID sans dépendre de leur casse textuelle", () => {
    expect(
      autorisationModeleFaibleTest(JULIAN, {
        ANIMA_MODELE_FAIBLE_TEST: "oui",
        ANIMA_TESTEUR_MODELE_FAIBLE_ID: JULIAN.toUpperCase(),
      }),
    ).toBe("autorisee");
  });

  it("refuse une valeur approximative au lieu de retomber silencieusement sur Large", () => {
    for (const valeur of ["true", "Oui", "oui ", "1"]) {
      expect(() =>
        autorisationModeleFaibleTest(JULIAN, {
          ANIMA_MODELE_FAIBLE_TEST: valeur,
          ANIMA_TESTEUR_MODELE_FAIBLE_ID: JULIAN,
        }),
      ).toThrow("modele_faible_test_drapeau_invalide");
    }
  });

  it("refuse un identifiant absent ou mal formé", () => {
    for (const identifiant of [undefined, "", "julian"] as const) {
      expect(() =>
        autorisationModeleFaibleTest(JULIAN, {
          ANIMA_MODELE_FAIBLE_TEST: "oui",
          ANIMA_TESTEUR_MODELE_FAIBLE_ID: identifiant,
        }),
      ).toThrow("modele_faible_test_identifiant_invalide");
    }
  });

  it("bloque le contournement quand l'indexation publique est demandée", () => {
    expect(() =>
      autorisationModeleFaibleTest(JULIAN, {
        ANIMA_MODELE_FAIBLE_TEST: "oui",
        ANIMA_TESTEUR_MODELE_FAIBLE_ID: JULIAN,
        ANIMA_INDEXABLE: "oui",
      }),
    ).toThrow("modele_faible_test_public_interdit");
  });

  it("câble l'autorisation après l'authentification et avant toute lecture ou sortie IA", () => {
    const route = readFileSync(
      resolve(process.cwd(), "app/api/anam/message/route.ts"),
      "utf8",
    );
    const authentification = route.indexOf("supabase.auth.getUser()");
    const autorisation = route.indexOf("autorisationModeleFaibleTest(user.id)");
    const refus = route.indexOf('autorisationModeleFaible === "refusee"');
    const lectureCorps = route.indexOf("request.json()");
    const fabrique = route.indexOf("adaptateur = await creerAiPort({");

    expect(authentification).toBeGreaterThanOrEqual(0);
    expect(autorisation).toBeGreaterThan(authentification);
    expect(refus).toBeGreaterThan(autorisation);
    expect(lectureCorps).toBeGreaterThan(refus);
    expect(fabrique).toBeGreaterThan(lectureCorps);
    expect(route).toContain(
      'autoriserModeleFaibleTest: autorisationModeleFaible === "autorisee"',
    );
  });
});
