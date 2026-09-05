import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * e2e-libelles-vivants.test.ts — AUCUN LIBELLÉ CHERCHÉ PAR LA SUITE NAVIGATEUR N'EST MORT.
 *
 * ══ LE DÉFAUT QUE CE FICHIER EXISTE POUR RENDRE IMPOSSIBLE ══════════════════════════════════════
 *
 * Le 2026-08-28, le bouton de `/entrer` est passé de « Recevoir mon lien » à « Me reconnecter par
 * e-mail ». Six endroits de `e2e/` le cherchaient sous l'ancien nom, écrit à la main. Deux jours
 * plus tôt, la sortie rapide de `/aide` avait fait le même chemin (« Quitter ce site » → « Sortie
 * rapide »), et `clavier.spec.ts` cherchait encore l'ancien.
 *
 * Résultat mesuré sur le passage du 2026-09-04 : **92 des 104 tests en échec**, dont 90 sur un seul
 * locator mort. Chacun a coûté 45 secondes de silence — `playwright.config.ts` ne bornait pas les
 * actions, donc un `click()` sur un locator vide attendait le plafond du TEST. L'étape est passée
 * de 14 minutes à 69, et le journal n'a rien dit d'autre que « Test timeout of 45000ms exceeded ».
 * Huit jours de rouge, zéro information.
 *
 * ⚠️ CE TEST EST DANS LE PROJET `node`, PAS DANS LA SUITE NAVIGATEUR — et c'est tout son intérêt.
 * Il tourne dans `quality`, en quelques millisecondes, sans navigateur, sans Supabase, sans Docker.
 * Le renommage aurait rougi ICI, à la seconde, sur la machine de celui qui renommait — au lieu de
 * partir se perdre dans un travail de CI d'une heure que personne ne lit jusqu'au bout.
 *
 * ══ CE QU'IL VÉRIFIE, ET CE QU'IL NE PEUT PAS VÉRIFIER ═════════════════════════════════════════
 *
 * Il extrait de `e2e/` chaque nom accessible cherché **écrit à la main** — une chaîne ou une
 * expression régulière littérale passée à `getByRole({ name })`, `getByLabel`, `getByText`,
 * `getByPlaceholder`, `getByTitle` — et exige que ce texte se retrouve quelque part dans la source
 * du produit.
 *
 * Il ne vérifie PAS que le libellé est au bon endroit, ni sur le bon écran : trouver « Continuer »
 * dans le produit ne prouve pas qu'il est sur la page visée. Ce test répond à UNE question, celle
 * qui a coûté huit jours : **ce mot existe-t-il encore ?**
 *
 * ⚠️ LE VRAI REMÈDE EST EN AMONT, ET IL EST DÉJÀ APPLIQUÉ POUR LA PORTE. `e2e/_porte.ts` construit
 * ses locators à partir de `lib/domain/copie-entree.ts`, le module que rend le formulaire : là, un
 * renommage ne peut plus dériver du tout, puisqu'il n'y a qu'une source. Ce test-ci est le filet
 * pour tout ce qui n'est pas encore passé par ce chemin — et le compteur ci-dessous dit combien il
 * en reste.
 */

const RACINE = resolve(process.cwd());

function fichiers(dossier: string, extensions: readonly string[]): string[] {
  const trouves: string[] = [];
  const parcourir = (chemin: string) => {
    for (const entree of readdirSync(chemin, { withFileTypes: true })) {
      if (entree.name === "node_modules" || entree.name.startsWith(".")) continue;
      const complet = join(chemin, entree.name);
      if (entree.isDirectory()) parcourir(complet);
      else if (extensions.some((e) => entree.name.endsWith(e))) trouves.push(complet);
    }
  };
  parcourir(resolve(RACINE, dossier));
  return trouves;
}

/**
 * La source du PRODUIT — ce que quelqu'un peut lire à l'écran.
 *
 * `lib/domain/` y est parce que c'est là que vivent les modules `copie-*.ts` : depuis la refonte
 * du 2026-09-03, un libellé bien rangé n'est PAS dans le composant qui le rend.
 */
const CORPUS_PRODUIT = [
  ...fichiers("app", [".tsx", ".ts"]),
  ...fichiers("render", [".tsx", ".ts"]),
  ...fichiers("lib/domain", [".ts"]),
]
  .map((f) => readFileSync(f, "utf-8"))
  .join("\n")
  .toLowerCase();

/**
 * Les noms accessibles cherchés à la main dans `e2e/`.
 *
 * On ne relève QUE les littéraux : un locator bâti sur une constante importée (le cas de
 * `_porte.ts`) ne peut pas dériver, il n'a rien à faire ici.
 */
const MOTIFS = [
  // getByRole("button", { name: "…" }) et { name: /…/i }
  /getBy\w+\([^)]*?\bname:\s*(?:"([^"]+)"|\/([^/\n]+)\/[gimsuy]*)/g,
  // getByLabel("…"), getByText(/…/i), getByPlaceholder("…"), getByTitle("…")
  /getBy(?:Label|Text|Placeholder|Title)\(\s*(?:"([^"]+)"|\/([^/\n]+)\/[gimsuy]*)/g,
];

interface Cherche {
  readonly fichier: string;
  readonly texte: string;
  readonly regex: boolean;
}

function nomsCherches(): Cherche[] {
  const trouves: Cherche[] = [];
  for (const chemin of fichiers("e2e", [".ts"])) {
    const source = readFileSync(chemin, "utf-8");
    const relatif = chemin.slice(RACINE.length + 1);
    for (const motif of MOTIFS) {
      motif.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = motif.exec(source)) !== null) {
        const [, chaine, regex] = m;
        if (chaine) trouves.push({ fichier: relatif, texte: chaine, regex: false });
        else if (regex) trouves.push({ fichier: relatif, texte: regex, regex: true });
      }
    }
  }
  return trouves;
}

/**
 * Ce texte se lit-il quelque part dans le produit ?
 *
 * Pour une expression régulière, on ne teste pas l'expression : on teste ses BRANCHES littérales.
 * `/continuer|commencer|suivant/i` demande trois mots dont un seul doit exister — c'est ainsi que
 * la spec l'écrit, et refuser les deux autres serait faux.
 */
function seLitDansLeProduit(cherche: Cherche): boolean {
  const branches = cherche.regex ? cherche.texte.split("|") : [cherche.texte];
  return branches.some((brancheBrute) => {
    // Un motif régulier porte des ancres et des classes qu'aucun libellé ne contient : on ne garde
    // que le texte littéral, et on abandonne s'il n'en reste pas assez pour conclure.
    const litteral = brancheBrute
      .replace(/\\(.)/g, "$1")
      .replace(/[.*+?^${}()[\]\\]/g, " ")
      .trim()
      .toLowerCase();
    if (litteral.length < 3) return true; // trop court pour être concluant : on ne dénonce pas
    return CORPUS_PRODUIT.includes(litteral);
  });
}

/**
 * Les cas que ce test ne peut pas trancher, chacun avec sa raison.
 *
 * ⚠️ CETTE LISTE NE DOIT QUE DÉCROÎTRE, exactement comme `e2e/ligne-de-base.json`. Y ajouter une
 * ligne pour faire passer un commit, c'est rendre la garde décorative. La sortie de secours est
 * l'inverse : faire passer le locator par une constante partagée (`e2e/_porte.ts`), après quoi il
 * n'a plus besoin d'exemption.
 */
const HORS_PORTEE = new Set<string>([
  // Le nom de région est une donnée du parcours, passé en paramètre au helper : le littéral
  // n'existe pas dans `e2e/`, il vient de chaque spec.
  "régions",
]);

describe("[LE CŒUR] la suite navigateur ne cherche aucun libellé mort", () => {
  it("[ANTI-VACUITÉ] le relevé trouve VRAIMENT des locators — sinon ce test est décoratif", () => {
    // ⚠️ SANS CE TÉMOIN, UNE EXPRESSION D'EXTRACTION CASSÉE RENDRAIT LE TEST VERT ET AVEUGLE.
    // C'est le mode de panne le plus probable de ce fichier : un `getBy…` écrit autrement, et le
    // relevé tombe à zéro sans que rien ne le dise.
    const cherches = nomsCherches();
    expect(cherches.length, "aucun locator relevé : l'extraction est cassée").toBeGreaterThan(15);
    expect(
      cherches.some((c) => c.fichier.endsWith("clavier.spec.ts")),
      "le relevé ne couvre pas clavier.spec.ts",
    ).toBe(true);
  });

  it("[LE CŒUR] chaque nom cherché à la main existe encore dans le produit", () => {
    // ⚠️ MUTATION-CIBLE : renommer un libellé dans `app/` sans toucher `e2e/`. C'est EXACTEMENT ce
    // qui est arrivé deux fois en trois jours (2026-08-26 et 2026-08-28) et qui a rendu la suite
    // navigateur muette pendant huit jours. Ici, ça rougit en quelques millisecondes.
    const morts = nomsCherches()
      .filter((c) => !HORS_PORTEE.has(c.texte.toLowerCase()))
      .filter((c) => !seLitDansLeProduit(c))
      .map((c) => `${c.fichier} → ${c.regex ? `/${c.texte}/` : `"${c.texte}"`}`);

    expect(
      [...new Set(morts)],
      "des libellés cherchés par e2e/ n'existent plus dans app/, render/ ou lib/domain/ :\n" +
        "réparez le test (le produit fait foi), ou faites passer le locator par une constante " +
        "partagée comme `e2e/_porte.ts`",
    ).toEqual([]);
  });

  it("la porte d'entrée, elle, ne peut PLUS dériver — ses quatre commandes viennent de la copie", () => {
    // Le vrai remède, et la preuve qu'il est branché : `_porte.ts` importe le module que rend le
    // formulaire, et plus aucun fichier de `e2e/` n'écrit ces libellés à la main.
    const porte = readFileSync(resolve(RACINE, "e2e/_porte.ts"), "utf-8");
    expect(porte).toContain('from "../lib/domain/copie-entree"');
    for (const constante of [
      "ETIQUETTE_ADRESSE",
      "BOUTON_DEMANDER_CODE",
      "ETIQUETTE_CODE",
      "BOUTON_ENTRER_AVEC_CODE",
    ]) {
      expect(porte, `\`${constante}\` n'est plus utilisée par _porte.ts`).toContain(constante);
    }

    const formulaire = readFileSync(
      resolve(RACINE, "app/(auth)/entrer/formulaire-entree.tsx"),
      "utf-8",
    );
    expect(
      formulaire,
      "le formulaire a cessé de lire la copie partagée : la dérive redevient possible",
    ).toContain('from "@/lib/domain/copie-entree"');

    // ⚠️ ON CHERCHE DANS LES LOCATORS RELEVÉS, PAS DANS LE TEXTE DES FICHIERS — et c'est cette
    // garde elle-même qui l'a exigé, à sa première exécution (2026-09-05) : elle dénonçait
    // « le code reçu » dans le message d'étape `palier("saisir le code reçu", …)`, une PROSE qui
    // n'a jamais désigné quoi que ce soit. Une garde qui interdit d'écrire un mot français dans un
    // commentaire ne garde rien, elle appauvrit.
    const litteraux = nomsCherches().map((c) => c.texte.toLowerCase());
    for (const libelle of ["recevoir mon lien", "me reconnecter par e-mail", "code reçu"]) {
      const fautifs = litteraux.filter((l) => l.includes(libelle));
      expect(
        fautifs,
        `« ${libelle} » sert de locator écrit à la main dans e2e/ : il doit venir de _porte.ts`,
      ).toEqual([]);
    }
  });
});
