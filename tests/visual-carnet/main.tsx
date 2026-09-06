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

// Local synthetic fixtures only. This harness has no session, backend or database client.
const params = new URLSearchParams(window.location.search);
const state = params.get("state") ?? "real";
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
      ecritureModele: { texte: "Une journée pour laisser respirer tes idées. Si tout semble aller vite autour de toi, tu peux choisir un seul point d’attention et lui donner de la place. Observe ce qui éveille ta curiosité, sans avoir à en faire quelque chose tout de suite.", mention: "Lecture symbolique rédigée avec l’aide d’une IA." },
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
const scene = <SceneDom
  jourAccueil={daily.jour}
  bibliotheque={state === "error" ? null : daily}
  projection={{ tronc: { present: true }, branches: state === "empty" ? [] : [
    { id: "fixture-1", etat: "feuillaison", intensite: 0.65, extraitSourceId: "fixture-a", nom: "Me faire confiance", dateNaissance: "2026-08-02", extraitContenu: "Je veux apprendre à me faire confiance." },
    { id: "fixture-2", etat: "naissance", intensite: 0, extraitSourceId: "fixture-b", nom: "Trouver mon rythme", dateNaissance: "2026-08-24" },
    { id: "fixture-3", etat: "rayonnement", intensite: 1, extraitSourceId: "fixture-c", nom: "Oser dire non", dateNaissance: "2026-07-03", dateRayonnement: "2026-08-30" },
  ] }}
  seuilDejaFranchi={params.get("view") !== "seuil"}
  accueilAnam="Confie ici ce que tu portes en toi. Un espace pour te comprendre, évoluer, te dépasser et révéler la personne que tu es appelée à devenir."
  historique={state === "empty" ? [] : [
    { id: "fixture-tour-1", role: "utilisatrice", texte: "J’ai envie de ralentir un peu, mais j’ai du mal à m’autoriser ce temps pour moi.", separateurAvant: true },
    { id: "fixture-tour-2", role: "anam", texte: "Qu’est-ce qui devient possible pour toi quand tu ralentis ?" },
  ]}
  menu={{ groupes: menu.GROUPES_MENU, libelleGlyphe: menu.LIBELLE_GLYPHE, titreFeuille: menu.TITRE_FEUILLE, libelleFermer: menu.LIBELLE_FERMER }}
  copieSeuil={{ titre: seuil.TITRE_SEUIL, tagline: seuil.TAGLINE_SEUIL, action: seuil.ACTION_SEUIL, altAvatar: seuil.ALT_AVATAR_SEUIL }}
/>;
const isSocle = window.location.pathname === "/socle";
const mode = params.get("univers") === "numerologie" ? "numerologie" : "astrologie";
createRoot(document.getElementById("root")!).render(<>
  <ThemeCarnetDocument />
  {isSocle ? <main className={halte.halte}><RetourScene url="/"/><h1 className="t-display">{mode === "astrologie" ? "Astrologie" : "Numérologie"}</h1><FicheSocle fiche={fiche} copie={texteSocle} mode={mode}/></main> : scene}
</>);
