import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const getClaims = vi.fn();
const signOut = vi.fn();
const startAuthentication = vi.fn();
const verifyAuthentication = vi.fn();
const startRegistration = vi.fn();
const verifyRegistration = vi.fn();
const updatePasskey = vi.fn();
const deletePasskeyUtilisateur = vi.fn();
const listPasskeysUtilisateur = vi.fn();
const updateUserById = vi.fn();
const listPasskeysAdmin = vi.fn();
const deletePasskeyAdmin = vi.fn();
const revalidatePath = vi.fn();
const poserDeverrouillage = vi.fn();
const effacerDeverrouillage = vi.fn();
const ordre: string[] = [];
let fonctionnaliteActive = true;

const supabase = {
  auth: {
    getUser,
    getClaims,
    signOut,
    passkey: {
      startAuthentication,
      verifyAuthentication,
      startRegistration,
      verifyRegistration,
      update: updatePasskey,
      delete: deletePasskeyUtilisateur,
      list: listPasskeysUtilisateur,
    },
  },
};

const admin = {
  auth: {
    admin: {
      updateUserById,
      passkey: {
        listPasskeys: listPasskeysAdmin,
        deletePasskey: deletePasskeyAdmin,
      },
    },
  },
};

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/data/supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve(supabase),
}));
vi.mock("@/lib/data/supabase/admin", () => ({ createSupabaseAdminClient: () => admin }));
vi.mock("@/app/(auth)/destination-apres-auth", () => ({
  destinationApresAuth: (_client: unknown, destination: string) => Promise.resolve(destination),
}));
vi.mock("@/lib/auth/verrou-prive", () => ({
  CLE_METADATA_PASSKEY: "anima_passkey_required",
  authentificationRecente: () => true,
  destinationInterne: (valeur: unknown, repli = "/") =>
    typeof valeur === "string" && valeur.startsWith("/") ? valeur : repli,
  effacerDeverrouillage,
  lireDeverrouillage: () => Promise.resolve("session-1"),
  passkeyRequise: (user: { app_metadata?: Record<string, unknown> } | null) =>
    user?.app_metadata?.anima_passkey_required === true,
  passkeysActives: () => fonctionnaliteActive,
  poserDeverrouillage,
  sessionDeverrouillee: () => true,
}));

const actions = await import("@/app/(auth)/passkeys/actions");

const utilisateur = { id: "11111111-1111-1111-1111-111111111111", app_metadata: {} };
const challenge = "22222222-2222-2222-2222-222222222222";
const credential = {
  id: "credential-id",
  rawId: "credential-raw-id",
  type: "public-key",
  response: { clientDataJSON: "abc", attestationObject: "def" },
  clientExtensionResults: {},
} as never;

beforeEach(() => {
  fonctionnaliteActive = true;
  ordre.length = 0;
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: utilisateur }, error: null });
  getClaims.mockResolvedValue({
    data: { claims: { session_id: "session-1", amr: ["passkey"], iat: 1_700_000_000 } },
    error: null,
  });
  signOut.mockResolvedValue({ error: null });
  poserDeverrouillage.mockResolvedValue(true);
  effacerDeverrouillage.mockResolvedValue(undefined);
  updatePasskey.mockResolvedValue({ data: null, error: null });
  deletePasskeyUtilisateur.mockResolvedValue({ data: null, error: null });
  listPasskeysUtilisateur.mockResolvedValue({ data: [], error: null });
  updateUserById.mockImplementation((_id: string, donnees: { app_metadata: Record<string, unknown> }) => {
    ordre.push(`metadata:${String(donnees.app_metadata.anima_passkey_required)}`);
    return Promise.resolve({ data: {}, error: null });
  });
  listPasskeysAdmin.mockResolvedValue({ data: [], error: null });
  deletePasskeyAdmin.mockImplementation(({ passkeyId }: { passkeyId: string }) => {
    ordre.push(`delete:${passkeyId}`);
    return Promise.resolve({ data: null, error: null });
  });
});

describe("actions passkey — échecs fermés et ordre des mutations", () => {
  it("ne contacte pas l'API expérimentale quand la porte de déploiement est fermée", async () => {
    fonctionnaliteActive = false;
    expect(await actions.commencerConnexionPasskey()).toEqual({
      ok: false,
      message: "Cette reconnexion n’est pas disponible.",
    });
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  it("rend au navigateur uniquement le challenge et les options de connexion", async () => {
    startAuthentication.mockResolvedValue({
      data: { challenge_id: challenge, options: { challenge: "abc" } },
      error: null,
    });
    expect(await actions.commencerConnexionPasskey()).toEqual({
      ok: true,
      challengeId: challenge,
      options: { challenge: "abc" },
    });
  });

  it("retire la clé créée si la politique obligatoire ne peut pas être enregistrée", async () => {
    verifyRegistration.mockResolvedValue({ data: { id: challenge }, error: null });
    updateUserById.mockResolvedValueOnce({ data: null, error: { message: "panne" } });

    const resultat = await actions.verifierInscriptionPasskey(challenge, credential, "/moi");

    expect(resultat.ok).toBe(false);
    expect(deletePasskeyUtilisateur).toHaveBeenCalledWith({ passkeyId: challenge });
  });

  it("garde une clé obligatoire jusqu'au dernier instant pendant la récupération", async () => {
    listPasskeysAdmin.mockResolvedValue({
      data: [{ id: "cle-1" }, { id: "cle-2" }],
      error: null,
    });

    expect(await actions.recupererProtectionParEmail()).toEqual({ ok: true, destination: "/" });
    expect(ordre).toEqual(["delete:cle-1", "metadata:false", "delete:cle-2"]);
    expect(effacerDeverrouillage).toHaveBeenCalled();
  });

  it("restaure la politique si la suppression de la dernière clé échoue", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          ...utilisateur,
          app_metadata: { anima_passkey_required: true },
        },
      },
      error: null,
    });
    listPasskeysUtilisateur.mockResolvedValue({
      data: [{ id: challenge }],
      error: null,
    });
    deletePasskeyUtilisateur.mockResolvedValue({ data: null, error: { message: "panne" } });

    const resultat = await actions.supprimerPasskey(challenge);

    expect(resultat.ok).toBe(false);
    expect(ordre).toEqual(["metadata:false", "metadata:true"]);
    expect(effacerDeverrouillage).not.toHaveBeenCalled();
  });
});
