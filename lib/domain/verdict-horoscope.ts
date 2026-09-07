import type { Signe } from "@/lib/astro/theme-natal";
import { chercherInterdits } from "./lexique-interdit";
import { chercherPredictions } from "./marqueurs-prediction";
import { normaliserTexte } from "./normalisation-texte";

/**
 * verdict-horoscope.ts — LE CONTRÔLE DE CE QUI REVIENT DU MODÈLE.
 *
 * ── UNE CONSIGNE N'EST PAS UNE GARANTIE ────────────────────────────────────────────────────────
 *
 * `consigne-horoscope.ts` demande de décrire sans prédire, puis de proposer sans promettre. Un
 * modèle obéit la plupart du temps, et « la plupart du temps » n'est pas une propriété : la phrase
 * qui passe est celle qui paraît sous le nom du produit, un jour, sans que personne ne la relise.
 *
 * Tous les textes ÉCRITS du produit passent déjà par ces deux gardes, mais en TEST — `chercherInterdits`
 * dans `tests/lexique-voix.test.ts`, `chercherPredictions` dans les gardes de corpus. Un texte
 * fabriqué à l'instant n'a pas de test : le seul moment où on peut le refuser, c'est à l'exécution.
 * Ce fichier applique donc les MÊMES fonctions, au même endroit du produit, mais en ligne.
 *
 * ── CE QUE LE 2026-09-07 CHANGE ────────────────────────────────────────────────────────────────
 *
 * Le texte du jour est passé à TROIS PARTIES (le ciel, pour toi, les gestes), dont la dernière a le
 * droit de proposer — décision du fondateur. Le verdict devient donc STRUCTURÉ : il découpe d'abord,
 * puis éprouve chaque partie. Ce n'est pas une complication, c'est ce qui rend l'autorisation
 * tenable — sans découpage, « autoriser le conseil » aurait voulu dire l'autoriser partout, y
 * compris dans la partie factuelle, qui est celle qu'on lit comme une vérité.
 *
 * ── REFUSER, PAS RÉPARER ───────────────────────────────────────────────────────────────────────
 *
 * Le verdict ne réécrit rien de ce qui SIGNIFIE. Retirer « tu verras » d'une phrase de prédiction
 * laisse la prédiction et casse la phrase ; on refuse le texte entier et l'appelant retombe sur le
 * corpus, qui est écrit et relu. Un horoscope refusé n'est pas un écran vide : c'est le texte
 * d'avant.
 *
 * ⚠️ ET UNE PARTIE REFUSÉE REFUSE LES TROIS. Trois raisons, dont la dernière est la doctrine :
 *   1. les trois parties sont écrites d'un seul geste et se répondent — les gestes reprennent la
 *      tension nommée plus haut ; servir deux tiers donne un texte qui ouvre et s'arrête, moins bon
 *      que le corpus, qui est entier ;
 *   2. un service partiel demanderait une provenance PAR PARTIE, et deux paragraphes de modèle plus
 *      un de corpus sous une seule mention rendrait la carte fausse au sens de FR-086 ;
 *   3. « refuser, pas réparer » est la règle déjà écrite ici — et amputer, c'est réparer.
 * Le motif porte la PARTIE fautive pour que les journaux le disent : si `gestes/lexique` domine au
 * bout d'une semaine, la question se rouvrira sur des chiffres, pas sur une intuition.
 *
 * Ce qui EST normalisé, en revanche, c'est la TYPOGRAPHIE : apostrophes droites, tirets longs,
 * guillemets d'encadrement, gras de balisage. Ce sont des marques d'atelier, pas du sens, et les
 * refuser jetterait un texte juste pour une apostrophe.
 */

/** Les trois parties, telles qu'elles reviennent du modèle et telles qu'elles se rangent. */
export interface EcritureTroisParties {
  readonly ciel: string;
  readonly pourToi: string;
  readonly gestes: string;
}

/** Laquelle des trois. Fermée : elle se journalise, et elle nomme une PLACE, jamais du contenu. */
export type ClePartie = keyof EcritureTroisParties;

/** L'ordre est celui de la lecture, et il est le seul accepté au découpage. */
export const PARTIES: readonly ClePartie[] = Object.freeze(["ciel", "pourToi", "gestes"] as const);

/** Pourquoi un texte a été refusé. Fermé : chaque motif se journalise et se compte. */
export type MotifRefus =
  | "vide"
  | "trop_court"
  | "trop_long"
  | "structure"
  | "partie_courte"
  | "partie_longue"
  | "prediction"
  | "lexique"
  | "signature"
  | "interrogation"
  | "fait_natal_invente";

export type VerdictHoroscope =
  | { readonly accepte: true; readonly parties: EcritureTroisParties }
  | { readonly accepte: false; readonly motif: MotifRefus; readonly partie?: ClePartie };

/**
 * CE QU'ON A DONNÉ AU MODÈLE, ET DONC CE QU'IL A LE DROIT DE RENDRE.
 *
 * ⚠️ CE PARAMÈTRE EST LA GARDE LA PLUS IMPORTANTE DE CE FICHIER, ET IL EST NEUF. Les autres refus
 * protègent d'un texte MAL ÉCRIT ; celui-ci protège d'un texte FAUX. Depuis que le modèle reçoit un
 * socle natal, il peut le rendre de travers — et « ton Ascendant Lion » n'est pas une maladresse de
 * style : c'est une affirmation d'identité, affichée sous le nom d'une personne réelle, que la
 * lectrice n'a aucun moyen de contredire. C'est le seul dégât de cette story qu'aucun repli ne
 * rattrape après coup, parce qu'il aura été lu.
 */
export interface CadreDuVerdict {
  /** Les signes qu'on lui a effectivement donnés : le socle natal, plus les entrées de signe du jour. */
  readonly signesAutorises: readonly Signe[];
  /** Sans heure de naissance, il n'y a pas d'ascendant — et le nommer est toujours une invention. */
  readonly ascendantConnu: boolean;
}

/**
 * Les bornes.
 *
 * Le plancher global écarte les réponses tronquées et les refus polis du modèle (« je ne peux
 * pas »). Le plancher PAR PARTIE écarte le moignon (« les gestes : voir ci-dessus »), que l'ancien
 * plancher global de quarante signes ne voyait pas.
 *
 * ⚠️ L'ARGUMENT DU PLAFOND A ÉTÉ REFAIT LE 2026-09-07, PAS RENUMÉROTÉ. Il disait : « le plafond
 * laisse passer trois phrases amples sans laisser entrer la dissertation où le conseil finit
 * toujours par apparaître. » Le conseil est désormais demandé sur une partie : le plafond ne le
 * tient plus dehors, et le prétendre serait mentir sur ce que cette constante fait.
 *
 * Ce qui le tient, maintenant, c'est LA BORNE PAR PARTIE. Une partie plus longue que `PARTIE_MAX`
 * n'est plus une partie : c'est un texte qui déborde de sa case, et c'est exactement dans ce
 * débordement qu'un paragraphe factuel se met à proposer. Un modèle qui déborde sur une partie ne
 * peut pas l'emprunter à une autre.
 *
 * ⚠️ 3 × PARTIE_MAX < LONGUEUR_MAX. Le total ne contredit JAMAIS les bornes par partie : un texte
 * conforme partie par partie ne peut pas être refusé pour sa longueur totale. Le total ne sert plus
 * qu'à écarter, avant tout travail, une réponse partie en boucle.
 *
 * ══ LES VALEURS ONT ÉTÉ MESURÉES, PAS ESTIMÉES (2026-09-07) ═══════════════════════════════════
 *
 * Premier jet : `PARTIE_MAX = 380`, `LONGUEUR_MAX = 1400`. Dix générations réelles sur le modèle
 * qui sert en production ont produit des parties de 500 à 780 signes, pour des totaux de 1380 à
 * 1850 : DIX REFUS SUR DIX, tous en `trop_long`. La fonctionnalité entière aurait été livrée sans
 * jamais produire une ligne — et sans rien casser, puisque le repli corpus est propre.
 *
 * ⚠️ LA CONSIGNE A ÉTÉ RESSERRÉE EN MÊME TEMPS, ET C'EST L'AUTRE MOITIÉ DU CORRECTIF. Relever le
 * plafond seul aurait laissé le modèle écrire aussi long qu'il voulait ; resserrer la consigne
 * seule n'aurait rien garanti, une consigne n'étant pas une garantie. On demande donc trois phrases
 * et quatre cents signes par partie, et on refuse au-delà de sept cents : l'écart entre les deux
 * est la marge d'un modèle qui obéit à peu près, pas une permission.
 */
export const LONGUEUR_MIN = 200;
export const LONGUEUR_MAX = 2_200;
export const PARTIE_MIN = 60;
export const PARTIE_MAX = 700;

/**
 * Ce que le produit ne dit jamais de lui-même (FR-086).
 *
 * Le modèle n'a pas ces noms dans sa consigne, mais il a le nom du produit dans son entraînement dès
 * lors qu'il existe une page publique : un texte signé « Anima » attribuerait à une personne réelle
 * des mots qu'elle n'a pas écrits. C'est le seul refus de ce fichier qui protège quelqu'un.
 */
const NOMS_INTERDITS = /\b(anima|anam)\b/i;

/**
 * La typographie du produit, appliquée sans discuter.
 *
 * ⚠️ LE TIRET LONG EST REMPLACÉ, PAS REFUSÉ. `tests/copie-sans-cadratin.test.ts` le bannit de toute
 * la copie du dépôt depuis le 2026-09-02 ; un modèle, lui, en pose un sur deux textes. Le refuser
 * ferait tomber la moitié des générations pour une marque qui ne veut rien dire.
 *
 * ⚠️ ELLE REPLIE `\n{2,}` EN UN SEUL `\n`, ET LE DÉCOUPAGE EN DÉPEND. C'est pour ça que les
 * étiquettes ne peuvent pas reposer sur une ligne vide : la normalisation qui tourne AVANT le
 * découpage l'aurait déjà mangée. Les crochets, eux, la traversent intacts.
 */
function normaliserTypographie(brut: string): string {
  return (
    brut
      .trim()
      // Le balisage que le modèle ajoute quand il croit écrire dans un document.
      .replace(/\*\*?/g, "")
      // Les guillemets d'encadrement d'une réponse entière, français comme droits.
      .replace(/^["«»“”\s]+|["«»“”\s]+$/g, "")
      // Tiret long ou demi-cadratin, isolé entre deux espaces : c'est une ponctuation de pause.
      .replace(/\s+[—–]\s+/g, ", ")
      // Le même, collé : il sépare deux mots, une virgule ferait un doublon de ponctuation.
      .replace(/[—–]/g, " ")
      .replace(/'/g, "’")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LE DÉCOUPAGE
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * LES ÉTIQUETTES, ET POURQUOI CELLES-LÀ.
 *
 * Elles survivent à `normaliserTypographie` — vérifié ligne à ligne : elle retire les `*`, mange les
 * guillemets d'encadrement, remplace les cadratins, écrase `[ \t]+` et REPLIE `\n{2,}` en `\n`. Elle
 * ne touche pas aux crochets. Toute forme reposant sur du gras, sur `###`, sur `---` ou sur une
 * ligne vide serait donc DÉJÀ cassée par le code existant ; les crochets ne le sont pas.
 *
 * Un modèle « embellit » spontanément `Le ciel :` en gras et `### CIEL` en `## Ciel`. Il ne réécrit
 * pas `[CIEL]`, parce que ça ne ressemble à aucune convention de mise en page qu'il connaît : ça
 * ressemble à une BALISE, et une balise se recopie.
 *
 * JSON a été écarté : `completer()` est appelé sans format imposé, donc rien ne garantit un JSON
 * valide ; un JSON cassé est un refus TOTAL là où une étiquette dégradée reste rattrapable ; et un
 * JSON transporte des `\n` échappés que la normalisation ci-dessus ne voit pas.
 *
 * ⚠️ ANCRÉE EN DÉBUT DE LIGNE (`m`). Sans cette ancre, « les gestes [gestes] du quotidien »
 * couperait le texte en son milieu, et la moitié d'une partie deviendrait une partie.
 *
 * ⚠️ TOLÉRANTE SUR LA FORME, STRICTE SUR LE COMPTE. Trois formes sont acceptées, parce qu'une SONDE
 * les a produites toutes les trois à partir du même texte (`[CIEL]`, `CIEL :`, `### CIEL`) : les
 * crochets, le deux-points, et le mot SEUL SUR SA LIGNE. Un modèle varie là-dessus, jamais sur le
 * mot. Mais on exige EXACTEMENT trois ouvertures, dans l'ordre.
 *
 * ⚠️ LE MOT SEUL N'EST ACCEPTÉ QU'ANCRÉ EN FIN DE LIGNE, et c'est ce qui le distingue de la prose.
 * `normaliserTypographie` retire les astérisques AVANT ce découpage : un `**CIEL**` de markdown
 * arrive ici comme `CIEL` nu, et le refuser aurait fait tomber la forme la plus courante d'un modèle
 * pour une marque de mise en page qu'on a nous-mêmes effacée deux lignes plus haut. Une ligne dont
 * le contenu ENTIER est le mot « CIEL » n'est pas de la prose française ; « le ciel du jour » en
 * milieu de phrase ne mord pas, faute d'ancre.
 *
 * ⚠️ ET ON NE DEVINE JAMAIS. Un texte de trois paragraphes sans aucune de ces trois formes est
 * REFUSÉ, pas découpé au saut de ligne. Deviner, c'est ranger dans « le ciel » — la plus fermée des
 * trois cases — un paragraphe qui pourrait être des gestes, et faire passer une proposition pour un
 * fait. Le refus coûte un texte de corpus ce jour-là ; la devinette coûte la règle. Et il se
 * COMPTE : le motif `structure` dira, au bout d'une semaine, si le taux réel justifie autre chose.
 */
const MOTS_ETIQUETTE = "CIEL|POUR[ _-]?TOI|GESTES|AUJOURD[ _'’-]?HUI";
const ETIQUETTE = new RegExp(
  `^[ \\t]*(?:#{1,6}[ \\t]*)?(?:` +
    `\\[[ \\t]*(${MOTS_ETIQUETTE})[ \\t]*\\][ \\t]*:?` +
    `|(${MOTS_ETIQUETTE})[ \\t]*:` +
    `|(${MOTS_ETIQUETTE})[ \\t]*$` +
    `)[ \\t]*`,
  "gim",
);

/** Le mot de l'étiquette, ramené à la place qu'il désigne. */
const RANG: Readonly<Record<string, ClePartie>> = Object.freeze({
  CIEL: "ciel",
  "POUR TOI": "pourToi",
  POURTOI: "pourToi",
  GESTES: "gestes",
  AUJOURDHUI: "gestes",
  "AUJOURD HUI": "gestes",
});

function decouperTroisParties(texte: string): EcritureTroisParties | null {
  const bornes = [...texte.matchAll(ETIQUETTE)];
  if (bornes.length !== PARTIES.length) return null;
  const cles = bornes.map((b) =>
    RANG[
      (b[1] ?? b[2] ?? b[3] ?? "").toUpperCase().replace(/[_'’-]/g, " ").replace(/\s+/g, " ").trim()
    ],
  );
  if (cles.some((c, i) => c !== PARTIES[i])) return null;
  const morceau = (i: number): string => {
    const debut = (bornes[i].index ?? 0) + bornes[i][0].length;
    const fin = i + 1 < bornes.length ? (bornes[i + 1].index ?? texte.length) : texte.length;
    return texte.slice(debut, fin).trim();
  };
  return { ciel: morceau(0), pourToi: morceau(1), gestes: morceau(2) };
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LA GARDE DU FAIT NATAL
// ══════════════════════════════════════════════════════════════════════════════════════════════

const SIGNES_MOTIF =
  "belier|taureau|gemeaux|cancer|lion|vierge|balance|scorpion|sagittaire|capricorne|verseau|poissons";

/** Une phrase qui parle DÉJÀ d'un point du thème. Hors de ces mots, un signe est un mot français. */
const ANCRE_NATALE = /\b(soleil|lune|ascendant|milieu du ciel|naissance|natal|natale)\b/;

/**
 * Un signe nommé À CÔTÉ D'UN POINT NATAL, et qu'on ne lui a pas donné.
 *
 * ⚠️ LA PORTÉE EST LA PHRASE, ET LA GARDE EST ANCRÉE. « Balance », « Lion », « Cancer », « Vierge »
 * et « Poissons » sont des mots français courants : un balayage nu refuserait « cette journée met en
 * balance deux choses », c'est-à-dire une phrase parfaitement juste, tous les jours. On ne compte
 * donc un signe que dans une phrase qui nomme DÉJÀ un point du thème — c'est exactement la forme du
 * seul dégât qu'on cherche à empêcher, et rien d'autre. La borne de phrase est reprise de
 * `futur_type` (`[^.!?]`), pour la même raison : une affirmation d'identité ne traverse pas un point.
 *
 * ⚠️ ELLE N'EST PAS ÉTANCHE, ET CE N'EST PAS UN DÉFAUT CACHÉ. Un signe inventé qui tomberait par
 * hasard dans la liste autorisée passerait (une chance sur douze), et une métaphore dans une phrase
 * qui nomme la Lune peut être refusée à tort. Le coût d'un faux refus est un texte de corpus ce
 * jour-là ; le coût d'un faux passage est une phrase fausse sur son identité, affichée sous le nom
 * d'une personne réelle. L'asymétrie décide, et elle décide dans ce sens-là.
 */
function faitsNatalsInventes(texte: string, cadre: CadreDuVerdict): boolean {
  const autorises = new Set(cadre.signesAutorises.map((s) => normaliserTexte(s)));
  const signes = new RegExp(`\\b(${SIGNES_MOTIF})\\b`, "g");
  for (const phrase of normaliserTexte(texte).split(/[.!?;]/)) {
    if (!ANCRE_NATALE.test(phrase)) continue;
    // Sans heure de naissance, l'ascendant fait un tour complet en vingt-quatre heures : le nommer
    // est TOUJOURS une invention, quel que soit le signe. C'est le cas de la plupart des comptes.
    if (!cadre.ascendantConnu && /\bascendant\b/.test(phrase)) return true;
    for (const m of phrase.matchAll(signes)) {
      if (!autorises.has(m[1])) return true;
    }
  }
  return false;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LE VERDICT
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Le verdict.
 *
 * ⚠️ L'ORDRE DES CONTRÔLES EST CELUI DU COÛT CROISSANT, et ce n'est pas de l'optimisation : le motif
 * rendu est le PREMIER qui mord, et il est journalisé. Mettre « prediction » avant « vide » ferait
 * remonter des motifs de fond pour des réponses qui n'ont simplement rien produit, et la première
 * lecture des journaux conclurait à un problème de consigne là où il y a une panne de flux.
 */
export function verdictHoroscope(brut: string, cadre: CadreDuVerdict): VerdictHoroscope {
  const texte = normaliserTypographie(brut);

  if (texte.length === 0) return { accepte: false, motif: "vide" };
  if (texte.length < LONGUEUR_MIN) return { accepte: false, motif: "trop_court" };
  if (texte.length > LONGUEUR_MAX) return { accepte: false, motif: "trop_long" };

  // Le nom du produit et la question restent GLOBAUX : une question posée dans les gestes reste une
  // question, et le nom du produit reste interdit partout. Les éprouver par partie ferait trois fois
  // le même travail pour le même résultat.
  //
  // ⚠️ LA SECONDE JUSTIFICATION DU REFUS DE « ? » EST TOMBÉE, LA PREMIÈRE SUFFIT. Elle disait :
  // « c'est aussi la forme sous laquelle un modèle glisse un conseil sans en avoir l'air ». Sur la
  // troisième partie, le conseil n'a plus besoin de se déguiser. Ce qui reste, et qui suffit : le
  // socle EXPOSE, il n'interroge pas — une question renvoie la personne à elle-même au moment où
  // elle vient lire.
  if (texte.includes("?")) return { accepte: false, motif: "interrogation" };
  if (NOMS_INTERDITS.test(texte)) return { accepte: false, motif: "signature" };

  const parties = decouperTroisParties(texte);
  if (parties === null) return { accepte: false, motif: "structure" };

  for (const cle of PARTIES) {
    const partie = parties[cle];
    if (partie.length < PARTIE_MIN) return { accepte: false, motif: "partie_courte", partie: cle };
    if (partie.length > PARTIE_MAX) return { accepte: false, motif: "partie_longue", partie: cle };
    // FR-053 : NON NÉGOCIABLE, ET SUR LES TROIS PARTIES. Un geste n'est pas une prédiction ; un
    // geste dont on annonce l'effet en est une, et c'est exactement là que ce détecteur mord.
    if (chercherPredictions(partie).length > 0) {
      return { accepte: false, motif: "prediction", partie: cle };
    }
    // ⚠️ ET C'EST ICI QUE `chercherInterdits` DEVIENT LA GARDE LA PLUS SOLLICITÉE DU PRODUIT.
    // « Des actions pour rendre ça concret » est l'endroit exact où un modèle écrit « prends soin de
    // toi » : `soin` et `prendre en charge` sont ses deux morsures les plus probables. Rien dans ce
    // détecteur n'interdit le conseil — il refuse le vocabulaire de santé, pas l'action. Il reste
    // donc ENTIER : autoriser le geste ne desserre aucune de ses lignes.
    if (chercherInterdits(partie).length > 0) {
      return { accepte: false, motif: "lexique", partie: cle };
    }
    if (faitsNatalsInventes(partie, cadre)) {
      return { accepte: false, motif: "fait_natal_invente", partie: cle };
    }
  }

  return { accepte: true, parties };
}
