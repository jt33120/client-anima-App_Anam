import s from "./graine-attente.module.css";

/**
 * LA GRAINE QUI N'ATTEND QUE D'ÉCLORE — le signe d'attente de l'étape 0 de l'arbre.
 *
 * LE RETOUR DU FONDATEUR : « l'arbre en forme de graine au début : la faire bouger/rebondir pour
 * symboliser qu'elle n'attend que d'éclore. Même animation que les lotus de chargement. »
 *
 * ══ POURQUOI UN SVG SÉPARÉ, ET PAS LE CANEVAS QUI BOUGE ═════════════════════════════════════════
 * Le Canvas lunaire (`ArbreLunaire.tsx`) fait 1408 × 2503 unités : l'animer promouvrait une couche
 * énorme pour faire bouger une graine de 24 × 31. Et deux gardes l'interdisent de toute façon :
 *   • tests/arbre-rendu.test.ts L295-296 — `.canvasLunaire` ne porte ni `animation` ni `transition`,
 *     et le moteur n'a ni `requestAnimationFrame`, ni `setInterval`, ni `setTimeout` ;
 *   • tests/rendu/arbre-cycle.test.tsx L92-99 — la même chose, lue sans les commentaires pour que la
 *     garde morde vraiment.
 * Ce composant est donc un SVG autonome, superposé au canevas par la story d'intégration (qui sautera
 * aussi `peindreGraine` dans le moteur). Ici : le dessin et rien d'autre — l'animation vit dans la
 * feuille, comme pour `LotusAttente`.
 *
 * ══ « REBONDIR » DEVIENT « SE SOULEVER », ET C'EST LA CHARTE QUI L'IMPOSE ═══════════════════════
 * DESIGN.md L139 : `rebond: 'interdit'`. L308 : « rien ne glisse, rien ne rebondit, rien ne pop ».
 * L474-475 : la respiration est « le seul mouvement en boucle du produit », « aucun rebond, aucun
 * ressort, aucun overshoot ». app/styles/globals.css L268 : « rien ne rebondit » ; L285 :
 * `respiration` (échelle 1 → 1,03) est le seul mouvement en boucle. Le geste du fondateur est gardé
 * — la graine BOUGE — mais dans la grammaire du produit : un souffle de ±2,5 pour cent (celui du
 * lotus, à l'identique) et un soulèvement doux de 3 unités qui retombe d'un demi-unité avant de se
 * reposer, sur un cycle doublé. Jamais un ressort. Les bornes sont gardées par le test.
 *
 * ══ LE DESSIN ═══════════════════════════════════════════════════════════════════════════════════
 * Les proportions sont celles de `peindreGraine` (MoteurArbreLunaire.ts L455-475) : une ellipse
 * 24 × 31 inclinée de −0,18 rad, éclairée en haut à gauche, du nacre (`lueur`) vers l'argent du tronc.
 * Ici à l'échelle du lotus (viewBox 48, comme `LotusAttente`) : 12 × 15,5. Les couleurs viennent de
 * la palette gelée (tests/arbre-lunaire.test.ts L29-38) PAR SES TOKENS — `--lueur`, `--arbre-branche`,
 * `--arbre-tronc` de globals.css L24-29 — jamais en hex : le mode contraste les remplace tout seul.
 * Un halo en opacité, rien de figuratif de plus.
 *
 * DÉCORATIF : `aria-hidden`, `focusable="false"`, aucun texte. Le canevas voisin porte déjà
 * `role="img"` et son `aria-label` — la graine muette, l'étape n'est pas dite deux fois.
 * `data-graine-attente` est le crochet des tests et des e2e.
 *
 * DEUX MOUVEMENTS, DEUX ÉLÉMENTS. Le soulèvement (translation) est sur `.souleve`, le souffle (échelle)
 * sur `.corps`, imbriqué : c'est le choix « wrapper » plutôt qu'`animation-composition: add`, qu'iOS 15
 * ne connaît pas. Le halo vit ENTRE les deux : il monte avec la graine mais ne s'étire pas avec elle,
 * et surtout il ne fausse pas la boîte (`fill-box`) depuis laquelle le corps se dresse.
 */
export default function GraineAttente({ className }: { readonly className?: string }) {
  return (
    <svg
      className={[s.graine, className].filter(Boolean).join(" ")}
      viewBox="0 0 48 48"
      aria-hidden
      focusable="false"
      data-graine-attente=""
    >
      <defs>
        {/* Le même éclairage que sur le canevas : foyer en haut à gauche (x − 8, y − 9 sur 24 de
            rayon, soit x − 4, y − 4,5 ici), nacre au foyer, argent du tronc au bord. Repère
            utilisateur : le dégradé suit l'inclinaison de la graine et son souffle. */}
        <radialGradient id="graineCorps" gradientUnits="userSpaceOnUse" cx="24" cy="26" r="16" fx="20" fy="21.5">
          <stop className={s.teinteLueur} offset="0%" />
          <stop className={s.teinteBranche} offset="28%" />
          <stop className={s.teinteTronc} offset="100%" />
        </radialGradient>
        {/* Le halo : la couleur courante (`--lueur`) qui s'éteint vers le bord. Animé en opacité seule. */}
        <radialGradient id="graineHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".55" />
          <stop offset="55%" stopColor="currentColor" stopOpacity=".16" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className={s.souleve}>
        <circle className={s.halo} cx="24" cy="26" r="21" fill="url(#graineHalo)" />
        <g className={s.corps}>
          {/* −0,18 rad ≈ −10,3°, autour du centre de la graine, comme `contexte.ellipse(…, -0.18, …)`. */}
          <ellipse
            className={s.coque}
            cx="24"
            cy="26"
            rx="12"
            ry="15.5"
            transform="rotate(-10.3 24 26)"
            fill="url(#graineCorps)"
            stroke="currentColor"
          />
        </g>
      </g>
    </svg>
  );
}
