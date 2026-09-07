import { describe, expect, it } from "vitest";
import {
  LONGUEUR_MAX,
  LONGUEUR_MIN,
  PARTIE_MAX,
  PARTIE_MIN,
  verdictHoroscope,
  type CadreDuVerdict,
} from "@/lib/domain/verdict-horoscope";

/**
 * LE CONTRÔLE DE SORTIE DU TEXTE DU JOUR (2026-09-02, trois parties depuis le 2026-09-07).
 *
 * Ce que ce fichier garde n'est pas « le verdict fonctionne » : c'est que les DEUX gardes de voix du
 * produit s'appliquent à un texte fabriqué à l'instant, comme elles s'appliquent en test à un texte
 * écrit. Sans ça, l'écriture par un modèle serait une porte de sortie du contrôle de voix : tout ce
 * que FR-053 et NFR-008 refusent depuis un an entrerait par la seule surface qui n'a pas de test,
 * puisqu'elle n'existe qu'à l'exécution.
 *
 * ⚠️ ET DEPUIS LE 2026-09-07, IL GARDE UNE TROISIÈME CHOSE : que le modèle n'INVENTE PAS un fait
 * natal. Les deux premières familles protègent d'un texte mal écrit ; celle-là protège d'un texte
 * FAUX, affiché sous le nom d'une personne réelle, sur son identité. C'est le seul dégât de cette
 * story qu'aucun repli ne rattrape après coup, parce qu'il aura été lu.
 */

/** Ce que le domaine a donné au modèle : Poissons, Cancer, Vierge, plus une entrée du jour. */
const CADRE: CadreDuVerdict = Object.freeze({
  signesAutorises: ["poissons", "cancer", "vierge", "balance"] as const,
  ascendantConnu: true,
});

// ⚠️ CE TÉMOIN A DÛ ÊTRE RÉÉCRIT UNE FOIS : il contenait « qui ne prédisent rien », et le mot est
// lui-même dans la famille `vocabulaire` du détecteur. Le texte de test était refusé pour la raison
// qu'il servait à écarter, et les six autres cas remontaient tous le motif « prediction ». C'est la
// démonstration en miniature de la règle du fichier de consigne : on ne cite pas l'interdit.
const partie = (quoi: string) =>
  `${quoi} tient en trois phrases qui n’avancent rien. La configuration se décrit au présent, ` +
  `sans promesse. Ce qui se joue là se nomme, et rien de plus.`;

/** Un texte de modèle conforme : trois étiquettes, trois parties dans les bornes. */
const BON = [
  "[CIEL]",
  "Ton Soleil de naissance est en Poissons, ta Lune en Cancer, ton Ascendant Vierge. " +
    "La Lune du jour marche à trois signes de ce Soleil, et Vénus forme un trigone à cet Ascendant.",
  "[POUR-TOI]",
  partie("Ce que le carré de Mars touche chez toi"),
  "[AUJOURD-HUI]",
  "Poser une chose sur la table avant midi, une seule. Écrire trois lignes le soir, sans les relire. " +
    "Choisis une conversation reportée, et fixe l’heure maintenant.",
].join("\n");

describe("[LE CŒUR] un texte juste passe, et ressort découpé", () => {
  it("accepte trois parties étiquetées et les rend séparées", () => {
    const verdict = verdictHoroscope(BON, CADRE);
    expect(verdict.accepte).toBe(true);
    if (verdict.accepte) {
      expect(verdict.parties.ciel).toContain("Poissons");
      expect(verdict.parties.pourToi).toContain("carré de Mars");
      expect(verdict.parties.gestes).toContain("avant midi");
      // ⚠️ MUTATION-CIBLE : un découpage qui laisserait l'étiquette DANS la partie. Elle
      // s'afficherait telle quelle sous l'intitulé, et personne ne le verrait en test de type.
      for (const p of [verdict.parties.ciel, verdict.parties.pourToi, verdict.parties.gestes]) {
        expect(p).not.toMatch(/\[|CIEL|POUR-TOI|AUJOURD-HUI/);
      }
    }
  });

  it("[LE CŒUR] accepte les quatre formes d’étiquette qu’un modèle produit réellement", () => {
    // ⚠️ MESURÉ, PAS SUPPOSÉ. Un modèle « embellit » spontanément une étiquette : il la met en gras,
    // il la passe en titre markdown, il remplace les crochets par un deux-points. Les trois sorties
    // ci-dessous ont été obtenues d'un même texte par une sonde ; refuser l'une d'elles ferait
    // retomber sur le corpus une génération par ailleurs parfaite, et le motif « structure » serait
    // le seul indice — dans un journal que personne ne relit tous les jours.
    const formes: readonly [string, string][] = [
      ["crochets", BON],
      ["deux-points", BON.replace(/\[(.*?)\]/g, "$1 :")],
      ["gras markdown", BON.replace(/\[(.*?)\]/g, "**$1**")],
      ["titre markdown", BON.replace(/\[(.*?)\]/g, "### $1")],
    ];
    for (const [nom, texte] of formes) {
      expect(verdictHoroscope(texte, CADRE).accepte, `forme « ${nom} » refusée`).toBe(true);
    }
  });

  it("normalise la typographie plutôt que de refuser pour une apostrophe", () => {
    const verdict = verdictHoroscope(BON.replace(/’/g, "'"), CADRE);
    expect(verdict.accepte).toBe(true);
    if (verdict.accepte) expect(verdict.parties.gestes).not.toContain("'");
  });

  it("remplace le tiret cadratin au lieu de jeter le texte", () => {
    // La garde de copie du dépôt (`tests/copie-sans-cadratin.test.ts`) le bannit partout ; un
    // modèle en pose un texte sur deux. Refuser ferait tomber la moitié des générations pour une
    // marque de ponctuation qui ne dit rien.
    const verdict = verdictHoroscope(BON.replace("avant midi", "avant midi — sans attendre"), CADRE);
    expect(verdict.accepte).toBe(true);
    if (verdict.accepte) expect(verdict.parties.gestes).not.toContain("—");
  });
});

describe("[LE CŒUR] ce que le produit refuse depuis un an, il le refuse aussi d’un modèle", () => {
  // ⚠️ CES CHAÎNES SONT DES TÉMOINS DE TEST, et c'est le seul endroit du dépôt où elles ont le
  // droit d'exister : la consigne, elle, ne cite aucun contre-exemple (voir son en-tête).
  const cas: readonly {
    readonly quoi: string;
    readonly texte: string;
    readonly motif: string;
    readonly partie?: string;
  }[] = [
    {
      quoi: "un futur adressé, dans la partie factuelle",
      texte: BON.replace("La Lune du jour marche", "Tu verras que la Lune du jour marchera"),
      motif: "prediction",
      partie: "ciel",
    },
    {
      quoi: "le vocabulaire clinique, dans les gestes",
      texte: BON.replace("Écrire trois lignes le soir, sans les relire.", "Prends soin de toi ce soir."),
      motif: "lexique",
      partie: "gestes",
    },
    {
      quoi: "une signature",
      texte: BON.replace("Poser une chose", "Anima te dit de poser une chose"),
      motif: "signature",
    },
    {
      quoi: "une question posée",
      texte: BON.replace("une seule.", "une seule, et si tu regardais ce qui te retient ?"),
      motif: "interrogation",
    },
  ];

  for (const c of cas) {
    it(`refuse ${c.quoi} (motif « ${c.motif} »)`, () => {
      const verdict = verdictHoroscope(c.texte, CADRE);
      expect(verdict.accepte).toBe(false);
      if (!verdict.accepte) {
        expect(verdict.motif).toBe(c.motif);
        if (c.partie) expect(verdict.partie).toBe(c.partie);
      }
    });
  }

  it("[LE CŒUR] une seule partie fautive refuse les TROIS", () => {
    // ⚠️ MUTATION-CIBLE : servir les deux parties saines et laisser tomber la fautive. Le texte
    // resterait plausible — il ouvrirait une tension et s'arrêterait — et il faudrait une provenance
    // par partie pour dire lequel des trois paragraphes vient d'un modèle. « Refuser, pas réparer ».
    const verdict = verdictHoroscope(
      BON.replace("Poser une chose", "Tu poseras une chose"),
      CADRE,
    );
    expect(verdict.accepte).toBe(false);
    expect("parties" in verdict).toBe(false);
  });
});

describe("[LE CŒUR] le modèle n’invente pas un fait de naissance", () => {
  it("refuse un Ascendant qu’on ne lui a pas donné", () => {
    const verdict = verdictHoroscope(BON.replace("ton Ascendant Vierge", "ton Ascendant Lion"), CADRE);
    expect(verdict.accepte).toBe(false);
    if (!verdict.accepte) expect(verdict.motif).toBe("fait_natal_invente");
  });

  it("refuse TOUT ascendant quand l’heure de naissance est inconnue", () => {
    // Sans heure, l'ascendant fait un tour complet en vingt-quatre heures : le nommer est toujours
    // une invention, quel que soit le signe. C'est le cas de la plupart des comptes.
    const verdict = verdictHoroscope(BON, { ...CADRE, ascendantConnu: false });
    expect(verdict.accepte).toBe(false);
    if (!verdict.accepte) expect(verdict.motif).toBe("fait_natal_invente");
  });

  it("[ANTI-VACUITÉ] un signe employé comme mot français ne déclenche rien", () => {
    // ⚠️ SANS CE TÉMOIN, LA GARDE CI-DESSUS SERAIT SATISFAITE PAR UN BALAYAGE NU — qui refuserait
    // « cela met en balance deux choses », c'est-à-dire une phrase juste, tous les jours. C'est
    // l'ancrage sur un point du thème DANS LA MÊME PHRASE qui fait la différence, et c'est lui que
    // ce test mesure.
    const verdict = verdictHoroscope(
      BON.replace(
        partie("Ce que le carré de Mars touche chez toi"),
        "Cette journée met en balance deux choses, et le lion qui dort dans un coin du salon ne " +
          "bouge pas. Rien n’y force, rien n’y presse. Ce qui pèse d’un côté allège de l’autre.",
      ),
      CADRE,
    );
    expect(verdict.accepte, "une métaphore hors contexte natal a été refusée").toBe(true);
  });
});

describe("[LE BORD] la réponse de l’adaptateur factice ne paraît jamais comme un horoscope", () => {
  it("refuse le texte du stub de développement", () => {
    // Hors production, `creerAiPort` rend l'adaptateur FACTICE (AD-4 interdit ce repli en prod, pas
    // ailleurs). Sans un refus explicite, une préversion afficherait « [factice] Anam a bien reçu
    // 2 message(s). » là où on attend le ciel du jour.
    expect(verdictHoroscope("[factice] Anam a bien reçu 2 message(s).", CADRE).accepte).toBe(false);
  });
});

describe("[LE BORD] les bornes de longueur disent ce qu’elles gardent", () => {
  it("refuse le vide, et le distingue du trop court", () => {
    expect(verdictHoroscope("   ", CADRE)).toEqual({ accepte: false, motif: "vide" });
    // Un refus poli du modèle ne doit jamais paraître comme un horoscope.
    expect(verdictHoroscope("Je ne peux pas.", CADRE)).toEqual({ accepte: false, motif: "trop_court" });
  });

  it("refuse la dissertation", () => {
    // ⚠️ LE TÉMOIN SUIT LE PLAFOND, ET IL A DÛ ÊTRE RALLONGÉ DEUX FOIS (2026-09-07). À
    // `.repeat(80)` il faisait 1 279 signes ; le plafond est passé à 1 400 puis à 2 200 après
    // mesure. À chaque fois, un témoin laissé en place SERAIT PASSÉ AU VERT SANS QUE PERSONNE NE LE
    // VOIE, et cette garde aurait cessé de garder quoi que ce soit en restant verte.
    // ⚠️ ET IL DOIT ÊTRE REFUSÉ POUR « trop_long », PAS POUR « structure » : un texte sans étiquette
    // est écarté plus tôt. Le témoin est donc long AVANT d'être informe.
    const verdict = verdictHoroscope("La Lune marche. ".repeat(200), CADRE);
    expect(verdict).toEqual({ accepte: false, motif: "trop_long" });
  });

  it("refuse un moignon de partie, et nomme laquelle", () => {
    // ⚠️ CE REFUS N'EXISTAIT PAS AVANT LES TROIS PARTIES, et c'est lui qui rend l'autorisation du
    // conseil tenable : « les gestes : voir ci-dessus » passait l'ancien plancher global de quarante
    // signes sans difficulté, puisque les deux autres parties le portaient.
    const verdict = verdictHoroscope(
      BON.replace(/Poser une chose[\s\S]*$/, "Voir plus haut."),
      CADRE,
    );
    expect(verdict.accepte).toBe(false);
    if (!verdict.accepte) {
      expect(verdict.motif).toBe("partie_courte");
      expect(verdict.partie).toBe("gestes");
    }
  });

  it("refuse une partie qui déborde de sa case", () => {
    const verdict = verdictHoroscope(BON.replace(partie("Ce que le carré de Mars touche chez toi"), "x".repeat(PARTIE_MAX + 1)), CADRE);
    expect(verdict.accepte).toBe(false);
    if (!verdict.accepte) expect(verdict.motif).toBe("partie_longue");
  });

  it("refuse un texte sans aucune étiquette plutôt que de deviner le découpage", () => {
    // ⚠️ MUTATION-CIBLE : découper au saut de ligne quand les étiquettes manquent. Ce serait ranger
    // dans « le ciel » — la case la plus fermée — un paragraphe qui pourrait être des gestes, et
    // faire passer une proposition pour un fait.
    const verdict = verdictHoroscope(BON.replace(/^\[.*\]\n/gm, ""), CADRE);
    expect(verdict).toEqual({ accepte: false, motif: "structure" });
  });

  it("[ANTI-VACUITÉ] les bornes encadrent un texte RÉEL, elles ne sont pas décoratives", () => {
    // ⚠️ LE TÉMOIN EST LE VRAI TEXTE À TROIS PARTIES, PAS UNE PHRASE COURTE. Avec l'ancien témoin de
    // 157 signes, ces deux lignes seraient restées vertes sous n'importe quel plafond : la garde
    // aurait survécu, vide, et pour la mauvaise raison.
    expect(BON.length).toBeGreaterThan(LONGUEUR_MIN);
    expect(BON.length).toBeLessThan(LONGUEUR_MAX);
    const verdict = verdictHoroscope(BON, CADRE);
    expect(verdict.accepte).toBe(true);
    if (verdict.accepte) {
      for (const p of Object.values(verdict.parties)) {
        expect(p.length).toBeGreaterThanOrEqual(PARTIE_MIN);
        expect(p.length).toBeLessThanOrEqual(PARTIE_MAX);
      }
    }
    // Et le total tient DANS les bornes par partie : un texte conforme partie par partie ne peut
    // jamais être refusé pour sa longueur totale.
    expect(3 * PARTIE_MAX).toBeLessThan(LONGUEUR_MAX);
  });
});
