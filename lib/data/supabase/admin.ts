import "server-only"; // barrière de compilation : erreur si jamais importé côté client (AD-12)
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase ADMIN (clé `service_role`) — CONTOURNE la RLS.
 *
 * ⚠️ RÉSERVÉ AUX TÂCHES SYSTÈME et aux RPC privilégiées, bornées et non exposées à
 * `authenticated`. Il ne doit jamais servir à une lecture libre de contenu depuis une requête
 * utilisateur. Les rares mutations privilégiées doivent authentifier la cible sous JWT avant
 * l'appel et refaire leurs gardes dans la transaction SQL.
 *
 * Premier usage en Story 1.5 : la SUPPRESSION IMMÉDIATE du compte au refus du consentement
 * (AC6). C'est une suppression de COMPTE (tâche système), pas un accès `service_role`
 * à du contenu ; et aucune donnée art. 9 n'existe encore à ce stade (AD-4).
 * L'appelant doit d'abord vérifier `getUser()` pour ne supprimer QUE le compte courant.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        // Requis par les seules opérations système de récupération (liste/suppression des clés).
        experimental: { passkey: true },
      },
    },
  );
}
