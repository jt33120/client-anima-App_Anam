import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * arbre-sans-fruit.test.ts — [11.3] « RAYONNEMENT, PAS FRUIT » DEVIENT VRAI DANS LE CODE.
 *
 * ══ CE QUI ÉTAIT LÀ, ET POURQUOI PERSONNE NE LE VOYAIT ══════════════════════════════════════════
 *
 * Le produit a tranché : le troisième état d'une branche est le **RAYONNEMENT** — la branche
 * entière entre en lumière — et non un fruit suspendu (FR-028, DESIGN.md §arbre). La décision est
 * dans la spec depuis des semaines. Le code, lui, savait toujours dessiner une POMME, avec son
 * bourgeon, sa fleur, son pédoncule, ses étoiles de célébration et sept poussières lumineuses.
 *
 * ⚠️ ELLE ÉTAIT INVISIBLE ET VIVANTE. Le décor se rend à `NIVEAU_DECOR = 62`, et tout ce cycle ne
 * s'allume qu'au-delà de `t = 0.78`. Personne ne la voyait — et changer UNE CONSTANTE l'aurait
 * ressuscitée, sans qu'aucune garde ne rougisse. C'est la forme la plus discrète de dette : du code
 * mort qui n'attend qu'un nombre.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");
const sansCommentaires = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function fichiers(dossier: string, extensions: readonly string[]): string[] {
  return (readdirSync(resolve(RACINE, dossier), { recursive: true, encoding: "utf-8" }) as string[])
    .filter((f) => extensions.some((e) => f.endsWith(e)))
    .map((f) => `${dossier}/${f}`);
}

describe("[11.3] aucun code de rendu ne sait plus dessiner un fruit", () => {
  const CORPUS = [...fichiers("render", [".ts", ".tsx", ".css"]), ...fichiers("lib", [".ts"])];

  it("[CONTRÔLE DU CONTRÔLE] le balayage voit un corpus réel", () => {
    expect(CORPUS.length, "le balayage ne regarde rien").toBeGreaterThan(80);
    expect(CORPUS.some((f) => f.includes("arbre-vivant")), "le fichier visé n'est pas balayé").toBe(true);
  });

  it("[LE CŒUR] ni `pomme`, ni `apple`, ni `fruit` dans du code de rendu", () => {
    // ⚠️ COMMENTAIRES RETIRÉS : ce dépôt EXPLIQUE ses suppressions en prose, et une garde qui
    // compte sa propre documentation mesure la documentation. Le commentaire qui dit « la pomme a
    // été retirée » est précisément ce qu'on veut GARDER — il ne doit pas faire rougir la garde.
    const fautifs: string[] = [];
    for (const f of CORPUS) {
      const src = sansCommentaires(lire(f));
      // ⚠️ `-apple-system` EST UNE PILE DE POLICES, PAS UN FRUIT. Une garde de mot qui ne
      // regarde pas ce qu'il y a AVANT rougit sur le gabarit de courriel, dont la pile de polices
      // commence par `-apple-system` sur tous les clients Apple. La pression serait alors
      // d'exempter le fichier entier — et de perdre la garde sur tout ce qu'il contient.
      for (const mot of ["pomme", "apple", "fruit"]) {
        if (new RegExp(`(?<![-\\w])${mot}`, "i").test(src)) fautifs.push(`${f} → « ${mot} »`);
      }
    }
    expect(fautifs, `un fruit est revenu dans le code de rendu :\n${fautifs.join("\n")}`).toEqual([]);
  });

  it("[LE CŒUR] les trois fonctions de dessin du cycle ont disparu", () => {
    // Mutation-cible : réintroduire `drawApple`. La garde de mots ci-dessus l'attrape déjà, mais
    // celle-ci nomme les fonctions — un `dessinerFruitMur` échapperait au mot « apple ».
    const src = sansCommentaires(lire("render/arbre-vivant.tsx"));
    for (const fn of ["drawApple", "drawBud", "drawStar"]) {
      expect(src, `\`${fn}\` est revenue`).not.toContain(fn);
    }
  });

  it("[LA MOITIÉ QUI COMPTE] `drawFlower` est RESTÉE — elle avait deux appelants", () => {
    // ⚠️ CE TEST EXISTE POUR EMPÊCHER LA SUPPRESSION EN BLOC. `drawFlower` servait le cycle du
    // fruit ET les floraisons d'ambiance de la ramure, qui n'ont rien à voir avec un fruit. Une
    // suppression « de tout ce qui touche au fruit » l'aurait emportée, et l'arbre aurait perdu ses
    // fleurs sans que personne ne le demande. Chaque fonction a été tracée appelant par appelant.
    const src = sansCommentaires(lire("render/arbre-vivant.tsx"));
    expect(src, "`drawFlower` a été emportée par la suppression").toContain("drawFlower");
    expect(
      (src.match(/this\.drawFlower\(/g) ?? []).length,
      "l'appelant d'ambiance de `drawFlower` a disparu",
    ).toBe(1);
  });

  it("aucune poussière de célébration ne reste allouée pour rien", () => {
    // Sept `motes` étaient construites à chaque montage de l'arbre pour n'être jamais dessinées :
    // du travail payé à chaque fois, pour un effet supprimé.
    const src = sansCommentaires(lire("render/arbre-vivant.tsx"));
    expect(src).not.toContain("this.motes");
  });
});

describe("[11.3] un seul handoff d'arbre fait foi dans le dépôt", () => {
  const PERIME = "images/assets/design_handoff_arbre_de_vie";
  const QUI_FAIT_FOI = "images/assets/design_handoff_arbre_lunaire";

  it("[CONTRÔLE DU CONTRÔLE] l'asset qui fait foi existe bien", () => {
    // Sans ce témoin, l'avertissement ci-dessous pourrait renvoyer vers un dossier disparu — et on
    // aurait remplacé un mauvais guide par aucun guide.
    expect(existsSync(resolve(RACINE, QUI_FAIT_FOI)), "l'asset lunaire a disparu").toBe(true);
  });

  it("[LE CŒUR] le handoff périmé porte son avertissement en PREMIÈRE ligne", () => {
    // ⚠️ CE DOSSIER PORTE CE QUE FR-031 INTERDIT. Son README décrit un `progress` de 0 à 100, un
    // slider, un bouton play et cinq pastilles de jalon — c'est une BARRE DE PROGRESSION NOTÉE, et
    // l'arbre est un miroir descriptif, jamais une note. Un agent (ou une personne) qui ouvre le
    // premier dossier trouvé porterait tout ça de bonne foi.
    //
    // Il n'est pas supprimé : ses illustrations restent une référence de STYLE. C'est son mode
    // d'emploi qu'il faut désamorcer, et en première ligne — pas au paragraphe douze.
    const readme = resolve(RACINE, PERIME, "README.md");
    if (!existsSync(readme)) return; // supprimé : l'autre issue, tout aussi acceptable.
    const premiere = readFileSync(readme, "utf-8").split("\n").find((l) => l.trim().length > 0) ?? "";
    expect(premiere, "l'avertissement n'est pas en première ligne").toMatch(/PÉRIMÉ/);
    expect(premiere, "il ne dit pas ce qu'il faut porter à la place").toContain("arbre_lunaire");
    expect(premiere, "il ne dit pas POURQUOI — et un interdit sans motif se contourne").toMatch(/FR-031/);
  });
});

describe("[11.3] la décision « rayonnement, pas fruit » est écrite et datée", () => {
  it("elle vit à côté du nom d'état, avec son rattachement à FR-028", () => {
    // Elle ne vivait que dans un commentaire d'une ligne. Un lecteur qui trouve le rendu peint du
    // handoff — qui porte une pomme bleue — doit savoir en UNE ligne pourquoi il ne le reproduit pas.
    const copie = lire("render/arbre/copie-arbre.ts");
    const i = copie.indexOf("FR-028");
    expect(i, "la décision ne cite pas FR-028").toBeGreaterThan(-1);
    expect(copie).toMatch(/rayonnement/i);

    // ⚠️ LA DATE EST CHERCHÉE DANS LE BLOC DE LA DÉCISION, PAS DANS LE FICHIER — un mutant l'a
    // exigé. Ce fichier porte d'autres dates dans d'autres commentaires : chercher « une date
    // quelque part » restait VERT après avoir retiré celle de la décision. Une décision sans date
    // se rediscute, et c'est précisément ce qu'on veut empêcher.
    const bloc = copie.slice(Math.max(0, i - 700), i + 700);
    expect(bloc, "la décision n'est pas datée dans son propre bloc").toMatch(/20\d\d-\d\d-\d\d/);

    // Et elle doit nommer l'asset à ne PAS reproduire : un lecteur qui trouve `reference.png`
    // doit savoir en une ligne pourquoi il ne le porte pas.
    expect(bloc, "le handoff périmé n'est pas nommé").toMatch(/design_handoff_arbre_de_vie|reference\.png/);
  });
});
