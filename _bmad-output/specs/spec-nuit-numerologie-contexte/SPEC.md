---
id: SPEC-nuit-numerologie-contexte
companions:
  - ../../implementation-artifacts/spec-nuit-numerologie-contexte.md
sources: []
---
# Nuit et numérologie personnelle

## Why
La personne doit lire les repères utiles et une synthèse accessible sans parcourir des listes techniques. Le fondateur demande une livraison en production incluant une mémoire Anam fondée uniquement sur une analyse explicitement jugée pertinente.

## Capabilities
- **CAP-1** : Nuit au lancement et dans la navigation, sans option Papier ; une ancienne préférence Papier ne restaure pas ce mode.
- **CAP-2** : Astrologie présente les trois repères avant la carte natale ; le bloc autonome « Ce qui manque et pourquoi » disparaît.
- **CAP-3** : Numérologie commence par chemin de vie, puis année personnelle ; les autres nombres restent repliés.
- **CAP-4** : Deux résumés IA proposent guidance annuelle/vision à long terme et portrait symbolique conditionnel, avec états de chargement, erreur et réessai.
- **CAP-5** : Une note de pertinence de 1 à 5 peut être enregistrée ; seule la note 5 permet un partage explicite et révocable avec Anam. Une note inférieure retire immédiatement ce partage.
- **CAP-6** : Les nombres du nom utilisent les prénoms et le nom de naissance déjà facultativement renseignés ; les informations brutes ne sont pas envoyées au modèle.
- **CAP-7** : Migrations appliquées, tests et compilation réussis, changements intégrés sur main et déploiement exact vérifié.

## Constraints
- Calculs déterministes et lectures symboliques séparés : aucun diagnostic ou portrait factuel déduit des nombres.
- Consentement art.9 valide vérifié sur lecture, génération, écriture et contexte ; données limitées au propriétaire, exportables et effaçables.
- Calculs année/nombres côté serveur ; client incapable de substituer les nombres ou le texte généré. Génération bornée et métrée.
- Source changée ou nouvelle année : ancienne analyse/notation/autorisation inutilisable. Aucun partage réactivé implicitement.
- Choix accessibilité conservés ; aucun secret ni donnée personnelle dans captures, journaux et fixtures.

## Non-goals
Nouveaux fournisseurs, collecte obligatoire de noms, déductions de santé/religion/sexualité, entraînement sur les données, modifications de compte ou abonnements.

## Success signal
Sur mobile en production, la personne peut lire les deux repères, créer les lectures puis les noter. La conversation reçoit uniquement le portrait issu du serveur et partagé à 5/5, comme une hypothèse symbolique ; retirer le partage ou modifier les données l’exclut.

## Assumptions
La première génération suit un clic explicite, puis le cache est affiché aux visites suivantes. La notation porte sur le portrait ; la guidance annuelle reste une lecture distincte.
