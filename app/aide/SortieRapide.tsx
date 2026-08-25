"use client";

import s from "./aide.module.css";

/**
 * SortieRapide — le contrôle « Quitter le site » en tête de /aide. Pratique STANDARD des pages de
 * ressources sur les violences : navigue vers un site NEUTRE et REMPLACE l'entrée d'historique (le
 * bouton « précédent » ne ramène pas ici). Discret, jamais alarmant.
 *
 * ══ ⚠️ CE FICHIER CITAIT « FR-074 », ET C'ÉTAIT UN INVARIANT EMPRUNTÉ (corrigé le 2026-08-25) ═════
 *
 * FR-074 (`prd.md:139`) traite des **dangers non suicidaires** et ne dit rien d'une sortie rapide.
 * Aucun FR du PRD ne porte ce contrôle. Le numéro donnait donc à ce bouton l'autorité d'une exigence
 * produit qu'il n'a pas — et c'est plus dangereux qu'une absence d'invariant, parce que ça EMPÊCHE
 * L'ARBITRAGE : personne ne discute une ligne marquée FR.
 *
 * Ce qui le fonde vraiment : `EXPERIENCE.md:434` le décrit, et `EXPERIENCE.md:605` le range parmi les
 * **propositions d'interface NON VALIDÉES**. C'est le statut réel, et il est cité tel quel.
 *
 * ⚠️ PORTE PRÉ-LANCEMENT : professionnel qualifié + juriste. Toute modification de ce contrôle —
 * l'URL neutre, le libellé, sa place — le re-soumet à cette porte. C'est un coût à noter, pas une
 * raison de ne rien faire.
 *
 * ⚠️ ET IL RESTE SUR `/aide` — DÉCISION ÉCRITE DU 2026-08-25. L'autre issue était de le déplacer
 * dans la surimpression, là où la conversation a lieu, donc là où le danger est réellement présent.
 * Elle est refusée pour l'instant, et pour une raison précise : la surimpression est constante sur
 * TOUTES les régions, et un contrôle qui quitte le site posé en permanence à côté du fil se
 * déclencherait par erreur bien plus souvent qu'il ne servirait — c'est exactement le défaut qu'on
 * vient de corriger sur cette page (« Quitter » pris pour « fermer »). Le jour où cette décision se
 * rediscute, `tests/aide-route.test.ts` (qui verrouille `location.replace` et l'URL absolue) se
 * DÉPLACE avec le contrôle ; il ne se supprime pas.
 *
 * Feuille `"use client"` : n'introduit AUCUNE session/IA/traceur — l'étanchéité de /aide (statique,
 * publique, sans dépendance IA — 2.5) est préservée : ce composant ne fait que naviguer.
 *
 * ⚠️ PROVISOIRE — porte pré-lancement (juriste + professionnel qualifié) : l'URL neutre et le libellé
 * sont l'intention produit, à valider avant mise en ligne.
 */

/**
 * ⚠️ LE LIBELLÉ ÉTAIT « QUITTER », ET C'ÉTAIT LE DÉFAUT (retour de Julian, 2026-08-25) :
 * « quand je quitte la page aide je suis redirigé vers météo france !!! ».
 *
 * Il avait raison de le signaler, et le code faisait exactement ce qui était écrit. Le défaut n'est
 * pas dans le comportement, il est dans le NOM : « Quitter » se lit « referme cette page », c'est-à-
 * dire le geste le plus banal du monde, et ce bouton était le SEUL contrôle de la page. Tout le
 * monde allait donc cliquer dessus pour revenir dans Anima — et atterrir sur un site de météo, sans
 * bouton précédent, parce que l'historique est écrasé exprès.
 *
 * Une sortie de secours que 99 % des gens déclenchent par erreur n'est plus une sortie de secours :
 * c'est un piège pour tout le monde, et un cri de loup pour celle qui en a vraiment besoin.
 *
 * Corrigé en deux gestes, et AUCUN ne touche à la fonction : la page porte désormais un « Retour »
 * explicite (`app/aide/page.tsx`), et ce contrôle-ci dit ce qu'il fait. Le comportement — site
 * neutre, historique remplacé — est INCHANGÉ : c'est lui qui protège quelqu'un qui lit cette page
 * avec un tiers dangereux derrière l'épaule.
 */
const LIBELLE = "Quitter le site";

/** Site neutre de repli — PROVISOIRE (à valider). Météo : anodin, crédible, sans trace du contexte. */
const URL_NEUTRE = "https://www.meteofrance.com";

export default function SortieRapide() {
  const quitter = () => {
    // replace() : navigue ET écrase l'entrée d'historique courante → le retour arrière ne revient
    // JAMAIS sur /aide (protège en cas de présence d'un tiers dangereux).
    window.location.replace(URL_NEUTRE);
  };
  return (
    <button
      type="button"
      className={s.sortieRapide}
      onClick={quitter}
      aria-label="Quitter ce site et aller sur un site neutre"
    >
      <span className="t-bouton">{LIBELLE}</span>
    </button>
  );
}
