import "server-only";
import type { AiPort } from "./port";
import { AdaptateurFactice } from "./adapters/factice";
import { autorisationModeleFaibleTest } from "./modele-faible-test";

/**
 * `creerAiPort()` — choisit l'adaptateur selon l'environnement.
 *
 * `AI_ADAPTER=mistral` → adaptateur Mistral (import dynamique : SDK/clé non requis en dev/CI ; le
 * boot-guard art. 9 s'exécute à la construction, AC3). Sinon → adaptateur factice.
 *
 * **Le repli factice est INTERDIT en production** (AD-4 : « échec dur, jamais de dégradation
 * silencieuse »). Sur une mauvaise config (AI_ADAPTER oublié ou mal orthographié sur Vercel), on
 * échoue haut et fort plutôt que de servir un stub à de vraies utilisatrices — revue 2.1.
 *
 * ══ LE MODÈLE DU TEST PRIVÉ SE RÉSOUT ICI, ET NULLE PART AILLEURS (2026-09-07) ══════════════════
 *
 * Il était résolu par l'APPELANT : la route de conversation le passait, les deux autres
 * consommateurs IA — le texte du jour et la synthèse de l'ordonnanceur — ne le passaient pas. Trois
 * portes, une seule gardée. Sur une clé qui n'ouvre qu'un modèle, cela veut dire : la conversation
 * marche, l'horoscope et la synthèse échouent en silence sur un modèle refusé.
 *
 * ⚠️ CE DÉFAUT NE SE VOYAIT NULLE PART, ET C'EST POURQUOI IL VIT ICI MAINTENANT. `texteDuJourGenere`
 * ne jette jamais et retombe sur le corpus ; la synthèse est un job de nuit. Les deux échouaient
 * proprement, sans rien casser d'observable — la forme de panne la plus chère, parce que personne
 * ne la cherche. Un consommateur IA ajouté demain hérite désormais du bon modèle sans avoir à y
 * penser : c'est la seule façon de tenir « partout le même modèle » sans compter sur la vigilance.
 *
 * L'option explicite reste, et elle GAGNE : les tests doivent pouvoir éprouver les deux régimes
 * sans toucher à `process.env`.
 */
export async function creerAiPort(
  options: { readonly autoriserModeleFaibleTest?: boolean } = {},
): Promise<AiPort> {
  if (process.env.AI_ADAPTER === "mistral") {
    const { AdaptateurMistral } = await import("./adapters/mistral");
    const autoriserModeleFaibleTest =
      options.autoriserModeleFaibleTest ?? autorisationModeleFaibleTest() === "autorisee";
    return new AdaptateurMistral({ autoriserModeleFaibleTest }); // boot-guard art. 9 ici
  }

  const enProduction =
    process.env.VERCEL_ENV === "production" ||
    (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === "production");
  if (enProduction) {
    throw new Error(
      `AI_ADAPTER doit valoir "mistral" en production (repli factice interdit — AD-4). ` +
        `Valeur actuelle : ${process.env.AI_ADAPTER ?? "absente"}.`,
    );
  }

  return new AdaptateurFactice();
}
