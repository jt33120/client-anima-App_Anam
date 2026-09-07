import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { texteDuJourGenere, viderMemoTexteDuJour } from "@/lib/ai/texte-du-jour";
import type { AiPort, RequeteIa } from "@/lib/ai/port";
import type { metrerUsageIa } from "@/lib/ai/metrage";
import { assemblerHoroscope, type CielDuJour, type JourCivil } from "@/lib/astro/quotidien";
import { placer, type ThemeNatal } from "@/lib/astro/theme-natal";
import type {
  CandidatTextePersonnel,
  DepotTextePersonnel,
  TextePersonnelFige,
} from "@/lib/data/depot-texte-du-jour-personnel";
import type { MatiereContexte } from "@/lib/domain/contexte-anam";

/**
 * L'ORCHESTRATION DU TEXTE DU JOUR (2026-09-02, personnalisé le 2026-09-07).
 *
 * Cinq propriétés se gardent ici, et aucune n'est une commodité :
 *
 *   1. CE QUI PART. La charge utile ne porte ni identifiant, ni date de naissance, ni degré. Depuis
 *      le 2026-09-07 elle porte en revanche son prénom et ce qu'Anam sait d'elle : la garde a changé
 *      d'objet, pas de nature, et elle mesure ce qui sort RÉELLEMENT de l'adaptateur — entre le type
 *      et l'appel il y a une mise en mots qui pourrait tout recoller ;
 *   2. IL NE JETTE JAMAIS. Panne, refus d'egress, texte rejeté : `null`, et la page retombe sur le
 *      corpus. Une exception ici ferait tomber l'accueil ET la halte du socle ;
 *   3. LE MÉTRAGE A LIEU MÊME SUR UN TEXTE REFUSÉ. L'appel a eu lieu, les jetons sont dus ;
 *   4. LE CACHE ÉVITE LE SECOND APPEL — mais il est désormais PAR PERSONNE, et ce fichier garde la
 *      propriété INVERSE de celle qu'il gardait hier : deux personnes ne partagent plus un texte ;
 *   5. UN DÉLAI NE POSE PAS DE PIERRE TOMBALE. C'est la propriété la plus fragile du lot, et celle
 *      dont la violation rendrait tout ce mécanisme inutile.
 */

const JOUR: JourCivil = { a: 2026, m: 9, j: 2 };
const UTILISATRICE = "11111111-2222-3333-4444-555555555555";
const AUTRE = "99999999-8888-7777-6666-555555555555";

/**
 * ⚠️ LES SIGNES DU TÉMOIN SUIVENT LE THÈME DE TEST, ET C'EST UNE CONTRAINTE NEUVE. Le Soleil est à
 * 10° (Bélier) et la Lune à 200° (Balance) ; nommer un autre signe à côté d'un point natal ferait
 * refuser le texte pour `fait_natal_invente`. L'heure est inconnue dans ce thème : aucun Ascendant
 * ne peut être nommé non plus.
 */
const BON = [
  "[CIEL]",
  "Ton Soleil de naissance est en Bélier, ta Lune en Balance. La Lune du jour marche à un signe " +
    "de ce Soleil, et Mars s’en approche au plus serré. Deux forces qui ne tirent pas ensemble.",
  "[POUR-TOI]",
  "Ce que cette conjonction touche tient dans ce que tu remets depuis quelques semaines. Le sujet " +
    "revient là, sans se forcer. Rien n’y presse, et rien ne s’y règle d’un coup.",
  "[AUJOURD-HUI]",
  "Poser une chose sur la table avant midi, une seule. Écrire trois lignes le soir, sans les " +
    "relire. Choisis une conversation reportée, et fixe l’heure maintenant.",
].join("\n");

/** Un texte qui prédit : refusé par le verdict, mais l'appel a eu lieu et il est dû. */
const MAUVAIS = BON.replace("La Lune du jour marche", "Tu verras que la Lune du jour marchera");

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

/** Ce que la halte demande : elle génère et elle attend. */
const demande = (attente: "halte" | "accueil" = "halte") =>
  ({ horoscope: HOROSCOPE, theme, attente }) as const;

const CONTEXTE: MatiereContexte = {
  prenom: "Claire",
  socle: [],
  branches: [{ nom: "le déménagement", enPleineLumiere: false }],
  retenu: ["elle hésite à reprendre le chant"],
  typePressenti: null,
  premiereFois: false,
};

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
      tier: "fort" as const,
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
  const lireContexte = vi.fn(async () => CONTEXTE);
  return {
    deps: { creerPort: async () => port.adaptateur, metrer, lireContexte },
    metrer,
    lireContexte,
  };
}

beforeEach(() => {
  viderMemoTexteDuJour();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("[LE CŒUR] ce qui part au modèle, et ce qui n’en part jamais", () => {
  it("rend les trois parties acceptées", async () => {
    const port = fauxPort(BON);
    const d = deps(port);
    const parties = await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), d.deps);

    expect(parties?.ciel).toContain("Bélier");
    expect(parties?.pourToi).toContain("depuis quelques semaines");
    expect(parties?.gestes).toContain("avant midi");
    expect(port.completer).toHaveBeenCalledTimes(1);
  });

  it("[LE CŒUR] ni identifiant, ni date de naissance, ni degré ne sortent", async () => {
    const port = fauxPort(BON);
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), deps(port).deps);
    const envoye = port.recues[0].messages.map((m) => m.content).join("\n");

    // [ANTI-VACUITÉ] la charge utile parle bien de CE ciel-là : sans ça, tous les refus ci-dessous
    // seraient vrais sur une chaîne vide.
    expect(envoye).toContain("conjonction");
    expect(envoye).toContain("Soleil de naissance");

    expect(envoye).not.toContain(UTILISATRICE);
    expect(envoye).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
    // La seule date qui sort est le JOUR COURANT, jamais une date de naissance.
    expect(envoye).toContain("02/09/2026");
    expect(envoye.match(/\d{2}\/\d{2}\/\d{4}/g)).toHaveLength(1);
    // Ni longitude, ni orbe : rien qui reconstitue une position au degré près.
    expect(envoye).not.toMatch(/\d+,\d+°|\d+\.\d+°/);
  });

  it("[LE CŒUR] le socle natal et la matière d’Anam partent, EUX, et c’est la story", async () => {
    // ⚠️ MUTATION-CIBLE : câbler les trois parties et oublier de brancher la matière. Le texte
    // resterait à trois parties, la deuxième serait générique, et tout le reste du dépôt serait vert.
    // C'est la seule ligne qui dit que la personnalisation a bien lieu.
    const port = fauxPort(BON);
    const d = deps(port);
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), d.deps);
    const envoye = port.recues[0].messages.map((m) => m.content).join("\n");

    expect(envoye).toContain("Soleil en Bélier");
    expect(envoye).toContain("le déménagement");
    expect(envoye).toContain("reprendre le chant");
    expect(d.lireContexte).toHaveBeenCalledTimes(1);

    // ⚠️ ET LE PRÉNOM, LUI, NE PART PAS (2026-09-07). Mesuré : cinq générations sur cinq ouvraient
    // la deuxième partie par « <Prénom>, tu sais ce que c'est que… », et la première utilisatrice
    // s'appelle ANIMA — du même nom que le produit. `verdictHoroscope` refusait donc chaque texte
    // pour `signature`, la garde FR-086. La personnalisation vient de son arbre, pas de son prénom.
    expect(envoye).not.toContain("Claire");
  });

  it("déclare la capacité et le régime art. 9 attendus", async () => {
    const port = fauxPort(BON);
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), deps(port).deps);
    expect(port.recues[0].capacite).toBe("horoscope");
    // ⚠️ VRAI, ET DEPUIS LE 2026-09-07 C'EST LITTÉRAL. Ce drapeau était déjà posé quand rien d'elle
    // ne sortait, parce que ce qui partait était DÉRIVÉ de sa naissance. La charge utile porte
    // maintenant son prénom : c'est la réalité qui a rattrapé la précaution.
    expect(port.recues[0].contientArt9).toBe(true);
  });

  it("une panne de lecture du contexte ne supprime pas l’horoscope", async () => {
    // Chaque source tombe sur « je ne sais pas » : la deuxième partie perd sa matière, le tour tient.
    const port = fauxPort(BON);
    const d = deps(port);
    d.lireContexte.mockRejectedValueOnce(new Error("base indisponible"));
    expect(
      await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), d.deps),
    ).not.toBeNull();
    expect(port.recues[0].messages).toHaveLength(2);
  });
});

describe("[LE CŒUR] le cache est PAR PERSONNE, et c’est l’inverse d’hier", () => {
  function depotMemoire() {
    const lignes = new Map<string, TextePersonnelFige>();
    const cleDe = (c: { utilisatriceId: string; jour: string; versionEditoriale: string }) =>
      `${c.utilisatriceId}|${c.jour}|${c.versionEditoriale}`;
    const depot: DepotTextePersonnel = {
      lire: vi.fn(async (cle) => lignes.get(cleDe(cle)) ?? null),
      figer: vi.fn(async (candidat: CandidatTextePersonnel) => {
        const cle = cleDe(candidat);
        // `on conflict do nothing` : le premier servi fait foi.
        if (!lignes.has(cle)) lignes.set(cle, candidat);
        return lignes.get(cle) as TextePersonnelFige;
      }),
    };
    return { depot, lire: depot.lire, figer: depot.figer };
  }

  it("ne rappelle pas le modèle pour la même personne, le même jour", async () => {
    const port = fauxPort(BON);
    const d = deps(port);
    const premier = await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), d.deps);
    const second = await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), d.deps);

    expect(second).toEqual(premier);
    expect(port.completer).toHaveBeenCalledTimes(1);
    // Et le métrage non plus ne double pas : un texte relu n'est pas un appel.
    expect(d.metrer).toHaveBeenCalledTimes(1);
  });

  it("[LE CŒUR] DEUX PERSONNES NE PARTAGENT PLUS UN TEXTE — la propriété est inversée", async () => {
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // ⚠️ CE TEST AFFIRMAIT EXACTEMENT LE CONTRAIRE JUSQU'AU 2026-09-07.
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // Il rejouait avec une AUTRE utilisatrice et exigeait le MÊME texte sans nouvel appel : c'était
    // la propriété du cache partagé, et elle était juste tant que le texte ne nommait personne.
    // Depuis que la première partie nomme son Soleil natal et la deuxième son prénom, servir à
    // Bérénice le texte d'Alice serait une fuite de données entre comptes — pas une optimisation.
    const partage = depotMemoire();
    const premierPort = fauxPort(BON);
    expect(
      await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), {
        ...deps(premierPort).deps,
        depot: partage.depot,
      }),
    ).not.toBeNull();

    viderMemoTexteDuJour();
    const secondPort = fauxPort(BON);
    expect(
      await texteDuJourGenere(supabaseOk, AUTRE, demande(), {
        ...deps(secondPort).deps,
        depot: partage.depot,
      }),
    ).not.toBeNull();
    expect(secondPort.completer, "le texte d’une autre a été resservi").toHaveBeenCalledTimes(1);

    // Et la clé PORTE l'identifiant : c'est lui qui cloisonne, pas la discipline de l'appelant.
    const cleLue = vi.mocked(partage.lire).mock.calls.at(-1)?.[0];
    expect(Object.keys(cleLue ?? {}).sort()).toEqual(["jour", "utilisatriceId", "versionEditoriale"]);
    expect(JSON.stringify(cleLue)).toContain(AUTRE);
  });

  it("relit le même texte après perte du mémo de processus, sans nouvel appel au modèle", async () => {
    const partage = depotMemoire();
    const premierPort = fauxPort(BON);
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), {
      ...deps(premierPort).deps,
      depot: partage.depot,
    });
    expect(partage.figer).toHaveBeenCalledTimes(1);

    viderMemoTexteDuJour();
    const secondPort = fauxPort("Ce modèle ne doit pas être appelé.");
    expect(
      await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), {
        ...deps(secondPort).deps,
        depot: partage.depot,
      }),
    ).not.toBeNull();
    expect(secondPort.completer).not.toHaveBeenCalled();
  });

  it("ne ressert pas un texte modèle en cache après révocation du consentement", async () => {
    const partage = depotMemoire();
    const port = fauxPort(BON);
    const configuration = { ...deps(port).deps, depot: partage.depot };

    expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), configuration)).not.toBeNull();
    expect(await texteDuJourGenere(supabaseRevoque, UTILISATRICE, demande(), configuration)).toBeNull();
    expect(port.completer).toHaveBeenCalledTimes(1);
  });

  it("revient au corpus si le premier texte modèle ne peut pas être figé durablement", async () => {
    const port = fauxPort(BON);
    const depot: DepotTextePersonnel = {
      lire: vi.fn(async () => null),
      figer: vi.fn(async () => {
        throw new Error("cache_indisponible");
      }),
    };
    expect(
      await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), { ...deps(port).deps, depot }),
    ).toBeNull();
    expect(port.completer).toHaveBeenCalledTimes(1);
  });

  it("sert le premier enregistrement retourné par le dépôt même si le modèle propose autre chose", async () => {
    const partage = depotMemoire();
    const dejaLa = { ciel: "a".repeat(100), pourToi: "b".repeat(100), gestes: "c".repeat(100) };
    vi.mocked(partage.figer).mockImplementation(async (candidat) => ({
      ...candidat,
      parties: dejaLa,
      provenance: "modele" as const,
    }));

    const port = fauxPort(BON);
    expect(
      await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), {
        ...deps(port).deps,
        depot: partage.depot,
      }),
    ).toEqual(dejaLa);
    expect(vi.mocked(partage.figer).mock.calls[0][0].parties?.ciel).toContain("Bélier");
  });
});

describe("[LE BORD] tous les échecs se ressemblent, vus de la page", () => {
  it("un egress bloqué rend `null` sans appeler le modèle", async () => {
    const port = fauxPort(BON);
    const d = deps(port);
    expect(await texteDuJourGenere(supabaseRevoque, UTILISATRICE, demande(), d.deps)).toBeNull();
    expect(port.completer).not.toHaveBeenCalled();
    expect(d.metrer).not.toHaveBeenCalled();
  });

  it("un texte refusé rend `null`, MAIS il est mesuré", async () => {
    const port = fauxPort(MAUVAIS);
    const d = deps(port);
    expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), d.deps)).toBeNull();
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

  it("[LE CŒUR] la clé d’idempotence du métrage distingue deux personnes", async () => {
    // ⚠️ MUTATION-CIBLE : garder la clé d'hier, bâtie sur (jour, signature, version). Avec un cache
    // PARTAGÉ, deux personnes du même ciel produisaient un seul appel, donc une seule ligne : la clé
    // était juste. Avec un cache par personne, elles produisent DEUX appels — et l'unicité
    // (utilisatrice_id, cle_idempotence) les distingue déjà. Ce que la clé doit encore distinguer,
    // c'est le second appel RÉEL de la même personne, sur une matière différente.
    const premier = deps(fauxPort(BON));
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), premier.deps);
    viderMemoTexteDuJour();
    const second = deps(fauxPort(BON));
    second.lireContexte.mockResolvedValueOnce({ ...CONTEXTE, prenom: "Bérénice" });
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), second.deps);

    expect(second.metrer.mock.calls[0][0].cleIdempotence).not.toBe(
      premier.metrer.mock.calls[0][0].cleIdempotence,
    );
  });

  it("un texte refusé fige une pierre tombale : la génération suivante ne repart pas", async () => {
    // Sans elle, un refus reproductible — un mot du lexique que le modèle remet à chaque essai —
    // déclencherait un appel fournisseur à CHAQUE affichage de la journée.
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), deps(fauxPort(MAUVAIS)).deps);
    const bon = fauxPort(BON);
    expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), deps(bon).deps)).toBeNull();
    expect(bon.completer).not.toHaveBeenCalled();
  });

  it("une panne du port rend `null` et ne jette pas", async () => {
    const quiJette = {
      creerPort: async () => {
        throw new Error("clé absente");
      },
      metrer: vi.fn(async () => {}),
    };
    expect(await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), quiJette)).toBeNull();
  });

  it("[LE CŒUR] un modèle trop lent ne pose AUCUNE pierre tombale", async () => {
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // ⚠️ CE TEST AFFIRMAIT LE CONTRAIRE JUSQU'AU 2026-09-07, ET C'ÉTAIT LE DÉFAUT LE PLUS COÛTEUX.
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // Il exigeait qu'au délai, le repli corpus soit FIGÉ et que la génération suivante ne reparte
    // pas. Avec un cache PARTAGÉ, c'était supportable : quelqu'un d'autre, ailleurs, gagnait la
    // course. Avec un cache PAR PERSONNE et un modèle fort qui écrit trois parties, personne ne
    // court à sa place — la tombale serait posée au premier affichage, tous les jours, et elle
    // n'aurait JAMAIS vu son texte. Pas « rarement » : jamais.
    vi.useFakeTimers();
    try {
      const port = fauxPort(BON, 30_000);
      const course = texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), deps(port).deps);

      await vi.advanceTimersByTimeAsync(12_000);
      expect(await course, "au délai, la page repart avec le corpus").toBeNull();

      // La génération continue et fige elle-même ce qu'elle produit.
      await vi.advanceTimersByTimeAsync(30_000);
      const port2 = fauxPort(BON);
      expect(
        await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), deps(port2).deps),
        "le texte figé par la génération en vol doit être servi",
      ).not.toBeNull();
      expect(port2.completer, "le mémo répond, aucun second appel").not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("l’accueil attend moins que la halte", async () => {
    // Les deux surfaces n'ont pas la même patience : la halte est une visite délibérée, l'accueil
    // est la page la plus vue du produit et ne doit rien retenir.
    vi.useFakeTimers();
    try {
      const port = fauxPort(BON, 9_000);
      const course = texteDuJourGenere(supabaseOk, UTILISATRICE, demande("accueil"), deps(port).deps);
      await vi.advanceTimersByTimeAsync(6_000);
      expect(await course).toBeNull();
      await vi.advanceTimersByTimeAsync(10_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("un ciel sans rien de personnel à dire n’appelle pas le modèle", async () => {
    // Sans Soleil natal : pas de distance de Lune, pas de configuration. Ce qui resterait serait
    // commun à tout le monde — le corpus dit mieux, et il ne coûte rien.
    const sansSoleil = assemblerHoroscope({ ...theme, positions: [] }, JOUR, ciel);
    const port = fauxPort(BON);
    expect(
      await texteDuJourGenere(
        supabaseOk,
        UTILISATRICE,
        { horoscope: sansSoleil, theme: { ...theme, positions: [] }, attente: "halte" },
        deps(port).deps,
      ),
    ).toBeNull();
    expect(port.completer).not.toHaveBeenCalled();
  });

  it("[LE CŒUR] la matière n’est PAS lue quand le cache répond", async () => {
    // Cinq requêtes de base sur le chemin de l'accueil, à chaque affichage, pour un texte déjà
    // écrit : le genre de coût qui ne se voit que sur la facture.
    const d = deps(fauxPort(BON));
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), d.deps);
    await texteDuJourGenere(supabaseOk, UTILISATRICE, demande(), d.deps);
    expect(d.lireContexte).toHaveBeenCalledTimes(1);
  });
});
