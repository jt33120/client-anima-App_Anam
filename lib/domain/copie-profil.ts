/**
 * copie-profil.ts — LE PROFIL (retour du 2026-08-23).
 *
 * « Il manque aussi un bouton "Profil" avec les paramètres, où on peut réinitialiser ses infos,
 * changer son nom, gérer son abonnement etc. »
 *
 * ══ CE QUI MANQUAIT N'ÉTAIT PAS DES ÉCRANS, C'ÉTAIT UNE PORTE ═══════════════════════════════════
 *
 * Les écrans existaient tous — réglages, mémoire, données, abonnement, heure de naissance, type —
 * et AUCUN n'était atteignable autrement qu'en tapant son URL. C'est une dette déjà inscrite dans
 * l'en-tête de `/reglages` (« elle n'est atteignable que par URL tant que ce menu n'existe pas »),
 * et elle vaut pour cinq haltes. Ce fichier est ce menu.
 *
 * ⚠️ CE N'EST PAS UN TABLEAU DE BORD. Aucun chiffre, aucun état de compte affiché ici, aucune
 * jauge : FR-031 vaut sur cette page comme ailleurs, et un profil est l'endroit où l'on va CHANGER
 * quelque chose, pas où l'on se regarde.
 *
 * Module PUR (AD-1). La copie vit hors du composant pour qu'un test la passe aux détecteurs.
 */

export const TITRE_HALTE = "Profil";

export const INTRODUCTION =
  "Ce qui te concerne, et tout ce que tu peux changer. Rien ici n’est définitif, sauf ce qui le dit.";

export const SECTION_NOM = "Ton nom";
export const NOM_DESCRIPTION =
  "Le prénom est celui qu’Anam emploie en te parlant. Le nom complet, lui, ne sert qu’au calcul des nombres — il n’est affiché nulle part et rien ne t’oblige à le donner.";
export const LABEL_PRENOM = "Prénom";
export const LABEL_NOM_COMPLET = "Nom complet";
export const AIDE_NOM_COMPLET = "Facultatif. Le laisser vide retire simplement les nombres qui en dépendent.";
export const ACTION_ENREGISTRER = "Enregistrer";
export const NOM_ENREGISTRE = "C’est enregistré.";
export const NOM_VIDE = "Il faut un prénom — même un surnom, même une initiale.";
export const NOM_TROP_LONG = "C’est trop long pour tenir dans un prénom.";
export const NOM_ECHEC = "Je n’ai pas réussi à enregistrer. Réessaie dans un moment.";

/**
 * ⚠️ CHANGER LE NOM COMPLET CHANGE LES NOMBRES, ET IL FAUT LE DIRE AVANT. Les nombres d'expression,
 * intime et de personnalité sont calculés depuis les lettres du nom. Quelqu'un qui corrige une
 * faute de frappe verrait trois cartes changer sans comprendre pourquoi — et croirait à une panne.
 */
export const NOM_PREVIENT_LES_NOMBRES =
  "Changer le nom complet recalcule les nombres qui en viennent. Ta date de naissance, elle, ne bouge pas.";

export interface EntreeProfil {
  readonly titre: string;
  readonly quoi: string;
  readonly url: string;
}

/**
 * ⚠️ L'ORDRE VA DU PLUS COURANT AU PLUS DÉFINITIF, et il finit par l'effacement. Ce n'est pas de la
 * mise en page : une liste de réglages qui met « supprimer mon compte » en troisième position le
 * fait toucher par accident.
 */
export const ENTREES: readonly EntreeProfil[] = Object.freeze([
  {
    /**
     * ⚠️ EN TÊTE, ET C'EST UNE DÉCISION ÉCRITE (amendement d'`EXPERIENCE.md` du 2026-08-25, §1).
     *
     * « Ton socle » est la DEUXIÈME entrée du menu de compte, juste après « Aide et ressources » —
     * qui, elle, ne vit pas encore ici. C'est donc la première de cette liste-ci. Elle y est mise
     * dès maintenant plutôt qu'à la Story 7.3 pour une raison simple : la halte existe (7.5), et
     * une halte qu'on ne peut atteindre qu'en tapant son URL est une halte qui n'existe pas pour
     * celle qui l'utilise.
     *
     * Cette liste entière est reprise par `lib/domain/menu-compte.ts` en Story 7.2 — il n'existera
     * alors plus qu'UNE seule liste d'entrées de compte dans le dépôt.
     */
    titre: "Ton socle",
    quoi: "Tes six nombres et leur sens, ton ciel de naissance, ton type — tout ce qui a été calculé, et ce qui manque.",
    url: "/socle",
  },
  {
    titre: "Le rythme quotidien",
    quoi: "À quelle heure ton téléphone peut afficher quelques mots, et s’il le fait.",
    url: "/reglages",
  },
  {
    titre: "Ce qu’Anam retient",
    quoi: "Les phrases qu’elle a gardées de ce que tu lui as dit. Tu peux les corriger ou les effacer une par une.",
    url: "/memoire",
  },
  {
    titre: "Ton heure de naissance",
    quoi: "Elle complète le socle. Sans elle, une partie du ciel reste incalculable.",
    url: "/heure-naissance",
  },
  {
    titre: "Ton type",
    quoi: "L’ennéagramme, si le test a été passé ou si une hypothèse a été posée.",
    url: "/enneagramme",
  },
  {
    titre: "Ton abonnement",
    quoi: "Ce qui est en cours, et comment l’arrêter. Arrêter prend autant de clics que commencer.",
    url: "/abonnement",
  },
  {
    titre: "Tes données",
    quoi: "Tout télécharger, ou tout effacer — définitivement, compte compris.",
    url: "/mes-donnees",
  },
]);
