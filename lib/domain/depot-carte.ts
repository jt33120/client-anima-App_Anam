import { CARTE_VIDE, type CarteContexte } from "./carte-contexte";

/**
 * depot-carte.ts — LE PORT DE LA CARTE DE CONTEXTE, DÉFINI PAR LE DOMAINE (AD-10).
 *
 * Le domaine reste pur (AD-1) : il déclare le contrat, l'infra l'implémente (`lib/data/depot-carte`,
 * service_role, RPC possédées de la 0080). L'identité est fixée à la CONSTRUCTION du dépôt — patron
 * `creerDepotSeance` — donc aucune méthode ne prend d'identifiant, donc aucun appelant ne peut se
 * tromper de personne en cours de route.
 */

export interface CartePersistee {
  readonly carte: CarteContexte;
  /**
   * Jusqu'où le verbatim a déjà été compacté, en ISO. `null` = rien ne l'a jamais été.
   * C'est ce qui rend le compactage INCRÉMENTAL : on ne relit jamais ce qui a déjà été résumé.
   */
  readonly compacteJusquA: string | null;
}

/** L'état d'un premier passage : aucune carte, aucune borne. Distinct d'une lecture EN PANNE. */
export const CARTE_ABSENTE: CartePersistee = Object.freeze({
  carte: CARTE_VIDE,
  compacteJusquA: null,
});

export interface DepotCarte {
  /**
   * ⚠️ `charger` LÈVE EN CAS DE PANNE, ET CE N'EST PAS UNE NÉGLIGENCE — c'est la leçon écrite dans
   * `depot-seance`, et elle vaut ici encore plus fort.
   *
   * Retomber sur `CARTE_ABSENTE` en cas de panne serait confortable et désastreux : le compactage
   * du même tour écrirait alors une carte reconstruite à partir de RIEN par-dessus une carte
   * existante. Une panne de lecture d'une seconde effacerait des semaines de contexte, en silence,
   * et le tour suivant lirait le résultat comme la vérité.
   *
   * L'appelant décide donc, et les deux décisions sont différentes :
   *   • le TOUR DE CONVERSATION rattrape et se passe de carte (dégradé, rien de perdu) ;
   *   • le COMPACTAGE ne rattrape pas : il ne s'exécute simplement pas.
   */
  charger(): Promise<CartePersistee>;
  /** Persiste la carte compactée (upsert idempotent). Ne décide rien. */
  ecrire(c: CartePersistee): Promise<void>;
}

/**
 * Placeholder PUR pour les tests unitaires (patron `depotSeancePlaceholder`) : honnête — il ne
 * persiste rien et le dit, plutôt que de simuler une mémoire qui n'existe pas.
 */
export const depotCartePlaceholder: DepotCarte = {
  async charger() {
    return CARTE_ABSENTE;
  },
  async ecrire() {
    /* aucune persistance côté placeholder */
  },
};
