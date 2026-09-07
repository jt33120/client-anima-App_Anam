/** Shared artwork for the personal tree and its separate growth explorer. */
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
    id: "nouvelles-feuilles", titre: "Les nouvelles feuilles", texte: "Deux feuilles s’ouvrent. La pousse prend doucement sa place.",
    src: "/marque/croissance/05.webp", width: 1024, height: 1536,
    alt: "La même pousse gagne deux petites feuilles et conserve sa graine nacrée.",
  },
  {
    id: "tige-vivante", titre: "La tige s’affirme", texte: "Un peu plus de tenue, sans perdre la souplesse.",
    src: "/marque/croissance/06.webp", width: 1024, height: 1536,
    alt: "La tige s’épaissit légèrement et porte de nouvelles feuilles bleu-lilas.",
  },
  {
    id: "premier-rameau", titre: "Le premier rameau", texte: "Un premier chemin se dessine à côté de la tige.",
    src: "/marque/croissance/07.webp", width: 1024, height: 1536,
    alt: "Un court rameau naît du jeune tronc nacré, au-dessus des racines fines.",
  },
  {
    id: "ramification", titre: "La deuxième ramification", texte: "Les chemins se répondent, chacun à sa manière.",
    src: "/marque/croissance/08.webp", width: 1024, height: 1536,
    alt: "Une seconde ramification équilibre la jeune pousse et son feuillage pastel.",
  },
  {
    id: "premier-bois", titre: "Le bois prend forme", texte: "La tige devient peu à peu un bois vivant.",
    src: "/marque/croissance/09.webp", width: 1024, height: 1536,
    alt: "Une première fourche apparaît sur un très jeune tronc à l’écorce claire.",
  },
  {
    id: "branches-ouvertes", titre: "Les branches s’ouvrent", texte: "L’espace s’élargit autour du même élan.",
    src: "/marque/croissance/10.webp", width: 1024, height: 1536,
    alt: "Les deux premières branches s’allongent et portent davantage de feuilles.",
  },
  {
    id: "equilibre", titre: "L’équilibre se dessine", texte: "Grandir vers le ciel, tenir dans ses racines.",
    src: "/marque/croissance/11.webp", width: 1024, height: 1536,
    alt: "La jeune ramure s’équilibre sur un tronc souple relié à des racines plus fines.",
  },
  {
    id: "jeune-tronc", titre: "Le jeune tronc", texte: "Le bois garde la douceur de son commencement.",
    src: "/marque/croissance/12.webp", width: 1024, height: 1536,
    alt: "L’écorce nacrée forme un petit tronc continu, du collet aux premières branches.",
  },
  {
    id: "racines-etendues", titre: "Les racines s’étendent", texte: "Ce qui s’ouvre au-dehors s’ancre aussi au-dedans.",
    src: "/marque/croissance/13.webp", width: 1024, height: 1536,
    alt: "Le petit arbre développe son réseau de racines et plusieurs rameaux feuillus.",
  },
  {
    id: "elan", titre: "L’arbre s’élance", texte: "Les branches gagnent de l’espace, sans se presser.",
    src: "/marque/croissance/14.webp", width: 1024, height: 1536,
    alt: "Un arbre encore fin gagne en hauteur et déploie trois branches maîtresses.",
  },
  {
    id: "ramure-arrondie", titre: "La ramure s’arrondit", texte: "Les premières branches dessinent un abri.",
    src: "/marque/croissance/15.webp", width: 1024, height: 1536,
    alt: "La jeune couronne prend une forme arrondie et naturellement asymétrique.",
  },
  {
    id: "jeune-arbre", titre: "Le jeune arbre", texte: "La pousse est devenue arbre, d’un seul mouvement.",
    src: "/marque/croissance/16.webp", width: 1024, height: 1536,
    alt: "Un jeune arbre à l’écorce ivoire-lilas porte une couronne aérée de feuilles pastel.",
  },
  {
    id: "bouquets", titre: "Les bouquets de feuilles", texte: "Des petits bouquets viennent habiter les branches.",
    src: "/marque/croissance/17.webp", width: 1024, height: 1536,
    alt: "Des bouquets bleu ciel et lavande se multiplient sur la jeune ramure.",
  },
  {
    id: "couronne", titre: "La couronne s’étoffe", texte: "De nouveaux espaces de douceur apparaissent.",
    src: "/marque/croissance/18.webp", width: 1024, height: 1536,
    alt: "La couronne gagne en densité tandis que le tronc vivant se renforce.",
  },
  {
    id: "ramure-liee", titre: "La ramure se rejoint", texte: "Les chemins se rapprochent, les feuilles se répondent.",
    src: "/marque/croissance/19.webp", width: 1024, height: 1536,
    alt: "Les bouquets de feuilles rejoignent peu à peu les branches voisines.",
  },
  {
    id: "abri", titre: "Un abri de feuillage", texte: "Il y a maintenant de la place pour se déposer.",
    src: "/marque/croissance/20.webp", width: 1024, height: 1536,
    alt: "Une couronne généreuse forme un abri au-dessus d’un tronc nacré.",
  },
  {
    id: "canopee-ouverte", titre: "La canopée s’ouvre", texte: "L’arbre trouve son ampleur dans la lumière du ciel.",
    src: "/marque/croissance/21.webp", width: 1024, height: 1536,
    alt: "La canopée élargie laisse passer une lumière céleste entre ses feuilles.",
  },
  {
    id: "ancrage", titre: "L’arbre s’ancre", texte: "L’ampleur des branches rejoint celle des racines.",
    src: "/marque/croissance/22.webp", width: 1024, height: 1536,
    alt: "Le tronc et les racines se renforcent sous une large ramure pastel.",
  },
  {
    id: "ampleur", titre: "L’ampleur tranquille", texte: "Toute la ramure respire autour du même cœur.",
    src: "/marque/croissance/23.webp", width: 1024, height: 1536,
    alt: "Un arbre presque mature déploie une canopée généreuse aux contours souples.",
  },
  {
    id: "canopee", titre: "L’arbre de vie", texte: "Racines, tronc et couronne : un seul mouvement vivant.",
    src: "/marque/croissance/24.webp", width: 1024, height: 1536,
    alt: "Un arbre majestueux à l’écorce claire et vivante relie ses racines à une canopée pastel.",
  },
  {
    id: "lumiere-racines", titre: "La lumière des racines", texte: "Une première clarté se réveille sous le bois.",
    src: "/marque/croissance/25.webp", width: 1024, height: 1536,
    alt: "Une douce lueur nacrée apparaît dans les racines du même arbre mature.",
  },
  {
    id: "seve", titre: "La sève lumineuse", texte: "La clarté remonte doucement vers le tronc.",
    src: "/marque/croissance/26.webp", width: 1024, height: 1536,
    alt: "Une fine lumière chaude relie les racines au bas du tronc vivant.",
  },
  {
    id: "lien-interieur", titre: "Le lien intérieur", texte: "La lumière suit les chemins déjà ouverts.",
    src: "/marque/croissance/27.webp", width: 1024, height: 1536,
    alt: "La sève lumineuse traverse le tronc jusqu’à sa première fourche.",
  },
  {
    id: "branches-rayonnantes", titre: "Les branches rayonnent", texte: "La clarté se partage entre les grandes branches.",
    src: "/marque/croissance/28.webp", width: 1024, height: 1536,
    alt: "La lumière se prolonge dans les trois branches maîtresses de l’arbre.",
  },
  {
    id: "courants", titre: "Les courants de lumière", texte: "Les plus petits chemins reçoivent aussi leur lumière.",
    src: "/marque/croissance/29.webp", width: 1024, height: 1536,
    alt: "Des courants nacrés parcourent les rameaux, reliés aux racines lumineuses.",
  },
  {
    id: "feuilles-lumineuses", titre: "Les feuilles étincellent", texte: "La lumière arrive jusqu’au bord des feuilles.",
    src: "/marque/croissance/30.webp", width: 1024, height: 1536,
    alt: "De petits points de lumière apparaissent dans les feuilles bleu ciel et lavande.",
  },
  {
    id: "couronne-lumineuse", titre: "La couronne s’illumine", texte: "La couronne s’éclaire, reliée au cœur de l’arbre.",
    src: "/marque/croissance/31.webp", width: 1024, height: 1536,
    alt: "La couronne entière s’éclaire doucement au-dessus du tronc et des racines.",
  },
  {
    id: "illumination", titre: "La pleine lumière", texte: "La lumière traverse l’arbre, des racines jusqu’aux feuilles.",
    src: "/marque/croissance/32.webp", width: 1024, height: 1536,
    alt: "Un arbre vivant aux teintes ivoire, lilas et bleu ciel rayonne doucement des racines à la cime.",
  },
  {
    id: "descente-celeste", titre: "Descente céleste", texte: "Une lumière descend du ciel et vient rencontrer la cime.",
    src: "/marque/croissance/33.webp", width: 1024, height: 1536,
    alt: "Un faisceau nacré descend du ciel bleu-lilas et rejoint la couronne lumineuse du même arbre.",
  },
  {
    id: "lumiere-incarnee", titre: "Lumière incarnée", texte: "La clarté du ciel trouve un chemin dans le bois vivant.",
    src: "/marque/croissance/34.webp", width: 1024, height: 1536,
    alt: "La lumière céleste traverse la canopée et se prolonge dans les branches et le tronc nacré.",
  },
  {
    id: "ciel-et-racines", titre: "Ciel et racines", texte: "Du ciel aux racines, une même lumière habite l’arbre.",
    src: "/marque/croissance/35.webp", width: 1024, height: 1536,
    alt: "Un arbre pastel relie un faisceau de lumière venu du ciel à ses racines rayonnantes, dans un mouvement continu.",
  },
];
