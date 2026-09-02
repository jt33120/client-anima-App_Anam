import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import GraineAttente from "@/render/arbre/GraineAttente";

/**
 * graine-attente.test.tsx — LA GRAINE BOUGE, MAIS DANS LA GRAMMAIRE DU PRODUIT.
 *
 * Le retour du fondateur : « la graine au début : la faire bouger/rebondir pour symboliser qu'elle
 * n'attend que d'éclore. Même animation que les lotus de chargement. » La charte, elle, dit
 * `rebond: 'interdit'` (DESIGN.md L139), « aucun rebond, aucun ressort, aucun overshoot » (L475) et
 * « rien ne rebondit » (globals.css L268). Les deux tiennent ensemble si — et seulement si — la
 * graine SE SOULÈVE au lieu de rebondir, avec le souffle exact du lotus. C'est ce que ces gardes
 * mesurent : pas la présence d'une animation, mais ses BORNES, ses TOKENS et ses PROPRIÉTÉS.
 *
 * Elles lisent la SOURCE de la feuille, comme lotus-et-arbre-vide.test.tsx : jsdom ne charge aucune
 * règle d'un module CSS, `getComputedStyle` y rend "" pour tout — une garde qui l'interrogerait ne
 * pourrait pas rougir (leçon d'arbre-cycle.test.tsx L80-83).
 */

const lire = (chemin: string) => readFileSync(resolve(process.cwd(), chemin), "utf-8");
const sansCommentaires = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "");

const FEUILLE = "render/arbre/graine-attente.module.css";
const CSS_BRUT = () => lire(FEUILLE);
const CSS = () => sansCommentaires(CSS_BRUT());
const TSX = () => lire("render/arbre/GraineAttente.tsx");
const LOTUS = () => sansCommentaires(lire("render/conversation/LotusAttente.module.css"));
const GLOBALS = () => sansCommentaires(lire("app/styles/globals.css"));

/** Le corps d'une `@keyframes`, accolades comptées — indépendant de la mise en forme du fichier. */
const keyframes = (src: string, nom: string): string => {
  const i = src.indexOf(`@keyframes ${nom}`);
  expect(i, `@keyframes ${nom} a disparu`).toBeGreaterThan(-1);
  const debut = src.indexOf("{", i);
  let profondeur = 0;
  for (let j = debut; j < src.length; j++) {
    if (src[j] === "{") profondeur++;
    if (src[j] === "}" && --profondeur === 0) return src.slice(debut + 1, j);
  }
  throw new Error(`@keyframes ${nom} n'est jamais refermée`);
};

/** Toutes les `@keyframes` de la feuille, nommées. */
const toutesLesKeyframes = (): { nom: string; corps: string }[] => {
  const src = CSS();
  return [...src.matchAll(/@keyframes\s+([A-Za-z]+)/g)].map((m) => ({ nom: m[1], corps: keyframes(src, m[1]) }));
};

/** Les blocs `sélecteur { corps }` de premier niveau AVANT le bloc reduced-motion. */
const blocsAnimes = (): { selecteur: string; corps: string }[] => {
  const src = CSS();
  const avant = src.slice(0, src.indexOf("@media (prefers-reduced-motion: reduce)"));
  return [...avant.matchAll(/(\.[A-Za-z]+)\s*\{([^{}]*)\}/g)]
    .map((m) => ({ selecteur: m[1], corps: m[2] }))
    .filter((b) => b.corps.includes("animation:"));
};

const monter = (className?: string) => {
  const { container } = render(<GraineAttente className={className} />);
  const svg = container.querySelector("[data-graine-attente]");
  expect(svg, "le crochet data-graine-attente a disparu").not.toBeNull();
  return svg as SVGSVGElement;
};

describe("[LA GRAINE] décorative, muette, accrochée", () => {
  it("[LE CŒUR] le SVG est décoratif (aria-hidden, focusable=false) et porte le crochet des tests", () => {
    // Le canevas voisin porte déjà `role="img"` et l'aria-label de l'étape (ArbreLunaire.tsx). Une
    // graine qui parlerait dirait l'étape deux fois ; une graine focusable ferait un arrêt de
    // tabulation sur du décor. Elle est muette, et c'est le crochet `data-` qui la rend trouvable.
    const svg = monter("essai");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.getAttribute("role"), "un rôle sur du décor : l'étape serait dite deux fois").toBeNull();
    expect(svg.getAttribute("tabindex")).toBeNull();
    expect(svg.classList.contains("essai"), "className n'est pas transmis").toBe(true);
    // Aucun texte : ni <text>, ni <title>, ni <desc> — rien qu'un lecteur d'écran pourrait lire.
    expect(svg.querySelector("text, title, desc, foreignObject")).toBeNull();
    expect(svg.textContent?.trim()).toBe("");
  });

  it("aucun style inline, nulle part dans le dessin", () => {
    // Le soulèvement et le souffle vivent dans la feuille ; un `style=` sur un élément serait un
    // second endroit où l'animation pourrait naître, hors de portée des gardes ci-dessous.
    const svg = monter();
    const avecStyle = [svg, ...svg.querySelectorAll("*")].filter((e) => e.hasAttribute("style"));
    expect(avecStyle.map((e) => e.tagName), "un style inline s'est glissé dans la graine").toEqual([]);
  });

  it("[ANTI-VACUITÉ] il y a bien une graine dedans — une ellipse, dans le corps, sous un halo", () => {
    // Sans ce témoin, un `<svg data-graine-attente aria-hidden />` vide passerait tout le describe.
    const svg = monter();
    expect(svg.getAttribute("viewBox"), "l'échelle du lotus (viewBox 48)").toBe("0 0 48 48");
    const corps = svg.querySelector('[class*="corps"]');
    expect(corps, "le groupe qui respire a disparu").not.toBeNull();
    expect(corps!.querySelectorAll("ellipse").length, "la graine est une ellipse, une seule").toBe(1);
    // Le halo est le FRÈRE du corps (sous le soulèvement), jamais son enfant : dedans, il fausserait
    // la boîte `fill-box` depuis laquelle la graine se dresse.
    const souleve = svg.querySelector('[class*="souleve"]');
    expect(souleve, "le groupe qui se soulève a disparu").not.toBeNull();
    expect(souleve!.querySelector(':scope > [class*="halo"]'), "le halo ne monte plus avec la graine").not.toBeNull();
    expect(corps!.querySelector('[class*="halo"]'), "le halo est entré dans le corps qui respire").toBeNull();
    // Sans className, la classe reste propre : ni « undefined », ni espace traînant.
    expect(svg.getAttribute("class")).toMatch(/^\S+$/);
  });

  it("les couleurs viennent des tokens de la palette gelée, jamais d'un hex en dur", () => {
    // La palette est gelée au hex près dans tests/arbre-lunaire.test.ts L29-38, et globals.css la
    // reflète en tokens (`--lueur`, `--arbre-tronc`, `--arbre-branche`). Un hex recopié ici serait
    // une seconde source de vérité — et resterait nacre en mode contraste renforcé, où tout le
    // reste de l'arbre devient bleu profond.
    const css = CSS();
    for (const token of ["--lueur", "--arbre-tronc", "--arbre-branche"]) {
      expect(css, `${token} n'habille plus la graine`).toContain(`var(${token})`);
    }
    expect(TSX(), "le trait ne passe plus par currentColor").toMatch(/stroke="currentColor"/);
    for (const [nom, src] of [["la feuille", css], ["le composant", sansCommentaires(TSX())]] as const) {
      expect(src, `un hex en dur dans ${nom}`).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
    // L'accent lotus est RÉSERVÉ au point d'accroche (arbre.module.css, en-tête) : pas sur la graine.
    expect(css).not.toContain("--accent");
  });
});

describe("[LE SOUFFLE] le même que le lotus, et rien qui rebondisse", () => {
  it("[LE CŒUR] la feuille n'anime QUE transform et opacity", () => {
    // Ce sont les deux seules propriétés composées sans mise en page ni re-peinture. `top`, `margin`,
    // `width` referaient la mise en page à chaque trame ; `filter` a déjà fait tomber la scène à
    // 4 images/seconde (lotus-et-arbre-vide.test.tsx, « LA FLUIDITÉ »).
    const blocs = toutesLesKeyframes();
    expect(blocs.length, "plus aucune @keyframes : la graine ne bouge plus").toBeGreaterThanOrEqual(3);
    const vues = new Set<string>();
    for (const { nom, corps } of blocs) {
      const proprietes = [...corps.matchAll(/(?:^|[{;\s])([a-z-]+)\s*:/g)].map((m) => m[1]);
      expect(proprietes.length, `@keyframes ${nom} ne déclare rien`).toBeGreaterThan(0);
      for (const p of proprietes) {
        expect(["transform", "opacity"], `@keyframes ${nom} anime \`${p}\``).toContain(p);
        vues.add(p);
      }
    }
    // [ANTI-VACUITÉ] les deux sont bien là : une feuille qui n'animerait que l'opacité passerait la
    // boucle ci-dessus sans que la graine se soulève jamais.
    expect([...vues].sort()).toEqual(["opacity", "transform"]);
  });

  it("[LE CŒUR] elle respire avec les MÊMES tokens que le lotus — courbe identique, durée de la charte", () => {
    // « Même animation que les lotus » : pas un dessin ressemblant, la même courbe et la même
    // lenteur. La courbe est un token local du lotus (`.lotus { --courbe-lotus }`) : on lit sa
    // valeur dans les DEUX feuilles et on exige l'égalité stricte. La durée est celle de la charte,
    // `--duree-respiration` (globals.css L74 ; DESIGN.md L137 : 4200 ms) — la durée du « seul
    // mouvement en boucle du produit » (globals.css L285).
    const courbe = (src: string) => /--courbe-lotus:\s*([^;]+);/.exec(src)?.[1].trim();
    expect(courbe(LOTUS()), "le lotus ne déclare plus --courbe-lotus : le témoin de parité est vide").toBeDefined();
    expect(courbe(CSS()), "la graine ne déclare plus --courbe-lotus").toBe(courbe(LOTUS()));

    const css = CSS();
    expect(css, "le cycle n'est plus la respiration de la charte").toMatch(/--cycle:\s*var\(--duree-respiration\)/);
    const duree = Number(/--duree-respiration:\s*(\d+)ms/.exec(GLOBALS())?.[1]);
    expect(duree, "globals.css ne définit plus --duree-respiration").toBe(4200);

    // Chaque animation passe par ces deux tokens : aucune durée en clair, aucune autre courbe.
    const animations = [...css.matchAll(/animation:\s*([^;]+);/g)].map((m) => m[1].trim()).filter((a) => !a.startsWith("none"));
    expect(animations.length, "plus aucune animation déclarée").toBeGreaterThanOrEqual(3);
    for (const a of animations) {
      expect(a, `durée hors token : ${a}`).toMatch(/var\(--cycle\)/);
      expect(a, `courbe hors token : ${a}`).toMatch(/var\(--courbe-lotus\)/);
      expect(a, `durée en clair : ${a}`).not.toMatch(/\d+m?s\b/);
      expect(a, `courbe étrangère : ${a}`).not.toMatch(/\bease|linear|steps\(|cubic-bezier/);
    }

    // Et la même LENTEUR que le lotus : 4200 ms tient entre ses deux cycles (4000 et 5200), et
    // au-dessus du plancher de 3000 ms sous lequel lotus-et-arbre-vide.test.tsx parle de battement.
    const cyclesLotus = [...LOTUS().matchAll(/--cycle:\s*(\d+)ms/g)].map((m) => Number(m[1]));
    expect(cyclesLotus.length).toBeGreaterThan(0);
    expect(duree).toBeGreaterThanOrEqual(Math.min(...cyclesLotus));
    expect(duree).toBeLessThanOrEqual(Math.max(...cyclesLotus));
    expect(duree).toBeGreaterThanOrEqual(3000);
  });

  it("[LE CŒUR] aucun overshoot : l'échelle reste dans [0,97 ; 1,03], la translation dans [−4 ; 0,5]", () => {
    // C'est ICI que « rebondir » devient « se soulever ». Un ressort passe au-delà de sa cible avant
    // de revenir ; une graine qui se dresse monte, redescend, effleure d'une demi-unité, se pose. Les
    // bornes sont celles du brief : souffle ±2,5 pour cent (le lotus : 0,975 → 1,025), montée de 2 à 3,
    // micro-retombée d'un demi.
    const blocs = toutesLesKeyframes();
    const tout = blocs.map((b) => b.corps).join("\n");

    const echelles = [...tout.matchAll(/scale\(([\d.]+)\)/g)].map((m) => Number(m[1]));
    expect(echelles.length, "la graine ne respire plus").toBeGreaterThan(0);
    for (const e of echelles) {
      expect(e, `scale(${e}) : c'est une pulsation, pas un souffle`).toBeGreaterThanOrEqual(0.97);
      expect(e, `scale(${e}) : c'est une pulsation, pas un souffle`).toBeLessThanOrEqual(1.03);
    }
    // [ANTI-VACUITÉ] elle respire VRAIMENT : au moins une échelle sous 1 et une au-dessus.
    expect(Math.min(...echelles)).toBeLessThan(1);
    expect(Math.max(...echelles)).toBeGreaterThan(1);

    const translations = [...tout.matchAll(/translateY\((-?[\d.]+)(?:px)?\)/g)].map((m) => Number(m[1]));
    expect(translations.length, "la graine ne se soulève plus").toBeGreaterThan(0);
    for (const t of translations) {
      expect(t, `translateY(${t}px) : elle saute au lieu de se soulever`).toBeGreaterThanOrEqual(-4);
      expect(t, `translateY(${t}px) : elle s'enfonce, ce n'est plus une micro-retombée`).toBeLessThanOrEqual(0.5);
    }
    // [ANTI-VACUITÉ] elle monte (au moins −2) ET elle retombe d'un rien (une valeur > 0) : c'est le
    // geste du fondateur, pas une graine immobile qui passerait toutes les bornes.
    expect(Math.min(...translations), "la montée n'est plus perceptible").toBeLessThanOrEqual(-2);
    expect(Math.max(...translations), "la micro-retombée a disparu").toBeGreaterThan(0);

    // Rien d'autre ne bouge : ni de côté, ni en rotation, ni en cisaillement.
    expect(tout).not.toMatch(/translateX|translate\(|rotate|skew|matrix/);
    // Et la courbe elle-même ne dépasse pas : ses ordonnées de contrôle restent dans [0, 1]. Une
    // `cubic-bezier(.5, 1.6, …)` fait un ressort quelles que soient les valeurs des keyframes.
    const controle = /--courbe-lotus:\s*cubic-bezier\(([^)]+)\)/.exec(CSS())?.[1].split(",").map(Number);
    expect(controle, "la courbe n'est plus une cubic-bezier lisible").toHaveLength(4);
    for (const y of [controle![1], controle![3]]) {
      expect(y, `ordonnée de contrôle ${y} : la courbe rebondit`).toBeGreaterThanOrEqual(0);
      expect(y, `ordonnée de contrôle ${y} : la courbe rebondit`).toBeLessThanOrEqual(1);
    }
    expect(CSS()).not.toMatch(/bounce|elastic|spring|steps\(/i);
  });

  it("deux éléments imbriqués, pas `animation-composition` (iOS 15), et la graine se dresse depuis sa base", () => {
    // Deux transforms sur un même élément s'écrasent ; les composer demande `animation-composition:
    // add`, qu'iOS 15 ignore — la graine y resterait figée sur l'un des deux. Le wrapper marche partout.
    const css = CSS();
    expect(css).not.toMatch(/animation-composition/);
    const animes = Object.fromEntries(
      blocsAnimes().map((b) => [b.selecteur, /animation:\s*([A-Za-z]+)\s+([^\s]+(?:\s*\*\s*\d+\))?)/.exec(b.corps)]),
    );
    expect(animes[".souleve"]?.[1], "le soulèvement n'est plus sur .souleve").toBe("graineSoulevement");
    expect(animes[".corps"]?.[1], "le souffle n'est plus sur .corps").toBe("graineSouffle");
    expect(animes[".halo"]?.[1], "le halo ne s'anime plus").toBe("graineHalo");
    // Le cycle du soulèvement est DOUBLÉ : un souffle pour monter, un pour se poser.
    expect(animes[".souleve"]?.[2]).toMatch(/calc\(var\(--cycle\)\s*\*\s*2\)/);
    // Origine : le milieu du BAS de sa propre boîte — elle se dresse, elle ne gonfle pas du centre.
    const corps = /\.corps\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(corps).toMatch(/transform-box:\s*fill-box/);
    expect(corps).toMatch(/transform-origin:\s*50%\s+100%/);
  });

  it("[LE CŒUR] aucune promotion de couche forcée dans la feuille", () => {
    // Le dépôt n'en tolère qu'une (monde.module.css L216-220, sur quatre-vingts étoiles, et relâchée
    // sous reduced-motion). Une graine seule n'en a pas besoin : `transform` et `opacity` sont déjà
    // composés sur leur couche. On lit le fichier BRUT, commentaires compris : le mot n'a rien à y
    // faire, pas même en prose.
    expect(CSS_BRUT()).not.toMatch(/will-change/);
    expect(TSX()).not.toMatch(/will-change/);
  });
});

describe("[REDUCED-MOTION] fixe, jamais absente", () => {
  it("[LE CŒUR] le bloc `prefers-reduced-motion` neutralise l'animation sans `display: none`", () => {
    // Supprimer la graine rendrait l'étape 0 muette pour qui refuse le mouvement — la personne à qui
    // on doit le plus de repères (même règle que LotusAttente, DESIGN.md L477).
    const css = CSS();
    const debut = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(debut, "le bloc reduced-motion a disparu").toBeGreaterThan(-1);
    const rm = css.slice(debut);
    expect(rm, "les animations tournent encore").toMatch(/animation:\s*none/);
    expect(rm, "la graine est masquée : l'étape devient muette").not.toMatch(/display:\s*none/);
    expect(rm).not.toMatch(/visibility:\s*hidden/);
    expect(rm, "quelque chose devient invisible").not.toMatch(/opacity:\s*0(?![.\d])/);
    // Posée à son repos : les transforms sont remis à zéro, pas figés à mi-course.
    expect(rm).toMatch(/transform:\s*none/);
  });

  it("[ANTI-VACUITÉ] chaque classe animée est nommée dans le bloc — une nouvelle ne peut pas s'y soustraire", () => {
    // Le test ci-dessus passerait avec `.halo { animation: none }` seul, la graine continuant de
    // se soulever. On dérive la liste des classes qui portent une animation, et on exige que le
    // bloc reduced-motion les neutralise TOUTES.
    const css = CSS();
    const rm = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    // `[^{}]*` et non `[^}]*` : sinon le premier `{` du `@media` avale la liste de sélecteurs et la
    // garde compare des classes à « @media (prefers-reduced-motion: reduce) ».
    const neutralisees = [...rm.matchAll(/([^{}]+)\{[^{}]*animation:\s*none/g)].flatMap((m) =>
      m[1].split(",").map((sel) => sel.trim()),
    );
    const animees = blocsAnimes().map((b) => b.selecteur);
    expect(animees.length, "plus aucune classe animée : le témoin est vide").toBeGreaterThanOrEqual(3);
    for (const classe of animees) {
      expect(neutralisees, `${classe} s'anime encore sous reduced-motion`).toContain(classe);
    }
  });
});
