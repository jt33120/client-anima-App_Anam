/**
 * Le vocabulaire graphique partagé des trois univers.
 *
 * Ces tracés viennent de la porte canonique de la région d'accueil (« Aujourd’hui » depuis le
 * 2026-09-02, « Moi » avant). Ils restent décoratifs : le lien ou le
 * contrôle qui les accueille porte déjà son propre nom accessible.
 */
export type CleGlypheUnivers = "astrologie" | "numerologie" | "psychologie";

export default function GlypheUnivers({ cle }: { readonly cle: CleGlypheUnivers }) {
  if (cle === "astrologie") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden>
        <path d="M39 10a23 23 0 1 0 14 38A20 20 0 1 1 39 10Z" />
        <path d="m48 14 1.7 4.3L54 20l-4.3 1.7L48 26l-1.7-4.3L42 20l4.3-1.7Z" />
        <circle cx="51" cy="36" r="2" />
      </svg>
    );
  }
  if (cle === "numerologie") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r="24" />
        <circle cx="32" cy="20" r="12" />
        <circle cx="42.4" cy="38" r="12" />
        <circle cx="21.6" cy="38" r="12" />
        <path d="M32 8v48M11.2 44 52.8 20M11.2 20 52.8 44" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <path d="M32 52V29" />
      <path d="M32 41C21 39 14 31 16 20c9 0 16 6 16 17" />
      <path d="M32 41c11-2 18-10 16-21-9 0-16 6-16 17" />
      <path d="M22 51c4-5 8-7 10-7s6 2 10 7" />
      <circle cx="32" cy="14" r="5" />
    </svg>
  );
}
