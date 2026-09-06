import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeCarnet, { ThemeCarnetDocument } from "@/render/carnet/ThemeCarnet";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.carnetTheme;
});

it("can return to paper when storage reads succeed but writes are rejected", async () => {
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => { throw new DOMException("Storage full", "QuotaExceededError"); },
  });
  const user = userEvent.setup();
  render(<><ThemeCarnetDocument /><ThemeCarnet /></>);
  await user.click(screen.getByRole("button", { name: "Passer au thème nuit" }));
  expect(document.documentElement.dataset.carnetTheme).toBe("nuit");
  await user.click(screen.getByRole("button", { name: "Passer au thème papier" }));
  expect(document.documentElement.dataset.carnetTheme).toBe("papier");
  expect(screen.getByRole("button", { name: "Passer au thème nuit" })).toBeTruthy();
});
