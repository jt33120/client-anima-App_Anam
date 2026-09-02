/**
 * regions.ts — Le CATALOGUE des régions de la scène + les types. Story 1.7 (AD-7).
 *
 * MODÈLE PUR : données seules, aucun import Next/React/DOM, aucun import `render/`.
 * La scène est UN monde continu ; les « régions » sont des cadrages de ce monde,
 * reliés en fondu (jamais des routes, jamais des écrans secs — cf. story Décision n°2).
 */

/** Les cadrages du monde. `seuil` = le rideau d’entrée ; les 3 autres = destinations. */
export type IdRegion = "seuil" | "accueil" | "anam" | "arbre";

export interface Region {
  readonly id: IdRegion;
  /** Libellé du lien nommé (doublage non-spatial de rang égal, UX-DR-37). */
  readonly nom: string;
  /** Apparaît dans la barre basse / le rail latéral (Aujourd’hui, Anam, Mon arbre). */
  readonly destinationDirecte: boolean;
}

/**
 * Catalogue complet, dans l’ORDRE DE LECTURE LINÉAIRE garanti (AC3), indépendant
 * de la disposition spatiale. Le seuil ouvre le monde mais n’est pas une destination
 * de la barre : on n’y « retourne » pas, il se lève une fois.
 */
/**
 * ⚠️ « Accueil » EST DEVENU « Moi », ET « L’arbre » « Mon arbre » LE 2026-08-25 (Story 7.9).
 *
 * Retour de Julian : « L'arbre devient "Mon arbre" / Accueil devient "Moi" ». Ce ne sont pas des
 * synonymes plus jolis : « Accueil » est un mot de SITE — la page d'entrée d'un lieu public —,
 * « Moi » est un mot de personne. Le produit n'est pas un site qu'on visite.
 *
 * ⚠️ ET « Moi » EST DEVENU « Aujourd’hui » LE 2026-09-02 (retour terrain du fondateur, 2026-09-01,
 * story E1-S4). Le mot est le sien. La région s'ouvre chaque jour sur ce que le jour propose : la
 * date, le ciel, le mantra, puis les univers qui ne bougent pas. « Aujourd’hui » nomme ce qu'on
 * vient y chercher ; « Moi » nommait la personne, et ce n'est pas elle qui change d'un jour à
 * l'autre. Seul le nom visible change : l'identifiant `accueil`, `REGION_FOYER`, l'URL et le
 * stockage restent, et c'est exactement ce que ce catalogue permet. Deux conséquences, décidées le
 * même jour (D7) : le h2 de la section quotidienne (`render/accueil/Bibliotheque.tsx`) dit « Ce que
 * le jour propose », parce que deux entêtes « Aujourd’hui » sur un même écran nommeraient deux fois
 * la même chose ; et le séparateur de jour du fil (`render/conversation/Fil.tsx`) garde son mot,
 * qui n'est pas un nom de lieu (il est exempté nommément dans `tests/scene-modele.test.ts`).
 *
 * ⚠️ ET LA RÉGION RESTE UN LIEU, PAS UN HUB DE COMPTE (amendement d'`EXPERIENCE.md` §5, clause
 * écrite AVANT le renommage du 2026-08-25 précisément pour qu'il ne dérive pas, et qui tient pour
 * celui du 2026-09-02). Un lieu, qu'il s'appelle « Moi » ou « Aujourd’hui », qui affiche un taux de
 * complétude n'est plus un lieu : c'est un tableau de bord, et le produit n'en a pas. Aucune entrée
 * de compte n'y déménage, aucune rubrique nominative au-dessus du pli (`EXPERIENCE.md` ligne 452),
 * aucune pastille (FR-031, DUR).
 *
 * ⚠️ ET C'EST LA SEULE SOURCE DE CES NOMS. `tests/scene-modele.test.ts` échoue si un fichier hors
 * de celui-ci écrit un nom de région en littéral : sans quoi le renommage suivant en oublierait un,
 * et deux surfaces du même produit appelleraient le même lieu autrement.
 */
export const CATALOGUE_REGIONS: readonly Region[] = [
  { id: "seuil", nom: "Seuil", destinationDirecte: false },
  { id: "accueil", nom: "Aujourd’hui", destinationDirecte: true },
  { id: "anam", nom: "Anam", destinationDirecte: true },
  { id: "arbre", nom: "Mon arbre", destinationDirecte: true },
] as const;

/** Les destinations nommées, dans l’ordre — source de la barre basse et du rail. */
export const REGIONS: readonly Region[] = CATALOGUE_REGIONS.filter(
  (r) => r.destinationDirecte,
);

/** Le rideau d’entrée : où l’on arrive en franchissant le seuil. */
export const REGION_ENTREE: IdRegion = "seuil";

/**
 * Le FOYER du monde : la région sur laquelle il s’ouvre une fois le seuil franchi.
 *
 * ⚠️ LE SEUIL SE FRANCHIT UNE FOIS, ET C’EST TOUT SON PROPOS. Il était rendu à CHAQUE chargement :
 * une porte posée devant une porte déjà ouverte, puisque les trois destinations étaient offertes
 * dans la barre juste en dessous. Quelqu’un qui revenait devait rouvrir un rideau qu’il avait
 * déjà levé, et n’avait aucune raison de comprendre ce que cet écran faisait là.
 */
export const REGION_FOYER: IdRegion = "accueil";

/**
 * La région où vit la conversation avec Anam. SOURCE UNIQUE (ne jamais coder « anam »
 * en dur ailleurs) : c’est elle qui, seule, porte la mention IA légale (FR-013, art. 50)
 * et le signe d’Anam dans la surimpression persistante (Story 1.8).
 */
export const REGION_CONVERSATION: IdRegion = "anam";

const IDS: readonly string[] = CATALOGUE_REGIONS.map((r) => r.id);

/** Garde de type : `v` est-il un identifiant de région connu ? */
export const estRegion = (v: string): v is IdRegion => IDS.includes(v);

/**
 * Le nom visible d'une région, pris au catalogue et jamais recopié.
 *
 * C'est par lui que les écrans HORS de la scène (la frontière d'erreur, la page introuvable) disent
 * « Revenir à … » : le renommage du 2026-09-02 a trouvé « Revenir à Moi » écrit en dur dans
 * `app/_erreur/ErreurApplication.tsx`, hors de portée de la garde de `tests/scene-modele.test.ts`
 * (qui cherche un nom entre guillemets ou entre balises, pas au fil d'une phrase). Un libellé
 * recopié survit au catalogue qui l'a produit ; celui-ci ne le peut pas.
 */
export function nomDeRegion(id: IdRegion): string {
  return CATALOGUE_REGIONS.find((r) => r.id === id)?.nom ?? "";
}
