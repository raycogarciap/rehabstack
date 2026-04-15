// src/app/api/agents/mock/sessions/route.ts
// Mock que implementa el RehabStack Agent API Spec para testing local.
// POST /api/agents/mock/sessions → crea una sesión mock sin BD ni servicio externo.

import { NextResponse } from "next/server";

export async function POST() {
  // Devuelve un session_id único para cumplir la interfaz del spec
  return NextResponse.json({
    session_id: `mock-session-${Date.now()}`,
  });
}
