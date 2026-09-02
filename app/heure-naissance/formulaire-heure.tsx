"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { chercherLieux, enregistrerHeureEtLieu, type EtatHeure } from "./actions";
import type { LieuNaissance } from "@/lib/astro/lieux";
import { OU_TROUVER_SON_HEURE, RESUME_OU_TROUVER } from "@/lib/domain/message-sans-heure";
import s from "./heure-naissance.module.css";

/**
 * formulaire-heure.tsx — LA SAISIE (Story 5.3, T7 — AC4/AC7/AC8).
 *
 * ── POURQUOI L'HEURE ET LE LIEU SONT DEMANDÉS ENSEMBLE ─────────────────────────────────────────
 *
 * « 07:15 » ne désigne aucun instant sans le lieu, et l'ascendant a besoin des deux. Un formulaire
 * qui ne demanderait que l'heure tiendrait la promesse de la story mot à mot — « ton heure est
 * enregistrée » — et produirait exactement le même thème qu'avant. Le libellé de la porte d'entrée
 * reste « Ajouter mon heure » parce que c'est ce qu'elle cherche ; ici on lui dit pourquoi le lieu
 * vient avec.
 *
 * ── MAIS LE LIEU NE DÉPEND PAS DE L'HEURE (revue du 2026-08-12, A2) ────────────────────────────
 *
 * Les deux champs étaient OBLIGATOIRES tous les deux. Quelqu'un qui ne connaît pas son heure de
 * naissance — la majorité des gens — ne pouvait donc pas non plus donner son LIEU, alors que le
 * lieu seul répare déjà beaucoup : il apporte le fuseau, qui ramène la fenêtre d'incertitude de
 * 50 h à 24 h et redonne un signe déterminable à des corps qui n'en avaient plus.
 *
 * Le champ n'est pas devenu « facultatif » pour autant : ne pas connaître son heure se DÉCLARE, par
 * une case. Les colonnes sont write-once — un thème gravé sans heure par distraction ne se
 * rattrape pas d'un clic, alors qu'une absence déclarée est un choix.
 *
 * ── ON NE REDEMANDE PAS CE QUI EST DÉJÀ GRAVÉ ─────────────────────────────────────────────────
 *
 * Le write-once de 0039 est PAR COLONNE : elle peut revenir six mois plus tard avec son heure. Le
 * formulaire n'affiche alors que ce qui manque encore, et rappelle en clair ce qui est déjà posé.
 *
 * ── LA CONFIRMATION N'EST PAS UNE FORMALITÉ (AC8) ──────────────────────────────────────────────
 *
 * Ces colonnes sont WRITE-ONCE (migration 0039). Quelqu'un qui tape 07:15 au lieu de 19:15 a un
 * ascendant faux POUR TOUJOURS — et un ascendant faux a l'air juste. Le produit sait déjà traiter
 * un geste irréversible : la déclaration de rayonnement demande une confirmation solennelle. Même
 * patron ici, et on le dit AVANT, pas après.
 *
 * ── BEAUCOUP MOINS DE TEXTE (retour terrain du 2026-09-01) ─────────────────────────────────────
 *
 * Julian, en test : « un écran qui saute aux yeux avec un gros bouton et beaucoup moins de texte.
 * Si la personne n'a pas l'heure, on laisse passer et on se contente de l'horoscope astral. Il faut
 * que ça aille plus vite. L'app est beaucoup trop verbeuse. »
 *
 * Ce que ce formulaire portait, en plus de ses champs : deux aides de deux lignes sous les champs,
 * une case de déclaration d'absence en deux phrases, une confirmation en trois lignes, et un bouton
 * « Enregistrer » de la largeur de son mot. Ce qu'il porte maintenant :
 *   • le champ de l'heure, et sous lui « Où trouver mon heure ? » REPLIÉ : `OU_TROUVER_SON_HEURE`
 *     n'a pas disparu (FR-050 exige d'indiquer où chercher), il ne s'étale plus devant celle qui
 *     n'en a pas besoin. Le champ est DÉCRIT par ce résumé (`aria-describedby`) : un lecteur d'écran
 *     entend qu'une aide existe, sans l'entendre entière ;
 *   • la case « Je ne connais pas mon heure. » : UN geste, et on laisse passer. Sa commune suffit
 *     à Anam pour l'horoscope, elle n'a pas besoin qu'on le lui explique pour cocher ;
 *   • une aide d'une ligne sous la commune : la seule information que le champ ne dit pas lui-même
 *     (choisir dans la liste, France) ;
 *   • la confirmation, réduite au strict nécessaire sans rien retirer de VRAI : la commune ne se
 *     change plus, l'heure reste corrigeable. C'est exactement ce que 0039 et 0060 font ;
 *   • le bouton, pleine largeur, qui dit ce qu'il fait plutôt que son verbe technique.
 *
 * ── LES HOMONYMES SE DÉPARTAGENT PAR LE DÉPARTEMENT (même retour) ─────────────────────────────
 *
 * « Ville de naissance : plusieurs villes (ex. Saint-Denis), comment départager : tu ne montres pas
 * le département. » Quatre communes s'appellent Saint-Denis, et la liste en montrait quatre lignes
 * identiques. On affiche `libelle` (« Saint-Denis (93) », `lib/astro/lieux.ts`) dans la liste ET
 * dans le champ une fois choisie. Ce qui PART reste le `code` seul, et ce que le serveur GRAVE reste
 * `nom` : la persistance ne change pas, `actions.ts` compare toujours `lieu.nom` à ce qui est écrit.
 */

const initial: EtatHeure = { statut: "saisie" };

export interface DejaGrave {
  /** `HH:MM:SS` déjà enregistrée, ou `null`. */
  readonly heure: string | null;
  /** Nom de commune déjà enregistré (`LieuNaissance.nom`, sans département), ou `null`. */
  readonly lieu: string | null;
}

export default function FormulaireHeure({ deja }: { deja: DejaGrave }) {
  const [etat, action, enCours] = useActionState(enregistrerHeureEtLieu, initial);

  const [requete, setRequete] = useState("");
  const [resultats, setResultats] = useState<readonly LieuNaissance[]>([]);
  const [choisi, setChoisi] = useState<LieuNaissance | null>(null);
  const [sansHeure, setSansHeure] = useState(false);
  const idListe = useId();

  const demanderHeure = deja.heure === null;
  const demanderLieu = deja.lieu === null;

  /**
   * Pourquoi le bouton n'ouvre pas — ou `null` s'il ouvre (QA tour 1, T18).
   *
   * Deux cas distincts, parce qu'ils appellent deux gestes différents : ne rien avoir tapé, et
   * avoir tapé quelque chose que le référentiel ne reconnaît pas. Les confondre dirait « saisis ta
   * commune » à quelqu'un qui vient de le faire.
   */
  const lieuManquant = demanderLieu && !choisi;
  const bloque = lieuManquant || (!demanderLieu && !demanderHeure);
  const motifBlocage = lieuManquant
    ? requete.trim().length > 0
      ? "Choisis ta commune dans la liste qui s’ouvre sous le champ : je ne reconnais pas encore ce que tu as tapé."
      : "Indique ta commune de naissance pour que je puisse enregistrer."
    : bloque
      ? "Tout est déjà enregistré : il n’y a rien à écrire ici."
      : null;

  // Recherche différée : on n'interroge pas le serveur à chaque frappe. 250 ms est le seuil
  // au-delà duquel une frappe est finie sans que l'attente se sente.
  useEffect(() => {
    const q = requete.trim();
    if (choisi || q.length < 2) {
      setResultats([]);
      return;
    }
    let vivant = true;
    const t = setTimeout(() => {
      chercherLieux(q)
        .then((r) => {
          if (vivant) setResultats(r);
        })
        // Une recherche qui échoue ne casse rien : la liste reste vide, et rien ne prétend le contraire.
        .catch(() => {
          if (vivant) setResultats([]);
        });
    }, 250);
    return () => {
      vivant = false;
      clearTimeout(t);
    };
  }, [requete, choisi]);

  if (etat.statut === "enregistre") {
    return (
      <div>
        <p className="t-anam" role="status">
          {/* ⚠️ PAS DE FUTUR ADRESSÉ (revue du 2026-08-12, B6). La phrase disait « tu le verras à
              ton prochain passage » : un futur adressé à elle, dans la voix d'Anam (`t-anam`), sur
              l'écran même du socle — exactement ce que FR-053 interdit. Et c'était une promesse que
              le code ne peut pas tenir : le recalcul a lieu à la prochaine LECTURE, et il peut
              échouer. Le présent dit la même chose, et il est vrai. */}
          C’est enregistré. Ton thème se recalcule tout seul, la prochaine fois que tu ouvres Anima.
        </p>
        {/* Un chemin de retour, jamais un cul-de-sac. */}
        <a className={s.bouton} href="/">
          <span className="t-bouton">Revenir</span>
        </a>
      </div>
    );
  }

  return (
    <form action={action} className={s.form}>
      {demanderHeure ? (
        <>
          <label htmlFor="heure_naissance" className={s.etiquette}>
            <span className="t-meta">L’heure de ta naissance</span>
            {/* Décrit par le RÉSUMÉ de l'aide repliée, juste en dessous : « Où trouver mon heure ? »
                est tout ce qu'un lecteur d'écran a besoin d'entendre en entrant dans le champ. */}
            <input
              id="heure_naissance"
              name="heure_naissance"
              type="time"
              required={!sansHeure}
              disabled={sansHeure}
              className={s.champ}
              aria-describedby="heure_aide"
            />
          </label>

          {/* FR-050 : où la chercher, PRÉSENT mais REPLIÉ (2026-09-01). Fermé par défaut, et c'est
              le point : la copie intégrale et la mairie n'ont rien à dire à celle qui a déjà son
              heure sous les yeux. Même source que la fiche du tronc : un second texte divergerait. */}
          <details className={s.details}>
            <summary id="heure_aide" className={`${s.resume} t-meta`}>
              {RESUME_OU_TROUVER}
            </summary>
            <p className={`${s.detailsCorps} t-corps`}>{OU_TROUVER_SON_HEURE}</p>
          </details>

          {/* A2 — l'absence se DÉCLARE. `disabled` sur le champ le vide aussi à l'envoi, ce qui
              évite la contradiction « case cochée + heure remplie » que le serveur refuserait.
              UN geste (2026-09-01) : on laisse passer, sa commune suffit pour l'horoscope. */}
          <label htmlFor="sans_heure" className={s.case}>
            <input
              id="sans_heure"
              name="sans_heure"
              type="checkbox"
              value="oui"
              className={s.checkbox}
              checked={sansHeure}
              onChange={(e) => setSansHeure(e.target.checked)}
            />
            <span className="t-corps">Je ne connais pas mon heure.</span>
          </label>
        </>
      ) : (
        <p className="t-meta">
          Ton heure est déjà enregistrée. Tu peux la corriger depuis <a href="/memoire">« Ce qu’Anam retient »</a>.
        </p>
      )}

      {demanderLieu ? (
        <>
        <label htmlFor="recherche_lieu" className={s.etiquette}>
          <span className="t-meta">Ta commune de naissance</span>
          {/* `libelle` dans le champ une fois choisie (« Saint-Denis (93) »), jamais `nom` seul :
              c'est ce qu'elle a choisi qu'elle relit avant de confirmer un geste irréversible. */}
          <input
            id="recherche_lieu"
            type="text"
            autoComplete="off"
            className={s.champ}
            value={choisi ? choisi.libelle : requete}
            role="combobox"
            aria-expanded={resultats.length > 0}
            aria-controls={idListe}
            aria-describedby="lieu_aide"
            onChange={(e) => {
              setChoisi(null);
              setRequete(e.target.value);
            }}
          />
          <span id="lieu_aide" className="t-meta">
            Choisis-la dans la liste. Le référentiel couvre la France.
          </span>
        </label>

        {/* Le CODE seul est posté : le serveur re-résout les coordonnées lui-même (voir `actions.ts`). */}
        <input type="hidden" name="code_lieu" value={choisi?.code ?? ""} />

        {resultats.length > 0 && (
          <ul id={idListe} className={s.resultats}>
            {resultats.map((l) => (
              <li key={l.code}>
                {/* `libelle`, pas `nom` (2026-09-01) : deux « Saint-Denis » sont deux lignes
                    différentes, et c'est le `code` de CELLE-CI qui part avec le clic. */}
                <button
                  type="button"
                  className={s.resultat}
                  onClick={() => {
                    setChoisi(l);
                    setResultats([]);
                  }}
                >
                  {l.libelle}
                </button>
              </li>
            ))}
          </ul>
        )}
        </>
      ) : (
        <p className="t-meta">Ta commune est déjà enregistrée : {deja.lieu}.</p>
      )}

      {/* AC8 — le poids du geste, dit AVANT. Le patron est celui de la confirmation solennelle du
          rayonnement (Story 4.7) : on ne découvre pas après coup qu'on s'est engagé.

          ⚠️ LA PHRASE A CHANGÉ AVEC LA 6.5b. Elle disait « ne pourra plus être modifié » — c'était
          vrai jusqu'à la migration 0060, qui a ouvert la correction de l'heure (art. 16). Faire
          cocher une case qui affirme une impossibilité levée n'est pas une formalité inoffensive :
          c'est faire renoncer d'avance à un droit. Le LIEU, lui, reste write-once, et c'est
          exactement ce que la phrase dit maintenant — ni plus, ni moins.

          RACCOURCIE le 2026-09-01, sans rien retirer de vrai : les deux faits (commune figée, heure
          corrigeable) tiennent en une ligne. */}
      <label htmlFor="confirmation" className={s.case}>
        <input
          id="confirmation"
          name="confirmation"
          type="checkbox"
          value="oui"
          required
          className={s.checkbox}
        />
        <span className="t-corps">
          J’ai vérifié. Ma commune ne se change plus ; mon heure reste corrigeable.
        </span>
      </label>

      {etat.statut === "erreur" && etat.message ? (
        <p className={s.erreur} role="alert">
          {etat.message}
        </p>
      ) : null}

      {/* Le bouton n'ouvre que sur un envoi qui a quelque chose à écrire : la commune si elle
          manque encore, et une heure OU sa déclaration d'absence si l'heure manque encore.

          LE GROS BOUTON (2026-09-01) : pleine largeur, plus haut, et un libellé qui dit ce que le
          geste OUVRE (« Compléter mon ciel ») plutôt que ce que la base fait (« Enregistrer »). Il
          reste fermé exactement dans les mêmes cas, et il dit toujours pourquoi (T18, ci-dessous). */}
      <button
        type="submit"
        className={`${s.bouton} ${s.boutonPrincipal}`}
        disabled={enCours || bloque}
        aria-describedby={motifBlocage ? "motif-blocage-heure" : undefined}
      >
        <span className={`t-bouton ${s.libellePrincipal}`}>{enCours ? "…" : "Compléter mon ciel"}</span>
      </button>

      {/* QA tour 1 (T18) — LE MOTIF DU BLOCAGE EST ÉCRIT EN TOUTES LETTRES.
          « Zzzzville-sur-Néant » tapé sans rien choisir dans la liste laissait un formulaire
          d'apparence rempli et un bouton mort, sans un mot. C'est le patron déjà posé par l'écran
          de consentement (1.5, AC3) : un état désactivé ne dit jamais POURQUOI, et un bouton qui ne
          répond pas se lit comme une panne du produit, pas comme une saisie à finir. */}
      {motifBlocage ? (
        <p id="motif-blocage-heure" className="t-meta" aria-live="polite">
          {motifBlocage}
        </p>
      ) : null}
    </form>
  );
}
