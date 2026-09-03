import s from "./questionnaire.module.css";

/**
 * DessinHumanDesign.tsx — LE DESSIN, DESSINÉ (2026-09-03).
 *
 * Composant SERVEUR et PUR : aucun état, aucun geste, aucune action. Il n'y a rien à répondre sur
 * cette page — le dessin est une fonction de la naissance, et l'écran ne fait que le montrer.
 *
 * ⚠️ IL NE REÇOIT QUE DES CHAÎNES DÉJÀ RÉSOLUES. `render/` ne peut importer ni `lib/corpus` ni
 * `lib/domain` (AD-7/AD-10) : le texte d'Anima et son absence sont décidés par la page, et ce
 * composant ne peut donc pas inventer une phrase de repli — le troisième état que `lib/corpus/port`
 * refuse d'exister.
 *
 * ⚠️ AUCUNE ROUE, AUCUN BODYGRAPH. Le rendu classique du Human Design est un schéma de neuf formes
 * reliées par des canaux, et il serait joli. Il serait aussi ILLISIBLE au lecteur d'écran, et il
 * dirait par le dessin ce que le produit dit par les mots. Ici les quatre choses qui comptent sont
 * du texte : elles se lisent, se copient, s'annoncent.
 */

export interface RubriqueVue {
  readonly libelle: string;
  /** Le texte d'Anima, ou `null` si le créneau n'est pas encore écrit. */
  readonly texte: string | null;
}

export interface LigneProfilVue extends RubriqueVue {
  readonly legende: string;
}

export default function DessinHumanDesign({
  type,
  autorite,
  profil,
  centres,
  copie,
}: {
  readonly type: RubriqueVue;
  readonly autorite: RubriqueVue;
  readonly profil: { readonly couple: string; readonly lignes: readonly LigneProfilVue[] };
  readonly centres: readonly string[];
  readonly copie: {
    readonly titreType: string;
    readonly titreAutorite: string;
    readonly titreProfil: string;
    readonly titreCentres: string;
    readonly aucunCentre: string;
    readonly messageSansTexte: string;
  };
}) {
  /** Le texte d'Anima dans SA voix ; l'absence dans celle du produit. Jamais l'inverse. */
  const Texte = ({ texte }: { readonly texte: string | null }) =>
    texte !== null ? (
      <p className="t-anam">{texte}</p>
    ) : (
      <p className="t-corps">{copie.messageSansTexte}</p>
    );

  return (
    <section className={`${s.bloc} fondu-texte`} aria-label="Ton dessin">
      <ul className={s.axes}>
        <li className={s.axe}>
          <p className={`${s.position} t-meta`}>{copie.titreType}</p>
          <h2 className="t-titre-sm">{type.libelle}</h2>
          <Texte texte={type.texte} />
        </li>

        <li className={s.axe}>
          <p className={`${s.position} t-meta`}>{copie.titreAutorite}</p>
          <h2 className="t-titre-sm">{autorite.libelle}</h2>
          <Texte texte={autorite.texte} />
        </li>

        <li className={s.axe}>
          <p className={`${s.position} t-meta`}>{copie.titreProfil}</p>
          <h2 className="t-titre-sm">{profil.couple}</h2>
          {profil.lignes.map((ligne) => (
            <div className={s.ligneProfil} key={ligne.legende}>
              <h3 className="t-corps">{ligne.libelle}</h3>
              <p className={`${s.position} t-meta`}>{ligne.legende}</p>
              <Texte texte={ligne.texte} />
            </div>
          ))}
        </li>

        <li className={s.axe}>
          <p className={`${s.position} t-meta`}>{copie.titreCentres}</p>
          {/* Une LISTE, jamais un compte. « 5 centres sur 9 » serait une jauge (FR-031), et
              « la moitié » en serait une déguisée. On nomme ce qui est défini, et c'est tout. */}
          {centres.length > 0 ? (
            <ul className={s.centres}>
              {centres.map((centre) => (
                <li className="t-corps" key={centre}>
                  {centre}
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-corps">{copie.aucunCentre}</p>
          )}
        </li>
      </ul>
    </section>
  );
}
