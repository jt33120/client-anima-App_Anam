import { vi } from "vitest";
import type {
  OuvertureData,
  ResultatOuvertureDuJour,
} from "@/render/conversation/types";

/** Monte une ouverture par le vrai contrat visible : une ligne persistée et sa forme interactive. */
export function resultatAvecOuverture(
  ouverture: OuvertureData,
  tourId = "anam:ouverture-jour:2026-08-26",
): ResultatOuvertureDuJour {
  return {
    statut: "ouverte",
    jourParis: "2026-08-26",
    rearmementMs: 60_000,
    tours: [
      {
        id: tourId,
        role: "anam",
        texte: ouverture.phrase,
        separateurAvant: true,
      },
    ],
    ouverture: { tourId, donnees: ouverture },
  };
}

export function actionAvecOuverture(ouverture: OuvertureData) {
  return vi.fn(async (): Promise<ResultatOuvertureDuJour> =>
    resultatAvecOuverture(ouverture),
  );
}
