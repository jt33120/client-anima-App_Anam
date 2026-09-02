import type { Corps } from "@/lib/astro/port";
import { CORPS_CLASSIQUES } from "@/lib/astro/port";
import {
  NOMBRES,
  tracerNumerologie,
  type EntreesNumerologie,
  type NomNombre,
  type Numerologie,
  type TraceNombreNumerologique,
  type TraceReductionNumerologique,
} from "@/lib/astro/numerologie";
import { placer, type ThemeNatal } from "@/lib/astro/theme-natal";
import { texteDe } from "@/lib/corpus/numerologie";
import { texteDuTypeRetenu } from "@/lib/corpus/enneagramme";
import type { TexteCorpus } from "@/lib/corpus/port";
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
  LECTURE_NUMEROLOGIE_NON_ECRITE,
  LECTURE_NUMEROLOGIE_PARTIELLE,
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

/** Un nombre et la preuve arithmétique qui permet de le vérifier. */
export interface NombreFiche {
  readonly cle: NomNombre;
  readonly intitule: string;
  readonly valeur: string;
  readonly calcul: readonly string[];
}

/** Un fait d'entrée ou de méthode : intitulé et valeur, sans interprétation. */
export interface FaitFiche {
  readonly intitule: string;
  readonly valeur: string;
}

/**
 * Une lecture écrite : séparée du nombre et de son calcul. L'intitulé porte le nombre lu —
 * « Chemin de vie (7) » — pour que le libellé et le texte (« Ton chemin de vie 7 symbolise… ») se
 * répondent sous le pli, là où la grille des nombres n'est plus sous les yeux (retour du 2026-09-02).
 */
export interface LectureSymboliqueFiche {
  readonly cle: NomNombre;
  readonly intitule: string;
  readonly texte: string;
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
  /** Valeur textuelle exacte, absente quand l'heure n'autorise pas cette précision. */
  readonly longitude: string | null;
  /** Nombre décimal sérialisé pour le seul placement SVG, jamais affiché comme une interprétation. */
  readonly projection: string | null;
}

/** Un angle ou une cuspide — même forme, deux rôles, jamais mélangés dans la même liste. */
export interface AngleFiche {
  readonly intitule: string;
  readonly valeur: string;
  readonly longitude: string | null;
  readonly projection: string | null;
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
  readonly entrees: readonly FaitFiche[];
  readonly conventions: readonly string[];
  readonly nombres: readonly NombreFiche[];
  readonly manquants: readonly NombreManquantFiche[];
  readonly lecturesSymboliques: readonly LectureSymboliqueFiche[];
  /** Une seule note pour tout le corpus, jamais une répétition sous chaque nombre. */
  readonly noteLectureSymbolique: string | null;
}

export interface SectionCiel {
  readonly indisponible: string | null;
  readonly projection: {
    readonly titre: string;
    readonly description: string;
    readonly repere: string;
    readonly source: string;
  } | null;
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

export interface ApercuUniversFiche {
  readonly cle: "astrologie" | "numerologie" | "psychologie";
  readonly titre: string;
  readonly accroche: string;
  readonly url: string;
  readonly faits: readonly FaitFiche[];
}

export interface FicheSocle {
  readonly nombres: SectionNombres;
  readonly ciel: SectionCiel;
  readonly type: SectionType;
  readonly apercus: readonly ApercuUniversFiche[];
  /**
   * ⚠️ TOUJOURS PRÉSENTES, MÊME QUAND RIEN NE MANQUE. Une porte qui n'apparaît qu'en cas de
   * problème est une porte qu'on ne trouve pas quand on la cherche — et elles quittent `/profil`
   * en Story 7.2, donc ce serait le seul endroit où les atteindre.
   */
  readonly portes: readonly PorteFiche[];
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les nombres — résultat, preuve du calcul, puis lecture symbolique séparée
// ══════════════════════════════════════════════════════════════════════════════════════════════

function cheminReduction(trace: TraceReductionNumerologique): string {
  return trace.etapes.join(" → ");
}

function dernier(trace: TraceReductionNumerologique): number {
  return trace.etapes.at(-1)!;
}

function sommeTrace(termes: readonly number[], trace: TraceReductionNumerologique): string {
  const reduction = cheminReduction(trace);
  return `${termes.join(" + ")} = ${reduction}`;
}

function calculLisible(cle: NomNombre, trace: TraceNombreNumerologique | null): readonly string[] {
  if (!trace) return Object.freeze([]);
  if (trace.origine === "date_separee") {
    return Object.freeze([
      `Jour : ${cheminReduction(trace.jour)}`,
      `Mois : ${cheminReduction(trace.mois)}`,
      `Année : ${cheminReduction(trace.annee)}`,
      `Total : ${sommeTrace([dernier(trace.jour), dernier(trace.mois), dernier(trace.annee)], trace.total)}`,
    ]);
  }
  if (trace.origine === "jour_naissance") {
    return Object.freeze([`Jour du mois : ${cheminReduction(trace.total)}`]);
  }
  if (trace.origine === "annee_personnelle") {
    return Object.freeze([
      `Jour : ${cheminReduction(trace.jour)}`,
      `Mois : ${cheminReduction(trace.mois)}`,
      `Année de référence : ${cheminReduction(trace.anneeDeReference)}`,
      `Total : ${sommeTrace(
        [dernier(trace.jour), dernier(trace.mois), dernier(trace.anneeDeReference)],
        trace.total,
      )}`,
    ]);
  }
  const selection =
    cle === "intime" ? "Voyelles comptées" : cle === "personnalite" ? "Consonnes comptées" : "Lettres comptées";
  return Object.freeze([
    `${selection} : ${trace.lettres}`,
    `Valeurs : ${sommeTrace(trace.valeurs, trace.total)}`,
  ]);
}

function dateLisible(iso: string): string {
  const correspondance = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return correspondance
    ? `${correspondance[3]}/${correspondance[2]}/${correspondance[1]}`
    : iso;
}

export function sectionNombres(
  numerologie: Numerologie | null,
  indisponible: string | null,
  entrees?: EntreesNumerologie | null,
  lecteurTexte: typeof texteDe = texteDe,
): SectionNombres {
  if (numerologie === null) {
    return Object.freeze({
      indisponible,
      entrees: [],
      conventions: [],
      nombres: [],
      manquants: [],
      lecturesSymboliques: [],
      noteLectureSymbolique: null,
    });
  }
  const trace = entrees ? tracerNumerologie(entrees, numerologie.anneeDeReference) : null;
  const nombres: NombreFiche[] = [];
  const manquants: NombreManquantFiche[] = [];
  const lecturesSymboliques: LectureSymboliqueFiche[] = [];
  let auMoinsUnTexteAbsent = false;
  for (const cle of NOMBRES) {
    const lecture = numerologie.nombres[cle];
    const intitule = NOMBRE_LIBELLE[cle];
    if (lecture.statut === "calcule") {
      const valeur = String(lecture.valeur);
      nombres.push({
        cle,
        intitule,
        valeur,
        calcul: calculLisible(cle, trace?.nombres[cle] ?? null),
      });
      const texte = lecteurTexte(cle, lecture);
      if (texte?.statut === "ecrit") {
        // Retour du fondateur (2026-09-02) : « rajoute le chiffre à côté de ce à quoi il
        // correspond, exemple : Chemin de vie (7) ». La lecture vit sous un pli, loin de la grille
        // où le nombre s'affiche en grand ; sans lui, « Chemin de vie » coiffe un texte qui commence
        // par « Ton chemin de vie 7 symbolise… » et les deux ne se répondent pas. On enrichit
        // l'INTITULÉ plutôt que d'ajouter un champ : la frontière de rendu (`render/socle/types.ts`,
        // gardée champ pour champ) ne bouge pas et le rendu reste muet (AD-7). Un nombre maître
        // s'écrit « Expression (11) », jamais « (11/2) » : la réduction est déjà dite dans le texte,
        // et « 11/2 » a la forme d'un compte (FR-031). La grille, elle, garde son intitulé nu — y
        // répéter « (7) » sous un 7 en `t-display` serait absurde.
        lecturesSymboliques.push({ cle, intitule: `${intitule} (${valeur})`, texte: texte.texte });
      } else {
        auMoinsUnTexteAbsent = true;
      }
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

  const faitsEntree: readonly FaitFiche[] = entrees
    ? Object.freeze([
        { intitule: "Date de naissance", valeur: dateLisible(entrees.date) },
        { intitule: "Nom de naissance", valeur: entrees.nomComplet?.trim() || "Non renseigné" },
        { intitule: "Année de référence", valeur: String(numerologie.anneeDeReference) },
      ])
    : Object.freeze([{ intitule: "Année de référence", valeur: String(numerologie.anneeDeReference) }]);
  const conventions = Object.freeze([
    "Table pythagoricienne : A vaut 1, B vaut 2… I vaut 9, puis le cycle recommence.",
    "Le chemin de vie réduit séparément le jour, le mois et l’année avant de les additionner.",
    "Les nombres maîtres 11, 22 et 33 sont conservés, sauf pour l’année personnelle.",
    "La lettre Y est comptée comme une voyelle.",
    "L’année personnelle change au 1er janvier.",
  ]);
  const noteLectureSymbolique = auMoinsUnTexteAbsent
    ? lecturesSymboliques.length === 0
      ? LECTURE_NUMEROLOGIE_NON_ECRITE
      : LECTURE_NUMEROLOGIE_PARTIELLE
    : null;

  return Object.freeze({
    indisponible: null,
    entrees: faitsEntree,
    conventions,
    nombres: Object.freeze(nombres),
    manquants: Object.freeze(manquants),
    lecturesSymboliques: Object.freeze(lecturesSymboliques),
    noteLectureSymbolique,
  });
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

function longitudeNormalisee(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function longitudeLisible(longitude: number): string {
  return `${longitudeNormalisee(longitude).toFixed(2).replace(".", ",")}°`;
}

function longitudeProjetee(longitude: number): string {
  return longitudeNormalisee(longitude).toFixed(6);
}

export function sectionCiel(theme: ThemeNatal | null, indisponible: string | null): SectionCiel {
  if (theme === null) {
    return Object.freeze({
      indisponible,
      projection: null,
      positions: [],
      angles: [],
      cuspides: [],
      manques: [],
      sansHeure: null,
    });
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
      longitude: avecDegre ? longitudeLisible(position.longitude) : null,
      projection: avecDegre ? longitudeProjetee(position.longitude) : null,
    });
  }

  const angles: AngleFiche[] = [];
  const cuspides: AngleFiche[] = [];
  if (theme.angles.statut === "calcule") {
    const asc = placer(theme.angles.ascendant);
    angles.push({
      intitule: "Ascendant",
      valeur: enSigne(asc.signe, asc.degre, avecDegre),
      longitude: avecDegre ? longitudeLisible(theme.angles.ascendant) : null,
      projection: avecDegre ? longitudeProjetee(theme.angles.ascendant) : null,
    });
    // ⚠️ LE MILIEU DU CIEL EST CALCULÉ DEPUIS LA 5.1 ET N'A JAMAIS ÉTÉ AFFICHÉ NULLE PART. C'est
    // ici, et un test de rendu échoue s'il disparaît.
    const mc = placer(theme.angles.milieuDuCiel);
    angles.push({
      intitule: "Milieu du ciel",
      valeur: enSigne(mc.signe, mc.degre, avecDegre),
      longitude: avecDegre ? longitudeLisible(theme.angles.milieuDuCiel) : null,
      projection: avecDegre ? longitudeProjetee(theme.angles.milieuDuCiel) : null,
    });
    // Les douze cuspides, en SIGNES ENTIERS — le seul système que le produit livre. Le degré n'a
    // aucun sens ici : dans ce système, une maison commence au 0° de son signe, par construction.
    theme.angles.maisons.forEach((longitude, i) => {
      cuspides.push({
        intitule: `${ORDINAL_MAISON[i + 1]} maison`,
        valeur: SIGNE_LIBELLE[placer(longitude).signe],
        longitude: avecDegre ? longitudeLisible(longitude) : null,
        projection: avecDegre ? longitudeProjetee(longitude) : null,
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
    projection: avecDegre && positions.length > 0
      ? Object.freeze({
          titre: "Carte exacte de ton ciel de naissance",
          description:
            "Projection circulaire des longitudes écliptiques calculées. La liste qui suit donne les mêmes positions en texte.",
          repere: "0° est placé en haut ; les longitudes progressent dans le sens horaire.",
          source: theme.adaptateur,
        })
      : null,
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

function apercusDuSocle(
  nombres: SectionNombres,
  ciel: SectionCiel,
  type: SectionType,
): readonly ApercuUniversFiche[] {
  const nombre = (cle: NomNombre) => nombres.nombres.find((entree) => entree.cle === cle);
  const position = (cle: Corps) => ciel.positions.find((entree) => entree.cle === cle);
  const ascendant = ciel.angles.find((entree) => entree.intitule === "Ascendant");

  const faitsNombres: FaitFiche[] = [];
  for (const cle of ["chemin_de_vie", "annee_personnelle"] as const) {
    const entree = nombre(cle);
    if (entree) faitsNombres.push({ intitule: entree.intitule, valeur: entree.valeur });
  }
  if (faitsNombres.length === 0 && nombres.indisponible) {
    faitsNombres.push({ intitule: "État", valeur: nombres.indisponible });
  }

  const faitsCiel: FaitFiche[] = [];
  for (const cle of ["soleil", "lune"] as const) {
    const entree = position(cle);
    if (entree) faitsCiel.push({ intitule: entree.intitule, valeur: entree.valeur });
  }
  if (ascendant) faitsCiel.push({ intitule: ascendant.intitule, valeur: ascendant.valeur });
  if (faitsCiel.length === 0 && ciel.indisponible) {
    faitsCiel.push({ intitule: "État", valeur: ciel.indisponible });
  }

  return Object.freeze([
    Object.freeze({
      cle: "numerologie",
      titre: "Numérologie",
      accroche: nombres.indisponible
        ? "Le détail distingue l’incident d’une donnée absente."
        : "Tes repères essentiels, avec chaque calcul vérifiable.",
      url: "/socle?univers=numerologie",
      faits: Object.freeze(faitsNombres),
    }),
    Object.freeze({
      cle: "astrologie",
      titre: "Astrologie",
      accroche: ciel.indisponible
        ? "Le détail distingue l’incident d’une donnée absente."
        : ciel.projection
          ? "Ton ciel calculé, sa carte exacte et sa version textuelle."
          : "Les positions certaines, sans inventer la précision qui manque.",
      url: "/socle?univers=astrologie",
      faits: Object.freeze(faitsCiel),
    }),
    Object.freeze({
      cle: "psychologie",
      titre: "Psychologie",
      accroche: type.valeur
        ? "Le repère psychologique que tu as choisi de garder."
        : "Ton espace psychologique et le chemin vers le test.",
      url: "/psychologie",
      faits: Object.freeze([
        {
          intitule: type.intitule,
          valeur: type.valeur ?? "Aucun type retenu pour le moment.",
        },
      ]),
    }),
  ]);
}

export function ficheSocle(
  numerologie: Numerologie | null,
  theme: ThemeNatal | null,
  type: TypeEnneagramme | null,
  indisponibles: { readonly nombres: string | null; readonly ciel: string | null },
  entreesNumerologie?: EntreesNumerologie | null,
): FicheSocle {
  const nombres = sectionNombres(numerologie, indisponibles.nombres, entreesNumerologie);
  const ciel = sectionCiel(theme, indisponibles.ciel);
  const sectionDuType = sectionType(type);
  return Object.freeze({
    nombres,
    ciel,
    type: sectionDuType,
    apercus: apercusDuSocle(nombres, ciel, sectionDuType),
    portes: PORTES_DU_SOCLE,
  });
}

/** Réexporté pour le rendu, qui doit pouvoir dire le silence du corpus sans le fabriquer. */
export { MESSAGE_TYPE_SANS_TEXTE };
