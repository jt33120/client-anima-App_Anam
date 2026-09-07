import type { MessageIa } from "@/lib/ai/port";
import type { Aspect, CibleNatale, JourCivil } from "@/lib/astro/quotidien";
import { CORPS_LIBELLE, SIGNE_LIBELLE } from "./cartes-socle";
import type { MatiereContexte } from "./contexte-anam";
import { CONTEXTE_BRANCHES_MAX, CONTEXTE_RETENU_MAX } from "./contexte-anam";
import type { SocleNatalDit } from "./socle-natal-dit";
import type { PositionDuJourDite, SignatureDuCiel, TraitDuCiel } from "./signature-ciel";

/**
 * consigne-horoscope.ts — LA CONSIGNE DU TEXTE DU JOUR (retour du fondateur du 2026-09-02, refondu
 * le 2026-09-07).
 *
 * ── POURQUOI CE FICHIER EXISTE ─────────────────────────────────────────────────────────────────
 *
 * « Il manque l'horoscope. » Le calcul, lui, ne manquait pas : la 5.4 lit de vraies éphémérides,
 * trouve les aspects du jour au thème et la distance Lune-Soleil natal. Ce qui manquait, c'est le
 * TEXTE : vingt-sept phrases écrites d'avance, dont une seule s'affiche, sans jamais nommer ce qui
 * se passe aujourd'hui. Trois personnes sur quatre y lisaient un trait de caractère, pas un jour.
 *
 * ── CE QUE LE 2026-09-07 CHANGE, ET POURQUOI ───────────────────────────────────────────────────
 *
 * Deuxième retour du fondateur, textuel : « je veux des horoscopes beaucoup plus précis et
 * structurés. Une partie factuelle sur l'horoscope poissons et ascendant et tout ce qu'on sait à ce
 * niveau sur la personne. Un deuxième paragraphe personnalisé avec les fichiers de contexte créés
 * par Anam. Enfin un troisième paragraphe sur les actions ou la manière de le rendre concret. »
 *
 * Le texte passe donc de deux ou trois phrases indifférenciées à TROIS PARTIES nommées :
 *
 *   • LE CIEL — factuel. Son socle natal (Soleil, Lune, Ascendant, en signes) rencontre les transits
 *     du jour. C'est la partie qui répond à « pourquoi ce texte est le mien et pas celui du voisin » ;
 *   • POUR TOI — personnalisé, à partir de ce qu'Anam sait d'elle : son prénom, ce que son arbre
 *     porte déjà, ce qui a été retenu de ses échanges ;
 *   • AUJOURD'HUI — concret. Ce qu'il y a à en faire, dans la journée, en gestes tenables.
 *
 * ── LA TROISIÈME PARTIE RENVERSE UN INTERDIT, ET ÇA S'ÉCRIT ────────────────────────────────────
 *
 * ⚠️ CETTE CONSIGNE DISAIT, MOT POUR MOT : « tu ne donnes ni conseil, ni consigne, ni encouragement,
 * ni marche à suivre ». La troisième partie est exactement cela, et la décision du fondateur est
 * explicite. On ne supprime donc pas la phrase en silence : on dit ce qui a changé, et ce qui n'a
 * pas changé.
 *
 * CE QUI CHANGE : le conseil est autorisé, et SEULEMENT dans la troisième partie.
 * CE QUI NE CHANGE PAS, ET NE CHANGERA PAS : l'interdit de prédiction (FR-053), qui n'a jamais été
 * une règle de style. Un geste proposé au présent (« poser une chose avant midi ») et un futur
 * adressé (« tu poseras cette chose ») ne sont pas deux nuances du même acte : le premier laisse la
 * personne libre de ne pas le faire, le second lui annonce sa journée. Le vocabulaire de santé et de
 * thérapie reste interdit partout, et c'est dans une partie « actions » qu'un modèle l'écrit le plus
 * volontiers — « apaise ton anxiété », « prends soin de toi » sont ses deux réflexes.
 *
 * ── CE QUE LE MODÈLE REÇOIT, ET CE QU'IL NE REÇOIT PAS ─────────────────────────────────────────
 *
 * Il reçoit trois choses, dans trois messages distincts : la présente consigne, ce qu'Anam sait
 * d'elle (`faitsDeToi`), et les faits du ciel (`faitsDuCiel`). Il ne reçoit AUCUNE date de
 * naissance, aucun identifiant, aucune longitude, aucun degré, aucun verbatim de conversation — les
 * types le tiennent (`signature-ciel.ts`, `socle-natal-dit.ts`), pas la vigilance.
 *
 * ⚠️ CE QU'IL REÇOIT DÉSORMAIS ET QU'IL NE RECEVAIT PAS : son prénom, ses signes natals, le nom des
 * branches de son arbre, ce qu'Anam a retenu d'elle. C'est de la donnée art. 9, elle sort sous
 * l'egress art. 9 et sous consentement vivant — le même régime, exactement, que la conversation avec
 * Anam, qui envoie cette matière depuis le 2026-08-20. Ce n'est pas une dérogation nouvelle ; c'est
 * la même porte, empruntée par un second chemin.
 *
 * ── LA SEULE CHOSE QU'UN MODÈLE FERA SPONTANÉMENT DE TRAVERS ───────────────────────────────────
 *
 * Prédire. « Horoscope » est le nom d'un genre littéraire dont la prédiction EST la grammaire : un
 * modèle à qui l'on demande un horoscope produit du futur adressé par défaut, et FR-053 l'interdit
 * dans tout le socle. La consigne le refuse en nommant ce qu'il faut faire À LA PLACE (décrire une
 * configuration, proposer un geste au présent), pas seulement ce qu'il ne faut pas faire.
 *
 * ⚠️ AUCUN CONTRE-EXEMPLE N'EST CITÉ DANS CETTE CONSIGNE, alors que c'est le réflexe pédagogique.
 * Une phrase de futur adressé écrite ici pour être refusée resterait une phrase de futur adressé
 * dans `lib/`, à portée du prochain copier-coller et des balayages qui cherchent ce motif. On décrit
 * l'interdit, on ne l'écrit pas — et `tests/consigne-horoscope.test.ts` MESURE cette consigne avec
 * le détecteur du produit plutôt que d'espérer qu'elle soit propre.
 */

/** Le libellé d'un aspect, tel qu'il se dit à quelqu'un. */
const ASPECT_LIBELLE: Readonly<Record<Aspect, string>> = Object.freeze({
  conjonction: "conjonction",
  sextile: "sextile",
  carre: "carré",
  trigone: "trigone",
  opposition: "opposition",
});

/**
 * La cible natale, dite en toutes lettres.
 *
 * « ton Soleil de naissance » plutôt que « soleil » : le modèle doit pouvoir reprendre la formule
 * telle quelle sans avoir à deviner s'il parle du Soleil du jour ou de celui du thème. La confusion
 * des deux est l'erreur la plus fréquente d'un texte astrologique mal écrit.
 */
const CIBLE_LIBELLE: Readonly<Partial<Record<CibleNatale, string>>> = Object.freeze({
  soleil: "ton Soleil de naissance",
  lune: "ta Lune de naissance",
  ascendant: "ton Ascendant",
});

/**
 * ⚠️ PARTIEL, ET AVEC UN REPLI, PARCE QUE `CibleNatale` EST PLUS LARGE QUE `CIBLES_NATALES`.
 *
 * Le type autorise les dix corps ; la constante du domaine n'en retient que trois (Soleil, Lune,
 * Ascendant), et c'est elle qui décide. Une table exhaustive ferait croire que les sept autres sont
 * attendus ici ; un accès non gardé, lui, produirait « undefined à ton undefined » le jour où la
 * 5.4 en ajoute un. Le repli nomme le corps et garde la phrase debout.
 */
function cibleEnMots(cible: CibleNatale): string {
  return CIBLE_LIBELLE[cible] ?? `ton ${nomDeCorps(cible)} de naissance`;
}

/** Le nom d'un corps, avec repli sur la clé : `CORPS_LIBELLE` est partiel par construction. */
function nomDeCorps(corps: string): string {
  return CORPS_LIBELLE[corps as keyof typeof CORPS_LIBELLE] ?? corps;
}

/** Un trait mis en mots : « trigone de Vénus à ton Ascendant ». */
function traitEnMots(trait: TraitDuCiel): string {
  return `${ASPECT_LIBELLE[trait.aspect]} de ${nomDeCorps(trait.corpsTransitant)} à ${cibleEnMots(trait.cible)}`;
}

/**
 * La distance Lune-Soleil natal, mise en mots.
 *
 * Zéro n'est pas « à zéro signe » : c'est « dans le même signe », et c'est le seul cas où la phrase
 * naturelle diffère du gabarit. Un gabarit unique produirait « à 0 signe de ton Soleil », qui se lit
 * comme une panne d'affichage.
 */
function luneEnMots(distance: number): string {
  if (distance === 0) return "la Lune du jour est dans le même signe que ton Soleil de naissance";
  if (distance === 1) return "la Lune du jour est à un signe de ton Soleil de naissance";
  return `la Lune du jour est à ${distance} signes de ton Soleil de naissance`;
}

/** Le jour, en clair, pour que le modèle sache qu'il écrit une date et pas une généralité. */
function jourEnMots(jour: JourCivil): string {
  return `${String(jour.j).padStart(2, "0")}/${String(jour.m).padStart(2, "0")}/${jour.a}`;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LES TROIS PARTIES, ET LEURS MARQUEURS
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Les étiquettes que le modèle pose devant chaque partie.
 *
 * ⚠️ ELLES SONT EN MAJUSCULES, SANS ACCENT, ENTRE CROCHETS, ET SEULES SUR LEUR LIGNE — quatre
 * redondances pour une seule raison : un modèle oublie un marqueur une fois sur vingt, et il
 * l'oublie toujours de la même façon (il le met en gras, il ajoute un deux-points, il l'accentue,
 * il le colle au texte). Le lecteur (`verdict-horoscope.ts`) accepte ces quatre variantes ; le
 * modèle, lui, ne reçoit qu'une seule forme à imiter. Demander une forme stricte et en accepter
 * plusieurs est ce qui rend le marqueur robuste sans rendre la consigne floue.
 *
 * ⚠️ SANS ACCENT SUR « AUJOURD'HUI » : un marqueur qui porte une apostrophe et un accent est un
 * marqueur que la normalisation typographique peut toucher. Le nôtre ne contient que des lettres
 * ASCII et un tiret.
 */
export const ETIQUETTE_CIEL = "CIEL";
export const ETIQUETTE_TOI = "POUR-TOI";
export const ETIQUETTE_CONCRET = "AUJOURD-HUI";

/**
 * LA CONSIGNE — registre de la voix du produit, pas celui d'un horoscope de magazine.
 *
 * ⚠️ LES BORNES DE LONGUEUR SONT UNE CONTRAINTE DE FOND, PAS DE MISE EN PAGE. Un texte long doit
 * meubler ; meubler, pour un horoscope, veut dire glisser vers la promesse. La brièveté de chaque
 * partie est ce qui rend tenable la règle « décrire, puis proposer, sans jamais annoncer ».
 */
export function consigneHoroscope(): MessageIa {
  return {
    role: "system",
    content: [
      "Tu écris le texte du jour d’une application d’astrologie, en français.",
      "On te donne le socle de naissance d’une personne, la configuration du ciel d’aujourd’hui déjà",
      "calculée, et ce que l’application sait d’elle. Ton travail est de mettre tout cela en mots.",
      "",
      "Tu écris TROIS parties, dans cet ordre, chacune précédée de son étiquette seule sur sa ligne,",
      "en majuscules et entre crochets, exactement comme ceci :",
      "",
      `[${ETIQUETTE_CIEL}]`,
      "Le factuel. Tu nommes son socle de naissance tel qu’il t’est donné, et tu décris au présent ce",
      "que le ciel d’aujourd’hui vient y toucher. C’est la partie où le lecteur doit reconnaître que",
      "ce texte est le sien et celui de personne d’autre. TROIS PHRASES AU PLUS.",
      "",
      `[${ETIQUETTE_TOI}]`,
      "Le personnalisé. Tu pars de ce que l’application sait d’elle et tu le relies à la première",
      "partie. Tu ne récites jamais ce qu’on t’a appris et tu ne dis pas que tu le sais ; tu t’en sers",
      "comme quelqu’un qui la connaît déjà s’en servirait. Ce qui ne t’a pas été donné, tu ne le sais pas et",
      "tu ne l’inventes pas. Trois à cinq phrases.",
      "",
      `[${ETIQUETTE_CONCRET}]`,
      "Le concret. Ici, et ici seulement, tu proposes : deux ou trois gestes tenables dans la journée,",
      "petits, précis, situés. Une chose qu’on peut faire en dix minutes vaut mieux qu’une intention.",
      "Tu écris ces gestes à l’infinitif, à l’impératif, ou au présent. TROIS PHRASES AU PLUS.",
      "",
      "Ce que tu fais partout :",
      "- tu décris au présent ce qui est, et tu proposes au présent ce qui se fait ;",
      "- tu nommes au moins un des éléments donnés, pour que le texte soit celui de ce jour-là ;",
      "- tu tutoies, tu restes sobre, tu écris une prose continue ;",
      "- tu tiens CHAQUE partie sous quatre cents signes. C’est une contrainte dure, pas une",
      "  indication : une partie plus longue est refusée en entier, et personne ne lit ton texte.",
      "",
      "Ce que tu ne fais jamais, dans aucune des trois parties :",
      "- tu restes au présent : rien de ce qui n’a pas eu lieu, aucun verbe au futur adressé à la personne ;",
      "- tu ne promets aucun état, aucune amélioration, aucune réussite, aucun résultat ;",
      "- tu n’emploies aucun vocabulaire de santé, de thérapie, de diagnostic ni de bien-être, et en",
      "  particulier tu n’écris jamais le mot « soin » ni le verbe « soulager » ;",
      "- tu ne te nommes pas, tu ne te décris pas, tu ne signes pas, tu ne t’adresses pas à toi-même ;",
      "- tu ne poses aucune question, et tu n’écris jamais de point d’interrogation, même rhétorique ;",
      "- tu n’écris aucun nom propre de personne, et tu n’appelles jamais quelqu’un par son prénom ;",
      "- tu n’ajoutes ni titre, ni liste, ni guillemets, ni emoji, ni ligne de séparation ;",
      "- tu n’écris jamais un article suivi d’un chiffre seul, et tu écris les dates en toutes lettres.",
      "",
      "Le ciel forme une configuration ; il n’ordonne rien et ne promet rien. Une tension entre deux",
      "forces se décrit ; un geste se propose ; ce qu’une personne en fait lui appartient.",
      "",
      "Typographie : apostrophes courbes (’), jamais droites. Aucun tiret long. Aucun astérisque.",
      "Réponds par les trois parties et leurs étiquettes, sans introduction ni conclusion.",
    ].join("\n"),
  };
}

/**
 * CE QUE L'APPLICATION SAIT D'ELLE, tel que ça part au modèle pour la deuxième partie.
 *
 * ⚠️ MESSAGE SÉPARÉ, ET PAS UNE RUBRIQUE DE `faitsDuCiel`. Deux raisons, et la seconde est la vraie :
 * un bloc de contexte a sa propre règle (« tu ne le récites pas »), qui n'a rien à voir avec des
 * faits d'éphéméride ; et surtout, `tests/consigne-horoscope.test.ts` mesure séparément ce qui sort
 * de chacun. Fondus en un seul texte, on ne saurait plus dire lequel des deux a laissé passer quoi.
 *
 * ⚠️ LES MÊMES BORNES QUE LA CONVERSATION D'ANAM, RÉUTILISÉES ET NON RECOPIÉES
 * (`CONTEXTE_BRANCHES_MAX` et compagnie). Elles n'existent pas pour le coût : au-delà d'une poignée
 * d'éléments, un modèle RÉCITE le contexte au lieu de s'en servir, et le texte devient un inventaire.
 * Deux jeux de bornes auraient divergé au premier réglage.
 *
 * ⚠️ AUCUN COMPTE (FR-031). Ni « trois branches », ni « et cinq autres ». Les listes sont bornées
 * SANS que la borne se dise : un chiffre dans le contexte ressort dans le texte, et le produit ne
 * compte jamais ce qu'une personne a ou n'a pas.
 */
export function faitsDeToi(contexte: MatiereContexte): string {
  const lignes: string[] = [
    "Ce que l’application sait d’elle. Cela vient de sa fiche et de ses échanges passés, pas d’aujourd’hui.",
    "Tu t’en sers pour la deuxième partie. Tu ne le récites pas, tu ne dis pas que tu le sais, tu n’ajoutes rien.",
  ];

  // ⚠️ LE PRÉNOM NE PART PLUS AU MODÈLE, ET C'EST UNE MESURE QUI L'A DÉCIDÉ (2026-09-07).
  //
  // La consigne disait « tu peux l'appeler par son prénom, une fois au plus ». Cinq générations
  // réelles sur `ministral-14b-2512` ont ouvert la deuxième partie par « <Prénom>, tu sais ce que
  // c'est que… » — cinq fois sur cinq. Or la première utilisatrice du produit s'appelle ANIMA, du
  // même nom que le produit : `verdictHoroscope` refusait donc chacun de ces textes pour
  // `signature`, la garde FR-086 qui empêche un modèle de signer sous le nom d'une personne réelle.
  //
  // Cette collision n'est pas un cas limite à contourner : c'est le nom du produit ET le sien. On
  // pourrait exempter son prénom du refus, mais ce serait desserrer la seule garde qui empêche un
  // texte fabriqué de paraître signé d'elle — pour gagner un mot. Le prénom ne sert à rien ici : le
  // texte tutoie déjà, et la personnalisation vient de son arbre et de ce qui a été retenu, pas
  // d'une apostrophe. On ne l'envoie plus, et la garde reste absolue.
  if (contexte.typePressenti) {
    lignes.push(
      `Une hypothèse de type a été posée avec elle : ${contexte.typePressenti}. C’est une hypothèse ` +
        "réfutable, déjà énoncée. Tu ne la reposes pas et tu ne la traites pas comme un fait.",
    );
  }

  if (contexte.branches.length > 0) {
    const bornees = contexte.branches.slice(0, CONTEXTE_BRANCHES_MAX);
    lignes.push(
      "Ce qui porte déjà un nom dans son arbre : " +
        bornees.map((b) => (b.enPleineLumiere ? `${b.nom} (en pleine lumière)` : b.nom)).join(" ; ") +
        ".",
    );
    // ⚠️ « QUI VIT ENCORE », JAMAIS « QU'IL RESTE À FAIRE ». La nuance porte tout le produit : ce
    // n'est pas une liste de tâches, et une branche n'a pas à être terminée.
    if (bornees.some((b) => !b.enPleineLumiere)) {
      lignes.push("Ces branches vivent encore. Si l’une croise le ciel du jour, tu la reconnais par son nom.");
    }
  }

  if (contexte.retenu.length > 0) {
    lignes.push(
      "Ce qui a été retenu d’elle, du plus récent au plus ancien : " +
        contexte.retenu.slice(0, CONTEXTE_RETENU_MAX).join(" ; ") +
        ".",
    );
    lignes.push("Tu t’en sers pour ne pas lui faire tout répéter, jamais pour lui prouver qu’on se souvient.");
  }

  // ⚠️ L'IGNORANCE SE DIT. Un modèle à qui l'on ne dit rien comble : il invente un passé commun et
  // écrit une deuxième partie qui sonne faux pour tout le monde. Le dire coûte deux lignes et
  // supprime le mode de panne le plus visible du produit.
  if (contexte.branches.length === 0 && contexte.retenu.length === 0) {
    lignes.push(
      "Rien d’autre n’est connu d’elle. Tu n’inventes ni passé commun, ni familiarité empruntée : la " +
        "deuxième partie part alors de son socle de naissance et de rien d’autre.",
    );
  }

  return lignes.join("\n");
}

/**
 * LES FAITS DU JOUR ET DU SOCLE, tels qu'ils partent au modèle.
 *
 * Exportée à part de `messagesHoroscope` pour que `tests/consigne-horoscope.test.ts` puisse mesurer
 * exactement ce qui sort : la garde de non-fuite porte sur CE texte, et sur lui seul.
 *
 * ⚠️ LE SOCLE NATAL EST EN TÊTE, ET C'EST L'ORDRE QUE LE FONDATEUR A DEMANDÉ : « une partie
 * factuelle sur l'horoscope poissons et ascendant ». Ce qui ne change jamais d'abord, ce qui change
 * aujourd'hui ensuite — c'est aussi l'ordre dans lequel la première partie se lit.
 */
export function faitsDuCiel(
  signature: SignatureDuCiel,
  jour: JourCivil,
  socle: SocleNatalDit,
  cielDuJour: readonly PositionDuJourDite[] = [],
): string {
  const lignes: string[] = [`Jour : ${jourEnMots(jour)}.`];

  // ── Ce qui ne change jamais ────────────────────────────────────────────────────────────────
  const natal: string[] = [];
  if (socle.soleil) natal.push(`Soleil en ${SIGNE_LIBELLE[socle.soleil]}`);
  if (socle.lune) natal.push(`Lune en ${SIGNE_LIBELLE[socle.lune]}`);
  if (socle.ascendant) natal.push(`Ascendant ${SIGNE_LIBELLE[socle.ascendant]}`);
  if (natal.length > 0) {
    lignes.push(`Son socle de naissance : ${natal.join(" ; ")}.`);
  }
  // ⚠️ L'ABSENCE D'ASCENDANT SE DIT, ELLE NE SE TAIT PAS. Sans heure de naissance il n'y a pas
  // d'ascendant — pas un ascendant approximatif. Un modèle à qui une rubrique attendue manque la
  // comble : privé de cette ligne, il écrit « ton Ascendant » et invente le signe. C'est la même
  // leçon que « un jour calme est un vrai jour », plus bas.
  if (socle.ascendant === null) {
    lignes.push(
      "Son heure de naissance n’est pas connue : il n’y a pas d’Ascendant, et tu n’en nommes aucun.",
    );
  }

  // ── Ce qui change aujourd'hui ──────────────────────────────────────────────────────────────
  //
  // ⚠️ LE CIEL DU JOUR EN SIGNES, AVANT LA DISTANCE — ET C'EST UNE MESURE QUI L'A EXIGÉ. On envoyait
  // « la Lune du jour est à trois signes de ton Soleil » sans jamais dire OÙ est cette Lune. Trois
  // générations réelles sur cinq inventaient « la Lune du jour, en Lion ». Un modèle privé d'un fait
  // qu'il attend le comble ; on le lui donne plutôt que de le lui interdire.
  if (cielDuJour.length > 0) {
    lignes.push(
      `Le ciel d’aujourd’hui : ${cielDuJour
        .map((p) => `${nomDeCorps(p.corps)} en ${SIGNE_LIBELLE[p.signe]}`)
        .join(" ; ")}.`,
    );
  }
  if (signature.luneDistance !== null) {
    lignes.push(`Position relative : ${luneEnMots(signature.luneDistance)}.`);
  }
  if (signature.dominante) {
    lignes.push(`Configuration dominante : ${traitEnMots(signature.dominante)}.`);
  }
  if (signature.secondaires.length > 0) {
    lignes.push(
      `Autres configurations : ${signature.secondaires.map(traitEnMots).join(" ; ")}.`,
    );
  }
  if (signature.changements.length > 0) {
    lignes.push(
      `Passages de signe aujourd’hui : ${signature.changements
        .map((c) => `${nomDeCorps(c.corps)} entre en ${SIGNE_LIBELLE[c.vers]}`)
        .join(" ; ")}.`,
    );
  }
  // Un jour sans configuration dominante EST un vrai jour (5.4) : le dire évite que le modèle
  // invente un aspect pour remplir, ce qu'il fait dès qu'une rubrique attendue manque.
  if (!signature.dominante) {
    lignes.push("Aucun aspect serré aujourd’hui : c’est un jour calme, et cela se dit tel quel.");
  }

  return lignes.join("\n");
}

/**
 * Les messages du tour : la consigne, ce qu'on sait d'elle, puis les faits. Rien d'autre ne part.
 *
 * ⚠️ L'ORDRE EST UNE GARDE, PAS UNE PRÉFÉRENCE. La consigne d'abord, LOIN des faits : ce qu'on
 * apprend au modèle sur elle ne doit jamais pouvoir primer sur ce qu'on lui interdit. C'est le même
 * ordre, et pour la même raison, que `[voix, contexte, phase, détresse, …messages]` dans la
 * conversation d'Anam (`contexte-anam.ts`).
 *
 * ⚠️ `contexte` PEUT ÊTRE `null`, ET LE TOUR TIENT QUAND MÊME. Une panne de lecture de la matière
 * ne doit pas supprimer l'horoscope : elle en retire la deuxième partie, et la consigne dit alors au
 * modèle de ne pas la fabriquer. C'est la politique de tout le socle — chaque source tombe sur « je
 * ne sais pas », jamais sur le silence.
 */
export function messagesHoroscope(
  signature: SignatureDuCiel,
  jour: JourCivil,
  socle: SocleNatalDit,
  contexte: MatiereContexte | null,
  cielDuJour: readonly PositionDuJourDite[] = [],
): readonly MessageIa[] {
  const messages: MessageIa[] = [consigneHoroscope()];
  if (contexte) messages.push({ role: "system", content: faitsDeToi(contexte) });
  messages.push({ role: "user", content: faitsDuCiel(signature, jour, socle, cielDuJour) });
  return Object.freeze(messages);
}
