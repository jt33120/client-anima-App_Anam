import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * couleurs-tokenisees.test.ts — AUCUNE COULEUR ÉCRITE À LA MAIN DANS LES FEUILLES DU MONDE (E5-S2).
 *
 * ══ CE QUI ÉTAIT EN JEU ═════════════════════════════════════════════════════════════════════════
 *
 * Le 2026-09-01, la nuit est passée de l'indigo au navy « Soft Balance » (E5-S1) : `--fond`,
 * `--accent`, `--lueur` ont changé de valeur dans `app/styles/tokens.ts`, et la parité a suivi.
 * Mais quatre feuilles portaient des couleurs RECOPIÉES À LA MAIN, hors de tout jeton : le halo du
 * ciel (`#1a1640`), le cœur de la voie lactée (`#b9c8ee`), la lune (`rgba(205, 228, 248, .5)`,
 * `rgba(143, 193, 239, .14)`), le lavis de survol des portes (`rgba(143, 193, 239, .06)`, trois
 * fois), le voile du tour guidé (`rgba(6, 5, 18, .82)`) et le menu déroulant des réglages
 * (`#1b1836` sur `#ffffff`). Chacune était une copie d'un jeton d'AVANT : quand le jeton a bougé,
 * la copie est restée — un halo indigo sur une nuit navy, une lune bleu-glacier sous un accent
 * Sky. Aucune garde ne le voyait : `tests/tokens-parite.test.ts` compare tokens.ts et globals.css,
 * jamais ce que les modules en font.
 *
 * ══ CE QUE CETTE GARDE FAIT — ET NE FAIT PAS ════════════════════════════════════════════════════
 *
 * Elle lit la SOURCE des quatre feuilles et refuse tout `#…` et tout `rgb()/rgba()/hsl()/hsla()`
 * hors de deux endroits nommés : les commentaires (une prose qui NOMME l'interdit ne doit pas
 * déclencher la garde — c'est la règle de tout `tests/_absence.ts`) et les URI `data:` (le grain
 * est un SVG encodé, dont le `#` est un fragment d'URL, pas une teinte). Elle ne juge PAS la
 * couleur composée à l'écran — c'est le travail d'`e2e/` et de `tests/contraste.test.ts` — et ne
 * couvre QUE ces quatre feuilles : les autres modules ont chacun leur garde (`aide-route`,
 * `conversation-detresse`) ou n'en ont pas encore.
 *
 * Et elle exige que le jeton `--nebuleuse` soit CONSOMMÉ par le ciel : c'est le seul endroit du
 * produit où il a le droit d'exister (décor, 1,13:1, jamais sous du texte). Un jeton déclaré dans
 * tokens.ts, gardé par la parité et lu par personne serait vert partout — et mort.
 *
 * ══ ANTI-VACUITÉ ════════════════════════════════════════════════════════════════════════════════
 *
 * Chaque motif est éprouvé sur une couleur PLANTÉE (une garde qui ne rougit sur rien ne prouve
 * rien), les exemptions sont éprouvées pour ce qu'elles exemptent ET pour ce qu'elles n'exemptent
 * pas, et le balayage est vérifié fichier par fichier : chaque feuille est lue, non vide, et une
 * couleur ajoutée à sa fin est attrapée AVEC son numéro de ligne.
 *
 * ⚠️ MUTATIONS ÉPROUVÉES ET REVERSÉES (2026-09-02) : `#1a1640` remis dans le halo → rouge
 * (« render/monde.module.css L69 #1a1640 », trois tests) ; `var(--nebuleuse)` remplacé par
 * `var(--surface-elevee)` dans le halo → rouge (jeton mort, un test) ; `rgba(6, 5, 18, 0.82)` remis
 * dans `.volet` → rouge (« render/guide/guide.module.css L39 rgba( », deux tests).
 */

const RACINE = process.cwd();
const lire = (p: string) => readFileSync(resolve(RACINE, p), "utf-8");

/** Les quatre feuilles de la story. Une liste NOMMÉE, pas un balayage : chaque entrée est un choix. */
const FEUILLES = [
  "render/monde.module.css",
  "render/guide/guide.module.css",
  "render/reperes/reperes.module.css",
  "render/reglages/reglages.module.css",
] as const;

/**
 * Le CODE seul : commentaires et URI `data:` effacés — REMPLACÉS PAR DES BLANCS, jamais retirés,
 * pour que les numéros de ligne rapportés restent ceux du fichier qu'on ouvrira pour corriger.
 */
function codeSeul(css: string): string {
  const blanchir = (s: string) => s.replace(/[^\n]/g, " ");
  return css
    .replace(/\/\*[\s\S]*?\*\//g, blanchir)
    .replace(/url\(\s*"data:[^"]*"\s*\)/g, blanchir)
    .replace(/url\(\s*'data:[^']*'\s*\)/g, blanchir)
    .replace(/url\(\s*data:[^)]*\)/g, blanchir);
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FONCTION = /\b(?:rgb|hsl)a?\(/gi;

/** Chaque couleur brute du code, avec sa ligne : « L48 #1a1640 ». */
function couleursBrutes(css: string): string[] {
  const trouvees: string[] = [];
  codeSeul(css)
    .split("\n")
    .forEach((ligne, i) => {
      for (const m of ligne.matchAll(HEX)) trouvees.push(`L${i + 1} ${m[0]}`);
      for (const m of ligne.matchAll(FONCTION)) trouvees.push(`L${i + 1} ${m[0]}`);
    });
  return trouvees;
}

/** Le corps d'un bloc `sélecteur { … }` sans accolade imbriquée, dans le code seul. */
function bloc(code: string, selecteur: string): string {
  const motif = new RegExp(`(?:^|\\n)${selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`);
  const m = motif.exec(code);
  expect(m, `bloc \`${selecteur}\` introuvable`).not.toBeNull();
  return m![1];
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LE BALAYAGE — quatre feuilles, aucune couleur brute
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[E5-S2] aucune couleur écrite à la main dans les feuilles du monde", () => {
  it("[LE CŒUR] ni `#…` ni `rgb()/hsl()` hors commentaires et URI data: dans les quatre feuilles", () => {
    // ⚠️ MUTATION-CIBLE : remettre `#1a1640` dans le halo de `.monde`, ou `rgba(6, 5, 18, 0.82)`
    // dans `.volet` du tour guidé. Éprouvé rouge le 2026-09-02, puis reversé.
    const fautives = FEUILLES.flatMap((f) => couleursBrutes(lire(f)).map((c) => `${f} ${c}`));
    expect(fautives, `couleurs brutes :\n${fautives.join("\n")}`).toEqual([]);
  });

  it("aucun mot-clé de couleur non plus — `black` n'est toléré QUE dans un masque, où il est un alpha", () => {
    // Le `#000` des masques de dissolution est devenu `black`. Ce n'est pas une couleur : un masque
    // ne lit que l'alpha de son dégradé, et n'importe quelle teinte opaque y ferait pareil. Mais
    // le même mot-clé posé sur un `background` serait une couleur en dur qui contourne la garde
    // ci-dessus. On retire donc les déclarations de masque, et il ne doit RIEN rester.
    const MOTS = /(?<=[\s:,(])(black|white|gr[ae]y|red|blue|navy|purple|violet|indigo|silver|ivory|beige)(?=[\s;,)])/g;
    const fautives: string[] = [];
    for (const f of FEUILLES) {
      const sansMasques = codeSeul(lire(f)).replace(/(?:-webkit-)?mask-image:[^;]*;/g, " ");
      for (const m of sansMasques.matchAll(MOTS)) fautives.push(`${f} ${m[0]}`);
    }
    expect(fautives, `mots-clés de couleur hors masque :\n${fautives.join("\n")}`).toEqual([]);
  });

  it("et les masques emploient bien `black`, pas `#000` : un alpha dit son nom", () => {
    const monde = codeSeul(lire("render/monde.module.css"));
    const masques = [...monde.matchAll(/(?:-webkit-)?mask-image:[^;]*;/g)].map((m) => m[0]);
    expect(masques.length, "plus aucun masque de dissolution dans le monde").toBeGreaterThanOrEqual(2);
    for (const masque of masques) expect(masque).toMatch(/\bblack\b/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LE CIEL — la nébuleuse tokenisée, statique, et éteinte en contraste renforcé
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[E5-S2] le ciel consomme `--nebuleuse` : le jeton n'est pas mort", () => {
  const monde = codeSeul(lire("render/monde.module.css"));
  const ciel = bloc(monde, ".monde");
  const fond = /background:\s*([^;]+);/.exec(ciel)?.[1] ?? "";

  it("[LE CŒUR] le halo mêle la nébuleuse au fond, et la couche nébuleuse est un radial de `--nebuleuse`", () => {
    // ⚠️ MUTATION-CIBLE : remplacer `var(--nebuleuse)` par `var(--surface-elevee)` dans le halo.
    // La parité resterait verte (le jeton existe), le contraste aussi (il est exempté) : seule
    // cette garde dirait que plus rien ne le lit. Éprouvé rouge le 2026-09-02, puis reversé.
    expect(fond, "le halo n'est plus `nebuleuse` 55 % mêlée au fond").toContain(
      "color-mix(in srgb, var(--nebuleuse) 55%, var(--fond))",
    );
    const couches = fond.split(/,\s*(?=radial-gradient|linear-gradient|var\(--fond\)\s*$)/).map((c) => c.trim());
    const nebuleuses = couches.filter((c) => c.includes("var(--nebuleuse)"));
    expect(nebuleuses.length, "halo ET couche nébuleuse : deux couches lisent le jeton").toBe(2);
    for (const c of nebuleuses) expect(c, "la nébuleuse est un radial").toMatch(/^radial-gradient\(/);
  });

  it("le souffle froid est l'accent à 14 %, et l'aplat reste `--fond`", () => {
    expect(fond).toContain("color-mix(in srgb, var(--accent) 14%, transparent)");
    expect(fond.trim(), "la dernière couche est l'aplat `--fond` : la charte l'exige").toMatch(/,\s*var\(--fond\)$/);
  });

  it("des couches STATIQUES : ni animation, ni blend, ni filtre sur `.monde`", () => {
    // Les invariants de tête de `monde.module.css` : le fondu de région est la seule grammaire de
    // mouvement, la respiration le seul mouvement en boucle. Une nébuleuse qui dériverait, ou un
    // `mix-blend-mode` plein écran, serait exactement le mode d'échec mesuré à 4 im/s le 2026-08-20.
    for (const interdit of ["animation", "transition", "mix-blend-mode", "backdrop-filter", "filter"]) {
      expect(ciel, `\`${interdit}\` sur le ciel`).not.toMatch(new RegExp(`(?:^|[\\s;])${interdit}\\s*:`));
    }
  });

  it("en contraste renforcé, le ciel redevient l'aplat : la nébuleuse (Beige en clair) ne survit pas", () => {
    // `--nebuleuse` vaut le Beige `#E0D2C7` en mode clair — sur Ivory, la nuance deviendrait une
    // tache derrière le texte. Les deux déclencheurs (attribut ET media query) doivent l'éteindre.
    const attribut = bloc(monde, ':global(:root[data-a11y="contraste"]) .monde');
    expect(attribut.trim()).toBe("background: var(--fond);");
    const media = /@media \(prefers-contrast: more\) \{([\s\S]*?)\n\}/.exec(monde)?.[1] ?? "";
    expect(media, "plus de bloc `prefers-contrast: more`").not.toBe("");
    const mondeMedia = /\.monde\s*\{([^}]*)\}/.exec(media)?.[1];
    expect(mondeMedia, "`.monde` a disparu du bloc `prefers-contrast`").toBeDefined();
    expect(mondeMedia!.trim()).toBe("background: var(--fond);");
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// ANTI-VACUITÉ — la garde attrape ce qu'on plante, exempte ce qu'elle dit, lit ce qu'elle nomme
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[E5-S2] anti-vacuité : la garde mord, et sur les bons fichiers", () => {
  it("une couleur plantée est attrapée, sous chacune de ses formes, avec sa ligne", () => {
    expect(couleursBrutes(".x {\n  color: #ff0000;\n}")).toEqual(["L2 #ff0000"]);
    expect(couleursBrutes(".x { color: #fff }")).toEqual(["L1 #fff"]);
    expect(couleursBrutes(".x { background: rgba(6, 5, 18, 0.82) }")).toEqual(["L1 rgba("]);
    expect(couleursBrutes(".x { background: rgb(6 5 18) }")).toEqual(["L1 rgb("]);
    expect(couleursBrutes(".x { color: hsl(240 30% 20%) }")).toEqual(["L1 hsl("]);
    expect(couleursBrutes(".x { color: HSLA(240, 30%, 20%, .5) }")).toEqual(["L1 HSLA("]);
  });

  it("les exemptions sont exactement celles annoncées : un commentaire, une URI data: — rien d'autre", () => {
    // Un commentaire qui NOMME l'interdit ne déclenche rien…
    expect(couleursBrutes("/* le halo portait #1a1640 et rgba(1,2,3,.4) */\n.x { color: var(--texte) }")).toEqual([]);
    // …et pas davantage l'URI du grain, même quand elle contient un `#` brut ET une parenthèse fermante.
    expect(
      couleursBrutes(`.g { background-image: url("data:image/svg+xml,%3Csvg fill='#fff' filter='url(%23n)'/%3E"); }`),
    ).toEqual([]);
    expect(couleursBrutes(".g { background-image: url('data:image/png;base64,#abc') }")).toEqual([]);
    // Mais une couleur APRÈS le commentaire, ou APRÈS l'URI, sur la même ligne, reste vue.
    expect(couleursBrutes("/* prose */ .x { color: #abc }")).toEqual(["L1 #abc"]);
    expect(couleursBrutes(`.g { background: url("data:image/png;base64,AAAA") #123456; }`)).toEqual(["L1 #123456"]);
    // Et blanchir ne décale pas les lignes : la couleur plantée après un commentaire de trois
    // lignes est rapportée à SA ligne, pas trois plus haut.
    expect(couleursBrutes("/* un\n   commentaire\n   long */\n.x { color: #abc }")).toEqual(["L4 #abc"]);
  });

  it("chaque feuille nommée est lue, non vide, tokenisée — et une couleur ajoutée à sa fin est attrapée", () => {
    // Le balayage ne peut pas passer « en ne mesurant rien » : quatre chemins, quatre lectures,
    // et pour chacune la preuve que la chaîne complète (lecture → blanchiment → motifs) mord.
    expect(FEUILLES.length).toBe(4);
    for (const f of FEUILLES) {
      const css = lire(f);
      expect(css.length, `${f} est vide`).toBeGreaterThan(200);
      expect(css, `${f} ne consomme aucun jeton`).toMatch(/var\(--/);
      const lignes = css.split("\n").length;
      expect(couleursBrutes(`${css}\n.mutant { color: #f00; }`), `la mutation de fin de ${f} n'est pas vue`).toEqual([
        `L${lignes + 1} #f00`,
      ]);
    }
  });

  it("`bloc()` refuse un sélecteur absent plutôt que de mesurer une chaîne vide", () => {
    expect(() => bloc(".a { x: 1 }", ".inexistant")).toThrow();
  });
});
