# Pratiques Anam : recherche, sources et périmètre

Recherche et vérification du code le 8 septembre 2026. Ce document décrit le catalogue de `lib/domain/pratiques.ts` et distingue les outils existants des imports envisagés.

## Les huit exercices intégrés

Les consignes françaises sont des textes originaux Anam. Les sources éclairent les méthodes générales ; leurs scripts, illustrations, enregistrements et questionnaires ne sont pas importés. Les durées sont des indications éditoriales, ajustables par la personne.

| Identifiant | Pratique | Durée | Méthode et source primaire |
|---|---|---:|---|
| `respiration-douce` | Respirer doucement | 5 min | Souffle confortable, sans rétention ni respiration forcée. [NHS, respiration et stress](https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/). |
| `ancrage-sensoriel` | Revenir au présent | 2 min | Repérer un détail extérieur et un appui accessible. [NHS, pleine conscience](https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/), [OMS, guide du stress](https://www.who.int/publications/i/item/9789240003927). |
| `pause-attention` | Une pause d’attention | 3 min | Choisir un repère, observer et y revenir librement. [NHS, pleine conscience](https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/). |
| `meteo-interieure` | Ma météo intérieure | 2 min | Nommer un ressenti, sa place et un besoin possible. [OMS, guide du stress](https://www.who.int/publications/i/item/9789240003927). |
| `recul-pensee` | Prendre du recul sur une pensée | 3 min | Observer une pensée comme un événement mental et choisir son prochain geste. [VA Whole Health, relation aux pensées](https://www.va.gov/wholehealthlibrary/passport/chapter-12.asp). |
| `geste-bienveillant` | Me parler avec douceur | 3 min | Trouver des mots respectueux et un geste de soutien. [Kristin Neff, autocompassion](https://self-compassion.org/practices/general-self-compassion-break-2/). |
| `valeur-petit-pas` | Un petit pas vers ce qui compte | 5 min | Relier une valeur personnelle à une action réaliste. [VA Whole Health, ce qui compte pour soi](https://www.va.gov/wholehealth/circle-of-health/me.asp). |
| `savourer-instant` | Savourer un instant | 3 min | Accorder de l’attention à un détail agréable ou neutre. [UC Berkeley, Savoring Walk](https://ggia.berkeley.edu/practice/savoring_walk). |

« Savourer un instant » est le choix final du huitième exercice. La source Berkeley décrit une marche quotidienne d’environ vingt minutes pendant une semaine dans ses instructions. Le format Anam, court et immobile, n’a pas été étudié dans ce protocole ; aucun bénéfice équivalent n’est revendiqué.

## Ce que les sources permettent d’affirmer

Ces méthodes constituent des pistes d’exploration personnelle. Elles ne valident pas les exercices réécrits, leur durée, leur sélection par Anam ou le chatbot comme traitement. Le [NCCIH](https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety) décrit une recherche hétérogène et des expériences parfois défavorables. Les formulations produit restent concrètes : faire une pause, observer, explorer, choisir un geste.

La personne peut garder les yeux ouverts, passer une étape, choisir un sens accessible et arrêter. La respiration reste naturelle, sans objectif à réussir. Une gêne appelle l’arrêt de l’exercice. Aucun exercice ne demande de revivre un traumatisme, de contester une violence vécue ou de chercher du positif à tout prix. Les protections existantes en cas de détresse restent prioritaires.

## Questionnaires déjà disponibles : vérification du dépôt

Les deux entrées du catalogue ouvrent des espaces existants. Aucun nouvel instrument psychométrique externe n’est importé dans cette livraison.

| Entrée | Contenu réellement présent | Provenance, version et limites |
|---|---|---|
| `big-five` → `/big-five` | Un questionnaire fonctionnel de 20 situations, quatre par facteur, dont deux inversées. Réponses de fréquence sur quatre niveaux, avec « Je ne sais pas ». Résultat en trois positions par axe. | Jeu interne décrit dans `lib/domain/big-five-items.ts:5`, daté du 3 septembre 2026. Ce n’est pas une version IPIP identifiée. Aucune étude de validation, norme de population ou licence d’instrument tiers n’est référencée dans les fichiers examinés. |
| `enneagramme` → `/enneagramme` | Un questionnaire de 18 situations, deux par type, avec sauvegarde/reprise. Une hypothèse conversationnelle et un résultat antérieur peuvent aussi être affichés selon l’état du compte. | Jeu interne décrit dans `lib/domain/enneagramme-items.ts:4`, associé aux stories 5.5 et 13.8 ; le commentaire de conception cite une décision du 13 août 2026. Aucun instrument externe nommé ni licence tierce n’est attesté dans ces fichiers. L’introduction le présente comme exploratoire. |

Preuves d’accès : `app/big-five/page.tsx:130` instancie `QuestionnaireCourt` ; `app/enneagramme/page.tsx:141` distingue hypothèse, résultat et questionnaire. Les deux parcours demandent l’authentification et le consentement existants.

Le Big Five utilise un barème interne de moyenne par axe avec seuils en trois positions (`lib/domain/big-five.ts:129`). L’ennéagramme peut ne retenir aucun type en cas d’égalité ou d’incertitude (`lib/domain/enneagramme.ts:131`). Ces règles de calcul ne constituent pas une validation psychométrique. Une hypothèse conversationnelle ne doit pas être présentée comme la passation du questionnaire.

Les cinq minutes affichées pour chacun dans le nouveau catalogue sont une estimation éditoriale, sans mesure de temps de passation retrouvée. Les introductions existantes annoncent vingt situations ou un test court et la possibilité de reprendre. Il faut attribuer ces deux questionnaires à leur implémentation interne ; la permission IPIP ne prouve pas leur provenance ni leurs droits.

## Filière d’import ultérieur

**IPIP est une piste documentée, pas un import déjà réalisé.** Le [site officiel IPIP](https://ipip.ori.org/newPermission.htm) autorise les usages commerciaux et non commerciaux de ses items, échelles et inventaires placés dans le domaine public. Son [répertoire des traductions](https://ipip.ori.org/newItemTranslations.htm) référence notamment un Big Five de 50 items en français canadien et une adaptation européenne française de l’IPIP-NEO de 300 items.

Avant tout ajout, sélectionner une échelle précise et sa version linguistique, conserver les références, vérifier les conditions de la traduction et le barème documenté. Une sélection improvisée de questions ou une traduction libre ne doit pas être présentée comme un questionnaire validé. Des percentiles exigeraient des normes adaptées à la population concernée.

Le [WHO-5 publié en 2024](https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01) et le [guide OMS du stress](https://www.who.int/publications/b/53604) portent une licence CC BY-NC-SA. La [politique de droits de l’OMS](https://www.who.int/about/policies/publishing/copyright) demande une permission pour les usages commerciaux de ses contenus. Ils restent des références ; leurs items, scripts et médias ne sont pas repris dans Anam.

Le [site officiel PHQ](https://www.phqscreeners.com/) présente PHQ et GAD-7 comme des outils de repérage clinique. Leur intégration, leurs permissions exactes et le parcours d’accompagnement associé nécessiteraient un travail séparé. Ils ne sont pas ajoutés ici.

## Limite de cette étape

Cette livraison rend huit pratiques originales et les deux questionnaires existants accessibles depuis un catalogue et recommandables dans le chat. Une proposition ne vaut ni démarrage ni exercice accompli. Les notes privées ne sont jamais transmises. Le retour au chat prépare seulement le nom de la pratique ; la personne écrit et envoie elle-même ce qu’elle souhaite partager. Les cinq repères Big Five déjà enregistrés rejoignent le contexte conversationnel sous JWT, avec leur statut explicite et les limites du questionnaire interne. Aucun import automatique de quiz, plan de suivi longitudinal ou changement de niveau de l’arbre ne fait partie de cette étape.
