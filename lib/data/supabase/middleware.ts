import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { OPTIONS_COOKIE_SESSION } from "./cookies-session";
import {
  COOKIE_DEVERROUILLAGE,
  destinationInterne,
  passkeyRequise,
  passkeysActives,
  routeExempteeDuVerrou,
  sessionDeverrouillee,
} from "@/lib/auth/verrou-prive";

function recopierCookies(source: NextResponse, cible: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) cible.cookies.set(cookie);
  return cible;
}

/**
 * Rafraîchit silencieusement la session à chaque requête (Story 1.3, AC4).
 *
 * `getUser()` — JAMAIS `getSession()` en code serveur : getUser revalide le token
 * auprès du serveur Auth et le rafraîchit s'il a expiré. C'est ce qui garantit une
 * session longue sans ré-authentification qui interrompt (WCAG 2.2.1).
 * Clé publishable + cookies uniquement ; jamais service_role (AD-2, AD-12).
 *
 * `enTetesSupplementaires` (Story 2.2, B1) : en-têtes à AJOUTER à la requête propagée (nonce CSP
 * posé par `proxy.ts`). ⚠️ On les MERGE sur `request.headers` reconstruits À CHAQUE fois, JAMAIS sur
 * une copie figée : dans `setAll`, `request.cookies.set` mute `request.headers` (le cookie frais) ;
 * il faut donc RELIRE `request.headers` APRÈS la mutation pour que la page en aval reçoive les
 * nouveaux cookies. Une copie prise une fois d'avance forwarderait l'ANCIEN cookie → la page
 * rejouerait un token périmé → boucle de déconnexion (piège n°1, revue 2.2). `construireReponse`
 * garantit cette relecture. Sans `enTetesSupplementaires` (routes /api), comportement 1.3 inchangé.
 */
export async function updateSession(
  request: NextRequest,
  enTetesSupplementaires?: Record<string, string>,
) {
  const construireReponse = () => {
    // Repart TOUJOURS de request.headers LIVE (→ reflète les cookies mutés par setAll) + le nonce.
    const enTetes = new Headers(request.headers);
    if (enTetesSupplementaires) {
      for (const [cle, valeur] of Object.entries(enTetesSupplementaires)) enTetes.set(cle, valeur);
    }
    return NextResponse.next({ request: { headers: enTetes } });
  };

  let response = construireReponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { experimental: { passkey: true } },
      // Mêmes attributs que `server.ts` — un seul objet partagé, sinon le durcissement d'un chemin
      // laisse l'autre poser l'ancien cookie (voir `cookies-session.ts`).
      cookieOptions: OPTIONS_COOKIE_SESSION,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = construireReponse(); // relit request.headers muté + re-merge le nonce
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (
    !passkeysActives() ||
    !user ||
    !passkeyRequise(user) ||
    routeExempteeDuVerrou(pathname)
  ) {
    return response;
  }

  const { data: jeton, error } = await supabase.auth.getClaims();
  const deverrouillee =
    !error &&
    sessionDeverrouillee(
      jeton?.claims,
      request.cookies.get(COOKIE_DEVERROUILLAGE)?.value,
    );
  if (deverrouillee) return response;

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return recopierCookies(
      response,
      NextResponse.json(
        { code: "verrouille", message: "Déverrouille Anam pour continuer." },
        {
          status: 423,
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      ),
    );
  }

  const destination = destinationInterne(`${pathname}${search}`);
  const verrou = request.nextUrl.clone();
  verrou.pathname = "/verrou";
  verrou.search = "";
  verrou.searchParams.set("vers", destination);
  // 303 est intentionnel : une Server Action verrouillée ne doit jamais rejouer son POST vers
  // `/verrou`. Le navigateur ouvre la porte par un GET propre, sans corps sensible à retransmettre.
  return recopierCookies(response, NextResponse.redirect(verrou, 303));

}
