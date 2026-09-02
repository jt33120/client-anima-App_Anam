import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cleJourParis,
  delaiAvantProchainJourParis,
  phraseDOuverture,
  salutationDOuverture,
  saluerOuvertureEvenement,
  type MatiereOuverture,
  estUneArrivee,
} from "@/lib/domain/ouverture-seance";
import { marquerPremierTourDuJour, tourDepuisLigne } from "@/lib/data/depot-fil";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { tronquerATroisPhrases } from "@/lib/domain/voix-anam";

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
      { dejaVenue: null },
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

  it("accueille explicitement sans salutation dépendante de l'heure", () => {
    // ⚠️ « Bonsoir » a été relevé à 9 h 55 puis à 10 h 15 du matin (QA du 2026-08-19) : le serveur
    // est en UTC, et une salutation fausse sur le premier écran dit à quelqu'un que le lieu ne le
    // regarde pas. La leçon vaut ici aussi, et pour toutes les ouvertures.
    for (const c of [{}, { prenom: "Louise" }, { dejaVenue: true, branchesVivantes: ["ma sœur"] }]) {
      expect(dire(c)).toMatch(/^Te (re)?voilà/);
      expect(dire(c)).not.toMatch(/bonjour|bonsoir|bienvenue|salut\b|!/i);
    }
  });

  it("une ouverture précise porte la salutation dans le même tour", () => {
    // Retour du fondateur (2026-09-02) : « bannir les — qui font très IA ». La soudure était un
    // tiret cadratin ; c'est un deux-points, et pas un point, qui ferait de la salutation une
    // phrase de plus (voir « [LA COUTURE] » plus bas). La phrase de l'événement est reprise telle
    // quelle, majuscule comprise : ce module ne retouche pas une parole écrite ailleurs.
    expect(
      saluerOuvertureEvenement("Tu veux regarder ça avec moi ?", {
        prenom: "Louise",
        dejaVenue: true,
      }),
    ).toBe("Te revoilà, Louise : Tu veux regarder ça avec moi ?");
  });
});

describe("[ELLE SAIT, OU ELLE DIT QU'ELLE NE SAIT PAS]", () => {
  it("première fois : elle admet l'ignorance plutôt que de faire semblant", () => {
    expect(dire({})).toMatch(/je ne sais rien de toi/i);
  });

  it("lecture du passé impossible : elle ne prétend ni première fois ni retour", () => {
    const phrase = dire({ dejaVenue: null });
    expect(phrase).toMatch(/^Te voilà/);
    expect(phrase).not.toMatch(/revoilà|je ne sais rien de toi/i);
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

describe("[2026-09-02] DEUX RETOURS DU FONDATEUR : plus de confiance, plus de tirets", () => {
  // Les deux retours, tels quels : « "Je ne sais rien de toi et on fera avec" : trop sec, mets plus
  // en confiance » ; et « dans l'ensemble des textes de l'app, bannir les — qui font très IA ».
  //
  // ⚠️ CE QUE CES GARDES NE FONT PAS : réécrire le passé. La phrase d'ouverture est GRAVÉE dans le
  // journal immuable à la première ouverture du jour (`reclamerOuvertureDuJour`). Une chaîne
  // changée dans le module ne change que les ouvertures futures : c'est voulu, et aucune donnée
  // n'est touchée. Ces tests parlent donc de ce qu'Anam DIRA, jamais de ce qu'elle a dit.

  const MATIERES: Partial<MatiereOuverture>[] = [
    {},
    { prenom: "Louise" },
    { dejaVenue: true },
    { dejaVenue: true, prenom: "Louise" },
    { dejaVenue: true, branchesVivantes: ["le déménagement"] },
    { dejaVenue: true, prenom: "Louise", branchesVivantes: ["le déménagement", "ma sœur"] },
    { dejaVenue: null },
    { dejaVenue: null, prenom: "Louise" },
  ];
  const SALUTS: Pick<MatiereOuverture, "prenom" | "dejaVenue">[] = [
    { prenom: null, dejaVenue: false },
    { prenom: "Louise", dejaVenue: false },
    { prenom: null, dejaVenue: true },
    { prenom: "Louise", dejaVenue: true },
    { prenom: null, dejaVenue: null },
    { prenom: "Louise", dejaVenue: null },
  ];
  const EVENEMENT = "Tu veux regarder ça avec moi ?";
  /** Tout ce que le module peut dire : les trois fonctions publiques, avec et sans prénom. */
  const toutesLesParoles = (): string[] => [
    ...MATIERES.map(dire),
    ...SALUTS.map(salutationDOuverture),
    ...SALUTS.map((s) => saluerOuvertureEvenement(EVENEMENT, s)),
  ];
  const TIRET = /[—–]/;

  it("[LE CŒUR] aucune parole produite ne contient de tiret cadratin ni demi-cadratin", () => {
    for (const p of toutesLesParoles()) {
      expect(p, `un tiret dans « ${p} »`).not.toMatch(TIRET);
    }
  });

  it("[LE CŒUR] et aucune CHAÎNE du module n'en garde un (les commentaires, eux, peuvent)", () => {
    // Le test précédent ne voit que les branches qu'il exerce ; celui-ci lit le source, commentaires
    // retirés, pour qu'un tiret glissé dans une chaîne future rougisse sans qu'on pense à l'exercer.
    const source = readFileSync(resolve(process.cwd(), "lib/domain/ouverture-seance.ts"), "utf-8");
    expect(source.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")).not.toMatch(TIRET);
  });

  it("[ANTI-VACUITÉ] le module ne blanchit pas un tiret venu d'ailleurs : la garde vise SA soudure", () => {
    // Si les deux gardes ci-dessus passaient grâce à un nettoyage de l'entrée, elles ne prouveraient
    // rien sur la soudure. La phrase d'un événement est reprise telle quelle : un tiret qu'elle
    // porte est à bannir là où elle est écrite (`PHRASE_PAUSE`, `PHRASE_SOCLE_COMPLETE`…), pas ici.
    expect(saluerOuvertureEvenement("Tu peux continuer — les deux se valent.", SALUTS[3])).toMatch(TIRET);
  });

  it("la soudure est un deux-points, avec et sans prénom, et l'événement garde sa majuscule", () => {
    expect(saluerOuvertureEvenement(EVENEMENT, SALUTS[0])).toBe("Te voilà : Tu veux regarder ça avec moi ?");
    expect(dire({ prenom: "Louise" })).toMatch(/^Te voilà, Louise : je /);
    expect(dire({})).toMatch(/^Te voilà : je /);
  });

  it("[LA COUTURE] la salutation ne compte pas pour une phrase aux yeux de la voix (2.8)", () => {
    // ⚠️ C'EST LA RAISON DU DEUX-POINTS, prouvée avec le VRAI coupeur de `voix-anam.ts` et non avec
    // un compte maison : `:` n'est pas une ponctuation finale, donc « Te voilà, Louise : » reste
    // dans la première phrase. Avec un point, une première venue (deux phrases de confiance et une
    // question) ou un événement de trois phrases passeraient à quatre, et seraient tronqués.
    for (const p of toutesLesParoles()) {
      expect(tronquerATroisPhrases(p), `tronquée : « ${p} »`).toEqual({ texte: p, tronque: false });
    }
    const troisPhrases = "Tu es venue souvent. Ce que tu as déposé reste là. Tu peux laisser reposer, ou continuer.";
    expect(tronquerATroisPhrases(saluerOuvertureEvenement(troisPhrases, SALUTS[3])).tronque).toBe(false);
    // Et la preuve par le contraire : la même salutation suivie d'un point EST une quatrième phrase.
    expect(tronquerATroisPhrases(`Te revoilà, Louise. ${troisPhrases}`).tronque).toBe(true);
  });

  it("[LE CŒUR] première venue : l'ignorance reste dite, et la suite met en confiance", () => {
    // Le noyau « je ne sais rien de toi » est ce qui distingue une première venue d'un retour ; la
    // suite ne constate plus (« on va faire avec »), elle rassure : c'est normal, à son rythme, rien
    // n'est attendu d'elle. Les trois mots-clés ci-dessous sont STABLES : ils SONT la marque de
    // confiance, et une reformulation qui les perdrait doit repasser par ici.
    for (const m of [{}, { prenom: "Louise" }]) {
      const p = dire(m);
      expect(p).toMatch(/je ne sais rien de toi/i);
      expect(p).toMatch(/c’est normal/);
      expect(p).toMatch(/à ton rythme/);
      expect(p).toMatch(/rien n’est attendu de toi/);
      // La formule jugée « trop sec » ne revient pas, ni au futur ni au présent.
      expect(p).not.toMatch(/on (va faire|fera) avec/);
      // Elle demande, elle n'ordonne pas : le tout premier jet disait « Raconte-moi ».
      expect(p).not.toMatch(/\b(raconte|dis|parle|explique)(-moi)?\b/i);
    }
  });

  it("[ANTI-VACUITÉ] la confiance se dit à la première venue, elle n'est pas récitée à chaque retour", () => {
    // Sans ce test, les mots-clés ci-dessus pourraient être un tic de langage présent partout, et la
    // garde ne distinguerait plus une première venue d'un retour.
    for (const m of [{ dejaVenue: true }, { dejaVenue: true, branchesVivantes: ["ma sœur"] }, { dejaVenue: null }]) {
      expect(dire(m)).not.toMatch(/rythme|rien n’est attendu/);
    }
  });

  it("[FR-053] aucune prédiction adressée, et rien du lexique interdit, dans aucune parole", () => {
    // « On avance à ton rythme » est au présent : ce n'est ni « tu verras », ni « tu vas
    // découvrir ». Le détecteur de prédiction et le lexique de la voix sont ceux qui relisent le
    // corpus : une ouverture qui les ferait rougir n'a pas le droit d'être dite.
    for (const p of toutesLesParoles()) {
      expect(chercherPredictions(p), `prédiction dans « ${p} »`).toEqual([]);
      expect(chercherInterdits(p), `interdit dans « ${p} »`).toEqual([]);
    }
  });
});

describe("[CÂBLAGE] elle ne prend la place de personne", () => {
  const page = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf-8");

  it("l'ouverture quotidienne et la réévaluation après geste ont deux actions explicites", () => {
    expect(page).toMatch(/onReclamerOuvertureQuotidienne=\{reclamerOuvertureDuJour\}/);
    expect(page).toMatch(/onChargerOuvertureCourante=\{chargerOuvertureCourante\}/);
  });

  it("[LE CŒUR] aucune première parole éphémère ne subsiste dans le contrat de rendu", () => {
    const types = readFileSync(resolve(process.cwd(), "render/conversation/types.ts"), "utf-8");
    expect(types).not.toContain('type: "premiere-parole"');
  });
});

describe("[2026-08-26] ANAM OUVRE AU PREMIER ACCÈS DU JOUR PARISIEN", () => {
  const maintenant = new Date("2026-08-26T10:00:00Z"); // midi à Paris

  it("[LE CŒUR] quatre heures le même jour ne produisent pas une seconde ouverture", () => {
    expect(estUneArrivee("2026-08-26T06:00:00Z", maintenant)).toBe(false);
  });

  it("[LE CŒUR] une parole à 23 h 59 la veille déclenche l'ouverture du nouveau jour", () => {
    expect(estUneArrivee("2026-08-25T21:59:00Z", maintenant)).toBe(true);
  });

  it("une parole à 00 h 01 appartient déjà à aujourd'hui, même si elle est proche de minuit", () => {
    expect(estUneArrivee("2026-08-25T22:01:00Z", maintenant)).toBe(false);
  });

  it("le changement d'heure d'hiver ne change pas la définition du jour", () => {
    expect(cleJourParis(new Date("2026-01-15T23:05:00Z"))).toBe("2026-01-16");
    expect(estUneArrivee("2026-01-15T22:55:00Z", new Date("2026-01-15T23:05:00Z"))).toBe(true);
  });

  it("le passage à l'heure d'été garde une seule clé civile", () => {
    expect(cleJourParis(new Date("2026-03-29T00:30:00Z"))).toBe("2026-03-29");
    expect(cleJourParis(new Date("2026-03-29T01:30:00Z"))).toBe("2026-03-29");
  });

  it("l'heure répétée au retour d'hiver ne fabrique pas deux journées", () => {
    expect(cleJourParis(new Date("2026-10-25T00:30:00Z"))).toBe("2026-10-25");
    expect(cleJourParis(new Date("2026-10-25T01:30:00Z"))).toBe("2026-10-25");
  });

  it("le serveur rend un délai relatif juste jusqu'à minuit, y compris aux changements d'heure", () => {
    expect(delaiAvantProchainJourParis(new Date("2026-08-26T10:00:00Z"))).toBe(12 * 3_600_000);
    expect(delaiAvantProchainJourParis(new Date("2026-03-28T23:00:00Z"))).toBe(23 * 3_600_000);
    expect(delaiAvantProchainJourParis(new Date("2026-10-24T22:00:00Z"))).toBe(25 * 3_600_000);
  });

  it("aucun tour, ou un horodatage illisible → arrivée (le repli parle plutôt que de se taire)", () => {
    expect(estUneArrivee(null, maintenant)).toBe(true);
    expect(estUneArrivee("pas une date", maintenant)).toBe(true);
    expect(estUneArrivee("", maintenant)).toBe(true);
  });

  it("[ANTI-VACUITÉ] la fonction discrimine bien hier d'aujourd'hui", () => {
    expect(
      new Set([
        estUneArrivee("2026-08-25T21:59:00Z", maintenant),
        estUneArrivee("2026-08-25T22:01:00Z", maintenant),
      ]).size,
    ).toBe(2);
  });

  it("la PAGE ne décide plus depuis un historique glissant ni depuis un fil vide", () => {
    // La date est vérifiée au geste par l'action/RPC : une page restée ouverte à minuit ne doit
    // jamais garder la décision calculée lors de son rendu initial.
    const page = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf-8");
    expect(page.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")).not.toMatch(/estUneArrivee|derniereParole/);
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

  it("`cle_tour` devient la même identité que les tours optimistes du navigateur", () => {
    expect(
      tourDepuisLigne({
        ...ligne,
        cle_tour: "11111111-1111-4111-8111-111111111111",
      })?.id,
    ).toBe("anam:11111111-1111-4111-8111-111111111111");
    const source = readFileSync(
      resolve(process.cwd(), "render/conversation/Conversation.tsx"),
      "utf8",
    );
    expect(source).toContain("const idAnam = `anam:${jeton}`");
    expect(source).toContain("id: `utilisatrice:${jeton}`");
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
    const maintenant = new Date("2026-08-26T10:00:00Z");
    const hier = tourDepuisLigne({ ...ligne, cree_le: "2026-08-25T21:59:00Z" })!;
    const aujourdhui = tourDepuisLigne({ ...ligne, cree_le: "2026-08-25T22:01:00Z" })!;
    expect(estUneArrivee(hier.creeLe, maintenant)).toBe(true);
    expect(estUneArrivee(aujourdhui.creeLe, maintenant)).toBe(false);
  });

  it("place le repère Aujourd'hui exactement avant le premier tour du jour", () => {
    const maintenant = new Date("2026-08-26T10:00:00Z");
    const tours = [
      tourDepuisLigne({ ...ligne, id: "hier", cree_le: "2026-08-25T21:59:00Z" })!,
      tourDepuisLigne({ ...ligne, id: "matin", cree_le: "2026-08-26T06:00:00Z" })!,
      tourDepuisLigne({ ...ligne, id: "midi", cree_le: "2026-08-26T10:00:00Z" })!,
    ];
    expect(marquerPremierTourDuJour(tours, maintenant).map((t) => t.separateurAvant ?? false)).toEqual([
      false,
      true,
      false,
    ]);
  });
});
