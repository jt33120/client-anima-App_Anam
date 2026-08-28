import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export interface ListeMigrations {
  readonly locales: readonly string[];
  readonly distantes: readonly string[];
}

export interface EcartMigrations {
  readonly absentesDuDistant: readonly string[];
  readonly absentesDuDepot: readonly string[];
}

const NOM_MIGRATION = /^(\d{4})_[a-z0-9][a-z0-9_-]*\.sql$/;
const LIGNE_MIGRATION =
  /^\s*(?:(\d{4,14})\s*)?\|\s*(?:(\d{4,14})\s*)?\|/;

const uniquesTries = (versions: readonly string[]): string[] =>
  [...new Set(versions)].sort((a, b) => a.localeCompare(b));

/** Parse la table des anciennes CLI et le JSON produit hors TTY par les versions récentes. */
export function analyserListeMigrations(sortie: string): ListeMigrations {
  const nettoyee = sortie.trim();
  if (nettoyee.startsWith("{")) {
    try {
      const document = JSON.parse(nettoyee) as { readonly migrations?: unknown };
      if (Array.isArray(document.migrations)) {
        const locales: string[] = [];
        const distantes: string[] = [];
        for (const migration of document.migrations) {
          if (!migration || typeof migration !== "object") continue;
          const locale = "local" in migration ? migration.local : null;
          const distante = "remote" in migration ? migration.remote : null;
          if (typeof locale === "string" && /^\d{4,14}$/.test(locale)) locales.push(locale);
          if (typeof distante === "string" && /^\d{4,14}$/.test(distante)) {
            distantes.push(distante);
          }
        }
        if (locales.length > 0 || distantes.length > 0) {
          return { locales: uniquesTries(locales), distantes: uniquesTries(distantes) };
        }
      }
    } catch {
      // Une ancienne CLI peut commencer sa sortie humaine par un caractère inattendu : la table
      // stable ci-dessous reste alors le second parseur, sans jamais relâcher le verdict.
    }
  }
  const locales: string[] = [];
  const distantes: string[] = [];
  for (const ligne of sortie.split(/\r?\n/)) {
    const resultat = LIGNE_MIGRATION.exec(ligne);
    if (!resultat) continue;
    if (resultat[1]) locales.push(resultat[1]);
    if (resultat[2]) distantes.push(resultat[2]);
  }
  if (locales.length === 0 && distantes.length === 0) {
    throw new Error("liste_migrations_illisible");
  }
  return { locales: uniquesTries(locales), distantes: uniquesTries(distantes) };
}

export function comparerVersions(
  locales: readonly string[],
  distantes: readonly string[],
): EcartMigrations {
  const ensembleLocal = new Set(locales);
  const ensembleDistant = new Set(distantes);
  return {
    absentesDuDistant: uniquesTries(locales.filter((version) => !ensembleDistant.has(version))),
    absentesDuDepot: uniquesTries(distantes.filter((version) => !ensembleLocal.has(version))),
  };
}

/** Valide nom, unicité et continuité à partir de la première migration fournie. */
export function validerNomsMigrations(noms: readonly string[]): readonly string[] {
  const versions = noms.map((nom) => {
    const resultat = NOM_MIGRATION.exec(nom);
    if (!resultat) throw new Error(`nom_migration_invalide:${nom}`);
    return resultat[1];
  });
  const triees = [...versions].sort((a, b) => a.localeCompare(b));
  for (let index = 1; index < triees.length; index += 1) {
    if (triees[index] === triees[index - 1]) {
      throw new Error(`version_migration_dupliquee:${triees[index]}`);
    }
    const attendue = String(Number(triees[index - 1]) + 1).padStart(4, "0");
    if (triees[index] !== attendue) {
      throw new Error(`version_migration_absente:${attendue}`);
    }
  }
  return triees;
}

interface SortieCommande {
  readonly stdout: string;
}

function executer(
  executable: string,
  argumentsCommande: readonly string[],
  racine: string,
  nom: string,
  env: NodeJS.ProcessEnv,
): SortieCommande {
  const resultat = spawnSync(executable, [...argumentsCommande], {
    cwd: racine,
    encoding: "utf8",
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (resultat.error || resultat.status !== 0) {
    // Ne jamais recopier stderr : une erreur de connexion peut y inclure une URL ou un paramètre.
    throw new Error(`commande_supabase_echouee:${nom}`);
  }
  return { stdout: resultat.stdout };
}

function executableSupabase(racine: string): string {
  const nom = process.platform === "win32" ? "supabase.cmd" : "supabase";
  const local = resolve(racine, "node_modules", ".bin", nom);
  return existsSync(local) ? local : "supabase";
}

function referenceProjet(env: NodeJS.ProcessEnv): string | null {
  const explicite = env.SUPABASE_PROJECT_REF?.trim();
  if (explicite) return explicite;
  try {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return null;
    const reference = new URL(url).hostname.split(".")[0];
    return /^[a-z0-9]{20}$/.test(reference) ? reference : null;
  } catch {
    return null;
  }
}

function assurerLien(executable: string, racine: string, env: NodeJS.ProcessEnv): void {
  if (existsSync(resolve(racine, "supabase", ".temp", "project-ref"))) return;
  const reference = referenceProjet(env);
  if (!reference || !env.SUPABASE_ACCESS_TOKEN || !env.SUPABASE_DB_PASSWORD) {
    throw new Error(
      "liaison_supabase_absente:SUPABASE_PROJECT_REF_SUPABASE_ACCESS_TOKEN_SUPABASE_DB_PASSWORD",
    );
  }
  executer(
    executable,
    [
      "link",
      "--project-ref",
      reference,
      "--workdir",
      racine,
      "--yes",
    ],
    racine,
    "link",
    env,
  );
}

function environnementOps(racine: string, env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const complete: NodeJS.ProcessEnv = { ...env };
  const chemin = resolve(racine, ".env.local");
  if (!existsSync(chemin)) return complete;
  const autorisees = new Set([
    "SUPABASE_PROJECT_REF",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_DB_PASSWORD",
    "NEXT_PUBLIC_SUPABASE_URL",
  ]);
  for (const ligne of readFileSync(chemin, "utf8").split(/\r?\n/)) {
    const resultat = /^([A-Z0-9_]+)=(.*)$/.exec(ligne);
    if (!resultat || !autorisees.has(resultat[1]) || complete[resultat[1]]) continue;
    let valeur = resultat[2].trim();
    if (
      valeur.length >= 2 &&
      ((valeur.startsWith('"') && valeur.endsWith('"')) ||
        (valeur.startsWith("'") && valeur.endsWith("'")))
    ) {
      valeur = valeur.slice(1, -1);
    }
    if (valeur) complete[resultat[1]] = valeur;
  }
  return complete;
}

function verifierLocalement(racine: string): {
  readonly noms: readonly string[];
  readonly versions: readonly string[];
} {
  const noms = readdirSync(resolve(racine, "supabase", "migrations"))
    .filter((nom) => nom.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
  const versions = validerNomsMigrations(noms);
  if (versions.length === 0) throw new Error("aucune_migration_locale");
  return { noms, versions };
}

function afficherVersions(versions: readonly string[]): string {
  return versions.length === 0 ? "aucune" : versions.join(", ");
}

function verifierDistance(
  racine: string,
  noms: readonly string[],
  versions: readonly string[],
  env: NodeJS.ProcessEnv,
): void {
  const executable = executableSupabase(racine);
  assurerLien(executable, racine, env);
  const sortie = executer(
    executable,
    ["migration", "list", "--linked", "--workdir", racine],
    racine,
    "migration_list_linked",
    env,
  ).stdout;
  const liste = analyserListeMigrations(sortie);
  const ecartCli = comparerVersions(versions, liste.locales);
  if (ecartCli.absentesDuDistant.length > 0 || ecartCli.absentesDuDepot.length > 0) {
    throw new Error("liste_locale_cli_divergente_du_depot");
  }

  const ecart = comparerVersions(versions, liste.distantes);
  if (ecart.absentesDuDistant.length === 0 && ecart.absentesDuDepot.length === 0) {
    console.log(`Schéma distant aligné jusqu’à ${versions.at(-1)}.`);
    return;
  }

  const nomsParVersion = new Map(
    noms.map((nom) => [NOM_MIGRATION.exec(nom)?.[1] ?? "", nom] as const),
  );
  let dryRunConfirme = false;
  try {
    executer(
      executable,
      ["db", "push", "--linked", "--dry-run", "--workdir", racine],
      racine,
      "db_push_dry_run",
      env,
    );
    dryRunConfirme = true;
  } catch {
    // Le verdict reste bloquant et lisible même si la seconde lecture échoue.
  }

  console.error(
    `Promotion bloquée. Absentes du schéma distant : ${afficherVersions(ecart.absentesDuDistant)}.`,
  );
  console.error(
    `Absentes du dépôt local : ${afficherVersions(ecart.absentesDuDepot)}.`,
  );
  if (dryRunConfirme && ecart.absentesDuDistant.length > 0) {
    console.error(
      `Dry-run read-only confirmé : ${ecart.absentesDuDistant
        .map((version) => nomsParVersion.get(version) ?? version)
        .join(", ")}.`,
    );
  } else {
    console.error("Dry-run read-only non confirmé ; aucune écriture distante n’a été tentée.");
  }
  throw new Error("promotion_bloquee_schema");
}

export function main(
  argumentsScript = process.argv.slice(2),
  env = process.env,
): void {
  const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { noms, versions } = verifierLocalement(racine);
  const envOps = environnementOps(racine, env);
  const mode = argumentsScript[0] ?? "--local";
  const verifierDistant =
    mode === "--linked" || (mode === "--promotion" && env.VERCEL_ENV === "production");
  if (!["--local", "--linked", "--promotion"].includes(mode)) {
    throw new Error(`mode_inconnu:${mode}`);
  }
  if (verifierDistant) {
    verifierDistance(racine, noms, versions, envOps);
  } else {
    console.log(`Migrations locales cohérentes : ${versions[0]}–${versions.at(-1)}.`);
  }
}

const fichierLance = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : "";
if (import.meta.url === fichierLance) {
  try {
    main();
  } catch (erreur) {
    console.error(
      erreur instanceof Error ? `Vérification interrompue : ${erreur.message}.` : "Vérification interrompue.",
    );
    process.exitCode = 1;
  }
}
