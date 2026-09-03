import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AVIS_MINIMAL_PAR_FACTEUR,
  FACTEURS,
  conclure,
  itemsManquants,
  niveauOriente,
  type Facteur,
} from "@/lib/domain/big-five";
import {
  FACTEUR_LIBELLE,
  ITEMS_BIG_FIVE,
  LIBELLES_NIVEAU_BIG_FIVE,
  baremeBigFive,
  itemsPourAffichageBigFive,
} from "@/lib/domain/big-five-items";
import { LIBELLES_NIVEAU } from "@/lib/domain/enneagramme-items";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";
import type { ReponseItem } from "@/lib/domain/echelle-likert";

/**
 * LES CINQ GRANDS FACTEURS (2026-09-03).
 *
 * Trois familles de défaut, et aucune ne se voit à l'écran :
 *
 *   1. LE BARÈME QUI FUIT. Servir le facteur avec l'énoncé publie la grille dans le HTML, et un
 *      test dont on voit la grille ne mesure plus rien ;
 *   2. L'INVERSION PERDUE. Un item écrit à l'envers dont le `inverse` retombe à `false` compte à
 *      contresens : le résultat reste parfaitement formé, et il est faux pour tout le monde ;
 *   3. LE SCORE QUI SORT. FR-031 refuse compteurs et jauges. Le total existe dans le calcul ; s'il
 *      traversait le type de sortie, un rendu finirait par le peindre en barre.
 */

const bareme = baremeBigFive();
/** Toutes les réponses au même niveau : la façon la plus simple de fabriquer un cas. */
const toutes = (niveau: 0 | 1 | 2 | 3): ReponseItem[] =>
  bareme.map((item) => ({ itemId: item.id, niveau }));

describe("[LE CŒUR] le barème ne fuit jamais vers l’écran", () => {
  it("l’affichage ne porte que l’identité et la phrase", () => {
    // Mutation-cible : ajouter `facteur` à la projection. La grille deviendrait lisible dans le
    // HTML, et quiconque l'ouvre saurait quoi répondre pour sortir « ouvert ».
    for (const item of itemsPourAffichageBigFive()) {
      expect(Object.keys(item).sort()).toEqual(["id", "texte"]);
    }
  });

  it("l’ordre des énoncés mêle les facteurs", () => {
    // Cinq blocs de quatre rendraient la grille lisible à l'œil nu, sans même ouvrir le HTML.
    const facteursSuccessifs = ITEMS_BIG_FIVE.map((i) => i.facteur);
    const blocs = facteursSuccessifs.filter((f, i) => i > 0 && f === facteursSuccessifs[i - 1]);
    expect(blocs, "deux énoncés du même facteur se suivent").toEqual([]);
  });
});

describe("[LE CŒUR] vingt énoncés, quatre par facteur, dont deux à l’envers", () => {
  it("le compte est exact, facteur par facteur", () => {
    expect(ITEMS_BIG_FIVE).toHaveLength(20);
    for (const facteur of FACTEURS) {
      const items = ITEMS_BIG_FIVE.filter((i) => i.facteur === facteur);
      expect(items, `facteur ${facteur}`).toHaveLength(4);
      expect(items.filter((i) => i.inverse), `${facteur} : items inversés`).toHaveLength(2);
    }
  });

  it("aucun identifiant en double", () => {
    expect(new Set(ITEMS_BIG_FIVE.map((i) => i.id)).size).toBe(20);
  });

  it("les cinq facteurs ont un intitulé", () => {
    for (const facteur of FACTEURS) expect(FACTEUR_LIBELLE[facteur]).toBeTruthy();
  });
});

describe("[LE CŒUR] l’inversion compte à l’endroit", () => {
  it("un énoncé inversé retourne le niveau", () => {
    expect(niveauOriente(0, true)).toBe(3);
    expect(niveauOriente(3, true)).toBe(0);
    expect(niveauOriente(1, true)).toBe(2);
  });

  it("un énoncé direct ne le retourne pas", () => {
    expect(niveauOriente(0, false)).toBe(0);
    expect(niveauOriente(3, false)).toBe(3);
  });

  it("[LE CŒUR] répondre « presque toujours » partout ne donne PAS cinq facteurs hauts", () => {
    // ⚠️ C'EST LA MESURE QUI JUSTIFIE TOUT LE DISPOSITIF D'INVERSION. Sans elle, une personne qui
    // acquiesce à tout sortirait « haut » sur les cinq axes, et l'inventaire mesurerait sa
    // politesse. Avec deux items inversés par facteur, elle sort au milieu partout — ce qui est la
    // seule chose honnête à dire de réponses indifférenciées.
    const resultat = conclure(toutes(3), bareme);
    expect(resultat.statut).toBe("retenu");
    if (resultat.statut !== "retenu") return;
    expect(resultat.facteurs.map((f) => f.position)).toEqual(FACTEURS.map(() => "median"));
  });

  it("[ANTI-VACUITÉ] un jeu de réponses cohérent, lui, sort des extrêmes", () => {
    // Sans ce témoin, un `conclure` qui rendrait toujours « median » passerait le test ci-dessus.
    const coherentes = bareme.map((item) => ({
      itemId: item.id,
      // On répond « haut » au sens du facteur : 3 sur les directs, 0 sur les inversés.
      niveau: (item.inverse ? 0 : 3) as 0 | 3,
    }));
    const resultat = conclure(coherentes, bareme);
    expect(resultat.statut).toBe("retenu");
    if (resultat.statut !== "retenu") return;
    expect(resultat.facteurs.map((f) => f.position)).toEqual(FACTEURS.map(() => "haut"));
  });

  it("et le pôle opposé aussi", () => {
    const opposees = bareme.map((item) => ({
      itemId: item.id,
      niveau: (item.inverse ? 3 : 0) as 0 | 3,
    }));
    const resultat = conclure(opposees, bareme);
    if (resultat.statut !== "retenu") throw new Error("le jeu opposé doit conclure");
    expect(resultat.facteurs.map((f) => f.position)).toEqual(FACTEURS.map(() => "bas"));
  });
});

describe("[LE BORD] ce que le calcul refuse de trancher", () => {
  it("un test inachevé est INCOMPLET, et il nomme ce qui manque", () => {
    const partielles = toutes(2).slice(0, 18);
    const resultat = conclure(partielles, bareme);
    expect(resultat.statut).toBe("incomplet");
    if (resultat.statut !== "incomplet") return;
    expect(resultat.manquants).toHaveLength(2);
    expect(resultat.manquants).toEqual(itemsManquants(partielles, bareme));
  });

  it("trop de « je ne sais pas » sur un facteur : indéterminé, pas « bas »", () => {
    // ⚠️ MUTATION-CIBLE : compter les abstentions comme des zéros. La personne sortirait « bas »
    // sur un facteur dont elle n'a rien dit — le produit lui apprendrait quelque chose d'elle qui
    // ne vient que de son silence.
    const idsOuverture = bareme.filter((i) => i.facteur === "ouverture").map((i) => i.id);
    const avecTrous = bareme.map((item) => ({
      itemId: item.id,
      niveau: idsOuverture.slice(0, 2).includes(item.id) ? null : (2 as const),
    }));
    expect(conclure(avecTrous, bareme)).toEqual({
      statut: "indetermine",
      raison: "reponses_inconnues",
    });
  });

  it("juste assez d’avis : le facteur se conclut", () => {
    // Le seuil est atteignable : une garde qui refuserait tout serait verte pour la mauvaise raison.
    const idsOuverture = bareme.filter((i) => i.facteur === "ouverture").map((i) => i.id);
    const uneAbstention = bareme.map((item) => ({
      itemId: item.id,
      niveau: item.id === idsOuverture[0] ? null : (2 as const),
    }));
    expect(conclure(uneAbstention, bareme).statut).toBe("retenu");
    expect(AVIS_MINIMAL_PAR_FACTEUR).toBe(3);
  });

  it("[LE BORD] une réponse à un item inconnu n’empêche pas de conclure", () => {
    // Un barème qui change sous une passe en cours n'est pas une faute de la personne.
    const avecIntrus = [...toutes(2), { itemId: "inconnu", niveau: 3 as const }];
    expect(conclure(avecIntrus, bareme).statut).toBe("retenu");
  });
});

describe("[LE BORD] aucun nombre affichable ne sort du calcul (FR-031)", () => {
  it("le résultat ne porte que des facteurs et des positions", () => {
    const resultat = conclure(toutes(2), bareme);
    if (resultat.statut !== "retenu") throw new Error("le jeu complet doit conclure");
    for (const entree of resultat.facteurs) {
      expect(Object.keys(entree).sort()).toEqual(["facteur", "position"]);
      expect(["bas", "median", "haut"]).toContain(entree.position);
    }
    // Mutation-cible : ajouter `score` ou `total` au type de sortie. Le rendu finirait par le
    // peindre en barre, et FR-031 ne tiendrait plus qu'à la discipline.
    expect(JSON.stringify(resultat)).not.toMatch(/\d/);
  });

  it("la source du calcul ne déclare aucun champ de score", () => {
    const src = readFileSync(resolve(process.cwd(), "lib/domain/big-five.ts"), "utf-8");
    const declarations = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ");
    for (const interdit of ["score", "total", "pourcentage", "note"]) {
      expect(
        new RegExp(`readonly\\s+\\w*${interdit}\\w*\\s*[?:]`, "i").test(declarations),
        `un champ « ${interdit} » est apparu dans le résultat`,
      ).toBe(false);
    }
  });
});

describe("[LE BORD] la voix des énoncés tient les règles du produit", () => {
  const textes = ITEMS_BIG_FIVE.map((i) => i.texte);

  it("aucun lexique interdit, aucune prédiction", () => {
    // Le cinquième facteur est nommé par son pôle POSITIF pour cette raison précise : son nom
    // usuel est dans le lexique médical, et le contrôle de voix bloquant le refuserait.
    for (const texte of textes) {
      expect(chercherInterdits(texte), `lexique interdit : « ${texte} »`).toEqual([]);
      expect(chercherPredictions(texte), `prédiction : « ${texte} »`).toEqual([]);
    }
    for (const libelle of Object.values(FACTEUR_LIBELLE)) {
      expect(chercherInterdits(libelle), `intitulé : ${libelle}`).toEqual([]);
    }
  });

  it("des apostrophes typographiques, jamais droites", () => {
    for (const texte of textes) expect(texte, texte).not.toContain("'");
  });

  it("aucun tiret cadratin", () => {
    for (const texte of textes) expect(texte, texte).not.toContain("—");
  });

  it("[ANTI-VACUITÉ] les gardes de voix mordent vraiment", () => {
    expect(chercherInterdits("une thérapie pour ton anxiété")).not.toEqual([]);
    expect(chercherPredictions("tu verras que cela s’arrangera")).not.toEqual([]);
  });
});

describe("[LE BORD] les deux inventaires parlent la même échelle", () => {
  it("les quatre libellés de fréquence sont identiques à ceux de l’ennéagramme", () => {
    // Deux échelles qui divergeraient feraient deux tests qui ne se lisent plus pareil, sur la
    // même page de psychologie.
    expect(LIBELLES_NIVEAU_BIG_FIVE).toEqual(LIBELLES_NIVEAU);
  });
});

describe("[ANTI-VACUITÉ] le barème couvre bien les cinq facteurs", () => {
  it("chaque facteur du domaine a des items", () => {
    const couverts = new Set<Facteur>(bareme.map((i) => i.facteur));
    expect([...couverts].sort()).toEqual([...FACTEURS].sort());
  });
});
