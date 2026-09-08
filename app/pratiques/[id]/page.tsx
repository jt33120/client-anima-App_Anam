import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { pratiqueParId } from "@/lib/domain/pratiques";
import { piedPour, MENTION_IA, URL_AIDE, URL_TRANSPARENCE } from "@/lib/domain/pied-halte";
import PiedHalte from "@/render/PiedHalte";
import LecteurPratique from "@/render/pratiques/LecteurPratique";
import s from "@/render/pratiques/pratiques.module.css";
import { verifierAccesPratiques } from "../_acces";

export const metadata = { title: "Anam" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) {
  await verifierAccesPratiques();
  const pratique = pratiqueParId((await params).id);
  if (!pratique) notFound();
  if (pratique.type === "questionnaire") redirect(pratique.href);
  return (
    <main className={s.halte}>
      <Link className={s.lien} href="/pratiques">← Les pratiques</Link>
      <header className={s.entete}>
        <p className={`t-meta ${s.secondaire}`}>Pratique guidée</p>
        <h1 className="t-titre">{pratique.titre}</h1>
        <p className={`t-corps ${s.secondaire}`}>{pratique.description}</p>
      </header>
      <LecteurPratique key={pratique.id} pratique={pratique} />
      <PiedHalte mentionIA={piedPour("pratiques/[id]").mentionIA} texteMention={MENTION_IA} urlTransparence={URL_TRANSPARENCE} urlAide={URL_AIDE} />
    </main>
  );
}
