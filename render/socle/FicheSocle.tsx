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

      {/* ══ LA LECTURE SYMBOLIQUE EST REMONTÉE EN TÊTE (2026-09-03) ═══════════════════════════

          « Déplace la lecture symbolique en haut de la page, avec le début apparent et « … » pour
          lire la totalité, mais au moins donne un avant-goût. »

          Elle vivait tout en bas, derrière un pli qui ne montrait que son titre : il fallait
          traverser six nombres et leurs preuves pour découvrir qu'il y avait quelque chose à lire,
          et rien ne le promettait. L'aperçu est ce qui fait la différence entre un titre et une
          invitation.

          ⚠️ L'APERÇU EST DANS LE `<summary>`, et il disparaît à l'ouverture (CSS). Le laisser
          visible ferait lire deux fois le même début, à trois lignes d'intervalle. */}
      {nombres.lecturesSymboliques.length > 0 ? (
        <details className={`${s.devoilement} ${s.lectureSymbolique}`}>
          <summary className={s.sommaireLecture}>
            <span className="t-titre">{copie.titreLectureNumerologie}</span>
            {nombres.apercuLecture && (
              <span className={`t-anam ${s.apercuLecture}`}>{nombres.apercuLecture}</span>
            )}
          </summary>
          <div className={s.contenuLecture}>
            {nombres.lecturesSymboliques.map((lecture) => (
              <article key={lecture.cle} className={s.lectureEcrite}>
                {/* L'intitulé arrive du domaine AVEC son nombre — « Chemin de vie (7) » — pour
                    répondre au texte qui commence par « Ton chemin de vie 7 symbolise… » (retour
                    du 2026-09-02). Le rendu ne recompose rien : il ne décide pas (AD-7).

                    En `t-titre-sm` depuis le 2026-09-03 (« les titres de la lecture symbolique
                    plus gros ») : c'était `t-meta`, la plus petite graisse du produit, sur un titre
                    qui coiffe cinq lignes de prose. */}
                <h3 className={`t-titre-sm ${s.titreLecture}`}>{lecture.intitule}</h3>
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
          <h3 id="socle-lecture-numerologie" className="t-titre">{copie.titreLectureNumerologie}</h3>
          <p className={`t-meta ${s.noteCorpus}`}>{nombres.noteLectureSymbolique}</p>
        </div>
      ) : null}

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

      {/* ⚠️ PLUS DE PREUVE SOUS CHAQUE NOMBRE (2026-09-03) : « supprime complètement les calculs,
          on a déjà au début l'explication, pas besoin de tout justifier, ça prend trop de place ».

          Ce qui était là jusqu'ici — la dernière ligne de la trace en clair, plus un « Voir le
          calcul » replié — remontait d'un retour du 2026-08-30 qui demandait l'inverse. La capture
          du fondateur montre le prix de ce choix : six cartes de justification à traverser avant
          d'atteindre la lecture. L'explication n'est pas perdue pour autant, elle est dite UNE
          fois, plus haut, dans « La méthode de calcul ». */}
      <ul className={s.grilleNombres}>
        {nombres.nombres.map((nombre) => (
          <li key={nombre.cle} className={s.entree}>
            <p className={`t-meta ${s.etiquette}`}>{nombre.intitule}</p>
            <p className={`t-display ${s.nombreFort}`}>{nombre.valeur}</p>
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

/**
 * L'APPEL À L'HEURE DE NAISSANCE : LE PREMIER BLOC DE L'UNIVERS ASTROLOGIE.
 *
 * Retour terrain du fondateur (2026-09-01) : « bouton ton heure de naissance bien avant. Il faudrait
 * presque qu'Anam arrive avec une bulle : il manque l'heure de naissance ; une fois qu'on l'a on
 * accède à l'horoscope. Si la personne n'a pas l'heure, on laisse passer. »
 *
 * Jusqu'ici l'aveu `MESSAGE_SANS_HEURE` et son lien vivaient EN BAS de la section, après la carte,
 * les positions, les angles et les maisons : le seul geste qui complète son ciel était la dernière
 * chose qu'on voyait, sous quatre écrans de texte. Ici : la phrase courte de la fiche (`appel`, dans
 * la voix d'Anam, en bulle), UN bouton principal, et l'aveu long REPLIÉ juste dessous.
 *
 * ⚠️ L'AVEU ET « OÙ LA TROUVER » NE DISPARAISSENT PAS. FR-050 exige qu'Anam dise ce qui manque,
 * pourquoi, et où chercher. Ils sont sous un `<details>` fermé : présents dans le DOM, à un geste,
 * plus jamais à la place de l'horoscope. `tests/rendu/fiche-socle.test.tsx` garde l'ordre.
 *
 * ⚠️ PAS D'`ImageAnam` ICI, ET C'EST DIT POUR QU'ON NE L'AJOUTE PAS PAR RÉFLEXE. Le seul format à
 * l'échelle d'une bulle, `veille`, n'a aucun asset sous `public/scene/veille/` (dossier vide) :
 * chaque affichage ferait un 404 puis un repli plumeux. Le format `presence`, lui, est dimensionné
 * par `conversation.module.css` à 40 vw (150 à 240 px) : posé au-dessus de l'horoscope, il
 * repousserait sous le pli la « première information » que ce retour demande de mettre en avant.
 * Le portrait vit déjà sur `/heure-naissance`, à un tap du bouton. La bulle est donc
 * typographique : la voix d'Anam, pas son portrait, dans la même grammaire que celle de l'écran.
 */
function AppelHeure({
  sansHeure,
  copie,
}: {
  readonly sansHeure: NonNullable<SectionCielVue["sansHeure"]>;
  readonly copie: ProprietesFicheSocle["copie"];
}) {
  return (
    <div className={s.appelHeure}>
      <p className={`t-anam ${s.bulleAppel}`}>{sansHeure.appel}</p>
      <Link className={`t-bouton ${s.boutonPrincipal}`} href={sansHeure.reparation.url}>
        {copie.boutonAjouterHeure}
      </Link>
      <details className={s.devoilement}>
        <summary className="t-corps">{copie.resumeDetailHeure}</summary>
        <div className={s.contenuDevoilement}>
          <p className={`t-anam ${s.raison}`}>{sansHeure.aveu}</p>
          <p className={`t-corps ${s.raison}`}>{sansHeure.ouChercher}</p>
        </div>
      </details>
    </div>
  );
}

/**
 * « TON CIEL DU JOUR » : LA PREMIÈRE INFORMATION DE L'UNIVERS ASTROLOGIE (2026-09-01 : « La
 * première information c'est l'horoscope. Il faut que ça aille plus vite. »).
 *
 * C'est la MÊME carte que l'accueil (`carteHoroscope`, transportée par la fiche) : même titre, même
 * texte du corpus, même silence quand rien n'est écrit. Le rendu ne choisit rien et ne fabrique
 * rien : la phrase du silence arrive par `copie`, comme toute copie (AD-7), et
 * `tests/socle-frontiere.test.ts` refuse ici toute phrase de corpus en dur comme tout `?? ""`.
 * En `t-anam` quand c'est écrit (ce sont ses mots), en `t-meta` sinon (ce n'est pas elle qui parle).
 */
function CielDuJour({
  horoscope,
  copie,
}: {
  readonly horoscope: NonNullable<SectionCielVue["horoscope"]>;
  readonly copie: ProprietesFicheSocle["copie"];
}) {
  return (
    <article className={s.carteJour} aria-labelledby="socle-ciel-du-jour">
      <h3 id="socle-ciel-du-jour" className="t-titre-sm">{horoscope.titre}</h3>
      {/* ⚠️ TROIS RENDUS, ET LE PREMIER N'EST PAS EN `t-anam` (2026-09-02).

          Un texte de modèle rendu dans le style d'Anam le ferait passer pour le sien : c'est
          exactement ce que FR-086 refuse, et aucune mention placée en dessous ne rattraperait un
          style qui, lui, affirme. D'où `t-corps` et sa mention collée, contre `t-anam` pour ce
          qu'Anima a écrit. La règle du choix, elle, ne vit pas ici mais dans `texteMontre`. */}
      {horoscope.ecritureModele !== null ? (
        <>
          <p className={`t-corps ${s.texte}`}>{horoscope.ecritureModele.texte}</p>
          <p className={`t-meta ${s.mentionModele}`}>{horoscope.ecritureModele.mention}</p>
        </>
      ) : horoscope.texte.statut === "ecrit" ? (
        <p className={`t-anam ${s.texte}`}>{horoscope.texte.texte}</p>
      ) : (
        <p className={`t-meta ${s.noteCorpus}`}>{copie.cielDuJourNonEcrit}</p>
      )}
    </article>
  );
}

function SectionAstrologie({
  ciel,
  copie,
}: {
  readonly ciel: SectionCielVue;
  readonly copie: ProprietesFicheSocle["copie"];
}) {
  const aDuDetail = ciel.positions.length > 0 || ciel.angles.length > 0 || ciel.cuspides.length > 0;
  return (
    <section className={`${s.section} ${s.sectionCiel}`} aria-labelledby="socle-ciel">
      <div className={s.enteteSection}>
        <p className={`t-meta ${s.surtitre}`}>Projection de naissance</p>
        <h2 id="socle-ciel" className="t-titre">{copie.titreCiel}</h2>
      </div>

      {ciel.indisponible && <p className={`t-corps ${s.panne}`}>{ciel.indisponible}</p>}

      {/* L'ORDRE EST LE SUJET (retour du 2026-09-01), et il est gardé par
          `tests/rendu/fiche-socle.test.tsx` : l'appel à l'heure quand elle manque, PUIS l'horoscope
          du jour, PUIS la carte, PUIS le détail replié, PUIS les manques. Avant : carte, positions,
          angles, maisons, et seulement ensuite l'aveu et son lien. */}
      {ciel.sansHeure && <AppelHeure sansHeure={ciel.sansHeure} copie={copie} />}
      {ciel.horoscope && <CielDuJour horoscope={ciel.horoscope} copie={copie} />}
      <CarteNatale ciel={ciel} />

      {/* ⚠️ TOUT LE TABLEAU D'ÉPHÉMÉRIDES SOUS UN SEUL PLI, FERMÉ (2026-09-01 : « Toggle et cache
          les positions en texte, on s'en fout, mets l'accent sur l'horoscope »). Les positions,
          la note de corpus, les angles et les maisons restent dans le DOM (l'équivalent textuel du
          SVG que son `<desc>` promet, et que `tests/rendu/fiche-socle.test.tsx` exige), mais ils
          ne se lisent plus qu'à la demande. `sensDuCielNonEcrit` ne paraît qu'ici : une note sur
          des positions qu'on ne voit pas n'a pas de sens au-dessus du pli. */}
      {aDuDetail && (
        <details className={s.devoilement}>
          <summary className="t-corps">{copie.titreDetailPositions}</summary>
          <div className={s.contenuDevoilement}>
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
              <div className={s.sousSection}>
                <h3 className="t-titre-sm">{copie.titreMaisons}</h3>
                <ul className={s.listePositions}>
                  {ciel.cuspides.map((cuspide) => (
                    <li key={cuspide.intitule} className={s.position}>
                      <span className={`t-meta ${s.etiquette}`}>{cuspide.intitule}</span>
                      <span className={`t-corps ${s.valeur}`}>{cuspide.valeur}</span>
                      {cuspide.longitude && <span className={`t-meta ${s.longitude}`}>Longitude : {cuspide.longitude}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
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
    /** Univers Astrologie (2026-09-01) : le bouton de l'appel, ses deux résumés de pli, le silence du jour. */
    readonly boutonAjouterHeure: string;
    readonly resumeDetailHeure: string;
    readonly titreDetailPositions: string;
    readonly cielDuJourNonEcrit: string;
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
