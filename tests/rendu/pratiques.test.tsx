import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LecteurPratique from "@/render/pratiques/LecteurPratique";
import PratiquesHub from "@/render/pratiques/PratiquesHub";
import type { PratiqueVue } from "@/render/pratiques/types";
import { PRATIQUES } from "@/lib/domain/pratiques";
import { universMoi } from "@/lib/domain/univers-moi";

const PRATIQUE: PratiqueVue = {
  id: "pause-attention", titre: "Une pause d’attention", description: "Un repère pour revenir au présent.",
  type: "exercice", intention: "observer", dureeMinutes: 1, href: "/pratiques/pause-attention",
  precaution: "Tu peux garder les yeux ouverts ou arrêter.",
  sources: [{ titre: "Source officielle", url: "https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/" }],
  etapes: [
    { titre: "Choisir un repère", consigne: "Regarde un objet près de toi.", dureeSecondes: 2 },
    { titre: "Retrouver la pièce", consigne: "Regarde autour de toi.", dureeSecondes: 3 },
  ],
};

afterEach(() => vi.useRealTimers());

function commencer() {
  fireEvent.click(screen.getByRole("button", { name: "Commencer" }));
}

describe("les pratiques guidées", () => {
  it("attend un début volontaire puis déplace le focus au titre de l’étape", () => {
    render(<LecteurPratique pratique={PRATIQUE} />);
    expect(screen.queryByRole("timer")).toBeNull();
    commencer();
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Choisir un repère" }));
    expect(screen.getByRole("timer").textContent).toBe("0:02");
  });

  it("le minuteur reste facultatif, pausable et n’avance jamais une étape", () => {
    vi.useFakeTimers();
    render(<LecteurPratique pratique={PRATIQUE} />);
    commencer();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("timer").textContent).toBe("0:02");
    fireEvent.click(screen.getByRole("button", { name: "Lancer le minuteur" }));
    act(() => vi.advanceTimersByTime(1020));
    fireEvent.click(screen.getByRole("button", { name: "Mettre en pause" }));
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("timer").textContent).toBe("0:01");
    fireEvent.click(screen.getByRole("button", { name: "Reprendre le minuteur" }));
    act(() => vi.advanceTimersByTime(1020));
    expect(screen.getByRole("timer").textContent).toBe("0:00");
    expect(screen.getByRole("status").textContent).toContain("Tu choisis quand continuer");
    expect(screen.getByRole("heading", { name: "Choisir un repère" })).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("change d’étape sans attendre puis réinitialise chaque minuteur au retour", () => {
    vi.useFakeTimers();
    render(<LecteurPratique pratique={PRATIQUE} />);
    commencer();
    fireEvent.click(screen.getByRole("button", { name: "Lancer le minuteur" }));
    act(() => vi.advanceTimersByTime(1020));
    fireEvent.click(screen.getByRole("button", { name: "Étape suivante" }));
    expect(screen.getByRole("timer").textContent).toBe("0:03");
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Étape précédente" }));
    expect(screen.getByRole("timer").textContent).toBe("0:02");
  });

  it("arrête immédiatement sans présenter l’exercice comme terminé", () => {
    vi.useFakeTimers();
    const arreterMinuteur = vi.spyOn(window, "cancelAnimationFrame");
    render(<LecteurPratique pratique={PRATIQUE} />);
    commencer();
    fireEvent.click(screen.getByRole("button", { name: "Lancer le minuteur" }));
    fireEvent.click(screen.getByRole("button", { name: "Arrêter l’exercice" }));
    expect(screen.getByRole("heading", { name: "Tu peux t’arrêter là" })).toBe(document.activeElement);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(arreterMinuteur).toHaveBeenCalled();
    arreterMinuteur.mockRestore();
    expect(screen.getByRole("link", { name: /En parler à Anam/ }).getAttribute("href")).toBe("/?pratique=pause-attention");
  });

  it("garde la note éphémère et ne place que l’identifiant dans le retour vers Anam", () => {
    const { unmount } = render(<LecteurPratique pratique={PRATIQUE} />);
    commencer();
    fireEvent.click(screen.getByRole("button", { name: "Étape suivante" }));
    fireEvent.click(screen.getByRole("button", { name: "Terminer l’exercice" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Mes mots privés" } });
    expect(screen.getByRole("link", { name: /En parler à Anam/ }).getAttribute("href")).toBe("/?pratique=pause-attention");
    fireEvent(window, new Event("pagehide"));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("");
    unmount();
    render(<LecteurPratique pratique={PRATIQUE} />);
    commencer();
    fireEvent.click(screen.getByRole("button", { name: "Étape suivante" }));
    fireEvent.click(screen.getByRole("button", { name: "Terminer l’exercice" }));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("");
  });
});

describe("l’accès direct au catalogue", () => {
  it("expose chaque exercice et les questionnaires à leur destination existante", () => {
    render(<PratiquesHub pratiques={PRATIQUES} />);
    for (const pratique of PRATIQUES) {
      expect(screen.getByRole("link", { name: pratique.titre }).getAttribute("href")).toBe(pratique.href);
    }
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(PRATIQUES.length);
  });

  it("garde un état vide lisible", () => {
    render(<PratiquesHub pratiques={[]} />);
    expect(screen.getByText(/ne sont pas disponibles/)).toBeTruthy();
  });

  it("la porte Pratiques est disponible quel que soit l’état des questionnaires", () => {
    for (const statut of ["connu", "absent", "en-cours", "indisponible"] as const) {
      expect(universMoi(statut, false).find((u) => u.cle === "pratiques")).toMatchObject({ url: "/pratiques", action: null });
    }
  });
});
