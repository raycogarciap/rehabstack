// src/app/api/creator/profile/route.ts
// PATCH /api/creator/profile
//
// Actualiza el perfil del creador autenticado (nombre para mostrar).
//
// Por qué un API route en lugar de escritura directa al cliente:
//   El cliente Supabase del browser depende exclusivamente de las políticas RLS
//   para limitar el scope de la actualización. Este route usa el cliente SSR
//   del servidor con la sesión del usuario, pero aplica verificación explícita
//   de user.id en el WHERE — independiente de si RLS está bien configurado.
//
// Requiere autenticación y rol 'creator'.
// Solo actualiza el campo 'name' — otros campos del perfil no están expuestos.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PatchProfileBody {
  name?: string;
}

export async function PATCH(req: NextRequest) {
  try {
    // ── 1. Verificar autenticación ──────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    // ── 2. Verificar rol de creador ─────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil de usuario no encontrado." },
        { status: 403 }
      );
    }

    if (profile.role !== "creator" && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de creador." },
        { status: 403 }
      );
    }

    // ── 3. Parsear body ─────────────────────────────────────────────────────
    const body = await req.json().catch(() => null) as PatchProfileBody | null;

    if (!body) {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud es inválido." },
        { status: 400 }
      );
    }

    // ── 4. Validar y construir actualización ────────────────────────────────
    const updates: Record<string, string> = {};

    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      if (trimmedName.length === 0) {
        return NextResponse.json(
          { error: "El nombre no puede estar vacío." },
          { status: 400 }
        );
      }
      if (trimmedName.length > 100) {
        return NextResponse.json(
          { error: "El nombre no puede superar los 100 caracteres." },
          { status: 400 }
        );
      }
      updates.name = trimmedName;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Ningún campo válido fue provisto para actualizar." },
        { status: 400 }
      );
    }

    // ── 5. Actualizar en DB — WHERE id = user.id garantiza que el creador
    //       solo puede actualizar su propio registro, independiente de RLS ──
    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      console.error("[creator/profile PATCH] Error al actualizar:", updateError.message);
      return NextResponse.json(
        { error: "Error al actualizar el perfil." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor.";
    console.error("[creator/profile PATCH] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
