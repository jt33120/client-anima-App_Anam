import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { HoroscopeDuJour } from "@/lib/astro/quotidien";
import type { ThemeNatal } from "@/lib/astro/theme-natal";
import {
  creerDepotTextePersonnel,
  type CleTextePersonnel,
  type DepotTextePersonnel,
  type ProvenanceTexteDuJour,
  type TextePersonnelFige,
} from "@/lib/data/depot-texte-du-jour-personnel";
import { lireMatiereDuJour } from "@/lib/data/lire-contexte-anam";
import { messagesHoroscope } from "@/lib/domain/consigne-horoscope";
import type { MatiereContexte } from "@/lib/domain/contexte-anam";
import {
  cielDuJourDit,
  jourCivilIso,
  signatureCanonique,
  signatureDuCiel,
  signatureExploitable,
} from "@/lib/domain/signature-ciel";
import {
  signesAutorises,
  socleNatalCanonique,
  socleNatalDit,
} from "@/lib/domain/socle-natal-dit";
import { verdictHoroscope, type EcritureTroisParties } from "@/lib/domain/verdict-horoscope";
import { envoyerSousEgressArt9, verifierDroitsArt9 } from "./egress-guard";
import { creerAiPort } from "./fabrique";
import { metrerUsageIa } from "./metrage";
import type { AiPort } from "./port";

/**
 * texte-du-jour.ts — L'ÉCRITURE DU TEXTE DU JOUR PAR LE MODÈLE (2026-09-02, refondu le 2026-09-07).
 *
 * ── LE CHEMIN, EN ENTIER ───────────────────────────────────────────────────────────────────────
 *
 *   `HoroscopeDuJour` (calculé, 5.4) + `ThemeNatal` (déjà lu par l'appelant)
 *     → `signatureDuCiel` + `socleNatalDit` : ce qui a le droit de sortir, et rien d'autre
 *     → cache PAR PERSONNE : le premier texte servi fait foi jusqu'à son expiration
 *     → `lireMatiereDuJour` : ce qu'Anam sait d'elle, lu SEULEMENT sur un cache froid
 *     → `envoyerSousEgressArt9` : ZDR prouvé, consentement vivant, barrière de minorité
 *     → `verdictHoroscope` : refusé s'il prédit, s'il soigne, s'il signe, s'il invente un signe
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
 * ── CE COMMENTAIRE DISAIT L'INVERSE JUSQU'AU 2026-09-07, ET IL AVAIT RAISON POUR SON PRODUIT ────
 *
 * Il portait cet avertissement, en tête de `texteDuJourGenere` :
 *
 *   « ⚠️ NE JAMAIS Y AJOUTER UN PARAMÈTRE POUR PERSONNALISER UN PEU PLUS. […] le journal, une
 *     branche ou un échange n'ont aucun chemin jusqu'ici, et c'est ce qui rend la promesse tenable
 *     sans la surveiller. »
 *
 * L'argument était bon. Le fondateur a demandé le contraire, explicitement : « un deuxième
 * paragraphe personnalisé avec les fichiers de contexte créés par Anam ». On ne supprime donc pas
 * l'avertissement en silence — on dit ce qui le remplace.
 *
 * Ce qui le remplace n'est pas une promesse plus faible, c'est une promesse DIFFÉRENTE, et elle est
 * tenue par des TYPES plutôt que par une consigne : `SignatureDuCiel` (quatre clés closes),
 * `SocleNatalDit` (trois énumérations et un booléen) et `MatiereContexte` (la même matière, bornée,
 * que la conversation d'Anam envoie déjà depuis le 2026-08-20). Le journal brut, une séance, une
 * synthèse et un verbatim n'ont TOUJOURS aucun chemin jusqu'ici.
 *
 * ── POURQUOI `contientArt9: true`, ET POURQUOI C'EST ENFIN LITTÉRAL ────────────────────────────
 *
 * En 2026-09-02, ce drapeau était vrai alors que rien d'elle ne sortait : on le posait parce que ce
 * qui partait était DÉRIVÉ de sa naissance. Depuis le 2026-09-07, la charge utile contient son
 * prénom, ses signes natals et ce qu'Anam a retenu d'elle. Le régime n'a pas changé ; c'est la
 * réalité qui a rattrapé la précaution.
 *
 * Conséquence assumée, inchangée : sans consentement art. 9 vivant, pas de texte de modèle. Elle
 * garde le corpus, et ne perd rien de ce qu'elle avait hier.
 */

/**
 * ⚠️ LA VERSION SE BUMPE QUAND LA FORME DU TEXTE CHANGE, ET PAS SEULEMENT LE STYLE. Elle entre dans
 * la clé de cache : sans ce bump, les textes en une seule partie écrits avant ce jour seraient relus
 * comme s'ils en portaient trois, et la carte afficherait un `null` là où elle promet un paragraphe.
 */
export const VERSION_EDITORIALE_CIEL = "ciel-2026-09-07-v2";

/** Combien de textes le mémo garde. Une instance sert peu de personnes distinctes par minute. */
const MEMO_TAILLE_MAX = 64;

/**
 * LES DEUX BUDGETS D'ATTENTE, ET CE N'EST PAS UN RÉGLAGE DE CONFORT.
 *
 * Le texte est passé de trois phrases à trois parties, et le tier de « léger » à « fort » : la
 * génération demande maintenant plusieurs secondes là où elle en demandait deux. Les deux surfaces
 * qui l'affichent n'ont pas la même patience, et leur donner le même délai serait faux dans les deux
 * sens.
 *
 *   • LA HALTE (`/socle?univers=astrologie`) est une visite DÉLIBÉRÉE : on y va pour lire son ciel.
 *     Douze secondes y sont acceptables une fois par jour ; le plafond de la plateforme est de trois
 *     cents secondes (`ordonnanceur-budget.ts`), on est loin de le frôler.
 *   • L'ACCUEIL est la page la plus vue du produit, et son commentaire dit qu'« une panne de socle
 *     ne doit fermer ni la conversation ni l'arbre ». Elle attend peu, et ce qu'elle n'obtient pas,
 *     elle le laisse au corpus.
 *
 * ⚠️ LE DÉLAI N'ANNULE PAS LA GÉNÉRATION. La promesse continue, et c'est elle qui écrit dans le
 * cache. Un délai dépassé coûte le corpus AUJOURD'HUI et remplit le cache POUR LA VUE SUIVANTE.
 */
const DELAI_HALTE_MS = 12_000;
const DELAI_ACCUEIL_MS = 6_000;

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

/**
 * `clé → premier contenu figé`.
 *
 * ⚠️ CE MÉMO PORTE DÉSORMAIS DU TEXTE PERSONNEL DANS UN PROCESSUS PARTAGÉ, et c'est une exposition
 * qui n'existait pas avant le 2026-09-07 : un texte de modèle nomme un prénom et une branche. Trois
 * choses la bornent, et aucun test ne les verra — d'où ce paragraphe. Il est cloisonné par
 * l'identifiant DANS LA CLÉ (deux personnes ne peuvent pas se lire l'une l'autre) ; il est borné à
 * `MEMO_TAILLE_MAX` ; il meurt avec l'instance. Il n'est pas un stockage, c'est une mémoire de
 * requête qui survit à la requête.
 */
const memoTexte = new Map<string, TextePersonnelFige>();

/** Pour les tests, et pour eux seuls — même porte que `viderMemoCiel`. */
export function viderMemoTexteDuJour(): void {
  memoTexte.clear();
}

function retenir(cle: string, entree: TextePersonnelFige): void {
  memoTexte.set(cle, entree);
  while (memoTexte.size > MEMO_TAILLE_MAX) {
    const plusAncienne = memoTexte.keys().next().value;
    if (plusAncienne === undefined) break;
    memoTexte.delete(plusAncienne);
  }
}

const condensat = (valeur: string): string =>
  createHash("sha256").update(valeur).digest("hex");

/**
 * La matière personnelle, réduite à une chaîne stable, pour le condensat de diagnostic.
 *
 * ⚠️ ELLE NE SERT NI DE CLÉ DE CACHE, NI DE FILTRE DE LECTURE. Si elle filtrait, le texte serait
 * régénéré — et refacturé — dès qu'une branche est nommée à midi, et il changerait sous ses yeux
 * entre deux affichages du même jour. Elle sert à répondre « sur quoi ce texte a-t-il été écrit ? »
 * quand on relit une ligne, et à ne pas confondre deux appels réels dans le métrage.
 */
function matiereCanonique(contexte: MatiereContexte | null): string {
  if (!contexte) return "sans-contexte";
  return [
    `p:${contexte.prenom ?? "-"}`,
    `t:${contexte.typePressenti ?? "-"}`,
    `b:${contexte.branches.map((b) => `${b.nom}/${b.enPleineLumiere ? "1" : "0"}`).join(",")}`,
    `r:${contexte.retenu.join("|")}`,
  ].join("§");
}

/** Ce que la page injecte en test : le port, le métrage, le dépôt et la lecture de matière. */
export interface DepsTexteDuJour {
  readonly creerPort: () => Promise<AiPort>;
  readonly metrer: (usage: Parameters<typeof metrerUsageIa>[0]) => Promise<void>;
  /** Absent dans les tests unitaires qui n'éprouvent que la génération locale. */
  readonly depot?: DepotTextePersonnel;
  readonly lireContexte?: (
    supabase: SupabaseClient,
    utilisatriceId: string,
    theme: ThemeNatal,
  ) => Promise<MatiereContexte>;
}

const DEPS_PAR_DEFAUT: DepsTexteDuJour = {
  creerPort: creerAiPort,
  metrer: metrerUsageIa,
  depot: creerDepotTextePersonnel(),
  lireContexte: lireMatiereDuJour,
};

function resultatPour(entree: TextePersonnelFige): EcritureTroisParties | null {
  return entree.provenance === "modele" ? entree.parties : null;
}

/**
 * CE QUE L'APPELANT DEMANDE.
 *
 * ⚠️ `theme` EST PASSÉ, JAMAIS RELU ICI. `HoroscopeDuJour` ne porte pas le thème et ne doit pas le
 * porter (aucun champ de texte, aucune longitude : c'est sa garde). Mais le relire coûterait une
 * ÉCRITURE possible — `lireThemeNatal` recalcule au premier appel et après l'ajout d'une heure, soit
 * ~663 lectures d'éphéméride dans le cas dégradé (piège P10). Les deux appelants l'ont déjà lu.
 *
 * ⚠️ `attente` DIT QUELLE SURFACE APPELLE, PAS COMBIEN DE TEMPS ELLE VEUT ATTENDRE. La différence
 * compte : le jour où l'on voudra changer la patience de l'accueil, on la changera ICI, une fois,
 * plutôt que dans deux pages qui auraient divergé.
 */
export interface DemandeTexteDuJour {
  readonly horoscope: HoroscopeDuJour;
  readonly theme: ThemeNatal;
  readonly attente: "halte" | "accueil";
}

/**
 * Le texte du jour écrit par le modèle — trois parties — ou `null`.
 */
export async function texteDuJourGenere(
  supabase: SupabaseClient,
  utilisatriceId: string,
  demande: DemandeTexteDuJour,
  deps: DepsTexteDuJour = DEPS_PAR_DEFAUT,
): Promise<EcritureTroisParties | null> {
  const { horoscope, theme, attente } = demande;
  try {
    const signature = signatureDuCiel(horoscope);
    // Sans distance de Lune ni configuration, il ne resterait que des faits communs à tout le monde :
    // le corpus dit mieux ce jour-là, et il ne coûte rien.
    if (!signatureExploitable(signature)) return null;

    const natal = socleNatalDit(theme);
    const condensatSignature = condensat(
      `${signatureCanonique(signature)}|${socleNatalCanonique(natal)}`,
    );
    const durable: CleTextePersonnel = {
      utilisatriceId,
      jour: jourCivilIso(horoscope.jour),
      versionEditoriale: VERSION_EDITORIALE_CIEL,
    };
    const cle = `${utilisatriceId}|${durable.jour}|${condensatSignature}|${VERSION_EDITORIALE_CIEL}`;

    // ⚠️ ÉCRIRE LE BLOCAGE, PAS UN `&& await`. `verifierDroitsArt9` rend LA RAISON DE BLOCAGE, ou
    // `null` quand tout passe : elle se lit à l'envers d'un `estAutorisee`, et un chemin de plus
    // empilé en `&&` finirait un jour par être lu dans le mauvais sens. Une révocation doit empêcher
    // de RESSERVIR un texte déjà en cache, pas seulement d'en produire un neuf.
    const dejaLa = memoTexte.get(cle);
    if (dejaLa !== undefined) {
      if (dejaLa.provenance === "modele" && (await verifierDroitsArt9(supabase)) !== null) {
        return null;
      }
      return resultatPour(dejaLa);
    }

    if (deps.depot) {
      try {
        const partage = await deps.depot.lire(durable);
        if (partage) {
          if (partage.provenance === "modele" && (await verifierDroitsArt9(supabase)) !== null) {
            return null;
          }
          retenir(cle, partage);
          return resultatPour(partage);
        }
      } catch (e) {
        console.error("texte du jour : cache illisible", {
          nom: e instanceof Error ? e.name : "inconnu",
        });
      }
    }

    // ── À PARTIR D'ICI, ON GÉNÈRE ──────────────────────────────────────────────────────────────
    //
    // ⚠️ LA MATIÈRE EST LUE APRÈS LE CACHE, ET JAMAIS AVANT. Sur un cache chaud — le cas de presque
    // toutes les vues d'une journée — on ne lit RIEN : ni branches, ni faits retenus, ni prénom.
    // Cinq requêtes de base sur le chemin de l'accueil, à chaque affichage, pour un texte déjà écrit,
    // seraient le genre de coût qui ne se voit que sur la facture.
    let contexte: MatiereContexte | null = null;
    if (deps.lireContexte) {
      try {
        contexte = await deps.lireContexte(supabase, utilisatriceId, theme);
      } catch (e) {
        // ⚠️ LE NOM DE L'EXCEPTION, RIEN D'AUTRE. À partir d'ici la charge utile contient un prénom,
        // des branches nommées et des faits retenus : de l'art. 9 en clair. La tentation de
        // journaliser l'invite pour déboguer devient réelle, et elle est interdite (NFR-022). Le
        // vocabulaire autorisé dans les journaux de ce fichier tient en sept mots : `code`, `nom`,
        // `raison`, `motif`, `modele`, `delaiMs`, `partie`. Jamais un texte, jamais un identifiant.
        console.error("texte du jour : contexte illisible", {
          nom: e instanceof Error ? e.name : "inconnu",
        });
      }
    }

    const condensatMatiere = condensat(matiereCanonique(contexte));

    const figer = async (
      parties: EcritureTroisParties | null,
      provenance: ProvenanceTexteDuJour,
    ): Promise<TextePersonnelFige | null> => {
      const candidat = {
        ...durable,
        condensatSignature,
        condensatMatiere,
        parties,
        provenance,
      };
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

    /**
     * LA PIERRE TOMBALE — posée UNIQUEMENT sur un verdict décisif.
     *
     * Elle dit « pour cette personne, ce jour-là, le modèle a eu sa chance et l'a manquée ». Sans
     * elle, un refus reproductible (un mot du lexique que le modèle remet à chaque essai) ferait
     * repartir un appel fournisseur à CHAQUE affichage de la journée.
     */
    const poserLaTombale = async () => {
      await figer(null, "corpus");
      return null;
    };

    const adaptateur = await deps.creerPort();
    // Le ciel du jour part au modèle ET entre dans les signes autorisés : sans le second, la garde
    // refuserait le modèle pour avoir recopié exactement ce qu'on venait de lui dire.
    const duJour = cielDuJourDit(horoscope.ciel);
    const cadre = {
      signesAutorises: signesAutorises(
        natal,
        signature.changements.map((c) => c.vers),
        duJour.map((p) => p.signe),
      ),
      ascendantConnu: natal.ascendant !== null,
    };

    const course = await sousDelai(
      envoyerSousEgressArt9({
        supabase,
        adaptateur,
        requete: {
          capacite: "horoscope",
          messages: [...messagesHoroscope(signature, horoscope.jour, natal, contexte, duJour)],
          contientArt9: true,
        },
      }).then(async (envoi) => {
        // ⚠️ LE VERDICT ET LE MÉTRAGE VIVENT DANS LA COURSE, pas après elle. Si la génération
        // aboutit hors délai, elle doit quand même être mesurée (les jetons sont dus) et remplir le
        // cache : c'est ce qui fait que le texte est là au prochain affichage plutôt que jamais.
        if (envoi.bloque) return envoi;
        const verdict = verdictHoroscope(envoi.reponse.texte, cadre);
        await deps.metrer({
          utilisatriceId,
          // ⚠️ LE CONDENSAT DE MATIÈRE EST DANS LA CLÉ, ET IL EST NEUF. L'unicité est
          // (utilisatrice_id, cle_idempotence) : l'identifiant est déjà l'autre moitié, donc deux
          // personnes ne s'effondrent pas l'une dans l'autre. Ce qui manquerait sans lui, c'est le
          // SECOND appel réel de la même personne — cache non écrit, matière changée — qui serait
          // avalé comme un doublon et jamais facturé.
          cleIdempotence: `texte_du_jour:${durable.jour}:${durable.versionEditoriale}:${condensatMatiere}`,
          operation: "texte_du_jour",
          capacite: "horoscope",
          tier: envoi.reponse.tier,
          modele: envoi.reponse.modele,
          tokensEntree: envoi.reponse.usage.tokensEntree,
          tokensSortie: envoi.reponse.usage.tokensSortie,
          // ⚠️ LA JUSTIFICATION D'HIER EST TOMBÉE, LA DÉCISION TIENT POUR UNE AUTRE RAISON. On
          // exemptait le quota parce que « le texte est le même pour toutes celles qui partagent ce
          // ciel » : c'est faux depuis qu'il porte son Soleil natal et son prénom. Ce qui reste
          // vrai : elle n'a rien demandé. C'est le produit qui décide d'écrire ce texte, et le
          // facturer sur son quota ferait qu'ouvrir son horoscope lui mangerait des messages avec
          // Anam, sans qu'elle le sache. Le coût fournisseur reste comptabilisé (FR-043).
          exempteQuota: true,
          comptabiliseFinancierement: true,
          // Non lu : rien ici n'en dépend, et l'inventer serait pire que l'absence.
          premiumAuMomentAppel: null,
        });
        const fige = verdict.accepte ? await figer(verdict.parties, "modele") : null;
        return { bloque: false as const, verdict, fige };
      }),
      attente === "halte" ? DELAI_HALTE_MS : DELAI_ACCUEIL_MS,
    );

    if (course === "delai") {
      // ══════════════════════════════════════════════════════════════════════════════════════════
      // ⚠️ AUCUNE PIERRE TOMBALE AU DÉLAI, ET C'EST LE CORRECTIF LE PLUS IMPORTANT DE CE FICHIER.
      // ══════════════════════════════════════════════════════════════════════════════════════════
      //
      // Jusqu'au 2026-09-07, le délai appelait un repli qui FIGEAIT le corpus. La génération qui
      // aboutissait ensuite perdait au `on conflict do nothing`, et le corpus tenait quarante-huit
      // heures.
      //
      // Avec un cache PARTAGÉ, c'était supportable : quelqu'un d'autre, ailleurs, gagnait la course
      // et le texte finissait par exister. Avec un cache PAR PERSONNE, personne ne court à sa place.
      // Un modèle plus lent qu'avant — trois parties, tier fort — aurait donc posé la tombale au
      // PREMIER affichage, tous les jours, et elle n'aurait JAMAIS vu son texte. Pas « rarement » :
      // jamais.
      //
      // On rend donc `null` sans rien écrire. La génération est encore en vol et fige elle-même si
      // elle aboutit. Si la fonction est recyclée avant, rien n'est écrit et la visite suivante
      // réessaie : le pire cas est un appel par visite jusqu'à ce qu'une réussisse — strictement
      // meilleur que « jamais », et borné par le mémo tant que l'instance vit.
      console.error("texte du jour : délai dépassé", {
        delaiMs: attente === "halte" ? DELAI_HALTE_MS : DELAI_ACCUEIL_MS,
      });
      return null;
    }

    const envoi = course;
    if (envoi.bloque) {
      // La raison n'est pas du contenu : la journaliser rend la différence entre « pas de clé » et
      // « pas de consentement » lisible, sans jamais dire de qui il s'agit (NFR-022).
      console.error("texte du jour : egress bloqué", { raison: envoi.raison });
      // ⚠️ PAS DE TOMBALE SUR UN BLOCAGE D'EGRESS, ET LA DISTINCTION EST FINE. Un refus de verdict
      // est une décision sur CE texte ; un egress bloqué est un état du COMPTE ou du système — clé
      // absente, consentement retiré, ZDR non prouvé. Figer une tombale y ferait porter à sa journée
      // une panne de configuration, et un consentement redonné dix minutes plus tard ne lui rendrait
      // rien avant deux jours.
      return null;
    }

    if (!envoi.verdict.accepte) {
      // Le MOTIF et la PARTIE, jamais le texte : un texte refusé pour prédiction est du contenu
      // produit sur une personne, et il n'a rien à faire dans un journal d'exploitation. La partie,
      // elle, dira au bout d'une semaine si c'est la structure ou le lexique qui coûte le plus.
      console.error("texte du jour : refusé", {
        motif: envoi.verdict.motif,
        partie: envoi.verdict.partie ?? "-",
      });
      return poserLaTombale();
    }

    return envoi.fige ? resultatPour(envoi.fige) : null;
  } catch (e) {
    console.error("texte du jour : exception", { nom: e instanceof Error ? e.name : "inconnu" });
    return null;
  }
}
