import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { attendreLePortail, entrerDansLaRegion, ouvrirUnCompteNeuf } from "./_entrer";
import { PRATIQUES } from "../lib/domain/pratiques";

const TITRE_ETAPE_RECONNUE = "Nommer ce qui me ressource";
const PRATIQUE_ATTENTION = PRATIQUES.find((pratique) => pratique.id === "pause-attention")!;

// Clé publique de démonstration du CLI, limitée à la cible de bouclage imposée ici et par Playwright.
const admin = createClient("http://127.0.0.1:54321", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU", { auth: { persistSession: false, autoRefreshToken: false } });

async function idPour(adresse: string): Promise<string> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((u) => u.email === adresse);
    if (user) return user.id;
    if (data.users.length < 1000) break;
  }
  throw new Error("Compte local de test introuvable");
}

async function captures(page: Page, testInfo: TestInfo, nom: string) {
  for (const largeur of [390, 768, 1440]) {
    await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 1000 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${nom}-${largeur}.png`), fullPage: true });
  }
}

test.describe("Mon parcours", () => {
  test("garde une session obligatoire", async ({ page }) => {
    await page.goto("/parcours");
    await expect(page).toHaveURL(/\/entrer(?:\?|$)/);
  });

  test("garde les repères et la pause puis ouvre les étapes et un brouillon privé", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const erreurs: string[] = [];
    page.on("pageerror", (e) => erreurs.push(e.message));
    const compte = await ouvrirUnCompteNeuf(page);
    const userId = await idPour(compte.adresse);
    try {
      await page.goto("/pratiques");
      await page.getByRole("link", { name: "Mon parcours", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Mon parcours", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Poser un premier cap avec Anam" })).toBeVisible();
      await captures(page, testInfo, "parcours-vide");
      await page.getByRole("button", { name: "Ajouter mes repères" }).click();
      const repere = "Prendre du temps pour moi sans renoncer aux personnes qui comptent. Une phrase de test synthétique, sans donnée réelle.";
      await page.getByRole("textbox", { name: "Ce qui compte pour moi" }).fill(repere);
      await page.getByRole("textbox", { name: "Ce qui m’aide" }).fill("Marcher, écrire quelques mots et faire une pause quand j’en ressens le besoin.");
      await page.getByRole("textbox", { name: "Ce que je souhaite respecter" }).fill("Je préfère essayer un seul petit pas et garder les yeux ouverts pendant les exercices.");
      await captures(page, testInfo, "parcours-formulaire");
      await page.getByRole("button", { name: "Enregistrer mes repères" }).click();
      await expect(page.getByText("Tes repères ont été enregistrés.")).toBeVisible();
      await page.reload();
      await expect(page.getByText(repere, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Mettre mon parcours en pause" }).click();
      await expect(page.getByText("En pause, à ta demande")).toBeVisible();
      await page.reload();
      await expect(page.getByRole("button", { name: "Reprendre mon parcours" })).toBeVisible();
      await page.getByRole("button", { name: "Reprendre mon parcours" }).click();
      await expect(page.getByRole("button", { name: "Mettre mon parcours en pause" })).toBeVisible();

      // Outils simulés avec la vraie RPC attestée et la vraie base locale, sans appel au modèle.
      const cleAjustement = `parcours-e2e-${randomUUID()}`;
      const preuveAjustement = "Je souhaite retrouver une place pour ce qui me ressource";
      const { error: erreurSource } = await admin.from("entree_journal").insert({ utilisatrice_id: userId, role: "utilisatrice", cle_tour: cleAjustement, contenu: preuveAjustement });
      if (erreurSource) throw erreurSource;
      const { error: erreurSuivi } = await admin.rpc("appliquer_outil_suivi_anam", {
        p_utilisatrice_id: userId, p_cle_tour: cleAjustement, p_revision: 3,
        p_commande: {
          type: "ajuster", preuve: preuveAjustement,
          cap: "Retrouver une place pour ce qui me ressource au milieu des journées chargées",
          synthese: "Tu souhaites commencer simplement : repérer un moment qui te fait du bien, le garder possible dans ta journée, puis en reparler sans obligation de résultat.",
          etapes: [
            { titre: TITRE_ETAPE_RECONNUE, pratiqueId: null },
            { titre: "Prendre une pause et observer ce qui change, même légèrement", pratiqueId: "pause-attention" },
            { titre: "Identifier une ressource que je pourrais retrouver dans une journée chargée", pratiqueId: "valeur-petit-pas" },
          ],
        },
      });
      if (erreurSuivi) throw erreurSuivi;
      const { data: suiviSeme, error: erreurLecture } = await admin.from("suivi_anam").select("etapes").eq("utilisatrice_id", userId).single();
      if (erreurLecture) throw erreurLecture;
      const cleAvancement = `parcours-e2e-${randomUUID()}`;
      const preuveAvancement = "Marcher dehors me ressource et je peux garder une pause pour cela";
      const { error: erreurSourceAvancement } = await admin.from("entree_journal").insert({ utilisatrice_id: userId, role: "utilisatrice", cle_tour: cleAvancement, contenu: preuveAvancement });
      if (erreurSourceAvancement) throw erreurSourceAvancement;
      const { error: erreurEvenement } = await admin.rpc("appliquer_outil_suivi_anam", {
        p_utilisatrice_id: userId, p_cle_tour: cleAvancement, p_revision: 4,
        p_commande: { type: "avancer", etapeId: suiviSeme.etapes[0].id, preuve: preuveAvancement, bilan: "Tu as pu nommer une ressource et dire comment elle peut trouver sa place dans ton quotidien." },
      });
      if (erreurEvenement) throw erreurEvenement;
      await page.reload();
      await expect(page.getByRole("heading", { name: TITRE_ETAPE_RECONNUE })).toBeVisible();
      await captures(page, testInfo, "parcours-dense");
      await page.route("**/api/anam/suivi", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "indisponible" }) }));
      await page.getByRole("button", { name: "Mettre mon parcours en pause" }).click();
      await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
      await captures(page, testInfo, "parcours-erreur-action");
      await page.unroute("**/api/anam/suivi");
      await page.getByRole("button", { name: "Mettre mon parcours en pause" }).click();
      await expect(page.getByText("En pause, à ta demande")).toBeVisible();
      await page.getByRole("button", { name: "Reprendre mon parcours" }).click();
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
      await page.getByRole("link", { name: `Ouvrir : ${PRATIQUE_ATTENTION.titre}` }).click();
      await expect(page).toHaveURL(/\/pratiques\/pause-attention$/);
      await expect(page.getByRole("heading", { level: 1, name: PRATIQUE_ATTENTION.titre })).toBeVisible();
      await page.goto("/parcours");

      const envois: string[] = [];
      page.on("request", (request) => {
        if (request.method() === "POST" && new URL(request.url()).pathname === "/api/anam/message") envois.push(request.postData() ?? "");
      });
      await page.getByRole("link", { name: "Faire le point avec Anam" }).click();
      await attendreLePortail(page);
      const champ = page.getByRole("textbox", { name: /ton message à anam/i });
      await expect(champ).toBeVisible();
      await expect(champ).not.toHaveValue("");
      expect(await champ.inputValue()).not.toContain(repere);
      expect(envois).toEqual([]);
      expect(erreurs).toEqual([]);
    } finally {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  });

  test("une action reçue dans le chat donne accès au parcours", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const compte = await ouvrirUnCompteNeuf(page);
    const userId = await idPour(compte.adresse);
    try {
      await entrerDansLaRegion(page, "Anam");
      // Le transport du chat est simulé ; la preuve de mutation SQL est le cas précédent.
      const demandes: string[] = [];
      await page.route("**/api/anam/message", async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        demandes.push(route.request().postData() ?? "");
        const trames = [{ t: "delta", c: "Nous pouvons garder ce cap et le reprendre à ton rythme." }, { t: "parcours", action: "ajuster" }, { t: "fin" }];
        await route.fulfill({ status: 200, contentType: "application/x-ndjson", body: `${trames.map((t) => JSON.stringify(t)).join("\n")}\n` });
      });
      const champ = page.getByRole("textbox", { name: /ton message à anam/i });
      await champ.fill("Je souhaite poser un premier cap et garder quelques prochains pas.");
      await page.getByRole("button", { name: /envoyer/i }).click();
      const carte = page.getByRole("complementary", { name: "Parcours enregistré" });
      await expect(carte).toBeVisible();
      await expect(carte.getByRole("link", { name: "Voir mon parcours" })).toHaveAttribute("href", "/parcours?de=anam");
      expect(demandes).toHaveLength(1);
      await champ.blur();
      for (const largeur of [390, 768, 1440]) {
        await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 1000 });
        await carte.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`carte-parcours-transport-simule-${largeur}.png`), fullPage: true });
      }
      await carte.getByRole("link", { name: "Voir mon parcours" }).click();
      await expect(page).toHaveURL(/\/parcours\?de=anam$/);
      await expect(page.getByRole("heading", { name: "Mon parcours", exact: true })).toBeVisible();
    } finally {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  });

  test("compare les modifications de deux onglets avant de sauvegarder", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const compte = await ouvrirUnCompteNeuf(page);
    const userId = await idPour(compte.adresse);
    const autreOnglet = await page.context().newPage();
    const capSansEspaces = "Ressource".repeat(18).slice(0, 160);
    const premierRepere = "Mes priorités initiales";
    const brouillon = "Mon prochain pas écrit dans le premier onglet";
    const ressourceConcurrente = "Une nouvelle ressource ajoutée dans le second onglet";
    try {
      const cleTour = `parcours-comparaison-${randomUUID()}`;
      const preuve = "Je souhaite explorer ce qui me ressource";
      const { error: sourceError } = await admin.from("entree_journal").insert({ utilisatrice_id: userId, role: "utilisatrice", cle_tour: cleTour, contenu: preuve });
      if (sourceError) throw sourceError;
      const { error: outilError } = await admin.rpc("appliquer_outil_suivi_anam", {
        p_utilisatrice_id: userId, p_cle_tour: cleTour, p_revision: 0,
        p_commande: { type: "ajuster", cap: capSansEspaces, synthese: "Un contenu synthétique pour vérifier un titre à sa longueur maximale.", etapes: [{ titre: "Repérer un moment pour moi", pratiqueId: null }], preuve },
      });
      if (outilError) throw outilError;
      await page.goto("/parcours");
      await page.getByRole("button", { name: "Ajouter mes repères" }).click();
      await page.getByRole("textbox", { name: "Ce qui compte pour moi" }).fill(premierRepere);
      await page.getByRole("textbox", { name: "Ce qui m’aide" }).fill("Marcher dehors");
      await page.getByRole("button", { name: "Enregistrer mes repères" }).click();
      await expect(page.getByRole("button", { name: "Modifier mes repères" })).toBeVisible();
      await page.getByRole("button", { name: "Modifier mes repères" }).click();
      await page.getByRole("textbox", { name: "Ce qui compte pour moi" }).fill(brouillon);

      await autreOnglet.goto("/parcours");
      await autreOnglet.getByRole("button", { name: "Modifier mes repères" }).click();
      await autreOnglet.getByRole("textbox", { name: "Ce qui m’aide" }).fill(ressourceConcurrente);
      await autreOnglet.getByRole("button", { name: "Enregistrer mes repères" }).click();
      await expect(autreOnglet.getByRole("button", { name: "Modifier mes repères" })).toBeVisible();

      await page.getByRole("button", { name: "Enregistrer mes repères" }).click();
      await expect(page.getByRole("button", { name: "Actualiser la version enregistrée" })).toBeVisible();
      await page.getByRole("button", { name: "Actualiser la version enregistrée" }).click();
      await expect(page.getByText(ressourceConcurrente, { exact: true })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Ce qui compte pour moi" })).toHaveValue(brouillon);
      await expect(page.getByRole("button", { name: "Enregistrer mes repères" })).toBeDisabled();
      await expect(page.getByRole("heading", { name: capSansEspaces })).toBeVisible();
      await captures(page, testInfo, "parcours-comparaison");
      const titreCompte = "Ce qui compte pour moi";
      const titreAide = "Ce qui m’aide";
      await page.getByRole("button", { name: `Garder mon brouillon : ${titreCompte}` }).click();
      await expect(page.getByRole("button", { name: "Enregistrer mes repères" })).toBeDisabled();
      await page.getByRole("button", { name: `Reprendre la version enregistrée : ${titreAide}` }).click();
      await page.getByRole("button", { name: "Enregistrer mes repères" }).click();
      await expect(page.getByRole("button", { name: "Modifier mes repères" })).toBeVisible();
      await page.reload();
      await expect(page.getByText(brouillon, { exact: true })).toBeVisible();
      await expect(page.getByText(ressourceConcurrente, { exact: true })).toBeVisible();
    } finally {
      await autreOnglet.close();
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  });
});
