import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ITEMS, LIBELLES_NIVEAU, itemsPourAffichage } from "@/lib/domain/enneagramme-items";
import { TYPES, NIVEAUX, conclure, type ReponseItem } from "@/lib/domain/enneagramme";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";

/**
 * enneagramme-items.test.ts — LES DIX-HUIT ÉNONCÉS (Story 5.5, AC1 / AC3).
 *
 * Trois familles de garde ici, et la troisième est celle qu'on oublie : la forme (dix-huit, deux par
 * type, identifiants uniques), la VOIX (les questions passent les mêmes contrôles que tout le reste du
 * produit), et le fait que le barème NE DESCEND PAS au client.
 */

describe("[5.5/AC1] la forme du jeu de questions", () => {
  it("[LE CŒUR] dix-huit questions, exactement deux par type", () => {
    expect(ITEMS).toHaveLength(18);
    for (const t of TYPES) {
      expect(ITEMS.filter((i) => i.type === t), `type ${t}`).toHaveLength(2);
    }
  });

  it("les identifiants sont uniques — un doublon écraserait une réponse en silence", () => {
    // `scorer` ne retient que la DERNIÈRE réponse d'un même identifiant : deux questions partageant
    // un id feraient disparaître l'un des deux du calcul, sans erreur.
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(18);
  });

  it("aucun énoncé n'est vide, ni dupliqué mot pour mot", () => {
    for (const i of ITEMS) expect(i.texte.trim().length, i.id).toBeGreaterThan(10);
    expect(new Set(ITEMS.map((i) => i.texte)).size).toBe(18);
  });

  it("[LE TEST QUI COMPTE] les deux questions d'un même type ne se suivent JAMAIS", () => {
    // Servis groupés, ils rendent le barème lisible à l'œil nu : on répond au personnage qu'on
    // devine plutôt qu'à soi. Le mutant visé est un `ITEMS` réordonné par type.
    for (let i = 1; i < ITEMS.length; i++) {
      expect(ITEMS[i].type, `positions ${i - 1} et ${i}`).not.toBe(ITEMS[i - 1].type);
    }
  });

  it("le jeu est GELÉ, et chaque énoncé aussi", () => {
    expect(Object.isFrozen(ITEMS)).toBe(true);
  });

  it("l’échelle porte les quatre niveaux, et aucun ne montre de chiffre (FR-031)", () => {
    for (const n of NIVEAUX) {
      expect(LIBELLES_NIVEAU[n], `niveau ${n}`).toBeTruthy();
      expect(LIBELLES_NIVEAU[n], `le libellé du niveau ${n} porte un chiffre`).not.toMatch(/\d/);
    }
    expect(new Set(Object.values(LIBELLES_NIVEAU)).size, "deux niveaux portent le même libellé").toBe(4);
    expect(Object.values(LIBELLES_NIVEAU)).toEqual([
      "Jamais ou presque",
      "Parfois",
      "Souvent",
      "Presque toujours",
    ]);
  });
});

describe("[5.5/AC1] le barème ne descend PAS au client", () => {
  it("[LE CŒUR] itemsPourAffichage ne porte que l'identifiant et la phrase", () => {
    const affiches = itemsPourAffichage();
    expect(affiches).toHaveLength(18);
    for (const a of affiches) {
      expect(Object.keys(a).sort(), `${a.id} expose plus que prévu`).toEqual(["id", "texte"]);
      expect((a as unknown as { type?: unknown }).type, `${a.id} porte encore son type`).toBeUndefined();
    }
  });

  it("[LE TEST QUI COMPTE] aucun type ne fuit dans la charge SÉRIALISÉE", () => {
    // C'est ainsi qu'il partirait vraiment : par le JSON du rendu serveur. Une garde qui n'inspecte
    // que l'objet en mémoire manquerait un champ ajouté par mégarde dans une prop voisine.
    const charge = JSON.stringify(itemsPourAffichage());
    expect(charge).not.toMatch(/"type"/);
    // PRÉSENCE D'ABORD : sans témoin, l'assertion ci-dessus serait vraie d'une charge vide.
    expect(charge).toContain(ITEMS[0].texte);
  });

  it("l'ordre d'affichage suit exactement l'ordre du jeu", () => {
    expect(itemsPourAffichage().map((a) => a.id)).toEqual(ITEMS.map((i) => i.id));
  });
});

describe("[5.5/AC1] les questions servent réellement de barème au calcul", () => {
  it("[LE CŒUR] répondre « presque toujours » aux deux questions d'un type le fait gagner", () => {
    // Le lien entre ce fichier et le calcul n'est prouvé nulle part ailleurs : `conclure` est testée
    // sur un barème fabriqué, et `ITEMS` sur sa forme. Ici les deux se rencontrent.
    for (const t of TYPES) {
      const reponses: ReponseItem[] = ITEMS.map((i) => ({ itemId: i.id, niveau: i.type === t ? 3 : 0 }));
      expect(conclure(reponses, ITEMS), `type ${t}`).toEqual({ statut: "retenu", type: t });
    }
  });

  it("un jeu de réponses uniformes ne désigne personne", () => {
    const reponses: ReponseItem[] = ITEMS.map((i) => ({ itemId: i.id, niveau: 2 }));
    expect(conclure(reponses, ITEMS).statut).toBe("indetermine");
  });
});

describe("[5.5/AC3] les questions passent les contrôles de voix du produit", () => {
  it("[CONTRÔLE DU CONTRÔLE] les détecteurs mordent bien sur des questions fabriquées fautives", () => {
    // Sans ce témoin, les deux tests suivants seraient vrais d'un détecteur cassé.
    expect(chercherInterdits("Je m'inquiète de ce qui pourrait mal tourner.").length).toBeGreaterThan(0);
    expect(chercherInterdits("Ce n'est pas un diagnostic.").length).toBeGreaterThan(0);
    expect(chercherPredictions("Le 4 finira par se sentir seul.").length).toBeGreaterThan(0);
  });

  it("[LE CŒUR] aucun énoncé ne porte de lexique interdit", () => {
    for (const i of ITEMS) {
      expect(chercherInterdits(i.texte), `${i.id} : « ${i.texte} »`).toEqual([]);
    }
  });

  it("[LE CŒUR] aucun énoncé ne prédit — le présent décrit, le futur annonce", () => {
    for (const i of ITEMS) {
      expect(chercherPredictions(i.texte), `${i.id} : « ${i.texte} »`).toEqual([]);
    }
  });

  it("les libellés de l'échelle passent les mêmes contrôles", () => {
    for (const [n, libelle] of Object.entries(LIBELLES_NIVEAU)) {
      expect(chercherInterdits(libelle), `niveau ${n}`).toEqual([]);
      expect(chercherPredictions(libelle), `niveau ${n}`).toEqual([]);
    }
  });

  it("chaque item pose une question comportementale située, à laquelle une fréquence répond", () => {
    for (const i of ITEMS) {
      expect(i.texte, i.id).toMatch(/\?$/);
      expect(i.texte, i.id).toContain("À quelle fréquence");
      expect(i.texte, i.id).not.toMatch(/Je suis|Je me sens|mon type/i);
    }
  });

  it("aucun énoncé ne nomme un type, un chiffre ou l'ennéagramme lui-même", () => {
    for (const i of ITEMS) {
      expect(i.texte, `${i.id} laisse deviner le barème`).not.toMatch(/\d|type|enn[ée]agramme/i);
    }
  });
});

describe("[5.5] le module reste PUR", () => {
  it("aucune horloge, aucun aléa, aucun accès à l'environnement", () => {
    // `Math.random` pour mélanger les questions est le réflexe évident, et il casserait le
    // déterminisme que l'AC1 exige.
    const source = readFileSync("lib/domain/enneagramme-items.ts", "utf-8");
    const sansCommentaires = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(sansCommentaires).not.toMatch(/Math\.random|Date\.now|new Date|process\.env|fetch\(/);
  });
});
