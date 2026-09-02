import { chercherInterdits } from "./lexique-interdit";
import { chercherPredictions } from "./marqueurs-prediction";

/**
 * verdict-horoscope.ts — LE CONTRÔLE DE CE QUI REVIENT DU MODÈLE.
 *
 * ── UNE CONSIGNE N'EST PAS UNE GARANTIE ────────────────────────────────────────────────────────
 *
 * `consigne-horoscope.ts` demande de décrire sans prédire. Un modèle obéit la plupart du temps, et
 * « la plupart du temps » n'est pas une propriété : la phrase qui passe est celle qui paraît sous le
 * nom du produit, un jour, sans que personne ne la relise.
 *
 * Tous les textes ÉCRITS du produit passent déjà par ces deux gardes, mais en TEST — `chercherInterdits`
 * dans `tests/lexique-voix.test.ts`, `chercherPredictions` dans les gardes de corpus. Un texte
 * fabriqué à l'instant n'a pas de test : le seul moment où on peut le refuser, c'est à l'exécution.
 * Ce fichier applique donc les MÊMES fonctions, au même endroit du produit, mais en ligne.
 *
 * ── REFUSER, PAS RÉPARER ───────────────────────────────────────────────────────────────────────
 *
 * Le verdict ne réécrit rien de ce qui SIGNIFIE. Retirer « tu verras » d'une phrase de prédiction
 * laisse la prédiction et casse la phrase ; on refuse le texte entier et l'appelant retombe sur le
 * corpus, qui est écrit et relu. Un horoscope refusé n'est pas un écran vide : c'est le texte
 * d'avant.
 *
 * Ce qui EST normalisé, en revanche, c'est la TYPOGRAPHIE : apostrophes droites, tirets longs,
 * guillemets d'encadrement, gras de balisage. Ce sont des marques d'atelier, pas du sens, et les
 * refuser jetterait un texte juste pour une apostrophe.
 */

/** Pourquoi un texte a été refusé. Fermé : chaque motif se journalise et se compte. */
export type MotifRefus =
  | "vide"
  | "trop_court"
  | "trop_long"
  | "prediction"
  | "lexique"
  | "signature"
  | "interrogation";

export type VerdictHoroscope =
  | { readonly accepte: true; readonly texte: string }
  | { readonly accepte: false; readonly motif: MotifRefus };

/**
 * Les bornes.
 *
 * Le plancher écarte les réponses tronquées et les refus polis du modèle (« je ne peux pas »), qui
 * font moins de quarante signes. Le plafond laisse passer trois phrases amples sans laisser entrer
 * la dissertation où le conseil finit toujours par apparaître.
 */
export const LONGUEUR_MIN = 40;
export const LONGUEUR_MAX = 900;

/**
 * Ce que le produit ne dit jamais de lui-même (FR-086).
 *
 * Le modèle n'a pas ces noms dans sa consigne, mais il a le nom du produit dans son entraînement dès
 * lors qu'il existe une page publique : un texte signé « Anima » attribuerait à une personne réelle
 * des mots qu'elle n'a pas écrits. C'est le seul refus de ce fichier qui protège quelqu'un.
 */
const NOMS_INTERDITS = /\b(anima|anam)\b/i;

/**
 * La typographie du produit, appliquée sans discuter.
 *
 * ⚠️ LE TIRET LONG EST REMPLACÉ, PAS REFUSÉ. `tests/copie-sans-cadratin.test.ts` le bannit de toute
 * la copie du dépôt depuis le 2026-09-02 ; un modèle, lui, en pose un sur deux textes. Le refuser
 * ferait tomber la moitié des générations pour une marque qui ne veut rien dire.
 */
function normaliserTypographie(brut: string): string {
  return (
    brut
      .trim()
      // Le balisage que le modèle ajoute quand il croit écrire dans un document.
      .replace(/\*\*?/g, "")
      // Les guillemets d'encadrement d'une réponse entière, français comme droits.
      .replace(/^["«»“”\s]+|["«»“”\s]+$/g, "")
      // Tiret long ou demi-cadratin, isolé entre deux espaces : c'est une ponctuation de pause.
      .replace(/\s+[—–]\s+/g, ", ")
      // Le même, collé : il sépare deux mots, une virgule ferait un doublon de ponctuation.
      .replace(/[—–]/g, " ")
      .replace(/'/g, "’")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}

/**
 * Le verdict.
 *
 * ⚠️ L'ORDRE DES CONTRÔLES EST CELUI DU COÛT CROISSANT, et ce n'est pas de l'optimisation : le motif
 * rendu est le PREMIER qui mord, et il est journalisé. Mettre « prediction » avant « vide » ferait
 * remonter des motifs de fond pour des réponses qui n'ont simplement rien produit, et la première
 * lecture des journaux conclurait à un problème de consigne là où il y a une panne de flux.
 */
export function verdictHoroscope(brut: string): VerdictHoroscope {
  const texte = normaliserTypographie(brut);

  if (texte.length === 0) return { accepte: false, motif: "vide" };
  if (texte.length < LONGUEUR_MIN) return { accepte: false, motif: "trop_court" };
  if (texte.length > LONGUEUR_MAX) return { accepte: false, motif: "trop_long" };

  // Une question renvoie la personne à elle-même au moment où elle vient lire : le socle expose,
  // il n'interroge pas. C'est aussi la forme sous laquelle un modèle glisse un conseil sans en
  // avoir l'air (« et si tu regardais ce qui te retient ? »).
  if (texte.includes("?")) return { accepte: false, motif: "interrogation" };

  if (NOMS_INTERDITS.test(texte)) return { accepte: false, motif: "signature" };
  if (chercherPredictions(texte).length > 0) return { accepte: false, motif: "prediction" };
  if (chercherInterdits(texte).length > 0) return { accepte: false, motif: "lexique" };

  return { accepte: true, texte };
}
