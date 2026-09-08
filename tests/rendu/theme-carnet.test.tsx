import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ThemeCarnetDocument } from "@/render/carnet/ThemeCarnet";
import tokens from "@/design/tokens.json";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete document.documentElement.dataset.carnetTheme; });

it("keeps night even when an old paper preference exists", () => {
  vi.stubGlobal("localStorage", { getItem: () => "papier" });
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  document.head.append(meta);
  const { container } = render(<ThemeCarnetDocument />);
  expect(document.documentElement.dataset.carnetTheme).toBe("nuit");
  expect(meta.content).toBe(tokens.dark.fond);
  expect(container.querySelector("button")).toBeNull();
  meta.remove();
});

it("does not need access to storage to use night", () => {
  vi.stubGlobal("localStorage", { getItem: () => { throw new DOMException("Unavailable", "SecurityError"); } });
  render(<ThemeCarnetDocument />);
  expect(document.documentElement.dataset.carnetTheme).toBe("nuit");
});
