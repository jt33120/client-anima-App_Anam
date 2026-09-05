"use client";

// L'import évalue et mémorise le chemin initial dès l'hydratation de n'importe quelle route. Sans
// ce témoin global, le module pourrait être chargé pour la première fois après une navigation
// cliente vers `/` et confondre ce retour interne avec un nouveau document racine.
import "@/lib/scene/document-portail";

export default function InitialiserDocumentPortail() {
  return null;
}
