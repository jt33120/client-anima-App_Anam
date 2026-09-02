import type { Corps } from "@/lib/astro/port";
import type { Signe } from "@/lib/astro/theme-natal";
import type {
  Aspect,
  CibleNatale,
  Configuration,
  HoroscopeDuJour,
  JourCivil,
} from "@/lib/astro/quotidien";

/**
 * signature-ciel.ts — CE QUI A LE DROIT DE SORTIR VERS LE MODÈLE, ET RIEN D'AUTRE.
 *
 * ── LE PROBLÈME QUE CE FICHIER RÉSOUT ──────────────────────────────────────────────────────────
 *
 * Le texte du jour est désormais ÉCRIT PAR UN MODÈLE (retour du fondateur du 2026-09-02 : « il
 * manque l'horoscope »). Un modèle, c'est un appel réseau ; un appel réseau, c'est une charge utile ;
 * et une charge utile mal découpée emporte une date de naissance, un prénom ou un identifiant sans
 * que personne ne s'en aperçoive avant l'audit.
 *
 * La réponse n'est pas une consigne (« n'envoie pas de données personnelles »), qu'on enfreint par
 * distraction. C'est un TYPE : `SignatureDuCiel` ne contient QUE des énumérations et des entiers de
 * 0 à 11. Il n'y a aucun champ où une date, un nom, un identifiant ou une longitude à la minute
 * d'arc pourrait se glisser, et `tests/signature-ciel.test.ts` refuse l'apparition d'un tel champ.
 *
 * Même geste qu'`HoroscopeDuJour`, qui n'a « aucun champ de texte » pour qu'aucune prédiction ne
 * puisse s'y écrire : on ferme la porte par la forme, pas par la vigilance.
 *
 * ── CE QUI RESTE DEDANS, ET POURQUOI C'EST ASSEZ ───────────────────────────────────────────────
 *
 * Quatre faits, tous déjà calculés par la 5.4 :
 *
 *   • `luneDistance` — la distance en signes entre la Lune du jour et le Soleil natal (0..11).
 *     Présente tous les jours, elle change tous les ~2,5 jours ;
 *   • `dominante` — la configuration la plus serrée du jour, absente environ un jour sur deux ;
 *   • `secondaires` — au plus DEUX autres, pour qu'un jour chargé ne se lise pas comme un jour vide ;
 *   • `changements` — les passages de signe du jour, le fait le plus daté qui soit.
 *
 * Ce que la signature NE PORTE PAS, alors que le calcul l'a sous la main : l'orbe (un degré au
 * centième n'aide pas à écrire trois phrases, et c'est une mesure de plus à faire voyager), les
 * longitudes (idem, et elles reconstituent une date de naissance), l'instant de référence, la
 * précision du thème.
 *
 * ── LE JOUR EST DEHORS, ET C'EST VOULU ─────────────────────────────────────────────────────────
 *
 * `SignatureDuCiel` ne porte pas la date. Le jour entre dans la CLÉ de cache (`cleDeSignature`) et
 * dans l'invite comme repère de lecture, mais la signature elle-même est intemporelle : deux jours
 * qui produisent la même configuration produisent le même texte, et c'est exactement ce qu'on veut
 * d'un cache partagé.
 */

/** Un trait du ciel : un corps qui transite, l'angle qu'il fait, et ce qu'il touche du thème. */
export interface TraitDuCiel {
  readonly corpsTransitant: Corps;
  readonly aspect: Aspect;
  readonly cible: CibleNatale;
}

/**
 * ⚠️ TOUT CHAMP AJOUTÉ ICI SORT VERS LE MODÈLE. Avant d'en ajouter un, se demander non pas « est-ce
 * utile ? » mais « qu'est-ce que ce champ apprend sur la personne à qui appartient ce ciel ? ».
 */
export interface SignatureDuCiel {
  /** 0..11, la distance en signes Lune du jour → Soleil natal. `null` quand elle n'est pas calculable. */
  readonly luneDistance: number | null;
  /** La configuration la plus serrée. `null` un jour sur deux : un jour calme est un vrai jour. */
  readonly dominante: TraitDuCiel | null;
  /** Les suivantes, au plus deux. */
  readonly secondaires: readonly TraitDuCiel[];
  /** Les passages de signe du jour. Le même pour tout le monde : ce n'est pas une donnée personnelle. */
  readonly changements: readonly { readonly corps: Corps; readonly vers: Signe }[];
}

/**
 * Deux traits secondaires au plus.
 *
 * Un jour chargé en produit sept ou huit ; les lui donner tous, c'est demander au modèle de faire un
 * tri qu'il fera mal, et gonfler la cardinalité du cache jusqu'à ce que plus personne ne partage un
 * texte avec personne. Deux suffisent à ce qu'un jour dense ne se lise pas comme un jour vide.
 */
export const SECONDAIRES_MAX = 2;

/** Le trait nu d'une configuration : son orbe reste au calcul, il ne voyage pas. */
function traitDe(configuration: Configuration): TraitDuCiel {
  return Object.freeze({
    corpsTransitant: configuration.corpsTransitant,
    aspect: configuration.aspect,
    cible: configuration.cible,
  });
}

/**
 * La projection d'un horoscope calculé vers ce qui a le droit de sortir.
 *
 * ⚠️ ELLE PREND `HoroscopeDuJour` ET NON `ThemeNatal`. Le thème porte la date, l'heure, le lieu et
 * les longitudes ; l'horoscope n'en garde que des angles et des énumérations. Faire passer la
 * projection par l'horoscope, c'est hériter d'une frontière déjà tenue par la 5.4 au lieu d'en
 * inventer une deuxième.
 */
export function signatureDuCiel(horoscope: HoroscopeDuJour): SignatureDuCiel {
  const dominante = horoscope.dominante;
  return Object.freeze({
    luneDistance:
      horoscope.luneRelative.statut === "calcule" ? horoscope.luneRelative.distance : null,
    dominante: dominante ? traitDe(dominante) : null,
    // `configurations` est trié du plus serré au plus lâche et commence par la dominante : les
    // suivantes se prennent APRÈS elle, sinon le texte répéterait deux fois le même trait.
    secondaires: Object.freeze(
      horoscope.configurations.slice(1, 1 + SECONDAIRES_MAX).map(traitDe),
    ),
    changements: Object.freeze(
      horoscope.ciel.changementsDeSigne.map((c) =>
        Object.freeze({ corps: c.corps, vers: c.vers }),
      ),
    ),
  });
}

/** Un trait sous forme de clé : `venus:trigone:ascendant`. */
function cleTrait(trait: TraitDuCiel): string {
  return `${trait.corpsTransitant}:${trait.aspect}:${trait.cible}`;
}

/**
 * La clé d'un texte du jour : le jour, puis la signature, dans un ordre FIXE.
 *
 * ⚠️ ELLE N'EST PAS DÉRIVÉE DE `JSON.stringify`. L'ordre des clés d'un objet littéral tient à
 * l'ordre d'écriture du code : le jour où quelqu'un déplace `dominante` au-dessus de `luneDistance`
 * pour la lisibilité, toutes les clés changent, le cache se vide en silence et personne ne fait le
 * lien entre un refactor cosmétique et une facture de modèle qui double.
 */
export function cleDeSignature(jour: JourCivil, signature: SignatureDuCiel): string {
  const jourCle = `${jour.a}-${String(jour.m).padStart(2, "0")}-${String(jour.j).padStart(2, "0")}`;
  return [
    jourCle,
    `lune:${signature.luneDistance ?? "-"}`,
    `dom:${signature.dominante ? cleTrait(signature.dominante) : "-"}`,
    `sec:${signature.secondaires.map(cleTrait).join(",") || "-"}`,
    `chg:${signature.changements.map((c) => `${c.corps}>${c.vers}`).join(",") || "-"}`,
  ].join("|");
}

/**
 * Y a-t-il de quoi écrire ?
 *
 * Sans distance de Lune ET sans configuration, il ne reste que les changements de signe, qui sont
 * les MÊMES pour tout le monde : le texte produit ne parlerait plus de ce ciel-là. On préfère alors
 * le corpus, dont c'est exactement le rôle. Ce cas arrive quand le Soleil natal manque (thème
 * partiel) et qu'aucun aspect n'est dans l'orbe.
 */
export function signatureExploitable(signature: SignatureDuCiel): boolean {
  return signature.luneDistance !== null || signature.dominante !== null;
}
