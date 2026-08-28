import { NextResponse } from "next/server";
import {
  COOKIE_DEVERROUILLAGE,
  OPTIONS_COOKIE_DEVERROUILLAGE,
} from "@/lib/auth/verrou-prive";

/** Ferme seulement le déverrouillage local ; la longue session e-mail reste disponible. */
export async function POST() {
  const reponse = new NextResponse(null, { status: 204 });
  reponse.cookies.set(COOKIE_DEVERROUILLAGE, "", {
    ...OPTIONS_COOKIE_DEVERROUILLAGE,
    maxAge: 0,
  });
  return reponse;
}
