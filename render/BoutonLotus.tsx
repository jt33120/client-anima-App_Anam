"use client";

import type { ButtonHTMLAttributes } from "react";
import LotusAttente from "./conversation/LotusAttente";
import s from "./BoutonLotus.module.css";

/** The existing water lotus supplies the motion; the label and target keep their place. */
export default function BoutonLotus({ attente = false, children, className, disabled, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { attente?: boolean }) {
  return <button {...props} type={props.type ?? "button"} disabled={disabled || attente}
    aria-busy={attente} data-attente={attente} className={[s.bouton, className].filter(Boolean).join(" ")}>
    <span className={s.fleur} data-immobile={!attente} aria-hidden="true"><LotusAttente /></span>
    <span>{children}</span>
  </button>;
}
