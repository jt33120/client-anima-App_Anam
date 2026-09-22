import { describe, it, expect } from "vitest";
import {
  CLES_ARBRE,
  CLES_ARBRE_DU_NOM,
  calculerArbreDeVie,
  dynamiqueDeVie,
  type ArbreDeVie,
  type CleArbre,
} from "@/lib/astro/arbre-de-vie";
import { cheminDeVie, reduire } from "@/lib/astro/numerologie";

/**
 * L'ARBRE DE VIE — LE CALCUL.
 *
 * Même difficulté qu'en 5.2 : une formule fausse ne plante pas, elle rend un nombre entre 0 et 33
 * qui a l'air d'un résultat. Mais ici on a mieux qu'un raisonnement — on a UN RAPPORT RÉEL d'Anima,
 * celui de « Milian », dont les neuf valeurs sont connues d'avance :
 *
 *     racines 3 et 7 · tronc 1 · écorce 3 · branches 4 · feuilles 8 · cime 8
 *     chemin de vie 3 · dynamique 11/2 · défis 4, 1, 3, 5
 *
 * Ces neuf valeurs ne tombent juste ENSEMBLE que sur un jour réduisant à 3, en juillet, d'une année
 * dont les chiffres somment à 11. C'est ce qui fait du vecteur une preuve et pas une coïncidence :
 * neuf contraintes pour trois degrés de liberté. `2018-07-12` est le représentant retenu.
 *
 * ⚠️ CE FICHIER EST LA SEULE CHOSE QUI RELIE LE CODE À LA MÉTHODE D'ANIMA. Si une formule doit
 * changer parce qu'elle a corrigé la méthode, c'est ici que ça commence à rougir, et c'est voulu.
 */

/**
 * Le vecteur d'Anima.
 *
 * ⚠️ LE NOM DE FAMILLE EST INVENTÉ, ET DEUX VALEURS DU RAPPORT NE SONT DONC PAS VÉRIFIABLES ICI.
 * Le rapport donne feuilles 8 et cime 8, mais il ne donne pas le nom complet de la personne : avec
 * un nom choisi, on atteindrait n'importe quelle valeur, et le test ne prouverait plus rien. Ces
 * deux clés sont donc vérifiées comme FORMULES (voyelles et consonnes du nom complet, les mêmes que
 * `intime` et `personnalite` du socle, déjà éprouvées en 5.2), pas contre le rapport.
 *
 * Ce que le rapport prouve, lui, c'est que les branches ne peuvent PAS être le nombre d'expression :
 * la racine numérique étant additive, feuilles 8 et cime 8 forcent l'expression à 7, jamais à 4.
 * Restait une seule source possible pour un 4, et « Milian » seul la donne.
 */
const MILIAN = Object.freeze({
  date: "2018-07-12",
  nomComplet: "Milian Dupont",
  prenomDeNaissance: "Milian",
});

function valeurDe(arbre: ArbreDeVie, cle: CleArbre): number {
  const lecture = arbre.cles[cle];
  if (lecture.statut !== "calcule") {
    throw new Error(`${cle} devait être calculée, elle rend « ${lecture.raison} »`);
  }
  return lecture.valeur;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le vecteur du rapport
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LE VECTEUR] le rapport « Milian » d'Anima, valeur par valeur", () => {
  const arbre = calculerArbreDeVie(MILIAN);

  it("les deux racines : le jour et le mois, réduits sans maître", () => {
    expect(valeurDe(arbre, "racine_premiere"), "1ère racine du rapport : 3").toBe(3);
    expect(valeurDe(arbre, "racine_seconde"), "2ème racine du rapport : 7").toBe(7);
  });

  it("le tronc : la somme des deux racines", () => {
    // 3 + 7 = 10 → 1. Le rapport dit « Votre tronc (objectif de vie), votre nombre : 1 », et le
    // triangle du PDF relie bien le tronc à ses deux racines.
    expect(valeurDe(arbre, "tronc"), "tronc du rapport : 1").toBe(1);
  });

  it("l'écorce : le jour, lu comme image", () => {
    // Le rapport : « Écorce de valeur 3 — vous êtes né le 3, le 12, le 21 ou le 30. »
    expect(valeurDe(arbre, "ecorce"), "écorce du rapport : 3").toBe(3);
  });

  it("les branches : les prénoms de naissance, seuls", () => {
    // M4 + I9 + L3 + I9 + A1 + N5 = 31 → 4. C'est la seule hypothèse compatible avec le rapport :
    // avec feuilles 8 et cime 8, le nombre d'expression vaudrait 7, jamais 4.
    expect(valeurDe(arbre, "branches"), "branches du rapport : 4").toBe(4);
  });

  it("le chemin de vie reste celui que le produit calcule déjà", () => {
    expect(cheminDeVie(MILIAN.date), "chemin de vie du rapport : 3").toBe(3);
  });

  it("les quatre défis : des différences absolues", () => {
    expect(arbre.defis, "défis du rapport : 4, 1, 3, 5").toEqual([4, 1, 3, 5]);
  });

  it("[LA CONSERVATION DU MAÎTRE] la dynamique rend 11 là où les défis lisent 2", () => {
    // Le rapport : « Dynamique de vie 11/2 ». 2+0+1+8 = 11, et 11 est un maître : la réduction
    // s'arrête là. La MÊME année, réduite sans maître pour les défis, vaut 2 — c'est ce 2 qui donne
    // les défis 1 et 5. Les deux réductions cohabitent dans le même calcul sans se contaminer, et
    // c'est exactement le piège que `reduire` décrit dans son en-tête.
    const dynamique = dynamiqueDeVie(MILIAN.date);
    expect(dynamique).toEqual({ statut: "calcule", valeur: 11, maitre: true });
    expect(arbre.defis[1], "le défi 2 lit l'année à 2, pas à 11").toBe(1);
  });

  it("les trois autres dates qui satisfont le rapport donnent le même arbre", () => {
    // 12, 21 et 30 juillet réduisent tous à 3 ; 2009 et 1910 somment à 11 comme 2018. Si une
    // formule s'appuyait par accident sur le jour BRUT plutôt que réduit, ces trois-là divergeraient.
    for (const date of ["2009-07-03", "2018-07-21", "1910-07-30"]) {
      const autre = calculerArbreDeVie({ ...MILIAN, date });
      expect(autre.cles, `même arbre attendu pour ${date}`).toEqual(arbre.cles);
      expect(autre.defis, `mêmes défis attendus pour ${date}`).toEqual(arbre.defis);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le bord qui plante : le défi zéro
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LE BORD] un défi vaut 0 une fois sur neuf, et 0 ne se réduit pas", () => {
  it("une date dont le jour et le mois réduisent pareil donne un défi 0, sans lever", () => {
    // 12 mars : jour → 3, mois → 3. Le premier défi vaut |3 − 3| = 0.
    const arbre = calculerArbreDeVie({ date: "2000-03-12" });
    expect(arbre.defis[0]).toBe(0);
  });

  it("[CONTRÔLE DU CONTRÔLE] `reduire(0)` lève bel et bien", () => {
    // Le témoin négatif du test précédent : sans lui, un défi qui passerait par une réduction
    // pourrait n'avoir jamais été exercé sur la seule valeur qui la fait exploser.
    expect(() => reduire(0)).toThrow();
  });

  it("les quatre défis restent bornés entre 0 et 8 sur un balayage large", () => {
    for (let jour = 1; jour <= 28; jour++) {
      for (let mois = 1; mois <= 12; mois++) {
        const date = `1990-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
        for (const defi of calculerArbreDeVie({ date }).defis) {
          expect(defi, `${date} rend un défi hors bornes`).toBeGreaterThanOrEqual(0);
          expect(defi, `${date} rend un défi hors bornes`).toBeLessThanOrEqual(8);
        }
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// La redondance écorce / première racine, AFFIRMÉE
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LA REDONDANCE] l'écorce et la première racine sont le même nombre", () => {
  it("elles coïncident sur tous les jours du mois", () => {
    // Ce test n'est pas là pour figer la formule : il est là pour que la corriger soit une décision.
    // Le jour où l'une des deux change sans l'autre, c'est ici qu'on l'apprend, pas à l'écran.
    for (let jour = 1; jour <= 31; jour++) {
      const arbre = calculerArbreDeVie({ date: `1985-06-${String(jour).padStart(2, "0")}` });
      expect(valeurDe(arbre, "ecorce"), `jour ${jour}`).toBe(valeurDe(arbre, "racine_premiere"));
    }
    expect(calculerArbreDeVie(MILIAN).redondanceEcorceRacine).toBe(true);
  });

  it("l'écorce n'est PAS le « jour de naissance » du socle : elle ne garde pas les maîtres", () => {
    // `jourDeNaissance` conserve les maîtres (29 → 11) ; l'écorce n'en garde aucun (29 → 2). Les
    // confondre ferait afficher deux nombres différents sous le même mot, dans deux écrans voisins.
    const arbre = calculerArbreDeVie({ date: "1990-06-29" });
    expect(valeurDe(arbre, "ecorce")).toBe(2);
    expect(reduire(29), "le socle, lui, garde le maître").toBe(11);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les absences — on aboutit toujours avec ce qu'on a
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LES ABSENCES] chaque manque est nommé, et il ne contamine rien d'autre", () => {
  it("sans prénom de naissance : SEULES les branches manquent", () => {
    const complet = calculerArbreDeVie(MILIAN);
    const arbre = calculerArbreDeVie({ date: MILIAN.date, nomComplet: MILIAN.nomComplet });
    expect(arbre.cles.branches).toEqual({
      statut: "non_calcule",
      raison: "prenom_de_naissance_absent",
    });
    // Les six autres clés sont IDENTIQUES à celles de l'arbre complet : retirer le prénom ne
    // déplace rien d'autre. C'est plus fort que d'asserter leurs valeurs une à une.
    for (const cle of CLES_ARBRE) {
      if (cle === "branches") continue;
      expect(arbre.cles[cle], `${cle} ne dépend pas du prénom`).toEqual(complet.cles[cle]);
    }
    expect(arbre.qualites).toEqual(complet.qualites);
  });

  it("sans nom complet : les feuilles, la cime et les qualités manquent, le reste aboutit", () => {
    const arbre = calculerArbreDeVie({ date: MILIAN.date, prenomDeNaissance: "Milian" });
    expect(arbre.cles.feuilles).toEqual({ statut: "non_calcule", raison: "nom_absent" });
    expect(arbre.cles.cime).toEqual({ statut: "non_calcule", raison: "nom_absent" });
    expect(arbre.qualites).toEqual({ statut: "non_calcule", raison: "nom_absent" });
    expect(valeurDe(arbre, "branches"), "les branches tiennent au prénom seul").toBe(4);
    for (const cle of ["racine_premiere", "racine_seconde", "tronc", "ecorce"] as const) {
      expect(arbre.cles[cle].statut, `${cle} ne tient qu'à la date`).toBe("calcule");
    }
  });

  it("un nom renseigné mais sans lettre est distinct d'un nom jamais renseigné", () => {
    const arbre = calculerArbreDeVie({ date: MILIAN.date, nomComplet: "--- 123 ---" });
    expect(arbre.cles.feuilles).toEqual({ statut: "non_calcule", raison: "nom_sans_lettre" });
    expect(arbre.qualites).toEqual({ statut: "non_calcule", raison: "nom_sans_lettre" });
  });

  it("un nom sans voyelle perd les feuilles mais garde la cime, et l'inverse", () => {
    const sansVoyelle = calculerArbreDeVie({ date: MILIAN.date, nomComplet: "Brt" });
    expect(sansVoyelle.cles.feuilles).toEqual({ statut: "non_calcule", raison: "nom_sans_voyelle" });
    expect(sansVoyelle.cles.cime.statut).toBe("calcule");

    const sansConsonne = calculerArbreDeVie({ date: MILIAN.date, nomComplet: "Aie" });
    expect(sansConsonne.cles.cime).toEqual({ statut: "non_calcule", raison: "nom_sans_consonne" });
    expect(sansConsonne.cles.feuilles.statut).toBe("calcule");
  });

  it("un prénom renseigné mais sans lettre le dit autrement qu'un prénom absent", () => {
    const arbre = calculerArbreDeVie({ ...MILIAN, prenomDeNaissance: "123" });
    expect(arbre.cles.branches).toEqual({ statut: "non_calcule", raison: "nom_sans_lettre" });
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les qualités — une présence, jamais un compte
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LES QUALITÉS] neuf familles de lettres, en trois paliers", () => {
  it("les neuf familles sortent dans l'ordre, une seule fois chacune", () => {
    const lecture = calculerArbreDeVie(MILIAN).qualites;
    if (lecture.statut !== "calcule") throw new Error("les qualités devaient être calculées");
    expect(lecture.qualites.map((q) => q.valeur)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("les trois paliers se séparent sur un nom connu", () => {
    // « Milian » : M4 I9 L3 I9 A1 N5 → la famille 9 a deux lettres (les deux I), la famille 2
    // (B/K/T) n'en a aucune, et la famille 1 (A/J/S) en a une.
    const lecture = calculerArbreDeVie({ date: MILIAN.date, nomComplet: "Milian" }).qualites;
    if (lecture.statut !== "calcule") throw new Error("les qualités devaient être calculées");
    const par = new Map(lecture.qualites.map((q) => [q.valeur, q.intensite]));
    expect(par.get(9), "deux I").toBe("discrete");
    expect(par.get(2), "aucun B, K ni T").toBe("absente");
    expect(par.get(1), "un seul A").toBe("discrete");

    // Trois lettres de la même famille ou plus : « marquee ». « Sasa » a trois S et un A → famille 1.
    const marquee = calculerArbreDeVie({ date: MILIAN.date, nomComplet: "Sasa" }).qualites;
    if (marquee.statut !== "calcule") throw new Error("les qualités devaient être calculées");
    expect(marquee.qualites.find((q) => q.valeur === 1)?.intensite).toBe("marquee");
  });

  it("[FR-031] aucun compte ne sort du calcul, à aucun endroit de la sortie", () => {
    // La garde structurelle : on ne cherche pas un mot dans un écran, on vérifie que le TYPE
    // transporté n'a aucun champ où un compte pourrait se loger. Les seuls nombres de la sortie
    // sont les valeurs numérologiques et les quatre défis.
    const arbre = calculerArbreDeVie(MILIAN);
    const lecture = arbre.qualites;
    if (lecture.statut !== "calcule") throw new Error("les qualités devaient être calculées");
    for (const qualite of lecture.qualites) {
      expect(Object.keys(qualite).sort()).toEqual(["intensite", "valeur"]);
      expect(["absente", "discrete", "marquee"]).toContain(qualite.intensite);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// La pureté
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[PURETÉ] le calcul est déterministe et sa sortie est gelée", () => {
  it("deux appels rendent exactement la même chose", () => {
    expect(calculerArbreDeVie(MILIAN)).toEqual(calculerArbreDeVie(MILIAN));
  });

  it("l'arbre, ses clés, ses défis et ses qualités sont gelés", () => {
    const arbre = calculerArbreDeVie(MILIAN);
    expect(Object.isFrozen(arbre)).toBe(true);
    expect(Object.isFrozen(arbre.cles)).toBe(true);
    expect(Object.isFrozen(arbre.defis)).toBe(true);
    expect(Object.isFrozen(arbre.qualites)).toBe(true);
    expect(() => {
      (arbre.cles as Record<string, unknown>).tronc = null;
    }).toThrow();
  });

  it("les deux inventaires de clés sont cohérents et gelés", () => {
    expect(CLES_ARBRE).toHaveLength(7);
    expect(Object.isFrozen(CLES_ARBRE)).toBe(true);
    expect(new Set(CLES_ARBRE).size, "aucun doublon").toBe(7);
    const arbre = calculerArbreDeVie(MILIAN);
    expect(Object.keys(arbre.cles).sort()).toEqual([...CLES_ARBRE].sort());
    for (const cle of CLES_ARBRE_DU_NOM) expect(CLES_ARBRE).toContain(cle);
  });

  it("les conventions employées sont inscrites dans la sortie", () => {
    // Un arbre sans sa convention est invérifiable après coup : deux écoles donnent deux arbres
    // différents pour la même personne, et rien dans les nombres ne dit laquelle a servi.
    const arbre = calculerArbreDeVie(MILIAN);
    expect(arbre.methodeRacines).toBe("jour_et_mois_reduits_sans_maitre");
    expect(arbre.methodeTronc).toBe("somme_des_racines_sans_maitre");
    expect(arbre.methodeEcorce).toBe("jour_reduit_sans_maitre");
    expect(arbre.methodeDynamique).toBe("annee_reduite_maitres_conserves");
    expect(arbre.methodeDefis).toBe("differences_absolues");
    expect(arbre.conventionNom).toBe("prenom_voyelles_consonnes");
    expect(arbre.seuilsQualite).toBe("absente_0_discrete_1_2_marquee_3");
    expect(arbre.regleY).toBe("voyelle");
    expect(arbre.schema).toBe(1);
  });

  it("la sortie traverse un aller-retour JSON sans rien perdre", () => {
    const arbre = calculerArbreDeVie(MILIAN);
    expect(JSON.parse(JSON.stringify(arbre))).toEqual(arbre);
  });

  it("une date illisible lève, elle ne se devine pas", () => {
    expect(() => calculerArbreDeVie({ date: "12/07/2018" })).toThrow();
    expect(() => calculerArbreDeVie({ date: "2018-13-01" })).toThrow();
  });
});
