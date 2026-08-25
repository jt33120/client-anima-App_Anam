import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * surimpression-placement.test.ts — [7.3] LE DÉFAUT QUI SE VOIT À L'ŒIL ET QU'AUCUN TEST NE VOYAIT.
 *
 * ══ CE QUI EST MESURÉ ICI, ET CE QUI NE PEUT PAS L'ÊTRE ═════════════════════════════════════════
 *
 * Le 2026-08-25, « Profil » occupait x = 143→191 sur 390 px — le CENTRE HORIZONTAL de l'écran —
 * parce que trois éléments de la surimpression portaient `margin-left: auto`. En flexbox, plusieurs
 * marges automatiques se PARTAGENT l'espace libre : chacune prise seule est correcte, et c'est leur
 * cohabitation qui casse le placement. Aucune relecture de feuille de style ne voit ça, et 5 300
 * tests verts ne l'ont pas vu non plus.
 *
 * ⚠️ LA POSITION RÉELLE SE MESURE AU NAVIGATEUR, PAS ICI. Ce fichier garde la CAUSE — combien de
 * marges automatiques existent et où — parce que c'est elle qui se réintroduit par distraction en
 * ajoutant un lien. La preuve de position vit dans `e2e/`, qui tourne en CI depuis le 2026-08-25.
 *
 * On lit la feuille COMMENTAIRES RETIRÉS : ce fichier-ci parle abondamment de `margin-left: auto`
 * dans ses propres explications, et une garde qui compte sa propre prose mesure la documentation.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

/** Retire les commentaires CSS avant toute mesure. */
const sansCommentaires = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const MONDE = sansCommentaires(lire("render/monde.module.css"));
const MENU = sansCommentaires(lire("render/menu/menu-compte.module.css"));

/** Le bloc de déclarations d'un sélecteur, ou "" s'il n'existe plus. */
function bloc(css: string, selecteur: string): string {
  const i = css.indexOf(`${selecteur} {`);
  if (i < 0) return "";
  const fin = css.indexOf("}", i);
  return fin < 0 ? "" : css.slice(i, fin);
}

describe("[7.3/AC1] une seule marge automatique dans la surimpression", () => {
  it("[CONTRÔLE DU CONTRÔLE] la feuille a bien été lue et dépouillée", () => {
    expect(MONDE.length).toBeGreaterThan(5_000);
    expect(MONDE, "le dépouillement a mangé le CSS").toContain(".surimpression {");
    expect(MONDE, "les commentaires n'ont pas été retirés").not.toContain("⚠️");
  });

  it("[LE CŒUR] `margin-left: auto` n'est déclaré QU'UNE fois, et c'est sur le groupe de droite", () => {
    // Mutation-cible : en remettre une sur `.porteSecours` « pour être sûr qu'elle est à droite ».
    // Deux marges automatiques se partagent l'espace, et l'élément d'avant repart au milieu.
    const declarations = [...MONDE.matchAll(/margin-left:\s*auto/g)];
    expect(declarations.length, "plusieurs marges automatiques se partageront l'espace libre").toBe(1);
    expect(bloc(MONDE, ".groupeDroite"), "le groupe de droite a disparu").toContain("margin-left: auto");
  });

  it("le groupe de droite existe et aligne ses enfants sur une ligne", () => {
    const g = bloc(MONDE, ".groupeDroite");
    expect(g).toContain("display: inline-flex");
    expect(g, "sans `gap`, les trois éléments se touchent sur 390 px").toMatch(/gap:/);
  });

  it("aucun élément de la surimpression ne porte de marge automatique isolée", () => {
    for (const sel of [".porteSecours", ".cheminAbonnement", ".mentionIa"]) {
      expect(bloc(MONDE, sel), `${sel} porte encore une marge automatique`).not.toContain("margin-left: auto");
    }
  });

  it("`.cheminProfil` a disparu avec le mot qu'il peignait", () => {
    expect(MONDE).not.toContain(".cheminProfil");
    expect(sansCommentaires(lire("render/surimpression.tsx"))).not.toContain("cheminProfil");
  });
});

describe("[7.3/AC2] l'appui produit un pixel — sur un écran tactile, `:hover` n'existe pas", () => {
  it("[LE CŒUR] `:active` existe désormais, et il change une propriété DÉCLARÉE", () => {
    // ⚠️ AU 2026-08-25, `grep -n ":active" render/monde.module.css` RENVOYAIT ZÉRO. Un appui ne
    // produisait strictement aucun pixel : entre le doigt et l'ouverture de la page, l'application
    // avait l'air morte. C'est la moitié de « l'UI fait pas très pro ».
    const actifs = [...MENU.matchAll(/([.\w-]+):active\s*\{([^}]*)\}/g)];
    expect(actifs.length, "aucun état d'appui : un doigt ne produit aucun retour").toBeGreaterThan(0);
    for (const [, sel, corps] of actifs) {
      expect(corps.trim().length, `${sel}:active est vide — il ne change rien`).toBeGreaterThan(5);
      expect(corps, `${sel}:active ne déclare aucune propriété`).toMatch(/[a-z-]+\s*:/);
    }
    expect(MENU, "le glyphe lui-même doit répondre à l'appui").toMatch(/\.glyphe:active\s*\{/);
    expect(MENU, "et l'entrée touchée aussi").toMatch(/\.entree:active\s*\{/);
  });

  it("[NFR / fluidité] rien de coûteux n'est animé — ni flou, ni ombre", () => {
    // Un `filter: blur(44px)` plein écran a plafonné la scène à 4 im/s contre 25 (mesuré). Un menu
    // qui fait tomber la scène à quatre images par seconde derrière lui est un menu qu'on sent lourd.
    for (const interdit of ["backdrop-filter", "filter: blur", "box-shadow", "drop-shadow"]) {
      expect(MENU, `propriété coûteuse dans le menu : ${interdit}`).not.toContain(interdit);
    }
  });

  it("[UX-DR-38] en mouvement réduit, le CONTENU reste et seul le mouvement cède", () => {
    const i = MENU.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(i, "aucune prise en charge du mouvement réduit").toBeGreaterThan(-1);
    const bloc = MENU.slice(i);
    expect(bloc, "le mouvement doit céder").toContain("transform: none");
    expect(bloc, "rien ne doit DISPARAÎTRE : `display: none` retirerait le contenu").not.toContain("display: none");
  });

  it("l'indice d'attente apparaît APRÈS un délai, et n'est ni un tourniquet ni des points", () => {
    const indice = bloc(MENU, ".indice");
    expect(indice, "l'indice d'attente a disparu").not.toBe("");
    expect(indice, "sans délai, l'indice clignote sur une navigation instantanée").toMatch(/transition:[^;]*\d+ms/);
    expect(indice).toContain("opacity: 0");
    expect(MENU, "jamais une rotation infinie").not.toMatch(/animation:[^;]*infinite/);
  });
});

describe("[8.2] l'appui et l'attente, sur les liens qui survivent à la 7.3", () => {
  it("[LE CŒUR] `.cheminAbonnement` et `.porteSecours` répondent à l'appui", () => {
    // ⚠️ AU 2026-08-25, `grep -n ":active" render/monde.module.css` RENVOYAIT ZÉRO. Sur un écran
    // tactile `:hover` n'existe pas : un appui ne produisait aucun pixel, et on réappuie en croyant
    // avoir raté sa cible. C'est la moitié de « les boutons sont très lents ».
    const actifs = [...MONDE.matchAll(/([.\w-]+):active[^{]*\{([^}]*)\}/g)];
    expect(actifs.length, "aucun état d'appui dans la surimpression").toBeGreaterThan(0);
    expect(MONDE).toMatch(/\.cheminAbonnement:active/);
    expect(MONDE).toMatch(/\.porteSecours:active/);
    for (const [, sel, corps] of actifs) {
      expect(corps, `${sel}:active ne déclare aucune propriété`).toMatch(/[a-z-]+\s*:/);
    }
  });

  it("[LE CŒUR] l'indice d'attente est branché sur `useLinkStatus`, dans un ENFANT de `<Link>`", () => {
    // ⚠️ `useLinkStatus` EST UN HOOK DE CONTEXTE. Posé sur un bouton ou hors d'un `<Link>`, il rend
    // `pending: false` pour toujours et l'indice ne paraît JAMAIS — un défaut parfaitement
    // silencieux. On vérifie donc qu'il est appelé, ET que le composant qui l'appelle est monté
    // à l'intérieur des deux liens.
    const src = lire("render/surimpression.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(src, "`useLinkStatus` n'est pas employé").toContain("useLinkStatus()");
    for (const lien of ["cheminAbonnement", "porteSecours"]) {
      const i = src.indexOf(`s.${lien}`);
      expect(i, `${lien} a disparu de la surimpression`).toBeGreaterThan(-1);
      const bloc = src.slice(i, src.indexOf("</Link>", i));
      expect(bloc, `${lien} : l'indice d'attente n'est pas dans le lien`).toContain("<IndiceAttente />");
    }
  });

  it("l'indice apparaît APRÈS un délai, et n'est ni un tourniquet ni des points", () => {
    // ⚠️ ON REGARDE LE BLOC DE L'INDICE, PAS TOUTE LA FEUILLE — un mutant l'a exigé. La première
    // version refusait `animation: … infinite` PARTOUT dans `monde.module.css` et rougissait sur
    // le SCINTILLEMENT DES ÉTOILES (ligne 144), qui est le décor de la scène et n'a rien d'un
    // indicateur d'attente. Une garde impossible à satisfaire finit assouplie jusqu'à ne plus rien
    // garder ; celle-ci vise ce qu'`EXPERIENCE.md` ligne 200 bannit vraiment — un tourniquet À LA
    // PLACE d'une réponse.
    const debut = MONDE.indexOf(".indiceAttente {");
    expect(debut, "l'indice d'attente a disparu de la feuille").toBeGreaterThan(-1);
    const bloc = MONDE.slice(debut, MONDE.indexOf("}", MONDE.indexOf(".indiceAttenteActif")));
    expect(bloc, "sans délai, l'indice clignote sur une navigation instantanée").toMatch(
      /transition:[^;]*\d+ms/,
    );
    expect(bloc, "l'indice d'attente est devenu un tourniquet").not.toMatch(/animation:/);
    expect(bloc, "l'indice doit partir invisible").toContain("opacity: 0");
  });

  it("[8.2/AC2] le cas de `/aide` est TRANCHÉ par écrit, pas laissé en blanc", () => {
    // Une page sans frontière de chargement ET sans raison écrite est un blanc : personne ne peut
    // dire si c'est une décision ou un oubli. `/aide` est la page qui doit marcher quand tout le
    // reste est cassé — son cas s'arbitre.
    const entete = lire("render/HalteEnAttente.tsx");
    expect(entete, "le cas de /aide n'est pas arbitré").toMatch(/`\/aide`/);
    expect(existsSync(resolve(RACINE, "app/aide/loading.tsx")), "la décision écrite dit le contraire du dépôt").toBe(
      false,
    );
  });
});
