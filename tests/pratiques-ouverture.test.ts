import { expect, it, vi } from "vitest";

vi.mock("@/lib/data/supabase/server", () => ({ createSupabaseServerClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: "u" } } }) },
}) }));
vi.mock("@/app/(auth)/etat-onboarding", () => ({
  etapeOnboardingPour: async () => "suite", ErreurLectureOnboarding: class extends Error {},
}));
vi.mock("@/lib/data/depot-ouverture-quotidienne", () => ({
  commencerOuvertureQuotidienne: async () => ({ statut: "deja-commencee", ligne: null }),
  finaliserOuvertureQuotidienne: vi.fn(), ErreurDepotOuvertureQuotidienne: class extends Error {},
}));
vi.mock("@/lib/data/depot-fil", () => ({ lireFilRecent: async () => [
  { id: "anam:tour", role: "anam", texte: "Tu peux essayer.", pratiqueId: "pause-attention", creeLe: "2026-09-08T08:00:00Z" },
] }));

import { reclamerOuvertureDuJour } from "@/app/_ouverture/reclamer-ouverture";

it("préserve la recommandation vérifiée lors de la relecture quotidienne", async () => {
  const retour = await reclamerOuvertureDuJour();
  expect(retour.statut).toBe("deja-commencee");
  if (retour.statut !== "deja-commencee") throw new Error("ouverture absente");
  expect(retour.tours).toEqual([
    { id: "anam:tour", role: "anam", texte: "Tu peux essayer.", pratiqueId: "pause-attention" },
  ]);
});
