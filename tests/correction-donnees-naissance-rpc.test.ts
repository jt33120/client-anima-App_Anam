import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** RC-E4 — preuve vivante de la transaction complète, contre Supabase local. */
const url = process.env.SUPABASE_URL!;
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY!;
const secret = process.env.SUPABASE_SECRET_KEY!;

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ancien = {
  date: "1990-06-15",
  heure: "14:30:00",
  lieu: "Bordeaux",
  latitude: 44.84,
  longitude: -0.58,
  fuseau: "Europe/Paris",
} as const;

const nouveau = {
  date: "1991-07-16",
  heure: "08:05:00",
  lieu: "Paris",
  latitude: 48.8566,
  longitude: 2.3522,
  fuseau: "Europe/Paris",
} as const;

function parametres(
  id: string,
  entree: typeof ancien | typeof nouveau,
  attendu: typeof ancien | typeof nouveau,
) {
  return {
    p_utilisatrice_id: id,
    p_date: entree.date,
    p_heure: entree.heure,
    p_lieu_nom: entree.lieu,
    p_lieu_latitude: entree.latitude,
    p_lieu_longitude: entree.longitude,
    p_lieu_fuseau: entree.fuseau,
    p_empreinte_theme: "b".repeat(64),
    p_theme: { schema: 2, adaptateur: "test-corrige", positions: [], absents: [], angles: {} },
    p_date_attendue: attendu.date,
    p_heure_attendue: attendu.heure,
    p_lieu_nom_attendu: attendu.lieu,
    p_lieu_latitude_attendue: attendu.latitude,
    p_lieu_longitude_attendue: attendu.longitude,
    p_lieu_fuseau_attendu: attendu.fuseau,
  };
}

describe("[RC-E4] corriger_donnees_naissance — transaction réelle", () => {
  let id = "";
  let client: SupabaseClient;
  const email = `rc-e4-${Date.now()}@exemple.fr`;
  const password = "test-rc-e4-123!";

  beforeAll(async () => {
    const creation = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (creation.error) throw new Error(`createUser: ${creation.error.message}`);
    id = creation.data.user!.id;

    const naissance = await admin.from("utilisatrice").update({
      date_naissance: ancien.date,
      heure_naissance: ancien.heure,
      lieu_naissance: ancien.lieu,
      lieu_latitude: ancien.latitude,
      lieu_longitude: ancien.longitude,
      lieu_fuseau: ancien.fuseau,
    }).eq("id", id);
    if (naissance.error) throw new Error(`naissance: ${naissance.error.message}`);

    const consentement = await admin.from("consentement").upsert(
      { utilisatrice_id: id, art9_accorde: true, ia_reconnue: true, cgu_acceptees: true },
      { onConflict: "utilisatrice_id" },
    );
    if (consentement.error) throw new Error(`consentement: ${consentement.error.message}`);

    const theme = await admin.from("theme_natal").insert({
      utilisatrice_id: id,
      empreinte_entrees: "avant-rc-e4",
      contenu: { schema: 2, adaptateur: "test", positions: [], absents: [], angles: {} },
    });
    if (theme.error) throw new Error(`theme: ${theme.error.message}`);

    client = createClient(url, publishable, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const connexion = await client.auth.signInWithPassword({ email, password });
    if (connexion.error) throw new Error(`signIn: ${connexion.error.message}`);
  });

  afterAll(async () => {
    if (id) await admin.auth.admin.deleteUser(id);
  });

  it("refuse l’appel direct avec le JWT du navigateur", async () => {
    const { error } = await client.rpc("corriger_donnees_naissance", parametres(id, nouveau, ancien));
    expect(error, "authenticated a pu appeler la RPC privilégiée").not.toBeNull();
  });

  it("corrige les six champs, trace le geste et regrave le thème atomiquement", async () => {
    const correction = await admin.rpc("corriger_donnees_naissance", parametres(id, nouveau, ancien));
    expect(correction.error).toBeNull();
    expect(correction.data).toBe("corrigee");

    const etat = await admin.from("utilisatrice")
      .select("date_naissance, heure_naissance, lieu_naissance, lieu_latitude, lieu_longitude, lieu_fuseau, naissance_corrections, naissance_corrigee_le")
      .eq("id", id)
      .single();
    expect(etat.error).toBeNull();
    expect(etat.data).toMatchObject({
      date_naissance: nouveau.date,
      heure_naissance: nouveau.heure,
      lieu_naissance: nouveau.lieu,
      lieu_latitude: nouveau.latitude,
      lieu_longitude: nouveau.longitude,
      lieu_fuseau: nouveau.fuseau,
      naissance_corrections: 1,
    });
    expect(etat.data?.naissance_corrigee_le).toBeTruthy();

    const themes = await admin.from("theme_natal")
      .select("version, empreinte_entrees, contenu")
      .eq("utilisatrice_id", id);
    expect(themes.error).toBeNull();
    expect(themes.data).toEqual([{
      version: 2,
      empreinte_entrees: "b".repeat(64),
      contenu: { schema: 2, adaptateur: "test-corrige", positions: [], absents: [], angles: {} },
    }]);

    const audit = await admin.from("audit_correction_naissance")
      .select("statut, version_contrat")
      .eq("utilisatrice_id", id);
    expect(audit.error).toBeNull();
    expect(audit.data).toEqual([{ statut: "corrigee", version_contrat: 1 }]);
  });

  it("refuse un aperçu périmé sans modifier l’état courant", async () => {
    const tentative = await admin.rpc(
      "corriger_donnees_naissance",
      parametres(id, ancien, ancien),
    );
    expect(tentative.error).toBeNull();
    expect(tentative.data).toBe("refusee");

    const etat = await admin.from("utilisatrice")
      .select("date_naissance, heure_naissance, lieu_naissance, naissance_corrections")
      .eq("id", id)
      .single();
    expect(etat.data).toMatchObject({
      date_naissance: nouveau.date,
      heure_naissance: nouveau.heure,
      lieu_naissance: nouveau.lieu,
      naissance_corrections: 1,
    });
  });

  it("refuse une date mineure dans la transaction", async () => {
    const tentative = await admin.rpc("corriger_donnees_naissance", {
      ...parametres(id, ancien, nouveau),
      p_date: new Date().getFullYear() - 10 + "-01-01",
    });
    expect(tentative.error).toBeNull();
    expect(tentative.data).toBe("refusee");

    const etat = await admin.from("utilisatrice").select("date_naissance").eq("id", id).single();
    expect(etat.data?.date_naissance).toBe(nouveau.date);
  });
});
