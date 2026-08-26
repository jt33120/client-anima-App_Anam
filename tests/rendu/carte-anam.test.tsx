import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Régression du retrait demandé le 2026-08-26 : « Anam se manifeste » ne doit plus être
 * répété sur Moi. La conversation est son espace ; Moi ne l’utilise pas comme une carte.
 */
describe("[Moi] la carte Anam redondante ne revient pas", () => {
  it("la bibliothèque ne l’importe ni ne la rend", () => {
    const source = readFileSync(resolve(process.cwd(), "render/accueil/Bibliotheque.tsx"), "utf8");
    expect(source).not.toContain("CarteAnam");
    expect(source).not.toContain("Elle se manifeste");
  });

  it("le modèle de vue n’a plus de champ anam", () => {
    const source = readFileSync(resolve(process.cwd(), "render/accueil/types.ts"), "utf8");
    const debut = source.indexOf("export interface BibliothequeVue");
    const fin = source.indexOf("\n}", debut);
    expect(source.slice(debut, fin)).not.toMatch(/readonly\s+anam\s*:/);
  });
});
