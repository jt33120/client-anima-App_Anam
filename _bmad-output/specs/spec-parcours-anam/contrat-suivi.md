# Contrat du suivi

## Données et auteurs
Une ligne par compte : revision, pause, cap (160 caractères), synthese (1200), trois reperes personnels (2000 chacun), au plus trois etapes à venir (UUID serveur, titre 160, pratiqueId interne facultatif), niveauArbre (0 à 34), majLe. Les repères sont exclusivement écrits par l’utilisatrice ; les textes d’Anam restent identifiés comme tels. Les limites métier comptent les points Unicode et le tampon natif admet leurs représentations JSON.

Le registre conserve action, tour et source possédés, résumé bref, titre du pas franchi, date et niveau réellement atteint. Il ne copie pas les anciennes versions des documents. Clé unique compte/tour, empreinte de commande et verrou compte : retry exact sans réécriture, contenu divergent refusé, version périmée en conflit.

## Outils et reçus
`ajuster_parcours` définit cap, synthèse et une à trois prochaines étapes ; niveau, historique et repères sont conservés. `avancer_parcours` exige l’identifiant du premier pas et un bilan ancré par une citation exacte du tour utilisateur. La citation vient du dernier message : 1 à 500 caractères significatifs pour ajuster (une confirmation brève suffit), 8 à 500 pour avancer (un oui isolé ne prouve aucun passage). L’agent décide du sens de l’échange ; le serveur impose origine, séquence, version et bornes.

Une seule action de suivi par tour. Aucun argument modèle ne choisit compte, version observée, date, niveau cible ou URL. Échec ou interruption de génération : aucune écriture. Les tentatives natives reçoivent une réponse canonique : le texte du modèle ne peut annoncer une mutation non confirmée, même si un appel malformé accompagne une pratique valide.

Une déconnexion après commit retrouve le reçu avant toute réinterprétation par l’arc, le quota, une lecture ouverte ou la croissance historique. Un passage tenté exclut la seconde croissance ; une lecture de reçu indisponible inhibe aussi celle-ci, car le premier commit peut avoir réussi.

## Arbre et compatibilité
Le niveau projeté est le maximum du niveau historique des branches et du suivi. Reconnaître un pas avance d’une illustration, plafonnée à la dernière planche ; cela ne crée aucune branche, n’altère aucune intensité et ne déclare aucun rayonnement. Pause ou changement de cap conservent le chemin vécu. Une lecture en panne ne devient jamais une fausse graine : indisponible au premier chargement, dernier dessin connu conservé ensuite.

Les intentions personnelles « Si… alors… » et la carte interne de contexte restent distinctes. Le plan proposé par Anam n’est jamais attribué à l’utilisatrice.

## Accès, concurrence et cycle de vie
Lectures et documents sous JWT/RLS. Une RPC nommée réservée service_role autorise uniquement les deux commandes validées, recontrôle cible/source/consentement/majorité/détresse et ne donne aucun accès arbitraire aux tables. Cette exception empêche un navigateur de se donner le droit d’augmenter le niveau. Les verrous ordonnent mutation et révocation de consentement.

Les requêtes portent le compte qui a monté l’écran comme précondition, sans changer la cible issue de l’authentification. Un changement de compte remonte l’état client et refuse les anciennes requêtes. Un conflit de repères conserve le brouillon, affiche chaque valeur enregistrée différente et exige un choix avant une nouvelle sauvegarde.

Pause/reprise explicites, modification et effacement du texte personnel avec version. Aucun outil agent en pause ou détresse/72h. Les nouvelles tables entrent dans l’export complet et l’effacement du compte par cascade. Aucun texte personnel dans les URL, les journaux techniques ou le stockage navigateur durable.
