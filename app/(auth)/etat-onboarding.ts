import type { SupabaseClient } from "@supabase/supabase-js";
import {
  etapeOnboarding,
  type EtapeOnboarding,
  type StatutConsentement,
} from "./onboarding";

export type SourceLectureOnboarding = "utilisatrice" | "consentement";

/** Une panne de lecture reste distincte d'une ligne absente, sans exposer le détail Supabase. */
export class ErreurLectureOnboarding extends Error {
  readonly name = "ErreurLectureOnboarding";
  readonly code = "etat_onboarding_indisponible";

  constructor(readonly sourceLecture: SourceLectureOnboarding) {
    super("etat_onboarding_indisponible");
  }
}

/**
 * État d'onboarding d'une session — SOURCE UNIQUE de vérité partagée par toutes les
 * gardes (/, /auth/confirm, /naissance, /consentement) ET les Server Actions de consentement.
 * Un seul endroit lit et décide, pour qu'aucun chemin ne diverge (leçon de la revue 1.4 :
 * une barrière oubliée dans un seul chemin suffit à laisser passer un mineur).
 *
 * Tout est lu SOUS la session RLS (auth.uid()) — jamais service_role (AD-12).
 * (Fichier importé uniquement depuis le serveur : Server Components / route handlers / actions.)
 */
export async function etapeOnboardingPour(
  supabase: SupabaseClient,
  userId: string,
): Promise<EtapeOnboarding> {
  // ══ LES DEUX LECTURES PARTENT ENSEMBLE (Story 8.3, 2026-08-25) ══════════════════════════════
  //
  // ⚠️ ELLES ÉTAIENT AWAITÉES L'UNE APRÈS L'AUTRE, ET ELLES SONT INDÉPENDANTES. Cette fonction est
  // la garde partagée par TOUTES les pages protégées — la scène, les réglages, la mémoire, les
  // lectures, la synthèse, les ancrages, la halte du socle. Un aller-retour de base en file
  // indienne s'y payait donc à CHAQUE navigation, sur chaque écran, par tout le monde.
  //
  // Retour de Julian, 2026-08-25 : « quand je clique sur profil, rien ne se passe et d'un coup,
  // quelques secondes après, la page s'ouvre ». C'est ici qu'une part de cette attente vivait.
  //
  // ⚠️ ET LE PARALLÉLISME CHANGE LA PROPAGATION DES ERREURS, CE QUI EST LE VRAI RISQUE DU GESTE.
  // En série, une panne sur `utilisatrice` levait AVANT que `consentement` soit lu. En parallèle,
  // les deux promesses existent : si l'une rejette et qu'on ne l'attend pas, Node lève un rejet
  // NON CAPTÉ, qui tue le processus au lieu de rendre une erreur propre. `Promise.all` attend
  // bien les deux, et `maybeSingle()` ne REJETTE pas sur une erreur SQL — il rend `{ error }`.
  // Les deux `throw` ci-dessous restent donc les seuls chemins d'échec, et ils sont éprouvés
  // chacun séparément par `tests/etat-onboarding.test.ts`.
  //
  // La règle qu'ils tiennent n'a pas bougé d'un pouce : FAIL LOUD sur une vraie erreur de lecture,
  // et ne JAMAIS confondre « lecture impossible » (transitoire) avec « pas de ligne ». Sinon on
  // renvoie une adulte déjà consentante vers /naissance, où l'immutabilité de la date la bloque
  // (le défaut est arrivé, revue 1.5).
  const [
    { data: ligne, error: erreurLigne },
    { data: consentement, error: erreurConsentement },
  ] = await Promise.all([
    supabase
      .from("utilisatrice")
      .select("date_naissance, mineur_detecte, barriere_minorite_le")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("consentement")
      .select("art9_accorde, ia_reconnue, cgu_acceptees, revoked_at")
      .eq("utilisatrice_id", userId)
      .maybeSingle(),
  ]);

  if (erreurLigne) {
    throw new ErreurLectureOnboarding("utilisatrice");
  }
  if (erreurConsentement) {
    throw new ErreurLectureOnboarding("consentement");
  }

  return etapeOnboarding(ligne, statutConsentement(consentement));
}

/**
 * Statut du consentement art. 9 à partir de la ligne `consentement` (ou son absence) :
 *  - `aucun`   : pas de preuve valide (pas de ligne, ou art. 9 / IA non reconnus) → doit consentir.
 *  - `valide`  : art. 9 accordé ET IA reconnue ET non révoqué → traitement autorisé.
 *  - `revoque` : art. 9 accordé + IA reconnue MAIS `revoked_at` posé → traitement suspendu (AD-13).
 * On lit les DRAPEAUX, jamais la seule existence d'une ligne (acquis de la revue 1.5) : une ligne
 * `art9_accorde=false` (écrivable en direct via l'API REST sous RLS) ne vaut PAS un consentement.
 */
function statutConsentement(
  c: {
    art9_accorde: boolean;
    ia_reconnue: boolean;
    cgu_acceptees: boolean;
    revoked_at: string | null;
  } | null,
): StatutConsentement {
  // ⚠️ `cgu_acceptees` EST LU DEPUIS LA REVUE DES EPICS 1 À 4. Il ne l'était pas — ni ici, ni dans
  // `a_consenti_art9()` : seule la Server Action exigeait la case, c'est-à-dire rien pour qui écrit
  // en direct sur PostgREST. Le produit s'utilisait entièrement sans contrat, et la confirmation des
  // dix-huit ans que 0004 fait porter à cette même case ne valait pas davantage.
  //
  // Il est lu ICI ET en base, dans le même correctif : la base seule laisserait `etapeOnboarding`
  // rendre « suite » à quelqu'un dont toutes les écritures art. 9 échouent ensuite en silence. Une
  // garde qui laisse entrer dans une pièce où plus rien ne fonctionne est pire que pas de garde.
  if (!c || c.art9_accorde !== true || c.ia_reconnue !== true || c.cgu_acceptees !== true) {
    return "aucun";
  }
  return c.revoked_at === null ? "valide" : "revoque";
}
