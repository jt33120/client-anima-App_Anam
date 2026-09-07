import type { BrancheProjetee } from "@/lib/scene/projection";
import { ordonnerBranchesLunaires } from "./geometrie";

/** The painted series and its DOM targets share this exact portrait, independently of the old canvas. */
export const CADRE_ARBRE_PERSONNEL = { largeur: 1024, hauteur: 1536 } as const;
export const COLLET_PERSONNEL = { x: 512, y: 1136.64 } as const;

type Point = readonly [number, number];
// Measured twig junctions in the fixed image frame. No random points are placed in the sky.
const ANCRES: readonly { index: number; points: readonly Point[] }[] = [
  { index: 0, points: [[512, 1137]] },
  { index: 1, points: [[512, 1100]] },
  { index: 2, points: [[512, 1115], [455, 1185]] },
  { index: 3, points: [[506, 530], [548, 633], [473, 772]] },
  { index: 4, points: [[500, 508], [549, 624], [476, 791], [512, 442]] },
  { index: 5, points: [[503, 508], [550, 636], [480, 815], [512, 280], [502, 727]] },
  { index: 6, points: [[500, 511], [550, 624], [477, 790], [496, 697], [540, 861], [608, 763]] },
  { index: 7, points: [[510, 493], [565, 608], [493, 835], [618, 865], [711, 707], [405, 685], [510, 279]] },
  { index: 8, points: [[496, 573], [618, 590], [635, 710], [438, 778], [421, 715], [458, 379], [507, 447], [642, 547]] },
  { index: 9, points: [[500, 575], [592, 675], [465, 817], [625, 575], [426, 717], [453, 380], [656, 703], [573, 930]] },
  { index: 10, points: [[501, 582], [584, 694], [463, 845], [627, 577], [366, 703], [432, 776], [456, 372], [505, 469]] },
  { index: 11, points: [[487, 669], [567, 766], [558, 890], [378, 883], [443, 602], [636, 657], [737, 723], [506, 285], [530, 500]] },
  { index: 12, points: [[490, 511], [433, 669], [550, 646], [656, 794], [445, 925], [313, 576], [367, 812], [525, 464]] },
  { index: 13, points: [[517, 500], [399, 691], [591, 735], [465, 858], [623, 932], [310, 567], [639, 668], [450, 380]] },
  { index: 14, points: [[515, 561], [409, 686], [640, 697], [477, 813], [646, 932], [341, 603], [669, 553], [476, 378], [514, 498]] },
  { index: 15, points: [[520, 549], [340, 587], [627, 594], [279, 459], [708, 554], [391, 367], [540, 478], [232, 701], [793, 726], [350, 719], [685, 748], [469, 327], [611, 839]] },
  { index: 21, points: [[512, 563], [368, 510], [622, 576], [309, 637], [696, 736], [461, 340], [738, 676], [271, 788], [677, 816], [283, 421], [530, 691]] },
  { index: 22, points: [[506, 457], [374, 585], [636, 533], [624, 698], [389, 689], [730, 774], [500, 741], [398, 357], [584, 351], [713, 585], [296, 549], [297, 704], [795, 802]] },
  { index: 23, points: [[635, 462], [306, 525], [705, 573], [266, 429], [686, 365], [390, 323], [543, 334], [222, 539], [838, 548], [282, 688], [733, 736], [478, 295], [602, 719]] },
];

function pointsDuStade(index: number): readonly Point[] {
  // Frames 16–21 share their woody scaffold, as do the mature tree and its light variations.
  return ([...ANCRES].reverse().find((entree) => entree.index <= index) ?? ANCRES[0]).points;
}

export function ancreTroncPersonnel(index: number) {
  if (index < 4) return COLLET_PERSONNEL;
  const y = 0.715 - Math.min(1, (index - 4) / 12) * 0.095;
  return { x: CADRE_ARBRE_PERSONNEL.largeur / 2, y: y * CADRE_ARBRE_PERSONNEL.hauteur };
}

/** Stable branch order and phase-sized anchor routes keep targets on the visible organism. */
export function placerAccrochesPersonnelles(branches: readonly BrancheProjetee[], index: number) {
  const points = pointsDuStade(index);
  return ordonnerBranchesLunaires(branches).map((branche, rang) => {
    const point = points[rang % points.length];
    return { branche, rang, accroche: { x: point[0], y: point[1] } };
  });
}

/** Merge overlapping screen-space targets; the named chooser keeps each saved action separately available. */
export function regrouperAccrochesPersonnelles(
  placees: ReturnType<typeof placerAccrochesPersonnelles>,
  echelle: number,
  tronc?: { x: number; y: number },
) {
  const groupes = placees.map((placee) => ({ ids: [placee.branche.id], tronc: false, accroche: placee.accroche }));
  if (tronc) groupes.push({ ids: [], tronc: true, accroche: tronc });
  if (!echelle) return groupes;
  let fusion = true;
  while (fusion) {
    fusion = false;
    for (let a = 0; a < groupes.length && !fusion; a++) {
      for (let b = a + 1; b < groupes.length; b++) {
        const gauche = groupes[a];
        const droite = groupes[b];
        if (Math.abs(gauche.accroche.x - droite.accroche.x) * echelle >= 48
          || Math.abs(gauche.accroche.y - droite.accroche.y) * echelle >= 48) continue;
        const poidsGauche = gauche.ids.length + Number(gauche.tronc);
        const poidsDroite = droite.ids.length + Number(droite.tronc);
        groupes[a] = {
          ids: [...gauche.ids, ...droite.ids], tronc: gauche.tronc || droite.tronc,
          accroche: {
            x: (gauche.accroche.x * poidsGauche + droite.accroche.x * poidsDroite) / (poidsGauche + poidsDroite),
            y: (gauche.accroche.y * poidsGauche + droite.accroche.y * poidsDroite) / (poidsGauche + poidsDroite),
          },
        };
        groupes.splice(b, 1);
        fusion = true;
        break;
      }
    }
  }
  return groupes;
}
