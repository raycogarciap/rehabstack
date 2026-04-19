// src/app/[locale]/creator/agents/[id]/edit/page.tsx
// Página de edición de agente existente — /[locale]/creator/agents/[id]/edit
// Server Component: obtiene el agente de Supabase (con verificación de propiedad),
// mapea los campos de BD a AgentFormData y pasa los datos al EditAgentForm.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { EditAgentForm, type AgentFormData } from '@/components/creator/edit-agent-form'

// ── Props de la página ────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string; id: string }>
}

// ── Metadata dinámica ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'creator.agentForm' })
  return {
    title: `${t('saveChanges')} — Edit Agent | RehabStack`,
    description: 'Edit and update your AI agent on the RehabStack marketplace.',
  }
}

// ── Página principal ──────────────────────────────────────────────────────────

export default async function EditAgentPage({ params }: Props) {
  const { id } = await params

  // Crear cliente Supabase del lado del servidor con contexto de autenticación SSR
  const supabase = await createClient()

  // Obtener el usuario autenticado actual para verificar la propiedad del agente
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si no hay sesión activa, redirigir a la página 404 (la middleware maneja auth)
  if (!user) {
    notFound()
  }

  // Obtener el agente verificando que pertenezca al creador autenticado
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id) // verificación de propiedad — impide editar agentes ajenos
    .single()

  // Si no existe el agente o no pertenece a este creador → 404
  if (!agent) {
    notFound()
  }

  // ── Mapear campos de BD a AgentFormData ─────────────────────────────────────
  // connection_config es un JSONB en Supabase que almacena las credenciales
  // según el tipo de hosting. Se deserializa aquí en el Server Component.
  const connConfig = (agent.connection_config as Record<string, string>) ?? {}

  // Convertir work_item_types (array en BD) a texto CSV para el formulario
  const workItemTypesArray = (agent.work_item_types as string[]) ?? []

  // Convertir supported_models (array en BD) a texto CSV para el formulario
  const supportedModelsArray = (connConfig.supported_models as unknown as string[]) ?? []

  // Datos iniciales pre-cargados con la información existente del agente
  const initialData: AgentFormData = {
    // ── Paso 1: Información básica ─────────────────────────────────────────
    name: agent.name ?? '',
    short_description: agent.short_description ?? '',
    description: agent.description ?? '',
    category: agent.category ?? '',
    pricing_usd: agent.pricing_usd ?? 0,
    languages: (agent.languages as string[]) ?? [],
    // demo_video_url no se almacena como columna separada — valor vacío por defecto
    demo_video_url: '',

    // ── Paso 2: Hosting y configuración técnica ────────────────────────────
    hosting_type: (agent.hosting_type as AgentFormData['hosting_type']) ?? 'managed_anthropic',

    // Credenciales de Anthropic Managed Agent (desde connection_config JSONB)
    anthropic_agent_id: connConfig.agent_id ?? '',
    anthropic_environment_id: connConfig.environment_id ?? '',
    anthropic_api_key: connConfig.api_key ?? '',

    // Credenciales de API creator-hosted (desde connection_config JSONB)
    api_endpoint: connConfig.endpoint ?? '',
    // api_key puede venir del campo compartido o específico de creator_hosted
    api_key: connConfig.api_key ?? '',
    api_spec_version: connConfig.spec_version ?? '',

    // Datos del paquete self-hosted (desde connection_config JSONB)
    package_url: connConfig.package_url ?? '',
    deployment_guide_url: connConfig.deployment_guide_url ?? '',
    // Convertir array de modelos soportados a CSV para el input de texto
    supported_models_text: supportedModelsArray.join(', '),

    // Configuración del modelo de IA
    model_provider: agent.model_provider ?? 'Anthropic',
    min_model_capability: (agent.min_model_capability as AgentFormData['min_model_capability']) ?? 'cloud_only',

    // ── Paso 3: Configuración del dashboard ───────────────────────────────
    quick_actions: (agent.quick_actions as AgentFormData['quick_actions']) ?? [],
    // Convertir array de tipos de trabajo a CSV para el input de texto
    work_item_types_text: workItemTypesArray.join(', '),
    staff_delegation: agent.staff_delegation ?? false,
    relevant_integrations: (agent.relevant_integrations as string[]) ?? [],

    // ── Paso 4: Calidad y documentación ───────────────────────────────────
    knowledge_base: agent.knowledge_base ?? '',
    test_scenarios: (agent.test_scenarios as AgentFormData['test_scenarios']) ?? [
      { user_message: '', expected_behavior: '' },
    ],
    known_limitations: agent.known_limitations ?? '',
    // La declaración de cumplimiento requiere re-confirmación en cada edición
    compliance_declaration: false,
  }

  return (
    <div className="py-8 px-4 sm:px-6">
      {/* Encabezado de la página de edición */}
      <div className="mx-auto max-w-2xl mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">
          Edit Agent
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Updating: <span className="font-medium text-neutral-700">{agent.name}</span>
        </p>
      </div>

      {/* Formulario de edición pre-cargado con los datos existentes del agente */}
      <EditAgentForm initialData={initialData} agentId={id} />
    </div>
  )
}
