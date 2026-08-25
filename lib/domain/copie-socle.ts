import type { RaisonNombreAbsent } from "@/lib/astro/numerologie";
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
 * ⚠️ `URL_CORRIGER_LE_NOM` POINTE SUR `/profil` PARCE QUE LE FORMULAIRE DE NOM Y EST AUJOURD'HUI.
 * L'amendement du 2026-08-25 (`EXPERIENCE.md`, §6) fait disparaître `/profil` et déménage ce
 * formulaire vers `/reglages` ; c'est la Story 7.3 qui pose ce geste, et elle n'aura qu'UNE ligne à
 * changer — ici. Pointer d'avance sur `/reglages` créerait un lien mort dans l'intervalle.
 */
export const URL_CORRIGER_LE_NOM: PorteSocle = Object.freeze({
  libelle: "Ton nom complet",
  url: "/profil",
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
  "modèle : ce sont des nombres et des positions, les mêmes hier et demain.";

export const TITRE_NOMBRES = "Tes nombres";
export const TITRE_CIEL = "Ton ciel de naissance";
export const TITRE_ANGLES = "Tes angles";
export const TITRE_MAISONS = "Tes maisons";
export const TITRE_TYPE = "Ton type";
export const TITRE_MANQUES = "Ce qui manque, et pourquoi";
export const TITRE_PORTES = "Ce que tu peux changer";

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
      quoi: "Elle complète le ciel — l’ascendant, le milieu du ciel et les maisons en dépendent.",
      url: "/heure-naissance",
    },
    {
      titre: "Ton type",
      quoi: "Le test d’ennéagramme : court, interruptible, et repris là où tu l’as laissé.",
      url: "/enneagramme",
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

export const NOMBRES_INDISPONIBLES =
  "Je n’arrive pas à relire tes nombres en ce moment. Ils ne sont pas perdus ; reviens un peu plus tard.";

export const CIEL_INDISPONIBLE =
  "Je n’arrive pas à relire ton ciel en ce moment. Il n’est pas perdu ; reviens un peu plus tard.";

export const NAISSANCE_ABSENTE =
  "Il me manque ta date de naissance — sans elle, il n’y a rien à calculer.";

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
    "Le nom enregistré ne contient aucune lettre à compter — sans doute une saisie qui s’est mal passée.",
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
    "Le fuseau horaire enregistré n’est pas reconnu. C’est un défaut de mes données, pas des tiennes — il n’y a rien à refaire de ton côté.",
  coordonnees_absentes:
    "Il manque les coordonnées du lieu de naissance, dont l’ascendant dépend autant que de l’heure.",
  latitude_polaire:
    "Au pôle géographique exact, l’ascendant n’existe pas — ce n’est pas une donnée qui manque, c’est une limite de la notion elle-même.",
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
