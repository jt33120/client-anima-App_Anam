import s from "./halte-en-attente.module.css";

/**
 * HalteEnAttente — CE QUI S'AFFICHE PENDANT QU'UNE HALTE ARRIVE (retour de Julian, 2026-08-25).
 *
 * ══ LE DÉFAUT ═══════════════════════════════════════════════════════════════════════════════════
 *
 * « Les boutons sont très lents, quand je clique sur profil, rien ne se passe et d'un coup, quelques
 * secondes après, la page s'ouvre, l'UI fait pas très pro. »
 *
 * Aucun bouton n'était lent. Ce qui manquait, c'est qu'AUCUNE page de ce dépôt ne disait « j'ai
 * entendu ton doigt ». Vingt haltes sur vingt et une sont `force-dynamic`, et il n'existait pas un
 * seul `loading.tsx` dans tout l'arbre : au clic, Next attend que la page serveur soit ENTIÈREMENT
 * prête avant de peindre quoi que ce soit. L'ancien écran reste donc figé, immobile, sans le moindre
 * signe — puis tout apparaît d'un coup.
 *
 * ⚠️ ET CE N'EST PAS QU'UNE AFFAIRE DE RESSENTI. Une frontière de chargement change deux choses à la
 * fois, et la seconde est la plus importante : Next peint la frontière IMMÉDIATEMENT au clic, et la
 * route redevient PRÉCHARGEABLE (une route dynamique sans `loading` ne l'est pas — la coque n'existe
 * pas, il n'y a rien à précharger d'avance). On gagne donc le retour au doigt ET du temps réel.
 *
 * ⚠️ SANS ANIMATION. La charte de l'attente est écrite (`render/surimpression.tsx`) : « SANS
 * animation cyclique — jamais trois points qui rebondissent ». Un squelette qui pulse est un spinner
 * déguisé. Trois blocs immobiles suffisent : ils occupent la place que le texte va prendre, et ils
 * ne réclament rien.
 *
 * ══ DEUX HALTES N'EN ONT PAS, ET C'EST DÉLIBÉRÉ ═════════════════════════════════════════════════
 *
 * `app/abonnement/` et `app/mes-donnees/` n'ont PAS de frontière de chargement, parce que deux
 * gardes ont refusé la mienne et qu'elles avaient raison :
 *
 *   • `tests/garde-commerciale.test.ts` exige que TOUT fichier d'une route commerciale monte
 *     `<GardeCommerciale>` (AD-9 : aucun paywall en détresse). Ses propres commentaires ferment
 *     nommément les « angles morts » et refusent les dérogations larges. Ajouter une exemption pour
 *     `loading.tsx` aurait ouvert exactement la porte que cette garde existe pour tenir fermée.
 *   • `tests/effacement-ecran.test.ts` (Story 6.7, AC3) interdit toute sous-route sous
 *     `/mes-donnees` : « une confirmation, sur le même écran, et pas une de plus ».
 *
 * On pouvait amender les deux — un squelette sans formulaire ni lien n'est ni une UI commerciale ni
 * un écran de confirmation. On ne l'a pas fait : élargir une garde de sécurité pour gagner un
 * squelette de chargement sur deux pages qu'on visite une fois par an est un mauvais échange.
 * Si un jour ces deux haltes deviennent lentes ET fréquentées, la conversation se rouvrira — avec
 * une garde de PROPRIÉTÉ (« un `loading.tsx` ne porte ni formulaire, ni lien, ni bouton »), jamais
 * avec une exemption par nom de fichier.
 *
 * `aria-hidden` : ce n'est pas du contenu, c'est un état transitoire. Un lecteur d'écran annonce
 * déjà la navigation ; lui faire lire trois blocs vides ajouterait du bruit, pas de l'information.
  *
 * ══ ET `/aide` — LE TROISIÈME CAS, TRANCHÉ LE 2026-08-25 (Story 8.2) ═══════════════════════════
 *
 * `app/aide/` n'avait NI frontière de chargement NI raison écrite de ne pas en avoir. Ce blanc-là
 * ne pouvait pas rester : `/aide` est la page qui doit marcher quand tout le reste est cassé
 * (AD-9, FR-077), et son cas s'arbitre.
 *
 * ⚠️ ELLE N'EN REÇOIT PAS, ET C'EST UNE DÉCISION. Un `loading.tsx` remplace le contenu par un
 * squelette le temps que le serveur réponde. Sur toutes les autres haltes c'est un progrès. Ici,
 * c'est le contraire de ce qu'on veut : les numéros joignables sont du contenu STATIQUE, rendus
 * sans aucune lecture de base — la page est déjà quasi instantanée, et un squelette n'ajouterait
 * qu'un clignotement entre le clic et des numéros qui étaient prêts.
 *
 * Et surtout : quelqu'un qui ouvre cette page peut être en train d'en avoir besoin tout de suite.
 * Un écran d'attente, si court soit-il, est un écran où il n'y a personne à appeler.
 */
export default function HalteEnAttente() {
  return (
    <main className={s.page} aria-hidden="true">
      <div className={s.contenu}>
        <div className={`${s.bloc} ${s.titre}`} />
        <div className={`${s.bloc} ${s.ligne}`} />
        <div className={`${s.bloc} ${s.ligneCourte}`} />
      </div>
    </main>
  );
}
