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

const css = () =>
  readFileSync(resolve(process.cwd(), "render/conversation/conversation.module.css"), "utf-8");
const regle = (selecteur: string) => {
  const src = css().replace(/\/\*[\s\S]*?\*\//g, "");
  const i = src.indexOf(selecteur + " {");
  expect(i, `${selecteur} a disparu de la feuille`).toBeGreaterThan(-1);
  return src.slice(i, src.indexOf("}", i));
};

describe("[LE LOTUS] scintillant, mais jamais nerveux", () => {
  it("il a remplacé le fragment tronc/branche à l'endroit où l'œil attend la réponse", () => {
    const fil = readFileSync(resolve(process.cwd(), "render/conversation/Fil.tsx"), "utf-8");
    expect(fil, "le glyphe d'attente n'est pas un lotus").toMatch(/s\.lotus/);
    expect(fil.match(/className=\{s\.petale\}/g) ?? [], "un lotus sans pétales").not.toEqual([]);
  });

  it("[LE CŒUR] le cycle est LENT et DÉCALÉ — c'est ce qui le sépare de trois points qui rebondissent", () => {
    // ⚠️ LA DÉCISION DE LA STORY 2.2 TIENT, elle vise un indicateur NERVEUX. On mesure donc la
    // nervosité, pas la présence d'animation : un cycle court, ou des pétales synchrones, redonnent
    // exactement le battement qu'on refuse — juste avant qu'une réponse intime paraisse.
    const bloc = regle(".petale");
    const duree = Number(/animation:[^;]*?(\d+)ms/.exec(bloc)?.[1]);
    expect(Number.isFinite(duree), "aucune durée d'animation lisible").toBe(true);
    expect(duree, `cycle de ${duree} ms : c'est un battement, pas un scintillement`).toBeGreaterThanOrEqual(3000);
    expect(bloc, "sans retard par pétale, la fleur clignote d'un bloc").toMatch(/animation-delay:\s*var\(--retard-petale/);

    const fil = readFileSync(resolve(process.cwd(), "render/conversation/Fil.tsx"), "utf-8");
    const retards = [...fil.matchAll(/--retard-petale":\s*"(\d+)ms"/g)].map((m) => Number(m[1]));
    expect(retards.length, "aucun retard posé sur les pétales").toBeGreaterThan(2);
    expect(new Set(retards).size, "les pétales partagent leurs retards : ils scintillent ensemble").toBe(
      retards.length,
    );
  });

  it("[LE CŒUR] rien ne se DÉPLACE, rien ne change de taille — seule l'opacité respire", () => {
    // Une translation ou une mise à l'échelle transformerait le signe en indicateur de progression.
    const src = css().replace(/\/\*[\s\S]*?\*\//g, "");
    const anim = src.slice(src.indexOf("@keyframes lotus-scintille"));
    const corps = anim.slice(0, anim.indexOf("\n}\n") + 3);
    expect(corps, "le lotus bouge : ce n'est plus un scintillement").not.toMatch(
      /transform|translate|scale|rotate|width|height/,
    );
  });

  it("sous `prefers-reduced-motion`, il est FIXE mais jamais absent", () => {
    // Le supprimer rendrait l'attente muette pour qui refuse le mouvement — c'est-à-dire
    // exactement la personne à qui on doit le plus de repères.
    const src = css().replace(/\/\*[\s\S]*?\*\//g, "");
    const rm = src.slice(src.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(rm).toMatch(/\.petale\s*\{[^}]*animation:\s*none/);
    expect(rm, "l'opacité doit rester lisible, sinon la fleur disparaît").toMatch(/\.petale\s*\{[^}]*opacity:\s*0?\.[5-9]/);
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
