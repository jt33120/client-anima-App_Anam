import Link from "next/link";
import s from "./carte-pratique.module.css";

/** This receipt is rendered only after the server confirms persistence and the stream ends. */
export default function CarteParcours({ action }: { readonly action: "ajuster" | "avancer" }) {
  return (
    <aside className={s.carte} aria-label="Parcours enregistré">
      <h2 className="t-titre-sm">{action === "ajuster" ? "Ton cap et la suite" : "Un passage reconnu"}</h2>
      <p className="t-corps">{action === "ajuster"
        ? "Retrouve tes prochains pas. Nous pouvons les ajuster ensemble."
        : "Ce passage reste dans ton parcours, avec ce que tu souhaites explorer ensuite."}</p>
      <Link href="/parcours?de=anam" className={`${s.action} t-bouton`}>Voir mon parcours</Link>
      {action === "avancer" ? <a href="/?de=arbre" className={`${s.secondaire} t-bouton`}>Voir mon arbre</a> : null}
    </aside>
  );
}
