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
 * La remarque du 2026-08-26 tranche plus précisément : la frontière n'est pas une durée arbitraire,
 * c'est le JOUR CIVIL de la personne. Une pause de quatre heures le même jour ne doit pas produire
 * un second accueil ; le premier accès du lendemain doit en produire un, même dix minutes après
 * minuit. Le fuseau explicite est Europe/Paris, celui du quotidien déjà affiché sur « Moi ».
 */
export const FUSEAU_JOUR_ANAM = "Europe/Paris";

const FORMATEUR_JOUR = new Intl.DateTimeFormat("fr-CA", {
  timeZone: FUSEAU_JOUR_ANAM,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Clé stable YYYY-MM-DD du jour parisien, ou `null` pour une date invalide. */
export function cleJourParis(date: Date): string | null {
  if (!Number.isFinite(date.getTime())) return null;
  const morceaux = Object.fromEntries(
    FORMATEUR_JOUR.formatToParts(date)
      .filter((p) => p.type === "year" || p.type === "month" || p.type === "day")
      .map((p) => [p.type, p.value]),
  );
  return morceaux.year && morceaux.month && morceaux.day
    ? `${morceaux.year}-${morceaux.month}-${morceaux.day}`
    : null;
}

/**
 * Durée, calculée depuis l'horloge serveur, jusqu'au prochain changement de jour parisien.
 * Une recherche bornée évite toute arithmétique d'offset fragile aux changements d'heure. Le
 * navigateur n'a ensuite qu'un minuteur relatif : une horloge locale fausse ne peut supprimer
 * l'ouverture du lendemain.
 */
export function delaiAvantProchainJourParis(maintenant: Date): number | null {
  const depart = maintenant.getTime();
  const jour = cleJourParis(maintenant);
  if (!Number.isFinite(depart) || jour === null) return null;

  let bas = depart + 1;
  let haut = depart + 27 * 60 * 60 * 1_000;
  if (cleJourParis(new Date(haut)) === jour) return null;

  while (bas < haut) {
    const milieu = Math.floor((bas + haut) / 2);
    if (cleJourParis(new Date(milieu)) === jour) bas = milieu + 1;
    else haut = milieu;
  }
  return Math.max(1, haut - depart);
}

export function estLeJourParis(instantIso: string, maintenant: Date): boolean {
  const instant = new Date(instantIso);
  const jourInstant = cleJourParis(instant);
  const jourCourant = cleJourParis(maintenant);
  return jourInstant !== null && jourCourant !== null && jourInstant === jourCourant;
}

/**
 * Est-ce la première ARRIVÉE du jour ? Aucun tour, ou un dernier tour d'un autre jour parisien.
 *
 * ⚠️ UN HORODATAGE ILLISIBLE COMPTE COMME UNE ARRIVÉE, et c'est le repli le moins coûteux : le
 * pire cas est une salutation en trop, contre un silence sur l'écran dont tout le propos est
 * d'ouvrir la parole. L'inverse — se taire dans le doute — est précisément le défaut qu'on répare.
 */
export function estUneArrivee(derniereParoleIso: string | null, maintenant: Date): boolean {
  if (!derniereParoleIso) return true;
  const dernierJour = cleJourParis(new Date(derniereParoleIso));
  const jourCourant = cleJourParis(maintenant);
  if (dernierJour === null || jourCourant === null) return true;
  return dernierJour !== jourCourant;
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
  readonly dejaVenue: boolean | null;
}

/**
 * ⚠️ TROIS PHRASES AU MAXIMUM, ET ELLE FINIT PAR UNE QUESTION. La voix (2.8) plafonne à trois
 * phrases et demande « pose plus que tu n'affirmes » ; une ouverture qui n'appelle rien laisse
 * exactement le silence qu'on répare. Aucun mot dépendant de l'heure (le serveur est en UTC — QA
 * du 2026-08-19), aucun « bienvenue », aucun point d'exclamation. « Te voilà / Te revoilà » accuse
 * réception de son arrivée sans prétendre connaître l'heure locale.
 */
/**
 * ⚠️ SANS PRÉNOM, LA PHRASE DOIT QUAND MÊME COMMENCER PAR UNE MAJUSCULE — et c'est une garde qui a
 * dû me le rappeler. La première version préfixait `« ${prenom}, »` puis enchaînait en minuscule :
 * avec un prénom on lisait « Louise, qu'est-ce qui… », sans prénom on lisait « qu'est-ce qui… ».
 * Un cas sur deux, et le plus fréquent au début, sortait bancal.
 */
/**
 * ⚠️ LA SOUDURE EST UN DEUX-POINTS, PLUS UN TIRET (retour du fondateur, 2026-09-02) : « dans
 * l'ensemble des textes de l'app, bannir les — qui font très IA ». Le tiret cadratin rattachait
 * l'accueil à la première phrase ; il est parti de TOUTES les chaînes de ce module. Les commentaires
 * peuvent en garder : personne d'autre que nous ne les lit.
 *
 * POURQUOI UN DEUX-POINTS ET PAS UN POINT. La voix (2.8, `voix-anam.ts`) définit la ponctuation
 * finale comme un groupe de `. ! ? …` — le deux-points n'en fait pas partie, donc « Te voilà,
 * Louise : » reste dans la phrase qu'il ouvre et ne compte pas pour une phrase. Un point ferait de
 * la salutation une phrase à elle seule : la première venue (deux phrases de confiance et une
 * question) et le retour sur une branche passeraient à QUATRE, là où la voix en plafonne trois —
 * très exactement le défaut que « le prénom ne prend pas une phrase à lui » avait déjà réparé. Le
 * test « [LA COUTURE] » le prouve avec le vrai coupeur de la voix, pas avec un compte maison.
 *
 * ⚠️ CES PHRASES SONT PERSISTÉES. `reclamerOuvertureDuJour` (`app/_ouverture/reclamer-ouverture.ts`)
 * grave la phrase générique — et l'événement salué — dans le journal immuable à la première
 * ouverture du jour. Changer une chaîne ici ne réécrit donc AUCUNE ouverture déjà dite : seules les
 * ouvertures futures changent, et c'est voulu, on ne retouche pas ce qu'on lui a déjà dit. Aucune
 * migration, aucune donnée.
 */
const accueillir = (prenom: string | null, dejaVenue: boolean | null, suite: string): string => {
  const arrivee = dejaVenue === true ? "Te revoilà" : "Te voilà";
  return prenom ? `${arrivee}, ${prenom} : ${suite}` : `${arrivee} : ${suite}`;
};

/**
 * Salue sans prétendre savoir davantage. Sert quand une ouverture précise (pause, proposition,
 * hypothèse…) remplace la question générique : une seule parole, mais Anam accuse bien réception
 * de l'arrivée.
 */
export function salutationDOuverture(
  m: Pick<MatiereOuverture, "prenom" | "dejaVenue">,
): string {
  const arrivee = m.dejaVenue === true ? "Te revoilà" : "Te voilà";
  return m.prenom ? `${arrivee}, ${m.prenom}.` : `${arrivee}.`;
}

/** Une ouverture événementielle reste UN tour et commence par la salutation attendue. */
export function saluerOuvertureEvenement(
  phrase: string,
  m: Pick<MatiereOuverture, "prenom" | "dejaVenue">,
): string {
  const salutation = salutationDOuverture(m).replace(/\.$/, "");
  // Le deux-points rattache l'accueil à la première phrase (il n'est pas une ponctuation finale
  // pour la voix, voir `accueillir`) : un événement déjà long de trois phrases ne franchit pas
  // silencieusement le plafond en devenant une quatrième. La phrase de l'événement est reprise
  // TELLE QUELLE, majuscule comprise — une ou plusieurs phrases complètes après un deux-points
  // gardent leur majuscule, et ce module ne retouche pas une parole écrite ailleurs.
  return `${salutation} : ${phrase}`;
}

export function phraseDOuverture(m: MatiereOuverture): string {
  if (m.dejaVenue === null) {
    // La lecture du journal a échoué : ni « première fois », ni « retour » ne sont établis. On
    // accueille sans fabriquer de biographie, puis on pose la question minimale.
    return accueillir(
      m.prenom,
      null,
      `je suis là. Qu’est-ce qui t’occupe en ce moment ? Commence par où tu veux.`,
    );
  }
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
    //
    // ⚠️ ET L'IGNORANCE EST DITE SANS SÉCHERESSE (retour du fondateur, 2026-09-02). « Je ne sais
    // rien de toi et on fera avec » était « trop sec » : l'aveu était juste, mais il la laissait
    // seule avec. Le noyau « je ne sais rien de toi » reste (c'est ce qui distingue une première
    // venue d'un retour, et un test l'exige) ; ce qui suit rassure au lieu de constater — c'est
    // normal, on avance à son rythme, rien n'est attendu d'elle. Au présent, sans « tu verras » ni
    // aucun futur adressé (FR-053), sans impératif : c'est elle qui décide. « Même sans savoir par
    // où prendre », qui faisait une troisième phrase, se replie dans la seconde pour que la
    // question reste la troisième et dernière. Ces mots sont gravés au journal à la première
    // ouverture du jour (voir `accueillir`) : les ouvertures déjà dites ne changent pas.
    return accueillir(
      m.prenom,
      false,
      `je ne sais rien de toi pour l’instant, et c’est normal. ` +
        `On avance à ton rythme, rien n’est attendu de toi, pas même de savoir par où commencer. ` +
        `Qu’est-ce qui t’occupe en ce moment ?`,
    );
  }

  const branche = m.branchesVivantes[0];
  if (branche) {
    // Le nom de la branche est SON mot. On le lui rend, et on lui laisse le refuser dans la même
    // phrase : reprendre n'est pas une consigne. La question fait sa propre phrase (trois en tout,
    // salutation soudée comprise) : le tiret qui la rattachait à l'alternative est parti avec les
    // autres (retour du fondateur, 2026-09-02).
    return accueillir(
      m.prenom,
      true,
      `on avait laissé « ${branche} » en chemin. ` +
        `On peut reprendre là, ou partir d’ailleurs. Qu’est-ce qui t’occupe aujourd’hui ?`,
    );
  }

  return accueillir(
    m.prenom,
    true,
    `qu’est-ce qui t’occupe aujourd’hui ? Commence par où tu veux, même par le milieu.`,
  );
}
