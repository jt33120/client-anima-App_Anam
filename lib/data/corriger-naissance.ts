import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ephemerideAstronomyEngine } from "@/lib/astro/adapters/astronomy-engine";
import type { EphemerisPort } from "@/lib/astro/port";
import { calculerThemeNatal, type EntreesNaissance } from "@/lib/astro/theme-natal";
import { comparerThemes, type ApercuCorrection } from "@/lib/domain/correction-naissance";
import { createSupabaseAdminClient } from "@/lib/data/supabase/admin";
import { empreinteDe } from "@/lib/data/depot-theme-natal";

/**
 * corriger-naissance.ts — LIRE, APERCEVOIR, CORRIGER (Story 6.5b, art. 16).
 *
 * ── LECTURES SOUS JWT ; PAQUET PROTÉGÉ PAR UNE RPC SERVEUR BORNÉE ──────────────────────────────
 *
 * Les lectures et la correction historique de l'heure restent sous son JWT. La correction groupée
 * date/heure/lieu est l'exception étroite : une Server Action authentifie l'appelante, résout le
 * lieu dans le référentiel, puis appelle une RPC réservée au service_role. La RPC revalide
 * consentement, majorité, état antérieur et cible sous verrou ; le navigateur ne peut ni l'appeler
 * ni lui fournir directement des coordonnées.
 *
 * ── L'APERÇU NE PASSE PAR AUCUNE ÉCRITURE, ET C'EST TOUT SON INTÉRÊT ───────────────────────────
 *
 * `calculerThemeNatal` est PUR (AD-6) : on peut calculer le thème que produirait une heure sans
 * rien graver, sans incrémenter aucune version, sans toucher au thème en place. C'est ce qui permet
 * de MONTRER avant d'écrire — et donc de se passer d'un plafond de corrections (0060).
 *
 * ⚠️ Coût assumé : un aperçu appelle l'éphéméride DEUX fois (le thème d'avant, celui d'après). C'est
 * le seul endroit du produit qui la sollicite sur un geste interactif. Il est borné par la nature du
 * geste — on ne corrige pas son heure de naissance en boucle — et il n'écrit rien, donc il ne peut
 * pas laisser d'état à moitié fait derrière lui.
 *
 * ── LA CORRECTION GROUPÉE PRÉCALCULE, PUIS GRAVE EN UNE TRANSACTION ────────────────────────────
 *
 * Le calcul pur est effectué avant l'appel privilégié. La RPC reçoit ensuite entrées, empreinte et
 * thème depuis ce serveur de confiance et les écrit atomiquement : si le calcul ou la transaction
 * échoue, l'ancien profil et son ancien thème restent ensemble. Le recalcul paresseux demeure la
 * défense générale pour les migrations de schéma et les anciens chemins d'ajout d'heure.
 *
 * ── NFR-022 ───────────────────────────────────────────────────────────────────────────────────
 *
 * Ni l'heure, ni la date de naissance, ni les coordonnées ne sortent dans un message d'erreur ou un
 * log. On ne rend que des verdicts d'un ensemble fermé.
 */

/** Ce que l'écran a besoin de savoir avant de proposer quoi que ce soit. */
export interface EtatNaissance {
  readonly date: string | null;
  /** `HH:MM:SS` déjà enregistrée, ou `null` — il n'y a alors rien à corriger. */
  readonly heure: string | null;
  readonly lieu: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly fuseau: string | null;
  /** Date de la dernière correction, ou `null`. Le NOMBRE n'est jamais lu : voir `copie-naissance`. */
  readonly corrigeeLe: Date | null;
}

interface LigneNaissance {
  date_naissance: string | null;
  heure_naissance: string | null;
  lieu_naissance: string | null;
  lieu_fuseau: string | null;
  lieu_latitude: number | null;
  lieu_longitude: number | null;
  naissance_corrigee_le: string | null;
}

const CHAMPS =
  "date_naissance, heure_naissance, lieu_naissance, lieu_fuseau, lieu_latitude, lieu_longitude, naissance_corrigee_le";

async function ligneDe(
  supabase: SupabaseClient,
  utilisatriceId: string,
): Promise<LigneNaissance | null> {
  const { data, error } = await supabase
    .from("utilisatrice")
    .select(CHAMPS)
    .eq("id", utilisatriceId)
    .maybeSingle<LigneNaissance>();
  return error ? null : (data ?? null);
}

export async function lireNaissance(
  supabase: SupabaseClient,
  utilisatriceId: string,
): Promise<EtatNaissance | null> {
  const ligne = await ligneDe(supabase, utilisatriceId);
  if (!ligne) return null;
  return {
    date: ligne.date_naissance,
    heure: ligne.heure_naissance,
    lieu: ligne.lieu_naissance,
    latitude: ligne.lieu_latitude,
    longitude: ligne.lieu_longitude,
    fuseau: ligne.lieu_fuseau,
    corrigeeLe: ligne.naissance_corrigee_le ? new Date(ligne.naissance_corrigee_le) : null,
  };
}

export interface DonneesNaissanceResolues {
  readonly date: string;
  readonly heure: string | null;
  readonly lieu: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly fuseau: string;
}

export async function apercuDeCorrectionDonnees(
  supabase: SupabaseClient,
  utilisatriceId: string,
  nouvelles: DonneesNaissanceResolues,
  ephemeride: EphemerisPort = ephemerideAstronomyEngine(),
): Promise<ApercuCorrection | null> {
  const ligne = await ligneDe(supabase, utilisatriceId);
  if (!ligne?.date_naissance) return null;
  const avant: EntreesNaissance = {
    date: ligne.date_naissance,
    heure: ligne.heure_naissance,
    fuseau: ligne.lieu_fuseau,
    latitude: ligne.lieu_latitude,
    longitude: ligne.lieu_longitude,
  };
  const apres: EntreesNaissance = {
    date: nouvelles.date,
    heure: nouvelles.heure,
    fuseau: nouvelles.fuseau,
    latitude: nouvelles.latitude,
    longitude: nouvelles.longitude,
  };
  return comparerThemes(
    calculerThemeNatal(avant, ephemeride),
    calculerThemeNatal(apres, ephemeride),
  );
}

/**
 * Ce que la nouvelle heure changerait — calculé, jamais écrit.
 *
 * Rend `null` quand la comparaison n'a pas de sens : pas de date de naissance (le thème n'existe
 * pas), ou aucune heure déjà gravée (il n'y a alors rien à corriger, il y a à ajouter — c'est le
 * parcours de la 5.3, et l'écran y renvoie).
 */
export async function apercuDeCorrection(
  supabase: SupabaseClient,
  utilisatriceId: string,
  nouvelleHeure: string,
  ephemeride: EphemerisPort = ephemerideAstronomyEngine(),
): Promise<ApercuCorrection | null> {
  const ligne = await ligneDe(supabase, utilisatriceId);
  if (!ligne?.date_naissance || ligne.heure_naissance === null) return null;

  const commun = {
    date: ligne.date_naissance,
    fuseau: ligne.lieu_fuseau,
    latitude: ligne.lieu_latitude,
    longitude: ligne.lieu_longitude,
  };
  const avant: EntreesNaissance = { ...commun, heure: ligne.heure_naissance };
  const apres: EntreesNaissance = { ...commun, heure: nouvelleHeure };

  return comparerThemes(
    calculerThemeNatal(avant, ephemeride),
    calculerThemeNatal(apres, ephemeride),
  );
}

/**
 * Le verdict d'une écriture. Ensemble FERMÉ : l'écran en dérive ses messages, et aucun code
 * Postgres ne remonte jusqu'à lui.
 */
export type IssueCorrection = "corrigee" | "consentement_absent" | "refusee";

export async function ecrireHeureCorrigee(
  supabase: SupabaseClient,
  utilisatriceId: string,
  heure: string,
): Promise<IssueCorrection> {
  const { error } = await supabase
    .from("utilisatrice")
    .update({ heure_naissance: heure })
    .eq("id", utilisatriceId);
  if (!error) return "corrigee";
  // `42501` est le code que `naissance_corrigible` (0060) lève quand le consentement art. 9 n'est
  // plus valide ou que la barrière de minorité est posée. On distingue ce refus d'une panne : dire
  // « réessaie » à quelqu'un qui a révoqué le ferait réessayer pour rien, indéfiniment.
  return error.code === "42501" ? "consentement_absent" : "refusee";
}

export async function ecrireDonneesNaissance(
  utilisatriceId: string,
  donnees: DonneesNaissanceResolues,
  attendu: EtatNaissance,
): Promise<IssueCorrection> {
  // Mutation privilégiée et bornée : la Server Action a authentifié l'appelante, re-résolu le code
  // INSEE et relu l'état attendu. La RPC n'est pas exécutable avec un JWT de navigateur ; elle
  // compare encore l'ancien paquet sous verrou avant d'écrire, pour fermer la course entre aperçu
  // et confirmation.
  try {
    const ephemeride = ephemerideAstronomyEngine();
    const entrees: EntreesNaissance = {
      date: donnees.date,
      heure: donnees.heure,
      fuseau: donnees.fuseau,
      latitude: donnees.latitude,
      longitude: donnees.longitude,
    };
    const theme = calculerThemeNatal(entrees, ephemeride);
    const empreinte = empreinteDe(entrees, ephemeride.identifiant);
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc("corriger_donnees_naissance", {
      p_utilisatrice_id: utilisatriceId,
      p_date: donnees.date,
      p_heure: donnees.heure,
      p_lieu_nom: donnees.lieu,
      p_lieu_latitude: donnees.latitude,
      p_lieu_longitude: donnees.longitude,
      p_lieu_fuseau: donnees.fuseau,
      p_empreinte_theme: empreinte,
      p_theme: theme,
      p_date_attendue: attendu.date,
      p_heure_attendue: attendu.heure,
      p_lieu_nom_attendu: attendu.lieu,
      p_lieu_latitude_attendue: attendu.latitude,
      p_lieu_longitude_attendue: attendu.longitude,
      p_lieu_fuseau_attendu: attendu.fuseau,
    });
    if (error) return error.code === "42501" ? "consentement_absent" : "refusee";
    return data === "corrigee"
      ? "corrigee"
      : data === "consentement_absent"
        ? "consentement_absent"
        : "refusee";
  } catch {
    return "refusee";
  }
}
