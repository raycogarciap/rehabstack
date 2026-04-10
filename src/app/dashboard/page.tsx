// Página principal del dashboard (/dashboard).
// Muestra un saludo personalizado, tarjetas de estadísticas (valores 0 por ahora)
// y una tarjeta de "Completa tu perfil" si el usuario no tiene especialidad configurada.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard | RehabStack",
  description: "Your RehabStack dashboard — manage agents, sessions, and showcases.",
};

// Tarjetas de estadísticas (datos reales se añadirán en fases posteriores)
const STAT_CARDS = [
  {
    label: "Active Agents",
    value: "0",
    description: "Agents currently in use",
    // Icono: agente/robot
    icon: (
      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3a.75.75 0 0 0-1.5 0v.75H6A2.25 2.25 0 0 0 3.75 6v10.5A2.25 2.25 0 0 0 6 18.75h12A2.25 2.25 0 0 0 20.25 16.5V6A2.25 2.25 0 0 0 18 3.75h-2.25V3a.75.75 0 0 0-1.5 0v.75h-4.5V3Z" />
      </svg>
    ),
  },
  {
    label: "Sessions This Month",
    value: "0",
    description: "AI conversations started",
    // Icono: conversación
    icon: (
      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
  {
    label: "Showcase Views",
    value: "0",
    description: "Profile views this month",
    // Icono: ojo / vistas
    icon: (
      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();

  // Obtiene el usuario autenticado (validado contra Supabase Auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Carga el perfil del usuario desde public.users para obtener nombre y especialidad
  const { data: profile } = await supabase
    .from("users")
    .select("name, specialty")
    .eq("id", user.id)
    .single();

  // Saludo: usa el nombre del perfil si existe, si no el email
  const displayName = profile?.name ?? user.email ?? "there";
  // El primer nombre para el saludo (ej: "Dr. Jane Smith" → "Dr. Jane Smith")
  const firstName = displayName.split(" ")[0];

  // Determina si el perfil está incompleto (sin especialidad)
  const profileIncomplete = !profile?.specialty;

  return (
    <div className="space-y-8">
      {/* Encabezado de bienvenida */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s an overview of your RehabStack activity.
        </p>
      </div>

      {/* Tarjeta de perfil incompleto — solo visible si falta la especialidad */}
      {profileIncomplete && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              {/* Icono de advertencia */}
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <CardTitle className="text-base text-amber-800">
                  Complete your profile
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Add your specialty to get personalized agent recommendations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">
                {stat.label}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
              <p className="mt-1 text-xs text-neutral-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA: explorar agentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Explore the Marketplace</CardTitle>
          <CardDescription>
            Discover AI agents built specifically for rehabilitation professionals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/agents">
            <Button>Browse Agents</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
