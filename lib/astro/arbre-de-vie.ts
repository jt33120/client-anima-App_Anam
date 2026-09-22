import {
  eclaterDate,
  estMaitre,
  lettresDe,
  reduire,
  reduireSansMaitre,
  sommeLettres,
  valeurLettre,
  VOYELLES,
  type EntreesNumerologie,
  type RaisonNombreAbsent,
} from "./numerologie";

/**
 * arbre-de-vie.ts — L'ARBRE DE VIE NUMÉROLOGIQUE (AD-6 / FR-047 / NFR-011).
 *
 * Module PUR, exactement comme `numerologie.ts` dont il est le voisin : aucune I/O, aucun
 * `server-only`, aucun Supabase, aucun `@/lib/ai/*`, aucune prose. Gardé par
 * `tests/astro-architecture.test.ts`, qui balaie ce dossier en récursif.
 *
 * ── CE QUE C'EST ───────────────────────────────────────────────────────────────────────────────
 *
 * La figure qu'Anima pose à ses clientes : sept clés tirées de la naissance et du nom, une
 * dynamique de vie, quatre défis, et la présence des neuf familles de lettres dans le nom. Le SENS
 * de tout cela vit dans `lib/corpus/arbre-de-vie.ts` et il est écrit par elle (FR-054, FR-086).
 * Ici, des nombres et des énumérations, rien d'autre.
 *
 * ── LES CONVENTIONS SONT INSCRITES, JAMAIS SUPPOSÉES ───────────────────────────────────────────
 *
 * Même discipline que `methodeCheminDeVie` : deux écoles donnent deux arbres différents pour la
 * même personne, et un résultat sans sa convention est invérifiable après coup. Les formules
 * retenues ont été retrouvées à partir d'un rapport réel d'Anima (celui de « Milian »), où les neuf
 * valeurs tombent toutes juste sur une naissance du 12 juillet 2018 :
 *
 *     racine 3 et racine 7 · tronc 1 · écorce 3 · chemin de vie 3
 *     dynamique 11/2 · défis 4, 1, 3, 5
 *
 * Ce vecteur est figé dans `tests/arbre-de-vie.test.ts`. Il vérifie les sept formules d'un coup,
 * CONSERVATION DU MAÎTRE COMPRISE : la dynamique rend 11 quand la même année, réduite pour les
 * défis, rend 2. Les deux réductions cohabitent sans se contaminer, et c'est le piège que
 * `reduire` décrit dans son propre en-tête.
 *
 * ── AUCUNE HORLOGE DU TOUT, PAS MÊME UN ENTIER ─────────────────────────────────────────────────
 *
 * `calculerNumerologie` prend une `anneeDeReference` parce que l'année personnelle bouge. L'arbre,
 * lui, ne bouge jamais : il n'a aucune dépendance au temps, même pas en paramètre. C'est une
 * propriété plus forte, pas un oubli — ne pas la perdre en ajoutant un nombre « du moment ».
 *
 * ── LE MOT QUI MANQUE, ET POURQUOI ─────────────────────────────────────────────────────────────
 *
 * La septième clé s'appelle LA CIME. Le rapport d'Anima dit « les fruits » ; le produit a banni la
 * métaphore du fruit en migration `0025` (l'état `fruit` d'une branche est devenu `rayonnement`),
 * et `tests/arbre-sans-fruit.test.ts` balaie tout `lib/**` et `render/**` pour que le mot ne
 * revienne pas. Ce n'est pas un contournement de garde : un fruit est une récompense suspendue, et
 * ce que la clé désigne, ce sont des besoins de réalisation — le haut de l'arbre, pas sa récolte.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les sept clés — périmètre FERMÉ
// ══════════════════════════════════════════════════════════════════════════════════════════════

export type CleArbre =
  | "racine_premiere"
  | "racine_seconde"
  | "tronc"
  | "ecorce"
  | "branches"
  | "feuilles"
  | "cime";

/** Ordre de lecture, du sol vers le haut. Source unique : on itère dessus, jamais sur une copie. */
export const CLES_ARBRE: readonly CleArbre[] = Object.freeze([
  "racine_premiere",
  "racine_seconde",
  "tronc",
  "ecorce",
  "branches",
  "feuilles",
  "cime",
]);

/** Les trois clés qui exigent un nom. Miroir de `NOMBRES_DU_NOM`. */
export const CLES_ARBRE_DU_NOM: readonly CleArbre[] = Object.freeze([
  "branches",
  "feuilles",
  "cime",
]);

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les entrées et les absences
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ `prenomDeNaissance` EST UNE DONNÉE À PART, PAS `utilisatrice.prenom`.
 *
 * `prenom` est une donnée d'ADRESSE — comment Anam la nomme — et peut être un diminutif.
 * `nomComplet` est le nom de naissance entier, prénoms compris, donc on ne peut pas en extraire le
 * prénom sans deviner où il s'arrête (« Jean-Marc », « Van der Berg »). Les branches se calculent
 * sur les prénoms SEULS : il faut donc les demander, et le dire quand ils manquent.
 */
export interface EntreesArbre extends EntreesNumerologie {
  readonly prenomDeNaissance?: string | null;
}

/**
 * Pourquoi une clé n'a pas pu être calculée. Reprend les quatre raisons de la numérologie et en
 * ajoute une seule : le prénom de naissance, que seul l'arbre demande.
 */
export type RaisonCleArbre = RaisonNombreAbsent | "prenom_de_naissance_absent";

export type LectureCleArbre =
  | { readonly statut: "calcule"; readonly valeur: number; readonly maitre: boolean }
  | { readonly statut: "non_calcule"; readonly raison: RaisonCleArbre };

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les qualités — une PRÉSENCE, jamais un compte (FR-031, DUR)
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ LE COMPTE NE SORT PAS D'ICI, ET C'EST LE POINT.
 *
 * Compter les lettres d'un nom donne un entier, et un entier affiché à côté de huit autres devient
 * une grille de scores — exactement ce que FR-031 refuse, et exactement ce qu'un « 0 » affiché
 * dirait de pire à quelqu'un dont le nom n'a pas la lettre. Le compte reste une variable locale de
 * `qualites()` ; ce qui sort est une ÉNUMÉRATION, comme `Position` du Big Five. Le type transporté
 * n'a aucun champ où un compte pourrait se loger.
 */
export type IntensiteQualite = "absente" | "discrete" | "marquee";

export interface Qualite {
  /** La famille de lettres, 1 à 9 (A/J/S valent 1, B/K/T valent 2… I/R valent 9). */
  readonly valeur: number;
  readonly intensite: IntensiteQualite;
}

export type LectureQualites =
  | { readonly statut: "calcule"; readonly qualites: readonly Qualite[] }
  | { readonly statut: "non_calcule"; readonly raison: RaisonNombreAbsent };

// ══════════════════════════════════════════════════════════════════════════════════════════════
// La sortie
// ══════════════════════════════════════════════════════════════════════════════════════════════

export interface ArbreDeVie {
  /** Version de FORME du document. */
  readonly schema: 1;
  readonly methodeRacines: "jour_et_mois_reduits_sans_maitre";
  readonly methodeTronc: "somme_des_racines_sans_maitre";
  readonly methodeEcorce: "jour_reduit_sans_maitre";
  readonly methodeDynamique: "annee_reduite_maitres_conserves";
  readonly methodeDefis: "differences_absolues";
  readonly conventionNom: "prenom_voyelles_consonnes";
  readonly seuilsQualite: "absente_0_discrete_1_2_marquee_3";
  readonly regleY: "voyelle";
  /**
   * ⚠️ VRAI PAR CONSTRUCTION : l'écorce et la première racine ont LA MÊME FORMULE.
   *
   * Ce n'est pas un doublon accidentel. Le rapport d'Anima dit « Écorce 3 : vous êtes né le 3, le
   * 12, le 21 ou le 30 » — l'écorce est bien le jour ; et les quatre défis imposent que la première
   * racine le soit aussi. Le même nombre est lu deux fois, comme provenance puis comme image.
   * Le drapeau est inscrit, et un test l'affirme, pour que corriger l'une des deux formules soit
   * une décision prise, et pas un écart qui s'installe en silence.
   */
  readonly redondanceEcorceRacine: true;
  readonly cles: Readonly<Record<CleArbre, LectureCleArbre>>;
  /**
   * Les quatre défis, dans leur ordre canonique. Des valeurs de 0 à 8.
   *
   * ⚠️ UN DÉFI NE SE RÉDUIT JAMAIS. C'est une différence entre deux nombres déjà réduits, et elle
   * vaut 0 environ une fois sur neuf. `reduire(0)` LÈVE (`numerologie.ts`) : tout chemin qui ferait
   * passer un défi par une réduction planterait en production sur une date parfaitement valide.
   *
   * ⚠️ ILS NE PORTENT PAS LEUR RANG. L'ordre du tuple suffit, et un champ `rang` serait un nombre
   * de plus à ne pas laisser filer jusqu'à l'écran : quatre défis numérotés se lisent comme quatre
   * paliers à franchir, soit la barre de progression que le produit a supprimée (FR-031).
   */
  readonly defis: readonly [number, number, number, number];
  readonly qualites: LectureQualites;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les calculs
// ══════════════════════════════════════════════════════════════════════════════════════════════

function calcule(valeur: number): LectureCleArbre {
  return { statut: "calcule", valeur, maitre: estMaitre(valeur) };
}

function absent(raison: RaisonCleArbre): LectureCleArbre {
  return { statut: "non_calcule", raison };
}

/**
 * L'intensité d'une famille de lettres dans un nom.
 *
 * Trois paliers plutôt que le compte brut : le rapport d'Anima décrit chaque famille par le nombre
 * de fois qu'elle apparaît, ce qui demanderait neuf textes par famille. Trois paliers gardent la
 * nuance qui compte (rien / un peu / beaucoup), divisent l'écriture par trois, et laissent le
 * compte lui-même hors de la sortie.
 */
function intensiteDe(compte: number): IntensiteQualite {
  if (compte === 0) return "absente";
  return compte <= 2 ? "discrete" : "marquee";
}

/** Les neuf familles, dans l'ordre 1 à 9. `null` si le nom ne permet rien de compter. */
function qualitesDe(lettres: string): readonly Qualite[] {
  // ⚠️ `valeurLettre`, JAMAIS UNE SECONDE TABLE. Réécrire `(code % 9) + 1` ici ferait vivre la
  // table de Pythagore à deux endroits — et une table en double diverge à la première correction.
  const comptes = new Map<number, number>();
  for (let v = 1; v <= 9; v++) comptes.set(v, 0);
  for (const lettre of lettres) {
    const v = valeurLettre(lettre);
    comptes.set(v, (comptes.get(v) ?? 0) + 1);
  }
  return Object.freeze(
    Array.from({ length: 9 }, (_, i) =>
      Object.freeze({ valeur: i + 1, intensite: intensiteDe(comptes.get(i + 1) ?? 0) }),
    ),
  );
}

/**
 * LE CALCUL COMPLET. Fonction pure : mêmes entrées ⇒ même sortie, toujours.
 *
 * Aboutit TOUJOURS avec ce qui est disponible, comme `calculerNumerologie` : sans prénom de
 * naissance, seules les branches passent en `non_calcule` ; sans nom complet, seules les feuilles,
 * la cime et les qualités. Les quatre clés tirées de la date, la dynamique et les défis aboutissent
 * dans tous les cas, parce que la date est obligatoire (FR-048).
 */
export function calculerArbreDeVie(entrees: EntreesArbre): ArbreDeVie {
  const { jour, mois, annee } = eclaterDate(entrees.date);

  const racinePremiere = reduireSansMaitre(jour);
  const racineSeconde = reduireSansMaitre(mois);
  const anneeReduite = reduireSansMaitre(annee);

  const cles: Record<CleArbre, LectureCleArbre> = {
    racine_premiere: calcule(racinePremiere),
    racine_seconde: calcule(racineSeconde),
    tronc: calcule(reduireSansMaitre(racinePremiere + racineSeconde)),
    ecorce: calcule(reduireSansMaitre(jour)),
    branches: absent("prenom_de_naissance_absent"),
    feuilles: absent("nom_absent"),
    cime: absent("nom_absent"),
  };

  // ── LES BRANCHES : les prénoms de naissance, seuls ──────────────────────────────────────────
  const prenomBrut = entrees.prenomDeNaissance?.trim() ?? "";
  if (prenomBrut.length > 0) {
    const lettresPrenom = lettresDe(prenomBrut);
    cles.branches =
      lettresPrenom.length > 0
        ? calcule(reduire(sommeLettres(lettresPrenom)))
        : absent("nom_sans_lettre");
  }

  // ── LES FEUILLES ET LA CIME : voyelles et consonnes du nom complet ──────────────────────────
  let qualites: LectureQualites = { statut: "non_calcule", raison: "nom_absent" };
  const nomBrut = entrees.nomComplet?.trim() ?? "";
  if (nomBrut.length > 0) {
    const lettres = lettresDe(nomBrut);
    if (lettres.length === 0) {
      // Renseigné mais inexploitable : distinct de « jamais renseigné ». Les confondre ferait
      // passer un défaut de saisie pour un champ laissé vide exprès, et personne n'irait voir.
      cles.feuilles = absent("nom_sans_lettre");
      cles.cime = absent("nom_sans_lettre");
      qualites = { statut: "non_calcule", raison: "nom_sans_lettre" };
    } else {
      const voyelles = [...lettres].filter((l) => VOYELLES.includes(l));
      const consonnes = [...lettres].filter((l) => !VOYELLES.includes(l));
      cles.feuilles =
        voyelles.length > 0
          ? calcule(reduire(sommeLettres(voyelles.join(""))))
          : absent("nom_sans_voyelle");
      cles.cime =
        consonnes.length > 0
          ? calcule(reduire(sommeLettres(consonnes.join(""))))
          : absent("nom_sans_consonne");
      qualites = { statut: "calcule", qualites: qualitesDe(lettres) };
    }
  }

  // ── LES QUATRE DÉFIS : des différences, jamais des réductions ───────────────────────────────
  const premier = Math.abs(racinePremiere - racineSeconde);
  const deuxieme = Math.abs(racinePremiere - anneeReduite);
  const defis: readonly [number, number, number, number] = Object.freeze([
    premier,
    deuxieme,
    Math.abs(premier - deuxieme),
    Math.abs(racineSeconde - anneeReduite),
  ]);

  return Object.freeze({
    schema: 1,
    methodeRacines: "jour_et_mois_reduits_sans_maitre",
    methodeTronc: "somme_des_racines_sans_maitre",
    methodeEcorce: "jour_reduit_sans_maitre",
    methodeDynamique: "annee_reduite_maitres_conserves",
    methodeDefis: "differences_absolues",
    conventionNom: "prenom_voyelles_consonnes",
    seuilsQualite: "absente_0_discrete_1_2_marquee_3",
    regleY: "voyelle",
    redondanceEcorceRacine: true,
    cles: Object.freeze(cles),
    defis,
    qualites: Object.freeze(qualites),
  });
}

/**
 * LA DYNAMIQUE DE VIE — l'année de naissance réduite, MAÎTRES CONSERVÉS.
 *
 * C'est le « 11/2 » du rapport d'Anima : le nombre maître est gardé, et la réduction qu'il porte
 * s'écrit à côté de lui au moment de l'affichage, jamais ici. La même année, réduite SANS maître,
 * sert aux quatre défis — les deux cohabitent et ne doivent jamais être confondues.
 *
 * Séparée de `calculerArbreDeVie` parce qu'elle ne fait pas partie des sept clés : c'est l'ambiance
 * autour de l'arbre, pas une de ses parties.
 */
export function dynamiqueDeVie(iso: string): LectureCleArbre {
  return calcule(reduire(eclaterDate(iso).annee));
}
