import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { EvenementIa, RequeteIa } from "@/lib/ai/port";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), securite: vi.fn(), egress: vi.fn(), journal: vi.fn(), consignerAnam: vi.fn(),
  metrer: vi.fn(), after: [] as Array<() => Promise<void>>,
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
vi.mock("@/lib/data/depot-lecture", () => ({ lectureEnAttente: async () => null }));
vi.mock("@/lib/data/lire-contexte-anam", () => ({ lireContexteAnam: async () => null }));
vi.mock("@/lib/data/depot-carte", () => ({ creerDepotCarte: () => ({ charger: async () => (await import("@/lib/domain/depot-carte")).CARTE_ABSENTE }) }));
vi.mock("@/lib/ai/metrage", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/ai/metrage")>(), metrerUsageIa: mocks.metrer,
}));

import { POST } from "@/app/api/anam/message/route";
import { pratiqueParId, texteRecommandationPratique } from "@/lib/domain/pratiques";
import { lireRecommandationPratique } from "@/lib/data/recommandation-pratique";

const request = (extra: Record<string, unknown> = {}) => new NextRequest("http://localhost/api/anam/message", {
  method: "POST", headers: { "Content-Type": "application/json" },
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
  mocks.user.mockResolvedValue({ data: { user: { id: "utilisatrice-test" } } });
  mocks.securite.mockResolvedValue(verdict());
  mocks.journal.mockResolvedValue(undefined);
  mocks.consignerAnam.mockResolvedValue(undefined);
  configurerFlux();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
async function lire() {
  const reponse = await POST(request());
  const trames = (await reponse.text()).trim().split("\n").map((ligne) => JSON.parse(ligne));
  return { reponse, trames };
}

describe("message route practice recommendation integration", () => {
  it("grants native tools, emits a trusted card, persists its canonical link and meters tool-only output", async () => {
    const { reponse, trames } = await lire();
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get("cache-control")).toContain("no-store");
    const requete = mocks.egress.mock.calls[0][0].requete as RequeteIa;
    expect(requete.outils?.[0].nom).toBe("proposer_pratique");
    expect(trames).toContainEqual({ t: "pratique", pratiqueId: "respiration-douce" });
    expect(trames.filter((t) => t.t === "delta").map((t) => t.c).join("")).not.toBe("");
    expect(trames.at(-1)).toEqual({ t: "fin" });
    expect(mocks.consignerAnam).toHaveBeenCalledWith("utilisatrice-test", expect.any(String), expect.stringContaining(texteRecommandationPratique(pratiqueParId("respiration-douce")!)));
    const [userId, cleTour, contenu] = mocks.consignerAnam.mock.calls[0];
    expect(lireRecommandationPratique(contenu, userId, cleTour)).toMatchObject({ pratiqueId: "respiration-douce" });
    expect(JSON.stringify(trames)).not.toContain("anam-pratique:v1");
    await mocks.after.at(-1)!();
    expect(mocks.metrer).toHaveBeenCalledWith(expect.objectContaining({ modele: "modele-test", tokensEntree: 127, tokensSortie: 29 }));
  });

  it.each([1, 2, 3] as const)("does not grant or execute provider proposals during distress level %i", async (niveau) => {
    mocks.securite.mockResolvedValue(verdict(niveau, true));
    configurerFlux(undefined, "Restons ici un instant.");
    const { trames } = await lire();
    expect(mocks.egress.mock.calls[0][0].requete).not.toHaveProperty("outils");
    expect(trames.some((t) => t.t === "pratique")).toBe(false);
    if (niveau >= 2) expect(trames.some((t) => t.t === "ressources")).toBe(true);
    expect(mocks.consignerAnam.mock.calls[0][2]).not.toContain("Pratique proposée");
  });

  it("does not grant tools on a calm turn while a distress episode remains open", async () => {
    mocks.securite.mockResolvedValue(verdict(0, true));
    configurerFlux(undefined, "On peut prendre le temps d’en parler.");
    const { trames } = await lire();
    expect(mocks.egress.mock.calls[0][0].requete).not.toHaveProperty("outils");
    expect(trames.some((t) => t.t === "pratique")).toBe(false);
  });

  it("rejects forged function arguments without leaking them to the transport or persistence", async () => {
    configurerFlux({ pratiqueId: "respiration-douce", href: "https://evil.test" });
    const { trames } = await lire();
    expect(trames.some((t) => t.t === "pratique")).toBe(false);
    expect(JSON.stringify(trames)).not.toContain("evil.test");
    expect(trames.some((t) => t.t === "delta")).toBe(true);
    expect(mocks.consignerAnam.mock.calls[0][2]).not.toContain("Pratique proposée");
  });

  it("never authenticates a model-written catalogue suffix, including in an active distress episode", async () => {
    mocks.securite.mockResolvedValue(verdict(0, true));
    configurerFlux(undefined, texteRecommandationPratique(pratiqueParId("respiration-douce")!));
    const { trames } = await lire();
    expect(trames.some((t) => t.t === "pratique")).toBe(false);
    const [userId, cleTour, contenu] = mocks.consignerAnam.mock.calls[0];
    expect(lireRecommandationPratique(contenu, userId, cleTour)).not.toHaveProperty("pratiqueId");
  });

  it("keeps tools behind authentication and the consent/safety gate", async () => {
    mocks.user.mockResolvedValueOnce({ data: { user: null } });
    expect((await POST(request({ outils: ["proposer_pratique"] }))).status).toBe(401);
    expect(mocks.securite).not.toHaveBeenCalled();
    mocks.securite.mockResolvedValueOnce({ bloque: true, raison: "consentement" });
    expect((await POST(request())).status).toBe(403);
    expect(mocks.egress).not.toHaveBeenCalled();
    expect(mocks.consignerAnam).not.toHaveBeenCalled();
  });

  it("does not persist or publish a recommendation when streaming is interrupted", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.egress.mockResolvedValueOnce({ bloque: false, flux: (async function* () {
      yield { type: "delta", texte: "Une pause peut aider." };
      throw new Error("provider interrupted");
    })() });
    const { trames } = await lire();
    expect(trames.at(-1)).toEqual({ t: "erreur" });
    expect(trames.some((t) => t.t === "pratique")).toBe(false);
    expect(mocks.consignerAnam).not.toHaveBeenCalled();
  });

  it("meters a tool-only interruption without exposing its arguments or inventing a card", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.egress.mockResolvedValueOnce({ bloque: false, flux: (async function* (): AsyncIterable<EvenementIa> {
      yield { type: "outil_delta", caracteres: 90 };
      throw new Error("provider interrupted");
    })() });
    const { trames } = await lire();
    expect(trames).toEqual([{ t: "erreur" }]);
    await mocks.after.at(-1)!();
    expect(mocks.metrer).toHaveBeenCalledWith(expect.objectContaining({ tokensSortie: expect.any(Number) }));
    expect(mocks.metrer.mock.calls[0][0].tokensSortie).toBeGreaterThan(0);
    expect(mocks.consignerAnam).not.toHaveBeenCalled();
  });
});
