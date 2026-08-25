import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiPort, TierIa } from "@/lib/ai/port";
import { envoyerSousEgressArt9 } from "@/lib/ai/egress-guard";
import {
  doitCompacter,
  tranchePourCompactage,
  type TourCompactable,
} from "@/lib/domain/carte-contexte";
import { analyserCompactage, requeteCompactage } from "@/lib/domain/consigne-compactage";
import type { DepotCarte } from "@/lib/domain/depot-carte";
import { doitExecuterTravailSchema } from "./pipeline";
import { journaliserIncidentSecurite } from "./rpc-repli";
import type { VerdictSecurite } from "./classer-detresse";
import { avecDelai } from "@/lib/domain/delai";

/**
 * compactage-pipeline.ts — L'ÉTAGE QUI FABRIQUE LA CARTE (retour du 2026-08-25).
 *
 * Même posture que les étages reconceptualisation (4.4) et retour sur le thème (4.7), et pour les
 * mêmes raisons : `lib/safety/` orchestre l'I/O (egress + persistance gardée), `lib/domain/` décide
 * (le seuil, la tranche, l'analyse de la sortie) et n'est jamais appelé dans l'autre sens (AD-1).
 *
 * ══ POURQUOI CET ÉTAGE EST DANS `lib/safety/` ALORS QU'IL NE GARDE RIEN ═══════════════════════════
 *
 * Parce qu'il DOIT être supprimé en détresse, exactement comme les deux autres, et que c'est ici que
 * vit cette garde. Résumer « ce qui l'entretient » à partir d'un soir de crise, c'est écrire une
 * hypothèse sur quelqu'un au pire moment de sa vie — et la lui resservir tous les jours ensuite,
 * puisque la carte est re-préfixée à chaque tour. AD-17 supprime le travail de schéma pendant la
 * détresse et 72 h après ; le compactage EST du travail de schéma, même s'il n'en porte pas le nom.
 *
 * ══ QUAND ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ APRÈS QUE LA RÉPONSE EST PARTIE, JAMAIS AVANT. Il tourne dans `after()` : un appel modèle FORT
 * de plus avant de répondre, ce sont deux secondes ajoutées au moment exact où quelqu'un attend une
 * réponse intime. Le compactage n'a jamais rien à montrer ce tour-ci — il prépare le suivant.
 *
 * ⚠️ ET SUR LA LONGUEUR, PAS SUR L'HORLOGE (décision de Julian, 2026-08-25, meilleure que les trois
 * options proposées). Un job quotidien met tout le monde au même rythme et paie pour des gens qui
 * n'ont rien dit. Un seuil de longueur suit l'usage : qui parle beaucoup compacte souvent, qui écrit
 * trois phrases par semaine ne compacte jamais.
 *
 * Repli sûr partout (AD-15) : le compactage ne fait JAMAIS échouer un tour — il tourne hors du flux
 * de réponse, et il vaut toujours mieux une carte d'hier qu'une conversation cassée.
 */

/** Budget de l'appel. Au-delà → aucune écriture : la carte d'hier vaut mieux qu'une carte fausse. */
const DELAI_COMPACTAGE_MS = 12_000;

/** Usage FORT à métrer (produit — FR-043 n'exempte QUE la détresse). */
export interface UsageCompactage {
  tier: TierIa;
  modele: string;
  tokensEntree: number;
  tokensSortie: number;
}

export interface DepsCompactage {
  supabase: SupabaseClient;
  adaptateur: AiPort;
  /** Le dépôt de la carte. ⚠️ Son `charger` LÈVE : voir `lib/domain/depot-carte`. */
  depot: DepotCarte;
  /** Les tours non encore compactés, du plus ancien au plus récent (sous JWT, RLS). */
  lireTours: (depuis: string | null) => Promise<readonly TourCompactable[]>;
  /** `branche_bloquee_par_detresse()` sous JWT. Repli SÛR = `true` (le doute supprime). */
  fenetreDetresseActive: () => Promise<boolean>;
  delaiMs?: number;
}

export interface ResultatCompactage {
  /** AD-17 : la garde de pipeline a supprimé le compactage (aucun appel fort). */
  supprime: boolean;
  /** Le seuil n'était pas franchi : rien à résumer encore. */
  sousLeSeuil: boolean;
  /** La carte a-t-elle été écrite ? */
  ecrite: boolean;
  /** Coût FORT à métrer (`null` si aucun appel). */
  usage: UsageCompactage | null;
}

const RIEN: ResultatCompactage = { supprime: false, sousLeSeuil: true, ecrite: false, usage: null };

export async function compacterSiNecessaire(
  deps: DepsCompactage,
  args: { verdict: VerdictSecurite },
): Promise<ResultatCompactage> {
  // (a) AD-17 — garde de pipeline. Le prédicat PUR d'abord (aucune RPC si le verdict tranche déjà),
  //     la fenêtre ensuite : elle seule couvre les 72 h qui suivent l'extinction d'un épisode.
  if (!doitExecuterTravailSchema(args.verdict) || (await deps.fenetreDetresseActive())) {
    return { supprime: true, sousLeSeuil: false, ecrite: false, usage: null };
  }

  // (b) L'état actuel. ⚠️ ON NE RATTRAPE PAS UNE PANNE DE LECTURE ICI — on laisse lever. Retomber
  //     sur une carte vide ferait écrire, quelques lignes plus bas, une carte reconstruite de rien
  //     PAR-DESSUS la vraie. Une seconde d'indisponibilité effacerait des semaines de contexte.
  const actuelle = await deps.depot.charger();

  // (c) Y a-t-il matière ? Le seuil est le SEUL déclencheur (pas d'horloge, pas de compteur de tours
  //     seul) : un plancher pour ne pas résumer trois phrases, un budget pour ne pas laisser enfler.
  const enAttente = await deps.lireTours(actuelle.compacteJusquA);
  if (!doitCompacter({ longueurs: enAttente.map((t) => t.texte.length) })) return RIEN;

  const tranche = tranchePourCompactage(enAttente);
  if (tranche.tours.length === 0 || tranche.borne === null) return RIEN;

  // (d) L'appel FORT, sous egress art. 9 (AD-13) et sous budget. Un hang n'écrit rien.
  let res;
  try {
    res = await avecDelai(
      envoyerSousEgressArt9({
        supabase: deps.supabase,
        adaptateur: deps.adaptateur,
        requete: requeteCompactage(actuelle.carte, tranche.tours),
      }),
      deps.delaiMs ?? DELAI_COMPACTAGE_MS,
      "compactage_timeout",
    );
  } catch (e) {
    journaliserIncidentSecurite("compactage_egress_exception", e);
    return { supprime: false, sousLeSeuil: false, ecrite: false, usage: null };
  }
  if (res.bloque) return { supprime: false, sousLeSeuil: false, ecrite: false, usage: null };

  const usage: UsageCompactage = {
    tier: res.reponse.tier,
    modele: res.reponse.modele,
    tokensEntree: res.reponse.usage.tokensEntree,
    tokensSortie: res.reponse.usage.tokensSortie,
  };

  // (e) L'analyse est un DÉCOUPAGE, jamais une interprétation : une sortie mal formée rend la carte
  //     INCHANGÉE (voir `analyserCompactage`). Les chiffres et les longueurs sont refusés ici ET par
  //     les deux contraintes de table de la 0079 — c'est la base qui tranche en dernier.
  const compactee = analyserCompactage(res.reponse.texte, actuelle.carte);

  // ⚠️ LA BORNE AVANCE MÊME QUAND LA SORTIE N'A RIEN APPRIS. Sans cela, un modèle qui rend une
  // sortie hors gabarit laisserait la borne en place, le seuil resterait franchi, et le même
  // verbatim repartirait au tour suivant, puis au suivant — un appel FORT à chaque message, pour
  // toujours. La tranche a été LUE : elle est traitée, qu'elle ait produit une ligne ou non.
  await deps.depot.ecrire({ carte: compactee, compacteJusquA: tranche.borne });
  return { supprime: false, sousLeSeuil: false, ecrite: true, usage };
}
