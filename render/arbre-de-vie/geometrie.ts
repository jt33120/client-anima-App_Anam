import type { PastilleVue } from "./types";

/** Repères en pourcentage de la planche 2:3. Liens HTML de 44 px minimum,
 * indépendants de la résolution de l'illustration et ordonnés des racines à la cime. */
export const ANCRES: Readonly<Record<string, { readonly gauche: string; readonly haut: string }>> =
  Object.freeze({
    cime: Object.freeze({ gauche: "50%", haut: "8%" }),
    feuilles: Object.freeze({ gauche: "83%", haut: "34%" }),
    branches: Object.freeze({ gauche: "17%", haut: "34%" }),
    // L’écorce reste à côté du tronc pour laisser voir le bois nacré.
    ecorce: Object.freeze({ gauche: "21%", haut: "60%" }),
    tronc: Object.freeze({ gauche: "50%", haut: "64%" }),
    racine_seconde: Object.freeze({ gauche: "80%", haut: "88%" }),
    racine_premiere: Object.freeze({ gauche: "20%", haut: "88%" }),
  });

/** Le repère d'une pastille. Replie sur le centre du cadre si une clé inconnue arrivait. */
export function ancreDeLaPastille(pastille: PastilleVue): {
  readonly gauche: string;
  readonly haut: string;
} {
  return ANCRES[pastille.cle] ?? { gauche: "50%", haut: "50%" };
}
