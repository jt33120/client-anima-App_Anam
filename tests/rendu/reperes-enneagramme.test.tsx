import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import IntroductionEnneagramme from "@/app/enneagramme/introduction";
import { reperesPourIntroduction } from "@/lib/corpus/enneagramme";
import {
  LIBELLE_FERMER_REPERES,
  LIBELLE_OUVRIR_REPERES,
  TITRE_FEUILLE_REPERES,
} from "@/lib/domain/enneagramme-items";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";

/**
 * reperes-enneagramme.test.tsx : LA FEUILLE DES NEUF REPÈRES (retour du fondateur, 2026-09-02).
 *
 * « Les tiroirs sont un peu longs. Moins de scroll, plus de pop-up, une app plus dynamique. »
 *
 * L'introduction de l'ennéagramme empilait, avant « Commencer », un `<details>` de neuf `<details>` :
 * une colonne entière à faire défiler. Les neuf textes vivent désormais dans une FEUILLE, ouverte
 * d'un bouton, bâtie sur le patron de `render/menu/MenuCompte.tsx` (`render/Feuille.tsx`).
 *
 * ⚠️ CE QUE CE FICHIER NE PEUT PAS PROUVER. Que la page tienne sans défiler à 390 × 664 est une
 * mesure de mise en page, et jsdom n'en fait aucune : cette preuve vit au navigateur (`e2e/`). Ici
 * on prouve la STRUCTURE et le COMPORTEMENT : ce qui est dans le DOM avant et après le clic, le
 * rôle, le focus, le piège, le retour, et d'où vient chaque mot.
 */

const racine = process.cwd();
const lire = (f: string) => readFileSync(resolve(racine, f), "utf-8");
/** Même retrait que `tests/lexique-voix.test.ts` : une chaîne citée en commentaire n'est pas en dur. */
function sansCommentaires(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const monter = () => render(<IntroductionEnneagramme />);
const porteDe = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent === LIBELLE_OUVRIR_REPERES,
  )!;
const ouvrir = (container: HTMLElement) => {
  const porte = porteDe(container);
  fireEvent.click(porte);
  const feuille = container.querySelector<HTMLElement>("[role='dialog']")!;
  expect(feuille, "aucune feuille après le clic sur la porte").not.toBeNull();
  return { porte, feuille };
};

afterEach(() => cleanup());

describe("[fondateur 2026-09-02] avant le clic : une page courte, sans tiroir", () => {
  it("[LE CŒUR] aucun des neuf textes n'est dans le DOM, et plus aucun `<details>` dans la page", () => {
    // Mutation-cible : rendre les neuf repères dans la page et les cacher en CSS « pour garder le
    // test vert ». Ils seraient alors lus par le lecteur d'écran, dans l'ordre de tabulation, et la
    // colonne serait toujours là pour quiconque désactive le style. Le retour du fondateur vise
    // le DOM, pas un pixel.
    const { container } = monter();
    const reperes = reperesPourIntroduction();
    expect(reperes.length, "témoin : le corpus fournit bien neuf repères").toBe(9);
    for (const repere of reperes) {
      expect(container.textContent, `le repère du type ${repere.type} s'empile encore`).not.toContain(
        repere.texte,
      );
    }
    expect(container.querySelectorAll("details").length, "un tiroir subsiste dans la page").toBe(0);
    expect(container.querySelector("[role='dialog']"), "la feuille est montée avant le clic").toBeNull();
  });

  it("la porte est un bouton nommé, fermé au départ, qui annonce un dialogue", () => {
    // Un `<summary>` ouvrait un tiroir ; un `<button>` ouvre une feuille. `aria-haspopup="dialog"`
    // et `aria-expanded` disent au lecteur d'écran ce qui va se passer, et dans quel état on est.
    const { container } = monter();
    const porte = porteDe(container);
    expect(porte, "la porte « Voir les neuf repères » a disparu").toBeDefined();
    expect(porte.getAttribute("type"), "sans `type`, un bouton soumet le formulaire autour").toBe("button");
    expect(porte.getAttribute("aria-haspopup")).toBe("dialog");
    expect(porte.getAttribute("aria-expanded")).toBe("false");
  });

  it("les trois paragraphes restent, avant la porte", () => {
    // Le retour ne demandait pas de couper la présentation : la méthode, sa limite et l'annonce
    // sont ce qu'on lit AVANT de commencer. Seule la colonne des neuf textes est partie.
    const { container } = monter();
    const paragraphes = [...container.querySelectorAll("section > p")];
    expect(paragraphes.length).toBe(3);
    const porte = porteDe(container);
    expect(
      paragraphes[2].compareDocumentPosition(porte) & Node.DOCUMENT_POSITION_FOLLOWING,
      "la porte précède les paragraphes",
    ).toBeTruthy();
  });
});

describe("[fondateur 2026-09-02] après le clic : la feuille, et les neuf textes du corpus", () => {
  it("[LE CŒUR] un dialogue modal, nommé par son titre, qui porte les NEUF textes du corpus", () => {
    const { container } = monter();
    const { porte, feuille } = ouvrir(container);
    expect(feuille.getAttribute("aria-modal")).toBe("true");
    const id = feuille.getAttribute("aria-labelledby")!;
    expect(id, "aucun `aria-labelledby`").toBeTruthy();
    expect(document.getElementById(id)?.textContent, "le titre ne résout pas").toBe(TITRE_FEUILLE_REPERES);
    expect(porte.getAttribute("aria-expanded")).toBe("true");
    expect(porte.getAttribute("aria-controls")).toBe(feuille.id);

    // ⚠️ LES NEUF, ET CEUX DU CORPUS (FR-054). Un résumé écrit ici « pour faire plus court dans
    // une feuille » serait un texte sans auteur qui aurait l'air d'un texte d'Anima.
    const textes = [...feuille.querySelectorAll("details > p")].map((p) => p.textContent);
    expect(textes).toEqual(reperesPourIntroduction().map((r) => r.texte));
    for (const p of feuille.querySelectorAll("details > p")) {
      expect(p.className, "un texte de corpus se lit dans la voix d'Anima").toContain("t-anam");
    }
  });

  it("[LE CŒUR] à l'ouverture, le focus ENTRE dans la feuille, sur elle-même", () => {
    // Sur la FEUILLE, pas sur « Fermer » : c'est le patron ARIA d'un dialogue, et c'est ce qui fait
    // annoncer le titre avant la première commande.
    const { container } = monter();
    const { feuille } = ouvrir(container);
    expect(document.activeElement, "le focus est resté hors de la feuille").toBe(feuille);
    expect(feuille.getAttribute("tabindex"), "focalisable sans entrer dans la tabulation").toBe("-1");
  });

  it("[UN SEUL TEXTE À LA FOIS] neuf `<details>` qui partagent un `name` : l'accordéon exclusif natif", () => {
    // « Moins de scroll » : ouvrir un repère referme le précédent, sans JavaScript, et neuf
    // résumés fermés tiennent dans la feuille. Les résumés restent « Type 1 » à « Type 9 » : aucun
    // nom de type n'existe, les nommer relève de la voix d'Anima (FR-086).
    const { container } = monter();
    const { feuille } = ouvrir(container);
    const details = [...feuille.querySelectorAll("details")];
    expect(details.length).toBe(9);
    const noms = new Set(details.map((d) => d.getAttribute("name")));
    expect(noms.size, "les neuf tiroirs ne partagent pas un `name` unique").toBe(1);
    expect([...noms][0]).toBeTruthy();
    expect(details.map((d) => d.querySelector("summary")?.textContent)).toEqual(
      reperesPourIntroduction().map((r) => `Type ${r.type}`),
    );
    for (const d of details) expect(d.hasAttribute("open"), "un repère est ouvert d'office").toBe(false);
  });

  it("[EXPERIENCE.md ligne 87] PROFONDEUR MODALE : rien dans la feuille n'ouvre quoi que ce soit", () => {
    // ⚠️ AUCUN `aria-haspopup` À L'INTÉRIEUR : ce serait une seconde feuille en germe, et « modale
    // sur modale » est banni (`EXPERIENCE.md` ligne 200). Le seul bouton est celui qui ferme.
    const { container } = monter();
    const { feuille } = ouvrir(container);
    expect(feuille.querySelectorAll("[aria-haspopup]").length).toBe(0);
    expect(feuille.querySelectorAll("[role='dialog']").length, "un dialogue dans le dialogue").toBe(0);
    const boutons = [...feuille.querySelectorAll("button")];
    expect(boutons.length, "un seul bouton dans la feuille : celui qui ferme").toBe(1);
    expect(boutons[0].textContent).toBe(LIBELLE_FERMER_REPERES);
  });

  it("[FR-031] rien dans la feuille ne compte quoi que ce soit", () => {
    // « Type 4 » est admis (c'est un nom, pas un compte) ; « 4 sur 9 », une jauge, un pourcentage
    // ne le sont pas.
    const { container } = monter();
    const { feuille } = ouvrir(container);
    const texte = feuille.textContent ?? "";
    for (const tournure of [/\d+\s*(?:sur|\/)\s*\d+/, /%/, /\bétapes?\b/i]) {
      expect(texte, `tournure de compte dans la feuille : ${tournure}`).not.toMatch(tournure);
    }
    expect(feuille.querySelectorAll("progress, meter, [role='progressbar']").length).toBe(0);
  });
});

describe("[fondateur 2026-09-02] la fermeture, et le focus rendu", () => {
  it("[LE CŒUR] Échap ferme, et le focus REVIENT à la porte", () => {
    // Sans ce retour, fermer au clavier renvoie le focus au `<body>` : la tabulation suivante
    // repart du tout début de la page, et on perd sa place sans comprendre pourquoi
    // (`EXPERIENCE.md` ligne 216). Mutation éprouvée : retirer `declencheur.current?.focus()` de
    // `render/Feuille.tsx` rend cette ligne rouge.
    const { container } = monter();
    const { porte } = ouvrir(container);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(container.querySelector("[role='dialog']")).toBeNull();
    expect(porte.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(porte);
  });

  it("le bouton nommé ferme aussi, et rend le focus", () => {
    const { container } = monter();
    const { porte, feuille } = ouvrir(container);
    fireEvent.click(feuille.querySelector("button")!);
    expect(container.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(porte);
  });

  it("le fond ferme au toucher, et rend le focus", () => {
    // Un panneau qu'on ne peut fermer qu'en visant un petit bouton est un panneau dont on se sent
    // prisonnier. Le fond est décoratif (`aria-hidden`) : la fermeture accessible reste Échap.
    const { container } = monter();
    const { porte, feuille } = ouvrir(container);
    const fond = feuille.previousElementSibling as HTMLElement;
    expect(fond.getAttribute("aria-hidden")).not.toBeNull();
    fireEvent.click(fond);
    expect(container.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(porte);
  });

  it("[AUCUNE FERMETURE AUTOMATIQUE] la feuille reste tant qu'on ne la ferme pas", async () => {
    // `EXPERIENCE.md` ligne 218 : aucune limite de temps, aucune feuille qui se ferme seule. Un
    // clic dans la feuille, une frappe quelconque, un repère ouvert : rien de tout cela ne ferme.
    const { container } = monter();
    const { feuille } = ouvrir(container);
    fireEvent.click(feuille);
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.click(feuille.querySelector("summary")!);
    await new Promise((r) => setTimeout(r, 20));
    expect(container.querySelector("[role='dialog']")).toBe(feuille);
  });

  it("[PIÈGE À FOCUS BORNÉ] Tab depuis le dernier élément revient au premier", () => {
    // ⚠️ LE DERNIER FOCUSABLE EST UN `<summary>`, PAS UN BOUTON. Un piège qui ne compterait que
    // `a, button` (celui du menu) laisserait la tabulation sortir de la feuille dès le neuvième
    // repère, derrière un panneau visible.
    const { container } = monter();
    const { feuille } = ouvrir(container);
    const focusables = [...feuille.querySelectorAll<HTMLElement>("button, summary")];
    expect(focusables.length).toBe(10);
    const dernier = focusables[focusables.length - 1];
    expect(dernier.tagName).toBe("SUMMARY");
    dernier.focus();
    expect(document.activeElement, "témoin : jsdom sait focaliser un `<summary>`").toBe(dernier);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(focusables[0]);
    expect(focusables[0].textContent).toBe(LIBELLE_FERMER_REPERES);
  });

  it("[PIÈGE À FOCUS BORNÉ] Shift+Tab depuis la feuille initiale va au dernier élément", () => {
    const { container } = monter();
    const { feuille } = ouvrir(container);
    const focusables = [...feuille.querySelectorAll<HTMLElement>("button, summary")];
    expect(document.activeElement).toBe(feuille);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });
});

describe("[ANTI-VACUITÉ] chaque mot de la feuille vient de la copie domaine", () => {
  const SOURCES = ["app/enneagramme/introduction.tsx", "app/enneagramme/reperes.tsx", "render/Feuille.tsx"];

  it("[LE CŒUR] ni le titre, ni « Fermer », ni la porte ne sont écrits en dur dans app/ ou render/", () => {
    // Un libellé en dur dans un composant échappe au contrôle de voix (`tests/lexique-voix.test.ts`
    // balaie `lib/` avec `app/` et `render/`, mais une chaîne recopiée devient une divergence en
    // attente : la 6.5b l'a payé sur les libellés de signes). `sansCommentaires` : une citation en
    // commentaire n'est pas une chaîne affichée.
    for (const f of SOURCES) {
      const src = sansCommentaires(lire(f));
      for (const libelle of [TITRE_FEUILLE_REPERES, LIBELLE_FERMER_REPERES, LIBELLE_OUVRIR_REPERES]) {
        expect(src, `« ${libelle} » est en dur dans ${f}`).not.toContain(`"${libelle}"`);
        expect(src, `« ${libelle} » est en dur dans ${f}`).not.toContain(`>${libelle}<`);
      }
    }
  });

  it("[CONTRÔLE DU CONTRÔLE] les constantes sont bien celles qui paraissent à l'écran", () => {
    // Sans ce témoin, la garde ci-dessus serait verte si les composants affichaient d'AUTRES mots
    // que ceux du domaine : elle ne prouverait que l'absence des chaînes, pas leur provenance.
    const { container } = monter();
    expect(porteDe(container).textContent).toBe(LIBELLE_OUVRIR_REPERES);
    const { feuille } = ouvrir(container);
    expect(document.getElementById(feuille.getAttribute("aria-labelledby")!)?.textContent).toBe(
      TITRE_FEUILLE_REPERES,
    );
    expect(feuille.querySelector("button")?.textContent).toBe(LIBELLE_FERMER_REPERES);
  });

  it("[voix] les trois libellés passent les contrôles : lexique, prédiction, typographie, aucun impératif", () => {
    for (const libelle of [TITRE_FEUILLE_REPERES, LIBELLE_FERMER_REPERES, LIBELLE_OUVRIR_REPERES]) {
      expect(chercherInterdits(libelle), `lexique interdit dans « ${libelle} »`).toEqual([]);
      expect(chercherPredictions(libelle), `prédiction dans « ${libelle} »`).toEqual([]);
      expect(libelle, "apostrophe droite ou tiret cadratin").not.toMatch(/[a-zà-ÿ]'[a-zà-ÿ]|[—–]/i);
      expect(libelle, "une porte se nomme, elle ne commande pas").not.toMatch(
        /^(Fais|Passe|Va|Clique|Ouvre|Ferme|Regarde|Lis)\b/,
      );
    }
  });

  it("[FR-031] aucun compte dans les libellés de la feuille", () => {
    // « Neuf » écrit en lettres nomme un ensemble fini, comme « les quatre régions » ; un chiffre
    // serait un compteur. Mutation-cible : « Voir les 9 repères ».
    for (const libelle of [TITRE_FEUILLE_REPERES, LIBELLE_FERMER_REPERES, LIBELLE_OUVRIR_REPERES]) {
      expect(libelle).not.toMatch(/\d/);
    }
  });
});
