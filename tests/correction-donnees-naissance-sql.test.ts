import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const lire = (chemin: string) => readFileSync(resolve(process.cwd(), chemin), "utf8");
const SQL = lire("supabase/migrations/0092_corriger_donnees_naissance.sql");

describe("[RC-E4] correction protégée de date, heure et lieu", () => {
  it("réserve la RPC au serveur et ferme les modifications directes de date et de lieu", () => {
    expect(SQL).toMatch(/date_naissance_correction_protegee/);
    expect(SQL).toMatch(/lieu_naissance_correction_protegee/);
    expect(SQL).toMatch(/revoke all on function public\.corriger_donnees_naissance[\s\S]*from public, anon, authenticated, service_role/);
    expect(SQL).toMatch(/grant execute on function public\.corriger_donnees_naissance[\s\S]*to service_role/);
    expect(SQL).not.toMatch(/grant execute on function public\.corriger_donnees_naissance[\s\S]*to authenticated/);
  });

  it("revalide consentement, barrière de minorité et majorité dans la transaction", () => {
    expect(SQL).toMatch(/from public\.consentement c[\s\S]*c\.revoked_at is null/);
    expect(SQL).toMatch(/u\.mineur_detecte or u\.barriere_minorite_le is not null/);
    expect(SQL).toMatch(/now\(\) at time zone 'Europe\/Paris'/);
    expect(SQL).not.toMatch(/p_date > \(current_date/);
  });

  it("verrouille et compare tout l'ancien paquet avant d'écrire le nouveau", () => {
    expect(SQL).toMatch(/from public\.utilisatrice u where u\.id = v_uid for update/);
    for (const champ of [
      "p_date_attendue",
      "p_heure_attendue",
      "p_lieu_nom_attendu",
      "p_lieu_latitude_attendue",
      "p_lieu_longitude_attendue",
      "p_lieu_fuseau_attendu",
    ]) {
      expect(SQL).toContain(champ);
    }
    expect(SQL).toMatch(/if v_etat_attendu is not true or v_change is not true then/);
  });

  it("met à jour les entrées et regrave le thème propre au profil dans le même bloc", () => {
    const transaction = SQL.match(/begin\n\s+update public\.utilisatrice([\s\S]*?)exception when others/)?.[1] ?? "";
    expect(transaction).toContain("date_naissance = p_date");
    expect(transaction).toContain("heure_naissance = p_heure");
    expect(transaction).toContain("lieu_naissance = p_lieu_nom");
    expect(transaction).toContain("insert into public.theme_natal as t");
    expect(transaction).toContain("empreinte_entrees = excluded.empreinte_entrees");
    expect(transaction).toContain("contenu = excluded.contenu");
    expect(transaction).not.toMatch(/journal|message|branche|texte_du_jour_stable/);
  });

  it("l'audit minimal ne conserve aucune ancienne ou nouvelle valeur de naissance", () => {
    const table = SQL.match(/create table public\.audit_correction_naissance \(([\s\S]*?)\n\);/)?.[1] ?? "";
    expect(table).toMatch(/utilisatrice_id/);
    expect(table).toMatch(/evenement/);
    expect(table).toMatch(/statut/);
    expect(table).toMatch(/version_contrat/);
    expect(table).toMatch(/cree_le/);
    expect(table).not.toMatch(/date_naissance|heure_naissance|lieu|latitude|longitude|fuseau|theme|texte/i);
  });

  it("le contrat navigateur ne transporte qu'une date, une heure et un code de commune", () => {
    const composant = lire("render/memoire/CorrectionNaissance.tsx");
    const demande = composant.match(/export interface DemandeCorrectionVue \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(demande).toMatch(/date: string/);
    expect(demande).toMatch(/heure: string/);
    expect(demande).toMatch(/codeLieu: string/);
    expect(demande).not.toMatch(/latitude|longitude|fuseau|ascendant|soleil|lune/i);

    const actions = lire("app/memoire/actions.ts");
    const recherche = actions.match(/export async function chercherLieuxNaissance([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(recherche).toMatch(/code: lieu\.code/);
    expect(recherche).toMatch(/libelle: lieu\.libelle/);
    expect(recherche).not.toMatch(/latitude|longitude|fuseau/i);
  });
});
