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
        <circle cx="32" cy="32" r="8" />
        <ellipse cx="32" cy="32" rx="25" ry="13" />
        <ellipse cx="32" cy="32" rx="13" ry="25" transform="rotate(35 32 32)" />
      </svg>
    );
  }
  if (cle === "numerologie") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden>
        <path d="M32 7 40 24 58 26 45 39 48 57 32 48 16 57 19 39 6 26 24 24Z" />
        <circle cx="32" cy="32" r="6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <path d="M32 54C16 45 10 35 14 24c3-8 12-10 18-3 6-7 15-5 18 3 4 11-2 21-18 30Z" />
      <path d="M32 21v27M21 31c6 1 11 5 11 11M43 31c-6 1-11 5-11 11" />
    </svg>
  );
}
