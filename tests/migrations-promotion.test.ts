import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyserListeMigrations,
  comparerVersions,
  liaisonPossible,
  validerNomsMigrations,
} from "@/scripts/verifier-migrations-distantes";

describe("[14.6] porte de migrations avant promotion", () => {
  it("lit le tableau stable de la CLI, y compris les lignes absentes d'un côté", () => {
    const liste = analyserListeMigrations(`
       Local | Remote | Time (UTC)
      -------|--------|------------
       0080  | 0080   | 0080
       0081  |        | 0081
             | 0082   | 0082
    `);
    expect(liste).toEqual({ locales: ["0080", "0081"], distantes: ["0080", "0082"] });
  });

  it("lit aussi la sortie JSON non interactive des CLI récentes", () => {
    expect(
      analyserListeMigrations(
        JSON.stringify({
          migrations: [
            { local: "0080", remote: "0080", time: "0080" },
            { local: "0081", remote: "", time: "0081" },
          ],
        }),
      ),
    ).toEqual({ locales: ["0080", "0081"], distantes: ["0080"] });
  });

  it("bloque les deux directions de dérive et passe seulement à parité", () => {
    expect(comparerVersions(["0080", "0081"], ["0080"])).toEqual({
      absentesDuDistant: ["0081"],
      absentesDuDepot: [],
    });
    expect(comparerVersions(["0080"], ["0080", "0081"])).toEqual({
      absentesDuDistant: [],
      absentesDuDepot: ["0081"],
    });
    expect(comparerVersions(["0080", "0081"], ["0080", "0081"])).toEqual({
      absentesDuDistant: [],
      absentesDuDepot: [],
    });
  });

  it("refuse un doublon, un trou ou un nom ambigu dans le dépôt local", () => {
    expect(() => validerNomsMigrations(["0080_a.sql", "0081_b.sql"])).not.toThrow();
    expect(() => validerNomsMigrations(["0080_a.sql", "0080_b.sql"])).toThrow(/0080/);
    expect(() => validerNomsMigrations(["0080_a.sql", "0082_b.sql"])).toThrow(/0081/);
    expect(() => validerNomsMigrations(["migration.sql"])).toThrow(/migration\.sql/);
  });

  it("n'autorise `db push` que sous `--dry-run` dans ce script", () => {
    const source = readFileSync(
      resolve(process.cwd(), "scripts/verifier-migrations-distantes.ts"),
      "utf8",
    );
    expect(source).toContain('"--linked"');
    expect(source).toContain('"--dry-run"');
    expect(source).not.toMatch(/db",\s*"push"(?![\s\S]{0,160}"--dry-run")/);
  });
});

/**
 * ══ LA PORTE REFUSAIT TOUT LE MONDE, DONC ELLE NE PROTÉGEAIT PLUS PERSONNE ═════════════════════
 *
 * Mesuré le 2026-08-28 : les quatre promotions poussées depuis `0a06649` sont en ERROR chez Vercel,
 * toutes sur la même ligne — `liaison_supabase_absente`. La production servait encore `60d88da`,
 * vieux de deux jours, et la page de login déployée n'était plus celle du dépôt.
 *
 * Le défaut n'était pas la sévérité de la porte : c'est qu'elle traitait un fait sur
 * l'ENVIRONNEMENT (« pas de secrets ici ») comme un fait sur la BASE (« le schéma a dérivé »). Les
 * prévisualisations ne l'ont jamais montré, parce que `VERCEL_ENV=preview` ne déclenche pas la
 * lecture distante : seule la promotion tombait, c'est-à-dire seulement là où ça se voit le tard.
 */
describe("[14.6 bis] l'absence d'accès n'est pas une dérive de schéma", () => {
  function racineNue(): string {
    return mkdtempSync(resolve(tmpdir(), "liaison-"));
  }

  const REFERENCE = "abcdefghijklmnopqrst"; // 20 caractères — la forme qu'exige `referenceProjet`

  it("[LE CŒUR] sans le moindre accès, la liaison est déclarée impossible", () => {
    expect(liaisonPossible(racineNue(), {})).toBe(false);
  });

  it("[LE CŒUR] avec les trois accès, la liaison redevient possible", () => {
    expect(
      liaisonPossible(racineNue(), {
        SUPABASE_PROJECT_REF: REFERENCE,
        SUPABASE_ACCESS_TOKEN: "jeton",
        SUPABASE_DB_PASSWORD: "motdepasse",
      }),
    ).toBe(true);
  });

  it("déduit la référence de l'URL publique quand elle n'est pas donnée en clair", () => {
    expect(
      liaisonPossible(racineNue(), {
        NEXT_PUBLIC_SUPABASE_URL: `https://${REFERENCE}.supabase.co`,
        SUPABASE_ACCESS_TOKEN: "jeton",
        SUPABASE_DB_PASSWORD: "motdepasse",
      }),
    ).toBe(true);
  });

  it("[ANTI-VACUITÉ] un accès sur trois ne suffit pas — chacun est nécessaire", () => {
    const complet = {
      SUPABASE_PROJECT_REF: REFERENCE,
      SUPABASE_ACCESS_TOKEN: "jeton",
      SUPABASE_DB_PASSWORD: "motdepasse",
    };
    // Sans ce balayage, le prédicat pourrait ne lire qu'une seule variable et rester vert.
    for (const manquante of Object.keys(complet)) {
      const partiel = { ...complet, [manquante]: undefined };
      expect(liaisonPossible(racineNue(), partiel), `${manquante} n'est pas exigée`).toBe(false);
    }
  });

  it("une liaison DÉJÀ faite se passe des secrets — c'est le cas d'un poste de développement", () => {
    const racine = racineNue();
    mkdirSync(resolve(racine, "supabase", ".temp"), { recursive: true });
    writeFileSync(resolve(racine, "supabase", ".temp", "project-ref"), REFERENCE);
    expect(liaisonPossible(racine, {})).toBe(true);
  });
});

describe("[14.6 bis] ce que la dégradation ne doit JAMAIS emporter", () => {
  const SOURCE = readFileSync(
    resolve(process.cwd(), "scripts/verifier-migrations-distantes.ts"),
    "utf8",
  );

  it("[LE CŒUR] seule `--promotion` se dégrade — `--linked` reste un verdict, jamais un avis", () => {
    // ⚠️ ON LIT LA CONDITION, PAS L'INTENTION. Retirer `mode === "--promotion"` rendrait
    // `npm run schema:check:linked` silencieusement inutile le jour où un secret manque — soit
    // exactement le jour où on le lance pour savoir.
    const condition = /if \(verifierDistant && mode === "--promotion" && !liaisonPossible\(/;
    expect(SOURCE, "la dégradation ne distingue plus les deux modes").toMatch(condition);
  });

  it("[LE CŒUR] la dégradation se DIT — un contrôle sauté en silence est pire que pas de contrôle", () => {
    expect(SOURCE).toContain("Schéma distant NON VÉRIFIÉ");
  });

  it("la cohérence LOCALE reste lue avant tout, et elle ne dépend d'aucun accès", () => {
    // `verifierLocalement` tourne en tête de `main`, hors de toute branche : un doublon, un trou
    // de numérotation ou un nom ambigu arrête toujours le build, sur Vercel comme ailleurs.
    const corps = SOURCE.slice(SOURCE.indexOf("export function main("));
    const iLocal = corps.indexOf("verifierLocalement(racine)");
    const iBranche = corps.indexOf("if (verifierDistant");
    expect(iLocal, "`verifierLocalement` a quitté `main`").toBeGreaterThan(-1);
    expect(iLocal, "la lecture locale est passée derrière une branche").toBeLessThan(iBranche);
  });
});
