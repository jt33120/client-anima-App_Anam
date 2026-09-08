import { lireSuiviAnam } from "@/lib/data/depot-suivi-anam";
import { PRATIQUES } from "@/lib/domain/pratiques";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import { urlRetourScene } from "@/lib/scene/retour-scene";
import RetourScene from "@/render/RetourScene";
import PiedHalte from "@/render/PiedHalte";
import Parcours from "@/render/parcours/Parcours";
import ParcoursIndisponible from "@/render/parcours/ParcoursIndisponible";
import s from "@/render/parcours/parcours.module.css";
import { verifierAccesParcours } from "./_acces";

export const metadata = { title: "Anam" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PageParcours({ searchParams }: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, userId } = await verifierAccesParcours();
  const resultat = await lireSuiviAnam(supabase, userId).then((suivi) => ({ disponible: true as const, suivi }), () => ({ disponible: false as const }));
  return <main className={s.halte}>
    <RetourScene url={urlRetourScene(await searchParams)} />
    <header className={s.entete}>
      <p className={`t-meta ${s.secondaire}`}>Une direction qui peut évoluer</p>
      <h1 className="t-titre">Mon parcours</h1>
      <p className={`t-corps ${s.secondaire}`}>Ce qui te guide, les prochains pas et les repères que tu choisis de confier à Anam.</p>
    </header>
    {resultat.disponible ? <Parcours key={userId} initial={resultat.suivi} compteAttendu={userId} pratiques={PRATIQUES.map(({ id, titre, href }) => ({ id, titre, href }))} /> : <ParcoursIndisponible />}
    <PiedHalte mentionIA={piedPour("parcours").mentionIA} texteMention={MENTION_IA} urlTransparence={URL_TRANSPARENCE} urlAide={URL_AIDE} />
  </main>;
}
