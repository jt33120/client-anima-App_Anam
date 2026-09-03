import { describe, it, expect } from "vitest";
import {
  ARC_DESIGN_DEGRES,
  CANAUX,
  CENTRES_MOTEURS,
  LARGEUR_LIGNE_DEGRES,
  LARGEUR_PORTE_DEGRES,
  ORIGINE_ROUE_DEGRES,
  PORTES_PAR_CENTRE,
  PORTES_ROUE,
  autoriteDuTheme,
  calculerHumanDesign,
  centreDeLaPorte,
  instantDeDesign,
  positionSurLaRoue,
  typeDuTheme,
  type NomCentre,
  type NumeroPorte,
} from "@/lib/astro/human-design";
import { ephemerideAstronomyEngine } from "@/lib/astro/adapters/astronomy-engine";
import type { EphemerisPort } from "@/lib/astro/port";

/**
 * LE CALCUL DU HUMAN DESIGN (2026-09-03).
 *
 * ── CE QUI PEUT ÊTRE FAUX SANS QUE RIEN NE PLANTE ──────────────────────────────────────────────
 *
 * Tout, dans ce système, est une TABLE RECOPIÉE : l'ordre des 64 portes autour du zodiaque, les 36
 * canaux, la répartition des portes entre les neuf centres. Une erreur de recopie ne lève aucune
 * exception — elle rend un thème parfaitement formé et faux, que personne ne peut distinguer d'un
 * thème juste en le lisant.
 *
 * Ce fichier est donc bâti sur des ANCRES EXTÉRIEURES plutôt que sur la cohérence interne :
 *
 *   • trois bornes canoniques de la roue, connues du système et vérifiables dans n'importe quelle
 *     source (porte 41 à 2° du Verseau, porte 25 à 358°15', porte 1 à 13°15' du Scorpion) ;
 *   • la complétude : 64 portes distinctes sur la roue, 64 dans les centres, sans reste ni doublon ;
 *   • la cohérence des canaux avec les centres : aucun canal ne boucle sur son propre centre ;
 *   • les règles de type et d'autorité, éprouvées sur des cartes CONSTRUITES, pas tirées d'un thème
 *     réel — un thème réel ferait passer le test pour un oracle qu'il n'est pas.
 */

describe("[LE CŒUR] la roue tombe sur ses bornes canoniques", () => {
  /** Le début, en degrés, de la porte à l'index donné de la roue. */
  const debutDe = (porte: NumeroPorte) =>
    (ORIGINE_ROUE_DEGRES + PORTES_ROUE.indexOf(porte) * LARGEUR_PORTE_DEGRES) % 360;

  it("la porte 41 ouvre la roue à 2°00' du Verseau", () => {
    // C'est le repère fondateur du mandala : tout le reste en découle.
    expect(PORTES_ROUE[0]).toBe(41);
    expect(debutDe(41)).toBeCloseTo(302, 6);
  });

  it("la porte 25 commence à 358°15', donc à cheval sur l’équinoxe", () => {
    // 358°15' = 358,25°. Une roue décalée d'un seul cran donnerait 352,625 ou 363,875 : l'ancre
    // est assez fine pour attraper un décalage d'une porte, ce qu'un « ça a l'air bon » ne fait pas.
    expect(debutDe(25)).toBeCloseTo(358.25, 6);
  });

  it("la porte 1 commence à 13°15' du Scorpion", () => {
    expect(debutDe(1)).toBeCloseTo(223.25, 6);
  });

  it("[ANTI-VACUITÉ] les trois ancres ne sont pas la même porte", () => {
    // Sans ce témoin, un `debutDe` cassé qui rendrait toujours la même valeur ferait passer les
    // trois assertions ci-dessus si la valeur tombait juste une fois.
    expect(new Set([debutDe(41), debutDe(25), debutDe(1)]).size).toBe(3);
  });
});

describe("[LE CŒUR] la roue et les centres sont complets, sans reste ni doublon", () => {
  it("64 portes distinctes sur la roue, numérotées de 1 à 64", () => {
    expect(PORTES_ROUE).toHaveLength(64);
    expect(new Set(PORTES_ROUE).size).toBe(64);
    expect([...PORTES_ROUE].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 64 }, (_, i) => i + 1),
    );
  });

  it("les neuf centres se partagent les 64 portes, chacune une seule fois", () => {
    const toutes = Object.values(PORTES_PAR_CENTRE).flat();
    expect(toutes).toHaveLength(64);
    expect(new Set(toutes).size, "une porte est dans deux centres").toBe(64);
    expect([...toutes].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
  });

  it("les quatre moteurs sont des centres connus", () => {
    for (const moteur of CENTRES_MOTEURS) {
      expect(Object.keys(PORTES_PAR_CENTRE)).toContain(moteur);
    }
    expect(CENTRES_MOTEURS).toHaveLength(4);
  });
});

describe("[LE CŒUR] les 36 canaux relient bien deux centres distincts", () => {
  it("ils sont 36, et chaque porte citée existe", () => {
    expect(CANAUX).toHaveLength(36);
    for (const [a, b] of CANAUX) {
      expect(PORTES_ROUE, `porte ${a} hors roue`).toContain(a);
      expect(PORTES_ROUE, `porte ${b} hors roue`).toContain(b);
    }
  });

  it("[LE BORD] aucun canal ne boucle sur son propre centre", () => {
    // Un canal dont les deux extrémités sont dans le même centre ne relierait rien : il définirait
    // ce centre tout seul, et passerait pourtant les deux tests ci-dessus.
    const bouclants = CANAUX.filter(([a, b]) => centreDeLaPorte(a) === centreDeLaPorte(b));
    expect(bouclants, `canaux internes à un centre : ${JSON.stringify(bouclants)}`).toEqual([]);
  });

  it("aucun canal n’est écrit deux fois", () => {
    const cles = CANAUX.map(([a, b]) => [a, b].sort((x, y) => x - y).join("-"));
    expect(new Set(cles).size).toBe(36);
  });
});

describe("[LE CŒUR] une longitude tombe dans la bonne porte et la bonne ligne", () => {
  it("l’origine exacte est la ligne 1 de la porte 41", () => {
    expect(positionSurLaRoue(ORIGINE_ROUE_DEGRES)).toEqual({ porte: 41, ligne: 1 });
  });

  it("les six lignes se succèdent dans une porte", () => {
    for (let ligne = 1; ligne <= 6; ligne++) {
      const longitude = ORIGINE_ROUE_DEGRES + (ligne - 1) * LARGEUR_LIGNE_DEGRES + 0.01;
      expect(positionSurLaRoue(longitude), `ligne ${ligne}`).toEqual({ porte: 41, ligne });
    }
  });

  it("[LE BORD] la toute fin d’une porte reste en ligne 6, jamais en ligne 7", () => {
    // Mutation-cible : retirer le `min(…, 5)`. Le flottant à un milliardième sous la borne rend une
    // ligne 7, qui n'existe pas — et le profil affiché deviendrait « 7/2 ».
    const finDe41 = ORIGINE_ROUE_DEGRES + LARGEUR_PORTE_DEGRES - 1e-12;
    expect(positionSurLaRoue(finDe41)).toEqual({ porte: 41, ligne: 6 });
  });

  it("[LE BORD] le passage par 0° ne casse pas la roue", () => {
    // La porte 25 est à cheval sur l'équinoxe : 359° et 1° doivent y tomber tous les deux.
    expect(positionSurLaRoue(359).porte).toBe(25);
    expect(positionSurLaRoue(1).porte).toBe(25);
  });

  it("[ANTI-VACUITÉ] deux longitudes éloignées ne donnent pas la même porte", () => {
    expect(positionSurLaRoue(10).porte).not.toBe(positionSurLaRoue(200).porte);
  });
});

describe("[LE CŒUR] le type se déduit des centres et de la connexion à la gorge", () => {
  /** Une carte construite : on nomme les canaux, les centres s'en déduisent comme en vrai. */
  const centresDe = (canaux: readonly (readonly [NumeroPorte, NumeroPorte])[]): NomCentre[] =>
    (Object.keys(PORTES_PAR_CENTRE) as NomCentre[]).filter((centre) =>
      canaux.some(([a, b]) => centreDeLaPorte(a) === centre || centreDeLaPorte(b) === centre),
    );

  it("aucun centre défini : réflecteur", () => {
    expect(typeDuTheme([], [])).toBe("reflecteur");
  });

  it("sacral défini sans lien à la gorge : générateur", () => {
    // 5-15 : sacral (5) au centre de l'identité (15). Aucun contact avec la gorge.
    const canaux = [[5, 15]] as const;
    expect(typeDuTheme(centresDe(canaux), canaux)).toBe("generateur");
  });

  it("sacral relié à la gorge : générateur manifesteur", () => {
    // 20-34 : la gorge (20) au sacral (34), en un seul canal.
    const canaux = [[20, 34]] as const;
    expect(typeDuTheme(centresDe(canaux), canaux)).toBe("generateur_manifesteur");
  });

  it("moteur non sacral relié à la gorge : manifesteur", () => {
    // 21-45 : le cœur (21) à la gorge (45).
    const canaux = [[21, 45]] as const;
    expect(typeDuTheme(centresDe(canaux), canaux)).toBe("manifesteur");
  });

  it("centres définis sans moteur relié à la gorge : projecteur", () => {
    // 17-62 : ajna (17) à la gorge (62). L'ajna n'est pas un moteur.
    const canaux = [[17, 62]] as const;
    expect(typeDuTheme(centresDe(canaux), canaux)).toBe("projecteur");
  });

  it("[LE CŒUR] un moteur relié à la gorge PAR UN AUTRE CENTRE compte", () => {
    // Racine (19) → plexus solaire (49), puis plexus solaire (22) → gorge (12). Aucun canal ne
    // touche à la fois un moteur et la gorge, et pourtant le thème est un manifesteur.
    //
    // Mutation-cible : remplacer le parcours de graphe par un simple voisinage. Ce cas basculerait
    // en projecteur, et le type est la première chose que le système dit de quelqu'un.
    const canaux = [
      [19, 49],
      [12, 22],
    ] as const;
    expect(centresDe(canaux)).toContain("racine");
    expect(typeDuTheme(centresDe(canaux), canaux)).toBe("manifesteur");
  });
});

describe("[LE CŒUR] l’autorité suit un ordre de priorité, et l’ordre EST la règle", () => {
  it("le plexus solaire l’emporte sur le sacral", () => {
    // Mutation-cible : intervertir les deux premiers `if`. Le thème le plus courant du système
    // (générateur émotionnel) recevrait une autorité sacrale, c'est-à-dire l'inverse de sa règle
    // de décision.
    expect(autoriteDuTheme(["plexus_solaire", "sacral"])).toBe("emotionnelle");
  });

  it("chaque marche de l’escalier est atteignable", () => {
    expect(autoriteDuTheme(["sacral", "rate"])).toBe("sacrale");
    expect(autoriteDuTheme(["rate", "coeur"])).toBe("splenique");
    expect(autoriteDuTheme(["coeur", "identite"])).toBe("ego");
    expect(autoriteDuTheme(["identite", "gorge"])).toBe("auto_projetee");
    expect(autoriteDuTheme(["gorge", "ajna"])).toBe("mentale");
  });

  it("[LE BORD] aucun centre défini : autorité lunaire, celle du réflecteur", () => {
    expect(autoriteDuTheme([])).toBe("lunaire");
  });
});

describe("[LE CŒUR] l’instant de design est un arc, pas un nombre de jours", () => {
  const ephemeride = ephemerideAstronomyEngine();

  it("le Soleil y est bien à 88° avant sa position de naissance", () => {
    const naissance = new Date("1990-06-15T08:30:00Z");
    const design = instantDeDesign(naissance, ephemeride);
    expect(design, "l’instant de design n’a pas convergé").not.toBeNull();

    const lire = (t: Date) => {
      const l = ephemeride.longitudeEcliptique("soleil", t);
      return l.statut === "calcule" ? l.longitude : NaN;
    };
    const ecart = ((lire(naissance) - lire(design!) + 360) % 360);
    expect(ecart).toBeCloseTo(ARC_DESIGN_DEGRES, 4);
  });

  it("[LE BORD] l’écart en JOURS varie avec la saison — c’est pourquoi on itère", () => {
    // Mutation-cible : remplacer l'itération par « naissance moins 88 jours ». Ces deux thèmes
    // tombent de part et d'autre de l'orbite terrestre, et l'écart entre eux dépasse une journée,
    // soit plus d'une ligne — et parfois une porte.
    const jours = (naissance: Date) =>
      (naissance.getTime() - instantDeDesign(naissance, ephemeride)!.getTime()) / 86_400_000;
    const hiver = jours(new Date("1990-01-10T12:00:00Z"));
    const ete = jours(new Date("1990-07-10T12:00:00Z"));
    expect(Math.abs(hiver - ete)).toBeGreaterThan(1);
  });

  it("[LE BORD] une éphéméride muette rend `null`, et ne boucle pas", () => {
    const muette = {
      identifiant: "muette",
      longitudeEcliptique: () => ({ statut: "non_calcule", raison: "hors_plage_ephemeride" }) as const,
      tempsSideralGreenwich: () => 0,
      obliquiteVraie: () => 23.44,
    } as unknown as EphemerisPort;
    expect(instantDeDesign(new Date("1990-06-15T08:30:00Z"), muette)).toBeNull();
  });
});

describe("[LE BORD] sans l’heure de naissance, il n’y a pas de thème", () => {
  const ephemeride = ephemerideAstronomyEngine();

  it("le calcul refuse, il ne rend pas un thème plausible", () => {
    // Une ligne fait 23 heures d'arc solaire : sans l'heure, la moitié du profil est un tirage à
    // pile ou face. Un thème « à midi » se lit exactement comme un thème juste.
    const sansHeure = calculerHumanDesign({ date: "1990-06-15", fuseau: "Europe/Paris" }, ephemeride);
    expect(sansHeure).toEqual({ statut: "indisponible", raison: "heure_inconnue" });
  });

  it("[ANTI-VACUITÉ] avec l’heure, il calcule vraiment", () => {
    const avecHeure = calculerHumanDesign(
      { date: "1990-06-15", heure: "08:30", fuseau: "Europe/Paris", latitude: 48.85, longitude: 2.35 },
      ephemeride,
    );
    expect(avecHeure.statut).toBe("calcule");
    if (avecHeure.statut !== "calcule") return;

    const theme = avecHeure.theme;
    // Vingt-six activations : treize corps sur chacune des deux roues.
    expect(theme.activations).toHaveLength(26);
    expect(theme.activations.filter((a) => a.roue === "personnalite")).toHaveLength(13);
    expect(theme.activations.filter((a) => a.roue === "design")).toHaveLength(13);

    // La Terre est toujours à l'opposé du Soleil : leurs portes ne peuvent pas être la même.
    for (const roue of ["personnalite", "design"] as const) {
      const soleil = theme.activations.find((a) => a.roue === roue && a.corps === "soleil")!;
      const terre = theme.activations.find((a) => a.roue === roue && a.corps === "terre")!;
      expect(soleil.porte, `${roue} : Soleil et Terre dans la même porte`).not.toBe(terre.porte);
    }

    // Le profil est fait de deux lignes réelles, et le type est l'un des cinq.
    expect([1, 2, 3, 4, 5, 6]).toContain(theme.profil.personnalite);
    expect([1, 2, 3, 4, 5, 6]).toContain(theme.profil.design);
    expect([
      "generateur",
      "generateur_manifesteur",
      "manifesteur",
      "projecteur",
      "reflecteur",
    ]).toContain(theme.type);

    // Les centres définis découlent des canaux, jamais l'inverse.
    for (const centre of theme.centresDefinis) {
      expect(
        theme.canauxDefinis.some(
          ([a, b]) => centreDeLaPorte(a) === centre || centreDeLaPorte(b) === centre,
        ),
        `centre « ${centre} » défini sans canal`,
      ).toBe(true);
    }
  });

  it("[LE BORD] le thème ne porte aucun champ de texte", () => {
    // Même garde que `ThemeNatal` et `HoroscopeDuJour` : que des nombres et des énumérations, donc
    // aucun endroit où une prédiction pourrait s'écrire (FR-053). Le SENS vit dans le corpus.
    const avecHeure = calculerHumanDesign(
      { date: "1990-06-15", heure: "08:30", fuseau: "Europe/Paris" },
      ephemeride,
    );
    if (avecHeure.statut !== "calcule") throw new Error("le thème doit être calculable");
    const serialise = JSON.stringify(avecHeure.theme);
    // Aucune phrase : pas d'espace entre deux mots de plus de trois lettres hors des clés connues.
    expect(serialise).not.toMatch(/"[^"]*\s[a-zà-ÿ]{4,}\s[a-zà-ÿ]{4,}/i);
  });
});
