import s from "./arbre-de-vie.module.css";
import {
  ANCRES,
  BRANCHES,
  CADRE,
  CIME,
  ECORCE,
  FEUILLES,
  RACINES,
  TRONC,
  ancreDeLaPastille,
} from "./geometrie";
import type { PastilleVue } from "./types";

/**
 * SchemaArbre.tsx — LE DESSIN, ET SES SEPT PRISES.
 *
 * Composant SERVEUR, sans état : il n'y a rien à sélectionner ici, seulement sept liens vers sept
 * sections plus bas. Le SVG est MUET (`role="img"` + un titre et une description descendus par la
 * page) ; les prises sont du HTML par-dessus, pour qu'elles tiennent 44 px à toutes les échelles.
 * Le raisonnement complet est dans `geometrie.ts`.
 *
 * ⚠️ AUCUNE ANIMATION, AUCUN `filter`, AUCUNE OMBRE PORTÉE. Un flou plein écran a fait tomber cette
 * application à quatre images par seconde le 2026-08-20 ; la règle qui en est sortie vaut pour tout
 * le produit et pas seulement pour la scène. Ici le dessin est statique de toute façon.
 */
export default function SchemaArbre({
  pastilles,
  titre,
  description,
}: {
  readonly pastilles: readonly PastilleVue[];
  readonly titre: string;
  readonly description: string;
}) {
  return (
    <figure className={s.figure}>
      <svg
        className={s.schema}
        viewBox={`0 0 ${CADRE.largeur} ${CADRE.hauteur}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="arbre-schema-titre arbre-schema-description"
      >
        <title id="arbre-schema-titre">{titre}</title>
        <desc id="arbre-schema-description">{description}</desc>

        <g aria-hidden className={s.racines}>
          {RACINES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g aria-hidden className={s.tronc}>
          <path d={TRONC} />
        </g>
        <g aria-hidden className={s.ecorce}>
          {ECORCE.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g aria-hidden className={s.branches}>
          {BRANCHES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g aria-hidden className={s.feuillage}>
          {FEUILLES.map(([x, y]) => (
            <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="9" ry="5" />
          ))}
        </g>
        <g aria-hidden className={s.cime}>
          <path d={CIME} />
        </g>
      </svg>

      {/* ⚠️ L'ORDRE DU DOM EST CELUI DU RÉCIT, du sol vers la cime, et c'est aussi celui des
          sections plus bas : un parcours au clavier lit la même histoire que l'œil (WCAG 2.4.3).
          Le CSS les déplace, il ne les réordonne pas. */}
      <ul className={s.prises}>
        {pastilles.map((pastille) => {
          const ancre = ancreDeLaPastille(pastille);
          return (
            <li
              key={pastille.cle}
              className={s.prise}
              style={{ left: ancre.gauche, top: ancre.haut }}
            >
              <a className={s.pastille} href={`#${pastille.ancre}`}>
                {/* La valeur peut manquer (il manque le prénom de naissance, ou le nom) : la
                    pastille garde alors son nom seul, et la section plus bas dit pourquoi. On
                    n'écrit JAMAIS un tiret à la place d'un nombre absent (FR-050). */}
                {pastille.valeur !== null && (
                  <span className={`t-titre-sm ${s.valeurPastille}`}>{pastille.valeur}</span>
                )}
                <span className={`t-meta ${s.intitulePastille}`}>{pastille.intitule}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/** Les clés que la géométrie sait placer. Exportée pour que la garde de frontière la vérifie. */
export const CLES_PLACEES: readonly string[] = Object.freeze(Object.keys(ANCRES));
