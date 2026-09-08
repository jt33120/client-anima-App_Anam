import { afterEach, describe, expect, it, vi } from "vitest";
import { AdaptateurMistral } from "@/lib/ai/adapters/mistral";
afterEach(() => {vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
describe("numerology provider deadline", () => {
  it("cancels the actual SDK fetch at 50 seconds without hidden retries", async () => {
    vi.useFakeTimers();
    vi.stubEnv("MISTRAL_ZDR_CONFIRMED","true");vi.stubEnv("MISTRAL_DPA_SIGNED","true");
    vi.stubEnv("MISTRAL_PLAN","scale");vi.stubEnv("MISTRAL_API_KEY","synthetic-key");
    const controleur = new AbortController();
    const timeout = vi.spyOn(AbortSignal,"timeout").mockImplementation(ms => {
      setTimeout(() => controleur.abort(new DOMException("Deadline exceeded","TimeoutError")),ms);
      return controleur.signal;
    });
    const fetch = vi.fn((requete:Request) => new Promise<Response>((_,rejeter) => {
      requete.signal.addEventListener("abort",() => rejeter(requete.signal.reason),{once:true});
    }));
    vi.stubGlobal("fetch",fetch);
    const adaptateur=new AdaptateurMistral();
    const travail=adaptateur.completer({capacite:"numerologie",contientArt9:true,messages:[{role:"user",content:"Nombres fictifs"}]})
      .then(()=>"unexpected_success",erreur=>erreur);
    await vi.advanceTimersByTimeAsync(49_999);
    expect(timeout).toHaveBeenCalledWith(50_000);
    expect(controleur.signal.aborted).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(controleur.signal.aborted).toBe(true);
    expect(await travail).toBeInstanceOf(Error);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
