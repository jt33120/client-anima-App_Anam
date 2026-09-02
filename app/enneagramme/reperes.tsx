"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { RepereEnneagramme } from "@/lib/corpus/enneagramme";
import Feuille from "@/render/Feuille";
import s from "./enneagramme.module.css";

/**
 * reperes.tsx : LA PORTE ET LA FEUILLE DES NEUF REPÈRES (retour du fondateur, 2026-09-02).
 *
 * « Les tiroirs sont un peu longs. Moins de scroll, plus de pop-up, une app plus dynamique. »
 *
 * Avant : un `<details>` « Voir les neuf repères » dans la page, contenant neuf `<details>`, chacun
 * dépliant un texte du corpus. Neuf tiroirs ouverts, c'est une colonne entière à faire défiler
 * avant « Commencer ». Maintenant : UN bouton, qui ouvre une feuille (`render/Feuille.tsx`, le
 * patron de `MenuCompte`) ; la page d'introduction ne porte plus que trois paragraphes et la porte.
 *
 * ══ UN ACCORDÉON EXCLUSIF, PAS DES ONGLETS ══════════════════════════════════════════════════════
 *
 * Dans la feuille, les neuf repères restent des `<details>`, mais ils partagent un `name` : c'est
 * l'accordéon exclusif natif (HTML), UN SEUL texte ouvert à la fois, sans une ligne de JavaScript
 * et sans la machinerie ARIA d'onglets (`tablist`, flèches, `tabpanel`) que neuf onglets de 44 px
 * ne feraient de toute façon pas tenir sur 390 px. Neuf résumés fermés tiennent dans la feuille
 * sans défiler ; ouvrir le suivant referme le précédent.
 *
 * ⚠️ « TYPE 1 » À « TYPE 9 », ET RIEN D'AUTRE. Aucun nom de type n'existe dans le produit : les
 * nommer relève de la voix d'Anima (FR-086), c'est une story à part. Les textes, eux, viennent
 * EXCLUSIVEMENT du corpus (`reperesPourIntroduction`, FR-054) et arrivent en propriétés depuis le
 * composant serveur `introduction.tsx` ; ce fichier n'en écrit aucun, et n'écrit aucun libellé.
 *
 * ══ PROFONDEUR MODALE : UN NIVEAU, JAMAIS DEUX (`EXPERIENCE.md` ligne 87) ═══════════════════════
 *
 * L'introduction n'est pas une modale : la feuille est le premier et le seul niveau. Rien dedans
 * n'ouvre quoi que ce soit ; `tests/rendu/reperes-enneagramme.test.tsx` refuse tout
 * `aria-haspopup` à l'intérieur.
 */

export interface LibellesReperes {
  readonly ouvrir: string;
  readonly titre: string;
  readonly fermer: string;
}

export default function ReperesEnneagramme({
  reperes,
  libelles,
}: {
  readonly reperes: readonly RepereEnneagramme[];
  readonly libelles: LibellesReperes;
}) {
  const [ouvert, setOuvert] = useState(false);
  const declencheur = useRef<HTMLButtonElement>(null);
  const idFeuille = useId();
  const fermer = useCallback(() => setOuvert(false), []);

  return (
    <>
      <button
        ref={declencheur}
        type="button"
        className={s.ouvrirReperes}
        aria-expanded={ouvert}
        aria-haspopup="dialog"
        aria-controls={ouvert ? idFeuille : undefined}
        onClick={() => setOuvert(true)}
      >
        <span className="t-bouton">{libelles.ouvrir}</span>
      </button>

      {ouvert && (
        <Feuille
          id={idFeuille}
          titre={libelles.titre}
          libelleFermer={libelles.fermer}
          declencheur={declencheur}
          onFermer={fermer}
        >
          <ul className={s.listeReperes}>
            {reperes.map((repere) => (
              <li key={repere.type}>
                <details className={s.repere} name="repere-enneagramme">
                  <summary className={`${s.nomRepere} t-bouton`}>Type {repere.type}</summary>
                  <p className="t-anam">{repere.texte}</p>
                </details>
              </li>
            ))}
          </ul>
        </Feuille>
      )}
    </>
  );
}
