import type { MessageIa } from "@/lib/ai/port";

/**
 * geste-du-jour.ts — LA SEULE CHOSE À FAIRE, AUJOURD'HUI (retour du 2026-08-23).
 *
 * ══ CE QUI A ÉTÉ DEMANDÉ, ET LES DEUX CONTRAINTES QUI L'ENCADRENT ═══════════════════════════════
 *
 * « Accueil : chose quotidienne avec tâche. » L'accueil ne portait que des cartes à LIRE — un
 * mantra, un ciel, des nombres. Rien à faire, donc rien qui distingue aujourd'hui d'hier.
 *
 * Deux contraintes ont été soumises et tranchées :
 *   1. UX-DR-30 bornait la région à SIX objets rendus, et elle en portait exactement six. Le
 *      plafond passe à sept — décision explicite, pas un contournement : la garde est déplacée,
 *      pas retirée.
 *   2. Le texte est produit par le MODÈLE, et non par Anima. C'est la première fois qu'un texte de
 *      modèle paraît hors de la conversation, et ça change trois choses, toutes portées ici :
 *      la mention de l'article 50 est DUE sur cette carte, le contrôle de voix s'y applique, et la
 *      carte se retire pendant une fenêtre de détresse.
 *
 * ══ CE QUE LE GESTE N'A PAS LE DROIT D'ÊTRE ═════════════════════════════════════════════════════
 *
 * ⚠️ NI UNE PRESCRIPTION, NI UNE PRÉDICTION, NI UNE SÉRIE. FR-023 interdit de prédire ; le lexique
 * médical (2.8) interdit de soigner ; FR-057 et FR-031 interdisent la carotte et le compte. Un
 * « geste du jour » est le format qui appelle le plus naturellement les trois — « fais ceci et tu
 * iras mieux », « 3 jours d'affilée ». La consigne les nomme et les refuse une par une, et le
 * contrôle de sortie ramasse ce qui passerait quand même.
 *
 * ⚠️ ET IL NE SE SUIVRA JAMAIS. La case cochée vit dans le navigateur, pas en base : aucune série
 * n'est calculable, aucun rattrapage n'existe, et « tu as manqué hier » est impossible à écrire
 * faute de donnée. Ce n'est pas une politique, c'est une absence de colonne.
 *
 * Module PUR (AD-1) : il compose une consigne et une carte. Il ne lit rien, n'appelle rien.
 */

/** Ce que le modèle a besoin de savoir pour proposer un geste. Rien de plus. */
export interface MatiereGeste {
  readonly prenom: string | null;
  /** « Soleil en Balance »… Déjà mis en mots. Une matière, jamais une explication de la personne. */
  readonly socle: readonly string[];
  /** Les noms des branches vivantes — SES mots. Le geste peut s'y rattacher, jamais les commenter. */
  readonly branches: readonly string[];
}

/**
 * La consigne de génération. Injectée serveur, jamais reçue du client, jamais renvoyée.
 *
 * ⚠️ ELLE PLAFONNE LA LONGUEUR EN CARACTÈRES, pas en phrases. Sur une carte d'accueil, deux
 * phrases peuvent occuper six lignes et écraser la grille ; c'est la place à l'écran qui contraint
 * ici, pas le souffle.
 */
export const GESTE_LONGUEUR_MAX = 190;

export function consigneGeste(m: MatiereGeste): MessageIa[] {
  const contexte: string[] = [];
  if (m.prenom) contexte.push(`Elle s’appelle ${m.prenom}.`);
  if (m.socle.length > 0) contexte.push(`Son socle : ${m.socle.join(", ")}.`);
  if (m.branches.length > 0) {
    contexte.push(`Ce qui porte un nom chez elle : ${m.branches.slice(0, 4).join(", ")}.`);
  }

  return [
    {
      role: "system",
      content: [
        "Tu proposes UN geste à faire aujourd’hui. Un seul, court, concret, faisable en moins de",
        "dix minutes, sans matériel, sans sortir de chez soi si possible. Tu tutoies.",
        "",
        `Deux phrases au maximum, ${GESTE_LONGUEUR_MAX} caractères au maximum. Pas de titre, pas de`,
        "liste, pas de guillemets, pas d’emoji, pas de point d’exclamation.",
        "",
        "INTERDITS, et ce sont des refus du produit, pas des préférences :",
        "— aucune prédiction, aucun « aujourd’hui sera », aucun « tu vas » ;",
        "— aucune promesse d’état (« tu te sentiras mieux », « ça va passer ») : tu n’en sais rien ;",
        "— rien de médical, de thérapeutique ni de diagnostique ;",
        "— aucune série, aucun compte, aucun « comme hier », aucun « continue » ;",
        "— aucune explication de qui elle est par son ciel (« tu es Balance, donc… »).",
        "",
        "Le socle et ses branches sont une MATIÈRE pour choisir le geste, jamais un sujet à commenter.",
        "Tu ne dis pas pourquoi tu proposes ça. Tu proposes.",
        ...(contexte.length > 0 ? ["", ...contexte] : []),
      ].join("\n"),
    },
    { role: "user", content: "Le geste d’aujourd’hui." },
  ];
}

/**
 * Le texte est-il utilisable tel quel ?
 *
 * ⚠️ ON REFUSE PLUTÔT QUE DE COUPER. Une réponse tronquée au milieu d'une phrase, sur une carte qui
 * propose une action, se lit comme une panne — et pire, elle peut inverser le sens (« ne sors pas
 * avant… »). Une carte qui dit honnêtement qu'elle n'a rien aujourd'hui vaut mieux qu'un geste
 * mutilé. C'est la même règle que le corpus non écrit.
 */
export function gesteRecevable(texte: string): boolean {
  const t = texte.trim();
  if (t.length < 12 || t.length > GESTE_LONGUEUR_MAX) return false;
  // Un geste finit par une ponctuation forte : sans elle, le flux a été coupé.
  if (!/[.?…]$/.test(t)) return false;
  // Ni liste, ni titre, ni emphase — la carte n'a pas de place pour une mise en forme.
  if (/[\n•\-–—]\s*\w+\s*:/.test(t) || t.includes("\n")) return false;
  return true;
}
