import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { act, render, cleanup, fireEvent, waitFor } from "@testing-library/react";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

import MenuCompte from "@/render/menu/MenuCompte";
import Surimpression from "@/render/surimpression";
import { surimpressionPour } from "@/lib/scene";
import {
  ENTREES_MENU,
  GROUPES_MENU,
  LIBELLE_GLYPHE,
  TITRE_FEUILLE,
  LIBELLE_FERMER,
} from "@/lib/domain/menu-compte";

/**
 * menu-compte-rendu.test.tsx — [7.3] LE GLYPHE, LA FEUILLE, ET CE QUI NE DOIT PAS BOUGER.
 *
 * ⚠️ CE QUE CE FICHIER NE PEUT PAS PROUVER. Le défaut d'origine est GÉOMÉTRIQUE — « Profil » à
 * x = 143→191 sur 390 px, c'est-à-dire au centre horizontal de l'écran — et jsdom n'a pas de moteur
 * de mise en page : il ne mesure rien. La preuve de position vit dans `e2e/`, au navigateur. Ici on
 * prouve la STRUCTURE : ce qui est rendu, dans quel ordre, avec quels attributs, et ce qui reste
 * hors du menu.
 */

/**
 * ⚠️ `lienVers` EST L'IDENTITÉ ICI, ET C'EST DÉLIBÉRÉ. Ce fichier éprouve la FEUILLE : ses entrées,
 * son ordre, son focus, ses refus. Emporter la région d'où l'on vient (Story 7.13) est le sujet de
 * `tests/retour-scene.test.ts`, qui l'éprouve sur la fonction elle-même. Mélanger les deux ferait
 * de chaque `href` attendu ici une chaîne à recalculer, pour ne rien prouver de plus.
 */
const COPIE = {
  lienVers: (url: string) => url,
  groupes: GROUPES_MENU,
  libelleGlyphe: LIBELLE_GLYPHE,
  titreFeuille: TITRE_FEUILLE,
  libelleFermer: LIBELLE_FERMER,
};

const menuSeul = () => render(<MenuCompte {...COPIE} />);

beforeEach(() => {
  navigation.pathname = "/";
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("[7.3] le glyphe", () => {
  it("[LE CŒUR] il porte un nom accessible, un état d'ouverture, et il est fermé au départ", () => {
    // ⚠️ UN PICTOGRAMME SANS NOM ACCESSIBLE casse la porte pour le lecteur d'écran, la recherche
    // vocale et la tabulation, sans qu'aucun pixel ne change. C'est la leçon du « ? » du 2026-08-23.
    const { container } = menuSeul();
    const bouton = container.querySelector("button")!;
    expect(bouton.getAttribute("aria-label")).toBe(LIBELLE_GLYPHE);
    expect(bouton.getAttribute("aria-expanded")).toBe("false");
    expect(bouton.getAttribute("aria-haspopup")).toBe("dialog");
    expect(bouton.getAttribute("type"), "sans `type`, un bouton soumet le formulaire autour").toBe("button");
  });

  it("le dessin est décoratif — c'est `aria-label` qui nomme, jamais le SVG", () => {
    const { container } = menuSeul();
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).not.toBeNull();
    expect(svg.getAttribute("focusable")).toBe("false");
  });

  it("aucune feuille n'est dans le DOM tant qu'on n'a pas ouvert", () => {
    // Mutation-cible : rendre la feuille en permanence et la cacher en CSS. Elle serait alors dans
    // l'ordre de tabulation, derrière un panneau invisible — le piège à focus le plus courant.
    expect(menuSeul().container.querySelector("[role='dialog']")).toBeNull();
  });
});

describe("[7.3] la feuille", () => {
  it("[LE CŒUR] elle liste les NEUF entrées, dans l'ordre du catalogue", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const liens = [...container.querySelectorAll("[role='dialog'] a")];
    expect(liens.length).toBe(ENTREES_MENU.length);
    expect(liens.map((a) => a.getAttribute("href"))).toEqual(ENTREES_MENU.map((e) => e.url));
  });

  it("[LE CŒUR] rend les quatre familles sans mélanger exploration et administration", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const titres = [...container.querySelectorAll("[role='dialog'] nav h3")].map(
      (titre) => titre.textContent,
    );
    expect(titres).toEqual(["Aide", "Explorer", "Compte", "Confidentialité"]);

    const groupes = [...container.querySelectorAll("[role='dialog'] nav section")];
    expect(groupes[1].querySelector("a[href='/socle']")).not.toBeNull();
    expect(groupes[1].querySelector("a[href='/abonnement']")).toBeNull();
    expect(groupes[2].querySelector("a[href='/abonnement']")).not.toBeNull();
    expect(groupes[3].querySelector("a[href='/mes-donnees']")).not.toBeNull();
  });

  it("[FR-077] « Aide et ressources » est le PREMIER lien de la feuille", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const premier = container.querySelector("[role='dialog'] a")!;
    expect(premier.getAttribute("href")).toBe("/aide");
  });

  it("chaque entrée dit brièvement ce qu'il y a derrière — jamais une ligne sèche ni un paragraphe", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    for (const a of container.querySelectorAll("[role='dialog'] a")) {
      const texte = a.textContent ?? "";
      expect(texte.length, `entrée sans phrase : ${a.getAttribute("href")}`).toBeGreaterThan(30);
      expect(texte.length, `entrée redevenue trop dense : ${a.getAttribute("href")}`).toBeLessThan(90);
    }
  });

  it("accuse réception immédiatement et nomme la destination pendant la navigation", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const lien = container.querySelector<HTMLAnchorElement>("a[href='/socle']")!;
    fireEvent.click(lien);
    expect(lien.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector("[role='status']")?.textContent).toContain("Ton socle");
    expect(container.querySelector("[role='dialog']")?.getAttribute("aria-busy")).toBe("true");
  });

  it("verrouille les activations normales suivantes pendant la première navigation", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const socle = container.querySelector<HTMLAnchorElement>("a[href='/socle']")!;
    const abonnement = container.querySelector<HTMLAnchorElement>("a[href='/abonnement']")!;

    fireEvent.click(socle);
    expect(abonnement.getAttribute("aria-disabled")).toBe("true");
    expect(fireEvent.click(abonnement), "le deuxième clic doit être annulé").toBe(false);
    expect(container.querySelector("[role='status']")?.textContent).toContain("Ton socle");
    expect(container.querySelector("[role='status']")?.textContent).not.toContain("abonnement");
  });

  it("Échap, fermer, le fond et le glyphe ne réarment pas les destinations pendant la route", () => {
    const { container } = menuSeul();
    const glyphe = container.querySelector<HTMLButtonElement>("button[aria-haspopup='dialog']")!;
    fireEvent.click(glyphe);
    const socle = container.querySelector<HTMLAnchorElement>("a[href='/socle']")!;
    fireEvent.click(socle);

    const dialogue = container.querySelector<HTMLElement>("[role='dialog']")!;
    const fermer = dialogue.querySelector<HTMLButtonElement>("button")!;
    const fond = dialogue.previousElementSibling as HTMLElement;
    expect(fermer.disabled).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(fermer);
    fireEvent.click(fond);
    fireEvent.click(glyphe);

    expect(container.querySelector("[role='dialog']")).toBe(dialogue);
    expect(glyphe.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector("[role='status']")?.textContent).toContain("Ton socle");
    const abonnement = container.querySelector<HTMLAnchorElement>("a[href='/abonnement']")!;
    expect(fireEvent.click(abonnement), "la fermeture ne doit pas avoir libéré le second lien").toBe(false);
    expect(container.querySelector("[role='status']")?.textContent).not.toContain("abonnement");
  });

  it("réarme la feuille si la navigation n'a produit aucun changement de route", () => {
    vi.useFakeTimers();
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button[aria-haspopup='dialog']")!);
    const socle = container.querySelector<HTMLAnchorElement>("a[href='/socle']")!;
    const abonnement = container.querySelector<HTMLAnchorElement>("a[href='/abonnement']")!;
    const fermer = container.querySelector<HTMLButtonElement>("[role='dialog'] button")!;

    fireEvent.click(socle);
    expect(fermer.disabled).toBe(true);
    expect(abonnement.getAttribute("aria-disabled")).toBe("true");

    act(() => vi.advanceTimersByTime(10_000));

    expect(fermer.disabled).toBe(false);
    expect(abonnement.getAttribute("aria-disabled")).toBeNull();
    expect(container.querySelector("[role='dialog']")?.getAttribute("aria-busy")).toBe("false");
    fireEvent.click(fermer);
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("acquitte et ferme l'attente dès que le pathname change", async () => {
    const vue = menuSeul();
    const glyphe = vue.container.querySelector<HTMLButtonElement>("button[aria-haspopup='dialog']")!;
    fireEvent.click(glyphe);
    fireEvent.click(vue.container.querySelector<HTMLAnchorElement>("a[href='/socle']")!);
    expect(vue.container.querySelector("[role='dialog']")?.getAttribute("aria-busy")).toBe("true");

    navigation.pathname = "/socle";
    vue.rerender(<MenuCompte {...COPIE} />);

    await waitFor(() => expect(vue.container.querySelector("[role='dialog']")).toBeNull());
    expect(glyphe.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(glyphe);
    expect(vue.container.querySelector("[role='dialog'] a")?.getAttribute("aria-disabled")).toBeNull();
  });

  it("elle est un dialogue modal, nommé par son titre", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const feuille = container.querySelector("[role='dialog']")!;
    expect(feuille.getAttribute("aria-modal")).toBe("true");
    const id = feuille.getAttribute("aria-labelledby")!;
    expect(container.querySelector(`#${CSS.escape(id)}`)?.textContent).toBe(TITRE_FEUILLE);
  });

  it("[EXPERIENCE.md ligne 87] PROFONDEUR MODALE : un niveau, jamais deux", () => {
    // ⚠️ AUCUN BOUTON N'OUVRE QUOI QUE CE SOIT DEPUIS LA FEUILLE. Le seul bouton autorisé est celui
    // qui la ferme. Un `aria-haspopup` à l'intérieur serait une seconde feuille en germe.
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const feuille = container.querySelector("[role='dialog']")!;
    expect(feuille.querySelectorAll("[aria-haspopup]").length).toBe(0);
    const boutons = [...feuille.querySelectorAll("button")];
    expect(boutons.length, "un seul bouton dans la feuille : celui qui ferme").toBe(1);
    expect(boutons[0].textContent).toBe(LIBELLE_FERMER);
  });

  it("[FR-031 DUR] rien dans la feuille ne compte quoi que ce soit", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const texte = (container.querySelector("[role='dialog']")?.textContent ?? "").toLowerCase();
    for (const tournure of [/\d+\s*(?:sur|\/)\s*\d+/, /%/, /\bnouveau\b/, /non lus?/]) {
      expect(texte, `tournure d'état dans la feuille : ${tournure}`).not.toMatch(tournure);
    }
    expect(container.querySelectorAll("[role='dialog'] progress, [role='dialog'] meter").length).toBe(0);
  });
});

describe("[7.3] l'ouverture, la fermeture, et le focus", () => {
  it("[LE CŒUR] `aria-expanded` suit l'état réel, dans les deux sens", () => {
    const { container } = menuSeul();
    const bouton = container.querySelector("button")!;
    fireEvent.click(bouton);
    expect(bouton.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(bouton);
    expect(bouton.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("[LE CŒUR] à l'ouverture, le focus ENTRE dans la feuille", () => {
    // Sur la FEUILLE, pas sur son premier lien : c'est le patron ARIA d'un dialogue, et c'est ce
    // qui fait annoncer le titre avant la première entrée. Poser le focus sur le premier élément
    // focusable aurait fait entendre « Fermer » à l'ouverture d'un menu.
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const feuille = container.querySelector("[role='dialog']");
    expect(document.activeElement, "le focus est resté hors de la feuille").toBe(feuille);
    expect(feuille!.getAttribute("tabindex"), "focalisable sans entrer dans la tabulation").toBe("-1");
  });

  it("[LE CŒUR] Échap ferme, et le focus REVIENT au glyphe", () => {
    // Sans ce retour, fermer au clavier renvoie le focus au `<body>` : la tabulation suivante
    // repart du tout début de la page, et on perd sa place sans comprendre pourquoi.
    const { container } = menuSeul();
    const bouton = container.querySelector("button")!;
    fireEvent.click(bouton);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(container.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(bouton);
  });

  it("le bouton nommé ferme aussi, et rend le focus", () => {
    const { container } = menuSeul();
    const bouton = container.querySelector("button")!;
    fireEvent.click(bouton);
    const fermer = [...container.querySelectorAll("[role='dialog'] button")][0];
    fireEvent.click(fermer);
    expect(container.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(bouton);
  });

  it("[PIÈGE À FOCUS BORNÉ] Tab depuis le dernier élément revient au premier", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const focusables = [...container.querySelectorAll<HTMLElement>("[role='dialog'] a, [role='dialog'] button")];
    expect(focusables.length).toBeGreaterThan(2);
    focusables[focusables.length - 1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(focusables[0]);
  });

  it("[PIÈGE À FOCUS BORNÉ] Shift+Tab depuis la feuille initiale va au dernier élément", () => {
    const { container } = menuSeul();
    fireEvent.click(container.querySelector("button")!);
    const feuille = container.querySelector<HTMLElement>("[role='dialog']")!;
    const focusables = [...feuille.querySelectorAll<HTMLElement>("a, button")];
    expect(document.activeElement).toBe(feuille);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });
});

describe("[7.3] le glissement entre régions s'arrête à la feuille", () => {
  it("[LE CŒUR] les événements de pointeur NE REMONTENT PAS au parent", () => {
    // ⚠️ CE DÉFAUT N'APPARAÎT DANS AUCUN AUTRE TEST, et il est désagréable : `render/scene-dom.tsx`
    // pose `onPointerDown/Move/Up` sur `<main>` pour passer d'une région à l'autre au doigt. Sans
    // barrage, parcourir la feuille au doigt fait GLISSER la scène derrière elle — on referme le
    // menu et on n'est plus au même endroit, sans avoir rien demandé.
    const vus: string[] = [];
    const { container } = render(
      <div
        onPointerDown={() => vus.push("down")}
        onPointerMove={() => vus.push("move")}
        onPointerUp={() => vus.push("up")}
      >
        <MenuCompte {...COPIE} />
      </div>,
    );
    fireEvent.click(container.querySelector("button")!);
    const feuille = container.querySelector("[role='dialog']")!;
    fireEvent.pointerDown(feuille);
    fireEvent.pointerMove(feuille);
    fireEvent.pointerUp(feuille);
    expect(vus, "le glissement de région a reçu les gestes faits DANS le menu").toEqual([]);
  });

  it("[CONTRÔLE DU CONTRÔLE] le parent recevrait bien ces gestes sans le barrage", () => {
    // Sans ce témoin, le test précédent serait vert si `fireEvent.pointerDown` ne remontait
    // simplement jamais dans jsdom — il mesurerait alors la bibliothèque, pas le composant.
    const vus: string[] = [];
    const { container } = render(
      <div onPointerDown={() => vus.push("down")}>
        <span data-t="temoin" />
      </div>,
    );
    fireEvent.pointerDown(container.querySelector("[data-t='temoin']")!);
    expect(vus, "jsdom ne propage pas les événements de pointeur : le test ci-dessus ne prouve rien").toEqual([
      "down",
    ]);
  });
});

describe("[7.3] ce qui ne bouge pas — le refus tenu", () => {
  const scene = (abonnee: boolean) =>
    render(
      <Surimpression modele={surimpressionPour("accueil", abonnee)} menu={COPIE} lienVers={(u) => u} />,
    );

  it("[LE CŒUR · FR-077] le « ? » est rendu HORS du composant de menu", () => {
    // Mutation-cible : le déplacer dans la feuille « puisque le menu porte déjà l'aide ». FR-077
    // exige une entrée INDÉPENDANTE du menu de compte : dans la feuille, elle deviendrait
    // dépendante d'un état d'ouverture, donc perdable au pire moment.
    const { container } = scene(false);
    const aide = container.querySelector("a[href='/aide']")!;
    expect(aide, "la porte de secours a disparu de la surimpression").not.toBeNull();
    expect(aide.closest("[role='dialog']"), "la porte de secours est DANS la feuille").toBeNull();
    expect(aide.getAttribute("aria-label")).toBe("Aide");
  });

  it("[LE CŒUR] la porte de secours reste le DERNIER élément focusable de la surimpression", () => {
    const { container } = scene(true);
    const focusables = [...container.querySelectorAll<HTMLElement>("a, button")];
    expect(focusables.length).toBeGreaterThan(2);
    expect(focusables[focusables.length - 1].getAttribute("href"), "« Aide » a cédé sa place").toBe("/aide");
  });

  it("la porte de secours reste atteignable MENU OUVERT", () => {
    // AD-9/AD-15 : le filet ne dépend d'aucun état. Un menu ouvert ne doit pas l'enterrer.
    //
    // ⚠️ IL Y A DEUX LIENS `/aide` À L'ÉCRAN QUAND LE MENU EST OUVERT, ET C'EST VOULU : l'entrée de
    // la feuille et la porte de secours. `querySelector` rendrait le premier du DOM — celui de la
    // feuille — et le test passerait en mesurant l'entrée de menu au lieu du filet. On désigne donc
    // celui qui est HORS du dialogue, qui est précisément celui que FR-077 protège.
    const { container } = scene(false);
    fireEvent.click(container.querySelector("button")!);
    const tous = [...container.querySelectorAll("a[href='/aide']")];
    expect(tous.length, "le menu ouvert doit porter les DEUX : l'entrée et le filet").toBe(2);
    const filet = tous.find((a) => a.closest("[role='dialog']") === null);
    expect(filet, "la porte de secours a été absorbée par la feuille").toBeDefined();
    expect(filet!.getAttribute("aria-label")).toBe("Aide");
  });

  it("[FR-060] le raccourci d'abonnement reste dans la surimpression, EN PLUS du menu", () => {
    // « Le menu existe donc on retire le raccourci » est refusé par écrit : on souscrit en UNE
    // carte en pleine conversation, et passer par le menu ajouterait un geste à la SORTIE seule.
    const { container } = scene(true);
    const direct = container.querySelector("a[href='/abonnement']")!;
    expect(direct, "le raccourci d'abonnement a disparu").not.toBeNull();
    expect(direct.closest("[role='dialog']")).toBeNull();
  });

  it("le mot « Profil » a disparu de la surimpression", () => {
    const { container } = scene(true);
    expect(container.textContent ?? "").not.toContain("Profil");
  });
});
