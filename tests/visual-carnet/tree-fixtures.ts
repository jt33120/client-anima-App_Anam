import type { BrancheProjetee, ProjectionScene } from "@/lib/scene/projection";
import { MESSAGE_SANS_HEURE, OU_TROUVER_SON_HEURE } from "@/lib/domain/message-sans-heure";

/** Synthetic projection samples, using only the persisted branch lifecycle states. */
export const TREE_CASES = [
  "seed", "birth", "leaf-low", "leaf-high", "leaf-full", "radiant", "mixed", "dense", "error", "reserved",
] as const;
export type TreeCase = typeof TREE_CASES[number];

const names = [
  "Me faire confiance", "Trouver mon rythme", "Oser dire non", "Habiter mes choix",
  "Prendre ma place", "Écouter mes besoins", "Créer sans me comparer", "Accueillir le changement",
];

function branch(index: number, etat: BrancheProjetee["etat"], intensite: number): BrancheProjetee {
  return {
    id: `visual-tree-${index + 1}`,
    etat,
    intensite,
    extraitSourceId: `visual-source-${index + 1}`,
    nom: names[index % names.length] + (index >= names.length ? ` · ${index + 1}` : ""),
    dateNaissance: `2026-08-${String((index % 20) + 1).padStart(2, "0")}T09:00:00Z`,
    ...(etat === "feuillaison" ? { dateFeuillaison: "2026-08-26T09:00:00Z" } : {}),
    ...(etat === "rayonnement" ? { dateRayonnement: "2026-09-01T09:00:00Z" } : {}),
    extraitContenu: "Je souhaite avancer à mon rythme, en faisant une place à ce qui compte pour moi.",
  };
}

/** Staged samples of actual branch fields; no invented global growth field enters the app. */
export function branchesAtVisualStage(stage: number): readonly BrancheProjetee[] {
  if (stage === 0) return [];
  if (stage <= 11) return [branch(0, stage === 1 ? "naissance" : "feuillaison", (stage - 1) / 10)];
  if (stage <= 22) return [branch(0, "feuillaison", 1), branch(1, stage === 12 ? "naissance" : "feuillaison", (stage - 12) / 10)];
  const rayonnantes = Math.max(0, stage - 23);
  return Array.from({ length: Math.max(3, rayonnantes) }, (_, index) =>
    branch(index, index < rayonnantes ? "rayonnement" : index < 2 ? "feuillaison" : "naissance",
      index < rayonnantes || index < 2 ? 1 : 0));
}

export function treeProjectionFor(params: URLSearchParams): ProjectionScene {
  const requested = params.get("tree");
  const sample = TREE_CASES.includes(requested as TreeCase)
    ? requested as TreeCase
    : params.get("state") === "empty" ? "seed" : "mixed";
  const base = { tronc: params.get("treeReserve") === "1"
    ? { present: true as const, incomplet: { phrase: MESSAGE_SANS_HEURE, ouTrouver: OU_TROUVER_SON_HEURE } }
    : { present: true as const } };
  if (sample === "error") return { ...base, branches: [], indisponible: true };
  const stage = Number(params.get("treeStage"));
  if (params.has("treeStage") && Number.isInteger(stage) && stage >= 0 && stage <= 31) {
    return { ...base, branches: branchesAtVisualStage(stage) };
  }

  if (sample === "seed") return { ...base, branches: [] };
  const requestedCount = Number(params.get("treeBranches"));
  const defaultCount = sample === "dense" ? 24 : sample === "mixed" || sample === "reserved" ? 3 : 1;
  const count = Number.isInteger(requestedCount) && requestedCount > 0
    ? Math.min(requestedCount, 40)
    : defaultCount;
  const branches = Array.from({ length: count }, (_, index) => {
    if (sample === "birth") return branch(index, "naissance", 0);
    if (sample === "leaf-low") return branch(index, "feuillaison", 0.25);
    if (sample === "leaf-high") return branch(index, "feuillaison", 0.85);
    if (sample === "leaf-full") return branch(index, "feuillaison", 1);
    if (sample === "radiant") return branch(index, "rayonnement", 1);
    const states = ["naissance", "feuillaison", "rayonnement"] as const;
    return branch(index, states[index % states.length], index % states.length === 2 ? 1 : index % states.length === 1 ? 0.65 : 0);
  });
  return {
    tronc: sample === "reserved"
      ? { present: true, incomplet: { phrase: MESSAGE_SANS_HEURE, ouTrouver: OU_TROUVER_SON_HEURE } }
      : base.tronc,
    branches,
  };
}
