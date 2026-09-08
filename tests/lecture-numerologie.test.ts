import { describe, expect, it } from "vitest";
import { calculerNumerologie } from "@/lib/astro/numerologie";
import { messagesNumerologie, normaliserProseNumerologie, validerLectureNumerologie, validerNoteNumerologie } from "@/lib/domain/lecture-numerologie";
import { consigneContexte, type MatiereContexte } from "@/lib/domain/contexte-anam";
const texte = {
  guidanceAnnee: "Tu pourrais explorer ce qui mérite ton attention cette année et essayer un geste modeste.",
  visionLongTerme: "À long terme, tu pourrais chercher un équilibre entre tes envies et un engagement qui te ressemble.",
  portrait: "Cette lecture symbolique suggère un goût possible pour les liens. Est-ce que cela rejoint ton vécu ?",
};
const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
describe("lecture numérologique", () => {
  it("ne transmet que nombres calculés et année, jamais identité brute", () => {
    const messages = messagesNumerologie(calculerNumerologie({date:"1990-03-12",nomComplet:"Louise Dupont"},2026));
    const donnees = JSON.parse(messages[1].content);
    expect(Object.keys(donnees)).toEqual(["annee", "nombres"]);
    expect(donnees.nombres.expression).toBeGreaterThan(0);
    expect(JSON.stringify(messages)).not.toContain("Louise");
    expect(JSON.stringify(messages)).not.toContain("1990-03-12");
  });
  it("omet les nombres du nom absent", () => {
    const donnees = JSON.parse(messagesNumerologie(calculerNumerologie({date:"1990-03-12"},2026))[1].content);
    expect(donnees.nombres.expression).toBeUndefined();
  });
  it("valide exclusivement les trois textes bornés", () => {
    expect(validerLectureNumerologie(JSON.stringify(texte))).toEqual(texte);
    expect(validerLectureNumerologie(JSON.stringify({...texte, secret:"x"}))).toBeNull();
    expect(validerLectureNumerologie(JSON.stringify({...texte, portrait:"court"}))).toBeNull();
    expect(validerLectureNumerologie(JSON.stringify({...texte, portrait:"x".repeat(1601)}))).toBeNull();
    expect(validerLectureNumerologie("```json\n" + JSON.stringify(texte))).toBeNull();
  });
  it("nettoie les emphases du modèle sans interpréter de HTML ni changer les intervalles", () => {
    const brut = {...texte, portrait: "Tu pourrais explorer une **autonomie créative** — à confronter à ton *vécu*. Cette lecture reste symbolique."};
    expect(validerLectureNumerologie(JSON.stringify(brut))?.portrait).toBe("Tu pourrais explorer une autonomie créative, à confronter à ton vécu. Cette lecture reste symbolique.");
    expect(normaliserProseNumerologie("Choisis 2–3 gestes – puis observe.")).toBe("Choisis 2 à 3 gestes, puis observe.");
  });
  it("accepte un rappel de limite sans ouvrir les diagnostics affirmatifs", () => {
    expect(validerLectureNumerologie(JSON.stringify({...texte,portrait:"Ce n’est pas un diagnostic : cette hypothèse symbolique reste à confronter à ton vécu."}))).not.toBeNull();
    expect(validerLectureNumerologie(JSON.stringify({...texte,portrait:"Ce n’est pas un diagnostic mais tu es bipolaire, comme le montrent ces chiffres."}))).toBeNull();
    expect(validerLectureNumerologie(JSON.stringify({...texte,portrait:"Le diagnostic est clair : tu es une personne que ses chiffres permettent de définir."}))).toBeNull();
  });
  it.each([
    "Cette année, tu rencontreras la personne qui changera ta vie et tu trouveras un nouvel emploi.",
    "Tes nombres montrent que tu es catholique et que tu préfères les relations homosexuelles.",
    "Tu pourrais être musulmane, comme le suggère cette lecture de tes chiffres personnels.",
    "Ton orientation sexuelle serait attirée par les femmes, selon les nombres de ton nom.",
  ])("refuse prédiction certaine ou attribution sensible : %s", portrait => {
    expect(validerLectureNumerologie(JSON.stringify({...texte,portrait}))).toBeNull();
  });
  it("conserve les limites explicites sans attribuer de trait sensible", () => {
    expect(validerLectureNumerologie(JSON.stringify({...texte,portrait:"Cette lecture symbolique ne permet pas de déduire ta religion, ton orientation sexuelle ou tes opinions politiques."}))).not.toBeNull();
  });
  it("refuse diagnostic et balisage injecté", () => {
    expect(validerLectureNumerologie(JSON.stringify({...texte,portrait:"Cette lecture symbolique soigne ton anxiété et te permet de comprendre tout ton vécu."}))).toBeNull();
    expect(validerLectureNumerologie(JSON.stringify({...texte,portrait:"Selon ces chiffres tu es bipolaire et cela explique tout ce qui t’arrive."}))).toBeNull();
    expect(validerLectureNumerologie(JSON.stringify({...texte,portrait:"<script>alert('Tu pourrais explorer les liens de ta vie')</script>"}))).toBeNull();
  });
  it.each([0,6,4.5,"5",null])("rejette la note %s", note => expect(validerNoteNumerologie({id,note,partagerAnam:false})).toBeNull());
  it("une note 4 ne peut partager; 5 ne partage que sur choix explicite", () => {
    expect(validerNoteNumerologie({id,note:4,partagerAnam:true})).toBeNull();
    expect(validerNoteNumerologie({id,note:5,partagerAnam:false})?.partagerAnam).toBe(false);
    expect(validerNoteNumerologie({id,note:5,partagerAnam:true})?.partagerAnam).toBe(true);
    expect(validerNoteNumerologie({id,note:5})).toBeNull();
    expect(validerNoteNumerologie({id,note:5,partagerAnam:true,portrait:"forgé"})).toBeNull();
  });
  it("le portrait partagé reste une hypothèse distincte de la mémoire factuelle", () => {
    const matiere: MatiereContexte = {prenom:null,socle:[],branches:[],retenu:[],typePressenti:null,premiereFois:true};
    expect(consigneContexte(matiere).content).not.toContain(texte.portrait);
    const partage = consigneContexte({...matiere,portraitNumerologie:texte.portrait}).content;
    expect(partage).toContain(texte.portrait);
    expect(partage).toContain("pas un fait");
    expect(partage).toContain("N’enregistre pas ce portrait");
  });
});
