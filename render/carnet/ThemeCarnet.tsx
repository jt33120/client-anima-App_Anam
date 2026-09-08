"use client";

import { useEffect } from "react";
import tokens from "@/design/tokens.json";

/** Night is the only app theme, including for visitors with a former paper preference. */
export function ThemeCarnetDocument() {
  useEffect(() => {
    document.documentElement.dataset.carnetTheme = "nuit";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tokens.dark.fond);
  }, []);
  return null;
}
