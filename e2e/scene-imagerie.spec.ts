import { test, expect, type Page } from "@playwright/test";
import { ouvrirUnCompteNeuf, passerLeTour } from "./_entrer";

/**
 * scene-imagerie.spec.ts — CE QUE L'ARRIÈRE-PLAN PEINT VRAIMENT, RÉGION PAR RÉGION
 *
 * ══ POURQUOI CE FICHIER ═══════════════════════════════════════════════════════════════════════
 *
 * Deux défauts nés du même endroit, et aucun des 5 037 tests Vitest ne pouvait les voir : ils
 * montent des composants en mémoire, jamais une CASCADE.
 *
 *  • B4 (QA visuelle du 2026-08-19) — « un artefact clair traverse l'interstice entre deux cartes ».
 *    L'accueil est une pile de cartes opaques qui défile, posée sur une scène qui ne défile pas :
 *    les 16 px entre deux cartes forment une fente mobile sur un feuillage bleu pâle.
 *  • Le jeton `--imagerie-opacite` était MORT sur le décor de l'arbre. `imagerie` et `fondu-image`
 *    vivaient sur le même élément ; une animation `fill: both` l'emporte sur une déclaration et
 *    pinçait l'opacité à 1 pour toujours. En contraste renforcé, la lune et les étoiles
 *    disparaissaient (`display: none`) et l'arbre restait. La règle était écrite, elle ne
 *    s'appliquait pas — le genre de défaut qu'une relecture de source ne trouve jamais, parce
 *    que chacune des deux lignes est juste.
 *
 * ⚠️ CE QUI SE MESURE ICI EST CONCLUSIF, ET C'EST VOULU. `opacity: 0` ne veut pas dire « peu
 * visible » : le navigateur ne peint RIEN. Une opacité effective nulle prouve donc l'absence de
 * l'artefact, sans avoir à échantillonner un pixel. Et on multiplie les opacités de toute la
 * chaîne d'ancêtres : gouverner le parent et laisser l'enfant à 1 serait une garde à moitié
 * aveugle, alors que c'est justement la séparation parent/enfant qui corrige le défaut.
 */

/** L'opacité EFFECTIVE du décor : le produit de toute la chaîne, du canevas jusqu'à la scène. */
async function opaciteEffectiveArbre(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const conteneur = document.querySelector('[class*="arbreMonde"]');
    if (!conteneur) return null;
    let o = 1;
    for (let n: Element | null = conteneur.querySelector("canvas") ?? conteneur; n; n = n.parentElement) {
      o *= Number(getComputedStyle(n).opacity);
      if (n.tagName === "MAIN") break;
    }
    return o;
  });
}

/** Attendre que le fondu de région (--duree-longue) soit retombé avant de mesurer. */
const laisserRetomber = (page: Page) => page.waitForTimeout(1500);

test.describe("Le décor de l'arbre", () => {
  test("[B4] derrière l'accueil, il ne peint RIEN — la fente entre deux cartes ne montre que le ciel", async ({
    page,
  }) => {
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await laisserRetomber(page);
    await page.getByRole("button", { name: /commencer/i }).click();
    await passerLeTour(page);
    await laisserRetomber(page);

    // La région d'accueil est bien celle qui est active — sans quoi la mesure ne dirait rien.
    await expect(page.getByRole("heading", { name: /^Aujourd’hui$/, level: 1 })).toBeVisible();

    expect(
      await opaciteEffectiveArbre(page),
      "le feuillage repasse dans l'interstice entre les cartes",
    ).toBe(0);
  });

  test("au seuil, il CÈDE LA PLACE à l'avatar — retiré, pas supprimé : la scène n'a pas perdu son arbre", async ({
    page,
  }) => {
    // ⚠️ SANS CE TEST, « supprimer l'arbre partout » passerait pour une correction de B4.
    //
    // Jusqu'au 2026-09-02, ce test exigeait l'arbre PEINT au seuil (opacité > 0,9) : il en était
    // l'image. Depuis, l'image de l'entrée est l'avatar d'Anam (`render/seuil/`), et l'arbre se
    // retire du seuil par le MÊME jeton que derrière Moi et Anam — deux illustrations empilées sur
    // un tiers d'écran, c'était le défaut mesuré le 2026-08-19. Le témoin change donc de forme :
    // l'opacité effective vaut 0 ici, ET le canevas est toujours monté et peint dans son tampon.
    // C'est ce qui distingue « retiré » (le jeton) de « supprimé » (plus de canevas, plus d'encre).
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await laisserRetomber(page);

    const o = await opaciteEffectiveArbre(page);
    expect(o, "le décor a disparu de la scène entière").not.toBeNull();
    expect(o!, "l'arbre s'empile derrière l'avatar : deux illustrations sur un tiers d'écran").toBe(0);

    const encreDu = () =>
      page.evaluate(() => {
        const c = document.querySelector('[class*="arbreMonde"] canvas') as HTMLCanvasElement | null;
        if (!c) return 0;
        const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
        return n;
      });
    await expect
      .poll(encreDu, { timeout: 15_000, message: "le canevas de l'arbre est vide : il a été supprimé, pas retiré" })
      .toBeGreaterThan(10_000);
  });

  test("derrière Anam, l'arbre ne peint RIEN — la conversation garde seulement le ciel", async ({
    page,
  }) => {
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await laisserRetomber(page);
    await page.getByRole("button", { name: /commencer/i }).click();
    await passerLeTour(page);
    await page.getByRole("button", { name: "Anam", exact: true }).click();
    await laisserRetomber(page);

    await expect(page.getByRole("heading", { name: "Anam", exact: true, level: 1 })).toBeVisible();
    expect(await opaciteEffectiveArbre(page), "le feuillage reste visible derrière la conversation").toBe(0);
  });

  test("[LE JETON MORT] en contraste renforcé, l'imagerie cède aux aplats — l'arbre compris", async ({
    page,
  }) => {
    // On passe par la MÉDIA-REQUÊTE, pas par un attribut posé à la main : c'est le chemin qu'une
    // vraie personne emprunte (réglage du système), et le seul des deux qui soit branché.
    await page.emulateMedia({ contrast: "more" });
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await laisserRetomber(page);

    const jeton = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--imagerie-opacite").trim(),
    );
    expect(jeton, "la média-requête de contraste n'a pas pris : la mesure qui suit ne prouverait rien").toBe("0");

    expect(
      await opaciteEffectiveArbre(page),
      "le jeton vaut 0 et l'arbre est peint quand même : la règle est écrite mais ne s'applique pas",
    ).toBe(0);
  });
});
