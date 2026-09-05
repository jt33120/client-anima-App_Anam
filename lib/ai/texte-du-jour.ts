import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { HoroscopeDuJour } from "@/lib/astro/quotidien";
import {
  creerDepotTexteDuJour,
  type CleTexteDuJour,
  type DepotTexteDuJour,
  type ProvenanceTexteDuJour,
  type TexteDuJourFige,
} from "@/lib/data/depot-texte-du-jour";
import { texteDuCiel } from "@/lib/domain/cartes-socle";
import { messagesHoroscope } from "@/lib/domain/consigne-horoscope";
import {
  cleDeSignature,
  jourCivilIso,
  signatureCanonique,
  signatureDuCiel,
  signatureExploitable,
} from "@/lib/domain/signature-ciel";
import { verdictHoroscope } from "@/lib/domain/verdict-horoscope";
import { envoyerSousEgressArt9, verifierDroitsArt9 } from "./egress-guard";
import { creerAiPort } from "./fabrique";
import { metrerUsageIa } from "./metrage";
import type { AiPort } from "./port";

/**
 * texte-du-jour.ts — L'ÉCRITURE DU TEXTE DU JOUR PAR LE MODÈLE (retour du 2026-09-02).
 *
 * ── LE CHEMIN, EN ENTIER ───────────────────────────────────────────────────────────────────────
 *
 *   `HoroscopeDuJour` (calculé, 5.4)
 *     → `signatureDuCiel` : ce qui a le droit de sortir, et rien d'autre
 *     → cache partagé : le premier texte servi fait foi jusqu'à son expiration
 *     → `envoyerSousEgressArt9` : ZDR prouvé, consentement vivant, barrière de minorité
 *     → `verdictHoroscope` : refusé s'il prédit, s'il soigne, s'il signe
 *     → mesuré dans `usage_ia`, puis rendu.
 *
 * ── IL NE JETTE JAMAIS, ET C'EST LA PROPRIÉTÉ QUI COMPTE ───────────────────────────────────────
 *
 * `null` veut dire « pas de texte de modèle aujourd'hui », et l'appelant retombe sur le corpus, qui
 * est écrit et relu. Panne réseau, clé absente, consentement retiré, quota, texte refusé : tous ces
 * chemins se ressemblent vus de la page — elle affiche le texte d'avant. C'est le contraire d'une
 * dégradation silencieuse (AD-4) : ce n'est pas une version amoindrie du produit, c'est le produit
 * d'hier, celui qui a été relu.
 *
 * ── POURQUOI `contientArt9: true` ALORS QUE RIEN D'ELLE NE SORT ────────────────────────────────
 *
 * La charge utile ne contient ni prénom, ni date, ni mot d'elle. On pourrait donc déclarer `false`,
 * sauter l'egress et servir tout le monde. On ne le fait pas, pour une raison qui n'est pas de
 * prudence mais de vérité : ce qui sort est DÉRIVÉ de sa naissance, et « à trois signes de ton
 * Soleil natal » restreint sa date de naissance à un douzième d'année. C'est une donnée qui la
 * concerne, elle circule chez un tiers, et le produit n'a qu'un seul régime pour ça.
 *
 * Conséquence assumée : sans consentement art. 9 vivant, pas de texte de modèle. Elle garde le
 * corpus, et ne perd rien de ce qu'elle avait hier.
 *
 * Le cache durable ne porte aucune identité. Sa clé est le tuple canonique documenté par RC-D2 ;
 * la petite Map locale ne sert plus que de cache de lecture dans l'instance courante.
 */

export const VERSION_EDITORIALE_CIEL = "ciel-2026-09-05-v1";

/** Combien de textes le mémo garde. Une journée n'a qu'une poignée de configurations distinctes. */
const MEMO_TAILLE_MAX = 64;

/**
 * LE DÉLAI AU-DELÀ DUQUEL LA PAGE N'ATTEND PLUS.
 *
 * ⚠️ CE N'EST PAS UN RÉGLAGE DE CONFORT. Ce module est appelé depuis `lireBibliotheque`, donc depuis
 * l'ACCUEIL — la page la plus vue du produit, et celle dont le commentaire dit qu'« une panne de
 * socle ne doit fermer ni la conversation ni l'arbre ». Un appel réseau qui pend n'est pas une
 * panne : c'est une page qui ne répond pas, et rien dans `completer()` ne borne son attente. Sur
 * une fonction serverless, l'attente finit par emporter la requête entière.
 *
 * Six secondes : au-delà du temps qu'un texte de trois phrases demande à un modèle léger, et bien
 * en deçà du plafond d'exécution. Une génération qui dépasse rend `null` — donc le corpus — mais
 * elle N'EST PAS ANNULÉE : si elle aboutit, elle remplit le mémo, et la vue suivante l'y trouve.
 */
const DELAI_MAX_MS = 6_000;

/**
 * Une course entre le travail et l'horloge.
 *
 * ⚠️ LA PROMESSE PERDANTE EST TOUJOURS RATTRAPÉE (`catch`). Sans ça, un échec réseau arrivé APRÈS
 * le délai deviendrait un rejet non traité : sur Node, cela n'a plus rien à voir avec l'horoscope,
 * ça met fin au processus.
 */
async function sousDelai<T>(travail: Promise<T>, delaiMs: number): Promise<T | "delai"> {
  travail.catch(() => {});
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const horloge = new Promise<"delai">((resoudre) => {
    minuterie = setTimeout(() => resoudre("delai"), delaiMs);
  });
  try {
    return await Promise.race([travail, horloge]);
  } finally {
    // La minuterie est libérée dans tous les cas : une fonction serverless qui garde un `setTimeout`
    // vivant reste éveillée pour rien, et en test le processus ne rendrait pas la main.
    if (minuterie !== undefined) clearTimeout(minuterie);
  }
}

/** `clé canonique → premier contenu figé`. */
const memoTexte = new Map<string, TexteDuJourFige>();

/** Pour les tests, et pour eux seuls — même porte que `viderMemoCiel`. */
export function viderMemoTexteDuJour(): void {
  memoTexte.clear();
}

function retenir(cle: string, entree: TexteDuJourFige): void {
  memoTexte.set(cle, entree);
  while (memoTexte.size > MEMO_TAILLE_MAX) {
    const plusAncienne = memoTexte.keys().next().value;
    if (plusAncienne === undefined) break;
    memoTexte.delete(plusAncienne);
  }
}

/** Ce que la page injecte en test : le port et le métrage, jamais lus depuis l'environnement. */
export interface DepsTexteDuJour {
  readonly creerPort: () => Promise<AiPort>;
  readonly metrer: (usage: Parameters<typeof metrerUsageIa>[0]) => Promise<void>;
  /** Absent dans les tests unitaires qui n'éprouvent que la génération locale. */
  readonly depot?: DepotTexteDuJour;
}

const DEPS_PAR_DEFAUT: DepsTexteDuJour = {
  creerPort: creerAiPort,
  metrer: metrerUsageIa,
  depot: creerDepotTexteDuJour(),
};

function resultatPour(entree: TexteDuJourFige): string | null {
  return entree.provenance === "modele" ? entree.texte : null;
}

function cleDurable(horoscope: HoroscopeDuJour, signature: ReturnType<typeof signatureDuCiel>): CleTexteDuJour {
  return {
    jour: jourCivilIso(horoscope.jour),
    condensatSignature: createHash("sha256").update(signatureCanonique(signature)).digest("hex"),
    versionEditoriale: VERSION_EDITORIALE_CIEL,
  };
}

function repliCorpus(horoscope: HoroscopeDuJour): string | null {
  const repli = texteDuCiel(horoscope);
  return repli.statut === "ecrit" ? repli.texte : null;
}

/**
 * Le texte du jour écrit par le modèle, ou `null`.
 *
 * ⚠️ NE JAMAIS Y AJOUTER UN PARAMÈTRE POUR « PERSONNALISER UN PEU PLUS ». La signature de
 * `horoscopeDuJour` porte déjà cet avertissement, pour la même raison : le journal, une branche ou
 * un échange n'ont aucun chemin jusqu'ici, et c'est ce qui rend la promesse tenable sans la
 * surveiller. L'identifiant présent ne sert qu'au métrage et aux gardes, jamais à l'écriture.
 */
export async function texteDuJourGenere(
  supabase: SupabaseClient,
  utilisatriceId: string,
  horoscope: HoroscopeDuJour,
  deps: DepsTexteDuJour = DEPS_PAR_DEFAUT,
): Promise<string | null> {
  try {
    const signature = signatureDuCiel(horoscope);
    // Sans distance de Lune ni configuration, il ne resterait que des faits communs à tout le monde :
    // le corpus dit mieux ce jour-là, et il ne coûte rien.
    if (!signatureExploitable(signature)) return null;

    const cle = `${cleDeSignature(horoscope.jour, signature)}|version:${VERSION_EDITORIALE_CIEL}`;
    const durable = cleDurable(horoscope, signature);
    const dejaLa = memoTexte.get(cle);
    if (dejaLa !== undefined) {
      if (dejaLa.provenance === "modele" && (await verifierDroitsArt9(supabase))) return null;
      return resultatPour(dejaLa);
    }

    if (deps.depot) {
      try {
        const partage = await deps.depot.lire(durable);
        if (partage) {
          if (partage.provenance === "modele" && (await verifierDroitsArt9(supabase))) return null;
          retenir(cle, partage);
          return resultatPour(partage);
        }
      } catch (e) {
        console.error("texte du jour : cache illisible", {
          nom: e instanceof Error ? e.name : "inconnu",
        });
      }
    }

    const figer = async (
      texte: string | null,
      provenance: ProvenanceTexteDuJour,
    ): Promise<TexteDuJourFige | null> => {
      if (!texte) return null;
      const candidat: TexteDuJourFige = { ...durable, texte, provenance };
      if (!deps.depot) {
        const premier = memoTexte.get(cle);
        if (premier) return premier;
        retenir(cle, candidat);
        return candidat;
      }
      try {
        const premier = await deps.depot.figer(candidat);
        retenir(cle, premier);
        return premier;
      } catch (e) {
        console.error("texte du jour : cache indisponible", {
          nom: e instanceof Error ? e.name : "inconnu",
        });
        // Sans arbitrage atomique partagé, servir une sortie modèle ferait diverger deux instances
        // pour la même clé. Le corpus est le seul repli globalement déterministe.
        if (provenance === "modele") return null;
        const premier = memoTexte.get(cle) ?? candidat;
        retenir(cle, premier);
        return premier;
      }
    };

    const servirRepli = async () => resultatPour(
      (await figer(repliCorpus(horoscope), "corpus")) ?? {
        ...durable,
        texte: "",
        provenance: "corpus",
      },
    );

    const adaptateur = await deps.creerPort();
    const course = await sousDelai(
      envoyerSousEgressArt9({
        supabase,
        adaptateur,
        requete: {
          capacite: "horoscope",
          messages: [...messagesHoroscope(signature, horoscope.jour)],
          contientArt9: true,
        },
      }).then(async (envoi) => {
        // ⚠️ LE VERDICT ET LE MÉTRAGE VIVENT DANS LA COURSE, pas après elle. Si la génération
        // aboutit hors délai, elle doit quand même être mesurée (les jetons sont dus) et remplir le
        // mémo : c'est ce qui fait que le texte est là au prochain affichage plutôt que jamais.
        if (envoi.bloque) return envoi;
        const verdict = verdictHoroscope(envoi.reponse.texte);
        await deps.metrer({
          utilisatriceId,
          cleIdempotence: `texte_du_jour:${durable.jour}:${durable.condensatSignature}:${durable.versionEditoriale}`,
          operation: "texte_du_jour",
          capacite: "horoscope",
          tier: envoi.reponse.tier,
          modele: envoi.reponse.modele,
          tokensEntree: envoi.reponse.usage.tokensEntree,
          tokensSortie: envoi.reponse.usage.tokensSortie,
          // Hors quota produit : ce n'est pas un tour de conversation, et le texte est le même pour
          // toutes celles qui partagent ce ciel. Le coût fournisseur, lui, reste comptabilisé (FR-043).
          exempteQuota: true,
          comptabiliseFinancierement: true,
          // Non lu : rien ici n'en dépend, et l'inventer serait pire que l'absence.
          premiumAuMomentAppel: null,
        });
        const fige = verdict.accepte ? await figer(verdict.texte, "modele") : null;
        return { bloque: false as const, verdict, fige };
      }),
      DELAI_MAX_MS,
    );

    if (course === "delai") {
      // La page n'attend plus ; la génération, elle, continue et remplira le mémo si elle aboutit.
      console.error("texte du jour : délai dépassé", { delaiMs: DELAI_MAX_MS });
      return servirRepli();
    }
    const envoi = course;
    if (envoi.bloque) {
      // La raison n'est pas du contenu : la journaliser rend la différence entre « pas de clé » et
      // « pas de consentement » lisible, sans jamais dire de qui il s'agit (NFR-022).
      console.error("texte du jour : egress bloqué", { raison: envoi.raison });
      return servirRepli();
    }

    if (!envoi.verdict.accepte) {
      // Le MOTIF, jamais le texte : un texte refusé pour prédiction est du contenu produit sur une
      // personne, et il n'a rien à faire dans un journal d'exploitation.
      console.error("texte du jour : refusé", { motif: envoi.verdict.motif });
      return servirRepli();
    }

    return envoi.fige ? resultatPour(envoi.fige) : null;
  } catch (e) {
    console.error("texte du jour : exception", { nom: e instanceof Error ? e.name : "inconnu" });
    try {
      const signature = signatureDuCiel(horoscope);
      const durable = cleDurable(horoscope, signature);
      const texte = repliCorpus(horoscope);
      if (deps.depot && texte) await deps.depot.figer({ ...durable, texte, provenance: "corpus" });
    } catch {
      // Le cache n'est jamais un nouveau chemin de panne pour l'accueil.
    }
    return null;
  }
}
