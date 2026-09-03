import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { couleursNuit } from "@/app/styles/tokens";

/**
 * manifeste-couleurs.test.ts — LE MANIFESTE PWA DIT LA MÊME COULEUR QUE L'APPLICATION (QA tour 2).
 *
 * ══ CE QUI ÉTAIT EN JEU ═════════════════════════════════════════════════════════════════════════
 *
 * `manifest.webmanifest` déclarait `background_color` et `theme_color` à `#201C42`. Ce n'est pas une
 * couleur inventée : c'est `--surface-elevee`, le jeton des surfaces posées AU-DESSUS du fond. Le
 * fond, lui, est `--fond` = `#0C0A1E`.
 *
 * Conséquence, et elle ne se voit qu'une fois l'application installée : l'écran de démarrage que
 * peint le système est d'un violet plus clair que l'application, puis saute vers la nuit au premier
 * rendu. Sur un produit dont toute l'intention est une scène continue, l'installation commençait par
 * une rupture.
 *
 * Et `theme-color` n'existait NULLE PART dans le document — mesuré à 0 occurrence. La barre du
 * système restait à la couleur par défaut du navigateur, en bordure d'une nuit.
 *
 * ══ POURQUOI CE TEST LIT LE JETON PLUTÔT QUE D'ÉCRIRE LA COULEUR ════════════════════════════════
 *
 * Écrire `expect(...).toBe("#0C0A1E")` ferait une TROISIÈME copie de la même valeur, et c'est
 * exactement ainsi que la deuxième a divergé. Le test lit `--fond` dans `globals.css` — la source —
 * et exige que le manifeste et le `viewport` la citent. Changer le fond de l'application sans
 * changer le manifeste casse la CI ; les changer ensemble passe.
 */

const racine = process.cwd();
const lire = (p: string) => readFileSync(resolve(racine, p), "utf-8");

/** La valeur de `--fond` dans le `:root` de base — le mode nuit, celui du produit. */
function fondDeLApplication(): string {
  const css = lire("app/styles/globals.css");
  const debutRoot = css.indexOf(":root {");
  expect(debutRoot, "le `:root` de base a disparu de globals.css").toBeGreaterThan(-1);
  const bloc = css.slice(debutRoot, css.indexOf("}", debutRoot));
  const m = bloc.match(/--fond:\s*(#[0-9A-Fa-f]{6})/);
  expect(m, "`--fond` doit être déclaré dans le `:root` de base").not.toBeNull();
  return m![1].toUpperCase();
}

describe("[QA tour 2] le système peint la même nuit que l'application", () => {
  it("`background_color` et `theme_color` du manifeste valent `--fond`", () => {
    const fond = fondDeLApplication();
    const manifeste = JSON.parse(lire("public/manifest.webmanifest")) as Record<string, string>;

    expect(
      manifeste.background_color?.toUpperCase(),
      "c'est la couleur de l'écran de démarrage : un écart se voit à chaque ouverture de la PWA",
    ).toBe(fond);
    expect(manifeste.theme_color?.toUpperCase()).toBe(fond);
  });

  it("le document déclare une `themeColor`, et elle LIT le jeton au lieu de le recopier", () => {
    // ⚠️ MUTATION-CIBLE : la retirer. Le mutant ne casserait rien de visible en développement — la
    // barre du système n'existe qu'installée. C'est un défaut DORMANT, la troisième famille.
    //
    // ⚠️ ET LA FORME A CHANGÉ LE 2026-09-03 (« toutes les couleurs dans des fichiers de design
    // qu'il suffit de modifier »). La valeur était `"#1C2740"` écrite à la main, et ce test
    // vérifiait qu'elle ÉGALAIT `--fond` : une copie surveillée reste une copie, et la surveillance
    // ne survit qu'aussi longtemps que le test. Elle est désormais LUE dans `tokens.ts`, donc juste
    // par construction — et ce qui se garde n'est plus l'égalité, c'est l'absence de copie.
    const layout = lire("app/layout.tsx");
    expect(layout, "`viewport.themeColor` doit exister — il n'y en avait aucune").toContain(
      "themeColor: couleursNuit.fond",
    );
    expect(layout, "une couleur écrite à la main est revenue").not.toMatch(/themeColor:\s*"#/);
    // Le jeton lu est bien celui que la feuille de design déclare : `tokens.ts` et `globals.css`
    // sont tenus ensemble par `tests/tokens-parite.test.ts`, et cette ligne ferme la boucle.
    expect(couleursNuit.fond.toUpperCase()).toBe(fondDeLApplication());
  });

  it("⚠️ et ce n'est PAS `--surface-elevee` qu'on recopie", () => {
    // La valeur fautive était `#201C42`, qui est un vrai jeton du produit. Ce test nomme le piège :
    // les deux sont des couleurs légitimes, et rien ne distinguait la bonne de la mauvaise à l'œil.
    const css = lire("app/styles/globals.css");
    const bloc = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
    const elevee = bloc.match(/--surface-elevee:\s*(#[0-9A-Fa-f]{6})/)?.[1].toUpperCase();
    expect(elevee, "`--surface-elevee` doit exister pour que ce test veuille dire quelque chose").
      toBeDefined();
    const manifeste = JSON.parse(lire("public/manifest.webmanifest")) as Record<string, string>;
    expect(manifeste.background_color?.toUpperCase()).not.toBe(elevee);
  });
});
