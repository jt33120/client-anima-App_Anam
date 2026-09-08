import s from "@/render/pratiques/pratiques.module.css";

export default function ChargementPratiques() {
  return <main className={s.halte} aria-busy="true"><h1 className="t-titre">Pratiques</h1><p role="status" className="t-corps">Ouverture des pratiques…</p></main>;
}
