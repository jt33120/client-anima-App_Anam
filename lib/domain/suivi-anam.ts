import { pratiqueParId } from "./pratiques";

/** Le suivi proposé par Anam reste distinct des engagements écrits dans une branche. */
export interface ReperesSuivi {
  readonly ceQuiCompte: string;
  readonly ceQuiAide: string;
  readonly aRespecter: string;
}
export interface EtapeSuivi {
  readonly id: string;
  readonly titre: string;
  readonly pratiqueId: string | null;
}
export interface EvenementSuivi {
  readonly id: string;
  readonly type: "ajuster" | "avancer";
  readonly resume: string;
  readonly titreEtape: string | null;
  readonly niveauArbre: number;
  readonly creeLe: string;
}
export interface SuiviAnam {
  readonly revision: number;
  readonly pause: boolean;
  readonly cap: string;
  readonly synthese: string;
  readonly reperes: ReperesSuivi;
  readonly etapes: readonly EtapeSuivi[];
  readonly niveauArbre: number;
  readonly majLe: string;
  readonly evenements: readonly EvenementSuivi[];
}
export type CommandeOutilSuivi =
  | { readonly type: "ajuster"; readonly cap: string; readonly synthese: string;
      readonly etapes: readonly { readonly titre: string; readonly pratiqueId: string | null }[];
      readonly preuve: string }
  | { readonly type: "avancer"; readonly etapeId: string; readonly bilan: string; readonly preuve: string };
export type CommandePersonnelleSuivi =
  | { readonly action: "reperes"; readonly revision: number; readonly reperes: ReperesSuivi }
  | { readonly action: "pause"; readonly revision: number; readonly pause: boolean };

export const REPERES_SUIVI_VIDES: ReperesSuivi = Object.freeze({ ceQuiCompte: "", ceQuiAide: "", aRespecter: "" });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const objet = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const cles = (v: Record<string, unknown>, attendues: readonly string[]) =>
  Object.keys(v).length === attendues.length && attendues.every((k) => Object.hasOwn(v, k));
const texte = (v: unknown, max: number, min = 0): v is string =>
  typeof v === "string" && [...v].length <= max && [...v].length >= min &&
  (min === 0 || /[^\s\p{Cf}\p{Cc}]/u.test(v));
export const revisionSuiviValide = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v < 2_147_483_647;
export function reperesSuiviValides(v: unknown): v is ReperesSuivi {
  return objet(v) && cles(v, ["ceQuiCompte", "ceQuiAide", "aRespecter"]) &&
    texte(v.ceQuiCompte, 2000) && texte(v.ceQuiAide, 2000) && texte(v.aRespecter, 2000);
}
export function commandeOutilSuiviValide(v: unknown): v is CommandeOutilSuivi {
  if (!objet(v) || !texte(v.preuve, 500, v.type === "ajuster" ? 1 : 8)) return false;
  if (v.type === "avancer") return cles(v, ["type", "etapeId", "bilan", "preuve"]) &&
    typeof v.etapeId === "string" && UUID.test(v.etapeId) && texte(v.bilan, 500, 1);
  return v.type === "ajuster" && cles(v, ["type", "cap", "synthese", "etapes", "preuve"]) &&
    texte(v.cap, 160, 1) && texte(v.synthese, 1200, 1) && Array.isArray(v.etapes) && v.etapes.length >= 1 && v.etapes.length <= 3 &&
    v.etapes.every((e) => objet(e) && cles(e, ["titre", "pratiqueId"]) && texte(e.titre, 160, 1) &&
      (e.pratiqueId === null || pratiqueParId(e.pratiqueId) !== null));
}
export function commandePersonnelleSuiviValide(v: unknown): v is CommandePersonnelleSuivi {
  if (!objet(v) || !revisionSuiviValide(v.revision)) return false;
  if (v.action === "pause") return cles(v, ["action", "revision", "pause"]) && typeof v.pause === "boolean";
  return v.action === "reperes" && cles(v, ["action", "revision", "reperes"]) && reperesSuiviValides(v.reperes);
}
