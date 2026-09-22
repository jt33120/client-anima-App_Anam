import Image from "next/image";
import Link from "next/link";
import { ILLUSTRATION_ARBRE_DE_VIE } from "@/render/arbre-de-vie/illustration";
import s from "./socle.module.css";

type PorteArbre = { readonly url: string; readonly libelle: string };

export default function EnteteSocle({ titre, porteArbre }: {
  readonly titre: string;
  readonly porteArbre?: PorteArbre;
}) {
  return (
    <div className={s.enteteHalte}>
      <h1 className={`t-titre ${s.titreHalte}`}>{titre}</h1>
      {porteArbre && (
        <Link className={s.apercuArbre} href={porteArbre.url} aria-label={porteArbre.libelle}>
          <Image src={ILLUSTRATION_ARBRE_DE_VIE} alt="" width={1024} height={1536}
            sizes="(max-width: 600px) 96px, 112px" className={s.imageArbre} />
          <span className={s.libelleArbre}>Arbre de vie <span aria-hidden="true">↗</span></span>
        </Link>
      )}
    </div>
  );
}
