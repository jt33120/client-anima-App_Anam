import s from "./arbre-de-vie.module.css";
import Image from "next/image";
import { ANCRES, ancreDeLaPastille } from "./geometrie";
import { ILLUSTRATION_ARBRE_DE_VIE } from "./illustration";
import type { PastilleVue } from "./types";

/** Illustration statique et sept liens HTML : cibles tactiles indépendantes de l'image. */
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
      <div role="img" aria-label={`${titre}. ${description}`}>
        <Image
          className={s.schema}
          src={ILLUSTRATION_ARBRE_DE_VIE}
          alt=""
          width={1024}
          height={1536}
          sizes="(max-width: 600px) 100vw, 576px"
        />
      </div>

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
