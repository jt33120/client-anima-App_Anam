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
