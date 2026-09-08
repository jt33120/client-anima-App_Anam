import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { useFluxAnam } from "@/render/conversation/useFluxAnam";
import CarteParcours from "@/render/conversation/CarteParcours";
import { analyserTrame } from "@/render/conversation/flux-ndjson-client";
import { toursApresRejeu } from "@/render/conversation/rejeu";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("reçu de parcours après fin confirmée", () => {
  it.each(["fin", "erreur", "coupure"])("attend le succès du flux : %s", async (issue) => {
    const trames = [{ t: "delta", c: "Ton parcours est enregistré." }, { t: "parcours", action: "avancer" },
      ...(issue === "coupure" ? [] : [{ t: issue }])];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(trames.map((t) => JSON.stringify(t) + "\n").join(""))));
    const { result } = renderHook(() => useFluxAnam("compte-au-montage"));
    const onParcours = vi.fn();
    await act(() => result.current.envoyer([], "test", { onParcours, onMotsReveles: vi.fn(), onFin: vi.fn(), onEchec: vi.fn() }));
    expect(onParcours).toHaveBeenCalledTimes(issue === "fin" ? 1 : 0);
    expect(fetch).toHaveBeenCalledWith("/api/anam/message", expect.objectContaining({
      headers: { "Content-Type": "application/json", "X-Anam-Compte": "compte-au-montage" },
    }));
  });

  it("les destinations sont locales et ne proviennent pas du flux", () => {
    expect(analyserTrame('{"t":"parcours","action":"avancer","href":"https://inconnu.test"}'))
      .toEqual({ t: "parcours", action: "avancer" });
    expect(analyserTrame('{"t":"parcours","action":"effacer"}')).toBeNull();
    render(<CarteParcours action="avancer" />);
    expect(screen.getByRole("link", { name: "Voir mon parcours" }).getAttribute("href")).toBe("/parcours?de=anam");
    expect(screen.getByRole("link", { name: "Voir mon arbre" }).getAttribute("href")).toBe("/?de=arbre");
  });

  it("un rejeu retire le reçu du tour concerné", () => {
    expect(toursApresRejeu([
      { id: "anam:x", role: "anam", texte: "Un passage.", etat: "echec" },
      { id: "parcours:x", role: "parcours", ancreId: "anam:x", action: "avancer" },
      { id: "parcours:y", role: "parcours", ancreId: "anam:y", action: "ajuster" },
    ], "anam:x")).toHaveLength(1);
  });
});
