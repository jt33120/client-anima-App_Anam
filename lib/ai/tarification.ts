import "server-only";

/**
 * Catalogue de prix fournisseur figé au 2026-08-26.
 *
 * Source primaire : pages modèles/prix Mistral (`docs.mistral.ai`). Les identifiants sont datés,
 * comme dans `politique-tier.ts`; un changement de prix exige donc une nouvelle version explicite
 * de catalogue. Le calcul utilise des nano-USD ENTIERS par token : aucun flottant JavaScript ne
 * participe au montant envoyé à Postgres `numeric`.
 */

export const TARIF_VERSION_MISTRAL = "mistral-public-2026-08-26";
const NANO_USD_PAR_USD = 1_000_000_000n;

interface LigneTarif {
  readonly version: string;
  readonly nanoUsdEntreeParToken: bigint;
  readonly nanoUsdSortieParToken: bigint;
}

// `Map` est volontaire : un objet ordinaire hériterait de `constructor`, `toString` et `__proto__`,
// qui feraient passer un identifiant de modèle inconnu pour une ligne tarifaire existante.
const TARIFS = new Map<string, LigneTarif>([
  ["mistral-small-2603", {
    version: TARIF_VERSION_MISTRAL,
    nanoUsdEntreeParToken: 150n,
    nanoUsdSortieParToken: 600n,
  }],
  ["mistral-large-2512", {
    version: TARIF_VERSION_MISTRAL,
    nanoUsdEntreeParToken: 500n,
    nanoUsdSortieParToken: 1_500n,
  }],
  // Adaptateur in-process de test : tarif connu et exactement nul, sans prétendre à un appel facturé.
  ["factice", {
    version: "factice-v1",
    nanoUsdEntreeParToken: 0n,
    nanoUsdSortieParToken: 0n,
  }],
]);

export interface TarificationUsageIa {
  readonly tarifVersion: string;
  readonly tarifConnu: boolean;
  readonly devise: "USD";
  readonly uniteUsage: "token";
  readonly prixEntreeUsdParMillion: string | null;
  readonly prixSortieUsdParMillion: string | null;
  readonly coutUsd: string | null;
}

function tokensEntiersNonNegatifs(valeur: number, nom: string): bigint {
  if (!Number.isSafeInteger(valeur) || valeur < 0) {
    throw new RangeError(`${nom} doit être un entier sûr positif ou nul.`);
  }
  return BigInt(valeur);
}

/** Sérialise un entier nano-USD en décimal exact, directement acceptable par Postgres `numeric`. */
function nanoUsdVersDecimal(nanoUsd: bigint): string {
  const dollars = nanoUsd / NANO_USD_PAR_USD;
  const fraction = (nanoUsd % NANO_USD_PAR_USD).toString().padStart(9, "0");
  return `${dollars}.${fraction}`;
}

/** Le prix par million est dérivé du MÊME entier que le coût : aucune deuxième source à synchroniser. */
function nanoUsdParTokenVersPrixParMillion(nanoUsdParToken: bigint): string {
  const milliUsd = nanoUsdParToken; // 1 nano-USD/token = 0,001 USD/million de tokens.
  const dollars = milliUsd / 1_000n;
  const fraction = ((milliUsd % 1_000n) * 100_000n).toString().padStart(8, "0");
  return `${dollars}.${fraction}`;
}

/**
 * Calcule le coût exact de l'appel. Un modèle inconnu reste visible mais non tarifé : `null` est
 * honnête, contrairement à `0` qui signifierait à tort que le fournisseur l'a offert.
 */
export function tariferUsageIa(
  modele: string,
  tokensEntree: number,
  tokensSortie: number,
): TarificationUsageIa {
  const entree = tokensEntiersNonNegatifs(tokensEntree, "tokensEntree");
  const sortie = tokensEntiersNonNegatifs(tokensSortie, "tokensSortie");
  const tarif = TARIFS.get(modele);
  if (!tarif) {
    return {
      // Même inconnu, le modèle est évalué contre une version explicite du catalogue : l'absence
      // devient reproductible au lieu d'être un libellé intemporel impossible à auditer.
      tarifVersion: `inconnu:${TARIF_VERSION_MISTRAL}`,
      tarifConnu: false,
      devise: "USD",
      uniteUsage: "token",
      prixEntreeUsdParMillion: null,
      prixSortieUsdParMillion: null,
      coutUsd: null,
    };
  }

  const coutNanoUsd =
    entree * tarif.nanoUsdEntreeParToken + sortie * tarif.nanoUsdSortieParToken;
  return {
    tarifVersion: tarif.version,
    tarifConnu: true,
    devise: "USD",
    uniteUsage: "token",
    prixEntreeUsdParMillion: nanoUsdParTokenVersPrixParMillion(tarif.nanoUsdEntreeParToken),
    prixSortieUsdParMillion: nanoUsdParTokenVersPrixParMillion(tarif.nanoUsdSortieParToken),
    coutUsd: nanoUsdVersDecimal(coutNanoUsd),
  };
}
