/** Une seule liste partagée entre la garde serveur et le retour de confidentialité côté client. */
const ROUTES_EXEMPTEES = [
  "/entrer",
  "/auth/confirm",
  "/verrou",
  "/securiser",
  "/naissance",
  "/consentement",
  "/barriere",
  "/aide",
  "/cgu",
  "/desabonnement",
  "/api/verrou",
] as const;

export function routeExempteeDuVerrou(pathname: string): boolean {
  return ROUTES_EXEMPTEES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
