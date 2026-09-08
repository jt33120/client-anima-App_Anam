import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lireContexteAnam } from "@/lib/data/lire-contexte-anam";
import { consigneContexte } from "@/lib/domain/contexte-anam";

vi.mock("@/lib/data/depot-branche", () => ({ creerDepotBranche: () => ({ chargerBranches: async () => [] }) }));
vi.mock("@/lib/data/lire-memoire", () => ({ lireFaitsRetenus: async () => [] }));
vi.mock("@/lib/data/lire-enneagramme", () => ({ lireEnneagramme: async () => ({ statut: "indisponible", raison: "sans_type" }) }));
vi.mock("@/lib/data/depot-theme-natal", () => ({ lireThemeNatal: async () => ({ statut: "indisponible" }) }));
vi.mock("@/lib/data/depot-lecture-numerologie", () => ({ lireLectureNumerologie: async () => null }));

const COMPTE = "compte-courant";
const RESULTAT = {
  ouverture: "haut", conscience: "median", extraversion: "bas", agreabilite: "haut", stabilite: "median",
};

/** The actual Big Five reader executes against this JWT-client-shaped query boundary. */
function clientPour(resultat: { data: unknown; error: unknown }, panne = false) {
  const requetes: { table: string; colonnes?: string; filtres: [string, unknown][] }[] = [];
  const client = {
    from: vi.fn((table: string) => {
      const requete: (typeof requetes)[number] = { table, filtres: [] };
      requetes.push(requete);
      return {
        select: (colonnes: string) => {
          requete.colonnes = colonnes;
          return {
            eq: (colonne: string, valeur: unknown) => {
              requete.filtres.push([colonne, valeur]);
              return {
                maybeSingle: async () => {
                  if (table === "utilisatrice") return { data: { prenom: "Louise" }, error: null };
                  if (table !== "big_five") throw new Error("lecture_imprevue");
                  if (panne) throw new Error("connexion_indisponible");
                  return resultat;
                },
              };
            },
          };
        },
      };
    }),
  } as unknown as SupabaseClient;
  return { client, requetes };
}

beforeEach(() => vi.clearAllMocks());

describe("Big Five lu pour le contexte conversationnel", () => {
  it("porte les cinq axes du compte dans le vrai prompt, sans réponses ni texte de corpus", async () => {
    const { client, requetes } = clientPour({
      data: { ...RESULTAT, reponses: "REPONSES_PRIVEES", texte: "INTERPRETATION_NON_AUTORISEE" }, error: null,
    });
    const matiere = await lireContexteAnam(client, COMPTE);
    const requete = requetes.find((r) => r.table === "big_five");
    expect(requete).toEqual({
      table: "big_five", colonnes: "ouverture, conscience, extraversion, agreabilite, stabilite",
      filtres: [["utilisatrice_id", COMPTE]],
    });
    expect(matiere.bigFive).toEqual({
      statut: "calcule",
      facteurs: [
        { facteur: "ouverture", position: "haut" },
        { facteur: "conscience", position: "median" },
        { facteur: "extraversion", position: "bas" },
        { facteur: "agreabilite", position: "haut" },
        { facteur: "stabilite", position: "median" },
      ],
    });
    const prompt = consigneContexte(matiere).content;
    for (const axe of ["Ouverture : Plutôt haut", "Application : Au milieu", "Extraversion : Plutôt bas", "Accord : Plutôt haut", "Stabilité : Au milieu"]) {
      expect(prompt).toContain(axe);
    }
    expect(prompt).toContain("validation psychométrique n’est pas établie");
    expect(prompt).toContain("elle peut les nuancer");
    expect(prompt).toContain("ne sont ni un diagnostic");
    expect(prompt).not.toMatch(/REPONSES_PRIVEES|INTERPRETATION_NON_AUTORISEE|big-five:ouverture/);
    expect(requetes.some((r) => r.table === "big_five_tentative")).toBe(false);
  });

  it("distingue l’absence de résultat d’une tentative inconnue", async () => {
    const { client } = clientPour({ data: null, error: null });
    const matiere = await lireContexteAnam(client, COMPTE);
    expect(matiere.bigFive).toEqual({ statut: "absent" });
    const prompt = consigneContexte(matiere).content;
    expect(prompt).toContain("Aucun résultat Big Five n’est enregistré");
    expect(prompt).toContain("Cela ne dit pas si elle a commencé");
    expect(prompt).not.toContain("Ouverture :");
  });

  it.each([
    { nom: "erreur de lecture", data: null, error: { code: "indisponible" }, panne: false },
    { nom: "axe invalide", data: { ...RESULTAT, stabilite: "inventee" }, error: null, panne: false },
    { nom: "résultat partiel", data: { ouverture: "haut" }, error: null, panne: false },
    { nom: "exception du client", data: null, error: null, panne: true },
  ])("$nom : conserve le reste du contexte sans inventer une absence ou des positions", async ({ data, error, panne }) => {
    const { client } = clientPour({ data, error }, panne);
    const matiere = await lireContexteAnam(client, COMPTE);
    expect(matiere.prenom).toBe("Louise");
    expect(matiere.bigFive).toEqual({ statut: "indisponible" });
    const prompt = consigneContexte(matiere).content;
    expect(prompt).toContain("Tu ne sais pas s’il en existe");
    expect(prompt).toContain("ne lui demande pas de le refaire");
    expect(prompt).not.toContain("Aucun résultat Big Five n’est enregistré");
    expect(prompt).not.toContain("Ouverture :");
  });
});
