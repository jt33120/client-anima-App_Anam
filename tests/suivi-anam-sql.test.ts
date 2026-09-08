import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { declarerMajorite } from "./_semis";

const url = process.env.SUPABASE_URL!;
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, options);
const nu = () => createClient(url, process.env.SUPABASE_PUBLISHABLE_KEY!, options);
type Compte = { id: string; client: SupabaseClient };
const comptes: Compte[] = [];
const preuve = "Je souhaite prendre une pause et en parler";
const commande = { type: "ajuster", cap: "Retrouver mon rythme", synthese: "Explorer une pause confortable.",
  etapes: [{ titre: "Observer un instant", pratiqueId: "ancrage-sensoriel" }, { titre: "En parler", pratiqueId: null }], preuve };
const reperes = { ceQuiCompte: "Mon temps", ceQuiAide: "La marche", aRespecter: "Je garde mon rythme" };
async function creer(majorite = true, consentement = true): Promise<Compte> {
  const email = `suivi-${crypto.randomUUID()}@exemple.fr`, password = "Test-suivi-123!";
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const id = data.user!.id;
  if (majorite) await declarerMajorite(admin, id);
  if (consentement) {
    const c = await admin.from("consentement").insert({ utilisatrice_id: id, art9_accorde: true, ia_reconnue: true, cgu_acceptees: true });
    if (c.error) throw c.error;
  }
  const client = nu();
  const connexion = await client.auth.signInWithPassword({ email, password });
  if (connexion.error) throw connexion.error;
  const compte = { id, client }; comptes.push(compte); return compte;
}
async function journal(c: Compte, contenu = preuve) {
  const cle = crypto.randomUUID();
  const { data, error } = await admin.from("entree_journal").insert({ utilisatrice_id: c.id, role: "utilisatrice", cle_tour: cle, contenu }).select("id").single();
  if (error) throw error;
  return { cle, id: data.id as string };
}
const appliquer = (c: Compte, cle: string, revision: number, cmd: unknown = commande) => admin.rpc("appliquer_outil_suivi_anam", {
  p_utilisatrice_id: c.id, p_cle_tour: cle, p_revision: revision, p_commande: cmd,
});
const lire = (c: Compte) => c.client.from("suivi_anam").select("*").single();
const modifier = (c: Compte, revision: number, values: Record<string, unknown>) => c.client.rpc("modifier_suivi_personnel", {
  p_revision: revision, p_commande: { revision, ...values },
});
async function detresse(c: Compte) {
  const { error } = await admin.from("episode_detresse").insert({ utilisatrice_id: c.id, niveau_max: 1 });
  if (error) throw error;
}
let alice: Compte, autre: Compte;
beforeAll(async () => { alice = await creer(); autre = await creer(); });
afterAll(async () => { for (const c of comptes) await admin.auth.admin.deleteUser(c.id); });

describe.sequential("suivi durable contre PostgreSQL local", () => {
  let source: { cle: string; id: string };
  let sourceAvance: string;
  it("seul le propriétaire écrit ses documents, avec une révision atomique", async () => {
    expect((await modifier(alice, 0, { action: "reperes", reperes })).error).toBeNull();
    expect((await lire(alice)).data).toMatchObject({ revision: 1, reperes, niveau_arbre: 0 });
    expect((await autre.client.from("suivi_anam").select("*").eq("utilisatrice_id", alice.id)).data).toEqual([]);
    expect((await modifier(alice, 0, { action: "reperes", reperes: { ...reperes, ceQuiCompte: "Écraser" } })).error?.code).toBe("PT409");
    expect((await lire(alice)).data?.reperes).toEqual(reperes);
  });
  it("interdit écriture directe, appel natif par JWT, et lecture anonyme", async () => {
    expect((await alice.client.from("suivi_anam").update({ niveau_arbre: 34 }).eq("utilisatrice_id", alice.id)).error).not.toBeNull();
    expect((await alice.client.from("suivi_anam").insert({ utilisatrice_id: alice.id })).error).not.toBeNull();
    expect((await alice.client.rpc("appliquer_outil_suivi_anam", { p_utilisatrice_id: alice.id, p_cle_tour: "forge", p_revision: 1, p_commande: commande })).error).not.toBeNull();
    expect((await nu().from("suivi_anam").select("*")).error).not.toBeNull();
    expect((await nu().rpc("modifier_suivi_personnel", { p_revision: 0, p_commande: { action: "pause", pause: true, revision: 0 } })).error).not.toBeNull();
  });
  it("requiert le vrai tour de la même propriétaire et une preuve exacte", async () => {
    const sourceAutre = await journal(autre);
    expect((await appliquer(alice, sourceAutre.cle, 1)).error?.code).toBe("42501");
    expect((await autre.client.rpc("lire_recu_suivi", { p_cle_tour: sourceAutre.cle, p_message_source: "Message remplacé" })).error?.code).toBe("PT409");
    expect((await autre.client.rpc("lire_recu_suivi", { p_cle_tour: sourceAutre.cle, p_message_source: preuve })).data).toBeNull();
    source = await journal(alice);
    expect((await appliquer(alice, source.cle, 1, { ...commande, preuve: "Je me suis améliorée" })).error?.code).toBe("22023");
    expect((await appliquer(alice, source.cle, 1, { ...commande, etapes: [{ titre: "Pause", pratiqueId: "externe" }] })).error?.code).toBe("22023");
    expect((await appliquer(alice, source.cle, 1, { ...commande, reperes })).error?.code).toBe("22023");
    expect((await appliquer(alice, source.cle, 1, { ...commande, etapes: [] })).error?.code).toBe("22023");
    expect((await lire(alice)).data?.revision).toBe(1);
  });
  it("deux retries identiques n'appliquent qu'une mutation et une clé différente ne réécrit pas", async () => {
    const results = await Promise.all([appliquer(alice, source.cle, 1), appliquer(alice, source.cle, 1)]);
    for (const r of results) { expect(r.error).toBeNull(); expect(r.data).toBe(2); }
    const row = (await lire(alice)).data!;
    expect(row).toMatchObject({ revision: 2, reperes, cap: commande.cap, niveau_arbre: 0 });
    expect(row.etapes).toHaveLength(2); expect(row.etapes[0].id).not.toBe(row.etapes[1].id);
    expect((await appliquer(alice, source.cle, 1, { ...commande, cap: "Une autre direction" })).error?.code).toBe("PT409");
    const ledger = await alice.client.from("suivi_evenement").select("id,source_id,revision");
    expect(ledger.data).toHaveLength(1); expect(ledger.data?.[0].source_id).toBe(source.id);
    expect((await alice.client.from("suivi_evenement").select("empreinte")).error).not.toBeNull();
  });
  it("n'intègre que la première étape, sans toucher ses repères ni les branches", async () => {
    const row = (await lire(alice)).data!;
    const suivant = await journal(alice, "J'ai pris cette pause et elle m'a aidée");
    sourceAvance = suivant.cle;
    const avancer = { type: "avancer", etapeId: row.etapes[1].id, bilan: "Une pause vécue.", preuve: "J'ai pris cette pause" };
    expect((await appliquer(alice, suivant.cle, 2, avancer)).error?.code).toBe("PT409");
    avancer.etapeId = row.etapes[0].id;
    expect((await appliquer(alice, suivant.cle, 2, avancer)).error).toBeNull();
    expect((await appliquer(alice, suivant.cle, 2, avancer)).error).toBeNull();
    const apres = (await lire(alice)).data!;
    expect(apres).toMatchObject({ revision: 3, reperes, niveau_arbre: 1 });
    expect(apres.etapes).toEqual([row.etapes[1]]);
    expect((await alice.client.from("branche").select("id")).data).toEqual([]);
    const ledger = await alice.client.from("suivi_evenement").select("type,titre_etape,niveau_arbre").eq("type", "avancer");
    expect(ledger.data).toEqual([{ type: "avancer", titre_etape: row.etapes[0].titre, niveau_arbre: 1 }]);
  });
  it("récupère un reçu après retrait de l'étape, sans laisser forger le texte source", async () => {
    const args = { p_cle_tour: sourceAvance, p_message_source: "J'ai pris cette pause et elle m'a aidée" };
    expect((await alice.client.rpc("lire_recu_suivi", args)).data).toEqual({ type: "avancer" });
    expect((await autre.client.rpc("lire_recu_suivi", args)).data).toBeNull();
    expect((await alice.client.rpc("lire_recu_suivi", { ...args, p_message_source: "Une autre phrase" })).error?.code).toBe("PT409");
    expect((await alice.client.rpc("lire_recu_suivi", { p_cle_tour: crypto.randomUUID(), p_message_source: preuve })).data).toBeNull();
    expect((await nu().rpc("lire_recu_suivi", args)).error).not.toBeNull();
  });
  it("deux tours concurrents à la même révision ne s'écrasent pas", async () => {
    const s = await Promise.all([journal(alice), journal(alice)]);
    const r = await Promise.all(s.map((j) => appliquer(alice, j.cle, 3)));
    expect(r.filter((v) => !v.error)).toHaveLength(1);
    expect(r.find((v) => v.error)?.error?.code).toBe("PT409");
    expect((await lire(alice)).data?.revision).toBe(4);
  });
  it("pause empêche l'agent ; détresse empêche reprise et mutations mais pas correction ou pause", async () => {
    expect((await modifier(alice, 4, { action: "pause", pause: true })).error).toBeNull();
    const s = await journal(alice);
    expect((await appliquer(alice, s.cle, 5)).error?.code).toBe("42501");
    expect((await modifier(alice, 5, { action: "pause", pause: false })).error).toBeNull();
    await detresse(alice);
    expect((await appliquer(alice, s.cle, 6)).error?.code).toBe("42501");
    expect((await modifier(alice, 6, { action: "reperes", reperes: { ...reperes, aRespecter: "" } })).error).toBeNull();
    expect((await modifier(alice, 7, { action: "pause", pause: true })).error).toBeNull();
    expect((await modifier(alice, 8, { action: "pause", pause: false })).error?.code).toBe("42501");
    expect((await alice.client.rpc("lire_recu_suivi", { p_cle_tour: sourceAvance,
      p_message_source: "J'ai pris cette pause et elle m'a aidée" })).data).toEqual({ type: "avancer" });
  });
  it("exporte contexte et bilans sans les capacités techniques ni anciennes copies de documents", async () => {
    const { data, error } = await alice.client.rpc("exporter_mes_donnees");
    expect(error).toBeNull(); expect(data.suivi_anam).toHaveLength(1); expect(data.suivi_evenement).toHaveLength(3);
    expect(data.suivi_anam[0].reperes.aRespecter).toBe("");
    for (const e of data.suivi_evenement) {
      expect(e).not.toHaveProperty("cle_tour"); expect(e).not.toHaveProperty("empreinte");
      expect(e).not.toHaveProperty("reperes"); expect(e).not.toHaveProperty("synthese");
    }
    const autreExport = await autre.client.rpc("exporter_mes_donnees");
    expect(autreExport.data.suivi_anam).toEqual([]); expect(autreExport.data.suivi_evenement).toEqual([]);
  });
  it("refuse l'écriture après révocation, même pour un retry auparavant valide", async () => {
    const r = await admin.from("consentement").update({ revoked_at: new Date().toISOString() }).eq("utilisatrice_id", alice.id);
    expect(r.error).toBeNull();
    expect((await appliquer(alice, source.cle, 1)).error?.code).toBe("42501");
    expect((await modifier(alice, 8, { action: "reperes", reperes })).error?.code).toBe("42501");
    expect((await alice.client.rpc("lire_recu_suivi", { p_cle_tour: source.cle, p_message_source: preuve })).error?.code).toBe("42501");
  });
  it("refuse la majorité non établie et le consentement absent", async () => {
    for (const c of [await creer(false), await creer(true, false)]) {
      expect((await appliquer(c, crypto.randomUUID(), 0)).error?.code).toBe("42501");
      expect((await modifier(c, 0, { action: "pause", pause: true })).error?.code).toBe("42501");
    }
  });
  it("une confirmation brève crée un cap sans faire avancer l'arbre", async () => {
    const c = await creer(); const confirmation = await journal(c, "Oui");
    expect((await appliquer(c, confirmation.cle, 0, { ...commande, preuve: "Non" })).error?.code).toBe("22023");
    expect((await appliquer(c, confirmation.cle, 0, { ...commande, preuve: "Oui" })).error).toBeNull();
    const plan = (await lire(c)).data!;
    expect(plan).toMatchObject({ revision: 1, niveau_arbre: 0, cap: commande.cap });
    const court = await journal(c, "Oui");
    expect((await appliquer(c, court.cle, 1, { type: "avancer", etapeId: plan.etapes[0].id,
      bilan: "Une pause vécue.", preuve: "Oui" })).error?.code).toBe("22023");
    expect((await lire(c)).data).toMatchObject({ revision: 1, niveau_arbre: 0, etapes: plan.etapes });
  });
  it("respecte la fenêtre après un épisode clos puis rouvre la mutation à son expiration", async () => {
    const c = await creer();
    const s = await journal(c);
    const maintenant = Date.now();
    const episode = await admin.from("episode_detresse").insert({ utilisatrice_id: c.id, niveau_max: 1,
      debut: new Date(maintenant - 4 * 86400_000).toISOString(), fin: new Date(maintenant - 86400_000).toISOString(),
      fenetre_expire_at: new Date(maintenant + 2 * 86400_000).toISOString() }).select("id").single();
    expect(episode.error).toBeNull();
    expect((await appliquer(c, s.cle, 0)).error?.code).toBe("42501");
    expect((await modifier(c, 0, { action: "pause", pause: true })).error).toBeNull();
    expect((await modifier(c, 1, { action: "pause", pause: false })).error?.code).toBe("42501");
    const expire = await admin.from("episode_detresse").update({ fenetre_expire_at: new Date(maintenant - 1000).toISOString() }).eq("id", episode.data!.id);
    expect(expire.error).toBeNull();
    expect((await modifier(c, 1, { action: "pause", pause: false })).error).toBeNull();
    expect((await appliquer(c, s.cle, 2)).error).toBeNull();
  });
  it("part de l'illustration existante et plafonne à trente-quatre sans modifier les branches", async () => {
    const c = await creer(); const s = await journal(c);
    const b = await admin.from("branche").insert({ utilisatrice_id: c.id, extrait_source_id: s.id, nom: "Mon rythme" }).select("id,etat,intensite").single();
    expect(b.error).toBeNull();
    let revision = 0;
    for (let pas = 0; pas < 35; pas++) {
      const j = await journal(c);
      expect((await appliquer(c, j.cle, revision, { ...commande, etapes: [{ titre: "Un petit pas", pratiqueId: null }] })).error).toBeNull();
      revision++;
      const plan = (await lire(c)).data!;
      const retour = await journal(c);
      expect((await appliquer(c, retour.cle, revision, { type: "avancer", etapeId: plan.etapes[0].id,
        bilan: "Un pas partagé.", preuve })).error).toBeNull();
      revision++;
      expect((await lire(c)).data?.niveau_arbre).toBe(Math.min(34, pas + 2));
    }
    expect((await c.client.from("branche").select("id,etat,intensite").single()).data).toEqual(b.data);
  }, 20000);
  it("le moteur d'effacement supprime aussi les deux nouvelles tables", async () => {
    const { error } = await alice.client.rpc("effacer_toutes_mes_donnees", { p_fenetre_pitr_jours: 7 });
    expect(error).toBeNull();
    for (const table of ["suivi_anam", "suivi_evenement"]) {
      const r = await admin.from(table).select("utilisatrice_id").eq("utilisatrice_id", alice.id);
      expect(r.error).toBeNull(); expect(r.data).toEqual([]);
    }
  });
});
