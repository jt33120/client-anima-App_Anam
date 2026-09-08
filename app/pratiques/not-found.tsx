import Link from "next/link";
import s from "@/render/pratiques/pratiques.module.css";

export default function PratiqueIntrouvable() {
  return <main className={s.halte}>
    <h1 className="t-titre">Cette pratique n’est pas disponible</h1>
    <Link className={s.lien} href="/pratiques">Voir les pratiques</Link>
    <Link className={s.lien} href="/aide">Aide</Link>
  </main>;
}
