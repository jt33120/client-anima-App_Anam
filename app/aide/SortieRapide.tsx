"use client";

import s from "./aide.module.css";

/**
 * SortieRapide — le contrôle « Quitter » en tête de /aide (Story 2.6, FR-074). Pratique STANDARD des
 * pages de ressources sur les violences : navigue vers un site NEUTRE et REMPLACE l'entrée d'historique
 * (le bouton « précédent » ne ramène pas ici). Discret, jamais alarmant.
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
