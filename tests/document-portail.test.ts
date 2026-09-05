import { describe, expect, it } from "vitest";
import { documentPeutRecevoirLePortail } from "@/lib/scene/document-portail";

describe("[RC-B1] le portail appartient au document froid, pas à la navigation", () => {
  it("admet une seule fois un document né directement sur la racine", () => {
    expect(documentPeutRecevoirLePortail("/", "/", false)).toBe(true);
    expect(documentPeutRecevoirLePortail("/", "/", true)).toBe(false);
  });

  it("refuse les liens profonds, même revenus ensuite sur la racine", () => {
    for (const chemin of ["/aide", "/socle", "/psychologie", "/reglages"]) {
      expect(documentPeutRecevoirLePortail(chemin, "/", false)).toBe(false);
    }
  });

  it("refuse toute route courante qui n'est pas la racine", () => {
    expect(documentPeutRecevoirLePortail("/", "/aide", false)).toBe(false);
    expect(documentPeutRecevoirLePortail("/", "/socle", false)).toBe(false);
  });
});
