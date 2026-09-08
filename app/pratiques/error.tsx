"use client";

import Link from "next/link";
import BoutonLotus from "@/render/BoutonLotus";
import s from "@/render/pratiques/pratiques.module.css";

export default function ErreurPratiques({ reset }: { readonly reset: () => void }) {
  return <main className={s.halte}>
    <h1 className="t-titre">Les pratiques n’ont pas pu s’ouvrir</h1>
    <p className="t-corps">Tu peux réessayer dans un instant.</p>
    <BoutonLotus onClick={reset}>Réessayer</BoutonLotus>
    <Link className={s.lien} href="/">Revenir à Anam</Link>
    <Link className={s.lien} href="/aide">Aide</Link>
  </main>;
}
