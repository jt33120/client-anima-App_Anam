import "server-only";
import { createSupabaseAdminClient } from "@/lib/data/supabase/admin";

export type CauseErreurOuvertureQuotidienne =
  | "schema-incompatible"
  | "incident-temporaire";

/**
 * Erreur fermée du dépôt : le code Supabase sert à classer l'incident, jamais à composer une copie.
 * Le message distant peut contenir SQL, identifiants ou données et ne franchit donc pas ce module.
 */
export class ErreurDepotOuvertureQuotidienne extends Error {
  readonly name = "ErreurDepotOuvertureQuotidienne";

  constructor(
    readonly causeOuverture: CauseErreurOuvertureQuotidienne,
    operation: string,
  ) {
    super(`ouverture_quotidienne:${operation}:${causeOuverture}`);
  }
}

const CODES_SCHEMA_INCOMPATIBLE = new Set([
  "PGRST202", // fonction absente du cache PostgREST
  "PGRST204", // colonne absente du cache PostgREST
  "PGRST205", // table absente du cache PostgREST
  "42883", // fonction PostgreSQL absente
  "42P01", // relation PostgreSQL absente
  "42703", // colonne PostgreSQL absente
]);

function erreurRpc(operation: string, code: unknown): ErreurDepotOuvertureQuotidienne {
  const cause =
    typeof code === "string" && CODES_SCHEMA_INCOMPATIBLE.has(code)
      ? "schema-incompatible"
      : "incident-temporaire";
  return new ErreurDepotOuvertureQuotidienne(cause, operation);
}

function erreurReponse(operation: string): ErreurDepotOuvertureQuotidienne {
  return new ErreurDepotOuvertureQuotidienne(
    "incident-temporaire",
    `${operation}_reponse_invalide`,
  );
}

export type DroitOuvertureQuotidienne =
  | { readonly statut: "a-preparer"; readonly jeton: string }
  | { readonly statut: "en-cours" }
  | {
      readonly statut: "deja-commencee";
      /** `null` signifie qu'un tour ordinaire avait déjà commencé le fil ce jour-là. */
      readonly ligne: OuvertureQuotidiennePersistante | null;
    };

export interface OuvertureQuotidiennePersistante {
  readonly id: string;
  readonly contenu: string;
  readonly creeLe: string;
  /** JSON public persisté par l'outbox ; son union métier est validée dans l'action. */
  readonly evenement: unknown;
}

interface LigneDroitOuverture {
  readonly statut: unknown;
  readonly jeton: unknown;
  readonly entree_id: unknown;
  readonly entree_contenu: unknown;
  readonly entree_creee_le: unknown;
  readonly evenement_public: unknown;
}

interface LigneOuvertureQuotidienne {
  readonly entree_id: unknown;
  readonly entree_contenu: unknown;
  readonly entree_creee_le: unknown;
  readonly evenement_public: unknown;
}

export interface PreparationOuvertureQuotidienne {
  /** Partie destinée au client, ou `null` pour la salutation générique. */
  readonly public: unknown;
  /** Paramètres de réservation strictement serveur, jamais persistés, ou `null`. */
  readonly interne: unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function evenementPublicValide(valeur: unknown): boolean {
  return valeur === null || (typeof valeur === "object" && !Array.isArray(valeur));
}

function lignePersistanteDepuis(
  ligne: Pick<
    LigneDroitOuverture,
    "entree_id" | "entree_contenu" | "entree_creee_le" | "evenement_public"
  >,
): OuvertureQuotidiennePersistante | null {
  const toutAbsent =
    ligne.entree_id === null &&
    ligne.entree_contenu === null &&
    ligne.entree_creee_le === null &&
    ligne.evenement_public === null;
  if (toutAbsent) return null;
  if (
    typeof ligne.entree_id !== "string" ||
    !UUID.test(ligne.entree_id) ||
    typeof ligne.entree_contenu !== "string" ||
    ligne.entree_contenu.trim() === "" ||
    typeof ligne.entree_creee_le !== "string" ||
    !Number.isFinite(Date.parse(ligne.entree_creee_le)) ||
    !evenementPublicValide(ligne.evenement_public)
  ) {
    throw erreurReponse("ligne");
  }
  return {
    id: ligne.entree_id,
    contenu: ligne.entree_contenu,
    creeLe: ligne.entree_creee_le,
    evenement: ligne.evenement_public,
  };
}

function reponseSansLigne(data: LigneDroitOuverture): boolean {
  return (
    data.entree_id === null &&
    data.entree_contenu === null &&
    data.entree_creee_le === null &&
    data.evenement_public === null
  );
}

/**
 * Obtient le droit EXCLUSIF de composer la parole du jour. Le registre pose d'abord un bail court :
 * un seul onglet peut alors exécuter les réservations d'événements. Un autre onglet attend la
 * finalisation au lieu de réserver puis perdre une pause ou une invitation.
 */
export async function commencerOuvertureQuotidienne(
  utilisatriceId: string,
  jourParis: string,
): Promise<DroitOuvertureQuotidienne> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .rpc("commencer_ouverture_quotidienne_anam", {
      cible: utilisatriceId,
      p_jour: jourParis,
    })
    .maybeSingle<LigneDroitOuverture>();
  if (error) throw erreurRpc("commencer", error.code);
  if (!data) throw erreurReponse("commencer");

  if (data.statut === "en_cours" && data.jeton === null && reponseSansLigne(data)) {
    return { statut: "en-cours" };
  }
  if (data.statut === "deja_commencee" && data.jeton === null) {
    try {
      return { statut: "deja-commencee", ligne: lignePersistanteDepuis(data) };
    } catch {
      throw erreurReponse("commencer");
    }
  }
  if (
    data.statut === "a_preparer" &&
    typeof data.jeton === "string" &&
    UUID.test(data.jeton) &&
    reponseSansLigne(data)
  ) {
    return { statut: "a-preparer", jeton: data.jeton };
  }
  throw erreurReponse("commencer");
}

/**
 * Finalise le bail par UNE insertion immuable du côté Anam. La préparation ne réserve rien : la RPC
 * réaffirme jour, consentement et minorité, réserve pause/invitation dans sa transaction, puis grave
 * soit l'événement autorisé, soit la phrase générique. Les paramètres internes ne sont pas persistés.
 */
export async function finaliserOuvertureQuotidienne(
  utilisatriceId: string,
  jourParis: string,
  jeton: string,
  phraseGenerique: string,
  preparation: PreparationOuvertureQuotidienne,
): Promise<OuvertureQuotidiennePersistante> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .rpc("finaliser_ouverture_quotidienne_anam", {
      cible: utilisatriceId,
      p_jour: jourParis,
      p_jeton: jeton,
      p_phrase_generique: phraseGenerique,
      p_preparation: preparation,
    })
    .maybeSingle<LigneOuvertureQuotidienne>();
  if (error) throw erreurRpc("finaliser", error.code);
  if (!data) {
    throw erreurReponse("finaliser");
  }
  try {
    const ligne = lignePersistanteDepuis(data);
    if (!ligne) throw new Error("ligne_absente");
    return ligne;
  } catch {
    throw erreurReponse("finaliser");
  }
}
