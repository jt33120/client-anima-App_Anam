import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PARTIE_MAX, PARTIE_MIN } from "@/lib/domain/verdict-horoscope";

/**
 * LE CACHE DU TEXTE DU JOUR, PAR PERSONNE (0094, 2026-09-07).
 *
 * ⚠️ CE FICHIER EXISTE PARCE QUE `tests/texte-du-jour-sql.test.ts` EST ÉPINGLÉ SUR 0091. Il lit ce
 * fichier-là et lui seul : une table NEUVE, avec des propriétés inverses, l'aurait laissé vert sans
 * être éprouvée du tout. Une garde qui ne regarde pas la chose qu'on vient d'écrire est pire qu'une
 * garde absente — elle donne le sentiment d'être couvert.
 */

const SQL = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0094_texte_du_jour_personnel.sql"),
  "utf8",
);

const CORRECTION = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0096_oublier_texte_du_jour_quand_le_theme_change.sql"),
  "utf8",
);

const EXPORT = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0095_exporter_texte_du_jour_personnel.sql"),
  "utf8",
);

/**
 * Le SQL sans ses commentaires.
 *
 * ⚠️ INDISPENSABLE POUR TOUT REFUS (`not.toMatch`), et pas seulement par propreté : les migrations
 * de ce dépôt EXPLIQUENT leurs décisions, donc elles NOMMENT ce qu'elles ont choisi de ne pas faire.
 * Un refus mesuré sur le fichier brut rougirait sur la phrase qui dit pourquoi la chose n'est pas
 * là. Et dans l'autre sens, un `--` peut désactiver une ligne : c'est le même nettoyage qui protège
 * des deux erreurs.
 */
const sansCommentaires = (sql: string) =>
  sql
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n");

const corpsTable =
  SQL.match(/create table public\.texte_du_jour_personnel \(([\s\S]*?)\n\);/)?.[1] ?? "";

describe("[LE CŒUR] la table est PAR PERSONNE, et elle s’efface avec elle", () => {
  it("[CONTRÔLE DU CONTRÔLE] le corps de la table a bien été extrait", () => {
    // Sans ce témoin, tous les refus ci-dessous seraient vrais d'une chaîne vide — le mode d'échec
    // exact d'une garde dont l'extracteur casse.
    expect(corpsTable.length).toBeGreaterThan(400);
    expect(corpsTable).toContain("provenance");
  });

  it("porte l’identité dans sa clé, à l’inverse de sa sœur partagée", () => {
    expect(corpsTable).toContain("primary key (utilisatrice_id, jour, version_editoriale)");
  });

  it("[LE CŒUR] pend à `public.utilisatrice` en cascade, jamais à `auth.users`", () => {
    // ⚠️ MUTATION-CIBLE : l'accrocher à `auth.users`. Les deux moteurs d'effacement retirent
    // branche → utilisatrice → auth.users et tiennent pour vrai qu'`utilisatrice` emporte le reste :
    // une table accrochée ailleurs survivrait à tout effacement qui ne touche pas l'auth.
    expect(corpsTable).toMatch(
      /utilisatrice_id uuid not null references public\.utilisatrice\(id\) on delete cascade/,
    );
    expect(sansCommentaires(SQL)).not.toMatch(/references\s+auth\.users/);
  });

  it("n’ouvre ni lecture ni écriture aux sessions applicatives", () => {
    expect(SQL).toMatch(/force row level security/);
    expect(SQL).toMatch(
      /revoke all on table public\.texte_du_jour_personnel from public, anon, authenticated, service_role/,
    );
    // ⚠️ AUCUNE POLICY, DONC DENY-ALL POUR TOUT LE MONDE. La règle du dépôt — « la garde d'écriture
    // vit dans le `with check` de la policy » — vise les tables que `authenticated` peut écrire. Ici
    // il ne peut rien : il n'y a pas de serrure à poser sur une porte murée. LE JOUR OÙ UNE POLICY
    // S'OUVRIRA ICI, LA GARDE D'ÉCRITURE DEVRA NAÎTRE AVEC ELLE.
    expect(sansCommentaires(SQL)).not.toMatch(/create policy/i);
    expect(sansCommentaires(SQL)).not.toMatch(/to authenticated/);
  });
});

describe("[LE CŒUR] la forme des trois parties est tenue par la base, pas par l’applicatif", () => {
  it("exige les trois parties ensemble, ou aucune", () => {
    // ⚠️ MUTATION-CIBLE : autoriser une ligne à moitié pleine. La carte afficherait un intitulé
    // suivi de rien, et rien dans le code applicatif ne l'aurait vu venir.
    expect(corpsTable).toMatch(
      /provenance = 'modele' and ciel is not null and pour_toi is not null and gestes is not null/,
    );
    expect(corpsTable).toMatch(
      /provenance = 'corpus' and ciel is null and pour_toi is null and gestes is null/,
    );
  });

  it("[LE CŒUR] les bornes SQL et celles du verdict sont les MÊMES, à la valeur près", () => {
    // ⚠️ DEUX NOMBRES POUR UNE SEULE RÈGLE FINISSENT TOUJOURS PAR DIVERGER. Le jour où l'on
    // desserre `PARTIE_MAX` dans le domaine sans toucher au SQL, la base refusera un texte que le
    // verdict vient d'accepter — et le chemin d'échec sera « cache indisponible », c'est-à-dire un
    // message qui ne dit rien de la vraie cause. Cette ligne lie les deux.
    for (const colonne of ["ciel", "pour_toi", "gestes"]) {
      expect(
        corpsTable,
        `la borne SQL de « ${colonne} » ne suit plus PARTIE_MIN/PARTIE_MAX`,
      ).toContain(`char_length(${colonne}) between ${PARTIE_MIN} and ${PARTIE_MAX}`);
    }
  });

  it("fige le premier contenu servi, sans mise à jour destructive", () => {
    expect(SQL).toMatch(/insert into public\.texte_du_jour_personnel[\s\S]*on conflict do nothing;/);
    expect(sansCommentaires(SQL)).not.toMatch(/on conflict[\s\S]{0,120}do update/i);
    expect(SQL).toMatch(/expire_le > now\(\)/);
  });

  it("refuse d’écrire sans identité", () => {
    expect(SQL).toMatch(/texte_du_jour_sans_identite/);
  });

  it("donne à l’ordonnanceur une purge physique des lignes expirées", () => {
    expect(SQL).toMatch(/create or replace function public\.purger_textes_du_jour_personnels_expires\(\)/);
    expect(SQL).toMatch(/delete from public\.texte_du_jour_personnel where expire_le <= now\(\)/);
    expect(SQL).toMatch(
      /grant execute on function public\.purger_textes_du_jour_personnels_expires\(\) to service_role/,
    );
  });
});

describe("[LE CŒUR] un thème qui change emporte le texte qui en découle", () => {
  it("un trigger, ancré sur l’empreinte d’entrées, supprime le texte périmé", () => {
    // ⚠️ CE DÉFAUT EST RÉEL ET IL SE LIT : depuis que le texte NOMME le socle natal, la personne qui
    // rectifie sa date de naissance continuerait de lire pendant deux jours un texte qui affirme
    // l'ancien signe. Elle a corrigé, le produit a dit « c'est fait », et il répète la version
    // fausse. Ce n'est pas de la fraîcheur de cache, c'est une affirmation d'identité.
    expect(CORRECTION).toMatch(
      /after update of empreinte_entrees on public\.theme_natal/,
    );
    expect(CORRECTION).toMatch(/old\.empreinte_entrees is distinct from new\.empreinte_entrees/);
    expect(CORRECTION).toMatch(
      /delete from public\.texte_du_jour_personnel where utilisatrice_id = new\.utilisatrice_id/,
    );
  });

  it("[LE CŒUR] le trigger est posé sur le FAIT, pas sur le chemin de rectification", () => {
    // ⚠️ MUTATION-CIBLE : mettre le `delete` dans `corriger_donnees_naissance`. Ce serait couvrir le
    // chemin auquel on pense et laisser ouvert celui que tout le monde emprunte — ajouter son heure
    // de naissance recalcule le thème SANS passer par cette RPC.
    expect(sansCommentaires(CORRECTION)).not.toMatch(/corriger_donnees_naissance/);
  });
});

describe("[art. 15] le texte écrit sur elle lui est rendu", () => {
  it("l’export sert la table, bornée à elle", () => {
    expect(EXPORT).toMatch(
      /'texte_du_jour_personnel',[\s\S]{0,200}from public\.texte_du_jour_personnel t where t\.utilisatrice_id = v_uid/,
    );
  });

  it("[ANTI-VACUITÉ] le corps de l’export est REPARTI de 0093, pas réécrit à moitié", () => {
    // `create or replace` remplace le corps ENTIER : n'en réécrire qu'un morceau supprimerait en
    // silence les vingt-neuf autres sections. Le compte de sections est la façon la moins chère de
    // le voir.
    const sections = EXPORT.match(/^\s*'[a-z_]+', \(select coalesce/gm) ?? [];
    expect(sections.length).toBeGreaterThan(28);
  });
});
