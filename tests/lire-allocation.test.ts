import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  compterToursResiduelsDuMois,
  reserverTourResiduelDuMois,
} from "@/lib/data/lire-allocation";
import { metrerUsageIa } from "@/lib/ai/metrage";

/**
 * Correctif Story 3.4 — le lecteur compatible et le contrat de réservation frappent le vrai SQL.
 * Le registre d'admission est désormais la seule source du quota ; `usage_ia` reste le coût réel.
 */

const url = process.env.SUPABASE_URL!;
const secret = process.env.SUPABASE_SECRET_KEY!;
const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const t = Date.now();
const cleTour1 = crypto.randomUUID();
const cleTour2 = crypto.randomUUID();

describe("allocation résiduelle — contrat serveur sur le registre de réservation", () => {
  const u = { email: `alloc-atomique-${t}@exemple.fr`, password: "test-alloc-123!", id: "" };

  beforeAll(async () => {
    if (!url || !secret) throw new Error("Supabase local requis (SUPABASE_URL / SECRET_KEY).");
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser: ${error.message}`);
    u.id = data.user!.id;
  });

  afterAll(async () => {
    if (u.id) await admin.auth.admin.deleteUser(u.id);
  });

  it("réserve puis compte une unité dans le mois UTC courant", async () => {
    expect(await compterToursResiduelsDuMois(u.id)).toBe(0);
    expect(await reserverTourResiduelDuMois(u.id, cleTour1, 2)).toBe(true);
    expect(await compterToursResiduelsDuMois(u.id)).toBe(1);
  });

  it("un retry avec la même clé reste autorisé sans seconde unité", async () => {
    expect(await reserverTourResiduelDuMois(u.id, cleTour1, 1)).toBe(true);
    expect(await compterToursResiduelsDuMois(u.id)).toBe(1);
  });

  it("refuse une nouvelle clé au plafond sans l'insérer", async () => {
    expect(await reserverTourResiduelDuMois(u.id, cleTour2, 1)).toBe(false);
    expect(await compterToursResiduelsDuMois(u.id)).toBe(1);
  });

  it("conserve la lecture compatible avec exclusion optionnelle", async () => {
    expect(await compterToursResiduelsDuMois(u.id, cleTour1.toUpperCase())).toBe(0);
    expect(await compterToursResiduelsDuMois(u.id, crypto.randomUUID())).toBe(1);
  });

  it("une ligne de coût `usage_ia` n'est plus une mutation implicite du quota", async () => {
    await metrerUsageIa({
      utilisatriceId: u.id,
      cleIdempotence: `cout-seul-${t}`,
      operation: "conversation",
      capacite: "echange",
      tier: "leger",
      modele: "factice",
      tokensEntree: 2,
      tokensSortie: 3,
      premiumAuMomentAppel: false,
      exempteQuota: false,
      comptabiliseFinancierement: true,
      postPremiereSeance: true,
    });
    expect(await compterToursResiduelsDuMois(u.id)).toBe(1);
  });
});
