# Revue indépendante — itération nocturne

2026-09-06. Référence avant changements : `40dcd22593c6c69737def3641f51f62c57b7a63c`.
La revue des points examinés ne conserve aucun défaut bloquant après les corrections ci-dessous.
La capture finale et l'identification du prochain déploiement restent des étapes de livraison.

## Contraste sur les vrais fonds

La première combinaison de radiaux et d'illustration ne respectait pas AA pour le texte
secondaire : borne de 3,47:1 en Nuit sur pixel blanc et 3,82:1 en Papier sur pixel noir.
Le décor est désormais limité à **0,14 en Nuit et 0,02 en Papier**. La vérification compose les
couches radiales dans leur ordre de peinture puis applique les pixels noir et blanc extrêmes.
Les minima mesurés après correction sont **4,94:1 en Nuit et 4,56:1 en Papier** pour le texte
secondaire, au-dessus du seuil 4,5:1.

`tests/carnet-contraste.test.ts` compte **52 tests réussis**, incluant les paires de base, les
arrêts et intermédiaires des gradients carte/mantra, les radiaux superposés, les pixels extrêmes
de l'illustration, le mélange du gradient d'action et la navigation sélectionnée. Les proportions
des mélanges sont lues dans les tokens. Lint du fichier et `git diff --check` passent.

Mesure Chromium du mode contraste système renforcé : fond Papier, texte secondaire renforcé,
décor et illustration à opacité zéro, gradient d'action remplacé par l'accent uni. Le contrôle
d'accessibilité reste prioritaire sur le thème et le décor.

## Accueil et séparation du lotus

Captures examinées en Nuit et Papier à **390 × 844** : l'ouverture occupe environ **152 px**
(y=76 à y=228). Les boîtes de texte terminent à x=195 et le lotus commence à x=195 : aucune
superposition entre les textes et cette illustration. Le mantra est visible avant la première
carte quotidienne, qui commence vers y=401. Aucun débordement horizontal mesuré.

La capture Nuit montre une matière bleu-violet, les étoiles et le lotus avec une petite touche
chaude au centre. Le titre et la lecture ont des espaces distincts. Les contrôles restent
visibles dans la barre supérieure et la navigation basse.

## Clavier et contrôles d'intégration

Le pilote rapporte **603 tests de rendu réussis dans 49 fichiers**, ainsi que lint et TypeScript
réussis. La correction donne à la scène une seule géométrie issue du viewport visible; le
composeur ne retranche plus une seconde hauteur de clavier. Le titre et la navigation basse
cèdent de la place lorsque le clavier est détecté, et le champ est borné à trois lignes.

Preuves du pilote et de l'agent conversation : simulations **WebKit et Chromium** avec viewport
de mise en page 844 px, viewport visible 430 px et offsetTop 56 px; cas Android dont la fenêtre
est déjà réduite à 430 px. Mesures : fil **252 px**, composeur **98 px**, marge basse **8 px**,
aucun débordement. Ces cas couvrent précisément la double soustraction et le décalage qui ne
sont pas reproduits par une simple réduction du viewport de page.

**Limite explicite : aucun clavier iOS physique n'a été essayé.** Les simulations contrôlées
et moteurs de navigateur ne prouvent pas tous les comportements du clavier matériellement
ouvert, notamment ses animations et barres système. Les captures finales et le script versionné
du pilote complètent ce rapport; ne pas transformer leur résultat en une preuve sur appareil.

## Portée et livraison

La revue du diff ne trouve aucun changement dans API, lib, Supabase, proxy, configuration Next,
package ou configuration Vercel. Les corrections portent sur palette, composition, défilement,
géométrie du viewport et focus; les contrats métier restent en place.

L'écart distant 0091–0093 appartient à la baseline antérieure, déjà documentée. Cette tranche
ne modifie pas la base et ne revendique pas un schéma distant aligné. Déployer le commit depuis
une archive propre via **`vercel deploy --prod` normal**, avec contrôle de promotion inchangé.
Si ce contrôle bloque, respecter son verdict. `opencode.json` reste préservé hors livraison.

La référence de retour vérifiée est `dpl_DFEd5WyGwpeoQM5fbnTDFUNKC4z4`, associée à `40dcd225`;
[deployment.md](deployment.md) conserve la commande et l'ancienne référence. Vérifier le
nouveau SHA, Ready et l'alias public après publication. L'autorisation utilisateur de pousser
et publier est déjà acquise.
