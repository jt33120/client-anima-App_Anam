import { describe, expect, it } from "vitest";
import {
  LONGUEUR_MAX,
  LONGUEUR_MIN,
  verdictHoroscope,
} from "@/lib/domain/verdict-horoscope";

/**
 * LE CONTRÔLE DE SORTIE DU TEXTE DU JOUR (2026-09-02).
 *
 * Ce que ce fichier garde n'est pas « le verdict fonctionne » : c'est que les DEUX gardes de voix du
 * produit s'appliquent à un texte fabriqué à l'instant, comme elles s'appliquent en test à un texte
 * écrit. Sans ça, l'écriture par un modèle serait une porte de sortie du contrôle de voix : tout ce
 * que FR-053 et NFR-008 refusent depuis un an entrerait par la seule surface qui n'a pas de test,
 * puisqu'elle n'existe qu'à l'exécution.
 */

const BON =
  "La Lune du jour marche à trois signes de ton Soleil de naissance, et le contact se fait sans " +
  "avoir à le fabriquer. C’est une configuration, pas une consigne.";

describe("[LE CŒUR] un texte juste passe, et ressort propre", () => {
  it("accepte un texte descriptif et le rend tel quel", () => {
    const verdict = verdictHoroscope(BON);
    expect(verdict.accepte).toBe(true);
    if (verdict.accepte) expect(verdict.texte).toBe(BON);
  });

  it("normalise la typographie plutôt que de refuser pour une apostrophe", () => {
    const verdict = verdictHoroscope("  **" + BON.replace(/’/g, "'") + "**  ");
    expect(verdict.accepte).toBe(true);
    if (verdict.accepte) {
      expect(verdict.texte).not.toContain("'");
      expect(verdict.texte).not.toContain("*");
      expect(verdict.texte.startsWith("La Lune")).toBe(true);
    }
  });

  it("remplace le tiret cadratin au lieu de jeter le texte", () => {
    // La garde de copie du dépôt (`tests/copie-sans-cadratin.test.ts`) le bannit partout ; un
    // modèle en pose un texte sur deux. Refuser ferait tomber la moitié des générations pour une
    // marque de ponctuation qui ne dit rien.
    const verdict = verdictHoroscope("La Lune marche à trois signes — et le contact se fait sans effort aujourd’hui.");
    expect(verdict.accepte).toBe(true);
    if (verdict.accepte) expect(verdict.texte).not.toContain("—");
  });

  it("retire les guillemets d’encadrement d’une réponse entière", () => {
    const verdict = verdictHoroscope(`« ${BON} »`);
    expect(verdict.accepte).toBe(true);
    if (verdict.accepte) expect(verdict.texte.startsWith("La Lune")).toBe(true);
  });
});

describe("[LE CŒUR] ce que le produit refuse depuis un an, il le refuse aussi d’un modèle", () => {
  // ⚠️ CES CHAÎNES SONT DES TÉMOINS DE TEST, et c'est le seul endroit du dépôt où elles ont le
  // droit d'exister : la consigne, elle, ne cite aucun contre-exemple (voir son en-tête).
  const cas: readonly { readonly quoi: string; readonly texte: string; readonly motif: string }[] = [
    {
      quoi: "un futur adressé",
      texte: "La Lune marche à trois signes de ton Soleil de naissance, et tu verras que la journée sera plus douce.",
      motif: "prediction",
    },
    {
      quoi: "le vocabulaire clinique",
      texte: "La Lune marche à trois signes de ton Soleil, et cette configuration soulage ton anxiété du moment.",
      motif: "lexique",
    },
    {
      quoi: "une signature",
      texte: "La Lune marche à trois signes de ton Soleil de naissance, et Anima te le dit sans détour aujourd’hui.",
      motif: "signature",
    },
    {
      quoi: "une question posée",
      texte: "La Lune marche à trois signes de ton Soleil de naissance. Et si tu regardais ce qui te retient ?",
      motif: "interrogation",
    },
  ];

  for (const c of cas) {
    it(`refuse ${c.quoi} (motif « ${c.motif} »)`, () => {
      const verdict = verdictHoroscope(c.texte);
      expect(verdict.accepte).toBe(false);
      if (!verdict.accepte) expect(verdict.motif).toBe(c.motif);
    });
  }
});

describe("[LE BORD] la réponse de l’adaptateur factice ne paraît jamais comme un horoscope", () => {
  it("refuse le texte du stub de développement", () => {
    // Hors production, `creerAiPort` rend l'adaptateur FACTICE (AD-4 interdit ce repli en prod, pas
    // ailleurs). Sa réponse fait plus de quarante signes : sans un refus explicite, une préversion
    // afficherait « [factice] Anam a bien reçu 2 message(s). » là où on attend le ciel du jour.
    //
    // C'est le `NOMS_INTERDITS` qui mord — le stub se nomme. La garde est ici pour que ce refus
    // reste MESURÉ : le jour où le texte du stub change, cette ligne dit qu'il faut y regarder.
    const verdict = verdictHoroscope("[factice] Anam a bien reçu 2 message(s).");
    expect(verdict.accepte).toBe(false);
  });
});

describe("[LE BORD] les bornes de longueur disent ce qu’elles gardent", () => {
  it("refuse le vide, et le distingue du trop court", () => {
    expect(verdictHoroscope("   ")).toEqual({ accepte: false, motif: "vide" });
    // Un refus poli du modèle fait moins de quarante signes : il ne doit jamais paraître comme un
    // horoscope.
    expect(verdictHoroscope("Je ne peux pas.")).toEqual({ accepte: false, motif: "trop_court" });
  });

  it("refuse la dissertation", () => {
    const verdict = verdictHoroscope("La Lune marche. ".repeat(80));
    expect(verdict).toEqual({ accepte: false, motif: "trop_long" });
  });

  it("[ANTI-VACUITÉ] les bornes encadrent un texte réel, elles ne sont pas décoratives", () => {
    expect(BON.length).toBeGreaterThan(LONGUEUR_MIN);
    expect(BON.length).toBeLessThan(LONGUEUR_MAX);
  });
});
