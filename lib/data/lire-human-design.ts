import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ephemerideAstronomyEngine } from "@/lib/astro/adapters/astronomy-engine";
import type { EphemerisPort } from "@/lib/astro/port";
import {
  calculerHumanDesign,
  type ResultatHumanDesign,
} from "@/lib/astro/human-design";

/**
 * lire-human-design.ts — LE DESSIN, RECALCULÉ À CHAQUE LECTURE (2026-09-03).
 *
 * ══ AUCUNE TABLE, ET C'EST LA DÉCISION QUI COMPTE ═══════════════════════════════════════════════
 *
 * Le Big Five a deux tables parce qu'il repose sur des RÉPONSES : sans elles, il n'y a rien à
 * recalculer. Le Human Design, lui, est une FONCTION de la date, de l'heure et du lieu de naissance
 * — exactement comme les nombres de la numérologie, qui n'ont pas de table non plus.
 *
 * Le graver coûterait une table, deux verdicts d'inventaire, une migration, une colonne de version
 * et un chemin de recalcul paresseux (le patron `theme_natal`, décision D5) — tout ça pour un
 * résultat qui, à naissance égale, est le même à chaque appel. Et ça introduirait le seul défaut que
 * `theme_natal` a dû apprendre à réparer : une ligne gravée sous une ancienne forme du calcul, qui
 * survit à sa correction.
 *
 * ⚠️ CE QUE ÇA COÛTE, ET POURQUOI ON L'ACCEPTE. Le calcul lit treize corps sur deux instants, et
 * l'instant de design se résout par itération (jusqu'à huit lectures du Soleil de plus). C'est plus
 * cher qu'un `select`. Mais c'est un rendu de HALTE — une page qu'on ouvre, pas un chemin
 * chaud — et `theme_natal` fait déjà un `select` de naissance à chaque lecture de socle pour
 * exactement la raison inverse.
 *
 * ⚠️ ET AUCUNE DONNÉE NOUVELLE N'EST ÉCRITE. Rien à effacer, rien à exporter, rien à recenser : le
 * dessin ne subsiste nulle part, il se recalcule ou il n'existe pas. La date de naissance, elle, est
 * déjà couverte par les deux inventaires (`utilisatrice`).
 */

/** Les colonnes de naissance, telles que `depot-theme-natal.ts` les lit déjà. */
interface LigneNaissance {
  date_naissance: string | null;
  heure_naissance: string | null;
  lieu_fuseau: string | null;
  lieu_latitude: number | null;
  lieu_longitude: number | null;
}

export type ResultatHumanDesignLu =
  | ResultatHumanDesign
  /** Distinct d'`heure_inconnue` : ici c'est la DATE qui manque, et aucune porte ne la propose. */
  | { readonly statut: "indisponible"; readonly raison: "naissance_absente" }
  | { readonly statut: "indisponible"; readonly raison: "lecture_impossible" };

/**
 * Le dessin de l'utilisatrice courante.
 *
 * L'éphéméride est un PARAMÈTRE avec une valeur par défaut, comme dans `lireThemeNatal` : c'est ce
 * qui rend la fonction testable sans réseau ni horloge, et ce qui garde `calculerHumanDesign` pur.
 */
export async function lireHumanDesign(
  supabase: SupabaseClient,
  utilisatriceId: string,
  ephemeride: EphemerisPort = ephemerideAstronomyEngine(),
): Promise<ResultatHumanDesignLu> {
  const { data, error } = await supabase
    .from("utilisatrice")
    .select("date_naissance, heure_naissance, lieu_fuseau, lieu_latitude, lieu_longitude")
    .eq("id", utilisatriceId)
    .maybeSingle<LigneNaissance>();

  if (error) return { statut: "indisponible", raison: "lecture_impossible" };
  // Sans DATE il n'y a pas de thème du tout, et ce n'est pas la même absence que l'heure : l'écran
  // renvoie vers `/naissance`, pas vers `/heure-naissance`.
  if (!data?.date_naissance) return { statut: "indisponible", raison: "naissance_absente" };

  return calculerHumanDesign(
    {
      date: data.date_naissance,
      heure: data.heure_naissance,
      fuseau: data.lieu_fuseau,
      latitude: data.lieu_latitude,
      longitude: data.lieu_longitude,
    },
    ephemeride,
  );
}
