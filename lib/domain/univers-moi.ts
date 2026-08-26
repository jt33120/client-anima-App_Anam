/**
 * Les portes stables de « Moi ». Ce module est pur : il nomme les destinations et la seule action
 * conditionnelle, sans lire le compte ni décider d'une mise en page.
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

export function universMoi(statutEnneagramme: StatutEnneagrammeMoi): readonly UniversMoi[] {
  return Object.freeze([
    {
      cle: "astrologie",
      titre: "Astrologie",
      accroche: "Ton ciel de naissance, tes planètes, tes angles et tes maisons.",
      url: "/socle?univers=astrologie",
      action: null,
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
