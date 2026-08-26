"use client";

/*
 * surimpression.tsx — La SURIMPRESSION PERSISTANTE (Story 1.8). Rendu MUET (AD-7) : il
 * CONSOMME le modèle `Surimpression` (lib/scene) et le dessine ; il ne décide RIEN — c'est
 * le modèle qui tranche *quoi* porter selon la région (règle légale FR-013 + sécurité AD-9).
 *
 * Présence flottante, SANS BORD ni fond barré : sa lisibilité tient au VOILE (même mécanisme
 * que .voile-seuil, orienté vers le bas), jamais à une barre. Porte, dans l'ordre : signe
 * d'Anam, mention IA, puis le GROUPE DE DROITE — l'abonnement (si abonnée), le glyphe de compte,
 * et la porte de secours en dernier. La porte de secours est TOUJOURS là ; le signe et la mention
 * n'apparaissent qu'en conversation. Aucune animation : le contenu change INSTANTANÉMENT avec la
 * région → jamais « dissous » au défilement (AC1/AC6).
 *
 * Tabulation (AC3) : rendue en TÊTE de la scène et hors de tout `inert` → ses liens sont les tout
 * premiers arrêts de la page, et la porte de secours est le DERNIER de la surimpression.
 *
 * ⚠️ « AU PLUS 2 ARRÊTS POUR AIDE » A ÉTÉ RETIRÉ DE CET EN-TÊTE (2026-08-25), PARCE QUE C'ÉTAIT
 * FAUX. En conversation, pour une abonnée, la mention IA puis « L'abonnement » précédaient déjà la
 * porte de secours : trois arrêts, pas deux, et le chiffre traînait ici depuis la Story 1.8. Ce que
 * FR-077 protège n'est pas une DISTANCE, c'est une GARANTIE : la porte est toujours présente,
 * toujours au même endroit, indépendante de toute détection et du menu de compte, et elle reste le
 * dernier arrêt. C'est ce qu'`e2e/clavier.spec.ts` vérifie, et c'est ce qui compte.
 */

import Link, { useLinkStatus } from "next/link";
import {
  URL_AIDE,
  URL_ABONNEMENT,
  MENTION_IA,
  URL_TRANSPARENCE,
  type Surimpression,
} from "@/lib/scene";
import MenuCompte, { type GroupeMenuVue } from "./menu/MenuCompte";
import s from "./monde.module.css";

/**
 * Fragment abstrait tronc/branche — PLACEHOLDER du signe d'Anam (l'asset peint final viendra).
 * Décoratif (`aria-hidden`) : la transparence est portée par la mention IA (texte + lien), pas
 * par le glyphe. « Anam prépare » (Story 2.2, AC2) : le trait S'ÉPAISSIT (attribut statique piloté
 * par `prepare`), SANS animation cyclique — jamais trois points qui rebondissent.
 */
/**
 * L'INDICE D'ATTENTE (Story 8.2 · retour du 2026-08-25 : « rien ne se passe et d'un coup, quelques
 * secondes après, la page s'ouvre »).
 *
 * ⚠️ IL SE LIT DEPUIS UN ENFANT DE `<Link>`, ET NULLE PART AILLEURS. `useLinkStatus` est un hook de
 * contexte : posé sur un bouton ou en dehors, il rend `pending: false` pour toujours et l'indice ne
 * paraît jamais — un défaut parfaitement silencieux (`next/dist/docs/…/use-link-status.md`).
 *
 * Jamais un tourniquet, jamais trois points qui rebondissent (`EXPERIENCE.md` ligne 200) : un filet
 * qui s'allume, grammaire de `.signeAnamPrepare`.
 */
function IndiceAttente() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`${s.indiceAttente} ${pending ? s.indiceAttenteActif : ""}`} />;
}

function SigneAnam({ prepare }: { prepare: boolean }) {
  return (
    <svg
      className={`${s.signeAnam} ${prepare ? s.signeAnamPrepare : ""}`}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path d="M12 22 V7" />
      <path d="M12 12.5 L7 8.5" />
      <path d="M12 14.5 L17 9.5" />
    </svg>
  );
}

export interface CopieMenu {
  readonly groupes: readonly GroupeMenuVue[];
  readonly libelleGlyphe: string;
  readonly titreFeuille: string;
  readonly libelleFermer: string;
}

export default function Surimpression({
  modele,
  menu,
  lienVers,
  prepare = false,
}: {
  modele: Surimpression;
  /**
   * Fabrique l'URL d'une entrée de menu en EMPORTANT la région courante (Story 7.13).
   *
   * ⚠️ ELLE VIENT DE LA SCÈNE, PAS D'ICI ET PAS DE LA PAGE. La page ne connaît pas la région
   * affichée — c'est un état de scène, qui change au doigt sans navigation. Ce composant ne la
   * connaît pas davantage. Seule `scene-dom` la tient.
   */
  lienVers: (url: string) => string;
  /** La copie du menu de compte — elle DESCEND du domaine, le rendu n'y touche pas (AD-7/AD-10). */
  menu: CopieMenu;
  prepare?: boolean;
}) {
  return (
    <div className={s.surimpression}>
      {/* Le voile : dense là où flotte le texte, se dissout vers le bas. Pas une bande. */}
      <div className={s.surimpressionVoile} aria-hidden />

      {modele.signeAnam && <SigneAnam prepare={prepare} />}

      {modele.mentionIA && (
        <Link className={s.mentionIa} href={URL_TRANSPARENCE}>
          <span className="t-meta">{MENTION_IA}</span>
        </Link>
      )}

      {/* ⚠️ UN SEUL GROUPE À DROITE, ET UNE SEULE MARGE AUTOMATIQUE (Story 7.3, 2026-08-25).
          Avant : « Profil », « L'abonnement » et le « ? » portaient CHACUN `margin-left: auto`.
          Flexbox PARTAGE l'espace libre entre les marges automatiques — « Profil » atterrissait à
          x = 143→191 sur 390 px, c'est-à-dire au centre horizontal de l'écran. La marge vit
          désormais sur `.groupeDroite`, une fois, et elle pousse le groupe entier au bord quels que
          soient les éléments qui le composent ce jour-là. */}
      <div className={s.groupeDroite}>
        {/* Story 3.5 (FR-060) — LA SORTIE.
            ⚠️ JE L'AVAIS RETIRÉE, ET C'ÉTAIT AFFAIBLIR UN ENGAGEMENT EN SILENCE. En déplaçant
            l'abonnement dans le profil (2026-08-23), ce lien devenait un doublon — sauf que FR-060
            exige « aussi simple que la souscription », et qu'on souscrit en UNE carte, en pleine
            conversation. Passer par le menu ajoute un geste à la sortie et pas à l'entrée : c'est
            exactement l'asymétrie que la story interdit. Il reste donc là, EN PLUS de l'entrée de
            menu — même figure que la porte de secours. */}
        {modele.cheminAbonnement && (
          <Link className={s.cheminAbonnement} href={URL_ABONNEMENT}>
            <span className="t-meta">L&rsquo;abonnement</span>
            <IndiceAttente />
          </Link>
        )}

        {/* LE MENU DE COMPTE (Story 7.3) — `EXPERIENCE.md` ligne 84 le spécifiait depuis le
            2026-07-21. Il remplace le mot « Profil », qui flottait au centre de l'écran. */}
        {modele.menuCompte && (
          <MenuCompte
            groupes={menu.groupes}
            lienVers={lienVers}
            libelleGlyphe={menu.libelleGlyphe}
            titreFeuille={menu.titreFeuille}
            libelleFermer={menu.libelleFermer}
          />
        )}

        {/* ⚠️ RENDU ICI, HORS DU COMPOSANT DE MENU, ET C'EST UN REFUS TENU. FR-077 exige une entrée
            vers les ressources « toujours présente ET INDÉPENDANTE du menu de compte »
            (`EXPERIENCE.md` lignes 151, 216, 429). « Aide et ressources » est la PREMIÈRE entrée de
            la feuille — EN PLUS de ce « ? », JAMAIS à sa place. Un menu qui absorberait la porte de
            secours la rendrait dépendante d'un état d'ouverture, donc perdable au pire moment. Elle
            reste aussi le DERNIER arrêt de tabulation : elle ne cède sa place à rien.

            ⚠️ UN POINT D'INTERROGATION, PAS LE MOT « AIDE » (demandé le 2026-08-23) — et le mot
            reste SON NOM ACCESSIBLE. Le glyphe est décoratif (`aria-hidden`) ; `aria-label` porte
            « Aide », pour que le lecteur d'écran, la recherche vocale et la tabulation trouvent
            exactement ce qu'ils trouvaient avant.

            ⚠️ ET C'EST UN ÉCART ÉCRIT AVEC `EXPERIENCE.md` LIGNE 151, qui exige « un mot simple —
            Aide » et « jamais d'icône ». L'écart a été demandé le 2026-08-23 et il est TENU, pas
            corrigé : sur 390 px, trois libellés flottants se touchaient. Il est daté ici et dans
            l'amendement du 2026-08-25 plutôt que laissé implicite — et il ne coûte rien au nom
            accessible, qui est ce que la règle protège réellement.

            Ce n'est PAS un cercle plein, PAS un fond, PAS une couleur d'alerte : AD-9 veut que le
            filet rassure, pas qu'il alarme. */}
        <Link className={`${s.porteSecours} ${s.porteSecoursGlyphe}`} href={URL_AIDE} aria-label="Aide">
          <span className="t-meta" aria-hidden>
            ?
          </span>
          <IndiceAttente />
        </Link>
      </div>
    </div>
  );
}
