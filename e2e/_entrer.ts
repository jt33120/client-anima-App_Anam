import type { Page } from "@playwright/test";
import { adresseNeuve, codeDans, courrielPour, viderLaBoite } from "./_boite-aux-lettres";
import { boutonDemanderCode, boutonEntrerAvecCode, champAdresse, champCode } from "./_porte";

/**
 * Ouvrir un compte NEUF et traverser le tunnel — pour que les parcours qui suivent partent d'un
 * état connu, jamais d'un compte qu'un test précédent aurait laissé à moitié rempli.
 *
 * ⚠️ ON PASSE PAR LES VRAIS ÉCRANS, JAMAIS PAR L'ADMIN. Poser la date de naissance et le
 * consentement avec une clé `service_role` irait plus vite et prouverait moins : c'est justement
 * le tunnel qu'on veut voir tenir, et une porte qu'on contourne dans les tests est une porte que
 * personne ne teste.
 */
export type Compte = { readonly adresse: string };

/**
 * Borner une attente ET lui donner un NOM.
 *
 * ⚠️ CE PETIT OUTIL EST LA MOITIÉ DU CORRECTIF DU 2026-09-05, et la plus importante. Le libellé
 * renommé le 2026-08-28 aurait coûté dix secondes et une phrase claire ; il a coûté huit jours de
 * CI illisible, parce que Playwright ne borne QUE les assertions (`expect: { timeout }`) et laisse
 * les ACTIONS attendre sans fin tant qu'`actionTimeout` n'est pas posé. Un test qui meurt sur une
 * action ne rend alors que « Test timeout of 45000ms exceeded. » — sans sélecteur, sans étape.
 *
 * `playwright.config.ts` pose désormais cette borne globale. Celle-ci vient PAR-DESSUS, pour les
 * quatre attentes STRUCTURANTES du tunnel : elle dit lequel des quatre paliers n'a pas été
 * franchi, ce qu'aucun délai global ne peut dire. Le patron vient d'`attendreLePortail`
 * ci-dessous, qui l'appliquait déjà seul depuis le 2026-09-03.
 */
async function palier<T>(quoi: string, promesse: Promise<T>): Promise<T> {
  try {
    return await promesse;
  } catch (e) {
    throw new Error(
      `Le tunnel d'entrée s'est arrêté à « ${quoi} ».\n` +
        `Détail : ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * Demander un code pour cette adresse, et attendre l'écran où le taper.
 *
 * ⚠️ EXPORTÉE POUR QU'IL N'Y AIT QU'UNE COPIE DE CE GESTE. `entree.spec.ts` écrivait les mêmes
 * trois lignes cinq fois ; c'est pour ça que le renommage du 2026-08-28 a cassé SIX endroits au
 * lieu d'un. Cette spec-là garde ses gestes explicites — la porte est son sujet, un helper les
 * cacherait — mais elle prend ses locators à la même source (`_porte.ts`).
 */
export async function demanderUnCode(page: Page, adresse: string): Promise<void> {
  await palier("ouvrir /entrer", page.goto("/entrer"));
  await palier("saisir l'adresse", champAdresse(page).fill(adresse));
  await palier("cliquer le bouton d'envoi du code", boutonDemanderCode(page).click());
  await palier(
    "voir paraître le champ du code",
    champCode(page).waitFor({ state: "visible", timeout: 15_000 }),
  );
}

/**
 * Attendre que le PORTAIL D'ENTRÉE soit parti (2026-09-03).
 *
 * ⚠️ POURQUOI CE HELPER EXISTE, ET POURQUOI IL EST ICI PLUTÔT QUE DANS CHAQUE SPEC. Le portail
 * (`render/portail/`) couvre la scène pendant sa pousse, au lancement et à chaque rafraîchissement.
 * Il ne prend aucun pointeur — un clic le traverse — mais il CACHE : une capture prise pendant sa
 * pousse photographie un arbre qui grandit, pas la scène qu'on voulait mesurer.
 *
 * Le mettre dans les deux portes d'entrée du dossier `e2e/` plutôt que dans dix-sept specs, c'est
 * la même règle que partout : un geste que tout le monde doit faire n'est pas un geste qu'on
 * rappelle à tout le monde.
 *
 * Il est SANS EFFET là où le portail n'existe pas — une halte, un écran d'authentification : un
 * sélecteur jamais attaché est déjà « détaché », et l'attente se résout tout de suite.
 */
export async function attendreLePortail(page: Page): Promise<void> {
  // La borne dépasse le plafond du portail (6 s) plus son fondu (0,7 s) : au-delà, ce n'est plus
  // une pousse qui traîne, c'est un défaut — et le laisser lever ici le DIT, au lieu de le
  // transformer en un échec obscur dans la spec appelante.
  await page
    .locator("[data-portail-anam]")
    .waitFor({ state: "detached", timeout: 10_000 });
}

export async function ouvrirUnCompteNeuf(page: Page): Promise<Compte> {
  const adresse = adresseNeuve("parcours");
  await viderLaBoite();

  await demanderUnCode(page, adresse);

  const code = codeDans((await courrielPour(adresse)).corps);
  await palier("saisir le code reçu", champCode(page).fill(code));
  await palier("valider le code", boutonEntrerAvecCode(page).click());

  // ── La date de naissance (FR-012 : la majorité s'établit ici, elle ne se déclare pas ailleurs)
  await palier("arriver sur /naissance", page.waitForURL(/\/naissance/, { timeout: 20_000 }));
  await page.locator('input[name="prenom"]').fill("Louise");
  await page.locator('input[name="date_naissance"]').fill("1979-09-08");
  await page.getByRole("button", { name: /continuer|commencer|suivant/i }).click();

  // ── Le consentement article 9 — les deux cases, jamais une seule
  await palier("arriver sur /consentement", page.waitForURL(/\/consentement/, { timeout: 20_000 }));
  await page.locator('input[name="art9"]').check();
  await page.locator('input[name="cgu"]').check();
  await page.getByRole("button", { name: /je commence/i }).click();

  await palier(
    "sortir du tunnel vers la scène",
    page.waitForURL((u) => !/\/(naissance|consentement|entrer)/.test(u.pathname), {
      timeout: 20_000,
    }),
  );
  // La scène vient d'apparaître : son portail pousse par-dessus. On le laisse finir.
  await attendreLePortail(page);
  return { adresse };
}

/**
 * Franchir le seuil, puis entrer dans une région par son nom.
 *
 * ⚠️ LE SEUIL N'A PLUS DE CONTOURNEMENT (QA manuelle du 2026-08-19), ET C'EST POURQUOI CE HELPER
 * EXISTE. La barre des trois destinations s'affichait AU SEUIL : elle offrait les trois régions
 * juste sous le bouton censé y mener, ce qui faisait du rideau une décoration. Les parcours qui
 * cliquaient « Anam » depuis le seuil marchaient donc grâce au défaut lui-même. On traverse,
 * comme quelqu'un traverse.
 *
 * La porte est franchie SI ELLE EST LÀ : qui a déjà franchi le seuil arrive directement à
 * l'accueil, et ce helper doit servir dans les deux cas.
 */
export async function entrerDansLaRegion(page: Page, nom: string | RegExp): Promise<void> {
  await attendreLePortail(page);
  const porte = page.getByRole("button", { name: /commencer/i });
  if (await porte.isVisible().catch(() => false)) await porte.click();
  await passerLeTour(page);
  await page.getByRole("navigation", { name: "Régions" }).getByRole("button", { name: nom }).click();
}

/**
 * Fermer le tour guidé s'il s'est ouvert.
 *
 * ⚠️ POURQUOI CE HELPER EXISTE, ET CE QU'IL DIT DU PRODUIT. Le tour s'ouvre TOUT SEUL à la première
 * arrivée dans le monde (retour du 2026-08-20 : « on est lancé dans le grand bain »), et c'est une
 * surimpression BLOQUANTE — la seule du produit, assumée comme telle : on ne peut pas désigner un
 * élément et laisser toucher le reste. Or chaque parcours de cette suite part d'un compte NEUF :
 * ils sont donc tous, sans exception, derrière ce voile au moment où ils franchissent la porte.
 *
 * Douze parcours l'ont découvert en même temps, et c'est le bon endroit pour le régler. Cliquer
 * ailleurs pour contourner le voile mentirait sur ce que voit une vraie personne ; on fait ce
 * qu'elle fait — on ferme le tour. `e2e/guide.spec.ts` est le seul fichier qui ne l'appelle jamais :
 * c'est son sujet.
 */
export async function passerLeTour(page: Page): Promise<void> {
  // ⚠️ ON ATTEND, ON NE SUPPOSE PAS. Un simple `isVisible()` juste après le clic sur la porte
  // interroge l'écran AVANT que l'effet d'ouverture n'ait tourné : le tour n'est pas encore là, on
  // ne le ferme pas, et le clic suivant part dans le voile. Ça passait sur téléphone et échouait
  // sur bureau — c'est-à-dire une course, donc un test qui ment une fois sur deux.
  const passer = page.getByRole("button", { name: /Passer le tour/ });
  await passer.waitFor({ state: "visible", timeout: 1200 }).catch(() => undefined);
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await page.getByRole("dialog").waitFor({ state: "detached" }).catch(() => undefined);
  }
}
