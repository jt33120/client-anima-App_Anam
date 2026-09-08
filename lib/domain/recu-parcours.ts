/** Receipt wording describes only a committed operation, including a recovered retry. */
export function texteRecuParcours(type: "ajuster" | "avancer"): string {
  return type === "ajuster"
    ? "Ton cap et tes prochains pas sont enregistrés dans Mon parcours. Nous pouvons les ajuster au fil de nos échanges."
    : "Ce passage est conservé dans Mon parcours. Tu peux retrouver ton arbre et la suite à explorer.";
}
