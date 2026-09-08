/** Catalogue éditorial fermé. Consignes originales, sans visée médicale. */
export interface SourcePratique { readonly titre: string; readonly url: string }
export interface EtapePratique {
  readonly titre: string;
  readonly consigne: string;
  readonly dureeSecondes?: number;
}
interface BasePratique {
  readonly id: string;
  readonly titre: string;
  readonly description: string;
  readonly dureeMinutes: number;
  readonly intention: "apaiser" | "observer" | "avancer" | "se-connaitre";
  readonly href: string;
  readonly sources: readonly SourcePratique[];
  readonly precaution: string;
}
export type Pratique = BasePratique & (
  | { readonly type: "exercice"; readonly etapes: readonly EtapePratique[] }
  | { readonly type: "questionnaire" }
);

const attention: SourcePratique = {
  titre: "NHS : Attention au moment présent",
  url: "https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/",
};
const oms: SourcePratique = {
  titre: "OMS : Repères pour faire face au stress",
  url: "https://www.who.int/publications/i/item/9789240003927",
};

export const PRATIQUES: readonly Pratique[] = [
  {
    id: "respiration-douce", type: "exercice", intention: "apaiser",
    titre: "Respirer doucement", dureeMinutes: 5,
    description: "Faire une pause avec un souffle confortable, sans rythme à réussir.",
    href: "/pratiques/respiration-douce",
    precaution: "Respire sans forcer ni retenir ton souffle. Si tu ressens une gêne ou un vertige, arrête et retrouve ta respiration habituelle.",
    sources: [{ titre: "NHS : Respiration douce", url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/" }],
    etapes: [
      { titre: "Te poser", consigne: "Installe-toi dans une position confortable, dans un lieu où tu peux faire une pause. Tu peux garder les yeux ouverts." },
      { titre: "Laisser le souffle se faire", consigne: "Laisse l’air entrer et sortir à ton rythme. Tu n’as pas besoin de respirer plus profondément. Si suivre le souffle te déplaît, regarde simplement un objet près de toi.", dureeSecondes: 240 },
      { titre: "Revenir", consigne: "Regarde autour de toi et retrouve tes appuis. Remarque comment tu te sens, sans chercher un résultat particulier." },
    ],
  },
  {
    id: "ancrage-sensoriel", type: "exercice", intention: "apaiser",
    titre: "Revenir au présent", dureeMinutes: 2,
    description: "Retrouver quelques repères autour de toi quand les pensées prennent de la place.",
    href: "/pratiques/ancrage-sensoriel",
    precaution: "Choisis seulement les sens qui te sont accessibles et agréables. Tu peux passer une étape.",
    sources: [attention, oms],
    etapes: [
      { titre: "Un détail autour de toi", consigne: "Les yeux ouverts si cela te convient, remarque une couleur, une forme ou une matière. Tu peux aussi choisir un son ou un objet dans ta main." },
      { titre: "Un point d’appui", consigne: "Repère un contact confortable : le dossier d’une chaise, le sol, un tissu. Prends quelques instants pour le remarquer.", dureeSecondes: 30 },
      { titre: "Un geste maintenant", consigne: "Quel geste simple peux-tu faire maintenant : boire un peu d’eau, changer de position, regarder dehors ? Choisis ce qui te convient." },
    ],
  },
  {
    id: "pause-attention", type: "exercice", intention: "observer",
    titre: "Une pause d’attention", dureeMinutes: 3,
    description: "Essayer une courte méditation avec un repère que tu choisis.",
    href: "/pratiques/pause-attention",
    precaution: "Garde les yeux ouverts si tu le préfères. Si l’attention intérieure te met mal à l’aise, reviens à ce qui t’entoure ou arrête.",
    sources: [attention],
    etapes: [
      { titre: "Choisir ton repère", consigne: "Choisis un objet devant toi, un son régulier ou le contact de tes mains. Ce sera ton point de retour." },
      { titre: "Observer et revenir", consigne: "Remarque les détails de ce repère. Quand ton attention part ailleurs, reviens doucement lorsque tu t’en aperçois. Il n’y a rien à réussir.", dureeSecondes: 120 },
      { titre: "Élargir ton attention", consigne: "Retrouve l’ensemble de la pièce. Tu peux terminer ici, même si ton esprit est resté occupé." },
    ],
  },
  {
    id: "meteo-interieure", type: "exercice", intention: "observer",
    titre: "Ma météo intérieure", dureeMinutes: 2,
    description: "Mettre quelques mots sur ton ressenti et ce dont tu aurais besoin.",
    href: "/pratiques/meteo-interieure",
    precaution: "Tu peux répondre « je ne sais pas » ou laisser une question ouverte. Aucun ressenti n’est une mauvaise réponse.",
    sources: [oms],
    etapes: [
      { titre: "Un mot", consigne: "Quel mot se rapproche de ce qui est là maintenant : fatigue, joie, tension, calme, mélange… ou autre chose ? Tu peux simplement le garder pour toi." },
      { titre: "La place que cela prend", consigne: "Ce ressenti est-il discret, présent ou très prenant ? Pas besoin de le mesurer précisément ni de l’expliquer." },
      { titre: "Un besoin", consigne: "Dans les prochaines minutes, aurais-tu besoin de repos, de mouvement, de parler, de silence ? Laisse venir une possibilité, sans obligation." },
    ],
  },
  {
    id: "recul-pensee", type: "exercice", intention: "observer",
    titre: "Prendre du recul sur une pensée", dureeMinutes: 3,
    description: "Observer une pensée récurrente sans devoir la chasser ni lui obéir.",
    href: "/pratiques/recul-pensee",
    precaution: "Choisis une difficulté ordinaire. Cet exercice ne demande pas de remettre en doute une violence vécue ni de revivre un souvenir pénible.",
    sources: [{ titre: "VA Whole Health : Relation aux pensées et valeurs", url: "https://www.va.gov/wholehealthlibrary/passport/chapter-12.asp" }],
    etapes: [
      { titre: "Repérer la pensée", consigne: "Remarque une phrase qui revient dans ton esprit. Tu n’as pas besoin de détailler l’événement qui l’accompagne." },
      { titre: "La regarder comme une pensée", consigne: "Essaie de décrire cette phrase comme quelque chose que ton esprit te raconte en ce moment. Observe ce que cela change, ou ne change pas.", dureeSecondes: 45 },
      { titre: "Choisir ton geste", consigne: "Cette pensée peut rester là pendant que tu choisis un geste simple. Qu’aimerais-tu faire dans les prochaines minutes ?" },
    ],
  },
  {
    id: "geste-bienveillant", type: "exercice", intention: "apaiser",
    titre: "Me parler avec douceur", dureeMinutes: 3,
    description: "Trouver des mots respectueux pour toi dans une petite difficulté.",
    href: "/pratiques/geste-bienveillant",
    precaution: "Choisis des mots crédibles pour toi. Tu n’as pas à te sentir mieux ni à te forcer à être positive.",
    sources: [{ titre: "Kristin Neff : Autocompassion", url: "https://self-compassion.org/practices/general-self-compassion-break-2/" }],
    etapes: [
      { titre: "Reconnaître la difficulté", consigne: "Choisis une petite difficulté du moment. Tu peux reconnaître qu’elle est désagréable, sans te juger pour ce que tu ressens." },
      { titre: "Trouver les mots", consigne: "Que dirais-tu avec respect à quelqu’un que tu apprécies dans cette situation ? Essaie de t’adresser une version qui sonne juste pour toi." },
      { titre: "Un geste de soutien", consigne: "Quel petit geste de soutien peux-tu t’accorder maintenant ? Il peut être aussi simple que faire une pause." },
    ],
  },
  {
    id: "valeur-petit-pas", type: "exercice", intention: "avancer",
    titre: "Un petit pas vers ce qui compte", dureeMinutes: 5,
    description: "Relier ce qui compte pour toi à une action réaliste aujourd’hui.",
    href: "/pratiques/valeur-petit-pas",
    precaution: "Ce choix reste ajustable. Il ne devient ni une obligation ni une promesse à tenir envers Anam.",
    sources: [{ titre: "VA Whole Health : Ce qui compte pour soi", url: "https://www.va.gov/wholehealth/circle-of-health/me.asp" }],
    etapes: [
      { titre: "Ce qui compte", consigne: "Dans ce qui t’occupe aujourd’hui, qu’est-ce qui compte pour toi : apprendre, aider, créer, être sincère… ou autre chose ?" },
      { titre: "Une action à ta portée", consigne: "Choisis une action de moins de dix minutes qui ferait vivre cela. Réduis-la encore si elle te semble trop grande." },
      { titre: "Une occasion réaliste", consigne: "À quel moment pourrais-tu l’essayer ? Tu peux aussi décider que ce n’est pas le moment. Ce petit pas t’appartient." },
    ],
  },
  {
    id: "savourer-instant", type: "exercice", intention: "observer",
    titre: "Savourer un instant", dureeMinutes: 3,
    description: "Accorder un peu d’attention à un détail agréable, même très simple.",
    href: "/pratiques/savourer-instant",
    precaution: "Si rien d’agréable ne vient, tu peux choisir un détail neutre ou t’arrêter. Tu n’as pas à chercher du positif à tout prix.",
    sources: [{ titre: "UC Berkeley : Attention aux moments agréables", url: "https://ggia.berkeley.edu/practice/savoring_walk" }],
    etapes: [
      { titre: "Un détail", consigne: "Là où tu es, remarque un détail qui te plaît un peu : une lumière, un son, une texture, une saveur. Aucun grand bonheur n’est nécessaire." },
      { titre: "Lui laisser une place", consigne: "Reste quelques instants avec ce détail. Qu’est-ce que tu remarques lorsque tu lui accordes davantage d’attention ?", dureeSecondes: 45 },
      { titre: "Reprendre", consigne: "Tu peux garder un mot de cet instant, ou simplement le laisser passer. Retrouve ensuite ton activité à ton rythme." },
    ],
  },
  {
    id: "big-five", type: "questionnaire", intention: "se-connaitre",
    titre: "Mes repères Big Five", dureeMinutes: 5,
    description: "Explorer cinq dimensions de personnalité avec l’inventaire déjà présent dans Anam.",
    href: "/big-five", precaution: "Un repère d’exploration, pas une évaluation médicale. La méthode et ses limites sont détaillées avant les questions.",
    sources: [],
  },
  {
    id: "enneagramme", type: "questionnaire", intention: "se-connaitre",
    titre: "Explorer mon ennéagramme", dureeMinutes: 5,
    description: "Retrouver l’espace existant pour explorer ou nuancer tes repères d’ennéagramme.",
    href: "/enneagramme", precaution: "Une grille d’introspection, sans valeur médicale. Aucune hypothèse n’est un résultat certain sur toi.",
    sources: [],
  },
];

export function pratiqueParId(id: unknown): Pratique | null {
  return typeof id === "string" ? PRATIQUES.find((p) => p.id === id) ?? null : null;
}

/** Ligne lisible du journal existant, restaurée uniquement contre le catalogue serveur. */
export function texteRecommandationPratique(pratique: Pratique): string {
  return `\n\nPratique proposée : [${pratique.titre}](${pratique.href})`;
}

/** Presentation only: retain the readable recommendation, without granting any tool metadata. */
export function texteSansAnnotationPratique(texte: string): string {
  return texte.replace(/\n<!-- anam-pratique:v1:([a-z0-9-]{1,80}):([a-f0-9]{64}) -->$/, "");
}
