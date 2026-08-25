import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { phraseDOuverture, type MatiereOuverture, estUneArrivee, REPRISE_HEURES } from "@/lib/domain/ouverture-seance";
import { tourDepuisLigne } from "@/lib/data/depot-fil";

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

  it("elle n'ouvre QUE s'il n'y a rien d'autre à ouvrir — la priorité est intacte", () => {
    // Empilée sur une proposition de branche, elle ferait parler Anam deux fois avant qu'on ait dit
    // un mot. Le `??` est ce qui la met EN DERNIER, et cette moitié-là ne bouge pas.
    //
    // ⚠️ LA SECONDE MOITIÉ DE CETTE GARDE ÉPELAIT `historique.length === 0`, c'est-à-dire la
    // CONDITION du 23 août — et cette condition était le défaut. Une garde qui recopie une ligne
    // de code ne protège pas une propriété : elle interdit de la corriger. La règle d'arrivée est
    // mesurée pour ce qu'elle FAIT, dans le bloc « ANAM OUVRE À CHAQUE ARRIVÉE » plus bas.
    expect(page).toMatch(/ouverture\s*\?\?/);
  });

  it("[LE CŒUR] la clé d'ouverture porte la PHRASE — sans quoi Anam se répète", () => {
    // Sans identifiant en base, une clé constante ferait rejouer la même parole en tête d'un fil
    // qui la contient déjà, à chaque rafraîchissement.
    const conv = readFileSync(resolve(process.cwd(), "render/conversation/Conversation.tsx"), "utf-8");
    expect(conv).toMatch(/case "premiere-parole":[\s\S]{0,600}return `o:\$\{o\.phrase\}`/);
  });
});

describe("[2026-08-25] ANAM OUVRE À CHAQUE ARRIVÉE, pas seulement sur un fil vide", () => {
  // ⚠️ LE DÉFAUT QUE CETTE GARDE FERME. La condition était « le fil est vide », et le fil couvre
  // 24 h glissantes : quelqu'un qui avait parlé la veille au soir revenait sur un fil NON vide,
  // donc sans un mot d'Anam. Elle n'ouvrait que pour une absente de plus d'un jour — c'est-à-dire
  // jamais pour celle qui revient. Retour d'usage : « ça fait juste parler à ChatGPT ».
  const T = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const maintenant = new Date();

  it("[LE CŒUR] un fil NON vide mais ancien est une arrivée — c'est tout le correctif", () => {
    expect(estUneArrivee(T(4), maintenant), "4 h de silence : elle doit ouvrir").toBe(true);
    expect(estUneArrivee(T(20), maintenant), "20 h : dans la fenêtre du fil, et pourtant une arrivée").toBe(true);
  });

  it("[LE CŒUR] une pause DANS un échange n'en est pas une — la resaluer serait un bug", () => {
    expect(estUneArrivee(T(0.1), maintenant), "six minutes").toBe(false);
    expect(estUneArrivee(T(1), maintenant), "une heure").toBe(false);
  });

  it("l'écart est de plusieurs heures — ni un seuil de minutes, ni un jour entier", () => {
    // Une valeur trop courte resalue au milieu d'une conversation ; trop longue, on retombe dans
    // le défaut qu'on vient de corriger. La borne est mesurée, pas décrite en prose.
    expect(REPRISE_HEURES).toBeGreaterThanOrEqual(2);
    expect(REPRISE_HEURES).toBeLessThanOrEqual(8);
  });

  it("aucun tour, ou un horodatage illisible → arrivée (le repli parle plutôt que de se taire)", () => {
    expect(estUneArrivee(null, maintenant)).toBe(true);
    expect(estUneArrivee("pas une date", maintenant)).toBe(true);
    expect(estUneArrivee("", maintenant)).toBe(true);
  });

  it("[ANTI-VACUITÉ] la fonction DISCRIMINE — sinon les quatre tests ci-dessus sont gratuits", () => {
    // Une implémentation `() => true` passerait tout ce qui précède sauf ceci.
    expect(new Set([estUneArrivee(T(0.1), maintenant), estUneArrivee(T(20), maintenant)]).size).toBe(2);
  });

  it("la PAGE consulte l'écart, et ne demande plus si le fil est vide", () => {
    // Garde de câblage : la règle peut être parfaite et n'être appelée par personne. C'est
    // exactement ce qui rendait l'ancienne condition invisible — elle vivait dans la page.
    const page = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf-8");
    expect(page, "la page n'appelle pas la règle d'arrivée").toMatch(/estUneArrivee\(derniereParole, maintenant\)/);
    expect(page.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""), "la page décide encore sur un fil vide").not.toMatch(
      /historique\.length === 0/,
    );
  });
});

describe("[LE FIL REND L'HORODATAGE] sans lui, la règle d'arrivée retombe sur son repli", () => {
  // ⚠️ CETTE GARDE EST NÉE D'UN MUTANT SURVIVANT. Retirer le contrôle de `cree_le` ne faisait
  // rougir personne, parce que la conversion vivait en ligne dans une fonction adossée à la base.
  // Elle n'est pas cosmétique : sans horodatage, `estUneArrivee` rend `true` par sûreté, et Anam
  // salue à CHAQUE rechargement — y compris au milieu d'un échange, ce que la règle interdit.
  const ligne = { id: "e1", role: "anam", contenu: "bonjour", cree_le: "2026-08-25T08:00:00Z" };

  it("[LE CŒUR] une ligne complète rend un tour QUI PORTE `creeLe`", () => {
    expect(tourDepuisLigne(ligne)).toEqual({
      id: "e1", role: "anam", texte: "bonjour", creeLe: "2026-08-25T08:00:00Z",
    });
  });

  it("une ligne SANS horodatage est écartée — jamais rendue avec un champ vide", () => {
    expect(tourDepuisLigne({ ...ligne, cree_le: undefined })).toBeNull();
    expect(tourDepuisLigne({ ...ligne, cree_le: "" })).toBeNull();
    expect(tourDepuisLigne({ ...ligne, cree_le: 1234 })).toBeNull();
  });

  it("les autres mutilations sont écartées aussi (rôle inconnu, contenu absent)", () => {
    expect(tourDepuisLigne({ ...ligne, role: "systeme" })).toBeNull();
    expect(tourDepuisLigne({ ...ligne, contenu: undefined })).toBeNull();
    expect(tourDepuisLigne({ ...ligne, id: 7 })).toBeNull();
    expect(tourDepuisLigne(null)).toBeNull();
  });

  it("[LA COUTURE] ce que le fil rend nourrit DIRECTEMENT la règle d'arrivée", () => {
    // Le bout à bout, sans base : une ligne d'il y a cinq heures est une arrivée, une d'il y a
    // dix minutes n'en est pas une. C'est la seule chose que l'utilisatrice constate.
    const ilYA = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
    const vieux = tourDepuisLigne({ ...ligne, cree_le: ilYA(5) })!;
    const frais = tourDepuisLigne({ ...ligne, cree_le: ilYA(0.17) })!;
    expect(estUneArrivee(vieux.creeLe, new Date())).toBe(true);
    expect(estUneArrivee(frais.creeLe, new Date())).toBe(false);
  });
});
