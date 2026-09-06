# Stories — carnet céleste

Contrat commun : [SPEC.md](SPEC.md) et [design-spec.md](../../../design/design-spec.md).

CC-1 à CC-5 décrivent la première livraison `40dcd225`. L'itération active CC-6 à CC-8 suit
[iteration-nocturne.md](iteration-nocturne.md) et [validation-nocturne.md](validation-nocturne.md).
La nouvelle direction remplace le défaut Papier initial; les autres invariants restent valides.

## CC-1 — Fondations visuelles et ambiance

CAP-1, CAP-3, CAP-4. Déployer le carnet ivoire/encre, les pastels, typographie et contrôles
partagés; conserver Nuit. Historique préservé, surcouche générée depuis design/tokens.json.

- Tokens générés reproductibles; parité historique inchangée.
- Focus, contrastes mesurés, cibles tactiles et mouvement réduit opérants.
- Fond, texte, papier et accents inspectés à 390 / 768 / 1440 px, Papier et Nuit.

## CC-2 — Accueil et navigation

CAP-1, CAP-2, CAP-3. Composer l'ouverture de carnet, clarifier ciel du jour et univers, restyler
navigation et profil sans changer les destinations.

- Date/mantra, lecture quotidienne et univers gardent un ordre clair aux trois largeurs.
- Navigation et dialogue de profil accessibles au clavier; focus rendu au déclencheur.
- Chargement, indisponibilité, contenu vide et texte dense restent intelligibles.

## CC-3 — Anam, univers et lectures

CAP-1, CAP-2, CAP-3. Harmoniser fil, composeur, chapitres, résumés et disclosures; préserver
messages, calculs et appels existants.

- Composeur visible au clavier mobile; aucune réponse masquée par une barre ou un décor.
- Provenance des messages et états absent/indisponible/refusé préservés.
- Lecture longue, vide, attente et erreur inspectés à 390 / 768 / 1440 px.

## CC-4 — Accès, compte et aide

CAP-1, CAP-2, CAP-3. Appliquer les fondations aux accès, consentements, réglages, données et aide;
maintenir actions et conséquences.

- Formulaires et messages restent compréhensibles, focusables et contrastés.
- Retour à Anima et Sortie rapide conservent leurs gestes distincts.
- États chargement/erreur/dense/vide vérifiés sur les composants concernés aux trois largeurs.

## CC-5 — Revue visuelle et livraison réversible

CAP-5, CAP-6. Capturer, critiquer, corriger, contrôler, déployer la branche et vérifier son identité.

- Deux tours de captures et critique à 390 / 768 / 1440 px, sans données sensibles.
- Lint et contrôles ciblés pertinents passent; limites explicites.
- Diff sans backend ni configuration distante; fichier préexistant exclu.
- URL Ready, SHA livré, baseline et commande de retour consignés dans deployment.md.

Chaque story d'interface utilise exclusivement les tokens de la source concernée, livre les
états vide/chargement/erreur/dense, vérifie les trois largeurs et conserve focus-visible.

## CC-6 — Nuit bleu ciel-violet, lotus et matière

CAP-1, CAP-3, CAP-4. Répondre à la direction utilisateur par une nuit riche dès la première
peinture, avec dégradés, textures, lotus/étoiles et rares touches chaudes.

- Sans choix enregistré, fond et barre système sont nocturnes avant hydratation.
- Une préférence Papier explicite reste respectée; le sélecteur fonctionne si le stockage échoue.
- Les décors sont derrière la lecture, ne captent aucun geste et cèdent au contraste renforcé.
- Contraste mesuré sur les fonds composés, motion réduite, focus et cibles tactiles vérifiés.
- Captures réelles des trois largeurs; tokens générés reproductibles et parité historique intacte.

## CC-7 — Accueil compact et hiérarchisé

CAP-1, CAP-2, CAP-3. Corriger l'ouverture trop grande et l'impression d'aplats signalées dans la
capture, en ramenant l'information utile dans le premier écran.

- Date, mantra et première lecture quotidienne apparaissent dans une ouverture raccourcie.
- Le premier écran mobile montre du contenu utile en plus de la marque et de la navigation.
- Lecture et univers se distinguent par la composition, les contours et la matière; pas par
  couleur seule. Tous les liens et états existants restent accessibles.
- Vérifier mantra long, contenu dense, attente/absence/erreur et dernier élément au défilement.
- Comparaison avant/après aux dimensions de capture utilisateur et à 390 / 768 / 1440 px.

## CC-8 — Lire et écrire dans Anam, clavier ouvert

CAP-2, CAP-3, CAP-5, CAP-6. Corriger le fil masqué au clavier par la géométrie et le défilement,
puis livrer l'itération avec sa nouvelle référence de retour.

- Clavier ouvert, le fil garde une zone de lecture et de défilement; composeur et Envoyer restent
  visibles sans recouvrement ni interception des appuis.
- Champ d'une ligne puis multi-ligne, fil vide/introduction, historique dense, réponse en cours
  et erreur restent utilisables.
- Fermer/réouvrir le clavier et changer de région restaure une scène sans vide persistant ni
  perte arbitraire du focus. Remonter le fil n'est pas annulé par un autoscroll continu.
- Simulation de VisualViewport distincte du viewport de mise en page, plus clavier mobile réel
  si disponible; chaque preuve indique sa méthode et ses limites.
- Aucun changement requête, action, message ou donnée; --prod normal et retour documenté vers
  `dpl_DFEd5WyGwpeoQM5fbnTDFUNKC4z4` après vérification du SHA et de l'alias.
