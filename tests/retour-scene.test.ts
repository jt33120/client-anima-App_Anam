import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { versHalte, regionDeRetour, urlRetourScene, PARAM_ORIGINE } from "@/lib/scene/retour-scene";
import { REGION_FOYER } from "@/lib/scene";

/**
 * retour-scene.test.ts — [7.13] LA HALTE REND LA RÉGION, PAS L'ACCUEIL.
 *
 * Une halte se pose PAR-DESSUS la scène : ce n'est pas un lieu du monde, c'est une parenthèse. La
 * refermer reposait toujours sur le foyer. Quelqu'un qui regardait son arbre, ouvrait « Mes
 * données » et revenait se retrouvait à l'accueil : la parenthèse lui coûtait sa place. Avec la
 * feuille de la 7.3, ce coût est payé neuf fois au lieu d'une.
 */

describe("[7.13/AC1] la région d'origine voyage dans l'URL", () => {
  it("[LE CŒUR] une halte ouverte depuis l'arbre emporte l'arbre", () => {
    expect(versHalte("/memoire", "arbre")).toBe(`/memoire?${PARAM_ORIGINE}=arbre`);
    expect(urlRetourScene({ [PARAM_ORIGINE]: "arbre" })).toBe(`/?${PARAM_ORIGINE}=arbre`);
  });

  it("le foyer n'est PAS emporté — c'est déjà le repli", () => {
    // L'ajouter mettrait un paramètre sur la majorité des liens du produit, pour ne rien changer.
    expect(versHalte("/memoire", REGION_FOYER)).toBe("/memoire");
    expect(urlRetourScene({})).toBe("/");
  });

  it("une URL qui porte déjà un paramètre reste valide", () => {
    expect(versHalte("/aide#transparence", "anam")).toContain(`?${PARAM_ORIGINE}=anam`);
    expect(versHalte("/lectures?x=1", "anam")).toBe(`/lectures?x=1&${PARAM_ORIGINE}=anam`);
  });
});

describe("[7.13/AC3] le repli penche vers le CONNU, et les deux branches sont couvertes", () => {
  it("[LE CŒUR] paramètre absent → le foyer", () => {
    expect(regionDeRetour({})).toBe(REGION_FOYER);
  });

  it("[LE CŒUR] paramètre FORGÉ → le foyer, jamais une région devinée", () => {
    // Le paramètre vient du client. Il arrive tel quel.
    for (const forge of ["<script>", "arbre;", "ARBRE", "", "../", "null"]) {
      expect(regionDeRetour({ [PARAM_ORIGINE]: forge }), `« ${forge} » a été accepté`).toBe(REGION_FOYER);
    }
  });

  it("[LE PIÈGE QUI COMPTE] `seuil` est refusé — il rouvrirait le rideau d'entrée", () => {
    // ⚠️ `seuil` EST UNE RÉGION VALIDE : `estRegion("seuil")` rend `true`. Le laisser passer
    // rouvrirait le RIDEAU D'ENTRÉE sur un compte qui l'a déjà franchi — ce qui se lit comme une
    // déconnexion, pas comme un retour. C'est le seul cas où « région valide » ne suffit pas.
    expect(regionDeRetour({ [PARAM_ORIGINE]: "seuil" })).toBe(REGION_FOYER);
    expect(urlRetourScene({ [PARAM_ORIGINE]: "seuil" })).toBe("/");
  });

  it("un tableau de valeurs (`?de=a&de=b`) ne casse rien", () => {
    expect(regionDeRetour({ [PARAM_ORIGINE]: ["arbre", "anam"] })).toBe("arbre");
    expect(regionDeRetour({ [PARAM_ORIGINE]: [] })).toBe(REGION_FOYER);
  });

  it("[CONTRÔLE POSITIF] les trois régions réelles passent", () => {
    // Sans ce témoin, tous les refus ci-dessus seraient vrais sur une fonction qui rend toujours
    // le foyer — c'est-à-dire sur un retour qui ne marche jamais.
    for (const r of ["accueil", "anam", "arbre"] as const) {
      expect(regionDeRetour({ [PARAM_ORIGINE]: r })).toBe(r);
    }
  });
});

describe("[7.13/AC2] la région ne vit ni en base, ni dans le rendu", () => {
  const lire = (f: string) => readFileSync(resolve(process.cwd(), f), "utf-8");

  it("[LE CŒUR] le module ne touche ni à `lib/data`, ni à une table", () => {
    // ⚠️ ÉCRIRE « LA DERNIÈRE RÉGION VISITÉE » EN BASE serait une écriture par navigation, sur le
    // chemin critique, pour un confort — et surtout une donnée de plus à effacer (FR-067), à
    // exporter (FR-066) et à garder (AD-14). L'URL la porte le temps d'un aller-retour, et l'oublie.
    const src = lire("lib/scene/retour-scene.ts").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(src).not.toMatch(/@\/lib\/data|supabase|from\(["']/);
  });

  it("[FR-031 DUR] aucun fil d'Ariane, aucun compteur d'écrans", () => {
    // « Un mot et une flèche, jamais 3 écrans en arrière. » Le module ne rend qu'UNE url.
    const src = lire("lib/scene/retour-scene.ts").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const mot of ["historique", "pile de", "profondeur", "compteur"]) {
      expect(src.toLowerCase(), `« ${mot} » suggère un historique visible`).not.toContain(mot);
    }
  });
});

describe("[7.13] le câblage : la scène emporte, la halte rend", () => {
  const lire = (f: string) => readFileSync(resolve(process.cwd(), f), "utf-8");
  const sansCommentaires = (s: string) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("[LE CŒUR] c'est la SCÈNE qui fabrique les liens, parce qu'elle seule connaît la région", () => {
    // ⚠️ NI LA PAGE, NI LE COMPOSANT DE MENU NE PEUVENT LE FAIRE. La page ne connaît pas la région
    // affichée — c'est un état de scène, qui change au doigt SANS navigation, donc sans que le
    // serveur en sache rien. Et la feuille ne sait pas sur quelle région elle est montée.
    const scene = sansCommentaires(lire("render/scene-dom.tsx"));
    expect(scene, "la scène ne fabrique plus les liens de menu").toMatch(
      /lienVers=\{\(url\) => versHalte\(url, region\)\}/,
    );
  });

  it("[LE CŒUR] la feuille CONSOMME la fabrique au lieu de poser l'URL nue", () => {
    // Mutation-cible : remettre `href={e.url}`. La région ne voyagerait plus, le retour retomberait
    // toujours sur le foyer, et rien ne rougirait — c'est l'état d'avant, silencieux.
    const menu = sansCommentaires(lire("render/menu/MenuCompte.tsx"));
    expect(menu, "la feuille pose l'URL nue : la région ne voyage plus").toMatch(
      /href=\{lienVers\(e\.url\)\}/,
    );
    expect(menu, "la feuille décide elle-même — elle n'a pas le droit").not.toMatch(/@\/lib\/scene/);
  });

  it("[LE CŒUR] chaque halte rend un chemin de retour, calculé côté serveur", () => {
    const haltes = [
      "app/memoire/page.tsx",
      "app/lectures/page.tsx",
      "app/synthese/page.tsx",
      "app/ancrages/page.tsx",
      "app/mes-donnees/page.tsx",
      "app/abonnement/page.tsx",
      "app/reglages/page.tsx",
      "app/socle/page.tsx",
      "app/enneagramme/page.tsx",
      "app/heure-naissance/page.tsx",
    ];
    const manquantes: string[] = [];
    for (const h of haltes) {
      const src = sansCommentaires(lire(h));
      if (!/<RetourScene url=\{urlRetourScene\(await searchParams\)\} \/>/.test(src)) manquantes.push(h);
    }
    expect(
      manquantes,
      `halte(s) sans chemin de retour — le menu leur coûte la région :\n${manquantes.join("\n")}`,
    ).toEqual([]);
  });

  it("[AD-9/FR-077] `/aide` n'a PAS reçu ce mécanisme — son retour reste un lien nu", () => {
    // ⚠️ `/aide` DOIT MARCHER QUAND TOUT LE RESTE EST CASSÉ : sans session, sans script, sans état.
    // Elle a déjà son « Retour » depuis le 2026-08-25, et il ne dépend de rien.
    const aide = sansCommentaires(lire("app/aide/page.tsx"));
    expect(aide, "/aide a gagné une dépendance dont elle n'a pas besoin").not.toContain("urlRetourScene");
    expect(aide, "/aide a perdu son retour").toMatch(/href="\/"/);
  });

  it("[FR-031 DUR] le composant de retour est un mot et une flèche, rien de plus", () => {
    const src = sansCommentaires(lire("render/RetourScene.tsx"));
    expect(src).toContain("← Revenir");
    expect(src.match(/<Link\b/g) ?? [], "plus d'un lien : c'est un fil d'Ariane qui commence").toHaveLength(1);

    // ⚠️ UN MUTANT A SURVÉCU À LA PREMIÈRE VERSION (2026-08-26) : ajouter un second `<span>` disant
    // « | 3 écrans en arrière » passait. Le compte de liens restait à 1, et « écrans » n'était dans
    // aucune liste de mots interdits. Une garde par liste de mots ne ferme jamais que les portes
    // qu'on a imaginées.
    //
    // On mesure donc la FORME : un seul élément de texte, et pas un chiffre dedans. Un compteur
    // d'écrans a besoin des deux — c'est ce qui le rend impossible à écrire ici.
    expect(
      src.match(/<span\b/g) ?? [],
      "un second élément de texte : c'est là qu'un compteur s'écrit",
    ).toHaveLength(1);
    const textesJsx = [...src.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" ");
    expect(textesJsx, "témoin : aucun texte extrait du composant").toContain("Revenir");
    expect(textesJsx, "un chiffre dans le retour — on ne compte rien à quelqu'un (FR-031)").not.toMatch(/\d/);

    for (const interdit of ["map(", "join(", "historique", "précédent"]) {
      expect(src, `« ${interdit} » suggère un chemin de navigation`).not.toContain(interdit);
    }
  });
});

describe("[7.13] une erreur de retour ne coûte JAMAIS la page", () => {
  it("[LE CŒUR] `undefined` et `null` retombent sur le foyer au lieu de lever", () => {
    // ⚠️ DIX HALTES APPELLENT CETTE FONCTION PENDANT LEUR RENDU SERVEUR. Une lecture d'index sur
    // `undefined` lèverait un `TypeError` EN PLEIN RENDU, et la page entière tomberait — pour un
    // chemin de retour, c'est-à-dire pour un confort. Le repli est celui de partout : le foyer.
    expect(() => regionDeRetour(undefined)).not.toThrow();
    expect(() => regionDeRetour(null)).not.toThrow();
    expect(regionDeRetour(undefined)).toBe(REGION_FOYER);
    expect(urlRetourScene(undefined)).toBe("/");
    expect(urlRetourScene(null)).toBe("/");
  });

  it("un objet aux formes inattendues ne lève pas davantage", () => {
    for (const bizarre of [{ de: null }, { de: 42 }, { de: {} }, { autre: "arbre" }]) {
      expect(
        () => urlRetourScene(bizarre as Record<string, string | string[] | undefined>),
        `${JSON.stringify(bizarre)} a levé`,
      ).not.toThrow();
    }
  });
});
