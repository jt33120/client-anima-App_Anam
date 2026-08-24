import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dimensionnerTout } from "./_outils";
import ArbreInteractif from "@/render/arbre/ArbreInteractif";
import { VIDE_CE_QU_EST_L_ARBRE } from "@/render/arbre/copie-arbre";
import type { ProjectionScene } from "@/lib/scene/projection";

/**
 * lotus-et-arbre-vide.test.tsx — DEUX RETOURS DU 2026-08-23, DEUX ÉCRANS QUI NE DISAIENT RIEN.
 *
 *  • « L'icône de chargement est moche, je veux une fleur de lotus scintillante. »
 *  • « L'arbre : quand vide, explique ce en quoi consiste l'arbre. »
 */

const VIDE: ProjectionScene = { tronc: { present: true }, branches: [] };

const lire = (chemin: string) => readFileSync(resolve(process.cwd(), chemin), "utf-8");
const sansCommentaires = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "");

const CSS = () => sansCommentaires(lire("render/conversation/LotusAttente.module.css"));
const FIL = () => lire("render/conversation/Fil.tsx");
const LOTUS = () => lire("render/conversation/LotusAttente.tsx");

/** Le corps d'une `@keyframes` — tout ce qui vit entre son nom et sa dernière accolade. */
const keyframes = (nom: string): string => {
  const src = CSS();
  const i = src.indexOf(`@keyframes ${nom}`);
  expect(i, `@keyframes ${nom} a disparu`).toBeGreaterThan(-1);
  const j = src.indexOf("\n}", i);
  return src.slice(i, j + 2);
};

/** Toutes les `@keyframes` de la feuille, d'un bloc — pour les propriétés qui valent pour TOUTES. */
const toutesLesKeyframes = (): string =>
  [...CSS().matchAll(/@keyframes\s+([A-Za-z]+)/g)].map((m) => keyframes(m[1])).join("\n");

describe("[LE LOTUS] scintillant, mais jamais nerveux", () => {
  it("il a remplacé le fragment tronc/branche à l'endroit où l'œil attend la réponse", () => {
    // ⚠️ ON MESURE LE CHEMIN, PAS LE DESSIN. Le lotus a déjà changé de main une fois (tracé ici,
    // puis livré par Claude Design) : une garde qui épelle des `d="M24 38 C…"` meurt au prochain
    // dessin sans rien avoir protégé. Ce qui doit tenir, c'est qu'un lotus soit MONTÉ en fin de fil.
    const fil = FIL();
    expect(fil, "le signe d'attente ne vient plus de LotusAttente").toMatch(
      /import\s*\{[^}]*AnamPrepare[^}]*\}\s*from\s*"\.\/LotusAttente"/,
    );
    expect(fil, "le signe d'attente n'est plus rendu quand Anam prépare").toMatch(
      /\{prepare\s*&&\s*<AnamPrepare\s*\/>\}/,
    );
    // Et il reste MUET pour les lecteurs d'écran : l'attente est dite par la région aria-live du
    // Fil (`ANNONCE_ATTENTE`), jamais deux fois.
    expect(LOTUS(), "le glyphe décoratif n'est plus aria-hidden : l'attente serait dite deux fois")
      .toMatch(/className=\{`\$\{s\.attente\}[^`]*`\}\s+aria-hidden/);
  });

  it("[LE CŒUR] le cycle est LENT et DÉCALÉ — c'est ce qui le sépare de trois points qui rebondissent", () => {
    // ⚠️ LA DÉCISION DE LA STORY 2.2 TIENT, elle vise un indicateur NERVEUX. On mesure donc la
    // nervosité, pas la présence d'animation : un cycle court, ou des rangs synchrones, redonnent
    // exactement le battement qu'on refuse — juste avant qu'une réponse intime paraisse.
    const css = CSS();
    const cycles = [...css.matchAll(/--cycle:\s*(\d+)ms/g)].map((m) => Number(m[1]));
    expect(cycles.length, "aucun cycle déclaré").toBeGreaterThan(0);
    for (const c of cycles) {
      expect(c, `cycle de ${c} ms : c'est un battement, pas un scintillement`).toBeGreaterThanOrEqual(3000);
    }

    // Les trois rangs s'allument du fond vers l'avant. S'ils partagent leur retard, la fleur
    // clignote d'un bloc et la profondeur disparaît.
    // ⚠️ UNE CLASSE EST DÉCLARÉE PLUSIEURS FOIS (épaisseur de trait ici, animation là) : lire le
    // PREMIER bloc venu renvoie 0 pour les trois rangs et fait passer la garde pour une bonne
    // raison qui n'existe pas. On rassemble donc TOUS les blocs de la classe.
    const retard = (classe: string) => {
      const blocs = [...css.matchAll(new RegExp(`\\.${classe}\\s*\\{([^}]*)\\}`, "g"))].map((m) => m[1]);
      expect(blocs.length, `.${classe} a disparu de la feuille`).toBeGreaterThan(0);
      const anime = blocs.find((b) => b.includes("animation:"));
      expect(anime, `.${classe} ne s'anime plus du tout`).toBeDefined();
      return Number(/animation-delay:\s*(\d+)ms/.exec(blocs.join("\n"))?.[1] ?? 0);
    };
    const retards = [retard("rangArriere"), retard("rangAvant"), retard("rangCoeur")];
    expect(new Set(retards).size, `les rangs partagent leurs retards (${retards}) : ils s'allument ensemble`)
      .toBe(retards.length);
  });

  it("[LE CŒUR] RIEN NE SE DÉPLACE, et la fleur RESPIRE au lieu de battre", () => {
    // Une translation ferait de l'attente un indicateur de progression. Une mise à l'échelle FRANCHE
    // ferait une pulsation — le battement de la 2.2 sous un autre nom. Le souffle de la fleur est
    // donc borné : ±5 % maximum. (Le halo, lui, est une LUEUR et non une forme : il a le droit de
    // gonfler, c'est même tout le dessin.)
    expect(toutesLesKeyframes(), "quelque chose se déplace : ce n'est plus un scintillement").not.toMatch(
      /translate|\btop\b|\bleft\b|margin/,
    );
    const echelles = [...keyframes("lotusSouffle").matchAll(/scale\(([\d.]+)\)/g)].map((m) => Number(m[1]));
    expect(echelles.length, "la fleur ne respire plus du tout").toBeGreaterThan(0);
    for (const e of echelles) {
      expect(e, `scale(${e}) : la fleur bat au lieu de respirer`).toBeGreaterThanOrEqual(0.95);
      expect(e, `scale(${e}) : la fleur bat au lieu de respirer`).toBeLessThanOrEqual(1.05);
    }
  });

  it("[LA FLUIDITÉ] aucun filtre n'est recalculé à chaque trame", () => {
    // ⚠️ CETTE GARDE EST NÉE D'UN DÉFAUT PAYÉ. Un `filter: blur()` animé — ou seulement présent sur
    // un élément dont une autre propriété s'anime — se recalcule à CHAQUE trame. Un blur plein écran
    // a déjà fait tomber cette application à 4 images par seconde le 2026-08-23. Ici le flou est
    // minuscule et STATIQUE : il est calculé une fois. Qu'il le reste.
    expect(toutesLesKeyframes(), "un filtre est animé : il se recalcule à chaque trame").not.toMatch(
      /filter|backdrop/,
    );
  });

  it("sous `prefers-reduced-motion`, il est FIXE mais jamais absent", () => {
    // Le supprimer rendrait l'attente muette pour qui refuse le mouvement — c'est-à-dire
    // exactement la personne à qui on doit le plus de repères.
    const css = CSS();
    const rm = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(rm, "les animations tournent encore").toMatch(/animation:\s*none/);
    expect(rm, "la fleur n'est plus posée : l'attente devient muette").toMatch(
      /\.rang\s*\{[^}]*opacity:\s*0?\.[5-9]/,
    );
    // Et la fleur elle-même n'est jamais masquée : seuls les éclats, qui n'existent QUE par leur
    // apparition, sont retirés plutôt que figés à mi-course.
    const masques = [...rm.matchAll(/([^{}]+)\{[^}]*display:\s*none/g)].map((m) => m[1].trim());
    for (const sel of masques) {
      expect(sel, `${sel} masqué sous reduced-motion : la fleur disparaît`).not.toMatch(
        /\.rang\b|\.fleur|\.halo|\.coeur/,
      );
    }
  });
});

describe("[L'ARBRE VIDE S'EXPLIQUE]", () => {
  function monter() {
    dimensionnerTout(800, 800);
    return render(
      <ArbreInteractif
        projection={VIDE}
        camera={{ pan: { x: 0, y: 0 }, zoom: 1 }}
        brancheSelectionnee={null}
        onCadrer={vi.fn()}
        onOuvrirFiche={vi.fn()}
        onFermerFiche={vi.fn()}
        onVoirDansConversation={vi.fn()}
        onRenommer={vi.fn(async () => true)}
        onDeclarerRayonnement={vi.fn(async () => "ok" as const)}
      />,
    );
  }

  it("il dit ce qu'est le tronc, comment naît une branche, et qui décide de la pleine lumière", () => {
    monter();
    for (const phrase of VIDE_CE_QU_EST_L_ARBRE) {
      expect(screen.getByText(phrase), `phrase absente de l'écran : ${phrase}`).toBeTruthy();
    }
  });

  it("[FR-057/FR-031] il n'y promet rien et n'y compte rien", () => {
    // ⚠️ UN ÉCRAN VIDE EST L'ENDROIT LE PLUS TENTANT POUR UNE CAROTTE. « Tu verras ton arbre
    // grandir », « il te manque une branche », « bientôt » : chacune transforme une explication en
    // promesse. On décrit un mécanisme, au présent.
    const tout = VIDE_CE_QU_EST_L_ARBRE.join(" ");
    expect(tout).not.toMatch(/bientôt|tu verras|tu pourras|deviendra|débloqu|il te manque|encore \d/i);
    expect(tout.match(/\d+/g) ?? []).toEqual([]);
  });

  it("dès qu'une branche existe, l'explication s'en va d'elle-même", () => {
    // Aucune persistance, aucun « ne plus afficher » : elle EST l'état vide, elle n'est pas un
    // événement daté (même raison que la phrase sobre d'AC6).
    dimensionnerTout(800, 800);
    render(
      <ArbreInteractif
        projection={{
          tronc: { present: true },
          branches: [{ id: "b1", etat: "naissance", intensite: 0, extraitSourceId: "e1", nom: "un nom" }],
        }}
        camera={{ pan: { x: 0, y: 0 }, zoom: 1 }}
        brancheSelectionnee={null}
        onCadrer={vi.fn()}
        onOuvrirFiche={vi.fn()}
        onFermerFiche={vi.fn()}
        onVoirDansConversation={vi.fn()}
        onRenommer={vi.fn(async () => true)}
        onDeclarerRayonnement={vi.fn(async () => "ok" as const)}
      />,
    );
    expect(screen.queryByText(VIDE_CE_QU_EST_L_ARBRE[0])).toBeNull();
  });
});
