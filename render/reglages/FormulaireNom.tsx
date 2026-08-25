"use client";

import { useActionState } from "react";
import s from "./reglages.module.css";

/**
 * FormulaireNom.tsx — CHANGER SON PRÉNOM ET SON NOM COMPLET (Story 7.3b).
 *
 * ⚠️ IL VIENT DE `/profil`, QUI A DISPARU LE 2026-08-25. Le menu de compte (Story 7.3) remplace
 * cette page ; son formulaire de nom, lui, n'existait NULLE PART ailleurs. Le supprimer avec elle
 * aurait retiré le seul moyen de corriger son prénom — une fonctionnalité perdue par déplacement.
 *
 * `EXPERIENCE.md` ligne 77 désigne Réglages comme le lieu du prénom depuis le 2026-07-21 : ce
 * déménagement rejoint la spécification, il ne l'arrange pas.
 *
 * Rendu MUET (AD-7) : toute la copie arrive par propriété, l'action aussi.
 */

export interface EtatNom {
  readonly statut: "repos" | "ok" | "erreur";
  readonly message?: string;
}

export interface ProprietesFormulaireNom {
  readonly section: string;
  readonly description: string;
  readonly labelPrenom: string;
  readonly labelNomComplet: string;
  readonly aideNomComplet: string;
  readonly previent: string;
  readonly actionEnregistrer: string;
  readonly prenom: string;
  readonly nomComplet: string;
  readonly enregistrer: (precedent: EtatNom, donnees: FormData) => Promise<EtatNom>;
}

export default function FormulaireNom(p: ProprietesFormulaireNom) {
  const [etat, action, enCours] = useActionState(p.enregistrer, { statut: "repos" } as EtatNom);

  return (
    <section className={s.section} aria-label={p.section}>
      <h2 className={`t-titre-sm ${s.titre}`}>{p.section}</h2>
      <p className={`t-corps ${s.description}`}>{p.description}</p>

      <form action={action} className={s.section}>
        <label className={s.champHeure}>
          <span className="t-meta">{p.labelPrenom}</span>
          <input className={s.select} name="prenom" defaultValue={p.prenom} maxLength={100} required />
        </label>
        <label className={s.champHeure}>
          <span className="t-meta">{p.labelNomComplet}</span>
          <input className={s.select} name="nom_complet" defaultValue={p.nomComplet} maxLength={200} />
          <span className={`t-meta ${s.description}`}>{p.aideNomComplet}</span>
        </label>

        {/* ⚠️ L'AVERTISSEMENT EST AVANT LE BOUTON, PAS APRÈS. Changer le nom complet recalcule trois
            des six nombres : quelqu'un qui corrige une faute de frappe les verrait changer sans
            comprendre pourquoi, et croirait à une panne. */}
        <p className={`t-meta ${s.message}`}>{p.previent}</p>

        <button className={s.bouton} type="submit" disabled={enCours}>
          <span className="t-bouton">{p.actionEnregistrer}</span>
        </button>

        {/* Une phrase, jamais une pastille verte ni une coche animée : le produit ne félicite
            personne d'avoir rempli un champ. `aria-live` pour que le retour soit ENTENDU. */}
        <p className={`t-meta ${s.message}`} aria-live="polite">
          {etat.statut === "repos" ? "" : etat.message}
        </p>
      </form>
    </section>
  );
}
