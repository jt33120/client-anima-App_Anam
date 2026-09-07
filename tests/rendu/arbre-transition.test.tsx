import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import ArbreLunaire from "@/render/arbre/ArbreLunaire";
import { MoteurArbreLunaire } from "@/render/arbre/MoteurArbreLunaire";
import { construireGeometrieLunaire } from "@/render/arbre/geometrie";

const geometrie = (intensite: number) => construireGeometrieLunaire([{
  id: "branche-test", extraitSourceId: "source-test", etat: "feuillaison", intensite,
}]);

function installer(mouvementReduit = false) {
  vi.spyOn(MoteurArbreLunaire.prototype, "mettreAJour").mockImplementation(() => {});
  const media = Object.assign(new EventTarget(), { matches: mouvementReduit });
  vi.stubGlobal("matchMedia", () => media);
  const animation = Object.assign(new EventTarget(), { cancel: vi.fn() });
  const animer = vi.fn<(keyframes: Keyframe[], options: KeyframeAnimationOptions) => typeof animation>().mockReturnValue(animation);
  const ancien = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "animate");
  Object.defineProperty(HTMLCanvasElement.prototype, "animate", { configurable: true, value: animer });
  return { media, animation, animer, restaurer: () => {
    if (ancien) Object.defineProperty(HTMLCanvasElement.prototype, "animate", ancien);
    else Reflect.deleteProperty(HTMLCanvasElement.prototype, "animate");
  } };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("arbre céleste — transition finie", () => {
  it("ne rejoue rien au montage ou à projection identique ; fond seulement une donnée nouvelle", () => {
    const outils = installer();
    try {
      const props = { troncEnReserve: false, ariaLabel: "Arbre de test" };
      const vue = render(<ArbreLunaire {...props} geometrie={geometrie(0.3)} />);
      expect(outils.animer).not.toHaveBeenCalled();
      vue.rerender(<ArbreLunaire {...props} geometrie={geometrie(0.3)} />);
      expect(outils.animer).not.toHaveBeenCalled();
      vue.rerender(<ArbreLunaire {...props} geometrie={geometrie(0.8)} />);
      expect(outils.animer).toHaveBeenCalledTimes(1);
      expect(outils.animer.mock.calls[0][1]).not.toHaveProperty("iterations");
      vue.unmount();
      expect(outils.animation.cancel).toHaveBeenCalled();
    } finally { outils.restaurer(); }
  });

  it("montre immédiatement l'état final avec mouvement réduit", () => {
    const outils = installer(true);
    try {
      const props = { troncEnReserve: false, ariaLabel: "Arbre de test" };
      const vue = render(<ArbreLunaire {...props} geometrie={geometrie(0.3)} />);
      vue.rerender(<ArbreLunaire {...props} geometrie={geometrie(1)} />);
      expect(outils.animer).not.toHaveBeenCalled();
      vue.unmount();
    } finally { outils.restaurer(); }
  });

  it("arrête un fondu en cours quand la préférence de mouvement change", () => {
    const outils = installer();
    try {
      const props = { troncEnReserve: false, ariaLabel: "Arbre de test" };
      const vue = render(<ArbreLunaire {...props} geometrie={geometrie(0.3)} />);
      vue.rerender(<ArbreLunaire {...props} geometrie={geometrie(0.8)} />);
      outils.media.dispatchEvent(new Event("change"));
      expect(outils.animation.cancel).toHaveBeenCalledTimes(1);
      vue.unmount();
    } finally { outils.restaurer(); }
  });
});
