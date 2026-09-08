# Vérification du parcours piloté par Anam

Date : 8–9 septembre 2026. Base : `092794c` (pratiques et outils de recommandation). Travail local ; aucune migration distante ni publication.

## Résultat fonctionnel
La halte `/parcours` regroupe le cap, une synthèse, trois prochains pas maximum, les trois repères personnels et l’historique des passages. Les repères appartiennent à l’utilisatrice ; Anam peut ajuster le plan et reconnaître le premier pas depuis un tour utilisateur enregistré. Le passage avance une illustration de l’arbre, une seule fois, sans fabriquer de branche ou de rayonnement. Accès directs depuis le chat, Pratiques et Explorer ; pause/reprise et brouillons de retour modifiables.

Le plan et les repères ne remplacent ni les intentions personnelles des branches ni la carte interne de contexte. Aucun calendrier, score, notification ou pièce jointe n’est ajouté.

## Vérifications automatisées
- Suite Vitest complète : **416 fichiers et 6 756 tests passent** sur le code final (`/tmp/anam-parcours-vitest-validation.log`, 47,71 s).
- Correctifs finaux du transport, de l’identité montée, des conflits et des arguments Unicode : **105 tests passent sur 8 fichiers** (`/tmp/anam-parcours-correctifs-final.log`). La suite globale finale inclut également la correction des confirmations brèves et la preuve Unicode.
- `npm run lint`, TypeScript et `npx next build` réussissent. Derniers journaux : `/tmp/anam-parcours-lint-complet-final.log`, `/tmp/anam-parcours-tsc-complet-final.log`, `/tmp/anam-parcours-build-complet-final.log`.
- `graft build` puis `graft check` : graphe en phase avec le code. Couche déterministe disponible ; aucune génération de résumés par modèle nécessaire.

Un passage global lancé en même temps que le build a signalé un échec du test existant de consentement dans `formulaires-qa.test.tsx`. Ses 13 tests repassent isolément, puis les 6 756 tests repassent sans build concurrent ; aucun code du consentement n’a été modifié.

## Données et concurrence réelles
La migration `0101_suivi_anam.sql` est appliquée transactionnellement à Supabase local. Les tables et les RPC sont vérifiées avec des comptes synthétiques et leurs vrais jetons : isolation, absence de droit de mutation agent dans le navigateur, source journal possédée, bornes, état en pause, détresse et fenêtre de 72 h, CAS, idempotence, conflit de commande, exports et cascade d’effacement.

Le catalogue RLS et les tests SQL du suivi passent ensemble (69 tests). Une course à trois transactions vérifie aussi qu’une révocation de consentement attend les verrous de la mutation déjà engagée ; après révocation, la mutation suivante est refusée. Le registre local de migration correspond à la source. Le CLI local installé refuse les clés passkey/webauthn du fichier de configuration : l’application SQL locale s’est faite via PostgreSQL, sans reset ni secret distant.

## Revue et corrections
Deux passes indépendantes ont conduit aux protections suivantes :
- Reçu retrouvé après journal/sécurité, avant quota, arc, lecture ouverte et effets différés. Une panne après commit ne peut entraîner ni nouveau passage ni seconde croissance historique.
- Prose native retenue et remplacée par un reçu canonique : aucun faux succès si la commande est rejetée, tronquée, mélangée à une pratique ou interrompue.
- Précondition du compte monté sur les requêtes de suivi et de chat ; remontage des composants lors d’un changement de compte.
- Comparaison explicite des repères en conflit avec choix par champ ; aucun brouillon écrasé en silence.
- Lecture d’arbre indisponible distincte d’un niveau nul confirmé ; conservation de l’illustration connue après une panne.
- Arguments Unicode conformes aux limites métier acceptés dans un tampon de 8 192 unités, toujours borné.

## Interface
**Sept parcours Playwright passent ensemble** en 43 secondes : quatre cas Mon parcours et trois cas Pratiques (`/tmp/anam-parcours-pratiques-e2e-final.log`).

La [revue visuelle](../../design/reviews/parcours/README.md) détaille les deux passes à 390, 768 et 1440 pixels : vide, chargé, formulaire, erreur, carte de chat, conflit entre deux onglets et cap long sans espaces. Les comptes et les contenus utilisés sont synthétiques. La carte de chat est vérifiée avec un transport simulé ; les écritures et la concurrence du parcours utilisent les RPC locales réelles.

## Fournisseur et livraison
Les sondes passent par l’adaptateur Mistral réel, avec des messages synthétiques et le modèle configuré pour le test privé, `ministral-14b-2512`. Elles sont distinctes des tests du transport simulé. Aucun secret ni contenu de compte réel n’est journalisé. La création après confirmation et le passage suivant sont tous deux observés comme appels natifs acceptés par le résolveur. Le modèle peut demander une confirmation lors de la première formulation du cap ; cette limite de sélection spontanée reste explicite. Une première sonde rejetait la création parce que le modèle citait la demande ancienne plutôt que le message de confirmation courant. Le descriptif de preuve a été précisé et la même sonde passe ensuite (1 appel natif `ajuster_parcours`, 3 035 tokens entrée / 110 sortie, `/tmp/anam-suivi-confirmation-corrigee-live.log`). `avancer_parcours` est natif et validé dans `/tmp/anam-suivi-confirmation-resultats.json`. Le serveur conserve le contrôle strict de source et n’annonce le succès qu’après confirmation de l’écriture.

La livraison reste locale. La migration distante `0101` devra précéder le déploiement applicatif ; le build réalisé ici vérifie la compilation et les routes, pas une promotion de production. Aucun paramètre fournisseur ni accès de production n’a été modifié.
