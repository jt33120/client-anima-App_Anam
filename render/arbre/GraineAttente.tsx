import Image from "next/image";
import s from "./graine-attente.module.css";

/** The botanical seed is decorative; the adjacent canvas names the actual state. */
export default function GraineAttente({ className }: { readonly className?: string }) {
  return (
    <span className={[s.graine, className].filter(Boolean).join(" ")} aria-hidden data-graine-attente="">
      <span className={s.souleve}>
        <span className={s.halo} />
        <Image className={s.corps} src="/marque/graine-nacree.webp" width={384} height={384}
          sizes="112px" alt="" draggable={false} />
      </span>
    </span>
  );
}
