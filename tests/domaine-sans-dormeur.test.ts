import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * domaine-sans-dormeur.test.ts — [7.11] AUCUN MODULE DE DOMAINE NE DORT SANS APPELANT.
 *
 * ══ CE QUI EST ARRIVÉ ═══════════════════════════════════════════════════════════════════════════
 *
 * `lib/domain/geste-du-jour.ts` a été écrit le 2026-08-23 en réponse à une demande de Julian
 * (« Accueil : chose quotidienne avec tâche »), avec sa consigne de modèle, ses trois refus tenus
 * et son en-tête soigné. Il n'a **jamais eu le moindre appelant** — sa seule autre occurrence dans
 * tout le dépôt était son propre nom dans une liste d'exclusions de test.
 *
 * Il a dormi deux mois sans que rien ne le dise.
 *
 * ⚠️ CE N'EST PAS UN PROBLÈME DE PROPRETÉ. Un module qui dort garantit qu'on écrira une SECONDE
 * réponse au même besoin — et les deux divergeront. Pire : celui qui le trouve croit qu'il est
 * vivant, et bâtit dessus. Celui-ci portait dans son en-tête une décision qui n'existe pas (« le
 * plafond passe à sept »), et l'aurait transmise à qui l'aurait lu.
 *
 * ⚠️ LA LISTE D'EXCEPTIONS EST EXPLICITE ET DATÉE, JAMAIS UN FOURRE-TOUT. Une exception sans motif
 * est un dormeur déclaré légitime par fatigue.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");
const sansCommentaires = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function fichiersTs(dossier: string): string[] {
  return (readdirSync(resolve(RACINE, dossier), { recursive: true, encoding: "utf-8" }) as string[])
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    .map((f) => `${dossier}/${f}`);
}

/**
 * Les modules de `lib/domain/` qu'aucun autre fichier n'importe — avec leur motif.
 *
 * ⚠️ CHAQUE ENTRÉE PORTE UNE RAISON ET UNE DATE. Sans elles, cette liste devient l'endroit où l'on
 * range ce qu'on n'a pas envie de traiter, et la garde ne garde plus rien.
 */
const DORMEURS_ADMIS: Readonly<Record<string, string>> = Object.freeze({
  // (vide au 2026-08-25 — `geste-du-jour.ts`, le seul, a été supprimé le jour même ; son besoin est
  // consigné dans `deferred-work.md` pour que la suppression ne soit pas un oubli.)
});

describe("[7.11] aucun module de `lib/domain` n'est sans appelant", () => {
  const MODULES = fichiersTs("lib/domain").filter((f) => f.endsWith(".ts"));
  const CORPUS = [
    ...fichiersTs("app"),
    ...fichiersTs("render"),
    ...fichiersTs("lib"),
    ...fichiersTs("tests"),
  ];

  it("[CONTRÔLE DU CONTRÔLE] le balayage voit les deux corpus", () => {
    expect(MODULES.length, "aucun module de domaine trouvé").toBeGreaterThan(30);
    expect(CORPUS.length, "le corpus d'appelants est vide").toBeGreaterThan(300);
  });

  it("[LE CŒUR] chaque module est importé par au moins un autre fichier", () => {
    const dormeurs: string[] = [];
    for (const m of MODULES) {
      const nom = m.replace(/^lib\/domain\//, "").replace(/\.ts$/, "");
      // Deux formes d'import possibles : l'alias `@/lib/domain/x` et le relatif `./x` depuis
      // `lib/domain` lui-même. Chercher une seule des deux ferait passer pour dormeur un module
      // employé par ses voisins.
      const motifs = [
        new RegExp(`from\\s+["']@/lib/domain/${nom}["']`),
        new RegExp(`from\\s+["']\\./${nom}["']`),
        new RegExp(`from\\s+["']\\.\\./domain/${nom}["']`),
        new RegExp(`import\\(["']@/lib/domain/${nom}["']\\)`),
      ];
      const appele = CORPUS.some((f) => {
        if (f === m) return false;
        const src = sansCommentaires(lire(f));
        return motifs.some((r) => r.test(src));
      });
      if (!appele && !(nom in DORMEURS_ADMIS)) dormeurs.push(`lib/domain/${nom}.ts`);
    }
    expect(
      dormeurs,
      `module(s) sans appelant — câble-les, supprime-les, ou inscris-les dans DORMEURS_ADMIS avec ` +
        `un motif et une date :\n${dormeurs.join("\n")}`,
    ).toEqual([]);
  });

  it("[ANTI-VACUITÉ] le détecteur reconnaît bien un module RÉELLEMENT appelé", () => {
    // Sans ce témoin, un motif d'import cassé déclarerait TOUT le domaine dormeur — ou, si la
    // logique était inversée, rien ne le serait jamais et la garde serait vide.
    const src = CORPUS.map((f) => sansCommentaires(lire(f))).join("\n");
    expect(src, "le motif d'import ne reconnaît même pas un module notoirement employé").toMatch(
      /from\s+["']@\/lib\/domain\/bibliotheque["']/,
    );
  });

  it("chaque dormeur admis porte un motif et une date", () => {
    for (const [nom, motif] of Object.entries(DORMEURS_ADMIS)) {
      expect(motif.length, `${nom} : exception sans motif`).toBeGreaterThan(30);
      expect(motif, `${nom} : exception sans date — elle ne se relira jamais`).toMatch(/20\d\d-\d\d-\d\d/);
    }
  });
});
