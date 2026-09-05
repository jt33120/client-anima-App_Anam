import "server-only";
import { createSupabaseAdminClient } from "@/lib/data/supabase/admin";

export type ProvenanceTexteDuJour = "modele" | "corpus";

export interface CleTexteDuJour {
  readonly jour: string;
  readonly condensatSignature: string;
  readonly versionEditoriale: string;
}

export interface TexteDuJourFige extends CleTexteDuJour {
  readonly texte: string;
  readonly provenance: ProvenanceTexteDuJour;
}

export interface DepotTexteDuJour {
  lire(cle: CleTexteDuJour): Promise<TexteDuJourFige | null>;
  figer(candidat: TexteDuJourFige): Promise<TexteDuJourFige>;
}

type LigneCache = {
  jour: string;
  condensat_signature: string;
  version_editoriale: string;
  texte: string;
  provenance: ProvenanceTexteDuJour;
};

const depuisLigne = (ligne: LigneCache): TexteDuJourFige => ({
  jour: ligne.jour,
  condensatSignature: ligne.condensat_signature,
  versionEditoriale: ligne.version_editoriale,
  texte: ligne.texte,
  provenance: ligne.provenance,
});

/** Cache système partagé : aucune colonne ne peut porter l'identité d'une personne. */
export function creerDepotTexteDuJour(): DepotTexteDuJour {
  return {
    async lire(cle) {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("texte_du_jour_stable")
        .select("jour, condensat_signature, version_editoriale, texte, provenance")
        .eq("jour", cle.jour)
        .eq("condensat_signature", cle.condensatSignature)
        .eq("version_editoriale", cle.versionEditoriale)
        .gt("expire_le", new Date().toISOString())
        .maybeSingle<LigneCache>();
      if (error) throw new Error(`cache_texte_du_jour_lecture:${error.code ?? "inconnu"}`);
      return data ? depuisLigne(data) : null;
    },

    async figer(candidat) {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.rpc("figer_texte_du_jour", {
        p_jour: candidat.jour,
        p_condensat_signature: candidat.condensatSignature,
        p_version_editoriale: candidat.versionEditoriale,
        p_texte: candidat.texte,
        p_provenance: candidat.provenance,
      });
      if (error) throw new Error(`cache_texte_du_jour_ecriture:${error.code ?? "inconnu"}`);
      const ligne = (Array.isArray(data) ? data[0] : data) as LigneCache | null;
      if (!ligne) throw new Error("cache_texte_du_jour_reponse_vide");
      return depuisLigne(ligne);
    },
  };
}
