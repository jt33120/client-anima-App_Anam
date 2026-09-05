/**
 * État éphémère du document courant. Un rechargement recrée le module ; une navigation cliente,
 * un `router.refresh` ou une restauration BFCache conservent son instance.
 */
const cheminDocumentInitial =
  typeof window === "undefined" ? null : window.location.pathname;

let portailReserve = false;

export function documentPeutRecevoirLePortail(
  cheminInitial: string | null,
  cheminCourant: string,
  dejaReserve: boolean,
): boolean {
  return !dejaReserve && cheminInitial === "/" && cheminCourant === "/";
}

/** Réserve le portail une seule fois, uniquement pour un document né directement sur `/`. */
export function reserverPortailDuDocument(cheminCourant: string): boolean {
  if (!documentPeutRecevoirLePortail(cheminDocumentInitial, cheminCourant, portailReserve)) {
    return false;
  }
  portailReserve = true;
  return true;
}
