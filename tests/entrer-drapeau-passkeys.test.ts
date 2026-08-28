import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sansCommentaires } from "./_absence";

/**
 * entrer-drapeau-passkeys.test.ts — L'ÉCRAN NE PROMET QUE CE QU'IL AFFICHE.
 *
 * ══ LE DÉFAUT, TROUVÉ EN INSTRUISANT UN DÉPLOIEMENT BLOQUÉ (2026-08-28) ═════════════════════════
 *
 * `BoutonConnexionPasskey` est rendu sous `passkeysActives()` depuis l'arrivée du verrou. La phrase
 * d'invitation juste au-dessus, elle, ne consultait pas le drapeau : elle disait « Choisis la clé
 * d'accès de ton appareil » dans TOUS les cas.
 *
 * Or `.env.example` livre `ANIMA_PASSKEYS=` — vide. Sur un environnement qui ne l'arme pas, l'écran
 * demandait donc un geste qu'aucun élément de la page ne permettait : une invitation à choisir une
 * clé, au-dessus d'un formulaire d'e-mail seul.
 *
 * ⚠️ CE N'EST PAS UNE FAUTE DE COPIE, C'EST UNE FAUTE DE CÂBLAGE. Corriger la phrase sans garder le
 * lien au drapeau la laisserait diverger au prochain changement — exactement ce qui vient
 * d'arriver. Ce test lit donc le CÂBLAGE : le prédicat doit vivre dans le même bloc que la phrase.
 *
 * Le repli n'est pas une phrase neuve : c'est mot pour mot celle d'avant les passkeys. Un drapeau
 * éteint doit rendre l'écran d'AVANT, pas un écran dégradé.
 */

const page = sansCommentaires(
  readFileSync(resolve(process.cwd(), "app/(auth)/entrer/page.tsx"), "utf-8"),
);

const DEBUT_INVITATION = "{!attente && (";
const DEBUT_PORTES = "<div className={s.portes}>";
const invitation = page.slice(page.indexOf(DEBUT_INVITATION), page.indexOf(DEBUT_PORTES));

describe("[drapeau] `/entrer` ne promet pas une clé d’accès qu’elle n’affiche pas", () => {
  it("[CONTRÔLE DU CONTRÔLE] le bloc d’invitation a bien été isolé", () => {
    // Sans ce témoin, toutes les assertions ci-dessous seraient vraies sur une chaîne vide.
    expect(page.indexOf(DEBUT_INVITATION), "bloc d’invitation introuvable").toBeGreaterThan(-1);
    expect(page.indexOf(DEBUT_PORTES), "conteneur des portes introuvable").toBeGreaterThan(-1);
    expect(invitation.length, "le découpage a rendu un bloc vide").toBeGreaterThan(80);
  });

  it("[LE CŒUR] la phrase qui parle de clé d’accès est gardée par le drapeau", () => {
    expect(invitation, "l’invitation ne mentionne plus la clé d’accès").toContain(
      "Choisis la clé d’accès",
    );
    expect(
      invitation,
      "l’invitation promet une clé d’accès sans consulter `passkeysActives()`",
    ).toContain("passkeysActives()");
  });

  it("[LE CŒUR] drapeau éteint, l’écran retrouve sa phrase d’avant les passkeys", () => {
    expect(invitation, "aucun repli : le drapeau éteint laisserait l’écran muet ou menteur").toContain(
      "Laisse-moi ton adresse",
    );
  });

  it("le bouton reste gardé par le MÊME prédicat que la phrase", () => {
    // Deux gardes différentes pour un seul geste divergeraient : c'est la forme exacte du défaut.
    const portes = page.slice(page.indexOf(DEBUT_PORTES));
    expect(portes).toContain("passkeysActives()");
    expect(portes).toContain("BoutonConnexionPasskey");
  });
});
