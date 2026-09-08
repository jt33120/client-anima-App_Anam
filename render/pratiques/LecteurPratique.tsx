"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BoutonLotus from "@/render/BoutonLotus";
import type { PratiqueVue } from "./types";
import s from "./pratiques.module.css";

function Minuteur({ duree }: { readonly duree: number }) {
  const [reste, setReste] = useState(duree);
  const [actif, setActif] = useState(false);
  const restant = useRef(duree);

  useEffect(() => {
    if (!actif) return;
    const fin = Date.now() + restant.current * 1000;
    let frame = 0;
    const actualiser = () => {
      const secondes = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      if (secondes !== restant.current) {
        restant.current = secondes;
        setReste(secondes);
      }
      if (secondes === 0) setActif(false);
      else frame = window.requestAnimationFrame(actualiser);
    };
    frame = window.requestAnimationFrame(actualiser);
    return () => window.cancelAnimationFrame(frame);
  }, [actif]);

  return (
    <div className={s.minuteur}>
      <p className={`t-meta ${s.secondaire}`}>Un repère de temps, si tu le souhaites</p>
      <span role="timer" aria-label="Temps restant" aria-live="off" className={`t-titre ${s.temps}`}>
        {Math.floor(reste / 60)}:{String(reste % 60).padStart(2, "0")}
      </span>
      <div className={s.actions}>
        {reste > 0 && <button type="button" className={s.commande} onClick={() => setActif(!actif)}>
          {actif ? "Mettre en pause" : reste === duree ? "Lancer le minuteur" : "Reprendre le minuteur"}
        </button>}
        {reste < duree && <button type="button" className={s.commande} onClick={() => {
          setActif(false);
          restant.current = duree;
          setReste(duree);
        }}>Réinitialiser</button>}
      </div>
      {reste === 0 && <p role="status" className={`t-meta ${s.secondaire}`}>Le temps proposé est écoulé. Tu choisis quand continuer.</p>}
    </div>
  );
}

export default function LecteurPratique({ pratique }: { readonly pratique: PratiqueVue }) {
  const [phase, setPhase] = useState<"accueil" | "en-cours" | "terminee" | "arretee">("accueil");
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const titre = useRef<HTMLHeadingElement>(null);
  const etapes = pratique.etapes ?? [];
  const etape = etapes[index];

  useEffect(() => {
    if (phase !== "accueil") titre.current?.focus();
  }, [phase, index]);

  useEffect(() => {
    const effacerNote = () => setNote("");
    window.addEventListener("pagehide", effacerNote);
    window.addEventListener("pageshow", effacerNote);
    return () => {
      window.removeEventListener("pagehide", effacerNote);
      window.removeEventListener("pageshow", effacerNote);
    };
  }, []);

  if (pratique.type !== "exercice" || etapes.length === 0) {
    return <p className="t-corps">Cette pratique ne contient pas d’étapes guidées. <Link href="/pratiques" className={s.lien}>Revenir aux pratiques</Link></p>;
  }

  return (
    <div className={s.lecteur}>
      {phase === "accueil" && (
        <section className={s.panneau} aria-labelledby="avant-pratique">
          <p className={`t-meta ${s.secondaire}`}>Environ {pratique.dureeMinutes} min · {etapes.length} étapes</p>
          <h2 className="t-titre-sm" id="avant-pratique">Un moment pour toi</h2>
          <p className="t-corps">Installe-toi dans un endroit où tu peux t’arrêter quelques instants. Tu gardes la main sur chaque étape.</p>
          <p className={`t-corps ${s.secondaire}`}>{pratique.precaution}</p>
          <BoutonLotus onClick={() => setPhase("en-cours")}>Commencer</BoutonLotus>
        </section>
      )}
      {phase === "en-cours" && etape && (
        <section className={s.panneau} aria-labelledby="etape-pratique">
          <div className={s.enteteEtape}>
            <p className={`t-meta ${s.secondaire}`}>Étape {index + 1} sur {etapes.length}</p>
            <button type="button" className={s.commande} onClick={() => { setNote(""); setPhase("arretee"); }}>Arrêter l’exercice</button>
          </div>
          <h2 ref={titre} tabIndex={-1} className={`t-titre-sm ${s.titreEtape}`} id="etape-pratique">{etape.titre}</h2>
          <p className={`t-corps ${s.consigne}`}>{etape.consigne}</p>
          {etape.dureeSecondes !== undefined && etape.dureeSecondes > 0 && <Minuteur key={index} duree={etape.dureeSecondes} />}
          <div className={s.actions}>
            {index > 0 && <button type="button" className={s.commande} onClick={() => setIndex(index - 1)}>Étape précédente</button>}
            <BoutonLotus onClick={() => index + 1 < etapes.length ? setIndex(index + 1) : setPhase("terminee")}>
              {index + 1 < etapes.length ? "Étape suivante" : "Terminer l’exercice"}
            </BoutonLotus>
          </div>
          <p className={`t-meta ${s.secondaire}`}>Tu peux passer à la suite quand tu veux, avec ou sans minuteur.</p>
        </section>
      )}
      {(phase === "terminee" || phase === "arretee") && (
        <section className={s.panneau} aria-labelledby="fin-pratique">
          <h2 ref={titre} tabIndex={-1} className={`t-titre-sm ${s.titreEtape}`} id="fin-pratique">
            {phase === "terminee" ? "Prends le temps de revenir" : "Tu peux t’arrêter là"}
          </h2>
          <p className={`t-corps ${s.secondaire}`}>{phase === "terminee" ? "Observe simplement comment tu te sens maintenant, sans chercher un résultat particulier." : "Regarde autour de toi et retrouve un appui confortable. Tu n’as rien à rattraper."}</p>
          {phase === "terminee" && <div className={s.reflexion}>
            <label className="t-corps" htmlFor="note-pratique">Un mot pour toi, si tu en as envie</label>
            <textarea id="note-pratique" className={s.note} value={note} maxLength={2000} rows={4} onChange={(event) => setNote(event.target.value)} aria-describedby="note-privee" autoComplete="off" />
            <p id="note-privee" className={`t-meta ${s.secondaire}`}>Ces mots ne sont pas enregistrés ni transmis à Anam.</p>
          </div>}
          <div className={s.actions}>
            <a className={s.lien} href={`/?pratique=${encodeURIComponent(pratique.id)}`}>En parler à Anam <span aria-hidden>→</span></a>
            <Link className={s.lien} href="/pratiques">Voir les pratiques</Link>
          </div>
        </section>
      )}
      {phase !== "accueil" && <p className={`t-meta ${s.secondaire}`}>{pratique.precaution}</p>}
      <details className={s.sources}>
        <summary className={s.commande}>Sources et repères</summary>
        <p className={`t-meta ${s.secondaire}`}>Consignes originales écrites pour Anam. Les sources décrivent les méthodes générales ; ce format court n’a pas été évalué comme accompagnement médical.</p>
        <ul>
          {pratique.sources.map((source) => <li key={source.url}><a href={source.url} className={s.lien} target="_blank" rel="noopener noreferrer">{source.titre} <span className="t-meta">(nouvel onglet)</span></a></li>)}
        </ul>
      </details>
    </div>
  );
}
