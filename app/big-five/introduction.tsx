import {
  ANNONCE_DU_TEST_BIG_FIVE,
  INTRODUCTION_BIG_FIVE,
  LIMITE_BIG_FIVE,
} from "@/lib/domain/big-five-items";
import s from "@/render/psychologie/questionnaire.module.css";

/**
 * Présentation produit de l'inventaire.
 *
 * ⚠️ AUCUN REPÈRE DÉPLIABLE ICI, contrairement à l'ennéagramme — et c'est une décision, pas un
 * oubli. Les neuf repères de l'ennéagramme montrent les neuf TYPES : une personne peut se
 * reconnaître dans un type avant de répondre, et c'est utile. Les quinze textes du Big Five, eux,
 * décrivent des POSITIONS SUR UN AXE : les montrer avant, ce serait donner la grille de lecture à
 * quelqu'un qui va répondre, c'est-à-dire lui apprendre quoi cocher pour sortir « ouvert ».
 *
 * C'est la même règle que `itemsPourAffichageBigFive`, qui ne descend jamais le facteur d'un énoncé.
 *
 * Ce composant reste SERVEUR : il lit la copie et ne tient aucun état.
 */
export default function IntroductionBigFive() {
  return (
    <section className={s.introduction} aria-labelledby="comprendre-big-five">
      <h2 id="comprendre-big-five" className="t-titre-sm">
        Avant de commencer
      </h2>
      <p className="t-corps">{INTRODUCTION_BIG_FIVE}</p>
      <p className="t-corps">{LIMITE_BIG_FIVE}</p>
      <p className="t-corps">{ANNONCE_DU_TEST_BIG_FIVE}</p>
    </section>
  );
}
