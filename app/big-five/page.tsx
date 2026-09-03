import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import { lireBigFive, lireTentativeBigFive } from "@/lib/data/lire-big-five";
import {
  EFFACER_BIG_FIVE,
  FACTEUR_LIBELLE,
  LIBELLES_NIVEAU_BIG_FIVE,
  LIBELLE_INCONNU_BIG_FIVE,
  MESSAGE_FACTEUR_SANS_TEXTE,
  ORIGINE_BIG_FIVE,
  POSITION_LIBELLE,
  REFAIRE_BIG_FIVE,
  TITRE_HALTE_BIG_FIVE,
  baremeBigFive,
  itemsPourAffichageBigFive,
} from "@/lib/domain/big-five-items";
import { conclure } from "@/lib/domain/big-five";
import { NIVEAUX } from "@/lib/domain/echelle-likert";
import { COPIE_QUESTIONNAIRE_BIG_FIVE } from "@/lib/domain/copie-questionnaire";
import { conclureInventaire, enregistrerReponses, recommencerInventaire } from "./actions";
import IntroductionBigFive from "./introduction";
import Resultat from "./resultat";
import QuestionnaireCourt from "@/render/psychologie/QuestionnaireCourt";
import s from "@/render/psychologie/questionnaire.module.css";
import PiedHalte from "@/render/PiedHalte";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import { urlRetourScene } from "@/lib/scene/retour-scene";
import RetourScene from "@/render/RetourScene";

/**
 * ⚠️ RENDUE À LA DEMANDE, ET C'EST UNE GARDE (revue adversariale, R5).
 *
 * `proxy.ts` pose un nonce NOUVEAU À CHAQUE REQUÊTE, et `script-src` porte `'strict-dynamic'` — qui,
 * en CSP niveau 3, fait IGNORER `'self'`. Une page PRÉRENDUE porte un HTML figé dont aucun `<script>`
 * ne peut être noncé : React ne s'hydrate jamais, et les composants clients sont à l'écran sans
 * réagir. On le DÉCLARE plutôt que de le déduire d'un détail d'implémentation qu'un correctif peut
 * retirer — c'est l'inférence qui avait piégé `/aide`.
 */
export const dynamic = "force-dynamic";

// NFR-015 / identité de route — « Anam » partout, jamais un titre qui dit l'intimité de la page.
export const metadata = { title: "Anam" };

/**
 * /big-five — LA HALTE DES CINQ GRANDS FACTEURS (2026-09-03).
 *
 * Jumelle de `/enneagramme`, dont l'en-tête porte le raisonnement complet : une HALTE, pas une
 * quatrième région (`IdRegion` est une union fermée) ; registre PRODUIT, sobre et factuel ; **Anam
 * ne paraît pas sur cet écran** — elle n'a que trois beats, et un calcul qui parlerait avec sa voix
 * serait un mensonge de forme.
 *
 * ── TROIS ÉCRANS, UN SEUL ORDRE ───────────────────────────────────────────────────────────────
 *
 *   1. `?refaire` — intention explicite, passe devant tout. La lui refuser parce qu'elle a déjà un
 *      résultat serait décider à sa place.
 *   2. Un résultat RETENU.
 *   3. Sinon — l'inventaire, repris là où elle s'était arrêtée (NFR-017).
 *
 * Il n'y a PAS de quatrième écran d'hypothèse : Anam ne propose pas de Big Five. Un axe ne se
 * devine pas d'une conversation, et il n'existe donc ni germe, ni acceptation, ni refus.
 *
 * ── LA GARDE D'ÉTAT EST RECOPIÉE, PAS FACTORISÉE ──────────────────────────────────────────────
 *
 * Comme `/enneagramme`, `/synthese` et `/heure-naissance`, et pour la raison écrite dans l'en-tête
 * d'`etat-onboarding.ts` : « une barrière oubliée dans un seul chemin suffit à laisser passer un
 * mineur ». Cet écran ÉCRIT une donnée art. 9.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ refaire?: string; de?: string }>;
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

  const [parametres, resultat, tentative] = await Promise.all([
    searchParams,
    lireBigFive(supabase, user.id),
    lireTentativeBigFive(supabase, user.id),
  ]);

  const bareme = baremeBigFive();
  const reponsesInitiales = Object.fromEntries(
    tentative.statut === "calcule"
      ? tentative.tentative.reponses.map((r) => [r.itemId, r.niveau])
      : [],
  );
  // La `key` du composant (décision D9). `"nouvelle"` tant qu'aucune passe n'existe : « refaire »
  // efface la tentative, la clé change, l'arbre React est REMONTÉ, et aucune réponse de la passe
  // précédente ne survit à l'écran.
  const cleTentative =
    tentative.statut === "calcule" ? tentative.tentative.tentativeId : "nouvelle";
  const issueInitiale =
    tentative.statut === "calcule" &&
    conclure(tentative.tentative.reponses, bareme).statut === "indetermine"
      ? "indetermine"
      : "en_cours";

  return (
    <main className={s.halte}>
      <RetourScene url={urlRetourScene(parametres)} />
      <h1 className="t-titre">{TITRE_HALTE_BIG_FIVE}</h1>

      {parametres.refaire === undefined && resultat.statut === "calcule" ? (
        <Resultat
          axes={resultat.lectures.map((lecture) => ({
            libelle: FACTEUR_LIBELLE[lecture.facteur],
            position: POSITION_LIBELLE[lecture.position],
            texte: lecture.texte.statut === "ecrit" ? lecture.texte.texte : null,
          }))}
          origine={ORIGINE_BIG_FIVE}
          messageSansTexte={MESSAGE_FACTEUR_SANS_TEXTE}
          libelles={{ refaire: REFAIRE_BIG_FIVE, effacer: EFFACER_BIG_FIVE }}
        />
      ) : (
        <QuestionnaireCourt
          key={cleTentative}
          // ⚠️ LE FACTEUR NE DESCEND PAS AVEC L'ÉNONCÉ (`itemsPourAffichageBigFive`). Servir le
          // barème dans le HTML, c'est laisser voir ce que chaque phrase pèse, EN RÉPONDANT.
          items={itemsPourAffichageBigFive()}
          // Les libellés descendent du SERVEUR (jamais recopiés dans un module de rendu) :
          // `render/` ne peut pas importer `lib/domain`, et une copie serait une divergence.
          libelles={NIVEAUX.map((n) => LIBELLES_NIVEAU_BIG_FIVE[n])}
          libelleInconnu={LIBELLE_INCONNU_BIG_FIVE}
          reponsesInitiales={reponsesInitiales}
          nouvelle={cleTentative === "nouvelle"}
          issueInitiale={issueInitiale}
          introduction={<IntroductionBigFive />}
          actions={{
            enregistrer: enregistrerReponses,
            conclure: conclureInventaire,
            recommencer: recommencerInventaire,
          }}
          copie={COPIE_QUESTIONNAIRE_BIG_FIVE}
        />
      )}

      {/* Un chemin de retour, jamais un cul-de-sac. */}
      <a className={s.discret} href="/psychologie">
        <span className="t-bouton">Revenir</span>
      </a>
      <PiedHalte
        mentionIA={piedPour("big-five").mentionIA}
        texteMention={MENTION_IA}
        urlTransparence={URL_TRANSPARENCE}
        urlAide={URL_AIDE}
      />
    </main>
  );
}
