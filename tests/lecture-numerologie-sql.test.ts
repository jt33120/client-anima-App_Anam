import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { declarerMajorite } from "./_semis";
const url = process.env.SUPABASE_URL!;
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, {auth:{persistSession:false,autoRefreshToken:false}});
const nu = () => createClient(url, process.env.SUPABASE_PUBLISHABLE_KEY!, {auth:{persistSession:false,autoRefreshToken:false}});
const source = (nom="") => createHash("md5").update(`1990-01-01|${nom}`).digest("hex");
const annee = Number(new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",year:"numeric"}).format(new Date()));
const texte = "Une lecture symbolique à confronter librement à ton vécu et à tes préférences, sans aucune certitude.";
type Compte = {id:string;client:SupabaseClient};
let alice:Compte, autre:Compte;
async function creer():Promise<Compte> {
  const email = `numerologie-${crypto.randomUUID()}@exemple.fr`, password="Test-numerologie-123!";
  const {data,error} = await admin.auth.admin.createUser({email,password,email_confirm:true});
  if(error) throw error;
  const id=data.user!.id;
  await declarerMajorite(admin,id);
  const {error:eConsent} = await admin.from("consentement").insert({utilisatrice_id:id,art9_accorde:true,ia_reconnue:true,cgu_acceptees:true});
  if(eConsent) throw eConsent;
  const client=nu(); const {error:eAuth}=await client.auth.signInWithPassword({email,password}); if(eAuth) throw eAuth;
  return {id,client};
}
const lire = (c:Compte) => c.client.from("lecture_numerologie").select("id,note,partage_anam,portrait");
const commencer = (c:Compte,nom="") => c.client.rpc("commencer_lecture_numerologie",{p_source:source(nom),p_annee:annee});
const terminer = (c:Compte,jeton:string) => admin.rpc("terminer_lecture_numerologie",{p_utilisatrice_id:c.id,p_jeton:jeton,p_guidance:texte,p_vision:texte,p_portrait:texte});
beforeAll(async()=>{alice=await creer();autre=await creer();});
afterAll(async()=>{for(const c of [alice,autre]) if(c) await admin.auth.admin.deleteUser(c.id);});
describe.sequential("numérologie RLS et cycle réel",()=>{
  let id:string;
  it("réserve un seul appel sous concurrence et refuse l'année forgée",async()=>{
    const faux=await alice.client.rpc("commencer_lecture_numerologie",{p_source:source(),p_annee:annee+1}); expect(faux.error).not.toBeNull();
    const r=await Promise.all([commencer(alice),commencer(alice)]);
    r.forEach(v=>expect(v.error).toBeNull());
    expect(r.map(v=>v.data.statut).sort()).toEqual(["en_cours","reservee"]);
    const reservation=r.find(v=>v.data.statut==="reservee")!.data; id=reservation.id;
    expect((await alice.client.rpc("etat_lecture_numerologie")).data).toEqual({statut:"en_cours",reessaiApres:3});
    expect((await autre.client.rpc("etat_lecture_numerologie")).data).toEqual({statut:"absente"});
    expect((await terminer(alice,reservation.jeton)).error).toBeNull();
    expect((await commencer(alice)).data.statut).toBe("prete");
    expect((await alice.client.rpc("etat_lecture_numerologie")).data).toEqual({statut:"prete"});
  });
  it("isole les lectures et interdit le texte client et les jetons",async()=>{
    expect((await lire(alice)).data).toHaveLength(1);
    expect((await lire(autre)).data).toEqual([]);
    expect((await autre.client.from("lecture_numerologie").select("portrait").eq("utilisatrice_id",alice.id)).data).toEqual([]);
    expect((await alice.client.from("lecture_numerologie").select("jeton")).error).not.toBeNull();
    expect((await alice.client.from("lecture_numerologie").update({portrait:texte}).eq("utilisatrice_id",alice.id)).error).not.toBeNull();
    expect((await alice.client.rpc("terminer_lecture_numerologie",{p_utilisatrice_id:alice.id,p_jeton:crypto.randomUUID(),p_guidance:texte,p_vision:texte,p_portrait:texte})).error).not.toBeNull();
  });
  it("4 étoiles ne partagent pas,5 nécessite un choix, retrait immédiat",async()=>{
    const noter=(note:number,partager:boolean)=>alice.client.rpc("noter_lecture_numerologie",{p_id:id,p_note:note,p_partager:partager});
    expect((await noter(4,true)).error).not.toBeNull();
    expect((await noter(5,false)).error).toBeNull(); expect((await lire(alice)).data?.[0].partage_anam).toBe(false);
    expect((await noter(5,true)).error).toBeNull(); expect((await lire(alice)).data?.[0].partage_anam).toBe(true);
    expect((await autre.client.rpc("noter_lecture_numerologie",{p_id:id,p_note:5,p_partager:true})).error).not.toBeNull();
    expect((await noter(4,false)).error).toBeNull(); expect((await lire(alice)).data?.[0].partage_anam).toBe(false);
    expect((await noter(5,true)).error).toBeNull();
    expect((await noter(5,false)).error).toBeNull(); expect((await lire(alice)).data?.[0].partage_anam).toBe(false);
  });
  it("exporte la lecture sans le jeton technique",async()=>{
    const {data,error}=await alice.client.rpc("exporter_mes_donnees"); expect(error).toBeNull();
    expect(data.lecture_numerologie).toHaveLength(1); expect(data.lecture_numerologie[0].portrait).toBe(texte);
    expect(data.lecture_numerologie[0]).not.toHaveProperty("jeton");
  });
  it("un changement de nom invalide contenu,note,partage et ancienne notation",async()=>{
    expect((await admin.from("utilisatrice").update({nom_complet:"Louise Dupont"}).eq("id",alice.id)).error).toBeNull();
    expect((await lire(alice)).data).toEqual([]);
    expect((await alice.client.rpc("noter_lecture_numerologie",{p_id:id,p_note:5,p_partager:true})).error).not.toBeNull();
    const {data}=await admin.from("lecture_numerologie").select("portrait,note,partage_anam,essais,jeton").eq("utilisatrice_id",alice.id).single();
    expect(data).toMatchObject({portrait:null,note:null,partage_anam:false,essais:1,jeton:null});
    const attente = await alice.client.rpc("etat_lecture_numerologie");
    expect(attente.error).toBeNull(); expect(attente.data.statut).toBe("patience");
    expect(attente.data.reessaiApres).toBeGreaterThan(0);
    expect((await commencer(alice,"Louise Dupont")).data.statut).toBe("patience");
  });
  it("un résultat tardif ne ressuscite pas après modification de source",async()=>{
    const {data}=await commencer(autre); expect(data.statut).toBe("reservee");
    expect((await admin.from("utilisatrice").update({nom_complet:"Louise"}).eq("id",autre.id)).error).toBeNull();
    expect((await terminer(autre,data.jeton)).error).toBeNull(); expect((await lire(autre)).data).toEqual([]);
  });
  it("révocation interdit lecture,réservation et notation",async()=>{
    expect((await admin.from("consentement").update({revoked_at:new Date().toISOString()}).eq("utilisatrice_id",alice.id)).error).toBeNull();
    expect((await lire(alice)).data).toEqual([]); expect((await commencer(alice,"Louise Dupont")).error).not.toBeNull();
    expect((await alice.client.rpc("etat_lecture_numerologie")).error).not.toBeNull();
    expect((await alice.client.rpc("noter_lecture_numerologie",{p_id:id,p_note:5,p_partager:true})).error).not.toBeNull();
  });
  it("la suppression du compte emporte aussi sa lecture",async()=>{
    expect((await admin.auth.admin.deleteUser(autre.id)).error).toBeNull();
    expect((await admin.from("lecture_numerologie").select("id").eq("utilisatrice_id",autre.id)).data).toEqual([]);
  });
});
