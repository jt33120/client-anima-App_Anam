import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import { ARIA_CANEVAS } from "@/render/arbre/copie-arbre";
import { CANEVAS, CENTRE_ARBRE } from "@/render/arbre/geometrie";
import type { BrancheProjetee, ProjectionScene } from "@/lib/scene";
import { dimensionnerTout } from "./_outils";

/**
 * graine-integree.test.tsx — LA GRAINE D'ATTENTE EST POSÉE SUR L'ARBRE, ET LE MOTEUR LUI LAISSE LA PLACE.
 *
 * Le retour du fondateur : « l'arbre en forme de graine au début : la faire bouger pour symboliser
 * qu'elle n'attend que d'éclore. » Le composant pur (`GraineAttente`, gardé par graine-attente.test.tsx)
 * ne prouve rien tant qu'il n'est pas MONTÉ sur l'arbre : c'est l'INTÉGRATION qui est éprouvée ici,
 * pour de vrai (jsdom + Testing Library), parce qu'une garde de source prouverait le câblage et jamais
 * le comportement (leçon de la re-revue 4.6, en tête d'arbre-mesure.test.tsx).
 *
 * Trois choses, et rien d'autre :
 *  1. à l'étape 0, la graine SVG est DANS le conteneur du canevas — le même `.monde`, donc le même
 *     repère et le même chemin de visibilité (la région inactive l'emporte avec le canevas) — et le
 *     moteur, sous la MÊME condition, ne peint plus sa graine : sinon il y en aurait deux ;
 *  2. dès la première branche, elle QUITTE le DOM (absente, pas masquée) ;
 *  3. elle est positionnée par une CLASSE de arbre.module.css, jamais en `style=`, et cette classe
 *     ne fait QUE du placement : l'animation vit dans graine-attente.module.css et nulle part ailleurs.
 *
 * ⚠️ LE MOTEUR SE MESURE PAR SON CONTEXTE 2D, PAS PAR SES PIXELS. jsdom ne rastérise aucun canevas :
 * `getContext` y rend `null` et le moteur ne peint rien du tout — « aucune graine peinte » serait
 * alors vrai d'un moteur mort. On lui prête donc un contexte qui ENREGISTRE (même principe que
 * moteur-arbre-lunaire.test.tsx), et on exige un TÉMOIN POSITIF : avec une branche, la graine au
 * pied de l'arbre est bien peinte — la mesure mord, l'absence à l'étape 0 est une vraie absence.
 */

/** L'ellipse EXACTE de `peindreGraine` (MoteurArbreLunaire.ts) : centre (704, 1367), 24 × 31, −0,18 rad. */
const ELLIPSE_GRAINE = [CENTRE_ARBRE.x, CENTRE_ARBRE.solY + 7, 24, 31, -0.18, 0, Math.PI * 2];

/**
 * Un contexte 2D qui ENREGISTRE chaque appel. Un Proxy plutôt qu'une liste de méthodes : le moteur
 * n'emploie que des méthodes (`ellipse`, `fill`, `drawImage`…) et des affectations (`fillStyle`,
 * `lineWidth`…) ; un dégradé est lui-même le proxy, donc `addColorStop` s'enregistre aussi.
 */
function instrumenterLeCanevas() {
  const appels: { nom: string; args: unknown[] }[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function () {
    const contexte: object = new Proxy(
      {},
      {
        get: (_cible, prop) =>
          typeof prop === "string"
            ? (...args: unknown[]) => {
                appels.push({ nom: prop, args });
                return contexte;
              }
            : undefined,
        set: () => true,
      },
    );
    return contexte as CanvasRenderingContext2D;
  });
  const meme = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((v, i) => v === b[i]);
  return {
    /** Combien de fois la graine de `peindreGraine` a été tracée, toutes couches confondues. */
    grainesPeintes: () => appels.filter((a) => a.nom === "ellipse" && meme(a.args, ELLIPSE_GRAINE)).length,
    /** Le moteur a-t-il travaillé du tout ? (compose ses couches : `drawImage`, `clearRect`…) */
    appelsDuMoteur: () => appels.length,
  };
}

const branche = (id: string): BrancheProjetee => ({
  id,
  etat: "naissance",
  intensite: 0,
  extraitSourceId: `extrait-${id}`,
  nom: `branche ${id}`,
});

const scene = (branches: readonly BrancheProjetee[], indisponible?: true): ProjectionScene =>
  indisponible ? { tronc: { present: true }, branches, indisponible } : { tronc: { present: true }, branches };

function proprietes(projection: ProjectionScene) {
  return {
    projection,
    camera: { pan: { x: 0, y: 0 }, zoom: 1 },
    brancheSelectionnee: null,
    onCadrer: vi.fn(),
    onOuvrirFiche: vi.fn(),
    onFermerFiche: vi.fn(),
    onVoirDansConversation: vi.fn(),
    onRenommer: vi.fn(async () => true),
  };
}

function monter(projection: ProjectionScene) {
  dimensionnerTout(800, 600);
  return render(<ArbreInteractif {...proprietes(projection)} />);
}

const graine = (racine: ParentNode) => racine.querySelector("[data-graine-attente]");
const canevas = () => screen.getByRole("img", { name: ARIA_CANEVAS });

const lire = (chemin: string) => readFileSync(resolve(process.cwd(), chemin), "utf-8");
const sansCommentaires = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS_ARBRE = () => sansCommentaires(lire("render/arbre/arbre.module.css"));

/** Le corps de la règle `.graineAttente { … }` — et la preuve qu'elle existe. */
function regleGraine(): string {
  const css = CSS_ARBRE();
  const m = /\.graineAttente\s*\{([^{}]*)\}/.exec(css);
  expect(m, "la règle .graineAttente a disparu de arbre.module.css").not.toBeNull();
  return m![1];
}

afterEach(() => vi.restoreAllMocks());

describe("[LE CŒUR] à l'étape graine, la graine d'attente est là — et le moteur lui laisse la place", () => {
  it("[LE CŒUR] 0 branche : `[data-graine-attente]` est rendu DANS le conteneur du canevas, et le moteur ne peint pas sa graine", () => {
    const moteur = instrumenterLeCanevas();
    const { container } = monter(scene([]));

    const canvas = canevas();
    expect(canvas.getAttribute("data-etape-arbre"), "témoin : on est bien à l'étape graine").toBe("graine");
    const svg = graine(container);
    expect(svg, "la graine d'attente n'est pas montée à l'étape 0").not.toBeNull();

    // LE MÊME CONTENEUR que le canevas (`.monde`) : même repère (portrait mesuré, pan/zoom) et surtout
    // même chemin de visibilité — la région inactive (`visibility: hidden`, `inert`) l'emporte avec le
    // canevas. Une graine montée ailleurs aurait besoin d'un second retrait, que personne ne garderait.
    expect(svg!.parentElement, "la graine ne vit pas dans le conteneur du canevas").toBe(canvas.parentElement);
    // Et APRÈS le canevas dans le DOM : elle se peint par-dessus le bitmap, pas dessous.
    expect(
      canvas.compareDocumentPosition(svg!) & Node.DOCUMENT_POSITION_FOLLOWING,
      "la graine est peinte SOUS le canevas",
    ).toBeTruthy();

    // Le moteur a tourné (il compose ses couches) MAIS n'a pas tracé la graine : elle est le SVG.
    expect(moteur.appelsDuMoteur(), "témoin : le moteur n'a rien fait, la mesure ne prouverait rien").toBeGreaterThan(0);
    expect(moteur.grainesPeintes(), "le moteur peint encore sa graine à l'étape 0 : il y en a deux").toBe(0);
  });

  it("[ANTI-VACUITÉ] le témoin mord : avec une branche, le moteur peint bien la graine au pied de l'arbre", () => {
    // Sans ce test, « zéro graine peinte » serait aussi vrai d'un `peindreGraine` supprimé, ou d'un
    // contexte que le moteur n'aurait jamais reçu. Ici la même mesure rend > 0 : elle voit vraiment.
    const moteur = instrumenterLeCanevas();
    const { container } = monter(scene([branche("a")]));
    expect(canevas().getAttribute("data-etape-arbre")).toBe("branches");
    expect(moteur.grainesPeintes(), "la graine au pied de l'arbre a disparu du bitmap").toBeGreaterThanOrEqual(1);
    expect(graine(container), "et la graine SVG ne doit pas la doubler").toBeNull();
  });
});

describe("[LE CŒUR] dès la première branche, la graine d'attente QUITTE le DOM", () => {
  it("montée avec une branche : `[data-graine-attente]` est ABSENTE — pas masquée, absente", () => {
    const { container } = monter(scene([branche("a")]));
    expect(graine(container)).toBeNull();
    // Aucun SVG du tout : la graine d'attente était le seul admis, et il n'a rien à faire ici.
    expect(container.querySelector("svg")).toBeNull();
  });

  it("SCÉNARIO NOMINAL — graine puis PREMIÈRE branche : elle disparaît au re-rendu, le canevas reste le même", () => {
    // Le bitmap n'est pas remplacé (arbre-mesure.test.tsx) : c'est donc bien la CONDITION qui retire
    // la graine, pas un remontage qui l'aurait oubliée au passage.
    const { container, rerender } = render(<ArbreInteractif {...proprietes(scene([]))} />);
    dimensionnerTout(800, 600);
    const canvas = canevas();
    expect(graine(container), "témoin : la graine est là avant la première branche").not.toBeNull();

    rerender(<ArbreInteractif {...proprietes(scene([branche("a")]))} />);

    expect(canevas(), "le canevas a été remplacé").toBe(canvas);
    expect(canvas.getAttribute("data-etape-arbre")).toBe("branches");
    expect(graine(container), "la graine d'attente survit à la première branche").toBeNull();
  });

  it("lecture INDISPONIBLE : ni canevas, ni graine — une panne ne montre pas une graine qui attend", () => {
    // `indisponible` retire le canevas ; la graine vit DANS son conteneur, elle part avec lui. Une
    // graine qui resterait dirait « rien n'a encore été nommé » à quelqu'un dont l'arbre est peut-être
    // plein — exactement le mensonge que la re-revue 4.6 a fermé (FR-029).
    const { container } = monter(scene([], true));
    expect(screen.queryByRole("img", { name: ARIA_CANEVAS })).toBeNull();
    expect(graine(container)).toBeNull();
  });
});

describe("[ANTI-VACUITÉ] positionnée par une classe de arbre.module.css, jamais par un style — et cette classe ne bouge pas", () => {
  it("le SVG intégré ne porte AUCUN `style=` et reçoit la classe `.graineAttente` du module", () => {
    // Un `style=` serait un second endroit d'où une géométrie — ou une animation — pourrait naître,
    // hors de portée des gardes de graine-attente.test.tsx (« aucun style inline »). Et la garde
    // « aucun pourcentage hors chaîne » de tests/arbre-rendu.test.ts n'a rien à lire en JSX.
    const { container } = monter(scene([]));
    const svg = graine(container)!;
    expect(svg.hasAttribute("style"), "un style inline s'est glissé sur la graine intégrée").toBe(false);
    // Les classes de CSS Modules gardent leur nom dans le hachage de vitest (`_graineAttente_…`) :
    // c'est ce qui rend la règle ci-dessous ATTACHÉE à l'élément, pas seulement présente dans la feuille.
    expect(svg.getAttribute("class") ?? "", "la classe de placement n'est pas posée sur le SVG").toMatch(/graineAttente/);
    // Et le composant garde sa propre classe (`.graine`, celle qui porte la taille et pointer-events).
    expect(svg.getAttribute("class") ?? "").toMatch(/\bgraine\b|_graine_/);
  });

  it("[LE CŒUR] la règle `.graineAttente` ne fait QUE du placement : position / inset / transform / taille", () => {
    const corps = regleGraine();
    const proprietes = [...corps.matchAll(/(?:^|[;\s])([a-z-]+)\s*:/g)].map((m) => m[1]);
    expect(proprietes.length, "la règle est vide").toBeGreaterThan(0);
    const ADMISES = ["position", "left", "top", "right", "bottom", "inset", "transform", "width", "height", "--taille-graine"];
    for (const p of proprietes) {
      expect(ADMISES, `\`${p}\` n'est pas du placement : l'animation vit dans graine-attente.module.css`).toContain(p);
    }
    // Ce qui doit y être : absolue, dans le repère du monde, centrée sur son point.
    expect(corps).toMatch(/position:\s*absolute/);
    expect(corps).toMatch(/transform:\s*translate\(\s*-50%\s*,\s*-50%\s*\)/);
    // Ce qui ne doit JAMAIS y être — ni ici, ni dans une seconde règle plus loin (reduced-motion compris).
    expect(corps).not.toMatch(/animation|transition|will-change|opacity|display|visibility|filter/);
    const css = CSS_ARBRE();
    expect((css.match(/\.graineAttente\b/g) ?? []).length, "une seconde règle .graineAttente est apparue").toBe(1);
  });

  it("[LE CŒUR] ses coordonnées sont celles de la graine peinte — 704 / 1408 et 1367 / 2503, tirées de geometrie.ts", () => {
    // Le SVG remplace une ellipse que le moteur posait en (CENTRE_ARBRE.x, CENTRE_ARBRE.solY + 7). Si
    // les constantes bougent ou si quelqu'un « ajuste » la classe à l'œil, la graine se décolle du
    // point où l'arbre naîtra : la première branche partirait d'à côté.
    const corps = regleGraine();
    const valeur = (prop: string) => Number(new RegExp(`${prop}:\\s*([\\d.]+)%`).exec(corps)?.[1]);
    expect(valeur("left"), "`left` n'est pas un pourcentage du monde").toBeCloseTo((CENTRE_ARBRE.x / CANEVAS.largeur) * 100, 1);
    expect(valeur("top"), "`top` n'est pas un pourcentage du monde").toBeCloseTo(((CENTRE_ARBRE.solY + 7) / CANEVAS.hauteur) * 100, 1);
    // Et la boîte de 48 unités (viewBox du composant) rend 48 px : les « 3 px » du soulèvement sont 3 px.
    expect(corps).toMatch(/--taille-graine:\s*48px/);
  });

  it("[ANTI-VACUITÉ] l'animation existe bel et bien — dans graine-attente.module.css, pas ici", () => {
    // « Aucune animation dans la classe de placement » serait aussi vrai d'une graine qui ne bouge
    // plus du tout. Le mouvement est réel, et il est là où les gardes du composant le bornent.
    const feuille = sansCommentaires(lire("render/arbre/graine-attente.module.css"));
    expect(feuille, "la graine ne se soulève plus").toMatch(/\.souleve\s*\{[^}]*animation:/);
    expect(feuille, "la graine ne respire plus").toMatch(/\.corps\s*\{[^}]*animation:/);
  });

  it("le bloc reduced-motion de arbre.module.css ne MASQUE rien — la graine sait se figer toute seule", () => {
    // Le composant gère son état fixe (graine-attente.test.tsx, « fixe, jamais absente »). Le conteneur
    // n'a donc rien à faire — et surtout pas la retirer : l'étape 0 deviendrait muette pour qui refuse
    // le mouvement, la personne à qui on doit le plus de repères.
    const css = CSS_ARBRE();
    const debut = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(debut, "le bloc reduced-motion de la feuille a disparu").toBeGreaterThan(-1);
    const rm = css.slice(debut);
    expect(rm).not.toMatch(/display:\s*none|visibility:\s*hidden|opacity:\s*0(?![.\d])/);
    expect(rm).not.toMatch(/graineAttente|\.monde\b|canvasLunaire/);
  });
});
