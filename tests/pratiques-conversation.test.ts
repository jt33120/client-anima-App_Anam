import { describe, expect, it } from "vitest";
import { PRATIQUES, pratiqueParId, texteRecommandationPratique } from "@/lib/domain/pratiques";
import { analyserTrame } from "@/render/conversation/flux-ndjson-client";
import { messagesDuFil, toursAvecPratiques } from "@/render/conversation/pratiques";
import { toursApresRejeu } from "@/render/conversation/rejeu";

const pratique = PRATIQUES[0];
describe("pratiques — catalogue et conservation du fil", () => {
  it("expose huit exercices originaux et deux repères, avec des routes fermées", () => {
    expect(PRATIQUES.filter((p) => p.type === "exercice")).toHaveLength(8);
    expect(new Set(PRATIQUES.map((p) => p.id)).size).toBe(PRATIQUES.length);
    for (const p of PRATIQUES) {
      expect(pratiqueParId(p.id)).toBe(p);
      expect(p.href).toBe(p.type === "exercice" ? `/pratiques/${p.id}` : `/${p.id}`);
      if (p.type === "exercice") {
        expect(p.etapes.length).toBeGreaterThan(1);
        expect(p.sources.length).toBeGreaterThan(0);
        expect(p.precaution.length).toBeGreaterThan(0);
      }
    }
    expect(pratiqueParId("constructor")).toBeNull();
    expect(pratiqueParId({ id: pratique.id })).toBeNull();
  });
  it("n’accepte aucun titre ni lien provenant de la trame", () => {
    expect(analyserTrame(JSON.stringify({ t: "pratique", pratiqueId: pratique.id, href: "https://inconnu.test" })))
      .toEqual({ t: "pratique", pratiqueId: pratique.id });
    for (const pratiqueId of [null, 3, "../../aide", "", "a".repeat(65)]) {
      expect(analyserTrame(JSON.stringify({ t: "pratique", pratiqueId }))).toBeNull();
    }
  });
  it("restaure une carte depuis la proposition canonique et garde le contexte au prochain tour", () => {
    const texte = "Une pause peut être une piste." + texteRecommandationPratique(pratique);
    const tours = toursAvecPratiques([{ id: "anam:a", role: "anam", texte: "Une pause peut être une piste.", pratiqueId: pratique.id, separateurAvant: true }], PRATIQUES);
    expect(tours).toHaveLength(2);
    expect(tours[0]).toMatchObject({ texte: "Une pause peut être une piste.", separateurAvant: true });
    expect(tours[1]).toMatchObject({ id: "pratique:anam:a", role: "pratique", pratique });
    expect(messagesDuFil(tours)).toEqual([{ role: "assistant", content: texte }]);
    expect(toursApresRejeu(tours, "anam:a")).toEqual([]);
  });
  it("ne transforme jamais le texte utilisateur en action ni une URL inconnue en carte", () => {
    const texte = "Mes propres mots" + texteRecommandationPratique(pratique);
    expect(toursAvecPratiques([{ id: "u", role: "utilisatrice", texte }], PRATIQUES)).toEqual([{ id: "u", role: "utilisatrice", texte }]);
    expect(toursAvecPratiques([{ id: "a", role: "anam", texte }], PRATIQUES)).toHaveLength(1);
    const inconnu = "Texte\n\nPratique proposée : [Respirer doucement](https://inconnu.test)";
    expect(toursAvecPratiques([{ id: "a", role: "anam", texte: inconnu }], PRATIQUES)).toHaveLength(1);
    expect(toursAvecPratiques([{ id: "a", role: "anam", texte: inconnu }], PRATIQUES)[0]).toMatchObject({ texte: inconnu });
  });
});
