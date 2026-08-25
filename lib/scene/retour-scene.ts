import { REGION_FOYER, estRegion, type IdRegion } from "./regions";

/**
 * retour-scene.ts — REVENIR LÀ D'OÙ L'ON VIENT (Story 7.13).
 *
 * ══ CE QUE CE MODULE RÉPARE ═════════════════════════════════════════════════════════════════════
 *
 * Une halte se pose PAR-DESSUS la scène (`EXPERIENCE.md` ligne 62) : ce n'est pas un lieu du monde,
 * c'est une parenthèse. Or la refermer reposait toujours sur le foyer — `regionDOuverture` rend
 * `REGION_FOYER` quelle que soit la région quittée. Quelqu'un qui regardait son arbre, ouvrait
 * « Mes données » et revenait se retrouvait à l'accueil : la parenthèse lui coûtait sa place.
 *
 * Tant qu'il n'existait aucun menu, le coût était invisible — cinq haltes atteignables par URL
 * seule. Avec la feuille de la Story 7.3, il est payé neuf fois.
 *
 * ══ LA RÉGION VOYAGE DANS L'URL, ET NULLE PART AILLEURS ═════════════════════════════════════════
 *
 * ⚠️ PAS DANS UNE DONNÉE DE COMPTE. Écrire « la dernière région visitée » en base serait une
 * écriture par navigation, sur le chemin critique, pour un confort — et surtout une donnée de plus
 * à effacer (FR-067), à exporter (FR-066) et à garder (AD-14). L'URL la porte le temps d'un
 * aller-retour et l'oublie ensuite ; elle ne survit à rien.
 *
 * ⚠️ ET PAS DANS `render/` NON PLUS. Le rendu reçoit une URL déjà faite (AD-7/AD-10). C'est le
 * serveur qui lit le paramètre, le valide, et décide.
 *
 * ══ LE REPLI PENCHE VERS LE CONNU ═══════════════════════════════════════════════════════════════
 *
 * Une halte s'atteint aussi par lien direct, par courriel ou par notification : le paramètre est
 * alors absent, ou forgé. Dans les deux cas on rouvre sur le FOYER — jamais sur une région devinée.
 * C'est la même asymétrie que `regionDOuverture`, qui penche vers le seuil : « on ne sait pas » doit
 * mener quelque part de connu.
 */

/** Le nom du paramètre. Une seule source — deux orthographes créeraient un retour muet. */
export const PARAM_ORIGINE = "de";

/**
 * L'URL d'une halte, en emportant la région d'où l'on part.
 *
 * ⚠️ `REGION_FOYER` N'EST PAS EMPORTÉ, ET C'EST VOLONTAIRE : c'est déjà le repli. L'ajouter
 * mettrait un paramètre sur la majorité des liens du produit, pour ne rien changer au résultat.
 */
export function versHalte(url: string, depuis: IdRegion): string {
  if (depuis === REGION_FOYER) return url;
  const separateur = url.includes("?") ? "&" : "?";
  return `${url}${separateur}${PARAM_ORIGINE}=${encodeURIComponent(depuis)}`;
}

/**
 * La région à rouvrir en fermant une halte, lue depuis les paramètres d'URL.
 *
 * ⚠️ `estRegion` VALIDE, ET CE N'EST PAS DE LA PARANOÏA. Le paramètre est fourni par le client :
 * `?de=<script>` ou `?de=seuil` arriveraient tels quels. Le premier n'irait nulle part — la valeur
 * ne sert qu'à comparer —, mais le second rouvrirait le RIDEAU D'ENTRÉE sur un compte qui l'a déjà
 * franchi, ce qui se lit comme une déconnexion.
 */
export function regionDeRetour(parametres: Record<string, string | string[] | undefined>): IdRegion {
  const brut = parametres[PARAM_ORIGINE];
  const valeur = Array.isArray(brut) ? brut[0] : brut;
  if (typeof valeur !== "string" || !estRegion(valeur) || valeur === "seuil") return REGION_FOYER;
  return valeur;
}

/** L'URL de retour vers la scène, région comprise. Rendue au composant, qui ne décide rien. */
export function urlRetourScene(parametres: Record<string, string | string[] | undefined>): string {
  const region = regionDeRetour(parametres);
  return region === REGION_FOYER ? "/" : `/?${PARAM_ORIGINE}=${encodeURIComponent(region)}`;
}
