import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { commencerLectureNumerologie, lireLectureNumerologie, terminerLectureNumerologie } from "@/lib/data/depot-lecture-numerologie";
import { messagesNumerologie, validerLectureNumerologie } from "@/lib/domain/lecture-numerologie";
import { creerAiPort } from "./fabrique";
import { envoyerSousEgressArt9, verifierDroitsArt9 } from "./egress-guard";
import { metrerUsageIa } from "./metrage";
import { avecDelai } from "@/lib/domain/delai";

export async function genererLectureNumerologie(supabase: SupabaseClient, utilisatriceId: string) {
  const { reservation, numerologie } = await commencerLectureNumerologie(supabase, utilisatriceId);
  if (reservation.statut === "prete") {
    const lecture = await lireLectureNumerologie(supabase, utilisatriceId);
    if (!lecture) throw new Error("numerologie_lecture_perimee");
    return { statut: "prete" as const, lecture };
  }
  if (reservation.statut !== "reservee") return { statut: reservation.statut, reessaiApres: reservation.reessaiApres };
  if (!reservation.jeton) throw new Error("reservation_numerologie_invalide");
  const jeton = reservation.jeton;
  try {
    const adaptateur = await creerAiPort();
    let texte = null;
    // One corrective attempt within the same durable reservation, never an unbounded retry.
    for (let tentative = 0; tentative < 2; tentative++) {
      const messages = messagesNumerologie(numerologie);
      if (tentative) messages[0] = { ...messages[0], content: messages[0].content +
        " Nouvelle proposition : trois chaînes JSON de 60 mots. Présent et conditionnel seulement. Évite toute affirmation certaine. Termine le portrait par : Cette lecture symbolique reste à confronter à ton vécu." };
      const envoi = await envoyerSousEgressArt9({ supabase, adaptateur, requete: {
        capacite: "numerologie", contientArt9: true, messages,
      } });
      if (envoi.bloque) throw new Error("numerologie_droits_retires");
      await avecDelai(metrerUsageIa({
        utilisatriceId, cleIdempotence: `numerologie:${jeton}${tentative ? ":correction" : ""}`, operation: "analyse_numerologie", capacite: "numerologie",
        tier: envoi.reponse.tier, modele: envoi.reponse.modele,
        tokensEntree: envoi.reponse.usage.tokensEntree, tokensSortie: envoi.reponse.usage.tokensSortie,
        premiumAuMomentAppel: null, exempteQuota: true, comptabiliseFinancierement: true,
      }), 2000, "numerologie_metrage_delai").catch(() => {
        console.error("numérologie : métrage indisponible", {code: "numerologie_metrage_indisponible"});
      });
      texte = validerLectureNumerologie(envoi.reponse.texte);
      if (texte) break;
      console.warn("numérologie : réponse à reformuler", {code: "numerologie_texte_refuse", tentative: tentative + 1});
    }
    if (!texte) throw new Error("numerologie_texte_refuse");
    if (await verifierDroitsArt9(supabase)) throw new Error("numerologie_droits_retires");
    await terminerLectureNumerologie(utilisatriceId, jeton, texte);
    const lecture = await lireLectureNumerologie(supabase, utilisatriceId);
    if (!lecture) throw new Error("numerologie_lecture_perimee");
    return { statut: "prete" as const, lecture };
  } catch (erreur) {
    await terminerLectureNumerologie(utilisatriceId, jeton, null).catch(() => undefined);
    throw erreur;
  }
}
