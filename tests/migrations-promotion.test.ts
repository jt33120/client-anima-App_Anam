import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyserListeMigrations,
  comparerVersions,
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
