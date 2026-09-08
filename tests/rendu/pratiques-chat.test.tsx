import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useFluxAnam } from "@/render/conversation/useFluxAnam";
import Composeur from "@/render/conversation/Composeur";
import Conversation, { fusionnerEntreeDuJour } from "@/render/conversation/Conversation";
import { PRATIQUES } from "@/lib/domain/pratiques";
import { toursAvecPratiques } from "@/render/conversation/pratiques";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function flux(trames: unknown[]) {
  const texte = trames.map((t) => JSON.stringify(t) + "\n").join("");
  return new Response(new ReadableStream({ start(c) {
    // Fragments délibérément au milieu d’un JSON et d’un caractère UTF-8.
    const octets = new TextEncoder().encode(texte);
    for (let i = 0; i < octets.length; i += 7) c.enqueue(octets.slice(i, i + 7));
    c.close();
  } }));
}

describe("le chat propose sans lancer", () => {
  it.each(["fin", "erreur", "coupure"])("ne montre la carte qu’après une fin réussie : %s", async (issue) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(flux([
      { t: "delta", c: "Une idée pour toi." }, { t: "pratique", pratiqueId: PRATIQUES[0].id },
      ...(issue === "coupure" ? [] : [{ t: issue }]),
    ])));
    const { result } = renderHook(() => useFluxAnam());
    const onPratique = vi.fn(), onFin = vi.fn(), onEchec = vi.fn();
    await act(() => result.current.envoyer([{ role: "user", content: "Une pause" }], "test", { onMotsReveles: vi.fn(), onPratique, onFin, onEchec }));
    expect(onPratique).toHaveBeenCalledTimes(issue === "fin" ? 1 : 0);
    expect(onFin).toHaveBeenCalledTimes(issue === "fin" ? 1 : 0);
    expect(onEchec).toHaveBeenCalledTimes(issue === "fin" ? 0 : 1);
  });

  it("un retour préremplit le composeur, sans envoyer, et la personne peut modifier", () => {
    const envoyer = vi.fn();
    const message = "J’aimerais parler de la pratique « Respirer doucement ».";
    render(<Composeur messageInitial={message} champRef={createRef()} onEnvoyer={envoyer} occupe={false} />);
    const champ = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(champ.value).toBe(message);
    expect(envoyer).not.toHaveBeenCalled();
    fireEvent.change(champ, { target: { value: "Voici ce que j’en pense." } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(envoyer).toHaveBeenCalledWith("Voici ce que j’en pense.");
  });

  it("restaure la carte dans le vrai fil et la fusion quotidienne ne la double pas", () => {
    const p = PRATIQUES[0];
    const historique = [{ id: "anam:a", role: "anam" as const, texte: "Tu peux essayer.", pratiqueId: p.id }];
    const locaux = toursAvecPratiques(historique, PRATIQUES);
    const fusion = fusionnerEntreeDuJour(locaux, historique, null, PRATIQUES);
    expect(fusion.filter((t) => t.role === "pratique")).toHaveLength(1);
    render(<Conversation pratiques={PRATIQUES} historique={historique} />);
    expect(screen.getByRole("link", { name: "Découvrir l’exercice" }).getAttribute("href")).toBe(`${p.href}?de=anam`);
    expect(screen.queryByText(/Pratique proposée : \[/)).toBeNull();
  });
});
