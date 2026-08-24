"use client";

import s from "./LotusAttente.module.css";

/**
 * LE SIGNE D'ATTENTE D'ANAM — le lotus qui gonfle de lumiere (Story 6.9, iteration pastel).
 *
 * Remplace AnamPrepare dans Fil.tsx. Decoratif : aria-hidden, aucun texte, aucun
 * pourcentage — l'attente reste annoncee par la region aria-live du Fil.
 *
 * DEUX VARIANTES, meme dessin :
 *  - "rose" : lilas / rose poudre / bleu pale au coeur, cycle 4 s. Le plus feerique.
 *  - "eau"  : menthe / bleu d'eau, une pointe de rose au coeur, cycle 5,2 s. Reste dans
 *             la teinte bleue du produit, plus nenuphar que fleur de conte.
 *             C'EST LA VARIANTE DU PRODUIT (defaut) : la demande disait « bleue », et
 *             --accent vaut #8FC1EF. Passer a "rose" est un mot, pas une refonte.
 *
 * DETAIL AUTOMATIQUE : sous 44 px, nervures, etincelles, reflet et grain disparaissent et
 * les traits s'epaississent (classe .reduit du module). Au-dessus, tout est la.
 *
 * NE PAS regulariser les petales : leurs angles et tailles sont tous differents, c'est
 * exactement ce qui donne l'air dessine a la main.
 */
export type VarianteLotus = "rose" | "eau";

export default function LotusAttente({
  variante = "eau",
  taille = 34,
  className,
}: {
  variante?: VarianteLotus;
  /** Cote du carre, en px. Le detail complet n'apparait qu'a partir de 44. */
  taille?: number;
  className?: string;
}) {
  const reduit = taille < 44;
  return (
    <svg
      className={[s.lotus, s[variante], reduit ? s.reduit : "", className]
        .filter(Boolean)
        .join(" ")}
      style={{ "--taille-lotus": `${taille}px` } as React.CSSProperties}
      viewBox="0 0 48 48"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="lotusRose" x1=".2" y1="1" x2=".8" y2="0">
          <stop offset="0%" stopColor="#C9A8C8" stopOpacity=".30" />
          <stop offset="52%" stopColor="#F3D3E2" stopOpacity=".42" />
          <stop offset="100%" stopColor="#FDF0E2" stopOpacity=".62" />
        </linearGradient>
        <linearGradient id="lotusLilas" x1=".3" y1="1" x2=".7" y2="0">
          <stop offset="0%" stopColor="#8E7FB4" stopOpacity=".26" />
          <stop offset="60%" stopColor="#CDBFE8" stopOpacity=".34" />
          <stop offset="100%" stopColor="#E6DDF6" stopOpacity=".5" />
        </linearGradient>
        <linearGradient id="lotusBleu" x1=".3" y1="1" x2=".7" y2="0">
          <stop offset="0%" stopColor="#7FA6CE" stopOpacity=".24" />
          <stop offset="58%" stopColor="#C2DCF3" stopOpacity=".36" />
          <stop offset="100%" stopColor="#EAF3FD" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id="lotusMenthe" x1=".3" y1="1" x2=".7" y2="0">
          <stop offset="0%" stopColor="#7FA9A6" stopOpacity=".22" />
          <stop offset="60%" stopColor="#C4E3DC" stopOpacity=".32" />
          <stop offset="100%" stopColor="#EDF7F3" stopOpacity=".5" />
        </linearGradient>
        <radialGradient id="lotusHaloRose" cx="50%" cy="58%" r="50%">
          <stop offset="0%" stopColor="#FFF4E8" stopOpacity=".9" />
          <stop offset="34%" stopColor="#F0CFE0" stopOpacity=".5" />
          <stop offset="68%" stopColor="#B9A9DC" stopOpacity=".22" />
          <stop offset="100%" stopColor="#B9A9DC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lotusHaloEau" cx="50%" cy="58%" r="50%">
          <stop offset="0%" stopColor="#EAF6F3" stopOpacity=".8" />
          <stop offset="40%" stopColor="#BFE0DA" stopOpacity=".38" />
          <stop offset="100%" stopColor="#9FC4DE" stopOpacity="0" />
        </radialGradient>
        {/* Blur sur deux elements minuscules seulement (coeur, reflet) et JAMAIS anime :
            le filtre est calcule une fois. Cf. regle 4 du brief. */}
        <filter id="lotusBrume" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="1.7" />
        </filter>
        <filter id="lotusGrain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      {variante === "rose" ? (
        <g>
          <circle className={s.halo} cx="24" cy="27" r="19" fill="url(#lotusHaloRose)" />
          <g className={s.fleur}>
            <g
              className={`${s.rang} ${s.rangArriere}`}
              fill="url(#lotusLilas)"
              stroke="#A692C4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path transform="rotate(-58 24 34)" d="M24 34 C 17.4 27.6 16.1 17.4 22.4 8.9 C 29.6 15.8 30.4 26.2 24 34 Z" />
              <path transform="rotate(-30 24 34)" d="M24 34 C 18.9 28.1 17.9 19.6 22.1 12.4 C 27.6 18.9 28.6 27.4 24 34 Z" />
              <path transform="rotate(31 24 34)" d="M24 34 C 18.4 27.9 17.6 18.6 23.1 10.6 C 29.1 17.4 29.9 26.6 24 34 Z" />
              <path transform="rotate(59 24 34)" d="M24 34 C 18.1 28.4 17.4 18.9 22.6 10.1 C 29.4 16.6 30.1 26.9 24 34 Z" />
            </g>
            <g
              className={`${s.rang} ${s.rangAvant}`}
              fill="url(#lotusRose)"
              stroke="#D2AFC6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path transform="rotate(-16 24 34)" d="M24 34 C 19.9 28.9 19.1 20.6 23.4 13.1 C 28.4 19.9 28.9 28.1 24 34 Z" />
              <path transform="rotate(3 24 34)" d="M24 34 C 20.1 28.1 19.4 18.9 23.9 11.6 C 28.6 18.6 29.1 27.4 24 34 Z" />
              <path transform="rotate(18 24 34)" d="M24 34 C 20.4 29.1 19.9 21.1 23.6 14.1 C 28.1 20.4 28.4 28.4 24 34 Z" />
            </g>
            <g
              className={`${s.rang} ${s.rangCoeur}`}
              fill="url(#lotusBleu)"
              stroke="#B7CCE4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path transform="rotate(-9 24 34)" d="M24 34 C 21.6 30.4 21.1 24.4 23.6 19.9 C 26.6 24.6 26.9 30.6 24 34 Z" />
              <path transform="rotate(11 24 34)" d="M24 34 C 21.4 30.6 21.4 25.1 23.9 20.9 C 26.4 25.4 26.6 30.9 24 34 Z" />
            </g>
            <g className={`${s.nervures} ${s.detail}`} fill="none" stroke="#E3D3E9" strokeLinecap="round">
              <path transform="rotate(-58 24 34)" d="M24 32.6 C 22.6 26.4 22.1 18.1 22.9 11.4" />
              <path transform="rotate(-30 24 34)" d="M24 32.6 C 23.1 27.1 22.6 20.4 22.6 14.4" />
              <path transform="rotate(3 24 34)" d="M24 32.6 C 23.6 26.4 23.4 19.6 23.9 13.6" />
              <path transform="rotate(31 24 34)" d="M24 32.6 C 23.4 26.9 23.4 19.9 23.6 12.9" />
              <path transform="rotate(59 24 34)" d="M24 32.6 C 23.1 27.4 22.9 20.1 23.1 12.4" />
            </g>
          </g>
          <ellipse className={s.coeur} cx="24" cy="32.4" rx="2.4" ry="1.6" fill="#FFF6EA" filter="url(#lotusBrume)" />
          <g className={s.eau} fill="none" stroke="#9E93C4" strokeLinecap="round">
            <path className={s.eauTrait1} d="M6.5 36.6 C 12.4 38.9 20.1 39.4 25.4 38.6" />
            <path className={s.eauTrait2} d="M27.9 38.4 C 33.1 38.9 38.4 38.1 41.9 36.9" />
            <path className={`${s.eauTrait3} ${s.detail}`} d="M11.4 40.4 C 18.6 41.9 30.1 41.6 36.6 40.1" />
          </g>
          <path
            className={`${s.reflet} ${s.detail}`}
            fill="url(#lotusRose)"
            filter="url(#lotusBrume)"
            d="M18.4 38.9 C 21.4 42.4 26.6 42.4 29.6 38.9 C 26.9 40.4 21.1 40.4 18.4 38.9 Z"
          />
          <g className={`${s.etincelles} ${s.detail}`} fill="#FFF7EC">
            <path className={s.e1} d="M12.4 17.6 L13.1 19.1 L14.6 19.6 L13.1 20.1 L12.4 21.6 L11.9 20.1 L10.4 19.6 L11.9 19.1 Z" />
            <path className={s.e2} d="M36.1 15.1 L36.6 16.4 L37.9 16.9 L36.6 17.4 L36.1 18.6 L35.6 17.4 L34.4 16.9 L35.6 16.4 Z" />
            <path className={s.e3} d="M25.4 4.1 L25.9 5.1 L26.9 5.6 L25.9 6.1 L25.4 7.1 L24.9 6.1 L23.9 5.6 L24.9 5.1 Z" />
            <circle className={s.e4} cx="39.4" cy="27.4" r=".55" />
            <circle className={s.e5} cx="8.6" cy="28.6" r=".5" />
            <circle className={s.e6} cx="30.6" cy="10.4" r=".45" />
          </g>
          <rect className={`${s.grain} ${s.detail}`} x="0" y="0" width="48" height="48" filter="url(#lotusGrain)" />
        </g>
      ) : (
        <g>
          <circle className={s.halo} cx="24" cy="27" r="19" fill="url(#lotusHaloEau)" />
          <g className={s.fleur}>
            <g
              className={`${s.rang} ${s.rangArriere}`}
              fill="url(#lotusMenthe)"
              stroke="#93B3B0"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path transform="rotate(-62 24 34)" d="M24 34 C 16.9 28.1 15.6 18.1 21.9 9.4 C 29.4 16.1 30.6 26.6 24 34 Z" />
              <path transform="rotate(-33 24 34)" d="M24 34 C 18.6 28.4 17.6 19.4 22.4 11.9 C 27.9 18.6 28.9 27.6 24 34 Z" />
              <path transform="rotate(34 24 34)" d="M24 34 C 18.6 28.1 17.9 18.9 23.4 11.1 C 29.1 17.6 29.6 26.9 24 34 Z" />
              <path transform="rotate(63 24 34)" d="M24 34 C 17.6 28.6 17.1 18.4 22.4 9.9 C 29.6 16.4 30.4 27.1 24 34 Z" />
            </g>
            <g
              className={`${s.rang} ${s.rangAvant}`}
              fill="url(#lotusBleu)"
              stroke="#AFC8E0"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path transform="rotate(-18 24 34)" d="M24 34 C 19.6 28.6 18.9 20.1 23.1 12.6 C 28.6 19.6 29.1 27.9 24 34 Z" />
              <path transform="rotate(2 24 34)" d="M24 34 C 20.1 27.9 19.4 18.6 23.9 11.1 C 28.9 18.4 29.4 27.1 24 34 Z" />
              <path transform="rotate(20 24 34)" d="M24 34 C 20.4 28.9 19.9 20.9 23.6 13.6 C 28.4 20.1 28.6 28.4 24 34 Z" />
            </g>
            <g
              className={`${s.rang} ${s.rangCoeur}`}
              fill="url(#lotusRose)"
              stroke="#D6B7C9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path transform="rotate(-8 24 34)" d="M24 34 C 21.4 30.1 21.1 24.1 23.6 19.4 C 26.9 24.4 27.1 30.4 24 34 Z" />
              <path transform="rotate(12 24 34)" d="M24 34 C 21.4 30.6 21.4 24.9 24.1 20.4 C 26.6 25.1 26.9 30.9 24 34 Z" />
            </g>
            <g className={`${s.nervures} ${s.detail}`} fill="none" stroke="#DCEAF2" strokeLinecap="round">
              <path transform="rotate(-62 24 34)" d="M24 32.6 C 22.4 26.1 21.9 17.9 22.4 11.9" />
              <path transform="rotate(-33 24 34)" d="M24 32.6 C 23.1 26.9 22.6 20.1 22.9 14.1" />
              <path transform="rotate(2 24 34)" d="M24 32.6 C 23.6 26.1 23.4 19.1 23.9 13.1" />
              <path transform="rotate(34 24 34)" d="M24 32.6 C 23.4 26.6 23.4 19.4 23.9 13.1" />
              <path transform="rotate(63 24 34)" d="M24 32.6 C 23.1 27.1 22.9 19.6 23.1 12.1" />
            </g>
          </g>
          <ellipse className={s.coeur} cx="24" cy="32.4" rx="2.2" ry="1.5" fill="#F4FBF8" filter="url(#lotusBrume)" />
          <g className={s.eau} fill="none" stroke="#8FA8BE" strokeLinecap="round">
            <path className={s.eauTrait1} d="M6.9 36.9 C 12.9 39.1 19.9 39.6 25.1 38.9" />
            <path className={s.eauTrait2} d="M28.1 38.6 C 33.6 39.1 38.6 38.1 42.1 36.6" />
            <path className={`${s.eauTrait3} ${s.detail}`} d="M10.9 40.9 C 18.4 42.1 30.4 41.9 37.1 40.4" />
          </g>
          <g className={`${s.etincelles} ${s.detail}`} fill="#F7FDFB">
            <circle className={s.e1} cx="13.4" cy="20.4" r=".55" />
            <circle className={s.e2} cx="35.4" cy="18.1" r=".5" />
            <circle className={s.e3} cx="24.6" cy="6.4" r=".45" />
            <circle className={s.e4} cx="9.4" cy="29.4" r=".45" />
          </g>
          <rect className={`${s.grain} ${s.detail}`} x="0" y="0" width="48" height="48" filter="url(#lotusGrain)" />
        </g>
      )}
    </svg>
  );
}

/**
 * Le conteneur tel qu'il vit en fin de fil — hauteur de cible tactile, aligne comme un
 * tour d'Anam. Dans Fil.tsx : {prepare && <AnamPrepare />}, inchange.
 */
export function AnamPrepare({ variante = "eau" }: { variante?: VarianteLotus }) {
  return (
    <div className={`${s.attente} fondu-texte`} aria-hidden>
      <LotusAttente variante={variante} taille={34} />
    </div>
  );
}
