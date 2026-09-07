import type { Signe, ThemeNatal } from "@/lib/astro/theme-natal";
import { placer } from "@/lib/astro/theme-natal";

/**
 * socle-natal-dit.ts — CE QU'ON SAIT D'ELLE DANS LE CIEL, RÉDUIT À DES SIGNES (retour du 2026-09-07).
 *
 * ══ POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'EST PAS UN CHAMP DE PLUS DANS `SignatureDuCiel` ══
 *
 * Le fondateur demande un texte du jour en trois parties, dont la première est FACTUELLE : « une
 * partie factuelle sur l'horoscope poissons et ascendant et tout ce qu'on sait à ce niveau sur la
 * personne ». Jusqu'ici le modèle n'en savait rien : il recevait une `SignatureDuCiel`, c'est-à-dire
 * les transits du jour et une distance en signes, et pas un mot du thème lui-même. Il pouvait écrire
 * « trigone de Vénus à ton Ascendant » sans jamais pouvoir dire DANS QUEL SIGNE est cet Ascendant.
 *
 * ⚠️ CES QUATRE CHAMPS N'ONT PAS ÉTÉ AJOUTÉS À `SignatureDuCiel`, ET C'EST LE CŒUR DE LA DÉCISION.
 * Cette signature-là est la clé d'un cache PARTAGÉ entre personnes : elle est intemporelle et
 * impersonnelle par construction, et `tests/signature-ciel.test.ts` en tient la liste CLOSE à quatre
 * clés précisément pour qu'elle « ne dure pas jusqu'au premier champ ajouté pour personnaliser un
 * peu plus ». Y glisser un signe natal aurait fait deux dégâts d'un coup : la garde serait tombée,
 * et surtout le cache aurait continué de partager entre deux personnes un texte qui, désormais,
 * parle de l'une d'elles. Le nouveau savoir voyage donc dans un TYPE SÉPARÉ, qui a sa propre
 * frontière et sa propre clé de cache (personnelle, elle).
 *
 * ══ CE QUE CE TYPE PORTE, ET CE QU'IL NE PEUT PAS PORTER ═════════════════════════════════════════
 *
 * Trois signes et un booléen. Des ÉNUMÉRATIONS de douze valeurs, rien d'autre : pas de longitude,
 * pas de degré, pas de date, pas de lieu, pas de nom. La forme ferme la porte, comme dans
 * `signature-ciel.ts` — on ne compte pas sur la vigilance de qui écrira la mise en mots.
 *
 * Un signe solaire restreint une date de naissance à un douzième d'année, et c'est déjà vrai
 * aujourd'hui de la distance Lune-Soleil que le produit envoie depuis le 2026-09-02. Ce qui sort
 * d'ici reste donc sous le MÊME régime : `contientArt9: true`, egress art. 9, consentement vivant.
 *
 * ══ L'ASCENDANT N'EXISTE PAS TOUJOURS, ET LE PRODUIT NE LE FABRIQUE PAS ══════════════════════════
 *
 * Sans heure de naissance, `angles.statut` vaut `non_calcule` : il n'y a pas d'ascendant, et il n'y
 * en a pas un « approximatif ». `heureConnue` dit lequel des deux régimes on sert, pour que la
 * consigne puisse demander au modèle de ne pas parler de ce qu'on n'a pas — plutôt que de le
 * laisser combler, ce qu'un modèle privé d'une rubrique attendue fait toujours.
 */

/**
 * Le socle natal, dit en signes.
 *
 * ⚠️ TOUT CHAMP AJOUTÉ ICI SORT VERS LE MODÈLE. La question n'est pas « est-ce utile ? » mais
 * « qu'est-ce que ce champ apprend de plus sur elle, et est-ce que ça vaut de le faire voyager ? ».
 * Un degré ne vaut jamais : il ne change pas une phrase, et il resserre une date de naissance.
 */
export interface SocleNatalDit {
  readonly soleil: Signe | null;
  readonly lune: Signe | null;
  readonly ascendant: Signe | null;
  /**
   * L'heure de naissance est-elle connue ? Décide si l'Ascendant a le droit d'être nommé, et si la
   * Lune l'est à mieux qu'un quart de signe (`precision`, Story 5.3).
   */
  readonly heureConnue: boolean;
}

/** Le socle vide — servi quand le thème manque. Aucun repli inventé : trois absences déclarées. */
export const SOCLE_NATAL_INCONNU: SocleNatalDit = Object.freeze({
  soleil: null,
  lune: null,
  ascendant: null,
  heureConnue: false,
});

const signeDe = (theme: ThemeNatal, corps: "soleil" | "lune"): Signe | null =>
  theme.positions.find((p) => p.corps === corps)?.signe ?? null;

/**
 * La projection d'un thème vers ce qui a le droit de sortir.
 *
 * ⚠️ ELLE PASSE PAR `placer`, LA DÉRIVATION UNIQUE DU PRODUIT (`theme-natal.ts`), et non par un
 * `Math.floor(longitude / 30)` réécrit ici. Une seconde dérivation aurait vécu sa vie : c'est la
 * faute que `lib/data/lire-contexte-anam.ts` porte déjà avec son `signeDeLongitude` local, et qu'on
 * ne recopie pas une troisième fois.
 */
export function socleNatalDit(theme: ThemeNatal): SocleNatalDit {
  return Object.freeze({
    soleil: signeDe(theme, "soleil"),
    lune: signeDe(theme, "lune"),
    // ⚠️ `angles.ascendant` EST UNE LONGITUDE, PAS UN SIGNE. La confondre donnerait « Ascendant 214 »
    // ou, pire, un signe faux tiré d'un index qui se trouve être dans les bornes.
    ascendant: theme.angles.statut === "calcule" ? placer(theme.angles.ascendant).signe : null,
    heureConnue: theme.precision === "heure_connue",
  });
}

/**
 * Sérialisation stable, pour la clé de cache.
 *
 * ⚠️ PAS `JSON.stringify` — même raison que `signatureCanonique` : l'ordre des clés d'un littéral
 * tient à l'ordre d'écriture du code, et un jour où quelqu'un remonte `ascendant` au-dessus de
 * `soleil` pour la lisibilité, toutes les clés changent, le cache se vide en silence, et personne
 * ne fait le lien entre un déplacement de ligne et une facture de modèle qui double.
 */
export function socleNatalCanonique(socle: SocleNatalDit): string {
  return [
    `sol:${socle.soleil ?? "-"}`,
    `lun:${socle.lune ?? "-"}`,
    `asc:${socle.ascendant ?? "-"}`,
    `h:${socle.heureConnue ? "1" : "0"}`,
  ].join("|");
}

/**
 * LES SIGNES QU'ON LUI A DONNÉS, ET DONC LES SEULS QU'IL A LE DROIT DE RENDRE.
 *
 * Lue par `verdictHoroscope` pour refuser un fait natal inventé. Elle réunit deux sources, et pas
 * une de plus : le socle natal (ce qui ne change jamais) et les entrées de signe du jour (ce qui est
 * dit dans les faits). Un signe qui n'est ni l'un ni l'autre n'a été donné par personne.
 *
 * ⚠️ LES ENTRÉES DU JOUR EN FONT PARTIE, ET C'EST NÉCESSAIRE. « Mercure entre en Vierge » est une
 * ligne que le produit envoie lui-même : sans elle ici, le modèle serait refusé pour avoir recopié
 * exactement ce qu'on venait de lui dire. Une garde qui refuse sa propre matière ne tient pas une
 * semaine — elle se fait désactiver.
 */
export function signesAutorises(
  socle: SocleNatalDit,
  entreesDuJour: readonly Signe[] = [],
  cielDuJour: readonly Signe[] = [],
): readonly Signe[] {
  const vus = new Set<Signe>();
  for (const s of [socle.soleil, socle.lune, socle.ascendant]) if (s) vus.add(s);
  for (const s of entreesDuJour) vus.add(s);
  // Le ciel du jour est ENVOYÉ au modèle depuis le 2026-09-07 : sans lui ici, la garde refuserait
  // le modèle pour avoir recopié exactement ce qu'on venait de lui dire.
  for (const s of cielDuJour) vus.add(s);
  return Object.freeze([...vus]);
}
