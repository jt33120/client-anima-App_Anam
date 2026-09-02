import type { RaisonNombreAbsent } from "@/lib/astro/numerologie";
import { LIEN_AJOUTER } from "./copie-naissance";
import type { RaisonSansAngles, RaisonAbsenceCorps } from "@/lib/astro/theme-natal";

/**
 * copie-socle.ts — CE QUE LA HALTE « TON SOCLE » DIT (Story 7.5).
 *
 * ══ POURQUOI CHAQUE ABSENCE A SA PHRASE, ET PAS UN « — » ════════════════════════════════════════
 *
 * FR-050 exige qu'Anam annonce ce qui manque ET POURQUOI. Un tiret, un « non disponible » ou une
 * case vide disent trois choses à la fois et n'en prouvent aucune : « le produit ne sait pas »,
 * « le produit est cassé », « tu as mal rempli quelque chose ». Les trois se ressemblent à l'écran
 * et n'appellent pas les mêmes gestes. Chaque raison a donc SA phrase, et la phrase dit s'il y a
 * quelque chose à faire — ou s'il n'y a rien à faire, ce qui est une information à part entière.
 *
 * ⚠️ CE N'EST PAS DU CORPUS D'ANIMA. Même frontière que `MESSAGE_SANS_HEURE` (5.3, D10) et
 * `MESSAGE_TYPE_SANS_TEXTE` (5.5) : le corpus dit ce qu'un nombre SIGNIFIE, ces phrases-ci disent
 * l'ÉTAT DU PRODUIT. Elles ne sont donc pas bloquées par FR-054/FR-086, et elles relèvent de plein
 * droit du contrôle de voix bloquant (`tests/lexique-voix.test.ts`).
 *
 * ⚠️ AUCUN FUTUR ADRESSÉ, NULLE PART (FR-053/FR-020). « tu pourras le lire », « ton ascendant
 * apparaîtra » sont des promesses que le code ne tient pas, et un futur adressé reste un futur
 * adressé même quand il est anodin.
 */

/** Une porte de réparation : ce qu'on nomme, et où ça mène. Jamais un impératif. */
export interface PorteSocle {
  readonly libelle: string;
  readonly url: string;
}

/**
 * ⚠️ CES TROIS URL SONT DES CONSTANTES, ET UN TEST VÉRIFIE QUE CHACUNE MÈNE À UNE PAGE QUI EXISTE.
 * La leçon est celle du 2026-08-25 : le tour guidé désignait `/reperes` depuis la surimpression
 * deux jours après que le lien en avait été retiré, et rien n'a rougi — une garde qui saute ce
 * qu'elle ne trouve pas ne peut pas dire qu'un chemin a cessé d'exister.
 *
 * ✅ `URL_CORRIGER_LE_NOM` POINTE SUR `/reglages` DEPUIS LE 2026-08-25 (Story 7.3b). Le formulaire
 * de nom y a déménagé et `/profil` a disparu — ce que l'amendement d'`EXPERIENCE.md` (§6) prévoyait
 * et que la ligne 77 spécifiait depuis le 2026-07-21. Une seule ligne a changé, comme annoncé.
 */
export const URL_CORRIGER_LE_NOM: PorteSocle = Object.freeze({
  libelle: "Ton nom complet",
  url: "/reglages",
});

export const URL_AJOUTER_SON_HEURE: PorteSocle = Object.freeze({
  libelle: "Ton heure de naissance",
  url: "/heure-naissance",
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les titres et les aveux de la page
// ══════════════════════════════════════════════════════════════════════════════════════════════

export const TITRE_HALTE = "Ton socle";

export const INTRODUCTION =
  "Ce qui a été calculé à partir de ta date, de ton heure et de ton nom. Rien ici ne vient d’un " +
  "modèle : les nombres suivent les conventions affichées et les positions viennent du calcul natal.";

/**
 * ── LES DEUX INTRODUCTIONS D'UNIVERS, ET POURQUOI CELLE DU CIEL EST COURTE ──────────────────────
 *
 * Elles vivaient EN DUR dans `app/socle/page.tsx` jusqu'au 2026-09-02 : la seule copie de la halte
 * qui échappait à ce fichier, donc au contrôle de voix et au détecteur de prédiction qui le lisent.
 *
 * Celle de l'astrologie a été RACCOURCIE sur le retour terrain du 2026-09-01 (« La première
 * information c'est l'horoscope. Il faut que ça aille plus vite. L'app est beaucoup trop
 * verbeuse. ») : une phrase pour dire d'où ça vient, une pour dire que ce n'est pas un modèle. Elle
 * ne nomme plus « ton heure » : la moitié des comptes n'en ont pas, et l'appel juste en dessous
 * s'en charge bien mieux qu'une introduction qui présume.
 *
 * Celle de la numérologie est déplacée MOT POUR MOT : le mode numérologie ne change pas d'aspect.
 */
export const INTRODUCTION_ASTROLOGIE =
  "Ton ciel, calculé à partir de ta naissance. Rien ici ne vient d’un modèle.";

export const INTRODUCTION_NUMEROLOGIE =
  "Tes nombres, calculés à partir de ta naissance et de ton nom. L’année personnelle suit l’année civile indiquée.";

export const TITRE_NOMBRES = "Tes nombres";
export const TITRE_CIEL = "Ton ciel de naissance";
export const TITRE_APERCU = "L’essentiel, en un regard";
export const TITRE_ENTREES_NUMEROLOGIE = "Les données utilisées";
export const TITRE_METHODE_NUMEROLOGIE = "La méthode de calcul";
/**
 * ⚠️ « LECTURE SYMBOLIQUE », SANS « D'ANIMA » (FR-086, décision D10 du plan, 2026-09-02).
 *
 * Les 69 lectures de `lib/corpus/textes-de-base.ts` sont des TEXTES DE DÉPART, non signés par
 * Anima : l'en-tête du fichier le dit. Coiffer ce pli de « Lecture symbolique d’Anima », c'était
 * attribuer à une personne réelle et identifiable des mots qu'elle n'a pas écrits, très exactement
 * ce que FR-086 nomme un défaut critique. Le titre dit donc ce que c'est, une lecture symbolique,
 * et rien de plus. Le jour où Anima relit et signe, c'est le texte qui change, pas ce titre.
 *
 * `LECTURE_NUMEROLOGIE_NON_ECRITE` et `LECTURE_NUMEROLOGIE_PARTIELLE` gardent « d’Anima » et
 * « par Anima » : elles décrivent un ÉTAT (ce qu'Anima n'a pas encore écrit), pas une signature.
 * `tests/fiche-socle.test.ts` garde la différence : le titre ne nomme personne, la note si.
 */
export const TITRE_LECTURE_NUMEROLOGIE = "Lecture symbolique";
export const TITRE_ANGLES = "Tes angles";
export const TITRE_MAISONS = "Tes maisons";
export const TITRE_TYPE = "Ton type";
export const TITRE_MANQUES = "Ce qui manque, et pourquoi";
export const TITRE_PORTES = "Ce que tu peux changer";

// ══════════════════════════════════════════════════════════════════════════════════════════════
// L'univers Astrologie : l'horoscope d'abord, l'heure bien avant, les positions repliées
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Retour terrain du fondateur (Julian, 2026-09-01), mot pour mot : « bouton ton heure de naissance
 * bien avant. Il faudrait presque qu'Anam arrive avec une bulle : il manque l'heure de naissance ;
 * une fois qu'on l'a on accède à l'horoscope. Si la personne n'a pas l'heure, on laisse passer et on
 * se contente de l'horoscope astral. Toggle et cache les positions en texte, on s'en fout, mets
 * l'accent sur l'horoscope. La première information c'est l'horoscope. »
 *
 * Quatre libellés d'INTERFACE, pas de corpus : ils disent ce qu'un geste fait ou ce qu'un pli
 * contient. La phrase de la bulle, elle, n'est PAS ici : c'est `BULLE_SANS_HEURE`
 * (`message-sans-heure.ts`), la même que sur `/heure-naissance`, transportée par la fiche. Deux
 * vérités concurrentes sur la même absence sont un défaut, et la fiche le dit déjà pour l'aveu.
 *
 * ⚠️ AUCUN TIRET, AUCUN FUTUR ADRESSÉ, AUCUN COMPTEUR (FR-031). La première version disait
 * « Compléter mon ciel » : la revue du 2026-09-02 y a lu une jauge en mots (un ciel « à
 * compléter » est un ciel incomplet, exactement ce que FR-031 et EXPERIENCE.md écartent), et un
 * second libellé pour la même porte que « Ajouter mon heure de naissance » sous Aujourd’hui. Un
 * seul libellé, celui du geste, partout : `LIEN_AJOUTER`.
 */

/** Le bouton principal de l'appel, vers `/heure-naissance` : le même libellé que la porte d'Aujourd’hui. */
export const BOUTON_AJOUTER_HEURE = LIEN_AJOUTER;

/**
 * Le résumé du `<details>` qui replie, sous le bouton, l'aveu long (`MESSAGE_SANS_HEURE`) et « où
 * la trouver » (`OU_TROUVER_SON_HEURE`). FR-050 exige qu'ils existent ; le retour du 2026-09-01
 * exige qu'ils ne prennent plus la place. Un pli tient les deux.
 */
export const RESUME_DETAIL_HEURE = "Pourquoi, et où la trouver";

/**
 * Le résumé du `<details>` unique qui regroupe « Les positions, en texte », « Tes angles » et
 * « Tes maisons ». Fermé par défaut : la carte reste visible, le tableau d'éphémérides se demande.
 */
export const TITRE_DETAIL_POSITIONS = "Le détail des positions";

/**
 * Ce que dit « Ton ciel du jour » quand le corpus n'a rien d'écrit pour ce jour.
 *
 * ⚠️ MOT POUR MOT LA PHRASE DE LA CARTE DE L'ACCUEIL (`render/accueil/Bibliotheque.tsx`, cas sans
 * fait). La halte montre la MÊME carte que l'accueil, transportée par la fiche : même titre, même
 * texte, et donc même silence. Un texte de remplacement serait une citation inventée attribuée à
 * une personne réelle (FR-054/FR-086) ; un silence différent de celui de l'accueil se lirait comme
 * une panne d'un côté et un vide de l'autre. `tests/fiche-socle.test.ts` vérifie l'égalité.
 */
export const CIEL_DU_JOUR_NON_ECRIT = "Anima n’a pas encore écrit cette carte.";

/**
 * ⚠️ CES DEUX PORTES VIVENT ICI PLUTÔT QUE DANS LE MENU DE COMPTE, ET C'EST UNE DÉCISION ÉCRITE
 * (amendement d'`EXPERIENCE.md` du 2026-08-25, §1).
 *
 * Ce sont les deux seules choses qui CORRIGENT le socle. Les ranger dans le menu de compte, à côté
 * de « Mes données » et « L'abonnement », les couperait de ce qu'elles réparent : on découvre qu'il
 * manque son heure EN REGARDANT SON CIEL, pas en ouvrant une liste de réglages. Elles sont donc au
 * contact du manque — et elles restent là même quand rien ne manque, parce qu'une porte qui
 * n'apparaît qu'en cas de problème est une porte qu'on ne trouve pas quand on la cherche.
 */
export const PORTES_DU_SOCLE: readonly { readonly titre: string; readonly quoi: string; readonly url: string }[] =
  Object.freeze([
    {
      titre: "Ton heure de naissance",
      quoi: "Elle complète le ciel : l’ascendant, le milieu du ciel et les maisons en dépendent.",
      url: "/heure-naissance",
    },
    {
      titre: "Ton type",
      quoi: "Le test d’ennéagramme : court, interruptible, et repris là où tu l’as laissé.",
      url: "/enneagramme",
    },
    {
      /**
       * ⚠️ CETTE TROISIÈME PORTE BOUCHE UN TROU QUE LA STORY 7.3 CREUSAIT (2026-08-25).
       *
       * Le glyphe de compte remplace le mot « Profil » de la surimpression — et `/profil` était le
       * SEUL chemin vers le formulaire de nom. Le menu de compte, lui, mène à « Réglages », qui ne
       * porte aujourd'hui que le rythme quotidien. Sans cette entrée, changer son prénom devenait
       * impossible autrement qu'en tapant une URL : une fonctionnalité perdue par déplacement, ce
       * qui est la façon la plus discrète d'en perdre une.
       *
       * Sa place ici n'est pas un pis-aller : le nom complet DÉTERMINE trois des six nombres
       * (expression, intime, personnalité). C'est une entrée du socle avant d'être un réglage —
       * `RAISON_NOMBRE` le dit déjà quand ils manquent.
       *
       * Le formulaire vit dans `/reglages` depuis le 2026-08-25 (Story 7.3b), ce qu'`EXPERIENCE.md`
       * ligne 77 spécifiait depuis le 2026-07-21.
       */
      titre: "Ton nom",
      quoi: "Le prénom qu’Anam emploie, et le nom complet dont viennent trois de tes nombres.",
      url: "/reglages",
    },
  ]);

/**
 * ⚠️ L'AVEU QUE LA STORY 7.5 EXIGE PAR ÉCRIT : LES FAITS SONT LÀ, LE SENS NE L'EST PAS.
 *
 * Le corpus de thème natal est à ZÉRO créneau — aucune clé de thème n'existe dans
 * `lib/corpus/textes-de-base.ts`. La halte pourrait taire ce vide et se contenter d'aligner des
 * positions : ce serait un tableau d'éphémérides muet, ce que `cartes-socle.ts` a explicitement
 * refusé de livrer. Elle pourrait aussi le combler — et fabriquerait alors, sous la signature d'une
 * personne réelle, un texte qu'elle n'a pas écrit (FR-054/FR-086).
 *
 * Elle le DIT. C'est la seule des trois issues qui n'abîme rien.
 */
export const SENS_DU_CIEL_NON_ECRIT =
  "Les positions sont exactes ; ce qu’elles racontent n’est pas encore écrit. Anima écrit ces " +
  "textes elle-même, un par un, et je préfère un blanc à des mots qui ne seraient pas les siens.";

export const LECTURE_NUMEROLOGIE_NON_ECRITE =
  "La lecture symbolique d’Anima n’est pas encore écrite. Les calculs affichés restent factuels et vérifiables.";

export const LECTURE_NUMEROLOGIE_PARTIELLE =
  "Seules les lectures symboliques déjà écrites par Anima sont affichées ici.";

export const NOMBRES_INDISPONIBLES =
  "Je n’arrive pas à relire tes nombres en ce moment. Ils ne sont pas perdus ; reviens un peu plus tard.";

export const CIEL_INDISPONIBLE =
  "Je n’arrive pas à relire ton ciel en ce moment. Il n’est pas perdu ; reviens un peu plus tard.";

export const NAISSANCE_ABSENTE =
  "Il me manque ta date de naissance : sans elle, il n’y a rien à calculer.";

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les raisons, une par une
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Les quatre raisons pour lesquelles un nombre ne se calcule pas. Toutes tiennent au NOM COMPLET,
 * qui est facultatif (FR-048) — donc aucune n'est un défaut de sa part, et aucune ne se formule
 * comme un reproche.
 */
export const RAISON_NOMBRE: Readonly<Record<RaisonNombreAbsent, string>> = Object.freeze({
  nom_absent:
    "Ce nombre se compte sur les lettres de ton nom de naissance, et tu ne l’as pas donné. C’est facultatif, et rien d’autre n’en dépend.",
  nom_sans_lettre:
    "Le nom enregistré ne contient aucune lettre à compter, sans doute une saisie qui s’est mal passée.",
  nom_sans_voyelle:
    "Ce nombre se compte sur les voyelles de ton nom, et il n’y en a aucune dans celui qui est enregistré.",
  nom_sans_consonne:
    "Ce nombre se compte sur les consonnes de ton nom, et il n’y en a aucune dans celui qui est enregistré.",
});

/**
 * Les cinq raisons pour lesquelles les angles manquent. Trois se réparent par son heure, deux non —
 * et les deux qui ne se réparent pas le disent, au lieu d’inviter à une démarche inutile.
 */
export const RAISON_ANGLES: Readonly<Record<RaisonSansAngles, string>> = Object.freeze({
  heure_absente:
    "L’ascendant et les maisons se déduisent de l’heure exacte, et elle n’est pas enregistrée.",
  fuseau_absent:
    "Il manque le fuseau horaire du lieu de naissance : sans lui, l’heure enregistrée ne désigne pas un instant précis.",
  fuseau_invalide:
    "Le fuseau horaire enregistré n’est pas reconnu. C’est un défaut de mes données, pas des tiennes : il n’y a rien à refaire de ton côté.",
  coordonnees_absentes:
    "Il manque les coordonnées du lieu de naissance, dont l’ascendant dépend autant que de l’heure.",
  latitude_polaire:
    "Au pôle géographique exact, l’ascendant n’existe pas : ce n’est pas une donnée qui manque, c’est une limite de la notion elle-même.",
});

/** Les trois raisons pour lesquelles un corps ne figure pas dans le ciel. */
export const RAISON_CORPS: Readonly<Record<RaisonAbsenceCorps, string>> = Object.freeze({
  ephemeride_sans_asteroides:
    "La source de calcul que j’emploie ne fournit pas ce corps. Aucune heure ne le ferait apparaître.",
  hors_plage_ephemeride:
    "Ta date de naissance sort de la plage que cette source de calcul couvre pour ce corps.",
  signe_ambigu_sans_heure:
    "Sans ton heure, ce corps change de signe dans la journée de ta naissance et je ne peux pas savoir de quel côté tu es née : je préfère ne pas trancher au hasard.",
});
