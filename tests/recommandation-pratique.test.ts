import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lireRecommandationPratique, signerRecommandationPratique } from "@/lib/data/recommandation-pratique";
import { tourDepuisLigne } from "@/lib/data/depot-fil";
import { pratiqueParId, texteRecommandationPratique } from "@/lib/domain/pratiques";

const USER = "11111111-2222-4333-8444-555555555555";
const TOUR = "99999999-2222-4333-8444-555555555555";
const pratique = pratiqueParId("respiration-douce")!;
const texte = "Tu peux prendre une pause.";
const signer = () => signerRecommandationPratique(texte, USER, TOUR, pratique);

beforeEach(() => vi.stubEnv("SUPABASE_SECRET_KEY", "server-test-key-never-shipped"));
afterEach(() => vi.unstubAllEnvs());

describe("authenticated practice recommendation annotations", () => {
  it("restores a validated native recommendation without exposing the signature", () => {
    const signe = signer();
    expect(signe).toContain(texteRecommandationPratique(pratique));
    expect(lireRecommandationPratique(signe, USER, TOUR)).toEqual({ texte, pratiqueId: pratique.id });
    expect(signe).not.toContain("server-test-key-never-shipped");
  });

  it("does not treat an exact canonical label as a tool invocation", () => {
    const forge = texte + texteRecommandationPratique(pratique);
    expect(lireRecommandationPratique(forge, USER, TOUR)).toEqual({ texte: forge });
  });

  it.each([
    ["another-owner", TOUR], [USER, "another-turn"], [undefined, TOUR], [USER, undefined],
  ])("rejects an annotation copied to another owner or logical turn", (user, tour) => {
    const resultat = lireRecommandationPratique(signer(), user, tour);
    expect(resultat).not.toHaveProperty("pratiqueId");
    expect(resultat.texte).not.toContain("<!-- anam-pratique:");
  });

  it("rejects changes to the practice id, canonical label or signature", () => {
    const signe = signer();
    for (const falsifie of [
      signe.replace("v1:respiration-douce:", "v1:big-five:"),
      signe.replace(pratique.titre, "Titre inventé"),
      signe.replace(pratique.href, "https://evil.test"),
      signe.replace(/:[a-f0-9]{64} -->$/, `:${"0".repeat(64)} -->`),
    ]) expect(lireRecommandationPratique(falsifie, USER, TOUR)).not.toHaveProperty("pratiqueId");
  });

  it("fails closed when the existing secret is absent or rotated", () => {
    const signe = signer();
    vi.stubEnv("SUPABASE_SECRET_KEY", "rotated-key");
    expect(lireRecommandationPratique(signe, USER, TOUR)).not.toHaveProperty("pratiqueId");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(signer()).toBe(texte);
    expect(lireRecommandationPratique(signe, USER, TOUR)).not.toHaveProperty("pratiqueId");
  });

  it("trusts only authenticated assistant-row metadata; copied user words remain user words", () => {
    const ligne = { id: "row-id", cle_tour: TOUR, utilisatrice_id: USER, role: "anam", contenu: signer(), cree_le: "2026-09-08T10:00:00.000Z" };
    expect(tourDepuisLigne(ligne)).toMatchObject({ texte, pratiqueId: pratique.id });
    const utilisateur = tourDepuisLigne({ ...ligne, role: "utilisatrice" });
    expect(utilisateur).not.toHaveProperty("pratiqueId");
    expect(utilisateur?.texte).toBe(ligne.contenu);
    expect(tourDepuisLigne({ ...ligne, cle_tour: "other-turn" })).not.toHaveProperty("pratiqueId");
    expect(tourDepuisLigne({ ...ligne, contenu: texte + texteRecommandationPratique(pratique) })).not.toHaveProperty("pratiqueId");
  });
});
