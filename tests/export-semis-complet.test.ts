import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { TABLES_EXPORTEES } from "@/lib/domain/inventaire-export";
import { INVENTAIRE_EFFACEMENT } from "@/lib/domain/inventaire-effacement";
import { TABLES_SEMEES } from "./_semis";

/**
 * export-semis-complet.test.ts — UNE TABLE DÉCLARÉE MAIS JAMAIS SEMÉE (2026-09-04).
 *
 * ══ CE QUE CE FICHIER EXISTE POUR RENDRE IMPOSSIBLE ═════════════════════════════════════════════
 *
 * `reservation_quota_ia` (0083) et `ouverture_jour_anam` (0084) ont été correctement déclarées dans
 * l'inventaire d'export ET correctement servies par la RPC. Personne ne les a ajoutées au SEMIS.
 *
 * Résultat : leurs deux sections sortaient VIDES de tout export, et les deux gardes SQL rougissaient
 * — mais sur un SYMPTÔME (« sections vides alors qu'elles ont été semées ») dont la cause tenait
 * dans un fichier que personne ne relisait. Ces deux rouges ont vécu six commits, et à force d'être
 * là ils ont cessé d'être lus : c'est le vrai coût d'un test qui échoue pour une raison qu'on croit
 * connaître.
 *
 * ══ POURQUOI IL FAUT UNE DÉCLARATION, ET PAS UN BALAYAGE ════════════════════════════════════════
 *
 * On ne peut PAS déduire du code ce que le semis remplit : deux de ces tables s'écrivent par une
 * RPC, et aucune analyse ne saurait relier `reserver_quota_ia_atomique` à `reservation_quota_ia`.
 * D'où `TABLES_SEMEES`, déclarée dans `_semis.ts` — et d'où, aussi, la garde d'honnêteté ci-dessous :
 * une déclaration qu'on ne vérifie pas est une seconde chose à oublier.
 *
 * ══ ET LA SECONDE MOITIÉ : UNE TABLE QU'AUCUN RÔLE NE PEUT RELIRE ══════════════════════════════
 *
 * `effacement-sql.test.ts` prouve l'article 17 en RELISANT les trente-six tables après un effacement.
 * Une table qui refuse la lecture à `service_role` n'est pas une table protégée : c'est une table
 * dont personne ne peut démontrer qu'elle a été vidée. 0084 en avait fabriqué une sans le vouloir.
 */

const RACINE = process.cwd();
const SEMIS = readFileSync(resolve(RACINE, "tests/_semis.ts"), "utf-8");

const TABLES_EFFACEES = INVENTAIRE_EFFACEMENT.filter((e) => e.verdict === "efface").map((e) => e.table);

/** Le corpus SQL, commentaires retirés — un `--` peut désactiver un `grant`. */
function sqlSansCommentaires(): string {
  const dossier = resolve(RACINE, "supabase/migrations");
  return readdirSync(dossier)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(resolve(dossier, f), "utf-8"))
    .join("\n")
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n");
}

const SQL = sqlSansCommentaires();

describe("[LE CŒUR] tout ce qui s’exporte ou s’efface est SEMÉ", () => {
  it("[CONTRÔLE DU CONTRÔLE] les trois listes sont peuplées", () => {
    // Sans ce témoin, les inclusions ci-dessous seraient vraies de trois listes vides.
    expect(TABLES_SEMEES.length).toBeGreaterThan(30);
    expect(TABLES_EXPORTEES.length).toBeGreaterThan(20);
    expect(TABLES_EFFACEES.length).toBeGreaterThan(20);
  });

  it("[LE CŒUR] chaque table INCLUSE à l’export est semée", () => {
    // ⚠️ MUTATION-CIBLE : déclarer une table « incluse » sans l'ajouter au semis. Sa section sort
    // vide de tous les exports, et la seule chose qui rougit est un test SQL dont le message parle
    // de « sections vides » — pas de semis. C'est exactement ce qui est arrivé.
    const oubliees = TABLES_EXPORTEES.filter((t) => !TABLES_SEMEES.includes(t));
    expect(oubliees, `déclarées à l’export mais jamais semées : ${oubliees.join(", ")}`).toEqual([]);
  });

  it("[LE CŒUR] chaque table EFFACÉE est semée — sinon la preuve porte sur du vide", () => {
    // « Son identifiant n'apparaît nulle part » est aussi vrai d'une table qu'on n'a jamais remplie.
    const oubliees = TABLES_EFFACEES.filter((t) => !TABLES_SEMEES.includes(t));
    expect(oubliees, `effacées mais jamais semées : ${oubliees.join(", ")}`).toEqual([]);
  });

  it("[LE CŒUR] la déclaration ne ment pas : chaque nom paraît vraiment dans le semis", () => {
    // ⚠️ SANS CECI, `TABLES_SEMEES` DEVIENDRAIT UNE COPIE DE L'INVENTAIRE. Il suffirait d'y ajouter
    // le nom d'une table qu'on n'a pas semée pour que les deux gardes ci-dessus repassent au vert :
    // la déclaration se contenterait de répéter la question au lieu d'y répondre.
    const fantomes = TABLES_SEMEES.filter(
      (t) => !new RegExp(`["'\`]${t}["'\`]`).test(SEMIS.replace(/TABLES_SEMEES[\s\S]*?\]\);/, "")),
    );
    expect(fantomes, `déclarées semées mais absentes du semis : ${fantomes.join(", ")}`).toEqual([]);
  });

  it("aucune table n’est semée pour rien", () => {
    // Une ligne semée dans une table ni exportée ni effacée n'aide aucune garde, et laisse croire
    // qu'elle est couverte. Les deux inventaires sont la seule raison de semer.
    const inutiles = TABLES_SEMEES.filter(
      (t) => !TABLES_EXPORTEES.includes(t) && !TABLES_EFFACEES.includes(t),
    );
    expect(inutiles, `semées sans être ni exportées ni effacées : ${inutiles.join(", ")}`).toEqual([]);
  });
});

describe("[LE CŒUR] aucune table n’échappe à la preuve d’effacement", () => {
  /** Les tables qui retirent tout à `service_role`. */
  function revoqueesAuServeur(): string[] {
    return [
      ...new Set(
        [...SQL.matchAll(/revoke\s+all\s+on\s+table\s+(?:public\.)?"?(\w+)"?\s+from\s+([^;]*);/gi)]
          .filter((m) => m[2].includes("service_role"))
          .map((m) => m[1]),
      ),
    ];
  }

  /** Celles qui lui rendent la lecture. */
  function relisiblesParLeServeur(): string[] {
    return [
      ...new Set(
        [...SQL.matchAll(/grant\s+select[^;]*?on\s+table\s+(?:public\.)?"?(\w+)"?\s+to\s+([^;]*);/gi)]
          .filter((m) => m[2].includes("service_role"))
          .map((m) => m[1]),
      ),
    ];
  }

  it("[CONTRÔLE DU CONTRÔLE] les deux extracteurs voient bien quelque chose", () => {
    // ⚠️ `rls-catalogue.test.ts` a payé cette leçon : un extracteur aveugle est VERT. Les deux
    // motifs doivent trouver les tables qu'on sait présentes, sinon la garde suivante ne prouve rien.
    expect(revoqueesAuServeur()).toContain("ouverture_jour_anam");
    expect(revoqueesAuServeur()).toContain("reservation_quota_ia");
    expect(relisiblesParLeServeur()).toContain("reservation_quota_ia");
  });

  it("[LE CŒUR] une table qui retire la lecture au serveur la lui REND", () => {
    // ⚠️ MUTATION-CIBLE : `revoke all … from service_role` sans `grant select` derrière — la faute
    // exacte de 0084. Le produit continue de marcher (les RPC `security definer` lisent tout), et
    // seule la PREUVE tombe : le balayage de `effacement-sql.test.ts` échoue sur
    // « permission denied », c'est-à-dire qu'on ne peut plus démontrer que la table a été vidée.
    const muettes = revoqueesAuServeur().filter((t) => !relisiblesParLeServeur().includes(t));
    expect(
      muettes,
      `tables irrelisables : la preuve d’effacement ne peut pas les balayer — ${muettes.join(", ")}`,
    ).toEqual([]);
  });

  it("[LE BORD] rendre la LECTURE ne rend pas l’écriture", () => {
    // Le correctif de 0090 doit rester un `grant select`. Un `grant all`, ou un `insert`, ouvrirait
    // le second chemin d'écriture non sérialisé que les verrous consultatifs de 0083 et 0084
    // existent pour empêcher — et il passerait la garde ci-dessus sans qu'on le remarque.
    for (const table of revoqueesAuServeur()) {
      const larges = [
        ...SQL.matchAll(
          new RegExp(`grant\\s+([^;]*?)\\s+on\\s+table\\s+(?:public\\.)?"?${table}"?\\s+to\\s+([^;]*);`, "gi"),
        ),
      ].filter((m) => m[2].includes("service_role") && /\b(all|insert|update|delete)\b/i.test(m[1]));
      expect(larges.map((m) => m[0]), `${table} rend plus que la lecture au serveur`).toEqual([]);
    }
  });
});
