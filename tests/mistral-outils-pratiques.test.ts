import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdaptateurMistral } from "@/lib/ai/adapters/mistral";
import { OUTIL_PROPOSER_PRATIQUE } from "@/lib/ai/outils-pratiques";
import { OUTIL_AJUSTER_PARCOURS, resoudreOutilParcours } from "@/lib/ai/outils-parcours";
import type { EvenementIa, RequeteIa } from "@/lib/ai/port";

const { stream } = vi.hoisted(() => ({ stream: vi.fn() }));
vi.mock("@mistralai/mistralai", () => ({ Mistral: class { chat = { stream }; } }));

const requete: RequeteIa = {
  capacite: "echange", contientArt9: true, niveauSecurite: 0,
  messages: [{ role: "user", content: "Une petite pause ?" }], outils: [OUTIL_PROPOSER_PRATIQUE],
};
async function collecter(req = requete) {
  const evenements: EvenementIa[] = [];
  for await (const evenement of new AdaptateurMistral().diffuser(req)) evenements.push(evenement);
  return evenements;
}
async function* fluxOutil(finishReason = "tool_calls", tropLong = false) {
  yield { data: { choices: [{ delta: { toolCalls: [{ index: 0, id: "change-1", function: { name: "proposer_pratique", arguments: '{"pratiqueId":' } }] } }] } };
  yield { data: { choices: [{ delta: { toolCalls: [{ index: 0, id: "change-2", function: { name: "", arguments: tropLong ? "x".repeat(8193) : '"respiration-douce"}' } }] } }] } };
  yield { data: { choices: [{ delta: {}, finishReason }], usage: { promptTokens: 101, completionTokens: 23 } } };
}
beforeEach(() => {
  stream.mockReset();
  vi.stubEnv("MISTRAL_ZDR_CONFIRMED", "true");
  vi.stubEnv("MISTRAL_DPA_SIGNED", "true");
  vi.stubEnv("MISTRAL_PLAN", "scale");
  vi.stubEnv("MISTRAL_API_KEY", "fake-test-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("native streamed practice tools", () => {
  it("sends real function definitions and assembles by index zero even when SDK ids change", async () => {
    stream.mockResolvedValueOnce(fluxOutil());
    const result = await collecter();
    expect(stream).toHaveBeenCalledTimes(1);
    expect(stream.mock.calls[0][0]).toMatchObject({
      toolChoice: "auto", parallelToolCalls: false,
      tools: [{ type: "function", function: { name: "proposer_pratique" } }],
    });
    expect(result.filter((ev) => ev.type === "outil_delta").length).toBe(2);
    expect(result.at(-1)).toEqual(expect.objectContaining({
      type: "fin", usage: { tokensEntree: 101, tokensSortie: 23 },
      appelsOutils: [{ nom: "proposer_pratique", arguments: '{"pratiqueId":"respiration-douce"}' }],
    }));
  });

  it.each([1, 2, 3] as const)("does not grant or deliver tools at distress level %i", async (niveauSecurite) => {
    stream.mockResolvedValueOnce(fluxOutil());
    const result = await collecter({ ...requete, niveauSecurite });
    expect(stream.mock.calls[0][0]).not.toHaveProperty("tools");
    expect(result.at(-1)).not.toHaveProperty("appelsOutils");
  });

  it("does not grant tools to a document/safety capability", async () => {
    stream.mockResolvedValueOnce(fluxOutil());
    const result = await collecter({ ...requete, capacite: "detection" });
    expect(stream.mock.calls[0][0]).not.toHaveProperty("tools");
    expect(result.at(-1)).not.toHaveProperty("appelsOutils");
  });

  it.each(["length", "error", ""])("drops uncommitted calls on terminal reason %j", async (raison) => {
    stream.mockResolvedValueOnce(fluxOutil(raison));
    expect((await collecter()).at(-1)).not.toHaveProperty("appelsOutils");
  });

  it("bounds arguments and still reports provider usage", async () => {
    stream.mockResolvedValueOnce(fluxOutil("tool_calls", true));
    const fin = (await collecter()).at(-1);
    expect(fin).not.toHaveProperty("appelsOutils");
    expect(fin).toMatchObject({ usage: { tokensEntree: 101, tokensSortie: 23 } });
  });

  it("assembles Unicode follow-up fields at their valid domain bounds without dropping the native call", async () => {
    const lettre = "𐐀";
    const commande = {
      cap: lettre.repeat(160), synthese: lettre.repeat(1200),
      etapes: Array.from({ length: 3 }, () => ({ titre: lettre.repeat(160), pratiqueId: "respiration-douce" })),
      preuve: lettre.repeat(500),
    };
    const arguments_ = JSON.stringify(commande);
    expect(arguments_.length).toBeGreaterThan(4096);
    stream.mockResolvedValueOnce((async function* () {
      for (let i = 0; i < arguments_.length; i += 701) {
        yield { data: { choices: [{ delta: { toolCalls: [{ index: 0,
          function: { name: i === 0 ? "ajuster_parcours" : "", arguments: arguments_.slice(i, i + 701) },
        }] } }] } };
      }
      yield { data: { choices: [{ delta: {}, finishReason: "tool_calls" }], usage: { promptTokens: 101, completionTokens: 3000 } } };
    })());
    const fin = (await collecter({ ...requete, outils: [OUTIL_AJUSTER_PARCOURS] })).at(-1);
    expect(fin?.type).toBe("fin");
    if (fin?.type !== "fin") throw new Error("fin_absente");
    expect(resoudreOutilParcours(fin.appelsOutils, true, commande.preuve, null)).toEqual({ type: "ajuster", ...commande });
  });

  it("never publishes buffered calls or retries when the upstream stream dies", async () => {
    stream.mockResolvedValueOnce((async function* () {
      yield { data: { choices: [{ delta: { toolCalls: [{ index: 0, function: { name: "proposer_pratique", arguments: '{"pratiqueId":"big-five"}' } }] } }] } };
      throw new Error("interrupted");
    })());
    await expect(collecter()).rejects.toThrow("interrupted");
    expect(stream).toHaveBeenCalledTimes(1);
  });
});
