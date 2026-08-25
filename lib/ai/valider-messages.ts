import "server-only";
import type { MessageIa } from "./port";

/**
 * Valide le corps d'une requête de message SANS jamais journaliser le contenu (art. 9).
 *
 * N'accepte QUE les rôles `user`/`assistant` du client. Le rôle `system` est **injecté côté
 * serveur** (Story 2.2), JAMAIS accepté depuis le navigateur : sinon une cliente contrôlerait le
 * prompt système et contournerait les garde-fous (divulgation IA, détresse) — revue 2.1.
 *
 * Le rôle `tool` n'est pas davantage accepté — et ce refus-là est désormais EXPLICITE, voir plus bas.
 */
export function extraireMessages(corps: unknown): MessageIa[] | null {
  if (typeof corps !== "object" || corps === null || !("messages" in corps)) return null;
  const brut = (corps as { messages: unknown }).messages;
  if (!Array.isArray(brut)) return null;
  const rolesClient = new Set(["user", "assistant"]); // JAMAIS "system" depuis le client
  const messages: MessageIa[] = [];
  for (const m of brut) {
    if (typeof m !== "object" || m === null) return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (typeof role !== "string" || !rolesClient.has(role) || typeof content !== "string") {
      return null;
    }
    /**
     * ⚠️ UN CANAL D'OUTIL EST REFUSÉ EXPLICITEMENT, PAS SEULEMENT IGNORÉ (Story 9.2, 2026-08-26).
     *
     * Aujourd'hui l'invariant tient déjà — la ligne ci-dessous ne recopie QUE `role` et `content`,
     * donc `tool_calls` n'irait nulle part. Mais il tient par CONSTRUCTION SILENCIEUSE, et la
     * première personne qui écrira `messages.push({ ...m })` pour « simplifier » l'ouvrira sans
     * s'en apercevoir : le client possède déjà la moitié de ce tableau (il envoie `assistant`),
     * et un canal d'outil y serait une injection.
     *
     * C'est exactement pour cette raison que `detecteur-detresse.ts` ne lit que les tours `user`.
     *
     * Un refus explicite fait deux choses qu'un oubli ne fait pas : il ARRÊTE la requête au lieu
     * de la laisser passer amputée, et il dit à qui refactorise que ce n'était pas un hasard.
     */
    if ("tool_calls" in (m as object) || "toolCalls" in (m as object) || "tool_call_id" in (m as object)) {
      return null;
    }
    messages.push({ role: role as MessageIa["role"], content });
  }
  return messages.length > 0 ? messages : null;
}
