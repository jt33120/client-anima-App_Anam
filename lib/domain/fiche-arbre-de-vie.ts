import {
  CLES_ARBRE,
  calculerArbreDeVie,
  dynamiqueDeVie,
  type ArbreDeVie,
  type CleArbre,
  type EntreesArbre,
  type LectureCleArbre,
} from "@/lib/astro/arbre-de-vie";
import { cheminDeVie, estMaitre, reduireSansMaitre } from "@/lib/astro/numerologie";
import {
  texteDeArbre,
  texteDeLaDynamique,
  texteDeLaQualite,
  texteDuCheminDeVie,
  texteDuDefi,
} from "@/lib/corpus/arbre-de-vie";
import type { TexteCorpus } from "@/lib/corpus/port";
import { ARCHETYPE_NOMBRE } from "@/lib/domain/fiche-socle";
import * as copie from "@/lib/domain/copie-arbre-de-vie";

/**
 * fiche-arbre-de-vie.ts — LE MODÈLE DE VUE DE LA HALTE « TON ARBRE DE VIE ».
 *
 * Module PUR (AD-1) : il reçoit des entrées déjà lues, il ne requête rien, il n'a pas d'horloge.
 * Il assemble le calcul (`lib/astro`), le corpus (`lib/corpus`) et la copie produit
 * (`copie-arbre-de-vie.ts`) en une fiche GELÉE que le rendu se contente de dessiner (AD-7).
 *
 * ── TROIS RÈGLES QUI TIENNENT TOUT LE FICHIER ─────────────────────────────────────────────────
 *
 * 1. `TexteCorpus` RESTE UNE UNION jusqu'au dernier pixel. Aucun `?? ""`, aucun `|| "…"` : un
 *    créneau non écrit doit pouvoir se dire autrement qu'un texte vide, et en voix PRODUIT.
 *
 * 2. UNE ABSENCE SE DIT, ELLE NE SE CREUSE PAS (FR-050). Chaque partie non calculée porte sa raison
 *    en langage clair et, quand la réparation existe, son lien. Jamais « — », jamais « indisponible ».
 *
 * 3. AUCUN COMPTE, NULLE PART (FR-031, DUR). Les neuf qualités traversent en ÉNUMÉRATION
 *    (« absente », « discrète », « marquée ») : le type transporté n'a aucun champ où un compte
 *    pourrait se loger, et le nombre de lettres d'un nom ne quitte jamais `lib/astro`.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les types de la fiche
// ══════════════════════════════════════════════════════════════════════════════════════════════

export interface ReparationFiche {
  readonly libelle: string;
  readonly url: string;
}

export interface ManqueFiche {
  readonly raison: string;
  readonly reparation: ReparationFiche | null;
}

/**
 * Une partie de l'arbre : une des sept clés, la dynamique de vie, ou le chemin de vie.
 *
 * ⚠️ `valeur` ET `manque` SONT EXCLUSIFS, exactement un des deux est non nul. Deux champs plutôt
 * qu'une union parce que la frontière de rendu s'apparie champ pour champ : une union y deviendrait
 * illisible, et c'est cet appariement qui garantit qu'aucune mesure ne se glisse d'un côté.
 */
export interface PartieArbreFiche {
  readonly cle: string;
  /** L'identifiant de la section. Le SEUL contrat entre une pastille du dessin et son texte. */
  readonly ancre: string;
  readonly intitule: string;
  readonly role: string;
  readonly origine: string;
  /** Le nombre DÉJÀ mis en mots : « 7 », « 11/2 ». Jamais un nombre brut (FR-031). */
  readonly valeur: string | null;
  readonly archetype: string | null;
  readonly texte: TexteCorpus | null;
  readonly manque: ManqueFiche | null;
}

export interface DefiFiche {
  readonly cle: string;
  /** « Le défi du travail ». Nommé par son terrain, JAMAIS par un rang (voir `INTRODUCTION_DEFIS`). */
  readonly intitule: string;
  readonly valeur: string;
  readonly origine: string;
  readonly texte: TexteCorpus;
}

export interface QualiteFiche {
  readonly cle: string;
  readonly intitule: string;
  readonly valeur: string;
  readonly lettres: string;
  /** « Ces lettres ne sont pas dans ton nom ». Trois libellés possibles, jamais un compte. */
  readonly presence: string;
  readonly texte: TexteCorpus;
}

/** Une pastille du dessin : un point à toucher, qui mène à sa section. */
export interface PastilleFiche {
  readonly cle: string;
  readonly ancre: string;
  readonly intitule: string;
  readonly valeur: string | null;
}

export interface FicheArbreDeVie {
  readonly indisponible: string | null;
  readonly porteIndisponible: ReparationFiche | null;
  readonly pastilles: readonly PastilleFiche[];
  readonly triangle: readonly PartieArbreFiche[];
  readonly comportement: readonly PartieArbreFiche[];
  readonly dynamique: PartieArbreFiche | null;
  readonly defis: readonly DefiFiche[];
  readonly qualites: readonly QualiteFiche[];
  readonly manqueQualites: ManqueFiche | null;
  readonly cheminDeVie: PartieArbreFiche | null;
  readonly porteNombres: ReparationFiche | null;
  readonly conventions: readonly string[];
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// L'assemblage
// ══════════════════════════════════════════════════════════════════════════════════════════════

const TRIANGLE: readonly CleArbre[] = Object.freeze(["racine_premiere", "racine_seconde", "tronc"]);
const COMPORTEMENT: readonly CleArbre[] = Object.freeze(["ecorce", "branches", "feuilles", "cime"]);

/** L'ancre d'une section. Les soulignés deviennent des tirets : un identifiant HTML se lit. */
function ancreDe(cle: string): string {
  return cle.replace(/_/g, "-");
}

/**
 * Le nombre mis en mots.
 *
 * ⚠️ « 11/2 » EST UNE AFFAIRE DE RENDU, PAS DE CALCUL. Le socle rend `{valeur: 11, maitre: true}` et
 * rien d'autre ; c'est ici que la réduction s'écrit à côté du maître, parce que c'est la convention
 * de lecture de la numérologie francophone et que la copie l'explique juste au-dessus.
 */
function valeurLisible(valeur: number): string {
  return estMaitre(valeur) ? `${valeur}/${reduireSansMaitre(valeur)}` : String(valeur);
}

function manqueDe(lecture: LectureCleArbre): ManqueFiche | null {
  if (lecture.statut === "calcule") return null;
  return Object.freeze({
    raison: copie.RAISON_CLE[lecture.raison],
    // Les cinq raisons se réparent par le même formulaire, à un clic — mais le lien NOMME ce qui
    // manque, jamais « le nom complet » sous une absence de prénoms. Une absence réparable qui ne
    // porte pas son lien est un reproche déguisé ; un lien qui désigne le mauvais champ aussi.
    reparation: copie.reparationDe(lecture.raison),
  });
}

function partie(
  cle: CleArbre,
  lecture: LectureCleArbre,
  lecteur: typeof texteDeArbre,
): PartieArbreFiche {
  return Object.freeze({
    cle,
    ancre: ancreDe(cle),
    intitule: copie.INTITULE_CLE[cle],
    role: copie.ROLE_CLE[cle],
    origine: copie.ORIGINE_CLE[cle],
    valeur: lecture.statut === "calcule" ? valeurLisible(lecture.valeur) : null,
    archetype: lecture.statut === "calcule" ? (ARCHETYPE_NOMBRE[lecture.valeur] ?? null) : null,
    texte: lecteur(cle, lecture),
    manque: manqueDe(lecture),
  });
}

function partieDynamique(lecture: LectureCleArbre): PartieArbreFiche {
  return Object.freeze({
    cle: "dynamique_de_vie",
    ancre: "dynamique-de-vie",
    intitule: copie.INTITULE_DYNAMIQUE,
    role: copie.INTRODUCTION_DYNAMIQUE,
    origine: copie.ORIGINE_DYNAMIQUE,
    valeur: lecture.statut === "calcule" ? valeurLisible(lecture.valeur) : null,
    archetype: lecture.statut === "calcule" ? (ARCHETYPE_NOMBRE[lecture.valeur] ?? null) : null,
    texte: texteDeLaDynamique(lecture),
    manque: manqueDe(lecture),
  });
}

function partieCheminDeVie(iso: string): PartieArbreFiche {
  const valeur = cheminDeVie(iso);
  const lecture = { statut: "calcule", valeur, maitre: estMaitre(valeur) } as const;
  return Object.freeze({
    cle: "chemin_de_vie",
    ancre: "chemin-de-vie",
    intitule: copie.INTITULE_CHEMIN_DE_VIE,
    role: copie.INTRODUCTION_CHEMIN_DE_VIE,
    origine: copie.ORIGINE_CLE.tronc,
    valeur: valeurLisible(valeur),
    archetype: ARCHETYPE_NOMBRE[valeur] ?? null,
    // ⚠️ IL LIT LE CORPUS DU SOCLE. Un même nombre ne peut pas porter deux textes à deux endroits
    // du produit : le jour où ils divergeraient, personne ne saurait lequel fait foi.
    texte: texteDuCheminDeVie(lecture),
    manque: null,
  });
}

function defisDe(arbre: ArbreDeVie): readonly DefiFiche[] {
  return Object.freeze(
    arbre.defis.map((valeur, rang) =>
      Object.freeze({
        // Le rang ne sert qu'à distinguer deux défis de même valeur dans une liste React. Il ne
        // s'affiche jamais : quatre défis numérotés se liraient comme quatre paliers (FR-031).
        cle: `defi-${rang + 1}`,
        intitule: `Le défi ${copie.THEME_DEFI[valeur]}`,
        valeur: String(valeur),
        origine: copie.ORIGINE_DEFI,
        texte: texteDuDefi(valeur),
      }),
    ),
  );
}

function qualitesDe(arbre: ArbreDeVie): {
  readonly qualites: readonly QualiteFiche[];
  readonly manque: ManqueFiche | null;
} {
  if (arbre.qualites.statut !== "calcule") {
    return {
      qualites: Object.freeze([]),
      manque: Object.freeze({
        raison: copie.RAISON_CLE[arbre.qualites.raison],
        reparation: copie.reparationDe(arbre.qualites.raison),
      }),
    };
  }
  return {
    qualites: Object.freeze(
      arbre.qualites.qualites.map((q) =>
        Object.freeze({
          cle: `qualite-${q.valeur}`,
          intitule: copie.NOM_QUALITE[q.valeur],
          valeur: String(q.valeur),
          lettres: copie.LETTRES_QUALITE[q.valeur],
          presence: copie.INTENSITE_LIBELLE[q.intensite],
          texte: texteDeLaQualite(q),
        }),
      ),
    ),
    manque: null,
  };
}

/**
 * LA FICHE COMPLÈTE.
 *
 * `entrees` à `null` veut dire qu'on n'a rien pu lire : `indisponible` porte alors la phrase, et la
 * fiche est vide. ⚠️ ON NE DESSINE PAS D'ARBRE SANS NOMBRES — un arbre affiché vide se lirait comme
 * une perte de données, et pas comme un parcours qui n'est pas allé au bout.
 *
 * `lecteur` est injecté pour que les tests puissent éprouver la fiche avec un corpus écrit avant
 * qu'Anima n'ait écrit le vrai — même patron que `sectionNombres`.
 */
export function ficheArbreDeVie(
  entrees: EntreesArbre | null,
  indisponible: string | null,
  lecteur: typeof texteDeArbre = texteDeArbre,
): FicheArbreDeVie {
  if (entrees === null) {
    return Object.freeze({
      indisponible,
      porteIndisponible:
        indisponible === copie.NAISSANCE_ABSENTE ? copie.PORTE_NAISSANCE : null,
      pastilles: Object.freeze([]),
      triangle: Object.freeze([]),
      comportement: Object.freeze([]),
      dynamique: null,
      defis: Object.freeze([]),
      qualites: Object.freeze([]),
      manqueQualites: null,
      cheminDeVie: null,
      porteNombres: null,
      conventions: Object.freeze([]),
    });
  }

  const arbre = calculerArbreDeVie(entrees);
  const parties = new Map<CleArbre, PartieArbreFiche>(
    CLES_ARBRE.map((cle) => [cle, partie(cle, arbre.cles[cle], lecteur)]),
  );
  const { qualites, manque } = qualitesDe(arbre);

  return Object.freeze({
    indisponible: null,
    porteIndisponible: null,
    // Les sept pastilles du dessin, dans l'ordre du DOM : un parcours au clavier lit la même
    // histoire que l'œil, du sol vers la cime (WCAG 2.4.3).
    pastilles: Object.freeze(
      CLES_ARBRE.map((cle) => {
        const p = parties.get(cle)!;
        return Object.freeze({
          cle: p.cle,
          ancre: p.ancre,
          intitule: p.intitule,
          valeur: p.valeur,
        });
      }),
    ),
    triangle: Object.freeze(TRIANGLE.map((cle) => parties.get(cle)!)),
    comportement: Object.freeze(COMPORTEMENT.map((cle) => parties.get(cle)!)),
    dynamique: partieDynamique(dynamiqueDeVie(entrees.date)),
    defis: defisDe(arbre),
    qualites,
    manqueQualites: manque,
    cheminDeVie: partieCheminDeVie(entrees.date),
    porteNombres: copie.PORTE_VERS_LES_NOMBRES,
    conventions: copie.CONVENTIONS,
  });
}
