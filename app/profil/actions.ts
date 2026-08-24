"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import * as copie from "@/lib/domain/copie-profil";
import type { EtatNom } from "@/render/profil/Profil";

const MAX_PRENOM = 100;
const MAX_NOM_COMPLET = 200;

/**
 * Changer son nom (retour du 2026-08-23).
 *
 * ⚠️ AUCUNE MIGRATION N'A ÉTÉ NÉCESSAIRE, ET C'EST LA 0041 QU'IL FAUT REMERCIER. `prenom` et
 * `nom_complet` figurent déjà dans le `grant update (…)` colonne par colonne posé là-bas : la
 * garde d'écriture vit dans la POLICY, pas ici, et cette action ne peut donc pas toucher une
 * colonne qu'on ne lui a pas ouverte — ni `date_naissance`, ni `mineur_detecte`, ni l'échéance de
 * suppression. C'est exactement ce que la doctrine du dépôt appelle une garde qui ne dépend pas de
 * la discipline de l'appelant (AD-12).
 *
 * ⚠️ ET LE THÈME NATAL NE BOUGE PAS. La 0039 dit que l'empreinte d'entrées ne couvre QUE les
 * entrées astronomiques : changer un nom ne déclenche aucun recalcul de ciel. Les NOMBRES, eux,
 * sont dérivés à la lecture depuis `nom_complet` — ils suivront d'eux-mêmes, sans écriture.
 */
export async function enregistrerNom(_precedent: EtatNom, donnees: FormData): Promise<EtatNom> {
  const prenom = String(donnees.get("prenom") ?? "").trim();
  const nomComplet = String(donnees.get("nom_complet") ?? "").trim();

  if (prenom.length === 0) return { statut: "erreur", message: copie.NOM_VIDE };
  if (prenom.length > MAX_PRENOM || nomComplet.length > MAX_NOM_COMPLET) {
    return { statut: "erreur", message: copie.NOM_TROP_LONG };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { statut: "erreur", message: copie.NOM_ECHEC };

  const { error } = await supabase
    .from("utilisatrice")
    .update({ prenom, nom_complet: nomComplet.length > 0 ? nomComplet : null })
    .eq("id", user.id);

  // ⚠️ ON NE JOURNALISE PAS LE CONTENU. Un prénom est une donnée personnelle ; le code d'erreur
  // suffit à diagnostiquer, et c'est la règle de toutes les routes de ce dépôt.
  if (error) {
    console.error("profil : enregistrement du nom en échec", { code: error.code ?? "inconnu" });
    return { statut: "erreur", message: copie.NOM_ECHEC };
  }

  // La scène affiche le prénom (l'ouverture d'Anam) et les nombres : les deux doivent se relire.
  revalidatePath("/");
  revalidatePath("/profil");
  return { statut: "ok", message: copie.NOM_ENREGISTRE };
}
