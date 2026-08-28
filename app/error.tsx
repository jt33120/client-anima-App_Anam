"use client";

import ErreurApplication from "@/app/_erreur/ErreurApplication";

export default function Erreur({
  error,
  retry,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly retry: () => void;
}) {
  return <ErreurApplication error={error} retry={retry} />;
}
