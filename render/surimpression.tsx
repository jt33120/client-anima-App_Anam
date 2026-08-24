"use client";

/*
 * surimpression.tsx — La SURIMPRESSION PERSISTANTE (Story 1.8). Rendu MUET (AD-7) : il
 * CONSOMME le modèle `Surimpression` (lib/scene) et le dessine ; il ne décide RIEN — c'est
 * le modèle qui tranche *quoi* porter selon la région (règle légale FR-013 + sécurité AD-9).
 *
 * Présence flottante, SANS BORD ni fond barré : sa lisibilité tient au VOILE (même mécanisme
 * que .voile-seuil, orienté vers le bas), jamais à une barre. Porte, dans l'ordre : signe
 * d'Anam, mention IA, porte de secours. La porte de secours est TOUJOURS là ; le signe et la
 * mention n'apparaissent qu'en conversation. Aucune animation : le contenu change
 * INSTANTANÉMENT avec la région → jamais « dissous » au défilement (AC1/AC6).
 *
 * Tabulation (AC3) : rendue en TÊTE de la scène et hors de tout `inert` → la mention (si
 * présente) puis la porte de secours sont les tout premiers arrêts (au plus 2 pour « Aide »).
 */

import Link from "next/link";
import {
  URL_AIDE,
  URL_ABONNEMENT,
  URL_PROFIL,
  MENTION_IA,
  URL_TRANSPARENCE,
  type Surimpression,
} from "@/lib/scene";
import s from "./monde.module.css";

/**
 * Fragment abstrait tronc/branche — PLACEHOLDER du signe d'Anam (l'asset peint final viendra).
 * Décoratif (`aria-hidden`) : la transparence est portée par la mention IA (texte + lien), pas
 * par le glyphe. « Anam prépare » (Story 2.2, AC2) : le trait S'ÉPAISSIT (attribut statique piloté
 * par `prepare`), SANS animation cyclique — jamais trois points qui rebondissent.
 */
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

export default function Surimpression({
  modele,
  prepare = false,
}: {
  modele: Surimpression;
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

      {/* QA manuelle du 2026-08-19 — « on est lancé dans le grand bain, on comprend rien ». Le lieu
          se présentait une fois, à l'accueil, et nulle part on ne pouvait le RELIRE. Ce mot-ci est
          le seul chemin permanent vers cette relecture.

          ⚠️ AVANT « AIDE », JAMAIS À SA PLACE. « Aide » mène à des personnes, pas à une
          explication : ce sont deux besoins distincts, et les confondre les dessert tous les deux.
          L'ordre du DOM est aussi l'ordre de tabulation — la porte de secours ne cède sa place à
          rien, et reste le dernier arrêt (FR-077). */}
      {/* LE PROFIL (2026-08-23) — son nom, ses réglages, ses données, son abonnement. Il prend la
          place qu'occupait « Repères », parti dans la page d'aide sur décision produit : quatre
          liens flottants ne tiennent pas sur 390 px sans se toucher.

          ⚠️ AVANT « AIDE », TOUJOURS. L'ordre du DOM est l'ordre de tabulation, et la porte de
          secours ne cède sa place à rien (FR-077). */}
      {modele.cheminProfil && (
        <Link className={s.cheminProfil} href={URL_PROFIL}>
          <span className="t-meta">Profil</span>
        </Link>
      )}

      {/* Story 3.5 (FR-060) — LA SORTIE.
          ⚠️ JE L'AVAIS RETIRÉE, ET C'ÉTAIT AFFAIBLIR UN ENGAGEMENT EN SILENCE. En déplaçant
          l'abonnement dans le profil (2026-08-23), ce lien devenait un doublon — sauf que FR-060
          exige « aussi simple que la souscription », et qu'on souscrit en UNE carte, en pleine
          conversation. Passer par le profil ajoute un geste à la sortie et pas à l'entrée : c'est
          exactement l'asymétrie que la story interdit. Il reste donc là, et il n'apparaît que pour
          qui a quelque chose à résilier.
          Placé AVANT la porte de secours : « Aide » ne cède sa place à rien. */}
      {modele.cheminAbonnement && (
        <Link className={s.cheminAbonnement} href={URL_ABONNEMENT}>
          <span className="t-meta">L&rsquo;abonnement</span>
        </Link>
      )}

      {/* ⚠️ UN POINT D'INTERROGATION, PAS LE MOT « AIDE » (demandé le 2026-08-23) — et le mot reste
          SON NOM ACCESSIBLE. Le glyphe est décoratif (`aria-hidden`) ; `aria-label` porte « Aide »,
          pour que le lecteur d'écran, la recherche vocale et la tabulation trouvent exactement ce
          qu'ils trouvaient avant. Un pictogramme qui remplace un mot sans le rendre au nom
          accessible est la façon la plus courante de casser une porte de secours sans s'en
          apercevoir (FR-077).

          Ce n'est PAS un cercle, PAS un fond, PAS une couleur d'alerte : AD-9 veut que le filet
          rassure, pas qu'il alarme. Un « ? » dans la même graisse et la même teinte que le reste. */}
      <Link className={`${s.porteSecours} ${s.porteSecoursGlyphe}`} href={URL_AIDE} aria-label="Aide">
        <span className="t-meta" aria-hidden>
          ?
        </span>
      </Link>
    </div>
  );
}
