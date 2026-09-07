import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * socle-frontiere.test.ts — [7.5/AC8 DUR · FR-031] LE COMPTE NE TRAVERSE PAS LA FRONTIÈRE, ET C'EST
 * LE TYPE QUI LE GARDE.
 *
 * ══ POURQUOI CE N'EST PAS UN TEST DE RENDU ══════════════════════════════════════════════════════
 *
 * La façon spontanée de garder « aucun compte, aucune jauge, aucun taux de complétude » serait de
 * balayer le DOM à la recherche d'un chiffre. C'est **impossible ici** : cette page affiche six
 * nombres, des degrés, des numéros de maison et un numéro de type. Un tel test serait soit vide,
 * soit faux — et il interdirait précisément ce que la page existe pour montrer.
 *
 * La 4.10 a payé la leçon sur l'arbitrage, la 5.6 sur la bibliothèque : **la façon naturelle de
 * faire fuir un compte est de l'ajouter au type qui traverse la frontière**. On garde donc LES DEUX
 * DÉCLARATIONS — celle du domaine (`lib/domain/fiche-socle.ts`) et celle du rendu
 * (`render/socle/types.ts`), qui existent séparément parce que `render/` n'a pas le droit de
 * connaître `lib/domain/` (AD-7/AD-10).
 *
 * S'il n'existe aucun champ où écrire un compte, il n'y a rien à masquer au rendu.
 *
 * ⚠️ ET UNE SECONDE GARDE, QUE LA BIBLIOTHÈQUE N'AVAIT PAS : LA COÏNCIDENCE DES DEUX FORMES. Une
 * frontière redéclarée des deux côtés dérive en silence — un champ ajouté d'un seul côté compile
 * parfaitement, et le rendu cesse simplement d'afficher quelque chose. On compare donc les noms de
 * champs, section par section.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

const DOMAINE = lire("lib/domain/fiche-socle.ts");
const RENDU = lire("render/socle/types.ts");
/**
 * ⚠️ UNE TROISIÈME SOURCE, ET C'EST CE QUI RENDAIT LA BRÈCHE INVISIBLE. `EcritureModele` ne vit pas
 * dans `fiche-socle.ts` : `HoroscopeFiche` l'IMPORTE de `bibliotheque.ts`, parce que la même
 * écriture paraît sur l'accueil et dans la halte. La frontière du socle la traverse donc sans la
 * déclarer, et l'extracteur, qui ne lisait qu'un fichier, ne pouvait pas la voir.
 */
const BIBLIOTHEQUE = lire("lib/domain/bibliotheque.ts");

/** Extrait le corps d'une déclaration `export interface X {` … `}` (première accolade fermante seule). */
function corpsInterface(source: string, nom: string): string {
  const debut = source.indexOf(`export interface ${nom} {`);
  if (debut < 0) return "";
  const fin = source.indexOf("\n}", debut);
  return fin < 0 ? "" : source.slice(debut, fin);
}

/** Les noms de champs déclarés, commentaires retirés — sinon on compare de la prose. */
function champs(corps: string): string[] {
  const sansCommentaires = corps.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  return [...sansCommentaires.matchAll(/^\s*readonly\s+([A-Za-z_]\w*)\??\s*:/gm)].map((m) => m[1]).sort();
}

const DECLARATIONS: ReadonlyArray<{ ou: string; corps: string }> = [
  { ou: "domaine · FaitFiche", corps: corpsInterface(DOMAINE, "FaitFiche") },
  { ou: "domaine · NombreFiche", corps: corpsInterface(DOMAINE, "NombreFiche") },
  { ou: "domaine · LectureSymboliqueFiche", corps: corpsInterface(DOMAINE, "LectureSymboliqueFiche") },
  { ou: "domaine · NombreManquantFiche", corps: corpsInterface(DOMAINE, "NombreManquantFiche") },
  { ou: "domaine · PositionFiche", corps: corpsInterface(DOMAINE, "PositionFiche") },
  { ou: "domaine · AngleFiche", corps: corpsInterface(DOMAINE, "AngleFiche") },
  { ou: "domaine · AspectFiche", corps: corpsInterface(DOMAINE, "AspectFiche") },
  // 2026-09-01 : l'horoscope du jour traverse la frontière (titre + texte, JAMAIS la date).
  { ou: "domaine · HoroscopeFiche", corps: corpsInterface(DOMAINE, "HoroscopeFiche") },
  // ⚠️ AJOUTÉES LE 2026-09-07, ET ELLES MANQUAIENT DEPUIS LE 2026-09-02. `EcritureModele` et
  // `EcritureModeleVue` traversent cette frontière depuis qu'un modèle écrit le texte du jour, et
  // aucune des deux ne figurait ici : elles pouvaient DIVERGER champ pour champ sans qu'une seule
  // ligne rougisse — précisément le mode de panne silencieux que ce fichier existe pour fermer.
  { ou: "domaine · EcritureModele", corps: corpsInterface(BIBLIOTHEQUE, "EcritureModele") },
  { ou: "domaine · PartieEcriture", corps: corpsInterface(BIBLIOTHEQUE, "PartieEcriture") },
  { ou: "domaine · SectionNombres", corps: corpsInterface(DOMAINE, "SectionNombres") },
  { ou: "domaine · SectionCiel", corps: corpsInterface(DOMAINE, "SectionCiel") },
  { ou: "domaine · SectionType", corps: corpsInterface(DOMAINE, "SectionType") },
  { ou: "domaine · FicheSocle", corps: corpsInterface(DOMAINE, "FicheSocle") },
  { ou: "domaine · ApercuUniversFiche", corps: corpsInterface(DOMAINE, "ApercuUniversFiche") },
  { ou: "rendu · FaitVue", corps: corpsInterface(RENDU, "FaitVue") },
  { ou: "rendu · NombreVue", corps: corpsInterface(RENDU, "NombreVue") },
  { ou: "rendu · LectureSymboliqueVue", corps: corpsInterface(RENDU, "LectureSymboliqueVue") },
  { ou: "rendu · NombreManquantVue", corps: corpsInterface(RENDU, "NombreManquantVue") },
  { ou: "rendu · PositionVue", corps: corpsInterface(RENDU, "PositionVue") },
  { ou: "rendu · AngleVue", corps: corpsInterface(RENDU, "AngleVue") },
  { ou: "rendu · AspectVue", corps: corpsInterface(RENDU, "AspectVue") },
  { ou: "rendu · HoroscopeVue", corps: corpsInterface(RENDU, "HoroscopeVue") },
  { ou: "rendu · EcritureModeleVue", corps: corpsInterface(RENDU, "EcritureModeleVue") },
  { ou: "rendu · PartieEcritureVue", corps: corpsInterface(RENDU, "PartieEcritureVue") },
  { ou: "rendu · SectionNombresVue", corps: corpsInterface(RENDU, "SectionNombresVue") },
  { ou: "rendu · SectionCielVue", corps: corpsInterface(RENDU, "SectionCielVue") },
  { ou: "rendu · SectionTypeVue", corps: corpsInterface(RENDU, "SectionTypeVue") },
  { ou: "rendu · FicheSocleVue", corps: corpsInterface(RENDU, "FicheSocleVue") },
  { ou: "rendu · ApercuUniversVue", corps: corpsInterface(RENDU, "ApercuUniversVue") },
];

/**
 * Les noms qu'une mesure porterait.
 *
 * ⚠️ `nombre` EST VOLONTAIREMENT ABSENT de cette liste, comme dans `bibliotheque-frontiere` : la
 * section s'appelle « nombres », et l'interdire rendrait la garde impossible à satisfaire. Ce qu'on
 * refuse, c'est un COMPTE d'objets, pas le mot « nombre ».
 */
const MESURES = [
  "badge",
  "compte",
  "compteur",
  "total",
  "nouveau",
  "verrouille",
  "cadenas",
  "restant",
  "quantite",
  "progression",
  "completude",
  "pourcentage",
  "taux",
  "jauge",
  "etape",
];

const APPARIEMENTS: ReadonlyArray<[string, string]> = [
  ["FaitFiche", "FaitVue"],
  ["NombreFiche", "NombreVue"],
  ["LectureSymboliqueFiche", "LectureSymboliqueVue"],
  ["NombreManquantFiche", "NombreManquantVue"],
  ["PositionFiche", "PositionVue"],
  ["AngleFiche", "AngleVue"],
  ["AspectFiche", "AspectVue"],
  ["HoroscopeFiche", "HoroscopeVue"],
  ["SectionNombres", "SectionNombresVue"],
  ["SectionCiel", "SectionCielVue"],
  ["SectionType", "SectionTypeVue"],
  ["FicheSocle", "FicheSocleVue"],
  ["ApercuUniversFiche", "ApercuUniversVue"],
];

describe("[7.5/AC8 DUR] aucune des deux déclarations ne peut porter une mesure", () => {
  it("[CONTRÔLE DU CONTRÔLE] les quatorze déclarations ont bien été extraites", () => {
    // Sans ce témoin, tous les refus ci-dessous seraient vrais sur des chaînes vides — le mode
    // d'échec exact d'une garde dont l'extracteur casse (leçon `arbitrage-frontiere`).
    for (const d of DECLARATIONS) {
      expect(d.corps, `déclaration introuvable : ${d.ou}`).not.toBe("");
      expect(champs(d.corps).length, `${d.ou} : aucun champ extrait`).toBeGreaterThan(0);
    }
  });

  it("[LE CŒUR] aucun champ ne porte le nom d'une mesure, des DEUX côtés", () => {
    for (const d of DECLARATIONS) {
      for (const champ of champs(d.corps)) {
        const nu = champ.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        for (const mesure of MESURES) {
          expect(nu.includes(mesure), `${d.ou} : le champ \`${champ}\` porte une mesure (${mesure})`).toBe(false);
        }
      }
    }
  });

  it("[LE CŒUR] les deux formes coïncident, champ pour champ", () => {
    // Mutation-cible : ajouter un champ d'un seul côté. Ça compile, et le rendu cesse simplement
    // d'afficher quelque chose — le mode de panne le plus silencieux d'une frontière redéclarée.
    for (const [d, r] of APPARIEMENTS) {
      expect(champs(corpsInterface(RENDU, r)), `${d} ≠ ${r}`).toEqual(champs(corpsInterface(DOMAINE, d)));
    }
  });

  it("[LE CŒUR] l’écriture d’un modèle coïncide elle aussi, champ pour champ", () => {
    // ⚠️ APPARIÉE À PART PARCE QUE SON CÔTÉ DOMAINE VIT DANS `bibliotheque.ts`, pas dans
    // `fiche-socle.ts` : la même écriture paraît sur l'accueil et dans la halte, donc elle est
    // déclarée une fois pour les deux. C'est cette indirection qui l'a fait échapper à la garde
    // pendant cinq jours — et un champ ajouté d'un seul côté ne casse rien, il fait juste cesser
    // le rendu d'afficher quelque chose.
    for (const [domaine, rendu] of [
      ["EcritureModele", "EcritureModeleVue"],
      ["PartieEcriture", "PartieEcritureVue"],
    ] as const) {
      expect(
        champs(corpsInterface(RENDU, rendu)),
        `${domaine} et ${rendu} ont divergé`,
      ).toEqual(champs(corpsInterface(BIBLIOTHEQUE, domaine)));
    }
  });

  it("[FR-031] un seul champ numérique dans toute la frontière : le type", () => {
    // Un `number` est la place où un compte s'écrit. Le type d'ennéagramme est une IDENTITÉ (le
    // type 4 n'est pas « quatre de quelque chose ») ; tout autre champ numérique est suspect.
    // ⚠️ LES DEUX CÔTÉS NE L'ÉCRIVENT PAS PAREIL, ET CHERCHER `number` DES DEUX CÔTÉS RATERAIT LA
    // MOITIÉ DU TERRITOIRE : le domaine déclare `TypeEnneagramme | null` (l'union 1..9), le rendu
    // déclare `number | null` parce qu'il n'a pas le droit d'importer le domaine. Une garde qui ne
    // cherche que `number` serait donc AVEUGLE à tout champ numérique ajouté côté domaine — le côté
    // où les décisions se prennent. On cherche les DEUX écritures, dans les deux fichiers.
    const porteurDeNombre = (source: string) => {
      const sansCommentaires = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      return [
        ...sansCommentaires.matchAll(/^\s*readonly\s+([A-Za-z_]\w*)\??\s*:\s*([^;]+);/gm),
      ]
        .filter(([, , forme]) => /\bnumber\b|\bTypeEnneagramme\b/.test(forme))
        .map(([, champ]) => champ)
        .sort();
    };
    expect(porteurDeNombre(DOMAINE), "domaine : un champ numérique inattendu").toEqual(["type"]);
    expect(porteurDeNombre(RENDU), "rendu : un champ numérique inattendu").toEqual(["type"]);
  });

  it("[AD-7] le rendu n'importe ni `lib/domain` ni `lib/data`", () => {
    for (const f of ["render/socle/types.ts", "render/socle/FicheSocle.tsx"]) {
      const src = lire(f);
      expect(src, `${f} traverse la frontière de rendu`).not.toMatch(/from\s+["']@\/lib\/(domain|data)/);
    }
  });

  it("[FR-054/FR-086] le rendu ne fabrique aucun texte de corpus", () => {
    // Un `?? ""` ou un `|| "…"` sur un `TexteVue` transformerait « Anima ne l'a pas encore écrit »
    // en « il n'y a rien à dire ». L'union existe pour rendre ces deux états distincts jusqu'au
    // dernier pixel ; l'aplatir ici annulerait toute la chaîne.
    const src = lire("render/socle/FicheSocle.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(src).not.toMatch(/texte\s*\?\?/);
    expect(src).not.toMatch(/\.texte\s*\|\|/);
    // Les lectures arrivées au rendu sont déjà les seules qui ont été écrites ; le composant ne
    // déduit plus l'état du corpus et reçoit aussi sa note unique depuis le domaine.
    expect(src).toMatch(/lecturesSymboliques/);
    expect(src).toMatch(/noteLectureSymbolique/);
    expect(src).not.toMatch(/Anima n[’']a pas encore écrit/);
  });
});
