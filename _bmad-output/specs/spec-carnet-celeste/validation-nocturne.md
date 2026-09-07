# Validation de l'itération nocturne

Statut : protocole exécuté pour les vérifications consignées dans
[review-nocturne.md](review-nocturne.md), avec captures finales et identification du déploiement
à compléter par le pilote. La preuve sur clavier iOS physique reste absente. La revue V1 ne
clôt pas les nouveaux défauts remontés par captures; le rapport nocturne distingue les preuves.

## Référence et captures

Conserver les deux captures utilisateur et noter leurs dimensions exactes lorsqu'elles sont
disponibles. Comparer les mêmes états avant/après. Compléter à 390 × 844, 768 × 1024 et
1440 × 900; ajouter 320 px pour les libellés longs et un téléphone court à 390 × 664.
Deux tours capture → critique → correction → recapture couvrent l'accueil et Anam.

Chaque preuve indique route/région, taille, préférence, état du clavier, état du contenu et SHA.
Utiliser des données synthétiques pour les artefacts partagés. Les captures de production
authentifiée ne doivent pas exposer une conversation personnelle.

## Nuit, matière et accessibilité

| Cas | Attendu |
| --- | --- |
| Aucun choix enregistré, chargement frais | Première peinture nocturne; pas de plein écran Papier avant hydratation |
| Nuit/Papier choisi puis navigation/rechargement | Choix respecté, contrôle et libellé accessibles cohérents |
| Écriture localStorage refusée, lecture autorisée | Nuit → Papier → Nuit reste possible dans la session |
| Contraste système more et contraste explicite | Textes renforcés et décor neutralisé selon le contrat d'accessibilité |
| Mouvement réduit | Contenu et focus préservés, aucune animation indispensable |
| Texte posé près du lotus/étoiles/dégradés | Contraste d'au moins 4,5:1 sur toute la zone lisible; mesurer le rendu composé |

Mesurer les paires effectives, y compris texte secondaire, erreur, bouton et sélection. Une
palette testée sans ses fonds composés ne prouve pas le contraste final. Vérifier les focus
visibles, cibles de 44 px et absence de décor captant les événements pointeur.

## Accueil compact

- Au premier écran, voir une information quotidienne utile en plus du titre et de la navigation.
- Comparer hauteur du bloc d'ouverture, surface visible de contenu et rythme entre sections.
- Mantra court/long, texte quotidien dense, absence et erreur conservent une hiérarchie lisible.
- Aucun débordement horizontal; dernier contenu accessible au défilement, hors de la barre basse.

## Clavier : séparer viewport de mise en page et viewport visible

Une simple réduction de `page.setViewportSize` ne reproduit pas le clavier iOS : elle réduit
aussi la fenêtre de mise en page. Tester séparément `visualViewport.height`, `offsetTop` et ses
événements resize/scroll, tout en conservant la hauteur de mise en page du téléphone.

1. Ouvrir Anam sans clavier, lire le dernier échange puis focaliser le composeur par le vrai geste
   de navigation et par un toucher direct.
2. Avec le clavier ouvert, relever les rectangles du viewport visible, du fil, du dernier message,
   du composeur, d'Envoyer et de la navigation. Les actions sont entièrement dans l'espace visible;
   le fil garde une hauteur positive permettant de lire et de remonter les échanges.
3. Saisir une ligne puis un message multi-ligne jusqu'à la hauteur maximale du champ. Le fil
   reste défilable et aucun appui sur Envoyer n'est intercepté par la navigation ou le clavier.
4. Remonter l'historique pendant la saisie; vérifier que le défilement automatique ne ramène pas
   continuellement la personne en bas contre son geste.
5. Fermer/réouvrir le clavier et changer de région : hauteur restaurée, pas de zone vide persistante,
   dernier message et focus cohérents. Tester portrait court et paysage.

Répéter avec fil vide/introduction, historique long, réponse en cours et erreur. Utiliser la
simulation contrôlée pour couvrir les limites, puis constater le comportement avec un clavier
iOS/Safari ou Android/Chrome réel si cet accès est disponible. Indiquer explicitement toute
absence de cette dernière preuve; ne pas transformer une simulation réussie en preuve matérielle.

## Contrôles et livraison

Génération des tokens reproductible, lint, build et tests ciblés pertinents. Tester les nouveaux
comportements de viewport avec des invariants de lisibilité et de géométrie, sans test miroir du
CSS. Refaire la comparaison du périmètre backend avec `40dcd22593c6c69737def3641f51f62c57b7a63c`.

Déployer via --prod normal, sans modifier contrôle de promotion ni schéma distant. Vérifier
Ready, SHA et alias; nouveau rollback vers `dpl_DFEd5WyGwpeoQM5fbnTDFUNKC4z4`. La dérive distante
0091–0093 antérieure demeure une limite de la baseline, pas une modification à appliquer ici.

Validation finale : build Next de production réussi, 603 tests de rendu dans 49 fichiers, 205 gardes front/contraste/parité dans 7 fichiers. Connexion anonyme du build réel inspectée à 390 et 1440 px : nuit, sans erreur navigateur ni débordement.
