import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { pratiqueParId, texteRecommandationPratique, type Pratique } from "@/lib/domain/pratiques";

const DOMAINE = "anam:pratique:v1";
const ANNOTATION = /\n<!-- anam-pratique:v1:([a-z0-9-]{1,80}):([a-f0-9]{64}) -->$/;

function signature(utilisatriceId: string, cleTour: string, pratiqueId: string): string | null {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return null;
  // Domain separation prevents reuse of this MAC by another capability. JSON encodes component
  // boundaries unambiguously; the row's owner and logical turn make copied annotations inert.
  return createHmac("sha256", secret)
    .update(JSON.stringify([DOMAINE, utilisatriceId, cleTour, pratiqueId]))
    .digest("hex");
}

/** Only call after resolving a native tool under the server's safety grant. Never sent on NDJSON. */
export function signerRecommandationPratique(
  texte: string,
  utilisatriceId: string,
  cleTour: string,
  pratique: Pratique,
): string {
  const canonique = pratiqueParId(pratique.id);
  if (!canonique) return texte;
  const preuve = signature(utilisatriceId, cleTour, canonique.id);
  if (!preuve) return texte;
  return texte + texteRecommandationPratique(canonique)
    + `\n<!-- anam-pratique:v1:${canonique.id}:${preuve} -->`;
}

/** A readable label is never authority. Only a MAC tied to this database row grants metadata. */
export function lireRecommandationPratique(
  texte: string,
  utilisatriceId: unknown,
  cleTour: unknown,
): { texte: string; pratiqueId?: string } {
  const annotation = ANNOTATION.exec(texte);
  if (!annotation) return { texte };
  const sansAnnotation = texte.slice(0, annotation.index);
  const sansPreuve = { texte: sansAnnotation };
  if (typeof utilisatriceId !== "string" || typeof cleTour !== "string") return sansPreuve;
  const pratique = pratiqueParId(annotation[1]);
  if (!pratique) return sansPreuve;
  const attendu = signature(utilisatriceId, cleTour, pratique.id);
  if (!attendu || !timingSafeEqual(Buffer.from(attendu, "hex"), Buffer.from(annotation[2], "hex"))) return sansPreuve;
  const suffixe = texteRecommandationPratique(pratique);
  if (!sansAnnotation.endsWith(suffixe)) return sansPreuve;
  return { texte: sansAnnotation.slice(0, -suffixe.length), pratiqueId: pratique.id };
}
