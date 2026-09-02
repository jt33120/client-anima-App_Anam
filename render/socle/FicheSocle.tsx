import Link from "next/link";
import GlypheUnivers from "@/render/GlypheUnivers";
import s from "./socle.module.css";
import type {
  ApercuUniversVue,
  FaitVue,
  FicheSocleVue,
  ReparationVue,
  SectionCielVue,
  SectionNombresVue,
} from "./types";

function Lien({ reparation }: { readonly reparation: ReparationVue | null }) {
  if (!reparation) return null;
  return (
    <Link className={s.reparation} href={reparation.url}>
      <span className="t-meta">{reparation.libelle}</span>
    </Link>
  );
}

function Faits({ faits }: { readonly faits: readonly FaitVue[] }) {
  if (faits.length === 0) return null;
  return (
    <dl className={s.faits}>
      {faits.map((fait) => (
        <div key={`${fait.intitule}-${fait.valeur}`} className={s.fait}>
          <dt className="t-meta">{fait.intitule}</dt>
          <dd className="t-corps">{fait.valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

function PorteApercu({ apercu }: { readonly apercu: ApercuUniversVue }) {
  return (
    <li className={s.itemApercu}>
      <Link className={s.porteApercu} href={apercu.url}>
        <span className={s.glypheApercu}>
          <GlypheUnivers cle={apercu.cle} />
        </span>
        <span className={s.contenuApercu}>
          <span className={`t-titre-sm ${s.titreApercu}`}>{apercu.titre}</span>
          <span className={`t-meta ${s.accrocheApercu}`}>{apercu.accroche}</span>
          <Faits faits={apercu.faits} />
          <span className={`t-bouton ${s.actionApercu}`}>Voir le détail <span aria-hidden>→</span></span>
        </span>
      </Link>
    </li>
  );
}

function ApercuSocle({ fiche, titre }: { readonly fiche: FicheSocleVue; readonly titre: string }) {
  return (
    <section className={s.apercu} aria-labelledby="socle-apercu">
      <div className={s.enteteSection}>
        <p className={`t-meta ${s.surtitre}`}>Ce qui te compose</p>
        <h2 id="socle-apercu" className="t-titre">{titre}</h2>
      </div>
      <ul className={s.grilleApercus}>
        {fiche.apercus.map((apercu) => <PorteApercu key={apercu.cle} apercu={apercu} />)}
      </ul>
    </section>
  );
}

const REPERES_ANGULAIRES = Object.freeze([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]);

function CarteNatale({ ciel }: { readonly ciel: SectionCielVue }) {
  if (!ciel.projection) return null;
  return (
    <figure className={s.figureCiel}>
      <div className={s.carteCiel}>
        <svg
          className={s.svgCiel}
          viewBox="0 0 320 320"
          role="img"
          aria-labelledby="carte-natale-titre carte-natale-description"
        >
          <title id="carte-natale-titre">{ciel.projection.titre}</title>
          <desc id="carte-natale-description">{ciel.projection.description}</desc>
          <circle className={s.haloCiel} cx="160" cy="160" r="145" />
          <circle className={s.anneauFort} cx="160" cy="160" r="128" />
          <circle className={s.anneau} cx="160" cy="160" r="102" />
          <circle className={s.anneauInterieur} cx="160" cy="160" r="52" />
          <text className={`t-meta ${s.graduationCiel}`} x="160" y="28" textAnchor="middle">0°</text>
          <text className={`t-meta ${s.graduationCiel}`} x="292" y="164" textAnchor="middle">90°</text>
          <text className={`t-meta ${s.graduationCiel}`} x="160" y="302" textAnchor="middle">180°</text>
          <text className={`t-meta ${s.graduationCiel}`} x="28" y="164" textAnchor="middle">270°</text>
          {REPERES_ANGULAIRES.map((angle) => (
            <line
              key={`repere-${angle}`}
              className={s.repereAngulaire}
              x1="160"
              y1="32"
              x2="160"
              y2="58"
              transform={`rotate(${angle} 160 160)`}
            />
          ))}
          {ciel.cuspides.map((cuspide) => cuspide.projection && (
            <line
              key={cuspide.intitule}
              className={s.cuspideCiel}
              x1="160"
              y1="58"
              x2="160"
              y2="83"
              transform={`rotate(${cuspide.projection} 160 160)`}
            />
          ))}
          {ciel.angles.map((angle) => angle.projection && (
            <line
              key={angle.intitule}
              className={s.angleCiel}
              x1="160"
              y1="45"
              x2="160"
              y2="275"
              transform={`rotate(${angle.projection} 160 160)`}
            />
          ))}
          {ciel.positions.map((position) => position.projection && (
            <g key={position.cle} transform={`rotate(${position.projection} 160 160)`}>
              <circle className={s.pointCiel} cx="160" cy="58" r="5" />
            </g>
          ))}
          <circle className={s.coeurCiel} cx="160" cy="160" r="9" />
        </svg>
      </div>
      <figcaption className={`t-meta ${s.legendeCiel}`}>
        <span>{ciel.projection.repere}</span>
        <span>Source de calcul : {ciel.projection.source}</span>
      </figcaption>
    </figure>
  );
}

function SectionNumerologie({
  nombres,
  copie,
}: {
  readonly nombres: SectionNombresVue;
  readonly copie: ProprietesFicheSocle["copie"];
}) {
  return (
    <section className={`${s.section} ${s.sectionNombres}`} aria-labelledby="socle-nombres">
      <div className={s.enteteSection}>
        <p className={`t-meta ${s.surtitre}`}>Calcul déterministe</p>
        <h2 id="socle-nombres" className="t-titre">{copie.titreNombres}</h2>
      </div>

      {nombres.indisponible && <p className={`t-corps ${s.panne}`}>{nombres.indisponible}</p>}

      {nombres.entrees.length > 0 && (
        <div className={s.blocInformation} aria-labelledby="socle-entrees-numerologie">
          <h3 id="socle-entrees-numerologie" className="t-titre-sm">{copie.titreEntreesNumerologie}</h3>
          <Faits faits={nombres.entrees} />
        </div>
      )}

      {nombres.conventions.length > 0 && (
        <details className={s.devoilement}>
          <summary className="t-corps">{copie.titreMethodeNumerologie}</summary>
          <ul className={s.listeMethode}>
            {nombres.conventions.map((convention) => <li key={convention} className="t-meta">{convention}</li>)}
          </ul>
        </details>
      )}

      <ul className={s.grilleNombres}>
        {nombres.nombres.map((nombre) => (
          <li key={nombre.cle} className={s.entree}>
            <p className={`t-meta ${s.etiquette}`}>{nombre.intitule}</p>
            <p className={`t-display ${s.nombreFort}`}>{nombre.valeur}</p>
            {/* ⚠️ LA PREUVE REMONTE AU-DESSUS DU PLI (retour du 2026-08-30 : « numérologie plus
                concret, moins dans l'interprétation, plus factuel »).

                Elle était DÉJÀ calculée et DÉJÀ affichée — mais derrière un `<details>` fermé. Un
                nombre seul en `t-display`, avec son calcul replié et la lecture symbolique juste
                en dessous, se lit comme un VERDICT : la seule chose visible sans geste était la
                valeur, et la seule chose qu'on avait envie d'ouvrir était l'interprétation.
                Personne ne clique sur « Voir le calcul » pour vérifier un nombre qu'on lui
                annonce ; on clique sur ce qui promet de parler de soi.

                La dernière ligne de la trace est celle qui PROUVE le résultat — « Total : 6 + 6 + 1
                = 13 → 4 », ou « Valeurs : … = 83 → 11 ». Elle passe donc en clair, collée au
                nombre. Le pas-à-pas complet reste sous le pli : ce qui était caché n'est plus la
                preuve, c'est son détail.

                ⚠️ LE `<details>` RESTE, ET IL DOIT RESTER. `tests/rendu/fiche-socle.test.tsx`
                exige un `details[class*='calcul']` dont le texte contient « Voir le calcul » : le
                supprimer au motif que la preuve est désormais visible ferait rougir la garde. */}
            {nombre.calcul.length > 0 && (
              <>
                <p className={`t-meta ${s.preuveCalcul}`}>{nombre.calcul[nombre.calcul.length - 1]}</p>
                <details className={s.calcul}>
                  <summary className="t-meta">Voir le calcul</summary>
                  <ul>
                    {nombre.calcul.map((ligne) => <li key={ligne} className="t-meta">{ligne}</li>)}
                  </ul>
                </details>
              </>
            )}
          </li>
        ))}
      </ul>

      {nombres.manquants.map((manque) => (
        <div key={manque.cle} className={s.manque}>
          <p className={`t-meta ${s.etiquette}`}>{manque.intitule}</p>
          <p className={`t-corps ${s.raison}`}>{manque.raison}</p>
          <Lien reparation={manque.reparation} />
        </div>
      ))}

      {nombres.lecturesSymboliques.length > 0 ? (
        <details className={`${s.devoilement} ${s.lectureSymbolique}`}>
          <summary className="t-titre-sm">{copie.titreLectureNumerologie}</summary>
          <div className={s.contenuLecture}>
            {nombres.lecturesSymboliques.map((lecture) => (
              <article key={lecture.cle} className={s.lectureEcrite}>
                {/* L'intitulé arrive du domaine AVEC son nombre — « Chemin de vie (7) » — pour
                    répondre au texte qui commence par « Ton chemin de vie 7 symbolise… » (retour
                    du 2026-09-02). Le rendu ne recompose rien : il ne décide pas (AD-7). */}
                <h3 className={`t-meta ${s.etiquette}`}>{lecture.intitule}</h3>
                <p className={`t-anam ${s.texte}`}>{lecture.texte}</p>
              </article>
            ))}
            {nombres.noteLectureSymbolique && (
              <p className={`t-meta ${s.noteCorpus}`}>{nombres.noteLectureSymbolique}</p>
            )}
          </div>
        </details>
      ) : nombres.noteLectureSymbolique ? (
        <div className={`${s.lectureSymbolique} ${s.lectureVide}`} aria-labelledby="socle-lecture-numerologie">
          <h3 id="socle-lecture-numerologie" className="t-titre-sm">{copie.titreLectureNumerologie}</h3>
          <p className={`t-meta ${s.noteCorpus}`}>{nombres.noteLectureSymbolique}</p>
        </div>
      ) : null}
    </section>
  );
}

function PositionTextuelle({
  position,
}: {
  readonly position: SectionCielVue["positions"][number] | SectionCielVue["angles"][number];
}) {
  return (
    <li className={s.position}>
      <span className={`t-meta ${s.etiquette}`}>{position.intitule}</span>
      <span className={`t-corps ${s.valeur}`}>{position.valeur}</span>
      {"maison" in position && position.maison && <span className={`t-meta ${s.maison}`}>{position.maison}</span>}
      {position.longitude && <span className={`t-meta ${s.longitude}`}>Longitude : {position.longitude}</span>}
    </li>
  );
}

function SectionAstrologie({
  ciel,
  copie,
}: {
  readonly ciel: SectionCielVue;
  readonly copie: ProprietesFicheSocle["copie"];
}) {
  return (
    <section className={`${s.section} ${s.sectionCiel}`} aria-labelledby="socle-ciel">
      <div className={s.enteteSection}>
        <p className={`t-meta ${s.surtitre}`}>Projection de naissance</p>
        <h2 id="socle-ciel" className="t-titre">{copie.titreCiel}</h2>
      </div>

      {ciel.indisponible && <p className={`t-corps ${s.panne}`}>{ciel.indisponible}</p>}
      <CarteNatale ciel={ciel} />

      {ciel.positions.length > 0 && (
        <div className={s.equivalentTextuel} aria-labelledby="socle-positions-texte">
          <h3 id="socle-positions-texte" className="t-titre-sm">Les positions, en texte</h3>
          <ul className={s.listePositions}>
            {ciel.positions.map((position) => <PositionTextuelle key={position.cle} position={position} />)}
          </ul>
        </div>
      )}

      {ciel.positions.length > 0 && <p className={`t-meta ${s.noteCorpus}`}>{copie.sensDuCielNonEcrit}</p>}

      {ciel.angles.length > 0 && (
        <div className={s.sousSection}>
          <h3 className="t-titre-sm">{copie.titreAngles}</h3>
          <ul className={s.listePositions}>
            {ciel.angles.map((angle) => <PositionTextuelle key={angle.intitule} position={angle} />)}
          </ul>
        </div>
      )}

      {ciel.cuspides.length > 0 && (
        <details className={s.devoilement}>
          <summary className="t-corps">{copie.titreMaisons}</summary>
          <ul className={s.listePositions}>
            {ciel.cuspides.map((cuspide) => (
              <li key={cuspide.intitule} className={s.position}>
                <span className={`t-meta ${s.etiquette}`}>{cuspide.intitule}</span>
                <span className={`t-corps ${s.valeur}`}>{cuspide.valeur}</span>
                {cuspide.longitude && <span className={`t-meta ${s.longitude}`}>Longitude : {cuspide.longitude}</span>}
              </li>
            ))}
          </ul>
        </details>
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
          <h3 className="t-titre-sm">{copie.titreManques}</h3>
          {ciel.manques.map((manque) => (
            <div key={manque.intitule} className={s.manque}>
              <p className={`t-meta ${s.etiquette}`}>{manque.intitule}</p>
              <p className={`t-corps ${s.raison}`}>{manque.raison}</p>
              <Lien reparation={manque.reparation} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export interface ProprietesFicheSocle {
  readonly fiche: FicheSocleVue;
  readonly mode?: "tout" | "astrologie" | "numerologie";
  readonly copie: {
    readonly introduction: string;
    readonly titreApercu: string;
    readonly titreNombres: string;
    readonly titreEntreesNumerologie: string;
    readonly titreMethodeNumerologie: string;
    readonly titreLectureNumerologie: string;
    readonly titreCiel: string;
    readonly titreAngles: string;
    readonly titreMaisons: string;
    readonly titreType: string;
    readonly titreManques: string;
    readonly titrePortes: string;
    readonly sensDuCielNonEcrit: string;
    readonly typeSansTexte: string;
  };
}

export default function FicheSocle({ fiche, copie, mode = "tout" }: ProprietesFicheSocle) {
  const { nombres, ciel, portes } = fiche;
  return (
    <>
      <p className={`t-corps ${s.introduction}`}>{copie.introduction}</p>

      {mode === "tout" && <ApercuSocle fiche={fiche} titre={copie.titreApercu} />}
      {mode === "numerologie" && <SectionNumerologie nombres={nombres} copie={copie} />}
      {mode === "astrologie" && <SectionAstrologie ciel={ciel} copie={copie} />}

      {mode === "tout" && (
        <section className={`${s.section} ${s.portes}`} aria-labelledby="socle-portes">
          <div className={s.enteteSection}>
            <p className={`t-meta ${s.surtitre}`}>Tes données restent à toi</p>
            <h2 id="socle-portes" className="t-titre-sm">{copie.titrePortes}</h2>
          </div>
          <ul className={s.listePortes}>
            {portes.map((porte) => (
              <li key={porte.url} className={s.porte}>
                <Link className={s.reparation} href={porte.url}>
                  <span className="t-corps">{porte.titre}</span>
                </Link>
                <p className={`t-meta ${s.etiquette}`}>{porte.quoi}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
