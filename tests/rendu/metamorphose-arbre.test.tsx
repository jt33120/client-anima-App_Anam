import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MetamorphoseArbre from "@/render/arbre/MetamorphoseArbre";
import { PLANCHES_METAMORPHOSE } from "@/render/arbre/metamorphose-planches";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const precedente = () => screen.getByRole<HTMLButtonElement>("button", { name: "Image précédente" });
const suivante = () => screen.getByRole<HTMLButtonElement>("button", { name: "Image suivante" });
const repere = (index: number) => screen.getByRole("button", {
  name: `Voir l’illustration ${String(index + 1).padStart(2, "0")} : ${PLANCHES_METAMORPHOSE[index].titre}`,
});

function verifierPlanche(index: number) {
  const planche = PLANCHES_METAMORPHOSE[index];
  expect(screen.getByText((texte) => texte === planche.titre || texte.endsWith(`— ${planche.titre}`))).toBeTruthy();
  expect(screen.getByText(planche.texte)).toBeTruthy();
  const image = screen.getByAltText<HTMLImageElement>(planche.alt);
  expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(planche.src);
  expect(Number(image.getAttribute("width"))).toBeGreaterThan(0);
  expect(Number(image.getAttribute("height"))).toBeGreaterThan(0);
  expect(repere(index).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
  return image;
}

describe("métamorphose de l’arbre — exploration illustrée", () => {
  it("parcourt les huit planches et s’arrête réellement aux deux extrémités", () => {
    expect(PLANCHES_METAMORPHOSE).toHaveLength(8);
    render(<MetamorphoseArbre />);
    verifierPlanche(0);
    expect(precedente().disabled).toBe(true);
    fireEvent.click(precedente());
    verifierPlanche(0);

    for (let index = 1; index < PLANCHES_METAMORPHOSE.length; index++) {
      fireEvent.click(suivante());
      verifierPlanche(index);
    }
    expect(suivante().disabled).toBe(true);
    fireEvent.click(suivante());
    verifierPlanche(7);

    for (let index = 6; index >= 0; index--) {
      fireEvent.click(precedente());
      verifierPlanche(index);
    }
    expect(precedente().disabled).toBe(true);
  });

  it.each([[-12, 0], [200, 7]])("borne un index initial %s à la planche %s", (indexInitial, attendu) => {
    render(<MetamorphoseArbre indexInitial={indexInitial} />);
    verifierPlanche(attendu);
  });

  it("permet de choisir directement une planche sans inventer les étapes précédentes", () => {
    const requetes = vi.fn();
    vi.stubGlobal("fetch", requetes);
    render(<MetamorphoseArbre />);
    fireEvent.click(repere(7));
    verifierPlanche(7);
    fireEvent.click(repere(2));
    verifierPlanche(2);
    expect(requetes).not.toHaveBeenCalled();
  });

  it("se parcourt au clavier natif avec Tab, Entrée et Espace", async () => {
    const user = userEvent.setup();
    render(<MetamorphoseArbre />);
    const avancer = suivante();
    for (let i = 0; i < 12 && document.activeElement !== avancer; i++) await user.tab();
    expect(document.activeElement).toBe(avancer);
    await user.keyboard("{Enter}");
    verifierPlanche(1);
    expect(document.activeElement).toBe(avancer);
    await user.keyboard(" ");
    verifierPlanche(2);
    precedente().focus();
    await user.keyboard(" ");
    verifierPlanche(1);
    repere(7).focus();
    await user.keyboard("{Enter}");
    verifierPlanche(7);
  });

  it.each([
    { indexInitial: 6, attendu: 7, commande: "Image suivante" },
    { indexInitial: 1, attendu: 0, commande: "Image précédente" },
  ])(
    "garde le focus utilisable lorsque $commande atteint la borne $attendu",
    async ({ indexInitial, attendu, commande }) => {
      const user = userEvent.setup();
      const { container } = render(<MetamorphoseArbre indexInitial={indexInitial} />);
      screen.getByRole("button", { name: commande }).focus();
      await user.keyboard("{Enter}");
      verifierPlanche(attendu);
      expect(container.contains(document.activeElement)).toBe(true);
      expect(document.activeElement?.matches(":disabled")).toBe(false);
    },
  );

  it("annonce le chargement, puis affiche l’image et garde ses commandes disponibles", async () => {
    render(<MetamorphoseArbre />);
    const image = verifierPlanche(0);
    expect(screen.getByText("Chargement de l’illustration…")).toBeTruthy();
    expect(suivante().disabled).toBe(false);
    fireEvent.load(image);
    await waitFor(() => expect(screen.queryByText("Chargement de l’illustration…")).toBeNull());
    verifierPlanche(0);

    fireEvent.click(suivante());
    verifierPlanche(1);
    expect(screen.getByText("Chargement de l’illustration…")).toBeTruthy();
    expect(screen.queryByAltText(PLANCHES_METAMORPHOSE[0].alt)).toBeNull();
  });

  it("garde titre, navigation et focus en cas d’image absente, puis permet un nouvel essai", async () => {
    const user = userEvent.setup();
    render(<MetamorphoseArbre indexInitial={3} />);
    fireEvent.error(verifierPlanche(3));
    expect(screen.getByText("Cette illustration n’a pas pu être chargée.")).toBeTruthy();
    verifierPlanche(3);
    expect(precedente().disabled).toBe(false);
    expect(suivante().disabled).toBe(false);

    await user.click(screen.getByRole("button", { name: "Réessayer l’illustration" }));
    const plateau = screen.getByRole("group", { name: `Illustration : ${PLANCHES_METAMORPHOSE[3].titre}` });
    expect(plateau.contains(document.activeElement)).toBe(true);
    expect(screen.queryByText("Cette illustration n’a pas pu être chargée.")).toBeNull();
    expect(screen.getByText("Chargement de l’illustration…")).toBeTruthy();
    fireEvent.load(verifierPlanche(3));
    await waitFor(() => expect(screen.queryByText("Chargement de l’illustration…")).toBeNull());
  });

  it("une erreur ne bloque pas le passage à une autre illustration", () => {
    render(<MetamorphoseArbre />);
    fireEvent.error(verifierPlanche(0));
    fireEvent.click(suivante());
    verifierPlanche(1);
    expect(screen.queryByText("Cette illustration n’a pas pu être chargée.")).toBeNull();
    expect(screen.getByText("Chargement de l’illustration…")).toBeTruthy();
  });

  it("l’attente seule ne change jamais la planche ou la progression personnelle", () => {
    vi.useFakeTimers();
    const requetes = vi.fn();
    vi.stubGlobal("fetch", requetes);
    render(<MetamorphoseArbre indexInitial={2} />);
    vi.advanceTimersByTime(60_000);
    verifierPlanche(2);
    expect(requetes).not.toHaveBeenCalled();
  });
});
