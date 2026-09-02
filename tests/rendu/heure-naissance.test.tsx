import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LieuNaissance } from "@/lib/astro/lieux";
import { libelleLieu } from "@/lib/astro/lieux";
import {
  BULLE_SANS_HEURE,
  OU_TROUVER_SON_HEURE,
  RESUME_OU_TROUVER,
} from "@/lib/domain/message-sans-heure";

/**
 * REVUE DE CODE du 2026-08-12 (A2) — LE FORMULAIRE DE L'HEURE ET DU LIEU, RÉELLEMENT MONTÉ.
 *
 * `tests/heure-naissance-actions.test.ts` garde le SERVEUR : ce qui est écrit, ce qui est refusé.
 * Il ne peut rien dire de ce que quelqu'un voit ni de ce que le navigateur envoie — et c'est là que
 * vivait A2 : les deux champs étaient `required`, donc une personne sans heure de naissance ne
 * pouvait pas non plus donner sa commune. Le serveur n'aurait jamais vu passer cet envoi-là.
 *
 * On garde ici trois choses que seule une montée réelle établit :
 *   • ce qui est DEMANDÉ (et ce qui ne l'est plus quand c'est déjà gravé) ;
 *   • ce que le navigateur ENVERRA — un champ `disabled` ne fait pas partie du FormData, et c'est
 *     ce qui empêche mécaniquement la contradiction « case cochée + heure remplie » ;
 *   • quand le bouton s'ouvre — un bouton ouvert sur un envoi qui n'a rien à écrire est une
 *     promesse qu'on ne tient pas.
 *
 * ── ET DEPUIS LE 2026-09-01 : L'ÉCRAN QUI SAUTE AUX YEUX ───────────────────────────────────────
 *
 * Retour terrain de Julian : « un écran qui saute aux yeux avec un gros bouton et beaucoup moins de
 * texte. Il faudrait presque qu'Anam arrive avec une bulle. Ville de naissance : plusieurs villes
 * (ex. Saint-Denis), comment départager : tu ne montres pas le département. » Le dernier bloc de ce
 * fichier garde ces quatre choses : la bulle, l'aide repliée, le bouton, les homonymes.
 */

const chercherLieux = vi.fn();

vi.mock("@/app/heure-naissance/actions", () => ({
  chercherLieux: (q: string) => chercherLieux(q),
  enregistrerHeureEtLieu: async () => ({ statut: "saisie" as const }),
}));

const { default: FormulaireHeure } = await import("@/app/heure-naissance/formulaire-heure");
const { default: BulleAnam } = await import("@/app/heure-naissance/bulle-anam");

const RIEN = { heure: null, lieu: null };

/**
 * Un lieu COMPLET, tel que `LieuxPort` le rend depuis le référentiel. ⚠️ `nom` est le nom OFFICIEL,
 * sans département : c'est lui que `actions.ts` grave dans `lieu_naissance`. Le « (33) » ne vit que
 * dans `libelle`. La fixture d'origine écrivait `nom: "Bordeaux (33)"`, ce qui était un mensonge sur
 * ce que la base contient, et aurait fait passer pour vrai un écran qui affiche `nom`.
 */
function lieu(nom: string, code: string, departement: { code: string; nom: string }): LieuNaissance {
  return {
    nom,
    code,
    latitude: 44.84,
    longitude: -0.58,
    fuseau: "Europe/Paris",
    population: 1000,
    departement,
    libelle: libelleLieu(nom, departement),
  };
}
const BORDEAUX = lieu("Bordeaux", "33063", { code: "33", nom: "Gironde" });

beforeEach(() => {
  chercherLieux.mockReset();
  chercherLieux.mockResolvedValue([]);
});

/** Ce que le navigateur enverrait vraiment : `FormData` ignore les champs désactivés. */
function envoi(): FormData {
  const form = document.querySelector("form");
  if (!form) throw new Error("aucun formulaire monté");
  return new FormData(form);
}

const bouton = () => screen.getByRole("button", { name: /^Enregistrer$/ }) as HTMLButtonElement;

describe("[A2] la commune se demande même quand l’heure manque", () => {
  it("[CONTRÔLE POSITIF] par défaut, les deux sont demandés", () => {
    render(<FormulaireHeure deja={RIEN} />);
    expect(screen.getByLabelText(/l’heure de ta naissance/i)).toBeTruthy();
    expect(screen.getByLabelText(/ta commune de naissance/i)).toBeTruthy();
  });

  it("l’heure est `required` tant qu’on ne déclare pas ne pas la connaître", () => {
    render(<FormulaireHeure deja={RIEN} />);
    expect((screen.getByLabelText(/l’heure de ta naissance/i) as HTMLInputElement).required).toBe(true);
  });

  it("[LE TEST QUI COMPTE] cocher « je ne connais pas mon heure » libère le champ", async () => {
    render(<FormulaireHeure deja={RIEN} />);
    await userEvent.click(screen.getByLabelText(/je ne connais pas mon heure/i));
    const champ = screen.getByLabelText(/l’heure de ta naissance/i) as HTMLInputElement;
    expect(champ.required, "un champ obligatoire bloquerait l’envoi côté navigateur").toBe(false);
    expect(champ.disabled).toBe(true);
  });

  it("[DUR] une heure saisie PUIS la case cochée ne part pas — le serveur refuserait la contradiction", async () => {
    // Le serveur refuse « case cochée + heure remplie » (il ne choisit pas à sa place), et il a
    // raison. Mais lui faire rencontrer ce refus serait un cul-de-sac fabriqué par l'écran : c'est
    // au formulaire de rendre la contradiction impossible, pas à elle de la démêler.
    render(<FormulaireHeure deja={RIEN} />);
    await userEvent.type(screen.getByLabelText(/l’heure de ta naissance/i), "07:15");
    expect(envoi().get("heure_naissance")).toBe("07:15");

    await userEvent.click(screen.getByLabelText(/je ne connais pas mon heure/i));
    expect(envoi().get("heure_naissance"), "un champ désactivé ne fait pas partie de l’envoi").toBeNull();
    expect(envoi().get("sans_heure")).toBe("oui");
  });

  it("décocher la case rend le champ, et son contenu repart", async () => {
    render(<FormulaireHeure deja={RIEN} />);
    await userEvent.type(screen.getByLabelText(/l’heure de ta naissance/i), "07:15");
    const case_ = screen.getByLabelText(/je ne connais pas mon heure/i);
    await userEvent.click(case_);
    await userEvent.click(case_);
    expect(envoi().get("heure_naissance")).toBe("07:15");
    expect(envoi().get("sans_heure")).toBeNull();
  });
});

describe("[A2] on ne redemande pas ce qui est déjà gravé", () => {
  it("commune déjà enregistrée : le champ disparaît, et elle est rappelée en clair", () => {
    // `deja.lieu` est ce que la base contient : le `nom`, jamais le libellé avec département.
    render(<FormulaireHeure deja={{ heure: null, lieu: BORDEAUX.nom }} />);
    expect(screen.queryByLabelText(/ta commune de naissance/i)).toBeNull();
    expect(screen.getByText(/Bordeaux/)).toBeTruthy();
    // L'heure, elle, reste demandée : c'est exactement le parcours qu'ouvre le découplage.
    expect(screen.getByLabelText(/l’heure de ta naissance/i)).toBeTruthy();
  });

  it("heure déjà enregistrée : ni le champ, ni la case de déclaration d’absence", () => {
    render(<FormulaireHeure deja={{ heure: "07:15:00", lieu: null }} />);
    expect(screen.queryByLabelText(/l’heure de ta naissance/i)).toBeNull();
    expect(screen.queryByLabelText(/je ne connais pas mon heure/i)).toBeNull();
    expect(screen.getByLabelText(/ta commune de naissance/i)).toBeTruthy();
  });
});

describe("[A2] le bouton ne s’ouvre que sur un envoi qui a quelque chose à écrire", () => {
  it("aucune commune choisie : fermé", () => {
    render(<FormulaireHeure deja={RIEN} />);
    expect(bouton().disabled).toBe(true);
  });

  it("commune déjà gravée, heure encore à donner : OUVERT sans rien choisir", () => {
    render(<FormulaireHeure deja={{ heure: null, lieu: BORDEAUX.nom }} />);
    expect(bouton().disabled, "elle revient avec son heure : il n’y a plus de commune à choisir").toBe(false);
  });

  it("[LE BORD] tout est déjà gravé : fermé — un bouton ouvert promettrait un geste sans effet", () => {
    render(<FormulaireHeure deja={{ heure: "07:15:00", lieu: BORDEAUX.nom }} />);
    expect(bouton().disabled).toBe(true);
  });

  it("une commune choisie dans la liste ouvre le bouton", async () => {
    chercherLieux.mockResolvedValue([BORDEAUX]);
    render(<FormulaireHeure deja={RIEN} />);
    await userEvent.type(screen.getByLabelText(/ta commune de naissance/i), "Bordeaux");
    // La ligne proposée porte le LIBELLÉ (avec département), pas le nom nu.
    const proposition = await screen.findByRole("button", { name: "Bordeaux (33)" }, { timeout: 3000 });
    await userEvent.click(proposition);
    expect(bouton().disabled).toBe(false);
    // Le CODE seul est posté : le serveur re-résout les coordonnées lui-même.
    expect(envoi().get("code_lieu")).toBe("33063");
    expect(envoi().get("lieu_latitude")).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Retour terrain du 2026-09-01 : l'écran qui saute aux yeux
// ══════════════════════════════════════════════════════════════════════════════════════════════

const RACINE = process.cwd();
const lire = (p: string) => readFileSync(resolve(RACINE, p), "utf-8");
/** Retire les commentaires (bloc, ligne et JSX) pour ne regarder que ce qui est AFFICHÉ ou écrit. */
const sansCommentaires = (src: string) =>
  src.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("[2026-09-01] Anam arrive avec une bulle", () => {
  it("[LE CŒUR] la bulle porte la phrase de `lib/domain`, mot pour mot, dans la voix d’Anam", () => {
    const { container } = render(<BulleAnam />);
    const parole = screen.getByText(BULLE_SANS_HEURE);
    expect(parole.className, "c’est Anam qui parle : `t-anam`").toMatch(/\bt-anam\b/);
    // Elle PARAÎT : le fondu est la seule grammaire de mouvement du produit (jamais un rebond).
    expect(parole.className).toMatch(/\bfondu-texte\b/);
    expect(container.querySelector(".fondu-personnage"), "le personnage entre en fondu").not.toBeNull();
  });

  it("[LE CŒUR] l’image d’Anam est là, avec l’alt sobre d’`ImageAnam`", () => {
    render(<BulleAnam />);
    // `role="img"` + `aria-label` sur l'enveloppe : l'`<img>` interne est décoratif (alt vide).
    expect(screen.getByRole("img", { name: "Illustration nocturne" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: /femme|lotus|visage/i }), "jamais un alt révélateur").toBeNull();
  });

  it("[ANTI-VACUITÉ] la page rend la bulle sous le retour à la scène, et ne répète plus « où trouver » en clair", () => {
    const page = sansCommentaires(lire("app/heure-naissance/page.tsx"));
    const retour = page.indexOf("<RetourScene");
    const bulle = page.indexOf("<BulleAnam />");
    const formulaire = page.indexOf("<FormulaireHeure");
    expect(retour, "le chemin de retour a disparu").toBeGreaterThan(-1);
    expect(bulle, "la bulle n’est plus câblée dans la page").toBeGreaterThan(retour);
    expect(formulaire, "la bulle vient AVANT les champs").toBeGreaterThan(bulle);
    expect(page, "le paragraphe de trois lignes est revenu au-dessus des champs").not.toMatch(
      /OU_TROUVER_SON_HEURE/,
    );
  });

  it("[LE CŒUR] la bulle « il me manque ton heure » ne se montre qu'à celle dont l'heure manque", () => {
    // Revue du 2026-09-02 : la bulle était rendue à tout le monde, y compris à celle qui revient
    // pour sa commune seule avec une heure déjà gravée. Anam ne réclame pas ce qu'elle a.
    const page = sansCommentaires(lire("app/heure-naissance/page.tsx"));
    expect(page).toMatch(/const heureManque = \(deja\?\.heure_naissance \?\? null\) === null;/);
    expect(page).toMatch(/\{heureManque && <BulleAnam \/>\}/);
  });
});

describe("[2026-09-01] beaucoup moins de texte", () => {
  it("[LE CŒUR / FR-050] « où trouver » est PRÉSENT, mais dans un `<details>` FERMÉ", () => {
    // FR-050 exige d'indiquer où chercher ; le retour terrain exige de ne pas l'étaler. Les deux
    // tiennent : le texte est dans le document, replié derrière son résumé.
    render(<FormulaireHeure deja={RIEN} />);
    const texte = screen.getByText(OU_TROUVER_SON_HEURE);
    const details = texte.closest("details") as HTMLDetailsElement | null;
    expect(details, "le texte n’est plus replié").not.toBeNull();
    expect(details!.open, "replié PAR DÉFAUT, c’est tout le point").toBe(false);
    expect(details!.querySelector("summary")?.textContent).toBe(RESUME_OU_TROUVER);
  });

  it("le champ de l’heure est DÉCRIT par le résumé de l’aide repliée, pas par un paragraphe", () => {
    render(<FormulaireHeure deja={RIEN} />);
    const champ = screen.getByLabelText(/l’heure de ta naissance/i);
    const id = champ.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)?.textContent).toBe(RESUME_OU_TROUVER);
  });

  it("[LE BORD] heure déjà gravée : plus d’aide repliée, il n’y a plus rien à chercher", () => {
    render(<FormulaireHeure deja={{ heure: "07:15:00", lieu: null }} />);
    expect(screen.queryByText(OU_TROUVER_SON_HEURE)).toBeNull();
  });

  it("« Je ne connais pas mon heure. » : UN geste, une phrase", () => {
    render(<FormulaireHeure deja={RIEN} />);
    expect(screen.getByLabelText("Je ne connais pas mon heure.")).toBeTruthy();
  });

  it("la confirmation, raccourcie, dit toujours les deux faits : commune figée, heure corrigeable", () => {
    // Raccourcir n'est pas retirer : 0039 fige le lieu, 0060 a ouvert l'heure. Les deux restent dits.
    render(<FormulaireHeure deja={RIEN} />);
    const etiquette = screen.getByLabelText(/j’ai vérifié/i).closest("label")!;
    expect(etiquette.textContent).toMatch(/commune ne se change plus/i);
    expect(etiquette.textContent).toMatch(/heure reste corrigeable/i);
    expect(etiquette.textContent!.length, "trois lignes, c’était trop").toBeLessThan(90);
  });

  it("[LE BORD] aucun tiret cadratin ni demi-cadratin hors commentaires, dans les trois fichiers de l’écran", () => {
    // Interdits désormais dans tout texte affiché. On retire les commentaires (qui peuvent en
    // garder) et on regarde tout le reste : chaînes ET texte JSX.
    for (const f of [
      "app/heure-naissance/page.tsx",
      "app/heure-naissance/formulaire-heure.tsx",
      "app/heure-naissance/bulle-anam.tsx",
    ]) {
      expect(sansCommentaires(lire(f)), `tiret affiché dans ${f}`).not.toMatch(/[—–]/);
    }
  });
});

describe("[2026-09-01] un gros bouton", () => {
  it("[LE CŒUR] le bouton principal est « Enregistrer », gros et pleine largeur", () => {
    render(<FormulaireHeure deja={RIEN} />);
    const b = screen.getByRole("button", { name: "Enregistrer" });
    expect(b.getAttribute("type")).toBe("submit");
    // « Compléter mon ciel » (essayé le 2026-09-01) faisait du ciel un objet incomplet : le
    // vocabulaire de jauge que FR-031 écarte (revue du 2026-09-02). Le geste, gros et pleine
    // largeur, garde son verbe ; il ne revient nulle part sous l'autre forme.
    expect(screen.queryByRole("button", { name: /compléter mon ciel/i }), "le vocabulaire de complétude est revenu").toBeNull();
  });

  it("[ANTI-VACUITÉ] il est pleine largeur et plus haut que la cible minimale, en tokens, dans le module", () => {
    // jsdom ne fait pas de mise en page : c'est la SOURCE qui atteste la règle, comme pour les
    // anneaux de focus. Un `width: 100%` sur le bouton, le token de cible tactile écrit tel quel
    // (c'est ce que `tests/cible-tactile.test.ts` lit), et un rembourrage vertical en tokens qui
    // porte la hauteur réelle au-dessus des 44 px.
    const css = lire("app/heure-naissance/heure-naissance.module.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const bloc = css.match(/\.boutonPrincipal\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(bloc, "`.boutonPrincipal` a disparu du module").not.toBe("");
    expect(bloc).toMatch(/width:\s*100%/);
    expect(bloc).toMatch(/min-height:\s*var\(--cible-tactile\)/);
    expect(bloc, "le rembourrage vertical est ce qui le rend GROS").toMatch(/padding:\s*var\(--esp-[4-6]\)/);
    expect(css, "aucune couleur en dur : les tokens seulement").not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    // Et le composant l'emploie vraiment : un style orphelin serait une garde creuse.
    expect(sansCommentaires(lire("app/heure-naissance/formulaire-heure.tsx"))).toMatch(/s\.boutonPrincipal/);
  });

  it("le motif de blocage en toutes lettres (T18) survit au nouveau libellé", () => {
    render(<FormulaireHeure deja={RIEN} />);
    expect(bouton().getAttribute("aria-describedby")).toBe("motif-blocage-heure");
    expect(document.getElementById("motif-blocage-heure")?.textContent).toMatch(/commune/i);
  });
});

describe("[2026-09-01] les homonymes se départagent par le département", () => {
  const SAINT_DENIS_93 = lieu("Saint-Denis", "93066", { code: "93", nom: "Seine-Saint-Denis" });
  const SAINT_DENIS_974 = lieu("Saint-Denis", "97411", { code: "974", nom: "La Réunion" });

  it("[CONTRÔLE DU CONTRÔLE] les deux fixtures partagent le même `nom` : sans libellé, rien ne les distingue", () => {
    expect(SAINT_DENIS_93.nom).toBe(SAINT_DENIS_974.nom);
    expect(SAINT_DENIS_93.libelle).not.toBe(SAINT_DENIS_974.libelle);
  });

  it("[LE CŒUR] deux « Saint-Denis » sont deux lignes distinctes, et c’est le `code` du choisi qui part", async () => {
    chercherLieux.mockResolvedValue([SAINT_DENIS_974, SAINT_DENIS_93]);
    render(<FormulaireHeure deja={RIEN} />);
    await userEvent.type(screen.getByLabelText(/ta commune de naissance/i), "Saint-Denis");

    const reunion = await screen.findByRole("button", { name: "Saint-Denis (974)" }, { timeout: 3000 });
    const seineSaintDenis = screen.getByRole("button", { name: "Saint-Denis (93)" });
    expect(reunion).not.toBe(seineSaintDenis);
    // Aucune ligne ne porte le nom NU : elle serait indistinguable de sa voisine.
    expect(screen.queryByRole("button", { name: "Saint-Denis" })).toBeNull();

    await userEvent.click(seineSaintDenis);
    expect(envoi().get("code_lieu"), "c’est le code de la ligne CLIQUÉE qui part").toBe("93066");
    // Et le champ relit le libellé choisi, département compris : c'est ce qu'elle confirme.
    expect((screen.getByLabelText(/ta commune de naissance/i) as HTMLInputElement).value).toBe(
      "Saint-Denis (93)",
    );
  });
});
