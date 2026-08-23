import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { phraseDOuverture, type MatiereOuverture } from "@/lib/domain/ouverture-seance";

/**
 * ouverture-seance.test.ts — C'EST ANAM QUI PARLE LA PREMIÈRE (retour du 2026-08-23).
 *
 * ══ CE QUI ÉTAIT VRAI AVANT ══════════════════════════════════════════════════════════════════════
 *
 * Une ouverture existait, mais uniquement pour des ÉVÉNEMENTS décidés par le serveur : une
 * proposition de branche, une invitation, la complétion du socle, une hypothèse, une pause. Sur une
 * arrivée ordinaire — c'est-à-dire dans le cas le plus fréquent, et dans le tout premier de tous —
 * `chargerOuverture` rendait `null`, le fil restait vide, et l'écran était un composeur qui attend.
 * La personne devait trouver quoi dire à une machine.
 */

const VIDE: MatiereOuverture = { prenom: null, branchesVivantes: [], dejaVenue: false };
const dire = (m: Partial<MatiereOuverture>) => phraseDOuverture({ ...VIDE, ...m });

describe("[ELLE PARLE, ET ELLE MÈNE]", () => {
  it("toute ouverture finit par une question — sinon elle laisse le silence qu'elle répare", () => {
    const cas: Partial<MatiereOuverture>[] = [
      {},
      { prenom: "Louise" },
      { dejaVenue: true },
      { dejaVenue: true, prenom: "Louise" },
      { dejaVenue: true, branchesVivantes: ["le déménagement"] },
      { dejaVenue: true, prenom: "Louise", branchesVivantes: ["le déménagement", "ma sœur"] },
    ];
    for (const c of cas) {
      expect(dire(c), `sans question : « ${dire(c)} »`).toMatch(/\?/);
    }
  });

  it("trois phrases au maximum — la voix (2.8) plafonne, et une ouverture bavarde fait fuir", () => {
    for (const c of [{}, { prenom: "Louise" }, { dejaVenue: true, branchesVivantes: ["ma sœur"] }]) {
      const phrases = dire(c).split(/[.?]\s/).filter((x) => x.trim().length > 0);
      expect(phrases.length, `« ${dire(c)} » fait ${phrases.length} phrases`).toBeLessThanOrEqual(3);
    }
  });

  it("aucune salutation d'heure, aucun « bienvenue », aucun point d'exclamation", () => {
    // ⚠️ « Bonsoir » a été relevé à 9 h 55 puis à 10 h 15 du matin (QA du 2026-08-19) : le serveur
    // est en UTC, et une salutation fausse sur le premier écran dit à quelqu'un que le lieu ne le
    // regarde pas. La leçon vaut ici aussi, et pour toutes les ouvertures.
    for (const c of [{}, { prenom: "Louise" }, { dejaVenue: true, branchesVivantes: ["ma sœur"] }]) {
      expect(dire(c)).not.toMatch(/bonjour|bonsoir|bienvenue|salut\b|!/i);
    }
  });
});

describe("[ELLE SAIT, OU ELLE DIT QU'ELLE NE SAIT PAS]", () => {
  it("première fois : elle admet l'ignorance plutôt que de faire semblant", () => {
    expect(dire({})).toMatch(/je ne sais rien de toi/i);
  });

  it("le prénom est repris quand il existe, jamais inventé quand il manque", () => {
    expect(dire({ prenom: "Louise" })).toContain("Louise");
    expect(dire({ dejaVenue: true, prenom: "Louise" })).toContain("Louise");
    // Sans prénom, aucune adresse fabriquée — ni « toi », ni un blanc bancal en tête de phrase.
    const sansNom = dire({ dejaVenue: true });
    expect(sansNom).not.toMatch(/^\s|,\s*on avait/);
    expect(sansNom[0]).toMatch(/[A-ZÀ-Ý]/);
  });

  it("[LE CŒUR] elle rend le nom d'une branche — SON mot, pas une extraction", () => {
    // ⚠️ LA DISTINCTION PORTE TOUT. Un fait retenu est une REFORMULATION par un modèle (4.2) :
    // ouvrir en assénant « la dernière fois tu m'as dit que tu dormais mal » pose un verdict là où
    // le produit ne pose que des hypothèses (FR-023). Le nom d'une branche, lui, est le mot qu'elle
    // a choisi — le lui rendre prouve qu'on l'a gardé, sans rien affirmer d'elle.
    const p = dire({ dejaVenue: true, branchesVivantes: ["le déménagement", "ma sœur"] });
    expect(p).toContain("le déménagement");
    expect(p, "la plus récente seulement : deux noms feraient un inventaire").not.toContain("ma sœur");
  });

  it("reprendre n'est jamais une consigne — le refus tient dans la même phrase", () => {
    expect(dire({ dejaVenue: true, branchesVivantes: ["ma sœur"] })).toMatch(/ou partir d’ailleurs/);
  });

  it("[FR-031] aucun chiffre, quelle que soit la matière", () => {
    const p = dire({ dejaVenue: true, prenom: "Louise", branchesVivantes: ["a", "b", "c", "d", "e"] });
    expect(p.match(/\d+/g) ?? []).toEqual([]);
  });
});

describe("[CÂBLAGE] elle ne prend la place de personne", () => {
  const page = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf-8");

  it("elle n'ouvre QUE s'il n'y a rien d'autre à ouvrir ET que le fil est vide", () => {
    // Empilée sur une proposition de branche, elle ferait parler Anam deux fois avant qu'on ait dit
    // un mot ; posée sur un fil en cours, elle se présenterait au milieu d'une phrase.
    expect(page).toMatch(/ouverture\s*\?\?/);
    expect(page).toMatch(/historique\.length === 0/);
  });

  it("[LE CŒUR] la clé d'ouverture porte la PHRASE — sans quoi Anam se répète", () => {
    // Sans identifiant en base, une clé constante ferait rejouer la même parole en tête d'un fil
    // qui la contient déjà, à chaque rafraîchissement.
    const conv = readFileSync(resolve(process.cwd(), "render/conversation/Conversation.tsx"), "utf-8");
    expect(conv).toMatch(/case "premiere-parole":[\s\S]{0,600}return `o:\$\{o\.phrase\}`/);
  });
});
