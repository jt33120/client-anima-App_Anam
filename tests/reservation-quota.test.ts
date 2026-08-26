import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0083_reservation_quota_ia_atomique.sql"),
  "utf-8",
).toLowerCase();

describe("0083 — structure de la réservation atomique", () => {
  it("sépare admission et coût, avec une clé mensuelle UTC par tour logique", () => {
    expect(sql).toMatch(/create table public\.reservation_quota_ia/);
    expect(sql).toMatch(/primary key\s*\(utilisatrice_id, mois_utc, cle_idempotence\)/);
    expect(sql).toMatch(/statement_timestamp\(\) at time zone 'utc'/);
    expect(sql).not.toMatch(/alter table public\.usage_ia[\s\S]*add column reservation/);
  });

  it("reprend les anciens tours principaux éligibles sans confondre coût et quota", () => {
    const backfill = sql.slice(sql.indexOf("insert into public.reservation_quota_ia"));
    const reprise = backfill.slice(0, backfill.indexOf("alter table"));
    expect(reprise).toMatch(/from public\.usage_ia/);
    expect(reprise).toMatch(/post_premiere_seance = true/);
    expect(reprise).toMatch(/exempte_quota = false/);
    expect(reprise).toMatch(/u\.cree_le >=[\s\S]*statement_timestamp\(\)[\s\S]*u\.cree_le </);
    expect(reprise).toMatch(/interval '1 month'/);
    expect(reprise).toMatch(/on conflict \(utilisatrice_id, mois_utc, cle_idempotence\) do nothing/);
    expect(reprise).toMatch(/lower\(case[\s\S]*when btrim\(u\.cle_idempotence\) = '' then 'historique:' \|\| u\.id::text/);
  });

  it("canonise la clé UUID dans la route SQL et interdit les variantes de casse en table", () => {
    expect(sql).toMatch(/p_cle_idempotence uuid/);
    expect(sql).toMatch(/v_cle text := lower\(p_cle_idempotence::text\)/);
    expect(sql).toMatch(/check \(cle_idempotence = lower\(cle_idempotence\)\)/);
  });

  it("verrouille utilisatrice+mois avant idempotence, décompte et insertion", () => {
    const corps = sql.slice(sql.indexOf("create or replace function public.reserver_quota_ia_atomique"));
    const iLock = corps.indexOf("pg_advisory_xact_lock");
    const iReconciliation = corps.indexOf("insert into public.reservation_quota_ia", iLock);
    const iExiste = corps.indexOf("if exists");
    const iCompte = corps.indexOf("select count(*)");
    const iInsere = corps.lastIndexOf("insert into public.reservation_quota_ia");
    expect(iLock).toBeGreaterThan(-1);
    expect(iReconciliation, "le rattrapage de rollout est sérialisé").toBeGreaterThan(iLock);
    expect(iExiste).toBeGreaterThan(iReconciliation);
    expect(iCompte).toBeGreaterThan(iExiste);
    expect(iInsere).toBeGreaterThan(iCompte);
  });

  it("rattrape sous verrou les écritures legacy arrivées après le backfill de migration", () => {
    const corps = sql.slice(sql.indexOf("create or replace function public.reserver_quota_ia_atomique"));
    const reprise = corps.slice(
      corps.indexOf("insert into public.reservation_quota_ia"),
      corps.indexOf("if exists"),
    );
    expect(reprise).toMatch(/from public\.usage_ia u/);
    expect(reprise).toMatch(/u\.utilisatrice_id = p_utilisatrice/);
    expect(reprise).toMatch(/u\.post_premiere_seance = true/);
    expect(reprise).toMatch(/u\.exempte_quota = false/);
    expect(reprise).toMatch(/v_mois \+ interval '1 month'/);
    expect(reprise).toMatch(/on conflict \(utilisatrice_id, mois_utc, cle_idempotence\) do nothing/);
  });

  it("autorise d'abord la même clé, puis refuse au plafond sans insertion", () => {
    const corps = sql.slice(sql.indexOf("create or replace function public.reserver_quota_ia_atomique"));
    expect(corps).toMatch(/if exists[\s\S]*return true;/);
    expect(corps).toMatch(/if v_total >= p_limite then\s*return false;\s*end if;\s*insert into/);
    expect(corps).not.toMatch(/delete from public\.reservation_quota_ia/);
  });

  it("reste deny-by-default et service-role-only", () => {
    expect(sql).toMatch(/enable row level security/);
    expect(sql).toMatch(/force row level security/);
    expect(sql).not.toMatch(/create policy/);
    expect(sql).toMatch(/security definer\s*set search_path = ''/);
    expect(sql).toMatch(/revoke all on table public\.reservation_quota_ia from public, anon, authenticated, service_role/);
    expect(sql).toMatch(/grant select on table public\.reservation_quota_ia to service_role/);
    expect(sql).toMatch(/revoke all on function public\.reserver_quota_ia_atomique\(uuid, uuid, bigint\)[\s\S]*from public, anon, authenticated/);
    expect(sql).toMatch(/grant execute on function public\.reserver_quota_ia_atomique\(uuid, uuid, bigint\)[\s\S]*to service_role/);
  });
});

const url = process.env.SUPABASE_URL!;
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY!;
const secret = process.env.SUPABASE_SECRET_KEY!;
const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const clientPublic = () =>
  createClient(url, publishable, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

async function reserver(client: SupabaseClient, id: string, cle: string, limite: number) {
  const { data, error } = await client.rpc("reserver_quota_ia_atomique", {
    p_utilisatrice: id,
    p_cle_idempotence: cle,
    p_limite: limite,
  });
  if (error) throw new Error(`rpc réservation: ${error.message}`);
  if (typeof data !== "boolean") throw new Error("forme RPC invalide");
  return data;
}

describe("0083 — concurrence réelle PostgreSQL", () => {
  let id = "";
  let email = "";
  const password = "test-quota-atomique-123!";

  beforeEach(async () => {
    if (!url || !publishable || !secret) {
      throw new Error("Supabase local requis (SUPABASE_URL / PUBLISHABLE_KEY / SECRET_KEY).");
    }
    email = `quota-${Date.now()}-${crypto.randomUUID()}@exemple.fr`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser: ${error.message}`);
    id = data.user!.id;
  });

  afterEach(async () => {
    if (id) await admin.auth.admin.deleteUser(id);
    id = "";
  });

  it("une seule des deux clés gagne la dernière place", async () => {
    expect(await reserver(admin, id, crypto.randomUUID(), 2)).toBe(true);
    // Un éventail élargi ne remplace pas la preuve structurelle du verrou ci-dessus, mais évite que
    // le test ne dépende uniquement d'un heureux ordonnancement séquentiel de deux requêtes PostgREST.
    const decisions = await Promise.all(
      Array.from({ length: 24 }, () => reserver(admin, id, crypto.randomUUID(), 2)),
    );
    expect(decisions.filter(Boolean)).toHaveLength(1);
    const { count, error } = await admin
      .from("reservation_quota_ia")
      .select("*", { count: "exact", head: true })
      .eq("utilisatrice_id", id);
    expect(error).toBeNull();
    expect(count).toBe(2);
  });

  it("deux appels concurrents avec la même clé sont admis mais n'écrivent qu'une ligne", async () => {
    const cle = crypto.randomUUID();
    expect(await Promise.all([
      reserver(admin, id, cle.toUpperCase(), 1),
      reserver(admin, id, cle, 1),
    ])).toEqual([true, true]);
    const { count } = await admin
      .from("reservation_quota_ia")
      .select("*", { count: "exact", head: true })
      .eq("utilisatrice_id", id);
    expect(count).toBe(1);
  });

  it("une limite zéro refuse sans créer de ligne", async () => {
    expect(await reserver(admin, id, crypto.randomUUID(), 0)).toBe(false);
    const { count } = await admin
      .from("reservation_quota_ia")
      .select("*", { count: "exact", head: true })
      .eq("utilisatrice_id", id);
    expect(count).toBe(0);
  });

  it("anon et authenticated ne peuvent ni réserver ni lire le registre", async () => {
    const anon = clientPublic();
    expect((await anon.rpc("reserver_quota_ia_atomique", {
      p_utilisatrice: id,
      p_cle_idempotence: crypto.randomUUID(),
      p_limite: 1,
    })).error).not.toBeNull();

    const authentifie = clientPublic();
    const connexion = await authentifie.auth.signInWithPassword({ email, password });
    expect(connexion.error).toBeNull();
    expect((await authentifie.rpc("reserver_quota_ia_atomique", {
      p_utilisatrice: id,
      p_cle_idempotence: crypto.randomUUID(),
      p_limite: 1,
    })).error).not.toBeNull();
    expect((await authentifie.from("reservation_quota_ia").select("*")).error).not.toBeNull();
  });

  it("même service_role ne peut pas contourner le verrou par une écriture directe", async () => {
    const { error } = await admin.from("reservation_quota_ia").insert({
      utilisatrice_id: id,
      mois_utc: new Date().toISOString().slice(0, 7) + "-01",
      cle_idempotence: crypto.randomUUID(),
    });
    expect(error).not.toBeNull();
    expect(await reserver(admin, id, crypto.randomUUID(), 1)).toBe(true);
  });
});
