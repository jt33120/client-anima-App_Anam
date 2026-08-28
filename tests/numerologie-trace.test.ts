import { describe, expect, it } from "vitest";
import { calculerNumerologie, tracerNumerologie, type NomNombre } from "@/lib/astro/numerologie";

describe("[13.9] la trace numérologique est vérifiable sans interprétation", () => {
  it("décompose le chemin de vie selon la convention réellement utilisée", () => {
    const trace = tracerNumerologie({ date: "1970-11-28", nomComplet: "Yves" }, 2026);
    const chemin = trace.nombres.chemin_de_vie;

    expect(chemin?.origine).toBe("date_separee");
    if (!chemin || chemin.origine !== "date_separee") throw new Error("trace inattendue");
    expect(chemin.jour.etapes).toEqual([28, 10, 1]);
    expect(chemin.mois.etapes).toEqual([11]);
    expect(chemin.annee.etapes).toEqual([1970, 17, 8]);
    expect(chemin.total.etapes).toEqual([20, 2]);
  });

  it("rend visibles les lettres et valeurs effectivement comptées", () => {
    const trace = tracerNumerologie({ date: "1970-11-28", nomComplet: "Yves" }, 2026);

    const expression = trace.nombres.expression;
    expect(expression?.origine).toBe("lettres");
    if (!expression || expression.origine !== "lettres") throw new Error("trace inattendue");
    expect(expression.lettres).toBe("yves");
    expect(expression.valeurs).toEqual([7, 4, 5, 1]);
    expect(expression.total.etapes).toEqual([17, 8]);

    const intime = trace.nombres.intime;
    expect(intime?.origine).toBe("lettres");
    if (!intime || intime.origine !== "lettres") throw new Error("trace inattendue");
    expect(intime.lettres).toBe("ye");
    expect(intime.valeurs).toEqual([7, 5]);
    expect(intime.total.etapes).toEqual([12, 3]);
  });

  it("distingue l’année de référence et sa réduction sans nombre maître", () => {
    const trace = tracerNumerologie({ date: "1970-11-28", nomComplet: null }, 2026);
    const annee = trace.nombres.annee_personnelle;

    expect(annee?.origine).toBe("annee_personnelle");
    if (!annee || annee.origine !== "annee_personnelle") throw new Error("trace inattendue");
    expect(annee.anneeDeReference.etapes).toEqual([2026, 10, 1]);
    expect(annee.total.etapes).toEqual([13, 4]);
  });

  it("ne fabrique aucune trace pour un nombre qui n’a pas été calculé", () => {
    const trace = tracerNumerologie({ date: "1970-11-28", nomComplet: null }, 2026);
    expect(trace.nombres.expression).toBeNull();
    expect(trace.nombres.intime).toBeNull();
    expect(trace.nombres.personnalite).toBeNull();
  });

  it("aboutit au même résultat que le calcul de référence pour chaque nombre", () => {
    const entrees = { date: "1990-06-15", nomComplet: "Marie Claire Dubois" };
    const resultat = calculerNumerologie(entrees, 2026);
    const trace = tracerNumerologie(entrees, 2026);

    for (const cle of Object.keys(resultat.nombres) as NomNombre[]) {
      const lecture = resultat.nombres[cle];
      const detail = trace.nombres[cle];
      expect(lecture.statut, cle).toBe("calcule");
      if (lecture.statut !== "calcule" || !detail) continue;
      expect(detail.total.etapes.at(-1), cle).toBe(lecture.valeur);
    }
  });
});
