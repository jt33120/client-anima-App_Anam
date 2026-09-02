import { describe, expect, it } from "vitest";
import {
  consigneHoroscope,
  faitsDuCiel,
  messagesHoroscope,
} from "@/lib/domain/consigne-horoscope";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";
import type { SignatureDuCiel } from "@/lib/domain/signature-ciel";
import type { JourCivil } from "@/lib/astro/quotidien";

/**
 * LA CONSIGNE DU TEXTE DU JOUR (2026-09-02).
 *
 * Deux choses se gardent ici, et la seconde est celle qu'on oublie :
 *
 *   • CE QUI PART. `faitsDuCiel` est le seul endroit où la signature devient du texte. C'est donc
 *     le dernier point où une donnée personnelle pourrait rentrer, par une mise en mots trop
 *     serviable ;
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

describe("[LE CŒUR] les faits partent en clair, et rien d’autre ne part", () => {
  const faits = faitsDuCiel(SIGNATURE, JOUR);

  it("met en mots les quatre familles de faits", () => {
    expect(faits).toContain("02/09/2026");
    expect(faits).toContain("à 3 signes de ton Soleil de naissance");
    expect(faits).toContain("trigone de Vénus à ton Ascendant");
    expect(faits).toContain("carré de Mars à ton Soleil de naissance");
    expect(faits).toContain("Lune entre en Vierge");
  });

  it("dit qu’un jour calme est un vrai jour, plutôt que de laisser une rubrique vide", () => {
    // Mutation-cible : retirer cette ligne. Le modèle, privé d'une rubrique qu'il attend, invente
    // un aspect pour remplir — c'est son comportement le plus constant.
    const calme = faitsDuCiel({ ...SIGNATURE, dominante: null, secondaires: [] }, JOUR);
    expect(calme).toContain("jour calme");
    expect(calme).not.toContain("Configuration dominante");
  });

  it("une distance nulle se dit « dans le même signe », pas « à 0 signe »", () => {
    expect(faitsDuCiel({ ...SIGNATURE, luneDistance: 0 }, JOUR)).toContain("dans le même signe");
    expect(faitsDuCiel({ ...SIGNATURE, luneDistance: 1 }, JOUR)).toContain("à un signe");
  });

  it("[ANTI-VACUITÉ] aucune ligne n’apparaît pour un fait absent", () => {
    const nu = faitsDuCiel(
      { luneDistance: null, dominante: null, secondaires: [], changements: [] },
      JOUR,
    );
    expect(nu).not.toContain("Position relative");
    expect(nu).not.toContain("Passages de signe");
    expect(nu).not.toContain("Autres configurations");
    expect(nu).toContain("02/09/2026");
  });
});

describe("[LE CŒUR] la consigne refuse la prédiction, et n’en écrit aucune", () => {
  const consigne = consigneHoroscope();

  it("elle est un message système, et elle nomme ce qu’il faut faire à la place", () => {
    expect(consigne.role).toBe("system");
    expect(consigne.content).toContain("décris");
    expect(consigne.content).toContain("au présent");
  });

  it("elle interdit le futur adressé, le conseil et la promesse", () => {
    for (const interdit of ["tu restes au présent", "ni conseil", "ne promets aucun état"]) {
      expect(consigne.content, `la consigne a perdu « ${interdit} »`).toContain(interdit);
    }
  });

  it("elle interdit la signature et la question", () => {
    expect(consigne.content).toContain("tu ne signes pas");
    expect(consigne.content).toContain("ne poses aucune question");
  });

  it("[LE CŒUR] elle ne contient elle-même AUCUNE prédiction", () => {
    // Le détecteur qui balaie le corpus depuis la 5.2, appliqué à la consigne. C'est ce qui rend
    // tenable la règle « aucun contre-exemple cité » : la garde la mesure au lieu de l'espérer.
    expect(chercherPredictions(consigne.content)).toEqual([]);
  });

  it("[ANTI-VACUITÉ] le détecteur mord sur une consigne qui citerait un contre-exemple", () => {
    // Sans ce témoin, le refus ci-dessus serait vrai d'une consigne vide, ou d'un détecteur cassé.
    expect(chercherPredictions(consigne.content + " tu verras que la journée sera plus douce.")).not.toEqual([]);
  });
});

describe("[LE BORD] le tour ne porte que deux messages", () => {
  it("la consigne, puis les faits, et rien de plus", () => {
    const messages = messagesHoroscope(SIGNATURE, JOUR);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toBe(faitsDuCiel(SIGNATURE, JOUR));
  });
});
