import s from "@/render/parcours/parcours.module.css";

export default function ChargementParcours() {
  return <main className={s.halte} aria-busy="true"><h1 className="t-titre">Mon parcours</h1><p className="t-corps" role="status">Ouverture de ton parcours…</p></main>;
}
