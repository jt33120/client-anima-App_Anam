import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/0087_enneagramme_reponses_inconnues.sql",
  "utf8",
);

describe("[13.8] migration additive de « Je ne sais pas »", () => {
  it("remplace seulement le prédicat de validation JSONB, sans toucher aux tables", () => {
    expect(migration).toMatch(/create or replace function public\.reponses_enneagramme_valides/);
    expect(migration).not.toMatch(/alter table|drop table|create table/i);
  });

  it("conserve les niveaux 0..3 et autorise explicitement JSON null", () => {
    expect(migration).toContain("jsonb_typeof(e.valeur) <> 'null'");
    expect(migration).toMatch(/not in \(0, 1, 2, 3\)/);
  });

  it("conserve la borne et le motif rétrocompatibles des dix-huit items", () => {
    expect(migration).toContain("<= 18");
    expect(migration).toContain("^e[1-9][ab]$");
  });
});
