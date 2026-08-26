---
title: "Sprint Change Proposal — Refonte Moi, Anam, Mon arbre et coûts IA"
date: 2026-08-26
status: approved-for-implementation
workflow: bmad-correct-course
mode: batch
scope: major
approval_basis: "Demande explicite de Julian du 2026-08-26 : analyser, planifier, implémenter puis revoir ces corrections."
sources:
  - "_bmad-output/specs/refonte-moi-anam-arbre-2026-08-26/spec.md"
  - "_bmad-output/planning-artifacts/prds/prd-Anima-2026-07-21/prd.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-Anima-2026-07-22/ARCHITECTURE-SPINE.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-Anima-2026-07-21/EXPERIENCE.md"
  - "_bmad-output/planning-artifacts/epics.md"
---

# Sprint Change Proposal — 26 août 2026

## Décision

Le changement est **accepté comme une correction majeure de cap**, exécutée en mode batch. Il ne
demande ni retour arrière ni refonte du socle : il remplace une grammaire d'accueil qui contredit le
besoin exprimé, réconcilie Anam et Mon arbre avec leurs lieux propres, et transforme la demande de
« clé par utilisatrice » en son besoin réel — une comptabilité interne des coûts par utilisatrice,
avec une seule clé fournisseur côté serveur.

La livraison est volontairement hybride : **Moi/Psychologie, ouverture quotidienne d'Anam, arbre
canonique, navigation et centre de coût** entrent dans la correction immédiate ; **Big Five, moteur
Human Design et voix** restent des capacités ultérieures, chacune derrière ses preuves et ses portes.

## 1. Résumé du problème déclencheur

Le premier parcours ne répond pas aux questions les plus évidentes de l'utilisatrice : le produit
dit que l'Ennéagramme n'est pas passé sans montrer comment le passer, répète Anam dans « Moi » alors
qu'elle possède son lieu, et a dispersé astrologie, numérologie et psychologie entre des cartes et un
menu de compte dense. Le premier accès du jour à Anam n'est ni accueilli ni séparé du fil ancien. Le
fond de conversation montre un arbre décoratif qui nuit à la lecture. « Mon arbre » montre encore un
dessin ou une image qui ne correspond pas au handoff lunaire canonique, notamment à l'étape zéro.

Deux défauts transverses renforcent la perte de confiance : les clics ne donnent pas toujours un
retour immédiat et la sortie d'Aide peut envoyer vers une destination externe sans rapport ; enfin,
le coût IA n'est pas encore lisible par compte alors que la demande premium exige de l'attribuer.

La voix est un besoin réel mais **pas une extension mineure** : elle ajoute un egress audio, une unité
de facturation, des contraintes de consentement et, pour le TTS, un canal que les gardes lexicales ne
peuvent pas retirer une fois joué.

### Éléments factuels

- L'Ennéagramme actuel du produit est conservé : 18 items, couverture des 9 types, calcul
  déterministe, gestion des ex æquo et reprise persistée.
- Le dépôt `jt33120/client-anima-profile_psychologique` est accessible mais n'est pas une source à
  copier : son scoring Ennéagramme rend les types 1 et 9 impossibles, son Big Five court n'apporte pas
  de source psychométrique vérifiable, et son Human Design est une valeur codée en dur. Aucune licence
  exploitable n'a été établie pendant l'analyse.
- Un futur Big Five devra partir d'un instrument public et traçable, par exemple une forme IPIP
  validée, avec barème, inversion d'items, version et restitution documentés.
- Human Design devra être un moteur déterministe à partir des données de naissance, jamais un QCM ni
  une réponse inventée par un modèle. Validation des références, droits d'usage et moteur sont des
  préalables.
- L'architecture possède déjà `usage_ia`, l'attribution par utilisatrice et l'idempotence. Une clé
  fournisseur par cliente contredirait AD-2 et déplacerait un secret vers une surface ingérable.
- La recherche Mistral du 2026-08-26 confirme la faisabilité technique du STT batch et temps réel et
  du TTS. Elle ne vaut pas décision produit, DPA, preuve ZDR, région UE, test de latence ou validation
  de la voix.

### Snapshot Mistral vérifié le 2026-08-26

| Capacité | Référence officielle datée | Prix public observé | Latence annoncée | Décision Anam |
|---|---|---:|---:|---|
| STT batch | [`voxtral-mini-2602`](https://docs.mistral.ai/models/voxtral-mini-transcribe-26-02) | 0,003 $/min | À mesurer de « stop » au texte modifiable | Premier candidat : push-to-talk terminé, transcription relue, aucun envoi automatique |
| STT temps réel | [`voxtral-mini-transcribe-realtime-2602`](https://docs.mistral.ai/models/voxtral-mini-transcribe-realtime-26-02) | 0,006 $/min | Configurable sous 200 ms selon la [documentation audio](https://docs.mistral.ai/studio/audio/overview) | Pas en v1 : coût doublé, flux et jeton navigateur ajoutent des surfaces inutiles au besoin actuel |
| TTS | [`voxtral-mini-tts-2603`](https://docs.mistral.ai/models/voxtral-tts-26-03) | 0,016 $/1 000 caractères | ~90 ms modèle ; ~0,8 s au premier audio PCM selon la [documentation TTS](https://docs.mistral.ai/studio/audio/text_to_speech) | Recherche seulement ; éventuel bouton par tour après contrôle complet, jamais autoplay, clone ou full-duplex |

Les prix sont des paramètres de recherche, pas des règles métier gravées. Le modèle batch est un
service Premier ; les poids realtime sont annoncés Apache 2.0 et les poids TTS CC BY-NC 4.0. Ces
licences de poids ne prouvent ni les conditions de l'API, ni le DPA, ni la localisation effective du
traitement. Ces trois preuves restent des portes séparées.

## 2. Analyse d'impact

### 2.1 Epics et stories touchés

| Zone | État antérieur | Décision de changement |
|---|---|---|
| Epic 7 — accueil/socle | Bibliothèque de cartes, carte Anam, CTA Ennéagramme interdit dans 7.8 | Les décisions historiques restent lisibles, mais 7.7, 7.8 et 7.10 sont remplacées pour le nouveau cap par l'Epic 13 |
| Epic 9 — ce qu’Anam sait | Contexte serveur déterministe, Story 9.1 numérologie bloquée sur relecture d’Anima, refus explicite d’une boucle de tools choisie par le modèle | Conserver cette architecture : les nouveaux univers alimenteront Anam par contexte vérifié et borné, jamais par un agent fournisseur autonome ; ne pas attribuer les textes de numérologie avant validation |
| Epic 10 — coût IA | Vision juste, mais chantier large et entièrement backlog | Ajouter la tranche verticale 10.9 : registre financier interne par utilisatrice, sans clé individuelle |
| Epic 11 — arbre | Les stories 11.4 et 11.5 attendaient encore des arbitrages externes | Julian a tranché : étape zéro = graine lunaire ; pas de plafond métier à 13 ; 11.6 porte le moteur canonique |
| Epic 12 — voix | STT différé et refus catégorique du TTS en 12.5 | Garder tout le vocal en phase ultérieure ; remplacer le refus absolu par une étude go/no-go et un TTS opt-in strictement borné |
| Nouvel Epic 13 | Absent | « Moi » quotidien puis trois univers, Psychologie utilisable, menu et navigation structurés |
| Nouvel Epic 14 | Absent | Anam ouvre une seule session par jour civil parisien, avec séparateur « Aujourd'hui » et ciel seul |

Les stories déjà marquées `done` dans les epics historiques ne sont pas réécrites comme si elles
n'avaient jamais existé. Leur résultat peut être remplacé par les nouvelles stories ; leur statut
reste un fait historique.

### 2.2 Conflits et amendements PRD proposés

Le PRD n'est pas modifié dans cette passe de planification, mais son prochain amendement devra porter
les exigences suivantes :

| Référence | Avant | Après proposé |
|---|---|---|
| FR-034 | Anam ne se manifeste que pour un événement spécifique ; aucun message générique récurrent | Les notifications et relances restent exclusivement spécifiques. **Lors d'une ouverture explicite de la région Anam**, la première visite de chaque jour civil parisien crée toutefois une ouverture de séance unique ; ce n'est ni une notification ni une relance autonome |
| FR-090 — nouveau | — | « Moi » montre le quotidien puis trois portes égales : Astrologie, Numérologie, Psychologie. Human Design vit dans Psychologie, sans duplication au premier niveau. Les informations stables vivent dans ces univers et aucune mesure de complétude n'est affichée |
| FR-091 — nouveau | — | Psychologie expose un CTA nommé vers l'Ennéagramme existant. Tout nouvel instrument porte sa source, sa version et son barème ; Human Design utilise un moteur déterministe validé |
| FR-092 — nouveau | — | Le fil affiche un seul séparateur « Aujourd'hui » et une seule ouverture par jour civil `Europe/Paris`, de façon persistante et idempotente |
| FR-093 — nouveau | — | Chaque capacité IA est attribuable financièrement à une utilisatrice via un centre de coût interne ; une seule clé fournisseur reste côté serveur ; la sécurité est comptée financièrement mais exemptée du quota |
| FR-094 — nouveau | — | Le texte reste un canal complet. Toute voix est opt-in, désactivable, sans clonage d'Anima et sans lecture automatique ; l'audio ne part pas tant que les portes art. 9 ne sont pas prouvées |

FR-031 reste inchangé : une porte d'univers, un résultat psychologique et un arbre ne deviennent ni
score global, ni jauge, ni rang. NFR-003 et NFR-004 restent également inchangés : pas de conservation
audio et aucune inférence émotionnelle à partir de la voix.

### 2.3 Architecture et données

- **Aucune nouvelle clé par compte.** AD-2 reste invariant : un secret serveur, des lignes
  `usage_ia` attribuées par `user_id` et protégées par RLS.
- Le registre de coût doit distinguer capacité/opération, unité, quantité, modèle, identifiant et
  version du tarif, coût exact nullable, instant, statut premium au moment de l'appel, exemption de
  quota et clé d'idempotence. Un tarif inconnu vaut `null`, jamais zéro.
- Le jour d'Anam doit être une décision de domaine basée sur `Europe/Paris`, persistée avec une clé
  idempotente par utilisatrice et par jour. Recharge, multi-onglets, concurrence, passage de minuit et
  changement d'heure ne doivent pas créer deux ouvertures.
- Le rendu de l'arbre continue de séparer projection de domaine et scène (AD-7). L'asset canonique
  est porté comme moteur interactif ; la grande image d'ambiance n'est jamais utilisée comme arbre.
- Human Design, STT et TTS devront chacun passer par un port déterministe ou d'egress distinct. Aucun
  d'eux n'entre dans le contexte d'Anam avant qu'un résultat vérifié existe.
- L'effacement et l'export doivent continuer à couvrir `usage_ia` sans y introduire contenu de
  conversation, transcription ou donnée art. 9 supplémentaire.

### 2.4 UX

L'amendement daté du 2026-08-26 à `EXPERIENCE.md` constitue la décision UX : Issue B remplace la
bibliothèque, supprime la carte « Anam se manifeste », pose les trois univers et rétablit le CTA
Ennéagramme. La présente proposition ne modifie pas ce fichier ; elle transforme cette décision en
stories livrables et vérifiables.

## 3. Solution retenue et séquencement

### Vague immédiate — correction de confiance

1. Epic 13 : livrer « Moi », Psychologie, le menu groupé, les routes et leur feedback immédiat.
2. Epic 14 : livrer le ciel seul d'Anam, l'ouverture quotidienne idempotente et le séparateur daté.
3. Epic 11 : porter le moteur lunaire canonique, dont la graine à l'étape zéro et l'overflow sans
   plafond métier implicite.
4. Epic 10 / Story 10.9 : rendre le coût attribuable par utilisatrice sans toucher au secret
   fournisseur ni aux exemptions de sécurité.
5. Faire une revue adversariale et une vérification navigateur à 390, 768 et 1440 px avant clôture.

### Vague ultérieure — capacités qui demandent des preuves

1. Big Five : sélectionner une forme IPIP, documenter source/licence/barème et comparer le calcul à
   des vecteurs de référence avant de dessiner le résultat.
2. Human Design : établir les références, droits et données d'éphémérides, puis spécifier le moteur
   déterministe et ses jeux de validation. La porte reste honnêtement fermée jusque-là.
3. Epic 9 : faire entrer la numérologie puis, sur décision séparée, le texte du ciel quotidien dans
   le contexte serveur d’Anam après relecture et gardes anti-prédiction ; aucun modèle ne choisit
   lui-même un tool, car cela multiplierait egress art. 9 et latence avant le premier mot.
4. Voix : conserver d'abord le texte complet ; décider STT batch push-to-talk après DPA/ZDR/région,
   coût par minute et budget de latence ; n'étudier le TTS qu'après revue du contrôle de sortie.

Cette séquence évite de coupler une correction UI urgente à trois chantiers de validation. Elle ne
réduit pas le besoin : elle rend visible ce qui est disponible maintenant et nomme précisément ce
qui manque aux capacités futures.

## 4. Propositions de modification détaillées

### 4.1 « Moi » et Psychologie

**ANCIEN :** bibliothèque tournante d'objets quotidiens et stables, avec une carte Anam et un
Ennéagramme sans chemin d'action suffisamment explicite.

**NOUVEAU :** moment quotidien au-dessus du pli, puis trois portes de rang égal. Psychologie porte
le CTA `/enneagramme`, la reprise et le résultat existants ; les modules futurs sont nommés sans faux
calcul. Les données de compte, abonnement, droits et aide restent dans un menu groupé distinct.

**Motif :** séparer rythme quotidien, connaissance stable de soi et administration du compte ; faire
de toute absence un état actionnable.

### 4.2 Conversation quotidienne

**ANCIEN :** FR-034 interdisait tout message générique récurrent et le fil pouvait commencer par le
premier message de l'utilisatrice sans nouvelle journée visible.

**NOUVEAU :** l'interdiction demeure pour les notifications et relances. Sur la première ouverture
explicite de la région Anam du jour, le serveur attribue un bail exclusif puis persiste une seule
parole d'Anam : soit l'accueil générique, soit l'événement du moment portant lui-même cet accueil.
Le fil rend un seul séparateur « Aujourd'hui » à partir des horodatages persistés ; si la parole est
interactive, sa carte remplace ce même tour à identité stable au lieu d'ajouter une seconde bulle.

**Motif :** Anam ouvre le lieu relationnel sans devenir un système de sollicitation récurrente.

### 4.3 Arbre canonique

**ANCIEN :** arbitrage graine/tronc ouvert, plafond à treize branches en attente d'une réponse
externe, coexistence possible de représentations visuelles incompatibles.

**NOUVEAU :** l'étape zéro est la graine lunaire du handoff. Le port déterministe rend toutes les
branches ; les premières positions restent stables et l'overflow ne déplace pas les précédentes. Un
seul arbre interactif vit dans le ciel étoilé, avec vue liste et réduction de mouvement.

**Motif :** les deux portes externes ont été tranchées explicitement par le propriétaire produit.

### 4.4 Comptabilité IA

**ANCIEN :** demande formulée comme une clé créée par utilisatrice premium.

**NOUVEAU :** une clé Mistral serveur et un centre de coût interne par utilisatrice. Chaque opération
enregistre sa quantité native et son coût tarifé ; le statut premium est un contexte d'allocation,
pas un secret. Le compte actuel peut être premium à titre gracieux sans inventer un abonnement
Stripe.

**Motif :** satisfaire le suivi financier sans multiplier les secrets, casser AD-2 ou exposer le
fournisseur au navigateur.

### 4.5 Voix

**ANCIEN :** STT différé ; Story 12.5 demandant un refus catégorique et permanent du TTS.

**NOUVEAU :** tout l'Epic 12 reste hors de la vague immédiate. La 12.5 devient une recherche go/no-go
documentée. Une éventuelle 12.6 n'autorise qu'une écoute volontaire d'un tour déjà entièrement
validé, avec voix préréglée, jamais clonée, texte toujours visible, jamais d'auto-lecture, jamais en
détresse et jamais de conversation full-duplex.

**Motif :** Mistral rend la capacité techniquement possible ; le risque produit et conformité reste
à décider. Une impossibilité technique fausse serait aussi fragile qu'une activation prématurée.

## 5. Checklist Correct Course

| Contrôle | Statut | Conclusion / preuve |
|---|---:|---|
| 1.1 Déclencheur identifié | [x] | Retour d'usage explicite du 2026-08-26 |
| 1.2 Problème formulé | [x] | Navigation, actionnabilité, cohérence des lieux, arbre, coût et voix |
| 1.3 Évidence disponible | [x] | Inspection du produit, spec gelée, UX amendée, dépôt psychologique audité |
| 1.4 Impact immédiat | [x] | Epics 7, 10, 11, 12 et nouveaux Epics 13–14 |
| 2.1 Epic courant encore valable | [x] | Oui pour le socle ; stories contradictoires remplacées, pas annulées en silence |
| 2.2 Changements d'epics requis | [x] | Table de supersession et stories datées ajoutées à `epics.md` |
| 2.3 Epics futurs revus | [x] | Big Five, Human Design et voix sont séparés de la vague immédiate |
| 2.4 Nouveaux epics nécessaires | [x] | Epic 13 « Moi/Psychologie », Epic 14 « journée avec Anam » |
| 2.5 Ordre et dépendances revus | [x] | UI et domaine immédiats ; capacités à preuve ensuite |
| 3.1 Conflits PRD identifiés | [x] | FR-034 ; exigences manquantes FR-090 à FR-094 proposées |
| 3.2 Architecture impactée | [x] | Idempotence jour civil, schéma de coût, ports HD/audio, arbre canonique |
| 3.3 UX impactée | [x] | Amendment EXPERIENCE.md du 2026-08-26 déjà présent |
| 3.4 Autres artefacts impactés | [x] | Epics et sprint status mis à jour ; PRD/Spine à amender dans une passe dédiée |
| 4.1 Ajustement direct évalué | [x] | Retenu pour la vague immédiate |
| 4.2 Retour arrière évalué | [x] | Rejeté : il restaurerait précisément les incohérences signalées |
| 4.3 Réduction MVP évaluée | [x] | Retenue seulement comme phasage des capacités non prouvées |
| 4.4 Solution recommandée | [x] | Hybride : correction immédiate + moteurs/voix différés |
| 5.1 Résumé du problème | [x] | §1 |
| 5.2 Impact epic/artefacts | [x] | §2 |
| 5.3 Chemin recommandé | [x] | §3 |
| 5.4 Changements old/new | [x] | §4 et amendement `epics.md` |
| 5.5 Handoff et critères | [x] | §6 et §7 |
| 6.1 Checklist complète | [x] | Présente section |
| 6.2 Proposition exacte et actionnable | [x] | Stories en Given/When/Then ajoutées |
| 6.3 Approbation explicite | [x] | La demande du 2026-08-26 autorise analyse, plan, implémentation et revue |
| 6.4 Sprint status mis à jour | [x] | Entrées datées ajoutées sans effacer l'historique |
| 6.5 Handoff confirmé | [x] | Répartition ci-dessous ; portes externes restent nommées |

## 6. Handoff

| Responsable | Action |
|---|---|
| Développement | Exécuter Epics 13–14, 10.9 et 11.6 ; conserver les frontières et ajouter les preuves de tests |
| UX / produit | Vérifier le rythme quotidien, la hiérarchie du menu, les états honnêtes et le handoff lunaire aux trois largeurs |
| Architecture / sécurité | Revoir migration `usage_ia`, RLS, idempotence, exactitude tarifaire et non-régression art. 9 |
| Produit / conformité | Choisir l'instrument Big Five ; établir références/droits Human Design ; ratifier DPA/ZDR/région et clauses de voix avant tout audio réel |
| Revue | Revue adversariale du diff, puis tests unitaires, typecheck, lint et e2e proportionnés au risque |

## 7. Critères de succès du changement

- Une utilisatrice sans résultat voit « Passer mon test d'ennéagramme » et atteint le QCM existant ; le
  calcul actuel n'est pas remplacé par celui du dépôt de référence.
- « Moi » montre ciel/mantra puis les trois univers sans carte Anam, jauge ou état de complétude ; Human Design reste dans Psychologie.
- La première ouverture d'Anam du jour à Paris produit exactement une parole persistée et un
  séparateur ; un événement éventuel porte l'accueil dans cette même parole. Recharge,
  multi-onglets, minuit et DST n'en produisent pas deux.
- Aucun arbre décoratif n'est visible sous le fil d'Anam ; « Mon arbre » montre la graine lunaire à
  zéro puis le même moteur canonique, sans plafond métier silencieux à treize branches.
- Le menu réagit immédiatement, sépare produit/compte/droits et une sortie normale d'Aide revient
  dans l'application, jamais vers Météo France.
- Chaque opération IA connue est attribuable financièrement à une utilisatrice, avec coût exact ou
  inconnu explicite ; la détresse reste comptée financièrement mais ne débite aucun quota.
- Aucun Big Five, Human Design, STT ou TTS factice n'est présenté comme livré. La voix reste une phase
  ultérieure et le texte demeure suffisant à chaque tour.

## 8. Journal de décision

- **2026-08-26 — approuvé pour implémentation :** demande directe de Julian, spec créée en
  `ready-for-dev`, Issue B déjà choisie dans EXPERIENCE.md.
- **2026-08-26 — portée :** correction majeure, sans rebaseline du socle de sécurité.
- **2026-08-26 — suites documentaires :** intégrer FR-090 à FR-094 et l'amendement FR-034 au PRD,
  puis formaliser les ports Human Design/audio dans le Spine avant leur story d'implémentation.
