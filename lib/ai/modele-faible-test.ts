import "server-only";

type EnvironnementModeleFaible = {
  readonly ANIMA_MODELE_FAIBLE_TEST?: string;
  readonly ANIMA_INDEXABLE?: string;
  readonly [cle: string]: string | undefined;
};

export type AutorisationModeleFaibleTest = "inactive" | "autorisee";

/**
 * modele-faible-test.ts — LE MODÈLE DU TEST PRIVÉ (2026-09-06, élargi le 2026-09-07).
 *
 * ══ CE QUE CE FICHIER RÉSOUT, ET POURQUOI IL A CHANGÉ DE PORTÉE ═════════════════════════════════
 *
 * La clé Mistral du produit ne donne accès qu'à UN modèle. Mesuré le 2026-09-07 sur la clé de
 * production, trois requêtes réelles :
 *
 *   • `mistral-large-2512`  → HTTP 403, `tier_not_allowed` — l'abonnement ne l'ouvre pas ;
 *   • `mistral-small-2603`  → HTTP 429, `rate_limited`, de façon PERSISTANTE (trois essais) ;
 *   • `ministral-14b-2512`  → HTTP 200.
 *
 * Le 2026-09-06, ce fichier accordait le modèle qui répond au SEUL compte de Julian, par comparaison
 * d'UUID. C'était juste tant qu'il était le seul à ouvrir l'application. Il ne l'est plus : Anima
 * ouvre Anam sur son propre compte et reçoit « Service indisponible, réessaie » — pas une panne, la
 * garde de ce fichier, qui fait exactement ce pour quoi elle avait été écrite.
 *
 * Décision du fondateur du 2026-09-07 : « je veux que tout compte fonctionne sur le même modèle
 * mistral que mon compte, et avant la mise en prod on mettra partout un modèle conforme. »
 *
 * ══ CE QUE ÇA COÛTE, ET QUI DOIT LE SAVOIR ══════════════════════════════════════════════════════
 *
 * ⚠️ LA DÉTECTION DE DÉTRESSE TOURNE DÉSORMAIS SUR CE MODÈLE POUR TOUT LE MONDE. AD-5 et NFR-012
 * disent qu'elle est TOUJOURS au plus capable, en aucune circonstance au léger : c'est la garde qui
 * décide si quelqu'un qui va mal reçoit autre chose qu'une conversation ordinaire. Le tier LOGIQUE
 * reste « fort » — la politique n'a pas bougé — mais le modèle réellement appelé, lui, est le seul
 * que la clé ouvre. Ce n'est pas une dégradation silencieuse : elle est écrite ici, elle est
 * mesurée dans `usage_ia` (le modèle réel y est enregistré), et elle ferme l'indexation.
 *
 * ⚠️ D'OÙ LE VERROU AVEC L'INDEXATION, QUI EST LA VRAIE GARDE DE CE FICHIER. Tant que ce mode vaut
 * « oui », `ANIMA_INDEXABLE=oui` lève. Le produit reste introuvable : on n'est pas publiable, et
 * être trouvé aujourd'hui, ce serait être trouvé par quelqu'un qui cherche de l'aide.
 *
 * ⚠️ CE MODE EST UNE PORTE BLOQUANTE AVANT PUBLICATION. Obtenir un abonnement qui ouvre un modèle
 * fort, retirer `ANIMA_MODELE_FAIBLE_TEST` de Vercel, vérifier un échange complet, ET SEULEMENT
 * APRÈS poser `ANIMA_INDEXABLE=oui`. Voir `PORTES-AVANT-PUBLICATION.md`.
 *
 * ══ POURQUOI L'IDENTIFIANT DU TESTEUR A DISPARU ═════════════════════════════════════════════════
 *
 * `ANIMA_TESTEUR_MODELE_FAIBLE_ID` n'est plus lu. Le garder « au cas où » aurait laissé dans le
 * code une porte à deux régimes — un compte qui parle à un modèle, les autres à un autre — c'est-à-
 * dire exactement le défaut qu'on corrige. Un test privé où seule une personne peut parler n'est
 * pas un test privé. La variable peut être supprimée de Vercel ; elle est inerte.
 */

/**
 * Le modèle du test privé est-il en vigueur ?
 *
 * ⚠️ ELLE NE PREND PLUS D'IDENTIFIANT, ET C'EST LE CŒUR DU CORRECTIF. C'est une propriété du
 * DÉPLOIEMENT, pas de la personne : deux comptes du même déploiement parlent au même modèle, ou le
 * produit ment sur ce qu'il est. Les erreurs restent des codes internes sans contenu utilisatrice,
 * donc sûrs pour les journaux d'exploitation.
 */
export function autorisationModeleFaibleTest(
  env: EnvironnementModeleFaible = process.env,
): AutorisationModeleFaibleTest {
  const drapeau = env.ANIMA_MODELE_FAIBLE_TEST;
  if (drapeau === undefined || drapeau === "") return "inactive";
  // ⚠️ « oui » EXACTEMENT, ET RIEN D'AUTRE. Une valeur approximative (« true », « Oui », « 1 »)
  // retomberait silencieusement sur un modèle que la clé refuse : la conversation s'arrêterait, et
  // la cause serait une faute de frappe invisible dans un panneau Vercel. On lève.
  if (drapeau !== "oui") throw new Error("modele_faible_test_drapeau_invalide");
  if (env.ANIMA_INDEXABLE === "oui") throw new Error("modele_faible_test_public_interdit");
  return "autorisee";
}
