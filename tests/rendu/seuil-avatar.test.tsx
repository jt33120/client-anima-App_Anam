import { describe, it, expect, afterEach, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sansCommentaires } from "../_absence";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ refresh: () => {}, push: () => {}, replace: () => {} }),
}));

import SceneDom from "@/render/scene-dom";
import AvatarSeuil from "@/render/seuil/AvatarSeuil";
import {
  ACTION_SEUIL,
  ALT_AVATAR_SEUIL,
  TAGLINE_SEUIL,
  TITRE_SEUIL,
} from "@/lib/domain/copie-seuil";
import { GROUPES_MENU, LIBELLE_GLYPHE, TITRE_FEUILLE, LIBELLE_FERMER } from "@/lib/domain/menu-compte";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";
import { REGIONS, type ProjectionScene } from "@/lib/scene";

/**
 * seuil-avatar.test.tsx — LE SEUIL MONTÉ POUR DE VRAI (retour du fondateur, 2026-09-02).
 *
 * « Quand on crée un compte, on voit l'arbre : mets plutôt l'avatar d'Anam, qui se remplit
 * d'étoiles. » Et deux textes : la phrase sous le nom, et la porte, qui s'appelle désormais d'un
 * seul mot.
 *
 * ══ CE QUE CE FICHIER PROUVE, ET CE QU'IL NE PEUT PAS PROUVER ═══════════════════════════════════
 *
 * jsdom ne peint rien : ni la toile, ni l'image, ni la mise en page (le budget vertical à 390 × 664
 * est un CALCUL, en tête de `avatar-seuil.module.css`, et une mesure e2e, `e2e/seuil.spec.ts`). Ce
 * qu'on prouve ici, c'est la STRUCTURE et le CÂBLAGE :
 *
 *   • la copie descend de `lib/domain/copie-seuil.ts` par propriété, et plus une des trois phrases
 *     n'est écrite dans `render/` — la première garde jamais posée sur la tagline ;
 *   • la toile existe, décorative, dans la section Seuil et nulle part ailleurs ; l'image d'Anam
 *     est celle du format « seuil » ;
 *   • la porte s'appelle d'un mot, et déclenche le franchissement comme avant ;
 *   • sous `prefers-reduced-motion`, AUCUNE trame n'est demandée et l'image se montre tout de suite.
 *
 * ⚠️ POURQUOI DEUX MONTAGES. La scène entière (`SceneDom`) prouve le câblage — mais elle monte aussi
 * l'arbre, la conversation, les fiches, qui demandent leurs propres trames (`requestAnimationFrame`)
 * : une garde « aucune trame » y serait polluée par des trames qui ne sont pas les siennes. Le
 * comportement de l'animation est donc éprouvé sur `AvatarSeuil` SEUL, avec un double de contexte 2D
 * ; la scène entière n'a pas de contexte (jsdom rend `null`), et c'est le repli documenté : l'image
 * s'affiche telle quelle.
 */

const SCENE = () => sansCommentaires(readFileSync(resolve(process.cwd(), "render/scene-dom.tsx"), "utf-8"));
const RENDU_SEUIL = () =>
  sansCommentaires(readFileSync(resolve(process.cwd(), "render/seuil/AvatarSeuil.tsx"), "utf-8"));

const PROJECTION: ProjectionScene = { tronc: { present: true }, branches: [] };
const COPIE = { titre: TITRE_SEUIL, tagline: TAGLINE_SEUIL, action: ACTION_SEUIL, altAvatar: ALT_AVATAR_SEUIL };
const MENU = { groupes: GROUPES_MENU, libelleGlyphe: LIBELLE_GLYPHE, titreFeuille: TITRE_FEUILLE, libelleFermer: LIBELLE_FERMER };

function monterLaScene(props: Partial<Parameters<typeof SceneDom>[0]> = {}) {
  return render(<SceneDom projection={PROJECTION} menu={MENU} copieSeuil={COPIE} {...props} />);
}

const sectionSeuil = () => document.querySelector('section[aria-label="Seuil"]') as HTMLElement;
/** La région d'accueil, PAR LE CATALOGUE — jamais son nom en littéral (Story 7.9 : il a déjà changé deux fois). */
const sectionAccueil = () =>
  document.querySelector(`section[aria-label="${REGIONS.find((r) => r.id === "accueil")!.nom}"]`) as HTMLElement;

// ── Le double de contexte 2D — assez pour que `demarrerRemplissage` aille jusqu'au bout ──────────
//
// Il rend une silhouette pleine sur un rectangle central (alpha 255), pour que l'échantillonnage
// trouve des étoiles ; tout le reste est un no-op. Un `Proxy`, pour ne pas épeler les quarante
// méthodes du 2D : ce qui compte ici est le COMPORTEMENT du composant, pas le dessin.
function installerContexte2d() {
  const compteurs = { getContext: 0 };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    compteurs.getContext++;
    const etat: Record<string | symbol, unknown> = {};
    const degrade = { addColorStop: () => {} };
    const speciaux: Record<string, unknown> = {
      canvas: this,
      createRadialGradient: () => degrade,
      createLinearGradient: () => degrade,
      measureText: () => ({ width: 0 }),
      getImageData: (_x: number, _y: number, l: number, h: number) => {
        const data = new Uint8ClampedArray(l * h * 4);
        for (let y = Math.floor(h * 0.1); y < h * 0.95; y++)
          for (let x = Math.floor(l * 0.3); x < l * 0.7; x++) data[(y * l + x) * 4 + 3] = 255;
        return { data, width: l, height: h };
      },
    };
    return new Proxy(
      {},
      {
        get: (_t, prop) => (prop in speciaux ? speciaux[prop as string] : prop in etat ? etat[prop] : () => {}),
        set: (_t, prop, valeur) => {
          etat[prop] = valeur;
          return true;
        },
      },
    ) as unknown as CanvasRenderingContext2D;
  });
  return compteurs;
}

/** `matchMedia` qui répond OUI à « moins de mouvement » — et non à tout le reste. */
function preferer(moinsDeMouvement: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((requete: string) => ({
    media: requete,
    matches: moinsDeMouvement && requete.includes("prefers-reduced-motion"),
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

/**
 * L'image de l'avatar « arrive » : jsdom ne charge rien, on joue nous-mêmes le `load`. Rend le nombre
 * de trames demandées PENDANT la dispatch du `load`, synchrone.
 *
 * ⚠️ POURQUOI ON COMPTE LÀ, ET PAS « EN TOUT ». C'est au `load` que `demarrerRemplissage` décide —
 * une boucle (une trame demandée, tout de suite) ou l'état final sans boucle (aucune). Après, le
 * harnais lui-même en demande (mesuré : trois trames anonymes après `setPret`, hors du module — ni
 * `AvatarSeuil`, ni `LotusAttente`, ni `ImageAnam` n'appellent `requestAnimationFrame`) : un compte
 * global ferait rougir la garde « aucune trame » sur des trames qui ne sont pas celles du module.
 */
async function chargerLImage(racine: ParentNode, demander?: { mock: { calls: unknown[] } }): Promise<number> {
  // Le composant attend un micro-tour (le `decode()` absent devient `Promise.resolve()`).
  await act(async () => {});
  const img = racine.querySelector("img");
  expect(img, "aucune <img> à charger : ImageAnam n'a pas rendu son image").not.toBeNull();
  let pendant = 0;
  await act(async () => {
    const avant = demander?.mock.calls.length ?? 0;
    fireEvent.load(img!);
    pendant = (demander?.mock.calls.length ?? 0) - avant;
  });
  return pendant;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 1. La copie descend du domaine — plus un mot du seuil n'est écrit dans render/
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LE CŒUR] la copie du seuil descend de lib/domain/copie-seuil.ts", () => {
  it("le nom, la phrase et la porte sont ceux du domaine, rendus par la scène", () => {
    monterLaScene();
    const seuil = sectionSeuil();
    expect(seuil.querySelector("h1")?.textContent).toBe(TITRE_SEUIL);
    expect(seuil.querySelector("p")?.textContent).toBe(TAGLINE_SEUIL);
    expect(screen.getByRole("button", { name: ACTION_SEUIL }).closest("section")).toBe(seuil);
  });

  it("[LE CŒUR] render/scene-dom.tsx n'écrit plus AUCUN des trois textes — ni l'ancien, ni le nouveau", () => {
    // ⚠️ MUTATION-CIBLE : remettre la phrase en dur dans le JSX. Elle échapperait à nouveau aux
    // gardes de voix, qui ne lisent que `lib/domain`. La source est lue SANS ses commentaires : la
    // prose a le droit de citer l'histoire, le JSX n'a pas le droit de la rendre.
    const src = SCENE();
    for (const texte of [TAGLINE_SEUIL, ACTION_SEUIL, "entrer dans le monde", "Ce lieu ne te jugera"]) {
      expect(src, `« ${texte} » est écrit en dur dans la scène`).not.toContain(texte);
    }
    // …et le rendu la REÇOIT par propriété — sinon la garde ci-dessus serait vraie d'un fichier vide.
    expect(src).toMatch(/\{copieSeuil\.tagline\}/);
    expect(src).toMatch(/\{copieSeuil\.action\}/);
    expect(src).toMatch(/\{copieSeuil\.titre\}/);
    expect(src, "render/ importe lib/domain : AD-7/AD-10").not.toMatch(/@\/lib\/domain/);
    expect(RENDU_SEUIL(), "render/seuil importe lib/domain : AD-7/AD-10").not.toMatch(/@\/lib\/domain/);
  });

  it("[LE CŒUR] le nom du titre n'est pas écrit en dur non plus, mais il est bien « Anam »", () => {
    // Le titre est le même mot qu'avant ; ce qui change est d'où il vient. Le témoin : la scène
    // rend un h1 dont le texte est celui du domaine, et le domaine dit « Anam ».
    expect(TITRE_SEUIL).toBe("Anam");
    expect(SCENE()).not.toMatch(/>\s*Anam\s*<\/h1>/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 2. La phrase — la PREMIÈRE garde jamais posée sur elle
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LA PHRASE] deux phrases, aucun tiret, l'apostrophe typographique, la voix du produit", () => {
  it("[LE CŒUR] dit ce que le lieu EST — deux phrases au plus, jamais un tiret", () => {
    expect(TAGLINE_SEUIL).toBe("Un lieu qui t’appartient. Un espace pour échanger, comprendre et évoluer.");
    expect(TAGLINE_SEUIL, "un tiret cadratin ou demi-cadratin : la voix n'en pose jamais").not.toMatch(/[—–]/);
    expect(TAGLINE_SEUIL, "une apostrophe droite : c'est ’ qui est la convention").not.toMatch(/'/);
    const phrases = TAGLINE_SEUIL.split(/[.!?]\s*/).filter((p) => p.trim().length > 0);
    expect(phrases.length, "plus de deux phrases : ce n'est plus une tagline").toBeLessThanOrEqual(2);
    expect(TAGLINE_SEUIL, "ce qu'il N'EST PAS : le fondateur veut ce qu'il est").not.toMatch(/juger|flatter/i);
  });

  it("[LE CŒUR] les trois textes passent les contrôles bloquants — lexique interdit, prédictions", () => {
    // Patron de tests/enneagramme-invitation.test.ts : ces phrases relèvent du contrôle de voix de
    // plein droit, et n'y avaient jamais été passées tant qu'elles vivaient dans render/.
    for (const texte of [TITRE_SEUIL, TAGLINE_SEUIL, ACTION_SEUIL, ALT_AVATAR_SEUIL]) {
      expect(chercherInterdits(texte), `lexique interdit dans « ${texte} »`).toEqual([]);
      expect(chercherPredictions(texte), `prédiction dans « ${texte} »`).toEqual([]);
    }
  });

  it("[ANTI-VACUITÉ] les détecteurs mordent bien sur une phrase qu'on sait mauvaise", () => {
    expect(chercherPredictions("Tu vas évoluer ici.").length).toBeGreaterThan(0);
  });

  it("aucune salutation d'heure (QA 2026-08-19, M4 : « Bonsoir » relevé à 10 h du matin)", () => {
    for (const texte of [TITRE_SEUIL, TAGLINE_SEUIL, ACTION_SEUIL]) {
      expect(texte).not.toMatch(/bonjour|bonsoir|bonne nuit/i);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 3. La toile et l'image — au seuil, et nulle part ailleurs
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[L'IMAGE] la toile est décorative, dans la section Seuil, au-dessus de l'image d'Anam", () => {
  it("[LE CŒUR] `[data-remplissage-etoiles]` est UN canvas aria-hidden, dans la section Seuil", () => {
    monterLaScene();
    const toiles = document.querySelectorAll("[data-remplissage-etoiles]");
    expect(toiles.length, "une seule couche de dessin — c'est toute la doctrine perf du module").toBe(1);
    const toile = toiles[0];
    expect(toile.tagName.toLowerCase()).toBe("canvas");
    // ⚠️ MUTATION-CIBLE : retirer `aria-hidden`. Un canvas sans nom est annoncé comme « image » ou
    // « graphique » par certains lecteurs d'écran, entre le nom du lieu et sa phrase.
    expect(toile.getAttribute("aria-hidden"), "la toile n'est plus décorative").toBe("true");
    expect(toile.closest("section")).toBe(sectionSeuil());
  });

  it("[LE CŒUR] l'image d'Anam est celle du format « seuil », dans la même section, avec son nom sobre", () => {
    monterLaScene();
    const seuil = sectionSeuil();
    const img = seuil.querySelector("img");
    expect(img, "aucune image d'Anam au seuil").not.toBeNull();
    expect(img!.getAttribute("src")).toMatch(/\/scene\/seuil\/anam-seuil\.png$/);
    expect(img!.getAttribute("srcset")).toMatch(/anam-seuil@2x\.png 2x/);
    // Le héros de la première peinture ne se charge pas « quand on y arrive » : le remplissage
    // attend son bitmap, un `lazy` y mettrait une attente vide avant la première trame (revue du
    // 2026-09-02). Les portraits de la conversation, eux, restent `lazy` (garde d'ImageAnam).
    expect(img!.getAttribute("loading"), "l'image du seuil doit être chargée en priorité").toBe("eager");
    expect(img!.getAttribute("fetchpriority")).toBe("high");
    // Le sens est porté par l'enveloppe (`role="img"` + alt), l'`<img>` interne est décorative.
    expect(img!.getAttribute("alt")).toBe("");
    expect(seuil.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(ALT_AVATAR_SEUIL);
    // Et une seule image : jamais deux illustrations empilées (QA 2026-08-19).
    expect(seuil.querySelectorAll("img").length).toBe(1);
  });

  it("[LE CŒUR] hors seuil : aucune toile ailleurs, et quand le seuil est déjà franchi rien ne se dessine", async () => {
    installerContexte2d();
    const demander = vi.fn(() => 1);
    vi.stubGlobal("requestAnimationFrame", demander);
    vi.stubGlobal("cancelAnimationFrame", () => {});

    // Le seuil déjà franchi : la scène s'ouvre sur l'accueil, la section Seuil est inerte.
    monterLaScene({ seuilDejaFranchi: true });
    const toiles = document.querySelectorAll("[data-remplissage-etoiles]");
    expect(toiles.length).toBe(1);
    expect(toiles[0].closest("section")?.getAttribute("aria-label")).toBe("Seuil");
    expect(sectionSeuil().getAttribute("aria-hidden"), "témoin : le seuil est bien inactif").toBe("true");
    // La toile, elle, n'est jamais dessinée dans une région inerte : `demarrerRemplissage` n'est
    // pas appelé, donc aucun contexte 2D n'est demandé SUR ELLE (l'arbre a le sien).
    const toile = toiles[0] as HTMLCanvasElement;
    // Revue du 2026-09-02 : l'ancien témoin (`>= 0` sur un compteur) ne pouvait pas rougir. Le
    // double du prototype enregistre le `this` de chaque appel : on laisse l'image « charger » et
    // le décodage se résoudre, puis on vérifie qu'aucun contexte n'a été demandé SUR CETTE toile
    // (l'arbre a le sien) et qu'aucune trame n'a été réclamée. Un `vi.spyOn(toile, …)` ne ferait
    // que renvoyer le double du prototype, déjà appelé par l'arbre : c'est le piège évité ici.
    const proto = HTMLCanvasElement.prototype.getContext as unknown as { mock: { contexts: unknown[] } };
    const surLaToile = () => proto.mock.contexts.filter((c) => c === toile).length;
    const img = sectionSeuil().querySelector("img");
    await act(async () => {
      if (img) fireEvent.load(img);
      await Promise.resolve();
      await Promise.resolve();
      // On draine aussi les tâches différées de la scène (l'arbre décode ses planches puis
      // réclame SES trames) pour qu'elles ne fuient pas dans le test suivant.
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(surLaToile(), "un contexte 2D a été demandé sur la toile d'une région inerte").toBe(0);
    // `demander` n'est PAS un témoin ici : l'arbre de la scène a le droit de réclamer ses trames.
    // Ce que la toile du seuil n'a pas fait, c'est demander un contexte : c'est l'assertion.
    expect(toile.width, "la toile a été dimensionnée : le remplissage a démarré dans une région inerte").toBe(300);
  });

  it("`AvatarSeuil` inactif ne demande ni contexte, ni trame ; actif, il en demande", async () => {
    const contexte = installerContexte2d();
    const demander = vi.fn(() => 1);
    vi.stubGlobal("requestAnimationFrame", demander);
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const { container, rerender } = render(<AvatarSeuil actif={false} alt="x" />);
    await act(async () => {});
    expect(contexte.getContext).toBe(0);
    expect(demander).not.toHaveBeenCalled();

    rerender(<AvatarSeuil actif alt="x" />);
    const trames = await chargerLImage(container, demander);
    expect(contexte.getContext, "le remplissage n'a pas pris la toile").toBeGreaterThan(0);
    expect(trames, "aucune trame : rien ne se remplit").toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 4. La porte — un seul mot, et le même franchissement qu'avant
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[LA PORTE] elle s'appelle « commencer », en bas de casse, et franchit le seuil", () => {
  it("[LE CŒUR] un seul bouton répond à /commencer/i, et c'est celui de la section Seuil", () => {
    monterLaScene();
    const boutons = screen.getAllByRole("button", { name: /commencer/i });
    expect(boutons.length).toBe(1);
    expect(boutons[0].closest("section")).toBe(sectionSeuil());
    // L'invitation basse : bas de casse, jamais la capitale du bouton de l'ennéagramme.
    expect(boutons[0].textContent).toBe("commencer");
    expect(boutons[0].className).toContain("affordance");
    expect(boutons[0].getAttribute("type")).toBe("button");
  });

  it("[LE CŒUR] cliquer ouvre l'accueil et SIGNALE le franchissement — comme « entrer dans le monde » avant", () => {
    const onSeuilFranchi = vi.fn();
    monterLaScene({ onSeuilFranchi, premierPassage: { du: true, desCartesAttendent: false } });
    expect(sectionAccueil(), "témoin : la région d'accueil est montée").not.toBeNull();
    expect(sectionAccueil().getAttribute("aria-hidden"), "témoin : l'accueil est inactif au seuil").toBe("true");

    fireEvent.click(screen.getByRole("button", { name: /commencer/i }));

    expect(onSeuilFranchi, "le franchissement n'est plus signalé : la date ne sera jamais posée").toHaveBeenCalledTimes(1);
    expect(sectionAccueil().getAttribute("aria-hidden"), "l'accueil ne s'est pas ouvert").toBeNull();
    expect(sectionSeuil().getAttribute("aria-hidden")).toBe("true");
  });

  it("le h1 du seuil reste la cible de focus programmatique (tabIndex −1)", () => {
    monterLaScene();
    expect(sectionSeuil().querySelector("h1")?.getAttribute("tabindex")).toBe("-1");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 5. Moins de mouvement — état final immédiat, jamais rien de vide
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[MOINS DE MOUVEMENT] aucune trame, l'image tout de suite, le lotus avec elle", () => {
  it("[LE CŒUR] sous prefers-reduced-motion : zéro requestAnimationFrame, image visible, lotus monté", async () => {
    const restaurer = preferer(true);
    try {
      installerContexte2d();
      const demander = vi.fn(() => 1);
      vi.stubGlobal("requestAnimationFrame", demander);
      vi.stubGlobal("cancelAnimationFrame", () => {});

      const { container } = render(<AvatarSeuil actif alt="x" />);
      const enveloppe = container.querySelector('[role="img"]')!;
      expect(enveloppe.className, "témoin : l'image est cachée avant la fin").not.toMatch(/imagePrete/);
      expect(container.querySelector("svg"), "témoin : pas de lotus avant la fin").toBeNull();

      const trames = await chargerLImage(container, demander);
      await waitFor(() => expect(enveloppe.className).toMatch(/imagePrete/));

      expect(trames, "une trame a été demandée malgré la préférence").toBe(0);
      expect(container.querySelector("svg"), "le lotus n'est pas revenu aux mains d'Anam").not.toBeNull();
      expect(container.querySelector("svg")?.closest("[aria-hidden]"), "le lotus n'est pas décoratif").not.toBeNull();
    } finally {
      restaurer();
    }
  });

  it("[ANTI-VACUITÉ] sans la préférence, l'image reste cachée tant que la boucle tourne — et une trame est demandée", async () => {
    const restaurer = preferer(false);
    try {
      installerContexte2d();
      const demander = vi.fn(() => 1);
      vi.stubGlobal("requestAnimationFrame", demander);
      vi.stubGlobal("cancelAnimationFrame", () => {});

      const { container } = render(<AvatarSeuil actif alt="x" />);
      const trames = await chargerLImage(container, demander);
      await act(async () => {});

      expect(trames, "la boucle n'a pas démarré").toBe(1);
      expect(container.querySelector('[role="img"]')!.className, "l'image se montre avant la fin").not.toMatch(
        /imagePrete/,
      );
      expect(container.querySelector("svg"), "le lotus paraît avant la fin").toBeNull();
    } finally {
      restaurer();
    }
  });

  it("sans contexte 2D (jsdom nu), l'image se montre quand même — jamais une enveloppe vide", async () => {
    // Le repli documenté : `demarrerRemplissage` résout `termine` aussitôt. `getContext` de jsdom
    // rend `null` (et journalise « not implemented ») — c'est le cas réel d'un navigateur ancien.
    const { container } = render(<AvatarSeuil actif alt="x" />);
    await chargerLImage(container);
    await waitFor(() => expect(container.querySelector('[role="img"]')!.className).toMatch(/imagePrete/));
  });

  it("[LE CŒUR] le démontage arrête la boucle : aucune trame après", async () => {
    installerContexte2d();
    const demander = vi.fn(() => 1);
    const annuler = vi.fn();
    vi.stubGlobal("requestAnimationFrame", demander);
    vi.stubGlobal("cancelAnimationFrame", annuler);

    const { container, unmount } = render(<AvatarSeuil actif alt="x" />);
    expect(await chargerLImage(container, demander)).toBe(1);
    unmount();
    expect(annuler, "la trame en attente n'est pas annulée au démontage").toHaveBeenCalledWith(1);
  });
});
