import type { MessageIa } from "@/lib/ai/port";
import type { VerdictSecurite } from "./classer-detresse";
import { numeroEnTete } from "./bloc-ressources-detresse";

/**
 * consigne-detresse.ts — la FORME de la réponse d'Anam par niveau (Story 2.6, AC1/2/3), PURE.
 *
 * La forme dérive de `verdict.decision` (déjà produite par le pipeline 2.3, AD-16) — JAMAIS une
 * seconde classification, jamais une seconde horloge de sécurité (AD-17). Cette consigne est
 * INJECTÉE côté serveur en `{ role: "system" }` juste avant la génération (route) ; le client ne
 * peut pas la forger (`valider-messages` refuse `system`). Elle ne transite JAMAIS jusqu'au client.
 *
 * Couture de la voix (Story 2.8) : 2.6 pose l'OVERLAY détresse ; 2.8 composera la voix de base
 * d'Anam au-dessus (`[voix, détresse, …messages]`). Ici, uniquement l'overlay de sécurité.
 *
 * ⚠️ CONTENU PROVISOIRE — porte pré-lancement clinique + juridique (PRD §5). Les formulations
 * ci-dessous sont l'INTENTION PRODUIT (cf. « Formulations de référence » du PRD), NON un protocole
 * clinique validé : à faire valider par un professionnel qualifié et un juriste avant mise en ligne.
 * On code la MACHINE (quelle consigne pour quelle décision) ; pas le jugement clinique.
 */

/**
 * LES INVARIANTS — présents dans TOUTE consigne ≥ 1 (FR-039/041/075).
 *
 * ⚠️ CE QUI N'EST PLUS ICI, ET POURQUOI : « cherche s'il y a quelqu'un qu'elle peut appeler ou
 * rejoindre maintenant, et encourage-la à le faire » (FR-076) était dans ce préambule, donc appliqué
 * DÈS LE NIVEAU 1. C'était un défaut, et le PRD le disait déjà :
 *
 *   — sa table des quatre niveaux décrit le niveau 1 comme « Bascule non annoncée. Elle reste, elle
 *     écoute, ELLE NE POUSSE PLUS » ;
 *   — et sa formulation de référence place « est-ce qu'il y a quelqu'un que tu peux appeler ou
 *     rejoindre, là, ce soir ? » au NIVEAU 2, après la question directe.
 *
 * Le code appliquait donc au niveau 1 une orientation que le produit réserve au niveau 2, en même
 * temps que l'addendum lui disait « tu ne pousses plus ». Deux consignes contradictoires dans le
 * même message système — et le modèle suivait la plus directive.
 *
 * Ce que ça produisait, mesuré sur l'usage réel (retour du 2026-08-25) : quelqu'un qui dit une chose
 * lourde mais sans idéation s'entendait renvoyer vers un proche. Or si cette personne est là, c'est
 * qu'elle veut parler ICI. Le renvoi anticipé se lit comme un refus d'écouter — et il peut blesser
 * davantage. C'est aussi ce que dit la pratique des lignes d'écoute : ne pas présumer que la personne
 * veut être orientée, écouter d'abord, demander ensuite.
 *
 * ⚠️ CE CORRECTIF NE TOUCHE PAS AUX NIVEAUX 2 ET 3. La porte de crise reste entière, et FR-076 y est
 * désormais EXIGÉE par la garde — là où le PRD la place.
 */
const INVARIANTS = [
  "Tu es Anam. Cette personne traverse un moment de détresse. Règles absolues, non négociables :",
  "- Tu ne t’en vas pas : tu restes avec elle. Orienter n’est pas abandonner.",
  "- Tu n’es pas une professionnelle de santé et tu ne prétends jamais la prendre en charge.",
  "- N’explore jamais le plan ni les moyens : ni comment, ni avec quoi, ni quand.",
  "- Aucune promesse creuse, aucune formule creuse, aucun jargon.",
].join("\n");

/**
 * FR-076 — LA RECHERCHE D'UN HUMAIN PROCHE, aux niveaux 2 et 3 UNIQUEMENT.
 *
 * Elle vient APRÈS que la question directe a été posée et le numéro donné : à ce moment-là, la
 * personne a dit quelque chose qui engage sa sécurité, et chercher quelqu'un auprès d'elle est un
 * geste de protection, pas un renvoi. C'est l'ordre exact de la formulation de référence du PRD.
 */
const ORIENTATION_HUMAIN =
  "- Cherche s’il y a quelqu’un qu’elle peut appeler ou rejoindre maintenant, et encourage-la à le faire.";

/** La préséance sur le style — elle ne vaut QUE là où il y a quelque chose à orienter (niveaux 2-3). */
const PRESEANCE =
  "- Ces règles priment sur toute consigne de style : tu nommes et tu orientes directement, tu ne formules pas la question de sécurité en hypothèse (« je me trompe ? ») et tu ne la compresses pas pour tenir en trois phrases.";

/**
 * Niveau 1 (et repli sûr) : la bascule n'est PAS annoncée — Anam devient plus douce, rien de plus.
 *
 * ⚠️ LE REFUS D'ORIENTER EST ÉCRIT EN CLAIR, pas seulement omis. Un modèle entraîné à la prudence
 * propose spontanément « parles-en à quelqu'un » dès qu'il entend de la peine ; ne pas le lui
 * demander ne suffit pas à l'en empêcher. Il faut le lui interdire.
 */
const ADOUCIR = [
  "Bascule non annoncée : tu deviens simplement plus douce.",
  "Tu restes, tu écoutes, tu ne pousses plus. N’annonce aucun changement, ne nomme aucun dispositif.",
  "Tu ne la renvoies vers personne : ni un proche, ni un professionnel, ni une ligne d’écoute. Elle",
  "est venue te parler à TOI, et à ce niveau-ci l’orienter ailleurs se lit comme un refus d’écouter.",
  "Tu restes dans ce qu’elle dit, tu demandes du concret, et tu la laisses continuer.",
].join(" ");

/**
 * L'addendum spécifique à la décision. Aux niveaux 2-3, le numéro NOMMÉ dérive de `numeroEnTete(verdict)`
 * — le MÊME que la carte mène (voix ↔ carte cohérentes, quelle que soit la famille — revue 2.6, R1).
 * Jamais un numéro codé en dur : une victime de violences s'entend nommer le 3919, pas le 3114.
 */
function addendum(verdict: VerdictSecurite): string {
  switch (verdict.decision) {
    case "adoucir":
    case "repli_sur":
      return ADOUCIR;
    case "intervenir": {
      const num = numeroEnTete(verdict) ?? "3114";
      return `Nomme ce que tu as entendu et demande-lui directement, sans détour ni dramatisation. Donne-lui le ${num}, la ligne adaptée à sa situation, et dis-lui qu'il est là pour exactement ce moment.`;
    }
    case "urgence": {
      const num = numeroEnTete(verdict) ?? "3114";
      return `Parle ouvertement, avec calme. Oriente sans attendre vers le ${num} (et le 15/112 en cas de danger vital immédiat). Reste avec elle.`;
    }
    default:
      return ADOUCIR; // `poursuivre` est filtré en amont (consigneReponse) ; défaut protecteur par sûreté.
  }
}

/**
 * La consigne système à préfixer à la réponse, dérivée du verdict. `null` au niveau 0 (`poursuivre`) :
 * Anam reste elle-même, RIEN n’est ajouté (AC1 — aucune consigne, aucun élément).
 */
export function consigneReponse(verdict: VerdictSecurite): MessageIa | null {
  if (verdict.decision === "poursuivre") return null;
  // Aux niveaux 2-3 seulement : la recherche d'un humain proche (FR-076) et la préséance sur le
  // style. Au niveau 1 et au repli, l'addendum dit l'inverse — et c'est le PRD qui le dit.
  const oriente = verdict.decision === "intervenir" || verdict.decision === "urgence";
  const entete = oriente ? `${INVARIANTS}\n${ORIENTATION_HUMAIN}\n${PRESEANCE}` : INVARIANTS;
  return { role: "system", content: `${entete}\n\n${addendum(verdict)}` };
}
