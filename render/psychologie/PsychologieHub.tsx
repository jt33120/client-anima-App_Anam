"use client";

import Link, { useLinkStatus } from "next/link";
import s from "./psychologie.module.css";

/**
 * PsychologieHub.tsx — LES MODULES DE PSYCHOLOGIE, CÔTE À CÔTE.
 *
 * ⚠️ IL PORTAIT UNE PROPRIÉTÉ PAR MODULE, ET LA LISTE A DOUBLÉ (2026-09-03). Douze chaînes pour un
 * seul module disponible et deux vitrines : chaque module livré ajoutait sept propriétés, et
 * l'ordre des sections était écrit en dur dans le JSX. Le hub reçoit désormais une LISTE de modules
 * déjà résolus — la page décide de l'état et des mots, ce composant dessine.
 *
 * ⚠️ AUCUNE ÉTIQUETTE « DISPONIBLE » N'EST DÉCIDÉE ICI. Elle descend de la page, qui seule sait ce
 * que la base a répondu. Un composant qui déduirait « disponible » de la présence d'une URL
 * finirait par afficher une porte pour un module en panne de lecture.
 */

export interface ModuleVue {
  /** Sert d'`id` d'ancrage et de `key` : stable, jamais l'index. */
  readonly cle: string;
  readonly titre: string;
  readonly etiquette: string;
  /** Le glyphe de la vignette. Décoratif, `aria-hidden`. */
  readonly glyphe: string;
  readonly corps: string | null;
  /** La porte, ou `null` quand il n'y a rien à ouvrir (lecture impossible). */
  readonly porte: { readonly libelle: string; readonly href: string } | null;
  /** Un module ouvert se distingue à l'œil des sections d'explication. */
  readonly actif: boolean;
}

function Indicateur() {
  const { pending } = useLinkStatus();
  return <span className={`${s.indicateur} ${pending ? s.indicateurActif : ""}`} aria-hidden />;
}

function Porte({ href, children }: { readonly href: string; readonly children: string }) {
  return (
    <Link className={s.action} href={href}>
      <span className="t-bouton">{children}</span>
      <Indicateur />
    </Link>
  );
}

export default function PsychologieHub({
  introduction,
  modules,
  methode,
}: {
  readonly introduction: string;
  readonly modules: readonly ModuleVue[];
  readonly methode: { readonly titre: string; readonly corps: string };
}) {
  return (
    <>
      <p className={`t-corps ${s.introduction}`}>{introduction}</p>
      <div className={s.grille}>
        {modules.map((module) => (
          <section
            id={module.cle}
            key={module.cle}
            className={`${s.module} ${module.actif ? s.moduleActif : ""}`}
            aria-labelledby={`psy-${module.cle}`}
          >
            <span className={s.constellation} aria-hidden>
              {module.glyphe}
            </span>
            <p className={`t-meta ${s.etiquette}`}>{module.etiquette}</p>
            <h2 id={`psy-${module.cle}`} className="t-titre-sm">
              {module.titre}
            </h2>
            {module.corps && <p className={`t-corps ${s.corps}`}>{module.corps}</p>}
            {module.porte && <Porte href={module.porte.href}>{module.porte.libelle}</Porte>}
          </section>
        ))}

        <section className={`${s.module} ${s.methode}`} aria-labelledby="psy-methode">
          <span className={s.constellation} aria-hidden>
            ⌁
          </span>
          <h2 id="psy-methode" className="t-titre-sm">
            {methode.titre}
          </h2>
          <p className={`t-corps ${s.corps}`}>{methode.corps}</p>
        </section>
      </div>
    </>
  );
}
