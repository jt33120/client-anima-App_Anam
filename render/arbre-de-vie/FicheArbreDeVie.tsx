import Link from "next/link";
import s from "./arbre-de-vie.module.css";
import SchemaArbre from "./SchemaArbre";
import type {
  CopieArbreDeVieVue,
  DefiVue,
  FicheArbreDeVieVue,
  ManqueVue,
  PartieArbreVue,
  QualiteVue,
  TexteVue,
} from "./types";

/**
 * FicheArbreDeVie.tsx — LA HALTE, DESSINÉE.
 *
 * Composant SERVEUR et MUET (AD-7) : toute la copie arrive par `copie`, tous les nombres arrivent
 * déjà mis en mots. Il ne décide rien, il ne coupe rien, il ne complète rien.
 *
 * ── DEUX PATRONS DE DÉVOILEMENT, ET LA RAISON DE LES SÉPARER ──────────────────────────────────
 *
 * Les SEPT PARTIES sont des `<section id>` OUVERTES, pas des `<details>`. Le geste demandé est
 * « je touche une pastille, le texte s'ouvre plus bas » : avec un `<details>`, ça demanderait que
 * `:target` ouvre le pli, et depuis Chrome 131 le navigateur masque le contenu par
 * `content-visibility` sur `::details-content`, que rien dans une feuille de style ne rattrape
 * proprement. Le geste marcherait sur certaines versions et pas d'autres, sans qu'aucune garde du
 * dépôt ne puisse le voir. Ouvertes, elles coûtent de la longueur et rien d'autre : le texte reste
 * toujours dans la page, donc trouvable par la recherche du navigateur et par un lecteur d'écran.
 *
 * La DYNAMIQUE, les DÉFIS, les QUALITÉS et la MÉTHODE sont des `<details>` natifs : ils ne sont
 * jamais la cible d'une ancre, donc le problème ne se pose pas, et le patron du socle s'applique.
 *
 * ── LE TEXTE D'ANIMA ET LA VOIX DU PRODUIT NE PORTENT PAS LA MÊME CLASSE ──────────────────────
 *
 * `t-anam` est réservée au corpus. L'absence d'un texte se dit en `t-corps` : faire dire par Anima
 * qu'Anima n'a pas encore écrit serait déjà lui prêter une phrase (FR-086).
 */

function Texte({ texte, nonEcrit }: { readonly texte: TexteVue | null; readonly nonEcrit: string }) {
  if (texte === null) return null;
  // ⚠️ AUCUN `?? ""` ET AUCUN `|| "…"` ICI, JAMAIS. L'union traverse jusqu'au dernier pixel : c'est
  // ce qui empêche « pas encore écrit » de se déguiser en paragraphe vide.
  return texte.statut === "ecrit" ? (
    <p className={`t-anam ${s.texte}`}>{texte.texte}</p>
  ) : (
    <p className={`t-corps ${s.nonEcrit}`}>{nonEcrit}</p>
  );
}

function Manque({ manque }: { readonly manque: ManqueVue }) {
  return (
    <p className={`t-corps ${s.manque}`}>
      {manque.raison}
      {manque.reparation !== null && (
        <>
          {" "}
          <Link className={s.reparation} href={manque.reparation.url}>
            {manque.reparation.libelle}
          </Link>
        </>
      )}
    </p>
  );
}

function Partie({
  partie,
  nonEcrit,
}: {
  readonly partie: PartieArbreVue;
  readonly nonEcrit: string;
}) {
  return (
    <section id={partie.ancre} className={s.partie} aria-labelledby={`${partie.ancre}-titre`}>
      <h3 id={`${partie.ancre}-titre`} className={`t-titre-sm ${s.intitule}`}>
        {partie.intitule}
        {partie.valeur !== null && (
          <>
            {" · "}
            <span className={s.nombre}>{partie.valeur}</span>
          </>
        )}
      </h3>
      {partie.archetype !== null && (
        <p className={`t-surtitre ${s.archetype}`}>{partie.archetype}</p>
      )}
      <p className={`t-meta ${s.role}`}>{partie.role}</p>
      {partie.manque === null ? (
        <Texte texte={partie.texte} nonEcrit={nonEcrit} />
      ) : (
        <Manque manque={partie.manque} />
      )}
      <p className={`t-meta ${s.origine}`}>{partie.origine}</p>
    </section>
  );
}

function Devoilement({
  intitule,
  valeur,
  precision,
  texte,
  nonEcrit,
}: {
  readonly intitule: string;
  readonly valeur: string | null;
  readonly precision: string | null;
  readonly texte: TexteVue;
  readonly nonEcrit: string;
}) {
  return (
    <details className={s.devoilement}>
      <summary>
        <span className={s.entete}>
          <span className={`t-titre-sm ${s.intitule}`}>
            {intitule}
            {valeur !== null && (
              <>
                {" · "}
                <span className={s.nombre}>{valeur}</span>
              </>
            )}
          </span>
          {precision !== null && <span className={`t-meta ${s.archetype}`}>{precision}</span>}
        </span>
      </summary>
      <Texte texte={texte} nonEcrit={nonEcrit} />
    </details>
  );
}

export interface ProprietesFicheArbreDeVie {
  readonly fiche: FicheArbreDeVieVue;
  readonly copie: CopieArbreDeVieVue;
}

export default function FicheArbreDeVie({ fiche, copie }: ProprietesFicheArbreDeVie) {
  /**
   * ⚠️ AUCUN DESSIN SANS NOMBRES. Un arbre affiché vide se lirait comme une perte de données, alors
   * que c'est un parcours qui n'est pas allé au bout ou un incident de lecture. La halte dit ce
   * qu'il manque, et propose la porte quand elle existe.
   */
  if (fiche.indisponible !== null) {
    return (
      <div className={s.contenu}>
        <p className={`t-surtitre ${s.surtitre}`}>{copie.surtitre}</p>
        <section className={s.section}>
          <p className={`t-corps ${s.manque}`}>{fiche.indisponible}</p>
          {fiche.porteIndisponible !== null && (
            <Link className={s.reparation} href={fiche.porteIndisponible.url}>
              {fiche.porteIndisponible.libelle}
            </Link>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={s.contenu}>
      <p className={`t-surtitre ${s.surtitre}`}>{copie.surtitre}</p>
      <p className={`t-corps ${s.introduction}`}>{copie.introduction}</p>
      {/* La phrase qui distingue cet arbre de celui de « Mon évolution ». En `t-meta` : elle situe,
          elle n'enseigne pas, et elle ne doit pas peser autant que l'introduction. */}
      <p className={`t-meta ${s.distinction}`}>{copie.distinction}</p>

      <SchemaArbre
        pastilles={fiche.pastilles}
        titre={copie.titreSchema}
        description={copie.descriptionSchema}
      />

      <section className={s.section} aria-labelledby="arbre-triangle">
        <h2 id="arbre-triangle" className={`t-titre-sm ${s.titreSection}`}>
          {copie.titreTriangle}
        </h2>
        <p className={`t-corps ${s.introductionSection}`}>{copie.introductionTriangle}</p>
        {fiche.triangle.map((p) => (
          <Partie key={p.cle} partie={p} nonEcrit={copie.texteNonEcrit} />
        ))}
      </section>

      <section className={s.section} aria-labelledby="arbre-comportement">
        <h2 id="arbre-comportement" className={`t-titre-sm ${s.titreSection}`}>
          {copie.titreComportement}
        </h2>
        <p className={`t-corps ${s.introductionSection}`}>{copie.introductionComportement}</p>
        {fiche.comportement.map((p) => (
          <Partie key={p.cle} partie={p} nonEcrit={copie.texteNonEcrit} />
        ))}
      </section>

      {fiche.dynamique !== null && (
        <section className={s.section} aria-labelledby="arbre-dynamique">
          <h2 id="arbre-dynamique" className={`t-titre-sm ${s.titreSection}`}>
            {copie.titreDynamique}
          </h2>
          <Partie partie={fiche.dynamique} nonEcrit={copie.texteNonEcrit} />
        </section>
      )}

      {fiche.defis.length > 0 && (
        <section className={s.section} aria-labelledby="arbre-defis">
          <h2 id="arbre-defis" className={`t-titre-sm ${s.titreSection}`}>
            {copie.titreDefis}
          </h2>
          <p className={`t-corps ${s.introductionSection}`}>{copie.introductionDefis}</p>
          {fiche.defis.map((defi: DefiVue) => (
            <Devoilement
              key={defi.cle}
              intitule={defi.intitule}
              valeur={defi.valeur}
              precision={defi.origine}
              texte={defi.texte}
              nonEcrit={copie.texteNonEcrit}
            />
          ))}
        </section>
      )}

      <section className={s.section} aria-labelledby="arbre-qualites">
        <h2 id="arbre-qualites" className={`t-titre-sm ${s.titreSection}`}>
          {copie.titreQualites}
        </h2>
        <p className={`t-corps ${s.introductionSection}`}>{copie.introductionQualites}</p>
        {fiche.manqueQualites !== null && <Manque manque={fiche.manqueQualites} />}
        {fiche.qualites.map((q: QualiteVue) => (
          <Devoilement
            key={q.cle}
            intitule={`${q.intitule} · ${q.lettres}`}
            valeur={q.valeur}
            precision={q.presence}
            texte={q.texte}
            nonEcrit={copie.texteNonEcrit}
          />
        ))}
      </section>

      {fiche.cheminDeVie !== null && (
        <section className={s.section} aria-labelledby="arbre-chemin">
          <h2 id="arbre-chemin" className={`t-titre-sm ${s.titreSection}`}>
            {copie.titreCheminDeVie}
          </h2>
          <Partie partie={fiche.cheminDeVie} nonEcrit={copie.texteNonEcrit} />
          {fiche.porteNombres !== null && (
            <Link className={s.reparation} href={fiche.porteNombres.url}>
              {fiche.porteNombres.libelle}
            </Link>
          )}
        </section>
      )}

      {fiche.conventions.length > 0 && (
        <details className={`${s.devoilement} ${s.methode}`}>
          <summary>
            <span className={`t-titre-sm ${s.intitule}`}>{copie.titreMethode}</span>
          </summary>
          <ul className={s.listeMethode}>
            {fiche.conventions.map((c) => (
              <li key={c} className="t-meta">
                {c}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
