"use server";

import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { revalidatePath } from "next/cache";
import { destinationApresAuth } from "@/app/(auth)/destination-apres-auth";
import {
  CLE_METADATA_PASSKEY,
  authentificationRecente,
  destinationInterne,
  effacerDeverrouillage,
  lireDeverrouillage,
  passkeyRequise,
  passkeysActives,
  poserDeverrouillage,
  sessionDeverrouillee,
  type ClaimsVerrou,
} from "@/lib/auth/verrou-prive";
import { createSupabaseAdminClient } from "@/lib/data/supabase/admin";
import { createSupabaseServerClient } from "@/lib/data/supabase/server";

const AGE_REAUTHENTIFICATION_S = 15 * 60;
const METHODES_COURRIEL = new Set(["email", "otp", "magiclink", "recovery"]);

export type DebutInscriptionPasskey =
  | {
      readonly ok: true;
      readonly challengeId: string;
      readonly options: PublicKeyCredentialCreationOptionsJSON;
    }
  | { readonly ok: false; readonly message: string };

export type DebutConnexionPasskey =
  | {
      readonly ok: true;
      readonly challengeId: string;
      readonly options: PublicKeyCredentialRequestOptionsJSON;
    }
  | { readonly ok: false; readonly message: string };

export type ResultatPasskey =
  | { readonly ok: true; readonly destination: string }
  | { readonly ok: false; readonly message: string };

export type PasskeyAffichable = {
  readonly id: string;
  readonly nom: string;
  readonly creeeLe: string;
  readonly utiliseeLe: string | null;
};

type UtilisateurAuth = {
  readonly id: string;
  readonly app_metadata: Record<string, unknown>;
};

function identifiantPlausible(valeur: unknown): valeur is string {
  return typeof valeur === "string" && valeur.length >= 16 && valeur.length <= 256;
}

function reponseWebAuthnPlausible(
  valeur: unknown,
): valeur is AuthenticationResponseJSON | RegistrationResponseJSON {
  if (!valeur || typeof valeur !== "object") return false;
  const objet = valeur as Record<string, unknown>;
  return (
    typeof objet.id === "string" &&
    objet.id.length > 0 &&
    objet.id.length <= 8_192 &&
    typeof objet.rawId === "string" &&
    objet.rawId.length <= 8_192 &&
    objet.response !== null &&
    typeof objet.response === "object"
  );
}

async function claimsVerifies(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  return data.claims as ClaimsVerrou;
}

async function modifierExigencePasskey(
  utilisateur: UtilisateurAuth,
  requise: boolean,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(utilisateur.id, {
    app_metadata: {
      ...utilisateur.app_metadata,
      [CLE_METADATA_PASSKEY]: requise,
    },
  });
  return !error;
}

async function contexteInscription() {
  if (!passkeysActives()) return { erreur: "Cette protection n’est pas encore disponible." } as const;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { erreur: "Reconnecte-toi par e-mail avant de continuer." } as const;

  const claims = await claimsVerifies(supabase);
  if (!claims) return { erreur: "Ta session n’a pas pu être vérifiée. Reconnecte-toi." } as const;

  if (passkeyRequise(user)) {
    const marqueur = await lireDeverrouillage();
    if (!sessionDeverrouillee(claims, marqueur)) {
      return { erreur: "Déverrouille d’abord Anam avec ta clé d’accès." } as const;
    }
  } else if (
    !authentificationRecente(
      claims,
      METHODES_COURRIEL,
      AGE_REAUTHENTIFICATION_S,
    ) &&
    // Le compte de démonstration local entre par mot de passe ; cette exception n'existe jamais
    // dans le build de production et évite de rendre WebAuthn invérifiable en développement.
    !(process.env.NODE_ENV === "development" &&
      authentificationRecente(claims, new Set(["password"]), AGE_REAUTHENTIFICATION_S))
  ) {
    return { erreur: "Reconnecte-toi par e-mail : la vérification doit dater de moins de 15 minutes." } as const;
  }

  return {
    supabase,
    user: user as UtilisateurAuth,
    dejaProtegee: passkeyRequise(user),
  } as const;
}

/** Première moitié serveur de la cérémonie : challenge court, lié à la session Auth courante. */
export async function commencerInscriptionPasskey(): Promise<DebutInscriptionPasskey> {
  const contexte = await contexteInscription();
  if ("erreur" in contexte && typeof contexte.erreur === "string") {
    return { ok: false, message: contexte.erreur };
  }

  const { data, error } = await contexte.supabase.auth.passkey.startRegistration();
  if (error || !data) {
    return { ok: false, message: "La protection n’a pas pu démarrer. Réessaie dans un instant." };
  }
  return {
    ok: true,
    challengeId: data.challenge_id,
    options: data.options as PublicKeyCredentialCreationOptionsJSON,
  };
}

/** Deuxième moitié serveur : vérifie la preuve d'origine puis rend la protection obligatoire. */
export async function verifierInscriptionPasskey(
  challengeId: string,
  credential: RegistrationResponseJSON,
  vers = "/",
): Promise<ResultatPasskey> {
  if (!identifiantPlausible(challengeId) || !reponseWebAuthnPlausible(credential)) {
    return { ok: false, message: "La réponse de l’appareil est incomplète. Recommence." };
  }
  const contexte = await contexteInscription();
  if ("erreur" in contexte && typeof contexte.erreur === "string") {
    return { ok: false, message: contexte.erreur };
  }

  const { data, error } = await contexte.supabase.auth.passkey.verifyRegistration({
    challengeId,
    credential,
  });
  if (error || !data) {
    return { ok: false, message: "La clé d’accès n’a pas été enregistrée. Rien n’a été modifié." };
  }

  // Le nom n'est qu'une aide dans Réglages ; une panne de renommage ne doit pas annuler une clé
  // cryptographiquement valide. Supabase borne lui-même cette valeur à 120 caractères.
  await contexte.supabase.auth.passkey.update({
    passkeyId: data.id,
    friendlyName: "Cet appareil",
  });

  if (!contexte.dejaProtegee && !(await modifierExigencePasskey(contexte.user, true))) {
    // Pas de faux sentiment de sécurité : si la politique Auth ne peut être posée, on retire la clé
    // tout juste créée et on annonce l'échec au lieu de laisser une protection facultative cachée.
    await contexte.supabase.auth.passkey.delete({ passkeyId: data.id });
    return { ok: false, message: "La protection n’a pas pu être activée. Rien n’a été conservé." };
  }

  return {
    ok: true,
    destination: contexte.dejaProtegee
      ? destinationInterne(vers, "/reglages")
      : `/verrou?vers=${encodeURIComponent(destinationInterne(vers))}`,
  };
}

/** Challenge sans adresse : la passkey découvrable sait à quel compte elle appartient. */
export async function commencerConnexionPasskey(): Promise<DebutConnexionPasskey> {
  if (!passkeysActives()) return { ok: false, message: "Cette reconnexion n’est pas disponible." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.passkey.startAuthentication();
  if (error || !data) {
    return { ok: false, message: "La reconnexion sécurisée n’a pas pu démarrer. Réessaie." };
  }
  return {
    ok: true,
    challengeId: data.challenge_id,
    options: data.options as PublicKeyCredentialRequestOptionsJSON,
  };
}

/** Vérifie l'assertion, installe la nouvelle session HttpOnly et lie le déverrouillage à son JWT. */
export async function verifierConnexionPasskey(
  challengeId: string,
  credential: AuthenticationResponseJSON,
  vers = "/",
): Promise<ResultatPasskey> {
  if (!passkeysActives()) return { ok: false, message: "Cette reconnexion n’est pas disponible." };
  if (!identifiantPlausible(challengeId) || !reponseWebAuthnPlausible(credential)) {
    return { ok: false, message: "La réponse de l’appareil est incomplète. Recommence." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.passkey.verifyAuthentication({
    challengeId,
    credential,
  });
  if (error || !data?.session || !data.user) {
    return { ok: false, message: "Cette clé n’a pas été reconnue. Essaie l’e-mail si besoin." };
  }

  const { data: jeton, error: erreurJeton } = await supabase.auth.getClaims(
    data.session.access_token,
  );
  const claims = jeton?.claims as ClaimsVerrou;
  if (erreurJeton || !claims || !(await poserDeverrouillage(claims))) {
    await supabase.auth.signOut();
    return { ok: false, message: "La preuve de l’appareil n’a pas pu être vérifiée. Recommence." };
  }

  const utilisateur = data.user as UtilisateurAuth;
  if (!passkeyRequise(utilisateur) && !(await modifierExigencePasskey(utilisateur, true))) {
    await effacerDeverrouillage();
    await supabase.auth.signOut();
    return { ok: false, message: "La protection du compte n’a pas pu être confirmée." };
  }

  return {
    ok: true,
    destination: await destinationApresAuth(supabase, destinationInterne(vers), {
      passkeyVerifiee: true,
    }),
  };
}

export async function listerPasskeys(): Promise<readonly PasskeyAffichable[]> {
  if (!passkeysActives()) return [];
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.auth.passkey.list();
  if (error || !data) return [];
  return data.map((passkey, index) => ({
    id: passkey.id,
    nom: passkey.friendly_name?.trim() || `Clé d’accès ${index + 1}`,
    creeeLe: passkey.created_at,
    utiliseeLe: passkey.last_used_at ?? null,
  }));
}

export async function supprimerPasskey(passkeyId: string): Promise<ResultatPasskey> {
  if (!identifiantPlausible(passkeyId) || !passkeysActives()) {
    return { ok: false, message: "Cette clé d’accès est introuvable." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const claims = await claimsVerifies(supabase);
  if (!user || !claims || !sessionDeverrouillee(claims, await lireDeverrouillage())) {
    return { ok: false, message: "Déverrouille Anam avant de retirer une clé d’accès." };
  }

  const { data: passkeys, error: erreurListe } = await supabase.auth.passkey.list();
  if (erreurListe || !passkeys?.some((passkey) => passkey.id === passkeyId)) {
    return { ok: false, message: "Cette clé d’accès est introuvable." };
  }

  const derniere = passkeys.length === 1;
  const utilisateur = user as UtilisateurAuth;
  if (derniere && !(await modifierExigencePasskey(utilisateur, false))) {
    return { ok: false, message: "La protection n’a pas pu être retirée. Rien n’a changé." };
  }

  const { error } = await supabase.auth.passkey.delete({ passkeyId });
  if (error) {
    if (derniere) await modifierExigencePasskey(utilisateur, true);
    return { ok: false, message: "La clé n’a pas pu être retirée. Réessaie." };
  }

  if (derniere) await effacerDeverrouillage();
  revalidatePath("/reglages");
  return { ok: true, destination: "/reglages" };
}

/** Récupération après une nouvelle preuve e-mail : retire la politique avant la dernière clé. */
export async function recupererProtectionParEmail(): Promise<ResultatPasskey> {
  if (!passkeysActives()) return { ok: false, message: "Cette protection n’est pas active." };
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const claims = await claimsVerifies(supabase);
  if (
    !user ||
    !claims ||
    !authentificationRecente(claims, METHODES_COURRIEL, AGE_REAUTHENTIFICATION_S)
  ) {
    return { ok: false, message: "Le lien e-mail est absent ou trop ancien. Redemande-en un." };
  }

  const utilisateur = user as UtilisateurAuth;
  const admin = createSupabaseAdminClient();
  const { data: passkeys, error: erreurListe } = await admin.auth.admin.passkey.listPasskeys({
    userId: user.id,
  });
  if (erreurListe || !passkeys) {
    return { ok: false, message: "Les clés d’accès n’ont pas pu être vérifiées. Réessaie." };
  }
  // On garde UNE clé et la politique obligatoire jusqu'au dernier instant. Supprimer tout après
  // avoir désactivé la politique créerait une fenêtre non protégée au premier incident réseau ;
  // supprimer tout avant créerait un compte verrouillé si la métadonnée refusait ensuite de bouger.
  const derniere = passkeys.at(-1) ?? null;
  for (const passkey of derniere ? passkeys.slice(0, -1) : []) {
    const { error } = await admin.auth.admin.passkey.deletePasskey({
      userId: user.id,
      passkeyId: passkey.id,
    });
    if (error) {
      return { ok: false, message: "Une clé résiste encore. Réessaie avant de quitter cette page." };
    }
  }

  if (!(await modifierExigencePasskey(utilisateur, false))) {
    return { ok: false, message: "La protection n’a pas pu être retirée. Une clé reste active." };
  }

  if (derniere) {
    const { error } = await admin.auth.admin.passkey.deletePasskey({
      userId: user.id,
      passkeyId: derniere.id,
    });
    if (error) {
      await modifierExigencePasskey(utilisateur, true);
      return { ok: false, message: "La dernière clé résiste encore. Réessaie avant de quitter cette page." };
    }
  }

  await effacerDeverrouillage();
  return { ok: true, destination: "/" };
}
