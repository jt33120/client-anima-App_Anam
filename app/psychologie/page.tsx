import { redirect } from "next/navigation";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { lireEnneagramme, lireTentativeEnneagramme } from "@/lib/data/lire-enneagramme";
import { lireBigFive, lireTentativeBigFive } from "@/lib/data/lire-big-five";
import { lireHumanDesign } from "@/lib/data/lire-human-design";
import { manqueLHeurePourHumanDesign } from "@/lib/astro/human-design";
import {
  BIG_FIVE_ABSENT,
  BIG_FIVE_ACTION,
  BIG_FIVE_CONNU,
  BIG_FIVE_EN_COURS,
  BIG_FIVE_INDISPONIBLE,
  BIG_FIVE_REPRENDRE,
  BIG_FIVE_TITRE,
  BIG_FIVE_VOIR,
  ENNEAGRAMME_ABSENT,
  ENNEAGRAMME_ACTION,
  ENNEAGRAMME_EN_COURS,
  ENNEAGRAMME_INDISPONIBLE,
  ENNEAGRAMME_REPRENDRE,
  ENNEAGRAMME_TITRE,
  ENNEAGRAMME_VOIR,
  HUMAN_DESIGN_ACTION,
  HUMAN_DESIGN_CORPS,
  HUMAN_DESIGN_SANS_HEURE,
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
import PsychologieHub, { type ModuleVue } from "@/render/psychologie/PsychologieHub";
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

  // ⚠️ QUATRE LECTURES EN PARALLÈLE, ET QUATRE PANNES INDÉPENDANTES. Aucune ne dépend des autres :
  // les enchaîner coûterait trois allers-retours au lieu d'un, et une panne de l'une masquerait les
  // trois autres. Chacune rend son propre état, et chaque vignette dit le sien.
  const [type, resultatBigFive, dessin] = await Promise.all([
    lireEnneagramme(supabase, auth.user.id).catch(
      () => ({ statut: "indisponible" as const, raison: "lecture_impossible" as const }),
    ),
    lireBigFive(supabase, auth.user.id).catch(
      () => ({ statut: "indisponible" as const, raison: "lecture_impossible" as const }),
    ),
    lireHumanDesign(supabase, auth.user.id).catch(
      () => ({ statut: "indisponible" as const, raison: "lecture_impossible" as const }),
    ),
  ]);

  // ── L'ENNÉAGRAMME ────────────────────────────────────────────────────────────────────────────
  let enneagramme: ModuleVue;
  const socleEnneagramme = {
    cle: "enneagramme",
    titre: ENNEAGRAMME_TITRE,
    glyphe: "✦",
    etiquette: "Disponible",
    actif: true,
  } as const;
  if (type.statut === "calcule") {
    enneagramme = {
      ...socleEnneagramme,
      corps: `Ton résultat retenu est le type ${type.type}.`,
      porte: { libelle: ENNEAGRAMME_VOIR, href: "/enneagramme" },
    };
  } else if (type.raison === "sans_type") {
    // Une passe en cours n'est pas un type : la distinction vient de 0049, qui sépare les tables
    // pour cette raison exacte. Deux lectures, deux phrases, deux portes différentes.
    const tentative = await lireTentativeEnneagramme(supabase, auth.user.id).catch(
      () => ({ statut: "indisponible" as const, raison: "lecture_impossible" as const }),
    );
    enneagramme =
      tentative.statut === "calcule"
        ? { ...socleEnneagramme, corps: ENNEAGRAMME_EN_COURS, porte: { libelle: ENNEAGRAMME_REPRENDRE, href: "/enneagramme" } }
        : tentative.raison === "aucune"
          ? { ...socleEnneagramme, corps: ENNEAGRAMME_ABSENT, porte: { libelle: ENNEAGRAMME_ACTION, href: "/enneagramme" } }
          : { ...socleEnneagramme, corps: ENNEAGRAMME_INDISPONIBLE, porte: null };
  } else {
    enneagramme = { ...socleEnneagramme, corps: ENNEAGRAMME_INDISPONIBLE, porte: null };
  }

  // ── LE BIG FIVE ──────────────────────────────────────────────────────────────────────────────
  let bigFive: ModuleVue;
  const socleBigFive = {
    cle: "big-five",
    titre: BIG_FIVE_TITRE,
    glyphe: "✧",
    etiquette: "Disponible",
    actif: true,
  } as const;
  if (resultatBigFive.statut === "calcule") {
    bigFive = { ...socleBigFive, corps: BIG_FIVE_CONNU, porte: { libelle: BIG_FIVE_VOIR, href: "/big-five" } };
  } else if (resultatBigFive.raison === "sans_resultat") {
    const tentative = await lireTentativeBigFive(supabase, auth.user.id).catch(
      () => ({ statut: "indisponible" as const, raison: "lecture_impossible" as const }),
    );
    bigFive =
      tentative.statut === "calcule"
        ? { ...socleBigFive, corps: BIG_FIVE_EN_COURS, porte: { libelle: BIG_FIVE_REPRENDRE, href: "/big-five" } }
        : tentative.raison === "aucune"
          ? { ...socleBigFive, corps: BIG_FIVE_ABSENT, porte: { libelle: BIG_FIVE_ACTION, href: "/big-five" } }
          : { ...socleBigFive, corps: BIG_FIVE_INDISPONIBLE, porte: null };
  } else {
    bigFive = { ...socleBigFive, corps: BIG_FIVE_INDISPONIBLE, porte: null };
  }

  // ── LE HUMAN DESIGN ──────────────────────────────────────────────────────────────────────────
  //
  // ⚠️ LA PORTE RESTE OUVERTE MÊME SANS L'HEURE, et c'est délibéré : la halte elle-même explique ce
  // qui manque et propose `/heure-naissance`. La refermer ici obligerait à écrire deux fois la même
  // explication, et la vignette finirait par diverger de la page.
  const humanDesign: ModuleVue = {
    cle: "human-design",
    titre: HUMAN_DESIGN_TITRE,
    glyphe: "◇",
    etiquette: "Disponible",
    actif: true,
    corps: manqueLHeurePourHumanDesign(dessin) ? HUMAN_DESIGN_SANS_HEURE : HUMAN_DESIGN_CORPS,
    porte: { libelle: HUMAN_DESIGN_ACTION, href: "/human-design" },
  };

  return (
    <main className={s.halte}>
      <RetourScene url={urlRetourScene(await searchParams)} />
      <h1 className={`t-titre ${s.titre}`}>{PSYCHOLOGIE_TITRE}</h1>
      <PsychologieHub
        introduction={PSYCHOLOGIE_INTRO}
        modules={[enneagramme, bigFive, humanDesign]}
        methode={{ titre: METHODE_TITRE, corps: METHODE_CORPS }}
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
