import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PLANCHES_METAMORPHOSE } from "@/render/arbre/metamorphose-planches";
import provenance from "@/design/metamorphosis-assets.json";

// User-approved illustrations 1–4, frozen from design/metamorphosis-assets.json on 2026-09-07.
const CONSERVEES = [
  ["01-graine.webp", "5e42cb4a2bc4f8d110af14b601b27f155c2d5bcfbbe2d268dcee348e2b619051"],
  ["02-eclosion.webp", "d94ef5728eeea53809b9a77440b4e97e7c0233a693aaaac052fcb7edb258c198"],
  ["03-enracinement.webp", "32c6939531ba222eca8a6b16f28752d0644753f026c0e3ecd173374e08bab65e"],
  ["04-pousse.webp", "7c5cb85343d05ad0c980bb64481baec08f6a63571bba69ce2ec2fb1ed5e142b8"],
] as const;

describe("illustrations conservées à la demande de l’utilisateur", () => {
  it("conserve intégralement les 32 dessins précédents et leurs textes avant les trois ajouts célestes", () => {
    const existantes = PLANCHES_METAMORPHOSE.slice(0, 32);
    const empreinte = (valeur: string | Buffer) => createHash("sha256").update(valeur).digest("hex");
    expect(empreinte(JSON.stringify(existantes))).toBe("8e4fed8550ea69f808c3b2b143cbcf78a2f4f651d8d8479d47be04542f4e50ed");
    const dessins = existantes.map((planche) => empreinte(readFileSync(join(process.cwd(), "public", planche.src))));
    expect(empreinte(dessins.join("\n"))).toBe("095bca986b59233f82509c32793a8459177836da5311303c331783cd5eb60e5d");
  });

  it.each(CONSERVEES)("garde %s et son emplacement dans les quatre premiers dessins", (fichier, empreinte) => {
    const position = CONSERVEES.findIndex(([nom]) => nom === fichier);
    const chemin = `public/marque/metamorphose/${fichier}`;
    expect(PLANCHES_METAMORPHOSE[position].src).toBe(`/marque/metamorphose/${fichier}`);
    expect(provenance.assets.find((asset) => asset.target === chemin)?.sha256).toBe(empreinte);
    expect(createHash("sha256").update(readFileSync(join(process.cwd(), chemin))).digest("hex")).toBe(empreinte);
  });
});
