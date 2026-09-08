import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({commencer:vi.fn(),lire:vi.fn(),terminer:vi.fn(),envoyer:vi.fn(),droits:vi.fn(),metrer:vi.fn()}));
vi.mock("@/lib/data/depot-lecture-numerologie",()=>({commencerLectureNumerologie:mocks.commencer,lireLectureNumerologie:mocks.lire,terminerLectureNumerologie:mocks.terminer}));
vi.mock("@/lib/ai/egress-guard",()=>({envoyerSousEgressArt9:mocks.envoyer,verifierDroitsArt9:mocks.droits}));
vi.mock("@/lib/ai/fabrique",()=>({creerAiPort:async()=>({})}));
vi.mock("@/lib/ai/metrage",()=>({metrerUsageIa:mocks.metrer}));
import { genererLectureNumerologie } from "@/lib/ai/lecture-numerologie";
import { calculerNumerologie } from "@/lib/astro/numerologie";
import type { SupabaseClient } from "@supabase/supabase-js";
const supabase={} as SupabaseClient;
const texte={guidanceAnnee:"Tu pourrais explorer une priorité concrète cette année, en prenant le temps de voir ce qui compte.",visionLongTerme:"À long terme, tu pourrais construire progressivement un cap qui laisse de la place à tes envies.",portrait:"Cette lecture symbolique suggère un goût possible pour les liens. Cela rejoint-il ton vécu ?"};
beforeEach(()=>{
  vi.clearAllMocks();
  mocks.metrer.mockResolvedValue(undefined);
  mocks.commencer.mockResolvedValue({reservation:{statut:"reservee",jeton:"bail"},numerologie:calculerNumerologie({date:"1990-01-01"},2026)});
  mocks.lire.mockResolvedValue({id:"lecture",...texte}); mocks.terminer.mockResolvedValue(undefined); mocks.droits.mockResolvedValue(null);
  mocks.envoyer.mockResolvedValue({bloque:false,reponse:{texte:JSON.stringify(texte),tier:"fort",modele:"modele-effectif",usage:{tokensEntree:123,tokensSortie:456}}});
});
describe("génération durable et contrôlée",()=>{
  it("un cache chaud ne dépense aucun appel",async()=>{
    mocks.commencer.mockResolvedValue({reservation:{statut:"prete"}});
    expect((await genererLectureNumerologie(supabase,"moi")).statut).toBe("prete");expect(mocks.envoyer).not.toHaveBeenCalled();
  });
  it.each(["en_cours","limite"])("%s empêche l'egress",async statut=>{
    mocks.commencer.mockResolvedValue({reservation:{statut}});
    expect(await genererLectureNumerologie(supabase,"moi")).toEqual({statut});expect(mocks.envoyer).not.toHaveBeenCalled();
  });
  it("mesure le modèle physique avant de persister la sortie validée",async()=>{
    await genererLectureNumerologie(supabase,"moi");
    expect(mocks.metrer).toHaveBeenCalledWith(expect.objectContaining({modele:"modele-effectif",operation:"analyse_numerologie",tokensSortie:456,cleIdempotence:"numerologie:bail"}));
    expect(mocks.terminer).toHaveBeenCalledWith("moi","bail",texte);
    expect(mocks.metrer.mock.invocationCallOrder[0]).toBeLessThan(mocks.terminer.mock.invocationCallOrder[0]);
  });
  it("un métrage bloqué ne perd pas la réponse payée", async () => {
    vi.useFakeTimers();
    const journal = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.metrer.mockImplementationOnce(() => new Promise(() => {}));
    try {
      const travail = genererLectureNumerologie(supabase,"moi");
      await vi.advanceTimersByTimeAsync(1999);
      expect(mocks.terminer).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect((await travail).statut).toBe("prete");
      expect(mocks.terminer).toHaveBeenCalledWith("moi","bail",texte);
      expect(journal).toHaveBeenCalledWith("numérologie : métrage indisponible", {code:"numerologie_metrage_indisponible"});
    } finally { journal.mockRestore(); vi.useRealTimers(); }
  });
  it("une sortie rejetée reste mesurée,mais n'est pas persistée",async()=>{
    mocks.envoyer.mockResolvedValue({bloque:false,reponse:{texte:"invalide",tier:"fort",modele:"modele-effectif",usage:{tokensEntree:1,tokensSortie:2}}});
    await expect(genererLectureNumerologie(supabase,"moi")).rejects.toThrow("texte_refuse");
    expect(mocks.envoyer).toHaveBeenCalledTimes(2);expect(mocks.metrer).toHaveBeenCalledTimes(2);expect(mocks.terminer).toHaveBeenCalledWith("moi","bail",null);
  });
  it("une révocation en cours de génération empêche le dépôt",async()=>{
    mocks.droits.mockResolvedValue("consentement");
    await expect(genererLectureNumerologie(supabase,"moi")).rejects.toThrow("droits_retires");
    expect(mocks.terminer).toHaveBeenCalledExactlyOnceWith("moi","bail",null);
  });
  it("refuse de servir un faux succès si la source a changé après génération",async()=>{
    mocks.lire.mockResolvedValue(null);
    await expect(genererLectureNumerologie(supabase,"moi")).rejects.toThrow("lecture_perimee");
  });
});


it("corrects a rejected response once within the same reservation", async () => {
  mocks.envoyer.mockResolvedValueOnce({bloque:false,reponse:{texte:"invalide",tier:"fort",modele:"modele-effectif",usage:{tokensEntree:1,tokensSortie:2}}});
  expect((await genererLectureNumerologie(supabase,"moi")).statut).toBe("prete");
  expect(mocks.commencer).toHaveBeenCalledTimes(1);
  expect(mocks.envoyer).toHaveBeenCalledTimes(2);
  expect(mocks.metrer).toHaveBeenLastCalledWith(expect.objectContaining({cleIdempotence:"numerologie:bail:correction"}));
  expect(mocks.terminer).toHaveBeenCalledExactlyOnceWith("moi","bail",texte);
});
