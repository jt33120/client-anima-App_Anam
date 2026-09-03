import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import {
  lireEnneagramme,
  lireHypotheseEnneagramme,
  lireTentativeEnneagramme,
} from "@/lib/data/lire-enneagramme";
import { texteDuTypeRetenu } from "@/lib/corpus/enneagramme";
import {
  LIBELLES_NIVEAU,
  LIBELLE_INCONNU,
  MESSAGE_TYPE_SANS_TEXTE,
  ITEMS,
  itemsPourAffichage,
} from "@/lib/domain/enneagramme-items";
import { conclure, NIVEAUX } from "@/lib/domain/enneagramme";
import { phraseHypothese } from "@/lib/domain/enneagramme-hypothese";
import { COPIE_QUESTIONNAIRE_ENNEAGRAMME } from "@/lib/domain/copie-questionnaire";
import { conclureTest, enregistrerReponses, recommencerTest } from "./actions";
import QuestionnaireCourt from "@/render/psychologie/QuestionnaireCourt";
import Hypothese from "./hypothese";
import Resultat from "./resultat";
import IntroductionEnneagramme from "./introduction";
import s from "@/render/psychologie/questionnaire.module.css";
import PiedHalte from "@/render/PiedHalte";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import { urlRetourScene } from "@/lib/scene/retour-scene";
import RetourScene from "@/render/RetourScene";

/**
 * ⚠️ RENDUE À LA DEMANDE, ET C'EST UNE GARDE (revue adversariale, R5).
 *
 * `proxy.ts` pose un nonce NOUVEAU À CHAQUE REQUÊTE, et `script-src` porte `'strict-dynamic'` — qui,
 * en CSP niveau 3, fait IGNORER `'self'` et toutes les sources d'hôte. Une page PRÉRENDUE porte donc
 * un HTML figé dont aucun `<script>` ne peut être noncé : le navigateur les refuse tous, React ne
 * s'hydrate jamais, et les composants clients de la page sont à l'écran sans réagir.
 *
 * Cette page-ci l'était DÉJÀ par inférence — elle lit la session, donc Next la rend à la demande.
 * C'est précisément l'inférence qui a piégé `/aide`, dont l'en-tête se félicitait de « ne lire aucune
 * session » : le jour où elle a cessé d'en lire une, elle est devenue statique et muette, sans qu'une
 * seule ligne de son code ne change. On le DÉCLARE donc, plutôt que de le déduire d'un détail
 * d'implémentation qu'un correctif peut retirer.
 */
export const dynamic = "force-dynamic";


// NFR-015 / identité de route — « Anam » partout, jamais un titre qui dit l'intimité de la page.
// ⚠️ Le mot « ennéagramme » ne sort JAMAIS de l'application authentifiée : ni en Open Graph
// (`tests/identite-route.test.ts`), ni en courriel (`tests/synthese-domaine.test.ts`), ni en
// notification (`DESIGN.md:672`). Le chemin d'URL est la seule trace, et il ne quitte pas l'onglet.
export const metadata = { title: "Anam" };

/**
 * /enneagramme — LA HALTE DE L'ENNÉAGRAMME (Story 5.5, décision D11).
 *
 * ── UNE HALTE, PAS UNE QUATRIÈME RÉGION ───────────────────────────────────────────────────────
 *
 * `IdRegion` est une union fermée et `EXPERIENCE.md:34` plafonne à trois destinations. Patron
 * `/heure-naissance` : une halte se pose par-dessus la scène et y renvoie. Registre PRODUIT —
 * sobre, factuel — et **Anam ne paraît pas sur cet écran** : elle n'a que trois beats
 * (`EXPERIENCE.md:147`), et un calcul qui parlerait avec sa voix serait un mensonge de forme.
 *
 * La seule exception est la phrase de l'hypothèse, qui EST une parole d'Anam et porte `t-anam`.
 *
 * ── TROIS ÉCRANS, UN SEUL ORDRE, ET IL EST MOTIVÉ ─────────────────────────────────────────────
 *
 *   1. `?refaire` — elle a demandé à refaire le test. Passe devant tout : c'est une intention
 *      explicite, et la lui refuser parce qu'elle a déjà un type serait décider à sa place.
 *   2. Une hypothèse EN ATTENTE — une question ouverte se répond avant qu'on affiche une réponse
 *      déjà acquise. Sans cette priorité, une hypothèse semée puis jamais répondue resterait à
 *      hanter l'ouverture de la scène sans qu'aucun écran ne permette de la refuser.
 *   3. Un type RETENU — le résultat.
 *   4. Sinon — le test, repris là où elle s'était arrêtée (NFR-017).
 *
 * ── LA GARDE D'ÉTAT EST RECOPIÉE, PAS FACTORISÉE ──────────────────────────────────────────────
 *
 * Comme `/synthese` et `/heure-naissance`, et pour la raison écrite dans l'en-tête
 * d'`etat-onboarding.ts` : « une barrière oubliée dans un seul chemin suffit à laisser passer un
 * mineur ». Cet écran ÉCRIT une donnée art. 9.
 *
 * ── CE QUE CETTE PAGE NE FAIT PAS ─────────────────────────────────────────────────────────────
 *
 * Elle ne marque PAS l'hypothèse « dite ». Ce rendu se ré-exécute à chaque rafraîchissement, et
 * `dite_le` ne se pose que sur un geste du CLIENT quand la région portant la phrase est active
 * (leçon 0045, payée deux fois). Ici la phrase est de toute façon affichée quoi qu'il arrive :
 * marquer n'apporterait rien et rouvrirait la faute.
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

  const [{ refaire }, type, hypothese, tentative] = await Promise.all([
    searchParams,
    lireEnneagramme(supabase, user.id),
    // `seulementADire: false` : ici on cherche ce qu'elle peut encore RÉPONDRE, pas ce qu'Anam a
    // encore à DIRE. Les deux questions sont distinctes — voir l'en-tête de `lire-enneagramme`.
    lireHypotheseEnneagramme(supabase, user.id),
    lireTentativeEnneagramme(supabase, user.id),
  ]);

  const reponsesInitiales = Object.fromEntries(
    tentative.statut === "calcule" ? tentative.tentative.reponses.map((r) => [r.itemId, r.niveau]) : [],
  );
  // La `key` du composant (décision D9). `"nouvelle"` tant qu'aucune passe n'existe : « refaire »
  // efface la tentative, la clé change, l'arbre React est REMONTÉ, et aucune réponse de la passe
  // précédente ne survit à l'écran. Le défaut n° 6 de la revue 4.6, fermé par construction.
  const cleTentative = tentative.statut === "calcule" ? tentative.tentative.tentativeId : "nouvelle";
  const issueInitiale =
    tentative.statut === "calcule" &&
    conclure(tentative.tentative.reponses, ITEMS).statut === "indetermine"
      ? "indetermine"
      : "en_cours";

  const texteRetenu =
    type.statut === "calcule" ? texteDuTypeRetenu(type.type) : { statut: "non_ecrit" as const };

  return (
    <main className={s.halte}>
      <RetourScene url={urlRetourScene(await searchParams)} />
      <h1 className="t-titre">Explorer tes façons d’agir</h1>

      {refaire === undefined && hypothese.statut === "calcule" ? (
        <Hypothese
          hypotheseId={hypothese.hypothese.id}
          phrase={phraseHypothese(hypothese.hypothese.type)}
        />
      ) : refaire === undefined && type.statut === "calcule" ? (
        <Resultat
          type={type.type}
          origine={type.origine}
          texte={texteRetenu.statut === "ecrit" ? texteRetenu.texte : null}
          messageSansTexte={MESSAGE_TYPE_SANS_TEXTE}
        />
      ) : (
        <QuestionnaireCourt
          key={cleTentative}
          items={itemsPourAffichage()}
          // Les libellés descendent du SERVEUR (jamais recopiés dans un module de rendu) :
          // `render/` ne peut pas importer `lib/domain`, et une copie serait une divergence.
          libelles={NIVEAUX.map((n) => LIBELLES_NIVEAU[n])}
          libelleInconnu={LIBELLE_INCONNU}
          reponsesInitiales={reponsesInitiales}
          nouvelle={cleTentative === "nouvelle"}
          issueInitiale={issueInitiale}
          introduction={<IntroductionEnneagramme />}
          // ⚠️ LES TROIS GESTES DESCENDENT D'ICI, ils ne sont pas importés par le composant.
          // `render/` ne peut importer ni `@/app/*` ni `@/lib/domain` (AD-7/AD-10) : passer les
          // Server Actions en propriétés est ce qui rend cette frontière structurelle.
          actions={{
            enregistrer: enregistrerReponses,
            conclure: conclureTest,
            recommencer: recommencerTest,
          }}
          copie={COPIE_QUESTIONNAIRE_ENNEAGRAMME}
        />
      )}

      {/* Un chemin de retour, jamais un cul-de-sac. */}
      <a className={s.discret} href="/">
        <span className="t-bouton">Revenir</span>
      </a>
      {/* Story 6.9 (QA T7) — la porte de secours (FR-077) et, là où elle est due, la mention
          IA (art. 50). Le MODÈLE décide ; ce composant dessine. */}
      <PiedHalte
        mentionIA={piedPour("enneagramme").mentionIA}
        texteMention={MENTION_IA}
        urlTransparence={URL_TRANSPARENCE}
        urlAide={URL_AIDE}
      />
    </main>
  );
}
