import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * copie-sans-cadratin.test.ts — PLUS AUCUN TIRET CADRATIN DANS CE QUE LE PRODUIT AFFICHE (E1-S1)
 *
 * Retour du fondateur (Julian, 2026-09-01) : « dans l'ensemble des textes de l'app, bannir les —
 * qui font très IA ». Le tiret cadratin est la ponctuation la plus reconnaissable d'un texte
 * engendré ; dans la bouche d'Anam, il dit « une machine a écrit ça » plus fort que n'importe quel
 * mot. Il n'y a rien à corriger dans la voix : il y a un signe à retirer, partout, et à ne plus
 * jamais laisser revenir.
 *
 * Cette garde est écrite AVANT les réécritures (patron `qa-visuelle-19-aout.test.ts`) : son premier
 * run rouge est l'inventaire exact de ce qu'il reste à réécrire, fichier et ligne. Elle lit la
 * SOURCE, jamais un rendu : un navigateur ne mesure que les écrans qu'on a ouverts, et le tiret qui
 * reste est toujours sur celui qu'on n'a pas ouvert.
 *
 * ══ CE QU'ELLE LIT, ET CE QU'ELLE NE LIT PAS ════════════════════════════════════════════════════
 *
 * Elle lit ce qui peut atteindre un écran : les chaînes `"…"`, `'…'`, `` `…` `` (gabarits
 * multi-lignes compris) et le texte JSX entre deux balises, de `app/`, `render/` et `lib/`. Elle
 * retire d'abord les commentaires (un avertissement qui NOMME l'interdit ne doit pas rougir) et les
 * appels `console.*` / `throw new …Error(` (des journaux serveur, que personne ne lit à l'écran).
 *
 * ⚠️ UN LITTÉRAL REGEX N'EST PAS UNE CHAÎNE. `lib/domain/bilan.ts` porte « — » dans une classe de
 * caractères (`/^[\s>#*•\-–—]+/`, une puce à retirer) : ce n'est pas du texte, l'extracteur ne le
 * voit pas, et l'exempter serait donc un trou gratuit que le méta-test ci-dessous refuserait. Il
 * n'est PAS dans la liste, et c'est voulu.
 */

const RACINE = process.cwd();
const lire = (p: string) => readFileSync(resolve(RACINE, p), "utf-8");

/** U+2014, U+2013, et leurs déguisements : entité HTML, échappement JavaScript. */
const TIRET = /[—–]|&mdash;|&ndash;|\\u\{?201[34]\}?/;

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LES EXEMPTIONS — chacune nommée, chacune avec sa preuve, chacune éprouvée plus bas
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Fichiers exemptés EN ENTIER. Trois natures, et aucune n'est « de la copie qu'on réécrira plus
 * tard sans le dire » :
 *   (a) un tiret qu'un AUTRE test exige tel quel ;
 *   (b) une consigne lue par le modèle, jamais affichée (la règle « pas de tiret » y est d'ailleurs
 *       donnée AU modèle, en toutes lettres, dans `consigne-voix.ts`) ;
 *   (c) des motifs internes ou un export HTML, hors de la copie d'écran.
 * Le méta-test « chaque exemption est nécessaire » rougit dès qu'un de ces fichiers n'a plus de
 * tiret dans une chaîne : l'exemption est alors à retirer, pas à garder « au cas où ».
 */
const EXEMPTS_ENTIERS: ReadonlyArray<readonly [fichier: string, preuve: string]> = [
  // (a) exigés tels quels par un autre test
  [
    "lib/domain/export-lisible.ts",
    "valeur vide « — » de l'export lisible, figée par tests/export-lisible.test.ts",
  ],
  [
    "lib/courriel/gabarits.ts",
    "signature « — Anam » des courriels, exigée par tests/retention-avis.test.ts (D11)",
  ],
  // (b) consignes et contextes lus par le modèle, jamais affichés
  ["lib/domain/consigne-voix.ts", "consigne système d'Anam : texte lu par le modèle"],
  ["lib/domain/consigne-phase.ts", "consignes de phase : texte lu par le modèle"],
  ["lib/domain/consigne-synthese.ts", "consigne de synthèse : texte lu par le modèle"],
  ["lib/domain/consigne-lecture.ts", "consigne de lecture : texte lu par le modèle"],
  ["lib/domain/consigne-bilan.ts", "consigne de bilan : texte lu par le modèle"],
  ["lib/domain/consigne-compactage.ts", "consigne de compactage : texte lu par le modèle"],
  ["lib/domain/contexte-anam.ts", "contexte remis au modèle, jamais affiché"],
  // `carte-contexte.ts` était pressenti ici (E1-S1) : ses tirets vivent tous en commentaire, et le
  // méta-test a refusé l'exemption au premier run. Il est balayé comme les autres, et propre.
  ["lib/domain/retour-theme.ts", "instruction de retour de thème : texte lu par le modèle"],
  ["lib/domain/reconceptualisation.ts", "instruction de reconceptualisation : texte lu par le modèle"],
  ["lib/domain/signaux-arc.ts", "signaux d'arc remis au modèle, jamais affichés"],
  ["lib/safety/corpus-detresse.ts", "messages SIMULÉS qui éprouvent le détecteur : des entrées, pas de la copie"],
  ["lib/safety/detecteur-detresse.ts", "prompt de détection de détresse : texte lu par le modèle"],
  // `consigne-detresse.ts` était pressenti aussi : même verdict que `carte-contexte.ts`, ses tirets
  // sont tous en commentaire. Balayé, et propre.
  // (c) motifs internes / export HTML, hors copie d'écran (à réécrire dans un lot ultérieur)
  ["lib/domain/pied-halte.ts", "motifs internes de pied de halte, hors copie d'écran"],
  ["lib/domain/inventaire-export.ts", "export HTML des données, pas la copie d'un écran"],
  ["lib/domain/inventaire-effacement.ts", "inventaire interne de l'effacement, pas la copie d'un écran"],
];

/**
 * Exemptions PAR RÉGION : un fichier qui mêle une consigne modèle (exemptée) et de la copie affichée
 * (balayée). `enneagramme-hypothese.ts` porte `INSTRUCTION_HYPOTHESE_ENNEAGRAMME`, lue par le
 * modèle, ET `PHRASE_OUVERTURE_HYPOTHESE`, qu'Anam dit dans le fil : exempter le fichier entier
 * aurait laissé passer la phrase du fil, qui est précisément une des cibles du fondateur.
 */
const EXEMPTS_PAR_REGION: ReadonlyArray<{
  readonly fichier: string;
  readonly debut: RegExp;
  readonly fin: RegExp;
  readonly preuve: string;
}> = [
  {
    fichier: "lib/domain/enneagramme-hypothese.ts",
    debut: /export const INSTRUCTION_HYPOTHESE_ENNEAGRAMME = \[/,
    fin: /\]\.join\(/,
    preuve: "instruction lue par le modèle ; le reste du fichier est de la copie affichée",
  },
];

// ══════════════════════════════════════════════════════════════════════════════════════════════
// L'EXTRACTEUR — ce qui peut atteindre l'écran, avec sa ligne
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Commentaires retirés, LIGNES CONSERVÉES. `_absence.sansCommentaires` remplace un bloc par une
 * espace, ce qui décale toutes les lignes qui suivent : ici chaque relevé porte son `fichier:ligne`,
 * parce que le premier run de cette garde EST l'inventaire des réécritures, et un inventaire sans
 * ligne se relit à la main. Même sémantique, sinon : les blocs, puis les lignes `//`, sauf `://`.
 */
function sansCommentairesMemeLignes(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (bloc) => bloc.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * Efface les appels `console.*(…)` et `throw new …Error(…)` avec leurs parenthèses, lignes
 * conservées. Un journal serveur n'est pas de la copie : on ne réécrit pas ce que personne ne voit,
 * et on ne veut pas non plus qu'un « — » dans un message d'erreur cache, par son bruit, celui d'un
 * écran. Les chaînes rencontrées pendant le comptage des parenthèses sont sautées, pour qu'une
 * parenthèse ouvrante DANS un message n'avale pas la suite du fichier en silence.
 */
function sansAppelsTechniques(src: string): string {
  const debut = /\b(?:console\.\w+|throw new \w*Error)\s*\(/g;
  let sortie = "";
  let curseur = 0;
  for (const m of src.matchAll(debut)) {
    if (m.index < curseur) continue;
    let i = m.index + m[0].length;
    let profondeur = 1;
    while (i < src.length && profondeur > 0) {
      const c = src[i];
      if (c === '"' || c === "'" || c === "`") {
        i++;
        while (i < src.length && src[i] !== c) i += src[i] === "\\" ? 2 : 1;
      } else if (c === "(") profondeur++;
      else if (c === ")") profondeur--;
      i++;
    }
    sortie += src.slice(curseur, m.index) + src.slice(m.index, i).replace(/[^\n]/g, " ");
    curseur = i;
  }
  return sortie + src.slice(curseur);
}

interface Releve {
  readonly ligne: number;
  readonly texte: string;
}

/**
 * Une passe unique : le délimiteur rencontré en premier ouvre la chaîne et consomme les autres. Une
 * apostrophe droite collée à une lettre (`l'heure`, dans un texte JSX) n'ouvre PAS une chaîne :
 * sinon « l'heure — d'accord » verrait son tiret blanchi entre deux « chaînes » imaginaires.
 */
const CHAINE = /"((?:\\.|[^"\\\n])*)"|(?<![\p{L}\p{N}])'((?:\\.|[^'\\\n])*)'|`((?:\\.|[^`\\])*)`/gu;
/**
 * Texte JSX : ce qui vit entre deux balises OU entre une balise et une expression, sans accolade ni
 * balise dedans. ⚠️ `>([^<>{}]+)<` seul (le motif de `_absence.texteVisible`) était AVEUGLE au texte
 * collé à `{" "}` ou à `{etat.adresse}` : trois phrases de `/entrer` et `/consentement` portaient
 * leur tiret dans un texte qui commence après un `}` ou finit avant un `{`, et le premier run ne
 * les a pas vues. Un crible brut sur la source l'a dit ; le piège « collé à une expression » du
 * contrôle du contrôle empêche que l'angle mort revienne.
 */
const TEXTE_JSX = /[>}]([^<>{}]+)[<{]/g;

const ligneDe = (src: string, index: number) => src.slice(0, index).split("\n").length;

/** Tout ce qui, dans `src`, peut atteindre un écran ET porte un tiret. */
function relevesDe(src: string): Releve[] {
  const propre = sansAppelsTechniques(sansCommentairesMemeLignes(src));
  const releves: Releve[] = [];
  for (const m of propre.matchAll(CHAINE)) {
    const texte = m[1] ?? m[2] ?? m[3] ?? "";
    if (TIRET.test(texte)) releves.push({ ligne: ligneDe(propre, m.index), texte });
  }
  // Les chaînes sont blanchies (lignes conservées) AVANT la lecture du texte JSX : un span de code
  // `} … {` en `.ts` qui enjambe une chaîne relevée ci-dessus la compterait une seconde fois.
  const sansChaines = propre.replace(CHAINE, (c) => c.replace(/[^\n]/g, " "));
  for (const m of sansChaines.matchAll(TEXTE_JSX)) {
    if (TIRET.test(m[1])) releves.push({ ligne: ligneDe(sansChaines, m.index), texte: m[1].trim() });
  }
  return releves.sort((a, b) => a.ligne - b.ligne);
}

/** Bornes (lignes incluses) d'une région exemptée, ou `null` si le fichier ne la porte plus. */
function bornesRegion(src: string, debut: RegExp, fin: RegExp): [number, number] | null {
  const d = src.search(debut);
  if (d < 0) return null;
  const f = src.slice(d).search(fin);
  if (f < 0) return null;
  return [ligneDe(src, d), ligneDe(src, d + f)];
}

function fichiersDe(dossier: string, extensions: readonly string[]): string[] {
  return (readdirSync(resolve(RACINE, dossier), { recursive: true, encoding: "utf-8" }) as string[])
    .filter((f) => extensions.some((ext) => f.endsWith(ext)) && !f.includes(".test."))
    .map((f) => `${dossier}/${f}`);
}

/** Le périmètre du fondateur : tout ce qui écrit un mot à l'écran. `lib/` n'a pas de `.tsx`. */
function cibles(): string[] {
  return [
    ...fichiersDe("app", [".ts", ".tsx"]),
    ...fichiersDe("render", [".ts", ".tsx"]),
    ...fichiersDe("lib", [".ts"]),
  ];
}

const EXEMPTS = new Set(EXEMPTS_ENTIERS.map(([f]) => f));

/** Les relevés d'un fichier, exemptions appliquées (entières, puis par région). */
function fautivesDe(fichier: string): string[] {
  if (EXEMPTS.has(fichier)) return [];
  const src = lire(fichier);
  const regions = EXEMPTS_PAR_REGION.filter((r) => r.fichier === fichier)
    .map((r) => bornesRegion(src, r.debut, r.fin))
    .filter((b): b is [number, number] => b !== null);
  return relevesDe(src)
    .filter(({ ligne }) => !regions.some(([d, f]) => ligne >= d && ligne <= f))
    .map(({ ligne, texte }) => `${fichier}:${ligne} → « ${texte.slice(0, 110)} »`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LA GARDE
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[E1-S1] plus aucun tiret cadratin dans la copie affichée", () => {
  it("[LE CŒUR] aucun U+2014 ni U+2013 dans une chaîne ou un texte JSX de app/, render/, lib/", () => {
    // Retour du fondateur (2026-09-01). Chaque relevé ci-dessous est un tiret à remplacer par un
    // deux-points, une virgule, ou un point et une nouvelle phrase, jamais par un trait d'union
    // (E1-S7). Le relevé porte la ligne : c'est l'inventaire, pas seulement le verdict.
    const fautives = cibles().flatMap(fautivesDe);
    expect(
      fautives,
      `${fautives.length} tiret(s) cadratin dans la copie affichée :\n${fautives.join("\n")}`,
    ).toEqual([]);
  });

  it("[NON-VACUITÉ] le balayage voit plus de 150 fichiers, racine par racine", () => {
    // Un seuil global ne tue pas son mutant (leçon de `lexique-voix.test.ts`) : retirer `app/` et
    // `render/` laisserait `lib/` seul au-dessus de 150. Chaque racine atteste donc sa présence.
    const parRacine = (prefixe: string) => cibles().filter((f) => f.startsWith(`${prefixe}/`)).length;
    expect(parRacine("app"), "la racine `app` a disparu du balayage").toBeGreaterThan(20);
    expect(parRacine("render"), "la racine `render` a disparu du balayage").toBeGreaterThan(20);
    expect(parRacine("lib"), "la racine `lib` a disparu du balayage").toBeGreaterThan(60);
    expect(cibles().length).toBeGreaterThan(150);
  });

  it("[CONTRÔLE DU CONTRÔLE] une chaîne piégée est attrapée, sous chacune des quatre formes", () => {
    // Sans ce contrôle, un extracteur qui ne verrait plus rien serait vert, et aveugle.
    const pieges: ReadonlyArray<readonly [forme: string, source: string]> = [
      ["guillemets doubles", 'const x = "Te revoilà — Louise.";'],
      ["guillemets simples", "const x = 'Te revoilà — Louise.';"],
      ["gabarit multi-ligne", "const x = `Te revoilà,\n${prenom} — on reprend.`;"],
      ["texte JSX", "<p>\n  Te revoilà — on reprend.\n</p>"],
      ["texte JSX collé à une expression", '<p>\n  Te revoilà{" "}\n  <b>Louise</b> — on reprend{" "}\n</p>'],
      ["texte JSX ouvert par une expression", "<p>{prenom} — on reprend.</p>"],
      ["texte JSX à apostrophes droites", "<p>l'heure — d'accord</p>"],
      ["demi-cadratin", 'const x = "de 9 h – 18 h";'],
    ];
    for (const [forme, source] of pieges) {
      expect(relevesDe(source).length, `${forme} : le piège n'est pas attrapé`).toBeGreaterThan(0);
    }
    // Et la ligne relevée est la bonne : l'inventaire ne vaut que si elle l'est.
    expect(relevesDe("\n\nconst x = `Te revoilà,\n${prenom} — on reprend.`;")[0]?.ligne).toBe(3);
  });

  it("[CONTRÔLE DU CONTRÔLE] les déguisements du tiret sont attrapés aussi", () => {
    // `&mdash;` en JSX et `—` dans une chaîne affichent exactement le même signe : les laisser
    // passer ferait de la garde une garde sur l'orthographe du code, pas sur ce que voit l'écran.
    expect(relevesDe("<p>Te revoilà &mdash; on reprend.</p>").length).toBeGreaterThan(0);
    expect(relevesDe('const x = "Te revoilà \\u2014 on reprend.";').length).toBeGreaterThan(0);
  });

  it("un commentaire, un `console.*`, un `throw` ne comptent pas, et rien d'autre n'est ignoré", () => {
    // Les trois seules choses que l'extracteur laisse passer, chacune vérifiée pour elle-même. La
    // parenthèse ouvrante DANS le message de `console.error` est le cas qui avalerait la suite du
    // fichier avec un compteur naïf : la chaîne affichée qui suit doit rester vue.
    expect(relevesDe("// un tiret — en commentaire\n/* et un autre — ici */")).toEqual([]);
    expect(relevesDe('console.error("[x] impossible — repli", { a: 1 });')).toEqual([]);
    expect(relevesDe('throw new Error("indice — la source est en panne");')).toEqual([]);
    expect(relevesDe('throw new TypeError(`indice — ${n} rejets`);')).toEqual([]);
    const suite = 'console.warn("ouvre ( — sans fermer");\nconst copie = "Te revoilà — Louise.";';
    expect(relevesDe(suite).map((r) => r.ligne)).toEqual([2]);
    // Les lignes sont conservées par les deux nettoyages : un relevé pointe toujours la vraie ligne.
    const bloc = "a\n/* deux\nlignes */\nconsole.log(\n'x'\n);\nb";
    expect(sansAppelsTechniques(sansCommentairesMemeLignes(bloc)).split("\n").length).toBe(
      bloc.split("\n").length,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LES EXEMPTIONS SONT ÉPROUVÉES — une exemption est un trou, et un trou se justifie
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[E1-S1] chaque exemption est nécessaire, et aucune n'est là par confort", () => {
  it("les fichiers exemptés existent : une exemption périmée est un trou qui ne se voit pas", () => {
    // Un fichier renommé laisse son exemption derrière lui, jusqu'au jour où un nouveau fichier
    // reprend le chemin libéré et se retrouve exempté sans que personne ne l'ait décidé.
    for (const [fichier] of EXEMPTS_ENTIERS) {
      expect(existsSync(resolve(RACINE, fichier)), `${fichier} n'existe plus : exemption à retirer`).toBe(true);
    }
    for (const { fichier } of EXEMPTS_PAR_REGION) {
      expect(existsSync(resolve(RACINE, fichier)), `${fichier} n'existe plus : exemption à retirer`).toBe(true);
    }
  });

  it("[LE CŒUR] chaque fichier exempté en entier porte RÉELLEMENT un tiret dans une chaîne", () => {
    // La règle (patron `lexique-voix.test.ts`) : un fichier n'est exempté que s'il en a besoin. Le
    // jour où une consigne est réécrite sans tiret, son exemption devient un trou gratuit, et ce
    // test le dit. Mutation-cible : ajouter à la liste un fichier propre, le geste exact qu'on veut
    // empêcher, ou y laisser un fichier qu'un lot de réécriture vient de nettoyer.
    // Toutes les exemptions inutiles d'un coup, pas la première : c'est une liste à retirer.
    const inutiles = EXEMPTS_ENTIERS.filter(([fichier]) => relevesDe(lire(fichier)).length === 0).map(
      ([fichier, preuve]) => `${fichier} (« ${preuve} ») ne porte plus aucun tiret dans une chaîne`,
    );
    expect(inutiles, `exemptions qui ne protègent de rien :\n${inutiles.join("\n")}`).toEqual([]);
  });

  it("[LE CŒUR] chaque région exemptée porte un tiret, et son fichier n'est pas exempté deux fois", () => {
    for (const { fichier, debut, fin, preuve } of EXEMPTS_PAR_REGION) {
      expect(EXEMPTS.has(fichier), `${fichier} est exempté en entier ET par région`).toBe(false);
      const src = lire(fichier);
      const bornes = bornesRegion(src, debut, fin);
      expect(bornes, `${fichier} : la région « ${preuve} » est introuvable`).not.toBeNull();
      const [d, f] = bornes!;
      const dansLaRegion = relevesDe(src).filter((r) => r.ligne >= d && r.ligne <= f);
      expect(
        dansLaRegion.length,
        `${fichier} : la région ${d}-${f} ne porte plus de tiret, son exemption est un trou`,
      ).toBeGreaterThan(0);
    }
  });

  it("l'effacement des `console.*` / `throw` protège de vrais appels, et seulement d'appels", () => {
    // Si plus aucun journal ne portait de tiret, ce nettoyage serait du code mort dans la garde :
    // on le saurait ici. Et s'il effaçait plus que des appels, le nombre de fichiers touchés ne
    // collerait pas à ceux qui en contiennent : on le saurait aussi.
    const avecAppels = cibles().filter((f) => {
      const propre = sansCommentairesMemeLignes(lire(f));
      const brut = [...propre.matchAll(CHAINE)].filter((m) => TIRET.test(m[1] ?? m[2] ?? m[3] ?? ""));
      const net = [...sansAppelsTechniques(propre).matchAll(CHAINE)].filter((m) =>
        TIRET.test(m[1] ?? m[2] ?? m[3] ?? ""),
      );
      return brut.length > net.length;
    });
    expect(avecAppels.length, "aucun journal ne porte de tiret : le nettoyage ne sert plus").toBeGreaterThan(5);
    for (const f of avecAppels) {
      expect(/\b(?:console\.\w+|throw new \w*Error)\s*\(/.test(lire(f)), `${f} sans appel technique`).toBe(true);
    }
  });
});
