import type { Numerologie } from "@/lib/astro/numerologie";
import type { MessageIa } from "@/lib/ai/port";
import { chercherInterdits } from "./lexique-interdit";
import { chercherPredictions } from "./marqueurs-prediction";

export const VERSION_LECTURE_NUMEROLOGIE = "1";
export interface TexteLectureNumerologie {
  readonly guidanceAnnee: string;
  readonly visionLongTerme: string;
  readonly portrait: string;
}
export interface LectureNumerologieVue extends TexteLectureNumerologie {
  readonly id: string;
  readonly annee: number;
  readonly note: number | null;
  readonly partageAnam: boolean;
}

export function messagesNumerologie(numerologie: Numerologie): MessageIa[] {
  const nombres = Object.fromEntries(Object.entries(numerologie.nombres).flatMap(([nom, lecture]) =>
    lecture.statut === "calcule" ? [[nom, lecture.valeur]] : [],
  ));
  return [
    { role: "system", content: `Tu écris une lecture de numérologie en français, en tutoyant, avec chaleur et précision. La numérologie est un support symbolique de réflexion, jamais une méthode scientifique pour établir la personnalité ou prédire des événements. Tu n'es pas Anam et ne signes pas son nom.
Réponds exclusivement en JSON avec exactement trois chaînes : guidanceAnnee, visionLongTerme, portrait. 60 à 80 mots par chaîne (40 à 1600 caractères chacune). Écris simplement, sans métaphores longues. Aucun Markdown : ni astérisques, ni soulignements, ni titres. Utilise des virgules ou des points, pas de tirets longs. Préfère des tournures neutres, sans point médian ni parenthèses de genre.
guidanceAnnee : croise le chemin de vie et l'année personnelle de l'année fournie pour proposer un fil conducteur nuancé et un geste concret, exploratoire.
visionLongTerme : pars du chemin de vie pour ouvrir une perspective durable, en distinguant ce cap du rythme temporaire de l'année personnelle.
portrait : croise les nombres disponibles et propose des hypothèses de préférences, forces possibles et points de vigilance observables. Utilise des formulations comme « tu pourrais » et une question permettant de confronter l'hypothèse au vécu. Ne prétends jamais deviner factuellement qui est la personne. Ne fais aucune inférence sur sa santé mentale ou physique, diagnostic, sexualité, religion, origine, opinions politiques ou autre trait sensible. Aucun événement futur certain, aucune décision médicale, financière ou juridique. Ne prédis ni décès ni maladie. Ne prescris rien. Ne flatte pas systématiquement : donne un contrepoint concret et rappelle brièvement le caractère symbolique du portrait.
Utilise uniquement les nombres fournis. Les absents restent inconnus. Ne demande pas de nom, date ou lieu de naissance et n'invente aucune information personnelle.` },
    { role: "user", content: JSON.stringify({ annee: numerologie.anneeDeReference, nombres }) },
  ];
}

/** Strip only paired emphasis and decorative punctuation; never interpret HTML or alter links. */
export function normaliserProseNumerologie(texte: string): string {
  return texte
    .replace(/\*\*([^*\n]+)\*\*/gu, "$1")
    .replace(/__([^_\n]+)__/gu, "$1")
    .replace(/\*([^*\n]+)\*/gu, "$1")
    .replace(/\b_([^_\n]+)_\b/gu, "$1")
    .replace(/(\d)\s*[–—]\s*(\d)/gu, "$1 à $2")
    .replace(/\s*[–—]\s*/gu, ", ")
    .trim();
}

/** Reject sensitive attributions, while ordinary statements of the method's limits stay readable. */
export function contientAttributionSensible(texte: string): boolean {
  const normalise = texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const sujet = String.raw`(?:\btu\s+(?:es|serais|sembles|preferes|pourrais|as|aurais)|\btes?\s+(?:nombres|chiffres)\s+(?:montrent|revelent|indiquent|suggerent))`;
  const traits = String.raw`(?:catholiq\w*|musulman\w*|chretien\w*|juif\w*|juive\w*|bouddhist\w*|hindoui\w*|athee\w*|agnostiq\w*|homosexu\w*|heterosexu\w*|bisexu\w*|lesbien\w*|gay|transgenre\w*|socialist\w*|communist\w*|syndiqu\w*|conservat\w*|extreme[ -](?:droite|gauche)|origines? (?:ethniques?|raciales?))`;
  if (new RegExp(`${sujet}[^.!?;\n]{0,180}\\b${traits}\\b`, "u").test(normalise)) return true;
  return /\b(?:ta religion|ton orientation sexuelle|tes opinions politiques|tes origines (?:ethniques|raciales))\s+(?:est|sont|serait|seraient|semble|semblent)\b/u.test(normalise);
}

export function validerLectureNumerologie(texte: string): TexteLectureNumerologie | null {
  if (texte.length > 6000) return null;
  let brut: unknown;
  try { brut = JSON.parse(texte); } catch { return null; }
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
  const objet = brut as Record<string, unknown>;
  const cles = ["guidanceAnnee", "visionLongTerme", "portrait"] as const;
  if (Object.keys(objet).length !== cles.length) return null;
  for (const cle of cles) {
    const brutValeur = objet[cle];
    const valeur = typeof brutValeur === "string" ? normaliserProseNumerologie(brutValeur) : brutValeur;
    if (typeof valeur !== "string" || valeur.trim().length < 40 || valeur.length > 1600) return null;
    if (/[<>\u0000-\u0008]/u.test(valeur)) return null;
    objet[cle] = valeur;
    const affirmations = valeur
      .replace(/\b(?:pas un|pas de|sans|aucun)\s+diagnostic\b/giu, "")
      // Remove only explicit disclaimers, never the rest of their sentence.
      .replace(/\bne pr[ée]dit pas (?:ton avenir|l[’']avenir|le futur|des [ée]v[ée]nements)/giu, "")
      .replace(/\b(?:pas une?|pas de|sans|aucune?)\s+pr[ée]dictions?\b/giu, "")
      .replace(/\bne permet pas de pr[ée]dire (?:ton avenir|l[’']avenir)/giu, "");
    if (chercherInterdits(affirmations).length > 0 || chercherPredictions(affirmations).length > 0 || contientAttributionSensible(affirmations)) return null;
    if (/\b(diagnostic|bipolaire|schizophr[èe]ne|autiste|psychopathe|sociopathe|narcissique|suicidaire)\b|tu (?:vas|auras|seras) (?:mourir|malade|enceinte)|(?:tu es|tu souffres de) (?:d[ée]press|anxieu)|(?:certainement|factuellement|scientifiquement) (?:tu|vous)/iu.test(affirmations)) return null;
  }
  return { guidanceAnnee: normaliserProseNumerologie(objet.guidanceAnnee as string), visionLongTerme: normaliserProseNumerologie(objet.visionLongTerme as string), portrait: normaliserProseNumerologie(objet.portrait as string) };
}

export function validerNoteNumerologie(brut: unknown): {id: string; note: number; partagerAnam: boolean} | null {
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
  const b = brut as Record<string, unknown>;
  if (Object.keys(b).sort().join(",") !== "id,note,partagerAnam") return null;
  if (typeof b.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(b.id)) return null;
  if (typeof b.note !== "number" || !Number.isInteger(b.note) || b.note < 1 || b.note > 5 || typeof b.partagerAnam !== "boolean") return null;
  if (b.partagerAnam && b.note !== 5) return null;
  return { id: b.id, note: b.note, partagerAnam: b.partagerAnam };
}
