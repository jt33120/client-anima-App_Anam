import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ITEMS_BIG_FIVE } from "@/lib/domain/big-five-items";
import { FACTEURS } from "@/lib/domain/big-five";
import { INVENTAIRE_EFFACEMENT } from "@/lib/domain/inventaire-effacement";
import { INVENTAIRE_EXPORT } from "@/lib/domain/inventaire-export";

/**
 * big-five-sql.test.ts — LA MIGRATION 0088, LUE PLUTÔT QU'EXÉCUTÉE (2026-09-03).
 *
 * ══ CE QUE CE FICHIER EXISTE POUR ATTRAPER : LE MIROIR QUI DÉRIVE ═══════════════════════════════
 *
 * `reponses_big_five_valides` porte un motif de clés, `^b(0[1-9]|1[0-9]|20)$`, qui est un MIROIR de
 * `lib/domain/big-five-items.ts`. La base ne lit pas le TypeScript : cette duplication est
 * inévitable, et 0049 l'avait déjà assumée pour l'ennéagramme.
 *
 * Ce qui n'est PAS inévitable, c'est qu'elle dérive en silence. Ajouter un vingt-et-unième énoncé,
 * ou renommer `b07`, laisserait tous les tests verts et ferait échouer l'écriture EN PRODUCTION,
 * avec un 23514 que personne ne relie à un identifiant d'item. La garde compare donc les vingt
 * identifiants réels au motif SQL, un par un.
 *
 * ══ ET LE JUMEAU EXÉCUTÉ N'EST PAS LÀ, DÉLIBÉRÉMENT ════════════════════════════════════════════
 *
 * `tests/enneagramme-sql.test.ts` éprouve son équivalent contre une VRAIE base, et c'est mieux. Mais
 * une garde statique attrape une chose qu'aucun test comportemental ne voit : un motif écrit dans la
 * migration et jamais atteint par un cas de test. Les deux ne se remplacent pas — celle-ci tourne
 * partout, y compris là où aucune base n'est disponible.
 */

const RACINE = process.cwd();
const MIGRATION = readFileSync(resolve(RACINE, "supabase/migrations/0088_big_five.sql"), "utf-8");
const EXPORT_SQL = readFileSync(
  resolve(RACINE, "supabase/migrations/0089_exporter_big_five.sql"),
  "utf-8",
);

/** Le motif de clés extrait du SQL, tel quel — jamais recopié à la main dans ce fichier. */
function motifDesCles(): RegExp {
  const m = /e\.cle\s+!~\s+'\^([^']+)\$'/.exec(MIGRATION);
  expect(m, "le motif de clés est introuvable dans 0088 : l’extracteur est cassé").not.toBeNull();
  return new RegExp(`^${m![1]}$`);
}

describe("[LE CŒUR] le motif SQL et les vingt énoncés ne peuvent plus diverger", () => {
  it("[CONTRÔLE DU CONTRÔLE] le motif est bien extrait, et il refuse quelque chose", () => {
    // Un extracteur aveugle rendrait `/^$/`, qui refuserait tout et rendrait la garde suivante
    // fausse pour la bonne raison. On éprouve donc l'extracteur lui-même.
    const motif = motifDesCles();
    expect(motif.test("b01")).toBe(true);
    expect(motif.test("b21"), "le motif accepte un vingt-et-unième identifiant").toBe(false);
    expect(motif.test("b0"), "le motif accepte une forme tronquée").toBe(false);
    expect(motif.test("e1a"), "le motif accepte les clés de l’ennéagramme").toBe(false);
  });

  it("[LE CŒUR] chacun des vingt identifiants réels passe le motif SQL", () => {
    const motif = motifDesCles();
    const refuses = ITEMS_BIG_FIVE.filter((i) => !motif.test(i.id)).map((i) => i.id);
    expect(refuses, `identifiants qu’un POST refuserait : ${refuses.join(", ")}`).toEqual([]);
  });

  it("la borne du nombre de clés couvre exactement les énoncés déclarés", () => {
    const m = /count\(\*\)\s+from\s+jsonb_object_keys\(p_reponses\)\)\s*<=\s*(\d+)/.exec(MIGRATION);
    expect(m, "la borne du nombre de clés est introuvable").not.toBeNull();
    expect(Number(m![1])).toBe(ITEMS_BIG_FIVE.length);
  });

  it("les quatre niveaux et l’inconnue explicite sont acceptés, et rien d’autre", () => {
    // `null` est une réponse (« Je ne sais pas »), jamais un zéro déguisé : la règle posée par 0087
    // pour l'ennéagramme vaut pour tout questionnaire à fréquence du produit.
    expect(MIGRATION).toContain("jsonb_typeof(e.valeur) <> 'null'");
    expect(MIGRATION).toMatch(/not in \(0, 1, 2, 3\)/);
  });
});

describe("[LE CŒUR] aucun nombre affichable ne se stocke (FR-031)", () => {
  it("le résultat retenu ne porte que des positions, jamais un score", () => {
    // ⚠️ MUTATION-CIBLE : une colonne `score smallint`. Elle suffirait à faire revenir la jauge que
    // FR-031 refuse — un rendu finit toujours par peindre en barre ce que la base lui donne en
    // nombre, et aucune garde de domaine ne verrait la colonne.
    const table = MIGRATION.split("create table public.big_five (")[1].split(");")[0];
    expect(table).toBeTruthy();
    expect(table).not.toMatch(/\b(smallint|integer|numeric|real|double)\b/);
    for (const facteur of FACTEURS) {
      expect(table, `la colonne ${facteur} manque`).toMatch(new RegExp(`\\b${facteur}\\s+text\\b`));
      expect(
        MIGRATION,
        `la colonne ${facteur} n’est pas bornée aux trois positions`,
      ).toMatch(new RegExp(`check \\(${facteur}\\s+in \\('bas', 'median', 'haut'\\)\\)`));
    }
  });

  it("aucune colonne de texte LIBRE : il n’existe pas d’endroit où une prédiction s’écrirait", () => {
    // Les cinq colonnes `text` sont bornées par un `check` juste au-dessus ; ce sont des
    // énumérations, pas de la prose. Le sens vit dans `lib/corpus/big-five.ts` (FR-053, FR-054).
    const table = MIGRATION.split("create table public.big_five (")[1].split(");")[0];
    const colonnesTexte = [...table.matchAll(/^\s+(\w+)\s+text\b/gm)].map((m) => m[1]);
    expect(colonnesTexte.sort()).toEqual([...FACTEURS].sort());
  });
});

describe("[LE BORD] les gardes de 0088 sont celles de 0049, pas d’autres", () => {
  it("les deux tables sont en RLS activée ET forcée", () => {
    for (const table of ["big_five", "big_five_tentative"]) {
      expect(MIGRATION).toContain(`alter table public.${table} enable row level security`);
      expect(MIGRATION).toContain(`alter table public.${table} force  row level security`);
    }
  });

  it("[LE CŒUR] déposer est gaté par le consentement ; retirer ne l’est PAS", () => {
    // ⚠️ LA DISSYMÉTRIE EST LA GARDE, ET ELLE EST CONTRE-INTUITIVE. Gater le retrait sur le
    // consentement le refuserait précisément à celle qui vient de le révoquer — c'est-à-dire à celle
    // qui veut que l'étiquette disparaisse. 0021 et 0049 ont déjà tranché ; on ne le re-débat pas.
    const bloc = (nom: string) => MIGRATION.split(`create policy ${nom} on`)[1].split(";")[0];
    for (const depot of ["big_five_depot", "big_five_correction", "big_five_tentative_depot", "big_five_tentative_revision"]) {
      expect(bloc(depot), `${depot} n’exige pas le consentement`).toContain("a_consenti_art9()");
      expect(bloc(depot), `${depot} n’écarte pas la minorité`).toContain("est_barre_minorite()");
    }
    for (const retrait of ["big_five_retrait", "big_five_tentative_retrait"]) {
      expect(bloc(retrait), `${retrait} est gaté sur le consentement`).not.toContain("a_consenti_art9");
    }
  });

  it("la lecture reste ouverte à la propriétaire quoi qu’il arrive", () => {
    // L'export FR-067 et l'effacement AD-14 en dépendent : un socle qui séquestre ce qu'il a écrit
    // n'est pas un socle.
    const bloc = MIGRATION.split("create policy big_five_lecture on")[1].split(";")[0];
    expect(bloc).toContain("auth.uid() = utilisatrice_id");
    expect(bloc).not.toContain("a_consenti_art9");
  });

  it("`anon` n’a rien, et le trigger d’horodatage n’est exécutable par personne", () => {
    expect(MIGRATION).toContain("revoke all on public.big_five           from anon;");
    expect(MIGRATION).toContain("revoke all on public.big_five_tentative from anon;");
    expect(MIGRATION).toContain(
      "revoke execute on function public.big_five_horodatage() from public, anon, authenticated;",
    );
  });

  it("[LE CŒUR] l’horodatage se pose sur INSERT **et** UPDATE", () => {
    // ⚠️ LE DÉFAUT RÉCURRENT DE CE DÉPÔT (0039→0041, 0021→0046, 0019→0046). Un trigger qui ne garde
    // que l'UPDATE laisse un POST REST direct forger les dates de création.
    const triggers = [...MIGRATION.matchAll(/create trigger (\w+)\s*\nbefore ([a-z ]+) on/g)];
    expect(triggers.length, "aucun trigger trouvé : l’extracteur est cassé").toBe(2);
    for (const [, nom, quand] of triggers) {
      expect(quand.trim(), `${nom} ne couvre pas les deux opérations`).toBe("insert or update");
    }
  });

  it("la RPC ne contourne rien : `security invoker`, et la tentative sort AVANT le dépôt", () => {
    const rpc = MIGRATION.split("create function public.terminer_tentative_big_five(")[1];
    expect(rpc).toContain("security invoker");
    expect(rpc.indexOf("delete from public.big_five_tentative")).toBeLessThan(
      rpc.indexOf("insert into public.big_five"),
    );
    // Une tentative absente ne se conclut pas : sans ce garde-fou, deux onglets concluant en même
    // temps écriraient deux fois, et un POST sans aucune réponse écrirait un résultat.
    expect(rpc).toContain("if v_supprimees = 0 then return false; end if;");
  });
});

describe("[LE BORD] les deux tables sont inscrites partout où une table doit l’être", () => {
  for (const table of ["big_five", "big_five_tentative"]) {
    it(`${table} porte un verdict d’effacement et un verdict d’export`, () => {
      expect(INVENTAIRE_EFFACEMENT.find((e) => e.table === table)?.verdict).toBe("efface");
      expect(INVENTAIRE_EXPORT.find((e) => e.table === table)?.verdict).toBe("inclus");
    });

    it(`${table} est servie par l’export (art. 15), bornée à v_uid`, () => {
      expect(EXPORT_SQL).toContain(`'${table}', (select coalesce(`);
      expect(EXPORT_SQL).toMatch(
        new RegExp(`from public\\.${table} t where t\\.utilisatrice_id = v_uid`),
      );
    });

    it(`${table} disparaît par la cascade de \`utilisatrice\``, () => {
      // L'effacement total (0058) supprime `utilisatrice` et laisse la cascade emporter le reste.
      // Une clé sans `on delete cascade` laisserait la ligne derrière, ou ferait ÉCHOUER
      // l'effacement entier — et `tests/effacement-sql.test.ts` ne le verrait qu'en base réelle.
      const bloc = MIGRATION.split(`create table public.${table} (`)[1].split(");")[0];
      expect(bloc).toContain("references public.utilisatrice(id) on delete cascade");
    });
  }
});
