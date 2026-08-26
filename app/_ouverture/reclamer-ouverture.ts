"use server";

import { etapeOnboardingPour } from "@/app/(auth)/etat-onboarding";
import { creerDepotBranche } from "@/lib/data/depot-branche";
import { lireFilRecent } from "@/lib/data/depot-fil";
import {
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

type ResultatOuvertureDuJour =
  | {
      readonly statut: "ouverte" | "deja-commencee";
      readonly jourParis: string;
      readonly rearmementMs: number;
      readonly tours: readonly TourOuverture[];
      readonly ouverture: OuvertureLiee | null;
    }
  | { readonly statut: "en-cours"; readonly reessayerApresMs: number }
  | { readonly statut: "indisponible" };

type ResultatOuvertureCourante =
  | { readonly statut: "disponible"; readonly ouverture: Ouverture | null }
  | { readonly statut: "indisponible" };

async function sessionAutorisee() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Une Server Action est un endpoint : elle ne peut se reposer sur la garde de `app/page.tsx`.
  // L'état complet est réaffirmé AVANT prénom, branches ou journal (données art. 9).
  if ((await etapeOnboardingPour(supabase, user.id)) !== "suite") return null;

  const maintenant = new Date();
  const jourParis = cleJourParis(maintenant);
  return jourParis ? { supabase, user, jourParis, maintenant } : null;
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
  contexte: NonNullable<Awaited<ReturnType<typeof sessionAutorisee>>>,
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
    if (!contexte) return { statut: "indisponible" };
    const { supabase, user, jourParis, maintenant } = contexte;

    const droit = await commencerOuvertureQuotidienne(user.id, jourParis);
    if (droit.statut === "en-cours") {
      return { statut: "en-cours", reessayerApresMs: 300 };
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
    console.error("[ouverture] réclamation impossible — aucun tour éphémère n’est inventé", {
      nom: e instanceof Error ? e.name : "inconnu",
    });
    return { statut: "indisponible" };
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
    if (!contexte) return { statut: "indisponible" };
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
