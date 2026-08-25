import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  REGIONS,
  CATALOGUE_REGIONS,
  REGION_ENTREE,
  estRegion,
  etatInitial,
  reducteurVue,
  projectionInitiale,
  type EtatVue,
  type IdRegion,
} from "@/lib/scene";

/**
 * Story 1.7 — le MODÈLE de scène pur (AD-7). On teste la LOGIQUE sans DOM (env node),
 * comme age.ts / etat-onboarding.ts. Si ce fichier importe quoi que ce soit de `render/`,
 * la garde d'architecture (scene-architecture.test.ts) le refuse.
 */

describe("Régions — catalogue et ordre de lecture (AC1/AC3)", () => {
  it("expose exactement 3 destinations directes, dans l'ordre (Accueil, Anam, L'arbre)", () => {
    expect(REGIONS.map((r) => r.id)).toEqual(["accueil", "anam", "arbre"]);
    expect(REGIONS.every((r) => r.destinationDirecte)).toBe(true);
  });

  it("chaque destination porte un libellé nommé non vide (doublage non-spatial)", () => {
    for (const r of REGIONS) expect(r.nom.trim().length).toBeGreaterThan(0);
  });

  it("le seuil est l'entrée, jamais une destination de la barre", () => {
    expect(REGION_ENTREE).toBe("seuil");
    expect(REGIONS.some((r) => r.id === "seuil")).toBe(false);
  });

  it("estRegion valide les ids connus et rejette le reste", () => {
    for (const id of ["seuil", "accueil", "anam", "arbre"]) expect(estRegion(id)).toBe(true);
    expect(estRegion("bibliotheque")).toBe(false);
    expect(estRegion("")).toBe(false);
  });
});

describe("reducteurVue — transition pure, propriétaire unique (AC1/AC2)", () => {
  it("l'état initial part du seuil", () => {
    expect(etatInitial.regionCourante).toBe("seuil");
  });

  it("« aller » mène vers chacune des destinations", () => {
    const cibles: IdRegion[] = ["accueil", "anam", "arbre"];
    for (const cible of cibles) {
      expect(reducteurVue(etatInitial, { type: "aller", cible }).regionCourante).toBe(cible);
    }
  });

  it("aller vers la région courante est idempotent (MÊME référence — aucun rerender/fondu inutile)", () => {
    const etat: EtatVue = { ...etatInitial, regionCourante: "accueil" };
    expect(reducteurVue(etat, { type: "aller", cible: "accueil" })).toBe(etat);
  });

  it("ne mute jamais l'état d'entrée (pureté)", () => {
    const avant = { ...etatInitial };
    reducteurVue(etatInitial, { type: "aller", cible: "arbre" });
    expect(etatInitial).toEqual(avant);
  });
});

describe("projectionInitiale — projection serveur en lecture seule, STUB (AC2)", () => {
  it("le tronc est présent", () => {
    expect(projectionInitiale.tronc.present).toBe(true);
  });

  it("aucune branche au départ, et la liste est gelée (lecture seule réelle, pas seulement au type)", () => {
    expect(Array.isArray(projectionInitiale.branches)).toBe(true);
    expect(projectionInitiale.branches).toHaveLength(0);
    expect(Object.isFrozen(projectionInitiale.branches)).toBe(true);
  });

  it("aucun scalaire de progression globale (FR-031 : l'arbre n'est pas une jauge)", () => {
    // 4.6 a retiré `eveil`. Revue 4.6 : tester `eveil === undefined` était une assertion VIDE — elle
    // n'interdisait pas de réintroduire `progression`, `niveau` ou `score` sous un autre nom. On interdit
    // désormais TOUT champ numérique d'ensemble à la racine de la projection.
    const racineProjection = projectionInitiale as unknown as Record<string, unknown>;
    const numeriques = Object.entries(racineProjection).filter(([, v]) => typeof v === "number");
    expect(numeriques, `un scalaire d'ensemble est une jauge déguisée : ${JSON.stringify(numeriques)}`).toEqual([]);
    // Et le TYPE lui-même ne doit nommer aucune mesure globale.
    const src = readFileSync(resolve(process.cwd(), "lib/scene/projection.ts"), "utf-8");
    const bloc = src.match(/export interface ProjectionScene\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    for (const mot of ["eveil", "progression", "niveau", "score", "pourcentage", "total"]) {
      expect(bloc.toLowerCase(), `« ${mot} » dans ProjectionScene`).not.toContain(mot);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// [7.9] UNE SEULE SOURCE POUR LE NOM D'UN LIEU
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[7.9] aucun fichier hors du catalogue n'écrit un nom de région en littéral", () => {
  /**
   * ⚠️ CETTE GARDE EXISTE PARCE QUE LE RENOMMAGE A LAISSÉ UN FICHIER EN ARRIÈRE (2026-08-25).
   *
   * « Accueil » est devenu « Moi » et « L'arbre » « Mon arbre » dans `lib/scene/regions.ts`, seule
   * source déclarée. Mais `render/premier-passage.tsx` — LE PREMIER ÉCRAN DU PRODUIT — écrivait ces
   * noms en dur dans son JSX. Il aurait nommé les trois places autrement que la barre juste en
   * dessous, pour toujours, et aucun test ne l'aurait dit : les deux fichiers compilent.
   *
   * Le renommage suivant en oublierait un autre. On ne compte donc pas sur la vigilance : on refuse
   * le littéral.
   */
  const RACINE = process.cwd();
  const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

  function fichiersSource(dossier: string): string[] {
    return (readdirSync(resolve(RACINE, dossier), { recursive: true, encoding: "utf-8" }) as string[])
      .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
      .map((f) => `${dossier}/${f}`);
  }

  /** Le JSX écrit « L&rsquo;arbre » ; on normalise les deux formes avant de chercher. */
  const normaliser = (src: string) =>
    src.replace(/&rsquo;|&apos;|&#39;/g, "’").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  /**
   * ⚠️ « Anam » EST EXCLU, ET CE N'EST PAS UN TROU — c'est la seule lecture correcte.
   *
   * C'est à la fois le nom d'une région ET le nom du PRODUIT : il apparaît dans le `<title>` de
   * chaque page, dans l'expéditeur des courriels, dans la marque de la surimpression. Le refuser
   * ferait rougir quarante fichiers pour rien, et la pression serait alors d'exempter fichier par
   * fichier jusqu'à ce que la garde ne garde plus rien.
   *
   * Le risque résiduel est nul dans les faits : la région de conversation ne sera jamais renommée
   * autrement que le produit. Les deux noms qui BOUGENT — et qui viennent de bouger — sont couverts.
   */
  const NOM_DU_PRODUIT = "Anam";
  const NOMS = CATALOGUE_REGIONS.filter((r) => r.destinationDirecte)
    .map((r) => r.nom)
    .filter((n) => n !== NOM_DU_PRODUIT);

  it("[CONTRÔLE DU CONTRÔLE] le balayage voit un corpus réel, et les noms ne sont pas vides", () => {
    const corpus = [...fichiersSource("app"), ...fichiersSource("render"), ...fichiersSource("lib")];
    expect(corpus.length, "le balayage ne regarde rien").toBeGreaterThan(150);
    expect(NOMS.length, "les noms de régions renommables").toBe(2);
    for (const n of NOMS) expect(n.length).toBeGreaterThan(2);
  });

  it("[LE CŒUR] aucun littéral de nom de région hors `lib/scene/regions.ts`", () => {
    // Les fichiers qui ont le DROIT de porter ces mots, avec leur raison :
    //  • `regions.ts` : la source elle-même ;
    //  • `copie-reperes.ts` : le mode d'emploi NOMME les lieux — c'est son objet, et il est relu
    //    à la main. Il est exempté ici et gardé par son propre test de cohérence.
    const EXEMPTS = new Set(["lib/scene/regions.ts", "lib/domain/copie-reperes.ts"]);
    const fautifs: string[] = [];
    for (const f of [...fichiersSource("app"), ...fichiersSource("render"), ...fichiersSource("lib")]) {
      if (EXEMPTS.has(f)) continue;
      const src = normaliser(lire(f));
      for (const nom of NOMS) {
        // On cherche le nom ENTRE GUILLEMETS ou entre balises — pas le mot au fil d'une phrase :
        // « Anam » est le nom du produit, il apparaît partout et légitimement.
        if (new RegExp(`["'>]\\s*${nom}\\s*["'<]`).test(src)) fautifs.push(`${f} → « ${nom} »`);
      }
    }
    expect(
      fautifs,
      `un nom de région est réécrit hors du catalogue — le prochain renommage l'oubliera :\n${fautifs.join("\n")}`,
    ).toEqual([]);
  });
});

describe("[7.9] les spécifications au navigateur ne cherchent pas un nom de région disparu", () => {
  /**
   * ⚠️ CETTE GARDE EXISTE PARCE QUE LE RENOMMAGE A CASSÉ HUIT TESTS SANS QUE JE LE VOIE (2026-08-25).
   *
   * La substitution ne visait que les libellés ENTRE GUILLEMETS. Trois specs cherchaient le titre
   * par EXPRESSION RÉGULIÈRE — `/^Accueil$/` — et ont survécu intactes. `getByRole` ne trouvait
   * plus rien, chaque test attendait 45 secondes puis échouait : `glissement.spec.ts` est passé de
   * 1 échec à 8, sur les deux projets.
   *
   * Aucun `tsc`, aucun `eslint`, aucun test unitaire ne pouvait le dire : une chaîne dans une
   * expression régulière est du texte valide. Seule la CI navigateur l'a vu — et c'est précisément
   * pour ça qu'elle a été ajoutée le même jour.
   */
  const RACINE_E2E = process.cwd();

  it("[LE CŒUR] aucun ancien nom de région ne survit dans `e2e/`, sous aucune forme", () => {
    const specs = readdirSync(resolve(RACINE_E2E, "e2e"), { encoding: "utf-8" }).filter((f) =>
      f.endsWith(".ts"),
    );
    expect(specs.length, "aucune spec trouvée : la garde ne mesure rien").toBeGreaterThan(8);

    // Les noms d'AVANT le 2026-08-25. Ils ne doivent plus apparaître nulle part hors commentaire —
    // ni entre guillemets, ni dans une expression régulière, ni dans un sélecteur.
    const ANCIENS = ["Accueil", "L’arbre", "L'arbre", "L’accueil"];
    const fautifs: string[] = [];
    for (const f of specs) {
      const src = readFileSync(resolve(RACINE_E2E, "e2e", f), "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      for (const ancien of ANCIENS) {
        if (src.includes(ancien)) fautifs.push(`e2e/${f} → « ${ancien} »`);
      }
    }
    expect(
      fautifs,
      `une spec cherche un nom de région qui n'existe plus — elle attendra 45 s puis échouera :\n${fautifs.join("\n")}`,
    ).toEqual([]);
  });

  it("[ANTI-VACUITÉ] les NOUVEAUX noms, eux, sont bien présents dans les specs", () => {
    // Sans ce témoin, le refus ci-dessus serait vert sur un dossier `e2e/` qui ne nommerait plus
    // aucune région du tout — c'est-à-dire sur une suite qui aurait cessé de les éprouver.
    const tout = readdirSync(resolve(RACINE_E2E, "e2e"), { encoding: "utf-8" })
      .filter((f) => f.endsWith(".ts"))
      .map((f) => readFileSync(resolve(RACINE_E2E, "e2e", f), "utf-8"))
      .join("\n");
    expect(tout, "les specs ne nomment plus « Moi »").toContain("Moi");
    expect(tout, "les specs ne nomment plus « Mon arbre »").toContain("Mon arbre");
  });
});

describe("[7.9] aucune comparaison de noms de régions ne dépend de l'alphabet", () => {
  /**
   * ⚠️ DEUX SPÉCIFICATIONS ONT ROUGI SUR UN PRODUIT CORRECT (2026-08-26).
   *
   * Elles écrivaient `expect(noms.sort()).toEqual(["Accueil", "Anam", "L'arbre"])` — un `.sort()`
   * d'un seul côté, comparé à une liste qui se trouvait DÉJÀ être dans l'ordre alphabétique. La
   * comparaison marchait par coïncidence.
   *
   * Le renommage en « Moi » a défait la coïncidence — « Moi » vient après « Anam » — et deux tests
   * ont accusé le produit d'un défaut qui n'existait pas. Un `.sort()` d'un seul côté est une
   * comparaison qui tient tant que l'alphabet coopère.
   */
  it("[LE CŒUR] tout `.sort()` comparé à une liste littérale trie AUSSI l'attendu", () => {
    const specs = readdirSync(resolve(process.cwd(), "e2e"), { encoding: "utf-8" }).filter((f) =>
      f.endsWith(".ts"),
    );
    const fautifs: string[] = [];
    for (const f of specs) {
      const src = readFileSync(resolve(process.cwd(), "e2e", f), "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      // Un `.sort()` dans un `expect(...)`, suivi d'un `.toEqual([...])` dont le tableau n'est pas
      // lui-même trié : c'est exactement la forme qui a mordu.
      for (const m of src.matchAll(/\.sort\(\)[\s\S]{0,200}?\.toEqual\(\s*(\[[^\]]*\])\s*\)/g)) {
        if (!/\]\s*\.sort\(\)/.test(m[0])) fautifs.push(`e2e/${f} → ${m[1].replace(/\s+/g, " ")}`);
      }
    }
    expect(
      fautifs,
      `comparaison triée d'un seul côté — elle rougira au prochain renommage :\n${fautifs.join("\n")}`,
    ).toEqual([]);
  });

  it("[ANTI-VACUITÉ] le détecteur reconnaît bien la forme qu'il cherche", () => {
    // Sans ce témoin, un motif cassé rendrait la garde verte pour toujours, sur n'importe quel code.
    const fabrique = 'expect(noms.sort(), "msg").toEqual(["b", "a"]);';
    const trouve = [...fabrique.matchAll(/\.sort\(\)[\s\S]{0,200}?\.toEqual\(\s*(\[[^\]]*\])\s*\)/g)];
    expect(trouve.length, "le motif ne reconnaît même pas la forme fautive").toBe(1);
    expect(/\]\s*\.sort\(\)/.test(trouve[0][0]), "le témoin de trié des deux côtés est cassé").toBe(false);
  });
});
