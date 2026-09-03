import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { clesEcrites, clesNonEcrites, type Corpus } from "@/lib/corpus/port";
import { CORPUS_NUMEROLOGIE } from "@/lib/corpus/numerologie";
import { CORPUS_MANTRA } from "@/lib/corpus/mantra";
import { CORPUS_HOROSCOPE } from "@/lib/corpus/horoscope";
import { CORPUS_ENNEAGRAMME } from "@/lib/corpus/enneagramme";
import { CORPUS_BIG_FIVE } from "@/lib/corpus/big-five";
import { CORPUS_HUMAN_DESIGN } from "@/lib/corpus/human-design";
import { CORPUS_DESCRIPTION_CARTES } from "@/lib/corpus/description-cartes";
import { ANCRAGES } from "@/lib/corpus/ancrage";
import { CORPUS_SENS_CARTES } from "@/lib/lecture/sens-cartes";

/**
 * corpus-etat.test.ts — LE TABLEAU D'ÉTAT DES CORPUS EST CALCULÉ, PLUS JAMAIS RECOPIÉ (2026-08-25).
 *
 * ══ CE QUE CE FICHIER A COÛTÉ AVANT D'EXISTER ═══════════════════════════════════════════════════
 *
 * `lib/corpus/README.md` portait un tableau « L'état des corpus » écrit à la main, qui annonçait
 * CINQ corpus, 186 créneaux et **zéro texte écrit**. La réalité, mesurée ici : SEPT corpus,
 * 231 créneaux, 189 écrits — la numérologie, les mantras, l'horoscope, l'ennéagramme et les ancrages
 * sont COMPLETS.
 *
 * Ce n'est pas une coquette imprécision de documentation. Le 2026-08-25, une investigation de code a
 * lu ce tableau, en a conclu que « le corpus de numérologie est vide », et a déclaré BLOQUÉ le
 * chantier qui répondait à 80 % d'une demande de Julian. Un document faux avait arrêté un travail
 * faisable. Une seconde lecture — du CODE, pas du tableau — l'a rattrapé.
 *
 * Une table d'état écrite à la main dérive au premier texte ajouté, et elle dérive EN SILENCE. Celle
 * du README est donc désormais VÉRIFIÉE ligne à ligne contre ce que les modules contiennent
 * réellement, et la garde exige qu'aucun corpus n'y manque.
 */

const RACINE = process.cwd();

/**
 * ⚠️ CETTE LISTE EST LE POINT FAIBLE, ET IL EST GARDÉ. Elle est tenue à la main, donc elle peut
 * oublier un corpus créé demain — exactement le défaut qu'on répare. Le test « aucun corpus
 * n'échappe au recensement » compte les déclarations dans les sources et exige le même nombre.
 */
const RECENSES: readonly Corpus[] = [
  CORPUS_NUMEROLOGIE,
  CORPUS_MANTRA,
  CORPUS_HOROSCOPE,
  CORPUS_ENNEAGRAMME,
  CORPUS_BIG_FIVE,
  CORPUS_HUMAN_DESIGN,
  CORPUS_DESCRIPTION_CARTES,
  ANCRAGES,
  CORPUS_SENS_CARTES,
];

const compte = (c: Corpus) => {
  const ecrits = clesEcrites(c).length;
  return { nom: c.identifiant, ecrits, creneaux: ecrits + clesNonEcrites(c).length };
};

const ETAT = RECENSES.map(compte);

/** Toutes les déclarations `corpus("nom", …)` du dépôt — la source de vérité du recensement. */
function declarationsDansLesSources(): string[] {
  const trouves: string[] = [];
  const parcourir = (dossier: string) => {
    for (const e of readdirSync(resolve(RACINE, dossier), { withFileTypes: true })) {
      const p = `${dossier}/${e.name}`;
      if (e.isDirectory()) parcourir(p);
      else if (p.endsWith(".ts") && !p.includes("/port.ts"))
        for (const m of readFileSync(resolve(RACINE, p), "utf-8").matchAll(/\bcorpus\(\s*\n?\s*"([a-z-]+)"/g))
          trouves.push(m[1]);
    }
  };
  parcourir("lib");
  return trouves.sort();
}

describe("[2026-08-25] Aucun corpus n’échappe au recensement", () => {
  it("[LE CŒUR] tout `corpus(\"…\")` déclaré dans les sources est recensé ici", () => {
    // Sans ceci, la liste ci-dessus vieillirait en silence et le tableau redeviendrait faux — le
    // défaut exact qu'on répare, reconstitué un cran plus haut.
    const declares = declarationsDansLesSources();
    const recenses = ETAT.map((e) => e.nom).sort();
    expect(declares.length, "aucune déclaration trouvée : le balayage est cassé").toBeGreaterThan(4);
    expect(recenses, `corpus déclarés mais non recensés : ${declares.filter((d) => !recenses.includes(d)).join(", ")}`)
      .toEqual(declares);
  });
});

describe("[2026-08-25] Le tableau du README dit la vérité, et la CI le vérifie", () => {
  const readme = readFileSync(resolve(RACINE, "lib/corpus/README.md"), "utf-8");

  /** Les lignes du tableau : | nom | créneaux | écrits | … | */
  function lignesDuTableau(): Map<string, { creneaux: number; ecrits: number }> {
    const carte = new Map<string, { creneaux: number; ecrits: number }>();
    for (const m of readme.matchAll(/^\|[^|]*`([a-z-]+)`[^|]*\|\s*(\d+)\s*\|\s*\*{0,2}(\d+)\*{0,2}\s*\|/gm)) {
      carte.set(m[1], { creneaux: Number(m[2]), ecrits: Number(m[3]) });
    }
    return carte;
  }

  it("[CONTRÔLE DU CONTRÔLE] le tableau est trouvé et il a autant de lignes que de corpus", () => {
    // Un tableau introuvable rendrait toutes les comparaisons vraies sur du vide.
    expect(lignesDuTableau().size, "le tableau d’état est introuvable ou incomplet").toBe(ETAT.length);
  });

  it("[LE CŒUR] chaque ligne porte les nombres RÉELS, mesurés dans les modules", () => {
    const menteuses: string[] = [];
    const table = lignesDuTableau();
    for (const e of ETAT) {
      const ligne = table.get(e.nom);
      if (!ligne) { menteuses.push(`${e.nom} : absent du tableau`); continue; }
      if (ligne.creneaux !== e.creneaux || ligne.ecrits !== e.ecrits) {
        menteuses.push(`${e.nom} : le tableau dit ${ligne.ecrits}/${ligne.creneaux}, le code dit ${e.ecrits}/${e.creneaux}`);
      }
    }
    expect(menteuses, `le tableau d’état ment :\n${menteuses.join("\n")}`).toEqual([]);
  });

  it("le total annoncé est la somme des lignes", () => {
    const totalCreneaux = ETAT.reduce((s, e) => s + e.creneaux, 0);
    const totalEcrits = ETAT.reduce((s, e) => s + e.ecrits, 0);
    const m = /\*\*Total\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|\s*\*\*(\d+)\*\*/.exec(readme);
    expect(m, "la ligne de total a disparu du tableau").not.toBeNull();
    expect(Number(m![1]), "total de créneaux faux").toBe(totalCreneaux);
    expect(Number(m![2]), "total d’écrits faux").toBe(totalEcrits);
  });

  it("[ANTI-VACUITÉ] le corpus n’est PAS vide — sinon tout ce fichier serait vrai pour rien", () => {
    // La garde d'origine (`corpus-architecture`) a été écrite quand tout valait zéro, et son en-tête
    // le dit : « garde d'absence sur un corpus vide ». Ce n'est plus le cas, et c'est ce que le
    // README avait manqué.
    const totalEcrits = ETAT.reduce((s, e) => s + e.ecrits, 0);
    expect(totalEcrits, "plus aucun texte écrit dans tout le produit").toBeGreaterThan(100);
  });
});
