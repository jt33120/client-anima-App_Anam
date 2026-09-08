import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lireLectureNumerologie } from "@/lib/data/depot-lecture-numerologie";
import { creerDepotBranche } from "@/lib/data/depot-branche";
import { lireFaitsRetenus } from "@/lib/data/lire-memoire";
import type { FaitRetenu } from "@/lib/domain/memoire-retenue";
import { lireEnneagramme } from "@/lib/data/lire-enneagramme";
import { lireThemeNatal } from "@/lib/data/depot-theme-natal";
import type { ThemeNatal } from "@/lib/astro/theme-natal";
import { placer } from "@/lib/astro/theme-natal";
import { SIGNE_LIBELLE } from "@/lib/domain/cartes-socle";
import {
  CONTEXTE_BRANCHES_MAX,
  CONTEXTE_RETENU_MAX,
  type MatiereContexte,
} from "@/lib/domain/contexte-anam";

/**
 * lire-contexte-anam.ts — LA MATIÈRE DU CONTEXTE, LUE SOUS LE JWT (QA manuelle du 2026-08-20).
 *
 * L'autre moitié de `lib/domain/contexte-anam.ts`, qui, lui, ne lit rien. Ce partage n'est pas
 * cosmétique : la COMPOSITION du contexte est ce qu'on veut tester sans base, et c'est aussi ce
 * qu'un jour on voudra faire relire à Anima. La LECTURE, elle, doit passer par les fonctions
 * possédées et la RLS (AD-12), qui sont ce qui garantit qu'on ne lit que les siennes.
 *
 * ⚠️ CINQ LECTURES, CINQ REPLIS, ET AUCUNE N'EST CRITIQUE. Une panne de socle ou de mémoire ne doit
 * PAS empêcher quelqu'un de parler à Anam : chaque source tombe sur « je ne sais pas », et le
 * module pur sait dire l'ignorance mieux que le silence. C'est la même politique que la page de
 * scène, pour la même raison.
 *
 * ⚠️ LE THÈME EST LU, JAMAIS RECALCULÉ ICI — ET C'EST UNE PRÉCAUTION MESURABLE. `lireThemeNatal`
 * peut ÉCRIRE : premier calcul, ou recalcul après l'ajout de l'heure, et dans le cas dégradé ce
 * calcul coûte ~663 lectures d'éphéméride. Le mettre sur le chemin d'un tour de conversation
 * ajouterait ce coût à chaque message. On ne l'appelle donc que si un thème EXISTE déjà — la page
 * de scène l'a calculé au chargement —, et sur le chemin du tour on se contente de sa lecture.
 */

/** Ce qu'on met en mots du socle : ce qui se dit, jamais des degrés. */
const CORPS_DITS = [
  { corps: "soleil", intitule: "Soleil" },
  { corps: "lune", intitule: "Lune" },
] as const;

/**
 * Le socle d'un thème DÉJÀ LU, mis en mots.
 *
 * ⚠️ ELLE DIT « Soleil en Gémeaux », PAS « Soleil en gemeaux » — ET C'EST UN CORRECTIF, PAS UN
 * DÉTAIL (2026-09-07). Ce module collait la CLÉ D'ÉNUMÉRATION brute (`p.signe`, minuscule et sans
 * accent) là où `MatiereContexte.socle` documente « Soleil en Balance ». Depuis le 2026-08-20, ce
 * qui partait à Mistral dans la conversation d'Anam était donc « Ascendant poissons ». Personne ne
 * l'a vu : le commentaire décrivait une sortie que le code ne produisait pas, et aucune garde ne
 * lisait la chaîne. `SIGNE_LIBELLE` est la table unique du produit — la même que la halte du socle.
 *
 * ⚠️ ET ELLE PASSE PAR `placer`, LA DÉRIVATION UNIQUE. Le `signeDeLongitude` local qui vivait ici
 * était une SECONDE dérivation longitude → signe, à côté de celle de `theme-natal.ts`. Deux
 * dérivations d'une même vérité finissent par diverger, et celle-là ne rendait même pas le libellé.
 */
function socleDit(theme: ThemeNatal): readonly string[] {
  const dits: string[] = [];
  for (const { corps, intitule } of CORPS_DITS) {
    const p = theme.positions.find((x) => x.corps === corps);
    if (p) dits.push(`${intitule} en ${SIGNE_LIBELLE[p.signe]}`);
  }
  if (theme.angles.statut === "calcule") {
    dits.push(`Ascendant ${SIGNE_LIBELLE[placer(theme.angles.ascendant).signe]}`);
  }
  return dits;
}

async function lireSocle(supabase: SupabaseClient, utilisatriceId: string): Promise<readonly string[]> {
  const resultat = await lireThemeNatal(supabase, utilisatriceId);
  return resultat.statut === "calcule" ? socleDit(resultat.theme) : [];
}

/**
 * Toute la matière, à partir d'un socle DÉJÀ résolu. `premiereFois` est dérivé de l'ABSENCE de tout :
 * aucune branche, aucun fait retenu. Ce n'est pas exactement « aucune séance » — quelqu'un peut avoir
 * parlé sans que rien ne soit retenu —, et c'est pourquoi le module pur distingue les deux cas au
 * lieu de les confondre dans un seul message.
 *
 * ⚠️ LE SOCLE ARRIVE EN PROMESSE, ET CE N'EST PAS DE LA COQUETTERIE. Il est ainsi lancé DANS le même
 * `Promise.all` que les quatre autres lectures : passé en valeur, il aurait fallu l'attendre avant,
 * et les cinq lectures seraient devenues quatre lectures après une. C'est ce qui permet aux deux
 * appelants — celui qui lit le thème et celui qui l'a déjà — de partager ce corps sans que l'un
 * paie la latence de l'autre.
 */
async function lireMatiere(
  supabase: SupabaseClient,
  utilisatriceId: string,
  socleEnCours: Promise<readonly string[]>,
): Promise<MatiereContexte> {
  const [prenom, socle, branches, retenu, type] = await Promise.all([
    Promise.resolve(
      supabase
        .from("utilisatrice")
        .select("prenom")
        .eq("id", utilisatriceId)
        .maybeSingle<{ prenom: string | null }>(),
    )
      .then((r) => r.data?.prenom ?? null)
      .catch(() => null),
    socleEnCours.catch(() => [] as readonly string[]),
    creerDepotBranche(supabase)
      .chargerBranches()
      .catch(() => []),
    lireFaitsRetenus(supabase).catch(() => [] as readonly FaitRetenu[]),
    lireEnneagramme(supabase, utilisatriceId).catch(() => ({ statut: "indisponible" as const, raison: "lecture_impossible" as const })),
  ]);

  return {
    prenom,
    socle,
    // Les plus RÉCENTES d'abord : ce qui vient d'être nommé est ce qui a le plus de chances de
    // revenir dans le tour en cours.
    branches: [...branches]
      .sort((a, b) => b.dateNaissance.localeCompare(a.dateNaissance))
      .slice(0, CONTEXTE_BRANCHES_MAX)
      .map((b) => ({ nom: b.nom, enPleineLumiere: b.etat === "rayonnement" })),
    retenu: retenu.slice(0, CONTEXTE_RETENU_MAX).map((f) => f.contenu),
    /* ⚠️ LE NUMÉRO DU TYPE, PAS SON TEXTE DE CORPUS. `texteDuTypeRetenu` rend un `TexteCorpus`,
       qui est `non_ecrit` tant qu'Anima n'a pas écrit les neuf textes — et le sera longtemps. Le
       numéro, lui, est un fait de la base. On dit aussi d'où il vient : un type PASSÉ par le test
       et un type PRESSENTI par Anam n'ont pas le même poids, et les confondre ferait traiter une
       hypothèse comme un résultat. */
    typePressenti:
      type.statut === "calcule"
        ? `type ${type.type}${type.origine === "hypothese" ? " (hypothèse d’Anam, non confirmée par le test)" : " (issu du test)"}`
        : null,
    premiereFois: branches.length === 0 && retenu.length === 0,
  };
}

/** La matière d'un tour de conversation : le thème est LU ici, jamais recalculé (voir l'en-tête). */
export async function lireContexteAnam(
  supabase: SupabaseClient,
  utilisatriceId: string,
): Promise<MatiereContexte> {
  const [matiere, lecture] = await Promise.all([
    lireMatiere(supabase, utilisatriceId, lireSocle(supabase, utilisatriceId)),
    lireLectureNumerologie(supabase, utilisatriceId).catch(() => null),
  ]);
  return { ...matiere, portraitNumerologie: lecture?.note === 5 && lecture.partageAnam ? lecture.portrait : null };
}

/**
 * La matière du TEXTE DU JOUR (2026-09-07), à partir d'un thème que l'appelant a déjà en main.
 *
 * ⚠️ LE THÈME EST DONNÉ, PAS RELU — ET C'EST LA MÊME PRÉCAUTION QUE L'EN-TÊTE, D'UN CRAN PLUS
 * SÉVÈRE. `lireContexteAnam` fait une LECTURE de thème de plus ; ici, les deux appelants (la halte
 * du socle et l'accueil) l'ont déjà lu dans le même rendu, et `lireThemeNatal` peut ÉCRIRE. Le
 * rappeler ajouterait une requête au chemin le plus chaud du produit pour une valeur déjà sur la
 * pile — c'est exactement le piège P10, celui qui a déjà coûté deux calculs concurrents sur le
 * premier chargement d'un compte.
 */
export async function lireMatiereDuJour(
  supabase: SupabaseClient,
  utilisatriceId: string,
  theme: ThemeNatal,
): Promise<MatiereContexte> {
  return lireMatiere(supabase, utilisatriceId, Promise.resolve(socleDit(theme)));
}
