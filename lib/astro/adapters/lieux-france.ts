import donnees from "./communes-france.json";
import {
  codeDepartement,
  fuseauDeCommune,
  libelleLieu,
  normaliserLieu,
  type Departement,
  type LieuNaissance,
  type LieuxPort,
} from "../lieux";

/**
 * lieux-france.ts — L'ADAPTATEUR DE LIEUX DE NAISSANCE (Story 5.3, T2).
 *
 * ⚠️ **SEUL FICHIER DU DÉPÔT AUTORISÉ À IMPORTER `communes-france.json`.** La garde est dans
 * `tests/astro-architecture.test.ts`. Tout le reste du produit ne connaît que `LieuxPort` — c'est
 * ce qui rendra le référentiel mondial substituable sans toucher au domaine.
 *
 * ── LE FICHIER DE DONNÉES PÈSE 1,5 Mo : NE L'IMPORTER QUE D'ICI ────────────────────────────────
 *
 * L'index normalisé est construit à la PREMIÈRE recherche, pas au chargement du module. Sans cette
 * paresse, tout point de code qui importerait ce fichier — même sans jamais chercher un lieu —
 * paierait 35 000 normalisations au démarrage à froid, sur un chemin (l'ouverture de la scène) où
 * personne ne cherche de lieu.
 *
 * ── CE QUE L'ADAPTATEUR ÉCARTE, ET POURQUOI IL LE FAIT ICI ─────────────────────────────────────
 *
 * Les communes dont le fuseau est inconnu (Terres australes, Clipperton) sont retirées des
 * résultats. Le tri se fait à la SOURCE des résultats, pas plus haut : une commune proposée puis
 * inexploitable ferait vivre le refus après le choix, sur un geste irréversible (0039).
 *
 * ── LES HOMONYMES : QUATRE SAINT-DENIS, ET LEQUEL MONTRER EN PREMIER ───────────────────────────
 *
 * 1 441 noms sont partagés par 3 675 communes. « Saint-Denis » en désigne quatre (Aude, Gard,
 * Seine-Saint-Denis, La Réunion), et la première version les rendait dans l'ordre des codes INSEE :
 * l'Aude (523 habitants) en tête, La Réunion (155 634) en dernier, et rien à l'écran pour les
 * distinguer. Deux réponses, toutes deux ici :
 *   • chaque lieu porte son `departement` et un `libelle` « Saint-Denis (93) » (voir `lieux.ts`) ;
 *   • à nom égal, la plus PEUPLÉE passe devant (`parPertinence`) — c'est, sauf preuve du
 *     contraire, celle que l'on cherche.
 */

/**
 * La forme du fichier généré — c'est `scripts/construire-lieux-france.mjs` qui l'écrit, et lui seul.
 *
 * Exportée pour une raison précise : `tests/lieux.test.ts` bâtit des adaptateurs sur des catalogues
 * MINUSCULES pour prouver le classement (« la plus peuplée d'abord », « le nom exact avant ses
 * composés ») sans dépendre des populations réelles, qui bougent à chaque recensement.
 */
export interface CatalogueLieux {
  /** `[nom, codeInsee, latitude, longitude, population]` — population `0` si la source n'en a pas. */
  readonly communes: readonly (readonly [string, string, number, number, number])[];
  /** `[code, nom]` — les 101 départements, plus les collectivités d'outre-mer qui portent des communes. */
  readonly departements: readonly (readonly [string, string])[];
}

const CATALOGUE = donnees as unknown as CatalogueLieux;

/** Identifie la SOURCE et sa date de fabrication — pas la bibliothèque, il n'y en a pas. */
export const IDENTIFIANT_LIEUX_FRANCE = "communes-france@geo.api.gouv.fr";

interface Entree {
  readonly lieu: LieuNaissance;
  readonly cle: string;
}

function construireIndex(catalogue: CatalogueLieux): Entree[] {
  const nomsDepartements = new Map<string, string>(catalogue.departements);
  const entrees: Entree[] = [];
  for (const [nom, code, latitude, longitude, population] of catalogue.communes) {
    const fuseau = fuseauDeCommune(code, latitude);
    if (fuseau === null) continue; // fuseau inconnu ⇒ le lieu n'est pas proposable (voir l'en-tête)
    const departement: Departement = {
      code: codeDepartement(code),
      // Vide ⇒ le référentiel ne nomme pas ce département. Le script refuse d'écrire un catalogue
      // où cela arrive pour une commune proposable, et `tests/lieux.test.ts` le vérifie sur le
      // fichier réel : on ne SAUTE pas la commune pour autant — une naissance introuvable serait
      // pire qu'un nom de département absent d'une ligne secondaire.
      nom: nomsDepartements.get(codeDepartement(code)) ?? "",
    };
    entrees.push({
      lieu: {
        nom,
        code,
        latitude,
        longitude,
        fuseau,
        population,
        departement,
        libelle: libelleLieu(nom, departement),
      },
      cle: normaliserLieu(nom),
    });
  }
  return entrees;
}

/**
 * Le classement, à l'intérieur d'un groupe (« commence par » ou « contient ») :
 *   1. le nom le plus COURT — la ville elle-même avant ses composés (« Saint-Denis » avant
 *      « Saint-Denis-de-Pile »), quelle que soit leur population ;
 *   2. la plus PEUPLÉE — entre homonymes stricts, La Réunion (155 634) avant la Seine-Saint-Denis
 *      (149 077) avant l'Aude (523) avant le Gard (296) ;
 *   3. le code INSEE — un départage TOTAL, sans quoi deux exécutions pourraient ne pas rendre le
 *      même ordre entre deux communes de même longueur et de même population.
 */
function parPertinence(a: Entree, b: Entree): number {
  return (
    a.cle.length - b.cle.length ||
    b.lieu.population - a.lieu.population ||
    a.lieu.code.localeCompare(b.lieu.code)
  );
}

/**
 * Un adaptateur bâti sur un catalogue donné. Sans état observable : deux recherches identiques
 * rendent la même chose, dans le même ordre (l'index est un cache, pas une source de variation).
 */
export function lieuxDepuisCatalogue(catalogue: CatalogueLieux): LieuxPort {
  let index: Entree[] | null = null;
  let parCode: Map<string, LieuNaissance> | null = null;

  return {
    identifiant: IDENTIFIANT_LIEUX_FRANCE,

    chercher(requete: string, limite: number): readonly LieuNaissance[] {
      const cle = normaliserLieu(requete);
      // Une saisie d'un seul caractère rendrait des milliers de résultats sans rien apprendre à
      // personne. Deux, c'est le minimum où le classement commence à vouloir dire quelque chose.
      if (cle.length < 2 || limite <= 0) return [];

      index ??= construireIndex(catalogue);

      // Ce qui COMMENCE par la saisie d'abord (« bordeaux » avant « Barbey-Bordeaux »), puis ce qui
      // la contient — et `parPertinence` à l'intérieur de chaque groupe.
      const debuts: Entree[] = [];
      const dedans: Entree[] = [];
      for (const e of index) {
        if (e.cle.startsWith(cle)) debuts.push(e);
        else if (e.cle.includes(cle)) dedans.push(e);
      }

      return [...debuts.sort(parPertinence), ...dedans.sort(parPertinence)]
        .slice(0, limite)
        .map((e) => e.lieu);
    },

    trouverParCode(code: string): LieuNaissance | null {
      index ??= construireIndex(catalogue);
      // La table de codes est bâtie depuis le MÊME index que la recherche : une commune écartée
      // faute de fuseau (Terres australes, Clipperton) est donc introuvable des DEUX côtés. Deux
      // sources auraient fini par diverger, et la divergence aurait laissé graver un lieu que
      // l'interface ne propose pas.
      parCode ??= new Map(index.map((e) => [e.lieu.code, e.lieu]));
      return parCode.get(code) ?? null;
    },
  };
}

let instance: LieuxPort | null = null;

/** L'adaptateur sur le référentiel réel. Une seule instance : l'index de 35 000 entrées se bâtit une fois. */
export function lieuxFrance(): LieuxPort {
  return (instance ??= lieuxDepuisCatalogue(CATALOGUE));
}
