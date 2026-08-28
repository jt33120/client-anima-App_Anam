import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const maybeSingle = vi.fn();
const rpc = vi.fn(() => ({ maybeSingle }));
vi.mock("@/lib/data/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

const {
  ErreurDepotOuvertureQuotidienne,
  commencerOuvertureQuotidienne,
  finaliserOuvertureQuotidienne,
} = await import("@/lib/data/depot-ouverture-quotidienne");

const VIDE = {
  entree_id: null,
  entree_contenu: null,
  entree_creee_le: null,
  evenement_public: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockImplementation(() => ({ maybeSingle }));
  maybeSingle.mockResolvedValue({
    data: {
      statut: "a_preparer",
      jeton: "22222222-2222-4222-8222-222222222222",
      ...VIDE,
    },
    error: null,
  });
});

describe("[ouverture quotidienne] le dépôt parse toute la source de vérité persistée", () => {
  it("obtient le bail sans transmettre de phrase ni d'identité navigateur", async () => {
    await expect(
      commencerOuvertureQuotidienne(
        "11111111-1111-4111-8111-111111111111",
        "2026-08-26",
      ),
    ).resolves.toEqual({
      statut: "a-preparer",
      jeton: "22222222-2222-4222-8222-222222222222",
    });
    expect(rpc).toHaveBeenCalledWith("commencer_ouverture_quotidienne_anam", {
      cible: "11111111-1111-4111-8111-111111111111",
      p_jour: "2026-08-26",
    });
  });

  it("distingue un bail concurrent d'un jour déjà commencé et restitue son événement", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { statut: "en_cours", jeton: null, ...VIDE },
      error: null,
    });
    await expect(commencerOuvertureQuotidienne("u", "2026-08-26")).resolves.toEqual({
      statut: "en-cours",
    });

    const evenement = {
      type: "invitation",
      phrase: "Te voilà — veux-tu reprendre ce fil ?",
      brancheCibleId: "44444444-4444-4444-8444-444444444444",
    };
    maybeSingle.mockResolvedValueOnce({
      data: {
        statut: "deja_commencee",
        jeton: null,
        entree_id: "33333333-3333-4333-8333-333333333333",
        entree_contenu: evenement.phrase,
        entree_creee_le: "2026-08-26T08:00:00Z",
        evenement_public: evenement,
      },
      error: null,
    });
    await expect(commencerOuvertureQuotidienne("u", "2026-08-26")).resolves.toEqual({
      statut: "deja-commencee",
      ligne: {
        id: "33333333-3333-4333-8333-333333333333",
        contenu: evenement.phrase,
        creeLe: "2026-08-26T08:00:00Z",
        evenement,
      },
    });
  });

  it("rend une ligne nulle quand un tour ordinaire avait déjà ouvert le fil", async () => {
    maybeSingle.mockResolvedValue({
      data: { statut: "deja_commencee", jeton: null, ...VIDE },
      error: null,
    });
    await expect(commencerOuvertureQuotidienne("u", "2026-08-26")).resolves.toEqual({
      statut: "deja-commencee",
      ligne: null,
    });
  });

  it("finalise la préparation et rend ligne et métadonnée publique", async () => {
    const publicPrepare = { type: "pause", phrase: "Te voilà — tu peux laisser reposer." };
    const interne = { type: "pause", seances: 6, minutes: 30, apaisementJours: 30 };
    maybeSingle.mockResolvedValue({
      data: {
        entree_id: "33333333-3333-4333-8333-333333333333",
        entree_contenu: publicPrepare.phrase,
        entree_creee_le: "2026-08-26T08:00:00Z",
        evenement_public: publicPrepare,
      },
      error: null,
    });

    await expect(
      finaliserOuvertureQuotidienne(
        "11111111-1111-4111-8111-111111111111",
        "2026-08-26",
        "22222222-2222-4222-8222-222222222222",
        "Te voilà. Qu’est-ce qui t’occupe ?",
        { public: publicPrepare, interne },
      ),
    ).resolves.toEqual({
      id: "33333333-3333-4333-8333-333333333333",
      contenu: publicPrepare.phrase,
      creeLe: "2026-08-26T08:00:00Z",
      evenement: publicPrepare,
    });
    expect(rpc).toHaveBeenCalledWith("finaliser_ouverture_quotidienne_anam", {
      cible: "11111111-1111-4111-8111-111111111111",
      p_jour: "2026-08-26",
      p_jeton: "22222222-2222-4222-8222-222222222222",
      p_phrase_generique: "Te voilà. Qu’est-ce qui t’occupe ?",
      p_preparation: { public: publicPrepare, interne },
    });
  });

  it("refuse les réponses partielles, dates illisibles et événements non-objets", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        statut: "deja_commencee",
        jeton: null,
        entree_id: "33333333-3333-4333-8333-333333333333",
        entree_contenu: "Bonjour",
        entree_creee_le: null,
        evenement_public: null,
      },
      error: null,
    });
    await expect(commencerOuvertureQuotidienne("u", "2026-08-26")).rejects.toThrow(
      /reponse_invalide/,
    );

    maybeSingle.mockResolvedValueOnce({
      data: {
        entree_id: "33333333-3333-4333-8333-333333333333",
        entree_contenu: "Bonjour",
        entree_creee_le: "pas-une-date",
        evenement_public: "pause",
      },
      error: null,
    });
    await expect(
      finaliserOuvertureQuotidienne("u", "2026-08-26", "j", "Bonjour", {
        public: null,
        interne: null,
      }),
    ).rejects.toThrow(/reponse_invalide/);
  });

  it("ne recopie jamais le contenu sensible dans une erreur technique", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { code: "42501" } });
    await expect(
      finaliserOuvertureQuotidienne("u", "2026-08-26", "j", "un secret", {
        public: null,
        interne: null,
      }),
    ).rejects.not.toThrow(/secret/);
  });

  it("distingue une RPC absente d'un incident temporaire sans reprendre le message distant", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST202", message: "fonction absente avec donnée sensible" },
    });
    await expect(commencerOuvertureQuotidienne("u", "2026-08-26")).rejects.toMatchObject({
      name: "ErreurDepotOuvertureQuotidienne",
      causeOuverture: "schema-incompatible",
    });

    maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "08006", message: "connexion rompue avec donnée sensible" },
    });
    const incident = commencerOuvertureQuotidienne("u", "2026-08-26").catch((erreur) => erreur);
    await expect(incident).resolves.toBeInstanceOf(ErreurDepotOuvertureQuotidienne);
    await expect(incident).resolves.toMatchObject({ causeOuverture: "incident-temporaire" });
    await expect(incident).resolves.not.toMatchObject({ message: expect.stringMatching(/sensible/) });
  });
});

describe("[SQL statique — aucune instance PostgreSQL n'est exercée] outbox quotidienne", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/0084_reclamer_ouverture_quotidienne_anam.sql"),
    "utf8",
  );

  function corps(nom: string): string {
    const debut = sql.indexOf(`function public.${nom}`);
    expect(debut, `${nom} doit exister`).toBeGreaterThanOrEqual(0);
    const fin = sql.indexOf("\n$$;", debut);
    expect(fin, `${nom} doit être délimité`).toBeGreaterThan(debut);
    return sql.slice(debut, fin);
  }

  it("le trigger refuse réellement tout tour ordinaire pendant le bail actif", () => {
    const trigger = corps("verrouiller_entree_journal_jour");
    expect(trigger).toMatch(/language plpgsql\s+security definer\s+set search_path = ''/);
    expect(trigger).toMatch(/registre\.nature = 'preparation'/);
    expect(trigger).toMatch(/registre\.preparee_jusqu_a > clock_timestamp\(\)/);
    expect(trigger).toMatch(/current_setting\('anima\.ouverture_jeton', true\)/);
    expect(trigger).toMatch(/est_finaliseur := coalesce\([\s\S]*new\.role = 'anam'[\s\S]*false\s*\)/);
    expect(trigger).toMatch(/new\.cle_tour = 'ouverture-jour:'/);
    expect(trigger).toMatch(/message = 'ouverture_quotidienne_en_preparation'/);
    expect(trigger).toMatch(
      /preparee_jusqu_a <= clock_timestamp\(\)[\s\S]*nature = 'fil_existant'[\s\S]*jeton_preparation = null/,
    );
    expect(trigger).toMatch(/message = 'ouverture_quotidienne_bail_expire'/);
    expect(sql).toMatch(
      /revoke execute on function public\.verrouiller_entree_journal_jour\(\)\s+from public, anon, authenticated;/,
    );
  });

  it("après expiration, commencer relit l'ouverture puis tout tour du jour avant le takeover", () => {
    const commencer = corps("commencer_ouverture_quotidienne_anam");
    const expiration = commencer.indexOf("registre.preparee_jusqu_a > clock_timestamp()");
    const ouvertureExistante = commencer.indexOf("select * into ancienne", expiration);
    const tourDuJour = commencer.indexOf("if exists (", ouvertureExistante);
    const takeover = commencer.indexOf("nouveau_jeton := gen_random_uuid()", tourDuJour);
    expect(expiration).toBeGreaterThanOrEqual(0);
    expect(ouvertureExistante).toBeGreaterThan(expiration);
    expect(tourDuJour).toBeGreaterThan(ouvertureExistante);
    expect(takeover).toBeGreaterThan(tourDuJour);
    expect(commencer.slice(tourDuJour, takeover)).toMatch(/nature = 'fil_existant'/);
  });

  it("réserve pause ou invitation avant l'INSERT, dans le seul corps du finaliseur", () => {
    const finaliser = corps("finaliser_ouverture_quotidienne_anam");
    const pause = finaliser.indexOf("select public.reserver_pause_rythme(");
    const invitation = finaliser.indexOf("select public.reserver_invitation_integration(");
    const insertion = finaliser.indexOf("insert into public.entree_journal");
    expect(pause).toBeGreaterThanOrEqual(0);
    expect(invitation).toBeGreaterThanOrEqual(0);
    expect(pause).toBeLessThan(insertion);
    expect(invitation).toBeLessThan(insertion);
    expect(finaliser.indexOf("fil deja commence")).toBeLessThan(pause);
    expect(sql.match(/select public\.reserver_pause_rythme\(/g)).toHaveLength(1);
    expect(sql.match(/select public\.reserver_invitation_integration\(/g)).toHaveLength(1);
    expect(finaliser).toMatch(/if reservation_ok then[\s\S]*evenement_final := public_prepare/);
    expect(finaliser).toMatch(/contenu_final := p_phrase_generique/);
  });

  it("revalide et verrouille chaque événement métier avant de le rendre interactif", () => {
    const finaliser = corps("finaliser_ouverture_quotidienne_anam");
    const insertion = finaliser.indexOf("insert into public.entree_journal");
    for (const preuve of [
      "public.annonce_socle_due()",
      "public.charger_hypothese_a_dire()",
      "public.charger_proposition_branche()",
      "for share of h",
      "for share of s",
      "for share of a",
      "for share of b",
    ]) {
      expect(finaliser.indexOf(preuve), preuve).toBeGreaterThanOrEqual(0);
      expect(finaliser.indexOf(preuve), `${preuve} doit précéder le journal`).toBeLessThan(insertion);
    }
    expect(finaliser).toMatch(/branches_naissance >= n_seuil::integer/);
    expect(finaliser).toMatch(/branche_cible is not distinct from/);
    expect(finaliser).toMatch(/premium_ok := found/);
    expect(finaliser).toMatch(/reservation_ok := false;[\s\S]*revalidation ouverture refusee/);
  });

  it("évalue les échéances après les verrous avec l'horloge murale, sans dériver le jour civil", () => {
    const trigger = corps("verrouiller_entree_journal_jour");
    const commencer = corps("commencer_ouverture_quotidienne_anam");
    const finaliser = corps("finaliser_ouverture_quotidienne_anam");
    expect(trigger).toMatch(/jour_ecriture := \(statement_timestamp\(\) at time zone 'Europe\/Paris'\)::date/);
    expect(trigger).toMatch(/preparee_jusqu_a > clock_timestamp\(\)/);
    expect(trigger).toMatch(/preparee_jusqu_a <= clock_timestamp\(\)/);
    expect(commencer).toMatch(/preparee_jusqu_a = clock_timestamp\(\) \+ interval '15 seconds'/);
    expect(finaliser).toMatch(/preparee_jusqu_a <= clock_timestamp\(\)/);
  });

  it("verrouille consentement et minorité avant réservation et journal", () => {
    const gate = corps("compte_autorise_ouverture_anam");
    expect(gate).toMatch(/art9_accorde = true/);
    expect(gate).toMatch(/ia_reconnue = true/);
    expect(gate).toMatch(/cgu_acceptees = true/);
    expect(gate).toMatch(/revoked_at is null/);
    expect(gate).toMatch(/mineur_detecte = false/);
    expect(gate).toMatch(/barriere_minorite_le is null/);
    expect(gate).toMatch(/for share of u, c/);

    const finaliser = corps("finaliser_ouverture_quotidienne_anam");
    const verrou = finaliser.indexOf("compte_autorise_ouverture_anam(cible)");
    expect(verrou).toBeLessThan(finaliser.indexOf("select public.reserver_pause_rythme("));
    expect(verrou).toBeLessThan(finaliser.indexOf("insert into public.entree_journal"));
  });

  it("durcit aussi les appels directs aux deux RPC de réservation sans changer leur source métier", () => {
    const pause = corps("reserver_pause_rythme");
    const invitation = corps("reserver_invitation_integration");
    expect(pause).toMatch(/compte_autorise_ouverture_anam\(v_uid\)/);
    expect(pause.indexOf("branche_bloquee_par_detresse()")).toBeLessThan(
      pause.indexOf("insert into public.pause_rythme"),
    );
    expect(invitation).toMatch(/compte_autorise_ouverture_anam\(v_uid\)/);
    expect(invitation).toMatch(/make_interval\(hours => p_fenetre_heures \* 4\)/);
  });

  it("valide strictement les deux moitiés JSON et ne persiste que la partie publique", () => {
    const finaliser = corps("finaliser_ouverture_quotidienne_anam");
    expect(finaliser).toMatch(/p_preparation \?& array\['public', 'interne'\]/);
    expect(finaliser).toMatch(/type_public in \('pause', 'socle-complete'\)/);
    expect(finaliser).toMatch(/type_public = 'invitation'/);
    expect(finaliser).toMatch(/type_public = 'proposition'/);
    expect(finaliser).toMatch(/type_public = 'hypothese-enneagramme'/);
    expect(finaliser).toMatch(/reservation sans evenement/);
    expect(sql).toMatch(/evenement_public jsonb/);
    expect(sql).not.toMatch(/set[\s\S]{0,80}interne_prepare/);
    expect(finaliser).toMatch(/evenement_public = evenement_final/);
  });

  it("restitue ligne et métadonnée aux retries comme au finaliseur", () => {
    const commencer = corps("commencer_ouverture_quotidienne_anam");
    const finaliser = corps("finaliser_ouverture_quotidienne_anam");
    expect(commencer).toContain("ancienne.id");
    expect(commencer).toContain("ancienne.contenu");
    expect(commencer).toContain("ancienne.cree_le");
    expect(commencer).toContain("registre.evenement_public");
    expect(finaliser).toMatch(/return query select ligne\.id, ligne\.contenu, ligne\.cree_le, evenement_final/);
  });

  it("la phase de commencement et l'outbox restent service-role only", () => {
    expect(sql).toMatch(
      /revoke all on function public\.commencer_ouverture_quotidienne_anam\(uuid, date\)[\s\S]*from public, anon, authenticated;[\s\S]*grant execute[\s\S]*to service_role;/,
    );
    expect(sql).toMatch(
      /revoke all on function public\.finaliser_ouverture_quotidienne_anam\(uuid, date, uuid, text, jsonb\)[\s\S]*from public, anon, authenticated;[\s\S]*grant execute[\s\S]*to service_role;/,
    );
    expect(sql).toMatch(
      /revoke all on function public\.compte_autorise_ouverture_anam\(uuid\)[\s\S]*from public, anon, authenticated, service_role;/,
    );
  });

  it("conserve l'ancienne signature comme pont expand/app pendant le déploiement", () => {
    const compatibilite = corps("consigner_ouverture_quotidienne_anam");
    expect(compatibilite).toMatch(/commencer_ouverture_quotidienne_anam\(cible, p_jour\)/);
    expect(compatibilite).toMatch(/finaliser_ouverture_quotidienne_anam\(/);
    expect(compatibilite).toMatch(/jsonb_build_object\('public', null, 'interne', null\)/);
    expect(sql).toMatch(
      /grant execute on function public\.consigner_ouverture_quotidienne_anam\(uuid, date, text\)\s+to service_role;/,
    );
  });
});

describe("[câblage statique] identité et horloge serveur restent cohérentes", () => {
  const page = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
  const action = readFileSync(
    resolve(process.cwd(), "app/_ouverture/reclamer-ouverture.ts"),
    "utf8",
  );

  it("la page ne sélectionne rien au rendu caché", () => {
    expect(page).toMatch(/onReclamerOuvertureQuotidienne=\{reclamerOuvertureDuJour\}/);
    expect(page).toMatch(/onChargerOuvertureCourante=\{chargerOuvertureCourante\}/);
    expect(page.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")).not.toMatch(/chargerOuverture\(/);
  });

  it("l'action sans argument réaffirme l'onboarding avant toute lecture art. 9", () => {
    expect(action).toMatch(/function reclamerOuvertureDuJour\(\)/);
    expect(action).toMatch(/function chargerOuvertureCourante\(\)/);
    expect(action).toMatch(/auth\.getUser\(\)/);
    expect(action.indexOf("etapeOnboardingPour")).toBeLessThan(action.indexOf("lirePrenom"));
    expect(action).not.toMatch(/utilisatriceId\s*:/);
  });

  it("calcule jour et deux réarmements depuis le même instant serveur", () => {
    const helperDebut = action.indexOf("function rearmementDepuisServeur");
    const helperFin = action.indexOf("\n}", helperDebut);
    const helper = action
      .slice(helperDebut, helperFin)
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(helper).not.toMatch(/new Date\(\)/);
    expect(action.match(/rearmementDepuisServeur\(maintenant\)/g)).toHaveLength(2);
  });
});
