import type { Corps } from "@/lib/astro/port";
import type { NomNombre } from "@/lib/astro/numerologie";
import type { Signe } from "@/lib/astro/theme-natal";
import type { HoroscopeDuJour } from "@/lib/astro/quotidien";
import { texteConfiguration, texteLuneRelative } from "@/lib/corpus/horoscope";
import { NON_ECRIT, type TexteCorpus } from "@/lib/corpus/port";
import type { TypeEnneagramme } from "./enneagramme";
import { MESSAGE_TYPE_ABSENT } from "./enneagramme-items";
import type { CarteBibliotheque } from "./bibliotheque";

/**
 * cartes-socle.ts — LES CINQ CARTES, CONSTRUITES DEPUIS CE QUE LE SOCLE A CALCULÉ (Story 5.6, T5).
 *
 * Module PUR (AD-1) : il reçoit des résultats DÉJÀ LUS et rend des cartes. Aucune requête, aucune
 * horloge, aucun `server-only` — les `import type` depuis `lib/data` ne portent que des formes.
 * C'est ce qui rend les cinq cartes testables sans base, y compris dans leurs cas dégradés, qui
 * sont aujourd'hui **la majorité des cas**.
 *
 * ── LE VIDE EST LE CAS NORMAL, PAS LE CAS DÉGRADÉ ──────────────────────────────────────────────
 *
 * ⚠️ CE PARAGRAPHE ANNONÇAIT « 165 CRÉNEAUX ET 0 ÉCRIT », ET C'ÉTAIT FAUX (corrigé le 2026-08-25).
 * La même phrase vivait dans `lib/corpus/README.md` et y a coûté une demi-journée : une enquête l'a
 * lue, en a conclu que la numérologie était vide, et a déclaré bloqué un chantier faisable. Le
 * tableau du README est désormais CALCULÉ (`tests/corpus-etat.test.ts`) ; ce commentaire-ci, lui,
 * ne peut pas l'être — alors il ne porte plus de chiffre. L'état réel se lit d'une commande, et
 * seulement là.
 *
 * Ce qui reste vrai, et qui est le vrai sujet de ce paragraphe : les cinq cartes ne sont PAS égales
 * devant un créneau vide.
 *
 *     mantra       →  la carte EST le texte. Sans texte, elle n'a rien. Aucun fait à montrer.
 *     horoscope    →  des énumérations (`lune:…`, `configuration:…`), pas de la prose. Rien non plus.
 *     thème        →  Soleil en Balance… le fait se tient tout seul.
 *     nombres      →  chemin de vie 7… idem.
 *     ennéagramme  →  le type retenu, quand il y en a un.
 *
 * Trois cartes sur cinq peuvent donc montrer quelque chose aujourd'hui ; deux ne peuvent pas. Elles
 * restent AFFICHÉES et le disent (`estPresentable` les exclut seulement de la mise en avant) :
 * les masquer cacherait précisément le fait que le corpus est vide, sur le premier écran du produit.
 *
 * ── AUCUN `?? ""` NULLE PART ───────────────────────────────────────────────────────────────────
 *
 * `TexteCorpus` est une union pour une raison (`lib/corpus/port.ts`) : avec un optionnel, un `?? ""`
 * transformerait « Anima ne l'a pas encore écrit » en « il n'y a rien à dire », et les deux
 * s'afficheraient pareil. On transporte l'union jusqu'au rendu, qui tranche à l'affichage.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les libellés — première et seule mise en mots du socle dans tout le produit
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ EXPORTÉ depuis la Story 6.5b, et l'en-tête ci-dessus dit pourquoi il ne doit pas être copié :
 * c'est la SEULE mise en mots des signes du produit. L'aperçu de correction (`/memoire`) en a besoin
 * pour nommer l'ascendant qu'une correction fait gagner ou perdre ; le dupliquer là-bas créerait
 * deux sources pour un même mot, dont l'une dériverait un jour sans que rien ne rougisse.
 */
export const SIGNE_LIBELLE: Readonly<Record<Signe, string>> = Object.freeze({
  belier: "Bélier",
  taureau: "Taureau",
  gemeaux: "Gémeaux",
  cancer: "Cancer",
  lion: "Lion",
  vierge: "Vierge",
  balance: "Balance",
  scorpion: "Scorpion",
  sagittaire: "Sagittaire",
  capricorne: "Capricorne",
  verseau: "Verseau",
  poissons: "Poissons",
});

/**
 * ⚠️ EXPORTÉ POUR LA HALTE DU SOCLE (7.5), et complété avec les dix classiques et les deux nœuds.
 * La CARTE n'en montre toujours que cinq (`CORPS_DE_CARTE`) : c'est une contrainte de vignette, pas
 * une limite du produit. La halte, elle, montre tout ce que le thème contient. Deux tables auraient
 * divergé au premier renommage — il n'y en a qu'une, et c'est celle-ci.
 */
export const CORPS_LIBELLE: Readonly<Partial<Record<Corps, string>>> = Object.freeze({
  soleil: "Soleil",
  lune: "Lune",
  mercure: "Mercure",
  venus: "Vénus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturne: "Saturne",
  uranus: "Uranus",
  neptune: "Neptune",
  pluton: "Pluton",
  noeud_moyen: "Nœud lunaire moyen",
  noeud_vrai: "Nœud lunaire vrai",
  chiron: "Chiron",
});

/**
 * ⚠️ `CORPS_DE_CARTE` A DISPARU LE 2026-08-25 (Story 7.7). Il limitait l'affichage à CINQ corps —
 * une contrainte de VIGNETTE, assumée en commentaire : « une carte est un objet qu'on saisit d'un
 * regard, pas un tableau d'éphémérides ». La carte du thème a quitté l'accueil, et la halte
 * « Ton socle » montre les DIX corps, plus les deux nœuds, avec leur maison. La contrainte est
 * partie avec l'objet qu'elle contraignait.
 */

/** ⚠️ EXPORTÉ POUR LA HALTE DU SOCLE (7.5) — même raison que `CORPS_LIBELLE` : une seule table. */
export const NOMBRE_LIBELLE: Readonly<Record<NomNombre, string>> = Object.freeze({
  chemin_de_vie: "Chemin de vie",
  expression: "Expression",
  intime: "Intime",
  personnalite: "Personnalité",
  jour_de_naissance: "Jour de naissance",
  annee_personnelle: "Année personnelle",
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les cinq constructeurs
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** Le mantra du jour — le seul morceau du socle qui ne demande rien à personne (5.4, AC6). */
export function carteMantra(texte: TexteCorpus): CarteBibliotheque {
  return {
    cle: "mantra",
    titre: "Le mantra du jour",
    // Le SEUL terme du glossaire présent dans la bibliothèque de la v1 (FR-080). La 5.9 ajoutera
    // « ancrage » et la 5.8 « lecture » — et chacune héritera de sa nature au lieu de la recopier.
    terme: "mantra",
    // Aucun fait : le mantra n'est pas calculé, il est ÉCRIT. Sans texte d'Anima, cette carte n'a
    // rien — et c'est ce qui l'exclut de la mise en avant du jour (AC5).
    faits: [],
    texte,
    // Rien à dire de l'état : quand le créneau est vide, la carte le dit déjà par `texte`, et
    // c'est bien Anima qui n'a pas écrit — pas un geste qui attend quelqu'un.
    etat: null,
  };
}

/**
 * L'horoscope du jour.
 *
 * ⚠️ MÊME QUAND IL EST CALCULÉ, IL N'A PAS DE FAIT À MONTRER. Ce que la 5.4 produit, ce sont des
 * CLÉS de corpus (`lune:3`, `configuration:…`) : des énumérations destinées à choisir un texte, pas
 * à être lues. Les afficher telles quelles donnerait « lune:3 » sur une carte d'accueil.
 *
 * ⚠️ ET LE TEXTE SE RÉPÈTE DEUX À TROIS JOURS DE SUITE. `lune_relative` ne change que tous les
 * ~2,5 jours — la Lune met ce temps à traverser un signe (report explicite de la 5.4 vers cette
 * story). C'est le ciel qui est ainsi, pas un blocage : d'où la DATE portée par la carte, sans
 * laquelle deux jours identiques se liraient comme une panne.
 */
export function carteHoroscope(horoscope: HoroscopeDuJour | null): CarteBibliotheque {
  return {
    cle: "horoscope",
    titre: "Ton ciel du jour",
    terme: null,
    faits: [],
    // Rien à dire de l'état : le ciel du jour est toujours calculable, et son silence éventuel est
    // celui du corpus — donc celui d'Anima, que `texte` porte déjà.
    etat: null,
    // Un horoscope indisponible (pas de date de naissance, ou panne) n'a pas de texte non plus : on
    // ne fabrique pas un repli, on transmet l'absence telle quelle.
    texte: horoscope === null ? NON_ECRIT : texteDuCiel(horoscope),
  };
}

/**
 * Quel texte, parmi les deux que la 5.4 rend adressables ?
 *
 * La CONFIGURATION dominante d'abord — c'est elle qui distingue un jour d'un autre. À défaut (≈ un
 * jour sur deux, et « un jour sans configuration est un vrai jour »), la position relative de la
 * Lune, qui existe toujours. C'est le premier endroit du produit où ce choix se fait : la 5.4
 * produisait les deux clés sans trancher.
 */
function texteDuCiel(horoscope: HoroscopeDuJour): TexteCorpus {
  return texteConfiguration(horoscope.dominante) ?? texteLuneRelative(horoscope.luneRelative) ?? NON_ECRIT;
}

/**
 * Le thème natal.
 *
 * ⚠️ AUCUN DEGRÉ QUAND L'HEURE MANQUE (AC6, report de la 5.3). Sous `precision = "midi_par_defaut"`,
 * l'instant retenu est midi : la Lune est connue à ±7,7° près et tout ce qui dépend de l'heure est
 * incertain. Afficher « Lune à 12°34' du Cancer » serait **fabriquer de la précision** — un degré à
 * la minute d'arc sur une vérité qui vaut un quart de signe.
 *
 * Le SIGNE, lui, reste affiché : la 5.3 a déjà retiré du thème ceux qui sont indéterminables sans
 * heure (`signe_ambigu_sans_heure`), donc ce qui reste dans `positions` est sûr.
 *
 * On branche sur `precision` et non sur `manqueLHeure` : les deux questions diffèrent. `manqueLHeure`
 * demande « son heure réparerait-elle quelque chose ? » (faux au pôle, où l'heure est connue et les
 * angles n'existent pas) ; ici on demande « l'instant retenu est-il le vrai ? ».
 */
/**
 * ⚠️ `carteTheme`, `carteNombres` ET `faitsDuTheme` ONT ÉTÉ SUPPRIMÉS LE 2026-08-25 (Story 7.7).
 *
 * Les deux cartes ont quitté l'accueil pour la halte « Ton socle », qui rend le même socle en
 * ENTIER — six textes au lieu d'un, dix corps au lieu de cinq, l'ascendant ET le milieu du ciel.
 * Les garder ici « au cas où » aurait laissé deux mises en mots du même socle dans le dépôt : la
 * complète et la tronquée, dont l'une aurait dérivé sans que rien ne rougisse.
 *
 * CE QUI RESTE, ET QUI EST RÉUTILISÉ PAR LA HALTE : `SIGNE_LIBELLE`, `CORPS_LIBELLE`,
 * `NOMBRE_LIBELLE` et `enSigne`. Ce ne sont pas des restes de cartes : c'est la SEULE mise en mots
 * du socle du produit, et la règle du degré — rendu seulement sous `heure_connue` — vit dans
 * `enSigne`, une fois.
 */

/**
 * « Balance » sans l'heure, « Balance, 12° » avec. Jamais de minutes d'arc : on n'en a pas besoin.
 *
 * ⚠️ SEULE MISE EN MOTS D'UNE POSITION DANS LE PRODUIT. La règle du degré vit ici : sans heure
 * connue, un degré serait une précision inventée.
 */
export function enSigne(signe: Signe, degre: number, avecDegre: boolean): string {
  const nom = SIGNE_LIBELLE[signe];
  return avecDegre ? `${nom}, ${Math.floor(degre)}°` : nom;
}

/**
 * L'ennéagramme.
 *
 * ⚠️ LE FAIT EST UN CHIFFRE, ET CE CHIFFRE N'EST PAS UNE MESURE. C'est la raison pour laquelle la
 * garde FR-031 de cette story est structurelle et non lexicale : un test « aucun chiffre dans le
 * rendu de l'accueil » interdirait cette carte-ci et celle des nombres, c'est-à-dire deux des trois
 * cartes qui ont quelque chose à montrer.
 *
 * `sans_type` n'est PAS un incident : c'est l'état de départ de tout le monde (5.5). La carte
 * paraît sans fait et sans texte — comme le mantra —, et elle ne peut donc pas être mise en avant.
 */
export function carteEnneagramme(type: TypeEnneagramme | null, texte: TexteCorpus): CarteBibliotheque {
  return {
    cle: "enneagramme",
    titre: "Ton ennéagramme",
    terme: null,
    faits: type === null ? [] : Object.freeze([{ intitule: "Type", valeur: String(type) }]),
    // Le texte est attaché au résultat par la 5.5 elle-même — deux écrans le demanderaient sinon,
    // et l'un des deux finirait par écrire son propre repli.
    texte: type === null ? NON_ECRIT : texte,
    /**
     * ⚠️ SANS TYPE, C'EST LE PRODUIT QUI PARLE, PAS ANIMA (Story 7.8).
     *
     * L'écran affichait « Anima n'a pas encore écrit cette carte » à 100 % des comptes neufs, alors
     * que les NEUF textes de type sont écrits depuis la 5.5. Il accusait quelqu'un d'un vide qui
     * n'était pas le sien, et personne ne pouvait deviner qu'il suffisait de passer un test.
     *
     * La phrase vit dans `enneagramme-items.ts`, à UN seul endroit, et la halte « Ton socle » la
     * lit aussi (Story 7.5). Deux formulations pour un même état, à deux fichiers d'écart, est le
     * défaut que la 6.5b a déjà payé sur les libellés de signes.
     */
    etat: type === null ? MESSAGE_TYPE_ABSENT : null,
  };
}
