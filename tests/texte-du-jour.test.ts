import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { texteDuJourGenere, viderMemoTexteDuJour } from "@/lib/ai/texte-du-jour";
import type { AiPort, RequeteIa } from "@/lib/ai/port";
import type { metrerUsageIa } from "@/lib/ai/metrage";
import { assemblerHoroscope, type CielDuJour, type JourCivil } from "@/lib/astro/quotidien";
import { placer, type ThemeNatal } from "@/lib/astro/theme-natal";

/**
 * L'ORCHESTRATION DU TEXTE DU JOUR (2026-09-02).
 *
 * Quatre propriétés se gardent ici, et aucune n'est une commodité :
 *
 *   1. CE QUI PART. La charge utile ne porte ni identifiant, ni date de naissance, ni verbatim. Le
 *      type le tient déjà (`tests/signature-ciel.test.ts`) ; ce fichier mesure ce qui sort RÉELLEMENT
 *      de l'adaptateur, parce qu'entre le type et l'appel il y a une mise en mots qui pourrait tout
 *      recoller ;
 *   2. IL NE JETTE JAMAIS. Panne, refus d'egress, texte rejeté : `null`, et la page retombe sur le
 *      corpus. Une exception ici ferait tomber l'accueil ET la halte du socle ;
 *   3. LE MÉTRAGE A LIEU MÊME SUR UN TEXTE REFUSÉ. L'appel a eu lieu, les jetons sont dus ;
 *   4. LE MÉMO ÉVITE LE SECOND APPEL. C'est ce qui rend la carte cohérente entre l'accueil et la
 *      halte, et ce qui empêche la facture de suivre le nombre de rechargements.
 */

const JOUR: JourCivil = { a: 2026, m: 9, j: 2 };
const UTILISATRICE = "11111111-2222-3333-4444-555555555555";

const BON =
  "La Lune du jour marche à trois signes de ton Soleil de naissance, et le contact se fait sans " +
  "avoir à le fabriquer. C’est une configuration, pas une consigne.";

const theme: ThemeNatal = {
  schema: 2,
  adaptateur: "test",
  precision: "midi_par_defaut",
  positions: [
    { corps: "soleil", longitude: 10, ...placer(10) },
    { corps: "lune", longitude: 200, ...placer(200) },
  ],
  absents: [],
  angles: { statut: "non_calcule", raison: "heure_absente" },
};

const ciel: CielDuJour = {
  instantReference: new Date("2026-09-02T12:00:00Z"),
  positions: [
    { corps: "lune", longitude: 55, ...placer(55) },
    { corps: "mars", longitude: 10.4, ...placer(10.4) },
  ],
  absents: [],
  changementsDeSigne: [],
};

const HOROSCOPE = assemblerHoroscope(theme, JOUR, ciel);

/** Consentement art. 9 vivant, non barrée. */
const supabaseOk = {
  rpc: async (name: string) => ({ data: name === "a_consenti_art9", error: null }),
} as unknown as SupabaseClient;

/** Consentement révoqué : l'egress refuse, et c'est un chemin normal. */
const supabaseRevoque = {
  rpc: async () => ({ data: false, error: null }),
} as unknown as SupabaseClient;

function fauxPort(texte: string, delaiMs = 0) {
  const recues: RequeteIa[] = [];
  const completer = vi.fn(async (req: RequeteIa) => {
    recues.push(req);
    if (delaiMs > 0) await new Promise((r) => setTimeout(r, delaiMs));
    return {
      texte,
      tier: "leger" as const,
      modele: "modele-de-test",
      usage: { tokensEntree: 120, tokensSortie: 60 },
    };
  });
  const adaptateur = {
    completer,
    diffuser: async function* () {},
    estZdrProuve: () => true,
  } as unknown as AiPort;
  return { adaptateur, completer, recues };
}

function deps(port: ReturnType<typeof fauxPort>) {
  // Typé sur la vraie signature : `mock.calls[0][0]` doit être lisible champ par champ, sinon la
  // garde du métrage ne mesurerait qu'un `unknown`.
  const metrer = vi.fn<(usage: Parameters<typeof metrerUsageIa>[0]) => Promise<void>>(
    async () => {},
  );
  return {
    deps: { creerPort: async () => port.adaptateur, metrer },
    metrer,
  };
}

beforeEach(() => {
  viderMemoTexteDuJour();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("[LE CŒUR] ce qui part au modèle ne nomme personne", () => {
  it("rend le texte accepté, et n’envoie que des faits de ciel", async () => {
    const port = fauxPort(BON);
    const d = deps(port);
    const texte = await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, d.deps);

    expect(texte).toBe(BON);
    expect(port.completer).toHaveBeenCalledTimes(1);

    const envoye = port.recues[0].messages.map((m) => m.content).join("\n");
    // [ANTI-VACUITÉ] la charge utile parle bien de CE ciel-là : sans ça, tous les refus ci-dessous
    // seraient vrais sur une chaîne vide.
    expect(envoye).toContain("conjonction");
    expect(envoye).toContain("Soleil de naissance");

    expect(envoye).not.toContain(UTILISATRICE);
    expect(envoye).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
    // La seule date qui sort est le JOUR COURANT, jamais une date de naissance : le thème natal
    // n'a aucun chemin jusqu'ici.
    expect(envoye).toContain("02/09/2026");
    expect(envoye.match(/\d{2}\/\d{2}\/\d{4}/g)).toHaveLength(1);
    // Ni longitude, ni orbe : rien qui reconstitue une position au degré près.
    expect(envoye).not.toMatch(/\d+,\d+°|\d+\.\d+°/);
  });

  it("déclare la capacité et le régime art. 9 attendus", async () => {
    const port = fauxPort(BON);
    await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, deps(port).deps);
    expect(port.recues[0].capacite).toBe("horoscope");
    // ⚠️ VRAI, alors que rien d'elle ne sort. Ce qui part est DÉRIVÉ de sa naissance : le produit
    // n'a qu'un seul régime pour ça, et le déclarer faux ouvrirait la première dérogation.
    expect(port.recues[0].contientArt9).toBe(true);
  });
});

describe("[LE CŒUR] le mémo tient la cohérence entre les deux surfaces", () => {
  it("ne rappelle pas le modèle pour le même ciel, le même jour", async () => {
    const port = fauxPort(BON);
    const d = deps(port);
    const premier = await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, d.deps);
    const second = await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, d.deps);

    expect(second).toBe(premier);
    expect(port.completer).toHaveBeenCalledTimes(1);
    // Et le métrage non plus ne double pas : un texte relu n'est pas un appel.
    expect(d.metrer).toHaveBeenCalledTimes(1);
  });
});

describe("[LE BORD] tous les échecs se ressemblent, vus de la page", () => {
  it("un egress bloqué rend `null` sans appeler le modèle", async () => {
    const port = fauxPort(BON);
    const d = deps(port);
    expect(await texteDuJourGenere(supabaseRevoque, UTILISATRICE, HOROSCOPE, d.deps)).toBeNull();
    expect(port.completer).not.toHaveBeenCalled();
    expect(d.metrer).not.toHaveBeenCalled();
  });

  it("un texte refusé rend `null`, MAIS il est mesuré", async () => {
    const port = fauxPort(
      "La Lune marche à trois signes de ton Soleil de naissance, et tu verras que la journée sera plus douce.",
    );
    const d = deps(port);
    expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, d.deps)).toBeNull();
    expect(d.metrer).toHaveBeenCalledTimes(1);
    expect(d.metrer.mock.calls[0][0]).toMatchObject({
      operation: "texte_du_jour",
      capacite: "horoscope",
      exempteQuota: true,
      comptabiliseFinancierement: true,
      tokensEntree: 120,
      tokensSortie: 60,
    });
  });

  it("un texte refusé n’est pas mémoïsé : la génération suivante réessaie", async () => {
    const mauvais = fauxPort(
      "La Lune marche à trois signes de ton Soleil de naissance, et tu verras que la journée sera plus douce.",
    );
    await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, deps(mauvais).deps);
    const bon = fauxPort(BON);
    expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, deps(bon).deps)).toBe(BON);
  });

  it("une panne du port rend `null` et ne jette pas", async () => {
    const quiJette = {
      creerPort: async () => {
        throw new Error("clé absente");
      },
      metrer: vi.fn(async () => {}),
    };
    expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, quiJette)).toBeNull();
  });

  it("un modèle trop lent ne retient pas la page, et son texte sert au tour suivant", async () => {
    // L'accueil est la page la plus vue du produit, et rien dans `completer()` ne borne son
    // attente : un appel qui pend emporterait la requête entière sur une fonction serverless.
    vi.useFakeTimers();
    try {
      const port = fauxPort(BON, 30_000);
      const d = deps(port);
      const course = texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, d.deps);

      await vi.advanceTimersByTimeAsync(6_000);
      expect(await course, "au délai, la page repart avec le corpus").toBeNull();

      // ⚠️ ET LA GÉNÉRATION N'EST PAS ANNULÉE : quand elle aboutit, elle remplit le mémo.
      await vi.advanceTimersByTimeAsync(30_000);
      const port2 = fauxPort("un texte qui ne devrait jamais être demandé, le mémo répond avant.");
      expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, HOROSCOPE, deps(port2).deps)).toBe(BON);
      expect(port2.completer).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("un ciel sans rien de personnel à dire n’appelle pas le modèle", async () => {
    // Sans Soleil natal : pas de distance de Lune, pas de configuration. Ce qui resterait serait
    // commun à tout le monde — le corpus dit mieux, et il ne coûte rien.
    const sansSoleil = assemblerHoroscope({ ...theme, positions: [] }, JOUR, ciel);
    const port = fauxPort(BON);
    expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, sansSoleil, deps(port).deps)).toBeNull();
    expect(port.completer).not.toHaveBeenCalled();
  });
});
