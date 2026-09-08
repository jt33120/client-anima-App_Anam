import s from "./parcours.module.css";

export default function ParcoursIndisponible() {
  return <section className={s.section} aria-labelledby="parcours-indisponible">
    <h2 className="t-titre-sm" id="parcours-indisponible">Ton parcours n’a pas pu s’ouvrir</h2>
    <p className={`t-corps ${s.secondaire}`}>Tu peux réessayer dans un instant ou retrouver Anam.</p>
    <div className={s.actions}>
      <a className={s.lien} href="/parcours">Réessayer</a>
      <a className={s.lien} href="/?de=anam">Revenir à Anam</a>
    </div>
  </section>;
}
