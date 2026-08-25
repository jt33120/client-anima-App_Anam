import Link from "next/link";
import s from "./retour-scene.module.css";

/**
 * RetourScene — LE CHEMIN DE RETOUR EN TÊTE D'UNE HALTE (Story 7.13). Rendu MUET (AD-7).
 *
 * ══ POURQUOI EN HAUT, ET PAS DANS LE PIED ══════════════════════════════════════════════════════
 *
 * Il a d'abord été posé dans `PiedHalte`, et `tests/pied-halte.test.ts` l'a refusé — avec sa raison
 * écrite depuis la Story 6.9 : « le jour où quelqu'un y ajoutera un plan du site, des réseaux
 * sociaux ou un logo, la porte de secours cessera d'être ce qu'on trouve des yeux quand on ne va
 * pas bien ». Un lien de retour est exactement une chose de plus à regarder à côté d'elle.
 *
 * Et le haut est de toute façon la bonne place : un retour qu'on ne trouve qu'après avoir fait
 * défiler toute la page n'est pas un retour, c'est une récompense. `/aide` avait déjà tranché ainsi
 * le 2026-08-25.
 *
 * ⚠️ UN MOT ET UNE FLÈCHE, JAMAIS UN FIL D'ARIANE (FR-031, DUR). Ni « 3 écrans en arrière », ni
 * chemin de navigation, ni compteur : on ne compte rien à quelqu'un, pas même ses écrans.
 *
 * L'URL est calculée par le SERVEUR (`lib/scene/retour-scene.ts`) : ce composant ne décide rien et
 * ne lit aucun paramètre.
 */
export default function RetourScene({ url }: { readonly url: string }) {
  return (
    <Link className={s.retour} href={url}>
      <span className="t-meta">← Revenir</span>
    </Link>
  );
}
