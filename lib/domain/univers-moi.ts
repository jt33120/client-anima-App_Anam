import { LIEN_AJOUTER } from "@/lib/domain/copie-naissance";

/**
 * Les portes stables de la région d'accueil (« Aujourd’hui » depuis le 2026-09-02, « Moi » avant :
 * le module garde son nom de fichier, comme l'identifiant `accueil` garde le sien). Ce module est
 * pur : il nomme les destinations et les deux actions conditionnelles, sans lire le compte ni
 * décider d'une mise en page.
 */
export type CleUniversMoi = "astrologie" | "numerologie" | "psychologie";

export interface ActionUniversMoi {
  readonly libelle: string;
  readonly url: string;
}

export interface UniversMoi {
  readonly cle: CleUniversMoi;
  readonly titre: string;
  readonly accroche: string;
  readonly url: string;
  readonly action: ActionUniversMoi | null;
}

export type StatutEnneagrammeMoi = "connu" | "absent" | "en-cours" | "indisponible";

function actionEnneagrammePour(statut: StatutEnneagrammeMoi): ActionUniversMoi | null {
  if (statut === "absent") {
    return { libelle: "Passer mon test d’ennéagramme", url: "/enneagramme" };
  }
  if (statut === "en-cours") {
    return { libelle: "Reprendre mon test", url: "/enneagramme" };
  }
  // Une panne de lecture n'est jamais transformée en « tu ne l'as pas fait ». Cela inciterait à
  // recommencer un test dont le résultat existe peut-être déjà.
  return null;
}

/**
 * ⚠️ L'HEURE DE NAISSANCE SE PROPOSE ICI, SOUS LA PORTE ASTROLOGIE (E3-S5, 2026-09-02).
 *
 * Avant, la seule invitation à ajouter son heure vivait dans la fiche du tronc (`FicheTronc`),
 * derrière un geste sur l'arbre : qui n'y allait pas ne la voyait jamais, et son ascendant restait
 * absent sans qu'on le lui dise. La région d'accueil est l'écran qu'on ouvre chaque jour, et la
 * porte Astrologie est celle que l'heure répare. Le bouton se pose donc là, avec le libellé déjà
 * écrit pour cette démarche (`copie-naissance.ts`, une seule formulation dans tout le produit), et
 * il disparaît dès que l'heure est connue : ce n'est pas un rappel, c'est une porte.
 *
 * `heureManque` est un FAIT déjà établi par `lib/domain/socle-incomplet.ts` depuis le thème lu par
 * l'appelant (`lib/data/lire-bibliotheque.ts`) : ce module ne lit rien et ne décide pas ce que
 * « manquer » veut dire. Il n'y a ni persistance ni dépense : ce bouton n'est pas une parole
 * proactive d'Anam (décision D9), il est là tant que le fait est vrai, et c'est tout.
 */
function actionHeurePour(heureManque: boolean): ActionUniversMoi | null {
  return heureManque ? { libelle: LIEN_AJOUTER, url: "/heure-naissance" } : null;
}

export function universMoi(
  statutEnneagramme: StatutEnneagrammeMoi,
  heureManque: boolean,
): readonly UniversMoi[] {
  return Object.freeze([
    {
      cle: "astrologie",
      titre: "Astrologie",
      accroche: "Ton ciel de naissance, tes planètes, tes angles et tes maisons.",
      url: "/socle?univers=astrologie",
      action: actionHeurePour(heureManque),
    },
    {
      cle: "numerologie",
      titre: "Numérologie",
      accroche: "Les six nombres issus de ta naissance et de ton nom.",
      url: "/socle?univers=numerologie",
      action: null,
    },
    {
      cle: "psychologie",
      titre: "Psychologie",
      accroche: "Ton ennéagramme et des repères dont la méthode reste visible.",
      url: "/psychologie",
      action: actionEnneagrammePour(statutEnneagramme),
    },
  ] satisfies readonly UniversMoi[]);
}
