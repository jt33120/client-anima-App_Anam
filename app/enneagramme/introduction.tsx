import { reperesPourIntroduction } from "@/lib/corpus/enneagramme";
import {
  ANNONCE_DU_TEST,
  INTRODUCTION_ENNEAGRAMME,
  LIBELLE_FERMER_REPERES,
  LIBELLE_OUVRIR_REPERES,
  LIMITE_ENNEAGRAMME,
  TITRE_FEUILLE_REPERES,
} from "@/lib/domain/enneagramme-items";
import ReperesEnneagramme from "./reperes";
import s from "@/render/psychologie/questionnaire.module.css";

/**
 * Présentation produit ; les neuf explications viennent exclusivement du corpus Anima.
 *
 * ⚠️ LES NEUF REPÈRES NE SONT PLUS DANS LA PAGE (retour du fondateur, 2026-09-02 : « les tiroirs
 * sont un peu longs. Moins de scroll, plus de pop-up »). Un tiroir de neuf tiroirs faisait défiler
 * une colonne entière avant « Commencer ». Ils vivent dans une feuille, ouverte d'un bouton
 * (`./reperes.tsx`), et la page tient sans défiler : trois paragraphes, une porte, « Commencer ».
 *
 * Ce composant reste SERVEUR : il lit le corpus et la copie, et passe tout en propriétés au
 * composant client qui tient l'état d'ouverture. Aucun libellé n'est écrit ici : ils vivent dans
 * `lib/domain/enneagramme-items.ts`, sous le contrôle de voix.
 */
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

      <ReperesEnneagramme
        reperes={reperes}
        libelles={{
          ouvrir: LIBELLE_OUVRIR_REPERES,
          titre: TITRE_FEUILLE_REPERES,
          fermer: LIBELLE_FERMER_REPERES,
        }}
      />
    </section>
  );
}
