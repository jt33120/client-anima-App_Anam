# Le lotus d'attente d'Anam — pastel, dessiné (5a / 5b)

Remplacement de `AnamPrepare` et de `.lotus` / `.petale` de `conversation.module.css`.
Deux variantes du même dessin, choisies par un prop.

## Fichiers

| Fichier | Rôle |
|---|---|
| `LotusAttente.tsx` | le composant (`variante="rose" | "eau"`, `taille`) + `AnamPrepare` prêt à brancher |
| `LotusAttente.module.css` | toute l'animation, le mode 34 px, `prefers-reduced-motion` |
| `apercu.html` | la même chose en HTML/CSS pur — à ouvrir dans un navigateur pour arbitrer 5a vs 5b |

## Intégration

```tsx
// Fil.tsx — supprimer la fonction AnamPrepare locale et son SVG, puis :
import { AnamPrepare } from "./LotusAttente";

// … inchangé, en fin de fil :
{prepare && <AnamPrepare variante="rose" />}
```

Puis retirer de `conversation.module.css` : `.lotus`, `.petale`, `@keyframes lotus-scintille`
et le bloc `prefers-reduced-motion` qui les concerne. `.attente` est reprise à l'identique
dans le nouveau module (`min-height: var(--cible-tactile)`) : la hauteur du fil ne change pas,
donc le `useEffect` de recalage au scroll qui dépend de `prepare` n'a pas à bouger.

Le composant accepte aussi une taille libre — `<LotusAttente taille={96} />` — pour un état
d'attente plein écran si le besoin apparaît un jour.

## Le dessin

Une lumière naît au cœur, gonfle à travers la fleur, reflue. Les trois rangs s'allument du fond
vers l'avant (retards 210 → 90 → 0 ms) : la profondeur se lit sans qu'aucune forme ne se déplace.

Les neuf pétales ont des tailles et des inclinaisons **toutes différentes** — c'est ce qui sort
le glyphe de la géométrie. Ne pas les régulariser en une rotation constante : tout l'effet
« dessiné à la main » tient là.

* **5a — rose ancien** : lilas derrière, rose poudré devant, deux petits pétales bleu pâle au
  cœur. Trois étincelles en étoile à quatre branches, trois grains plus fins, un reflet flou sur
  l'eau, grain de papier en `soft-light`. Cycle 4 s.
* **5b — eau claire** : menthe derrière, bleu d'eau devant, rose au cœur seulement, halo plus
  vert, cycle 5,2 s. Plus nénuphar réel que fleur de conte, et reste dans la teinte du produit.

À 34 px, `.reduit` retire nervures, étincelles, reflet, grain et le 3ᵉ trait d'eau, masque le
rang du cœur et deux pétales arrière, et épaissit les traits.

## Écarts assumés par rapport au BRIEF — à relire avant de figer

1. **Règle 2, « aucun changement de taille »** : le halo change d'échelle (0,45 → 1,2) et la
   fleur respire de ±2,5 %. C'est ce qui produit le *gonflement* de lumière demandé après le
   premier tour. Pour revenir à la lettre du brief : enlever `transform` des keyframes
   `lotusHalo` et supprimer l'animation `lotusSouffle` — les opacités décalées tiennent seules.
2. **Règle 4, « pas de blur »** : `feGaussianBlur` ne touche que deux éléments minuscules (le
   cœur, ~5 px de côté ; le reflet) et n'est **pas** animé, donc calculé une fois. Le grain
   (`feTurbulence`) est également statique. Si une mesure montre un coût : retirer `filter` du
   cœur et supprimer `.grain`.
3. **Cycles** 4 s et 5,2 s : au-dessus du seuil de 4,2 s de la règle sur la nervosité.

Respectées sans réserve : aucune translation, aucun texte ni chiffre, `aria-hidden`, et visible
**mais figée** sous `prefers-reduced-motion` — les étincelles et le reflet, qui n'existent que
par leur apparition, y sont retirés plutôt que figés à mi-course.

## Palette ajoutée

Ces pastels ne sont pas dans les jetons actuels : ils vivent dans les dégradés SVG du composant,
volontairement, pour ne pas polluer le thème. `#CDBFE8` `#E6DDF6` (lilas), `#F3D3E2` `#FDF0E2`
(rose, crème), `#C2DCF3` `#EAF3FD` (bleu pâle), `#C4E3DC` `#EDF7F3` (menthe). S'ils doivent
devenir des jetons, les nommer côté thème et remplacer les `stop-color` par `var(--…)`.
