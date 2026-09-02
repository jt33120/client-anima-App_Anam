import ApparitionAnam from "@/render/conversation/ApparitionAnam";
import { BULLE_SANS_HEURE } from "@/lib/domain/message-sans-heure";
import s from "./heure-naissance.module.css";

/**
 * bulle-anam.tsx : ANAM ARRIVE AVEC UNE BULLE (retour terrain du 2026-09-01).
 *
 * « Il faudrait presque qu'Anam arrive avec une bulle : il manque l'heure de naissance ; une fois
 * qu'on l'a, on accède à l'horoscope. » L'écran ouvrait sur un titre et un paragraphe de trois
 * lignes qui expliquait la mairie ; il ouvre maintenant sur ELLE, et sur une phrase.
 *
 * ── POURQUOI `ApparitionAnam`, ET PAS `ImageAnam` DIRECTEMENT ─────────────────────────────────
 *
 * `ApparitionAnam` porte déjà tout ce que la charte exige du personnage : le format Présence
 * (porté à 40 % de la largeur après le retour du 2026-08-23 : « l'image devrait prendre plus de
 * place »), le fondu de 700 ms en `fondu-personnage` (instantané sous `prefers-reduced-motion`,
 * jamais un rebond), et surtout le MASQUAGE ENTIER en mode accessibilité (`data-a11y="contraste"`).
 * Avec `ImageAnam` seule, il resterait dans ce mode une boîte vide et une annonce fantôme
 * « Illustration nocturne » : le défaut exact que la revue 2.2 a corrigé. Le beat « ouverture »
 * est le bon : Anam ENTRE. Elle ne se retire pas (« clôture »), elle ne nomme rien (« nommer »).
 *
 * ── UNE PHRASE, DANS SA VOIX ──────────────────────────────────────────────────────────────────
 *
 * `BULLE_SANS_HEURE` vient de `lib/domain` (la copie visible ne vit jamais dans `render/`), en
 * `t-anam` parce que c'est Anam qui parle. Elle est courte à dessein : l'en-tête de la constante
 * dit pourquoi. La bulle elle-même est une surface sobre, sans queue de bande dessinée : la même
 * grammaire que la fiche du socle. Aucune couleur hors tokens, aucun style en ligne.
 */
export default function BulleAnam() {
  return (
    <div className={s.bulle}>
      <ApparitionAnam beat="ouverture" />
      <p className={`${s.parole} t-anam fondu-texte`}>{BULLE_SANS_HEURE}</p>
    </div>
  );
}
