import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ITEMS, LIBELLES_NIVEAU, LIBELLE_INCONNU } from "@/lib/domain/enneagramme-items";
import { NIVEAUX } from "@/lib/domain/enneagramme";
import { reperesPourIntroduction } from "@/lib/corpus/enneagramme";

/**
 * enneagramme-halte.test.tsx — LA HALTE, RÉELLEMENT MONTÉE (Story 5.5, T8).
 *
 * `app/enneagramme/actions.ts` a ses gardes serveur ; elles ne peuvent rien dire de ce que quelqu'un
 * VOIT ni de ce qui part quand on clique deux fois. Or c'est exactement là que vivent les défauts
 * que cette story doit fermer :
 *
 *   • un compteur, une jauge, un « 12 sur 18 » — FR-031 les interdit, et rien dans le type ne les
 *     empêche : ils se dérivent de la longueur d'un tableau ;
 *   • le focus qui retombe sur `<body>` à chaque réponse — un test de dix-huit questions devient
 *     injouable au clavier, et la garde de source ne le verrait pas (revue 4.6, quatre fois) ;
 *   • le verrou d'envoi — un `useState` s'écrit pareil qu'un `useRef` et ne tient pas ;
 *   • les trois réponses d'égale lisibilité (AC2, au mot près) — une ligne de CSS suffit à faire de
 *     « Oui » la réponse suggérée.
 */

const enregistrerReponses = vi.fn();
const conclureTest = vi.fn();
const accepterHypothese = vi.fn();
const refuserHypothese = vi.fn();
const recommencerTest = vi.fn();
const effacerType = vi.fn();

vi.mock("@/app/enneagramme/actions", () => ({
  enregistrerReponses: (r: unknown) => enregistrerReponses(r),
  conclureTest: (r: unknown) => conclureTest(r),
  accepterHypothese: (id: string) => accepterHypothese(id),
  refuserHypothese: (id: string) => refuserHypothese(id),
  recommencerTest: () => recommencerTest(),
  effacerType: () => effacerType(),
}));

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

// ⚠️ LE QUESTIONNAIRE A DÉMÉNAGÉ (2026-09-03) : il est partagé avec le Big Five
// (`render/psychologie/QuestionnaireCourt.tsx`), et ses trois gestes serveur lui DESCENDENT en
// propriétés au lieu d'être importés. Le mock ci-dessus reste en place — il sert encore aux trois
// autres composants — et `monterTest` passe les mêmes doubles en propriétés : ce que ce fichier
// mesure (le verrou, le focus, l'absence de compteur) n'a pas bougé d'une ligne.
const { default: QuestionnaireCourt } = await import("@/render/psychologie/QuestionnaireCourt");
const { COPIE_QUESTIONNAIRE_ENNEAGRAMME } = await import("@/lib/domain/copie-questionnaire");
const { default: IntroductionEnneagramme } = await import("@/app/enneagramme/introduction");
const { default: Hypothese } = await import("@/app/enneagramme/hypothese");
const { default: Resultat } = await import("@/app/enneagramme/resultat");

const AFFICHES = ITEMS.map(({ id, texte }) => ({ id, texte }));
const LIBELLES = NIVEAUX.map((n) => LIBELLES_NIVEAU[n]);

beforeEach(() => {
  for (const m of [
    enregistrerReponses,
    conclureTest,
    accepterHypothese,
    refuserHypothese,
    recommencerTest,
    effacerType,
    push,
    refresh,
  ]) {
    m.mockReset();
  }
  enregistrerReponses.mockResolvedValue({ ok: true });
  conclureTest.mockResolvedValue({ statut: "retenu" });
  accepterHypothese.mockResolvedValue({ statut: "repondu" });
  refuserHypothese.mockResolvedValue({ statut: "repondu" });
});

const monterTest = (
  deja: Record<string, number | null> = {},
  options: { nouvelle?: boolean; issueInitiale?: "en_cours" | "indetermine" } = {},
) =>
  render(
    <QuestionnaireCourt
      items={AFFICHES}
      libelles={LIBELLES}
      libelleInconnu={LIBELLE_INCONNU}
      reponsesInitiales={deja}
      nouvelle={options.nouvelle ?? false}
      issueInitiale={options.issueInitiale ?? "en_cours"}
      introduction={<IntroductionEnneagramme />}
      actions={{
        enregistrer: (r) => enregistrerReponses(r),
        conclure: (r) => conclureTest(r),
        recommencer: () => recommencerTest(),
      }}
      copie={COPIE_QUESTIONNAIRE_ENNEAGRAMME}
    />,
  );

describe("[13.8] comprendre avant de commencer", () => {
  it("explique simplement la méthode, sa limite, et ouvre les neuf repères du corpus dans une feuille", async () => {
    // ⚠️ LES NEUF TEXTES N'APPARAISSENT QU'À L'OUVERTURE, ET C'EST LE RETOUR DU FONDATEUR
    // (2026-09-02) : « les tiroirs sont un peu longs. Moins de scroll, plus de pop-up, une app
    // plus dynamique ». Ce test exigeait les neuf textes SANS clic : c'est exactement la colonne
    // qu'on lui a demandé de faire disparaître. L'exigence qui reste entière : les neuf textes
    // sont CEUX du corpus (`reperesPourIntroduction`, FR-054), tous, dans le dialogue, et la
    // feuille se referme d'Échap en rendant le focus à la porte (`EXPERIENCE.md` ligne 216).
    render(<IntroductionEnneagramme />);
    expect(screen.getByText(/grille de lecture/i)).toBeTruthy();
    expect(screen.getByText(/hypothèse/i)).toBeTruthy();
    const porte = screen.getByRole("button", { name: /Voir les neuf repères/i });
    for (const repere of reperesPourIntroduction()) {
      expect(screen.queryByText(repere.texte), "un repère s'empile encore dans la page").toBeNull();
    }

    await userEvent.click(porte);
    const feuille = screen.getByRole("dialog");
    for (const repere of reperesPourIntroduction()) {
      expect(within(feuille).getByText(repere.texte)).toBeTruthy();
    }

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement, "le focus n'est pas revenu à la porte").toBe(porte);
  });

  it("une nouvelle passe attend le geste « Commencer » avant de montrer la première question", async () => {
    monterTest({}, { nouvelle: true });
    expect(screen.queryByText(ITEMS[0].texte)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Commencer/i }));
    expect(screen.getByText(ITEMS[0].texte)).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// FR-031 — aucun compteur, aucune jauge, aucun score
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[5.5/AC1 DUR] rien ne compte à l’écran (FR-031)", () => {
  it("[LE CŒUR] AUCUN chiffre nulle part, même à mi-parcours", () => {
    // Mutation-cible : afficher « 10 sur 18 », une barre, un anneau, un pourcentage. Rien dans le
    // type ne l'empêche — un compteur se dérive de la longueur d'un tableau. Dix-huit questions sur
    // la manière dont on cède deviennent une performance à terminer dès qu'un compte s'affiche.
    const deja = Object.fromEntries(ITEMS.slice(0, 10).map((i) => [i.id, 2]));
    const { container } = monterTest(deja);
    expect(container.textContent ?? "").not.toMatch(/\d/);
  });

  it("aucun rôle de progression, aucun mot qui compte", () => {
    const { container } = monterTest();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.querySelector("progress")).toBeNull();
    const texte = (container.textContent ?? "").toLowerCase();
    for (const mot of ["sur 18", "étape", "question ", "reste", "progression", "%"]) {
      expect(texte, `« ${mot} » compte`).not.toContain(mot);
    }
  });

  it("[AC8] le barème ne descend pas : aucun type dans le HTML", () => {
    // Publier `{id, texte, type}` laisserait voir quel type chaque phrase pèse — EN RÉPONDANT. Un
    // test dont on voit la grille mesure ce qu'on veut être, plus ce qu'on est.
    const { container } = monterTest();
    const html = container.innerHTML;
    for (const item of ITEMS) {
      expect(html, `le type de ${item.id} ne doit pas sortir`).not.toContain(`"type":${item.type}`);
    }
    // Le témoin : l'identifiant stable, lui, n'a pas non plus besoin de sortir en clair — c'est le
    // texte qui est montré. On vérifie surtout qu'aucune structure du barème n'est sérialisée.
    expect(html).not.toContain("bareme");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Une question à la fois, la reprise, le focus
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[5.5/AC1] une question à la fois, reprise là où elle s’était arrêtée", () => {
  it("un seul énoncé est affiché, avec quatre fréquences et « Je ne sais pas »", () => {
    monterTest();
    expect(screen.getByText(ITEMS[0].texte)).toBeTruthy();
    expect(screen.getByRole("group", { name: ITEMS[0].texte })).toBeTruthy();
    expect(screen.queryByText(ITEMS[1].texte), "les autres questions ne sont pas montées").toBeNull();
    const liste = screen.getByRole("list");
    expect(within(liste).getAllByRole("button")).toHaveLength(5);
  });

  it("[NFR-017] elle reprend au PREMIER énoncé sans réponse", () => {
    const deja = Object.fromEntries(ITEMS.slice(0, 5).map((i) => [i.id, 1]));
    monterTest(deja);
    expect(screen.getByText(ITEMS[5].texte)).toBeTruthy();
    expect(screen.queryByText(ITEMS[0].texte), "ce qui est fait ne se refait pas").toBeNull();
  });

  it("[LE CŒUR] le focus ne retombe JAMAIS sur <body> après une réponse", async () => {
    // ⚠️ CE QUE CE TEST GARDE RÉELLEMENT — et il a fallu un mutant survivant pour l'établir. Le
    // focus tient à la STABILITÉ DES CLÉS des quatre `<li>` : clés sur le libellé, React réconcilie
    // les mêmes nœuds et le focus reste sur le bouton cliqué. Une clé qui dépendrait de l'énoncé
    // (`key={courant.id}`) démonterait les quatre boutons à chaque réponse — focus sur <body>, et un
    // test de dix-huit questions injouable au clavier. C'est le défaut trouvé quatre fois en 4.6.
    monterTest();
    const avant = screen.getByRole("button", { name: LIBELLES[3] });
    await userEvent.click(avant);
    await screen.findByText(ITEMS[1].texte);
    expect(document.activeElement, "jamais <body>").not.toBe(document.body);
    expect((document.activeElement as HTMLElement)?.tagName).toBe("BUTTON");
    // …et il reste sur le degré qu'elle venait de choisir, pas ramené de force sur le premier :
    // déplacer le focus vers une réponse qu'elle n'a pas choisie est un petit geste hostile.
    expect(document.activeElement?.textContent).toBe(LIBELLES[3]);
  });

  it("les quatre fréquences sont illustrées par le glyphe Psychologie établi, jamais un emoji", () => {
    monterTest();
    for (const [index, libelle] of LIBELLES.entries()) {
      const bouton = screen.getByRole("button", { name: libelle });
      expect(bouton.querySelectorAll("svg"), libelle).toHaveLength(index + 1);
      for (const glyphe of bouton.querySelectorAll("svg")) {
        expect(glyphe.getAttribute("aria-hidden")).not.toBeNull();
      }
      expect(bouton.textContent).not.toMatch(/[😀-🙏]/u);
    }
    expect(screen.getByRole("button", { name: LIBELLE_INCONNU }).querySelector("svg")).toBeNull();
  });

  it("les cinq réponses ont EXACTEMENT la même forme", () => {
    // Une réponse dont le dessin porte davantage de poids suggérerait une bonne réponse.
    monterTest();
    const boutons = within(screen.getByRole("list")).getAllByRole("button");
    const classes = new Set(boutons.map((b) => b.className));
    expect(classes.size, "un seul dessin de bouton pour les cinq réponses").toBe(1);
  });

  it("« Je ne sais pas » persiste `null`, avance et ne devient jamais un zéro", async () => {
    monterTest();
    await userEvent.click(screen.getByRole("button", { name: LIBELLE_INCONNU }));
    expect(enregistrerReponses).toHaveBeenCalledWith({ [ITEMS[0].id]: null });
    expect(screen.getByText(ITEMS[1].texte)).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le verrou d'envoi, et l'échec jamais silencieux
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[5.5/AC1] deux clics ne font pas deux envois", () => {
  it("[LE CŒUR] le verrou est SYNCHRONE — le dernier énoncé ne conclut qu’une fois", async () => {
    // Mutation-cible : remplacer le `useRef` par un `useState`. L'état ne se met à jour qu'au rendu
    // suivant : deux clics rapides enverraient deux conclusions, et la seconde rendrait `false` —
    // un état parfaitement correct annoncé comme un échec.
    // ⚠️ LES DEUX CLICS SONT SYNCHRONES, DANS LE MÊME TICK, et c'est TOUTE la valeur de ce test.
    // Avec `userEvent.click` (qui rend la main entre les deux), React a le temps de vider sa file :
    // le bouton passe `disabled`, le second clic ne part pas, et un `useState` passerait le test
    // aussi bien qu'un `useRef`. Le mutant l'a démontré — il a SURVÉCU à la première version.
    //
    // Deux `.click()` natifs de suite : le premier gestionnaire appelle son `setState`, qui n'est
    // PAS encore appliqué quand le second s'exécute. Seul un `useRef`, muté sur-le-champ, tient.
    let debloquer: (v: unknown) => void = () => {};
    conclureTest.mockImplementation(() => new Promise((r) => (debloquer = r)));
    const deja = Object.fromEntries(ITEMS.slice(0, ITEMS.length - 1).map((i) => [i.id, 2]));
    monterTest(deja);
    const bouton = screen.getByRole("button", { name: LIBELLES[3] }) as HTMLButtonElement;
    bouton.click();
    bouton.click();
    debloquer({ statut: "retenu" });
    expect(conclureTest).toHaveBeenCalledTimes(1);
  });

  it("un enregistrement qui échoue se DIT, et ne perd rien à l’écran", async () => {
    enregistrerReponses.mockResolvedValue({ ok: false });
    monterTest();
    await userEvent.click(screen.getByRole("button", { name: LIBELLES[0] }));
    const alerte = await screen.findByRole("alert");
    expect(alerte.textContent).toBeTruthy();
    // Elle a quand même avancé : ses réponses vivent dans l'état local et repartiront à la conclusion.
    expect(screen.getByText(ITEMS[1].texte)).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le résultat indéterminé — le produit refuse de fabriquer un type
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[13.8] aucun type n’est demandé à quelqu’un que le test n’a pas su lire", () => {
  it("[LE CŒUR] l’égalité finit sur un résultat honnêtement indéterminé, sans type cliquable", async () => {
    conclureTest.mockResolvedValue({ statut: "indetermine" });
    const deja = Object.fromEntries(ITEMS.slice(0, ITEMS.length - 1).map((i) => [i.id, 2]));
    monterTest(deja);
    await userEvent.click(screen.getByRole("button", { name: LIBELLES[3] }));

    const bloc = await screen.findByRole("region", { name: /sans type/i });
    expect(bloc.textContent).toMatch(/aucun type/i);
    expect(within(bloc).queryByRole("button", { name: /type \d/i })).toBeNull();
  });

  it("un résultat indéterminé persisté reste visible après remontage", () => {
    const deja = Object.fromEntries(ITEMS.map((i) => [i.id, 2]));
    monterTest(deja, { issueInitiale: "indetermine" });
    expect(screen.getByRole("region", { name: /sans type/i })).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// AC2 — les trois réponses, d'égale lisibilité
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[5.5/AC2 DUR] accepter, refuser, corriger — strictement à égalité", () => {
  const PHRASE = "Ce qui revient chez toi ressemble à ce qu’on appelle le type 4. Est-ce que ça te parle ?";

  it("[LE CŒUR] les trois boutons ont le MÊME dessin", () => {
    // Mutation-cible : donner à « Oui » la classe du bouton d'accent et aux deux autres celle des
    // gestes discrets. C'est une ligne de CSS, c'est le réflexe de tout formulaire, et ça
    // transforme une hypothèse en réponse suggérée. Aucune lecture de type ne le verrait.
    render(<Hypothese hypotheseId="h-1" phrase={PHRASE} />);
    const boutons = within(screen.getByRole("list")).getAllByRole("button");
    expect(boutons).toHaveLength(3);
    expect(new Set(boutons.map((b) => b.className)).size, "un seul dessin pour les trois").toBe(1);
    // …et le même registre typographique dans chacun.
    const spans = boutons.map((b) => b.querySelector("span")?.className);
    expect(new Set(spans).size).toBe(1);
  });

  it("« oui » écrit le type de la LIGNE — l’identifiant, jamais un numéro", async () => {
    render(<Hypothese hypotheseId="h-1" phrase={PHRASE} />);
    await userEvent.click(screen.getByRole("button", { name: /ça me parle/i }));
    expect(accepterHypothese).toHaveBeenCalledWith("h-1");
    expect(refresh).toHaveBeenCalled();
  });

  it("[LE CŒUR] refuser et corriger écrivent pareil, mais N’EMMÈNENT PAS AU MÊME ENDROIT", async () => {
    // Sans cette différence, le troisième bouton serait un doublon — et un doublon présenté comme
    // un choix est une fausse liberté.
    const { unmount } = render(<Hypothese hypotheseId="h-1" phrase={PHRASE} />);
    await userEvent.click(screen.getByRole("button", { name: /ce n’est pas moi/i }));
    expect(refuserHypothese).toHaveBeenCalledWith("h-1");
    expect(push, "refuser ramène à la scène : on ne lui demande rien de plus").toHaveBeenCalledWith("/");
    unmount();

    push.mockReset();
    refresh.mockReset();
    render(<Hypothese hypotheseId="h-1" phrase={PHRASE} />);
    await userEvent.click(screen.getByRole("button", { name: /répondre au test/i }));
    expect(push, "corriger la garde ici — le test commence").not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("un refus qui échoue se DIT — jamais un silence", async () => {
    refuserHypothese.mockResolvedValue({ statut: "erreur", message: "Je n’ai pas pu enregistrer ça." });
    render(<Hypothese hypotheseId="h-1" phrase={PHRASE} />);
    await userEvent.click(screen.getByRole("button", { name: /ce n’est pas moi/i }));
    expect((await screen.findByRole("alert")).textContent).toContain("pas pu");
  });

  it("le verrou synchrone : deux clics, une seule acceptation", async () => {
    let debloquer: (v: unknown) => void = () => {};
    accepterHypothese.mockImplementation(() => new Promise((r) => (debloquer = r)));
    render(<Hypothese hypotheseId="h-1" phrase={PHRASE} />);
    const oui = screen.getByRole("button", { name: /ça me parle/i });
    await userEvent.click(oui);
    await userEvent.click(oui).catch(() => {});
    debloquer({ statut: "repondu" });
    expect(accepterHypothese).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le résultat
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[5.5/AC1/AC3] le résultat : un type, jamais un score", () => {
  const SANS_TEXTE = "Anima n’a pas encore écrit ce qu’elle voit dans ce type. Son texte se posera ici.";

  it("le créneau vide est dit HONNÊTEMENT, dans la voix du produit", () => {
    // `TexteCorpus` n'a que deux états : il n'existe pas de « texte par défaut ». Combler le vide
    // ici fabriquerait un texte sans auteur qui aurait l'air d'un texte d'Anima (FR-054/FR-086).
    const { container } = render(
      <Resultat type={4} origine="test" texte={null} messageSansTexte={SANS_TEXTE} />,
    );
    const phrase = screen.getByText(SANS_TEXTE);
    expect(phrase.className, "voix PRODUIT, jamais `t-anam`").toContain("t-corps");
    expect(container.querySelector(".t-anam"), "Anam ne parle pas sur cet écran").toBeNull();
  });

  it("un texte d’Anima, lui, paraît dans SA voix", () => {
    render(
      <Resultat type={4} origine="test" texte="Un texte d’Anima." messageSansTexte={SANS_TEXTE} />,
    );
    expect(screen.getByText("Un texte d’Anima.").className).toContain("t-anam");
  });

  it("le seul chiffre à l’écran est le TYPE — jamais un total ni un pourcentage", () => {
    const { container } = render(
      <Resultat type={7} origine="hypothese" texte={null} messageSansTexte={SANS_TEXTE} />,
    );
    const chiffres = (container.textContent ?? "").match(/\d+/g) ?? [];
    expect(chiffres).toEqual(["7"]);
  });

  it("[AC6] refaire et effacer sont là, visibles, sans confirmation solennelle", async () => {
    render(<Resultat type={4} origine="test" texte={null} messageSansTexte={SANS_TEXTE} />);
    await userEvent.click(screen.getByRole("button", { name: /Effacer/i }));
    expect(effacerType).toHaveBeenCalledTimes(1);
  });

  it("[LE CŒUR] « Refaire » n’efface PAS son type — il ouvre le test", async () => {
    // Le réflexe serait de repartir d'une page blanche. Il la laisserait SANS TYPE si elle
    // abandonne au huitième énoncé — pour avoir voulu vérifier son résultat.
    render(<Resultat type={4} origine="test" texte={null} messageSansTexte={SANS_TEXTE} />);
    await userEvent.click(screen.getByRole("button", { name: /Refaire/i }));
    expect(recommencerTest).toHaveBeenCalledTimes(1);
    expect(effacerType, "son type reste jusqu’à ce qu’un nouveau le remplace").not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/enneagramme?refaire=1");
  });
});
