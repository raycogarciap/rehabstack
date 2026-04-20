// src/app/api/admin/users/route.ts
// Ruta GET para listar usuarios con filtros y paginación.
// Ruta PATCH para actualizar el rol de un usuario.
// Solo accesible por administradores verificados mediante getVerifiedAdmin().

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedAdmin } from "@/lib/admin/auth";

// ─── Tipos ───────────────────────────────────────────────────────────────────

// Roles válidos en el sistema
type UserRole = "user" | "creator" | "admin";

// Estructura de un usuario en la respuesta
interface UserRecord {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  subscription_tier: string | null;
  specialty: string | null;
  created_at: string;
}

// Respuesta paginada GET
interface UsersResponse {
  users: UserRecord[];
  total: number;
  page: number;
  limit: number;
}

// Cuerpo de la solicitud PATCH
interface PatchBody {
  userId: string;
  role: UserRole;
}

// Lista de roles válidos para validación
const VALID_ROLES: UserRole[] = ["user", "creator", "admin"];

// ─── Handler GET ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar que el solicitante es un administrador válido
    const { error, status, adminClient } = await getVerifiedAdmin();
    if (error) {
      return NextResponse.json({ error }, { status: status ?? 401 });
    }

    // 2. Leer y parsear los parámetros de consulta de la URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const roleFilter = searchParams.get("role") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") ?? "50", 10)));

    // 3. Calcular el rango de paginación (Supabase usa índice 0)
    const offset = (page - 1) * limit;

    // 4. Construir la consulta base de usuarios
    let query = adminClient
      .from("users")
      .select(
        "id, email, name, role, subscription_tier, specialty, created_at",
        { count: "exact" }
      );

    // 5. Aplicar filtro de búsqueda por email O nombre si se proporcionó
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // 6. Aplicar filtro de rol exacto si se proporcionó
    if (roleFilter) {
      query = query.eq("role", roleFilter);
    }

    // 7. Aplicar ordenamiento y paginación
    const { data: users, count, error: usersError } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) {
      console.error("[admin/users GET] Error al consultar usuarios:", usersError);
      return NextResponse.json(
        { error: "Error al obtener la lista de usuarios." },
        { status: 500 }
      );
    }

    // 8. Devolver respuesta paginada
    const response: UsersResponse = {
      users: (users ?? []) as UserRecord[],
      total: count ?? 0,
      page,
      limit,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    // Error inesperado del servidor
    console.error("[admin/users GET] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener usuarios." },
      { status: 500 }
    );
  }
}

// ─── Handler PATCH ────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    // 1. Verificar que el solicitante es un administrador válido
    //    También se obtiene `user` para poder comparar con el userId del cuerpo
    const { error, status, adminClient, user } = await getVerifiedAdmin();
    if (error) {
      return NextResponse.json({ error }, { status: status ?? 401 });
    }

    // 2. Parsear y validar el cuerpo de la solicitud
    let body: PatchBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no es JSON válido." },
        { status: 400 }
      );
    }

    const { userId, role } = body;

    // 3. Validar que se proporcionó el ID del usuario
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return NextResponse.json(
        { error: "Se requiere un userId válido." },
        { status: 400 }
      );
    }

    // 4. Validar que el rol es uno de los 3 valores permitidos
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: `El rol debe ser uno de: ${VALID_ROLES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // 5. Impedir que el administrador cambie su propio rol (medida de seguridad)
    if (user && userId === user.id) {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol de administrador." },
        { status: 403 }
      );
    }

    // 6. Actualizar el rol del usuario en la base de datos usando el cliente admin
    const { data: updatedUser, error: updateError } = await adminClient
      .from("users")
      .update({ role })
      .eq("id", userId)
      .select(
        "id, email, name, role, subscription_tier, specialty, created_at"
      )
      .single();

    if (updateError) {
      // Verificar si el error es porque el usuario no existe
      if (updateError.code === "PGRST116") {
        return NextResponse.json(
          { error: `No se encontró el usuario con ID: ${userId}` },
          { status: 404 }
        );
      }
      console.error("[admin/users PATCH] Error al actualizar rol:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el rol del usuario." },
        { status: 500 }
      );
    }

    // 7. Devolver confirmación con el usuario actualizado
    return NextResponse.json(
      { success: true, user: updatedUser },
      { status: 200 }
    );
  } catch (err) {
    // Error inesperado del servidor
    console.error("[admin/users PATCH] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar el rol del usuario." },
      { status: 500 }
    );
  }
}
