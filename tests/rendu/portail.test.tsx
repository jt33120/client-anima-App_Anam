import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, act } from "@testing-library/react";
import PortailAnam from "@/render/portail/PortailAnam";
import {
  ANNONCE_PORTAIL,
  ATTENTE_PORTAIL,
  NOM_PORTAIL,
} from "@/lib/domain/copie-portail";
import { DUREE_POUSSE_MS, DUREE_RETRAIT_MS, PLAFOND_MS } from "@/lib/scene/portail";
import { MoteurArbreLunaire } from "@/render/arbre/MoteurArbreLunaire";

/**
 * portail.test.tsx — LE PORTAIL, RÉELLEMENT MONTÉ (2026-09-03).
 *
 * `tests/portail.test.ts` éprouve le MODÈLE — quand partir, à quelle allure pousser. Il ne peut
 * rien dire de ce qui compte au bout du compte : est-ce que ce voile plein écran QUITTE VRAIMENT le
 * document, et est-ce qu'il laisse passer un doigt pendant qu'il est là.
 *
 * Ces deux propriétés ne se lisent pas dans une fonction pure. Elles se mesurent en montant le
 * composant et en faisant avancer l'horloge.
 */

const lire = (chemin: string) =>
  readFileSync(resolve(process.cwd(), chemin), "utf-8");

const COPIE = { nom: NOM_PORTAIL, attente: ATTENTE_PORTAIL, annonce: ANNONCE_PORTAIL };

/**
 * Un contexte 2D qui AVALE tout et note les rayons extérieurs des dégradés radiaux.
 *
 * ⚠️ jsdom n'implémente pas `getContext("2d")` : sans ce double, le composant sort au premier `if`
 * et toute garde de peinture serait vide — c'est-à-dire verte pour la mauvaise raison. Il ne simule
 * rien, il ENREGISTRE, et c'est le seul endroit d'où l'on peut observer que la lumière avance.
 *
 * ⚠️ ET IL DOIT SATISFAIRE LE MOTEUR LUNAIRE AUSSI, pas seulement le voile : la cuisson passe par
 * ce même `getContext`. D'où le `Proxy` — une centaine d'appels de dessin qu'on ne veut ni lister
 * ni maintenir, et dont aucun ne nous intéresse. Ce qui nous intéresse tient en une ligne :
 * `createRadialGradient`.
 */
function contexteDouble(rayons: number[]): CanvasRenderingContext2D {
  const proprietes = new Map<string | symbol, unknown>();
  const neRienFaire = () => undefined;
  const degrade = { addColorStop: neRienFaire };
  return new Proxy(
    {},
    {
      get(_cible, cle) {
        if (cle === "createRadialGradient") {
          return (...args: number[]) => {
            // Le rayon EXTÉRIEUR est le sixième argument : c'est le front de lumière.
            rayons.push(args[5]);
            return degrade;
          };
        }
        if (cle === "createLinearGradient" || cle === "createPattern") return () => degrade;
        if (cle === "canvas") return proprietes.get(cle);
        if (proprietes.has(cle)) return proprietes.get(cle);
        return neRienFaire;
      },
      set(_cible, cle, valeur) {
        proprietes.set(cle, valeur);
        return true;
      },
    },
  ) as CanvasRenderingContext2D;
}

/**
 * Pose le double sur tous les canevas, et rend le carnet des rayons du VOILE.
 *
 * ⚠️ UN CONTEXTE NEUF PAR CANEVAS, ET SEUL LE CANEVAS VISIBLE ENREGISTRE. Le moteur cuit dans
 * QUATRE couches hors écran avant de composer : leur rendre le même carnet mêlerait leurs dégradés
 * au nôtre, et la garde mesurerait un bruit au lieu du front de lumière.
 */
function poserContexteDouble(): number[] {
  const rayons: number[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    return contexteDouble(this.isConnected ? rayons : []);
  } as unknown as typeof HTMLCanvasElement.prototype.getContext);
  return rayons;
}

/**
 * Le document ne finit JAMAIS de charger.
 *
 * ⚠️ SANS CE DOUBLE, LA GARDE DU PLAFOND NE MESURAIT RIEN. jsdom rend `readyState === "complete"`
 * dès le montage : le portail voyait donc toujours la scène prête, partait à la fin de la pousse,
 * et le chemin « le signal n'arrive jamais » — le seul qui puisse laisser un voile à l'écran pour
 * toujours — n'était jamais parcouru. La première version de ce fichier en a fait la démonstration :
 * son témoin d'anti-vacuité a rougi, et c'est lui qui a trouvé le trou.
 */
function sceneJamaisPrete() {
  const original = Object.getOwnPropertyDescriptor(Document.prototype, "readyState");
  Object.defineProperty(document, "readyState", { configurable: true, get: () => "loading" });
  return () => {
    delete (document as unknown as Record<string, unknown>).readyState;
    if (original) Object.defineProperty(Document.prototype, "readyState", original);
  };
}

/**
 * Une horloge et une boucle de frames sous contrôle.
 *
 * ⚠️ `requestAnimationFrame` DE JSDOM NE TOURNE PAS TOUT SEUL ici : sans ce double, la boucle du
 * portail ne serait jamais rejouée et TOUS les tests de disparition passeraient sur un composant
 * qui n'a peint qu'une fois — c'est-à-dire pour la mauvaise raison.
 */
function horloge() {
  let maintenant = 0;
  let enAttente: FrameRequestCallback[] = [];
  vi.spyOn(performance, "now").mockImplementation(() => maintenant);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    enAttente.push(cb);
    return enAttente.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  return {
    /** Avance le temps et rejoue les frames en attente, une passe par appel. */
    avancer(ms: number, passes = 1) {
      for (let i = 0; i < passes; i += 1) {
        maintenant += ms / passes;
        const aJouer = enAttente;
        enAttente = [];
        act(() => {
          for (const cb of aJouer) cb(maintenant);
        });
      }
    },
    get frames() {
      return enAttente.length;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("[LE CŒUR] le portail quitte le document, même quand rien ne le lui dit", () => {
  it("[LE CŒUR] au plafond, il n’est plus là — scène jamais prête", () => {
    // ⚠️ LE CHEMIN QU'AUCUN ÉCRAN DE DÉVELOPPEMENT NE PARCOURT. Ici `load` n'arrive JAMAIS : c'est
    // la session dont la requête a échoué, ou l'onglet revenu de veille. Sans le plafond, le voile
    // resterait pour toujours et rien dans le produit ne le dirait.
    const rendre = sceneJamaisPrete();
    const t = horloge();
    const { container } = render(<PortailAnam copie={COPIE} />);
    expect(container.querySelector("[data-portail-anam]"), "le portail ne s’est pas monté").not.toBeNull();

    t.avancer(PLAFOND_MS + DUREE_RETRAIT_MS + 100, 12);
    expect(
      container.querySelector("[data-portail-anam]"),
      "le portail est resté à l’écran au-delà du plafond",
    ).toBeNull();
    rendre();
  });

  it("[ANTI-VACUITÉ] il est bien LÀ avant le plafond — sinon le test ci-dessus ne prouve rien", () => {
    // Un composant qui rendrait `null` dès la première frame passerait la garde précédente. Le
    // témoin exige donc qu'à mi-plafond, scène toujours pas prête, le portail soit encore là.
    const rendre = sceneJamaisPrete();
    const t = horloge();
    const { container } = render(<PortailAnam copie={COPIE} />);
    t.avancer(PLAFOND_MS / 2, 6);
    expect(container.querySelector("[data-portail-anam]")).not.toBeNull();
    rendre();
  });

  it("[LE CŒUR] quand la scène EST prête, il part bien plus tôt que le plafond", () => {
    // Le cas nominal, et il doit se distinguer du précédent : jsdom rend `readyState` complet dès
    // le montage, donc la scène est prête tout de suite et seule la pousse retient le portail.
    // Sans cette garde, un portail qui attendrait TOUJOURS le plafond passerait les deux autres.
    const t = horloge();
    const { container } = render(<PortailAnam copie={COPIE} />);
    t.avancer(DUREE_POUSSE_MS + DUREE_RETRAIT_MS + 60, 10);
    expect(
      container.querySelector("[data-portail-anam]"),
      "le portail s’attarde alors que la scène est prête",
    ).toBeNull();
    expect(DUREE_POUSSE_MS + DUREE_RETRAIT_MS).toBeLessThan(PLAFOND_MS);
  });

  it("la boucle de frames s’ÉTEINT — aucune frame ne tourne derrière un portail parti", () => {
    // ⚠️ MUTATION-CIBLE : demander une frame de plus après `setParti(true)`. Le portail serait
    // invisible et le processeur tournerait pour peindre un arbre que personne ne regarde, sur un
    // téléphone, pour toujours.
    const rendre = sceneJamaisPrete();
    const t = horloge();
    render(<PortailAnam copie={COPIE} />);
    t.avancer(PLAFOND_MS + DUREE_RETRAIT_MS + 100, 12);
    expect(t.frames, "la boucle continue de demander des frames").toBe(0);
    rendre();
  });
});

describe("[LE CŒUR] il ne piège personne", () => {
  it("le voile ne prend aucun événement de pointeur", () => {
    // ⚠️ C'EST CE QUI REND LE PORTAIL SÛR PAR CONSTRUCTION plutôt que par preuve. La scène est
    // montée dessous ; un doigt posé pendant le portail l'atteint. Un plein écran qui INTERCEPTE
    // est un plein écran dont il faut démontrer qu'il part — ici il n'y a rien à démontrer.
    const css = lire("render/portail/portail.module.css");
    const bloc = css.split(".portail {")[1].split("}")[0];
    expect(bloc, "le voile intercepte les pointeurs").toMatch(/pointer-events:\s*none/);
  });

  it("[LE CŒUR] le fondu de sortie se VOIT — `visibility` bascule à la fin, pas au début", () => {
    // ⚠️ CE DÉFAUT A ÉTÉ ÉCRIT PUIS CORRIGÉ LE 2026-09-03, et il ne se serait jamais vu tout seul.
    // `visibility` n'est pas interpolable : posée dans la même déclaration que l'opacité, elle
    // bascule à la première frame et le voile disparaît D'UN COUP. L'écran reste correct — juste
    // brutal — et aucune garde de comportement ne le remarque, puisque le portail part bien.
    // Ce qu'on mesure : le délai de `visibility` vaut la durée du fondu, et non zéro.
    const css = lire("render/portail/portail.module.css");
    const bloc = css.split(".portail {")[1].split("}")[0];
    expect(bloc, "`visibility` n’est pas différée : le fondu de sortie ne se verra pas").toMatch(
      /visibility\s+0s\s+linear\s+var\(--duree-longue\)/,
    );
    // …et le fondu d'opacité existe bel et bien : sans lui, différer `visibility` ne ferait que
    // retarder une disparition brutale.
    expect(bloc).toMatch(/opacity\s+var\(--duree-longue\)/);
  });

  it("aucune barre, aucun anneau, aucun pourcentage (FR-031)", () => {
    // Ce qui n'existe pas ne se rajoute pas « juste pour aider ». La garde lit la feuille ET le
    // composant : une jauge peut naître dans l'un comme dans l'autre.
    const sources = [
      lire("render/portail/portail.module.css"),
      lire("render/portail/PortailAnam.tsx"),
      lire("render/portail/ArbreQuiPousse.tsx"),
    ].join("\n");
    const sansCommentaires = sources
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/.*$/gm, " ")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
    expect(sansCommentaires).not.toMatch(/progress|pourcentage|%\s*\}/i);
    expect(sansCommentaires).not.toMatch(/\brole="progressbar"/);
  });
});

describe("[LE CŒUR] ce que le portail montre", () => {
  it("le nom, la ligne d’attente, et une annonce pour qui n’y voit rien", () => {
    const t = horloge();
    const { container, getByText } = render(<PortailAnam copie={COPIE} />);
    t.avancer(100);
    expect(getByText(NOM_PORTAIL)).toBeTruthy();
    expect(getByText(ATTENTE_PORTAIL)).toBeTruthy();

    const portail = container.querySelector("[data-portail-anam]")!;
    // ⚠️ PAS `aria-hidden`, contrairement à `HalteEnAttente` — et la différence est motivée dans
    // `copie-portail.ts` : une halte est annoncée par la navigation, un lancement ne l'est par
    // personne. Se taire ici laisserait quelqu'un devant un silence.
    expect(portail.getAttribute("aria-hidden")).toBeNull();
    expect(portail.getAttribute("role")).toBe("status");
    expect(portail.getAttribute("aria-label")).toBe(ANNONCE_PORTAIL);
  });

  it("le nom porte le scintillement de la feuille commune, jamais une ombre à lui", () => {
    // `tests/voile.test.ts` bannit `text-shadow` de tout le produit : ce qui brille est un halo
    // DERRIÈRE la lettre. Le portail réutilise cette classe plutôt que d'inventer sa lueur.
    const t = horloge();
    const { getByText } = render(<PortailAnam copie={COPIE} />);
    t.avancer(100);
    expect(getByText(NOM_PORTAIL).className).toContain("scintillement");
    expect(lire("render/portail/portail.module.css")).not.toContain("text-shadow");
  });

  it("[LE CŒUR] la lumière S’OUVRE : le front du voile grandit d’une image à l’autre", async () => {
    // ⚠️ MUTATION-CIBLE : passer un éveil constant au voile. L'écran resterait joli et la demande —
    // « qui passe par les différents stades, de graine à arbre scintillant » — serait perdue sans
    // que rien ne rougisse.
    //
    // ⚠️ ET C'EST UNE GARDE DE COMPORTEMENT, PAS DE CÂBLAGE. jsdom ne fournit aucun contexte 2D :
    // la version précédente lisait donc l'opacité d'un SVG, c'est-à-dire tout sauf la peinture.
    // Ici on POSE un contexte double qui enregistre les rayons réellement demandés, et on lit la
    // révélation là où elle se produit.
    const rayons = poserContexteDouble();

    const t = horloge();
    render(<PortailAnam copie={COPIE} />);
    for (const pas of [0, 300, 300, 300, 300]) t.avancer(pas || 1);

    expect(rayons.length, "aucun voile n’a été posé").toBeGreaterThan(3);
    for (let i = 1; i < rayons.length; i += 1) {
      expect(rayons[i], `la lumière a reculé à l’image ${i}`).toBeGreaterThanOrEqual(rayons[i - 1]);
    }
    // …et elle a VRAIMENT bougé : monotone est vrai d'une constante.
    expect(rayons[rayons.length - 1]).toBeGreaterThan(rayons[0] * 1.5);
  });

  it("[LE CŒUR] l’arbre est CUIT UNE SEULE FOIS — jamais à chaque image", async () => {
    // ⚠️ MUTATION-CIBLE : déplacer la cuisson dans l'effet de peinture. C'est la première version
    // écrite le 2026-09-04, et elle a été MESURÉE avant d'être jetée : 66 images coûtaient 7,7 s de
    // fil principal (90 ms l'image), exactement pendant que la page s'hydrate. Rien ne l'aurait dit
    // — l'écran est identique, il rame.
    const rayons = poserContexteDouble();
    const cuisson = vi.spyOn(MoteurArbreLunaire.prototype, "mettreAJour");

    const t = horloge();
    render(<PortailAnam copie={COPIE} />);
    for (const pas of [0, 300, 300, 300, 300]) t.avancer(pas || 1);

    expect(rayons.length, "aucune image n’a été peinte").toBeGreaterThan(3);
    expect(cuisson, "le moteur lunaire est rappelé à chaque image").toHaveBeenCalledTimes(1);
  });

  it("[LE CŒUR] c’est l’arbre DU PRODUIT, pas le décor de la scène", () => {
    // ⚠️ LA GARDE QUI MANQUAIT LE 2026-09-03, ET C'EST UN RETOUR DE JULIAN QUI L'A TROUVÉE :
    // « c'est pas du tout le bon arbre sur l'écran de chargement, le bon avait des racines et
    // s'illuminait ». Le dépôt porte deux arbres ; le portail montrait le DÉCOR (`arbre-vivant.tsx`,
    // un bouquet sans racines ni lumière) au lieu du handoff « Arbre de Vie Lunaire ». Les deux
    // compilent, les deux dessinent un arbre, et aucune garde ne distinguait l'un de l'autre.
    const source = lire("render/portail/ArbreQuiPousse.tsx");
    expect(source, "le portail ne dessine pas l’arbre lunaire").toContain("MoteurArbreLunaire");
    expect(
      source.replace(/\/\*[\s\S]*?\*\//g, " "),
      "le portail est revenu à l’arbre du décor",
    ).not.toMatch(/from\s+"(\.\.\/arbre-vivant|@\/render\/arbre-vivant)"/);
  });

  it("la boîte de l’arbre porte les proportions du canevas du handoff", () => {
    // ⚠️ MUTATION-CIBLE : garder les 1408 × 860 du décor. L'arbre lunaire serait écrasé de moitié,
    // et ça se lirait comme un choix graphique. Le patron vient de `tests/scene-sans-bords.test.ts`,
    // qui tient la même promesse pour l'arbre de la scène.
    const geometrie = lire("render/arbre/geometrie.ts");
    const attendu = /export const CANEVAS = \{ largeur: (\d+), hauteur: (\d+) \}/.exec(geometrie);
    expect(attendu, "la forme de `CANEVAS` a changé : la garde ne sait plus quoi comparer").not.toBeNull();

    const css = lire("render/portail/portail.module.css");
    const bloc = css.split(".arbre {")[1].split("}")[0];
    expect(bloc).toContain(`--largeur-canevas: ${attendu![1]}`);
    expect(bloc).toContain(`--hauteur-canevas: ${attendu![2]}`);
  });
});

describe("[LE BORD] prefers-reduced-motion", () => {
  it("le portail passe, et il passe VITE", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduced-motion"),
      media: q,
      addEventListener() {},
      removeEventListener() {},
    }));
    const t = horloge();
    const { container } = render(<PortailAnam copie={COPIE} />);
    // Bien avant le plafond du mouvement plein : le séjour réduit plus le fondu suffisent.
    t.avancer(1500, 8);
    expect(
      container.querySelector("[data-portail-anam]"),
      "le portail s’attarde alors que le mouvement est réduit",
    ).toBeNull();
  });
});
