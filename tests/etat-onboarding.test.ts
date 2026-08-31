import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ErreurLectureOnboarding,
  etapeOnboardingPour,
} from "@/app/(auth)/etat-onboarding";

/**
 * etat-onboarding.test.ts — [8.3] LA GARDE PARTAGÉE PAR TOUTES LES PAGES PROTÉGÉES.
 *
 * ══ POURQUOI CE FICHIER EXISTE MAINTENANT ═══════════════════════════════════════════════════════
 *
 * `etapeOnboardingPour` faisait DEUX lectures de base, indépendantes, awaitées l'une après l'autre.
 * Elle est appelée par la scène, les réglages, la mémoire, les lectures, la synthèse, les ancrages
 * et la halte du socle : cet aller-retour en file indienne se payait à chaque navigation, sur chaque
 * écran, par tout le monde. Retour de Julian, 2026-08-25 : « quand je clique sur profil, rien ne se
 * passe et d'un coup, quelques secondes après, la page s'ouvre. »
 *
 * ⚠️ LE PARALLÉLISME EST UN GESTE À RISQUE, ET C'EST LUI QU'ON GARDE ICI. En série, une panne sur
 * `utilisatrice` levait AVANT que `consentement` soit lu. En parallèle, les deux promesses existent
 * en même temps : une erreur mal traitée devient un rejet non capté, ou pire, un `null` qui se lit
 * comme « pas de ligne ». Or confondre « lecture impossible » avec « pas de ligne » renvoie une
 * adulte déjà consentante vers `/naissance`, où l'immutabilité de la date la bloque — le défaut est
 * ARRIVÉ (revue 1.5), et c'est pour ça que les deux `throw` sont éprouvés séparément.
 */

const UID = "11111111-1111-4111-8111-111111111111";

const ADULTE = { date_naissance: "1990-06-15", mineur_detecte: false, barriere_minorite_le: null };
const CONSENTIE = { art9_accorde: true, ia_reconnue: true, cgu_acceptees: true, revoked_at: null };

/** Un client doublé : chaque table rend ce qu'on lui dit, et on COMPTE l'ordre des départs. */
function client(
  parTable: Record<string, { data?: unknown; error?: { message: string } }>,
  journal: string[] = [],
): SupabaseClient {
  return {
    from(table: string) {
      journal.push(`départ:${table}`);
      const reponse = parTable[table] ?? { data: null };
      const chaine = {
        select: () => chaine,
        eq: () => chaine,
        maybeSingle: async () => {
          // Un tour de boucle : c'est ce qui permet de distinguer « en série » de « en parallèle ».
          await new Promise((r) => setTimeout(r, 5));
          journal.push(`retour:${table}`);
          return { data: reponse.data ?? null, error: reponse.error ?? null };
        },
      };
      return chaine;
    },
  } as unknown as SupabaseClient;
}

describe("[8.3/AC1] les deux lectures partent ENSEMBLE, plus en file indienne", () => {
  it("[LE CŒUR] les deux départs précèdent les deux retours", () => {
    // ⚠️ C'EST LA SEULE FORME QUI TUE SON MUTANT. Compter deux appels serait vrai en série comme en
    // parallèle. L'ORDRE, lui, ne l'est pas : en série on lit départ/retour/départ/retour.
    const journal: string[] = [];
    const c = client({ utilisatrice: { data: ADULTE }, consentement: { data: CONSENTIE } }, journal);
    return etapeOnboardingPour(c, UID).then(() => {
      expect(journal.slice(0, 2).every((e) => e.startsWith("départ:")), `ordre observé : ${journal.join(" → ")}`).toBe(
        true,
      );
      expect(journal.filter((e) => e.startsWith("départ:"))).toHaveLength(2);
    });
  });

  it("le verdict est inchangé : une adulte consentante entre dans la scène", async () => {
    const c = client({ utilisatrice: { data: ADULTE }, consentement: { data: CONSENTIE } });
    expect(await etapeOnboardingPour(c, UID)).toBe("suite");
  });
});

describe("[8.3/AC2 DUR] chacune des deux pannes lève, et aucun rejet n'échappe", () => {
  it("[LE CŒUR] une panne sur `utilisatrice` lève — jamais « pas de ligne »", async () => {
    const c = client({
      utilisatrice: { error: { message: "réseau coupé" } },
      consentement: { data: CONSENTIE },
    });
    await expect(etapeOnboardingPour(c, UID)).rejects.toMatchObject({
      name: "ErreurLectureOnboarding",
      sourceLecture: "utilisatrice",
    });
  });

  it("[LE CŒUR] une panne sur `consentement` lève aussi — c'est la moitié qu'on perdait", async () => {
    // En série, cette lecture n'avait même pas lieu si la première échouait. En parallèle elle a
    // lieu, et son erreur doit être traitée : c'est exactement le chemin que le geste a créé.
    const c = client({
      utilisatrice: { data: ADULTE },
      consentement: { error: { message: "réseau coupé" } },
    });
    await expect(etapeOnboardingPour(c, UID)).rejects.toMatchObject({
      name: "ErreurLectureOnboarding",
      sourceLecture: "consentement",
    });
  });

  it("les DEUX en panne : la première nommée l'emporte, et rien ne fuit", async () => {
    const rejets: unknown[] = [];
    const capter = (e: unknown) => rejets.push(e);
    process.on("unhandledRejection", capter);
    const c = client({
      utilisatrice: { error: { message: "A" } },
      consentement: { error: { message: "B" } },
    });
    await expect(etapeOnboardingPour(c, UID)).rejects.toBeInstanceOf(ErreurLectureOnboarding);
    await new Promise((r) => setTimeout(r, 20));
    process.off("unhandledRejection", capter);
    expect(rejets, "un rejet non capté échappe — le parallélisme fuit").toEqual([]);
  });

  it("ne livre jamais le message Supabase à la frontière d'affichage", async () => {
    const c = client({
      utilisatrice: { error: { message: "token interne et détail SQL à ne pas afficher" } },
      consentement: { data: CONSENTIE },
    });
    const erreur = etapeOnboardingPour(c, UID).catch((cause) => cause);
    await expect(erreur).resolves.toMatchObject({
      message: "etat_onboarding_indisponible",
      sourceLecture: "utilisatrice",
    });
    await expect(erreur).resolves.not.toMatchObject({
      message: expect.stringMatching(/token interne|SQL/i),
    });
  });
});

describe("[8.3/AC3] les cinq sorties restent couvertes après le changement", () => {
  const cas: ReadonlyArray<[string, Record<string, { data: unknown }>, string]> = [
    [
      "barre",
      {
        utilisatrice: { data: { ...ADULTE, barriere_minorite_le: "2026-08-01T00:00:00Z" } },
        consentement: { data: CONSENTIE },
      },
      "barre",
    ],
    [
      "mineur",
      { utilisatrice: { data: { ...ADULTE, mineur_detecte: true } }, consentement: { data: CONSENTIE } },
      "mineur",
    ],
    ["naissance", { utilisatrice: { data: null }, consentement: { data: null } }, "naissance"],
    ["consentement", { utilisatrice: { data: ADULTE }, consentement: { data: null } }, "consentement"],
    [
      "revoque",
      {
        utilisatrice: { data: ADULTE },
        consentement: { data: { ...CONSENTIE, revoked_at: "2026-08-20T00:00:00Z" } },
      },
      "revoque",
    ],
  ];

  it("[CONTRÔLE DU CONTRÔLE] les cinq cas sont bien distincts", () => {
    expect(new Set(cas.map(([, , attendu]) => attendu)).size).toBe(5);
  });

  for (const [nom, tables, attendu] of cas) {
    it(`sortie « ${nom} » : toujours atteinte`, async () => {
      expect(await etapeOnboardingPour(client(tables), UID)).toBe(attendu);
    });
  }

  it("[LE PIÈGE DES CGU] les trois cases sont exigées, pas seulement l'existence d'une ligne", async () => {
    // Acquis de la revue des Epics 1-4 : une ligne `cgu_acceptees=false` est écrivable en direct
    // sous RLS. Le produit s'utilisait entièrement sans contrat.
    const c = client({
      utilisatrice: { data: ADULTE },
      consentement: { data: { ...CONSENTIE, cgu_acceptees: false } },
    });
    expect(await etapeOnboardingPour(c, UID)).toBe("consentement");
  });
});

/**
 * ══ LE 500 QUI OBLIGEAIT À RECHARGER (retour du 2026-08-30) ═════════════════════════════════════
 *
 * « This page couldn't load — A server error occurred. Reload to try again. […] je dois reload
 * pour ensuite afficher la page. » Le texte est ANGLAIS : c'est la page 500 intégrée de Next, donc
 * une erreur née au-dessus des boundaries maison.
 *
 * `app/page.tsx` garde tout le reste derrière un `.catch()` ; ce `throw`-ci était le seul nu. Une
 * lecture qui échoue UNE fois — un JWT tout juste rafraîchi dont l'`iat` devance l'horloge de
 * Postgres de quelques centaines de millisecondes — rendait un 500 franc.
 *
 * ⚠️ CE QUE CES DEUX TESTS GARDENT ENSEMBLE, ET POURQUOI IL EN FAUT DEUX. Absorber une panne
 * transitoire et continuer de hurler sur une panne réelle sont deux exigences OPPOSÉES : un
 * correctif qui avale tout satisfait la première et trahit la seconde — et c'est précisément la
 * faute que l'en-tête du fichier interdit depuis la revue 1.5 (« ne JAMAIS confondre lecture
 * impossible avec pas de ligne », sinon une adulte consentante repart vers /naissance, où
 * l'immutabilité de la date la bloque). Le premier test seul serait vert sur un `catch` qui rend
 * « pas de ligne ». Le second l'en empêche.
 */
describe("[2026-08-30] une lecture qui cligne ne rend plus un 500", () => {
  /** Un client dont la Nᵉ lecture d'une table échoue, les suivantes passent. */
  function clientQuiCligne(
    echecsParTable: Record<string, number>,
    donnees: Record<string, unknown>,
  ): { client: SupabaseClient; departs: () => number } {
    let departs = 0;
    const restants = { ...echecsParTable };
    const c = {
      from(table: string) {
        departs += 1;
        const chaine = {
          select: () => chaine,
          eq: () => chaine,
          maybeSingle: async () => {
            if ((restants[table] ?? 0) > 0) {
              restants[table] -= 1;
              return { data: null, error: { message: "JWT issued at future" } };
            }
            return { data: donnees[table] ?? null, error: null };
          },
        };
        return chaine;
      },
    } as unknown as SupabaseClient;
    return { client: c, departs: () => departs };
  }

  it("[LE CŒUR] une panne transitoire est reprise une fois, et la page rend", async () => {
    const { client: c, departs } = clientQuiCligne(
      { utilisatrice: 1 },
      { utilisatrice: ADULTE, consentement: CONSENTIE },
    );
    expect(await etapeOnboardingPour(c, UID)).toBe("suite");
    // Quatre départs : la reprise relit LES DEUX tables, elle ne rattrape pas une moitié.
    expect(departs(), "la reprise n'a pas eu lieu, ou elle n'a relu qu'une table").toBe(4);
  });

  it("[LE CŒUR] une panne QUI DURE lève toujours — la reprise n'avale rien", async () => {
    const { client: c } = clientQuiCligne(
      { utilisatrice: 99 },
      { utilisatrice: ADULTE, consentement: CONSENTIE },
    );
    await expect(etapeOnboardingPour(c, UID)).rejects.toMatchObject({
      name: "ErreurLectureOnboarding",
      sourceLecture: "utilisatrice",
    });
  });

  it("le consentement aussi est repris, pas seulement `utilisatrice`", async () => {
    const { client: c } = clientQuiCligne(
      { consentement: 1 },
      { utilisatrice: ADULTE, consentement: CONSENTIE },
    );
    expect(await etapeOnboardingPour(c, UID)).toBe("suite");
  });

  it("[ANTI-VACUITÉ] sans panne, aucune reprise : le chemin nominal garde ses deux départs", async () => {
    // Sans ce témoin, une reprise SYSTÉMATIQUE ferait passer les trois tests ci-dessus tout en
    // doublant le coût de chaque page gardée du produit.
    const { client: c, departs } = clientQuiCligne(
      {},
      { utilisatrice: ADULTE, consentement: CONSENTIE },
    );
    expect(await etapeOnboardingPour(c, UID)).toBe("suite");
    expect(departs(), "une reprise court alors que rien n'a échoué").toBe(2);
  });
});

