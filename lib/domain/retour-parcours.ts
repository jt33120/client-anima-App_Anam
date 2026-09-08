/** Closed navigation intents keep personal documents out of URLs and never send a message. */
export function messageRetourParcours(intention: unknown): string | undefined {
  if (intention === "commencer") return "J’aimerais poser un premier cap pour mon parcours avec toi.";
  if (intention === "ajuster") return "J’aimerais ajuster mon parcours et réfléchir à la suite avec toi.";
  if (intention === "faire_point") return "J’aimerais faire le point sur mon prochain pas avec toi.";
  return undefined;
}
