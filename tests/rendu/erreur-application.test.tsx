import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Erreur from "@/app/error";
import PageIntrouvable from "@/app/not-found";
import { REGION_FOYER, nomDeRegion } from "@/lib/scene";

describe("[14.6] frontière d'erreur visible", () => {
  it("explique sans signer Anam et ne reprend que sur geste explicite", () => {
    const retry = vi.fn();
    const espion = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<Erreur error={Object.assign(new Error("détail privé"), { digest: "abc" })} retry={retry} />);

    expect(screen.getByRole("heading", { name: "Cette page n’a pas pu s’ouvrir" })).toBeTruthy();
    expect(screen.queryByText(/Anam n’a pas pu/)).toBeNull();
    expect(screen.queryByText(/détail privé/)).toBeNull();
    expect(retry).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalledTimes(1);
    espion.mockRestore();
  });
});

describe("[E1-S4] les deux pages de sortie ramènent vers le foyer sous le nom du catalogue", () => {
  /**
   * « Revenir à Moi » est resté écrit en dur dans la frontière d'erreur pendant tout le temps où la
   * région s'appelait ainsi, et la page introuvable disait « Revenir à l'accueil », un mot de site
   * retiré de la barre le 2026-08-25. La garde des littéraux (`tests/scene-modele.test.ts`) ne
   * pouvait pas les voir : un nom au fil d'une phrase n'est pas un nom entre guillemets. Le
   * renommage en « Aujourd’hui » (retour du fondateur, 2026-09-01) les a trouvés en passant ; ce
   * test fait que le prochain ne pourra pas les manquer.
   */
  const foyer = nomDeRegion(REGION_FOYER);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[ANTI-VACUITÉ] le foyer a un nom, et c'est celui du fondateur", () => {
    // Sans ce témoin, un catalogue au nom vide rendrait « Revenir à  » et les deux CŒURS ci-dessous
    // resteraient verts, puisqu'ils lisent le même catalogue.
    expect(foyer).toBe("Aujourd’hui");
  });

  it("[LE CŒUR] la frontière d'erreur dit « Revenir à Aujourd’hui », vers la racine", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<Erreur error={Object.assign(new Error("x"), { digest: "abc" })} retry={() => undefined} />);
    expect(screen.getByRole("link", { name: `Revenir à ${foyer}` }).getAttribute("href")).toBe("/");
    expect(screen.queryByText(/Revenir à Moi/)).toBeNull();
  });

  it("[LE CŒUR] la page introuvable aussi, et plus « l'accueil »", () => {
    render(<PageIntrouvable />);
    expect(screen.getByRole("link", { name: `Revenir à ${foyer}` }).getAttribute("href")).toBe("/");
    expect(screen.queryByText(/accueil/i)).toBeNull();
  });

  it("[LE BORD] aucune des deux n'écrit le nom en dur : elles lisent `nomDeRegion(REGION_FOYER)`", () => {
    // Mutation-cible : réécrire « Revenir à Aujourd’hui » en littéral. Les deux CŒURS resteraient
    // verts aujourd'hui, et ne rougiraient qu'au prochain renommage, c'est-à-dire trop tard.
    for (const f of ["app/_erreur/ErreurApplication.tsx", "app/not-found.tsx"]) {
      const src = readFileSync(resolve(process.cwd(), f), "utf-8")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");
      expect(src, `${f} recopie le nom du foyer`).not.toMatch(
        /Revenir à (?:Moi|Aujourd’hui|l&rsquo;accueil|l’accueil|l'accueil)/,
      );
      expect(src, `${f} ne lit pas le catalogue`).toMatch(/Revenir à \{nomDeRegion\(REGION_FOYER\)\}/);
    }
  });
});
