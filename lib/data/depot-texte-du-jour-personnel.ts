import "server-only";
import { createSupabaseAdminClient } from "@/lib/data/supabase/admin";
import type { EcritureTroisParties } from "@/lib/domain/verdict-horoscope";

/**
 * depot-texte-du-jour-personnel.ts — LE CACHE DU TEXTE DU JOUR, PAR PERSONNE (2026-09-07).
 *
 * ── POURQUOI IL REMPLACE `depot-texte-du-jour.ts` SUR LE CHEMIN DU MODÈLE ──────────────────────
 *
 * L'autre dépôt sert un cache PARTAGÉ, dont la clé ne porte aucune identité : c'est ce qui permet à
 * toutes les personnes d'un même ciel de se partager un texte, donc un appel. Depuis que le texte
 * nomme un prénom, une branche et un Soleil natal, la propriété est inversée — il n'est partageable
 * avec personne. Voir l'en-tête de `supabase/migrations/0094_texte_du_jour_personnel.sql`.
 *
 * ── CE QU'IL PORTE, ET CE QU'IL NE PORTE PAS ───────────────────────────────────────────────────
 *
 * Trois parties, ou une PIERRE TOMBALE. La tombale (`provenance: "corpus"`, trois colonnes nulles)
 * dit « pour cette personne, ce jour-là, le modèle a déjà eu sa chance et l'a manquée » ; elle borne
 * le coût, sans quoi un refus reproductible déclencherait un appel fournisseur à chaque affichage.
 *
 * ⚠️ ELLE N'EST JAMAIS POSÉE SUR UN DÉLAI, ET C'EST LA RÈGLE LA PLUS IMPORTANTE DE CE MODULE. Elle
 * ne se tient pas ici mais chez l'appelant (`lib/ai/texte-du-jour.ts`), qui est le seul à savoir si
 * la génération est décidée ou encore en vol.
 */

export type ProvenanceTexteDuJour = "modele" | "corpus";

export interface CleTextePersonnel {
  readonly utilisatriceId: string;
  readonly jour: string;
  readonly versionEditoriale: string;
}

export interface TextePersonnelFige extends CleTextePersonnel {
  /** `null` quand la ligne est une pierre tombale : rien n'a été retenu du modèle ce jour-là. */
  readonly parties: EcritureTroisParties | null;
  readonly provenance: ProvenanceTexteDuJour;
}

/** Ce qu'on demande à figer : les témoins de diagnostic voyagent avec. */
export interface CandidatTextePersonnel extends CleTextePersonnel {
  readonly condensatSignature: string;
  readonly condensatMatiere: string;
  readonly parties: EcritureTroisParties | null;
  readonly provenance: ProvenanceTexteDuJour;
}

export interface DepotTextePersonnel {
  lire(cle: CleTextePersonnel): Promise<TextePersonnelFige | null>;
  figer(candidat: CandidatTextePersonnel): Promise<TextePersonnelFige>;
}

type LignePersonnelle = {
  utilisatrice_id: string;
  jour: string;
  version_editoriale: string;
  ciel: string | null;
  pour_toi: string | null;
  gestes: string | null;
  provenance: ProvenanceTexteDuJour;
};

/**
 * ⚠️ LA FORME EST RECONSTRUITE DEPUIS LES TROIS COLONNES, PAS SUPPOSÉE. La contrainte
 * `texte_du_jour_personnel_forme` garantit en base que les trois sont pleines ou les trois nulles ;
 * ici on le REVÉRIFIE plutôt que d'écrire `ciel!`. Une ligne à moitié pleine ne peut pas exister —
 * et si elle existait, elle produirait « undefined » dans une carte plutôt qu'un repli propre.
 */
const depuisLigne = (ligne: LignePersonnelle): TextePersonnelFige => ({
  utilisatriceId: ligne.utilisatrice_id,
  jour: ligne.jour,
  versionEditoriale: ligne.version_editoriale,
  parties:
    ligne.ciel !== null && ligne.pour_toi !== null && ligne.gestes !== null
      ? { ciel: ligne.ciel, pourToi: ligne.pour_toi, gestes: ligne.gestes }
      : null,
  provenance: ligne.provenance,
});

const COLONNES = "utilisatrice_id, jour, version_editoriale, ciel, pour_toi, gestes, provenance";

/**
 * Le dépôt.
 *
 * ⚠️ CLIENT ADMIN, ET LA TABLE EST MURÉE. `authenticated` n'a aucun privilège sur
 * `texte_du_jour_personnel` (RLS forcée, aucune policy) : ce texte est servi par le serveur au
 * rendu, jamais lu par le navigateur. Le filtre `utilisatrice_id` ci-dessous n'est donc pas la garde
 * d'isolation — c'est la clé. La garde, c'est que personne d'autre que ce module ne peut lire.
 */
export function creerDepotTextePersonnel(): DepotTextePersonnel {
  return {
    async lire(cle) {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("texte_du_jour_personnel")
        .select(COLONNES)
        .eq("utilisatrice_id", cle.utilisatriceId)
        .eq("jour", cle.jour)
        .eq("version_editoriale", cle.versionEditoriale)
        .gt("expire_le", new Date().toISOString())
        .maybeSingle<LignePersonnelle>();
      if (error) throw new Error(`cache_texte_personnel_lecture:${error.code ?? "inconnu"}`);
      return data ? depuisLigne(data) : null;
    },

    async figer(candidat) {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.rpc("figer_texte_du_jour_personnel", {
        p_utilisatrice_id: candidat.utilisatriceId,
        p_jour: candidat.jour,
        p_version_editoriale: candidat.versionEditoriale,
        p_condensat_signature: candidat.condensatSignature,
        p_condensat_matiere: candidat.condensatMatiere,
        p_ciel: candidat.parties?.ciel ?? null,
        p_pour_toi: candidat.parties?.pourToi ?? null,
        p_gestes: candidat.parties?.gestes ?? null,
        p_provenance: candidat.provenance,
      });
      if (error) throw new Error(`cache_texte_personnel_ecriture:${error.code ?? "inconnu"}`);
      const ligne = (Array.isArray(data) ? data[0] : data) as LignePersonnelle | undefined;
      // ⚠️ LA RPC REND CE QUI EST EN BASE, PAS CE QU'ON LUI A DONNÉ. Sur `on conflict do nothing`,
      // c'est le PREMIER texte servi qui revient : deux instances qui écrivent le même jour rendent
      // la même ligne, et la carte ne change pas sous ses yeux entre deux affichages.
      if (!ligne) throw new Error("cache_texte_personnel_reponse_vide");
      return depuisLigne(ligne);
    },
  };
}
