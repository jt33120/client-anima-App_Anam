import { describe, expect, it } from "vitest";
import { TARIF_VERSION_MISTRAL, tariferUsageIa } from "@/lib/ai/tarification";

describe("tariferUsageIa — décimal exact, catalogue versionné", () => {
  it("tarife Small 4 sans flottant (1 token de chaque sens)", () => {
    expect(tariferUsageIa("mistral-small-2603", 1, 1)).toEqual({
      tarifVersion: TARIF_VERSION_MISTRAL,
      tarifConnu: true,
      devise: "USD",
      uniteUsage: "token",
      prixEntreeUsdParMillion: "0.15000000",
      prixSortieUsdParMillion: "0.60000000",
      coutUsd: "0.000000750",
    });
  });

  it("tarife Large 3 exactement à 2 USD pour un million de tokens dans chaque sens", () => {
    const t = tariferUsageIa("mistral-large-2512", 1_000_000, 1_000_000);
    expect(t.prixEntreeUsdParMillion).toBe("0.50000000");
    expect(t.prixSortieUsdParMillion).toBe("1.50000000");
    expect(t.coutUsd).toBe("2.000000000");
  });

  it("connaît le tarif nul de l'adaptateur factice", () => {
    const t = tariferUsageIa("factice", 42, 99);
    expect(t.tarifConnu).toBe(true);
    expect(t.tarifVersion).toBe("factice-v1");
    expect(t.coutUsd).toBe("0.000000000");
  });

  it("ne transforme jamais un modèle inconnu en faux coût zéro", () => {
    expect(tariferUsageIa("modele-futur", 10, 20)).toEqual({
      tarifVersion: `inconnu:${TARIF_VERSION_MISTRAL}`,
      tarifConnu: false,
      devise: "USD",
      uniteUsage: "token",
      prixEntreeUsdParMillion: null,
      prixSortieUsdParMillion: null,
      coutUsd: null,
    });
  });

  it("traite aussi les noms hérités d'Object comme des modèles inconnus, jamais comme des tarifs", () => {
    for (const modele of ["constructor", "toString", "__proto__"]) {
      const t = tariferUsageIa(modele, 10, 20);
      expect(t.tarifConnu).toBe(false);
      expect(t.coutUsd).toBeNull();
    }
  });

  it("refuse les compteurs négatifs, fractionnaires ou non sûrs avant toute écriture", () => {
    expect(() => tariferUsageIa("factice", -1, 0)).toThrow(RangeError);
    expect(() => tariferUsageIa("factice", 1.5, 0)).toThrow(RangeError);
    expect(() => tariferUsageIa("factice", Number.MAX_SAFE_INTEGER + 1, 0)).toThrow(RangeError);
  });
});
