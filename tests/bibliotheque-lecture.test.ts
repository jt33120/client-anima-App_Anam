import { CATALOGUE_CARTES } from "@/lib/domain/bibliotheque";
import { LIEN_AJOUTER } from "@/lib/domain/copie-naissance";
import { calculerThemeNatal, type EntreesNaissance } from "@/lib/astro/theme-natal";
import { ephemerideAstronomyEngine } from "@/lib/astro/adapters/astronomy-engine";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * bibliotheque-lecture.test.ts — LA COMPOSITION SERVEUR DE L'ACCUEIL (Story 5.6, T4).
 *
 * Deux propriétés s'y jouent, et **aucune des deux ne se voit à l'exécution** :
 *
 *   1. `lireThemeNatal` n'est appelé QU'UNE FOIS. Deux appels rendraient le même thème — donc rien
 *      ne les distinguerait à l'écran. Ce qui les distingue, c'est le COÛT (~663 lectures
 *      d'éphéméride au premier calcul dans le cas dégradé) et l'ÉCRITURE tentée deux fois, en
 *      concurrence, dans le même `Promise.all` que `chargerProjectionArbre`.
 *
 *   2. L'échec d'une lecture n'emporte pas les autres. Une carte vide, jamais un accueil vide —
 *      c'est la leçon de la revue 5.4/B4 (un chemin fragile placé en amont d'un chemin robuste).
 */

const lireThemeNatal = vi.fn();
const lireNumerologie = vi.fn();
const lireEnneagramme = vi.fn();
const lireTentativeEnneagramme = vi.fn();

vi.mock("@/lib/data/depot-theme-natal", () => ({
  lireThemeNatal: (...a: unknown[]) => lireThemeNatal(...a),
}));
vi.mock("@/lib/data/lire-numerologie", () => ({
  lireNumerologie: (...a: unknown[]) => lireNumerologie(...a),
  anneeCouranteParis: () => 2026,
}));
vi.mock("@/lib/data/lire-enneagramme", () => ({
  lireEnneagramme: (...a: unknown[]) => lireEnneagramme(...a),
  lireTentativeEnneagramme: (...a: unknown[]) => lireTentativeEnneagramme(...a),
}));
// ⚠️ LE SOCLE RESTE RÉEL, SAUF QUAND UN TEST LE FAIT TOMBER (E3-S5). `lireSocleQuotidien` porte son
// propre `try` : une panne du thème ou de l'horoscope ne la fait pas lever. Le seul chemin qui
// atteint le `try` EXTERNE de `lireBibliotheque` est une panne du socle lui-même, et c'est le seul
// chemin où une valeur par défaut compte. Sans ce crochet, ce chemin resterait inobservable.
const socleQuotidien = vi.fn();
vi.mock("@/lib/data/lire-quotidien", async (importOriginal) => {
  const reel = await importOriginal<typeof import("@/lib/data/lire-quotidien")>();
  socleQuotidien.mockImplementation(reel.lireSocleQuotidien);
  return {
    ...reel,
    lireSocleQuotidien: (...a: Parameters<typeof reel.lireSocleQuotidien>) => socleQuotidien(...a),
  };
});
const { lireBibliotheque } = await import("@/lib/data/lire-bibliotheque");

const SUPABASE = {} as never;
const UID = "11111111-1111-4111-8111-111111111111";
const MAINTENANT = new Date("2026-08-14T10:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  lireThemeNatal.mockResolvedValue({ statut: "indisponible", raison: "naissance_absente" });
  lireNumerologie.mockResolvedValue({ statut: "indisponible", raison: "naissance_absente" });
  lireEnneagramme.mockResolvedValue({ statut: "indisponible", raison: "sans_type" });
  lireTentativeEnneagramme.mockResolvedValue({ statut: "indisponible", raison: "aucune" });
});

describe("[5.6/T4] le thème natal est lu UNE SEULE FOIS", () => {
  it("[LE TEST QUI COMPTE] sans thème fourni, exactement un appel — jamais deux", () => {
    return lireBibliotheque(SUPABASE, UID, MAINTENANT, false).then(() => {
      expect(
        lireThemeNatal.mock.calls.length,
        "deux appels = deux calculs concurrents et deux écritures en course (piège P10)",
      ).toBe(1);
    });
  });

  it("[LE TEST QUI COMPTE] quand la PAGE l’a déjà lu, ZÉRO appel", async () => {
    // C'est le cas réel depuis la 5.6 : `app/page.tsx` lit le thème une fois et le passe aux deux
    // consommateurs (`chargerProjectionArbre` et cette lecture), qui sont dans le même `Promise.all`.
    await lireBibliotheque(SUPABASE, UID, MAINTENANT, false, undefined, {
      statut: "indisponible",
      raison: "naissance_absente",
    });
    expect(lireThemeNatal).not.toHaveBeenCalled();
  });
});

describe("[5.6/AC7] l’échec d’une lecture n’emporte jamais les autres", () => {
  it("toutes les cartes du catalogue sont là même quand TOUT est indisponible", async () => {
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    // ⚠️ ON LIT LE CATALOGUE, ON NE LE RECOPIE PLUS. Cette liste était écrite à la main et
    // portait « theme » et « nombres », partis le 2026-08-25 (Story 7.7). Une liste recopiée
    // devient fausse au premier changement — et, pire, elle transforme un déplacement voulu en
    // échec de test qu'on est tenté de « réparer » sans lire la décision derrière.
    expect(b.cartes.map((c) => c.cle).sort()).toEqual([...CATALOGUE_CARTES].sort());
    // ⚠️ ELLE ATTENDAIT `enAvant === null`, ce qui n'était vrai QUE parce que le corpus était vide.
    // Le mantra du jour ne demande rien à personne (T7/AC6) : depuis que les soixante textes sont
    // écrits, il est présentable même quand tout le reste est en panne — c'est même exactement le
    // service qu'on attend de lui. Ce qui doit tenir n'a pas bougé : la mise en avant tombe sur une
    // carte PRÉSENTABLE, ou sur rien. Jamais sur une carte qui n'a rien à montrer.
    //
    // ⚠️ ET LA PRÉSENTABILITÉ EST RECALCULÉE ICI, PAS DEMANDÉE À LA PRODUCTION. Une première version
    // appelait `estPresentable` pour décider ce qui est correct — donc elle prenait pour arbitre la
    // fonction même qu'elle surveille. La campagne de mutation l'a dit tout de suite : `estPresentable`
    // remplacée par `return true` SURVIVAIT, puisque le test la croyait sur parole.
    const aDeQuoiMontrer = (c: (typeof b.cartes)[number]) =>
      c.faits.length > 0 || c.texte.statut === "ecrit";
    const presentables = b.cartes.filter(aDeQuoiMontrer).map((c) => c.cle);
    if (b.enAvant === null) {
      expect(presentables, "rien en avant alors qu'une carte avait de quoi").toEqual([]);
    } else {
      expect(presentables, "la carte du jour n'a rien à montrer").toContain(b.enAvant);
    }
  });

  it("[LE TEST QUI COMPTE] une panne d’horoscope ne fait pas disparaître l’ennéagramme", async () => {
    lireNumerologie.mockRejectedValue(new Error("timeout"));
    lireEnneagramme.mockResolvedValue({
      statut: "calcule",
      type: 4,
      origine: "test",
      texte: { statut: "non_ecrit" },
    });
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(b.cartes).toHaveLength(CATALOGUE_CARTES.length);
    const e9 = b.cartes.find((c) => c.cle === "enneagramme");
    expect(e9?.faits, "l’ennéagramme est tombé avec l’horoscope").toEqual([
      { intitule: "Type", valeur: "4" },
    ]);
    // ⚠️ ELLE DISAIT « c'est la SEULE carte présentable, donc c'est elle qui est mise en avant ».
    // Le mantra en est une seconde depuis que le corpus est écrit, et la mise en avant tourne sur le
    // jour civil (FR-033) : élire nommément l'ennéagramme mesurait le corpus, pas la robustesse.
    // Ce que la story garde, c'est que la carte survivante SURVIT — donc qu'elle est présentable.
    // La survivante doit avoir de quoi se montrer — prédicat recalculé ici, jamais emprunté au code
    // sous test (voir le mutant survivant plus haut).
    expect(e9!.faits.length > 0 || e9!.texte.statut === "ecrit", "l'ennéagramme a survécu mais n'a rien à montrer").toBe(true);
  });

  it("un ennéagramme qui LÈVE ne fait pas disparaître le reste du socle", async () => {
    // ⚠️ CE TEST S'APPELAIT « … ne fait pas disparaître LES NOMBRES », et son sujet a bougé le
    // 2026-08-25 (Story 7.7) : la carte des nombres a quitté l'accueil, et avec elle l'appel à
    // `lireNumerologie` sur le chemin critique. L'INVARIANT, lui, n'a pas bougé d'un pouce — une
    // lecture qui lève n'emporte pas les autres cartes — et c'est lui qu'on garde ici.
    lireEnneagramme.mockRejectedValue(new Error("timeout"));
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    const cles = b.cartes.map((c) => c.cle);
    expect(cles, "le mantra est parti avec l'ennéagramme").toContain("mantra");
    expect(cles, "l'horoscope est parti avec l'ennéagramme").toContain("horoscope");
  });

  it("[7.7] la numérologie n'est PLUS lue sur le chemin critique de l'accueil", async () => {
    // ⚠️ C'EST LA MESURE, PAS L'INTENTION. `lireNumerologie` alimentait une carte qui ne change
    // jamais, sur l'écran le plus lourd du produit — un aller-retour de base à chaque ouverture,
    // pour tout le monde, tous les jours. Un commentaire qui dit « on l'a retiré » se périme ;
    // un espion qui compte ses appels, non.
    lireNumerologie.mockClear();
    await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(lireNumerologie, "la numérologie est revenue sur le chemin critique").not.toHaveBeenCalled();
  });

  it("[NFR-022] aucune donnée personnelle ne sort dans un log d’erreur", async () => {
    const espion = vi.spyOn(console, "error").mockImplementation(() => {});
    // ⚠️ LA PANNE FABRIQUÉE A CHANGÉ DE SOURCE le 2026-08-25 : `lireNumerologie` n'est plus appelé
    // sur ce chemin (Story 7.7), donc le faire lever ne journalisait plus RIEN — et le contrôle
    // positif de ce test l'a dit tout de suite, ce qui est exactement son rôle.
    lireEnneagramme.mockRejectedValue(new Error(`échec pour ${UID}`));
    await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    for (const appel of espion.mock.calls) {
      expect(JSON.stringify(appel), "un identifiant a fuité dans un log").not.toContain(UID);
    }
    expect(espion, "contrôle positif : la panne EST journalisée").toHaveBeenCalled();
  });
});

describe("[5.6/AC1] le jour porté par la bibliothèque est celui de Paris", () => {
  it("le jour civil accompagne la bibliothèque jusqu’au rendu", async () => {
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    // Sans lui, deux jours d'horoscope identiques (la Lune met ~2,5 jours à changer de signe) se
    // liraient comme une application bloquée — report explicite de la 5.4.
    expect(b.jour).toEqual({ a: 2026, m: 8, j: 14 });
  });

  it("juste avant minuit à Paris, on est encore la veille", async () => {
    // 2026-08-14 21:59 UTC = 23:59 à Paris (heure d'été). Le jour ne bascule pas encore.
    const b = await lireBibliotheque(SUPABASE, UID, new Date("2026-08-14T21:59:00Z"), false);
    expect(b.jour).toEqual({ a: 2026, m: 8, j: 14 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le CÂBLAGE de la page — la seule chose que les mocks ci-dessus ne peuvent pas voir
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[5.6/T8] `app/page.tsx` lit le thème UNE FOIS et le passe à ses DEUX consommateurs", () => {
  /**
   * ⚠️ CE DÉFAUT NE SE VOIT PAS À L'EXÉCUTION, ET C'EST TOUT LE PROBLÈME. Deux appels à
   * `lireThemeNatal` rendent le même thème : l'écran est identique. Ce qui diffère, c'est le coût
   * (~663 lectures d'éphéméride au premier calcul dans le cas dégradé) et le fait que les deux
   * chemins vivent dans le MÊME `Promise.all` — donc que les deux ÉCRITURES partent en concurrence,
   * aucune ne voyant l'autre.
   *
   * Avant la 5.6, un seul chemin lisait le thème (`chargerProjectionArbre`, pour le drapeau de tronc
   * incomplet). L'accueil en ajoute un second. C'est cette story qui crée la course, donc c'est à
   * elle de la fermer — et de laisser une garde derrière elle.
   *
   * Garde de SOURCE, faute de mieux : une page Server Component ne se monte pas dans ce harnais.
   * Elle est grossière et c'est dit — elle prouve le câblage, pas le comportement.
   */
  const PAGE = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf-8");
  const sansCommentaires = PAGE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("[CONTRÔLE DU CONTRÔLE] la page a bien été lue et dépouillée", () => {
    expect(sansCommentaires).toContain("SceneDom");
    expect(sansCommentaires.length).toBeGreaterThan(400);
  });

  it("[LE TEST QUI COMPTE] `lireThemeNatal` n’est appelé qu’UNE fois dans la page", () => {
    const appels = [...sansCommentaires.matchAll(/lireThemeNatal\s*\(/g)];
    expect(
      appels.length,
      "deux appels dans la page = deux calculs concurrents et deux écritures en course",
    ).toBe(1);
  });

  it("les DEUX consommateurs reçoivent le thème déjà lu", () => {
    // Si l'un des deux ne le recevait pas, il le relirait lui-même — et la course reviendrait
    // sans qu'une ligne de la page ne change de forme.
    expect(sansCommentaires, "chargerProjectionArbre relit le thème").toMatch(
      /chargerProjectionArbre\s*\([^)]*theme[^)]*\)/,
    );
    expect(sansCommentaires, "lireBibliotheque relit le thème").toMatch(
      /lireBibliotheque\s*\([^)]*theme[^)]*\)/,
    );
  });

  it("[AC7] la bibliothèque a un repli sûr — une panne n’emporte pas la scène", () => {
    // L'accueil est une région parmi quatre. Une lecture de socle en échec ne doit fermer ni la
    // conversation ni l'arbre : la page rend `null` et la scène s'ouvre quand même.
    expect(sansCommentaires).toMatch(/lireBibliotheque[\s\S]{0,200}?\.catch\(/);
  });

  it("une seule éphéméride est composée, et elle est partagée", () => {
    expect([...sansCommentaires.matchAll(/ephemerideAstronomyEngine\s*\(/g)]).toHaveLength(1);
  });
});

describe("[Aujourd’hui] les trois univers sont câblés depuis l’état réel", () => {
  it("un compte sans résultat reçoit un CTA direct vers le questionnaire", async () => {
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(b.univers.map((u) => u.cle)).toEqual([
      "astrologie",
      "numerologie",
      "psychologie",
    ]);
    expect(b.univers.find((u) => u.cle === "psychologie")?.action).toEqual({
      libelle: "Passer mon test d’ennéagramme",
      url: "/enneagramme",
    });
  });

  it("un résultat calculé retire le CTA sans retirer l’univers", async () => {
    lireEnneagramme.mockResolvedValue({
      statut: "calcule",
      type: 4,
      origine: "test",
      texte: { statut: "non_ecrit" },
    });
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(b.univers.find((u) => u.cle === "psychologie")?.action).toBeNull();
    expect(b.univers).toHaveLength(3);
  });

  it("une tentative existante devient « Reprendre », jamais « Passer »", async () => {
    lireTentativeEnneagramme.mockResolvedValue({
      statut: "calcule",
      tentative: { tentativeId: "tentative-1", reponses: [{ itemId: "e9-1", niveau: 2 }] },
    });
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(b.univers.find((u) => u.cle === "psychologie")?.action).toEqual({
      libelle: "Reprendre mon test",
      url: "/enneagramme",
    });
  });

  it("une panne de lecture ne ment pas en proposant de recommencer", async () => {
    lireEnneagramme.mockResolvedValue({ statut: "indisponible", raison: "lecture_impossible" });
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(b.univers.find((u) => u.cle === "psychologie")?.action).toBeNull();
    expect(lireTentativeEnneagramme).not.toHaveBeenCalled();
  });
});

describe("[E3-S5] l’heure manquante se lit sur le thème DÉJÀ lu, et jamais sur une panne", () => {
  /**
   * Le prédicat est `manqueLHeure` (`socle-incomplet.ts`), calculé sur le thème que
   * `lireSocleQuotidien` rend dans le même appel : décider du bouton ne coûte aucune lecture.
   * Et un thème INDISPONIBLE n'est pas un thème sans heure : une naissance absente ou une panne ne
   * donne aucun bouton, parce qu'on ne propose pas de réparer un manque qu'on n'a pas constaté.
   */
  const EPHEMERIDE = ephemerideAstronomyEngine();
  const themeCalcule = (entrees: EntreesNaissance) =>
    ({ statut: "calcule", theme: calculerThemeNatal(entrees, EPHEMERIDE), version: 1 }) as const;
  const SANS_HEURE: EntreesNaissance = { date: "1990-06-15" };
  const AVEC_HEURE: EntreesNaissance = {
    date: "1990-06-15",
    heure: "07:15",
    fuseau: "Europe/Paris",
    latitude: 48.8566,
    longitude: 2.3522,
  };
  const astrologie = (b: Awaited<ReturnType<typeof lireBibliotheque>>) =>
    b.univers.find((u) => u.cle === "astrologie")!;

  it("[LE CŒUR] thème calculé SANS heure : la porte Astrologie propose de l’ajouter, sans lecture de plus", async () => {
    lireThemeNatal.mockResolvedValue(themeCalcule(SANS_HEURE));
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false, EPHEMERIDE);
    expect(astrologie(b).action).toEqual({ libelle: LIEN_AJOUTER, url: "/heure-naissance" });
    expect(lireThemeNatal, "décider du bouton a coûté une lecture").toHaveBeenCalledTimes(1);
  });

  it("[LE BORD] thème calculé AVEC heure : rien à proposer", async () => {
    // Mutation-cible : `heureManque = socle.theme.statut === "calcule"`. Le CŒUR resterait vert.
    lireThemeNatal.mockResolvedValue(themeCalcule(AVEC_HEURE));
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false, EPHEMERIDE);
    expect(astrologie(b).action).toBeNull();
  });

  it("[LE BORD / DUR] naissance absente : rien, une donnée jamais donnée n’est pas un manque constaté", async () => {
    // `beforeEach` : `lireThemeNatal` rend « indisponible / naissance_absente ».
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(astrologie(b).action).toBeNull();
  });

  it("[LE BORD / DUR] panne de lecture du thème : rien non plus, une panne n’est pas « tu ne l’as pas donnée »", async () => {
    lireThemeNatal.mockRejectedValue(new Error("timeout"));
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(astrologie(b).action).toBeNull();
    expect(b.univers, "la panne a emporté les portes").toHaveLength(3);
  });

  it("[LE BORD / DUR] panne du socle LUI-MÊME : rien, et le reste de l’accueil tient", async () => {
    // Mutation-cible : `let heureManque = true` par défaut. Elle a SURVÉCU aux trois cas ci-dessus
    // (campagne du 2026-09-02) : tous passent par `lireSocleQuotidien`, qui réassigne la valeur.
    // Seule une panne du socle lui-même laisse la valeur par défaut parler, et c'est ici qu'on
    // l'entend.
    socleQuotidien.mockRejectedValueOnce(new Error("client"));
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false);
    expect(astrologie(b).action).toBeNull();
    expect(b.univers).toHaveLength(3);
    expect(b.cartes.map((c) => c.cle).sort(), "la panne a vidé l'accueil").toEqual([...CATALOGUE_CARTES].sort());
  });

  it("le thème passé par la page suffit : zéro appel, et le bouton quand même", async () => {
    const b = await lireBibliotheque(SUPABASE, UID, MAINTENANT, false, EPHEMERIDE, themeCalcule(SANS_HEURE));
    expect(lireThemeNatal).not.toHaveBeenCalled();
    expect(astrologie(b).action?.url).toBe("/heure-naissance");
  });
});
