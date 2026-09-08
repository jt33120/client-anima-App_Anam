import { beforeEach, describe, expect, it, vi } from "vitest";
const doubles = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), from: vi.fn(), adminRpc: vi.fn() }));
vi.mock("@/lib/data/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: doubles.getUser }, rpc: doubles.rpc, from: doubles.from }) }));
vi.mock("@/lib/data/supabase/admin", () => ({ createSupabaseAdminClient: () => ({ rpc: doubles.adminRpc }) }));
import { GET, POST } from "@/app/api/anam/suivi/route";
import { appliquerOutilSuiviAnam, ErreurSuiviAnam, lireSuiviAnam, lireRecuSuiviAnam } from "@/lib/data/depot-suivi-anam";
import type { SupabaseClient } from "@supabase/supabase-js";

const id = "11111111-1111-4111-8111-111111111111";
const reperes = { ceQuiCompte: "Mon temps", ceQuiAide: "La marche", aRespecter: "" };
const row = { revision: 1, pause: false, cap: "Un cap", synthese: "Un contexte", reperes,
  etapes: [{ id, titre: "Une pause", pratiqueId: "pause-attention" }], niveau_arbre: 2, maj_le: "2026-09-08T12:00:00Z" };
const entetes = (compte: string | null): Record<string, string> => compte === null ? {} : { "X-Anam-Compte": compte };
const request = (body: unknown, compte: string | null = id) => new Request("http://local/api/anam/suivi", {
  method: "POST", body: JSON.stringify(body), headers: entetes(compte),
});
const requestGet = (compte: string | null = id) => new Request("http://local/api/anam/suivi", { headers: entetes(compte) });
let lecture: { data: unknown; error: { code: string } | null };
let histoire: { data: unknown; error: { code: string } | null };
function chaine(table: string) {
  const c = { select: vi.fn(() => c), eq: vi.fn(() => c), lte: vi.fn(() => c), order: vi.fn(() => c),
    maybeSingle: vi.fn(async () => lecture), limit: vi.fn(async () => histoire) };
  expect(["suivi_anam", "suivi_evenement"]).toContain(table);
  return c;
}
beforeEach(() => {
  vi.clearAllMocks();
  doubles.getUser.mockResolvedValue({ data: { user: { id } }, error: null });
  doubles.rpc.mockResolvedValue({ data: 1, error: null });
  doubles.adminRpc.mockResolvedValue({ data: 1, error: null });
  doubles.from.mockImplementation(chaine);
  lecture = { data: row, error: null }; histoire = { data: [], error: null };
});
describe("API du parcours et frontière serveur", () => {
  it("refuse les appels anonymes avant lecture ou mutation", async () => {
    doubles.getUser.mockResolvedValue({ data: { user: null } });
    expect((await GET(requestGet())).status).toBe(401);
    expect((await POST(request({ action: "pause", revision: 1, pause: true }))).status).toBe(401);
    expect(doubles.from).not.toHaveBeenCalled(); expect(doubles.rpc).not.toHaveBeenCalled();
  });
  it("distingue présence, absence et indisponibilité, sans cache de contenu personnel", async () => {
    const r = await GET(requestGet()); expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toContain("no-store");
    expect(await r.json()).toMatchObject({ statut: "disponible", suivi: { revision: 1, niveauArbre: 2, reperes } });
    lecture = { data: null, error: null };
    expect(await (await GET(requestGet())).json()).toEqual({ statut: "absent", suivi: null });
    lecture = { data: null, error: { code: "500" } };
    const panne = await GET(requestGet()); expect(panne.status).toBe(503);
    expect(await panne.json()).toMatchObject({ statut: "indisponible" });
  });
  it("une histoire illisible ne devient jamais un historique vide", async () => {
    histoire = { data: null, error: { code: "503" } };
    expect((await GET(requestGet())).status).toBe(503);
    histoire = { data: [{ id, type: "inconnu" }], error: null };
    expect((await GET(requestGet())).status).toBe(503);
  });
  it.each([null, "22222222-2222-4222-8222-222222222222"])("refuse un compte de page absent ou changé (%s) avant contenu et lecture", async (compte) => {
    const get = await GET(requestGet(compte));
    expect(get.status).toBe(409); expect(await get.json()).toEqual({ code: "session_modifiee" });
    const req = request({ action: "reperes", revision: 1, reperes }, compte);
    const parser = vi.spyOn(req, "json");
    const post = await POST(req);
    expect(post.status).toBe(409); expect(await post.json()).toEqual({ code: "session_modifiee" });
    expect(parser).not.toHaveBeenCalled();
    expect(doubles.from).not.toHaveBeenCalled(); expect(doubles.rpc).not.toHaveBeenCalled();
    expect(doubles.adminRpc).not.toHaveBeenCalled();
  });
  it("les commandes personnelles seules atteignent leur RPC sous JWT", async () => {
    const corps = { action: "reperes", revision: 0, reperes };
    expect((await POST(request(corps))).status).toBe(200);
    expect(doubles.rpc).toHaveBeenCalledWith("modifier_suivi_personnel", { p_revision: 0, p_commande: corps });
    expect(doubles.adminRpc).not.toHaveBeenCalled();
    for (const c of [{ action: "avancer", revision: 1, niveauArbre: 34 },
      { action: "pause", revision: 1, pause: true, utilisatriceId: "autre" },
      { action: "reperes", revision: 1, reperes: { ...reperes, aRespecter: "a".repeat(2001) } }]) {
      expect((await POST(request(c))).status).toBe(400);
    }
    expect(doubles.rpc).toHaveBeenCalledTimes(1);
  });
  it.each([["40001", 409], ["PT409", 409], ["42501", 403], ["22023", 400], ["PGRST001", 503]])("traduit le code SQL %s sans exposer le détail", async (code, statut) => {
    doubles.rpc.mockResolvedValue({ data: null, error: { code, message: "document personnel" } });
    const r = await POST(request({ action: "pause", revision: 1, pause: true }));
    expect(r.status).toBe(statut); expect(await r.text()).not.toContain("document personnel");
  });
  it("atteste la commande côté serveur puis relit le contenu sous JWT", async () => {
    const commande = { type: "ajuster" as const, cap: "Un cap", synthese: "Un contexte", preuve: "Une vraie phrase",
      etapes: [{ titre: "Une pause", pratiqueId: null }] };
    const result = await appliquerOutilSuiviAnam({ utilisatriceId: id, cleTour: "tour", revision: 0, commande });
    expect(result.revision).toBe(1);
    expect(doubles.adminRpc).toHaveBeenCalledWith("appliquer_outil_suivi_anam", {
      p_utilisatrice_id: id, p_cle_tour: "tour", p_revision: 0, p_commande: commande,
    });
    expect(doubles.from).toHaveBeenCalledWith("suivi_anam");
    await expect(appliquerOutilSuiviAnam({ utilisatriceId: "autre", cleTour: "tour", revision: 0, commande })).rejects.toMatchObject({ code: "refuse" });
    expect(doubles.adminRpc).toHaveBeenCalledTimes(1);
  });
  it("refuse les réponses DB déformées sans inventer un suivi", async () => {
    lecture = { data: { ...row, reperes: null }, error: null };
    await expect(lireSuiviAnam({ from: doubles.from } as unknown as SupabaseClient, id)).rejects.toBeInstanceOf(ErreurSuiviAnam);
  });
  it("le reçu expose uniquement son type et refuse tout contenu inattendu", async () => {
    const client = { rpc: doubles.rpc } as unknown as SupabaseClient;
    doubles.rpc.mockResolvedValueOnce({ data: { type: "avancer" }, error: null });
    expect(await lireRecuSuiviAnam(client, "tour", "Ses mots")).toEqual({ type: "avancer" });
    expect(doubles.rpc).toHaveBeenCalledWith("lire_recu_suivi", { p_cle_tour: "tour", p_message_source: "Ses mots" });
    doubles.rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await lireRecuSuiviAnam(client, "tour", "Ses mots")).toBeNull();
    doubles.rpc.mockResolvedValueOnce({ data: { type: "avancer", empreinte: "secret" }, error: null });
    await expect(lireRecuSuiviAnam(client, "tour", "Ses mots")).rejects.toMatchObject({ code: "indisponible" });
  });
});
