import { describe, it, expect, vi, afterEach } from "vitest";
import { creerAdaptateurWebPush, TTL_S, DELAI_POUSSEE_MS } from "@/lib/poussee/adaptateurs/web-push";
import { base64url } from "@/lib/poussee/vapid";
import type { AbonnementPoussee } from "@/lib/poussee/port";

/**
 * Story 6.2 (T3) — L'ADAPTATEUR WEB PUSH, avec un `fetch` doublé.
 *
 * Ce que ce fichier éprouve et qu'aucun autre ne peut : ce qui SORT sur le réseau (la requête exacte)
 * et ce que l'adaptateur CONCLUT de ce qui rentre. Les deux comptent séparément — un adaptateur qui
 * poste correctement mais lit mal le code de retour supprimerait des abonnements vivants.
 */

let cles: { publique: string; privee: string; sujet: string };

async function clesDEssai() {
  if (cles) return cles;
  const paire = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const brut = new Uint8Array(await crypto.subtle.exportKey("raw", paire.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", paire.privateKey);
  cles = { publique: base64url(brut), privee: jwk.d as string, sujet: "mailto:contact@exemple.fr" };
  return cles;
}

const ABONNEMENT: AbonnementPoussee = {
  endpoint: "https://web.push.apple.com/anam-essai",
  p256dh: "B".repeat(87),
  auth: "A".repeat(22),
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** Double `fetch` et rend les appels observés. */
function doublerFetch(reponse: Response | (() => never)): { appels: [string, RequestInit][] } {
  const appels: [string, RequestInit][] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    appels.push([url, init]);
    if (typeof reponse === "function") reponse();
    return reponse;
  });
  return { appels };
}

describe("[6.2/T3] ce qui SORT sur le réseau", () => {
  it("[LE CŒUR] un POST de ZÉRO OCTET — il n'y a pas de corps où loger de l'art. 9", async () => {
    // ⚠️ C'est la décision D1, vérifiée là où elle se joue. Un `body` ajouté ici — même « juste le
    // mantra du jour » — s'afficherait sur un écran verrouillé, dans le métro (FR-035, NFR-015).
    const { appels } = doublerFetch(new Response(null, { status: 201 }));
    const port = creerAdaptateurWebPush(await clesDEssai());
    expect(await port.reveiller(ABONNEMENT, "socle_quotidien")).toBe("poussee");

    expect(appels).toHaveLength(1);
    const [url, init] = appels[0];
    expect(url).toBe(ABONNEMENT.endpoint);
    expect(init.method).toBe("POST");
    expect(init.body, "une charge utile est partie").toBeUndefined();
    const entetes = init.headers as Record<string, string>;
    expect(entetes["Content-Length"]).toBe("0");
    expect(entetes.Authorization).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]+$/);
    expect(entetes.Urgency).toBe("low");
    expect(entetes.TTL).toBe(String(TTL_S));
    // Ni les clés de l'abonnée, ni un en-tête de chiffrement : il n'y a rien à chiffrer.
    expect(JSON.stringify(entetes)).not.toContain(ABONNEMENT.p256dh);
    expect(entetes["Content-Encoding"]).toBeUndefined();
  });

  it("[LE CŒUR] le TTL est de QUATRE heures, pas de vingt-quatre", async () => {
    // ⚠️ Mutation-cible : `TTL_S = 86400`, la valeur qu'on copie de tous les exemples. Une poussée
    // gardée un jour entier se délivre à n'importe quelle heure du lendemain — y compris la nuit —
    // et « l'heure choisie » (AC2) perd tout son sens. Un téléphone éteint quatre heures a manqué sa
    // journée, et l'AC3 dit qu'on ne rattrape rien.
    expect(TTL_S).toBe(4 * 3_600);
    expect(TTL_S).toBeLessThan(12 * 3_600);
  });

  it("le délai du POST reste sous le budget du job (leçon de la revue 4.10)", async () => {
    // Là-bas, l'adaptateur Resend portait 10 s pour un job qui en avait 8 : le job se faisait tuer
    // par son propre `avecDelai` avant que l'envoi n'ait le droit d'expirer, et l'ordonnanceur
    // rapportait `job_echoue` sur un courriel peut-être parti.
    const { DELAI_JOB_SOCLE_MS } = await import("@/lib/ordonnanceur/jobs/socle-quotidien");
    expect(DELAI_POUSSEE_MS).toBeLessThan(DELAI_JOB_SOCLE_MS);
  });
});

describe("[6.2/T3] ce que l'adaptateur CONCLUT", () => {
  it.each([[200], [201], [202]])("un %i vaut « poussée »", async (statut) => {
    // ⚠️ Mutation-cible : `statut === 201`. Les services répondent 201 en pratique, mais 200 et 202
    // sont conformes ; traiter un 202 comme un refus ferait rejouer une poussée déjà acceptée.
    doublerFetch(new Response(null, { status: statut }));
    const port = creerAdaptateurWebPush(await clesDEssai());
    expect(await port.reveiller(ABONNEMENT, "socle_quotidien")).toBe("poussee");
  });

  it.each([[404], [410]])("un %i vaut « endpoint mort » — et seulement ceux-là", async (statut) => {
    doublerFetch(new Response(null, { status: statut }));
    const port = creerAdaptateurWebPush(await clesDEssai());
    expect(await port.reveiller(ABONNEMENT, "socle_quotidien")).toBe("endpoint_mort");
  });

  it.each([[400], [401], [403], [429], [500], [503]])(
    "[LE CŒUR] un %i vaut « refus », JAMAIS « endpoint mort »",
    async (statut) => {
      // ⚠️ Mutation-cible : `reponse.ok ? "poussee" : "endpoint_mort"`. Les deux verdicts appellent
      // des gestes opposés — l'un supprime l'abonnement, l'autre ne touche à rien. Confondus, un 503
      // passager désabonnerait quelqu'un sans qu'elle l'ait demandé, et sans qu'elle le sache : la
      // notification cesserait simplement d'arriver.
      doublerFetch(new Response(null, { status: statut }));
      const port = creerAdaptateurWebPush(await clesDEssai());
      expect(await port.reveiller(ABONNEMENT, "socle_quotidien")).toBe("refuse");
    },
  );

  it("[LE CŒUR] un `fetch` qui LÈVE ne lève pas à son tour, et ne tue pas l'abonnement", async () => {
    // `reveiller` promet de ne pas lever : sans ça, chaque appelant devrait décider quoi faire d'une
    // exception au milieu d'une boucle de fan-out. DNS mort, TLS refusé, réseau coupé : « on ne sait
    // pas si c'est parti » — la réponse la moins affirmative.
    doublerFetch(() => {
      throw new TypeError("fetch failed");
    });
    const port = creerAdaptateurWebPush(await clesDEssai());
    await expect(port.reveiller(ABONNEMENT, "socle_quotidien")).resolves.toBe("refuse");
  });

  it("[LE CŒUR] un service MUET rend « refus » au bout du délai, il ne fait pas pendre le job", async () => {
    // La panne la plus banale d'un service tiers n'est pas l'erreur, c'est le silence. Sans la borne,
    // le fan-out entier attendrait jusqu'à ce que la plateforme tue la lambda — rien de clos, aucun
    // incident levé (le défaut n°8 de la revue 4.8, encore lui).
    const cles = await clesDEssai(); // AVANT les faux minuteurs — voir la boucle ci-dessous.
    // ⚠️ ON NE FAUSSE QUE `setTimeout`/`clearTimeout`, ET C'EST LA MOITIÉ DU CORRECTIF DU 2026-08-25.
    // `avecDelai` (`lib/domain/delai.ts`) n'utilise QUE ces deux-là ; `setImmediate`, lui, doit rester
    // RÉEL, sans quoi la boucle ci-dessous n'a aucun moyen de rendre la main à libuv.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    vi.stubGlobal("fetch", () => new Promise(() => {}));
    const port = creerAdaptateurWebPush(cles);

    let issue: string | undefined;
    void port.reveiller(ABONNEMENT, "socle_quotidien").then((v) => {
      issue = v;
    });
    // ⚠️ On AVANCE EN BOUCLE, et ce n'est pas de la superstition. `reveiller` signe d'abord son jeton
    // VAPID, et `crypto.subtle.sign` se règle sur un tour de boucle d'événements RÉEL, pas sur une
    // microtâche : au premier `advanceTimersByTimeAsync`, le minuteur d'`avecDelai` n'est pas encore
    // armé, et l'avance ne déclenche rien.
    //
    // ⚠️ CE TEST A ÉCHOUÉ EN CI LE 2026-08-25, SUR UN COMMIT QUI NE TOUCHAIT QU'UN FICHIER MARKDOWN
    // (`9fb1958`) — « expected undefined to be 'refuse' ». Il n'était pas capricieux : il était FAUX,
    // et il l'était depuis toujours. La version précédente bouclait vingt fois sur
    // `advanceTimersByTimeAsync` SANS jamais rendre la main à la boucle d'événements : ces vingt tours
    // se consomment en microtâches, en quelques microsecondes. Tant que la signature ECDSA se termine
    // vite — deux tours suffisent au repos, mesuré — le test passe. Mais `crypto.subtle` se règle sur
    // le pool de threads de libuv (quatre par défaut, PARTAGÉ par tous les fichiers de test d'un même
    // processus) : dans une suite complète en parallèle, la signature peut attendre son tour derrière
    // d'autres. Les vingt itérations s'épuisent alors avant qu'elle démarre, `issue` reste `undefined`,
    // et le test accuse l'adaptateur d'avoir pendu alors que c'est la boucle qui n'a rien attendu.
    //
    // Le `setImmediate` ci-dessous est un VRAI tour de boucle : il laisse libuv livrer la signature.
    // Le mécanisme a été reproduit avant d'être corrigé — une opération qui ne se termine qu'après 40
    // tours réels n'est JAMAIS atteinte par la boucle d'origine, et l'est par celle-ci.
    for (let i = 0; i < 200 && issue === undefined; i += 1) {
      await new Promise((tour) => setImmediate(tour));
      await vi.advanceTimersByTimeAsync(DELAI_POUSSEE_MS);
    }
    expect(issue, "l'adaptateur a pendu — la borne ne borne rien").toBe("refuse");
  });

  it("un endpoint sans TLS ne part pas, et ne lève pas non plus", async () => {
    doublerFetch(new Response(null, { status: 201 }));
    const port = creerAdaptateurWebPush(await clesDEssai());
    expect(await port.reveiller({ ...ABONNEMENT, endpoint: "http://web.push.apple.com/x" }, "socle_quotidien")).toBe(
      "refuse",
    );
  });
});

describe("[6.2/T3] la fabrique ne laisse jamais un test pousser pour de vrai", () => {
  it("sous Vitest, le port n'est pas configuré et LÈVE si on l'appelle", async () => {
    // La leçon de la revue 4.9 (T4-3), où une suite de tests avait envoyé du vrai courrier. L'effet
    // serait pire ici : un courriel se supprime, une notification déjà affichée sur un écran
    // verrouillé ne se rappelle pas.
    const { creerPortPoussee } = await import("@/lib/poussee/fabrique");
    const port = creerPortPoussee();
    expect(process.env.VITEST, "ce test ne prouve rien hors de Vitest").toBeTruthy();
    expect(port.estConfigure()).toBe(false);
    await expect(port.reveiller(ABONNEMENT, "socle_quotidien")).rejects.toThrow(/poussee_non_configuree/);
  });
});
