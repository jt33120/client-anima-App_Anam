import { describe, expect, it } from "vitest";
import {
  consigneHoroscope,
  faitsDeToi,
  faitsDuCiel,
  messagesHoroscope,
} from "@/lib/domain/consigne-horoscope";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";
import type { MatiereContexte } from "@/lib/domain/contexte-anam";
import type { SignatureDuCiel } from "@/lib/domain/signature-ciel";
import type { SocleNatalDit } from "@/lib/domain/socle-natal-dit";
import type { JourCivil } from "@/lib/astro/quotidien";

/**
 * LA CONSIGNE DU TEXTE DU JOUR (2026-09-02, trois parties depuis le 2026-09-07).
 *
 * Trois choses se gardent ici, et la troisième est celle qu'on oublie :
 *
 *   • CE QUI PART. `faitsDuCiel` et `faitsDeToi` sont les DEUX seuls endroits où la matière devient
 *     du texte. C'est donc le dernier point où une donnée qui n'a rien à faire dehors — un
 *     identifiant, une date de naissance, un degré — pourrait rentrer par une mise en mots trop
 *     serviable ;
 *   • LE COMPTE DES MESSAGES. Le tour en porte deux ou trois, jamais plus, et l'égalité ci-dessous
 *     est EXHAUSTIVE : un quatrième message ne peut pas se glisser en silence ;
 *   • LA CONSIGNE ELLE-MÊME. Elle est écrite dans `lib/`, elle interdit la prédiction, et elle ne
 *     doit pas en contenir une seule — ni comme contre-exemple. Une phrase de futur adressé écrite
 *     ici pour être refusée reste une phrase de futur adressé dans le dépôt, à portée du prochain
 *     copier-coller et de tous les balayages qui cherchent ce motif.
 */

const JOUR: JourCivil = { a: 2026, m: 9, j: 2 };

const SIGNATURE: SignatureDuCiel = {
  luneDistance: 3,
  dominante: { corpsTransitant: "venus", aspect: "trigone", cible: "ascendant" },
  secondaires: [{ corpsTransitant: "mars", aspect: "carre", cible: "soleil" }],
  changements: [{ corps: "lune", vers: "vierge" }],
};

const SOCLE: SocleNatalDit = {
  soleil: "poissons",
  lune: "cancer",
  ascendant: "vierge",
  heureConnue: true,
};

const CONTEXTE: MatiereContexte = {
  prenom: "Claire",
  socle: [],
  branches: [
    { nom: "le déménagement", enPleineLumiere: false },
    { nom: "la lettre à sa sœur", enPleineLumiere: true },
  ],
  retenu: ["elle hésite à reprendre le chant"],
  typePressenti: "type 4 (issu du test)",
  premiereFois: false,
};

describe("[LE CŒUR] les faits partent en clair, et rien d’autre ne part", () => {
  const faits = faitsDuCiel(SIGNATURE, JOUR, SOCLE);

  it("met en mots les quatre familles de faits du jour", () => {
    expect(faits).toContain("02/09/2026");
    expect(faits).toContain("à 3 signes de ton Soleil de naissance");
    expect(faits).toContain("trigone de Vénus à ton Ascendant");
    expect(faits).toContain("carré de Mars à ton Soleil de naissance");
    expect(faits).toContain("Lune entre en Vierge");
  });

  it("[LE CŒUR] porte le socle natal, ce qui manquait au modèle jusqu’ici", () => {
    // La demande du fondateur, littéralement : « une partie factuelle sur l'horoscope poissons et
    // ascendant ». Avant le 2026-09-07, le modèle pouvait écrire « trigone de Vénus à ton
    // Ascendant » sans pouvoir dire dans quel signe cet Ascendant se trouve.
    expect(faits).toContain("Soleil en Poissons");
    expect(faits).toContain("Lune en Cancer");
    expect(faits).toContain("Ascendant Vierge");
  });

  it("[LE CŒUR] sans heure de naissance, il n’y a pas d’Ascendant — et on le DIT", () => {
    // ⚠️ MUTATION-CIBLE : se taire au lieu de le dire. Un modèle privé d'une rubrique qu'il attend
    // la comble : il écrit « ton Ascendant » et invente le signe. C'est exactement la même leçon
    // que « un jour calme est un vrai jour », et le dégât est ici bien pire — un fait d'identité.
    const sansHeure = faitsDuCiel(SIGNATURE, JOUR, {
      soleil: "poissons",
      lune: null,
      ascendant: null,
      heureConnue: false,
    });
    expect(sansHeure).toContain("il n’y a pas d’Ascendant");
    expect(sansHeure).not.toContain("Ascendant Vierge");
  });

  it("dit qu’un jour calme est un vrai jour, plutôt que de laisser une rubrique vide", () => {
    // Mutation-cible : retirer cette ligne. Le modèle, privé d'une rubrique qu'il attend, invente
    // un aspect pour remplir — c'est son comportement le plus constant.
    const calme = faitsDuCiel({ ...SIGNATURE, dominante: null, secondaires: [] }, JOUR, SOCLE);
    expect(calme).toContain("jour calme");
    expect(calme).not.toContain("Configuration dominante");
  });

  it("une distance nulle se dit « dans le même signe », pas « à 0 signe »", () => {
    expect(faitsDuCiel({ ...SIGNATURE, luneDistance: 0 }, JOUR, SOCLE)).toContain("dans le même signe");
    expect(faitsDuCiel({ ...SIGNATURE, luneDistance: 1 }, JOUR, SOCLE)).toContain("à un signe");
  });

  it("[ANTI-VACUITÉ] aucune ligne n’apparaît pour un fait absent", () => {
    const nu = faitsDuCiel(
      { luneDistance: null, dominante: null, secondaires: [], changements: [] },
      JOUR,
      { soleil: null, lune: null, ascendant: null, heureConnue: false },
    );
    expect(nu).not.toContain("Position relative");
    expect(nu).not.toContain("Passages de signe");
    expect(nu).not.toContain("Autres configurations");
    expect(nu).not.toContain("Son socle de naissance");
    expect(nu).toContain("02/09/2026");
  });

  it("[LE CŒUR] ni identifiant, ni date de naissance, ni degré ne sortent avec les faits", () => {
    // La garde de non-fuite, mesurée sur le texte RÉEL plutôt que sur le type : entre le type et
    // l'appel il y a une mise en mots, et c'est elle qui pourrait tout recoller.
    expect(faits).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
    expect(faits).not.toMatch(/\d+,\d+°|\d+\.\d+°/);
    // UNE seule date : celle du jour. Une seconde serait une date de naissance.
    expect(faits.match(/\d{2}\/\d{2}\/\d{4}/g)).toHaveLength(1);
  });
});

describe("[LE CŒUR] ce qu’on sait d’elle part à part, et sans compter", () => {
  const toi = faitsDeToi(CONTEXTE);

  it("porte le prénom, l’arbre et ce qui a été retenu", () => {
    expect(toi).toContain("Claire");
    expect(toi).toContain("le déménagement");
    expect(toi).toContain("la lettre à sa sœur");
    expect(toi).toContain("elle hésite à reprendre le chant");
  });

  it("[FR-031] aucun compte, quelle que soit la matière", () => {
    // ⚠️ UN CHIFFRE DANS LE CONTEXTE RESSORT DANS LE TEXTE. Le produit ne compte jamais ce qu'une
    // personne a ou n'a pas : les listes sont bornées SANS que la borne se dise. Le seul nombre
    // toléré est celui du type, qui est un fait de la base et non une mesure d'elle.
    const dense = faitsDeToi({
      ...CONTEXTE,
      typePressenti: null,
      branches: Array.from({ length: 12 }, (_, i) => ({
        nom: `branche ${"x".repeat(i + 1)}`,
        enPleineLumiere: false,
      })),
      retenu: Array.from({ length: 30 }, (_, i) => `fait ${"y".repeat(i + 1)}`),
    });
    expect(dense.match(/\d+/g) ?? []).toEqual([]);
  });

  it("dit son ignorance plutôt que de laisser combler", () => {
    // ⚠️ MUTATION-CIBLE : ne rien dire quand il n'y a rien. Un modèle à qui l'on ne dit rien invente
    // un passé commun et salue comme s'il la connaissait — c'est ce qui fait qu'un assistant sonne
    // faux, et c'est le mode de panne le plus visible du produit.
    const vierge = faitsDeToi({
      prenom: null,
      socle: [],
      branches: [],
      retenu: [],
      typePressenti: null,
      premiereFois: true,
    });
    expect(vierge).toContain("Rien d’autre n’est connu d’elle");
    expect(vierge).toContain("Tu ne connais pas son prénom");
  });

  it("[LE CŒUR] il n’écrit lui-même aucune prédiction", () => {
    expect(chercherPredictions(toi)).toEqual([]);
  });
});

describe("[LE CŒUR] la consigne refuse la prédiction, et n’en écrit aucune", () => {
  const consigne = consigneHoroscope();

  it("elle est un message système, et elle nomme ce qu’il faut faire à la place", () => {
    expect(consigne.role).toBe("system");
    expect(consigne.content).toContain("décris");
    expect(consigne.content).toContain("au présent");
  });

  it("[LE CŒUR] elle demande TROIS parties étiquetées, dans l’ordre", () => {
    // ⚠️ MUTATION-CIBLE : retirer une étiquette de la consigne. Le modèle en rendrait deux, le
    // verdict refuserait pour « structure », et le produit retomberait sur le corpus tous les jours
    // — sans qu'une seule ligne rougisse, puisque le verdict, lui, ferait son travail.
    const iCiel = consigne.content.indexOf("[CIEL]");
    const iToi = consigne.content.indexOf("[POUR-TOI]");
    const iGestes = consigne.content.indexOf("[AUJOURD-HUI]");
    expect(iCiel).toBeGreaterThan(-1);
    expect(iToi).toBeGreaterThan(iCiel);
    expect(iGestes).toBeGreaterThan(iToi);
  });

  it("elle interdit le futur adressé et la promesse — partout", () => {
    // ⚠️ « ni conseil » A DISPARU DE CETTE LISTE LE 2026-09-07, ET C'EST UNE DÉCISION, PAS UN OUBLI.
    // Le fondateur a demandé « un troisième paragraphe sur les actions ou la manière de le rendre
    // concret » : le conseil est désormais AUTORISÉ, et seulement dans la troisième partie. Ce qui
    // reste interdit partout — le futur adressé, la promesse d'état — n'a jamais été une règle de
    // style : c'est FR-053, et les deux fragments ci-dessous en sont la trace exécutable.
    for (const interdit of ["tu restes au présent", "ne promets aucun état"]) {
      expect(consigne.content, `la consigne a perdu « ${interdit} »`).toContain(interdit);
    }
  });

  it("[LE CŒUR] elle autorise le concret dans la troisième partie, et là seulement", () => {
    // Sans cette ligne, on pourrait retirer l'autorisation de la consigne et croire la story livrée :
    // le type porterait trois parties, et la troisième serait vide de tout geste.
    const troisieme = consigne.content.slice(consigne.content.indexOf("[AUJOURD-HUI]"));
    expect(troisieme).toContain("ici seulement, tu proposes");
    expect(troisieme).toContain("gestes tenables");
  });

  it("elle interdit la signature et la question", () => {
    expect(consigne.content).toContain("tu ne signes pas");
    expect(consigne.content).toContain("ne poses aucune question");
  });

  it("[LE CŒUR] elle ne contient elle-même AUCUNE prédiction", () => {
    // Le détecteur qui balaie le corpus depuis la 5.2, appliqué à la consigne. C'est ce qui rend
    // tenable la règle « aucun contre-exemple cité » : la garde la mesure au lieu de l'espérer.
    //
    // ⚠️ ELLE A DÉJÀ SERVI. La première écriture de la refonte disait « tu ne l'annonces pas » —
    // et `annonces` est dans la famille `vocabulaire` du détecteur. La consigne qui interdit la
    // prédiction en contenait une, et seule cette ligne l'a vu.
    expect(chercherPredictions(consigne.content)).toEqual([]);
  });

  it("[ANTI-VACUITÉ] le détecteur mord sur une consigne qui citerait un contre-exemple", () => {
    // Sans ce témoin, le refus ci-dessus serait vrai d'une consigne vide, ou d'un détecteur cassé.
    expect(chercherPredictions(consigne.content + " tu verras que la journée sera plus douce.")).not.toEqual([]);
  });
});

describe("[LE BORD] le tour ne porte que ce qu’on a décidé d’envoyer", () => {
  it("la consigne, ce qu’on sait d’elle, puis les faits — et RIEN d’autre", () => {
    // ⚠️ ÉGALITÉ EXHAUSTIVE SUR TOUT LE TABLEAU, et non un `toHaveLength` suivi de deux `toBe`.
    // C'est ce qui empêche un quatrième message — le journal, une séance, un verbatim — de se
    // glisser un jour dans le tour sans que rien ne rougisse.
    expect(messagesHoroscope(SIGNATURE, JOUR, SOCLE, CONTEXTE)).toEqual([
      consigneHoroscope(),
      { role: "system", content: faitsDeToi(CONTEXTE) },
      { role: "user", content: faitsDuCiel(SIGNATURE, JOUR, SOCLE) },
    ]);
  });

  it("sans matière, le tour tient quand même — à deux messages", () => {
    // Une panne de lecture du contexte ne supprime pas l'horoscope : elle en retire la deuxième
    // partie, et rien d'autre. C'est la politique de tout le socle.
    expect(messagesHoroscope(SIGNATURE, JOUR, SOCLE, null)).toEqual([
      consigneHoroscope(),
      { role: "user", content: faitsDuCiel(SIGNATURE, JOUR, SOCLE) },
    ]);
  });

  it("[LE CŒUR] la matière personnelle passe par `faitsDeToi`, jamais par les faits du ciel", () => {
    // ⚠️ MUTATION-CIBLE : coller le prénom ou une branche dans `faitsDuCiel` « pour que le modèle
    // l'ait sous les yeux ». Les deux textes se ressembleraient, et la garde de non-fuite ci-dessus
    // — qui ne porte que sur les faits du ciel — cesserait de mesurer ce qu'elle croit mesurer.
    const faits = faitsDuCiel(SIGNATURE, JOUR, SOCLE);
    expect(faits).not.toContain("Claire");
    expect(faits).not.toContain("déménagement");
    expect(faits).not.toContain("chant");
  });
});
