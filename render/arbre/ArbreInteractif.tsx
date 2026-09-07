"use client";

/*
 * ArbreInteractif — la région « arbre » : le rendu MUET de l'arbre RÉEL (AD-7). Il CONSOMME la projection et
 * la dessine ; il ne décide ni ne garde aucune monotonie d'ÉCRITURE (celle-ci est le SQL / la Story 4.7).
 *
 * RÉÉCRIT après la revue adversariale (30 findings sur ce fichier). Corrections structurantes :
 *  • ALIGNEMENT (HAUTE) — un viewBox carré dans une boîte rectangulaire est LETTERBOXÉ par le navigateur :
 *    positionner les accroches en `%` du conteneur les décalait jusqu'à ~100 px du bois dessiné (AC3 mort).
 *    On mesure désormais le CARRÉ effectif (ResizeObserver) et SVG + accroches partagent ce même repère.
 *  • ZOOM (HAUTE) — `transform-origin` au coin haut-gauche faisait fuir l'arbre hors cadre en 4 clics ;
 *    l'origine est maintenant le CENTRE, et `cadrer` calcule un pan exact.
 *  • ANTI-RÉGRESSION AC2 [DUR] (HAUTE) — le repère du max vivait en `localStorage` : non scopé par
 *    utilisatrice (contamination entre comptes sur un navigateur partagé), jamais purgé (rémanence art. 9),
 *    empoisonnable (un « rayonnement » jamais atteint devenait permanent), et il s'EFFAÇAIT au repli.
 *    Il vit désormais EN MÉMOIRE de session (useRef) : aucune rémanence, aucune autorité cliente durable,
 *    et il ne s'efface plus quand la lecture est `indisponible`.
 *  • `indisponible` — une panne n'affiche plus « Rien n'a encore été nommé » (mensonge, cf. FR-029).
 *  • GLISSER vs TAP — seuil de déplacement : déplacer l'arbre en attrapant une accroche n'ouvre plus la fiche.
 *  • CLAVIER — flèches pour déplacer, Échap pour fermer la fiche, focus rendu au déclencheur.
 *  • `wheel` en écouteur NON PASSIF (React l'attache en passif : `preventDefault()` y était un no-op).
 * Le rendu ne parle qu'à `^/api/` (jamais la base, jamais un secret).
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  reconcilierProjection,
  doitDireOuNaissentLesBranches,
  ZOOM_MIN,
  ZOOM_MAX,
  type BrancheProjetee,
  type Camera,
  type ProjectionScene,
} from "@/lib/scene";
import { CADRE_ARBRE_PERSONNEL, ancreTroncPersonnel, placerAccrochesPersonnelles, regrouperAccrochesPersonnelles } from "./ancres-arbre-personnel";
import { indexCroissancePersonnelle } from "./croissance-personnelle";
import ArbrePersonnel from "./ArbrePersonnel";
import EtatVideArbre from "./EtatVideArbre";
import {
  ARIA_CANEVAS,
  ARIA_ZONE_ARBRE,
  INDISPONIBLE_TITRE,
  INDISPONIBLE_CORPS,
  BASCULE_LISTE,
  BASCULE_ARBRE,
  ZOOM_PLUS,
  ZOOM_MOINS,
  ARIA_TRONC_A_COMPLETER,
  MESSAGE_GRAINE_PLANTEE,
} from "./copie-arbre";
import FicheBranche, { type ResultatGeste } from "./FicheBranche";
import FicheTronc from "./FicheTronc";
import VueListe from "./VueListe";
import ComprendreEvolution from "./ComprendreEvolution";
import { PLANCHES_METAMORPHOSE } from "./metamorphose-planches";
import s from "./arbre.module.css";

/** Préférence d'AFFICHAGE seulement (aucune donnée art. 9) → localStorage acceptable. */
const CLE_VUE = "anima:arbre:vueListe";
/** Au-delà de ce déplacement, le geste est un GLISSER : le relâchement n'ouvre plus la fiche. */
const GLISSER_MIN_PX = 8;
const PAS_CLAVIER_PX = 40;

export interface ProprietesArbreInteractif {
  titre?: import("react").ReactNode;
  projection: ProjectionScene;
  camera: Camera;
  brancheSelectionnee: string | null;
  onCadrer: (camera: Camera) => void;
  onOuvrirFiche: (id: string) => void;
  onFermerFiche: () => void;
  onVoirDansConversation: (extraitSourceId: string) => void;
  onRenommer: (brancheId: string, nom: string) => Promise<boolean>;
  /** Story 4.7 (AC3) — le GESTE, transmis tel quel : le rendu ne décide pas d'un état (AD-7). */
  onDeclarerRayonnement?: (brancheId: string) => Promise<ResultatGeste>;
}

export default function ArbreInteractif(p: ProprietesArbreInteractif) {
  // ── AC2 [DUR] anti-régression : repère du max EN MÉMOIRE de session (aucune rémanence, aucune autorité
  //    cliente durable, aucune contamination entre comptes). La monotonie d'ÉCRITURE reste le SQL (4.7). ──
  const repere = useRef<ProjectionScene>({ tronc: { present: true }, branches: [] });
  const [affichees, setAffichees] = useState<readonly BrancheProjetee[]>(p.projection.branches);

  useEffect(() => {
    const { projection, incidents } = reconcilierProjection(repere.current, p.projection);
    if (!p.projection.indisponible) {
      // On FUSIONNE (jamais on n'écrase) : une absence ponctuelle n'efface pas un maximum connu.
      const parId = new Map(repere.current.branches.map((b) => [b.id, b]));
      for (const b of projection.branches) parId.set(b.id, b);
      repere.current = { tronc: { present: true }, branches: [...parId.values()] };
      setAffichees(projection.branches);
    }
    // UN seul signalement par réconciliation, portant les types constatés. Une requête PAR incident
    // faisait qu'une régression touchant plusieurs branches franchissait à elle seule le plafond de la
    // route : la vraie régression se faisait avaler par son propre bruit (re-revue).
    if (incidents.length > 0) {
      const champs = [...new Set(incidents.map((inc) => inc.champ))];
      fetch("/api/incident", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ champs }),
      }).catch(() => {});
    }
  }, [p.projection]);

  /** Texte de la région live persistante (voir le rendu). Aucune donnée art. 9 : des libellés statiques. */
  const [annonce, setAnnonce] = useState("");

  // ── AC8 : bascule vue liste / vue arbre, persistée (préférence d'affichage, sans art. 9) ──
  const [vueListe, setVueListe] = useState(false);
  useEffect(() => {
    try {
      setVueListe(localStorage.getItem(CLE_VUE) === "1");
    } catch {
      /* stockage indisponible : la vue arbre reste le défaut */
    }
  }, []);
  const basculer = () => {
    setVueListe((v) => {
      const n = !v;
      try {
        localStorage.setItem(CLE_VUE, n ? "1" : "0");
      } catch {
        /* best-effort */
      }
      return n;
    });
  };

  const indexCroissance = useMemo(() => indexCroissancePersonnelle(affichees), [affichees]);
  const placees = useMemo(() => placerAccrochesPersonnelles(affichees, indexCroissance), [affichees, indexCroissance]);
  const centreTronc = useMemo(() => ancreTroncPersonnel(indexCroissance), [indexCroissance]);
  const etapeGraine = indexCroissance === 0;
  const selectionnee = affichees.find((b) => b.id === p.brancheSelectionnee) ?? null;

  // Ce qui décide de la PRÉSENCE du canevas dans le DOM. Déclaré ICI, avant l'effet de mesure, parce que
  // cet effet en DÉPEND : un tableau de dépendances est évalué au rendu, donc s'y référer plus bas jetterait
  // un ReferenceError (zone morte temporelle).
  const indisponible = p.projection.indisponible === true;
  const vide = !indisponible && affichees.length === 0;
  // Une préférence « liste » ne cache jamais la graine du premier état personnel.
  const canevasVisible = !indisponible && (!vueListe || vide);
  /**
   * Story 3.3 (AC6) — la DÉCISION vient du modèle (`lib/scene`), jamais d'un test local sur l'entitlement.
   * Le rendu ne sait pas ce qu'est un abonnement et n'a pas à l'apprendre (AD-7) : il appelle une fonction
   * pure, il reçoit un booléen. La même valeur est passée aux DEUX vues — la liste et le canevas rendent le
   * même état vide, par le même composant, avec la même phrase.
   *
   * On lui passe `affichees`, pas `p.projection.branches` : c'est la liste RÉELLEMENT à l'écran (le repère
   * anti-régression peut la faire différer le temps d'un rendu). Sinon la phrase se déciderait sur un état
   * que personne ne voit — le genre d'écart d'une frame qui ne se reproduit jamais quand on le cherche.
   */
  const direOuNaissentLesBranches = doitDireOuNaissentLesBranches({ ...p.projection, branches: affichees });

  // L’image et les accroches partagent le même portrait, mesuré avant le pan et le zoom.
  const canevasRef = useRef<HTMLDivElement>(null);
  const [boite, setBoite] = useState({ gauche: 0, haut: 0, largeur: 0, hauteur: 0 });
  useLayoutEffect(() => {
    const el = canevasRef.current;
    if (!el) return;
    const mesurer = () => {
      const { width, height } = el.getBoundingClientRect();
      const echelle = Math.min(width / CADRE_ARBRE_PERSONNEL.largeur, height / CADRE_ARBRE_PERSONNEL.hauteur);
      const largeur = Number.isFinite(echelle) ? CADRE_ARBRE_PERSONNEL.largeur * echelle : 0;
      const hauteur = Number.isFinite(echelle) ? CADRE_ARBRE_PERSONNEL.hauteur * echelle : 0;
      setBoite({ gauche: (width - largeur) / 2, haut: (height - hauteur) / 2, largeur, hauteur });
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
    // RE-REVUE (HAUTE) : la dépendance était `[vueListe]` SEUL. Le canevas n'existe pas quand l'arbre est
    // vide ou indisponible ; il APPARAÎT plus tard (elle nomme sa première branche, ou la lecture reprend)
    // sans que `vueListe` ne bouge → l'effet ne rejouait jamais, la boîte restait à 0, `.monde` était
    // posé en 0×0 et l'ARBRE ÉTAIT INVISIBLE dans le scénario NOMINAL de la story. On dépend donc de ce qui
    // conditionne réellement sa présence. Gardé par tests/rendu/arbre-mesure.test.tsx (montage réel).
  }, [canevasVisible]);

  const { onCadrer } = p;
  const zoomer = useCallback(
    (facteur: number) => {
      const zoom = p.camera.zoom * facteur;
      if (Number.isFinite(zoom)) onCadrer({ pan: p.camera.pan, zoom });
    },
    [onCadrer, p.camera.pan, p.camera.zoom],
  );

  // `wheel` doit être NON PASSIF pour que preventDefault() morde (React l'attache en passif → no-op).
  // `canevasVisible` en dépendance pour la MÊME raison que l'effet de mesure : le canevas peut apparaître
  // après coup. Cet effet s'en tirait par accident (`zoomer` dépendait de l'objet `p` entier, recréé à
  // chaque rendu) — un accident qu'une mémoïsation des props aurait supprimé sans prévenir.
  useEffect(() => {
    const el = canevasRef.current;
    if (!el || etapeGraine) return;
    const onWheel = (e: WheelEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-couche-vide], [data-commandes-arbre]")) return;
      e.preventDefault();
      zoomer(e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomer, canevasVisible, etapeGraine]);

  // ── Pan / pincement, avec SEUIL de glisser ──
  const pointeurs = useRef<Map<number, { x: number; y: number }>>(new Map());
  const captures = useRef<Map<number, Element>>(new Map());
  const depart = useRef<{ x: number; y: number; pan: { x: number; y: number } } | null>(null);
  const pincement = useRef<{ dist: number; zoom: number } | null>(null);
  const aGlisse = useRef(false);

  /**
   * Le canevas est l'ANCÊTRE de la fiche : sans ce filtre, tout geste fait DANS la fiche remontait au
   * canevas. Les flèches tapées dans le champ de renommage déplaçaient l'arbre au lieu du curseur (et
   * `preventDefault()` empêchait même de se déplacer dans son propre texte), et sélectionner un mot du
   * verbatim faisait glisser l'arbre (re-revue). On ignore donc ce qui vient de la fiche ou d'une saisie.
   */
  const horsCanevas = (cible: EventTarget | null) => {
    if (!(cible instanceof Element)) return false;
    if (cible.closest("[data-couche-fiche], [data-couche-vide], [data-commandes-arbre]")) return true;
    const el = cible as HTMLElement;
    return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable === true;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (horsCanevas(e.target)) return;
    // Capture du pointeur : sans elle, un bouton relâché HORS du canevas n'émet jamais `pointerup`,
    // `depart` restait armé et l'arbre suivait le curseur sans bouton pressé (re-revue).
    try {
      // Keep the eventual click on its branch button. Capturing on the canvas retargets
      // real pointer clicks to the ancestor, so the branch would only open by keyboard.
      const cible = e.target instanceof Element ? e.target.closest("button") ?? e.currentTarget : e.currentTarget;
      cible.setPointerCapture(e.pointerId);
      captures.current.set(e.pointerId, cible);
    } catch {
      /* certains navigateurs refusent la capture sur un pointeur déjà relâché : le pan reste utilisable */
    }
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.current.size === 1) {
      aGlisse.current = false;
      depart.current = { x: e.clientX, y: e.clientY, pan: p.camera.pan };
    } else if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      pincement.current = Number.isFinite(dist) && dist > 0 ? { dist, zoom: p.camera.zoom } : null;
      depart.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointeurs.current.has(e.pointerId)) return;
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.current.size === 2 && pincement.current) {
      const [a, b] = [...pointeurs.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (!Number.isFinite(dist) || pincement.current.dist <= 0) return;
      const zoom = pincement.current.zoom * (dist / pincement.current.dist);
      if (!Number.isFinite(zoom)) return;
      aGlisse.current = true;
      p.onCadrer({ pan: p.camera.pan, zoom });
    } else if (depart.current) {
      const dx = e.clientX - depart.current.x;
      const dy = e.clientY - depart.current.y;
      if (Math.hypot(dx, dy) > GLISSER_MIN_PX) aGlisse.current = true;
      if (aGlisse.current) {
        p.onCadrer({ zoom: p.camera.zoom, pan: { x: depart.current.pan.x + dx, y: depart.current.pan.y + dy } });
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      captures.current.get(e.pointerId)?.releasePointerCapture(e.pointerId);
    } catch {
      /* déjà relâchée */
    }
    captures.current.delete(e.pointerId);
    pointeurs.current.delete(e.pointerId);
    if (pointeurs.current.size < 2) pincement.current = null;
    if (pointeurs.current.size === 0) depart.current = null;
  };

  /**
   * Taille À L'ÉCRAN de la zone cliquable d'une accroche, en px. Les cibles denses peuvent se recouvrir,
   * mais ne descendent jamais sous le plancher WCAG : zoomer sépare leurs ancres, tandis que le clavier et
   * la vue liste fournissent un accès non spatial sans ambiguïté. Rétrécir la cible n'est plus un arbitrage.
   */
  const tailleAccrochePx = () => 44;


  /** Ramène l'accroche au centre du portrait (origine de transform = centre du monde). */
  const cadrerBranche = (accroche: { x: number; y: number }) => {
    const { largeur, hauteur } = boite;
    if (!largeur || !hauteur) return;
    const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, 1.8));
    const px = (accroche.x / CADRE_ARBRE_PERSONNEL.largeur) * largeur;
    const py = (accroche.y / CADRE_ARBRE_PERSONNEL.hauteur) * hauteur;
    p.onCadrer({ zoom, pan: { x: -zoom * (px - largeur / 2), y: -zoom * (py - hauteur / 2) } });
  };

  // Déplacement au CLAVIER (le pan doigt/molette n'est pas atteignable au clavier — plancher UX-DR-42).
  const onKeyDownZone = (e: React.KeyboardEvent) => {
    // Une flèche tapée dans la fiche (champ de renommage, verbatim) appartient à la fiche, pas à l'arbre.
    if (horsCanevas(e.target)) return;
    const pas: Record<string, [number, number]> = {
      ArrowLeft: [PAS_CLAVIER_PX, 0],
      ArrowRight: [-PAS_CLAVIER_PX, 0],
      ArrowUp: [0, PAS_CLAVIER_PX],
      ArrowDown: [0, -PAS_CLAVIER_PX],
    };
    const d = pas[e.key];
    if (!d) return;
    e.preventDefault();
    p.onCadrer({ zoom: p.camera.zoom, pan: { x: p.camera.pan.x + d[0], y: p.camera.pan.y + d[1] } });
  };

  // Échap ferme la fiche ; le focus retourne à l'accroche qui l'a ouverte.
  const accroches = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const dernierDeclencheur = useRef<string | null>(null);
  const fermerFiche = useCallback(() => {
    const id = dernierDeclencheur.current;
    p.onFermerFiche();
    if (id) requestAnimationFrame(() => accroches.current.get(id)?.focus());
  }, [p]);
  useEffect(() => {
    if (!selectionnee) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermerFiche();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectionnee, fermerFiche]);

  const ouvrir = (id: string) => {
    dernierDeclencheur.current = id;
    p.onOuvrirFiche(id);
  };

  /*
   * Story 5.3 — la fiche du TRONC. État LOCAL, et pas dans le réducteur de `lib/scene/vue.ts` :
   * ouvrir une étiquette explicative n'est pas un cadrage du monde, ça ne se mémorise pas au retour
   * depuis la conversation, et ça ne survit pas à un changement de région. Même rang que `vueListe`.
   */
  const troncIncomplet = p.projection.tronc.incomplet;
  const groupesAccroches = useMemo(() => regrouperAccrochesPersonnelles(placees,
    boite.largeur / CADRE_ARBRE_PERSONNEL.largeur * p.camera.zoom,
    troncIncomplet && !vide ? centreTronc : undefined),
  [placees, boite.largeur, p.camera.zoom, troncIncomplet, vide, centreTronc]);
  const groupesProches = groupesAccroches.filter((groupe) => groupe.ids.length + Number(groupe.tronc) > 1);
  const idsGroupes = new Set(groupesProches.flatMap((groupe) => groupe.ids));
  const troncGroupe = groupesProches.some((groupe) => groupe.tronc);

  const [ficheTronc, setFicheTronc] = useState(false);
  const [groupeOuvert, setGroupeOuvert] = useState<{ ids: string[]; tronc: boolean } | null>(null);
  const declencheurGroupe = useRef<HTMLButtonElement | null>(null);
  const panneauGroupe = useRef<HTMLDivElement | null>(null);
  const fermerGroupe = useCallback(() => {
    setGroupeOuvert(null);
    requestAnimationFrame(() => {
      if (declencheurGroupe.current?.isConnected) declencheurGroupe.current.focus();
      else canevasRef.current?.focus();
    });
  }, []);
  useEffect(() => {
    if (!groupeOuvert || selectionnee || ficheTronc) return;
    const fermer = (event: KeyboardEvent) => { if (event.key === "Escape") fermerGroupe(); };
    document.addEventListener("keydown", fermer);
    return () => document.removeEventListener("keydown", fermer);
  }, [groupeOuvert, selectionnee, ficheTronc, fermerGroupe]);

  const declencheurTronc = useRef<HTMLButtonElement | null>(null);
  const fermerFicheTronc = useCallback(() => {
    setFicheTronc(false);
    requestAnimationFrame(() => declencheurTronc.current?.focus());
  }, []);
  useEffect(() => {
    if (!ficheTronc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermerFicheTronc();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ficheTronc, fermerFicheTronc]);
  // Le jour où elle ajoute son heure, le drapeau disparaît : la fiche ne doit pas rester ouverte sur
  // une phrase devenue fausse. Aucune animation, aucun « débloqué » — elle n'a simplement plus lieu (AC4).
  useEffect(() => {
    if (!troncIncomplet) setFicheTronc(false);
  }, [troncIncomplet]);

  return (
    <div className={s.arbre} data-evolution-fond={canevasVisible ? "" : undefined} data-evolution-graine={vide ? "" : undefined}>
      {/* Région d'annonce a11y PERSISTANTE (même patron que la conversation). Elle vit ICI, et pas dans le
          champ de renommage, parce que ce champ est DÉMONTÉ au moment même où il aurait quelque chose à
          annoncer : le succès du renommage restait donc entièrement muet (re-revue). */}
      <p className={s.annonce} aria-live="polite" aria-atomic="true">
        {annonce}
      </p>

      <div className={s.barre}>
        {p.titre}
        <ComprendreEvolution compact />
        {/* ⚠️ PAS DE BASCULE SUR UN ARBRE VIDE (retour du 2026-08-20 : « à quoi correspond vue liste
            pour l'arbre ? »). La question n'avait pas de réponse : les deux vues d'un arbre sans
            branche rendent LITTÉRALEMENT le même composant (`EtatVideArbre`, story 3.3), donc le
            bouton changeait son propre libellé et rien d'autre. Un contrôle qui ne fait rien coûte
            plus qu'il ne rapporte : il enseigne qu'on ne comprend pas l'écran.

            UX-DR-37 n'est pas entamé : le doublage non-spatial DOUBLE un contenu spatial, et il n'y
            a ici aucun contenu spatial à doubler. Le seul chemin de l'écran — la fiche du tronc —
            vit dans l'état vide lui-même, et `tests/rendu/tronc-incomplet.test.tsx` le vérifie dans
            les trois états dès qu'une branche existe. */}
        {!vide && !indisponible && (
          /* `aria-pressed` retiré : combiné à un libellé qui bascule, il annonçait l'inverse de la réalité. */
          <button type="button" className={s.actionSecondaire} onClick={basculer}>
            {vueListe ? BASCULE_ARBRE : BASCULE_LISTE}
          </button>
        )}

      </div>

      {indisponible ? (
        <div className={s.vide}>
          <p className={s.videTitre}>{INDISPONIBLE_TITRE}</p>
          <p className={s.videCorps}>{INDISPONIBLE_CORPS}</p>
        </div>
      ) : vueListe && !vide ? (
        <VueListe
          branches={affichees}
          onOuvrir={ouvrir}
          onVoirDansConversation={p.onVoirDansConversation}
          onRenommer={p.onRenommer}
          onAnnoncer={setAnnonce}
          planOuvert={p.projection.planOuvert === true}
          direOuNaissentLesBranches={direOuNaissentLesBranches}
          onOuvrirTronc={troncIncomplet ? () => setFicheTronc(true) : undefined}
        />
      ) : (
        <div
          ref={canevasRef}
          className={s.canevas}
          tabIndex={0}
          role="group"
          aria-label={etapeGraine ? "Ton évolution" : ARIA_ZONE_ARBRE}
          /* ⚠️ LE GLISSEMENT ENTRE RÉGIONS S'ARRÊTE ICI, ET C'EST OBLIGATOIRE. Un doigt qui part
             horizontalement sur ce canevas DÉPLACE L'ARBRE — c'est le geste propre de la région,
             écrit bien avant celui de la scène. Sans cette marque, les deux gestes liraient le même
             mouvement et le monde changerait de région pendant qu'on cadre une branche. La scène
             lit cet attribut sur toute la chaîne d'ancêtres du point de contact. */
          data-sans-glissement
          onKeyDown={etapeGraine ? undefined : onKeyDownZone}
          onPointerDown={etapeGraine ? undefined : onPointerDown}
          onPointerMove={etapeGraine ? undefined : onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
        {!vueListe && !vide && !indisponible && (
          <div className={s.zoomBoutons} data-commandes-arbre>
            <button type="button" className={s.zoomBouton} onClick={() => zoomer(1 / 1.2)} aria-label={ZOOM_MOINS}>
              <span aria-hidden>−</span>
            </button>
            <button type="button" className={s.zoomBouton} onClick={() => zoomer(1.2)} aria-label={ZOOM_PLUS}>
              <span aria-hidden>+</span>
            </button>
          </div>
        )}
          <div
            className={`${s.monde} ${selectionnee ? s.mondeEstompe : ""}`}
            style={etapeGraine ? { inset: 0, width: "100%", height: "100%" } : {
              left: boite.gauche,
              top: boite.haut,
              width: boite.largeur,
              height: boite.hauteur,
              transform: `translate(${p.camera.pan.x}px, ${p.camera.pan.y}px) scale(${p.camera.zoom})`,
            }}
          >
            <ArbrePersonnel
              index={indexCroissance}
              troncEnReserve={Boolean(troncIncomplet)}
              ariaLabel={ARIA_CANEVAS}
            />

            {/* Story 5.3 — la cible du TRONC, dans la même couche et le même repère que les accroches.
                Elle n'existe que s'il manque quelque chose : un tronc complet n'a AUCUNE affordance,
                rien à fermer, rien à découvrir (AC4). */}
            {troncIncomplet && !vide && !troncGroupe && (
              <button
                type="button"
                ref={declencheurTronc}
                className={`${s.accroche} ${s.cibleTronc}`}
                style={{
                  left: `${(centreTronc.x / CADRE_ARBRE_PERSONNEL.largeur) * 100}%`,
                  top: `${(centreTronc.y / CADRE_ARBRE_PERSONNEL.hauteur) * 100}%`,
                  transform: `translate(-50%, -50%) scale(${1 / p.camera.zoom})`,
                }}
                aria-label={ARIA_TRONC_A_COMPLETER}
                onClick={(e) => {
                  if (aGlisse.current && e.detail !== 0) return; // un glisser n'ouvre pas la fiche ; le clavier, si
                  setFicheTronc(true);
                }}
              />
            )}

            {/* Accroches CLIQUABLES — dans le même repère portrait que l’image. Elles gardent 44 px
                même lorsqu'elles se recouvrent ; zoom, clavier et vue liste désambiguïsent la densité. */}
            {groupesProches.map((groupe) => (
              <button key={groupe.ids.join(":")} type="button" className={`${s.accroche} ${s.groupeAccroches}`}
                data-groupe-branches={groupe.ids.join(" ")}
                style={{ left: `${groupe.accroche.x / CADRE_ARBRE_PERSONNEL.largeur * 100}%`,
                  top: `${groupe.accroche.y / CADRE_ARBRE_PERSONNEL.hauteur * 100}%`,
                  transform: `translate(-50%, -50%) scale(${1 / p.camera.zoom})` }}
                aria-label={groupe.tronc ? "Voir les branches et le tronc proches" : `Voir les ${groupe.ids.length} branches proches`}
                aria-expanded={groupeOuvert?.ids.join(":") === groupe.ids.join(":")}
                onClick={(event) => {
                  if (aGlisse.current && event.detail !== 0) return;
                  declencheurGroupe.current = event.currentTarget;
                  setGroupeOuvert(groupe);
                  requestAnimationFrame(() => panneauGroupe.current?.focus());
                }}>
                <span aria-hidden>{groupe.ids.length + Number(groupe.tronc)}</span>
              </button>
            ))}
            {placees.filter((pl) => !idsGroupes.has(pl.branche.id)).map((pl) => (
              <button
                key={pl.branche.id}
                ref={(el) => void accroches.current.set(pl.branche.id, el)}
                type="button"
                className={s.accroche}
                data-branche-arbre={pl.branche.id}
                data-etat-branche={pl.branche.etat}
                title={pl.branche.nom?.trim() || "Branche sans nom"}
                style={{
                  left: `${(pl.accroche.x / CADRE_ARBRE_PERSONNEL.largeur) * 100}%`,
                  top: `${(pl.accroche.y / CADRE_ARBRE_PERSONNEL.hauteur) * 100}%`,
                  width: tailleAccrochePx(),
                  height: tailleAccrochePx(),
                  transform: `translate(-50%, -50%) scale(${1 / p.camera.zoom})`,
                }}
                aria-label={`Branche : ${pl.branche.nom?.trim() || "sans nom"}`}
                onClick={(e) => {
                  if (aGlisse.current && e.detail !== 0) return; // un glisser n'ouvre pas la fiche ; le clavier, si
                  ouvrir(pl.branche.id);
                }}
              />
            ))}
          </div>

          {groupeOuvert && (
            <div ref={panneauGroupe} className={s.groupePanneau} role="group" aria-label="Branches proches" tabIndex={-1}
              inert={Boolean(selectionnee || ficheTronc)} aria-hidden={selectionnee || ficheTronc ? true : undefined}
              data-commandes-arbre data-sans-glissement>
              <div className={s.groupeEntete}>
                <p className="t-corps">Choisis une branche</p>
                <button className={s.actionSecondaire} type="button" onClick={fermerGroupe}>Fermer les branches proches</button>
              </div>
              {groupeOuvert.tronc && troncIncomplet && <button ref={declencheurTronc} className={s.groupeChoix} type="button"
                onClick={() => setFicheTronc(true)} aria-label={ARIA_TRONC_A_COMPLETER}>Ton tronc à compléter</button>}
              {groupeOuvert.ids.map((id) => {
                const branche = affichees.find((candidate) => candidate.id === id);
                return branche && <button key={id} type="button" className={s.groupeChoix}
                  ref={(element) => void accroches.current.set(id, element)}
                  aria-label={`Branche : ${branche.nom?.trim() || "sans nom"}`} onClick={() => ouvrir(id)}>
                  {branche.nom?.trim() || "Branche sans nom"}
                </button>;
              })}
            </div>
          )}

          <p className={s.legendeEtape}>{vide ? MESSAGE_GRAINE_PLANTEE : PLANCHES_METAMORPHOSE[indexCroissance].texte}</p>

          {vide && (
            <div className={s.videSuperposition} data-couche-vide="">
              <EtatVideArbre
                direOuNaissentLesBranches={direOuNaissentLesBranches}
                onOuvrirTronc={troncIncomplet ? () => setFicheTronc(true) : undefined}
              />

            </div>
          )}

        </div>
      )}

      {/*
        ⚠️ LA FICHE EST HORS DU TERNAIRE (revue 4.10), et ce déplacement corrige un cul-de-sac.

        Elle n'était rendue que dans la branche CANEVAS. Or `allerVersBranche` — le geste de l'invitation
        d'Anam (« La voir ») — fait `aller("arbre")` puis `ouvrirFiche`, et la préférence de vue est
        PERSISTÉE en localStorage. Une utilisatrice passée en vue liste une seule fois arrivait donc sur
        la région arbre et **rien ne s'ouvrait** : l'invitation redevenait exactement ce que la story
        appelle « un reproche ». Idem quand l'arbre est vide ou indisponible.

        C'est le pendant symétrique du défaut que la revue 4.6 avait corrigé sur le renommage (« un
        utilisateur clavier ne pouvait tout simplement pas renommer ») : une action ne peut pas n'exister
        que dans une des deux vues de rang égal.

        Couche de fiche : capte les clics → « un tap à côté ferme » (UX-DR-26), sans piège au focus.
      */}
      {selectionnee && (
        <div
          className={s.ficheCouche}
          data-couche-fiche=""
          /* Une fiche ouverte OCCUPE le doigt : elle défile, et un tap à côté la ferme. Un
             glissement latéral y ferait quitter la région en laissant la fiche ouverte derrière —
             on la retrouverait au retour sans l'avoir jamais fermée. Voir `data-sans-glissement`
             sur le canevas, plus haut, et `tests/rendu/geste-propre.test.tsx`. */
          data-sans-glissement
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) fermerFiche();
          }}
        >
          <FicheBranche
            key={selectionnee.id}
            branche={selectionnee}
            onFermer={fermerFiche}
            onVoirDansConversation={p.onVoirDansConversation}
            onRenommer={p.onRenommer}
            onDeclarerRayonnement={p.onDeclarerRayonnement}
            gesteSuspendu={p.projection.gestesSuspendus === true}
            planOuvert={p.projection.planOuvert === true}
            onAnnoncer={setAnnonce}
            /* Le recadrage n'a de sens qu'en vue canevas : hors d'elle, il n'y a rien à cadrer, et
               proposer un bouton qui ne fait rien serait un cul-de-sac de plus. */
            onCentrer={
              vueListe || vide || indisponible
                ? undefined
                : () => {
                    // Remplace le double-clic sur l'accroche, qui ne pouvait JAMAIS se déclencher : le
                    // premier clic ouvrait la fiche, dont la couche `inset: 0` captait le second (re-revue).
                    const pl = placees.find((q) => q.branche.id === selectionnee.id);
                    fermerFiche();
                    if (groupeOuvert) {
                      setGroupeOuvert(null);
                      requestAnimationFrame(() => canevasRef.current?.focus());
                    }
                    if (pl) cadrerBranche(pl.accroche);
                  }
            }
          />
        </div>
      )}

      {/* Story 5.3 (AC5) — la fiche du tronc. Même couche, même comportement que celle d'une branche :
          un tap à côté ferme, Échap ferme, le focus revient au déclencheur. */}
      {ficheTronc && troncIncomplet && (
        <div
          className={s.ficheCouche}
          data-couche-fiche=""
          /* Une fiche ouverte OCCUPE le doigt : elle défile, et un tap à côté la ferme. Un
             glissement latéral y ferait quitter la région en laissant la fiche ouverte derrière —
             on la retrouverait au retour sans l'avoir jamais fermée. Voir `data-sans-glissement`
             sur le canevas, plus haut, et `tests/rendu/geste-propre.test.tsx`. */
          data-sans-glissement
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) fermerFicheTronc();
          }}
        >
          <FicheTronc
            phrase={troncIncomplet.phrase}
            ouTrouver={troncIncomplet.ouTrouver}
            onFermer={fermerFicheTronc}
          />
        </div>
      )}
    </div>
  );
}
