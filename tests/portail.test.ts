import { describe, it, expect } from "vitest";
import {
  DUREE_POUSSE_MS,
  DUREE_RETRAIT_MS,
  PLAFOND_MS,
  SEJOUR_REDUIT_MS,
  etatDuPortail,
  momentDuDepart,
  portailFini,
} from "@/lib/scene/portail";

/**
 * portail.test.ts — LE PORTAIL D'ENTRÉE (2026-09-03).
 *
 * ══ LE DÉFAUT QUE CE FICHIER EXISTE POUR RENDRE IMPOSSIBLE ══════════════════════════════════════
 *
 * Un voile plein écran qui ne part pas. C'est la seule façon dont ce travail peut faire du mal, et
 * elle ne se voit sur AUCUN écran de développement : la scène est prête en 200 ms sur une machine
 * de dev, donc le chemin « la scène ne se déclare jamais prête » n'est jamais parcouru. Il l'est en
 * production, chez quelqu'un dont la requête a échoué ou dont l'onglet revient de veille.
 *
 * La garde `[LE CŒUR] aucun état du monde ne retient le portail` parcourt ce chemin-là.
 */

describe("[LE CŒUR] le portail s’en va, quoi qu’il arrive", () => {
  it("[LE CŒUR] aucun état du monde ne retient le portail", () => {
    // ⚠️ MUTATION-CIBLE : `if (scenePrete === null) return Infinity`, ou toute forme de « on attend
    // le signal ». Le voile resterait pour toujours, et rien dans le produit ne le dirait.
    expect(momentDuDepart(null)).toBe(PLAFOND_MS);
    expect(momentDuDepart(null, true)).toBe(PLAFOND_MS);
    // Une scène qui se dit prête très tard ne repousse pas le départ au-delà du plafond.
    expect(momentDuDepart(PLAFOND_MS * 10)).toBe(PLAFOND_MS);
    expect(momentDuDepart(Number.MAX_SAFE_INTEGER)).toBe(PLAFOND_MS);
  });

  it("[LE CŒUR] la pousse va toujours à son terme — la scène ne coupe pas l’arbre", () => {
    // Une scène prête en 300 ms ne montre pas un arbre à mi-hauteur : le geste se montre en entier
    // ou pas du tout. C'est ce qui sépare un portail d'un tourniquet.
    expect(momentDuDepart(300)).toBe(DUREE_POUSSE_MS);
    expect(momentDuDepart(0)).toBe(DUREE_POUSSE_MS);
    // …et une scène plus lente que la pousse, elle, décide.
    const lente = DUREE_POUSSE_MS + 900;
    expect(momentDuDepart(lente)).toBe(lente);
  });

  it("[ANTI-VACUITÉ] le plafond est ATTEIGNABLE et laisse la pousse finir", () => {
    // Sans ce témoin, un plafond réglé sous la durée de pousse rendrait les deux gardes ci-dessus
    // vraies pour la mauvaise raison : le portail partirait toujours au plafond, jamais sur la
    // scène, et l'arbre serait coupé à chaque lancement.
    expect(PLAFOND_MS).toBeGreaterThan(DUREE_POUSSE_MS);
    expect(momentDuDepart(PLAFOND_MS - 1)).toBe(PLAFOND_MS - 1);
  });

  it("le retrait a une fin, et elle est bornée", () => {
    const depart = momentDuDepart(null);
    expect(portailFini(depart, depart)).toBe(false);
    expect(portailFini(depart + DUREE_RETRAIT_MS, depart)).toBe(true);
    // La borne absolue du produit : personne ne voit ce voile plus longtemps que ça.
    expect(PLAFOND_MS + DUREE_RETRAIT_MS).toBeLessThanOrEqual(7000);
  });
});

describe("[LE CŒUR] la pousse va dans un seul sens, de la graine à la ramure", () => {
  it("l’éveil part de zéro, monte sans jamais redescendre, et atteint le sommet", () => {
    // ⚠️ MUTATION-CIBLE : une courbe qui dépasse puis revient (un `ease` avec overshoot). La charte
    // du produit refuse tout rebond — DESIGN.md « aucun ressort, aucun overshoot » — et un arbre qui
    // repousserait un peu en arrière serait la version visible de cette faute.
    const pas = 40;
    let precedent = -1;
    for (let t = 0; t <= DUREE_POUSSE_MS; t += pas) {
      const { eveil } = etatDuPortail(t, DUREE_POUSSE_MS);
      expect(eveil, `éveil hors bornes à ${t} ms`).toBeGreaterThanOrEqual(0);
      expect(eveil, `éveil hors bornes à ${t} ms`).toBeLessThanOrEqual(100);
      expect(eveil, `l’arbre a reculé à ${t} ms`).toBeGreaterThanOrEqual(precedent);
      precedent = eveil;
    }
    expect(etatDuPortail(0, DUREE_POUSSE_MS).eveil).toBe(0);
    expect(etatDuPortail(DUREE_POUSSE_MS, DUREE_POUSSE_MS).eveil).toBeCloseTo(100, 6);
    // Et il reste au sommet : une frame en retard ne redescend pas l'arbre.
    expect(etatDuPortail(DUREE_POUSSE_MS * 3, DUREE_POUSSE_MS).eveil).toBeCloseTo(100, 6);
  });

  it("[ANTI-VACUITÉ] la courbe BOUGE vraiment — ce n’est pas une constante", () => {
    // « Monotone » est vrai d'une fonction qui rend 0 partout. Le témoin exige du relief : à
    // mi-parcours l'arbre est franchement engagé, et les deux moitiés diffèrent.
    const milieu = etatDuPortail(DUREE_POUSSE_MS / 2, DUREE_POUSSE_MS).eveil;
    expect(milieu).toBeCloseTo(50, 5);
    expect(etatDuPortail(DUREE_POUSSE_MS / 4, DUREE_POUSSE_MS).eveil).toBeLessThan(milieu);
    expect(etatDuPortail((DUREE_POUSSE_MS * 3) / 4, DUREE_POUSSE_MS).eveil).toBeGreaterThan(milieu);
  });

  it("[LE CŒUR] la graine et le bois se relaient sans trou", () => {
    // ⚠️ MUTATION-CIBLE : faire disparaître la graine d'un coup, ou la garder jusqu'au bout. Le
    // premier cas ouvre le portail sur un moignon de tronc ; le second laisse un caillou au pied
    // d'un arbre adulte. Ce qu'on veut est UN fondu enchaîné.
    expect(etatDuPortail(0, DUREE_POUSSE_MS).graine).toBe(1);
    const finGraine = DUREE_POUSSE_MS * 0.2;
    expect(etatDuPortail(finGraine, DUREE_POUSSE_MS).graine).toBeCloseTo(0, 6);
    expect(etatDuPortail(finGraine * 0.5, DUREE_POUSSE_MS).graine).toBeCloseTo(0.5, 2);
    // Elle ne revient jamais, et elle ne passe jamais sous zéro (une opacité négative se rend
    // comme 0 mais dit que le calcul a débordé).
    for (const t of [finGraine, DUREE_POUSSE_MS, DUREE_POUSSE_MS * 4]) {
      expect(etatDuPortail(t, DUREE_POUSSE_MS).graine).toBe(0);
    }
  });
});

describe("[LE BORD] prefers-reduced-motion : l’arbre est là, entier, immobile", () => {
  it("aucune pousse — l’arbre est au sommet dès la première frame", () => {
    // Le réglage existe pour supprimer le MOUVEMENT, pas le contenu. On ne montre donc pas une
    // graine figée (ce serait cacher l'image), mais l'arbre à son terme.
    expect(etatDuPortail(0, SEJOUR_REDUIT_MS, true).eveil).toBe(100);
    expect(etatDuPortail(0, SEJOUR_REDUIT_MS, true).graine).toBe(0);
  });

  it("[LE CŒUR] le portail reste quand même un instant, plutôt que de clignoter", () => {
    // ⚠️ MUTATION-CIBLE : `SEJOUR_REDUIT_MS = 0`. Le portail apparaîtrait et disparaîtrait dans la
    // même frame — un saut plein écran, c'est-à-dire exactement ce que ce réglage existe pour
    // épargner à qui l'a activé.
    expect(SEJOUR_REDUIT_MS).toBeGreaterThan(0);
    expect(momentDuDepart(0, true)).toBe(SEJOUR_REDUIT_MS);
    expect(etatDuPortail(SEJOUR_REDUIT_MS - 1, SEJOUR_REDUIT_MS, true).retrait).toBe(false);
    expect(etatDuPortail(SEJOUR_REDUIT_MS, SEJOUR_REDUIT_MS, true).retrait).toBe(true);
  });

  it("et il part plus tôt qu’en mouvement plein, jamais plus tard", () => {
    expect(SEJOUR_REDUIT_MS).toBeLessThan(DUREE_POUSSE_MS);
    expect(momentDuDepart(500, true)).toBeLessThan(momentDuDepart(500, false));
  });
});

describe("[LE BORD] FR-031 — rien de ce que rend ce module ne s’affiche en nombre", () => {
  it("l’état ne porte que des paramètres de dessin, jamais une progression nommée", () => {
    // ⚠️ MUTATION-CIBLE : ajouter `pourcentage` ou `progression` au type de sortie. Le rendu
    // finirait par le peindre en barre, et FR-031 ne tiendrait plus qu'à la discipline.
    expect(Object.keys(etatDuPortail(100, DUREE_POUSSE_MS)).sort()).toEqual([
      "eveil",
      "graine",
      "retrait",
    ]);
  });
});
