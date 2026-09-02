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
  it("expose exactement 3 destinations directes, dans l'ordre (accueil, anam, arbre)", () => {
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

/**
 * ⚠️ « Anam » EST EXCLU, ET CE N'EST PAS UN TROU : c'est la seule lecture correcte.
 *
 * C'est à la fois le nom d'une région ET le nom du PRODUIT : il apparaît dans le `<title>` de
 * chaque page, dans l'expéditeur des courriels, dans la marque de la surimpression. Le refuser
 * ferait rougir quarante fichiers pour rien, et la pression serait alors d'exempter fichier par
 * fichier jusqu'à ce que la garde ne garde plus rien.
 *
 * Le risque résiduel est nul dans les faits : la région de conversation ne sera jamais renommée
 * autrement que le produit. Les deux noms qui BOUGENT, et qui viennent de bouger deux fois, sont
 * couverts. Ils sont lus au catalogue, jamais écrits ici : les deux gardes de ce fichier (le code
 * source et les specs navigateur) suivent le prochain renommage sans qu'une ligne change.
 */
const NOM_DU_PRODUIT = "Anam";
const NOMS = CATALOGUE_REGIONS.filter((r) => r.destinationDirecte)
  .map((r) => r.nom)
  .filter((n) => n !== NOM_DU_PRODUIT);

/** Les commentaires ne cherchent rien : on les retire avant de lire (le `//` d'une URL reste). */
const sansCommentaires = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

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
   *
   * Le 2026-09-02, « Moi » est devenu « Aujourd’hui » (retour du fondateur) : le h1, les noms
   * accessibles et les boutons de barre ont suivi le catalogue sans qu'un fichier de rendu change.
   * C'est la preuve que la garde valait son prix. Ce qu'elle n'attrapait pas, elle le dit
   * maintenant : « Revenir à Moi » vivait au fil d'une phrase dans
   * `app/_erreur/ErreurApplication.tsx`, hors du motif « entre guillemets ou entre balises ». Les
   * deux pages de sortie lisent désormais `nomDeRegion(REGION_FOYER)`, et
   * `tests/rendu/erreur-application.test.tsx` le garde.
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
    // Et UN mot toléré dans UN fichier, pas le fichier entier (2026-09-02, décision D7) :
    //  • `render/conversation/Fil.tsx` : son séparateur de jour dit « Aujourd’hui » (rôle
    //    `separator`, gardé par `tests/rendu/fil-retrouve.test.tsx`) depuis bien avant que la région
    //    d'accueil porte ce nom. Ce n'est pas un nom de lieu, c'est le mot du calendrier : le fil ne
    //    mène nulle part par lui. Exempter le fichier entier laisserait passer un « Mon arbre » en
    //    dur dans le même fichier ; on n'exempte que le mot, et seulement tant qu'il y est.
    const EXEMPTS_PAR_MOT: Readonly<Record<string, readonly string[]>> = {
      "render/conversation/Fil.tsx": ["Aujourd’hui"],
    };
    const fautifs: string[] = [];
    for (const f of [...fichiersSource("app"), ...fichiersSource("render"), ...fichiersSource("lib")]) {
      if (EXEMPTS.has(f)) continue;
      const src = normaliser(lire(f));
      for (const nom of NOMS) {
        if (EXEMPTS_PAR_MOT[f]?.includes(nom)) continue;
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

  it("[ANTI-VACUITÉ] l'exemption du séparateur de jour vise un mot qui est encore un nom de région, et qui est encore là", () => {
    // Sans ce témoin, une exemption périmée (la région renommée une troisième fois, ou le séparateur
    // reformulé) resterait dans la liste pour toujours, et personne ne saurait plus ce qu'elle
    // tolère. Une exemption qui ne tolère plus rien est un trou en attente.
    const src = normaliser(lire("render/conversation/Fil.tsx"));
    expect(NOMS, "« Aujourd’hui » n'est plus un nom de région : l'exemption est morte").toContain("Aujourd’hui");
    expect(src, "le séparateur de jour ne dit plus « Aujourd’hui » : l'exemption est morte").toMatch(
      /["'>]\s*Aujourd’hui\s*["'<]/,
    );
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

    // Les noms d'AVANT le 2026-08-25, et « Moi », d'avant le 2026-09-02. Ils ne doivent plus
    // apparaître nulle part hors commentaire : ni entre guillemets, ni dans une expression
    // régulière, ni dans un sélecteur.
    //
    // ⚠️ FRONTIÈRE DE MOT, ET PAS `includes` (2026-09-02). « Moi » est un préfixe ordinaire :
    // « Mois », « Moins », « Moitié » rougiraient sur des specs justes, et « dis-moi » n'est pas
    // un lieu (la casse compte). `\b` ne regarde que les lettres ASCII, ce qui suffit ici : chaque
    // ancien commence et finit par une lettre, l'apostrophe de « L’arbre » est à l'intérieur du
    // motif, jamais à son bord.
    const ANCIENS = ["Accueil", "L’arbre", "L'arbre", "L’accueil", "Moi"];
    const fautifs: string[] = [];
    for (const f of specs) {
      const src = sansCommentaires(readFileSync(resolve(RACINE_E2E, "e2e", f), "utf-8"));
      for (const ancien of ANCIENS) {
        if (new RegExp(`\\b${ancien}\\b`).test(src)) fautifs.push(`e2e/${f} → « ${ancien} »`);
      }
    }
    expect(
      fautifs,
      `une spec cherche un nom de région qui n'existe plus — elle attendra 45 s puis échouera :\n${fautifs.join("\n")}`,
    ).toEqual([]);
  });

  it("[ANTI-VACUITÉ] la frontière de mot attrape « Moi » sous ses formes cherchées, et laisse « Mois »", () => {
    // Le motif est celui de la boucle ci-dessus, construit de la même façon. Sans ce témoin, un
    // `\b` mal échappé rendrait la garde verte sur n'importe quelle spec.
    const motif = new RegExp(`\\bMoi\\b`);
    for (const forme of ['{ name: "Moi", level: 1 }', "/^Moi$/", 'section[aria-label="Moi"]', '["Moi", "Anam"].sort()']) {
      expect(motif.test(forme), `la forme « ${forme} » échappe à la garde`).toBe(true);
    }
    for (const forme of ["Mois", "Moins", "Moitié", "dis-moi", "moi"]) {
      expect(motif.test(forme), `« ${forme} » rougirait à tort`).toBe(false);
    }
  });

  it("[ANTI-VACUITÉ] les noms du CATALOGUE, eux, sont bien cherchés par les specs, hors commentaire", () => {
    // Sans ce témoin, le refus ci-dessus serait vert sur un dossier `e2e/` qui ne nommerait plus
    // aucune région du tout — c'est-à-dire sur une suite qui aurait cessé de les éprouver.
    //
    // ⚠️ HORS COMMENTAIRE, ET DEPUIS LE CATALOGUE (2026-09-02). Lu avec les commentaires et avec un
    // nom écrit en dur, ce témoin restait vert sur « Moi » grâce aux notes historiques des specs
    // (`glissement.spec.ts`, `guide.spec.ts`) : il ne mesurait plus rien. Un nom de région compte
    // ici s'il est CHERCHÉ, pas s'il est raconté ; et c'est le nom d'aujourd'hui qu'on cherche, pas
    // celui que ce fichier connaissait au moment où il a été écrit. Tant que les specs disent
    // encore « Moi », ce témoin est rouge : c'est le signal attendu, pas un défaut de la garde.
    const tout = readdirSync(resolve(RACINE_E2E, "e2e"), { encoding: "utf-8" })
      .filter((f) => f.endsWith(".ts"))
      .map((f) => sansCommentaires(readFileSync(resolve(RACINE_E2E, "e2e", f), "utf-8")))
      .join("\n");
    expect(NOMS.length, "aucun nom de région à chercher : le témoin ne mesure rien").toBeGreaterThan(0);
    for (const nom of NOMS) {
      expect(tout, `les specs ne cherchent plus « ${nom} »`).toContain(nom);
    }
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
