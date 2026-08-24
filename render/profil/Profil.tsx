"use client";

import Link from "next/link";
import { useActionState } from "react";
import s from "./profil.module.css";

/**
 * Profil — LA HALTE « PROFIL » (retour du 2026-08-23). Rendu MUET (AD-7).
 *
 * ⚠️ CE N'EST PAS UN TABLEAU DE BORD. Aucun chiffre, aucune jauge, aucun état de compte affiché :
 * FR-031 vaut sur cette page comme ailleurs. Un profil est l'endroit où l'on va CHANGER quelque
 * chose ; s'y regarder n'est pas un service qu'on rend.
 *
 * Toute la copie arrive par propriété — `render/` n'a pas le droit d'importer `lib/domain`
 * (AD-7/AD-10). Le composant ne décide ni l'ordre des entrées, ni leur présence, ni les libellés.
 */

export interface EntreeProfilVue {
  readonly titre: string;
  readonly quoi: string;
  readonly url: string;
}

export interface EtatNom {
  readonly statut: "repos" | "ok" | "erreur";
  readonly message?: string;
}

export interface ProprietesProfil {
  readonly titre: string;
  readonly introduction: string;
  readonly sectionNom: string;
  readonly nomDescription: string;
  readonly nomPrevient: string;
  readonly labelPrenom: string;
  readonly labelNomComplet: string;
  readonly aideNomComplet: string;
  readonly actionEnregistrer: string;
  readonly prenom: string;
  readonly nomComplet: string;
  readonly entrees: readonly EntreeProfilVue[];
  readonly urlRetour: string;
  readonly enregistrer: (precedent: EtatNom, donnees: FormData) => Promise<EtatNom>;
}

export default function Profil(p: ProprietesProfil) {
  const [etat, action, enCours] = useActionState(p.enregistrer, { statut: "repos" } as EtatNom);

  return (
    <main className={s.page}>
      <article className={s.contenu}>
        <Link className={s.retour} href={p.urlRetour}>
          <span className="t-meta">← Revenir</span>
        </Link>

        <p className="t-surtitre">Anam</p>
        <h1 className="t-titre">{p.titre}</h1>
        <p className="t-corps">{p.introduction}</p>

        <section className={s.section} aria-label={p.sectionNom}>
          <h2 className="t-titre-sm">{p.sectionNom}</h2>
          <p className="t-corps">{p.nomDescription}</p>

          <form action={action} className={s.section}>
            <label className={s.ligne}>
              <span className="t-meta">{p.labelPrenom}</span>
              <input className={s.champ} name="prenom" defaultValue={p.prenom} maxLength={100} required />
            </label>
            <label className={s.ligne}>
              <span className="t-meta">{p.labelNomComplet}</span>
              <input className={s.champ} name="nom_complet" defaultValue={p.nomComplet} maxLength={200} />
              <span className={`t-meta ${s.entreeQuoi}`}>{p.aideNomComplet}</span>
            </label>
            {/* ⚠️ L'AVERTISSEMENT EST AVANT LE BOUTON, PAS APRÈS. Changer le nom complet recalcule
                trois cartes de l'accueil : quelqu'un qui corrige une faute de frappe les verrait
                changer sans comprendre pourquoi, et croirait à une panne. */}
            <p className={`t-meta ${s.retourAction}`}>{p.nomPrevient}</p>
            <button className={s.enregistrer} type="submit" disabled={enCours}>
              <span className="t-bouton">{p.actionEnregistrer}</span>
            </button>
            {/* Une phrase, jamais une pastille verte ni une coche animée : le produit ne félicite
                personne d'avoir rempli un champ. `aria-live` pour que le retour soit ENTENDU. */}
            <p className={`t-meta ${s.retourAction}`} aria-live="polite">
              {etat.statut === "repos" ? "" : etat.message}
            </p>
          </form>
        </section>

        <section className={s.section} aria-label="Réglages">
          <div className={s.entrees}>
            {p.entrees.map((e) => (
              <Link className={s.entree} href={e.url} key={e.url}>
                <span className={`t-corps ${s.entreeTitre}`}>{e.titre}</span>
                <span className={`t-meta ${s.entreeQuoi}`}>{e.quoi}</span>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
