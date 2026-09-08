"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import BoutonLotus from "../BoutonLotus";
import type { PratiqueParcoursVue, ReperesParcoursVue, SuiviParcoursVue } from "./types";
import s from "./parcours.module.css";

const REPERES_VIDES: ReperesParcoursVue = { ceQuiCompte: "", ceQuiAide: "", aRespecter: "" };
const CHAMPS = [
  { cle: "ceQuiCompte", titre: "Ce qui compte pour moi", aide: "Tes envies, tes priorités, ce que tu souhaites explorer." },
  { cle: "ceQuiAide", titre: "Ce qui m’aide", aide: "Tes ressources, les gestes et les personnes qui te soutiennent." },
  { cle: "aRespecter", titre: "Ce que je souhaite respecter", aide: "Ton rythme, tes limites, les sujets à laisser de côté." },
] as const;

function dateLisible(date: string): string {
  const valeur = new Date(date);
  return Number.isNaN(valeur.valueOf()) ? "Date indisponible" : valeur.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

/** Le serveur livre le même contrat que la projection initiale. Une réponse incomplète reste une panne. */
function lireReponse(brut: unknown): SuiviParcoursVue | null | undefined {
  if (!brut || typeof brut !== "object") return undefined;
  const reponse = brut as { statut?: unknown; suivi?: Partial<SuiviParcoursVue> | null };
  if (reponse.statut === "absent" && reponse.suivi === null) return null;
  const suivi = reponse.suivi;
  if (reponse.statut !== "disponible" || !suivi || !Number.isInteger(suivi.revision) || typeof suivi.pause !== "boolean" || typeof suivi.cap !== "string" || typeof suivi.synthese !== "string" || !suivi.reperes || !CHAMPS.every(({ cle }) => typeof suivi.reperes?.[cle] === "string") || !Array.isArray(suivi.etapes) || !Array.isArray(suivi.evenements)) return undefined;
  return suivi as SuiviParcoursVue;
}

export default function Parcours({ initial, pratiques, compteAttendu }: {
  readonly initial: SuiviParcoursVue | null;
  readonly pratiques: readonly PratiqueParcoursVue[];
  readonly compteAttendu: string;
}) {
  const [suivi, setSuivi] = useState(initial);
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState<ReperesParcoursVue>(initial?.reperes ?? REPERES_VIDES);
  const [attente, setAttente] = useState<"reperes" | "pause" | "actualiser" | null>(null);
  const [erreur, setErreur] = useState("");
  const [annonce, setAnnonce] = useState("");
  const [conflit, setConflit] = useState(false);
  const [aComparer, setAComparer] = useState<Partial<ReperesParcoursVue>>({});
  const [messagePour, setMessagePour] = useState<"reperes" | "pause">("reperes");
  const [sessionModifiee, setSessionModifiee] = useState(false);
  const verrou = useRef(false);
  const premierChamp = useRef<HTMLTextAreaElement>(null);
  const titreReperes = useRef<HTMLHeadingElement>(null);
  const aDesReperes = CHAMPS.some(({ cle }) => suivi?.reperes[cle]);
  const comparaisonRequise = Object.keys(aComparer).length > 0;

  async function requete(action: "reperes" | "pause" | "actualiser") {
    if (verrou.current || sessionModifiee) return;
    if (action === "reperes" && (conflit || comparaisonRequise)) return;
    verrou.current = true;
    setAttente(action);
    if (action !== "actualiser") setMessagePour(action);
    setErreur("");
    setAnnonce("");
    const controle = new AbortController();
    const delai = window.setTimeout(() => controle.abort(), 20_000);
    try {
      const corps = action === "reperes"
        ? { action, revision: suivi?.revision ?? 0, reperes: brouillon }
        : { action, revision: suivi?.revision ?? 0, pause: !suivi?.pause };
      const reponse = await fetch("/api/anam/suivi", action === "actualiser"
        ? { cache: "no-store", headers: { "X-Anam-Compte": compteAttendu }, signal: controle.signal }
        : { method: "POST", headers: { "Content-Type": "application/json", "X-Anam-Compte": compteAttendu }, body: JSON.stringify(corps), signal: controle.signal });
      const brut: unknown = await reponse.json();
      if (!reponse.ok) {
        if (brut && typeof brut === "object" && "code" in brut && brut.code === "session_modifiee") {
          setSessionModifiee(true);
          setConflit(false);
          setErreur("La session a changé. Recharge la page pour retrouver le compte actuellement ouvert. Ces modifications ne seront pas envoyées à ce compte.");
        } else if (reponse.status === 409) {
          setConflit(true);
          setErreur("Ton parcours a changé depuis son ouverture. Actualise la version enregistrée avant de reprendre. Tes modifications restent ici.");
        } else {
          setErreur(reponse.status === 403 ? "Cette modification n’est pas disponible pour le moment. Tes mots restent ici." : "La modification n’a pas pu être enregistrée. Tes mots restent ici, tu peux réessayer.");
        }
        return;
      }
      const nouveau = lireReponse(brut);
      if (nouveau === undefined) throw new Error("suivi_incomplet");
      setSuivi(nouveau);
      setConflit(false);
      if (action === "reperes") {
        setEdition(false);
        setBrouillon(nouveau?.reperes ?? REPERES_VIDES);
        setAComparer({});
        setAnnonce("Tes repères ont été enregistrés.");
        requestAnimationFrame(() => titreReperes.current?.focus());
      } else if (action === "pause") {
        setAnnonce(nouveau?.pause ? "Ton parcours est en pause." : "Ton parcours peut reprendre avec Anam.");
      } else {
        const enregistres = nouveau?.reperes ?? REPERES_VIDES;
        const differences = edition ? Object.fromEntries(CHAMPS.filter(({ cle }) => enregistres[cle] !== brouillon[cle]).map(({ cle }) => [cle, enregistres[cle]])) : {};
        setAComparer(differences);
        setAnnonce(Object.keys(differences).length
          ? "Ton parcours est à jour. Pour chaque repère différent, compare les deux textes puis choisis la version à garder avant d’enregistrer."
          : "La version enregistrée est à jour.");
      }
    } catch {
      setErreur("Ton parcours n’a pas pu être actualisé. Tes mots restent ici, tu peux réessayer.");
    } finally {
      window.clearTimeout(delai);
      verrou.current = false;
      setAttente(null);
    }
  }

  function modifier() {
    if (sessionModifiee) return;
    setBrouillon(suivi?.reperes ?? REPERES_VIDES);
    setAComparer({});
    setEdition(true);
    setAnnonce("");
    setErreur("");
    // Le focus suit le geste d’ouverture une fois le champ monté.
    requestAnimationFrame(() => premierChamp.current?.focus());
  }

  function enregistrer(event: FormEvent) {
    event.preventDefault();
    void requete("reperes");
  }

  function choisirVersion(cle: keyof ReperesParcoursVue, version: "brouillon" | "enregistree") {
    if (sessionModifiee) return;
    if (version === "enregistree") setBrouillon((b) => ({ ...b, [cle]: aComparer[cle] ?? "" }));
    setAComparer((comparaisons) => {
      const restantes = { ...comparaisons };
      delete restantes[cle];
      return restantes;
    });
    requestAnimationFrame(() => document.getElementById(`repere-${cle}`)?.focus());
  }

  const messages = <>
    {erreur && <p className={`t-corps ${s.message}`} role="alert">{erreur}</p>}
    {conflit && <BoutonLotus attente={attente === "actualiser"} disabled={attente !== null} onClick={() => void requete("actualiser")}>Actualiser la version enregistrée</BoutonLotus>}
    {sessionModifiee && <BoutonLotus onClick={() => window.location.reload()}>Recharger la page</BoutonLotus>}
    <p className={`t-corps ${s.secondaire}`} role="status" aria-live="polite">{annonce}</p>
  </>;

  return <div className={s.corps}>
    <section className={`${s.section} ${s.cap}`} aria-labelledby="cap-parcours">
      <p className={`t-meta ${s.secondaire}`}>{suivi?.pause ? "En pause, à ta demande" : "Avec Anam, à ton rythme"}</p>
      <h2 className={`t-titre-sm ${s.mots}`} id="cap-parcours">{suivi?.cap || "Un premier cap à poser"}</h2>
      <p className={`t-corps ${s.mots}`}>{suivi?.synthese || "Ton parcours peut commencer par ce qui compte pour toi aujourd’hui. Anam t’aide à trouver une direction et un premier pas, puis à les ajuster."}</p>
      {suivi?.pause && <p className={`t-corps ${s.secondaire}`}>Anam garde le cap et les étapes en l’état jusqu’à ce que tu choisisses de reprendre. Tu peux continuer à échanger et à explorer les pratiques.</p>}
      <div className={s.actions}>
        <a className={s.lien} href={suivi?.cap ? "/?parcours=ajuster" : "/?parcours=commencer"}>{suivi?.cap ? "Ajuster avec Anam" : "Poser un premier cap avec Anam"}</a>
        <BoutonLotus attente={attente === "pause"} disabled={attente !== null || conflit || sessionModifiee} onClick={() => void requete("pause")}>{suivi?.pause ? "Reprendre mon parcours" : "Mettre mon parcours en pause"}</BoutonLotus>
      </div>
      {messagePour === "pause" && messages}
    </section>

    <section className={s.section} aria-labelledby="etapes-parcours">
      <h2 className="t-titre-sm" id="etapes-parcours">Mes prochains pas</h2>
      {suivi?.etapes.length ? <ol className={s.etapes}>{suivi.etapes.map((etape, index) => {
        const pratique = pratiques.find((p) => p.id === etape.pratiqueId);
        return <li className={s.etape} key={etape.id}>
          <p className={`t-meta ${s.secondaire}`}>{index === 0 ? "À explorer maintenant" : "Pour la suite"}</p>
          <h3 className={`t-titre-sm ${s.mots}`}>{etape.titre}</h3>
          {pratique && <Link className={s.lien} href={pratique.href}>Ouvrir : {pratique.titre}</Link>}
        </li>;
      })}</ol> : <p className={`t-corps ${s.secondaire}`}>Les prochains pas apparaîtront ici lorsque vous les aurez définis dans la conversation.</p>}
      <div className={s.actions}>
        <a className={s.lien} href="/?parcours=faire_point">Faire le point avec Anam</a>
        <Link className={s.lien} href="/pratiques">Choisir une pratique</Link>
      </div>
    </section>

    <section className={s.section} aria-labelledby="reperes-parcours">
      <h2 className={`t-titre-sm ${s.titreSection}`} id="reperes-parcours" tabIndex={-1} ref={titreReperes}>Mes repères pour Anam</h2>
      <p className={`t-corps ${s.secondaire}`}>Ces mots sont les tiens. Ils sont conservés pour aider Anam dans vos échanges. Toi seule peux les modifier ou les effacer.</p>
      {edition ? <form className={s.formulaire} onSubmit={enregistrer}>
        {comparaisonRequise && <p className={`t-corps ${s.message}`}>Une autre version de tes repères est enregistrée. Choisis, pour chaque différence ci-dessous, le texte à conserver.</p>}
        {CHAMPS.map(({ cle, titre, aide }, index) => <div className={s.groupeRepere} key={cle}>
          <label className="t-corps" htmlFor={`repere-${cle}`}>{titre}</label>
          <p className={`t-meta ${s.secondaire}`} id={`aide-${cle}`}>{aide} Tu peux laisser ce champ vide.</p>
          {Object.hasOwn(aComparer, cle) && <div className={s.comparaison}>
            <p className="t-meta">Version enregistrée</p>
            <p className={`t-corps ${s.mots}`}>{aComparer[cle] || "Ce repère est vide dans la version enregistrée."}</p>
            <p className={`t-meta ${s.secondaire}`}>Ton brouillon apparaît dans le champ ci-dessous.</p>
          </div>}
          <textarea ref={index === 0 ? premierChamp : undefined} id={`repere-${cle}`} aria-describedby={`aide-${cle}`} className={s.texte} maxLength={2000} value={brouillon[cle]} disabled={attente !== null || sessionModifiee} onChange={(event) => setBrouillon((b) => ({ ...b, [cle]: event.target.value }))} />
          {Object.hasOwn(aComparer, cle) && <div className={s.actions}>
            <button className={s.commande} type="button" disabled={sessionModifiee} onClick={() => choisirVersion(cle, "brouillon")} aria-label={`Garder mon brouillon : ${titre}`}>Garder mon brouillon</button>
            <button className={s.commande} type="button" disabled={sessionModifiee} onClick={() => choisirVersion(cle, "enregistree")} aria-label={`Reprendre la version enregistrée : ${titre}`}>Reprendre la version enregistrée</button>
          </div>}
          <button className={s.commande} type="button" disabled={attente !== null || !brouillon[cle] || sessionModifiee} onClick={() => setBrouillon((b) => ({ ...b, [cle]: "" }))}>Effacer ce repère : {titre}</button>
        </div>)}
        <p className={`t-meta ${s.secondaire}`}>Un champ effacé sera retiré de tes repères après l’enregistrement.</p>
        <div className={s.actions}>
          <BoutonLotus type="submit" attente={attente === "reperes"} disabled={attente !== null || conflit || comparaisonRequise || sessionModifiee}>Enregistrer mes repères</BoutonLotus>
          <button className={s.commande} type="button" disabled={attente !== null || sessionModifiee} onClick={() => { setEdition(false); setBrouillon(suivi?.reperes ?? REPERES_VIDES); setAComparer({}); setErreur(""); }}>Annuler les modifications</button>
        </div>
      </form> : <>
        {aDesReperes ? <dl className={s.reperes}>{CHAMPS.map(({ cle, titre }) => suivi?.reperes[cle] ? <div className={s.repere} key={cle}>
          <dt className="t-titre-sm">{titre}</dt><dd className={`t-corps ${s.mots}`}>{suivi.reperes[cle]}</dd>
        </div> : null)}</dl> : <p className={`t-corps ${s.secondaire}`}>Tu n’as pas encore ajouté de repères. Tu peux le faire quand tu en ressens l’envie.</p>}
        <BoutonLotus disabled={sessionModifiee} onClick={modifier}>{aDesReperes ? "Modifier mes repères" : "Ajouter mes repères"}</BoutonLotus>
      </>}
      {messagePour === "reperes" && messages}
      <Link className={s.lien} href="/memoire">Relire aussi ce qu’Anam retient de nos échanges</Link>
    </section>

    <section className={s.section} aria-labelledby="evolution-parcours">
      <h2 className="t-titre-sm" id="evolution-parcours">Le fil de mon parcours</h2>
      <p className={`t-corps ${s.secondaire}`}>Anam peut reconnaître une étape à partir de ce que tu lui racontes. Elle en garde ici la raison et accompagne l’évolution de ton arbre.</p>
      {suivi?.evenements.length ? <ol className={s.historique}>{suivi.evenements.map((evenement) => <li className={s.evenement} key={evenement.id}>
        <p className={`t-meta ${s.secondaire}`}><time dateTime={evenement.creeLe}>{dateLisible(evenement.creeLe)}</time> · {evenement.type === "avancer" ? "Une étape reconnue par Anam" : "Parcours ajusté avec Anam"}</p>
        {evenement.titreEtape && <h3 className={`t-titre-sm ${s.mots}`}>{evenement.titreEtape}</h3>}
        <p className={`t-corps ${s.mots}`}>{evenement.resume}</p>
      </li>)}</ol> : <p className={`t-corps ${s.secondaire}`}>Les ajustements et les étapes reconnues se retrouveront ici.</p>}
      <a className={s.lien} href="/?de=arbre">Voir mon arbre</a>
    </section>
  </div>;
}
