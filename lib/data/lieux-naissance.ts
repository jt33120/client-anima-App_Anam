import "server-only";
import { lieuxFrance } from "@/lib/astro/adapters/lieux-france";
import type { LieuNaissance } from "@/lib/astro/lieux";

/**
 * Point de composition unique du référentiel embarqué des communes.
 *
 * Les Server Actions connaissent cette façade et les types du port, jamais l'adaptateur nommé.
 * La recherche initiale et la correction partagent ainsi strictement le même index et la même
 * résolution par code INSEE, sans multiplier les frontières d'infrastructure dans `app/`.
 */
export function chercherLieuxNaissanceDansReferentiel(
  requete: string,
  limite: number,
): readonly LieuNaissance[] {
  return lieuxFrance().chercher(requete, limite);
}

export function trouverLieuNaissanceParCode(code: string): LieuNaissance | null {
  return lieuxFrance().trouverParCode(code);
}
