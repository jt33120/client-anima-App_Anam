"use client";

import { useId, useState, type ReactNode } from "react";
import s from "./LectureCiel.module.css";

/** Shared mobile disclosure for the daily sky on the home and astrology pages. */
export default function LectureCiel({ children }: { readonly children: ReactNode }) {
  const [deplie, setDeplie] = useState(false);
  const texteId = useId();
  return (
    <>
      <div id={texteId} className={s.lectureCiel} data-deplie={deplie}>{children}</div>
      <button
        type="button"
        className={`t-bouton ${s.toggleCiel}`}
        aria-expanded={deplie}
        aria-controls={texteId}
        onClick={() => setDeplie(!deplie)}
      >
        {deplie ? "Réduire" : "Lire plus"}
        <span aria-hidden="true">{deplie ? " ↑" : " ↓"}</span>
      </button>
    </>
  );
}
