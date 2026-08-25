"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import s from "./menu-compte.module.css";

/**
 * MenuCompte.tsx — LE GLYPHE ET LA FEUILLE (Story 7.3). Rendu MUET (AD-7).
 *
 * ══ CE QU'IL REMPLACE, ET POURQUOI CE N'ÉTAIT PAS TENABLE ═══════════════════════════════════════
 *
 * Trois mots flottaient dans la surimpression — « Profil », « L'abonnement », « ? » — et chacun
 * portait `margin-left: auto`. En flexbox, plusieurs marges automatiques se PARTAGENT l'espace
 * libre : « Profil » atterrissait à x = 143→191 sur 390 px, c'est-à-dire au **centre horizontal de
 * l'écran**. Personne ne voit ça en relisant une feuille de style ; ça se mesure.
 *
 * `EXPERIENCE.md` ligne 84 spécifie depuis le 2026-07-21 « un unique glyphe de menu à droite », et
 * la ligne 86 la feuille qui s'ouvre par-dessus. Ce composant est cette feuille.
 *
 * ⚠️ LE GLYPHE EST UNE SILHOUETTE, PAS TROIS BARRES — demandé le 2026-08-25 : « il devrait être en
 * haut à droite, avec un icon de profil ». `EXPERIENCE.md` dit « glyphe de menu » sans trancher
 * lequel ; une silhouette dit « ton compte » là où trois barres disent « d'autres pages ». Même
 * grammaire de trait que le signe d'Anam : aucun fond, aucun cercle plein, aucune couleur d'accent.
 *
 * ══ ⚠️ CE COMPOSANT NE PORTE PAS LA PORTE DE SECOURS, ET IL NE DOIT JAMAIS LA PORTER ════════════
 *
 * FR-077 exige une entrée vers les ressources « toujours présente ET INDÉPENDANTE du menu de
 * compte » (`EXPERIENCE.md` lignes 151, 216, 429). « Aide et ressources » est la PREMIÈRE entrée de
 * la feuille — **en plus** du « ? » de la surimpression, **jamais à la place**. Un menu qui
 * absorberait la porte de secours la rendrait dépendante d'un état d'ouverture, donc perdable au
 * pire moment. Le « ? » est rendu par `render/surimpression.tsx`, hors de ce fichier, et il reste
 * le dernier arrêt de tabulation.
 *
 * ══ PROFONDEUR MODALE : UN NIVEAU, JAMAIS DEUX (`EXPERIENCE.md` ligne 87) ═══════════════════════
 *
 * La feuille ne contient que des liens. Aucun bouton n'y ouvre quoi que ce soit —
 * `tests/rendu/menu-compte-rendu.test.tsx` le vérifie en refusant tout `aria-haspopup` à l'intérieur.
 */

export interface EntreeMenuVue {
  readonly titre: string;
  readonly quoi: string;
  readonly url: string;
}

/**
 * L'INDICE D'ATTENTE (Story 8.2 · retour du 2026-08-25 : « quand je clique sur profil, rien ne se
 * passe et d'un coup, quelques secondes après, la page s'ouvre »).
 *
 * ⚠️ IL EST SUR LES LIENS, PAS SUR LE GLYPHE, et c'est un écart assumé avec la rédaction de la
 * story. Elle demandait `useLinkStatus()` sur le glyphe — mais le glyphe n'est pas un `<Link>` : il
 * ouvre une feuille, instantanément, il n'y a aucune attente à indiquer. L'attente est APRÈS, quand
 * on touche une entrée. `useLinkStatus` ne se lit d'ailleurs que depuis un enfant de `<Link>`
 * (`next/dist/docs/…/use-link-status.md`) : le poser sur un bouton ne compilerait rien d'utile.
 *
 * Grammaire de `.signeAnamPrepare` : une propriété qui change, à sens unique. Jamais un tourniquet,
 * jamais trois points qui rebondissent (`EXPERIENCE.md` ligne 200).
 */
function IndiceAttente() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`${s.indice} ${pending ? s.indiceActif : ""}`} />;
}

function GlypheCompte() {
  return (
    <svg className={s.glypheDessin} viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19.5 C5.5 15.9 8.4 14 12 14 C15.6 14 18.5 15.9 18.5 19.5" />
    </svg>
  );
}

export interface ProprietesMenuCompte {
  readonly entrees: readonly EntreeMenuVue[];
  /** Le nom accessible du glyphe. Le glyphe lui-même est décoratif. */
  readonly libelleGlyphe: string;
  readonly titreFeuille: string;
  readonly libelleFermer: string;
}

export default function MenuCompte({
  entrees,
  libelleGlyphe,
  titreFeuille,
  libelleFermer,
}: ProprietesMenuCompte) {
  const [ouvert, setOuvert] = useState(false);
  const glyphe = useRef<HTMLButtonElement>(null);
  const feuille = useRef<HTMLDivElement>(null);
  const idFeuille = useId();
  const idTitre = useId();

  const fermer = useCallback(() => {
    setOuvert(false);
    // ⚠️ LE FOCUS REVIENT AU GLYPHE (`EXPERIENCE.md` ligne 216). Sans ça, fermer la feuille au
    // clavier renvoie le focus au `<body>` : la tabulation suivante repart du tout début de la
    // page, et quelqu'un qui navigue au clavier perd sa place sans comprendre pourquoi.
    glyphe.current?.focus();
  }, []);

  useEffect(() => {
    if (!ouvert) return;
    // ⚠️ LE FOCUS VA SUR LA FEUILLE ELLE-MÊME, PAS SUR SON PREMIER LIEN. C'est le patron ARIA d'un
    // dialogue (APG) : le lecteur d'écran annonce alors le TITRE et le rôle avant la première
    // entrée. Viser le premier élément focusable aurait posé le focus sur « Fermer » — qui précède
    // la liste dans le DOM — donc annoncé « Fermer » comme première chose entendue à l'ouverture
    // d'un menu. La feuille porte `tabIndex={-1}` pour être focalisable sans entrer dans l'ordre
    // de tabulation.
    feuille.current?.focus();

    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fermer();
        return;
      }
      if (e.key !== "Tab") return;
      // ⚠️ PIÈGE À FOCUS VOLONTAIRE, ET BORNÉ. Tant que la feuille est ouverte, la tabulation n'en
      // sort pas (`EXPERIENCE.md` ligne 216) — sinon on tabule « derrière » un panneau visible,
      // ce qui est le défaut d'accessibilité le plus courant des feuilles modales. Elle en sort par
      // Échap ou par le bouton de fermeture, jamais par accident.
      const focusables = [...(feuille.current?.querySelectorAll<HTMLElement>("a, button") ?? [])];
      if (focusables.length === 0) return;
      const premierF = focusables[0];
      const dernierF = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === premierF) {
        e.preventDefault();
        dernierF.focus();
      } else if (!e.shiftKey && document.activeElement === dernierF) {
        e.preventDefault();
        premierF.focus();
      }
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [ouvert, fermer]);

  /**
   * ⚠️ LE GLISSEMENT ENTRE RÉGIONS S'ARRÊTE À LA FEUILLE, ET AUCUN TEST UNITAIRE NE LE VERRAIT.
   *
   * `render/scene-dom.tsx` pose `onPointerDown/Move/Up` sur `<main>` pour passer d'une région à
   * l'autre au doigt. Sans ces trois barrages, parcourir la feuille au doigt ferait glisser la
   * scène DERRIÈRE elle : on referme le menu et on n'est plus au même endroit, sans avoir rien
   * demandé. Le défaut ne se voit qu'avec un vrai doigt sur un vrai écran.
   */
  const stopper = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <>
      <button
        ref={glyphe}
        type="button"
        className={s.glyphe}
        aria-label={libelleGlyphe}
        aria-expanded={ouvert}
        aria-haspopup="dialog"
        aria-controls={ouvert ? idFeuille : undefined}
        onClick={() => setOuvert((o) => !o)}
      >
        <GlypheCompte />
      </button>

      {ouvert && (
        <>
          {/* Le fond. Il ferme au toucher — un panneau qu'on ne peut fermer qu'en visant un petit
              bouton est un panneau dont on se sent prisonnier. Décoratif : la fermeture accessible
              passe par Échap et par le bouton nommé ci-dessous. */}
          <div className={s.fond} aria-hidden onClick={fermer} onPointerDown={stopper} />

          <div
            ref={feuille}
            id={idFeuille}
            className={s.feuille}
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitre}
            tabIndex={-1}
            onPointerDown={stopper}
            onPointerMove={stopper}
            onPointerUp={stopper}
          >
            <div className={s.enTete}>
              <h2 id={idTitre} className={`t-titre-sm ${s.titre}`}>
                {titreFeuille}
              </h2>
              <button type="button" className={s.fermer} onClick={fermer}>
                <span className="t-meta">{libelleFermer}</span>
              </button>
            </div>

            <ul className={s.liste}>
              {entrees.map((e) => (
                <li key={e.url}>
                  <Link className={s.entree} href={e.url}>
                    <span className={`t-corps ${s.entreeTitre}`}>{e.titre}</span>
                    <span className={`t-meta ${s.entreeQuoi}`}>{e.quoi}</span>
                    <IndiceAttente />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
