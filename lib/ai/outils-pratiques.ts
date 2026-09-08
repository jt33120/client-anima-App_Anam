import "server-only";
import { PRATIQUES, pratiqueParId, type Pratique } from "@/lib/domain/pratiques";
import type { AppelOutilIa, MessageIa, OutilIa } from "./port";

/** A recommendation grants no write access: launch, answers and sharing remain user actions. */
export const OUTIL_PROPOSER_PRATIQUE: OutilIa = {
  nom: "proposer_pratique",
  description: "Afficher une proposition facultative d’exercice ou de questionnaire du catalogue Anam. Ne lance rien, ne remplit aucun questionnaire et ne modifie ni le suivi ni l’arbre.",
  parametres: {
    type: "object",
    properties: { pratiqueId: { type: "string", enum: PRATIQUES.map((pratique) => pratique.id) } },
    required: ["pratiqueId"],
    additionalProperties: false,
  },
};

export function consignePratiques(): MessageIa {
  return {
    role: "system",
    content: [
      "Tu peux proposer une pratique guidée de l’app grâce à proposer_pratique quand la demande ou le moment s’y prête. Réponds d’abord à ce qui est confié ; ne transforme pas chaque échange en exercice.",
      "Au plus UNE proposition par tour, facultative. Choisis selon l’intention et le temps disponible. Si une proposition vient d’être faite, ne la répète pas sans demande. Un refus ou une envie de simplement parler prime.",
      "Utilise uniquement proposer_pratique pour afficher une carte de pratique : pas de lien inventé, de JSON ni de nom technique dans tes paroles. Cet outil propose une pratique ; il ne lance pas l’exercice et n’enregistre pas sa réalisation. Ne prétends pas qu’elle a réalisé une pratique sur la seule base de cette proposition. Les outils de parcours suivent leurs propres consignes d’enregistrement.",
      "Il s’agit de bien-être et d’exploration personnelle, sans diagnostic, traitement, promesse de résultat ni score clinique. Le Big Five est un questionnaire de traits ; l’ennéagramme est une grille d’exploration, pas une mesure clinique. Ne déduis pas un trouble, un type ou un niveau de l’arbre.",
      "En cas d’inconfort, invite à arrêter ou à choisir un repère extérieur ; aucune rétention respiratoire ni fermeture des yeux imposée. Les consignes de sécurité et de détresse priment toujours.",
      "Catalogue disponible :",
      ...PRATIQUES.map((pratique) => `${pratique.id} : ${pratique.titre} (${pratique.dureeMinutes} min) : ${pratique.description}`),
    ].join("\n"),
  };
}

/** Native calls are untrusted, even when the provider accepted the JSON schema. */
export function resoudrePratiqueProposee(
  appels: readonly AppelOutilIa[] | undefined,
  autorisee: boolean,
): Pratique | null {
  if (!autorisee || !appels || appels.length > 4) return null;
  for (const appel of appels) {
    if (appel.nom !== OUTIL_PROPOSER_PRATIQUE.nom) continue;
    let args: unknown = appel.arguments;
    if (typeof args === "string") {
      if (args.length > 4096) continue;
      try { args = JSON.parse(args); } catch { continue; }
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) continue;
    if (Object.keys(args).length !== 1 || !Object.hasOwn(args, "pratiqueId")) continue;
    const pratique = pratiqueParId((args as { pratiqueId: unknown }).pratiqueId);
    if (pratique) return pratique;
  }
  return null;
}
