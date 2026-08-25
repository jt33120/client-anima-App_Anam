import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CARTE_CHAMP_MAX } from "@/lib/domain/carte-contexte";

/**
 * carte-contexte-sql.test.ts — LA CARTE CONTRE LE VRAI POSTGRES (0079/0080).
 *
 * ══ POURQUOI CE FICHIER EXISTE ══════════════════════════════════════════════════════════════════
 *
 * `tests/carte-contexte.test.ts` LIT le SQL et vérifie que les deux contraintes y sont écrites.
 * `tests/compactage-carte.test.ts` garde le câblage. Aucun des deux n'avait jamais demandé à
 * Postgres de REFUSER quoi que ce soit — et le 2026-08-25, au moment d'appliquer la migration au
 * projet cloud, je m'en suis aperçu : la garde FR-031 la plus dure du produit reposait sur une
 * expression régulière qui cherchait un nom de contrainte dans un fichier texte.
 *
 * Une contrainte peut être écrite et ne pas mordre : un `~` au lieu d'un `!~`, un `coalesce` qui
 * rend la clause vraie sur `null`, une classe de caractères qui ne couvre pas ce qu'on croit. Rien
 * de tout ça ne se voit dans le texte. Ici, on écrit et on regarde ce que la base répond.
 */

const url = process.env.SUPABASE_URL!;
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY!;
const secret = process.env.SUPABASE_SECRET_KEY!;

const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
const clientNu = () => createClient(url, publishable, { auth: { autoRefreshToken: false, persistSession: false } });

const t = Date.now();
const MDP = "test-carte-123!";

let alice: string;
let sessionAlice: SupabaseClient;

/** Écrit la carte par la porte de la 0080. Rend l'erreur telle quelle — c'est elle qu'on mesure. */
function ecrire(cible: string, champs: Partial<Record<string, string | null>>, borne: string | null = null) {
  return admin.rpc("ecrire_carte_contexte", {
    cible,
    p_presentant: champs.presentant ?? null,
    p_precipitant: champs.precipitant ?? null,
    p_predisposant: champs.predisposant ?? null,
    p_perpetuant: champs.perpetuant ?? null,
    p_protecteur: champs.protecteur ?? null,
    p_compacte_jusqu_a: borne,
  });
}

async function relire(cible: string) {
  const { data, error } = await admin.rpc("charger_carte_contexte", { cible });
  if (error) throw new Error(`relire: ${error.message}`);
  return (data as Record<string, unknown>[])[0] ?? null;
}

beforeAll(async () => {
  if (!url || !publishable || !secret) throw new Error("Supabase local requis (URL / PUBLISHABLE / SECRET).");
  const email = `carte-a-${t}@exemple.fr`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: MDP, email_confirm: true });
  if (error) throw new Error(`createUser: ${error.message}`);
  alice = data.user!.id;
  sessionAlice = clientNu();
  const { error: e } = await sessionAlice.auth.signInWithPassword({ email, password: MDP });
  if (e) throw new Error(`signIn: ${e.message}`);
}, 60_000);

// ══════════════════════════════════════════════════════════════════════════════════════════════
// FR-031 — aucun chiffre, et c'est la BASE qui le tient
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[FR-031 · DUR] la contrainte de chiffres MORD, et pas seulement dans le texte du SQL", () => {
  it("[LE CŒUR] un chiffre est REFUSÉ par Postgres, quel que soit le champ", async () => {
    // Le filtre TypeScript (`analyserCompactage`) existe aussi, mais c'est celui-ci qui décide :
    // c'est le seul que personne ne peut contourner — ni un modèle, ni une route, ni moi.
    for (const champ of ["presentant", "precipitant", "predisposant", "perpetuant", "protecteur"]) {
      const { error } = await ecrire(alice, { [champ]: "elle en a parlé 3 fois" });
      expect(error, `un chiffre est passé dans « ${champ} »`).not.toBeNull();
      expect(error!.message).toMatch(/carte_contexte_sans_chiffre|check/i);
    }
  });

  it("les mots-nombres PASSENT — la contrainte tient ce qu’un contrôle peut tenir sans se mentir", async () => {
    // Contrôle NÉGATIF, et il compte : sans lui, une contrainte qui refuserait TOUT passerait le
    // test ci-dessus. C'est aussi ce que dit l'encadré de 0079 — les mots restent à la consigne.
    const { error } = await ecrire(alice, { presentant: "elle en a parlé trois fois" });
    expect(error, error?.message).toBeNull();
  });

  it("une carte entièrement vide est acceptée — c’est l’état d’un premier passage", async () => {
    const { error } = await ecrire(alice, {});
    expect(error, "la contrainte mord sur des `null` — `coalesce` a sauté").toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LA LONGUEUR — une garde de COMPORTEMENT, et sa parité avec le TypeScript
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("la borne de longueur mord au bon caractère", () => {
  it(`${CARTE_CHAMP_MAX} caractères passent, ${CARTE_CHAMP_MAX + 1} sont refusés`, async () => {
    // La parité TS/SQL est déjà gardée statiquement ; ici on prouve que la valeur SQL est celle qui
    // s'applique vraiment, et qu'elle mord à un caractère près (jamais deux, jamais zéro).
    const juste = await ecrire(alice, { protecteur: "a".repeat(CARTE_CHAMP_MAX) });
    expect(juste.error, juste.error?.message).toBeNull();
    const trop = await ecrire(alice, { protecteur: "a".repeat(CARTE_CHAMP_MAX + 1) });
    expect(trop.error, "un champ trop long est passé : le modèle va réciter").not.toBeNull();
    expect(trop.error!.message).toMatch(/carte_contexte_champs_bornes|check/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// L'UPSERT — et la borne qui ne recule jamais
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("l’écriture est un upsert, et la borne n’est pas réversible", () => {
  it("les cinq champs sont bien remplacés au second passage", async () => {
    await ecrire(alice, { presentant: "le travail", perpetuant: "elle dit oui avant d’y penser" });
    const l = await relire(alice);
    expect(l?.presentant).toBe("le travail");
    expect(l?.perpetuant).toBe("elle dit oui avant d’y penser");
  });

  it("[LE CŒUR] une borne ANTÉRIEURE ne fait pas reculer celle qui est écrite (`greatest`)", async () => {
    // Sans ça, deux `after()` concurrents — ou un rejeu tardif — feraient recompacter du verbatim
    // déjà résumé : un coût qui se répète sans rien produire, et rien pour le dire.
    await ecrire(alice, { presentant: "le travail" }, "2026-08-25T12:00:00Z");
    await ecrire(alice, { presentant: "le travail" }, "2026-08-01T00:00:00Z");
    const l = await relire(alice);
    expect(new Date(String(l?.compacte_jusqu_a)).toISOString()).toBe("2026-08-25T12:00:00.000Z");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// « INVISIBLE PARTOUT » — mesuré sur une VRAIE session, pas seulement sur un client anonyme
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[décision produit du 2026-08-25] personne ne peut la lire, session comprise", () => {
  it("[LE CŒUR] une utilisatrice CONNECTÉE ne peut pas lire la table", async () => {
    // ⚠️ SUR UNE VRAIE SESSION, ET PAS SUR `anon`. `authenticated` détient les sept privilèges DML
    // sur toutes les tables de ce schéma — c'est la doctrine du dépôt. Éprouver la fermeture sur un
    // client anonyme ne prouverait donc RIEN : c'est le rôle connecté qui est le rôle dangereux.
    const { error } = await sessionAlice.from("carte_contexte").select("*");
    expect(error, "une session peut lire la carte : elle n’est plus invisible").not.toBeNull();
  });

  it("[LE CŒUR] elle ne peut exécuter NI l’une NI l’autre des deux portes", async () => {
    const lecture = await sessionAlice.rpc("charger_carte_contexte", { cible: alice });
    expect(lecture.error, "la porte de lecture est ouverte à `authenticated`").not.toBeNull();
    const ecriture = await sessionAlice.rpc("ecrire_carte_contexte", {
      cible: alice, p_presentant: "forgé", p_precipitant: null, p_predisposant: null,
      p_perpetuant: null, p_protecteur: null, p_compacte_jusqu_a: null,
    });
    expect(ecriture.error, "la porte d’écriture est ouverte à `authenticated`").not.toBeNull();
  });

  it("elle ne peut pas non plus l’écrire directement (aucun grant, aucune policy)", async () => {
    const { error } = await sessionAlice.from("carte_contexte").insert({ utilisatrice_id: alice });
    expect(error).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LA CASCADE — la correction du 2026-08-25, mesurée pour de vrai
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[FR-067 · AD-14] la carte part avec la personne", () => {
  it("[LE CŒUR] effacer l’utilisatrice emporte sa carte", async () => {
    // La clé pendait à `auth.users` avant la revue de CI ; elle pend maintenant à
    // `public.utilisatrice`, comme les trente autres tables. Ce test mesure la cascade PAR SA
    // RACINE : on retire la ligne `utilisatrice`, et la carte doit disparaître d'elle-même — sans
    // que personne n'ait à penser à la supprimer.
    const email = `carte-b-${t}@exemple.fr`;
    const { data, error } = await admin.auth.admin.createUser({ email, password: MDP, email_confirm: true });
    expect(error).toBeNull();
    const bob = data!.user!.id;
    await ecrire(bob, { presentant: "quelque chose" });
    expect(await relire(bob), "le semis n’a rien écrit : le test ne prouverait rien").not.toBeNull();

    const { error: eSuppr } = await admin.from("utilisatrice").delete().eq("id", bob);
    expect(eSuppr, eSuppr?.message).toBeNull();
    expect(await relire(bob), "la carte a survécu à l’effacement de sa propriétaire").toBeNull();
  });
});
