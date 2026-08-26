"use client";

import Link, { useLinkStatus } from "next/link";
import s from "./psychologie.module.css";

export interface EtatEnneagrammeVue {
  readonly statut: "a-faire" | "en-cours" | "connu" | "indisponible";
  readonly detail: string | null;
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
  enneagramme,
  copie,
}: {
  readonly enneagramme: EtatEnneagrammeVue;
  readonly copie: {
    readonly introduction: string;
    readonly titreEnneagramme: string;
    readonly absenceEnneagramme: string;
    readonly enCoursEnneagramme: string;
    readonly indisponibleEnneagramme: string;
    readonly actionEnneagramme: string;
    readonly reprendreEnneagramme: string;
    readonly voirEnneagramme: string;
    readonly titreBigFive: string;
    readonly corpsBigFive: string;
    readonly titreHumanDesign: string;
    readonly corpsHumanDesign: string;
    readonly titreMethode: string;
    readonly corpsMethode: string;
  };
}) {
  const texteEnneagramme =
    enneagramme.statut === "a-faire"
      ? copie.absenceEnneagramme
      : enneagramme.statut === "en-cours"
        ? copie.enCoursEnneagramme
      : enneagramme.statut === "indisponible"
        ? copie.indisponibleEnneagramme
        : enneagramme.detail;

  return (
    <>
      <p className={`t-corps ${s.introduction}`}>{copie.introduction}</p>
      <div className={s.grille}>
        <section className={`${s.module} ${s.moduleActif}`} aria-labelledby="psy-enneagramme">
          <span className={s.constellation} aria-hidden>✦</span>
          <p className={`t-meta ${s.etiquette}`}>Disponible</p>
          <h2 id="psy-enneagramme" className="t-titre-sm">{copie.titreEnneagramme}</h2>
          {texteEnneagramme && <p className={`t-corps ${s.corps}`}>{texteEnneagramme}</p>}
          {enneagramme.statut !== "indisponible" && (
            <Porte href="/enneagramme">
              {enneagramme.statut === "a-faire"
                ? copie.actionEnneagramme
                : enneagramme.statut === "en-cours"
                  ? copie.reprendreEnneagramme
                  : copie.voirEnneagramme}
            </Porte>
          )}
        </section>

        <section className={s.module} aria-labelledby="psy-big-five">
          <span className={s.constellation} aria-hidden>✧</span>
          <p className={`t-meta ${s.etiquette}`}>Méthode à valider</p>
          <h2 id="psy-big-five" className="t-titre-sm">{copie.titreBigFive}</h2>
          <p className={`t-corps ${s.corps}`}>{copie.corpsBigFive}</p>
        </section>

        <section id="human-design" className={s.module} aria-labelledby="psy-human-design">
          <span className={s.constellation} aria-hidden>◇</span>
          <p className={`t-meta ${s.etiquette}`}>Moteur à construire</p>
          <h2 id="psy-human-design" className="t-titre-sm">{copie.titreHumanDesign}</h2>
          <p className={`t-corps ${s.corps}`}>{copie.corpsHumanDesign}</p>
        </section>

        <section className={`${s.module} ${s.methode}`} aria-labelledby="psy-methode">
          <span className={s.constellation} aria-hidden>⌁</span>
          <h2 id="psy-methode" className="t-titre-sm">{copie.titreMethode}</h2>
          <p className={`t-corps ${s.corps}`}>{copie.corpsMethode}</p>
        </section>
      </div>
    </>
  );
}
