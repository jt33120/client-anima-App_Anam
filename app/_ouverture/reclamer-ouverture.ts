"use server";

import type { User } from "@supabase/supabase-js";
import {
  ErreurLectureOnboarding,
  etapeOnboardingPour,
} from "@/app/(auth)/etat-onboarding";
import { creerDepotBranche } from "@/lib/data/depot-branche";
import { lireFilRecent } from "@/lib/data/depot-fil";
import {
  ErreurDepotOuvertureQuotidienne,
  commencerOuvertureQuotidienne,
  finaliserOuvertureQuotidienne,
} from "@/lib/data/depot-ouverture-quotidienne";
import { lirePrenom } from "@/lib/data/lire-prenom";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";
import {
  ouvertureDepuisInconnu,
  type Ouverture,
} from "@/lib/domain/arbitrage-ouverture";
import {
  cleJourParis,
  delaiAvantProchainJourParis,
  phraseDOuverture,
  saluerOuvertureEvenement,
  type MatiereOuverture,
} from "@/lib/domain/ouverture-seance";
import {
  chargerOuverture,
  preparerOuverture,
} from "@/lib/safety/ouverture-branche";

interface TourOuverture {
  readonly id: string;
  readonly role: "utilisatrice" | "anam";
  readonly texte: string;
  readonly separateurAvant?: boolean;
}

interface OuvertureLiee {
  readonly tourId: string;
  readonly donnees: Ouverture;
}

type DestinationAccesIncomplet =
  | "/barriere"
  | "/entrer?refus=age"
  | "/naissance"
  | "/consentement"
  | "/consentement/revoque";

type EchecOuvertureDuJour =
  | { readonly statut: "session-expiree" }
  | {
      readonly statut: "acces-incomplet";
      readonly destination: DestinationAccesIncomplet;
    }
  | { readonly statut: "schema-incompatible" }
  | { readonly statut: "incident-temporaire" };

type ResultatOuvertureDuJour =
  | {
      readonly statut: "ouverte" | "deja-commencee";
      readonly jourParis: string;
      readonly rearmementMs: number;
      readonly tours: readonly TourOuverture[];
      readonly ouverture: OuvertureLiee | null;
    }
  | { readonly statut: "en-cours"; readonly reessayerApresMs: number }
  | EchecOuvertureDuJour;

type ResultatOuvertureCourante =
  | { readonly statut: "disponible"; readonly ouverture: Ouverture | null }
  | { readonly statut: "indisponible" };

type SessionOuverture =
  | {
      readonly statut: "autorisee";
      readonly supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      readonly user: User;
      readonly jourParis: string;
      readonly maintenant: Date;
    }
  | Extract<EchecOuvertureDuJour, { statut: "session-expiree" | "acces-incomplet" }>
  | { readonly statut: "incident-temporaire" };

function destinationAccesIncomplet(
  etape: Exclude<Awaited<ReturnType<typeof etapeOnboardingPour>>, "suite">,
): DestinationAccesIncomplet {
  if (etape === "barre") return "/barriere";
  if (etape === "mineur") return "/entrer?refus=age";
  if (etape === "naissance") return "/naissance";
  if (etape === "consentement") return "/consentement";
  return "/consentement/revoque";
}

async function sessionAutorisee(): Promise<SessionOuverture> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { statut: "session-expiree" };

  // Une Server Action est un endpoint : elle ne peut se reposer sur la garde de `app/page.tsx`.
  // L'état complet est réaffirmé AVANT prénom, branches ou journal (données art. 9).
  const etape = await etapeOnboardingPour(supabase, user.id);
  if (etape !== "suite") {
    return { statut: "acces-incomplet", destination: destinationAccesIncomplet(etape) };
  }

  const maintenant = new Date();
  const jourParis = cleJourParis(maintenant);
  return jourParis
    ? { statut: "autorisee", supabase, user, jourParis, maintenant }
    : { statut: "incident-temporaire" };
}

function toursPourRendu(
  fil: Awaited<ReturnType<typeof lireFilRecent>>,
): readonly TourOuverture[] {
  return fil.map(({ id, role, texte, separateurAvant }) => ({
    id,
    role,
    texte,
    ...(separateurAvant ? { separateurAvant: true as const } : {}),
  }));
}

function rearmementDepuisServeur(reference: Date): number {
  // Même instant de référence que `jourParis`. Reprendre `new Date()` après les RPC pouvait franchir
  // minuit et renvoyer le jour J avec un délai jusqu'à J+2, donc faire manquer J+1 à l'onglet ouvert.
  return delaiAvantProchainJourParis(reference) ?? 60_000;
}

function lierEvenementPersiste(
  jourParis: string,
  ligne: { readonly contenu: string; readonly evenement: unknown } | null,
): OuvertureLiee | null {
  if (!ligne) return null;
  const donnees = ouvertureDepuisInconnu(ligne.evenement);
  // La phrase du JSON ne peut jamais remplacer celle du journal immuable. Une divergence signifie
  // enveloppe corrompue/ancienne : le texte reste visible, mais aucun geste n'est fabriqué dessus.
  if (!donnees || donnees.phrase !== ligne.contenu) return null;
  return { tourId: `anam:ouverture-jour:${jourParis}`, donnees };
}

async function matiereOuverture(
  contexte: Extract<SessionOuverture, { statut: "autorisee" }>,
): Promise<MatiereOuverture> {
  const { supabase, user } = contexte;
  const [prenom, branches, presenceJournal] = await Promise.all([
    lirePrenom(supabase, user.id).catch(() => null),
    creerDepotBranche(supabase).chargerBranches().catch(() => []),
    supabase.from("entree_journal").select("id").limit(1),
  ]);
  const branchesVivantes = [...branches]
    .filter((branche) => branche.etat !== "rayonnement" && branche.nom)
    .reverse()
    .map((branche) => branche.nom);
  const dejaVenue =
    branches.length > 0
      ? true
      : presenceJournal.error
        ? null
        : (presenceJournal.data?.length ?? 0) > 0;
  return { prenom, branchesVivantes, dejaVenue };
}

/**
 * Premier accès visible du jour. La RPC attribue d'abord un bail : UN seul onglet exécute ensuite
 * l'arbitrage (dont certaines branches réservent une parole), puis finalise UNE ligne immuable.
 * Une ouverture précise remplace la question générique et porte elle-même la salutation : jamais
 * deux prises de parole d'Anam à la suite.
 */
export async function reclamerOuvertureDuJour(): Promise<ResultatOuvertureDuJour> {
  try {
    const contexte = await sessionAutorisee();
    if (contexte.statut !== "autorisee") return contexte;
    const { supabase, user, jourParis, maintenant } = contexte;

    const droit = await commencerOuvertureQuotidienne(user.id, jourParis);
    if (droit.statut === "en-cours") {
      // Deux reprises automatiques à 5 s puis 10 s couvrent le bail SQL de 15 s sans le marteler.
      return { statut: "en-cours", reessayerApresMs: 5_000 };
    }
    if (droit.statut === "deja-commencee") {
      const fil = await lireFilRecent(supabase, maintenant);
      return {
        statut: "deja-commencee",
        jourParis,
        rearmementMs: rearmementDepuisServeur(maintenant),
        tours: toursPourRendu(fil),
        ouverture: lierEvenementPersiste(jourParis, droit.ligne),
      };
    }

    const matiere = await matiereOuverture(contexte);
    // Cette sélection est PURE : pause/invitation ne sont réservées qu'à l'intérieur de la RPC qui
    // grave le journal. Un crash, un takeover du bail ou minuit ne peut donc plus brûler leur fenêtre.
    const preparee = await preparerOuverture(supabase, user.id, maintenant);
    const evenement = preparee
      ? {
          ...preparee.ouverture,
          phrase: saluerOuvertureEvenement(preparee.ouverture.phrase, matiere),
        }
      : null;
    const phraseGenerique = phraseDOuverture(matiere);
    const ligne = await finaliserOuvertureQuotidienne(
      user.id,
      jourParis,
      droit.jeton,
      phraseGenerique,
      {
        public: evenement,
        interne: preparee?.reservation ?? null,
      },
    );
    const fil = await lireFilRecent(supabase, maintenant);

    return {
      statut: "ouverte",
      jourParis,
      rearmementMs: rearmementDepuisServeur(maintenant),
      tours: toursPourRendu(fil),
      // Le JSON RELU fait foi. Un ancien client 0082 ou une réservation refusée rendent `null` : la
      // phrase générique persistée reste visible, sans forme interactive inventée côté client.
      ouverture: lierEvenementPersiste(jourParis, ligne),
    };
  } catch (e) {
    const statut =
      e instanceof ErreurDepotOuvertureQuotidienne
        ? e.causeOuverture
        : "incident-temporaire";
    console.error("[ouverture] réclamation impossible — aucun tour éphémère n’est inventé", {
      cause: e instanceof ErreurLectureOnboarding ? e.code : statut,
    });
    return { statut };
  }
}

/**
 * Réévalue un événement après un geste serveur confirmé (notamment la naissance d'une branche).
 * Ce chemin est indépendant du bonjour quotidien : il restaure la réactivité de la Story 4.10 sans
 * provoquer un second accueil. Les réservations propres à chaque événement gardent l'idempotence.
 */
export async function chargerOuvertureCourante(): Promise<ResultatOuvertureCourante> {
  try {
    const contexte = await sessionAutorisee();
    if (contexte.statut !== "autorisee") return { statut: "indisponible" };
    const ouverture = await chargerOuverture(
      contexte.supabase,
      contexte.user.id,
      contexte.maintenant,
    );
    return { statut: "disponible", ouverture };
  } catch (e) {
    console.error("[ouverture] réévaluation impossible", {
      nom: e instanceof Error ? e.name : "inconnu",
    });
    return { statut: "indisponible" };
  }
}
