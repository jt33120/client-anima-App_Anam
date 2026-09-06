import "server-only";

type EnvironnementModeleFaible = {
  readonly ANIMA_MODELE_FAIBLE_TEST?: string;
  readonly ANIMA_TESTEUR_MODELE_FAIBLE_ID?: string;
  readonly ANIMA_INDEXABLE?: string;
  readonly [cle: string]: string | undefined;
};

export type AutorisationModeleFaibleTest = "inactive" | "autorisee" | "refusee";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Le modèle faible de test n'est jamais une propriété globale du fournisseur : il est accordé au
 * seul tour authentifié du testeur déclaré. Les erreurs sont des codes internes sans contenu
 * utilisatrice, donc sûrs pour les journaux d'exploitation.
 */
export function autorisationModeleFaibleTest(
  utilisatriceId: string,
  env: EnvironnementModeleFaible = process.env,
): AutorisationModeleFaibleTest {
  const drapeau = env.ANIMA_MODELE_FAIBLE_TEST;
  if (drapeau === undefined || drapeau === "") return "inactive";
  if (drapeau !== "oui") throw new Error("modele_faible_test_drapeau_invalide");
  if (env.ANIMA_INDEXABLE === "oui") throw new Error("modele_faible_test_public_interdit");

  const testeurId = env.ANIMA_TESTEUR_MODELE_FAIBLE_ID?.trim() ?? "";
  if (!UUID.test(testeurId)) throw new Error("modele_faible_test_identifiant_invalide");
  return utilisatriceId.toLowerCase() === testeurId.toLowerCase() ? "autorisee" : "refusee";
}
