import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SECONDAIRES_MAX,
  cleDeSignature,
  signatureDuCiel,
  signatureExploitable,
} from "@/lib/domain/signature-ciel";
import {
  assemblerHoroscope,
  type ChangementDeSigne,
  type CielDuJour,
  type JourCivil,
} from "@/lib/astro/quotidien";
import type { Corps } from "@/lib/astro/port";
import { placer, type ThemeNatal } from "@/lib/astro/theme-natal";

/**
 * LA GARDE DE NON-FUITE (2026-09-02).
 *
 * `SignatureDuCiel` est ce qui part chez un tiers. Sa promesse tient en une phrase : rien de ce qui
 * sort ne nomme quelqu'un, ni ne porte sa naissance. Une promesse pareille se mesure, sinon elle
 * dure jusqu'au premier champ ajouté « pour personnaliser un peu plus ».
 *
 * Trois angles, parce qu'un seul se contourne :
 *   • LE CŒUR : ce qui sort d'un horoscope réel, champ par champ, valeur par valeur ;
 *   • LE BORD : les formes qui n'ont pas de configuration, ou pas de Soleil natal ;
 *   • LA STRUCTURE : le fichier lui-même, pour qu'un champ neuf de type `Date`, `string` libre ou
 *     `longitude` ne puisse pas entrer sans faire rougir cette ligne.
 */

const JOUR: JourCivil = { a: 2026, m: 9, j: 2 };

/** Un thème minimal, sans heure : Soleil et Lune placés, aucun angle. */
function themeDe(longitudeSoleil: number, longitudeLune: number): ThemeNatal {
  return {
    schema: 2,
    adaptateur: "test",
    precision: "midi_par_defaut",
    positions: [
      { corps: "soleil", longitude: longitudeSoleil, ...placer(longitudeSoleil) },
      { corps: "lune", longitude: longitudeLune, ...placer(longitudeLune) },
    ],
    absents: [],
    angles: { statut: "non_calcule", raison: "heure_absente" },
  };
}

/** Un ciel du jour minimal, à des longitudes choisies pour produire les aspects voulus. */
function cielDe(
  positions: readonly { corps: Corps; longitude: number }[],
  changements: readonly ChangementDeSigne[] = [],
): CielDuJour {
  return {
    instantReference: new Date("2026-09-02T12:00:00Z"),
    positions: positions.map((p) => ({
      corps: p.corps,
      longitude: p.longitude,
      ...placer(p.longitude),
    })),
    absents: [],
    changementsDeSigne: changements,
  };
}

describe("[LE CŒUR] la signature ne porte que des énumérations et des entiers", () => {
  it("projette un horoscope réel sans en garder ni longitude, ni orbe, ni date", () => {
    // Soleil natal à 10° (Bélier). Lune du jour à 55° (Taureau) : un signe d'écart, et 45° du
    // Soleil natal, donc AUCUN aspect — la dominante reste celle de Mars, et le test mesure ce
    // qu'il croit mesurer.
    const theme = themeDe(10, 200);
    const ciel = cielDe([
      { corps: "lune", longitude: 55, ...placer(55) },
      { corps: "mars", longitude: 10.4, ...placer(10.4) },
    ]);
    const signature = signatureDuCiel(assemblerHoroscope(theme, JOUR, ciel));

    expect(signature.luneDistance).toBe(1);
    expect(signature.dominante).toEqual({
      corpsTransitant: "mars",
      aspect: "conjonction",
      cible: "soleil",
    });

    // [ANTI-VACUITÉ] la projection a bien produit quelque chose, et ce quelque chose est CLOS :
    // exactement quatre clés, pas une de plus.
    expect(Object.keys(signature).sort()).toEqual([
      "changements",
      "dominante",
      "luneDistance",
      "secondaires",
    ]);

    // Aucune valeur sérialisée ne ressemble à une longitude, une date ou un identifiant.
    const serialisee = JSON.stringify(signature);
    expect(serialisee).not.toMatch(/\d+\.\d+/); // pas de décimale : ni longitude, ni orbe
    expect(serialisee).not.toMatch(/20\d{2}/); // pas d'année
    expect(serialisee).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/i); // pas d'UUID
  });

  it("ne garde que deux configurations secondaires, même un jour chargé", () => {
    const theme = themeDe(10, 200);
    // Cinq corps conjoints au Soleil natal : autant de configurations, toutes dans l'orbe.
    const ciel = cielDe([
      { corps: "mars", longitude: 10.1, ...placer(10.1) },
      { corps: "venus", longitude: 10.2, ...placer(10.2) },
      { corps: "mercure", longitude: 10.3, ...placer(10.3) },
      { corps: "jupiter", longitude: 10.4, ...placer(10.4) },
      { corps: "saturne", longitude: 10.5, ...placer(10.5) },
    ]);
    const signature = signatureDuCiel(assemblerHoroscope(theme, JOUR, ciel));

    expect(signature.dominante).not.toBeNull();
    expect(signature.secondaires).toHaveLength(SECONDAIRES_MAX);
    // La dominante n'est pas répétée dans les secondaires : elle est déjà dite.
    expect(signature.secondaires).not.toContainEqual(signature.dominante);
  });
});

describe("[LE BORD] les absences restent des absences", () => {
  it("sans Soleil natal, la distance de Lune est nulle et non zéro", () => {
    const theme: ThemeNatal = { ...themeDe(10, 200), positions: [] };
    const signature = signatureDuCiel(
      assemblerHoroscope(theme, JOUR, cielDe([{ corps: "lune", longitude: 100, ...placer(100) }])),
    );
    // Zéro voudrait dire « dans le même signe », ce qui est une information ; `null` dit « je ne
    // sais pas ». Les confondre ferait écrire au modèle un fait qu'on n'a pas.
    expect(signature.luneDistance).toBeNull();
    expect(signature.dominante).toBeNull();
    expect(signatureExploitable(signature)).toBe(false);
  });

  it("un jour sans aspect reste exploitable si la Lune est calculée", () => {
    const theme = themeDe(10, 200);
    const signature = signatureDuCiel(
      assemblerHoroscope(theme, JOUR, cielDe([{ corps: "lune", longitude: 55, ...placer(55) }])),
    );
    expect(signature.dominante).toBeNull();
    expect(signatureExploitable(signature)).toBe(true);
  });
});

describe("[LE CŒUR] la clé distingue ce qui doit l'être, et rien d'autre", () => {
  const theme = themeDe(10, 200);
  const avecMars = signatureDuCiel(
    assemblerHoroscope(theme, JOUR, cielDe([{ corps: "lune", longitude: 55, ...placer(55) }, { corps: "mars", longitude: 10.4, ...placer(10.4) }])),
  );
  const sansMars = signatureDuCiel(
    assemblerHoroscope(theme, JOUR, cielDe([{ corps: "lune", longitude: 55, ...placer(55) }])),
  );

  it("deux ciels différents ne partagent pas une clé", () => {
    expect(cleDeSignature(JOUR, avecMars)).not.toBe(cleDeSignature(JOUR, sansMars));
  });

  it("deux jours différents ne partagent pas une clé, même à ciel identique", () => {
    expect(cleDeSignature(JOUR, avecMars)).not.toBe(cleDeSignature({ ...JOUR, j: 3 }, avecMars));
  });

  it("la même signature rend deux fois la même clé", () => {
    expect(cleDeSignature(JOUR, avecMars)).toBe(cleDeSignature(JOUR, avecMars));
  });

  it("[ANTI-VACUITÉ] la clé porte le jour en clair, et se lit", () => {
    expect(cleDeSignature(JOUR, avecMars)).toContain("2026-09-02");
    expect(cleDeSignature(JOUR, avecMars)).toContain("dom:mars:conjonction:soleil");
  });
});

describe("[LE BORD] la forme du type se garde, pas seulement ses valeurs", () => {
  const source = readFileSync(resolve(process.cwd(), "lib/domain/signature-ciel.ts"), "utf-8");
  const corps = source.slice(
    source.indexOf("export interface SignatureDuCiel"),
    source.indexOf("export const SECONDAIRES_MAX"),
  );

  it("[ANTI-VACUITÉ] l'extracteur a bien attrapé la déclaration", () => {
    expect(corps.length).toBeGreaterThan(200);
    expect(corps).toContain("luneDistance");
  });

  for (const interdit of ["Date", "naissance", "prenom", "nom", "identifiant", "longitude", "orbe"]) {
    it(`aucun champ « ${interdit} » n'est apparu`, () => {
      expect(
        new RegExp(`readonly\\s+\\w*${interdit}\\w*\\s*[?:]`, "i").test(corps),
        `un champ « ${interdit} » est apparu sur la signature — ce qui sort chez un tiers ne se ` +
          `garde pas à la vigilance`,
      ).toBe(false);
    });
  }
});
