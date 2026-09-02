import { test, expect, type Page } from "@playwright/test";
import { ouvrirUnCompteNeuf, passerLeTour } from "./_entrer";

/**
 * seuil.spec.ts — L'ÉCRAN D'ENTRÉE, MESURÉ (QA manuelle du 2026-08-19)
 *
 * ══ CE QUI A ÉTÉ RAPPORTÉ, ET CE QU'ON A TROUVÉ EN MESURANT ═══════════════════════════════════
 *
 * « je ne comprends pas ce que ça fait là, il y a deux mauvaises images, le texte est trop bas,
 * ce n'est pas fluide ». Quatre phrases, cinq défauts distincts, et aucun des 5 070 tests Vitest
 * ne pouvait en voir un seul : ils montent des composants en mémoire, jamais une composition.
 *
 *   1. LE SEUIL ÉTAIT RENDU À CHAQUE CHARGEMENT. Une porte devant une porte ouverte : la barre
 *      offrait les trois destinations juste sous le bouton censé y mener.
 *   2. DEUX IMAGES EMPILÉES. Décor de l'arbre à (55, 250)–(336, 422), personnage à (0, 329)–
 *      (226, 624) : 93 px de recouvrement, et le titre, la phrase et la porte À L'INTÉRIEUR de la
 *      boîte du personnage — c'est-à-dire sur son visage.
 *   3. 174 PX DE VIDE en haut (26 % de l'écran), le texte collé au plancher.
 *   4. L'ARBRE ÉTAIT COUPÉ PAR SON PROPRE CANEVAS, sur ses quatre bords : 1 514 pixels peints sur
 *      la ligne 0. La cime finissait par une arête horizontale franche.
 *   5. LE FONDU DE RÉGION SUPERPOSAIT DEUX TEXTES pendant un tiers de seconde (deux opacités à
 *      ~0,5 au même instant).
 *
 * ══ ET DEPUIS LE 2026-09-02, L'IMAGE DE L'ENTRÉE EST L'AVATAR D'ANAM ══════════════════════════════
 *
 * Retour du fondateur : « mets plutôt l'avatar d'Anam, qui se remplit d'étoiles ». L'asset a été
 * refait DÉTOURÉ (`public/scene/seuil/`, alpha à la source), ce qui lève le motif du point 2 ; et
 * l'arbre se retire du seuil au lieu de s'empiler derrière — deux illustrations empilées, c'était
 * exactement le point 2. Les gardes de composition mesurent donc désormais la boîte de l'AVATAR
 * (sa toile `[data-remplissage-etoiles]`, qui a la même boîte que son image), et la garde « une
 * seule image » compte UNE image — celle-là — et vérifie qu'elle est bien la détourée.
 *
 * ⚠️ CE FICHIER MESURE DES BOÎTES *ET* DES PIXELS, ET LES DEUX SONT NÉCESSAIRES. Le recouvrement
 * est un défaut de MISE EN PAGE — des rectangles suffisent, et c'est le bon outil. Le rognage de
 * la cime, lui, ne déplace aucune boîte : le canevas a exactement la même taille coupé ou entier.
 * Seuls les pixels le disent. Choisir un seul des deux outils laissait la moitié des défauts
 * invisibles.
 */

/** Les boîtes de la scène au seuil, telles que le navigateur les a calculées. */
async function composition(page: Page) {
  return page.evaluate(() => {
    const boite = (e: Element | null) =>
      e ? (({ top, bottom, left, right }) => ({ top, bottom, left, right }))(e.getBoundingClientRect()) : null;
    const seuil = document.querySelector('section[aria-label="Seuil"]')!;
    return {
      hauteur: innerHeight,
      // La toile du remplissage a EXACTEMENT la boîte de l'image (`render/seuil/avatar-seuil.module.css`) :
      // c'est elle qu'on mesure, parce qu'elle est là dès le montage, image décodée ou non.
      avatar: boite(seuil.querySelector("[data-remplissage-etoiles]")),
      textes: [...seuil.querySelectorAll("h1, p, button")].map((e) => ({
        quoi: `${e.tagName.toLowerCase()}[${(e.textContent ?? "").trim().slice(0, 24)}]`,
        ...boite(e)!,
      })),
      images: seuil.querySelectorAll("img").length,
      toiles: seuil.querySelectorAll("[data-remplissage-etoiles]").length,
      sources: [...seuil.querySelectorAll("img")].map((i) => (i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src),
      barre: !!document.querySelector("nav[aria-label='Régions']"),
    };
  });
}

test.describe("Le seuil", () => {
  test("[UNE COMPOSITION] l'avatar ne touche aucun mot, et la porte est à l'écran", async ({ page }) => {
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Anam", exact: true })).toBeVisible();
    await page.waitForTimeout(1500);

    const c = await composition(page);
    expect(c.avatar, "l'avatar a disparu du seuil : la mesure qui suit ne prouverait rien").not.toBeNull();
    expect(c.avatar!.bottom - c.avatar!.top, "témoin : la boîte de l'avatar est plate, rien n'est mesuré").toBeGreaterThan(100);

    // ⚠️ ON MESURE LA BOÎTE DE LA TOILE, PAS L'ENCRE. C'est la boîte de l'image entière — plus
    // large que la silhouette peinte : la garde est donc plus stricte que l'œil, et c'est voulu.
    // L'avatar est le premier enfant de la colonne ; le `row-gap` de `.seuil` est ce qui sépare.
    const collisions = c.textes.filter(
      (t) => t.top < c.avatar!.bottom && t.bottom > c.avatar!.top && t.left < c.avatar!.right && t.right > c.avatar!.left,
    );
    expect(
      collisions.map((t) => t.quoi),
      `du texte sur l'avatar :\n${collisions.map((t) => `${t.quoi} ${t.top}–${t.bottom} vs avatar ${c.avatar!.top}–${c.avatar!.bottom}`).join("\n")}`,
    ).toEqual([]);

    // Le titre vient APRÈS l'avatar, jamais avant : une composition, pas une superposition.
    const h1 = c.textes[0];
    expect(h1.top, "le titre passe au-dessus de l'avatar").toBeGreaterThan(c.avatar!.bottom);

    await expect(
      page.getByRole("button", { name: /commencer/i }),
      "la porte n'est pas à l'écran sans geste",
    ).toBeInViewport();

    // ⚠️ ÉCRAN COURT : LE CENTRAGE DEVIENT UN PIÈGE — MAIS PAS CELUI QUE J'AVAIS ÉCRIT.
    //
    // La première version de cette garde exigeait que le titre ne passe pas AU-DESSUS du haut de
    // la région. Un mutant l'a survécu, et il avait raison : la réserve du haut est si large que
    // le centrage mange dedans sans jamais la traverser. La propriété était vraie, elle n'était
    // simplement jamais menacée — c'est-à-dire qu'elle ne gardait rien.
    //
    // Ce qui est RÉELLEMENT en jeu, c'est ce que cette réserve protège : l'entête ne doit pas
    // glisser sous la surimpression persistante (revue 1.8, trouvaille [8]). À 300 px de haut —
    // un zoom 200 % sur un téléphone, dans le plancher d'accessibilité (WCAG 1.4.10) — la colonne
    // déborde, et un `center` non-`safe` la remonte de 27 px SOUS « Aide ». `safe center` retombe
    // sur `start` dès qu'il y a débordement : le titre reste dégagé, et le reste défile.
    const l = page.viewportSize()!.width;
    await page.setViewportSize({ width: l, height: 300 });
    await page.waitForTimeout(700);
    const court = await page.evaluate(() => {
      const r = document.querySelector('section[aria-label="Seuil"]') as HTMLElement;
      r.scrollTop = 0;
      const h1 = r.querySelector("h1")!.getBoundingClientRect();
      const sur = document.querySelector("header, [class*='surimpression']")!.getBoundingClientRect();
      return { debord: r.scrollHeight - r.clientHeight, haut: Math.round(h1.top), surBas: Math.round(sur.bottom) };
    });
    expect(court.debord, "témoin : rien ne déborde à 300 px, le centrage n'est pas mis à l'épreuve").toBeGreaterThan(0);
    expect(
      court.haut,
      `le titre est peint à ${court.haut} px, sous une surimpression qui descend à ${court.surBas} : ` +
        "un centrage a mangé la réserve, et le défilement remonté à zéro ne le dégage pas",
    ).toBeGreaterThanOrEqual(court.surBas);
  });

  test("[UNE SEULE IMAGE, DÉTOURÉE] le seuil composite UN bitmap — l'avatar, avec son alpha — et UNE toile", async ({
    page,
  }) => {
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Anam", exact: true })).toBeVisible();

    const c = await composition(page);
    // ⚠️ « UNE » ET PAS « AU MOINS UNE ». Le 2026-08-19, il y en avait deux empilées (le décor et
    // le personnage) : c'est le compte exact qui garde la composition, pas la présence.
    expect(c.images, "le seuil n'a plus qu'une image, et c'est l'avatar").toBe(1);
    expect(c.toiles, "une seule couche de dessin : le remplissage est UN canvas").toBe(1);
    // Et c'est la DÉTOURÉE (`public/scene/seuil/`), jamais la peinture entière sans alpha qui vit
    // encore à la racine de `public/scene/` — si elle revenait, elle serait un rectangle (voir
    // tests/scene-sans-bords.test.ts).
    expect(c.sources[0], "l'image du seuil n'est pas l'asset détouré").toMatch(/\/scene\/seuil\/anam-seuil/);
  });

  test("[L'ARBRE EST ENTIER] aucun pixel peint ne touche le bord de son canevas", async ({ page }) => {
    // ⚠️ CETTE GARDE-CI NE PEUT PAS ÊTRE GÉOMÉTRIQUE. Un dessin rogné et un dessin entier occupent
    // exactement le même canevas, aux mêmes coordonnées : aucune boîte ne les distingue. On relit
    // donc le bitmap. De l'encre sur la première ligne, c'est une arête franche sur le décor de la
    // scène — et sur une scène qui se dit « sans bords » (AD-7, AC1). Depuis le 2026-09-02 l'arbre
    // n'est plus l'image de l'entrée (il s'y retire, l'avatar la tient) ; il reste monté et peint
    // dans son tampon, et cette garde le relit tel quel.
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    // ⚠️ ON ATTEND L'ENCRE, PAS UNE DURÉE. Un `waitForTimeout` fixe suffit sur une machine au
    // repos et rate le dessin quand la suite entière tourne devant : la garde rougissait alors
    // sur son propre TÉMOIN (« le canevas est vide »), c'est-à-dire sur rien.
    const encreDu = () =>
      page.evaluate(() => {
        const c = document.querySelector('[class*="arbreMonde"] canvas') as HTMLCanvasElement | null;
        if (!c) return 0;
        const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
        return n;
      });
    await expect.poll(encreDu, { timeout: 15_000, message: "l'arbre n'est jamais dessiné" }).toBeGreaterThan(10_000);

    const bord = await page.evaluate(() => {
      const c = document.querySelector('[class*="arbreMonde"] canvas') as HTMLCanvasElement | null;
      if (!c) return null;
      const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      const alpha = (x: number, y: number) => d[(y * c.width + x) * 4 + 3];
      let touche = 0, encre = 0;
      let haut = c.height, bas = -1, gauche = c.width, droite = -1;
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++)
          if (alpha(x, y) > 8) {
            encre++;
            if (y < haut) haut = y;
            if (y > bas) bas = y;
            if (x < gauche) gauche = x;
            if (x > droite) droite = x;
            if (y === 0 || y === c.height - 1 || x === 0 || x === c.width - 1) touche++;
          }
      const marge = Math.min(haut, c.height - 1 - bas, gauche, c.width - 1 - droite);
      // La marge RAPPORTÉE à la taille du tampon : c'est la seule forme qui garde son sens quand
      // le tampon change de taille. Voir l'assertion plus bas.
      return { touche, encre, marge, part: marge / Math.min(c.width, c.height) };
    });
    expect(bord, "aucun canevas d'arbre à mesurer").not.toBeNull();
    expect(bord!.encre, "témoin : le canevas est vide, la mesure ne prouverait rien").toBeGreaterThan(10_000);
    expect(bord!.touche, "l'arbre est coupé par sa propre boîte : la cime finit par une arête").toBe(0);

    // ⚠️ ET IL NE DOIT PAS FRÔLER LE BORD — C'EST UNE PROPRIÉTÉ DISTINCTE, écrite ici parce que
    // « zéro pixel sur le bord » est satisfait par un ajustement au pixel près. Mesuré ainsi : le
    // premier cadrage exact posait l'encre à UN pixel du haut, et la moindre dérive du générateur
    // — un bouquet de plus, un halo plus large — recoupait la cime sans que rien ne rougisse. Un
    // dessin qui frôle sa boîte est un dessin coupé qui n'a pas encore eu lieu.
    //
    // ⚠️ LE SEUIL ÉTAIT EN PIXELS ABSOLUS, ET C'ÉTAIT LA MAUVAISE UNITÉ (corrigé le 2026-08-26).
    // Il exigeait `marge >= 8` — huit pixels DU TAMPON. Le 2026-08-26, le tampon du canevas a été
    // dimensionné à ce qui est réellement affiché (2816 → 416 px de large sur bureau) : la marge
    // absolue est passée à 4 px et la garde a rougi, alors que la marge RELATIVE avait DOUBLÉ
    // (0,57 % → 0,96 % du tampon). Le dessin était plus à l'abri qu'avant, et le test disait
    // l'inverse.
    //
    // Ce que cette garde protège n'a jamais été un nombre de pixels : c'est une PROPORTION de
    // réserve avant que la prochaine dérive du générateur ne coupe la cime. Un seuil absolu sur un
    // tampon dont la taille peut changer mesure la résolution, pas le cadrage.
    //
    // 0,5 % conserve exactement la protection d'avant (8/1408 = 0,57 %) sans dépendre de la taille.
    expect(
      bord!.part,
      `le dessin frôle sa boîte (${bord!.marge} px de marge sur un tampon de ${bord!.encre} pixels ` +
        `d'encre) : la prochaine dérive du générateur le coupera`,
    ).toBeGreaterThanOrEqual(0.005);
  });

  test("[LA PORTE N'A PAS DE CONTOURNEMENT] la barre n'apparaît qu'après le seuil", async ({ page }) => {
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Anam", exact: true })).toBeVisible();

    expect(
      (await composition(page)).barre,
      "les trois destinations sont offertes sous la porte : le rideau se contourne",
    ).toBe(false);

    await page.getByRole("button", { name: /commencer/i }).click();
    await passerLeTour(page);
    await expect(page.getByRole("heading", { name: /^Aujourd’hui$/, level: 1 })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Régions" }).getByRole("button"),
      "le doublage non-spatial doit reprendre dès qu'il y a quelque chose à doubler (UX-DR-37)",
    ).toHaveText(["Aujourd’hui", "Anam", "Mon arbre"]);
  });

  test("[UNE FOIS] franchi, le seuil ne se redresse plus devant personne", async ({ page }) => {
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await page.getByRole("button", { name: /commencer/i }).click();
    await passerLeTour(page);
    await expect(page.getByRole("heading", { name: /^Aujourd’hui$/, level: 1 })).toBeVisible();
    // La Server Action pose la date ; on lui laisse le temps de revenir avant de recharger.
    await page.waitForTimeout(1500);

    await page.reload();
    await expect(
      page.getByRole("heading", { name: /^Aujourd’hui$/, level: 1 }),
      "le monde ne s'ouvre pas sur l'accueil : la date n'a pas été posée, ou pas relue",
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /commencer/i }),
      "la porte se redresse devant quelqu'un qui l'a déjà franchie",
    ).toBeHidden();
  });

  test("[LE FONDU] jamais deux régions lisibles en même temps", async ({ page }) => {
    // ⚠️ « CE N'EST PAS FLUIDE » ÉTAIT MESURABLE. Les deux régions se fondaient sur la MÊME durée,
    // en même temps : à mi-parcours, les deux étaient à ~0,5, c'est-à-dire deux écrans de texte
    // superposés et lisibles l'un à travers l'autre. Un fondu croisé marche entre deux images ;
    // entre deux textes il fabrique du brouillage. On échantillonne à chaque trame et on exige
    // qu'à aucun instant les deux ne soient visibles ensemble.
    await ouvrirUnCompteNeuf(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Anam", exact: true })).toBeVisible();
    await page.waitForTimeout(1200);

    await page.evaluate(() => {
      const w = window as unknown as { __ech: number[][] };
      w.__ech = [];
      const a = document.querySelector('section[aria-label="Seuil"]')!;
      const b = document.querySelector('section[aria-label="Aujourd’hui"]')!;
      const tic = () => {
        w.__ech.push([Number(getComputedStyle(a).opacity), Number(getComputedStyle(b).opacity)]);
        if (w.__ech.length < 120) requestAnimationFrame(tic);
      };
      requestAnimationFrame(tic);
    });
    await page.getByRole("button", { name: /commencer/i }).click();
    await passerLeTour(page);
    await page.waitForTimeout(1600);

    const ech = await page.evaluate(() => (window as unknown as { __ech: number[][] }).__ech);
    expect(ech.length, "témoin : rien n'a été échantillonné").toBeGreaterThan(40);
    expect(
      Math.max(...ech.map(([a, b]) => Math.min(a, b))),
      "les deux régions ont été visibles ensemble : le fondu croisé superpose deux textes",
    ).toBeLessThan(0.1);
    // Et le témoin symétrique : le fondu a bien EU LIEU (sans quoi la garde ci-dessus est
    // satisfaite par un changement sec, qui n'est pas ce qu'on veut non plus).
    expect(
      ech.filter(([, b]) => b > 0.02 && b < 0.98).length,
      "aucune trame intermédiaire : le changement de région est devenu sec",
    ).toBeGreaterThan(3);
  });
});
