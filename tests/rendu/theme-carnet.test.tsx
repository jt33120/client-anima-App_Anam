import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeCarnet, { ThemeCarnetDocument } from "@/render/carnet/ThemeCarnet";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.carnetTheme;
});

it("starts in night when no preference has been saved", () => {
  render(<><ThemeCarnetDocument /><ThemeCarnet /></>);
  expect(document.documentElement.dataset.carnetTheme).toBe("nuit");
  expect(screen.getByRole("button", { name: "Passer au thème papier" })).toBeTruthy();
});

it("preserves an explicitly selected paper preference", () => {
  vi.stubGlobal("localStorage", { getItem: () => "papier" });
  render(<><ThemeCarnetDocument /><ThemeCarnet /></>);
  expect(document.documentElement.dataset.carnetTheme).toBe("papier");
});

it("still starts in night when reading storage is unavailable", () => {
  vi.stubGlobal("localStorage", { getItem: () => { throw new DOMException("Unavailable", "SecurityError"); } });
  render(<><ThemeCarnetDocument /><ThemeCarnet /></>);
  expect(document.documentElement.dataset.carnetTheme).toBe("nuit");
});

it("can return to night when storage reads succeed but writes are rejected", async () => {
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => { throw new DOMException("Storage full", "QuotaExceededError"); },
  });
  const user = userEvent.setup();
  render(<><ThemeCarnetDocument /><ThemeCarnet /></>);
  await user.click(screen.getByRole("button", { name: "Passer au thème papier" }));
  expect(document.documentElement.dataset.carnetTheme).toBe("papier");
  expect(screen.getByRole("button", { name: "Passer au thème nuit" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Passer au thème nuit" }));
  expect(document.documentElement.dataset.carnetTheme).toBe("nuit");
});
