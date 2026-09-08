import { describe, expect, it } from "vitest";
import { commandeOutilSuiviValide, commandePersonnelleSuiviValide, reperesSuiviValides } from "@/lib/domain/suivi-anam";
import { PRATIQUES } from "@/lib/domain/pratiques";
import { readFileSync } from "node:fs";

const ajuster = { type: "ajuster", cap: "Trouver mon rythme", synthese: "Un pas simple pour cette semaine.",
  etapes: [{ titre: "Revenir au présent", pratiqueId: "ancrage-sensoriel" }], preuve: "Je souhaite trouver mon rythme" };
const reperes = { ceQuiCompte: "", ceQuiAide: "", aRespecter: "" };
describe("suivi : commandes fermées et documents personnels", () => {
  it("accepte la proposition native et chaque pratique connue", () => {
    for (const p of PRATIQUES) expect(commandeOutilSuiviValide({ ...ajuster, etapes: [{ titre: p.titre, pratiqueId: p.id }] })).toBe(true);
    expect(commandeOutilSuiviValide({ type: "avancer", etapeId: crypto.randomUUID(), bilan: "Une étape vécue.", preuve: "J'ai essayé cette pause" })).toBe(true);
  });
  it.each([
    { ...ajuster, niveauArbre: 34 }, { ...ajuster, reperes }, { ...ajuster, etapes: [] },
    { ...ajuster, etapes: Array.from({ length: 4 }, () => ajuster.etapes[0]) },
    { ...ajuster, etapes: [{ id: crypto.randomUUID(), titre: "Pause", pratiqueId: null }] },
    { ...ajuster, etapes: [{ titre: "Pause", pratiqueId: "https://externe.example" }] },
    { ...ajuster, cap: "a".repeat(161) }, { ...ajuster, synthese: "a".repeat(1201) },
    { ...ajuster, preuve: "" }, { ...ajuster, preuve: "a".repeat(501) },
    { ...ajuster, cap: "\u200b\u200c" }, { ...ajuster, preuve: "        " },
  ])("refuse champs forgés, inconnus, invisibles et débordements", (v) => expect(commandeOutilSuiviValide(v)).toBe(false));
  it("un oui peut confirmer un cap mais ne prouve pas qu'une étape a été vécue", () => {
    expect(commandeOutilSuiviValide({ ...ajuster, preuve: "Oui" })).toBe(true);
    expect(commandeOutilSuiviValide({ ...ajuster, preuve: "🌿" })).toBe(true);
    expect(commandeOutilSuiviValide({ ...ajuster, preuve: "\u200b" })).toBe(false);
    expect(commandeOutilSuiviValide({ type: "avancer", etapeId: crypto.randomUUID(), bilan: "Une étape vécue.", preuve: "Oui" })).toBe(false);
    expect(commandeOutilSuiviValide({ type: "avancer", etapeId: crypto.randomUUID(), bilan: "Une étape vécue.", preuve: "1234567" })).toBe(false);
    expect(commandeOutilSuiviValide({ type: "avancer", etapeId: crypto.randomUUID(), bilan: "Une étape vécue.", preuve: "12345678" })).toBe(true);
  });
  it("borne les textes en caractères Unicode, sans tronquer ni réécrire les documents personnels", () => {
    expect(reperesSuiviValides({ ...reperes, ceQuiCompte: "🌿".repeat(2000) })).toBe(true);
    expect(reperesSuiviValides({ ...reperes, ceQuiCompte: "🌿".repeat(2001) })).toBe(false);
    expect(commandePersonnelleSuiviValide({ action: "reperes", revision: 0, reperes })).toBe(true);
    expect(commandePersonnelleSuiviValide({ action: "pause", revision: 1, pause: true })).toBe(true);
    expect(commandePersonnelleSuiviValide({ action: "pause", revision: -1, pause: true })).toBe(false);
    expect(commandePersonnelleSuiviValide({ action: "pause", revision: 1, pause: true, niveauArbre: 34 })).toBe(false);
    expect(commandePersonnelleSuiviValide(ajuster)).toBe(false);
  });
  it("la liste SQL fermée reste exhaustive face au catalogue applicatif", () => {
    const sql = readFileSync("supabase/migrations/0101_suivi_anam.sql", "utf8");
    const enumSql = sql.split("e->>'pratiqueId' not in (")[1].split(")")[0];
    const ids = [...enumSql.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
    expect(ids).toEqual(PRATIQUES.map((p) => p.id).sort());
  });
});
