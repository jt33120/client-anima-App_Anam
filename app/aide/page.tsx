import s from "./aide.module.css";
import SortieRapide from "./SortieRapide";
import {
  RESSOURCES_AIDE,
  FAMILLES_ORDRE,
  LIBELLE_FAMILLE,
  verifieLeLibelle,
} from "@/lib/safety/ressources-aide";
import * as reperes from "@/lib/domain/copie-reperes";
import { RELANCER } from "@/lib/domain/copie-guide";
import Link from "next/link";

/**
 * ⚠️ RENDUE À LA DEMANDE, ET C'EST LA SORTIE DE SECOURS QUI EN DÉPEND (revue adversariale, R5).
 *
 * Cette page était PRÉRENDUE au build — c'était même une propriété dont son en-tête se félicitait :
 * elle ne lit aucune session, donc Next la figeait. Or `proxy.ts` pose un nonce NOUVEAU À CHAQUE
 * REQUÊTE, et `'strict-dynamic'` fait IGNORER `'self'` en CSP niveau 3 : un HTML figé au build ne
 * peut porter aucun nonce valide, donc AUCUN de ses scripts n'est chargé.
 *
 * Mesuré le 2026-08-18 sur `next start` : 16 balises `<script>`, 0 noncées, 16 refusées par le
 * navigateur. React ne s'hydratait jamais. Le bouton « Quitter » — la sortie rapide de FR-077, sur la
 * page qu'on atteint en détresse — était affiché et ne faisait rien. La même page rendue à la demande
 * nonce 16 scripts sur 16.
 *
 * Le prérendu n'était pas une décision : c'était une CONSÉQUENCE, et personne ne l'avait choisie.
 */
export const dynamic = "force-dynamic";

// NFR-015 / identité de route — « Anam » partout (garde : identite-route.test.ts).
export const metadata = { title: "Anam" };

/**
 * /aide — la halte ressources + transparence (Story 1.8, formalisée en Story 2.5).
 *
 * PAGE STATIQUE et PUBLIQUE : aucun appel d'auth/session, aucun traceur, AUCUNE dépendance au
 * fournisseur IA → atteignable SANS COMPTE, SANS PAYWALL, connectée ou non, indépendamment de
 * toute détection (AD-9, AD-15, FR-077, NFR-002). C'est le filet de sécurité HORS-IA : il ne
 * dépend d'aucun modèle. (Ne JAMAIS y lire la session ni router selon l'état — cela romprait
 * « connectée ou non ».)
 *
 * Story 2.5 : les ressources viennent de la SOURCE UNIQUE `lib/safety/ressources-aide` (jamais
 * inline), groupées par FAMILLE de danger (le danger vital d'abord), mises en forme en FICHE
 * sobre (`surface-elevee` + `bordure-forte`) — JAMAIS rouge, JAMAIS modale, JAMAIS bloquante
 * (le filet rassure, il n'alarme pas). En-tête « Vérifié le … » (gouvernance FR-044 trimestrielle).
 * La sélection DYNAMIQUE de la ressource adaptée au danger DÉTECTÉ en conversation est la Story 2.6.
 *
 * Ordre : les RESSOURCES d'abord (la porte de secours « Aide » atterrit ici — crise d'abord),
 * puis la TRANSPARENCE (ancre #transparence, cible de la mention « Anam est une IA »).
 */
export default function PageAide() {
  return (
    <main className={s.page}>
      <article className={s.contenu}>
        {/*
          ── L'EN-TÊTE À DEUX SORTIES, ET POURQUOI IL EN FAUT DEUX (retour du 2026-08-25) ────────

          Cette page n'avait qu'UN contrôle : « Quitter », la sortie de secours FR-074, qui navigue
          vers un site neutre et écrase l'historique. Julian a fait le geste que tout le monde fera —
          cliquer sur le seul bouton de la page pour revenir dans Anima — et il s'est retrouvé sur
          Météo France, sans retour arrière possible. « trop bizarre à vraiment régler ».

          Les deux gestes existaient dans une seule commande, et rien ne les distinguait :
            • « je referme l'aide et je rentre » — le geste de tous les jours ;
            • « je m'efface d'ici tout de suite » — le geste de quelqu'un qui n'est pas seule.

          ⚠️ LA SORTIE DE SECOURS N'EST PAS RETIRÉE, ET NE DOIT JAMAIS L'ÊTRE. Elle protège
          quelqu'un qui lit ces lignes avec un tiers dangereux derrière l'épaule ; elle a déjà été
          cassée une fois (voir plus haut, 2026-08-18, la CSP l'avait rendue inerte). Ce qui change,
          c'est qu'elle cesse d'être la seule issue et qu'elle dit ce qu'elle fait.

          Le retour est un `<Link>` NU vers la scène, sans JavaScript de navigation et sans lecture
          de session : `/aide` est la page qui doit marcher quand tout le reste est cassé (AD-15),
          et elle est publique (FR-077). Un `router.back()` aurait été plus fidèle et aurait échoué
          exactement dans le cas qui compte — celle qui arrive ici par un lien direct, en détresse,
          n'a pas d'entrée précédente où revenir.

          L'ordre du DOM place le retour en premier : les ressources restent au-dessus de la ligne
          de flottaison (FR-077), et la sortie de secours reste atteignable au deuxième arrêt.
        */}
        <div className={s.enTete}>
          <Link className={s.retour} href="/">
            <span className="t-bouton">Retour</span>
          </Link>
          <SortieRapide />
        </div>
        <p className="t-surtitre">Anam</p>
        <h1 className="t-titre">Aide</h1>

        <section className={s.section} aria-label="Ressources">
          <p className="t-corps">
            Si tu es en danger ou en détresse, tu n&rsquo;as pas à passer par Anam. Ces lignes
            sont tenues par des personnes, joignables directement.
          </p>
          <p className={`t-meta ${s.verifie}`}>Vérifié le {verifieLeLibelle()}</p>

          {FAMILLES_ORDRE.map((famille) => {
            const ressources = RESSOURCES_AIDE.filter((r) => r.famille === famille);
            if (ressources.length === 0) return null;
            // Pas d'aria-label sur la section de groupe : le <h2> nomme déjà le groupe. Un aria-label
            // en ferait un landmark « region » redondant (double annonce au lecteur d'écran).
            return (
              <section key={famille} className={s.groupe}>
                <h2 className="t-titre-sm">{LIBELLE_FAMILLE[famille]}</h2>
                <ul className={s.ressources}>
                  {ressources.map((r) => (
                    <li key={r.tel} className={s.ressource}>
                      <a
                        className={s.numero}
                        href={`tel:${r.tel}`}
                        aria-label={`${r.numero}, ${r.service}, ${r.aria}`}
                      >
                        <span className="t-titre-sm" aria-hidden>
                          {r.numero}
                        </span>
                      </a>
                      <span className={`t-corps ${s.desc}`}>{r.desc}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </section>

        {/* ══ COMMENT ÇA MARCHE — DEMANDÉ LE 2026-08-23, ET PLACÉ ICI À DESSEIN ═══════════════
            « "Repères" devrait être dans la page "Aide". »

            ⚠️ J'AVAIS ARGUMENTÉ CONTRE, ET LA DÉCISION EST PRISE. La réserve tenait à ceci :
            `/aide` est la porte de secours (FR-077, AD-9, AD-15) — publique, sans session,
            atteinte en détresse — et quelqu'un qui va mal ne doit pas tomber sur un mode
            d'emploi. Cette réserve est honorée par la PLACE, pas par l'absence : la sortie
            rapide reste en tête, les lignes tenues par des personnes viennent AVANT, et le mode
            d'emploi vient après. Qui arrive ici en urgence trouve d'abord ce qu'il cherche.

            `/reperes` continue d'exister et de porter la même copie : une seule source
            (`lib/domain/copie-reperes.ts`), deux surfaces. */}
        <section className={s.section} id="reperes" aria-label="Comment ça marche">
          <h2 className="t-titre-sm">{reperes.TITRE_HALTE}</h2>
          <p className="t-corps">{reperes.OUVERTURE}</p>

          <Link className={s.tour} href="/?tour=1">
            <span className="t-bouton">{RELANCER}</span>
          </Link>

          <dl className={s.places}>
            {reperes.PLACES.map((place) => (
              <div key={place.nom}>
                <dt className="t-corps">{place.nom}</dt>
                <dd className="t-corps">{place.quoi}</dd>
              </div>
            ))}
          </dl>

          {reperes.SECTIONS.map((section) => (
            <div className={s.sousSection} key={section.titre}>
              <h3 className="t-corps-fort">{section.titre}</h3>
              {section.paragraphes.map((texte) => (
                <p className="t-corps" key={texte}>
                  {texte}
                </p>
              ))}
            </div>
          ))}

          <p className="t-corps">{reperes.PAR_OU_COMMENCER}</p>
        </section>

        <section className={s.section} id="transparence" aria-label="Transparence">
          <h2 className="t-titre-sm">Anam est une IA</h2>
          <p className="t-anam">
            Tu parles à une <strong>intelligence artificielle</strong>. Pas à un être humain,
            pas à une voyante. Anam lit, relie et te répond — mais elle n&rsquo;a ni conscience
            ni intuition.
          </p>
          <p className="t-corps">
            Elle s&rsquo;appuie sur un modèle d&rsquo;IA opéré par un prestataire technique,
            encadré par contrat : il ne s&rsquo;entraîne pas sur tes données et ne les conserve
            pas au-delà du traitement de ta demande. Anam n&rsquo;est ni un service médical, ni
            psychologique, ni un avis professionnel.
          </p>
        </section>
      </article>
    </main>
  );
}
