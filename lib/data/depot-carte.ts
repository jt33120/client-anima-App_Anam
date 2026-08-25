import "server-only"; // barrière de compilation : jamais côté client (AD-12 / AD-2)
import { createSupabaseAdminClient } from "./supabase/admin";
import { CHAMPS_CARTE, type CarteContexte } from "@/lib/domain/carte-contexte";
import { CARTE_ABSENTE, type CartePersistee, type DepotCarte } from "@/lib/domain/depot-carte";

/**
 * depot-carte.ts — LE DÉPÔT RÉEL DE LA CARTE (0079/0080), patron `depot-seance`.
 *
 * Lit et écrit UNIQUEMENT par les deux RPC possédées, sous `service_role`. La table est fermée à
 * `authenticated` et à `anon` (aucun grant, aucune policy, RLS forcée) : c'est ce qui fait que
 * « la carte ne se montre nulle part » tient aussi contre une requête forgée, et pas seulement
 * contre l'absence d'écran.
 *
 * ⚠️ POURQUOI `service_role` ICI, ALORS QUE `admin.ts` L'INTERDIT SUR DU CONTENU. L'interdit d'AD-12
 * vise le CONTENU APPLICATIF — le verbatim, les branches, tout ce qu'un écran affiche : il doit
 * passer par la RLS, pour qu'un défaut de code ne puisse pas servir la vie de quelqu'un d'autre. La
 * carte n'est servie à aucun écran. Elle est du même ordre que `seance` et `audit_securite` : une
 * trace que le système tient sur le tour et que la cliente n'écrit jamais. Le patron est identique,
 * la surface est nommée, et les deux grants sont comptables.
 *
 * Repli (AD-15), et l'asymétrie est délibérée :
 *   • `charger` en échec → LÈVE. Voir l'encadré du port : un repli silencieux ferait écrire une
 *     carte reconstruite de rien PAR-DESSUS la vraie, au tour suivant, sans que rien ne le dise.
 *   • `ecrire` en échec → no-op journalisé. Le compactage sera refait au prochain franchissement du
 *     seuil ; rien n'est perdu, et surtout rien n'est faussé.
 */

interface LigneCarte {
  presentant: string | null;
  precipitant: string | null;
  predisposant: string | null;
  perpetuant: string | null;
  protecteur: string | null;
  compacte_jusqu_a: string | null;
}

function journaliserIncident(motif: string, detail?: unknown): void {
  const d = detail as { code?: unknown } | undefined;
  const code =
    d && typeof d.code === "string" ? d.code : detail instanceof Error ? detail.name : undefined;
  // NFR-022 : un motif et un code, jamais un extrait — le contenu d'une carte est de l'art. 9.
  console.error("carte: indisponibilité du dépôt — repli sûr (AD-15)", { motif, code });
}

/** Une ligne de base → une carte. PURE, et exportée pour être gardée sans base. */
export function cartePersisteeDepuisLigne(l: LigneCarte): CartePersistee {
  const carte = Object.fromEntries(
    // ⚠️ ON PASSE PAR `CHAMPS_CARTE` PLUTÔT QUE D'ÉNUMÉRER LES CINQ CLÉS À LA MAIN. Un sixième champ
    // ajouté demain au domaine et oublié ici arriverait `undefined` — donc absent de la consigne, et
    // absent SANS ERREUR. La source unique des clés est le domaine ; l'infra ne la recopie pas.
    CHAMPS_CARTE.map((k) => [k, l[k] ?? null]),
  ) as unknown as CarteContexte;
  return { carte, compacteJusquA: l.compacte_jusqu_a ?? null };
}

export function creerDepotCarte(utilisatriceId: string): DepotCarte {
  return {
    async charger() {
      let data: unknown;
      let error: unknown;
      try {
        const admin = createSupabaseAdminClient();
        ({ data, error } = await admin.rpc("charger_carte_contexte", { cible: utilisatriceId }));
      } catch (e) {
        journaliserIncident("charger_carte_exception", e);
        throw e instanceof Error ? e : new Error("charger_carte_exception");
      }
      if (error) {
        journaliserIncident("charger_carte_echoue", error);
        throw new Error("charger_carte_echoue");
      }
      // `setof` → tableau. Vide = AUCUNE carte (premier passage), et non « une carte toute vide ».
      const lignes = data as LigneCarte[] | null;
      if (!lignes || lignes.length === 0) return CARTE_ABSENTE;
      return cartePersisteeDepuisLigne(lignes[0]);
    },

    async ecrire(c: CartePersistee) {
      try {
        const admin = createSupabaseAdminClient();
        const { error } = await admin.rpc("ecrire_carte_contexte", {
          cible: utilisatriceId,
          p_presentant: c.carte.presentant,
          p_precipitant: c.carte.precipitant,
          p_predisposant: c.carte.predisposant,
          p_perpetuant: c.carte.perpetuant,
          p_protecteur: c.carte.protecteur,
          p_compacte_jusqu_a: c.compacteJusquA,
        });
        if (error) journaliserIncident("ecrire_carte_echoue", error);
      } catch (e) {
        journaliserIncident("ecrire_carte_exception", e);
      }
    },
  };
}
