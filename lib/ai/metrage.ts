import "server-only";
import { createSupabaseAdminClient } from "@/lib/data/supabase/admin";
import type { CapaciteIa, MessageIa, ReponseIa, TierIa } from "./port";
import { tariferUsageIa } from "./tarification";

/**
 * Métrage IA (Story 2.2, NFR-014) — écrit l'usage du tour dans `usage_ia`.
 *
 * Extrait de la route pour rester testable, indépendamment du stream. `usage_ia` est deny-by-default
 * et NON-art. 9 → écriture via le client admin (`service_role`, tâche système autorisée, AD-12).
 * Best-effort : un échec n'est PAS fatal (l'utilisatrice a déjà sa réponse) mais est journalisé SANS
 * art. 9 (code d'erreur seul, jamais de contenu — NFR-022). **Ne lève JAMAIS** : la route l'appelle
 * dans `after()` (post-réponse) où un throw serait une promesse rejetée non gérée (revue 2.2).
 *
 * ⚠️ Portée de l'idempotence : `on conflict (utilisatrice_id, cle_idempotence) do nothing` dédoublonne
 * **une même clé**. Story 3.4 : la clé est le **jeton de tour stable fourni par le client** (`jetonTour`,
 * validé serveur par `jetonTourValide`, scopé à l'utilisatrice), réutilisé au « Réessayer » → « exactement
 * une fois PAR TOUR LOGIQUE » (un retry ne recompte ni tokens ni allocation résiduelle). Repli sur un UUID
 * serveur par requête si le jeton est absent/mal formé. [dette 2.2/2.4/2.7/2.9 close]
 */
/** Opération métier : plus précise que la capacité technique envoyée au port. */
export type OperationIa =
  | "conversation"
  | "detection_detresse"
  | "detection_reconceptualisation"
  | "detection_retour_theme"
  | "hypothese_enneagramme"
  | "compactage_contexte"
  | "extraction_arc"
  | "restitution_lecture"
  | "bilan_seance"
  | "synthese_periodique"
  | "texte_du_jour";

/** Compteurs techniques rendus par un appel modèle, sans identité ni dimension produit. */
export interface UsageModeleIa {
  tier: TierIa;
  modele: string;
  tokensEntree: number;
  tokensSortie: number;
}

export interface MetrageUsage extends UsageModeleIa {
  utilisatriceId: string;
  cleIdempotence: string;
  /** Ce que le produit accomplissait ; aucun contenu libre ni art. 9. */
  operation: OperationIa;
  /** Capacité déclarée au port, source du tier serveur (AD-5). */
  capacite: CapaciteIa;
  /** Instantané pris au départ du tour/appel. `null` si la lecture a échoué : ne jamais inventer. */
  premiumAuMomentAppel: boolean | null;
  /** Vrai = hors limites produit, même si le coût fournisseur reste comptabilisé (FR-043). */
  exempteQuota: boolean;
  /** Vrai pour tout appel fournisseur réel à inclure dans la comptabilité interne. */
  comptabiliseFinancierement: boolean;
  /**
   * Story 3.4 : `true` = tour d'ALLOCATION RÉSIDUELLE (servi après la clôture de la 1ʳᵉ séance) → compté
   * dans le quota mensuel gratuit (FR-079). Posé UNIQUEMENT sur la ligne PRINCIPALE d'un tour post-séance ;
   * la 1ʳᵉ séance et les sous-coûts `:arc`/`:bilan` gardent `false` (défaut). NON-art. 9.
   */
  postPremiereSeance?: boolean;
}

export async function metrerUsageIa(usage: MetrageUsage): Promise<void> {
  try {
    const tarif = tariferUsageIa(usage.modele, usage.tokensEntree, usage.tokensSortie);
    const admin = createSupabaseAdminClient(); // peut lever si l'env admin manque → capté ici
    const { error } = await admin.from("usage_ia").upsert(
      {
        utilisatrice_id: usage.utilisatriceId,
        cle_idempotence: usage.cleIdempotence,
        operation: usage.operation,
        capacite: usage.capacite,
        tier: usage.tier,
        modele: usage.modele,
        tokens_entree: usage.tokensEntree,
        tokens_sortie: usage.tokensSortie,
        post_premiere_seance: usage.postPremiereSeance ?? false, // Story 3.4 — marque d'allocation résiduelle
        unite_usage: tarif.uniteUsage,
        premium_au_moment_appel: usage.premiumAuMomentAppel,
        exempte_quota: usage.exempteQuota,
        comptabilise_financierement: usage.comptabiliseFinancierement,
        tarif_version: tarif.tarifVersion,
        tarif_connu: tarif.tarifConnu,
        devise: tarif.devise,
        prix_entree_usd_par_million: tarif.prixEntreeUsdParMillion,
        prix_sortie_usd_par_million: tarif.prixSortieUsdParMillion,
        cout_usd: tarif.coutUsd,
      },
      { onConflict: "utilisatrice_id,cle_idempotence", ignoreDuplicates: true },
    );
    if (error) console.error("usage_ia métrage échoué", { code: error.code });
    else if (!tarif.tarifConnu) {
      // Le modèle n'est pas du contenu utilisateur. Dire l'écart évite qu'un nouveau modèle reste à
      // coût NULL pendant des semaines sans que personne ne voie le catalogue périmé (NFR-022).
      console.error("usage_ia tarif inconnu", { modele: usage.modele });
    }
  } catch (e) {
    // Ne jamais laisser fuiter (appelé dans after(), hors du cycle de réponse) — NFR-022.
    console.error("usage_ia métrage : exception", { nom: e instanceof Error ? e.name : "inconnu" });
  }
}

/** Données de fin de flux (l'événement `fin` de l'adaptateur), source AUTORITAIRE du métrage. */
export interface FinFlux {
  tier: TierIa;
  modele: string;
  usage: { tokensEntree: number; tokensSortie: number };
}

/** État observé pendant la consommation d'un flux, pour en dériver le métrage (pur, testable). */
export interface EtatFlux {
  /** L'événement `fin` reçu, ou `null` si le flux s'est avorté avant (pas de `fin`). */
  finRecu: FinFlux | null;
  /** Au moins un `delta` ou un `fin` a été émis (sinon : échec d'ouverture → aucune ligne fantôme). */
  aProduit: boolean;
  /** Longueur cumulée des deltas (repli d'unité TOKEN en cas d'avortement). */
  charsSortie: number;
  /** Longueur des messages envoyés (repli d'unité TOKEN en cas d'avortement). */
  charsEntree: number;
  /** Tier résolu serveur (repli si pas de `fin`). */
  tierServeur: TierIa;
  /** Modèle résolu serveur (repli si pas de `fin`). */
  modeleServeur: string;
}

export type UsageResolu = UsageModeleIa;

/** ≈ 4 caractères par token — repli HOMOGÈNE en tokens (jamais de caractères dans une colonne token). */
export function estimerTokens(chars: number): number {
  return Math.ceil(Math.max(0, chars) / 4);
}

/**
 * Normalise l'usage des réponses non streamées. Certains fournisseurs/adaptateurs rendent `0` quand
 * les compteurs sont absents ; zéro ne doit jamais devenir un faux appel gratuit. Même règle que le
 * flux principal : chaque sens manquant retombe séparément sur une estimation homogène en tokens.
 */
export function resoudreUsageReponse(
  reponse: ReponseIa,
  messages: readonly MessageIa[],
): UsageModeleIa {
  const charsEntree = messages.reduce((total, message) => total + message.content.length, 0);
  return {
    tier: reponse.tier,
    modele: reponse.modele,
    tokensEntree:
      reponse.usage.tokensEntree > 0
        ? reponse.usage.tokensEntree
        : estimerTokens(charsEntree),
    tokensSortie:
      reponse.usage.tokensSortie > 0
        ? reponse.usage.tokensSortie
        : estimerTokens(reponse.texte.length),
  };
}

/**
 * Décide ce qu'on métré, de façon HONNÊTE (revue 2.2) :
 *  - rien produit (échec d'ouverture) → `null` (aucune ligne fantôme) ;
 *  - `fin` reçu → source AUTORITAIRE : tier/modele réellement utilisés (factice → `"factice"`, jamais
 *    un id Mistral sans appel Mistral), usage réel du fournisseur ; garde faux-zéro : un usage à 0
 *    (fournisseur qui l'omet) retombe sur l'approximation homogène ;
 *  - avortement avant `fin` → repli best-effort : tier/modele serveur, tokens estimés (unité token).
 */
export function resoudreMetrage(etat: EtatFlux): UsageResolu | null {
  if (!etat.aProduit) return null;
  if (etat.finRecu) {
    const u = etat.finRecu.usage;
    return {
      tier: etat.finRecu.tier,
      modele: etat.finRecu.modele,
      tokensEntree: u.tokensEntree > 0 ? u.tokensEntree : estimerTokens(etat.charsEntree),
      tokensSortie: u.tokensSortie > 0 ? u.tokensSortie : estimerTokens(etat.charsSortie),
    };
  }
  return {
    tier: etat.tierServeur,
    modele: etat.modeleServeur,
    tokensEntree: estimerTokens(etat.charsEntree),
    tokensSortie: estimerTokens(etat.charsSortie),
  };
}
