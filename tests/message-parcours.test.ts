import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { EvenementIa } from "@/lib/ai/port";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), securite: vi.fn(), egress: vi.fn(), journal: vi.fn(), consignerAnam: vi.fn(),
  metrer: vi.fn(), lireSuivi: vi.fn(), lireRecu: vi.fn(), appliquerSuivi: vi.fn(), retourTheme: vi.fn(), lecture: vi.fn(), after: [] as Array<() => Promise<void>>,
}));
vi.mock("next/server", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/server")>(), after: (travail: () => Promise<void>) => mocks.after.push(travail),
}));
vi.mock("@/lib/data/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: mocks.user } }) }));
vi.mock("@/lib/ai/fabrique", () => ({ creerAiPort: async () => ({ estZdrProuve: () => true }) }));
vi.mock("@/lib/ai/modele-faible-test", () => ({ autorisationModeleFaibleTest: () => "desactivee" }));
vi.mock("@/lib/safety/pipeline", () => ({ evaluerSecuriteDuTour: mocks.securite }));
vi.mock("@/lib/safety/depot-episode", () => ({ creerDepotEpisode: () => ({}) }));
vi.mock("@/lib/ai/egress-guard", () => ({ diffuserSousEgressArt9: mocks.egress, envoyerSousEgressArt9: vi.fn() }));
vi.mock("@/lib/data/depot-journal", () => ({ creerDepotJournal: () => ({ consigner: mocks.journal }) }));
vi.mock("@/lib/data/depot-tour-anam", () => ({ consignerTourAnam: mocks.consignerAnam }));
vi.mock("@/lib/data/depot-seance", () => ({ creerDepotSeance: () => ({ charger: async () => null }) }));
vi.mock("@/lib/data/lire-abonnement", () => ({ estPremiumCourante: async () => true }));
vi.mock("@/lib/data/depot-lecture", () => ({ lectureEnAttente: mocks.lecture }));
vi.mock("@/lib/data/lire-contexte-anam", () => ({ lireContexteAnam: async () => null }));
vi.mock("@/lib/safety/retour-theme-pipeline", () => ({ evaluerRetourThemeDuTour: mocks.retourTheme }));
vi.mock("@/lib/data/depot-carte", () => ({ creerDepotCarte: () => ({ charger: async () => (await import("@/lib/domain/depot-carte")).CARTE_ABSENTE }) }));
vi.mock("@/lib/ai/metrage", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/ai/metrage")>(), metrerUsageIa: mocks.metrer,
}));

vi.mock("@/lib/data/depot-suivi-anam", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/data/depot-suivi-anam")>(),
  lireSuiviAnam: mocks.lireSuivi, appliquerOutilSuiviAnam: mocks.appliquerSuivi,
  lireRecuSuiviAnam: mocks.lireRecu,
}));
import { ErreurSuiviAnam } from "@/lib/data/depot-suivi-anam";
import type { SuiviAnam } from "@/lib/domain/suivi-anam";
import { POST } from "@/app/api/anam/message/route";

const request = (extra: Record<string, unknown> = {}) => new NextRequest("http://localhost/api/anam/message", {
  method: "POST", headers: { "Content-Type": "application/json", "X-Anam-Compte": "utilisatrice-test" },
  body: JSON.stringify({ messages: [{ role: "user", content: "Un exercice court, s’il te plaît." }], jetonTour: "11111111-2222-4333-8444-555555555555", ...extra }),
});
function verdict(niveau: 0 | 1 | 2 | 3 = 0, limitesLevees = false) {
  return {
    bloque: false, limitesLevees, usageDetection: null,
    verdict: { niveau, decision: (["poursuivre", "soutenir", "intervenir", "urgence"] as const)[niveau], supprimerTravailSchema: niveau > 0 },
  };
}
function configurerFlux(args: unknown = '{"pratiqueId":"respiration-douce"}', texte = "") {
  mocks.egress.mockImplementation(async () => ({
    bloque: false,
    flux: (async function* (): AsyncIterable<EvenementIa> {
      if (texte) yield { type: "delta", texte };
      yield {
        type: "fin", tier: "leger", modele: "modele-test", usage: { tokensEntree: 127, tokensSortie: 29 },
        appelsOutils: [{ nom: "proposer_pratique", arguments: args }],
      };
    })(),
  }));
}
beforeEach(() => {
  vi.stubEnv("SUPABASE_SECRET_KEY", "server-test-key-never-shipped");
  vi.clearAllMocks();
  mocks.after.length = 0;
  mocks.lecture.mockResolvedValue(null);
  mocks.user.mockResolvedValue({ data: { user: { id: "utilisatrice-test" } } });
  mocks.securite.mockResolvedValue(verdict());
  mocks.journal.mockResolvedValue(undefined);
  mocks.consignerAnam.mockResolvedValue(undefined);
  mocks.lireSuivi.mockResolvedValue(suivi);
  mocks.lireRecu.mockResolvedValue(null);
  mocks.retourTheme.mockResolvedValue({ usage: null });
  mocks.appliquerSuivi.mockResolvedValue({ ...suivi, revision: 5 });
  configurerFlux();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

const idEtape = "11111111-1111-4111-8111-111111111111";
const suivi: SuiviAnam = {
  revision: 4, pause: false, cap: "Faire une place au calme", synthese: "Prendre le temps d’observer.",
  reperes: { ceQuiCompte: "Des soirées paisibles", ceQuiAide: "Sortir", aRespecter: "Pas de rappel" },
  etapes: [{ id: idEtape, titre: "Observer un moment calme", pratiqueId: null }],
  niveauArbre: 0, majLe: "2026-09-08T08:00:00Z", evenements: [],
};
const message = "Hier, j’ai observé le ciel et pris un moment calme pour moi.";
const avancer = { etapeId: idEtape, bilan: "Un moment dehors a trouvé sa place.", preuve: "j’ai observé le ciel" };
const ajuster = { cap: "Faire une place au calme", synthese: "Chercher un moment accessible.",
  etapes: [{ titre: "Observer le ciel quelques instants", pratiqueId: null }], preuve: "j’ai observé le ciel" };
function outil(nom = "avancer_parcours", args: unknown = avancer, texte = "") {
  mocks.egress.mockResolvedValue({ bloque: false, flux: (async function* (): AsyncIterable<EvenementIa> {
    if (texte) yield { type: "delta", texte };
    yield { type: "fin", tier: "leger", modele: "modele-test", usage: { tokensEntree: 100, tokensSortie: 30 },
      appelsOutils: [{ nom, arguments: JSON.stringify(args) }] };
  })() });
}
async function tour() {
  const response = await POST(request({ messages: [{ role: "user", content: message }] }));
  return (await response.text()).trim().split("\n").map((s) => JSON.parse(s));
}

describe("outil de parcours dans le vrai chemin message", () => {
  it("refuse un onglet resté sur un autre compte avant journal ou egress", async () => {
    const req = request();
    req.headers.set("X-Anam-Compte", "ancien-compte");
    const response = await POST(req);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "session_modifiee" });
    expect(mocks.journal).not.toHaveBeenCalled();
    expect(mocks.securite).not.toHaveBeenCalled();
    expect(mocks.egress).not.toHaveBeenCalled();
  });

  it("garde le chat ancien compatible sans lui confier de mutation de parcours", async () => {
    const req = request();
    req.headers.delete("X-Anam-Compte");
    await (await POST(req)).text();
    expect(mocks.egress.mock.calls[0][0].requete.outils.map((o: { nom: string }) => o.nom)).toEqual(["proposer_pratique"]);
  });

  it.each(["filtre", "sans_fin", "inconnu"])("écarte le faux succès d’un appel natif %s", async (cause) => {
    mocks.egress.mockResolvedValue({ bloque: false, flux: (async function* (): AsyncIterable<EvenementIa> {
      yield { type: "delta", texte: "Ton cap est enregistré et ton arbre a grandi." };
      yield { type: "outil_delta", caracteres: 5000 };
      if (cause !== "sans_fin") yield { type: "fin", tier: "leger", modele: "modele-test", usage: { tokensEntree: 1, tokensSortie: 1 },
        ...(cause === "inconnu" ? { appelsOutils: [{ nom: "outil_invente", arguments: "{}" }] } : {}) };
    })() });
    const trames = await tour();
    expect(JSON.stringify(trames)).not.toContain("Ton cap est enregistré");
    expect(JSON.stringify(trames)).toContain("Je n’ai pas modifié ton parcours");
    expect(mocks.appliquerSuivi).not.toHaveBeenCalled();
    expect(trames.some((t) => t.t === "parcours")).toBe(false);
  });

  it("une pratique valide ne libère pas la prose d’un second outil filtré", async () => {
    mocks.egress.mockResolvedValue({ bloque: false, flux: (async function* (): AsyncIterable<EvenementIa> {
      yield { type: "delta", texte: "Ton parcours est enregistré et ton arbre a grandi." };
      yield { type: "outil_delta", caracteres: 9000 };
      yield { type: "fin", tier: "leger", modele: "modele-test", usage: { tokensEntree: 1, tokensSortie: 1 },
        appelsOutils: [{ nom: "proposer_pratique", arguments: '{"pratiqueId":"respiration-douce"}' }] };
    })() });
    const trames = await tour();
    expect(trames).toContainEqual({ t: "pratique", pratiqueId: "respiration-douce" });
    expect(JSON.stringify(trames)).not.toContain("Ton parcours est enregistré");
    expect(mocks.appliquerSuivi).not.toHaveBeenCalled();
  });

  it("retrouve un reçu après commit, même si le pas est déjà retiré et le parcours en pause", async () => {
    mocks.lireRecu.mockResolvedValue({ type: "avancer" });
    mocks.lireSuivi.mockResolvedValue({ ...suivi, revision: 6, pause: true, etapes: [] });
    const trames = await tour();
    expect(trames).toContainEqual({ t: "parcours", action: "avancer" });
    expect(mocks.egress).not.toHaveBeenCalled();
    expect(mocks.appliquerSuivi).not.toHaveBeenCalled();
    expect(mocks.lireRecu).toHaveBeenCalledWith(expect.anything(), "11111111-2222-4333-8444-555555555555", message);
    expect(mocks.after).toHaveLength(0);
    expect(mocks.lecture).not.toHaveBeenCalled();
    expect(mocks.retourTheme).not.toHaveBeenCalled();
  });

  it("une ancienne clé avec un autre texte ne génère ni outil ni réponse fournisseur", async () => {
    mocks.lireRecu.mockRejectedValue(new ErreurSuiviAnam("conflit"));
    expect(JSON.stringify(await tour())).toContain("nouveau message");
    expect(mocks.egress).not.toHaveBeenCalled();
    expect(mocks.appliquerSuivi).not.toHaveBeenCalled();
  });

  it("la lecture du reçu indisponible ferme seulement les outils de suivi", async () => {
    mocks.lireRecu.mockRejectedValue(new ErreurSuiviAnam("indisponible"));
    outil();
    expect((await tour()).some((t) => t.t === "parcours")).toBe(false);
    expect(mocks.appliquerSuivi).not.toHaveBeenCalled();
    expect(mocks.egress.mock.calls[0][0].requete.outils.map((o: { nom: string }) => o.nom)).toEqual(["proposer_pratique"]);
    await mocks.after[1]!();
    expect(mocks.retourTheme).not.toHaveBeenCalled();
  });

  it.each([true, false])("un passage tenté exclut la seconde croissance, y compris si confirmation=%s", async (confirme) => {
    outil();
    if (!confirme) mocks.appliquerSuivi.mockRejectedValue(new ErreurSuiviAnam("indisponible"));
    await tour();
    await mocks.after[1]!();
    expect(mocks.retourTheme).not.toHaveBeenCalled();
  });

  it("le retour sur un thème reste actif sans tentative de passage", async () => {
    configurerFlux();
    await tour();
    await mocks.after[1]!();
    expect(mocks.retourTheme).toHaveBeenCalledTimes(1);
  });

  it.each(["ajuster", "avancer"])("annonce %s uniquement après commit avec version serveur et source courante", async (type) => {
    const args = type === "ajuster" ? ajuster : avancer;
    outil(`${type}_parcours`, args, "Un faux succès avant écriture.");
    const trames = await tour();
    expect(mocks.appliquerSuivi).toHaveBeenCalledWith({ utilisatriceId: "utilisatrice-test",
      cleTour: "11111111-2222-4333-8444-555555555555", revision: 4, commande: { ...args, type } });
    expect(trames).toContainEqual({ t: "parcours", action: type });
    expect(JSON.stringify(trames)).not.toContain("faux succès");
    expect(mocks.consignerAnam.mock.calls[0][2]).toContain("Mon parcours");
    const req = mocks.egress.mock.calls[0][0].requete;
    expect(req.outils.map((o: { nom: string }) => o.nom)).toEqual(["proposer_pratique", "ajuster_parcours", "avancer_parcours"]);
    expect(req.messages.some((m: { content: string }) => m.content.includes("Des soirées paisibles"))).toBe(true);
    await mocks.after.at(-1)!();
    expect(mocks.metrer).toHaveBeenCalledWith(expect.objectContaining({ tokensEntree: 100, tokensSortie: 30 }));
  });

  it("ne publie aucun succès pendant que l’écriture attend", async () => {
    let confirmer!: () => void, entrer!: () => void;
    const entree = new Promise<void>((r) => { entrer = r; });
    mocks.appliquerSuivi.mockImplementation(async () => { entrer(); await new Promise<void>((r) => { confirmer = r; }); return suivi; });
    outil("avancer_parcours", avancer, "Ce passage est déjà enregistré.");
    const response = await POST(request({ messages: [{ role: "user", content: message }] }));
    const reader = response.body!.getReader();
    await entree;
    let paru = false;
    const lecture = reader.read().then((r) => { paru = true; return r; });
    await Promise.resolve(); await Promise.resolve();
    expect(paru).toBe(false);
    confirmer();
    const premiere = await lecture;
    expect(new TextDecoder().decode(premiere.value)).not.toContain("déjà enregistré");
    while (!(await reader.read()).done) { /* drain the stream and journal */ }
  });

  it.each(["conflit", "refuse", "indisponible"] as const)("refuse le faux reçu lors de %s", async (code) => {
    outil("avancer_parcours", avancer, "J’ai fait grandir ton arbre.");
    mocks.appliquerSuivi.mockRejectedValue(new ErreurSuiviAnam(code));
    const trames = await tour();
    expect(trames.some((t) => t.t === "parcours")).toBe(false);
    expect(JSON.stringify(trames)).not.toContain("J’ai fait grandir");
    expect(trames.at(-1)).toEqual({ t: "fin" });
  });

  it.each(["pause", "panne", "detresse"])("ne donne ni n’exécute le tool en %s", async (cause) => {
    if (cause === "pause") mocks.lireSuivi.mockResolvedValue({ ...suivi, pause: true });
    if (cause === "panne") mocks.lireSuivi.mockRejectedValue(new Error("read failed"));
    if (cause === "detresse") mocks.securite.mockResolvedValue(verdict(1, true));
    outil();
    const trames = await tour();
    expect(mocks.appliquerSuivi).not.toHaveBeenCalled();
    expect(mocks.egress.mock.calls[0][0].requete.outils?.some((o: { nom: string }) => o.nom.endsWith("_parcours")) ?? false).toBe(false);
    expect(trames.some((t) => t.t === "parcours")).toBe(false);
  });

  it("crée un premier cap sans prendre une lecture absente pour une panne", async () => {
    mocks.lireSuivi.mockResolvedValue(null);
    outil("ajuster_parcours", ajuster);
    expect(await tour()).toContainEqual({ t: "parcours", action: "ajuster" });
    expect(mocks.appliquerSuivi.mock.calls[0][0].revision).toBe(0);
  });

  it("garde la réponse ordinaire lorsque le modèle n’utilise aucun outil", async () => {
    mocks.egress.mockResolvedValue({ bloque: false, flux: (async function* (): AsyncIterable<EvenementIa> {
      yield { type: "delta", texte: "Un moment dehors pour toi." };
      yield { type: "fin", tier: "leger", modele: "modele-test", usage: { tokensEntree: 1, tokensSortie: 1 } };
    })() });
    const trames = await tour();
    expect(trames.filter((t) => t.t === "delta").map((t) => t.c).join("")).toBe("Un moment dehors pour toi.");
    expect(mocks.appliquerSuivi).not.toHaveBeenCalled();
  });

  it.each(["sans_fin", "erreur_apres_fin", "annulation"])("n’exécute pas de mutation après %s", async (cause) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ctrl = new AbortController();
    mocks.egress.mockResolvedValue({ bloque: false, flux: (async function* (): AsyncIterable<EvenementIa> {
      yield { type: "outil_delta", caracteres: 35 };
      if (cause !== "sans_fin") yield { type: "fin", tier: "leger", modele: "modele-test", usage: { tokensEntree: 1, tokensSortie: 1 }, appelsOutils: [{ nom: "avancer_parcours", arguments: JSON.stringify(avancer) }] };
      if (cause === "annulation") ctrl.abort();
      else throw new Error("interrupted");
    })() });
    const req = new NextRequest(request({ messages: [{ role: "user", content: message }] }), { signal: ctrl.signal });
    await (await POST(req)).text();
    expect(mocks.appliquerSuivi).not.toHaveBeenCalled();
  });
});
