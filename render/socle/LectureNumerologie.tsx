"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LectureNumerologieVue } from "./lecture-numerologie-types";
import s from "./lecture-numerologie.module.css";

type Phase = "chargement" | "repos" | "creation" | "enregistrement";
class ErreurLecture extends Error {}
const PERTINENCE = ["Pas du tout", "Peu", "En partie", "Beaucoup", "Tout à fait"];

export default function LectureNumerologie() {
  const [lecture, setLecture] = useState<LectureNumerologieVue | null>(null);
  const [phase, setPhase] = useState<Phase>("chargement");
  const [cacheLu, setCacheLu] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const requete = useRef<AbortController | null>(null);

  const envoyer = useCallback(async (method: "GET" | "POST" | "PATCH", corps?: unknown) => {
    if (requete.current) return;
    const controle = new AbortController();
    requete.current = controle;
    const delai = setTimeout(() => controle.abort(), 70_000);
    setPhase(method === "GET" ? "chargement" : method === "POST" ? "creation" : "enregistrement");
    setErreur(null);
    setConfirmation("");
    try {
      const reponse = await fetch("/api/numerologie", {
        method, cache: "no-store", signal: controle.signal,
        ...(method === "GET" ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps ?? {}) }),
      });
      const resultat = await reponse.json();
      if (!reponse.ok) {
        // A stale or forbidden portrait must disappear along with its sharing controls.
        if (resultat.code === "lecture_perimee" || reponse.status === 401 || reponse.status === 403) {
          setLecture(null);
          setCacheLu(false);
        }
        throw new ErreurLecture(resultat.message ?? "Ta lecture n’a pas pu être chargée. Réessaie.");
      }
      setLecture(resultat.lecture);
      setCacheLu(true);
      if (method === "PATCH") setConfirmation(resultat.lecture?.partageAnam
        ? "Ce portrait est maintenant partagé avec Anam."
        : "Ton choix est enregistré. Ce portrait n’est pas partagé avec Anam.");
    } catch (e) {
      if (requete.current !== controle) return;
      if (method === "PATCH") {
        // The write may have committed even when its response was lost.
        setLecture(null);
        setCacheLu(false);
        setErreur("L’enregistrement de ton choix n’a pas pu être confirmé. Recharge la lecture pour vérifier son état.");
        return;
      }
      setErreur(e instanceof ErreurLecture ? e.message : "La lecture n’a pas pu être chargée. Vérifie ta connexion et réessaie.");
    } finally {
      clearTimeout(delai);
      if (requete.current === controle) {
        requete.current = null;
        setPhase("repos");
      }
    }
  }, []);

  useEffect(() => {
    void envoyer("GET");
    return () => { const active = requete.current; requete.current = null; active?.abort(); };
  }, [envoyer]);

  const occupe = phase !== "repos";
  function noter(note: number) {
    if (!lecture) return;
    void envoyer("PATCH", { id: lecture.id, note, partagerAnam: note === 5 && lecture.partageAnam });
  }

  return (
    <div className={s.lectures} aria-busy={occupe}>
      <section className={s.bloc} aria-labelledby="numerologie-guidance">
        <p className={`t-surtitre ${s.mention}`}>Une lecture par IA</p>
        <h3 id="numerologie-guidance" className="t-titre-sm">{lecture ? `Ton année ${lecture.annee}, ton horizon` : "Ton année, ton horizon"}</h3>
        {lecture ? (
          <>
            <p className={`t-corps ${s.texte}`}>{lecture.guidanceAnnee}</p>
            <h4 className="t-surtitre">À plus long terme</h4>
            <p className={`t-corps ${s.texte}`}>{lecture.visionLongTerme}</p>
          </>
        ) : (
          <>
            <p className="t-corps">Relie ton chemin de vie à ton année personnelle : des pistes pour cette année et pour ce que tu souhaites construire dans la durée.</p>
            <p className={`t-meta ${s.mention}`}>L’IA reçoit uniquement tes nombres et l’année. Cette lecture symbolique invite à réfléchir ; elle ne prédit pas ton avenir et ne décrit pas ta personnalité comme un fait.</p>
            {cacheLu && <button className={s.bouton} disabled={occupe} onClick={() => void envoyer("POST")}>
              {phase === "creation" ? "Création de ta lecture…" : "Créer ma lecture"}
            </button>}
          </>
        )}
      </section>

      {lecture && (
        <section className={s.bloc} aria-labelledby="numerologie-portrait">
          <h3 id="numerologie-portrait" className="t-titre-sm">Ce que tes nombres évoquent de toi</h3>
          <p className={`t-meta ${s.mention}`}>Un portrait symbolique proposé par l’IA, à confronter à ce que tu vis. Seule ton expérience peut le confirmer ou le nuancer.</p>
          <p className={`t-corps ${s.texte}`}>{lecture.portrait}</p>
          <fieldset className={s.questionnaire} disabled={occupe} aria-describedby="numerologie-partage-aide">
            <legend className="t-corps">Ce portrait te ressemble-t-il ?</legend>
            <div className={s.etoiles}>
              {PERTINENCE.map((libelle, i) => (
                <label key={libelle} className={`${s.etoile} ${lecture.note === i + 1 ? s.choisie : ""}`}>
                  <input type="radio" name="pertinence-numerologie" value={i + 1} checked={lecture.note === i + 1}
                    aria-label={`${i + 1} sur 5 : ${libelle}`} onChange={() => noter(i + 1)} />
                  <span aria-hidden="true" className={lecture.note !== null && i < lecture.note ? s.remplie : ""}>★</span>
                </label>
              ))}
            </div>
            <p className={`t-meta ${s.mention}`}>{lecture.note === null ? "1 : pas du tout · 5 : tout à fait" : `${lecture.note}/5 · ${PERTINENCE[lecture.note - 1]}`}</p>
          </fieldset>
          <p id="numerologie-partage-aide" className={`t-meta ${s.mention}`}>À 5 étoiles, tu peux choisir de confier ce portrait à Anam pour enrichir vos échanges. La note seule ne le partage pas. Une note plus basse retire le partage.</p>
          {lecture.partageAnam ? (
            <>
              <p className="t-meta">Ce portrait est partagé avec Anam comme une piste, pas comme un fait sur toi.</p>
              <button className={s.bouton} disabled={occupe} onClick={() => void envoyer("PATCH", { id: lecture.id, note: lecture.note, partagerAnam: false })}>Retirer le partage avec Anam</button>
            </>
          ) : lecture.note === 5 ? (
            <button className={s.bouton} disabled={occupe} onClick={() => void envoyer("PATCH", { id: lecture.id, note: 5, partagerAnam: true })}>Confier ce portrait à Anam</button>
          ) : null}
        </section>
      )}

      <div role="status" className={`t-meta ${s.statut}`}>
        {phase === "chargement" ? "Chargement de ta lecture…" : phase === "creation" ? "Préparation de tes deux lectures…" : phase === "enregistrement" ? "Enregistrement de ton choix…" : confirmation}
      </div>
      {erreur && <p role="alert" className="t-corps">{erreur}</p>}
      {!cacheLu && phase === "repos" && <button className={s.bouton} onClick={() => void envoyer("GET")}>Recharger ma lecture</button>}
    </div>
  );
}
