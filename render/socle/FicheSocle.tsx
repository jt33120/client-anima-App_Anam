import Link from "next/link";
import s from "./socle.module.css";
import type { FicheSocleVue, ReparationVue, TexteVue } from "./types";

/**
 * FicheSocle.tsx — LA HALTE « TON SOCLE » (Story 7.5). Rendu MUET (AD-7).
 *
 * Il dessine ce que `lib/domain/fiche-socle.ts` a décidé. Il ne dérive rien : ni une absence, ni sa
 * raison, ni un lien, ni le fait qu'un texte soit écrit ou non. Aucun `??` sur un texte de corpus,
 * aucune phrase fabriquée ici.
 *
 * ⚠️ AUCUN COMPTE, AUCUNE JAUGE, AUCUN TAUX (FR-031, DUR). Il n'y a pas de `length` affiché nulle
 * part dans ce fichier, et il ne peut pas y en avoir : le modèle de vue n'expose aucun champ où en
 * loger un. C'est structurel, pas disciplinaire.
 */

function Lien({ reparation }: { readonly reparation: ReparationVue | null }) {
  if (!reparation) return null;
  return (
    <Link className={s.reparation} href={reparation.url}>
      <span className="t-meta">{reparation.libelle}</span>
    </Link>
  );
}

/** Le texte d'Anima, ou son silence — jamais confondus (FR-054/FR-086). */
function TexteAnima({ texte, silence }: { readonly texte: TexteVue; readonly silence: string }) {
  if (texte.statut === "ecrit") return <p className={`t-anam ${s.texte}`}>{texte.texte}</p>;
  return <p className={`t-meta ${s.nonEcrit}`}>{silence}</p>;
}

export interface ProprietesFicheSocle {
  readonly fiche: FicheSocleVue;
  readonly copie: {
    readonly introduction: string;
    readonly titreNombres: string;
    readonly titreCiel: string;
    readonly titreAngles: string;
    readonly titreMaisons: string;
    readonly titreType: string;
    readonly titreManques: string;
    readonly sensDuCielNonEcrit: string;
    readonly typeSansTexte: string;
  };
}

export default function FicheSocle({ fiche, copie }: ProprietesFicheSocle) {
  const { nombres, ciel, type } = fiche;
  return (
    <>
      <p className={`t-corps ${s.introduction}`}>{copie.introduction}</p>

      {/* ── Les nombres — les SIX, avec leurs SIX textes. C'est FR-055, enfin tenu. ───────────── */}
      <section className={s.section} aria-labelledby="socle-nombres">
        <h2 id="socle-nombres" className={`t-titre-sm ${s.titreSection}`}>
          {copie.titreNombres}
        </h2>

        {nombres.indisponible && <p className={`t-corps ${s.panne}`}>{nombres.indisponible}</p>}

        <ul className={s.liste}>
          {nombres.nombres.map((n) => (
            <li key={n.cle} className={s.entree}>
              <p className={`t-meta ${s.etiquette}`}>{n.intitule}</p>
              <p className={`t-titre-sm ${s.valeur}`}>{n.valeur}</p>
              <TexteAnima texte={n.texte} silence="Anima n’a pas encore écrit ce nombre." />
            </li>
          ))}
        </ul>

        {/* ⚠️ UNE ABSENCE SE DIT (FR-050). Jamais un « — », jamais une ligne vide : les trois se
            ressemblent à l'écran et n'appellent pas les mêmes gestes. */}
        {nombres.manquants.map((m) => (
          <div key={m.cle} className={s.manque}>
            <p className={`t-meta ${s.etiquette}`}>{m.intitule}</p>
            <p className={`t-corps ${s.raison}`}>{m.raison}</p>
            <Lien reparation={m.reparation} />
          </div>
        ))}
      </section>

      {/* ── Le ciel — tout ce que le thème contient, plus jamais cinq corps. ──────────────────── */}
      <section className={s.section} aria-labelledby="socle-ciel">
        <h2 id="socle-ciel" className={`t-titre-sm ${s.titreSection}`}>
          {copie.titreCiel}
        </h2>

        {ciel.indisponible && <p className={`t-corps ${s.panne}`}>{ciel.indisponible}</p>}

        <ul className={s.liste}>
          {ciel.positions.map((p) => (
            <li key={p.cle} className={s.position}>
              <span className={`t-meta ${s.etiquette}`}>{p.intitule}</span>
              <span className={`t-corps ${s.valeur}`}>{p.valeur}</span>
              {p.maison && <span className={`t-meta ${s.maison}`}>{p.maison}</span>}
            </li>
          ))}
        </ul>

        {/* ⚠️ CE BLOC EST L'AVEU QUE LA 7.5 EXIGE PAR ÉCRIT : les faits sont là, le sens ne l'est
            pas. Sans lui, la page serait un tableau d'éphémérides muet — exactement ce que
            `lib/domain/cartes-socle.ts` a refusé de livrer. */}
        {ciel.positions.length > 0 && <p className={`t-meta ${s.nonEcrit}`}>{copie.sensDuCielNonEcrit}</p>}

        {ciel.angles.length > 0 && (
          <div className={s.sousSection}>
            <h3 className={`t-meta ${s.titreSousSection}`}>{copie.titreAngles}</h3>
            <ul className={s.liste}>
              {ciel.angles.map((a) => (
                <li key={a.intitule} className={s.position}>
                  <span className={`t-meta ${s.etiquette}`}>{a.intitule}</span>
                  <span className={`t-corps ${s.valeur}`}>{a.valeur}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ciel.cuspides.length > 0 && (
          <div className={s.sousSection}>
            <h3 className={`t-meta ${s.titreSousSection}`}>{copie.titreMaisons}</h3>
            <ul className={s.liste}>
              {ciel.cuspides.map((c) => (
                <li key={c.intitule} className={s.position}>
                  <span className={`t-meta ${s.etiquette}`}>{c.intitule}</span>
                  <span className={`t-corps ${s.valeur}`}>{c.valeur}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ciel.sansHeure && (
          <div className={s.manque}>
            <p className={`t-anam ${s.raison}`}>{ciel.sansHeure.aveu}</p>
            <p className={`t-corps ${s.raison}`}>{ciel.sansHeure.ouChercher}</p>
            <Lien reparation={ciel.sansHeure.reparation} />
          </div>
        )}

        {ciel.manques.length > 0 && (
          <div className={s.sousSection}>
            <h3 className={`t-meta ${s.titreSousSection}`}>{copie.titreManques}</h3>
            {ciel.manques.map((m) => (
              <div key={m.intitule} className={s.manque}>
                <p className={`t-meta ${s.etiquette}`}>{m.intitule}</p>
                <p className={`t-corps ${s.raison}`}>{m.raison}</p>
                <Lien reparation={m.reparation} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Le type. Sans lui, c'est le TEST qui manque — pas un texte d'Anima. ───────────────── */}
      <section className={s.section} aria-labelledby="socle-type">
        <h2 id="socle-type" className={`t-titre-sm ${s.titreSection}`}>
          {copie.titreType}
        </h2>
        {type.valeur && <p className={`t-titre-sm ${s.valeur}`}>{type.valeur}</p>}
        {type.texte && <TexteAnima texte={type.texte} silence={copie.typeSansTexte} />}
        {type.absence && (
          <div className={s.manque}>
            <p className={`t-corps ${s.raison}`}>{type.absence.phrase}</p>
            <Lien reparation={type.absence.reparation} />
          </div>
        )}
      </section>
    </>
  );
}
