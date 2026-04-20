// src/app/api/admin/agents/[id]/route.ts
// Ruta PATCH para actualizar el estado de un agente con acciones administrativas.
// Solo accesible por administradores verificados mediante getVerifiedAdmin().

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedAdmin } from "@/lib/admin/auth";

// ─── Tipos ───────────────────────────────────────────────────────────────────

// Acciones válidas que un administrador puede realizar sobre un agente
type AdminAction = "approve" | "request_changes" | "pause" | "activate" | "delist";

// Cuerpo de la solicitud PATCH
interface PatchBody {
  action: AdminAction;
  review_notes?: string;
}

// Mapeo de acciones a estados de la base de datos
const ACTION_TO_STATUS: Record<AdminAction, string> = {
  approve: "active",
  request_changes: "needs_changes",
  pause: "paused",
  activate: "active",
  delist: "delisted",
};

// Lista de acciones permitidas para validación
const VALID_ACTIONS: AdminAction[] = [
  "approve",
  "request_changes",
  "pause",
  "activate",
  "delist",
];

// ─── Handler PATCH ────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar que el solicitante es un administrador válido
    const { error, status, adminClient } = await getVerifiedAdmin();
    if (error) {
      return NextResponse.json({ error }, { status: status ?? 401 });
    }

    // 2. Obtener el ID del agente de los parámetros de ruta (patrón Next.js 15: await params)
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID del agente." },
        { status: 400 }
      );
    }

    // 3. Parsear y validar el cuerpo de la solicitud
    let body: PatchBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no es JSON válido." },
        { status: 400 }
      );
    }

    const { action, review_notes } = body;

    // 4. Validar que la acción es una de las 5 acciones permitidas
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        {
          error: `La acción debe ser una de: ${VALID_ACTIONS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // 5. Validar que se proporcionaron notas de revisión cuando la acción es 'request_changes'
    if (action === "request_changes") {
      if (!review_notes || review_notes.trim() === "") {
        return NextResponse.json(
          {
            error:
              "Las notas de revisión (review_notes) son obligatorias cuando la acción es 'request_changes'.",
          },
          { status: 400 }
        );
      }
    }

    // 6. Construir el objeto de actualización según la acción solicitada
    const newStatus = ACTION_TO_STATUS[action];
    const updatePayload: Record<string, string | null> = {
      status: newStatus,
    };

    if (action === "request_changes") {
      // Guardar las notas de revisión cuando se solicitan cambios
      updatePayload.review_notes = review_notes!.trim();
    } else if (action === "approve") {
      // Limpiar notas de revisión al aprobar un agente
      updatePayload.review_notes = null;
    }

    // 7. Aplicar la actualización en la base de datos usando el cliente admin (bypasea RLS)
    const { data: updatedAgent, error: updateError } = await adminClient
      .from("agents")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      // Verificar si el error es porque el agente no existe
      if (updateError.code === "PGRST116") {
        return NextResponse.json(
          { error: `No se encontró el agente con ID: ${id}` },
          { status: 404 }
        );
      }
      console.error("[admin/agents/[id]] Error al actualizar agente:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el estado del agente." },
        { status: 500 }
      );
    }

    // 8. Devolver el agente actualizado
    return NextResponse.json(updatedAgent, { status: 200 });
  } catch (err) {
    // Error inesperado del servidor
    console.error("[admin/agents/[id]] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar el agente." },
      { status: 500 }
    );
  }
}
