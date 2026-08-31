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
  const lireLesDeux = () =>
    Promise.all([
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

  // ══ UNE SEULE REPRISE, ET ELLE NE RELÂCHE RIEN (retour du 2026-08-30) ═══════════════════════
  //
  // Rapporté par Julian : « This page couldn't load — A server error occurred. Reload to try
  // again. […] je dois reload pour ensuite afficher la page ». Le texte est ANGLAIS : ce n'est pas
  // `app/_erreur/ErreurApplication.tsx`, c'est la page 500 intégrée de Next. L'erreur naît donc
  // au-dessus des boundaries, dans le rendu du document.
  //
  // Cette fonction en est la source la plus probable : `app/page.tsx` garde TOUT le reste derrière
  // un `.catch()` — l'arbre, l'allocation, la mémoire — et ce `throw`-ci est le seul nu. Une
  // lecture qui échoue UNE fois y rend un 500 franc.
  //
  // Le mécanisme observé en production : `proxy.ts` rafraîchit la session à chaque requête ; le
  // JWT tout juste émis porte un `iat` daté par l'horloge de GoTrue, et Postgres le valide avec la
  // SIENNE. Si elle est en retard de quelques centaines de millisecondes, l'`iat` est « dans le
  // futur » et la lecture rend un 401. Au rechargement, le jeton a vieilli : ça passe. C'est
  // exactement le geste que l'utilisatrice fait à la main — on l'automatise, une fois.
  //
  // ⚠️ CE N'EST PAS UN ADOUCISSEMENT DE LA GARDE, ET LA DISTINCTION EST TOUT. La règle du fichier
  // reste intacte : on ne confond JAMAIS « lecture impossible » avec « pas de ligne ». Si la
  // seconde lecture échoue aussi, on lève comme avant, avec la même source nommée. Une panne
  // réelle continue donc de faire du bruit ; seul le clignotement d'une horloge est absorbé.
  //
  // ⚠️ ET LA REPRISE NE COURT QUE SUR ERREUR. Le chemin nominal garde ses DEUX départs, ce que
  // `tests/etat-onboarding.test.ts` vérifie en comptant l'ordre : une reprise systématique en
  // ferait quatre et ferait rougir la garde du parallélisme, à juste titre.
  const DELAI_REPRISE_MS = 400;
  let [
    { data: ligne, error: erreurLigne },
    { data: consentement, error: erreurConsentement },
  ] = await lireLesDeux();

  if (erreurLigne || erreurConsentement) {
    await new Promise((suite) => setTimeout(suite, DELAI_REPRISE_MS));
    [
      { data: ligne, error: erreurLigne },
      { data: consentement, error: erreurConsentement },
    ] = await lireLesDeux();
  }

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
