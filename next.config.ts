import type { NextConfig } from "next";

type EnvironnementDeploiement = Readonly<Record<string, string | undefined>>;

export function deploymentIdPour(env: EnvironnementDeploiement): string | undefined {
  for (const cle of ["VERCEL_GIT_COMMIT_SHA", "NEXT_DEPLOYMENT_ID"] as const) {
    const valeur = env[cle]?.trim();
    if (!valeur) continue;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(valeur)) {
      throw new Error(`deployment_id_invalide:${cle}`);
    }
    return valeur;
  }
  return undefined;
}

const nextConfig: NextConfig = {
  // Next ajoute cet identifiant aux navigations. Un ancien onglet qui rencontre un serveur plus
  // récent effectue alors une navigation dure unique au lieu de garder des références de chunks N.
  deploymentId: deploymentIdPour(process.env),
};

export default nextConfig;
