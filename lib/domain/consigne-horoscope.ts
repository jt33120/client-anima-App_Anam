import type { MessageIa } from "@/lib/ai/port";
import type { Aspect, CibleNatale, JourCivil } from "@/lib/astro/quotidien";
import { CORPS_LIBELLE, SIGNE_LIBELLE } from "./cartes-socle";
import type { SignatureDuCiel, TraitDuCiel } from "./signature-ciel";

/**
 * consigne-horoscope.ts — LA CONSIGNE DU TEXTE DU JOUR (retour du fondateur du 2026-09-02).
 *
 * ── POURQUOI CE FICHIER EXISTE ─────────────────────────────────────────────────────────────────
 *
 * « Il manque l'horoscope. » Le calcul, lui, ne manquait pas : la 5.4 lit de vraies éphémérides,
 * trouve les aspects du jour au thème et la distance Lune-Soleil natal. Ce qui manquait, c'est le
 * TEXTE : vingt-sept phrases écrites d'avance, dont une seule s'affiche, sans jamais nommer ce qui
 * se passe aujourd'hui. Trois personnes sur quatre y lisaient un trait de caractère, pas un jour.
 *
 * La décision du fondateur est explicite : faire écrire ce texte par le modèle, avec une mention
 * visible à côté. Ce fichier est la consigne de cette écriture ; `verdict-horoscope.ts` est le
 * contrôle de ce qui en revient. Les deux vont ensemble : une consigne n'est pas une garantie.
 *
 * ── CE QUE LE MODÈLE REÇOIT, ET CE QU'IL NE REÇOIT PAS ─────────────────────────────────────────
 *
 * Il reçoit une `SignatureDuCiel` mise en mots : des aspects, une distance en signes, des passages
 * de signe. Il ne reçoit AUCUNE date de naissance, aucun prénom, aucun identifiant, aucun verbatim,
 * aucune trace de conversation. Ce n'est pas une consigne de prudence, c'est le type qui le tient
 * (voir `signature-ciel.ts`).
 *
 * ── LA SEULE CHOSE QU'UN MODÈLE FERA SPONTANÉMENT DE TRAVERS ───────────────────────────────────
 *
 * Prédire. « Horoscope » est le nom d'un genre littéraire dont la prédiction EST la grammaire : un
 * modèle à qui l'on demande un horoscope produit du futur adressé par défaut, et FR-053 l'interdit
 * dans tout le socle. La consigne le refuse en nommant ce qu'il faut faire À LA PLACE (décrire une
 * configuration), pas seulement ce qu'il ne faut pas faire.
 *
 * ⚠️ AUCUN CONTRE-EXEMPLE N'EST CITÉ DANS CETTE CONSIGNE, alors que c'est le réflexe pédagogique.
 * Une phrase de futur adressé écrite ici pour être refusée resterait une phrase de futur adressé
 * dans `lib/`, à portée du prochain copier-coller et des balayages qui cherchent ce motif. On décrit
 * l'interdit, on ne l'écrit pas.
 */

/** Le libellé d'un aspect, tel qu'il se dit à quelqu'un. */
const ASPECT_LIBELLE: Readonly<Record<Aspect, string>> = Object.freeze({
  conjonction: "conjonction",
  sextile: "sextile",
  carre: "carré",
  trigone: "trigone",
  opposition: "opposition",
});

/**
 * La cible natale, dite en toutes lettres.
 *
 * « ton Soleil de naissance » plutôt que « soleil » : le modèle doit pouvoir reprendre la formule
 * telle quelle sans avoir à deviner s'il parle du Soleil du jour ou de celui du thème. La confusion
 * des deux est l'erreur la plus fréquente d'un texte astrologique mal écrit.
 */
const CIBLE_LIBELLE: Readonly<Partial<Record<CibleNatale, string>>> = Object.freeze({
  soleil: "ton Soleil de naissance",
  lune: "ta Lune de naissance",
  ascendant: "ton Ascendant",
});

/**
 * ⚠️ PARTIEL, ET AVEC UN REPLI, PARCE QUE `CibleNatale` EST PLUS LARGE QUE `CIBLES_NATALES`.
 *
 * Le type autorise les dix corps ; la constante du domaine n'en retient que trois (Soleil, Lune,
 * Ascendant), et c'est elle qui décide. Une table exhaustive ferait croire que les sept autres sont
 * attendus ici ; un accès non gardé, lui, produirait « undefined à ton undefined » le jour où la
 * 5.4 en ajoute un. Le repli nomme le corps et garde la phrase debout.
 */
function cibleEnMots(cible: CibleNatale): string {
  return CIBLE_LIBELLE[cible] ?? `ton ${nomDeCorps(cible)} de naissance`;
}

/** Le nom d'un corps, avec repli sur la clé : `CORPS_LIBELLE` est partiel par construction. */
function nomDeCorps(corps: string): string {
  return CORPS_LIBELLE[corps as keyof typeof CORPS_LIBELLE] ?? corps;
}

/** Un trait mis en mots : « trigone de Vénus à ton Ascendant ». */
function traitEnMots(trait: TraitDuCiel): string {
  return `${ASPECT_LIBELLE[trait.aspect]} de ${nomDeCorps(trait.corpsTransitant)} à ${cibleEnMots(trait.cible)}`;
}

/**
 * La distance Lune-Soleil natal, mise en mots.
 *
 * Zéro n'est pas « à zéro signe » : c'est « dans le même signe », et c'est le seul cas où la phrase
 * naturelle diffère du gabarit. Un gabarit unique produirait « à 0 signe de ton Soleil », qui se lit
 * comme une panne d'affichage.
 */
function luneEnMots(distance: number): string {
  if (distance === 0) return "la Lune du jour est dans le même signe que ton Soleil de naissance";
  if (distance === 1) return "la Lune du jour est à un signe de ton Soleil de naissance";
  return `la Lune du jour est à ${distance} signes de ton Soleil de naissance`;
}

/** Le jour, en clair, pour que le modèle sache qu'il écrit une date et pas une généralité. */
function jourEnMots(jour: JourCivil): string {
  return `${String(jour.j).padStart(2, "0")}/${String(jour.m).padStart(2, "0")}/${jour.a}`;
}

/**
 * LA CONSIGNE — registre de la voix du produit, pas celui d'un horoscope de magazine.
 *
 * ⚠️ « DEUX OU TROIS PHRASES » EST UNE CONTRAINTE DE FOND, PAS DE MISE EN PAGE. Un texte long doit
 * meubler ; meubler, pour un horoscope, veut dire glisser vers le conseil et la promesse. La
 * brièveté est ce qui rend la règle « décrire seulement » tenable.
 */
export function consigneHoroscope(): MessageIa {
  return {
    role: "system",
    content: [
      "Tu écris le texte du jour d’une application d’astrologie, en français.",
      "On te donne la configuration du ciel, déjà calculée. Ton seul travail est de la mettre en mots.",
      "",
      "Ce que tu fais :",
      "- tu décris une configuration du ciel et ce qu’elle met en tension ou en appui, au présent ;",
      "- tu nommes au moins un des éléments donnés, pour que le texte soit celui de ce jour-là et d’aucun autre ;",
      "- tu tutoies, tu restes sobre, tu écris deux ou trois phrases, cent quarante mots au plus.",
      "",
      "Ce que tu ne fais jamais :",
      "- tu restes au présent : rien de ce qui n’a pas eu lieu, aucun verbe au futur adressé à la personne ;",
      "- tu ne donnes ni conseil, ni consigne, ni encouragement, ni marche à suivre ;",
      "- tu ne promets aucun état, aucune amélioration, aucune réussite ;",
      "- tu n’emploies aucun vocabulaire de santé, de thérapie ni de diagnostic ;",
      "- tu ne te nommes pas, tu ne te décris pas, tu ne signes pas, tu ne t’adresses pas à toi-même ;",
      "- tu ne poses aucune question et tu n’ajoutes ni titre, ni liste, ni guillemets, ni emoji.",
      "",
      "Le ciel forme une configuration ; il n’ordonne rien et ne promet rien. Une tension entre deux forces se décrit ;",
      "ce qu’une personne en fait ne se dit pas.",
      "",
      "Typographie : apostrophes courbes (’), jamais droites. Aucun tiret long. Aucun astérisque.",
      "Réponds par le texte seul, sans introduction.",
    ].join("\n"),
  };
}

/**
 * LES FAITS DU JOUR, tels qu'ils partent au modèle.
 *
 * Exportée à part de `messagesHoroscope` pour que `tests/consigne-horoscope.test.ts` puisse mesurer
 * exactement ce qui sort : la garde de non-fuite porte sur CE texte, et sur lui seul.
 */
export function faitsDuCiel(signature: SignatureDuCiel, jour: JourCivil): string {
  const lignes: string[] = [`Jour : ${jourEnMots(jour)}.`];

  if (signature.luneDistance !== null) {
    lignes.push(`Position relative : ${luneEnMots(signature.luneDistance)}.`);
  }
  if (signature.dominante) {
    lignes.push(`Configuration dominante : ${traitEnMots(signature.dominante)}.`);
  }
  if (signature.secondaires.length > 0) {
    lignes.push(
      `Autres configurations : ${signature.secondaires.map(traitEnMots).join(" ; ")}.`,
    );
  }
  if (signature.changements.length > 0) {
    lignes.push(
      `Passages de signe aujourd’hui : ${signature.changements
        .map((c) => `${nomDeCorps(c.corps)} entre en ${SIGNE_LIBELLE[c.vers]}`)
        .join(" ; ")}.`,
    );
  }
  // Un jour sans configuration dominante EST un vrai jour (5.4) : le dire évite que le modèle
  // invente un aspect pour remplir, ce qu'il fait dès qu'une rubrique attendue manque.
  if (!signature.dominante) {
    lignes.push("Aucun aspect serré aujourd’hui : c’est un jour calme, et cela se dit tel quel.");
  }

  return lignes.join("\n");
}

/** La paire de messages du tour : la consigne, puis les faits. Rien d'autre ne part. */
export function messagesHoroscope(
  signature: SignatureDuCiel,
  jour: JourCivil,
): readonly MessageIa[] {
  return Object.freeze([
    consigneHoroscope(),
    { role: "user" as const, content: faitsDuCiel(signature, jour) },
  ]);
}
