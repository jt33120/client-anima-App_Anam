import type { Corps } from "@/lib/astro/port";
import { CORPS_CLASSIQUES } from "@/lib/astro/port";
import { NOMBRES, type NomNombre, type Numerologie } from "@/lib/astro/numerologie";
import { placer, type ThemeNatal } from "@/lib/astro/theme-natal";
import { texteDe } from "@/lib/corpus/numerologie";
import { texteDuTypeRetenu } from "@/lib/corpus/enneagramme";
import { NON_ECRIT, type TexteCorpus } from "@/lib/corpus/port";
import type { TypeEnneagramme } from "./enneagramme";
import { MESSAGE_TYPE_SANS_TEXTE, MESSAGE_TYPE_ABSENT, URL_PASSER_LE_TEST } from "./enneagramme-items";
import { CORPS_LIBELLE, NOMBRE_LIBELLE, SIGNE_LIBELLE, enSigne } from "./cartes-socle";
import { manquantsDuSocle, reparableParLHeure, type Manquant } from "./socle-incomplet";
import { MESSAGE_SANS_HEURE, OU_TROUVER_SON_HEURE } from "./message-sans-heure";
import {
  RAISON_NOMBRE,
  RAISON_ANGLES,
  RAISON_CORPS,
  URL_CORRIGER_LE_NOM,
  URL_AJOUTER_SON_HEURE,
  PORTES_DU_SOCLE,
} from "./copie-socle";

/**
 * fiche-socle.ts — LA HALTE « TON SOCLE » (Story 7.5 · FR-055, FR-047 à FR-051, FR-031).
 *
 * ══ POURQUOI CET ÉCRAN EXISTE ═══════════════════════════════════════════════════════════════════
 *
 * FR-055 promet la **numérologie complète, gratuite à vie**. Au 2026-08-25, le produit affichait
 * **un texte sur six** : `carteNombres` (`cartes-socle.ts`) ne porte que le chemin de vie, et son
 * propre commentaire renvoyait « les cinq autres ont leur texte dans la fiche du socle » — une fiche
 * qui n'existait pas. Les 69 créneaux de numérologie sont ÉCRITS depuis longtemps ; cinq sixièmes
 * n'étaient lisibles nulle part. Cet écran est la première surface où la promesse est tenue.
 *
 * Même chose pour le ciel : `CORPS_DE_CARTE` limitait l'affichage à CINQ corps — contrainte de
 * vignette assumée en commentaire — et `milieuDuCiel`, calculé depuis la 5.1, n'avait **aucune
 * occurrence** sous `render/` ni `app/`. Jupiter, Saturne, Uranus, Neptune, Pluton et les nœuds
 * paraissent ici pour la première fois.
 *
 * ══ MODULE PUR (AD-1) ═══════════════════════════════════════════════════════════════════════════
 *
 * Il reçoit des résultats DÉJÀ LUS et rend une fiche. Aucune requête, aucune horloge. C'est ce qui
 * permet d'éprouver les cas dégradés — qui sont la majorité — sans base de données.
 *
 * ══ TROIS RÈGLES QUI GOUVERNENT TOUT CE FICHIER ═════════════════════════════════════════════════
 *
 * 1. **UNE ABSENCE SE DIT, ELLE NE SE CREUSE PAS.** Jamais un « — », jamais un « non disponible ».
 *    Chaque manque porte sa raison en langage clair, et le lien qui le répare quand il existe
 *    (FR-050). C'est la règle qui distingue « le produit ne sait pas » de « le produit est cassé ».
 *
 * 2. **AUCUN COMPTE, NULLE PART** (FR-031, DUR). Pas de « 4 nombres sur 6 », pas de taux de
 *    complétude, pas de jauge. Le type transporté n'a aucun champ où en loger un, et
 *    `tests/socle-frontiere.test.ts` le vérifie des DEUX côtés de la frontière de rendu.
 *
 * 3. **AUCUN TEXTE DE REMPLACEMENT N'EST FABRIQUÉ** (FR-054/FR-086). `TexteCorpus` reste une union
 *    jusqu'au rendu : un `?? ""` quelque part transformerait « Anima ne l'a pas encore écrit » en
 *    « il n'y a rien à dire », et les deux s'afficheraient pareil.
 *
 * ══ ⚠️ CE QUE CETTE FICHE ASSUME, PAR ÉCRIT ═════════════════════════════════════════════════════
 *
 * **Le corpus de thème natal est à ZÉRO créneau.** Aucune clé de thème n'existe dans
 * `lib/corpus/textes-de-base.ts`, et `carteTheme` porte `NON_ECRIT` en dur. La halte sort donc les
 * FAITS du ciel — signe, degré, maison, ascendant, milieu du ciel, cuspides — et **dit sur la page**
 * que le sens n'est pas encore écrit. Ce n'est pas un tableau d'éphémérides muet, ce que
 * `cartes-socle.ts` a explicitement refusé : c'est un tableau qui nomme son propre silence.
 * Le chiffrage de ce corpus est la Story 7.6 ; **aucune ligne n'en est écrite ici**.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les formes
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** Ce qui répare une absence. `null` = rien ne la répare, et la fiche le dit plutôt que d'inviter. */
export interface Reparation {
  readonly libelle: string;
  readonly url: string;
}

/** Un nombre, avec SON texte. Les six en ont un — c'est le cœur de FR-055. */
export interface NombreFiche {
  readonly cle: NomNombre;
  readonly intitule: string;
  readonly valeur: string;
  readonly texte: TexteCorpus;
}

/** Un nombre qu'on ne peut pas calculer, avec sa raison DITE et ce qui la répare. */
export interface NombreManquantFiche {
  readonly cle: NomNombre;
  readonly intitule: string;
  readonly raison: string;
  readonly reparation: Reparation | null;
}

/** Une position dans le ciel. `maison` n'existe que si les angles ont pu être calculés. */
export interface PositionFiche {
  readonly cle: Corps;
  readonly intitule: string;
  readonly valeur: string;
  readonly maison: string | null;
}

/** Un angle ou une cuspide — même forme, deux rôles, jamais mélangés dans la même liste. */
export interface AngleFiche {
  readonly intitule: string;
  readonly valeur: string;
}

/** Ce qui manque au ciel, dit et non creusé. */
export interface ManqueFiche {
  readonly intitule: string;
  readonly raison: string;
  readonly reparation: Reparation | null;
}

export interface SectionNombres {
  /** `null` = la lecture a échoué ou la naissance manque ; la phrase EST dans `indisponible`. */
  readonly indisponible: string | null;
  readonly nombres: readonly NombreFiche[];
  readonly manquants: readonly NombreManquantFiche[];
}

export interface SectionCiel {
  readonly indisponible: string | null;
  readonly positions: readonly PositionFiche[];
  readonly angles: readonly AngleFiche[];
  readonly cuspides: readonly AngleFiche[];
  readonly manques: readonly ManqueFiche[];
  /**
   * L'aveu de FR-050, quand — et seulement quand — son heure réparerait quelque chose. C'est
   * `MESSAGE_SANS_HEURE` et `OU_TROUVER_SON_HEURE`, RÉUTILISÉS : deux vérités concurrentes sur la
   * même absence sont un défaut, et celle-ci a déjà son écran (`/heure-naissance`) et sa formulation.
   */
  readonly sansHeure: { readonly aveu: string; readonly ouChercher: string; readonly reparation: Reparation } | null;
}

export interface SectionType {
  /** Le type retenu, ou `null` : le test n'a pas été passé. Jamais une hypothèse — voir plus bas. */
  readonly type: TypeEnneagramme | null;
  readonly intitule: string;
  readonly valeur: string | null;
  readonly texte: TexteCorpus | null;
  /** Ce qui est vrai quand `type === null` : c'est le TEST qui attend, pas Anima qui n'a rien écrit. */
  readonly absence: { readonly phrase: string; readonly reparation: Reparation } | null;
}

/** Une porte du socle : ce qu'on peut changer, et où. Même forme qu'une entrée de menu. */
export interface PorteFiche {
  readonly titre: string;
  readonly quoi: string;
  readonly url: string;
}

export interface FicheSocle {
  readonly nombres: SectionNombres;
  readonly ciel: SectionCiel;
  readonly type: SectionType;
  /**
   * ⚠️ TOUJOURS PRÉSENTES, MÊME QUAND RIEN NE MANQUE. Une porte qui n'apparaît qu'en cas de
   * problème est une porte qu'on ne trouve pas quand on la cherche — et elles quittent `/profil`
   * en Story 7.2, donc ce serait le seul endroit où les atteindre.
   */
  readonly portes: readonly PorteFiche[];
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les nombres — les SIX, avec leurs SIX textes (FR-055)
// ══════════════════════════════════════════════════════════════════════════════════════════════

export function sectionNombres(numerologie: Numerologie | null, indisponible: string | null): SectionNombres {
  if (numerologie === null) {
    return Object.freeze({ indisponible, nombres: [], manquants: [] });
  }
  const nombres: NombreFiche[] = [];
  const manquants: NombreManquantFiche[] = [];
  for (const cle of NOMBRES) {
    const lecture = numerologie.nombres[cle];
    const intitule = NOMBRE_LIBELLE[cle];
    if (lecture.statut === "calcule") {
      // ⚠️ `texteDe` rend `null` quand la clé sort du corpus (une valeur hors des possibles). On
      // retombe alors sur NON_ECRIT — jamais sur une chaîne vide, qui se lirait « rien à dire ».
      nombres.push({ cle, intitule, valeur: String(lecture.valeur), texte: texteDe(cle, lecture) ?? NON_ECRIT });
      continue;
    }
    manquants.push({
      cle,
      intitule,
      raison: RAISON_NOMBRE[lecture.raison],
      // Les quatre raisons se réparent toutes par le nom complet — c'est la même démarche, et elle
      // est à un clic. Une absence réparable qui ne porte pas son lien est un reproche déguisé.
      reparation: { libelle: URL_CORRIGER_LE_NOM.libelle, url: URL_CORRIGER_LE_NOM.url },
    });
  }
  return Object.freeze({ indisponible: null, nombres: Object.freeze(nombres), manquants: Object.freeze(manquants) });
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le ciel — tout ce que le thème contient, jamais cinq corps
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * L'ordre d'affichage : les dix classiques dans l'ordre traditionnel, puis les compléments.
 *
 * ⚠️ ON N'ÉCRIT PAS « DIX ». La liste est dérivée de `CORPS_CLASSIQUES` (le port) plus les
 * compléments nommés : le jour où une source livre Chiron, il paraît sans qu'on touche à ce fichier.
 * Un `10` en dur ici serait un troisième endroit à mettre à jour, et le seul qu'on oublierait.
 */
const ORDRE_CORPS: readonly Corps[] = Object.freeze([
  ...CORPS_CLASSIQUES,
  "noeud_moyen",
  "noeud_vrai",
  "chiron",
]);

const ORDINAL_MAISON = [
  "",
  "première",
  "deuxième",
  "troisième",
  "quatrième",
  "cinquième",
  "sixième",
  "septième",
  "huitième",
  "neuvième",
  "dixième",
  "onzième",
  "douzième",
] as const;

export function sectionCiel(theme: ThemeNatal | null, indisponible: string | null): SectionCiel {
  if (theme === null) {
    return Object.freeze({ indisponible, positions: [], angles: [], cuspides: [], manques: [], sansHeure: null });
  }
  const avecDegre = theme.precision === "heure_connue";

  const positions: PositionFiche[] = [];
  for (const cle of ORDRE_CORPS) {
    const position = theme.positions.find((p) => p.corps === cle);
    if (!position) continue; // absent : il est dit dans `manques`, jamais creusé ici.
    const intitule = CORPS_LIBELLE[cle];
    if (!intitule) continue;
    positions.push({
      cle,
      intitule,
      valeur: enSigne(position.signe, position.degre, avecDegre),
      maison: position.maison ? `${ORDINAL_MAISON[position.maison]} maison` : null,
    });
  }

  const angles: AngleFiche[] = [];
  const cuspides: AngleFiche[] = [];
  if (theme.angles.statut === "calcule") {
    const asc = placer(theme.angles.ascendant);
    angles.push({ intitule: "Ascendant", valeur: enSigne(asc.signe, asc.degre, avecDegre) });
    // ⚠️ LE MILIEU DU CIEL EST CALCULÉ DEPUIS LA 5.1 ET N'A JAMAIS ÉTÉ AFFICHÉ NULLE PART. C'est
    // ici, et un test de rendu échoue s'il disparaît.
    const mc = placer(theme.angles.milieuDuCiel);
    angles.push({ intitule: "Milieu du ciel", valeur: enSigne(mc.signe, mc.degre, avecDegre) });
    // Les douze cuspides, en SIGNES ENTIERS — le seul système que le produit livre. Le degré n'a
    // aucun sens ici : dans ce système, une maison commence au 0° de son signe, par construction.
    theme.angles.maisons.forEach((longitude, i) => {
      cuspides.push({
        intitule: `${ORDINAL_MAISON[i + 1]} maison`,
        valeur: SIGNE_LIBELLE[placer(longitude).signe],
      });
    });
  }

  const inventaire = manquantsDuSocle(theme);
  const manques = inventaire.map(manqueLisible);
  // ⚠️ L'AVEU N'EST PAS « LES ANGLES MANQUENT » : il est « au moins une absence serait comblée par
  // ton heure ». Au pôle géographique exact, l'ascendant n'existe pas et aucune heure ne le fera
  // exister — l'inviter à retourner à la mairie serait lui faire porter une limite de la notion.
  const reparableParElle = inventaire.some(reparableParLHeure);

  return Object.freeze({
    indisponible: null,
    positions: Object.freeze(positions),
    angles: Object.freeze(angles),
    cuspides: Object.freeze(cuspides),
    manques: Object.freeze(manques),
    sansHeure: reparableParElle
      ? Object.freeze({
          aveu: MESSAGE_SANS_HEURE,
          ouChercher: OU_TROUVER_SON_HEURE,
          reparation: { libelle: URL_AJOUTER_SON_HEURE.libelle, url: URL_AJOUTER_SON_HEURE.url },
        })
      : null,
  });
}

function manqueLisible(m: Manquant): ManqueFiche {
  const reparation = reparableParLHeure(m)
    ? { libelle: URL_AJOUTER_SON_HEURE.libelle, url: URL_AJOUTER_SON_HEURE.url }
    : null;
  if (m.quoi === "angles") {
    return { intitule: "L’ascendant, le milieu du ciel et les maisons", raison: RAISON_ANGLES[m.raison], reparation };
  }
  return { intitule: CORPS_LIBELLE[m.corps] ?? "Un corps", raison: RAISON_CORPS[m.raison], reparation };
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le type — et la seule chose que la halte a le droit d'en dire
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ LA HALTE MONTRE LE TYPE **RETENU**, ET C'EST CE QUI LUI VAUT LA MENTION IA.
 *
 * Un type retenu peut avoir deux origines (`lib/data/lire-enneagramme.ts` : `"test" | "hypothese"`).
 * Dans le second cas, la VALEUR a été proposée par un modèle et acceptée par elle — c'est un type
 * retenu, pas une hypothèse flottante, et le lui cacher serait lui mentir sur son propre socle.
 *
 * Mais cela suffit à faire de cette page une surface où paraît quelque chose qu'un modèle a produit
 * (AI Act art. 50 §2). `piedPour("socle")` porte donc `mention: true`, avec ce motif écrit — la
 * seule alternative honnête aurait été de n'afficher que les types issus du test, ce qui aurait dit
 * « le test t'attend » à quelqu'un qui a déjà un type. On ne trie pas l'affichage pour s'épargner
 * une mention.
 *
 * Les TEXTES, eux — ceux des nombres comme celui du type — viennent tous du corpus d'Anima, jamais
 * d'un modèle : c'est la frontière FR-054/FR-086, et elle ne bouge pas.
 */
export function sectionType(type: TypeEnneagramme | null): SectionType {
  if (type === null) {
    return Object.freeze({
      type: null,
      intitule: "Ton type",
      valeur: null,
      texte: null,
      absence: Object.freeze({
        phrase: MESSAGE_TYPE_ABSENT,
        reparation: { libelle: URL_PASSER_LE_TEST.libelle, url: URL_PASSER_LE_TEST.url },
      }),
    });
  }
  const texte = texteDuTypeRetenu(type);
  return Object.freeze({
    type,
    intitule: "Ton type",
    valeur: `Type ${type}`,
    // Quand le créneau est vide, c'est `MESSAGE_TYPE_SANS_TEXTE` qui le dit — voix produit, jamais
    // un texte de remplacement écrit à la place d'Anima (FR-054/FR-086).
    texte,
    absence: null,
  });
}

export function ficheSocle(
  numerologie: Numerologie | null,
  theme: ThemeNatal | null,
  type: TypeEnneagramme | null,
  indisponibles: { readonly nombres: string | null; readonly ciel: string | null },
): FicheSocle {
  return Object.freeze({
    nombres: sectionNombres(numerologie, indisponibles.nombres),
    ciel: sectionCiel(theme, indisponibles.ciel),
    type: sectionType(type),
    portes: PORTES_DU_SOCLE,
  });
}

/** Réexporté pour le rendu, qui doit pouvoir dire le silence du corpus sans le fabriquer. */
export { MESSAGE_TYPE_SANS_TEXTE };
