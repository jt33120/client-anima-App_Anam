# Itération nocturne — direction issue du retour utilisateur

Cette direction remplace le défaut Papier de la version `40dcd225`; elle conserve le périmètre
front, la hiérarchie typographique et les protections déjà établies. Le pilote a reçu deux
captures utilisateur : accueil trop grand/plat et fil Anam masqué par le clavier. Le présent
document transcrit ces constats; leur correction reste à vérifier sur le rendu.

## Ambiance

Nuit par défaut, dominée par bleu ciel et violet, avec dégradés et texture perceptible. Lotus
et étoiles composent le fond; les notes chaudes restent rares et subordonnées à cette palette.
Les mots et les gestes gardent des surfaces lisibles. Le décor ne doit ni intercepter le toucher
ni traverser les lettres au point de diminuer leur contraste.

Les assets existants ont priorité; tout nouvel asset possède une provenance déclarée. Les
textures sont statiques ou discrètes; aucune animation cyclique ne conditionne la compréhension.
Contraste renforcé et mouvement réduit restent prioritaires. Les pastels servent de lumière
et d'accent dans la nuit plutôt que de multiplier des aplats occupant tout l'écran.

Sans choix enregistré, la première peinture et la couleur de barre système sont nocturnes.
Une préférence Papier explicite demeure possible et réversible; le refus de localStorage
ne doit pas bloquer ce choix.

## Accueil

Réduire la place du grand titre, des marges et de l'ouverture décorative. La date, le mantra
et la première information quotidienne doivent former une séquence courte, avec au moins du
contenu utile visible dans le premier écran mobile. La structure distingue lecture du jour et
univers grâce à la profondeur, aux contours et à la matière; la couleur seule ne suffit pas.

Le contenu dense et les messages d'indisponibilité gardent leur place. Les éléments restent
ordonnés de la même façon sur téléphone et bureau; aucune destination n'est sacrifiée à la
composition plus compacte.

## Anam avec clavier

Le champ de saisie visible ne suffit pas : le dernier échange doit garder une zone de lecture
et le fil doit permettre de remonter les messages. L'ouverture du clavier réduit l'espace
visible disponible; titre, portrait et marges ne peuvent absorber cet espace au détriment du fil.

Composer, lire et revenir dans l'historique restent possibles sans élément recouvert par la
navigation, le clavier ou le composeur lui-même. Le texte multi-ligne ne pousse pas le dernier
message hors d'atteinte. Après fermeture du clavier, la scène récupère sa hauteur sans vide
persistant, perte de focus arbitraire ni saut empêchant la lecture.

Les correctifs restent de présentation : aucun changement des appels, messages, données,
écritures ou états métier. Les états vide, chargement, erreur et dense sont toujours distincts.
