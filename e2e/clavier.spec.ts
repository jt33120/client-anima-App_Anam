import { test, expect, type Page } from "@playwright/test";
import { ouvrirUnCompteNeuf } from "./_entrer";
import { couleursNuit } from "../app/styles/tokens";

/**
 * clavier.spec.ts — LA TABULATION RÉELLE, CE QUE PERSONNE N'AVAIT PU MESURER
 *
 * ══ POURQUOI CE FICHIER ═══════════════════════════════════════════════════════════════════════
 *
 * Le tour de QA 1 a écrit, honnêtement : « les règles CSS sont en `:focus-visible`, qu'un focus
 * déclenché par SCRIPT n'active pas. Seul le CSS a été vérifié, pas l'affichage effectif. » Le
 * tour 2 n'a pas pu le faire non plus — l'extension ne s'appairait plus. Le point est resté NON
 * TESTÉ deux tours de suite.
 *
 * Playwright, lui, envoie de vraies frappes : `:focus-visible` s'active pour de bon, et l'anneau
 * est réellement peint. C'est la seule façon d'en finir avec ce trou.
 *
 * ⚠️ CE QUI SE MESURE ICI NE SE MESURE PAS DANS LA SOURCE. `tests/qa-visuelle-19-aout.test.ts`
 * prouve que les 41 déclarations `outline` du dépôt sont identiques ; il ne peut rien dire de ce
 * qui est PEINT — une règle juste peut être écrasée par la cascade, ou l'élément peut ne jamais
 * recevoir le focus. Les deux gardes se complètent, aucune ne remplace l'autre.
 */

/** `#RRGGBB` → `rgb(r, g, b)`, la forme que `getComputedStyle` rend en navigateur. */
function hexVersRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/** L'anneau de la charte : `2px solid var(--bordure-forte)`, décalé de 2px. La couleur est
 *  DÉRIVÉE du jeton, plus écrite en dur : la palette Soft Balance (retour du fondateur,
 *  2026-09-01) a changé la teinte (#77719C → #7A90C9) sans changer la règle, et une valeur
 *  recopiée ici aurait rougi cette spec pour une bonne raison mécanique sans rien dire de vrai. */
const ANNEAU = { largeur: "2px", style: "solid", couleur: hexVersRgb(couleursNuit["bordure-forte"]) };

type Arret = {
  readonly balise: string;
  readonly nom: string;
  readonly anneau: string;
  readonly decalage: string;
};

/**
 * Attend que LE PRODUIT soit à l'écran avant de commencer à tabuler.
 *
 * ⚠️ SANS CETTE ATTENTE, LA TRAVERSÉE PEUT MESURER UN ÉCRAN QUI N'EXISTE PAS ENCORE. `next dev`
 * compile ses routes À LA DEMANDE : la toute première navigation vers un chemin peut rendre une
 * coquille pendant que la surcouche de développement occupe le focus. La traversée relève alors
 * ZÉRO arrêt et le test accuse la page d'être inatteignable au clavier — sur une page qui va très
 * bien deux secondes plus tard.
 *
 * C'est exactement ce que la CI a rendu le 2026-08-26 : « les écrans du compte » a rougi sur la
 * PREMIÈRE page de sa boucle, pendant que deux autres tests du même fichier traversaient les mêmes
 * chemins sans broncher — parce qu'ils passaient après, sur des routes déjà compilées.
 *
 * ⚠️ ET ELLE N'ADOUCIT RIEN. Elle n'attend pas « un peu » : elle attend que `<main>` soit VISIBLE,
 * c'est-à-dire que le rendu du produit ait eu lieu. Si `<main>` n'arrive jamais, l'attente échoue —
 * et ça, c'en serait un vrai défaut.
 */
/**
 * ⚠️ ELLE ATTENDAIT `main`, ET LE SQUELETTE D'ATTENTE EST UN `main` (mesuré le 2026-09-05).
 *
 * `/memoire` et `/reglages` sont les DEUX SEULES routes de la boucle ci-dessous à porter un
 * `loading.tsx` (`/mes-donnees`, `/abonnement` et `/aide` n'en ont pas, et `render/HalteEnAttente.tsx`
 * écrit pourquoi). Cette frontière rend `<main aria-hidden="true">` avec trois blocs vides et
 * ZÉRO élément focusable. L'attente était donc satisfaite par le squelette : `traverser` pressait
 * Tab dans une page sans arrêt, relevait un tableau vide, et DEUX tests concluaient que ces deux
 * haltes étaient « inatteignables au clavier ». Elles vont parfaitement bien.
 *
 * La preuve n'a rien coûté : `playwright.config.ts` garde une capture par échec, et celle du run
 * 33961544822 montre le squelette — un écran nu avec « Anam » au centre. C'est la troisième fois
 * que ce fichier accuse le produit d'un défaut du HARNAIS (surcouche de dev le 26/08, routes non
 * compilées le 26/08, squelette d'attente aujourd'hui) : à chaque fois parce que l'attente cédait
 * sur quelque chose de plus faible que « le produit est là ».
 *
 * `aria-hidden="true"` est le discriminant, et il est sûr : sur les 38 `<main>` de `app/` et
 * `render/`, `HalteEnAttente` est le SEUL à le porter. Un squelette qui deviendrait visible aux
 * lecteurs d'écran ferait donc rougir ce test, ce qui est le bon sens de la garde.
 */
const attendreLeProduit = (page: Page) =>
  page
    .locator('main:not([aria-hidden="true"])')
    .first()
    .waitFor({ state: "visible", timeout: 20_000 });

/**
 * Traverse l'écran à la touche Tab et relève, à CHAQUE arrêt, ce que le navigateur peint vraiment.
 * S'arrête quand le focus revient au point de départ (le cycle est bouclé) ou au plafond.
 */
async function traverser(page: Page, plafond = 40, ou = ""): Promise<Arret[]> {
  const arrets: Arret[] = [];
  const vus = new Set<string>();
  let portails = 0;

  for (let i = 0; i < plafond; i++) {
    await page.keyboard.press("Tab");
    const a: Arret | "portail" | null = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      // ⚠️ `nextjs-portal` EST LA SURCOUCHE DE DÉVELOPPEMENT DE NEXT, PAS LE PRODUIT. Elle prend le
      // focus et peint son propre contour ; la compter ferait rougir la garde sur quelque chose que
      // personne ne voit en production. On la SAUTE — voir la boucle plus bas, qui a longtemps cru
      // s'arrêter dessus alors qu'elle prétendait l'ignorer.
      if (el.tagName.toLowerCase() === "nextjs-portal") return "portail" as const;
      const s = getComputedStyle(el);
      return {
        balise: el.tagName.toLowerCase(),
        nom:
          el.getAttribute("name") ||
          el.getAttribute("aria-label") ||
          (el.textContent || "").trim().slice(0, 40) ||
          el.getAttribute("href") ||
          "",
        anneau: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`,
        decalage: s.outlineOffset,
      };
    });
    // ⚠️ « ON L'IGNORE » ET « ON S'ARRÊTE DESSUS » NE SONT PAS LA MÊME CHOSE, et le code faisait le
    // second en disant le premier (corrigé le 2026-08-26). La surcouche de développement de Next
    // rendait `null`, et `if (!a) break` confondait « ce n'est pas le produit » avec « il n'y a plus
    // rien à visiter ». Quand le portail prenait le focus EN PREMIER — ce qui arrive dès que Next
    // affiche son indicateur — la traversée rendait ZÉRO arrêt, et deux tests concluaient que
    // `/reglages` était « inatteignable au clavier ». La page allait parfaitement bien.
    //
    // Mesuré en CI le 2026-08-25 : `/reglages → aucun arrêt`, sur une page qui rend une quinzaine
    // d'éléments focusables. Une garde qui accuse le produit d'un défaut du harnais fait perdre le
    // temps qu'elle prétend faire gagner.
    if (a === "portail") {
      portails += 1;
      continue; // ce n'est pas le produit : on saute, on ne s'arrête pas
    }
    if (!a) break; // le focus est sorti du document : la traversée a bouclé
    const cle = `${a.balise}|${a.nom}`;
    if (vus.has(cle)) break; // on a bouclé
    vus.add(cle);
    arrets.push(a);
  }

  // ⚠️ « AUCUN ARRÊT » N'EST PAS UN DIAGNOSTIC, ET IL A COÛTÉ DEUX PASSAGES DE CI (2026-08-26).
  //
  // Le test disait « /reglages → inatteignable au clavier » sur une page qui rend une quinzaine
  // d'éléments focusables. La cause n'était pas la page : la surcouche de développement de Next
  // occupait le focus du début à la fin — ce qui arrive dès qu'elle affiche une erreur ou un
  // avertissement. Une traversée vide accusait alors le produit d'un défaut d'accessibilité, et il
  // fallait deviner.
  //
  // Elle le DIT maintenant. Un harnais qui rend un résultat vide sans expliquer pourquoi transforme
  // chaque échec en enquête.
  if (arrets.length === 0 && portails > 0) {
    // ⚠️ ET IL DIT MAINTENANT LAQUELLE, ET CE QU'ELLE AFFICHE (2026-08-26, second tour).
    //
    // La première version de ce diagnostic disait « la page affiche probablement une erreur » sans
    // nommer la page ni l'erreur — sur une boucle de CINQ chemins. Elle a rougi en CI, et il restait
    // à deviner lequel des cinq, puis à reproduire pour lire le message. Un diagnostic qui demande
    // une enquête n'a fait que déplacer l'enquête.
    //
    // La surcouche de Next porte son texte dans un `shadowRoot` : on va le chercher. C'est la seule
    // façon qu'un passage de CI — vingt minutes — rende la CAUSE et pas seulement le symptôme.
    //
    // ⚠️ ET IL FAUT RETIRER LES `<style>` AVANT DE LIRE, SANS QUOI ON NE LIT QU'EUX (2026-08-26,
    // second tour). `textContent` descend DANS les balises `<style>` et en rend le CSS comme du
    // texte — et la feuille de la surcouche commence par l'intégralité du reset « Bootstrap
    // Reboot v4.4.1 », plusieurs milliers de caractères. Le premier passage de ce diagnostic a
    // rougi en produisant fidèlement ce CSS, et rien du message d'erreur qu'il était censé montrer
    // n'entrait dans les 400 premiers caractères. Un diagnostic qui cite la feuille de style au
    // lieu de l'erreur a déplacé le problème sans le résoudre.
    const texte = await page
      .evaluate(() => {
        const portail = document.querySelector("nextjs-portal");
        const racine = (portail as unknown as { shadowRoot?: ShadowRoot } | null)?.shadowRoot;
        const source = racine ?? portail;
        if (!source) return "";
        const copie = source.cloneNode(true) as ParentNode;
        copie.querySelectorAll("style, script").forEach((n) => n.remove());
        return (copie.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 400);
      })
      .catch(() => "");
    throw new Error(
      `${ou || "cet écran"} : la surcouche de développement de Next a gardé le focus sur ${portails} ` +
        `tabulation(s) et la traversée n'a trouvé AUCUN élément du produit. Ce n'est PAS un défaut ` +
        `d'accessibilité.\n  Ce que la surcouche affiche : ${texte || "(texte illisible — ouvre la page en `next dev`)"}`,
    );
  }
  return arrets;
}

const ecartsDAnneau = (arrets: Arret[]) =>
  arrets.filter(
    (a) =>
      !a.anneau.includes(ANNEAU.largeur) ||
      !a.anneau.includes(ANNEAU.style) ||
      !a.anneau.includes(ANNEAU.couleur),
  );

test.describe("La tabulation, avec de vraies frappes", () => {
  // ⚠️ CE CANAL NE MESURE RIEN SOUS WEBKIT, ET CE N'EST PAS UN DÉFAUT DU PRODUIT. Safari n'amène
  // pas le focus sur les LIENS à la touche Tab tant que « Press Tab to highlight each item » n'est
  // pas coché dans ses réglages — comportement par défaut du système, pas propriété de la page.
  // Mesuré ici : zéro arrêt sur `/memoire`, `/mes-donnees`, `/abonnement` et `/aide`, qui n'ont que
  // des liens. En tirer « l'écran est inatteignable au clavier » serait faux, et c'est exactement
  // le genre de conclusion qu'une mesure de navigateur invite à écrire.
  test.skip(
    ({ browserName }) => browserName === "webkit",
    "Safari n'inclut pas les liens dans l'ordre de tabulation par défaut : la traversée y est inobservable.",
  );

  test("l'entrée — chaque arrêt peint le MÊME anneau", async ({ page }) => {
    await page.goto("/entrer");
    const arrets = await traverser(page);

    expect(arrets.length, "aucun arrêt de tabulation : l'écran est inatteignable au clavier").toBeGreaterThan(2);
    const ecarts = ecartsDAnneau(arrets);
    expect(
      ecarts,
      `anneaux peints hors charte :\n${ecarts.map((a) => `${a.balise}[${a.nom}] → ${a.anneau} / ${a.decalage}`).join("\n")}`,
    ).toEqual([]);
  });

  test("[LE RISQUE SIGNALÉ] l'anneau est peint DEHORS, jamais collé au bord", async ({ page }) => {
    // Le tour de QA 2 l'a nommé avant qu'il n'arrive : `--bordure-forte` sur l'accent donnerait
    // 2,28:1 (palette Soft Balance ; 2,39 avant elle), sous le seuil. Ça ne se produit pas parce
    // que le décalage dessine l'anneau sur le fond de page, où il tient à 4,71:1. Une garde de source interdit déjà `outline-offset: 0` ;
    // celle-ci vérifie ce que le navigateur CALCULE, cascade comprise.
    await page.goto("/entrer");
    const arrets = await traverser(page);
    const colles = arrets.filter((a) => a.decalage === "0px");
    expect(
      colles,
      `anneaux collés au bord :\n${colles.map((a) => `${a.balise}[${a.nom}]`).join("\n")}`,
    ).toEqual([]);
  });

  test("les écrans du compte — anneau unique, et aucun piège à focus", async ({ page }) => {
    await ouvrirUnCompteNeuf(page);

    const fautifs: string[] = [];
    for (const chemin of ["/memoire", "/reglages", "/mes-donnees", "/abonnement", "/aide"]) {
      await page.goto(chemin);
      await attendreLeProduit(page);
      const arrets = await traverser(page, 40, chemin);

      // ⚠️ UN PIÈGE À FOCUS SE RECONNAÎT À CECI : la traversée atteint le plafond sans jamais
      // boucler, parce qu'on retombe indéfiniment sur les mêmes éléments sous d'autres noms. Un
      // écran de ce produit compte quelques poignées d'arrêts, jamais quarante.
      if (arrets.length >= 40) fautifs.push(`${chemin} → la tabulation ne boucle jamais (piège ?)`);
      if (arrets.length === 0) fautifs.push(`${chemin} → aucun arrêt : inatteignable au clavier`);
      for (const e of ecartsDAnneau(arrets)) {
        fautifs.push(`${chemin} → ${e.balise}[${e.nom}] peint ${e.anneau}`);
      }
    }
    expect(fautifs, fautifs.join("\n")).toEqual([]);
  });

  test("[FR-077] sur une halte, « Aide » est le DERNIER arrêt", async ({ page }) => {
    // La porte de secours ne cède sa place à rien, et rien ne se glisse après elle — c'est écrit
    // dans l'en-tête de `render/PiedHalte.tsx`, et ça n'avait jamais été vérifié en traversant.
    // Quelqu'un qui ne va pas bien et qui cherche au clavier finit toujours par la trouver.
    await ouvrirUnCompteNeuf(page);

    const fautifs: string[] = [];
    for (const chemin of ["/memoire", "/reglages", "/mes-donnees", "/abonnement"]) {
      await page.goto(chemin);
      await attendreLeProduit(page);
      const arrets = await traverser(page, 40, chemin);
      const dernier = arrets[arrets.length - 1];
      if (!/aide/i.test(dernier?.nom ?? "")) {
        fautifs.push(`${chemin} → dernier arrêt : ${dernier?.balise}[${dernier?.nom}]`);
      }
    }
    expect(fautifs, `« Aide » n'est plus le dernier arrêt :\n${fautifs.join("\n")}`).toEqual([]);
  });
});

test("[7.12] la sortie rapide de /aide quitte VRAIMENT le site, et n'y ramène pas", async ({ page, context }) => {
  /**
   * ⚠️ CE BOUTON A DÉJÀ ÉTÉ LIVRÉ AFFICHÉ ET INERTE. Le 2026-08-18, `/aide` était pré-rendue au
   * build : 16 balises `<script>`, 0 noncées, 16 refusées par la CSP, React jamais hydraté. La
   * sortie de secours — sur la page qu'on atteint en détresse — était là et ne faisait RIEN.
   *
   * Aucun test du dépôt ne le CLIQUAIT : les gardes lisaient la source, où tout était juste. Un
   * contrôle de sécurité qu'on n'a jamais actionné n'est pas un contrôle de sécurité.
   */
  await page.goto("/aide");
  await expect(page.getByRole("link", { name: /retour/i }), "témoin : la page n'est pas rendue").toBeVisible();

  // ⚠️ LE NOM ACCESSIBLE A CHANGÉ LE 2026-08-26, PAS LE BOUTON. `app/aide/SortieRapide.tsx:74`
  // porte `aria-label="Sortie rapide : quitter Anima et ouvrir un site neutre"` depuis `60d88da`
  // (avant : « Quitter ce site et aller sur un site neutre »). Ce test cherchait encore l'ancien
  // et rougissait depuis — le seul échec du passage qui disait VRAIMENT quelque chose, parce qu'il
  // meurt sur une assertion et non sur une action.
  //
  // ⚠️ ON NE RENOMME PAS LE PRODUIT POUR VERDIR LE TEST : `app/aide/SortieRapide.tsx:20-22` place
  // toute modification de ce contrôle derrière une revue pré-lancement (professionnel qualifié +
  // juriste), et `tests/aide-route.test.ts:118` interdit explicitement le retour à « Quitter ».
  const bouton = page.getByRole("button", { name: /sortie rapide/i });
  await expect(bouton, "la sortie rapide n'est pas là").toBeVisible();

  // On reste sur l'onglet : `location.replace` navigue dans le MÊME contexte, et c'est tout
  // l'intérêt — l'entrée d'historique de `/aide` doit être écrasée, pas empilée.
  const avant = page.url();
  await bouton.click();
  await page.waitForURL((u) => new URL(u.toString()).origin !== new URL(avant).origin, { timeout: 20_000 });

  const apres = new URL(page.url());
  expect(apres.origin, "on n'a pas quitté l'origine d'Anima").not.toBe(new URL(avant).origin);

  // ⚠️ LA MOITIÉ QUI COMPTE : le « précédent » ne ramène PAS sur /aide. C'est ce qui protège
  // quelqu'un qui lit ces ressources avec un tiers dangereux derrière l'épaule.
  await page.goBack();
  await page.waitForTimeout(800);
  expect(page.url(), "le retour arrière ramène sur /aide — l'historique n'a pas été écrasé").not.toContain("/aide");
  void context;
});

test("[7.12] l'en-tête de /aide : « Retour » d'abord, la sortie du site ensuite", async ({ page }) => {
  // Deux contrôles côte à côte disent tous les deux « partir », et sous stress la confusion se
  // reforme. La séparation est de FORME autant que de mot — et l'ordre de tabulation en fait
  // partie : on rencontre d'abord celui qui ramène dans Anima.
  await page.goto("/aide");
  const arrets = await traverser(page, 8);
  const noms = arrets.map((a) => (a.nom ?? "").toLowerCase());
  const iRetour = noms.findIndex((n) => n.includes("retour"));
  const iQuitter = noms.findIndex((n) => n.includes("quitter"));
  expect(iRetour, "« Retour » n'est atteignable au clavier").toBeGreaterThan(-1);
  expect(iQuitter, "la sortie rapide n'est pas atteignable au clavier").toBeGreaterThan(-1);
  expect(iRetour, "la sortie du site vient AVANT le retour").toBeLessThan(iQuitter);
});
