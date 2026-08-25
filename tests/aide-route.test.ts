import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { URL_AIDE } from "@/lib/scene";

/**
 * Story 1.8 + 2.5 — la halte `/aide` : STATIQUE, PUBLIQUE, SANS dépendance IA (AD-9/AD-15, FR-077).
 * Le filet de sécurité ne dépend d'aucun modèle IA, d'aucun compte, d'aucune détection. On prouve
 * par lecture de fichier que la page ne lit NI session NI auth NI fournisseur IA, consomme la SOURCE
 * UNIQUE des ressources (2.5, `lib/safety/ressources-aide`), les met en forme en FICHE non alarmante,
 * groupée par famille de danger, et porte « Vérifié le … » (gouvernance FR-044). Le CONTENU des
 * numéros (chiffre-par-chiffre, familles) est prouvé côté module dans `ressources-aide.test.ts`.
 */

const racine = process.cwd();
const chemin = resolve(racine, "app/aide/page.tsx");
const cheminCss = resolve(racine, "app/aide/aide.module.css");
const src = readFileSync(chemin, "utf-8");
// CSS sans commentaires : les assertions « jamais rouge/alerte » ne doivent pas se déclencher
// sur une phrase de doc (« ni rouge, ni --alerte ») — seules les VRAIES déclarations comptent.
const css = readFileSync(cheminCss, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("URL_AIDE — source unique, alignée sur la route réelle", () => {
  it("vaut « /aide » et le fichier de route existe", () => {
    expect(URL_AIDE).toBe("/aide");
    expect(existsSync(chemin)).toBe(true);
  });
});

describe("/aide — publique, sans compte, sans traceur, SANS IA (AC2, AD-15)", () => {
  it("ne lit NI session NI auth (aucun client Supabase, aucun getUser/auth)", () => {
    expect(src).not.toMatch(/@\/lib\/data\/supabase/);
    expect(src).not.toMatch(/createSupabaseServerClient|createSupabaseAdminClient/);
    expect(src).not.toMatch(/getUser|auth\.getUser|supabase\.auth/);
  });

  it("n'appelle aucun traceur / analytics", () => {
    expect(src).not.toMatch(/analytics|gtag|mixpanel|posthog|plausible/i);
  });

  it("ne dépend d'AUCUN fournisseur IA (aucun import lib/ai, aucun SDK)", () => {
    expect(src, "le filet ne doit jamais dépendre du fournisseur IA (AD-15)").not.toMatch(/@\/lib\/ai/);
    expect(src).not.toMatch(/mistral|openai|anthropic/i);
  });

  it("porte l'identité de route « Anam »", () => {
    expect(src).toMatch(/title:\s*["']Anam["']/);
  });
});

describe("/aide — consomme la SOURCE UNIQUE des ressources (AC3, 2.5)", () => {
  it("importe la liste depuis lib/safety/ressources-aide (plus de liste inline)", () => {
    expect(src).toMatch(/@\/lib\/safety\/ressources-aide/);
    expect(src).toMatch(/RESSOURCES_AIDE/);
    expect(src).toMatch(/FAMILLES_ORDRE/);
    // plus AUCUN numéro codé en dur dans la page : la source unique est le module.
    expect(src, "3114 ne doit plus être inline dans la page").not.toContain('"3114"');
  });

  it("génère les liens tel: et le nom accessible (numéro visible EN TÊTE + service + chiffres) depuis la donnée", () => {
    expect(src).toMatch(/href=\{`tel:\$\{[^}]+\.tel\}`\}/);
    // WCAG 2.5.3 (Label in Name) : le nom accessible COMMENCE par le numéro visible (revue 2.6, R7),
    // puis le service, puis la lecture chiffre par chiffre.
    expect(src).toMatch(/aria-label=\{`\$\{[^}]+\.numero\}, \$\{[^}]+\.service\}, \$\{[^}]+\.aria\}`\}/);
  });

  it("groupe par FAMILLE de danger (en-têtes de groupe)", () => {
    expect(src).toMatch(/FAMILLES_ORDRE\.map/);
    expect(src).toMatch(/LIBELLE_FAMILLE/);
  });

  it("affiche « Vérifié le … » (gouvernance FR-044)", () => {
    expect(src).toMatch(/Vérifié le/);
    expect(src).toMatch(/verifieLeLibelle|VERIFIE_LE/);
  });

  it("porte l'ancre de transparence, cible de la mention « Anam est une IA »", () => {
    expect(src).toMatch(/id="transparence"/);
    expect(src).toMatch(/Anam est une IA/);
  });
});

describe("/aide — le bloc ressources en FICHE, JAMAIS alarmant (AC3)", () => {
  it("met en forme en fiche : surface-elevee ET bordure-forte", () => {
    expect(css).toMatch(/--surface-elevee/);
    expect(css).toMatch(/--bordure-forte/);
  });

  it("n'utilise AUCUNE couleur brute — que des tokens var(--…) → jamais de rouge alarmant (AD-9)", () => {
    // Le filet rassure : toute couleur vient du thème (tokens), aucune n'est rouge/alerte. On rejette
    // donc toute couleur LITTÉRALE (hex, rgb/hsl, nom de couleur) — bien plus robuste que blacklister
    // « red »/« #ff0000 » (qui laissait passer #e53e3e, crimson, rgb(255,0,0), var(--danger)…).
    expect(css, "couleur hex brute dans /aide").not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css, "rgb()/hsl() brut dans /aide").not.toMatch(/\b(rgb|hsl)a?\(/i);
    expect(css, "nom de couleur brut (rouge/alerte) dans /aide").not.toMatch(
      /\b(red|crimson|firebrick|tomato|orangered|darkred|indianred)\b/i,
    );
    expect(css, "jamais le token d'alerte du thème").not.toMatch(/--alerte|--rouge/);
  });

  it("n'est jamais modal / bloquant", () => {
    expect(src).not.toMatch(/role="dialog"|aria-modal|<dialog/);
  });
});

describe("/aide — sortie rapide (FR-074, Story 2.6)", () => {
  const sortie = readFileSync(resolve(racine, "app/aide/SortieRapide.tsx"), "utf-8");

  it("la page monte le contrôle « Quitter » en tête", () => {
    expect(src).toMatch(/SortieRapide/);
  });

  it("navigue vers un site NEUTRE en REMPLAÇANT l'entrée d'historique (pratique standard violences)", () => {
    expect(sortie).toMatch(/"use client"/);
    expect(sortie).toMatch(/location\.replace/); // remplace l'historique (le retour ne revient pas)
    expect(sortie).toMatch(/https?:\/\//); // une URL neutre absolue
  });

  /**
   * ══ LES DEUX SORTIES, ET POURQUOI IL EN FAUT DEUX (retour de Julian, 2026-08-25) ═════════════
   *
   * « trop bizarre à vraiment régler : quand je quitte la page aide je suis redirigé vers météo
   * france !!! » — et le code faisait exactement ce qui était écrit. `/aide` ne portait qu'UN
   * contrôle, la sortie de secours FR-074, qui navigue vers un site neutre et ÉCRASE l'historique.
   * Il s'appelait « Quitter ». Quiconque voulait simplement refermer l'aide et rentrer dans Anima
   * cliquait dessus et quittait le produit, sans retour arrière possible.
   *
   * Une sortie de secours que tout le monde déclenche par erreur n'en est plus une.
   *
   * ⚠️ CE QUI EST GARDÉ ICI EST STRUCTUREL, PAS LEXICAL. On n'épelle pas les libellés — ils sont
   * PROVISOIRES et attendent la relecture d'un juriste et d'un professionnel (voir l'en-tête de
   * `SortieRapide.tsx`). Ce qu'on interdit, c'est que la page redevienne un cul-de-sac : deux
   * commandes distinctes, l'une qui rentre, l'autre qui sort.
   */
  it("[LE CŒUR] la page porte un RETOUR vers le produit — sa seule issue ne mène plus dehors", () => {
    expect(src, "aucun retour interne : qui veut refermer l’aide quitte Anima").toMatch(
      /<Link[^>]*href="\/"/,
    );
  });

  it("[LE CŒUR] le retour et la sortie de secours sont DEUX commandes, pas une seule à deux rôles", () => {
    // C'est la confusion exacte du défaut : un seul contrôle portait les deux gestes.
    expect(src).toMatch(/<SortieRapide\s*\/>/);
    const enTete = /<div className=\{s\.enTete\}>([\s\S]*?)<\/div>/.exec(src);
    expect(enTete, "l’en-tête à deux sorties a disparu").not.toBeNull();
    expect(enTete![1], "le retour n’est plus dans l’en-tête").toMatch(/href="\/"/);
    expect(enTete![1], "la sortie de secours n’est plus dans l’en-tête").toMatch(/SortieRapide/);
  });

  it("le retour reste un lien NU — aucun JavaScript de navigation sur la page qui doit toujours marcher", () => {
    // AD-15 : `/aide` est la porte de secours, elle doit fonctionner quand tout le reste est cassé.
    // Un `router.back()` aurait de plus échoué précisément dans le cas qui compte : celle qui arrive
    // ici par un lien direct, en détresse, n’a aucune entrée d’historique où revenir.
    // ⚠️ ON DÉCOMMENTE AVANT DE CHERCHER, et la garde a rougi sur MA PROPRE PROSE : le commentaire
    // de `page.tsx` explique justement pourquoi on n’emploie pas `router.back()`, et le mot y était.
    // Une garde « corrigée » en retirant l’explication aurait échangé la raison contre le vert.
    const codeSeul = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    expect(codeSeul, "la page d’aide s’est mise à naviguer en JavaScript").not.toMatch(
      /useRouter|router\.(back|push)/,
    );
  });

  it("et la sortie de secours, elle, mène TOUJOURS dehors en écrasant l’historique", () => {
    // Anti-vacuité des deux gardes ci-dessus : elles seraient toutes deux vraies d’une page dont on
    // aurait simplement fait pointer la « sortie » vers `/`. Ce serait détruire FR-074.
    expect(sortie).toMatch(/location\.replace\(\s*URL_NEUTRE\s*\)/);
    expect(sortie).toMatch(/const URL_NEUTRE = "https:\/\/[^"]+"/);
  });

  it("préserve l'étanchéité de /aide : aucune session, aucune IA, aucun traceur", () => {
    expect(sortie).not.toMatch(/@\/lib\/(data|ai)|supabase|getUser/);
    expect(sortie).not.toMatch(/analytics|gtag|mixpanel|posthog|plausible/i);
  });
});

describe("[7.12] la sortie rapide ne laisse aucune trace, et n'emprunte aucun invariant", () => {
  const RACINE_7_12 = process.cwd();
  const lireFichier = (f: string) => readFileSync(resolve(RACINE_7_12, f), "utf-8");

  it("[LE CŒUR] aucun numéro de FR n'est REVENDIQUÉ par la sortie rapide", () => {
    // ⚠️ ELLE CITAIT « FR-074 », QUI TRAITE DES DANGERS NON SUICIDAIRES ET NE DIT RIEN D'UNE SORTIE
    // RAPIDE. Aucun FR du PRD ne porte ce contrôle. Un invariant EMPRUNTÉ est plus dangereux qu'un
    // invariant absent : il donne à une ligne l'autorité d'une exigence produit qu'elle n'a pas, et
    // il EMPÊCHE L'ARBITRAGE — personne ne discute une ligne marquée FR.
    //
    // On distingue REVENDIQUER de CITER : le commentaire qui explique pourquoi FR-074 était faux
    // doit pouvoir nommer FR-074. Ce qu'on refuse, c'est la forme « (Story X, FR-Y) » d'en-tête.
    const src = lireFichier("app/aide/SortieRapide.tsx");
    expect(src, "la sortie rapide se réclame à nouveau d'un FR").not.toMatch(
      /SortieRapide[^\n]*\(Story [^)]*FR-\d+\)/,
    );
    expect(src, "son statut réel — proposition non validée — n'est plus cité").toMatch(/EXPERIENCE\.md:605/);
    expect(src, "la porte pré-lancement n'est plus nommée").toMatch(/juriste/i);
  });

  it("[LE CŒUR] la décision de PLACEMENT est écrite et datée", () => {
    // `EXPERIENCE.md:605` laissait la question ouverte : reste-t-elle sur /aide, ou migre-t-elle
    // dans la surimpression ? Une question ouverte se retranche à chaud, dans un sens ou dans
    // l'autre, par celui qui passe.
    const src = lireFichier("app/aide/SortieRapide.tsx");
    expect(src).toMatch(/DÉCISION ÉCRITE DU 20\d\d-\d\d-\d\d/);
    expect(src, "l'issue refusée n'est pas nommée — une décision sans alternative n'en est pas une").toMatch(
      /surimpression/,
    );
  });

  it("[LE CŒUR] `Referrer-Policy: no-referrer` est posé, et sur TOUTES les réponses", () => {
    // ⚠️ AUCUN `Referrer-Policy` N'EXISTAIT DANS TOUT LE PRODUIT au 2026-08-25. Sans lui, la sortie
    // rapide annonce l'origine d'Anima au site de destination dans `Referer` — un contrôle dont
    // l'objet est de NE LAISSER AUCUNE TRACE ne peut pas dire d'où l'on vient.
    //
    // Il est posé dans `proxy.ts`, à l'unique endroit où toutes les réponses se rejoignent : la
    // classe de défauts la plus coûteuse de ce dépôt est la garde posée sur un chemin sur trois.
    const proxy = lireFichier("proxy.ts").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(proxy, "l'en-tête n'est pas posé").toMatch(/headers\.set\("Referrer-Policy",\s*"no-referrer"\)/);
    expect(
      proxy,
      "l'en-tête est posé mais jamais appelé — il ne protège rien",
    ).toMatch(/return neLaisserAucuneTrace\(/);
  });
});
