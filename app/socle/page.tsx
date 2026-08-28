import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import { lireNumerologie } from "@/lib/data/lire-numerologie";
import { lireThemeNatal } from "@/lib/data/depot-theme-natal";
import { lireEnneagramme } from "@/lib/data/lire-enneagramme";
import { ficheSocle } from "@/lib/domain/fiche-socle";
import {
  TITRE_HALTE,
  INTRODUCTION,
  TITRE_NOMBRES,
  TITRE_CIEL,
  TITRE_APERCU,
  TITRE_ENTREES_NUMEROLOGIE,
  TITRE_METHODE_NUMEROLOGIE,
  TITRE_LECTURE_NUMEROLOGIE,
  TITRE_ANGLES,
  TITRE_MAISONS,
  TITRE_TYPE,
  TITRE_MANQUES,
  TITRE_PORTES,
  SENS_DU_CIEL_NON_ECRIT,
  NOMBRES_INDISPONIBLES,
  CIEL_INDISPONIBLE,
  NAISSANCE_ABSENTE,
} from "@/lib/domain/copie-socle";
import { MESSAGE_TYPE_SANS_TEXTE } from "@/lib/domain/enneagramme-items";
import FicheSocle from "@/render/socle/FicheSocle";
import s from "@/render/socle/socle.module.css";
import PiedHalte from "@/render/PiedHalte";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import { urlRetourScene } from "@/lib/scene/retour-scene";
import RetourScene from "@/render/RetourScene";

// NFR-015 / identité de route — « Anam » partout, jamais un titre qui dit l'intimité de la page.
export const metadata = { title: "Anam" };

/** Route art. 9 : jamais mise en cache, jamais pré-rendue. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * /socle — LA HALTE « TON SOCLE » (Story 7.5 · FR-055, FR-047 à FR-051).
 *
 * ══ LA PREMIÈRE SURFACE OÙ FR-055 EST TENU ══════════════════════════════════════════════════════
 *
 * « Numérologie complète, gratuite à vie. » Jusqu'au 2026-08-25, le produit affichait **un texte sur
 * six** — `carteNombres` ne porte que le chemin de vie, et son propre commentaire renvoyait « les
 * cinq autres ont leur texte dans la fiche du socle », une fiche qui n'existait pas. Les 69 créneaux
 * de numérologie sont écrits depuis longtemps. Cinq sixièmes n'étaient lisibles nulle part.
 *
 * C'est aussi le premier écran qui montre les DIX corps (la carte en montrait cinq, contrainte de
 * vignette assumée) et le premier — le seul — où paraît le **milieu du ciel**, calculé depuis la 5.1
 * et sans aucune occurrence sous `render/` ni `app/` jusqu'ici.
 *
 * ══ UNE HALTE, PAS UNE RÉGION ═══════════════════════════════════════════════════════════════════
 *
 * Elle se pose par-dessus la scène (`EXPERIENCE.md` §62). Sa place est fixée par l'amendement du
 * 2026-08-25 : **deuxième entrée du menu de compte**, juste après « Aide et ressources ». Tant que
 * la feuille de menu n'existe pas (Story 7.3), elle n'est atteignable que par son URL — comme les
 * cinq autres haltes depuis toujours.
 *
 * ══ LA GARDE D'ÉTAT, ET POURQUOI ELLE N'EST PAS FACULTATIVE ═════════════════════════════════════
 *
 * Reprise mot pour mot de `/lectures` et `/synthese` (revue 4.9, T1-3). La RLS autorise le SELECT au
 * propriétaire sans regarder la barrière de minorité ni le consentement — c'est voulu, l'export
 * FR-067 en dépend. Mais SERVIR de l'art. 9 dans l'app à quelqu'un qui a révoqué son consentement,
 * ou dont le compte est barré, n'est pas de l'export : c'est de l'usage produit.
 *
 * ══ TROIS LECTURES EN PARALLÈLE, ET TROIS PANNES INDÉPENDANTES ══════════════════════════════════
 *
 * Les trois lectures ne dépendent pas les unes des autres : les enchaîner coûterait deux
 * allers-retours pour rien (c'est le défaut que l'Epic 8 va chasser ailleurs — autant ne pas le
 * créer ici). Et surtout : **une panne sur l'une ne fait pas disparaître les deux autres**. Quelqu'un
 * dont le thème est illisible doit continuer à voir ses nombres, et lire que son ciel est en panne —
 * pas un écran vide qui se lit « tu n'as rien ».
 */
export default async function Page({
  searchParams,
}: {
  /**
   * Les paramètres d'URL — Story 7.13. Ils portent la région d'où l'on vient, pour que fermer
   * cette halte repose au bon endroit du monde. `Promise` : c'est la forme de Next 16.
   */
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametres = await searchParams;
  const universBrut = Array.isArray(parametres.univers) ? parametres.univers[0] : parametres.univers;
  const mode = universBrut === "astrologie" || universBrut === "numerologie" ? universBrut : "tout";
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrer");

  const etape = await etapeOnboardingPour(supabase, auth.user.id);
  if (etape === "barre") redirect("/barriere");
  if (etape === "mineur") {
    await supabase.auth.signOut();
    redirect("/entrer?refus=age");
  }
  if (etape === "naissance") redirect("/naissance");
  if (etape === "consentement") redirect("/consentement");
  if (etape === "revoque") redirect("/consentement/revoque");

  const [numerologie, theme, enneagramme] = await Promise.all([
    mode === "astrologie" ? Promise.resolve(null) : lireNumerologie(supabase, auth.user.id, new Date()).catch(() => null),
    mode === "numerologie" ? Promise.resolve(null) : lireThemeNatal(supabase, auth.user.id).catch(() => null),
    mode === "tout" ? lireEnneagramme(supabase, auth.user.id).catch(() => null) : Promise.resolve(null),
  ]);

  // ⚠️ « JE N'ARRIVE PAS À LIRE » N'EST PAS « TU N'AS RIEN » (leçon 4.6 puis 4.9). Les deux raisons
  // d'indisponibilité ne se disent pas pareil : « naissance_absente » est un parcours inachevé,
  // « lecture_impossible » est un incident. Les confondre ferait croire à une perte de données.
  const raisonNombres =
    numerologie === null || numerologie.statut === "indisponible"
      ? numerologie?.statut === "indisponible" && numerologie.raison === "naissance_absente"
        ? NAISSANCE_ABSENTE
        : NOMBRES_INDISPONIBLES
      : null;
  const raisonCiel =
    theme === null || theme.statut === "indisponible"
      ? theme?.statut === "indisponible" && theme.raison === "naissance_absente"
        ? NAISSANCE_ABSENTE
        : CIEL_INDISPONIBLE
      : null;

  const fiche = ficheSocle(
    numerologie?.statut === "calcule" ? numerologie.numerologie : null,
    theme?.statut === "calcule" ? theme.theme : null,
    enneagramme?.statut === "calcule" ? enneagramme.type : null,
    { nombres: raisonNombres, ciel: raisonCiel },
    numerologie?.statut === "calcule" ? numerologie.entrees : null,
  );

  return (
    <main className={s.halte}>
      <RetourScene url={urlRetourScene(await searchParams)} />
      <h1 className={`t-titre ${s.titreHalte}`}>
        {mode === "astrologie" ? "Astrologie" : mode === "numerologie" ? "Numérologie" : TITRE_HALTE}
      </h1>

      <FicheSocle
        fiche={fiche}
        mode={mode}
        copie={{
          introduction:
            mode === "astrologie"
              ? "Ton ciel de naissance, calculé à partir de ta date, de ton heure et de ton lieu. Rien ici n’est généré par un modèle."
              : mode === "numerologie"
                ? "Tes nombres, calculés à partir de ta naissance et de ton nom. L’année personnelle suit l’année civile indiquée."
                : INTRODUCTION,
          titreNombres: TITRE_NOMBRES,
          titreApercu: TITRE_APERCU,
          titreEntreesNumerologie: TITRE_ENTREES_NUMEROLOGIE,
          titreMethodeNumerologie: TITRE_METHODE_NUMEROLOGIE,
          titreLectureNumerologie: TITRE_LECTURE_NUMEROLOGIE,
          titreCiel: TITRE_CIEL,
          titreAngles: TITRE_ANGLES,
          titreMaisons: TITRE_MAISONS,
          titreType: TITRE_TYPE,
          titreManques: TITRE_MANQUES,
          titrePortes: TITRE_PORTES,
          sensDuCielNonEcrit: SENS_DU_CIEL_NON_ECRIT,
          typeSansTexte: MESSAGE_TYPE_SANS_TEXTE,
        }}
      />

      {/* Story 6.9 (QA T7) — la porte de secours (FR-077) et, là où elle est due, la mention
          IA (art. 50). Le MODÈLE décide ; ce composant dessine. */}
      <PiedHalte
        mentionIA={piedPour("socle").mentionIA}
        texteMention={MENTION_IA}
        urlTransparence={URL_TRANSPARENCE}
        urlAide={URL_AIDE}
      />
    </main>
  );
}
