"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { creerDepotBigFive } from "@/lib/data/depot-big-five";
import { lireTentativeBigFive } from "@/lib/data/lire-big-five";
import { baremeBigFive } from "@/lib/domain/big-five-items";
import { conclure, type ResultatBigFive } from "@/lib/domain/big-five";
import { estValeurReponse, type ReponseItem } from "@/lib/domain/echelle-likert";

/**
 * actions.ts — LES GESTES DE LA HALTE `/big-five` (2026-09-03).
 *
 * Jumelles de celles de l'ennéagramme, et pour les mêmes raisons — écrites à nouveau plutôt que
 * factorisées, parce que ce sont des Server Actions distinctes qui écrivent dans des tables
 * distinctes, et qu'une factorisation à deux appelants ferait passer les deux barèmes par un même
 * point de branchement.
 *
 * ── LE BARÈME NE DESCEND JAMAIS, DONC LE RÉSULTAT SE CALCULE ICI ──────────────────────────────
 *
 * Le client envoie des couples `(itemId, niveau)` — jamais une position, jamais un total. `conclure`
 * est appelé côté serveur, sur les réponses RELUES EN BASE (décision D7 : le barème vit à un seul
 * endroit).
 *
 * ⚠️ CE QUE CES ACTIONS NE GARDENT PAS, et 0088 le dit en toutes lettres : `authenticated` détient
 * les sept privilèges DML. Un POST direct sur `/rest/v1/` poserait les cinq positions de son choix
 * sans avoir répondu à un énoncé. Ce n'est pas une faille — ce sont ses propres données — et le
 * protéger demanderait de rejouer le barème en SQL, donc de le dupliquer. Les VRAIES gardes
 * (consentement, minorité, appartenance) sont dans les `with check` des policies.
 *
 * ── AUCUNE DE CES ACTIONS NE LÈVE ─────────────────────────────────────────────────────────────
 *
 * Elles rendent un état, et l'écran le dit. Une action qui jette produirait l'écran d'erreur de Next
 * au milieu d'un inventaire de vingt énoncés — et les réponses déjà données seraient perdues de vue,
 * alors qu'elles sont en base.
 *
 * NFR-022 : ni les positions, ni les réponses ne sortent dans un message d'erreur.
 */

export type EtatInventaire =
  | { readonly statut: "en_cours" }
  | { readonly statut: "erreur"; readonly message: string }
  /** Les cinq positions sont retenues, l'écran se recharge sur le résultat. */
  | { readonly statut: "retenu" }
  /** Trop d'abstentions sur un axe : le produit préfère ne rien dire de cet axe-là. */
  | { readonly statut: "indetermine" };

const ERREUR_GENERIQUE = "Je n’ai pas pu enregistrer. Réessaie.";

/** Le client sous JWT + son identifiant, ou `null` si la session est tombée. */
async function session() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, utilisatriceId: user.id } : null;
}

/** Filtre le client : identifiant connu, niveau 0..3 ou inconnue explicite `null`. */
function reponsesValides(brut: unknown): ReponseItem[] {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return [];
  const connus = new Set(baremeBigFive().map((i) => i.id));
  return Object.entries(brut as Record<string, unknown>)
    .filter(([id, niveau]) => connus.has(id) && estValeurReponse(niveau))
    .map(([itemId, niveau]) => ({ itemId, niveau: niveau as ReponseItem["niveau"] }));
}

/**
 * Enregistre l'état des réponses — appelée à CHAQUE réponse, en tâche de fond (NFR-017 : une
 * fermeture d'onglet au douzième énoncé ne perd rien). L'écran n'attend pas sa réponse.
 */
export async function enregistrerReponses(reponses: unknown): Promise<{ ok: boolean }> {
  try {
    const s = await session();
    if (!s) return { ok: false };
    await creerDepotBigFive(s.utilisatriceId, s.supabase).enregistrerReponses({
      reponses: reponsesValides(reponses),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Conclut l'inventaire.
 *
 * ⚠️ ON RELIT LA BASE AVANT DE CONCLURE. Les enregistrements intermédiaires sont optimistes
 * (l'écran avance sans les attendre) : conclure sur la charge utile du dernier envoi marcherait
 * aujourd'hui et deviendrait faux le jour où un envoi partiel arriverait.
 *
 * ⚠️ TROP D'ABSTENTIONS SUR UN AXE, LE PRODUIT REFUSE DE TRANCHER. `conclure` rend `indetermine`
 * plutôt que de compter les « je ne sais pas » comme des zéros — ce qui ferait sortir « plutôt bas »
 * sur un axe dont elle n'a rien dit.
 */
export async function conclureInventaire(reponses: unknown): Promise<EtatInventaire> {
  try {
    const s = await session();
    if (!s) return { statut: "erreur", message: ERREUR_GENERIQUE };
    const depot = creerDepotBigFive(s.utilisatriceId, s.supabase);

    await depot.enregistrerReponses({ reponses: reponsesValides(reponses) });

    const tentative = await lireTentativeBigFive(s.supabase, s.utilisatriceId);
    if (tentative.statut !== "calcule") return { statut: "erreur", message: ERREUR_GENERIQUE };

    const resultat: ResultatBigFive = conclure(tentative.tentative.reponses, baremeBigFive());
    if (resultat.statut === "incomplet") return { statut: "en_cours" };
    if (resultat.statut === "indetermine") return { statut: "indetermine" };

    // `false` = un autre onglet a conclu avant nous. L'état est BON — on recharge plutôt que
    // d'annoncer un échec (0049 : « l'appelant relit »).
    await depot.terminerTentative({ facteurs: resultat.facteurs });
    return { statut: "retenu" };
  } catch {
    return { statut: "erreur", message: ERREUR_GENERIQUE };
  }
}

/**
 * Refaire : on efface la passe en cours, et la SUIVANTE reçoit un nouvel identifiant. C'est cet
 * identifiant qui remonte jusqu'à la `key` du composant (décision D9) — sans lui, les réponses de la
 * passe précédente survivraient à l'écran.
 */
export async function recommencerInventaire(): Promise<void> {
  try {
    const s = await session();
    if (!s) redirect("/entrer");
    await creerDepotBigFive(s.utilisatriceId, s.supabase).abandonnerTentative();
  } catch {
    // Rien à dire : la page se recharge, et une tentative non effacée se reprend simplement.
  }
}

/**
 * Effacer son résultat. Ouvert en toutes circonstances (FR-067), sans consentement requis : retirer
 * une étiquette n'est pas en déposer une.
 */
export async function effacerResultat(): Promise<void> {
  try {
    const s = await session();
    if (!s) redirect("/entrer");
    await creerDepotBigFive(s.utilisatriceId, s.supabase).effacerResultat();
  } catch {
    // La page se recharge et montrera l'état réel — jamais un « c'est effacé » qui serait faux.
  }
}
