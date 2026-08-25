/**
 * Frontière de chargement de cette halte. Voir `render/HalteEnAttente.tsx` pour le pourquoi : elle
 * rend la navigation IMMÉDIATE au clic, et elle rend cette route dynamique PRÉCHARGEABLE.
 *
 * ⚠️ Pas de `loading.tsx` à la racine `app/` : la scène est un monde continu, et une frontière posée
 * là la ferait se démonter à chaque retour vers elle — exactement l'écran qu'on ne veut jamais voir
 * clignoter.
 */
export { default } from "@/render/HalteEnAttente";
