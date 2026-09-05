import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SQL = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0091_texte_du_jour_stable.sql"),
  "utf8",
);

describe("[RC-D2] cache durable du ciel du jour", () => {
  it("indexe uniquement le jour civil, la signature minimisée et la version éditoriale", () => {
    const table = SQL.match(/create table public\.texte_du_jour_stable \(([\s\S]*?)\n\);/)?.[1] ?? "";
    expect(table).toContain("primary key (jour, condensat_signature, version_editoriale)");
    expect(table).not.toMatch(/utilisatrice|user_id|profil|naissance|message|journal|prenom/i);
    expect(table).toMatch(/condensat_signature text not null check \(condensat_signature ~ '\^\[0-9a-f\]\{64\}\$'\)/);
  });

  it("fige le premier contenu sans mise à jour destructive", () => {
    expect(SQL).toMatch(/insert into public\.texte_du_jour_stable[\s\S]*on conflict do nothing;/);
    expect(SQL).not.toMatch(/on conflict[\s\S]{0,100}do update/i);
    expect(SQL).toMatch(/expire_le > now\(\)/);
  });

  it("donne à l'ordonnanceur une purge physique des lignes expirées", () => {
    expect(SQL).toMatch(/create or replace function public\.purger_textes_du_jour_expires\(\)/);
    expect(SQL).toMatch(/delete from public\.texte_du_jour_stable where expire_le <= now\(\)/);
    expect(SQL).toMatch(/grant execute on function public\.purger_textes_du_jour_expires\(\) to service_role/);
  });

  it("n'ouvre ni lecture ni écriture aux sessions applicatives", () => {
    expect(SQL).toMatch(/force row level security/);
    expect(SQL).toMatch(/revoke all on table public\.texte_du_jour_stable from public, anon, authenticated, service_role/);
    expect(SQL).toMatch(/grant execute on function public\.figer_texte_du_jour[\s\S]*to service_role/);
    expect(SQL).not.toMatch(/to authenticated/);
  });
});
