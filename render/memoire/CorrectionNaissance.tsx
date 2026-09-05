"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./memoire.module.css";

export interface CopieCorrection {
  readonly titre: string;
  readonly introduction: string;
  readonly etiquetteDate: string;
  readonly etiquetteHeure: string;
  readonly aideHeure: string;
  readonly etiquetteLieu: string;
  readonly aideLieu: string;
  readonly lieuInvalide: string;
  readonly indisponible: string;
  readonly voir: string;
  readonly confirmer: string;
  readonly renoncer: string;
  readonly corrige: string;
  readonly dejaCorrigee: string | null;
  readonly refusRevocation: string | null;
}

export interface LieuCorrectionVue {
  readonly code: string;
  readonly libelle: string;
  readonly departement: { readonly nom: string };
}

export interface DemandeCorrectionVue {
  readonly date: string;
  readonly heure: string;
  readonly codeLieu: string;
}

export interface CorrectionConfirmeeVue extends DemandeCorrectionVue {
  readonly revision: string;
}

export type ReponseApercu =
  | {
      readonly statut: "apercu";
      readonly correction: CorrectionConfirmeeVue;
      readonly resume: { readonly date: string; readonly heure: string | null; readonly lieu: string };
      readonly phrases: readonly string[];
    }
  | { readonly statut: "erreur"; readonly message: string };

export type ReponseEcriture =
  | { readonly statut: "ok" }
  | { readonly statut: "erreur"; readonly message: string };

export default function CorrectionNaissance({
  copie,
  dateActuelle,
  heureActuelle,
  lieuActuel,
  chercherLieux,
  apercevoir,
  confirmer,
}: {
  readonly copie: CopieCorrection;
  readonly dateActuelle: string;
  readonly heureActuelle: string | null;
  readonly lieuActuel: string | null;
  readonly chercherLieux: (requete: string) => Promise<readonly LieuCorrectionVue[]>;
  readonly apercevoir: (demande: DemandeCorrectionVue) => Promise<ReponseApercu>;
  readonly confirmer: (correction: CorrectionConfirmeeVue) => Promise<ReponseEcriture>;
}) {
  const router = useRouter();
  const [date, setDate] = useState(dateActuelle);
  const [heure, setHeure] = useState(heureActuelle ?? "");
  const [requeteLieu, setRequeteLieu] = useState("");
  const [codeLieu, setCodeLieu] = useState("");
  const [lieux, setLieux] = useState<readonly LieuCorrectionVue[]>([]);
  const [indexLieuActif, setIndexLieuActif] = useState(-1);
  const [apercu, setApercu] = useState<Extract<ReponseApercu, { statut: "apercu" }> | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (codeLieu || requeteLieu.trim().length < 2) {
      setLieux([]);
      return;
    }
    let ignore = false;
    const attente = window.setTimeout(() => {
      void chercherLieux(requeteLieu)
        .then((resultats) => {
          if (!ignore) {
            setLieux(resultats);
            setIndexLieuActif(-1);
          }
        })
        .catch(() => {
          if (!ignore) {
            setLieux([]);
            setIndexLieuActif(-1);
            setErreur(copie.indisponible);
          }
        });
    }, 180);
    return () => {
      ignore = true;
      window.clearTimeout(attente);
    };
  }, [codeLieu, chercherLieux, requeteLieu]);

  const invaliderApercu = () => {
    setApercu(null);
    setErreur(null);
  };

  const choisirLieu = (lieu: LieuCorrectionVue) => {
    setCodeLieu(lieu.code);
    setRequeteLieu(lieu.libelle);
    setLieux([]);
    setIndexLieuActif(-1);
    invaliderApercu();
  };

  const demanderApercu = async () => {
    if (requeteLieu.trim() && !codeLieu) {
      setErreur(copie.lieuInvalide);
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await apercevoir({ date, heure, codeLieu });
      if (reponse.statut === "erreur") {
        setApercu(null);
        setErreur(reponse.message);
        return;
      }
      setApercu(reponse);
    } catch {
      setApercu(null);
      setErreur(copie.indisponible);
    } finally {
      setEnCours(false);
    }
  };

  const envoyer = async () => {
    if (!apercu) return;
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await confirmer(apercu.correction);
      if (reponse.statut === "erreur") {
        setErreur(reponse.message);
        return;
      }
      setFait(true);
      router.push("/socle?univers=astrologie");
      router.refresh();
    } catch {
      setErreur(copie.indisponible);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <section id="correction-naissance" className={s.section} aria-labelledby="correction_titre">
      <h2 id="correction_titre" className={s.titreSection}>{copie.titre}</h2>
      {copie.refusRevocation ? (
        <p className={s.refus}>{copie.refusRevocation}</p>
      ) : fait ? (
        <p className={s.introduction} role="status">{copie.corrige}</p>
      ) : (
        <>
          <p className={s.introduction}>{copie.introduction}</p>
          {copie.dejaCorrigee ? <p className={s.meta}>{copie.dejaCorrigee}</p> : null}

          <div className={s.champsNaissance}>
            <label htmlFor="date_corrigee" className={s.etiquette}>
              <span className="t-meta">{copie.etiquetteDate}</span>
              <input
                id="date_corrigee"
                type="date"
                className={s.champ}
                value={date}
                onChange={(event) => { setDate(event.target.value); invaliderApercu(); }}
              />
            </label>

            <label htmlFor="heure_corrigee" className={s.etiquette}>
              <span className="t-meta">{copie.etiquetteHeure}</span>
              <input
                id="heure_corrigee"
                type="time"
                className={s.champ}
                value={heure}
                aria-describedby="heure_corrigee_aide"
                onChange={(event) => { setHeure(event.target.value); invaliderApercu(); }}
              />
            </label>
            <span id="heure_corrigee_aide" className={s.meta}>{copie.aideHeure}</span>

            <label htmlFor="lieu_corrige" className={s.etiquette}>
              <span className="t-meta">{copie.etiquetteLieu}</span>
              <input
                id="lieu_corrige"
                type="search"
                autoComplete="off"
                className={s.champ}
                value={requeteLieu}
                placeholder={lieuActuel ? `Actuel : ${lieuActuel}` : undefined}
                aria-describedby="lieu_corrige_aide"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="lieu_corrige_suggestions"
                aria-expanded={lieux.length > 0}
                aria-activedescendant={
                  indexLieuActif >= 0 ? `lieu_corrige_option_${indexLieuActif}` : undefined
                }
                onKeyDown={(event) => {
                  if (lieux.length === 0) return;
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const pas = event.key === "ArrowDown" ? 1 : -1;
                    setIndexLieuActif((courant) =>
                      courant < 0
                        ? pas > 0 ? 0 : lieux.length - 1
                        : (courant + pas + lieux.length) % lieux.length,
                    );
                  } else if (event.key === "Enter" && indexLieuActif >= 0) {
                    event.preventDefault();
                    choisirLieu(lieux[indexLieuActif]);
                  } else if (event.key === "Escape") {
                    setLieux([]);
                    setIndexLieuActif(-1);
                  }
                }}
                onChange={(event) => {
                  setRequeteLieu(event.target.value);
                  setCodeLieu("");
                  setIndexLieuActif(-1);
                  invaliderApercu();
                }}
              />
            </label>
            <span id="lieu_corrige_aide" className={s.meta}>{copie.aideLieu}</span>
            {lieux.length > 0 ? (
              <ul
                id="lieu_corrige_suggestions"
                className={s.suggestionsLieu}
                role="listbox"
                aria-label="Communes proposées"
              >
                {lieux.map((lieu, index) => (
                  <li key={lieu.code}>
                    <button
                      type="button"
                      id={`lieu_corrige_option_${index}`}
                      role="option"
                      aria-selected={index === indexLieuActif}
                      tabIndex={-1}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => choisirLieu(lieu)}
                    >
                      <span>{lieu.libelle}</span>
                      <span className="t-meta">{lieu.departement.nom}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <span className={s.annonceHorsEcran} role="status" aria-live="polite">
              {lieux.length > 0 ? `${lieux.length} communes proposées.` : ""}
            </span>
          </div>

          {apercu ? (
            <div className={s.apercu} role="status">
              <p className="t-meta">
                Après correction : {apercu.resume.date} · {apercu.resume.heure?.slice(0, 5) ?? "heure inconnue"} · {apercu.resume.lieu}
              </p>
              <ul>
                {apercu.phrases.map((phrase) => <li key={phrase} className="t-corps">{phrase}</li>)}
              </ul>
            </div>
          ) : null}
          {erreur ? <p className={s.refus} role="alert">{erreur}</p> : null}

          <div className={s.actions}>
            {apercu ? (
              <>
                <button type="button" className={s.bouton} disabled={enCours} onClick={envoyer}>
                  <span className="t-bouton">{enCours ? "…" : copie.confirmer}</span>
                </button>
                <button
                  type="button"
                  className={s.bouton}
                  disabled={enCours}
                  onClick={() => { setApercu(null); setErreur(null); }}
                >
                  <span className="t-bouton">{copie.renoncer}</span>
                </button>
              </>
            ) : (
              <button type="button" className={s.bouton} disabled={enCours || !date} onClick={demanderApercu}>
                <span className="t-bouton">{enCours ? "…" : copie.voir}</span>
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
