"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { PositionVue, SectionCielVue } from "./types";
import s from "./CarteNatale.module.css";

const SIGNES = Object.freeze([
  { nom: "Bélier", code: 0x2648, element: "feu" },
  { nom: "Taureau", code: 0x2649, element: "terre" },
  { nom: "Gémeaux", code: 0x264a, element: "air" },
  { nom: "Cancer", code: 0x264b, element: "eau" },
  { nom: "Lion", code: 0x264c, element: "feu" },
  { nom: "Vierge", code: 0x264d, element: "terre" },
  { nom: "Balance", code: 0x264e, element: "air" },
  { nom: "Scorpion", code: 0x264f, element: "eau" },
  { nom: "Sagittaire", code: 0x2650, element: "feu" },
  { nom: "Capricorne", code: 0x2651, element: "terre" },
  { nom: "Verseau", code: 0x2652, element: "air" },
  { nom: "Poissons", code: 0x2653, element: "eau" },
]);

const ROMAINS = Object.freeze(["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]);
const VOIES_PLANETES = Object.freeze([207, 168, 132]);
const CENTRE = 320;

const ASSETS: Readonly<Record<string, string>> = Object.freeze({
  soleil: "/images/astrologie/planets/sun.svg",
  lune: "/images/astrologie/planets/moon.svg",
  mercure: "/images/astrologie/planets/mercury.svg",
  venus: "/images/astrologie/planets/venus.svg",
  mars: "/images/astrologie/planets/mars.svg",
  jupiter: "/images/astrologie/planets/jupiter.svg",
  saturne: "/images/astrologie/planets/saturn.svg",
  uranus: "/images/astrologie/planets/uranus.svg",
  neptune: "/images/astrologie/planets/neptune.svg",
  pluton: "/images/astrologie/planets/pluto.svg",
  noeud_moyen: "/images/astrologie/planets/node-north.svg",
  noeud_vrai: "/images/astrologie/planets/node-north.svg",
});

const CODES_GLYPHES: Readonly<Record<string, number>> = Object.freeze({
  soleil: 0x2609,
  lune: 0x263d,
  mercure: 0x263f,
  venus: 0x2640,
  mars: 0x2642,
  jupiter: 0x2643,
  saturne: 0x2644,
  uranus: 0x2645,
  neptune: 0x2646,
  pluton: 0x2647,
  noeud_moyen: 0x260a,
  noeud_vrai: 0x260a,
});

const LIBELLES_ASPECTS = Object.freeze({
  conjonction: { nom: "Conjonction", code: 0x260c },
  sextile: { nom: "Sextile", code: 0x2739 },
  carre: { nom: "Carré", code: 0x25a1 },
  trigone: { nom: "Trigone", code: 0x25b3 },
  opposition: { nom: "Opposition", code: 0x260d },
});

interface Point {
  readonly x: number;
  readonly y: number;
}

interface CorpsPlace {
  readonly position: PositionVue;
  readonly longitude: number;
  readonly longitudeDessinee: number;
  readonly voie: number;
  readonly groupe: number;
}

function normaliser(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function glyphe(code: number | undefined): string {
  return code === undefined ? "" : `${String.fromCodePoint(code)}\uFE0E`;
}

function nombre(projection: string | null): number | null {
  if (projection === null) return null;
  const valeur = Number.parseFloat(projection);
  return Number.isFinite(valeur) ? normaliser(valeur) : null;
}

function point(longitude: number, rayon: number, rotation: number): Point {
  const angle = (180 - (longitude - rotation)) * Math.PI / 180;
  const arrondir = (valeur: number) => Math.round(valeur * 10_000) / 10_000;
  return {
    x: arrondir(CENTRE + rayon * Math.cos(angle)),
    y: arrondir(CENTRE + rayon * Math.sin(angle)),
  };
}

function segment(longitude: number, rayonInterieur: number, rayonExterieur: number, rotation: number): string {
  const debut = point(longitude, rayonInterieur, rotation);
  const fin = point(longitude, rayonExterieur, rotation);
  return `M ${debut.x} ${debut.y} L ${fin.x} ${fin.y}`;
}

function secteur(longitude: number, rotation: number): string {
  const debutExterieur = point(longitude, 292, rotation);
  const finExterieur = point(longitude + 30, 292, rotation);
  const finInterieur = point(longitude + 30, 257, rotation);
  const debutInterieur = point(longitude, 257, rotation);
  return [
    `M ${debutExterieur.x} ${debutExterieur.y}`,
    `A 292 292 0 0 0 ${finExterieur.x} ${finExterieur.y}`,
    `L ${finInterieur.x} ${finInterieur.y}`,
    `A 257 257 0 0 1 ${debutInterieur.x} ${debutInterieur.y}`,
    "Z",
  ].join(" ");
}

function corpsPlaces(positions: readonly PositionVue[]): readonly CorpsPlace[] {
  const corps = positions
    .map((position) => ({ position, longitude: nombre(position.projection) }))
    .filter((entree): entree is { position: PositionVue; longitude: number } => entree.longitude !== null)
    .sort((a, b) => a.longitude - b.longitude);
  if (corps.length < 2) {
    return corps.map((entree) => ({ ...entree, longitudeDessinee: entree.longitude, voie: 0, groupe: 1 }));
  }

  let plusGrandEcart = -1;
  let debut = 0;
  for (let i = 0; i < corps.length; i += 1) {
    const ici = corps[i].longitude;
    const ensuite = i === corps.length - 1 ? corps[0].longitude + 360 : corps[i + 1].longitude;
    if (ensuite - ici > plusGrandEcart) {
      plusGrandEcart = ensuite - ici;
      debut = (i + 1) % corps.length;
    }
  }

  const deroulementLongitudes: number[] = [];
  const deroules = [...corps.slice(debut), ...corps.slice(0, debut)].map((entree, index, liste) => {
    let longitude = entree.longitude;
    if (index > 0) {
      const precedente = liste[index - 1].longitude;
      const toursPrecedents = Math.floor((deroulementLongitudes[index - 1] ?? precedente) / 360);
      longitude += toursPrecedents * 360;
      if (longitude <= (deroulementLongitudes[index - 1] ?? precedente)) longitude += 360;
    }
    deroulementLongitudes[index] = longitude;
    return { ...entree, longitudeDeroulee: longitude };
  });

  const groupes: Array<typeof deroules> = [];
  for (const entree of deroules) {
    const groupe = groupes.at(-1);
    const precedente = groupe?.at(-1);
    if (groupe && precedente && entree.longitudeDeroulee - precedente.longitudeDeroulee < 11) groupe.push(entree);
    else groupes.push([entree]);
  }

  return groupes.flatMap((groupe) => {
    const moyenne = groupe.reduce((somme, entree) => somme + entree.longitudeDeroulee, 0) / groupe.length;
    return groupe.map((entree, index) => ({
      position: entree.position,
      longitude: entree.longitude,
      longitudeDessinee: moyenne + (index - (groupe.length - 1) / 2) * 11,
      voie: groupe.length > 1 ? index % VOIES_PLANETES.length : 0,
      groupe: groupe.length,
    }));
  });
}

function classeAspect(type: keyof typeof LIBELLES_ASPECTS): string {
  if (type === "sextile") return s.aspectSextile;
  if (type === "carre") return s.aspectCarre;
  if (type === "trigone") return s.aspectTrigone;
  if (type === "opposition") return s.aspectOpposition;
  return s.aspectConjonction;
}

function classeElement(element: string): string {
  if (element === "terre") return s.signeTerre;
  if (element === "air") return s.signeAir;
  if (element === "eau") return s.signeEau;
  return s.signeFeu;
}

export default function CarteNatale({ ciel }: { readonly ciel: SectionCielVue }) {
  const identifiant = useId().replaceAll(":", "");
  const [selection, setSelection] = useState<string | null>(() => ciel.positions.find((position) => position.cle === "soleil")?.cle ?? null);
  const [rotationLibre, setRotationLibre] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [aspectsVisibles, setAspectsVisibles] = useState(true);
  const [isole, setIsole] = useState(false);
  const pointeurs = useRef(new Map<number, Point>());
  const anglePrecedent = useRef<number | null>(null);
  const distanceDepart = useRef(0);
  const zoomDepart = useRef(1);
  const mouvement = useRef(0);

  const ascendant = ciel.angles.find((angle) => angle.intitule === "Ascendant");
  const milieuDuCiel = ciel.angles.find((angle) => angle.intitule === "Milieu du ciel");
  const longitudeAscendant = nombre(ascendant?.projection ?? null);
  const ancrage = longitudeAscendant ?? 90;
  const rotation = ancrage + rotationLibre;
  const places = useMemo(() => corpsPlaces(ciel.positions), [ciel.positions]);
  const selectionnee = ciel.positions.find((position) => position.cle === selection) ?? null;
  const aspectsSelectionnes = selection
    ? ciel.aspects.filter((aspect) => aspect.depuis === selection || aspect.vers === selection)
    : [];
  const etendue = 640 / zoom;
  const origine = CENTRE - etendue / 2;

  const angleDuPointeur = (pointeur: Point, element: HTMLDivElement): number => {
    const boite = element.getBoundingClientRect();
    return Math.atan2(pointeur.y - (boite.top + boite.height / 2), pointeur.x - (boite.left + boite.width / 2)) * 180 / Math.PI;
  };

  const pointerDown = (evenement: PointerEvent<HTMLDivElement>) => {
    try {
      evenement.currentTarget.setPointerCapture(evenement.pointerId);
    } catch {
      // La capture est un confort : les interactions restent utilisables sans elle.
    }
    pointeurs.current.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
    mouvement.current = 0;
    if (pointeurs.current.size === 1) {
      anglePrecedent.current = angleDuPointeur({ x: evenement.clientX, y: evenement.clientY }, evenement.currentTarget);
    } else if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()];
      distanceDepart.current = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      zoomDepart.current = zoom;
    }
  };

  const pointerMove = (evenement: PointerEvent<HTMLDivElement>) => {
    const avant = pointeurs.current.get(evenement.pointerId);
    if (!avant) return;
    mouvement.current += Math.abs(evenement.clientX - avant.x) + Math.abs(evenement.clientY - avant.y);
    pointeurs.current.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
    if (pointeurs.current.size === 1 && anglePrecedent.current !== null) {
      const angle = angleDuPointeur({ x: evenement.clientX, y: evenement.clientY }, evenement.currentTarget);
      let difference = angle - anglePrecedent.current;
      if (difference > 180) difference -= 360;
      if (difference < -180) difference += 360;
      anglePrecedent.current = angle;
      setRotationLibre((courante) => courante + difference);
    } else if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      setZoom(Math.min(3, Math.max(1, zoomDepart.current * distance / distanceDepart.current)));
    }
  };

  const pointerUp = (evenement: PointerEvent<HTMLDivElement>) => {
    pointeurs.current.delete(evenement.pointerId);
    anglePrecedent.current = null;
    setRotationLibre((courante) => {
      const cible = Math.round(courante / 90) * 90;
      return Math.abs(courante - cible) <= 7 ? cible : courante;
    });
  };

  const choisir = (cle: string) => {
    if (mouvement.current > 8) return;
    setSelection(cle);
    setIsole(false);
  };

  const choisirAuClavier = (evenement: KeyboardEvent<SVGGElement>, cle: string) => {
    if (evenement.key !== "Enter" && evenement.key !== " ") return;
    evenement.preventDefault();
    setSelection(cle);
    setIsole(false);
  };

  if (!ciel.projection) return null;

  return (
    <figure className={s.figure} aria-labelledby={`${identifiant}-titre`}>
      <div className={s.enteteInstrument}>
        <div>
          <p className={`t-surtitre ${s.surtitre}`}>Thème natal tropical</p>
          <h3 id={`${identifiant}-titre`} className="t-titre-sm">Ta carte du ciel</h3>
        </div>
        <div className={s.commandes} aria-label="Commandes de la carte natale">
          {ciel.aspects.length > 0 && (
            <button
              type="button"
              className={s.commandeTexte}
              aria-pressed={aspectsVisibles}
              onClick={() => setAspectsVisibles((visible) => !visible)}
            >
              Aspects
            </button>
          )}
          <button type="button" className={s.commande} aria-label="Réduire la carte" disabled={zoom <= 1} onClick={() => setZoom((valeur) => Math.max(1, valeur - 0.25))}>−</button>
          <button type="button" className={s.commande} aria-label="Agrandir la carte" disabled={zoom >= 3} onClick={() => setZoom((valeur) => Math.min(3, valeur + 0.25))}>+</button>
        </div>
      </div>

      <div
        className={s.roue}
        data-sans-glissement
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <svg
          className={s.svg}
          viewBox={`${origine} ${origine} ${etendue} ${etendue}`}
          role="img"
          aria-labelledby={`${identifiant}-svg-titre ${identifiant}-description`}
        >
          <title id={`${identifiant}-svg-titre`}>{ciel.projection.titre}</title>
          <desc id={`${identifiant}-description`}>{ciel.projection.description}</desc>
          <circle className={s.fondRoue} cx={CENTRE} cy={CENTRE} r="306" />

          <g aria-hidden>
            {SIGNES.map((signe, index) => (
              <g key={signe.nom}>
                <path className={`${s.secteurSigne} ${classeElement(signe.element)}`} d={secteur(index * 30, rotation)} />
                <path className={s.limiteSigne} d={segment(index * 30, 257, 292, rotation)} />
                <text
                  className={s.glypheSigne}
                  x={point(index * 30 + 15, 274, rotation).x}
                  y={point(index * 30 + 15, 274, rotation).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {glyphe(signe.code)}
                </text>
              </g>
            ))}
            {Array.from({ length: 72 }, (_, index) => index * 5).map((degre) => (
              <path
                key={`degre-${degre}`}
                className={degre % 10 === 0 ? s.graduationForte : s.graduation}
                d={segment(degre, degre % 10 === 0 ? 245 : 251, 257, rotation)}
              />
            ))}
          </g>

          <circle className={s.anneauMaisons} cx={CENTRE} cy={CENTRE} r="226" />
          <circle className={s.anneauInterieur} cx={CENTRE} cy={CENTRE} r="118" />
          <g aria-hidden>
            {ciel.cuspides.map((cuspide, index) => {
              const longitude = nombre(cuspide.projection);
              const suivante = nombre(ciel.cuspides[(index + 1) % ciel.cuspides.length]?.projection ?? null);
              if (longitude === null || suivante === null) return null;
              const largeur = normaliser(suivante - longitude) || 30;
              const positionNombre = point(longitude + largeur / 2, 240, rotation);
              return (
                <g key={cuspide.intitule}>
                  <path className={index % 3 === 0 ? s.cuspideForte : s.cuspide} d={segment(longitude, 226, 257, rotation)} />
                  <text className={s.numeroMaison} x={positionNombre.x} y={positionNombre.y} textAnchor="middle" dominantBaseline="central">{ROMAINS[index]}</text>
                </g>
              );
            })}
          </g>

          {ascendant && longitudeAscendant !== null && (
            <g aria-hidden>
              <path className={s.axePrincipal} d={segment(longitudeAscendant, 118, 300, rotation)} />
              <path className={s.axeSecondaire} d={segment(longitudeAscendant + 180, 118, 300, rotation)} />
              <text className={s.etiquetteAxe} x={point(longitudeAscendant, 301, rotation).x} y={point(longitudeAscendant, 301, rotation).y} textAnchor="middle" dominantBaseline="central">ASC</text>
              <text className={s.etiquetteAxeSecondaire} x={point(longitudeAscendant + 180, 301, rotation).x} y={point(longitudeAscendant + 180, 301, rotation).y} textAnchor="middle" dominantBaseline="central">DSC</text>
            </g>
          )}
          {milieuDuCiel?.projection && nombre(milieuDuCiel.projection) !== null && (
            <g aria-hidden>
              <path className={s.axePrincipal} d={segment(nombre(milieuDuCiel.projection)!, 118, 300, rotation)} />
              <path className={s.axeSecondaire} d={segment(nombre(milieuDuCiel.projection)! + 180, 118, 300, rotation)} />
              <text className={s.etiquetteAxe} x={point(nombre(milieuDuCiel.projection)!, 301, rotation).x} y={point(nombre(milieuDuCiel.projection)!, 301, rotation).y} textAnchor="middle" dominantBaseline="central">MC</text>
              <text className={s.etiquetteAxeSecondaire} x={point(nombre(milieuDuCiel.projection)! + 180, 301, rotation).x} y={point(nombre(milieuDuCiel.projection)! + 180, 301, rotation).y} textAnchor="middle" dominantBaseline="central">FC</text>
            </g>
          )}

          {aspectsVisibles && (
            <g aria-hidden>
              {ciel.aspects.map((aspect) => {
                if (isole && selection && aspect.depuis !== selection && aspect.vers !== selection) return null;
                const longitudeDepuis = nombre(aspect.projectionDepuis);
                const longitudeVers = nombre(aspect.projectionVers);
                if (longitudeDepuis === null || longitudeVers === null) return null;
                const a = point(longitudeDepuis, 113, rotation);
                const b = point(longitudeVers, 113, rotation);
                const atténué = selection && aspect.depuis !== selection && aspect.vers !== selection;
                return (
                  <path
                    key={aspect.cle}
                    className={`${s.aspect} ${classeAspect(aspect.type)} ${atténué ? s.attenue : ""}`}
                    d={`M ${a.x} ${a.y} Q ${CENTRE + ((a.x + b.x) / 2 - CENTRE) * 0.6} ${CENTRE + ((a.y + b.y) / 2 - CENTRE) * 0.6} ${b.x} ${b.y}`}
                  />
                );
              })}
            </g>
          )}

          <g>
            {places.map((corps) => {
              const vrai = point(corps.longitude, 224, rotation);
              const dessine = point(corps.longitudeDessinee, VOIES_PLANETES[corps.voie], rotation);
              const actif = corps.position.cle === selection;
              const estLie = !selection || corps.position.cle === selection || aspectsSelectionnes.some((aspect) => aspect.depuis === corps.position.cle || aspect.vers === corps.position.cle);
              const asset = ASSETS[corps.position.cle];
              if (!asset) return null;
              return (
                <g key={corps.position.cle}>
                  <path
                    className={`${s.rappel} ${corps.groupe > 1 ? s.rappelAmas : ""}`}
                    d={`M ${vrai.x} ${vrai.y} Q ${(vrai.x + dessine.x) / 2} ${(vrai.y + dessine.y) / 2} ${dessine.x} ${dessine.y}`}
                    aria-hidden
                  />
                  <g
                    className={`${s.corps} ${actif ? s.corpsActif : ""} ${isole && !estLie ? s.corpsAttenue : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${corps.position.intitule} · ${corps.position.valeur}${corps.position.maison ? ` · ${corps.position.maison}` : ""}`}
                    aria-pressed={actif}
                    data-corps={corps.position.cle}
                    data-longitude={corps.position.projection ?? undefined}
                    onClick={() => choisir(corps.position.cle)}
                    onFocus={() => setSelection(corps.position.cle)}
                    onKeyDown={(evenement) => choisirAuClavier(evenement, corps.position.cle)}
                  >
                    <title>{`${corps.position.intitule} · ${corps.position.valeur}`}</title>
                    <circle className={s.cible} cx={dessine.x} cy={dessine.y} r="31" />
                    {actif && <circle className={s.selection} cx={dessine.x} cy={dessine.y} r="29" />}
                    <image href={asset} x={dessine.x - 24} y={dessine.y - 24} width="48" height="48" preserveAspectRatio="xMidYMid meet" />
                  </g>
                </g>
              );
            })}
          </g>
          <circle className={s.coeur} cx={CENTRE} cy={CENTRE} r="7" />
        </svg>
      </div>

      {(rotationLibre !== 0 || zoom !== 1) && (
        <button type="button" className={s.recentrer} onClick={() => { setRotationLibre(0); setZoom(1); }}>
          Recentrer la carte
        </button>
      )}

      {selectionnee && (
        <article className={`${s.fichePlanete} ${aspectsSelectionnes.length > 0 ? s.ficheAvecAspects : ""}`} aria-live="polite">
          <div className={s.entetePlanete}>
            <svg className={s.planeteApercu} viewBox="0 0 96 96" aria-hidden>
              <image href={ASSETS[selectionnee.cle]} width="96" height="96" />
            </svg>
            <div>
              <p className={`t-surtitre ${s.surtitrePlanete}`}>{glyphe(CODES_GLYPHES[selectionnee.cle])} Corps céleste</p>
              <h4 className="t-titre-sm">{selectionnee.intitule}</h4>
            </div>
          </div>
          <dl className={s.faitsPlanete}>
            <div><dt className="t-meta">Position</dt><dd className="t-corps">{selectionnee.valeur}</dd></div>
            {selectionnee.maison && <div><dt className="t-meta">Maison</dt><dd className="t-corps">{selectionnee.maison}</dd></div>}
            {selectionnee.longitude && <div><dt className="t-meta">Longitude</dt><dd className="t-corps">{selectionnee.longitude}</dd></div>}
          </dl>
          {aspectsSelectionnes.length > 0 && (
            <div className={s.aspectsPlanete}>
              <p className="t-meta">Aspects majeurs</p>
              <ul>
                {aspectsSelectionnes.map((aspect) => {
                  const autre = aspect.depuis === selectionnee.cle ? aspect.intituleVers : aspect.intituleDepuis;
                  const libelle = LIBELLES_ASPECTS[aspect.type];
                  return <li key={aspect.cle} className="t-corps"><span aria-hidden>{glyphe(libelle.code)}</span> {libelle.nom} avec {autre} · orbe {aspect.orbe}</li>;
                })}
              </ul>
              <button type="button" className={s.isoler} aria-pressed={isole} onClick={() => setIsole((valeur) => !valeur)}>
                {isole ? "Voir tous les liens" : `Isoler ${selectionnee.intitule}`}
              </button>
            </div>
          )}
        </article>
      )}

      <figcaption className={`t-meta ${s.legende}`}>
        <span>{ciel.projection.repere}</span>
        <span>Maisons en signes entiers · Source : {ciel.projection.source}</span>
      </figcaption>
    </figure>
  );
}
