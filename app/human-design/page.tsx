import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import { lireHumanDesign } from "@/lib/data/lire-human-design";
import {
  texteDeLAutorite,
  texteDeLaLigne,
  texteDuType,
} from "@/lib/corpus/human-design";
import {
  AUCUN_CENTRE_DEFINI,
  AUTORITE_LIBELLE,
  BOUTON_AJOUTER_HEURE,
  BOUTON_AJOUTER_NAISSANCE,
  CALCUL_INDISPONIBLE,
  CENTRE_LIBELLE,
  HEURE_MANQUANTE,
  INTRODUCTION_HUMAN_DESIGN,
  LEGENDE_PROFIL_DESIGN,
  LEGENDE_PROFIL_PERSONNALITE,
  LIGNE_LIBELLE,
  LIMITE_HUMAN_DESIGN,
  MESSAGE_SANS_TEXTE,
  NAISSANCE_MANQUANTE,
  TITRE_AUTORITE,
  TITRE_CENTRES,
  TITRE_HALTE_HUMAN_DESIGN,
  TITRE_PROFIL,
  TITRE_TYPE,
  TYPE_LIBELLE,
} from "@/lib/domain/copie-human-design";
import DessinHumanDesign from "@/render/psychologie/DessinHumanDesign";
import s from "@/render/psychologie/questionnaire.module.css";
import PiedHalte from "@/render/PiedHalte";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import { urlRetourScene } from "@/lib/scene/retour-scene";
import RetourScene from "@/render/RetourScene";

/** Route art. 9 : jamais mise en cache, jamais pré-rendue. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

// NFR-015 / identité de route — « Anam » partout, jamais un titre qui dit l'intimité de la page.
export const metadata = { title: "Anam" };

/**
 * /human-design — LA HALTE DU DESSIN (2026-09-03).
 *
 * ══ CETTE HALTE N'A PAS DE QUESTIONNAIRE, ET C'EST TOUTE SA DIFFÉRENCE ══════════════════════════
 *
 * `/enneagramme` et `/big-five` demandent des réponses ; celle-ci ne demande RIEN. Le dessin est une
 * fonction de la naissance, comme les nombres du socle : il se calcule à la lecture (voir
 * `lib/data/lire-human-design.ts` pour la décision de ne rien graver).
 *
 * ══ L'HEURE MANQUANTE EST UN ÉCRAN, PAS UNE LIGNE VIDE ══════════════════════════════════════════
 *
 * Sans l'heure, le module de calcul REFUSE — une ligne de profil change en moins d'une journée. La
 * page reprend alors la porte DÉJÀ construite par l'astrologie (`/heure-naissance`), plutôt que
 * d'inventer un second formulaire pour la même donnée. Et elle distingue l'heure absente de la date
 * absente : deux portes différentes, deux phrases différentes.
 *
 * ══ LA GARDE D'ÉTAT EST RECOPIÉE, PAS FACTORISÉE ═══════════════════════════════════════════════
 *
 * Comme `/socle`, `/enneagramme` et `/big-five`. La RLS autorise le SELECT au propriétaire sans
 * regarder la minorité ni le consentement — l'export FR-067 en dépend — mais SERVIR de l'art. 9 dans
 * l'app à quelqu'un qui a révoqué son consentement n'est pas de l'export : c'est de l'usage produit.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrer");

  const etape = await etapeOnboardingPour(supabase, user.id);
  if (etape === "barre") redirect("/barriere");
  if (etape === "mineur") {
    await supabase.auth.signOut();
    redirect("/entrer?refus=age");
  }
  if (etape === "naissance") redirect("/naissance");
  if (etape === "consentement") redirect("/consentement");
  if (etape === "revoque") redirect("/consentement/revoque");

  const [parametres, dessin] = await Promise.all([
    searchParams,
    lireHumanDesign(supabase, user.id),
  ]);

  // ⚠️ LE CORPUS EST LU ICI, DANS LE RENDU SERVEUR. `render/` ne peut importer ni `lib/corpus` ni
  // `lib/domain` (AD-7/AD-10) : le composant reçoit des chaînes déjà résolues, et ne peut donc pas
  // inventer un texte de repli — le troisième état que `lib/corpus/port` refuse d'exister.
  const texteOuNull = (t: { statut: "ecrit"; texte: string } | { statut: "non_ecrit" }) =>
    t.statut === "ecrit" ? t.texte : null;

  return (
    <main className={s.halte}>
      <RetourScene url={urlRetourScene(parametres)} />
      <h1 className="t-titre">{TITRE_HALTE_HUMAN_DESIGN}</h1>

      <section className={s.introduction} aria-labelledby="comprendre-human-design">
        <h2 id="comprendre-human-design" className="t-titre-sm">
          Ce que cette page calcule
        </h2>
        <p className="t-corps">{INTRODUCTION_HUMAN_DESIGN}</p>
        <p className="t-corps">{LIMITE_HUMAN_DESIGN}</p>
      </section>

      {dessin.statut === "calcule" ? (
        <DessinHumanDesign
          type={{
            libelle: TYPE_LIBELLE[dessin.theme.type],
            texte: texteOuNull(texteDuType(dessin.theme.type)),
          }}
          autorite={{
            libelle: AUTORITE_LIBELLE[dessin.theme.autorite],
            texte: texteOuNull(texteDeLAutorite(dessin.theme.autorite)),
          }}
          profil={{
            // Le couple canonique, écrit comme le système l'écrit : « 4/6 ».
            couple: `${dessin.theme.profil.personnalite}/${dessin.theme.profil.design}`,
            lignes: [
              {
                libelle: LIGNE_LIBELLE[dessin.theme.profil.personnalite],
                legende: LEGENDE_PROFIL_PERSONNALITE,
                texte: texteOuNull(texteDeLaLigne(dessin.theme.profil.personnalite)),
              },
              {
                libelle: LIGNE_LIBELLE[dessin.theme.profil.design],
                legende: LEGENDE_PROFIL_DESIGN,
                texte: texteOuNull(texteDeLaLigne(dessin.theme.profil.design)),
              },
            ],
          }}
          centres={dessin.theme.centresDefinis.map((c) => CENTRE_LIBELLE[c])}
          copie={{
            titreType: TITRE_TYPE,
            titreAutorite: TITRE_AUTORITE,
            titreProfil: TITRE_PROFIL,
            titreCentres: TITRE_CENTRES,
            aucunCentre: AUCUN_CENTRE_DEFINI,
            messageSansTexte: MESSAGE_SANS_TEXTE,
          }}
        />
      ) : (
        <section className={`${s.bloc} fondu-texte`} aria-label="Ce qui manque">
          <p className="t-corps">
            {dessin.raison === "heure_inconnue"
              ? HEURE_MANQUANTE
              : dessin.raison === "naissance_absente"
                ? NAISSANCE_MANQUANTE
                : CALCUL_INDISPONIBLE}
          </p>
          {/* Une PORTE seulement là où il y a quelque chose à remplir. Un incident de calcul n'en
              propose aucune : envoyer quelqu'un remplir un formulaire déjà rempli est un mensonge. */}
          {dessin.raison === "heure_inconnue" ? (
            <a className={s.bouton} href="/heure-naissance?de=human-design">
              <span className="t-bouton">{BOUTON_AJOUTER_HEURE}</span>
            </a>
          ) : dessin.raison === "naissance_absente" ? (
            <a className={s.bouton} href="/naissance">
              <span className="t-bouton">{BOUTON_AJOUTER_NAISSANCE}</span>
            </a>
          ) : null}
        </section>
      )}

      {/* Un chemin de retour, jamais un cul-de-sac. */}
      <a className={s.discret} href="/psychologie">
        <span className="t-bouton">Revenir</span>
      </a>
      <PiedHalte
        mentionIA={piedPour("human-design").mentionIA}
        texteMention={MENTION_IA}
        urlTransparence={URL_TRANSPARENCE}
        urlAide={URL_AIDE}
      />
    </main>
  );
}
