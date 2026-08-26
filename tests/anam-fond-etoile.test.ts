import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("[Anam] le ciel demeure, l'arbre se retire", () => {
  const scene = readFileSync(resolve(process.cwd(), "render/scene-dom.tsx"), "utf8");
  const css = readFileSync(resolve(process.cwd(), "render/monde.module.css"), "utf8");

  it("applique le même retrait total à Moi et Anam", () => {
    expect(scene).toMatch(/region === "accueil" \|\| region === "anam" \? s\.arbreEnRetrait/);
  });

  it("la conversation reste transparente sur le ciel et n'ajoute aucun asset d'arbre", () => {
    const debut = css.indexOf(".regionConversation {");
    const fin = css.indexOf("\n}", debut);
    expect(css.slice(debut, fin)).toMatch(/background:\s*transparent/);
    expect(css.slice(debut, fin)).not.toMatch(/url\([^)]*arbre/i);
  });
});
