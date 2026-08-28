import type { NextConfig } from "next";

type EnvironnementDeploiement = Readonly<Record<string, string | undefined>>;

export function deploymentIdPour(env: EnvironnementDeploiement): string | undefined {
  for (const cle of ["VERCEL_GIT_COMMIT_SHA", "NEXT_DEPLOYMENT_ID"] as const) {
    const valeur = env[cle]?.trim();
    if (!valeur) continue;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(valeur)) {
      throw new Error(`deployment_id_invalide:${cle}`);
    }
    // Vercel REFUSE un deploymentId de plus de 32 caractères, et VERCEL_GIT_COMMIT_SHA en fait 40 :
    // le déploiement échouait avant même le build (« must be 32 characters or less »), cassant la
    // production depuis 0a06649. La validation ci-dessus ne l'attrapait pas — elle tolère 128.
    // Les 32 premiers caractères d'un SHA valent 128 bits : deux déploiements restent distincts.
    return valeur.slice(0, 32);
  }
  return undefined;
}

const nextConfig: NextConfig = {
  // Next ajoute cet identifiant aux navigations. Un ancien onglet qui rencontre un serveur plus
  // récent effectue alors une navigation dure unique au lieu de garder des références de chunks N.
  deploymentId: deploymentIdPour(process.env),
};

export default nextConfig;
