import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Story 2.1 — la FRONTIÈRE serveur (AD-2, AD-3, AC1/AC2), prouvée par lecture de fichiers.
 *
 * On grep le NOM BRUT du package et de la variable-clé (pas seulement les `import … from`) : ainsi
 * un `import "@mistralai/…"` sans `from`, un `await import("@mistralai/…")` dynamique, un `require`
 * ou une chaîne cachée sont TOUS attrapés. Commentaires retirés avant match (sinon la garde
 * matcherait sa propre prose).
 */

const racine = process.cwd();

/** Retire /* *​/ et // (sans toucher aux :// des URLs). */
function sansCommentaires(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
function lire(f: string): string {
  return sansCommentaires(readFileSync(f, "utf-8"));
}
function fichiersTs(dir: string): string[] {
  return (readdirSync(resolve(racine, dir), { recursive: true, encoding: "utf-8" }) as string[])
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    .map((f) => resolve(racine, dir, f));
}

const ADAPTATEUR = resolve(racine, "lib/ai/adapters/mistral.ts");
const tousSource = [...fichiersTs("app"), ...fichiersTs("lib"), ...fichiersTs("render")];
const horsAdaptateur = tousSource.filter((f) => f !== ADAPTATEUR);

describe("Frontière serveur — le SDK fournisseur et la clé ne fuitent pas (AD-2/AD-3)", () => {
  it("a bien scanné du code applicatif", () => {
    expect(horsAdaptateur.length).toBeGreaterThan(10);
  });

  it("SEUL lib/ai/adapters/mistral.ts référence @mistralai/mistralai (AD-3)", () => {
    for (const f of horsAdaptateur) {
      expect(lire(f), `SDK Mistral hors adapters/ : ${f}`).not.toMatch(/@mistralai\/mistralai/);
    }
    // Contrôle positif : l'adaptateur, lui, l'importe bien → la garde n'est pas vide.
    expect(lire(ADAPTATEUR)).toMatch(/@mistralai\/mistralai/);
  });

  it("aucune variable-clé MISTRAL_ hors de l'adaptateur (clé jamais atteignable ailleurs)", () => {
    for (const f of horsAdaptateur) {
      expect(lire(f), `réf MISTRAL_ hors adapters/ : ${f}`).not.toMatch(/MISTRAL_[A-Z]/);
    }
    expect(lire(ADAPTATEUR)).toMatch(/MISTRAL_API_KEY/);
  });

  it("aucune clé IA en NEXT_PUBLIC_ (jamais exposée au client, AC1)", () => {
    for (const f of tousSource) {
      expect(lire(f), `clé IA publique : ${f}`).not.toMatch(/NEXT_PUBLIC_MISTRAL/);
      expect(lire(f), `clé API publique : ${f}`).not.toMatch(/NEXT_PUBLIC_\w*API_KEY/);
    }
  });
});

/**
 * ══ STORY 10.1 — LE REFUS DE LA CLÉ PAR UTILISATRICE, SOUS SA FORME EXÉCUTABLE ═════════════════
 *
 * Julian a demandé le 2026-08-25 « une clé API Mistral par utilisatrice, pour savoir ce que chacune
 * me coûte ». C'est refusé, et le motif décisif n'est pas technique : les plafonds de Mistral
 * s'appliquent au WORKSPACE et suspendent l'accès API jusqu'au mois suivant, ce qui ferait passer la
 * décision de couper CHEZ LE FOURNISSEUR — hors de portée du serveur, éventuellement au milieu d'une
 * conversation en détresse. FR-043 dit qu'aucune limite d'usage ne peut interrompre une telle
 * conversation, et `lib/domain/allocation-residuelle.ts` place ses deux court-circuits en tête pour
 * cette raison exacte. Le raisonnement complet, daté et sourcé, vit en fin d'ARCHITECTURE-SPINE.md.
 *
 * ⚠️ CE QUI SUIT EXISTE PARCE QU'UNE NOTE NE SE DÉFEND PAS SEULE. Une décision qui ne vit que dans
 * un document se rouvre au premier oubli — c'était déjà la troisième fois que cette question
 * revenait. Les deux gardes ci-dessous la rendent impossible à contourner en silence.
 */

/** Les noms qu'une clé de fournisseur porterait si elle venait de la base. */
const NOMS_DE_CLE = /cle_api|api_key|apikey|token_fournisseur|jeton_fournisseur/i;

describe("Story 10.1 — aucune clé de fournisseur ne peut venir de la base (AD-2, AD-12)", () => {
  /**
   * ⚠️ ON INTERDIT LA CHAÎNE LITTÉRALE, PAS L'IDENTIFIANT — ET LA DIFFÉRENCE EST TOUTE LA GARDE.
   *
   * Ma première version bannissait le nom partout. Elle rougissait sur `process.env.RESEND_API_KEY`
   * (`lib/courriel/fabrique.ts:51`), qui est précisément la BONNE forme : un secret de plateforme,
   * hors de la base, hors du dépôt. Une garde qui condamne le motif qu'elle est censée protéger se
   * fait relâcher au premier échec, et une garde relâchée ne garde plus rien.
   *
   * La frontière exacte est là : une COLONNE se cite en chaîne — `.select("cle_api")`,
   * `.eq("api_key", …)` — tandis qu'une variable d'environnement se lit en IDENTIFIANT —
   * `process.env.RESEND_API_KEY`, sans guillemets. Aucune liste d'exceptions n'est nécessaire ; la
   * forme du code suffit à les séparer.
   *
   * (`process.env["RESEND_API_KEY"]` serait un littéral et rougirait ici. C'est assumé : la forme
   * pointée est celle du dépôt, et basculer sur l'autre pour loger une clé en base serait
   * exactement le geste qu'on veut voir.)
   */
  it("aucune chaîne littérale ne nomme une clé de fournisseur (une colonne se cite, un secret non)", () => {
    const fautifs: string[] = [];
    for (const f of horsAdaptateur) {
      for (const [, litteral] of lire(f).matchAll(/["'`]([^"'`\n]{1,120})["'`]/g)) {
        if (NOMS_DE_CLE.test(litteral)) fautifs.push(`${f.replace(racine + "/", "")} → "${litteral}"`);
      }
    }
    expect(
      fautifs,
      "une clé de fournisseur nommée en chaîne littérale hors de l'adaptateur : si elle vient de la " +
        "base, `authenticated` détient les sept privilèges DML dessus (AD-12) — c'est la pire " +
        "surface possible pour un secret. Voir la note datée d'AD-2 en fin d'ARCHITECTURE-SPINE.md.",
    ).toEqual([]);
  });

  it("aucune COLONNE de migration ne porte un nom de clé de fournisseur", () => {
    const migrations = (
      readdirSync(resolve(racine, "supabase/migrations"), { encoding: "utf-8" }) as string[]
    ).filter((f) => f.endsWith(".sql"));
    // Témoin : la garde a bien du SQL à lire. Sans lui, un dossier renommé la viderait en vert.
    expect(migrations.length, "aucune migration lue : la garde ne prouverait rien").toBeGreaterThan(30);

    const fautifs = migrations.filter((f) =>
      NOMS_DE_CLE.test(readFileSync(resolve(racine, "supabase/migrations", f), "utf-8")),
    );
    expect(fautifs, "une colonne de base nommée comme une clé de fournisseur").toEqual([]);
  });

  it("le témoin inverse : le motif attrape bien ce qu'il prétend attraper", () => {
    // ⚠️ SANS CECI, LES DEUX TESTS CI-DESSUS PASSERAIENT AVEC UN MOTIF QUI NE MATCHE RIEN. C'est la
    // panne la plus discrète de ce dépôt : une garde qui cherche quelque chose d'introuvable est
    // verte pour toujours, et personne ne peut distinguer « rien à signaler » de « rien cherché ».
    for (const faux of ['select("cle_api")', "api_key text not null", "TOKEN_FOURNISSEUR"]) {
      expect(NOMS_DE_CLE.test(faux), `le motif rate ${faux}`).toBe(true);
    }
    // Et il laisse passer la forme LÉGITIME, sinon il serait relâché à la première exécution.
    expect(/["'`]([^"'`\n]{1,120})["'`]/.test("process.env.RESEND_API_KEY")).toBe(false);
  });
});

describe("Story 10.1 — l'attestation de conformité n'est jamais paramétrable (AD-4)", () => {
  /**
   * `assertConformiteArt9()` prouve UNE SEULE configuration, une fois, au démarrage : ZDR confirmé,
   * DPA signé, plan Scale. Le jour où l'un de ces trois drapeaux dépendrait d'une utilisatrice,
   * d'une session ou d'une ligne de base, le refus de démarrer deviendrait négociable au cas par
   * cas — et c'est exactement la porte qu'une « clé par personne » aurait ouverte : à clé propre,
   * conformité propre. Cette garde lit le CÂBLAGE, pas une phrase.
   */
  const source = lire(ADAPTATEUR);
  const corps = source.slice(
    source.indexOf("function assertConformiteArt9"),
    source.indexOf("const DELAI_REPRISE_MS"),
  );

  it("témoin : la garde a bien isolé le corps de l'attestation", () => {
    expect(corps.length, "corps introuvable : la garde lirait le vide et passerait").toBeGreaterThan(120);
    expect(corps).toMatch(/MISTRAL_ZDR_CONFIRMED/);
  });

  it("elle ne prend AUCUN paramètre — rien d'une requête ne peut y entrer", () => {
    expect(
      corps,
      "l'attestation accepte un argument : elle est devenue paramétrable par appelant",
    ).toMatch(/function assertConformiteArt9\(\s*\)/);
  });

  it("les trois drapeaux sont lus dans l'environnement et comparés à un littéral", () => {
    for (const drapeau of ["MISTRAL_ZDR_CONFIRMED", "MISTRAL_DPA_SIGNED", "MISTRAL_PLAN"]) {
      expect(
        corps,
        `${drapeau} n'est plus une lecture directe d'environnement comparée à une constante`,
      ).toMatch(new RegExp(`process\\.env\\.${drapeau}\\s*===\\s*["'][a-z]+["']`));
    }
  });

  it("et elle est appelée sans argument, partout", () => {
    const appels = [...source.matchAll(/assertConformiteArt9\(([^)]*)\)/g)]
      .map((m) => m[1].trim())
      .filter((a, i, t) => !(i === 0 && t.length > 1 && a === "")); // la déclaration elle-même
    expect(appels.filter((a) => a !== ""), "un appel passe un argument à l'attestation").toEqual([]);
  });
});
