/** A contemplative illustration series. These stages never enter the personal projection. */
export interface PlancheMetamorphose {
  readonly id: string;
  readonly titre: string;
  readonly texte: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export const PLANCHES_METAMORPHOSE: readonly PlancheMetamorphose[] = [
  {
    id: "graine", titre: "La graine", texte: "Tout l’arbre tient déjà dans ce petit commencement.",
    src: "/marque/metamorphose/01-graine.webp", width: 1024, height: 1536,
    alt: "Une graine nacrée aux reflets bleu ciel et lilas repose dans la nuit.",
  },
  {
    id: "eclosion", titre: "L’éclosion", texte: "La coque s’entrouvre. La vie trouve son passage.",
    src: "/marque/metamorphose/02-eclosion.webp", width: 1024, height: 1536,
    alt: "La même graine s’ouvre délicatement et laisse apparaître un premier germe.",
  },
  {
    id: "enracinement", titre: "Les premières racines", texte: "Avant de s’élever, quelque chose apprend à s’ancrer.",
    src: "/marque/metamorphose/03-enracinement.webp", width: 1024, height: 1536,
    alt: "Des racines fines naissent de la graine entrouverte et se ramifient sous elle.",
  },
  {
    id: "pousse", titre: "La première pousse", texte: "Un élan vers le ciel, relié à ce qui grandit en profondeur.",
    src: "/marque/metamorphose/04-pousse.webp", width: 1024, height: 1536,
    alt: "Une jeune tige porte ses premières feuilles pastel au-dessus d’un petit réseau de racines.",
  },
  {
    id: "jeune-arbre", titre: "Le jeune arbre", texte: "La tige devient tronc. Les premiers chemins se dessinent.",
    src: "/marque/metamorphose/05-jeune-arbre.webp", width: 1024, height: 1536,
    alt: "Le jeune arbre déploie ses premières branches, reliées à son tronc torsadé et à ses racines.",
  },
  {
    id: "deploiement", titre: "Le déploiement", texte: "Les racines s’étendent. Les branches prennent leur ampleur.",
    src: "/marque/metamorphose/06-deploiement.webp", width: 1024, height: 1536,
    alt: "Le même arbre développe un tronc plus puissant et une ramure ouverte de feuilles bleu-lavande.",
  },
  {
    id: "canopee", titre: "L’arbre de vie", texte: "Racines, tronc et couronne : un seul mouvement vivant.",
    src: "/marque/metamorphose/07-canopee.webp", width: 1024, height: 1536,
    alt: "Un arbre majestueux à l’écorce nacrée relie de puissantes racines à une large canopée pastel.",
  },
  {
    id: "illumination", titre: "La pleine lumière", texte: "La lumière traverse l’arbre, des racines jusqu’aux feuilles.",
    src: "/marque/metamorphose/08-illumination.webp", width: 1024, height: 1536,
    alt: "Une lumière bleu ciel parcourt l’écorce du même arbre et illumine sa couronne lavande.",
  },
];
