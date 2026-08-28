import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Erreur from "@/app/error";

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
