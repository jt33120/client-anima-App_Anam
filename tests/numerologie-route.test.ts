import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: vi.fn(), droits: vi.fn(), lire: vi.fn(), generer: vi.fn(), noter: vi.fn(), etat: vi.fn(),
}));
vi.mock("@/lib/data/supabase/server", () => ({createSupabaseServerClient: async () => ({auth:{getUser:mocks.user}})}));
vi.mock("@/lib/ai/egress-guard", () => ({verifierDroitsArt9:mocks.droits}));
vi.mock("@/lib/data/depot-lecture-numerologie", () => ({lireLectureNumerologie:mocks.lire,noterLectureNumerologie:mocks.noter,lireEtatLectureNumerologie:mocks.etat}));
vi.mock("@/lib/ai/lecture-numerologie", () => ({genererLectureNumerologie:mocks.generer}));
import { GET, POST, PATCH } from "@/app/api/numerologie/route";
const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const requete = (method:string,body:unknown={},origin="https://anam.test") => new Request("https://anam.test/api/numerologie",{method,headers:{origin,"content-type":"application/json"},body:JSON.stringify(body)});
beforeEach(() => {
  vi.clearAllMocks(); mocks.user.mockResolvedValue({data:{user:{id}}}); mocks.droits.mockResolvedValue(null);
  mocks.etat.mockResolvedValue({statut:"absente"}); mocks.lire.mockResolvedValue(null); mocks.generer.mockResolvedValue({statut:"prete",lecture:{id}}); mocks.noter.mockResolvedValue(undefined);
});
describe("frontière numérologie", () => {
  it("GET lit sans générer et interdit le cache public", async () => {
    const r = await GET(); expect(r.status).toBe(200); expect(mocks.generer).not.toHaveBeenCalled();
    expect(r.headers.get("cache-control")).toContain("no-store");
  });
  it("refuse la session absente avant toute lecture", async () => {
    mocks.user.mockResolvedValue({data:{user:null}}); expect((await GET()).status).toBe(401); expect(mocks.lire).not.toHaveBeenCalled();
  });
  it("la révocation interdit aussi le cache et la notation", async () => {
    mocks.droits.mockResolvedValue("consentement"); expect((await GET()).status).toBe(403);
    expect((await PATCH(requete("PATCH",{id,note:5,partagerAnam:true}))).status).toBe(403);
    expect(mocks.lire).not.toHaveBeenCalled(); expect(mocks.noter).not.toHaveBeenCalled();
  });
  it("rejette une origine étrangère ou absente", async () => {
    expect((await POST(requete("POST",{},"https://autre.test"))).status).toBe(403);
    expect((await POST(new Request("https://anam.test/api/numerologie",{method:"POST"}))).status).toBe(403);
    expect(mocks.generer).not.toHaveBeenCalled();
  });
  it("ne reçoit ni chiffres ni texte du client et borne le corps", async () => {
    expect((await POST(requete("POST",{chemin:8}))).status).toBe(400);
    expect((await POST(requete("POST",{texte:"x".repeat(2000)}))).status).toBe(400);
    expect(mocks.generer).not.toHaveBeenCalled();
  });
  it("génère seulement après un POST valide", async () => {expect((await POST(requete("POST"))).status).toBe(200); expect(mocks.generer).toHaveBeenCalledTimes(1);});
  it.each([["en_cours",202],["patience",429],["limite",429]])("rend %s sans faux texte", async (statut,status) => {
    mocks.generer.mockResolvedValue({statut}); expect((await POST(requete("POST"))).status).toBe(status);
  });
  it("une notation périmée invite à recharger sans annoncer une panne serveur", async () => {
    mocks.noter.mockRejectedValueOnce(new Error("numerologie_lecture_perimee"));
    expect((await PATCH(requete("PATCH",{id,note:5,partagerAnam:true}))).status).toBe(409);
  });
  it("note 4 exclut le partage et rejet des textes forgés", async () => {
    expect((await PATCH(requete("PATCH",{id,note:4,partagerAnam:true}))).status).toBe(400);
    expect((await PATCH(requete("PATCH",{id,note:5,partagerAnam:true,portrait:"forgé"}))).status).toBe(400);
    expect(mocks.noter).not.toHaveBeenCalled();
    expect((await PATCH(requete("PATCH",{id,note:4,partagerAnam:false}))).status).toBe(200);
    expect(mocks.noter).toHaveBeenCalledWith(expect.anything(),{id,note:4,partagerAnam:false});
  });
});
