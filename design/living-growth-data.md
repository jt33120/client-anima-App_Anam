# Origine et raccordement de la croissance personnelle

Audit du 7 septembre 2026, sur les fichiers et l’historique Git locaux. Aucune donnée de compte
ni configuration distante n’a été consultée ; cet audit ne prouve pas l’état des migrations en production.

Le commit `2f7dc1a` du 24 juillet 2026 introduisait `ProjectionScene.eveil`, un scalaire interne
0–100 destiné à être calculé depuis le parcours lors de l’Epic 4. Sa valeur était alors un
placeholder fixe, `62`. Le commit `efe7c16` du 4 août le remplace par les branches projetées et
conserve `62` pour le seul décor. Aucune formule globale de maturité livrée n’a été retrouvée.

Le prototype `images/assets/design_handoff_arbre_de_vie/README.md:24` et son fichier
`Arbre de Vie.dc.html:35` documentent bien un dessin continu `progress` de 0 à 100 : tronc,
racines, ramure, feuillage puis éveil. Il s’agit d’un paramètre Canvas et de 101 positions
entières possibles, pas de cent images. Le handoff lunaire, introduit dans le même commit
du 4 août, choisit ensuite une illumination indépendante par branche. L’avertissement
« périmé » de l’ancien README a été ajouté le 25 août dans `1fe6e2d`.

Aujourd’hui, `lib/scene/projection.ts:20` expose l’ID, l’état et l’intensité de chaque branche.
`chargerProjectionArbre` dans `lib/safety/projection-arbre.ts:125` les charge depuis les données
persistées. La feuillaison avance par `0.2`, au plus une fois par jour civil Paris et par branche,
avec idempotence et verrou SQL (`0025_branche_cycle_vie.sql:215`, corrigée par
`0026_branche_cycle_correctifs.sql:20`). La pleine lumière reste une déclaration explicite ;
elle peut arriver dès la naissance sans feuillaison préalable. Le tronc incomplet indique
l’absence d’heure de naissance, sans rapport avec une maturité.

Le retour utilisateur actuel autorise une croissance personnelle du dessin. La règle validée
pour les 35 illustrations vit uniquement dans `render/arbre/croissance-personnelle.ts` :

- Une branche distincte apporte une unité ; sa feuillaison ajoute `floor(10 × intensité)` unités.
- L’addition est plafonnée à l’indice 23. L’indice 0 reste la graine ; les images 0–3 sont conservées.
- À structure 23 seulement, chaque branche réellement rayonnante ajoute une nuance lumineuse,
  dans la limite de onze : indices 24–34. Les huit premières nuances conservent leurs indices
  24–31 ; neuf, dix puis onze branches rayonnantes ouvrent les trois ajouts célestes, aux indices
  32–34. Les 32 illustrations précédentes restent identiques. Une déclaration précoce ne saute pas directement
  à l’arbre adulte ; son état reste accessible dans la fiche et les repères personnels.
- Les doublons d’ID fusionnent leurs maxima ; une naissance ignore une intensité incohérente.
  Intensité non finie → 0, valeurs finies bornées à 0–1, identifiants ou états invalides ignorés.
  Une tolérance de `0.000001` après multiplication par dix absorbe l’arrondi du type SQL `real`.
- Ces dixièmes sont une précision du dessin. Le pas backend de `0.2` reste inchangé. Aucun
  temps écoulé, nombre de connexions, texte, score affiché ou stockage local n’intervient.

Les trois ajouts sont accessibles au dessin personnel : la création d’une branche
(`0037_branche_naissance_premium.sql:85`) ne fixe aucun plafond de nombre, et le chargement
(`0025_branche_cycle_vie.sql:350`) sert toutes les branches possédées sans `LIMIT`.
La déclaration de rayonnement (`0025_branche_cycle_vie.sql:308`) n’a pas de quota de branches.
Cette vérification porte sur le code et les migrations versionnés, sans consulter de compte réel.

Une moyenne ferait rétrécir l’arbre lors d’une nouvelle naissance : elle est écartée. La règle
consomme les branches déjà réconciliées par `ArbreInteractif`, conserve les IDs et ne remplace
ni leurs états ni les protections de lecture. Les ancres doivent partager le cadrage de la
planche affichée ; poser les anciennes coordonnées sur une pousse créerait des cibles dans le vide.

La feuillaison est écrite dans `after()` (`app/api/anam/message/route.ts:398`), sans notification
de mise à jour au client. Avant ce correctif, seul `onBrancheCreee` déclenchait un
`router.refresh()` dans `render/scene-dom.tsx:810`. Rafraîchir à l’entrée de Mon évolution
permet de récupérer les intensités déjà enregistrées, sans toucher aux routes API. Un simple
rafraîchissement à la fin du stream ne garantit pas que le travail différé soit terminé.
