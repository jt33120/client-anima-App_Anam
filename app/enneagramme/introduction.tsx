import { reperesPourIntroduction } from "@/lib/corpus/enneagramme";
import {
  ANNONCE_DU_TEST,
  INTRODUCTION_ENNEAGRAMME,
  LIMITE_ENNEAGRAMME,
} from "@/lib/domain/enneagramme-items";
import s from "./enneagramme.module.css";

/** Présentation produit ; les neuf explications viennent exclusivement du corpus Anima. */
export default function IntroductionEnneagramme() {
  const reperes = reperesPourIntroduction();

  return (
    <section className={s.introduction} aria-labelledby="comprendre-enneagramme">
      <h2 id="comprendre-enneagramme" className="t-titre-sm">
        Avant de commencer
      </h2>
      <p className="t-corps">{INTRODUCTION_ENNEAGRAMME}</p>
      <p className="t-corps">{LIMITE_ENNEAGRAMME}</p>
      <p className="t-corps">{ANNONCE_DU_TEST}</p>

      <details className={s.reperes}>
        <summary className="t-bouton">Voir les neuf repères</summary>
        <ul className={s.listeReperes}>
          {reperes.map((repere) => (
            <li key={repere.type}>
              <details className={s.repere}>
                <summary className={`${s.nomRepere} t-bouton`}>Type {repere.type}</summary>
                <p className="t-anam">{repere.texte}</p>
              </details>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
