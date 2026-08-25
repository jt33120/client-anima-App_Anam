import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import * as copie from "@/lib/domain/copie-profil";
import { ENTREES_MENU } from "@/lib/domain/menu-compte";
import Profil from "@/render/profil/Profil";
import PiedHalte from "@/render/PiedHalte";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import { enregistrerNom } from "./actions";

// NFR-015 / identité de route — « Anam » partout, jamais un titre qui dit l'intimité de la page.
export const metadata = { title: "Anam" };

/** État de compte : jamais mis en cache, jamais pré-rendu. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * /profil — LE MENU DE COMPTE (retour du 2026-08-23).
 *
 * « Il manque aussi un bouton "Profil" avec les paramètres, où on peut réinitialiser ses infos,
 * changer son nom, gérer son abonnement etc. »
 *
 * ⚠️ CE QUI MANQUAIT N'ÉTAIT PAS DES ÉCRANS. Réglages, mémoire, données, abonnement, heure de
 * naissance, type : tous existaient, et AUCUN n'était atteignable autrement qu'en tapant son URL.
 * La dette est écrite noir sur blanc dans l'en-tête de `/reglages` — « elle n'est atteignable que
 * par URL tant que ce menu n'existe pas » — et elle valait pour cinq haltes. Cette page est ce
 * menu, et le lien « Profil » de la surimpression est la porte qui manquait.
 */
export default async function PageProfil() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrer");

  const etape = await etapeOnboardingPour(supabase, user.id);
  if (etape === "barre") redirect("/barriere");
  if (etape === "mineur") {
    await supabase.auth.signOut();
    redirect("/entrer?refus=age");
  }
  if (etape === "naissance") redirect("/naissance");
  if (etape === "consentement") redirect("/consentement");
  if (etape === "revoque") redirect("/consentement/revoque");

  // Repli sûr : un nom illisible n'empêche pas d'atteindre ses réglages ni d'effacer son compte.
  const { data } = await supabase
    .from("utilisatrice")
    .select("prenom, nom_complet")
    .eq("id", user.id)
    .maybeSingle<{ prenom: string | null; nom_complet: string | null }>();

  return (
    <>
      <Profil
        titre={copie.TITRE_HALTE}
        introduction={copie.INTRODUCTION}
        sectionNom={copie.SECTION_NOM}
        nomDescription={copie.NOM_DESCRIPTION}
        nomPrevient={copie.NOM_PREVIENT_LES_NOMBRES}
        labelPrenom={copie.LABEL_PRENOM}
        labelNomComplet={copie.LABEL_NOM_COMPLET}
        aideNomComplet={copie.AIDE_NOM_COMPLET}
        actionEnregistrer={copie.ACTION_ENREGISTRER}
        prenom={data?.prenom ?? ""}
        nomComplet={data?.nom_complet ?? ""}
        entrees={ENTREES_MENU}
        urlRetour="/"
        enregistrer={enregistrerNom}
      />
      {/* La porte de secours (FR-077) ; la mention IA n'est pas due ici — aucun texte de modèle. */}
      <PiedHalte
        mentionIA={piedPour("profil").mentionIA}
        texteMention={MENTION_IA}
        urlTransparence={URL_TRANSPARENCE}
        urlAide={URL_AIDE}
      />
    </>
  );
}
