import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { deploymentIdPour } from "@/next.config";

describe("[14.6] changement de déploiement et frontières françaises", () => {
  it("préfère le SHA Vercel et garde un identifiant de repli explicite", () => {
    expect(
      deploymentIdPour({
        VERCEL_GIT_COMMIT_SHA: "abc123",
        NEXT_DEPLOYMENT_ID: "manuel",
      }),
    ).toBe("abc123");
    expect(deploymentIdPour({ NEXT_DEPLOYMENT_ID: "manuel" })).toBe("manuel");
    expect(deploymentIdPour({})).toBeUndefined();
  });

  it("tronque à 32 caractères — Vercel refuse au-delà, et un SHA git en fait 40", () => {
    // Régression : la production a été cassée de 0a06649 à ce correctif. Vercel rejetait le
    // déploiement AVANT le build (« The deploymentId … must be 32 characters or less »), parce
    // que VERCEL_GIT_COMMIT_SHA est un SHA complet de 40 caractères.
    const shaComplet = "6c00130f23de7107dcda80c2575a76419c6fc0b2";
    expect(shaComplet).toHaveLength(40);

    const identifiant = deploymentIdPour({ VERCEL_GIT_COMMIT_SHA: shaComplet });
    expect(identifiant).toHaveLength(32);
    expect(shaComplet.startsWith(identifiant!)).toBe(true);
  });

  it("refuse les caractères incompatibles avec le protocole de déploiement Next", () => {
    expect(() => deploymentIdPour({ NEXT_DEPLOYMENT_ID: "avec.point" })).toThrow(
      /deployment_id_invalide:NEXT_DEPLOYMENT_ID/,
    );
    expect(() => deploymentIdPour({ NEXT_DEPLOYMENT_ID: "avec espace" })).toThrow(
      /deployment_id_invalide:NEXT_DEPLOYMENT_ID/,
    );
  });

  it("les deux frontières existent et la frontière globale possède le document", () => {
    const erreur = readFileSync(resolve(process.cwd(), "app/error.tsx"), "utf8");
    const globale = readFileSync(resolve(process.cwd(), "app/global-error.tsx"), "utf8");
    expect(erreur).toMatch(/use client/);
    expect(globale).toMatch(/use client/);
    expect(globale).toMatch(/<html lang="fr"/);
    expect(globale).toMatch(/<body/);
    expect(`${erreur}\n${globale}`).not.toMatch(/This page couldn.t load|Reload to try again/);
  });
});
