import { PRATIQUES } from "@/lib/domain/pratiques";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import { urlRetourScene } from "@/lib/scene/retour-scene";
import RetourScene from "@/render/RetourScene";
import PiedHalte from "@/render/PiedHalte";
import PratiquesHub from "@/render/pratiques/PratiquesHub";
import s from "@/render/pratiques/pratiques.module.css";
import { verifierAccesPratiques } from "./_acces";

export const metadata = { title: "Anam" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ searchParams }: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await verifierAccesPratiques();
  return (
    <main className={s.halte}>
      <RetourScene url={urlRetourScene(await searchParams)} />
      <header className={s.entete}>
        <p className={`t-meta ${s.secondaire}`}>Un espace pour essayer</p>
        <h1 className="t-titre">Pratiques</h1>
        <p className={`t-corps ${s.secondaire}`}>Respirer, observer ce qui se passe en toi, choisir un petit pas. Anam peut te proposer une pratique dans la conversation ; tu peux aussi la choisir ici.</p>
      </header>
      <PratiquesHub pratiques={PRATIQUES} />
      <PiedHalte mentionIA={piedPour("pratiques").mentionIA} texteMention={MENTION_IA} urlTransparence={URL_TRANSPARENCE} urlAide={URL_AIDE} />
    </main>
  );
}
