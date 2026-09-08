"use client";

import Link from "next/link";
import BoutonLotus from "@/render/BoutonLotus";
import s from "@/render/parcours/parcours.module.css";

export default function ErreurParcours({ reset }: { readonly reset: () => void }) {
  return <main className={s.halte}>
    <h1 className="t-titre">Ton parcours n’a pas pu s’ouvrir</h1>
    <p className="t-corps">Tu peux réessayer dans un instant.</p>
    <BoutonLotus onClick={reset}>Réessayer</BoutonLotus>
    <a className={s.lien} href="/?de=anam">Revenir à Anam</a>
    <Link className={s.lien} href="/aide">Aide</Link>
  </main>;
}
