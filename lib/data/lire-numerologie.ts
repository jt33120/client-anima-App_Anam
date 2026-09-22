import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculerNumerologie,
  type EntreesNumerologie,
  type Numerologie,
} from "@/lib/astro/numerologie";
import type { EntreesArbre } from "@/lib/astro/arbre-de-vie";

/**
 * lire-numerologie.ts — LA NUMÉROLOGIE DE L'UTILISATRICE COURANTE (Story 5.2, T5).
 *
 * ── AUCUN STOCKAGE, AUCUNE MIGRATION — ET C'EST L'INVERSE DU THÈME NATAL ───────────────────────
 *
 * Le réflexe, après la 5.1, serait de graver le résultat comme `theme_natal`. Ce serait une faute,
 * pour une raison inscrite dans la migration qui a créé les colonnes :
 *
 *     0039_theme_natal.sql:69 — « PORTÉE : les seules ENTRÉES ASTRONOMIQUES. `prenom` et
 *     `nom_complet` en sont volontairement EXCLUS » (une correction est une donnée, FR-064).
 *
 * Le thème natal est cher (éphémérides) et bâti sur des entrées gravées une fois : le cacher est le
 * seul moyen d'avoir un coût marginal nul. La numérologie est de l'arithmétique sur quelques
 * caractères, et elle dépend d'un nom CORRIGEABLE. La stocker créerait un cache à invalider — donc,
 * un jour, un nom corrigé et une numérologie périmée qui a parfaitement l'air juste.
 *
 * Trois conséquences, toutes bonnes : coût marginal déjà nul sans écriture (FR-047), aucune question
 * de conservation art. 9 (rien à exporter, rien à effacer, rien à propager — FR-067), et zéro
 * migration dans cette story.
 *
 * ── SOUS LE JWT DE L'UTILISATRICE ──────────────────────────────────────────────────────────────
 *
 * Comme `depot-theme-natal.ts` : jamais `service_role`. Ici c'est une simple lecture de sa propre
 * ligne `utilisatrice`, sous RLS propriétaire (AD-12).
 *
 * ⚠️ Ce fichier est balayé par `tests/socle-jamais-coupe.test.ts`, qui refuse tout mot de registre
 * COMMERCIAL — commentaires compris. Ce n'est pas excessif : un « TODO : mettre ça derrière l'offre
 * payante » posé ici serait le premier pas vers la coupure d'un socle gratuit à vie (FR-055). Si un
 * jour il faut vraiment citer une couche de facturation, on la nomme par son fichier sans employer
 * le terme.
 *
 * ── L'ANNÉE DE RÉFÉRENCE EST RÉSOLUE ICI, PAS DANS LE DOMAINE ──────────────────────────────────
 *
 * `calculerNumerologie` prend un ENTIER, pas un `Date` : extraire une année d'un instant demande de
 * choisir un fuseau, et le 1ᵉʳ janvier entre 00 h et 01 h à Paris, `getFullYear()` et
 * `getUTCFullYear()` ne donnent pas la même. Le domaine n'a aucun moyen de trancher — cette couche,
 * si. Le fuseau du produit est `Europe/Paris` (`lib/domain/ordonnanceur.ts:21`), et la résolution
 * suit le patron `jourCivilParis` de `lib/domain/branche.ts`.
 *
 * ── ART. 9 ET DONNÉES PERSONNELLES DANS LES ERREURS : JAMAIS (NFR-022) ────────────────────────
 *
 * Ni le nom, ni la date, ni un nombre ne sortent dans un message d'erreur ou un log. Comme
 * `depot-journal.ts:25` et `depot-theme-natal.ts:47-51`, on ne remonte que le code Postgres.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════

export type RaisonNumerologieIndisponible =
  /** Pas de date de naissance en base — le parcours d'entrée n'est pas allé au bout (FR-048). */
  | "naissance_absente"
  /** Lecture en base impossible (panne). DISTINCT de « pas de date » : c'est un incident. */
  | "lecture_impossible";

export type ResultatNumerologie =
  | {
      readonly statut: "calcule";
      readonly numerologie: Numerologie;
      /** Entrées renvoyées au serveur de rendu pour expliquer le calcul, jamais journalisées. */
      readonly entrees: EntreesNumerologie;
    }
  | { readonly statut: "indisponible"; readonly raison: RaisonNumerologieIndisponible };

interface LigneIdentite {
  date_naissance: string | null;
  nom_complet: string | null;
  prenom_de_naissance: string | null;
}

export type ResultatEntreesArbre =
  | { readonly statut: "lu"; readonly entrees: EntreesArbre }
  | { readonly statut: "indisponible"; readonly raison: RaisonNumerologieIndisponible };

/**
 * L'année civile courante à Paris. Extraite via `Intl` — le passage à l'heure d'hiver et le décalage
 * de minuit sont gérés par la bibliothèque, jamais par une soustraction d'heures faite à la main.
 */
export function anneeCouranteParis(maintenant: Date): number {
  const partie = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
  })
    .formatToParts(maintenant)
    .find((p) => p.type === "year");
  if (!partie) throw new Error("lire-numerologie : année introuvable");
  return Number(partie.value);
}

/**
 * La numérologie de l'utilisatrice, calculée à la lecture.
 *
 * `maintenant` est injecté pour que le déterminisme reste testable de bout en bout : la seule
 * horloge du chemin vit chez l'appelant, jamais enfouie ici (patron `lib/domain/intention.ts`).
 */
export async function lireNumerologie(
  supabase: SupabaseClient,
  utilisatriceId: string,
  maintenant: Date,
): Promise<ResultatNumerologie> {
  const lecture = await lireEntreesArbre(supabase, utilisatriceId);
  if (lecture.statut === "indisponible") return lecture;

  // ⚠️ LE PRÉNOM DE NAISSANCE N'ENTRE PAS DANS LES SIX NOMBRES. Il est lu par la requête commune,
  // mais on le laisse tomber ici : `EntreesNumerologie` ne le porte pas, et le nom complet contient
  // déjà les prénoms — les additionner compterait le prénom deux fois. C'est la même règle que
  // `prenom`, pour une raison différente : celui-là est une donnée d'adresse, celui-ci est déjà là.
  const entrees: EntreesNumerologie = {
    date: lecture.entrees.date,
    nomComplet: lecture.entrees.nomComplet,
  };
  return {
    statut: "calcule",
    entrees,
    numerologie: calculerNumerologie(entrees, anneeCouranteParis(maintenant)),
  };
}

/**
 * Les entrées de calcul, SANS HORLOGE — la lecture que partagent les six nombres et l'arbre de vie.
 *
 * ⚠️ AUCUNE ANNÉE DE RÉFÉRENCE ICI, ET C'EST LE POINT. L'année personnelle est le seul nombre du
 * produit qui bouge dans le temps ; l'arbre de vie, lui, ne bouge jamais. Lui faire traverser un
 * `Date` pour qu'il n'en fasse rien l'obligerait à en dépendre au type, puis un jour au comportement.
 *
 * Une seule requête, et le commentaire sur `prenom` ne vit qu'à un endroit : `utilisatrice.prenom`
 * n'est PAS lu — c'est une donnée d'adresse (comment Anam la nomme), possiblement un diminutif,
 * jamais une entrée de calcul. `prenom_de_naissance`, lui, est demandé pour ça et pour rien d'autre.
 */
export async function lireEntreesArbre(
  supabase: SupabaseClient,
  utilisatriceId: string,
): Promise<ResultatEntreesArbre> {
  const { data, error } = await supabase
    .from("utilisatrice")
    .select("date_naissance, nom_complet, prenom_de_naissance")
    .eq("id", utilisatriceId)
    .maybeSingle<LigneIdentite>();

  if (error) return { statut: "indisponible", raison: "lecture_impossible" };
  if (!data?.date_naissance) return { statut: "indisponible", raison: "naissance_absente" };

  return {
    statut: "lu",
    entrees: {
      date: data.date_naissance,
      nomComplet: data.nom_complet,
      prenomDeNaissance: data.prenom_de_naissance,
    },
  };
}
