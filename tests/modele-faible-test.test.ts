import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { autorisationModeleFaibleTest } from "@/lib/ai/modele-faible-test";

/**
 * LE MODÈLE DU TEST PRIVÉ (2026-09-06, élargi à tous les comptes le 2026-09-07).
 *
 * Ce que ce fichier garde a CHANGÉ DE SENS, et le dire est la moitié de son utilité :
 *
 *   • avant : « seul le compte déclaré obtient le modèle qui répond » ;
 *   • depuis : « TOUS les comptes du même déploiement obtiennent le même modèle ».
 *
 * L'ancienne règle était juste tant que Julian était seul à ouvrir l'application. Elle a cessé de
 * l'être le jour où Anima a ouvert Anam sur son compte : elle recevait « Service indisponible,
 * réessaie » à chaque tour, sans panne, sans journal — la garde faisait son travail, et son travail
 * était devenu le défaut.
 *
 * Ce qui NE change pas, et qui est le vrai verrou : ce mode et l'indexation publique ne peuvent
 * jamais coexister.
 */

describe("modèle faible — le test privé vaut pour le déploiement, pas pour un compte", () => {
  it("reste inactif par défaut", () => {
    expect(autorisationModeleFaibleTest({})).toBe("inactive");
    expect(autorisationModeleFaibleTest({ ANIMA_MODELE_FAIBLE_TEST: "" })).toBe("inactive");
  });

  it("[LE CŒUR] autorise TOUS les comptes, parce qu’il ne les regarde plus", () => {
    // ⚠️ MUTATION-CIBLE : réintroduire une comparaison d'identifiant, « juste pour le testeur ». Ce
    // serait recréer un déploiement à deux régimes — un compte qui parle, les autres qui lisent
    // « réessaie » — c'est-à-dire exactement le défaut que cette story corrige.
    const env = { ANIMA_MODELE_FAIBLE_TEST: "oui" };
    expect(autorisationModeleFaibleTest(env)).toBe("autorisee");
    // Et la variable d'hier est INERTE : la laisser dans Vercel ne doit refuser personne.
    expect(
      autorisationModeleFaibleTest({
        ...env,
        ANIMA_TESTEUR_MODELE_FAIBLE_ID: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe("autorisee");
  });

  it("refuse une valeur approximative au lieu de retomber silencieusement sur un modèle interdit", () => {
    // Mesuré le 2026-09-07 sur la clé de production : `mistral-large-2512` rend 403
    // (`tier_not_allowed`) et `mistral-small-2603` rend 429 de façon persistante. Une faute de
    // frappe dans le panneau Vercel ne doit donc pas « désactiver le contournement » en douceur :
    // elle arrêterait la conversation, et la cause serait invisible.
    for (const valeur of ["true", "Oui", "oui ", "1", "non"]) {
      expect(() =>
        autorisationModeleFaibleTest({ ANIMA_MODELE_FAIBLE_TEST: valeur }),
      ).toThrow("modele_faible_test_drapeau_invalide");
    }
  });

  it("[LE CŒUR] bloque le contournement quand l’indexation publique est demandée", () => {
    // C'est le VRAI verrou de ce fichier, et le seul qui protège quelqu'un : tant que la détresse
    // est détectée par un modèle que l'abonnement n'a pas validé, le produit reste introuvable.
    expect(() =>
      autorisationModeleFaibleTest({
        ANIMA_MODELE_FAIBLE_TEST: "oui",
        ANIMA_INDEXABLE: "oui",
      }),
    ).toThrow("modele_faible_test_public_interdit");
  });
});

describe("[LE CŒUR] aucun consommateur IA ne peut rater le modèle du test privé", () => {
  const lire = (chemin: string) => readFileSync(resolve(process.cwd(), chemin), "utf8");

  it("la fabrique résout le mode elle-même, pour que les trois portes soient gardées", () => {
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // ⚠️ LE DÉFAUT QUE CETTE GARDE FERME, ET QUI A VÉCU SANS SE VOIR.
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // Le mode était résolu par l'APPELANT. La route de conversation le passait ; les deux autres
    // consommateurs — `lib/ai/texte-du-jour.ts` et `lib/ordonnanceur/jobs/synthese.ts` — ne le
    // passaient pas. Sur une clé qui n'ouvre qu'un seul modèle, cela veut dire que l'horoscope et
    // la synthèse appelaient un modèle refusé, à chaque fois.
    //
    // Et rien ne le disait : `texteDuJourGenere` ne jette jamais et retombe sur le corpus, la
    // synthèse est un job de nuit. Deux pannes propres, invisibles, permanentes.
    const fabrique = lire("lib/ai/fabrique.ts");
    expect(fabrique).toContain("autorisationModeleFaibleTest");
    expect(fabrique).toMatch(
      /options\.autoriserModeleFaibleTest \?\? autorisationModeleFaibleTest\(\) === "autorisee"/,
    );
  });

  it("[ANTI-VACUITÉ] les trois consommateurs passent bien par la fabrique", () => {
    // Sans ce témoin, la garde ci-dessus serait vraie d'un produit qui n'aurait plus qu'un seul
    // appelant — ou qui construirait l'adaptateur Mistral directement, en contournant la fabrique.
    for (const chemin of [
      "app/api/anam/message/route.ts",
      "lib/ai/texte-du-jour.ts",
      "lib/ordonnanceur/jobs/synthese.ts",
    ]) {
      const source = lire(chemin);
      expect(source, `${chemin} n’utilise plus la fabrique`).toContain("creerAiPort");
      expect(
        source,
        `${chemin} construit l’adaptateur Mistral sans passer par la fabrique`,
      ).not.toMatch(/new AdaptateurMistral/);
    }
  });

  it("[LE CŒUR] la route ne refuse plus personne sur son identifiant", () => {
    // ⚠️ MUTATION-CIBLE : remettre le `return` 503 par compte. C'est LE message qu'Anima recevait,
    // et il est indiscernable d'une vraie panne — pour elle comme dans les journaux.
    const route = lire("app/api/anam/message/route.ts");
    expect(route).not.toMatch(/autorisationModeleFaible === "refusee"/);
    expect(route).not.toMatch(/autorisationModeleFaibleTest\(user\.id\)/);
  });

  it("l’autorisation reste lue après l’authentification et avant toute sortie IA", () => {
    // L'ordre garde une propriété qui n'a pas changé : une configuration fautive arrête le tour
    // AVANT de lire le corps de la requête et AVANT de construire quoi que ce soit.
    const route = lire("app/api/anam/message/route.ts");
    const authentification = route.indexOf("supabase.auth.getUser()");
    const autorisation = route.indexOf("autorisationModeleFaibleTest()");
    const lectureCorps = route.indexOf("request.json()");
    const fabrique = route.indexOf("adaptateur = await creerAiPort({");

    expect(authentification).toBeGreaterThanOrEqual(0);
    expect(autorisation).toBeGreaterThan(authentification);
    expect(lectureCorps).toBeGreaterThan(autorisation);
    expect(fabrique).toBeGreaterThan(lectureCorps);
    expect(route).toContain('autoriserModeleFaibleTest: autorisationModeleFaible === "autorisee"');
  });
});
