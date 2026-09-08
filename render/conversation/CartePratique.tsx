import Link from "next/link";
import type { PratiqueProposeeVue } from "./pratiques";
import s from "./carte-pratique.module.css";

export default function CartePratique({ pratique }: { readonly pratique: PratiqueProposeeVue }) {
  return (
    <aside className={s.carte} aria-label={`Pratique proposée : ${pratique.titre}`}>
      <p className="t-meta">{pratique.type === "exercice" ? "Une pratique pour toi" : "Pour mieux te connaître"} · Environ {pratique.dureeMinutes} min</p>
      <h2 className="t-titre-sm">{pratique.titre}</h2>
      <p className="t-corps">{pratique.description}</p>
      <Link href={`${pratique.href}?de=anam`} className={`${s.action} t-bouton`}>
        {pratique.type === "exercice" ? "Découvrir l’exercice" : "Explorer ces repères"}
      </Link>
      <p className="t-meta">Tu choisis si c’est le bon moment.</p>
    </aside>
  );
}
