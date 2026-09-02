import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { HoroscopeDuJour } from "@/lib/astro/quotidien";
import { messagesHoroscope } from "@/lib/domain/consigne-horoscope";
import {
  cleDeSignature,
  signatureDuCiel,
  signatureExploitable,
} from "@/lib/domain/signature-ciel";
import { verdictHoroscope } from "@/lib/domain/verdict-horoscope";
import { envoyerSousEgressArt9 } from "./egress-guard";
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
 *     → mémo : le même ciel, le même jour ⇒ le même texte, sans deuxième appel
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
 * ── LE MÉMO EST PAR INSTANCE, ET LE RÉSIDU EST DIT ─────────────────────────────────────────────
 *
 * Même patron que `cielMemoise` (`lib/data/lire-quotidien.ts`) : une `Map` bornée, vidable, sans
 * table ni migration. Deux instances servent donc deux textes différents pour le même ciel, et un
 * rechargement peut faire changer le texte au cours de la journée.
 *
 * ⚠️ C'EST LE RÉSIDU CONNU DE CETTE STORY, et le remède n'est pas d'agrandir le mémo : c'est une
 * table `texte_du_jour` (jour, signature, texte), sans identifiant d'utilisatrice puisque le texte
 * ne dépend de personne. Elle demande une migration, deux inventaires (effacement, export) et leurs
 * gardes SQL, qui ne tournent pas hors CI ; elle est donc une story à elle seule, pas un ajout
 * discret ici.
 */

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

/** `clé de signature → texte accepté`. Jamais de texte refusé : on ne mémorise pas un rebut. */
const memoTexte = new Map<string, string>();

/** Pour les tests, et pour eux seuls — même porte que `viderMemoCiel`. */
export function viderMemoTexteDuJour(): void {
  memoTexte.clear();
}

function retenir(cle: string, texte: string): void {
  memoTexte.set(cle, texte);
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
}

const DEPS_PAR_DEFAUT: DepsTexteDuJour = {
  creerPort: creerAiPort,
  metrer: metrerUsageIa,
};

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

    const cle = cleDeSignature(horoscope.jour, signature);
    const dejaLa = memoTexte.get(cle);
    if (dejaLa !== undefined) return dejaLa;

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
          cleIdempotence: `texte_du_jour:${cle}`,
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
        if (verdict.accepte) retenir(cle, verdict.texte);
        return { bloque: false as const, verdict };
      }),
      DELAI_MAX_MS,
    );

    if (course === "delai") {
      // La page n'attend plus ; la génération, elle, continue et remplira le mémo si elle aboutit.
      console.error("texte du jour : délai dépassé", { delaiMs: DELAI_MAX_MS });
      return null;
    }
    const envoi = course;
    if (envoi.bloque) {
      // La raison n'est pas du contenu : la journaliser rend la différence entre « pas de clé » et
      // « pas de consentement » lisible, sans jamais dire de qui il s'agit (NFR-022).
      console.error("texte du jour : egress bloqué", { raison: envoi.raison });
      return null;
    }

    if (!envoi.verdict.accepte) {
      // Le MOTIF, jamais le texte : un texte refusé pour prédiction est du contenu produit sur une
      // personne, et il n'a rien à faire dans un journal d'exploitation.
      console.error("texte du jour : refusé", { motif: envoi.verdict.motif });
      return null;
    }

    return envoi.verdict.texte;
  } catch (e) {
    console.error("texte du jour : exception", { nom: e instanceof Error ? e.name : "inconnu" });
    return null;
  }
}
