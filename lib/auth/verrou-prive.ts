import "server-only";
import { cookies } from "next/headers";
export { routeExempteeDuVerrou } from "./routes-verrou";

export const COOKIE_DEVERROUILLAGE = "anam_deverrouillage";
export const CLE_METADATA_PASSKEY = "anima_passkey_required";

/**
 * Un cookie de SESSION, volontairement sans `maxAge` ni `expires` : fermer le navigateur referme
 * aussi Anam, même si la longue session Supabase subsiste. Sa valeur n'est pas un secret inventé
 * par le client mais le `session_id` du JWT vérifié ; le proxy exige les deux ET l'AMR `passkey`.
 */
export const OPTIONS_COOKIE_DEVERROUILLAGE = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development",
  sameSite: "lax",
  path: "/",
} as const;

type EnvironnementPasskeys = Readonly<Record<string, string | undefined>>;
type UtilisateurAvecMetadata = { readonly app_metadata?: Record<string, unknown> } | null | undefined;
type EntreeAmr = string | { readonly method?: unknown; readonly timestamp?: unknown };
export type ClaimsVerrou = {
  readonly session_id?: unknown;
  readonly amr?: unknown;
  readonly iat?: unknown;
} | null | undefined;

/** Porte de déploiement fermée : aucun synonyme implicite n'active une API encore expérimentale. */
export function passkeysActives(env: EnvironnementPasskeys = process.env): boolean {
  return env.ANIMA_PASSKEYS === "oui";
}

/** Une URL destinée à `redirect` reste un chemin de cette origine, même avec les formes piégeuses. */
export function destinationInterne(valeur: unknown, repli = "/"): string {
  if (typeof valeur !== "string" || !valeur.startsWith("/") || valeur.startsWith("//")) {
    return repli;
  }
  // Les navigateurs traitent l'anti-slash comme un slash dans une URL spéciale : `/\evil` fuit.
  if (valeur.includes("\\")) return repli;
  try {
    const origine = "https://destination-interne.invalid";
    const cible = new URL(valeur, origine);
    if (cible.origin !== origine) return repli;
    return `${cible.pathname}${cible.search}${cible.hash}`;
  } catch {
    return repli;
  }
}

export function passkeyRequise(utilisateur: UtilisateurAvecMetadata): boolean {
  return utilisateur?.app_metadata?.[CLE_METADATA_PASSKEY] === true;
}

function entreesAmr(claims: ClaimsVerrou): readonly EntreeAmr[] {
  return Array.isArray(claims?.amr) ? (claims.amr as EntreeAmr[]) : [];
}

export function amrContient(claims: ClaimsVerrou, methode: string): boolean {
  return entreesAmr(claims).some((entree) =>
    typeof entree === "string" ? entree === methode : entree?.method === methode,
  );
}

/**
 * Les AMR Supabase récents portent leur propre horodatage. La forme RFC `string[]`, encore admise
 * par le SDK, reprend l'`iat` du JWT : on ne transforme jamais une session ancienne en réauth récente.
 */
export function authentificationRecente(
  claims: ClaimsVerrou,
  methodes: ReadonlySet<string>,
  ageMaxSecondes: number,
  maintenantSecondes = Math.floor(Date.now() / 1_000),
): boolean {
  const iat = typeof claims?.iat === "number" ? claims.iat : null;
  return entreesAmr(claims).some((entree) => {
    const methode = typeof entree === "string" ? entree : entree?.method;
    if (typeof methode !== "string" || !methodes.has(methode)) return false;
    const date =
      typeof entree === "string"
        ? iat
        : typeof entree.timestamp === "number"
          ? entree.timestamp
          : null;
    if (date === null) return false;
    const age = maintenantSecondes - date;
    return age >= -60 && age <= ageMaxSecondes;
  });
}

export function idSessionSignee(claims: ClaimsVerrou): string | null {
  return typeof claims?.session_id === "string" && claims.session_id.length > 0
    ? claims.session_id
    : null;
}

/** Les trois conditions sont nécessaires : JWT vérifié, AMR passkey et marqueur de CETTE session. */
export function sessionDeverrouillee(
  claims: ClaimsVerrou,
  marqueur: string | null | undefined,
): boolean {
  const sessionId = idSessionSignee(claims);
  return Boolean(sessionId && marqueur === sessionId && amrContient(claims, "passkey"));
}

export async function lireDeverrouillage(): Promise<string | null> {
  return (await cookies()).get(COOKIE_DEVERROUILLAGE)?.value ?? null;
}

export async function poserDeverrouillage(claims: ClaimsVerrou): Promise<boolean> {
  const sessionId = idSessionSignee(claims);
  if (!sessionId || !amrContient(claims, "passkey")) return false;
  (await cookies()).set(
    COOKIE_DEVERROUILLAGE,
    sessionId,
    OPTIONS_COOKIE_DEVERROUILLAGE,
  );
  return true;
}

export async function effacerDeverrouillage(): Promise<void> {
  (await cookies()).delete(COOKIE_DEVERROUILLAGE);
}
