import { redirect } from "next/navigation";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { lireEnneagramme, lireTentativeEnneagramme } from "@/lib/data/lire-enneagramme";
import {
  BIG_FIVE_CORPS,
  BIG_FIVE_TITRE,
  ENNEAGRAMME_ABSENT,
  ENNEAGRAMME_ACTION,
  ENNEAGRAMME_EN_COURS,
  ENNEAGRAMME_INDISPONIBLE,
  ENNEAGRAMME_REPRENDRE,
  ENNEAGRAMME_TITRE,
  ENNEAGRAMME_VOIR,
  HUMAN_DESIGN_CORPS,
  HUMAN_DESIGN_TITRE,
  METHODE_CORPS,
  METHODE_TITRE,
  PSYCHOLOGIE_INTRO,
  PSYCHOLOGIE_TITRE,
} from "@/lib/domain/copie-psychologie";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import { urlRetourScene } from "@/lib/scene/retour-scene";
import RetourScene from "@/render/RetourScene";
import PiedHalte from "@/render/PiedHalte";
import PsychologieHub, { type EtatEnneagrammeVue } from "@/render/psychologie/PsychologieHub";
import s from "@/render/psychologie/psychologie.module.css";

export const metadata = { title: "Anam" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrer");

  const etape = await etapeOnboardingPour(supabase, auth.user.id);
  if (etape === "barre") redirect("/barriere");
  if (etape === "mineur") {
    await supabase.auth.signOut();
    redirect("/entrer?refus=age");
  }
  if (etape === "naissance") redirect("/naissance");
  if (etape === "consentement") redirect("/consentement");
  if (etape === "revoque") redirect("/consentement/revoque");

  const resultat = await lireEnneagramme(supabase, auth.user.id).catch(
    () => ({ statut: "indisponible" as const, raison: "lecture_impossible" as const }),
  );
  let enneagramme: EtatEnneagrammeVue;
  if (resultat.statut === "calcule") {
    enneagramme = { statut: "connu", detail: `Ton résultat retenu est le type ${resultat.type}.` };
  } else if (resultat.raison === "sans_type") {
    const tentative = await lireTentativeEnneagramme(supabase, auth.user.id).catch(
      () => ({ statut: "indisponible" as const, raison: "lecture_impossible" as const }),
    );
    enneagramme =
      tentative.statut === "calcule"
        ? { statut: "en-cours", detail: null }
        : tentative.raison === "aucune"
          ? { statut: "a-faire", detail: null }
          : { statut: "indisponible", detail: null };
  } else {
    enneagramme = { statut: "indisponible", detail: null };
  }

  return (
    <main className={s.halte}>
      <RetourScene url={urlRetourScene(await searchParams)} />
      <h1 className={`t-titre ${s.titre}`}>{PSYCHOLOGIE_TITRE}</h1>
      <PsychologieHub
        enneagramme={enneagramme}
        copie={{
          introduction: PSYCHOLOGIE_INTRO,
          titreEnneagramme: ENNEAGRAMME_TITRE,
          absenceEnneagramme: ENNEAGRAMME_ABSENT,
          enCoursEnneagramme: ENNEAGRAMME_EN_COURS,
          indisponibleEnneagramme: ENNEAGRAMME_INDISPONIBLE,
          actionEnneagramme: ENNEAGRAMME_ACTION,
          reprendreEnneagramme: ENNEAGRAMME_REPRENDRE,
          voirEnneagramme: ENNEAGRAMME_VOIR,
          titreBigFive: BIG_FIVE_TITRE,
          corpsBigFive: BIG_FIVE_CORPS,
          titreHumanDesign: HUMAN_DESIGN_TITRE,
          corpsHumanDesign: HUMAN_DESIGN_CORPS,
          titreMethode: METHODE_TITRE,
          corpsMethode: METHODE_CORPS,
        }}
      />
      <PiedHalte
        mentionIA={piedPour("psychologie").mentionIA}
        texteMention={MENTION_IA}
        urlTransparence={URL_TRANSPARENCE}
        urlAide={URL_AIDE}
      />
    </main>
  );
}
