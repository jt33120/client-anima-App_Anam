import { describe, expect, it } from "vitest";
import { OUTIL_PROPOSER_PRATIQUE, resoudrePratiqueProposee } from "@/lib/ai/outils-pratiques";
import { PRATIQUES } from "@/lib/domain/pratiques";

const appel = (arguments_: unknown, nom = "proposer_pratique") => ({ nom, arguments: arguments_ });

describe("practice recommendation capability", () => {
  it("resolves only canonical catalogue entries, including the existing questionnaires", () => {
    for (const pratique of PRATIQUES) {
      expect(resoudrePratiqueProposee([appel(JSON.stringify({ pratiqueId: pratique.id }))], true)).toBe(pratique);
    }
    expect(OUTIL_PROPOSER_PRATIQUE.parametres).toMatchObject({ additionalProperties: false, required: ["pratiqueId"] });
  });

  it.each([
    null, [], {}, "{", { pratiqueId: "https://evil.test" }, { pratiqueId: "__proto__" },
    { pratiqueId: "respiration-douce", href: "https://evil.test" },
    { pratiqueId: "respiration-douce", niveauArbre: 3 }, { pratiqueId: 2 },
    " ".repeat(4097),
  ])("rejects malformed, extended or unregistered provider arguments: %j", (args) => {
    expect(resoudrePratiqueProposee([appel(args)], true)).toBeNull();
  });

  it("denies calls without the server grant and ignores all other function names", () => {
    const args = { pratiqueId: "respiration-douce" };
    expect(resoudrePratiqueProposee([appel(args)], false)).toBeNull();
    expect(resoudrePratiqueProposee([appel(args, "avancer_arbre")], true)).toBeNull();
    expect(resoudrePratiqueProposee(Array(5).fill(appel(args)), true)).toBeNull();
  });

  it("returns at most one recommendation", () => {
    const resultat = resoudrePratiqueProposee([
      appel({ pratiqueId: "inconnu" }), appel({ pratiqueId: "ancrage-sensoriel" }), appel({ pratiqueId: "big-five" }),
    ], true);
    expect(resultat?.id).toBe("ancrage-sensoriel");
  });
});
