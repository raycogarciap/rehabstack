// API Route: POST /api/auth/signout
// Cierra la sesión del usuario actual en Supabase y redirige al login.
// Se usa como destino de un formulario HTML con method="POST", lo que permite
// que el logout funcione incluso con JavaScript deshabilitado.
// Solo acepta POST para evitar logouts accidentales por peticiones GET (p.ej. prefetch).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  // Cierra la sesión del usuario y elimina las cookies de autenticación
  await supabase.auth.signOut();

  // Redirige al login tras cerrar sesión
  return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    { status: 302 }
  );
}
