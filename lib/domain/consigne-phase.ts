import type { MessageIa } from "@/lib/ai/port";
import type { BeatArc, Phase } from "./arc-seance";

/**
 * La consigne de PHASE (Story 2.7, T4) — ce qui GATE la génération selon la phase de l'arc. Module
 * PUR (AD-1) : `phase → instruction système`. Injectée serveur (le client ne peut pas forger
 * `system`, `valider-messages`), jamais reçue du client, jamais renvoyée au client.
 *
 * L'invariant d'origine tient toujours : le gate FR-005 (en observer, JAMAIS délivrer d'observation
 * nommée — « une observation prématurée est un défaut, pas une variation »). La VOIX, elle, est
 * ailleurs (2.8) : ce fichier dit QUOI FAIRE, la voix dit COMMENT PARLER.
 *
 * ══ CE QUE CHAQUE PHASE DEMANDE, ET POURQUOI (réécrit le 2026-08-25) ════════════════════════════
 *
 * ⚠️ `construire` VALAIT `null`, ET C'ÉTAIT LE TROU LE PLUS COÛTEUX DU PRODUIT. C'est la phase la
 * plus fréquente — le début de chaque séance, et la totalité d'une première fois. Le modèle y
 * recevait la voix, le contexte, et RIEN sur ce qu'il est censé faire. Retour du 2026-08-25 :
 * « ça fait vraiment juste parler à ChatGPT ». C'était exact, et c'était ici.
 *
 * ── CE QUE LA RECHERCHE DONNE (voir docs/trame-anam.md) ─────────────────────────────────────────
 *
 * Trois résultats portent, et ils ne sont pas des opinions de style :
 *
 *   1. L'ALLIANCE PÈSE ~7 FOIS PLUS QUE LA MÉTHODE. Dans la recherche sur les résultats en
 *      psychothérapie, le lien — et l'accord sur ce qu'on fait ensemble — explique environ sept fois
 *      plus de la variance que le modèle employé, lequel compte pour moins de 1 %. Ce qu'il faut
 *      optimiser n'est donc PAS la finesse des observations d'Anam. C'est l'accueil.
 *
 *   2. L'ORDRE EST UNE CONTRAINTE, PAS UNE SUGGESTION. L'entretien motivationnel pose quatre temps
 *      — engager, focaliser, évoquer, planifier — et dit de l'engagement : « rien d'autre ne peut
 *      arriver tant qu'il n'est pas là ». Chercher un sujet avant d'avoir accueilli produit très
 *      exactement la sensation d'une machine qui traite une demande.
 *
 *   3. NOMMER, EN SOI, AGIT. Mettre un affect en mots diminue la réponse de l'amygdale (Lieberman,
 *      UCLA, 2007). La phase `nommer` n'est donc pas le moment où Anam est intelligente : c'est le
 *      moment où ELLE, l'utilisatrice, met un mot. La nuance décide de qui parle.
 *
 * ── LA QUESTION LA PLUS RENTABLE DE TOUTE LA SÉANCE ─────────────────────────────────────────────
 *
 * « Qu'est-ce qui s'est passé juste avant ? » — le déclencheur. La formulation de cas l'appelle le
 * facteur PRÉCIPITANT, et c'est celui qui explique pourquoi quelqu'un ouvre l'application CE
 * soir-là plutôt qu'un autre. Il est dans `construire`, et nulle part ailleurs : posé trop tard, on
 * a déjà commencé à interpréter sans savoir de quoi.
 *
 * ── CE QUI N'EXISTE PAS, ET QUI NE DOIT PAS EXISTER ─────────────────────────────────────────────
 *
 * Il n'y a AUCUNE phase « proposer ». Des quatre temps de l'entretien motivationnel, planifier est
 * le seul qui soit facultatif, et il ne s'ouvre que lorsque la personne signale qu'elle veut
 * quelque chose. C'est la règle qu'on enfreint le plus volontiers, parce qu'enfreindre donne
 * l'impression d'être utile. Chaque consigne ci-dessous la referme explicitement.
 *
 * ⚠️ AUCUN TERME CLINIQUE ICI. Ce fichier N'EST PAS exclu du contrôle de lexique (revue 4.9, T6-12 :
 * ses quatre exclusions gratuites ont été retirées). Ce qui suit parle la langue du produit, pas
 * celle d'un cabinet — et c'est mieux ainsi : Anam n'imite personne.
 *
 * ⚠️ PROVISOIRE — même porte pré-lancement que le protocole de détresse. La trame emprunte à
 * l'entretien motivationnel et à la formulation de cas : elle doit être relue par un professionnel
 * qualifié avant mise en ligne.
 */
const CONSIGNES: Record<Phase, string | null> = {
  construire:
    "[Consigne de phase — PROVISOIRE] Tu es au DÉBUT. Ton seul travail ici est d’accueillir et de " +
    "comprendre ce qui l’amène. Rien d’autre n’a lieu tant que ça n’est pas fait.\n" +
    "— Accuse réception avant toute question. Un mot d’elle repris suffit.\n" +
    "— Cherche ce qui s’est passé JUSTE AVANT : pourquoi ce soir, pourquoi maintenant. C’est la " +
    "question la plus utile de toute la séance, et c’est le moment de la poser.\n" +
    "— Demande du concret plutôt que du sentiment : « c’était quand ? », « il s’est passé quoi ? ».\n" +
    "— UNE question à la fois. Deux questions dans un tour, c’est un questionnaire.\n" +
    "— Tu ne relies rien, tu n’interprètes rien, tu ne reformules pas encore, et tu ne proposes " +
    "AUCUN geste ni aucune piste — même si tu crois déjà voir. Il est trop tôt, et voir vite se " +
    "paie plus tard.\n" +
    "— Si elle ne dit presque rien, tu restes. Un silence est une réponse ; tu ne le combles pas " +
    "en parlant d’elle à sa place.",
  observer:
    "[Consigne de phase — PROVISOIRE] Tu es en phase d’OBSERVATION : tu reformules et tu relies ce " +
    "que dit l’utilisatrice. NE DÉLIVRE PAS encore d’observation nommée ni d’interprétation " +
    "tranchée — ce serait prématuré. Tu poursuis et tu tisses ; tu ne nommes pas.\n" +
    "— Ce que tu cherches maintenant : ce qui ENTRETIENT la chose aujourd’hui, et ce qui tient " +
    "déjà chez elle. Pas ses causes anciennes, pas un portrait.\n" +
    "— Tu emploies SES mots. Reformuler avec un vocabulaire plus propre lui reprend ce qu’elle " +
    "vient de dire.\n" +
    "— Tes reformulations se soumettent : « j’ai l’impression que… je me trompe ? ». Si elle " +
    "corrige, tu repars de sa version, sans négocier la tienne.\n" +
    "— Toujours aucun geste proposé, aucune piste, aucun conseil. Elle n’a rien demandé.",
  nommer:
    "[Consigne de phase — PROVISOIRE] C’est le moment de NOMMER : délivre une observation juste et " +
    "légèrement inconfortable, ce que la personne est prête à entendre. (La forme complète — " +
    "hypothèse réfutable, brièveté — relève de la voix, Story 2.8.)\n" +
    "— LE MOT QUI COMPTE EST LE SIEN, PAS LE TIEN. Ce qui agit, c’est qu’ELLE mette un mot " +
    "dessus. Tu ouvres la porte, tu ne remplis pas le blanc : « tu appellerais ça comment ? ». Si " +
    "elle propose un mot, c’est celui-là qu’on garde, même s’il est bancal — surtout s’il est " +
    "bancal.\n" +
    "— Tu ne félicites pas, tu ne conclus pas, tu n’enveloppes pas.",
  clore:
    "[Consigne de phase — PROVISOIRE] C’est TOI qui clos la séance, en un seul tour, dans ton registre " +
    "normal — l’utilisatrice n’a jamais à s’extraire (FR-008). Pas de récapitulatif, pas de conclusion " +
    "enveloppante : tu proposes simplement d’en rester là, sans dramatiser. Repère de ton : « on en a " +
    "assez fait pour ce soir ». Le bilan est posé séparément, comme un document — ne le rédige pas ici.",
};

/** Dérive la consigne système de la phase, ou `null` s'il n'y a rien à contraindre (construire). */
export function consignePhaseArc(phase: Phase): MessageIa | null {
  const contenu = CONSIGNES[phase];
  return contenu ? { role: "system", content: contenu } : null;
}

/**
 * LA CONSIGNE DE PHASE DE **CE** TOUR — et la raison pour laquelle ce n'est pas `consignePhaseArc`
 * seule (revue des Epics 1 à 4).
 *
 * ══ LE DÉFAUT ═══════════════════════════════════════════════════════════════════════════════════
 *
 * `clore` est TERMINAL : « aucune transition sortante — l'arc ne rouvre jamais » (AC1). La phase vaut
 * donc `clore` pour toujours, et la route injectait la consigne dérivée de la phase à CHAQUE tour.
 * Une fois la première séance close, Anam recevait l'ordre de clore la séance à tous les tours
 * suivants — un mois plus tard, pour un premier message de la journée, elle répondait « on en a
 * assez fait pour ce soir ».
 *
 * Les tours d'après la première séance existent pourtant : c'est l'allocation résiduelle (3.4). Ce
 * ne sont pas des séances, et rien ne doit y ordonner de clore.
 *
 * ══ LA RÈGLE ════════════════════════════════════════════════════════════════════════════════════
 *
 * La consigne `clore` vaut pour LE tour qui clôt, pas pour tous ceux d'après. Le tour qui clôt est
 * celui qui porte le beat `cloture` — émis UNE seule fois, sur la transition `nommer → clore`. C'est
 * exactement la condition qui décide déjà du bilan : une seule horloge pour « ce tour EST la clôture »
 * (AD-17), au lieu de deux lectures qui finiraient par diverger.
 *
 * `clotureAutorisee` reste la garde de détresse (AD-9) : en détresse, la séance CESSE d'être une
 * séance — aucune consigne de clôture, le protocole prend le relais.
 */
export function consignePhaseDuTour(
  arc: { readonly etat: { readonly phase: Phase }; readonly beat: BeatArc } | null,
  clotureAutorisee: boolean,
): MessageIa | null {
  if (!arc) return null;
  if (arc.etat.phase !== "clore") return consignePhaseArc(arc.etat.phase);
  return arc.beat === "cloture" && clotureAutorisee ? consignePhaseArc("clore") : null;
}

