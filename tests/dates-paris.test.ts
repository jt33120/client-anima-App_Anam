import { describe, it, expect, afterEach, vi } from "vitest";
import { jourCivilParisIso, dateNaissanceParis } from "./_dates-paris";

/**
 * dates-paris.test.ts — [CI] LA BORNE DE MAJORITÉ TIENT À TOUTES LES HEURES DU JOUR.
 *
 * ══ CE QU'ON RÉPARE ════════════════════════════════════════════════════════════════════════════
 *
 * `tests/horodatages-et-majorite-sql.test.ts` calculait ses dates de naissance en UTC pendant que
 * le déclencheur `0048_majorite_dans_le_trigger.sql` compare au jour civil d'**Europe/Paris**.
 * Entre 22 h et minuit UTC — 0 h à 2 h à Paris en été — Paris est déjà le lendemain, et les deux
 * bornes différaient d'un jour exactement.
 *
 * Conséquence mesurée le 2026-08-25 à 22 h 13 UTC : « dix-huit ans MOINS un jour » tombait pile sur
 * le seuil et PASSAIT au lieu d'être refusée. L'écriture ayant réussi, `date_naissance` — write-once
 * — refusait le test suivant, qui accusait alors la base d'avoir refusé une majeure. **Une cause,
 * deux tests rouges, et le second message désignait le mauvais coupable.**
 *
 * Deux heures par nuit, tous les jours, depuis que ce test existe.
 *
 * ⚠️ UN TEST QUI ÉCHOUE SUR UNE HORLOGE APPREND À NE PLUS LIRE LE ROUGE. C'est la même leçon que le
 * test de poussée « capricieux » de la veille — qui n'était pas capricieux non plus, mais faux.
 *
 * ⚠️ ET LE PRODUIT, LUI, EST JUSTE. Le déclencheur compte en Paris parce que le jour civil du
 * produit est celui de Paris. C'était le TEST qui parlait un autre calendrier. On ne déplace donc
 * pas la borne : on fait parler au test la langue de la base.
 */

afterEach(() => vi.useRealTimers());

/** Le seuil que la base applique : le jour civil de Paris, moins dix-huit ans. */
function seuilDeLaBase(maintenant: Date): string {
  const d = new Date(`${jourCivilParisIso(maintenant)}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

describe("[CI] la borne de majorité ne dépend pas de l'heure à laquelle la CI tourne", () => {
  it("[CONTRÔLE DU CONTRÔLE] le calcul rend bien des dates au format de PostgreSQL", () => {
    expect(dateNaissanceParis(18)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(jourCivilParisIso(new Date("2026-08-25T22:13:00Z"))).toBe("2026-08-26");
  });

  it("[LE CŒUR] à CHACUNE des 24 heures, la borne sépare correctement mineure et majeure", () => {
    // ⚠️ C'EST LA SEULE FORME QUI PROUVE LE CORRECTIF. Éprouver à l'heure courante passerait
    // vingt-deux fois sur vingt-quatre — et c'est exactement ce qui s'est produit pendant des
    // semaines : le défaut ne se montrait que dans une fenêtre de deux heures.
    const echecs: string[] = [];
    for (let h = 0; h < 24; h++) {
      const maintenant = new Date(Date.UTC(2026, 7, 25, h, 30, 0));
      vi.useFakeTimers();
      vi.setSystemTime(maintenant);

      const seuil = seuilDeLaBase(maintenant);
      const mineure = dateNaissanceParis(18, 1); // dix-huit ans MOINS un jour
      const majeure = dateNaissanceParis(18, -1); // dix-huit ans ET un jour

      // La base refuse si `date_naissance > seuil`.
      if (!(mineure > seuil)) echecs.push(`${h}h UTC : la mineure (${mineure}) passe le seuil ${seuil}`);
      if (majeure > seuil) echecs.push(`${h}h UTC : la majeure (${majeure}) est refusée par le seuil ${seuil}`);
      vi.useRealTimers();
    }
    expect(echecs, `la borne dépend de l'heure :\n${echecs.join("\n")}`).toEqual([]);
  });

  it("[LE TÉMOIN] l'ancien calcul en UTC, LUI, se trompe bien dans la fenêtre de nuit", () => {
    // ⚠️ SANS CE TÉMOIN, LE TEST PRÉCÉDENT SERAIT VERT SUR N'IMPORTE QUEL CALCUL — y compris sur
    // celui d'avant. Il prouverait alors que la borne « tient », sans prouver qu'on a corrigé quoi
    // que ce soit. On rejoue donc l'ancienne formule et on exige qu'elle ÉCHOUE, à l'heure exacte
    // où la CI a rougi.
    const ancienIlYA = (annees: number, decalage: number, maintenant: Date) => {
      const d = new Date(maintenant.getTime());
      d.setFullYear(d.getFullYear() - annees);
      return new Date(d.getTime() + decalage * 86_400_000).toISOString().slice(0, 10);
    };
    const maintenant = new Date("2026-08-25T22:13:00Z");
    const seuil = seuilDeLaBase(maintenant); // Paris est déjà le 26
    const mineureUtc = ancienIlYA(18, 1, maintenant);
    expect(
      mineureUtc > seuil,
      "l'ancien calcul ne se trompait pas : alors le correctif ne corrige rien",
    ).toBe(false);
  });

  it("le passage à l'heure d'hiver ne casse rien non plus", () => {
    // En hiver Paris est à UTC+1 : la fenêtre de bascule se réduit à une heure, mais elle existe.
    const echecs: string[] = [];
    for (const h of [22, 23]) {
      const maintenant = new Date(Date.UTC(2026, 11, 15, h, 30, 0));
      vi.useFakeTimers();
      vi.setSystemTime(maintenant);
      const seuil = seuilDeLaBase(maintenant);
      if (!(dateNaissanceParis(18, 1) > seuil)) echecs.push(`${h}h UTC en décembre`);
      if (dateNaissanceParis(18, -1) > seuil) echecs.push(`${h}h UTC en décembre (majeure)`);
      vi.useRealTimers();
    }
    expect(echecs).toEqual([]);
  });

  it("le 29 février ne produit pas de date invalide", () => {
    // `setUTCFullYear` sur un 29 février d'une année non bissextile glisse au 1er mars — ce qui est
    // le comportement voulu, mais qui doit rester une DATE, pas un `Invalid Date`.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-02-29T12:00:00Z"));
    for (const decalage of [-1, 0, 1]) {
      expect(dateNaissanceParis(18, decalage)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    vi.useRealTimers();
  });
});
