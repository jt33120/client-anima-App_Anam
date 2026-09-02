import type { ItemBareme, NiveauReponse, TypeEnneagramme } from "./enneagramme";

/**
 * enneagramme-items.ts — LES DIX-HUIT QUESTIONS DU TEST COURT (Stories 5.5 et 13.8).
 *
 * ══ POURQUOI CES PHRASES NE SONT PAS DU CORPUS D'ANIMA ═══════════════════════════════════════════
 *
 * FR-054 réserve à Anima les INTERPRÉTATIONS — ce que le produit dit du sens d'un nombre, d'un
 * signe, d'un type. Une question de test n'interprète rien : elle demande la fréquence d'un geste
 * observable dans une situation précise. Le précédent est écrit :
 * D10 de la 5.3 range `MESSAGE_SANS_HEURE` et `PHRASE_INVITATION` dans `lib/domain/` pour cette
 * raison exacte.
 *
 * Conséquence pratique : ces dix-huit questions NE consomment PAS le budget d'écriture d'Anima.
 * Les neuf interprétations de types, elles, restent exclusivement dans le corpus.
 *
 * ══ LE REGISTRE, ET CE QU'IL INTERDIT ════════════════════════════════════════════════════════════
 *
 * Ces phrases tombent AUTOMATIQUEMENT sous le contrôle de voix bloquant, qui balaie `lib/` en
 * récursif. Deux formulations réflexes d'un questionnaire y sont mortes avant d'être écrites, et
 * c'est mesuré :
 *
 *     « Je m'inquiète de ce qui pourrait mal tourner. »  → refusé (revendication d'affect)
 *     « Ce n'est pas un diagnostic. »                     → refusé (lexique médical)
 *
 * La première parce que les motifs qui empêchent Anam de revendiquer un ressenti ne savent pas
 * distinguer sa voix de celle de l'utilisatrice ; la seconde parce que NFR-008 ne fait pas
 * d'exception pour les dénégations. Le réflexe — ajouter ce fichier aux exclusions du balayage — est
 * fermé : un test dédié exige que toute exclusion prouve qu'elle protège d'un vrai match, et la
 * revue 4.9 en a déjà retiré quatre.
 *
 * Donc : des SITUATIONS concrètes et des comportements observables, sans vocabulaire clinique,
 * sans futur et sans dénégation médicale. L'échelle demande une fréquence, jamais une adhésion à
 * un portrait psychologique abstrait.
 *
 * ══ L'ORDRE EST FIXE, ET LES TYPES SONT ENTRELACÉS ═══════════════════════════════════════════════
 *
 * Aucun mélange aléatoire : `Math.random` rendrait le test non reproductible, et l'AC1 exige le
 * déterminisme. Les deux questions d'un même type sont donc séparées par les huit autres — servies
 * groupées, elles rendraient le barème lisible à l'œil nu et pousseraient à répondre au personnage
 * plutôt qu'à soi.
 */

export interface ItemTest extends ItemBareme {
  readonly id: string;
  readonly type: TypeEnneagramme;
  readonly texte: string;
}

/**
 * DIX-HUIT QUESTIONS, DEUX PAR TYPE — décision Julian du 2026-08-13.
 *
 * « Court » est dans le titre de la story, et la charte visuelle interdit tout indicateur de
 * progression (barre, « question 3 sur 12 », points remplis) : un test long désoriente sans recours.
 * À l'autre bout, une seule question par type ne départage rien. Deux est le plus petit jeu qui
 * laisse apparaître un écart.
 */
export const ITEMS: readonly ItemTest[] = Object.freeze([
  { id: "e1a", type: 1, texte: "Un travail collectif vient de se terminer. À quelle fréquence reprends-tu les détails que les autres laisseraient passer ?" },
  { id: "e2a", type: 2, texte: "Quelqu’un traverse une semaine chargée. À quelle fréquence proposes-tu ton aide avant qu’on te la demande ?" },
  { id: "e3a", type: 3, texte: "Un objectif précis est fixé. À quelle fréquence organises-tu tes journées autour du résultat à atteindre ?" },
  { id: "e4a", type: 4, texte: "Tu choisis un vêtement, un objet ou un projet. À quelle fréquence cherches-tu ce qui ne ressemble pas au reste ?" },
  { id: "e5a", type: 5, texte: "Une discussion porte sur un sujet nouveau. À quelle fréquence écoutes-tu et rassembles-tu des informations avant de participer ?" },
  { id: "e6a", type: 6, texte: "Une décision importante approche. À quelle fréquence vérifies-tu les risques et prépares-tu une solution de secours ?" },
  { id: "e7a", type: 7, texte: "Un programme devient lourd ou répétitif. À quelle fréquence proposes-tu une autre activité ou une nouvelle option ?" },
  { id: "e8a", type: 8, texte: "Une décision te concerne directement. À quelle fréquence dis-tu clairement ce que tu refuses ?" },
  { id: "e9a", type: 9, texte: "Un désaccord monte dans un groupe. À quelle fréquence cherches-tu d’abord un terrain qui calme l’échange ?" },
  { id: "e1b", type: 1, texte: "Une règle a été convenue. À quelle fréquence la suis-tu même quand personne ne regarde ?" },
  { id: "e2b", type: 2, texte: "Un groupe doit faire un choix. À quelle fréquence t’occupes-tu d’abord de ce qui facilitera la vie des autres ?" },
  { id: "e3b", type: 3, texte: "Tu arrives dans un nouveau groupe. À quelle fréquence adaptes-tu la façon de présenter ce que tu fais ?" },
  { id: "e4b", type: 4, texte: "Tu racontes une expérience personnelle. À quelle fréquence choisis-tu les détails qui montrent ce qu’elle avait d’unique ?" },
  { id: "e5b", type: 5, texte: "Plusieurs personnes sollicitent ton attention. À quelle fréquence réserves-tu du temps seul avant de répondre ?" },
  { id: "e6b", type: 6, texte: "Tu rencontres une nouvelle personne. À quelle fréquence attends-tu des signes réguliers avant de lui faire pleinement confiance ?" },
  { id: "e7b", type: 7, texte: "Tu prépares un voyage ou un week-end. À quelle fréquence gardes-tu plusieurs possibilités ouvertes jusqu’au dernier moment ?" },
  { id: "e8b", type: 8, texte: "Quelqu’un est traité injustement devant toi. À quelle fréquence interviens-tu directement ?" },
  { id: "e9b", type: 9, texte: "Un groupe choisit l’horaire ou le lieu. À quelle fréquence laisses-tu les autres décider même si tu avais une préférence ?" },
] as const);

/**
 * Les libellés de l'échelle. Ils descendent du serveur avec les questions plutôt que d'être recopiés
 * dans un module de copie de rendu : `render/` ne peut importer ni `@/lib/domain` ni `@/lib/corpus`,
 * et la 5.3 a écrit la parade dans ses écarts — « recopier les textes aurait fabriqué une divergence
 * en attente ». Aucun chiffre n'est jamais montré (FR-031).
 */
export const LIBELLES_NIVEAU: Readonly<Record<NiveauReponse, string>> = Object.freeze({
  0: "Jamais ou presque",
  1: "Parfois",
  2: "Souvent",
  3: "Presque toujours",
});

/** Une absence d'avis explicite : elle parcourt la question mais n'ajoute aucun point. */
export const LIBELLE_INCONNU = "Je ne sais pas";

/** Ce qu'un énoncé montre à l'écran : son identité et sa phrase. */
export interface ItemAffiche {
  readonly id: string;
  readonly texte: string;
}

/**
 * ⚠️ LE TYPE NE DESCEND JAMAIS AVEC L'ÉNONCÉ, et ce n'est pas de l'économie de bande passante.
 *
 * Servir `{ id, texte, type }` publierait le barème dans le HTML : n'importe qui verrait quel type
 * chaque phrase pèse, et le saurait EN RÉPONDANT. Un test dont on voit la grille ne mesure plus rien
 * — il mesure ce qu'on veut être.
 *
 * C'est le même geste que l'AC7 dur de la 4.7 (le nom d'une branche ne transite jamais vers un
 * modèle) : ce qui n'a pas besoin de sortir ne sort pas.
 */
export function itemsPourAffichage(): readonly ItemAffiche[] {
  return Object.freeze(ITEMS.map(({ id, texte }) => Object.freeze({ id, texte })));
}

/**
 * Ce que l'écran dit quand Anima n'a pas encore écrit le texte d'un type (AC1).
 *
 * ⚠️ CE N'EST PAS UN TEXTE DE CORPUS, et la distinction est toute la story. Le corpus dit ce qu'un
 * type SIGNIFIE — c'est Anima qui l'écrit, elle seule (FR-054/FR-086). Cette phrase-ci dit
 * l'ÉTAT DU PRODUIT : le créneau existe, il est vide, et on le dit plutôt que de le combler. Elle
 * relève donc de la voix produit, comme `MESSAGE_SANS_HEURE` (5.3, décision D10).
 *
 * Le troisième état que `lib/corpus/port.ts` refuse d'exister — « texte par défaut » — serait
 * exactement ce qu'on fabriquerait en écrivant ici deux lignes sur ce qu'est un type 4.
 *
 * Aucun futur adressé (« tu le liras bientôt ») : ce serait une promesse que le code ne tient pas.
 */
export const MESSAGE_TYPE_SANS_TEXTE =
  "Anima n’a pas encore écrit ce qu’elle voit dans ce type. Son texte se posera ici.";

/**
 * ⚠️ CE MESSAGE EXISTE PARCE QUE LE PRODUIT ACCUSAIT ANIMA D'UN VIDE QUI N'ÉTAIT PAS LE SIEN
 * (retour de Julian, 2026-08-25 — Stories 7.5 et 7.8).
 *
 * Un compte qui n'a pas passé le test lisait « Anima n'a pas encore écrit cette carte ». Or les
 * NEUF textes de type SONT écrits (`lib/corpus/textes-de-base.ts`) : ce qui manque n'est pas le
 * texte, c'est le test. Le produit désignait donc un blocage chez quelqu'un d'autre là où il y
 * avait un geste à un clic — et personne ne pouvait le deviner.
 *
 * Julian l'a dit exactement : « c'est à toi de dire : vous n'avez pas encore fait votre
 * ennéagramme, faites-le maintenant. »
 *
 * ⚠️ UN SEUL ENDROIT POUR CETTE PHRASE. La halte du socle (7.5) et la carte de l'accueil (7.8) la
 * lisent toutes les deux ici. Deux formulations pour un même état, à deux fichiers d'écart, est
 * exactement le défaut que la 6.5b a payé sur les libellés de signes.
 *
 * Sans impératif — « fais le test » ferait de l'état une relance (`arbitrage-ouverture.ts`) — et
 * sans futur adressé : c'est le lien à côté qui dit où aller, pas la phrase.
 */
export const MESSAGE_TYPE_ABSENT =
  "Le test n’a pas encore été passé — c’est lui qui manque, pas le texte : les neuf types sont " +
  "écrits et t’attendent. Il est court, et tu peux t’arrêter en route.";

/** Où le passer. Constante unique — un test vérifie que la page existe. */
/**
 * ⚠️ L'ÉCRAN DÉMARRAIT SANS SE PRÉSENTER (Story 7.8, retour du 2026-08-25).
 *
 * `app/enneagramme/page.tsx` posait un `<h1>Ton type</h1>` puis affichait directement le premier
 * énoncé. On tombait sur une affirmation à noter sans savoir combien il y en avait, ni si on
 * pouvait s'arrêter, ni ce qu'on allait en obtenir.
 *
 * Or NFR-017 — « aucune session expirée n'interrompt, on reprend où l'on s'est arrêté » — est tenu
 * par le code DEPUIS LA 5.5 : les réponses sont sauvegardées à mesure, et la `key` de tentative
 * remonte l'arbre proprement. Ce n'a simplement jamais été DIT à l'écran. Une garantie qu'on ne
 * connaît pas ne rassure personne : elle ne sert qu'à celui qui a lu le code.
 *
 * ⚠️ ET AUCUN INDICATEUR DE PROGRESSION. « Court » remplace la barre — c'est la décision de la 5.5
 * (`ITEMS`), et elle tient : un compteur « 4 / 18 » transforme une lecture de soi en formulaire à
 * finir, et FR-031 refuse les jauges partout ailleurs dans le produit.
 */
export const ANNONCE_DU_TEST =
  "C’est court. Pour chaque situation, indique ce qui t’arrive le plus souvent. Tu peux répondre « Je ne sais " +
  "pas » : cette réponse reste inconnue et ne vaut jamais zéro. Tu peux aussi t’arrêter et reprendre " +
  "plus tard : ce que tu as posé reste là.";

export const INTRODUCTION_ENNEAGRAMME =
  "L’ennéagramme est une grille de lecture qui regroupe neuf manières récurrentes de porter son " +
  "attention, de décider et de réagir. Ici, il se fonde uniquement sur tes réponses à des " +
  "situations concrètes du quotidien.";

export const LIMITE_ENNEAGRAMME =
  "Le résultat reste une hypothèse : ce questionnaire exploratoire ne prouve pas qui tu es et peut " +
  "ne retenir aucun type.";

export const URL_PASSER_LE_TEST: { readonly libelle: string; readonly url: string } = Object.freeze({
  libelle: "Le test d’ennéagramme",
  url: "/enneagramme",
});

/**
 * ⚠️ LES NEUF REPÈRES NE S'EMPILENT PLUS DANS LA PAGE (retour du fondateur, 2026-09-02 : « les
 * tiroirs sont un peu longs. Moins de scroll, plus de pop-up, une app plus dynamique »).
 *
 * L'introduction rendait, avant « Commencer », un tiroir qui contenait neuf tiroirs : une colonne
 * entière à faire défiler avant la première situation. Les neuf textes vivent désormais dans une
 * FEUILLE (`render/Feuille.tsx`, le patron de `render/menu/MenuCompte.tsx`) qu'un seul bouton
 * ouvre ; la page redevient courte : trois paragraphes, une porte, « Commencer ».
 *
 * Trois libellés de voix PRODUIT, ici et nulle part ailleurs : le bouton qui ouvre, le titre de la
 * feuille, le bouton qui ferme. Aucun n'interprète un type (FR-054) ; « Type 1 » à « Type 9 »
 * restent sans nom, les nommer relève de la voix d'Anima (FR-086, story à part). Des infinitifs,
 * jamais un impératif : une porte se nomme, elle ne commande pas (`arbitrage-ouverture.ts`).
 *
 * `tests/rendu/reperes-enneagramme.test.tsx` refuse que l'une de ces chaînes soit réécrite en dur
 * dans `app/` ou `render/` : deux formulations pour un même geste, à deux fichiers d'écart, est le
 * défaut que la 6.5b a payé.
 */
export const LIBELLE_OUVRIR_REPERES = "Voir les neuf repères";
export const TITRE_FEUILLE_REPERES = "Les neuf repères";
export const LIBELLE_FERMER_REPERES = "Fermer";
