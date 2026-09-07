# Données réelles et représentation de l’arbre

## Correspondance

| Projection existante | Représentation attendue | Risque à prévenir |
| --- | --- | --- |
| Lecture réussie, aucune branche | Graine ancrée, respiration du ciel ; accès tronc si prévu | Faire apparaître des branches de démonstration ou assimiler une erreur au vide |
| Une branche en naissance | Première pousse et bois naissant portant une accroche réelle | Dessiner un arbre adulte complet dès le premier geste |
| Plusieurs branches en naissance | Rameaux organiques correspondant aux branches reçues | Ajouter un feuillage mature ou une progression fictive pour remplir le décor |
| Branche en feuillaison | Bois et feuilles progressifs selon son intensité bornée | Transformer le pas métier en compteur, niveau ou promesse affichée |
| Feuillaison à intensité 1 | Canopée pleinement feuillue, lumière ambiante ordinaire | Déduire le rayonnement de la seule intensité maximale |
| Branche en rayonnement | Accent nacré et halo local perceptibles sur cette branche | Éclairer toutes les branches ou inventer les étapes intermédiaires |
| Plusieurs états simultanés | Une même structure avec densités et accents locaux distincts | Appliquer un état global qui efface les différences entre branches |
| Tronc incomplet | Représentation réservée et affordance existantes | Présenter l’heure de naissance manquante comme un retard de croissance |
| Projection indisponible | État d’indisponibilité existant et données réconciliées selon le contrat | Faire dépérir l’arbre, effacer un progrès connu ou afficher une graine vide |

Les mots « pousse » et « canopée » restent des descriptions visuelles. Aucun nouveau stade
n’est enregistré. Les racines et le tronc communs organisent la composition ; ils ne constituent
pas des branches métier supplémentaires. Les étoiles du ciel sont un décor sans score ni action.

## Sources et invariants

- `lib/scene/projection.ts:20` : chaque BrancheProjetee porte id, etat, intensite et lien exact
  vers son extrait source. Dates absentes et noms absents ne sont pas inventés.
- `lib/domain/cycle-branche.ts:65` : un retour nourrit la feuillaison mais ne produit jamais le
  rayonnement ; une déclaration peut faire passer directement naissance à rayonnement.
- `render/arbre/MoteurArbreLunaire.ts:53` : lumiereDeBranche renvoie actuellement 1 pour le
  rayonnement comme pour une feuillaison maximale. Ce scalaire convient au développement
  de la matière ; il ne suffit pas pour décider l’aura spécifique à la pleine lumière.
- `render/arbre/ArbreInteractif.ts:78` : la réconciliation de session protège les maxima connus ;
  la refonte ne remplace pas cette protection par une nouvelle autorité cliente durable.
- `lib/scene/projection.ts:43` : le tronc incomplet décrit une information de naissance manquante ;
  son absence ne prouve pas une lecture réussie et ne crée pas de palier de progression.

## Scénarios de validation

Employer uniquement des projections fictives contrôlées : vide, indisponible, tronc incomplet,
naissance seule, feuillaison à 0.2/0.6/1, déclaration directe, états mélangés et nombreuses branches.
Les valeurs numériques servent au test et ne deviennent jamais des libellés du produit.

Pour chaque scénario, comparer le nombre de branches, leurs identifiants, l’accroche, la fiche
et le lien vers la conversation. La liste et le dessin offrent les mêmes actions. Après zoom,
redimensionnement et sélection, vérifier la coïncidence des points visibles et des cibles.
Ajouter une nouvelle branche ne fait pas perdre l’apparence acquise d’une branche existante.

Comparer explicitement une feuillaison à 1 et un rayonnement : canopée possible dans les deux,
aura réservée au second. Vérifier aussi que les changements de thème, l’attente et les ouvertures
répétées ne changent aucun état ni intensité et ne rejouent pas un parcours fictif.
