import { describe, it, expect } from "vitest";
import { codeDepartement, fuseauDeCommune, libelleLieu, normaliserLieu } from "@/lib/astro/lieux";
import {
  lieuxDepuisCatalogue,
  lieuxFrance,
  IDENTIFIANT_LIEUX_FRANCE,
  type CatalogueLieux,
} from "@/lib/astro/adapters/lieux-france";

/**
 * Story 5.3 (T2) — LE RÉFÉRENTIEL DES LIEUX DE NAISSANCE.
 *
 * ══ CE QUE CE FICHIER DOIT PROUVER, ET QUI N'EST PAS ÉVIDENT ═════════════════════════════════════
 *
 * Une table de fuseaux horaires écrite à la main est de la donnée FABRIQUÉE, au même titre qu'une
 * coordonnée écrite de mémoire — et elle échoue de la même façon : silencieusement, en produisant
 * un ascendant d'apparence normale. « America/Cayenne » et « America/Cayene » se ressemblent ; le
 * second n'existe pas, `Intl` jette, et `resoudreInstant` DÉGRADE proprement en `fuseau_invalide`.
 * Personne ne verrait jamais le défaut : la Guyane n'aurait simplement jamais d'ascendant.
 *
 * D'où le premier bloc : chaque identifiant de la table est confronté à la base de fuseaux de la
 * PLATEFORME (tzdb), et son décalage réel est mesuré à une date de référence. Ce qui serait sinon
 * « de mémoire » devient vérifié par quelque chose qui ne m'appartient pas.
 *
 * ══ LES HOMONYMES (retour du fondateur) ═══════════════════════════════════════════════════════════
 *
 * « Ville de naissance : plusieurs villes homonymes, comment départager ? Tu ne montres pas le
 * département (ex. Saint-Denis). » Mesuré sur le référentiel : 1 441 noms partagés, 3 675 communes
 * concernées. La couche de données répond par un `departement`, un `libelle` « Saint-Denis (93) »
 * et un classement par population — les blocs « département », « libellé » et « classement »
 * ci-dessous en sont la preuve, sur des catalogues minuscules d'abord (le classement se lit à l'œil
 * nu), puis sur le référentiel réel.
 */

const lieux = lieuxFrance();

/** Décalage réel d'un fuseau à un instant, en minutes — même méthode que `theme-natal.ts`. */
function decalageMinutes(instant: Date, fuseau: string): number {
  const p: Record<string, string> = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-US", {
    timeZone: fuseau,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant)) {
    p[type] = value;
  }
  const local = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24,
    Number(p.minute),
  );
  return Math.round((local - instant.getTime()) / 60000);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les fuseaux — confrontés à la base de fuseaux de la plateforme
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[T2/DUR] fuseauDeCommune — chaque identifiant existe VRAIMENT et décale comme il doit", () => {
  // Le 15 JANVIER : hors heure d'été partout dans l'hémisphère nord, donc les décalages sont ceux
  // de l'heure normale et se lisent sans piège.
  const janvier = new Date("1990-01-15T12:00:00Z");

  /** `[territoire, code INSEE, latitude, décalage attendu en minutes le 15 janvier]` */
  const cas: readonly [string, string, number, number][] = [
    ["Bordeaux", "33063", 44.84, 60], // Europe/Paris → UTC+1 en janvier
    ["Guadeloupe", "97105", 16.24, -240], // UTC−4
    ["Martinique", "97209", 14.6, -240], // UTC−4
    ["Guyane", "97302", 4.94, -180], // UTC−3
    ["La Réunion", "97411", -20.88, 240], // UTC+4
    ["Saint-Pierre-et-Miquelon", "97502", 46.79, -180], // UTC−3
    ["Mayotte", "97601", -12.78, 180], // UTC+3
    ["Saint-Barthélemy", "97701", 17.92, -240], // UTC−4
    ["Saint-Martin", "97801", 18.09, -240], // UTC−4
    ["Wallis-et-Futuna", "98613", -13.28, 720], // UTC+12
    ["Tahiti", "98735", -17.53, -600], // UTC−10
    ["Marquises", "98731", -8.68, -570], // UTC−9:30 — la demi-heure qui vaut 7,5° d'ascendant
    ["Gambier", "98719", -22.04, -540], // UTC−9
    ["Nouvelle-Calédonie", "98818", -22.27, 660], // UTC+11
  ];

  it.each(cas)("%s (%s) décale bien de %d minutes", (_territoire, code, latitude, attendu) => {
    const fuseau = fuseauDeCommune(code, latitude);
    expect(fuseau, `aucun fuseau pour ${code}`).not.toBeNull();
    expect(
      decalageMinutes(janvier, fuseau!),
      `« ${fuseau} » ne décale pas de ${attendu} min — identifiant faux ou territoire mal rangé`,
    ).toBe(attendu);
  });

  it("[LE PIÈGE] un fuseau inexistant serait accepté par le code et REFUSÉ par Intl", () => {
    // La preuve que le test ci-dessus n'est pas creux : voilà à quoi ressemble un échec.
    expect(() => decalageMinutes(janvier, "America/Cayene")).toThrow();
  });

  it("la métropole n'est PAS un défaut appliqué aux territoires ultramarins", () => {
    // Mutation-cible : `return "Europe/Paris"` en tête de fonction. Un Europe/Paris posé sur
    // Cayenne décale de 4 h, soit ~60° d'ascendant : deux signes, et rien n'échoue.
    for (const [code, lat] of [
      ["97302", 4.94],
      ["98735", -17.53],
      ["97411", -20.88],
    ] as const) {
      expect(fuseauDeCommune(code, lat)).not.toBe("Europe/Paris");
    }
    expect(fuseauDeCommune("75056", 48.86)).toBe("Europe/Paris");
    expect(fuseauDeCommune("2A004", 41.93), "la Corse est métropolitaine").toBe("Europe/Paris");
  });

  it("là où personne ne naît, on ne DEVINE pas un fuseau", () => {
    expect(fuseauDeCommune("98412", -49.24), "Kerguelen").toBeNull();
    expect(fuseauDeCommune("98901", 10.3), "Clipperton").toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le département — déduit du code INSEE
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[T2] codeDepartement — deux caractères, trois outre-mer, la Corse sans cas particulier", () => {
  /** `[code INSEE, département attendu]` */
  const cas: readonly [string, string][] = [
    ["93066", "93"], // Saint-Denis, Seine-Saint-Denis
    ["97411", "974"], // Saint-Denis, La Réunion
    ["2A004", "2A"], // Ajaccio — les lettres sont DÉJÀ dans les deux premiers caractères
    ["2B033", "2B"], // Bastia
    ["01001", "01"], // le zéro de tête survit : « 1 » ne désigne aucun département
    ["98735", "987"], // Papeete — 98x est aussi sur trois caractères, pas seulement 97x
  ];

  it.each(cas)("%s → %s", (code, attendu) => {
    expect(codeDepartement(code)).toBe(attendu);
  });

  it("[LE PIÈGE] l'outre-mer sur DEUX caractères désignerait un département qui n'existe pas", () => {
    // Mutation-cible : `slice(0, 2)` partout. « 97 » n'est le code d'aucun département — la
    // Guadeloupe (971) et La Réunion (974) se retrouveraient dans le même tiroir, et le libellé
    // « Saint-Denis (97) » ne départagerait plus rien.
    expect(codeDepartement("97411")).not.toBe("97");
    expect(codeDepartement("97105")).not.toBe(codeDepartement("97411"));
  });
});

describe("[T2] libelleLieu — le nom, puis le CODE du département entre parenthèses", () => {
  it("les deux Saint-Denis que le fondateur ne pouvait pas distinguer", () => {
    expect(libelleLieu("Saint-Denis", { code: "93", nom: "Seine-Saint-Denis" })).toBe("Saint-Denis (93)");
    expect(libelleLieu("Saint-Denis", { code: "974", nom: "La Réunion" })).toBe("Saint-Denis (974)");
  });

  it("la Corse garde sa lettre", () => {
    expect(libelleLieu("Ajaccio", { code: "2A", nom: "Corse-du-Sud" })).toBe("Ajaccio (2A)");
  });

  it("[ANTI-VACUITÉ] c'est le CODE qui est montré, pas le nom du département", () => {
    // Le nom reste disponible (`departement.nom`) pour une ligne secondaire ; le libellé, lui,
    // doit rester court — « Saint-Denis (Seine-Saint-Denis) » tiendrait mal sur un écran étroit.
    expect(libelleLieu("Saint-Denis", { code: "93", nom: "Seine-Saint-Denis" })).not.toContain("Seine-Saint-Denis");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// La normalisation
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[T2] normaliserLieu — les frontières de mots sont EFFACÉES (l'inverse de la prose)", () => {
  it("les trois graphies d'un même nom se rejoignent", () => {
    const attendu = normaliserLieu("Saint-Étienne");
    expect(normaliserLieu("saint etienne")).toBe(attendu);
    expect(normaliserLieu("SAINTETIENNE")).toBe(attendu);
    expect(normaliserLieu("St-Étienne"), "« St » n'est pas « Saint »").not.toBe(attendu);
  });

  it("les apostrophes et les articles collés ne bloquent rien", () => {
    expect(normaliserLieu("L'Haÿ-les-Roses")).toBe(normaliserLieu("lhay les roses"));
  });

  it("[PIÈGE 5.2] les LIGATURES sont traitées — `NFD` ne les décompose pas", () => {
    // Vérifié en Story 5.2 : `"œ".normalize("NFD")` rend `"œ"`. Sans le remplacement explicite,
    // la commune d'Œutrange resterait introuvable pour qui la tape sans ligature.
    expect(normaliserLieu("Œutrange")).toBe("oeutrange");
    expect("œ".normalize("NFD"), "si ceci change un jour, le remplacement devient inutile").toBe("œ");
  });

  it("les chiffres survivent (Paris 15e, arrondissements)", () => {
    expect(normaliserLieu("Lyon 3e Arrondissement")).toContain("3");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le classement des homonymes — sur des catalogues MINUSCULES, où l'ordre se lit à l'œil nu
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Les catalogues de ce bloc sont SYNTHÉTIQUES : quelques communes, des populations choisies pour
 * que chaque règle du classement soit la seule à pouvoir expliquer l'ordre obtenu. Les coordonnées
 * y sont sans importance (aucun ascendant n'en sort) ; seuls comptent le nom, le code et la
 * population. Le référentiel réel est éprouvé plus bas.
 */
const DEPARTEMENTS_DE_TEST: CatalogueLieux["departements"] = [
  ["11", "Aude"],
  ["30", "Gard"],
  ["33", "Gironde"],
  ["69", "Rhône"],
  ["93", "Seine-Saint-Denis"],
  ["974", "La Réunion"],
];

const catalogue = (communes: CatalogueLieux["communes"]): CatalogueLieux => ({
  communes,
  departements: DEPARTEMENTS_DE_TEST,
});

describe("[LE CŒUR] parPertinence — entre homonymes stricts, la plus PEUPLÉE d'abord", () => {
  // Les quatre Saint-Denis, avec les populations de la source. Rangés ici par code INSEE, qui est
  // EXACTEMENT l'ordre que rendait la première version — l'Aude (523 hab.) en tête, La Réunion
  // (155 634) en dernier. Si le test passe encore avec cet ordre-là, il ne prouve rien.
  const quatreSaintDenis = catalogue([
    ["Saint-Denis", "11339", 43.357, 2.2181, 523],
    ["Saint-Denis", "30247", 44.2359, 4.2475, 296],
    ["Saint-Denis", "93066", 48.9378, 2.3657, 149077],
    ["Saint-Denis", "97411", -20.9434, 55.4444, 155634],
  ]);

  it("974 (155 634) puis 93 (149 077) puis l'Aude (523) puis le Gard (296)", () => {
    const codes = lieuxDepuisCatalogue(quatreSaintDenis).chercher("Saint-Denis", 10).map((l) => l.code);
    expect(codes).toEqual(["97411", "93066", "11339", "30247"]);
    // …et l'ordre des codes seul aurait donné autre chose : c'est bien la population qui classe.
    expect(codes).not.toEqual([...codes].sort());
  });

  it("[DÉTERMINISME] à population ÉGALE, le code INSEE départage — quel que soit l'ordre du catalogue", () => {
    // Sans ce dernier critère, deux communes de même nom et de même population seraient rendues
    // dans l'ordre du fichier — stable en apparence, jusqu'à la prochaine régénération.
    const versionA = catalogue([
      ["Sainte-Colombe", "69204", 45.87, 4.87, 100],
      ["Sainte-Colombe", "33422", 44.98, -0.02, 100],
    ]);
    const versionB = catalogue([
      ["Sainte-Colombe", "33422", 44.98, -0.02, 100],
      ["Sainte-Colombe", "69204", 45.87, 4.87, 100],
    ]);
    const codes = (c: CatalogueLieux) => lieuxDepuisCatalogue(c).chercher("Sainte-Colombe", 5).map((l) => l.code);
    expect(codes(versionA)).toEqual(["33422", "69204"]);
    expect(codes(versionB)).toEqual(codes(versionA));
  });

  it("[ANTI-VACUITÉ] un composé PLUS PEUPLÉ ne passe pas devant le nom exact", () => {
    // « Saint-Denis-de-Pile » commence par la saisie, mais c'est un composé : le nom le plus court
    // reste devant, même avec dix fois plus d'habitants. La population ne départage QU'À nom de
    // même longueur — sinon « Saint-Denis » (Gard, 296 hab.) disparaîtrait derrière tous ses
    // composés, et une femme née là devrait faire défiler la liste pour se trouver.
    const c = catalogue([
      ["Saint-Denis-de-Pile", "33411", 44.99, -0.2, 999999],
      ["Saint-Denis", "30247", 44.2359, 4.2475, 296],
    ]);
    expect(lieuxDepuisCatalogue(c).chercher("Saint-Denis", 5).map((l) => l.code)).toEqual(["30247", "33411"]);
  });

  it("[ANTI-VACUITÉ] ce qui COMMENCE par la saisie passe avant ce qui la contient, population ou pas", () => {
    // « Bordeaux-Saint-Clair » contient « saint » ; « Saint-Denis » commence par. Le groupe
    // « commence par » prime, quelle que soit la population — le tri par population n'a jamais le
    // droit de traverser cette frontière.
    const c = catalogue([
      ["Bordeaux-Saint-Clair", "33063", 44.86, -0.58, 999999],
      ["Saint-Denis", "30247", 44.2359, 4.2475, 296],
    ]);
    expect(lieuxDepuisCatalogue(c).chercher("saint", 5).map((l) => l.code)).toEqual(["30247", "33063"]);
  });

  it("chaque lieu rendu porte département, population et libellé COHÉRENTS avec son code", () => {
    const [reunion, seineSaintDenis] = lieuxDepuisCatalogue(quatreSaintDenis).chercher("Saint-Denis", 2);
    expect(reunion).toMatchObject({
      code: "97411",
      population: 155634,
      departement: { code: "974", nom: "La Réunion" },
      libelle: "Saint-Denis (974)",
      fuseau: "Indian/Reunion",
    });
    expect(seineSaintDenis).toMatchObject({
      code: "93066",
      population: 149077,
      departement: { code: "93", nom: "Seine-Saint-Denis" },
      libelle: "Saint-Denis (93)",
      fuseau: "Europe/Paris",
    });
    // Le nom OFFICIEL, lui, ne change pas : c'est lui qui est gravé aujourd'hui (`lieu_naissance`).
    expect(reunion.nom).toBe("Saint-Denis");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// L'adaptateur
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[T2] lieuxFrance — le référentiel réel", () => {
  it("[CONTRÔLE DU CONTRÔLE] le catalogue est chargé et il est massif", () => {
    // Sans cette assertion, un fichier de données tronqué (ou un import qui rend `{}`) rendrait
    // toutes les recherches vides — et toutes les assertions d'absence ci-dessous seraient vraies
    // pour rien. Le référentiel officiel compte ~35 000 communes.
    expect(lieux.chercher("a", 5), "une saisie d'un caractère ne cherche pas").toEqual([]);
    expect(lieux.chercher("saint", 20000).length).toBeGreaterThan(2000);
  });

  it("trouve une grande ville, avec ses coordonnées et son fuseau", () => {
    const [bordeaux] = lieux.chercher("Bordeaux", 1);
    expect(bordeaux.nom).toBe("Bordeaux");
    expect(bordeaux.code).toBe("33063");
    expect(bordeaux.fuseau).toBe("Europe/Paris");
    // Bordeaux est à ~44,84° N et ~0,58° O. On vérifie l'ordre de grandeur ET LE SIGNE : une
    // longitude prise pour une latitude (ou l'inverse) est l'erreur classique du GeoJSON, où les
    // coordonnées sont écrites [lon, lat] — et elle produit un ascendant parfaitement plausible.
    expect(bordeaux.latitude).toBeCloseTo(44.84, 1);
    expect(bordeaux.longitude).toBeCloseTo(-0.58, 1);
  });

  it("[DUR] latitude et longitude ne sont pas inversées, sur tout le référentiel", () => {
    // La France métropolitaine est entre 41° et 51° de latitude et entre −5° et 10° de longitude.
    // Une inversion globale ferait sortir toutes les latitudes de la plage.
    for (const nom of ["Lille", "Marseille", "Brest", "Strasbourg"]) {
      const [l] = lieux.chercher(nom, 1);
      expect(l.latitude, `${nom} : latitude hors de France`).toBeGreaterThan(41);
      expect(l.latitude).toBeLessThan(52);
      expect(l.longitude, `${nom} : longitude hors de France`).toBeGreaterThan(-5);
      expect(l.longitude).toBeLessThan(10);
    }
  });

  it("la ville elle-même passe AVANT ses composés", () => {
    expect(lieux.chercher("Nancy", 1)[0].nom).toBe("Nancy");
    expect(lieux.chercher("Lyon", 1)[0].nom).toBe("Lyon");
  });

  it("accents, tirets et casse ne changent rien au résultat", () => {
    const a = lieux.chercher("Saint-Étienne", 1)[0];
    const b = lieux.chercher("saint etienne", 1)[0];
    expect(a.code).toBe(b.code);
  });

  it("ce qui n'existe pas rend un tableau VIDE, jamais un lieu approchant", () => {
    // Un « à peu près » ici serait une naissance placée ailleurs sur Terre, gravée write-once.
    expect(lieux.chercher("Reykjavik", 5)).toEqual([]);
    expect(lieux.chercher("zzzzzzqqq", 5)).toEqual([]);
  });

  it("[DÉTERMINISME] deux recherches identiques rendent le même ordre", () => {
    const a = lieux.chercher("Saint-Martin", 10).map((l) => l.code);
    const b = lieux.chercher("Saint-Martin", 10).map((l) => l.code);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(1);
  });

  it("la limite est respectée", () => {
    expect(lieux.chercher("saint", 7)).toHaveLength(7);
    expect(lieux.chercher("saint", 0)).toEqual([]);
  });

  it("[DUR] aucune commune SANS fuseau ne peut être choisie", () => {
    // Mutation-cible : retirer le `continue` de `construireIndex`. Une commune proposable mais
    // dépourvue de fuseau ferait vivre le refus APRÈS un geste irréversible.
    expect(lieux.chercher("Kerguelen", 5)).toEqual([]);
    expect(lieux.chercher("Clipperton", 5)).toEqual([]);
    // …et les territoires qui ONT un fuseau restent, eux, parfaitement atteignables.
    expect(lieux.chercher("Papeete", 1)[0].fuseau).toBe("Pacific/Tahiti");
    expect(lieux.chercher("Nuku-Hiva", 1)[0].fuseau).toBe("Pacific/Marquesas");
  });

  it("[T7] trouverParCode résout EXACTEMENT, là où `chercher` interroge le nom", () => {
    // ⚠️ Cette méthode n'existait pas : le point d'écriture résolvait le code choisi par
    // `chercher(code)`. Aucune commune ne s'appelle « 33063 » — le formulaire refusait donc TOUTES
    // les saisies valides. Trouvé par `tests/heure-naissance-actions.test.ts`, pas à la lecture.
    const l = lieux.trouverParCode("33063");
    expect(l?.nom).toBe("Bordeaux");
    expect(l?.fuseau).toBe("Europe/Paris");
    // …et la preuve que les deux opérations sont bien distinctes :
    expect(lieux.chercher("33063", 5), "`chercher` ne devrait rien trouver sur un code").toEqual([]);
  });

  it("[T7/DUR] un code inconnu rend `null`, jamais une commune approchante", () => {
    expect(lieux.trouverParCode("99999")).toBeNull();
    expect(lieux.trouverParCode("")).toBeNull();
    expect(lieux.trouverParCode("3306")).toBeNull();
  });

  it("[T7/DUR] les communes SANS fuseau sont introuvables par code AUSSI", () => {
    // Deux sources (recherche / résolution) auraient fini par diverger, et la divergence aurait
    // laissé graver — irréversiblement — un lieu que l'interface ne propose jamais.
    expect(lieux.trouverParCode("98412"), "Kerguelen").toBeNull();
    expect(lieux.trouverParCode("98901"), "Clipperton").toBeNull();
    // Contre-exemple : un territoire ultramarin AVEC fuseau reste résoluble.
    expect(lieux.trouverParCode("97302")?.fuseau).toBe("America/Cayenne");
  });

  it("[LE CŒUR] les quatre Saint-Denis du référentiel réel : du plus peuplé au moins peuplé, chacun avec son département", () => {
    // Le cas du fondateur, sur les données de geo.api.gouv.fr. Les populations exactes bougent à
    // chaque recensement : on vérifie l'ORDRE et les départements, et que la population décroît.
    const quatre = lieux.chercher("Saint-Denis", 4);
    expect(quatre.map((l) => [l.code, l.libelle, l.departement.nom])).toEqual([
      ["97411", "Saint-Denis (974)", "La Réunion"],
      ["93066", "Saint-Denis (93)", "Seine-Saint-Denis"],
      ["11339", "Saint-Denis (11)", "Aude"],
      ["30247", "Saint-Denis (30)", "Gard"],
    ]);
    for (let i = 1; i < quatre.length; i++) {
      expect(quatre[i - 1].population).toBeGreaterThan(quatre[i].population);
    }
    // …et les composés (« Saint-Denis-de-Pile », « Saint-Denis-lès-Bourg »…) viennent APRÈS.
    expect(lieux.chercher("Saint-Denis", 5)[4].nom).not.toBe("Saint-Denis");
  });

  it("[DUR] chaque commune proposable porte un département NOMMÉ et un libellé cohérent", () => {
    // Mutation-cible : un référentiel régénéré sans les collectivités d'outre-mer (l'endpoint
    // `/departements` ne les liste pas). Papeete, Nouméa ou Saint-Pierre auraient alors un
    // `departement.nom` vide — et l'adaptateur ne les SAUTE pas (voir `construireIndex`), donc
    // seul ce test le verrait.
    const echantillon = [
      ...lieux.chercher("saint", 20000), // > 2 000 communes, tous départements confondus
      ...["33063", "2A004", "2B033", "97502", "97701", "97801", "98613", "98735", "98818", "97611"].map(
        (code) => lieux.trouverParCode(code)!,
      ),
    ];
    expect(echantillon.length).toBeGreaterThan(2000);
    for (const l of echantillon) {
      expect(l.departement.code, `${l.code} : code de département`).toBe(codeDepartement(l.code));
      expect(l.departement.nom, `${l.code} : département sans nom`).not.toBe("");
      expect(l.libelle, `${l.code} : libellé`).toBe(libelleLieu(l.nom, l.departement));
      expect(l.population, `${l.code} : population`).toBeGreaterThanOrEqual(0);
    }
  });

  it("les départements et collectivités sont NOMMÉS d'après la source, Corse et outre-mer compris", () => {
    const nom = (code: string) => lieux.trouverParCode(code)?.departement;
    expect(nom("33063")).toEqual({ code: "33", nom: "Gironde" });
    expect(nom("2A004")).toEqual({ code: "2A", nom: "Corse-du-Sud" });
    expect(nom("2B033")).toEqual({ code: "2B", nom: "Haute-Corse" });
    expect(nom("97411")).toEqual({ code: "974", nom: "La Réunion" });
    // Ceux que `/departements` ne liste PAS — ils viennent du champ `departement` des communes.
    expect(nom("97502")).toEqual({ code: "975", nom: "Saint-Pierre-et-Miquelon" });
    expect(nom("98735")).toEqual({ code: "987", nom: "Polynésie française" });
    expect(nom("98818")).toEqual({ code: "988", nom: "Nouvelle-Calédonie" });
  });

  it("la population vient de la source, et une grande ville en a une", () => {
    // Bordeaux compte ~260 000 habitants. Un `0` partout (champ oublié dans la requête) rendrait le
    // classement par population inerte — et les quatre Saint-Denis reviendraient dans l'ordre des
    // codes, sans qu'aucun autre test de ce bloc ne rougisse.
    expect(lieux.trouverParCode("33063")!.population).toBeGreaterThan(200000);
  });

  it("l'identifiant nomme la SOURCE (il entrera dans la traçabilité du lieu choisi)", () => {
    expect(lieux.identifiant).toBe(IDENTIFIANT_LIEUX_FRANCE);
    expect(lieux.identifiant).toMatch(/geo\.api\.gouv\.fr/);
  });
});
