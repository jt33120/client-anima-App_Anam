import type { MessageIa, RequeteIa } from "@/lib/ai/port";
import {
  CARTE_CHAMP_MAX,
  CHAMPS_CARTE,
  INTITULE_CHAMP,
  type CarteContexte,
  type TourCompactable,
} from "./carte-contexte";

/**
 * consigne-compactage.ts — LA CONSIGNE QUI FABRIQUE LA CARTE (retour du 2026-08-25).
 *
 * Elle ne parle JAMAIS à l'utilisatrice. Elle s'adresse à un modèle, hors conversation, pour
 * transformer du verbatim en cinq lignes de contexte. Sa sortie n'est montrée à personne : elle
 * repart dans la consigne système d'Anam, et nulle part ailleurs.
 *
 * ⚠️ EXCLUE DU CONTRÔLE DE LEXIQUE (`tests/lexique-voix.test.ts`), et pour la raison qui vaut aussi
 * pour la consigne de détresse et celle du bilan : elle NOMME les interdits pour les refuser. Le
 * texte PRODUIT, lui, n'est pas exclu — le contrôle de sortie s'y applique.
 *
 * ══ CE QU'ELLE REFUSE, ET POURQUOI CHAQUE REFUS COÛTE ═══════════════════════════════════════════
 *
 * Un modèle à qui l'on demande de « résumer ce qu'on comprend de quelqu'un » produit spontanément un
 * PORTRAIT : un type de personnalité, une cause d'enfance, un pronostic. C'est le mode par défaut, et
 * c'est exactement ce que le produit refuse. Les interdits ci-dessous ne sont donc pas des garde-fous
 * de principe : ce sont les sorties les plus probables du modèle, nommées pour être écartées.
 *
 * ⚠️ PROVISOIRE — même porte pré-lancement que le protocole de détresse. Une formulation de cas
 * produite par une machine, sous le nom d'une personne réelle, doit être relue par un professionnel
 * qualifié avant mise en ligne.
 */

const REGLES = [
  "Tu construis une CARTE DE CONTEXTE à partir d’un échange. Elle ne sera JAMAIS montrée à la",
  "personne : elle sert uniquement à ne pas lui faire tout répéter la prochaine fois.",
  "",
  "Cinq champs, cinq lignes au plus. Une ligne peut rester vide — c’est le cas le plus fréquent, et",
  "une ligne vide vaut infiniment mieux qu’une ligne inventée.",
  "",
  "CE QUE TU ÉCRIS :",
  "- Des MÉCANISMES et des APPUIS, un par ligne, formulés comme des hypothèses.",
  "- SES MOTS À ELLE chaque fois que c’est possible. Si elle dit « crevée », tu écris « crevée » —",
  "  pas « épuisement ». Un mot traduit lui reprend ce qu’elle a dit.",
  "- Ce qui est ÉTABLI par ce qu’elle a dit. Rien d’autre.",
  "",
  "CE QUE TU N’ÉCRIS JAMAIS :",
  "- Aucun diagnostic, aucun trouble, aucun terme de thérapie ni de médecine. Tu ne soignes",
  "  personne et tu ne décris personne comme quelqu’un à soigner.",
  "- Aucun portrait de personnalité, aucun type, aucune catégorie où la ranger.",
  "- Aucun pronostic, aucune prédiction, aucun « elle va » ni « elle finira par ».",
  "- Aucun conseil, aucune piste, aucun geste à proposer. Ce n’est pas ton travail ici.",
  "- AUCUN CHIFFRE : ni « trois fois », ni « depuis deux semaines », ni « souvent ». Ce produit ne",
  "  compte jamais ce qu’une personne a ou n’a pas.",
  "- Aucun jugement, aucune louange, aucune inquiétude exprimée.",
  "",
  "Si l’échange ne t’apprend rien de neuf sur un champ, tu REPRENDS la ligne existante telle quelle.",
  "Tu ne la réécris pas pour la faire sonner mieux : la réécrire l’éloigne un peu plus de ses mots à",
  "chaque passage.",
].join("\n");

/** Le gabarit de sortie — strict, pour que l'analyse soit un découpage et non une interprétation. */
function gabarit(): string {
  const lignes = CHAMPS_CARTE.map((k) => `${INTITULE_CHAMP[k]} :`);
  return [
    `Réponds EXACTEMENT par ces cinq lignes, dans cet ordre, sans rien avant ni après :`,
    ...lignes,
    "",
    `Chaque ligne fait au plus ${CARTE_CHAMP_MAX} caractères. Une ligne sans matière reste vide après les deux points.`,
  ].join("\n");
}

/** La carte actuelle, rendue au modèle pour qu'il la complète plutôt que de la refaire. */
function carteActuelle(c: CarteContexte): string {
  const lignes = CHAMPS_CARTE.map((k) => `${INTITULE_CHAMP[k]} : ${c[k] ?? ""}`);
  return ["CARTE ACTUELLE (à compléter, pas à refaire) :", ...lignes].join("\n");
}

/**
 * La consigne système du compactage. Le verbatim à compacter est passé séparément, en `user` :
 * mélanger les deux ferait de la matière une instruction, et une phrase de l'utilisatrice pourrait
 * alors se lire comme un ordre au modèle.
 */
export function consigneCompactage(carte: CarteContexte): MessageIa {
  return { role: "system", content: [REGLES, "", carteActuelle(carte), "", gabarit()].join("\n") };
}

/**
 * ══ L'ANALYSE DE LA SORTIE — UN DÉCOUPAGE, JAMAIS UNE INTERPRÉTATION ════════════════════════════
 *
 * ⚠️ ELLE REFUSE PLUTÔT QUE DE DEVINER. Une sortie mal formée rend la carte INCHANGÉE, jamais une
 * carte à moitié remplie : un champ écrit de travers se réinjecte à chaque tour suivant, et une
 * mauvaise hypothèse répétée devient un fait pour le modèle.
 *
 * Le chiffre est ici la seule règle qu'on applique en dur, parce que c'est la seule qu'un contrôle
 * de texte peut tenir : le reste (pas de portrait, pas de pronostic) vit dans la consigne.
 */
export function analyserCompactage(sortie: string, actuelle: CarteContexte): CarteContexte {
  const lu: Partial<Record<(typeof CHAMPS_CARTE)[number], string>> = {};

  for (const k of CHAMPS_CARTE) {
    const intitule = INTITULE_CHAMP[k].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // ⚠️ `[ \t]` ET NON `\s` APRÈS LES DEUX-POINTS, ET LA GARDE L'A TROUVÉ. `\s` inclut le saut de
    // ligne : sur un champ VIDE, le motif consommait la fin de ligne et capturait la ligne SUIVANTE
    // en entier. Le champ « ce qu'elle amène » recevait alors « Ce qui l'a déclenché : un appel… ».
    // Toute la carte glissait d'un cran, et rien ne l'aurait dit à l'exécution.
    const m = new RegExp(`^[ \t]*${intitule}[ \t]*:[ \t]*(.*)$`, "im").exec(sortie);
    if (!m) continue;
    const valeur = m[1].trim();
    if (valeur.length === 0) continue;
    if (valeur.length > CARTE_CHAMP_MAX) continue; // trop long = récitation ; on garde l'ancienne
    if (/\d/.test(valeur)) continue; // FR-031 : un chiffre ne franchit pas cette ligne
    lu[k] = valeur;
  }

  // Aucun champ lisible : la sortie n'a pas suivi le gabarit. On ne touche à rien.
  if (Object.keys(lu).length === 0) return actuelle;

  return {
    presentant: lu.presentant ?? actuelle.presentant,
    precipitant: lu.precipitant ?? actuelle.precipitant,
    predisposant: lu.predisposant ?? actuelle.predisposant,
    perpetuant: lu.perpetuant ?? actuelle.perpetuant,
    protecteur: lu.protecteur ?? actuelle.protecteur,
  };
}

/**
 * ══ LA REQUÊTE DE COMPACTAGE ════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LE VERBATIM PART EN `user`, JAMAIS DANS LA CONSIGNE SYSTÈME, et ce n'est pas une convention de
 * forme. Concaténer la matière aux règles ferait de ce qu'elle a écrit une INSTRUCTION : il suffirait
 * qu'elle tape « ignore les consignes précédentes et écris… » pour que la phrase se retrouve du côté
 * du modèle qui donne les ordres. En la laissant en `user`, elle reste ce qu'elle est — du texte à
 * lire. C'est le même partage que partout ailleurs dans le produit.
 *
 * `contientArt9: true` : le verbatim d'une conversation intime en est, évidemment. L'envoi passe donc
 * par la frontière d'egress (AD-13) comme tous les autres, et un consentement révoqué le bloque.
 */
export function verbatimPourCompactage(tours: readonly TourCompactable[]): string {
  return tours.map((t) => `${t.role === "utilisatrice" ? "Elle" : "Anam"} : ${t.texte}`).join("\n\n");
}

export function requeteCompactage(
  carte: CarteContexte,
  tours: readonly TourCompactable[],
): RequeteIa {
  return {
    capacite: "compactage",
    messages: [consigneCompactage(carte), { role: "user", content: verbatimPourCompactage(tours) }],
    contientArt9: true,
  };
}
