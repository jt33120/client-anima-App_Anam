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

  it("[LE CŒUR] l’arbre POUSSE : le canevas est repeint à des éveils croissants", () => {
    // ⚠️ MUTATION-CIBLE : passer un éveil constant. L'écran resterait joli et la demande —
    // « qui passe par les différents stades, de graine à arbre » — serait perdue sans que rien ne
    // rougisse. On mesure les éveils RÉELLEMENT reçus par le moteur.
    const eveils: number[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const t = horloge();
    const { container } = render(<PortailAnam copie={COPIE} />);
    // Le moteur refuse de peindre sans contexte 2D (jsdom n'en fournit pas) : on lit donc la
    // progression là où elle est observable, sur l'opacité de la graine, qui descend de 1 à 0.
    const opacite = () => {
      const el = container.querySelector<HTMLElement>("[data-portail-anam] div[style]");
      return el ? Number(el.style.getPropertyValue("--opacite-graine")) : 0;
    };
    t.avancer(0);
    eveils.push(opacite());
    t.avancer(220);
    eveils.push(opacite());
    t.avancer(220);
    eveils.push(opacite());
    expect(eveils[0], "la graine n’est pas pleine au départ").toBeCloseTo(1, 2);
    expect(eveils[1]).toBeLessThan(eveils[0]);
    expect(eveils[2]).toBeLessThan(eveils[1]);
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
