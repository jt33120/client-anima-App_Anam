/**
 * Décision testable du gate de quota. Les dépendances sont injectées afin de prouver que les
 * bypass sécurité/premium/première séance n'appellent jamais la RPC et qu'une panne reste fail-open.
 */

export type EtatAdmissionQuota =
  | "bypass"
  | "non_configuree"
  | "reservee"
  | "refusee"
  | "repli";

export interface DecisionAdmissionQuota {
  readonly autorisee: boolean;
  /** Compatibilité `usage_ia` : tour gratuit post-séance éligible, même en repli fail-open. */
  readonly tourAllocationResiduelle: boolean;
  readonly etat: EtatAdmissionQuota;
  readonly erreur?: unknown;
}

export interface ContexteAdmissionQuota {
  readonly horsDetresse: boolean;
  readonly seanceClose: boolean;
}

export interface DependancesAdmissionQuota {
  /** `null` signifie entitlement inconnu : le doute protège l'accès comme un premium. */
  readonly lirePremium: () => Promise<boolean | null>;
  readonly lireLimite: () => number | null;
  readonly reserver: (limite: number) => Promise<boolean>;
}

export async function deciderAdmissionQuota(
  contexte: ContexteAdmissionQuota,
  deps: DependancesAdmissionQuota,
): Promise<DecisionAdmissionQuota> {
  if (!contexte.horsDetresse || !contexte.seanceClose) {
    return { autorisee: true, tourAllocationResiduelle: false, etat: "bypass" };
  }

  const premium = (await deps.lirePremium()) ?? true;
  if (premium) {
    return { autorisee: true, tourAllocationResiduelle: false, etat: "bypass" };
  }

  const limite = deps.lireLimite();
  if (limite === null) {
    return { autorisee: true, tourAllocationResiduelle: true, etat: "non_configuree" };
  }

  try {
    const autorisee = await deps.reserver(limite);
    return {
      autorisee,
      tourAllocationResiduelle: true,
      etat: autorisee ? "reservee" : "refusee",
    };
  } catch (erreur) {
    return { autorisee: true, tourAllocationResiduelle: true, etat: "repli", erreur };
  }
}
