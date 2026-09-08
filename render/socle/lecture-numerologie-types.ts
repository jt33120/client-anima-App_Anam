/** Client transport contract for the separate numerology reading and rating endpoint. */
export interface TexteLectureNumerologie {
  readonly guidanceAnnee: string;
  readonly visionLongTerme: string;
  readonly portrait: string;
}
export interface LectureNumerologieVue extends TexteLectureNumerologie {
  readonly id: string;
  readonly annee: number;
  readonly note: number | null;
  readonly partageAnam: boolean;
}
