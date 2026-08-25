import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BUDGET_COMPACTAGE_CARACTERES,
  CARTE_CHAMP_MAX,
  CARTE_VIDE,
  CHAMPS_CARTE,
  PLANCHER_COMPACTAGE_TOURS,
  carteEstVide,
  consigneCarte,
  doitCompacter,
  type CarteContexte,
} from "@/lib/domain/carte-contexte";
import { analyserCompactage, consigneCompactage } from "@/lib/domain/consigne-compactage";

/**
 * carte-contexte.test.ts — LA COUCHE QUI COMPREND, ET QUI NE SE MONTRE NULLE PART.
 *
 * « Je veux une architecture de contexte pour qu'Anam soit vraiment utile, une architecture de
 * mémoire et de compacting intelligente pour garder ce qui est important et enlever le bruit. »
 *
 * Ce que ces gardes tiennent n'est pas la qualité de la carte — aucun test ne peut la juger. Elles
 * tiennent les trois choses qui, si elles cèdent, transforment une aide en dossier : qu'aucun
 * chiffre n'y entre, qu'elle ne se récite pas, et qu'une sortie mal formée ne l'abîme pas.
 */

const pleine: CarteContexte = {
  presentant: "le sommeil qui ne vient pas",
  precipitant: "un appel de sa sœur samedi",
  predisposant: null,
  perpetuant: "elle repousse le coucher pour avoir du temps à elle",
  protecteur: "elle sait s’arrêter quand elle marche",
};

describe("[LA FORME] cinq champs, et le vide est un état normal", () => {
  it("une carte neuve est vide, et le dit", () => {
    expect(carteEstVide(CARTE_VIDE)).toBe(true);
    expect(carteEstVide(pleine)).toBe(false);
  });

  it("un seul champ suffit à ne plus être vide — une carte partielle est la règle, pas l'exception", () => {
    expect(carteEstVide({ ...CARTE_VIDE, precipitant: "un appel" })).toBe(false);
  });

  it("les cinq clés sont déclarées une seule fois, et le déclencheur en fait partie", () => {
    // `precipitant` est le champ que Julian avait décrit sans le nommer : « savoir si c'est un
    // déclencheur qui l'a poussée à nous amener ». C'est aussi le plus utile des cinq.
    expect([...CHAMPS_CARTE]).toEqual([
      "presentant",
      "precipitant",
      "predisposant",
      "perpetuant",
      "protecteur",
    ]);
  });
});

describe("[LE COMPACTAGE] il se déclenche sur la LONGUEUR, pas sur l'horloge", () => {
  // Décision du 2026-08-25 : « c'est comme un compact — quand la conversation devient trop longue,
  // elle met à jour, pour maximiser la capacité de l'IA et s'adapter au rythme de chacun ». Un job
  // quotidien mettrait tout le monde au même rythme et paierait pour des gens qui n'ont rien dit.
  const tours = (n: number, taille: number) => ({ longueurs: Array(n).fill(taille) });

  it("[LE CŒUR] une longue conversation compacte", () => {
    expect(doitCompacter(tours(PLANCHER_COMPACTAGE_TOURS, BUDGET_COMPACTAGE_CARACTERES))).toBe(true);
  });

  it("[LE CŒUR] une conversation courte ne compacte pas, même après beaucoup de tours", () => {
    // Quelqu'un qui répond par trois mots peut faire vingt tours sans matière à résumer.
    expect(doitCompacter(tours(20, 10))).toBe(false);
  });

  it("le PLANCHER protège d'un résumé plus long que ce qu'il résume", () => {
    // Un seul tour très long dépasse le budget, et n'a rien à condenser : le résumé en perdrait
    // les mots sans rien gagner.
    expect(doitCompacter({ longueurs: [BUDGET_COMPACTAGE_CARACTERES * 3] })).toBe(false);
  });

  it("[ANTI-VACUITÉ] la fonction DISCRIMINE — sinon les trois tests ci-dessus sont gratuits", () => {
    const verdicts = new Set([
      doitCompacter(tours(PLANCHER_COMPACTAGE_TOURS, BUDGET_COMPACTAGE_CARACTERES)),
      doitCompacter(tours(20, 10)),
    ]);
    expect(verdicts.size, "`doitCompacter` rend toujours la même chose").toBe(2);
  });

  it("les seuils sont des ordres de grandeur plausibles, pas des valeurs par défaut oubliées", () => {
    expect(PLANCHER_COMPACTAGE_TOURS).toBeGreaterThanOrEqual(4);
    expect(BUDGET_COMPACTAGE_CARACTERES).toBeGreaterThan(2000);
    expect(BUDGET_COMPACTAGE_CARACTERES).toBeLessThan(40000);
  });
});

describe("[LA CONSIGNE] elle porte la carte sans la montrer", () => {
  it("une carte vide ne produit AUCUNE consigne — dire « je ne sais rien » ici est du bruit", () => {
    expect(consigneCarte(CARTE_VIDE)).toBeNull();
  });

  it("[LE CŒUR] elle interdit explicitement de réciter la carte", () => {
    // Décision du 2026-08-25 : invisible partout. Une formulation énoncée devient un verdict, et
    // c'est FR-023 qui tombe. L'interdit est ÉCRIT, pas seulement espéré.
    const c = consigneCarte(pleine)!;
    expect(c.role).toBe("system");
    expect(c.content).toMatch(/ne le récites JAMAIS|ne l’annonces jamais/i);
    expect(c.content, "elle ne dit pas que la carte est invisible pour elle").toMatch(
      /ne s’affiche nulle part|elle ne l’a jamais lu/i,
    );
  });

  it("chaque ligne est posée comme réfutable — jamais comme un fait acquis", () => {
    expect(consigneCarte(pleine)!.content).toMatch(/hypothèse que tu peux avoir mal comprise|c’est elle qui a raison/i);
  });

  it("[FR-031] aucun chiffre ne peut sortir par la consigne", () => {
    const c = consigneCarte(pleine)!;
    expect(c.content.match(/\d/g) ?? []).toEqual([]);
  });

  it("les champs vides ne laissent pas de ligne creuse", () => {
    // `predisposant` est nul ici : une ligne « Ce qui rendait ça possible : » vide se lirait comme
    // un trou à combler, et un modèle comble les trous.
    expect(consigneCarte(pleine)!.content).not.toMatch(/rendait ça possible/);
  });
});

describe("[L'ANALYSE] elle REFUSE plutôt que de deviner", () => {
  const gabarit = (v: Partial<Record<string, string>>) =>
    [
      `Ce qu’elle amène : ${v.presentant ?? ""}`,
      `Ce qui l’a déclenché : ${v.precipitant ?? ""}`,
      `Ce qui rendait ça possible : ${v.predisposant ?? ""}`,
      `Ce qui l’entretient : ${v.perpetuant ?? ""}`,
      `Ce qui tient déjà : ${v.protecteur ?? ""}`,
    ].join("\n");

  it("[LE CŒUR] une sortie bien formée remplit les champs lus", () => {
    const r = analyserCompactage(gabarit({ precipitant: "un appel de sa sœur" }), CARTE_VIDE);
    expect(r.precipitant).toBe("un appel de sa sœur");
    expect(r.presentant, "un champ vide n’écrase rien").toBeNull();
  });

  it("[LE CŒUR / FR-031] un champ qui contient un CHIFFRE est rejeté, pas nettoyé", () => {
    // « 3 fois cette semaine » est la sortie la plus probable d'un modèle qui résume. La ligne est
    // écartée entière : nettoyer le chiffre laisserait une phrase amputée qui se réinjecte à
    // chaque tour. La base refuse aussi (contrainte `carte_contexte_sans_chiffre`) — ceci est la
    // première ligne, pas la seule.
    const r = analyserCompactage(gabarit({ perpetuant: "elle y revient 3 fois par semaine" }), pleine);
    expect(r.perpetuant, "le chiffre est passé").toBe(pleine.perpetuant);
  });

  it("un champ trop long est rejeté — au-delà, un modèle récite au lieu de s'en servir", () => {
    const r = analyserCompactage(gabarit({ presentant: "x".repeat(CARTE_CHAMP_MAX + 1) }), pleine);
    expect(r.presentant).toBe(pleine.presentant);
  });

  it("[LE CŒUR] une sortie qui ne suit PAS le gabarit laisse la carte INTACTE", () => {
    // Un champ écrit de travers se réinjecte à chaque tour suivant, et une mauvaise hypothèse
    // répétée devient un fait pour le modèle. On préfère ne rien apprendre.
    expect(analyserCompactage("Je n’ai pas compris la demande.", pleine)).toEqual(pleine);
    expect(analyserCompactage("", pleine)).toEqual(pleine);
  });

  it("une sortie PARTIELLE ne perd pas ce qui était déjà su", () => {
    const r = analyserCompactage(gabarit({ presentant: "autre chose" }), pleine);
    expect(r.presentant).toBe("autre chose");
    expect(r.precipitant, "le reste de la carte a été effacé").toBe(pleine.precipitant);
    expect(r.protecteur).toBe(pleine.protecteur);
  });
});

describe("[LA CONSIGNE DE FABRICATION] ce qu'elle refuse au modèle", () => {
  const c = consigneCompactage(CARTE_VIDE).content;

  it("[LE CŒUR] elle refuse le portrait, le pronostic et le conseil — les trois sorties par défaut", () => {
    // Un modèle à qui l'on demande de résumer ce qu'il comprend de quelqu'un produit spontanément
    // un type de personnalité, une cause d'enfance et un pronostic. Ces refus ne sont pas de
    // principe : ce sont les sorties les plus probables, nommées pour être écartées.
    expect(c).toMatch(/aucun portrait/i);
    expect(c).toMatch(/aucun pronostic|aucune prédiction/i);
    expect(c).toMatch(/aucun conseil/i);
  });

  it("[FR-031] elle interdit les chiffres nommément", () => {
    expect(c).toMatch(/AUCUN CHIFFRE/);
  });

  it("elle demande SES mots, et refuse la traduction en plus propre", () => {
    expect(c).toMatch(/SES MOTS À ELLE/);
    expect(c).toMatch(/crevée/);
  });

  it("une ligne vide vaut mieux qu'une ligne inventée — c'est dit", () => {
    expect(c).toMatch(/vide vaut infiniment mieux/i);
  });

  it("elle dit que la carte ne sera jamais montrée", () => {
    expect(c).toMatch(/JAMAIS montrée/);
  });
});

describe("[PARITÉ] la borne du code et celle de la base disent le même nombre", () => {
  it("[LE CŒUR] `CARTE_CHAMP_MAX` vaut la contrainte SQL — sinon l'une des deux ment", () => {
    // Le patron des jetons de style : deux copies d'une même valeur finissent par diverger, et la
    // divergence est silencieuse jusqu'au jour où une écriture est refusée sans qu'on sache pourquoi.
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/0079_carte_contexte.sql"), "utf-8");
    const bornes = [...sql.matchAll(/length\((\w+)\), 0\)\s*<=\s*(\d+)/g)].map((m) => Number(m[2]));
    expect(bornes.length, "la contrainte de longueur a disparu de la migration").toBe(CHAMPS_CARTE.length);
    for (const b of bornes) expect(b).toBe(CARTE_CHAMP_MAX);
  });

  it("[LE CŒUR] la base refuse les chiffres, pas seulement le code", () => {
    // ⚠️ LA GARDE DOIT VIVRE DANS LA BASE. `authenticated` détient les sept privilèges DML : une
    // règle écrite seulement en TypeScript se contourne. Ici la table est en deny-all, mais la
    // contrainte reste ce qui décide — c'est la doctrine du dépôt depuis la 0001.
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/0079_carte_contexte.sql"), "utf-8");
    expect(sql).toMatch(/carte_contexte_sans_chiffre/);
    for (const champ of CHAMPS_CARTE) {
      expect(sql, `${champ} n’est pas gardé contre les chiffres`).toMatch(
        new RegExp(`coalesce\\(${champ}, ''\\)\\s*!~ '\\[0-9\\]'`),
      );
    }
  });

  it("[LE CŒUR] la table est en RLS FORCÉE et sans policy — invisible veut dire invisible", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/0079_carte_contexte.sql"), "utf-8");
    expect(sql).toMatch(/alter table public\.carte_contexte enable row level security/);
    expect(sql).toMatch(/alter table public\.carte_contexte force row level security/);
    expect(sql).toMatch(/revoke all on public\.carte_contexte from authenticated, anon/);
    // Aucune policy : une seule suffirait à ouvrir la table à `authenticated`.
    expect(
      sql.match(/create policy[\s\S]*?on public\.carte_contexte/g) ?? [],
      "une policy est apparue sur une table qui ne doit être lisible par personne",
    ).toEqual([]);
  });
});
