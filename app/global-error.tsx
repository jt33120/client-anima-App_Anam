"use client";

import "@/app/styles/globals.css";
import ErreurApplication from "@/app/_erreur/ErreurApplication";
import s from "@/app/_erreur/erreur-application.module.css";

export default function ErreurGlobale({
  error,
  retry,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly retry: () => void;
}) {
  return (
    <html lang="fr" className={s.documentGlobal}>
      <head>
        <title>Anam</title>
      </head>
      <body className={s.documentGlobal}>
        <ErreurApplication error={error} retry={retry} globale />
      </body>
    </html>
  );
}
