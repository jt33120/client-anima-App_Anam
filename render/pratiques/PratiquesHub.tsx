import Link from "next/link";
import type { PratiqueVue } from "./types";
import s from "./pratiques.module.css";

const INTENTIONS = {
  apaiser: "Revenir au calme",
  observer: "Prendre conscience",
  avancer: "Faire un petit pas",
  "se-connaitre": "Mieux me connaître",
} as const;

export default function PratiquesHub({ pratiques }: { readonly pratiques: readonly PratiqueVue[] }) {
  if (pratiques.length === 0) {
    return <p className="t-corps">Les pratiques ne sont pas disponibles pour le moment. Tu peux revenir à Anam.</p>;
  }
  return (
    <div className={s.catalogue}>
      <p className="t-corps"><Link className={s.lien} href="/parcours">Mon parcours</Link> pour retrouver le cap et les prochains pas proposés avec Anam.</p>
      <nav aria-label="Choisir une intention" className={s.intentions}>
        {Object.entries(INTENTIONS).filter(([id]) => pratiques.some((p) => p.intention === id)).map(([id, titre]) => (
          <a className={s.lien} key={id} href={`#${id}`}>{titre}</a>
        ))}
      </nav>
      {Object.entries(INTENTIONS).map(([intention, titre]) => {
        const groupe = pratiques.filter((p) => p.intention === intention);
        if (groupe.length === 0) return null;
        return (
          <section className={s.groupe} id={intention} key={intention} aria-labelledby={`titre-${intention}`}>
            <h2 className="t-titre-sm" id={`titre-${intention}`}>{titre}</h2>
            <ul className={s.liste}>
              {groupe.map((pratique) => (
                <li className={s.entree} key={pratique.id}>
                  <div className={s.texteEntree}>
                    <p className={`t-meta ${s.secondaire}`}>{pratique.type === "exercice" ? "Exercice guidé" : "Questionnaire"} · environ {pratique.dureeMinutes} min</p>
                    <h3 className="t-titre-sm"><Link href={pratique.href} className={s.titreLien}>{pratique.titre}</Link></h3>
                    <p className={`t-corps ${s.secondaire}`}>{pratique.description}</p>
                    {pratique.type === "questionnaire" && <p className={`t-meta ${s.secondaire}`}>{pratique.precaution}</p>}
                  </div>
                  <Link className={s.lien} href={pratique.href} aria-label={`Découvrir : ${pratique.titre}`}>Découvrir <span aria-hidden>→</span></Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <aside className={s.repere}>
        <h2 className="t-titre-sm">À ton rythme</h2>
        <p className={`t-corps ${s.secondaire}`}>Quelques minutes suffisent pour essayer. Tu peux garder les yeux ouverts, passer une étape ou t’arrêter. Aucun résultat n’est attendu.</p>
        <p className={`t-meta ${s.secondaire}`}>Ces pratiques de bien-être ne remplacent pas un accompagnement professionnel. Les sources et les limites sont indiquées dans chaque pratique.</p>
      </aside>
    </div>
  );
}
