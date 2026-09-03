import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lecturesDuResultat, type LectureFacteur } from "@/lib/corpus/big-five";
import { FACTEURS, type Facteur, type Position } from "@/lib/domain/big-five";
import { estValeurReponse } from "@/lib/domain/echelle-likert";
import type { ReponseItem } from "@/lib/domain/echelle-likert";

/**
 * lire-big-five.ts — CE QUE LA BASE SAIT DES CINQ FACTEURS (2026-09-03).
 *
 * Jumeau de `lire-enneagramme.ts`, et tout ce que son en-tête dit vaut ici :
 *
 *   • SOUS LE JWT DE L'UTILISATRICE, jamais `service_role` — un inventaire de personnalité est un
 *     contenu art. 9 POSSÉDÉ par elle, et `service_role` contournerait la RLS **et** le write-gate
 *     de consentement, c'est-à-dire les deux gardes de 0088 (AD-12, AD-13) ;
 *   • DEUX LECTURES DISTINCTES — le résultat retenu, et la passe en cours. Les fusionner referait
 *     la confusion que 0088 refuse en séparant les tables : une tentative n'est pas un résultat ;
 *   • ON NE FAIT PAS CONFIANCE À CE QU'ON RELIT. Les cinq `check` de 0088 existent, et on valide
 *     quand même : `service_role` a la latitude du réimport FR-067, donc une ligne peut entrer sans
 *     passer par la RLS. Sans ce contrôle, `texteDuFacteur` LÈVERAIT — dans un rendu serveur, chez
 *     elle ;
 *   • NFR-022 — ni les positions ni les réponses ne sortent dans un message d'erreur. On ne remonte
 *     qu'une raison d'une union FERMÉE.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le résultat retenu
// ══════════════════════════════════════════════════════════════════════════════════════════════

export type RaisonBigFiveIndisponible =
  /** Aucun résultat retenu. Ce n'est PAS un incident : c'est l'état de départ de tout le monde. */
  | "sans_resultat"
  /** Lecture impossible, ou ligne inexploitable. DISTINCT de « pas encore » : un incident. */
  | "lecture_impossible";

export type ResultatBigFiveLu =
  | {
      readonly statut: "calcule";
      readonly facteurs: readonly { readonly facteur: Facteur; readonly position: Position }[];
      /**
       * Les cinq textes d'Anima, attachés ICI plutôt que chez l'appelant : deux écrans les
       * demanderaient sinon, et l'un des deux finirait par écrire sa propre phrase de repli — le
       * troisième état que `lib/corpus/port` refuse d'exister.
       */
      readonly lectures: readonly LectureFacteur[];
    }
  | { readonly statut: "indisponible"; readonly raison: RaisonBigFiveIndisponible };

/** Une ligne de `big_five` : cinq colonnes de texte, une par facteur. */
type LigneResultat = Record<Facteur, unknown>;

function estPosition(v: unknown): v is Position {
  return v === "bas" || v === "median" || v === "haut";
}

/** Le résultat retenu de l'utilisatrice courante, s'il y en a un. Aucune écriture. */
export async function lireBigFive(
  supabase: SupabaseClient,
  utilisatriceId: string,
): Promise<ResultatBigFiveLu> {
  const { data, error } = await supabase
    .from("big_five")
    .select(FACTEURS.join(", "))
    .eq("utilisatrice_id", utilisatriceId)
    .maybeSingle<LigneResultat>();

  if (error) return { statut: "indisponible", raison: "lecture_impossible" };
  if (!data) return { statut: "indisponible", raison: "sans_resultat" };

  // ⚠️ LES CINQ, OU AUCUN. Une ligne dont un seul facteur est hors domaine est un INCIDENT : rendre
  // les quatre autres afficherait un résultat partiel comme s'il était complet, et le Big Five ne
  // veut rien dire à quatre axes. Dire « tu n'as pas encore passé le test » serait pire encore — ça
  // proposerait de le refaire, donc d'écraser ce qu'on n'a pas su lire.
  const facteurs: { facteur: Facteur; position: Position }[] = [];
  for (const facteur of FACTEURS) {
    const position = data[facteur];
    if (!estPosition(position)) return { statut: "indisponible", raison: "lecture_impossible" };
    facteurs.push({ facteur, position });
  }

  const lectures = lecturesDuResultat({ statut: "retenu", facteurs });
  // `lecturesDuResultat` ne rend `null` que sur un statut non retenu, qu'on vient de construire.
  // La garde existe pour que ce fichier ne dépende pas de cette lecture-là du corpus.
  if (lectures === null) return { statut: "indisponible", raison: "lecture_impossible" };

  return { statut: "calcule", facteurs: Object.freeze(facteurs), lectures };
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// La tentative en cours
// ══════════════════════════════════════════════════════════════════════════════════════════════

export interface TentativeBigFive {
  /**
   * L'identité de CETTE passe. Elle remonte jusqu'à la `key` du composant (décision D9) : refaire le
   * test change l'identifiant, donc remonte l'arbre React, donc garantit qu'aucune réponse de la
   * passe précédente ne survit à l'écran.
   */
  readonly tentativeId: string;
  /** Les réponses déjà données, appariées NOMINALEMENT (D7) — jamais par index de position. */
  readonly reponses: readonly ReponseItem[];
}

export type ResultatTentativeBigFive =
  | { readonly statut: "calcule"; readonly tentative: TentativeBigFive }
  | { readonly statut: "indisponible"; readonly raison: "aucune" | "lecture_impossible" };

interface LigneTentative {
  tentative_id: string;
  reponses: unknown;
}

/**
 * Les réponses relues en `ReponseItem[]`.
 *
 * Une entrée qui n'est ni un niveau 0..3 ni l'inconnue explicite `null` est ÉCARTÉE plutôt que
 * corrigée : la ramener à 0 serait répondre « jamais ou presque » à sa place, et `conclure` doit
 * pouvoir dire « incomplet » en nommant l'item.
 */
export function reponsesBigFiveDepuisJson(brut: unknown): readonly ReponseItem[] {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return [];
  return Object.entries(brut as Record<string, unknown>)
    .filter(([, niveau]) => estValeurReponse(niveau))
    .map(([itemId, niveau]) => ({ itemId, niveau: niveau as ReponseItem["niveau"] }));
}

/** La passe en cours, pour reprendre plus tard (NFR-017 — une fermeture d'onglet ne perd rien). */
export async function lireTentativeBigFive(
  supabase: SupabaseClient,
  utilisatriceId: string,
): Promise<ResultatTentativeBigFive> {
  const { data, error } = await supabase
    .from("big_five_tentative")
    .select("tentative_id, reponses")
    .eq("utilisatrice_id", utilisatriceId)
    .maybeSingle<LigneTentative>();

  if (error) return { statut: "indisponible", raison: "lecture_impossible" };
  if (!data) return { statut: "indisponible", raison: "aucune" };
  return {
    statut: "calcule",
    tentative: {
      tentativeId: data.tentative_id,
      reponses: reponsesBigFiveDepuisJson(data.reponses),
    },
  };
}
