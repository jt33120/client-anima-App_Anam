import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import { lireEntreesArbre } from "@/lib/data/lire-numerologie";
import { ficheArbreDeVie } from "@/lib/domain/fiche-arbre-de-vie";
import * as copie from "@/lib/domain/copie-arbre-de-vie";
import {
  MENTION_IA,
  URL_AIDE,
  URL_TRANSPARENCE,
  piedPour,
} from "@/lib/domain/pied-halte";
import { urlRetourScene } from "@/lib/scene/retour-scene";
import RetourScene from "@/render/RetourScene";
import PiedHalte from "@/render/PiedHalte";
import FicheArbreDeVie from "@/render/arbre-de-vie/FicheArbreDeVie";
import s from "@/render/socle/socle.module.css";

/**
 * /arbre-de-vie — LA HALTE « TON ARBRE DE VIE ».
 *
 * Recette de halte recopiée mot pour mot depuis `/human-design`, qui est la plus proche : une seule
 * lecture, aucun modèle appelé. ⚠️ ELLE SE RECOPIE, ELLE NE SE FACTORISE PAS — la garde d'onboarding
 * est la chose qu'on veut voir en entier sur chaque page, pas derrière un appel qui pourrait, un
 * jour, en sauter une branche sans que personne ne le lise.
 *
 * ⚠️ AUCUN APPEL DE MODÈLE SUR CETTE PAGE, ET C'EST CE QUI REND `mentionIA: false` VRAI. Les sept
 * clés, la dynamique et les quatre défis sont CALCULÉS depuis sa naissance et son nom (FR-047) ; les
 * textes viennent du corpus d'Anima. Le jour où une lecture générée paraîtrait ici, le verdict de
 * `MENTION_DUE` bascule AVANT elle.
 *
 * ⚠️ ET AUCUNE ÉCRITURE : l'arbre se recalcule à chaque affichage, comme les six nombres du socle
 * (`lib/data/lire-numerologie.ts` explique pourquoi). Donc pas de cache à invalider, donc jamais un
 * nom corrigé et un arbre périmé qui a parfaitement l'air juste.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Anam" };

export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  const [parametres, lecture] = await Promise.all([
    searchParams,
    // Repli sûr : une panne de lecture ne renvoie pas une page en erreur, elle renvoie une page qui
    // dit qu'elle n'a pas pu lire. Et elle ne se confond pas avec « la date n'a jamais été donnée ».
    lireEntreesArbre(supabase, user.id).catch(() => null),
  ]);

  const indisponible =
    lecture === null
      ? copie.ARBRE_INDISPONIBLE
      : lecture.statut === "indisponible"
        ? lecture.raison === "naissance_absente"
          ? copie.NAISSANCE_ABSENTE
          : copie.ARBRE_INDISPONIBLE
        : null;

  const fiche = ficheArbreDeVie(
    lecture !== null && lecture.statut === "lu" ? lecture.entrees : null,
    indisponible,
  );

  return (
    <main className={s.halte}>
      <RetourScene url={urlRetourScene(parametres)} />
      <h1 className={`t-titre ${s.titreHalte}`}>{copie.TITRE_HALTE}</h1>

      {/* ⚠️ LES TEXTES DESCENDENT RÉSOLUS. `render/` ne peut importer ni `lib/domain` ni
          `lib/corpus` (AD-7/AD-10) : la page lit, le composant dessine. */}
      <FicheArbreDeVie
        fiche={fiche}
        copie={{
          surtitre: copie.SURTITRE,
          introduction: copie.INTRODUCTION,
          distinction: copie.DISTINCTION_AVEC_L_EVOLUTION,
          titreSchema: copie.TITRE_SCHEMA,
          descriptionSchema: copie.DESCRIPTION_SCHEMA,
          titreTriangle: copie.TITRE_TRIANGLE,
          introductionTriangle: copie.INTRODUCTION_TRIANGLE,
          titreComportement: copie.TITRE_COMPORTEMENT,
          introductionComportement: copie.INTRODUCTION_COMPORTEMENT,
          titreDynamique: copie.TITRE_DYNAMIQUE,
          titreDefis: copie.TITRE_DEFIS,
          introductionDefis: copie.INTRODUCTION_DEFIS,
          titreQualites: copie.TITRE_QUALITES,
          introductionQualites: copie.INTRODUCTION_QUALITES,
          titreCheminDeVie: copie.TITRE_CHEMIN_DE_VIE,
          titreMethode: copie.TITRE_METHODE,
          texteNonEcrit: copie.TEXTE_NON_ECRIT,
        }}
      />

      <PiedHalte
        mentionIA={piedPour("arbre-de-vie").mentionIA}
        texteMention={MENTION_IA}
        urlTransparence={URL_TRANSPARENCE}
        urlAide={URL_AIDE}
      />
    </main>
  );
}
