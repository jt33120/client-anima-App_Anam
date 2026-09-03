import { corpus, creneau, lireTexte, type Corpus, type TexteCorpus } from "./port";
import type { Autorite, LignePorte, TypeHumanDesign } from "../astro/human-design";

/**
 * human-design.ts — LE SENS D'UN THÈME DE HUMAN DESIGN (2026-09-03).
 *
 * Neuvième corpus du produit. Il vit ici, et le CALCUL vit dans `lib/astro/human-design.ts` : c'est
 * la séparation écrite dans `lib/corpus/README.md` — « lib/astro → du CALCUL, aucune prose ;
 * lib/corpus → de la PROSE, aucun calcul ». Poser ces textes dans le socle détruirait la garde
 * d'absence qui rend FR-053 structurel.
 *
 * ══ TROIS FAMILLES, DIX-HUIT CRÉNEAUX, ET AUCUN PRODUIT CARTÉSIEN ══════════════════════════════
 *
 *   • LE TYPE — cinq figures. La première chose que le système dit de quelqu'un ;
 *   • L'AUTORITÉ — sept façons de décider ;
 *   • LA LIGNE — six. Le profil en porte DEUX, et c'est là que le croisement était tentant.
 *
 * ⚠️ LES DOUZE PROFILS NE SONT PAS ÉCRITS, ET CE N'EST PAS UN MANQUE. Le profil est un couple de
 * lignes (`4/6`, `1/3`…), et la géométrie n'en autorise que douze : l'arc de design vaut 88°, soit
 * 93,87 lignes, donc la ligne de design tombe deux ou trois crans après celle de personnalité, et
 * jamais ailleurs. Écrire les douze aurait été un produit cartésien sur les mêmes six lignes —
 * exactement ce que la 5.4 a refusé pour les ailes de l'ennéagramme.
 *
 * Et surtout : ces douze-là sont une conséquence de la MÉCANIQUE CÉLESTE, pas une convention. Un
 * corpus qui les énumérerait serait complet tant que le calcul se comporte comme prévu, et JETTERAIT
 * (`lireTexte` refuse une clé non déclarée) le jour où un cas limite produirait un treizième couple.
 * Six créneaux de ligne se composent toujours, quel que soit le couple rendu.
 *
 * ══ CE QUE CES TEXTES DISENT, ET CE QU'ILS NE DISENT PAS ═══════════════════════════════════════
 *
 * Ils décrivent CE QUE LE SYSTÈME DÉCRIT, et le disent ainsi (« le système y lit… »). Ce n'est pas
 * une précaution de style : le Human Design est une construction symbolique, pas un résultat de
 * mesure, et le produit ne le présente jamais autrement. FR-053 tient par-dessus — aucune de ces
 * dix-huit lignes ne parle d'un futur adressé.
 */

/** Les cinq types, dans l'ordre de lecture. Recopiés du socle sous forme de valeurs. */
export const TYPES_HUMAN_DESIGN: readonly TypeHumanDesign[] = Object.freeze([
  "generateur",
  "generateur_manifesteur",
  "manifesteur",
  "projecteur",
  "reflecteur",
]);

/** Les sept autorités, dans l'ordre de PRIORITÉ de `autoriteDuTheme` — pas dans un ordre inventé. */
export const AUTORITES: readonly Autorite[] = Object.freeze([
  "emotionnelle",
  "sacrale",
  "splenique",
  "ego",
  "auto_projetee",
  "mentale",
  "lunaire",
]);

/** Les six lignes. Le profil en porte deux : celle de la personnalité, celle du design. */
export const LIGNES: readonly LignePorte[] = Object.freeze([1, 2, 3, 4, 5, 6]);

/**
 * Les trois fabriques de clés. Elles JETTENT hors domaine, comme `cleEnneagramme` : une clé
 * fabriquée depuis une valeur inconnue n'est pas une absence de texte, c'est un défaut de code.
 */
export function cleType(type: TypeHumanDesign): string {
  if (!TYPES_HUMAN_DESIGN.includes(type)) {
    throw new Error(`corpus human design : type hors domaine (${type})`);
  }
  return `human-design:type:${type}`;
}

export function cleAutorite(autorite: Autorite): string {
  if (!AUTORITES.includes(autorite)) {
    throw new Error(`corpus human design : autorité hors domaine (${autorite})`);
  }
  return `human-design:autorite:${autorite}`;
}

export function cleLigne(ligne: LignePorte): string {
  if (!LIGNES.includes(ligne)) {
    throw new Error(`corpus human design : ligne hors domaine (${ligne})`);
  }
  return `human-design:ligne:${ligne}`;
}

/** Les dix-huit clés, dans l'ordre de lecture. Exportée pour rendre la complétude mesurable. */
export const CLES_HUMAN_DESIGN: readonly string[] = Object.freeze([
  ...TYPES_HUMAN_DESIGN.map((t) => `human-design:type:${t}`),
  ...AUTORITES.map((a) => `human-design:autorite:${a}`),
  ...LIGNES.map((l) => `human-design:ligne:${l}`),
]);

/**
 * ⚠️ LA TABLE SE CONSTRUIT DEPUIS `CLES_HUMAN_DESIGN`. Anima reprend la main en remplaçant une
 * entrée de `textes-de-base.ts` ; elle n'a pas à toucher ce fichier.
 */
export const CORPUS_HUMAN_DESIGN: Corpus = corpus(
  "human-design",
  Object.fromEntries(CLES_HUMAN_DESIGN.map((cle) => [cle, creneau(cle)])),
);

export function texteDuType(type: TypeHumanDesign): TexteCorpus {
  return lireTexte(CORPUS_HUMAN_DESIGN, cleType(type));
}

export function texteDeLAutorite(autorite: Autorite): TexteCorpus {
  return lireTexte(CORPUS_HUMAN_DESIGN, cleAutorite(autorite));
}

export function texteDeLaLigne(ligne: LignePorte): TexteCorpus {
  return lireTexte(CORPUS_HUMAN_DESIGN, cleLigne(ligne));
}
