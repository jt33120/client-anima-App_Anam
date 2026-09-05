"use client";

import { useLayoutEffect, useState } from "react";
import { reserverPortailDuDocument } from "@/lib/scene/document-portail";
import PortailAnam from "./PortailAnam";

export default function PortailAuLancement({
  copie,
}: {
  readonly copie: {
    readonly nom: string;
    readonly annonce: string;
  };
}) {
  // Le voile existe dans le HTML initial afin qu'un document froid ne peigne jamais la scène avant
  // son écran d'entrée. Lors d'une navigation cliente vers `/`, le layout-effect le retire avant
  // la peinture : le portail ne se rejoue donc pas entre deux écrans du même document.
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    if (!reserverPortailDuDocument(window.location.pathname)) setVisible(false);
  }, []);

  return visible ? <PortailAnam copie={copie} /> : null;
}
