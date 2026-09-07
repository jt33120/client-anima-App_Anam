import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import SceneDom from "@/render/scene-dom";
import FicheSocle, { type ProprietesFicheSocle } from "@/render/socle/FicheSocle";
import RetourScene from "@/render/RetourScene";
import { ThemeCarnetDocument } from "@/render/carnet/ThemeCarnet";
import type { BibliothequeVue, CarteVue } from "@/render/accueil/types";
import type { FicheSocleVue } from "@/render/socle/types";
import { ficheSocle } from "@/lib/domain/fiche-socle";
import { calculerNumerologie } from "@/lib/astro/numerologie";
import { calculerThemeNatal } from "@/lib/astro/theme-natal";
import { ephemerideAstronomyEngine } from "@/lib/astro/adapters/astronomy-engine";
import { universMoi } from "@/lib/domain/univers-moi";
import * as copie from "@/lib/domain/copie-socle";
import * as seuil from "@/lib/domain/copie-seuil";
import * as menu from "@/lib/domain/menu-compte";
import { MESSAGE_TYPE_SANS_TEXTE } from "@/lib/domain/enneagramme-items";
import "@/app/styles/globals.css";
import "@/app/styles/carnet-tokens.css";
import "@/app/styles/carnet.css";
import halte from "@/render/socle/socle.module.css";
import "./preview.css";
import { treeProjectionFor } from "./tree-fixtures";

// Local synthetic fixtures only. This harness has no session, backend or database client.
const params = new URLSearchParams(window.location.search);
const state = params.get("state") ?? "real";
if (params.has("tree")) {
  localStorage.setItem("anima:arbre:vueListe", params.get("treeView") === "list" ? "1" : "0");
}
function RequestedTree() {
  useEffect(() => {
    if (!params.has("tree")) return;
    const buttons = document.querySelectorAll<HTMLButtonElement>('nav[aria-label="Régions"] button');
    [...buttons].find((button) => button.textContent?.trim() === "Mon évolution")?.click();
  }, []);
  return null;
}
const long = state === "dense";
const card = (cle: string, titre: string, texte: string): CarteVue => ({
  cle, titre, faits: [], texte: { statut: "ecrit", texte }, etat: null, ecritureModele: null,
});
const daily: BibliothequeVue = {
  jour: { a: 2026, m: 9, j: 6 },
  enAvant: "horoscope",
  cartes: [
    card("mantra", "Mon mantra du jour", long
      ? "Remarque ce qui tient, ce qui demeure vivant en toi lorsque les journées s’allongent et que tes pensées prennent toute la place. Tu peux revenir vers ce qui compte, à ton rythme, sans avoir à tout comprendre aujourd’hui."
      : "Tu peux avancer doucement et aller loin."),
    { ...card("horoscope", "Ton ciel du jour", "La Lune ralentit le rythme."),
      faits: [{ intitule: "Lune", valeur: "Gémeaux" }, { intitule: "Soleil", valeur: "Vierge" }],
      texte: { statut: "non_ecrit" },
      ecritureModele: {
        parties: [
          { intitule: "Le ciel, aujourd’hui", texte: "La Lune du jour marche à trois signes de ton Soleil de naissance, et Vénus vient s’y poser." },
          { intitule: "Ce que ça touche chez toi", texte: "Si tout semble aller vite autour de toi, un seul point d’attention suffit à tenir la journée." },
          { intitule: "Le rendre concret", texte: "Poser une chose sur la table avant midi, une seule. Écrire trois lignes le soir, sans les relire." },
        ],
        mention: "Lecture symbolique rédigée avec l’aide d’une IA.",
      },
    },
  ],
  univers: universMoi("absent", true),
};
if (state === "empty") {
  daily.cartes.forEach((c) => { Object.assign(c, { texte: { statut: "non_ecrit" }, ecritureModele: null, faits: [] }); });
}

const fiche = ficheSocle(
  calculerNumerologie({ date: "1990-06-15", nomComplet: "Marie Claire Dubois" }, 2026),
  calculerThemeNatal({ date: "1990-06-15", heure: "07:15", fuseau: "Europe/Paris", latitude: 48.8566, longitude: 2.3522 }, ephemerideAstronomyEngine()),
  4,
  { nombres: null, ciel: null },
  { date: "1990-06-15", nomComplet: "Marie Claire Dubois" },
) as unknown as FicheSocleVue;
const texteSocle: ProprietesFicheSocle["copie"] = {
  introduction: copie.INTRODUCTION,
  titreApercu: copie.TITRE_APERCU,
  titreNombres: copie.TITRE_NOMBRES,
  titreEntreesNumerologie: copie.TITRE_ENTREES_NUMEROLOGIE,
  titreMethodeNumerologie: copie.TITRE_METHODE_NUMEROLOGIE,
  titreLectureNumerologie: copie.TITRE_LECTURE_NUMEROLOGIE,
  titreCiel: copie.TITRE_CIEL,
  titreAngles: copie.TITRE_ANGLES,
  titreMaisons: copie.TITRE_MAISONS,
  titreType: copie.TITRE_TYPE,
  titreManques: copie.TITRE_MANQUES,
  titrePortes: copie.TITRE_PORTES,
  sensDuCielNonEcrit: copie.SENS_DU_CIEL_NON_ECRIT,
  typeSansTexte: MESSAGE_TYPE_SANS_TEXTE,
  boutonAjouterHeure: copie.BOUTON_AJOUTER_HEURE,
  resumeDetailHeure: copie.RESUME_DETAIL_HEURE,
  titreDetailPositions: copie.TITRE_DETAIL_POSITIONS,
  cielDuJourNonEcrit: copie.CIEL_DU_JOUR_NON_ECRIT,
};
function PreviewScene() {
  const [projection, setProjection] = useState(() => treeProjectionFor(params));
  return <>
  {params.get("treeControls") === "1" && <aside className="fixture-controls" aria-label="Contrôles de fixture hors application">
    <label>Projection synthétique
      <select aria-label="Projection synthétique" defaultValue={params.get("treeStage") ?? "0"}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          next.set("treeStage", event.currentTarget.value);
          setProjection(treeProjectionFor(next));
        }}>
        {Array.from({ length: 35 }, (_, index) => <option value={index} key={index}>{index}</option>)}
      </select>
    </label>
  </aside>}
  <SceneDom
  jourAccueil={daily.jour}
  bibliotheque={state === "error" ? null : daily}
  projection={projection}
  seuilDejaFranchi={params.get("view") !== "seuil"}
  accueilAnam="Confie ici ce que tu portes en toi. Un espace pour te comprendre, évoluer, te dépasser et révéler la personne que tu es appelée à devenir."
  historique={state === "empty" ? [] : [
    { id: "fixture-tour-1", role: "utilisatrice", texte: "J’ai envie de ralentir un peu, mais j’ai du mal à m’autoriser ce temps pour moi.", separateurAvant: true },
    { id: "fixture-tour-2", role: "anam", texte: "Qu’est-ce qui devient possible pour toi quand tu ralentis ?" },
  ]}
  menu={{ groupes: menu.GROUPES_MENU, libelleGlyphe: menu.LIBELLE_GLYPHE, titreFeuille: menu.TITRE_FEUILLE, libelleFermer: menu.LIBELLE_FERMER }}
  copieSeuil={{ titre: seuil.TITRE_SEUIL, tagline: seuil.TAGLINE_SEUIL, action: seuil.ACTION_SEUIL, altAvatar: seuil.ALT_AVATAR_SEUIL }}
/>
  </>;
}
const isSocle = window.location.pathname === "/socle";
const mode = params.get("univers") === "numerologie" ? "numerologie" : "astrologie";
createRoot(document.getElementById("root")!).render(<>
  <ThemeCarnetDocument />
  <RequestedTree />
  {isSocle ? <main className={halte.halte}><RetourScene url="/"/><h1 className={`t-titre ${halte.titreHalte}`}>{mode === "astrologie" ? "Astrologie" : "Numérologie"}</h1><FicheSocle fiche={fiche} copie={texteSocle} mode={mode}/></main> : <PreviewScene/>}
</>);
