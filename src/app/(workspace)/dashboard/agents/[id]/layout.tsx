// src/app/(workspace)/dashboard/agents/[id]/layout.tsx
// Layout raíz del workspace del agente — Server Component.
// No hereda el layout del dashboard (route group separado).
// Fetchea los datos del agente desde Supabase y los provee via AgentWorkspaceShell.
// Si id === "mock", usa un agente hardcodeado para testing sin BD.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentWorkspaceShell, type AgentData } from "@/lib/agent-context";

// Agente de prueba — no requiere BD ni suscripción
const MOCK_AGENT: AgentData = {
  id: "mock",
  name: "Content Engine (Demo)",
  category: "grow-your-practice",
  hosting_type: "creator_hosted",
  quick_actions: [
    { label: "Record Voice Note", prompt: "I want to create content from a voice note. Please guide me." },
    { label: "Upload Photo/Video", prompt: "I have a photo or video I want to build content around." },
    { label: "Request Testimonial", prompt: "Help me craft a testimonial request to send to a patient." },
    { label: "Create VA Brief", prompt: "Create a virtual assistant brief for social media content creation." },
  ],
  platform_agent_id: null,
};

export const metadata: Metadata = {
  title: "Agent Workspace | RehabStack",
};

export default async function AgentWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let agent: AgentData;

  if (id === "mock") {
    // Modo demo: no requiere auth ni BD
    agent = MOCK_AGENT;
  } else {
    // Modo producción: requiere auth y agente en BD
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data } = await supabase
      .from("agents")
      .select("id, name, category, hosting_type, quick_actions, platform_agent_id")
      .eq("id", id)
      .single();

    if (!data) redirect("/dashboard/agents");
    agent = data as AgentData;
  }

  return <AgentWorkspaceShell agent={agent}>{children}</AgentWorkspaceShell>;
}
