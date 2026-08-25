/**
 * ouverture-seance.ts — C'EST ANAM QUI PARLE LA PREMIÈRE (retour du 2026-08-23).
 *
 * ══ LE CONSTAT ═══════════════════════════════════════════════════════════════════════════════════
 *
 * « C'est Anam qui doit initialiser la conversation et la mener, pas l'inverse. »
 *
 * Une ouverture existait déjà — mais UNIQUEMENT pour des événements décidés par le serveur : une
 * proposition de branche, une invitation, la complétion du socle, une hypothèse de type, un geste
 * de pause. Sur une arrivée ORDINAIRE, `chargerOuverture` rend `null`, le fil est vide, et l'écran
 * de conversation est un composeur qui attend. C'est-à-dire que dans le cas le plus fréquent — et
 * dans le tout premier de tous —, c'est la personne qui doit trouver quoi dire à une machine.
 *
 * ══ POURQUOI CETTE PHRASE N'EST PAS PRODUITE PAR LE MODÈLE ══════════════════════════════════════
 *
 * Faire écrire l'ouverture par le modèle coûterait un tour complet À CHAQUE ENTRÉE dans la région,
 * avant même qu'on ait dit un mot — donc de l'attente, de l'allocation consommée, et un risque de
 * panne sur l'écran d'accueil de la conversation. Or ce qu'on veut ici est court, stable et sûr.
 *
 * ⚠️ ET ELLE UTILISE LA MÉMOIRE, SANS QUOI ELLE SERAIT UNE FORMULE. Le nom d'une branche est le mot
 * QU'ELLE A CHOISI : le lui rendre prouve qu'on l'a gardé. On ne cite en revanche JAMAIS un fait
 * retenu brut — l'extraction est une reformulation par un modèle (4.2), et ouvrir une séance en
 * assénant « la dernière fois tu m'as dit que tu dormais mal » place un verdict là où le produit
 * ne pose que des hypothèses (FR-023, voix 2.8).
 *
 * Module PUR (AD-1) : aucune I/O, aucune horloge. La matière lui arrive déjà lue.
 */

/**
 * L'ÉCART QUI FAIT UNE ARRIVÉE — et c'est le correctif du 2026-08-25.
 *
 * ⚠️ LA CONDITION ÉTAIT « LE FIL EST VIDE », ET ELLE NE POUVAIT PRESQUE JAMAIS ÊTRE VRAIE. Le fil
 * lu couvre vingt-quatre heures glissantes : quelqu'un qui a parlé hier soir et qui revient ce
 * matin trouvait un fil NON vide, donc pas d'ouverture, donc un composeur qui attend. Autrement
 * dit, Anam n'ouvrait que pour une personne absente depuis plus d'un jour — et jamais pour celle
 * qui revient, qui est le cas le plus fréquent. Le retour du 2026-08-25 le dit sans détour :
 * « dès que je viens sur Anam, je veux qu'elle me dise bonjour ; là ça fait juste parler à ChatGPT ».
 *
 * Ce qu'on mesure maintenant est l'ÉCART depuis le dernier tour. Une pause de vingt minutes au
 * milieu d'un échange n'est pas une arrivée — la resaluer serait absurde, et se lirait comme un
 * bug. Une reprise après quelques heures en est une.
 *
 * Trois heures : au-delà d'une pause plausible dans une même séance, en deçà d'une demi-journée.
 * La valeur est un choix de produit, pas une mesure — elle est ici pour se relire et se changer.
 */
export const REPRISE_HEURES = 3;

/**
 * Est-ce une ARRIVÉE ? Aucun tour, ou un dernier tour plus vieux que l'écart.
 *
 * ⚠️ UN HORODATAGE ILLISIBLE COMPTE COMME UNE ARRIVÉE, et c'est le repli le moins coûteux : le
 * pire cas est une salutation en trop, contre un silence sur l'écran dont tout le propos est
 * d'ouvrir la parole. L'inverse — se taire dans le doute — est précisément le défaut qu'on répare.
 */
export function estUneArrivee(derniereParoleIso: string | null, maintenant: Date): boolean {
  if (!derniereParoleIso) return true;
  const t = Date.parse(derniereParoleIso);
  if (!Number.isFinite(t)) return true;
  return maintenant.getTime() - t >= REPRISE_HEURES * 3_600_000;
}

export interface MatiereOuverture {
  /** Son prénom, s'il est connu. Jamais inventé. */
  readonly prenom: string | null;
  /**
   * Les noms des branches qui vivent encore (hors pleine lumière), la plus récente d'abord. Des
   * MOTS D'ELLE : c'est ce qui rend l'ouverture personnelle sans citer d'extraction.
   */
  readonly branchesVivantes: readonly string[];
  /** A-t-elle déjà parlé à Anam ? Distinct de « il y a des branches » : on peut avoir parlé sans rien nommer. */
  readonly dejaVenue: boolean;
}

/**
 * ⚠️ TROIS PHRASES AU MAXIMUM, ET ELLE FINIT PAR UNE QUESTION. La voix (2.8) plafonne à trois
 * phrases et demande « pose plus que tu n'affirmes » ; une ouverture qui n'appelle rien laisse
 * exactement le silence qu'on répare. Aucune salutation d'heure (le serveur est en UTC — QA du
 * 2026-08-19), aucun « bienvenue », aucun point d'exclamation.
 */
/**
 * ⚠️ SANS PRÉNOM, LA PHRASE DOIT QUAND MÊME COMMENCER PAR UNE MAJUSCULE — et c'est une garde qui a
 * dû me le rappeler. La première version préfixait `« ${prenom}, »` puis enchaînait en minuscule :
 * avec un prénom on lisait « Louise, qu'est-ce qui… », sans prénom on lisait « qu'est-ce qui… ».
 * Un cas sur deux, et le plus fréquent au début, sortait bancal.
 */
const adresser = (prenom: string | null, suite: string): string =>
  prenom ? `${prenom}, ${suite}` : suite.charAt(0).toUpperCase() + suite.slice(1);

export function phraseDOuverture(m: MatiereOuverture): string {
  if (!m.dejaVenue) {
    // ⚠️ ON DIT L'IGNORANCE PLUTÔT QUE DE LA MASQUER. Une première phrase qui fait semblant de
    // connaître quelqu'un est le mensonge le moins coûteux à écrire et le plus coûteux à porter.
    //
    // ⚠️ ET ELLE DEMANDE, ELLE N'ORDONNE PAS. « Raconte-moi ce qui t'occupe » était la première
    // version : une invitation chaleureuse, et un impératif. La voix (2.8) dit « pose plus que tu
    // n'affirmes », et une garde a relevé qu'aucune question n'y figurait — sur l'écran dont tout
    // le propos est d'ouvrir la parole.
    // ⚠️ LE PRÉNOM NE PREND PAS UNE PHRASE À LUI, et c'est encore une garde qui l'a dit : « Louise. »
    // en ouverture faisait quatre phrases là où la voix en plafonne trois. Il s'attache à la
    // première, où il sert d'adresse au lieu de compter pour une salutation.
    return adresser(
      m.prenom,
      `je ne sais rien de toi pour l’instant, et on va faire avec. ` +
        `Qu’est-ce qui t’occupe en ce moment ? Même mal dit, même sans savoir par où prendre.`,
    );
  }

  const branche = m.branchesVivantes[0];
  if (branche) {
    // Le nom de la branche est SON mot. On le lui rend, et on lui laisse le refuser dans la même
    // phrase : reprendre n'est pas une consigne.
    return adresser(
      m.prenom,
      `on avait laissé « ${branche} » en chemin. ` +
        `On peut reprendre là, ou partir d’ailleurs — qu’est-ce qui t’occupe aujourd’hui ?`,
    );
  }

  return adresser(m.prenom, `qu’est-ce qui t’occupe aujourd’hui ? Commence par où tu veux, même par le milieu.`);
}
