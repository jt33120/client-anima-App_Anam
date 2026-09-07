import type { BrancheProjetee } from "@/lib/scene/projection";

type BrancheDeCroissance = Pick<BrancheProjetee, "id" | "etat" | "intensite">;

const DERNIERE_STRUCTURE = 23;
const NUANCES_LUMIERE = 11;
// The persisted intensity uses SQL real. Ignore its tiny float rounding around a tenth.
const TOLERANCE_DIXIEME = 0.000001;

/**
 * Selects an illustration from the reconciled branches, without writing personal data.
 * One distinct birth contributes one drawing unit; its foliage contributes up to ten more.
 * The tenths describe drawing precision, not the backend's unchanged 0.2 progression step.
 * Once the structure reaches 23, each declared radiant branch adds one light variant (up to 11).
 * The first eight variants keep their original indices; three celestial variants follow them.
 * No clock, connection count, personal text or persisted visual index participates.
 */
export function indexCroissancePersonnelle(branches: readonly BrancheDeCroissance[]): number {
  const uniques = new Map<string, { intensite: number; rayonnante: boolean }>();

  for (const branche of branches) {
    if (typeof branche.id !== "string" || branche.id.trim().length === 0) continue;
    if (branche.etat !== "naissance" && branche.etat !== "feuillaison" && branche.etat !== "rayonnement") continue;

    // The declared state remains authoritative: a birth cannot already carry foliage.
    const intensite = branche.etat === "naissance" || !Number.isFinite(branche.intensite)
      ? 0 : Math.min(1, Math.max(0, branche.intensite));
    const precedente = uniques.get(branche.id);
    uniques.set(branche.id, {
      intensite: Math.max(precedente?.intensite ?? 0, intensite),
      rayonnante: precedente?.rayonnante === true || branche.etat === "rayonnement",
    });
  }

  let structure = 0;
  let rayonnantes = 0;
  for (const branche of uniques.values()) {
    const dixiemes = Math.min(10, Math.floor(branche.intensite * 10 + TOLERANCE_DIXIEME));
    structure = Math.min(DERNIERE_STRUCTURE, structure + 1 + dixiemes);
    if (branche.rayonnante) rayonnantes = Math.min(NUANCES_LUMIERE, rayonnantes + 1);
  }

  return structure + (structure === DERNIERE_STRUCTURE ? rayonnantes : 0);
}
