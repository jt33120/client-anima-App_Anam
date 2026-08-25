import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { extraireMessages } from "@/lib/ai/valider-messages";

/**
 * point-egress-unique.test.ts — [9.2] DEUX INVARIANTS VRAIS AUJOURD'HUI, ET GARDÉS PAR RIEN.
 *
 * ══ 1. UN SEUL POINT DE SORTIE VERS LE FOURNISSEUR ══════════════════════════════════════════════
 *
 * AD-13 pose une frontière d'egress article 9 : tout ce qui part chez un sous-traitant passe par
 * `lib/ai/egress-guard.ts`, qui compte, journalise et refuse. L'invariant est VRAI aujourd'hui —
 * aucun `.completer(` ni `.diffuser(` n'existe hors du guard — et rien ne le tient. La revue 4.9 a
 * déjà payé ce genre d'oubli : « le contrôle de lexique absent de deux sorties de modèle sur trois ».
 *
 * Un second point d'egress ne se voit pas en relisant un fichier : il se voit en les comptant tous.
 *
 * ══ 2. LE CANAL D'OUTIL EST REFUSÉ, ET PAS SEULEMENT IGNORÉ ═════════════════════════════════════
 *
 * `extraireMessages` ne recopie que `role` et `content` : un `tool_calls` glissé par le client
 * n'irait nulle part. Mais l'invariant tient par CONSTRUCTION SILENCIEUSE, et la première personne
 * qui écrira `messages.push({ ...m })` pour simplifier l'ouvrira sans s'en apercevoir. Le client
 * possède déjà la moitié de ce tableau — il envoie `assistant` — et un canal d'outil y serait une
 * injection sur le seul endroit du produit où le modèle reçoit du texte non filtré.
 *
 * ⚠️ CE FICHIER NE TRANCHE PAS LA QUESTION DES OUTILS. Cette décision appartient à Julian (porte
 * externe de la Story 9.2). Ce qu'on garde ici n'est pas « on refuse les outils pour toujours » :
 * c'est « aujourd'hui il n'y en a pas, et en ajouter un doit être un geste DÉLIBÉRÉ, jamais un
 * effet de bord d'un refactor ».
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

describe("[9.2/AC5 · AD-13] un seul point de sortie vers le fournisseur", () => {
  const CORPUS = [...fichiersTs("app"), ...fichiersTs("lib"), ...fichiersTs("render")];

  it("[CONTRÔLE DU CONTRÔLE] le balayage voit un corpus réel", () => {
    expect(CORPUS.length, "le balayage ne regarde rien").toBeGreaterThan(150);
    expect(CORPUS, "le guard lui-même a disparu").toContain("lib/ai/egress-guard.ts");
  });

  it("[LE CŒUR] aucun `.completer(` ni `.diffuser(` hors de `lib/ai/egress-guard.ts`", () => {
    const fautifs: string[] = [];
    for (const f of CORPUS) {
      if (f === "lib/ai/egress-guard.ts") continue;
      const src = sansCommentaires(lire(f));
      for (const appel of [".completer(", ".diffuser("]) {
        if (src.includes(appel)) fautifs.push(`${f} → ${appel}`);
      }
    }
    expect(
      fautifs,
      `second point d'egress art. 9 — c'est celui que la revue 4.9 a demandé de ne pas rouvrir :\n${fautifs.join("\n")}`,
    ).toEqual([]);
  });

  it("[ANTI-VACUITÉ] le guard, LUI, appelle bien le port — sinon rien ne sort et la garde est vide", () => {
    // Sans ce témoin, le refus ci-dessus serait vert sur un produit qui ne parle plus à aucun
    // modèle : la garde mesurerait l'absence de fonctionnalité, pas le respect d'une frontière.
    const guard = sansCommentaires(lire("lib/ai/egress-guard.ts"));
    expect(guard, "le guard n'appelle plus le port : la frontière ne garde plus rien").toMatch(
      /\.completer\(|\.diffuser\(/,
    );
  });
});

describe("[9.2/AC4] le canal d'outil est REFUSÉ, pas silencieusement ignoré", () => {
  const bon = [{ role: "user", content: "bonjour" }];

  it("[CONTRÔLE POSITIF] un corps normal passe — sans quoi les refus ne prouvent rien", () => {
    expect(extraireMessages({ messages: bon })).toEqual([{ role: "user", content: "bonjour" }]);
  });

  it("[LE CŒUR] un message de rôle `tool` est refusé", () => {
    expect(extraireMessages({ messages: [{ role: "tool", content: "résultat" }] })).toBeNull();
  });

  it("[LE CŒUR] un `tool_calls` glissé sur un message légitime ARRÊTE la requête", () => {
    // ⚠️ ARRÊTER, PAS AMPUTER. Laisser passer le message en jetant la clé serait « sûr » aujourd'hui
    // et invisible demain : c'est exactement l'état d'avant, où l'invariant tenait par construction
    // silencieuse. Un refus dit à qui refactorise que ce n'était pas un hasard.
    for (const cle of ["tool_calls", "toolCalls", "tool_call_id"]) {
      expect(
        extraireMessages({ messages: [{ role: "assistant", content: "ok", [cle]: [{ id: "1" }] }] }),
        `« ${cle} » est passé`,
      ).toBeNull();
    }
  });

  it("[LE MUTANT NOMMÉ] recopier le message entier rouvrirait le canal", () => {
    // Mutation-cible écrite ici parce qu'elle est SÉDUISANTE : `messages.push({ ...m })` est plus
    // court, plus « propre », et laisse passer tout ce que le client envoie. La garde ci-dessus la
    // tue ; ce test-ci nomme le geste pour que personne ne le refasse en croyant simplifier.
    const src = sansCommentaires(lire("lib/ai/valider-messages.ts"));
    expect(src, "le message client est recopié EN ENTIER : le client contrôle ce qui part").not.toMatch(
      /messages\.push\(\s*\{\s*\.\.\./,
    );
    expect(src, "le refus explicite du canal d'outil a disparu").toContain("tool_calls");
  });
});
