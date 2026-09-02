/**
 * copie-modele.ts — LA MENTION QUI ACCOMPAGNE UN TEXTE ÉCRIT PAR UN MODÈLE (2026-09-02).
 *
 * Retour du fondateur : « génère-le par IA, en ajoutant à côté un petit avertissement fait par IA ».
 *
 * ⚠️ ELLE N'EST PAS FACULTATIVE, ET CE N'EST PAS UN DÉTAIL DE STYLE. Tout ce que le produit affiche
 * paraît sous le nom d'une personne réelle et identifiable (FR-054, FR-086) : la seule chose qui
 * empêche un texte fabriqué à l'instant de passer pour le sien, c'est cette ligne. Elle voyage DANS
 * l'objet `EcritureModele`, avec le texte, pour qu'aucun rendu ne puisse afficher l'un sans l'autre.
 *
 * ⚠️ ELLE DIT AUSSI D'OÙ VIENNENT LES FAITS. « Écrit par un modèle » tout court laisserait croire
 * que le ciel lui-même est inventé, alors que les positions sortent d'éphémérides. La phrase tient
 * les deux : le calcul est du calcul, la mise en mots est d'un modèle.
 *
 * ⚠️ FICHIER FEUILLE : IL N'IMPORTE RIEN, ET C'EST LA RAISON DE SON EXISTENCE. La mention vivait
 * d'abord dans `copie-socle.ts`, d'où `cartes-socle.ts` la lisait. Cela fermait un cycle
 * (`cartes-socle` → `copie-socle` → `copie-naissance` → `cartes-socle`) que les tests ne voyaient
 * pas et que le build de production a refusé, à froid, sur une page sans rapport : « Cannot access
 * \'f\' before initialization » au chargement de `/memoire`. Ne rien importer ici est ce qui garde
 * la porte fermée.
 */
export const MENTION_ECRITURE_MODELE =
  "Texte écrit par un modèle, à partir du ciel calculé.";
