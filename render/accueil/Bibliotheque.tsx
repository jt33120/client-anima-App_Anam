"use client";

import Link, { useLinkStatus } from "next/link";
import GlypheUnivers from "@/render/GlypheUnivers";
import type { BibliothequeVue, CarteVue, UniversVue } from "./types";
import s from "./accueil.module.css";

/**
 * Bibliotheque.tsx — LA RÉGION D'ACCUEIL (Story 5.6, T7).
 *
 * Le rendu ne décide RIEN (AD-7) : l'ordre lui arrive déjà fait, la carte mise en avant lui arrive
 * déjà désignée. Il n'y a ici ni tri, ni filtre, ni règle — les mettre reviendrait à donner au
 * rendu le pouvoir que `lib/domain/bibliotheque.ts` lui retire exprès.
 *
 * ⚠️ AUCUN BADGE, AUCUN COMPTEUR, AUCUN CADENAS — et il n'y a rien à retenir pour ça : les types de
 * `./types.ts` n'ont aucun champ où en écrire un, et une carte indisponible n'est jamais construite
 * côté serveur. Le seul chemin de fuite qui resterait serait un compte fabriqué ICI (« 3 cartes »,
 * « 2 nouvelles ») ou glissé dans un `aria-label` — c'est ce que garde
 * `tests/rendu/bibliotheque.test.tsx`.
 */

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export interface ProprietesBibliotheque {
  readonly bibliotheque: BibliothequeVue;
}

export default function Bibliotheque({ bibliotheque }: ProprietesBibliotheque) {
  const { cartes, jour, univers } = bibliotheque;
  const date = `${jour.j} ${MOIS[jour.m - 1]}`;
  const mantra = cartes.find((carte) => carte.cle === "mantra");
  const ciel = cartes.find((carte) => carte.cle === "horoscope");

  return (
    <div className={s.bibliotheque}>
      {/* ⚠️ « CE QUE LE JOUR PROPOSE », PAS « AUJOURD’HUI » (2026-09-02, décision D7). La région
          entière s'appelle « Aujourd’hui » depuis le retour du fondateur du 2026-09-01
          (`lib/scene/regions.ts`). Ce h2 disait le même mot, quelques lignes sous le h1 : un lecteur
          d'écran aurait annoncé deux régions homonymes, et l'œil lu deux titres pour une seule chose.
          La formule est celle du mode d'emploi (`lib/domain/copie-reperes.ts`) : elle dit ce qu'il y a
          dessous, sans redire où l'on est. L'id `moi-aujourdhui` reste : un ancrage n'est pas un
          texte, et le changer casserait des liens pour rien. `tests/rendu/bibliotheque.test.tsx`
          refuse qu'un second « Aujourd’hui » réapparaisse ici. */}
      <section className={s.quotidien} aria-labelledby="moi-aujourdhui">
        <div className={s.enteteQuotidien}>
          <p className={`t-meta ${s.jour}`}>{date}</p>
          <h2 id="moi-aujourdhui" className={`t-titre-sm ${s.titreQuotidien}`}>Ce que le jour propose</h2>
        </div>
        <div className={s.cartesQuotidiennes}>
          {ciel && <Carte carte={ciel} enAvant />}
          {mantra && <Carte carte={mantra} enAvant={false} />}
        </div>
      </section>

      <div className={s.transitionUnivers} aria-hidden><span /></div>

      <section className={s.univers} aria-labelledby="moi-univers">
        <div className={s.enteteUnivers}>
          <p className={`t-meta ${s.surtitreUnivers}`}>Ce qui te compose</p>
          <h2 id="moi-univers" className="t-titre">Tes univers</h2>
          <p className={`t-corps ${s.introUnivers}`}>Ils ne changent pas tous les jours. Ils restent ici, à leur place.</p>
        </div>
        <ul className={s.grilleUnivers}>
          {univers.map((univers) => <PorteUnivers key={univers.cle} univers={univers} />)}
        </ul>
      </section>
    </div>
  );
}

function IndicateurLien() {
  const { pending } = useLinkStatus();
  return <span className={`${s.indicateurLien} ${pending ? s.indicateurLienActif : ""}`} aria-hidden />;
}

function PorteUnivers({ univers }: { readonly univers: UniversVue }) {
  return (
    <li className={s.itemUnivers}>
      <article className={s.porteUnivers}>
        <Link className={s.lienUnivers} href={univers.url}>
          <span className={s.eclat} aria-hidden />
          <span className={s.glyphe}><GlypheUnivers cle={univers.cle} /></span>
          <span className={s.texteUnivers}>
            <span className={`t-titre-sm ${s.nomUnivers}`}>{univers.titre}</span>
            <span className={`t-meta ${s.accrocheUnivers}`}>{univers.accroche}</span>
          </span>
          <span className={s.fleche} aria-hidden>→</span>
          <IndicateurLien />
        </Link>
        {/* L'action d'une porte arrive DÉJÀ décidée par `lib/domain/univers-moi.ts` : le test
            d'ennéagramme sous Psychologie, l'heure de naissance sous Astrologie (E3-S5, 2026-09-02).
            Le rendu ne sait pas laquelle il dessine, et c'est voulu : il n'a rien à décider, donc
            rien à dire de l'état du compte (ni un mot sur ce qui manque, ni un compte, FR-031). */}
        {univers.action && (
          <Link className={s.actionUnivers} href={univers.action.url}>
            <span className="t-bouton">{univers.action.libelle}</span>
            <IndicateurLien />
          </Link>
        )}
      </article>
    </li>
  );
}

function Carte({ carte, enAvant }: { carte: CarteVue; enAvant: boolean }) {
  return (
    <article className={`${s.carte} ${enAvant ? s.enAvant : ""}`} aria-labelledby={`carte-${carte.cle}`}>
      {/* ⚠️ UNE SEULE VOIX DE TITRE PAR ÉCRAN (QA visuelle du 2026-08-19). `t-corps-fort` est de
          l'INTERFACE (Inter) : il mettait « Le mantra du jour » et « Ton ciel du jour » dans une
          grasse sans-serif à trois centimètres de « Tes nombres » en Fraunces — deux familles de
          titre sur le même écran. Un titre de carte est du CONTENU : il parle avec la voix d'Anam.
          La mise en avant reste distinguée par ce qui l'ANNONCE, comme le dit le commentaire plus
          bas, pas par un changement de police. */}
      <h2 id={`carte-${carte.cle}`} className="t-titre-sm">
        {carte.titre}
      </h2>

      {/* La mise en avant est ANNONCÉE, pas seulement plus grande : sans ça, la seule différence
          serait visuelle, et l'information n'existerait pas pour qui n'y a pas accès. */}
      {enAvant && <p className={`t-meta ${s.mention}`}>Mise en avant aujourd&rsquo;hui</p>}

      {carte.faits.length > 0 && (
        <dl className={s.faits}>
          {carte.faits.map((f) => (
            <div key={f.intitule} className={s.fait}>
              <dt className="t-meta">{f.intitule}</dt>
              <dd className="t-corps">{f.valeur}</dd>
            </div>
          ))}
        </dl>
      )}

      {/*
        L'ABSENCE, DITE HONNÊTEMENT (AC5).

        ⚠️ CE COMMENTAIRE ANNONÇAIT « 165 CRÉNEAUX ET AUCUN ÉCRIT ». C'était faux, et la même phrase
        a coûté une demi-journée le 2026-08-25 dans `lib/corpus/README.md` : une enquête l'a lue et a
        déclaré bloqué un chantier faisable. L'état réel est CALCULÉ par `tests/corpus-etat.test.ts`
        et vit là, nulle part ailleurs. Ce qui reste vrai ici, c'est qu'un créneau vide est un état
        NORMAL du produit, pas un cas dégradé rare. Trois refus tiennent cette phrase :
          — pas de « bientôt » ni de compte à rebours (FR-057 : on ne teaser pas ce qu'on n'a pas) ;
          — pas d'excuse, et surtout pas de repli fabriqué : seule Anima peut écrire ces textes
            (FR-054 + FR-086), et une phrase de remplacement serait une citation inventée attribuée
            à une personne réelle ;
          — pas de silence : une carte vide sans explication se lit comme une panne.
      */}
      {/* ⚠️ L'ÉTAT DU PRODUIT PASSE AVANT, ET IL REMPLACE LE SILENCE D'ANIMA (Story 7.8).
          Quand le produit a quelque chose à dire sur son propre état — « le test n'a pas encore
          été passé » — c'est CELA qu'il faut lire, pas « Anima n'a rien écrit », qui était faux et
          accusait quelqu'un d'un vide qui n'était pas le sien.

          Rendu en `t-corps`, JAMAIS en `t-anam` : ce ne sont pas ses mots (FR-054/FR-086). */}
      {carte.etat !== null ? (
        <p className={`t-corps ${s.etatProduit}`}>{carte.etat}</p>
      ) : carte.texte.statut === "ecrit" ? (
        <p className="t-anam">{carte.texte.texte}</p>
      ) : (
        <p className={`t-meta ${s.nonEcrit}`}>
          {carte.faits.length > 0
            ? "Anima n’a pas encore écrit ce texte."
            : "Anima n’a pas encore écrit cette carte."}
        </p>
      )}
    </article>
  );
}
