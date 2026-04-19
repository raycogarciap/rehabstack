// src/components/creator/edit-agent-form.tsx
// Formulario de 5 pasos para EDITAR un agente existente en el marketplace RehabStack.
// Client Component: reutiliza la misma estructura de pasos que new-agent-form.tsx,
// pero acepta initialData pre-cargado y envía un PATCH a /api/creator/agents/[id].
// No usa localStorage (no hay borrador en edición).

'use client'

import { useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Constantes de opciones (idénticas a new-agent-form) ─────────────────────

// Categorías disponibles para los agentes
const CATEGORY_OPTIONS = [
  'grow-your-practice',
  'monetize-expertise',
  'find-training',
  'documentation',
  'treatment-planning',
  'outcomes',
] as const

// Idiomas soportados
const LANGUAGE_OPTIONS = ['en', 'es', 'pt', 'fr', 'de', 'ar'] as const

// Labels de idioma para la UI
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'EN', es: 'ES', pt: 'PT', fr: 'FR', de: 'DE', ar: 'AR',
}

// Proveedores de modelos de IA
const MODEL_PROVIDERS = ['Anthropic', 'OpenAI', 'Google', 'Ollama', 'Multi'] as const

// Integraciones disponibles
const INTEGRATION_OPTIONS = [
  'Instagram', 'LinkedIn', 'Google Drive', 'Notion', 'Canva',
  'Buffer', 'Telegram', 'Resend', 'Thinkific',
] as const

// ─── Tipos (mismos que new-agent-form) ───────────────────────────────────────

// Acción rápida que el agente puede ejecutar desde el dashboard
interface QuickAction {
  id: string
  icon: string
  label: string
  prompt: string
}

// Escenario de prueba para validar el comportamiento del agente
interface TestScenario {
  user_message: string
  expected_behavior: string
}

// Forma completa del formulario — refleja la tabla agents de Supabase
export interface AgentFormData {
  // Paso 1 — Información básica
  name: string
  short_description: string
  description: string
  category: string
  pricing_usd: number
  languages: string[]
  demo_video_url: string
  // Paso 2 — Hosting y configuración técnica
  hosting_type: 'managed_anthropic' | 'creator_hosted' | 'self_hosted_package'
  // Campos específicos de managed_anthropic
  anthropic_agent_id: string
  anthropic_environment_id: string
  anthropic_api_key: string
  // Campos específicos de creator_hosted
  api_endpoint: string
  api_key: string
  api_spec_version: string
  // Campos específicos de self_hosted_package
  package_url: string
  deployment_guide_url: string
  supported_models_text: string // CSV, se divide antes de enviar
  // Campos comunes de modelo
  model_provider: string
  min_model_capability: 'cloud_only' | 'cloud_and_local' | 'local_only'
  // Paso 3 — Configuración del dashboard
  quick_actions: QuickAction[]
  work_item_types_text: string // CSV de tipos de trabajo
  staff_delegation: boolean
  relevant_integrations: string[]
  // Paso 4 — Calidad y documentación
  knowledge_base: string
  test_scenarios: TestScenario[]
  known_limitations: string
  compliance_declaration: boolean
}

// ─── Props del componente ────────────────────────────────────────────────────

interface EditAgentFormProps {
  // Datos pre-cargados del agente a editar (mapeados desde Supabase)
  initialData: AgentFormData
  // ID del agente en Supabase — usado para el PATCH /api/creator/agents/[id]
  agentId: string
}

// ─── Componente indicador de progreso ─────────────────────────────────────────

interface StepIndicatorProps {
  current: number
  total: number
  labels: string[]
}

// Círculos numerados conectados por líneas: azul=activo, verde=completado, gris=pendiente
function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isCompleted = step < current
        const isActive = step === current

        return (
          <div key={step} className="flex items-center">
            {/* Círculo numerado */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors
                  ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                  ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                  ${!isCompleted && !isActive ? 'bg-neutral-200 text-neutral-500' : ''}
                `}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? (
                  // Icono de check para pasos completados
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : step}
              </div>
              {/* Etiqueta del paso */}
              <span className={`mt-1 text-xs font-medium hidden sm:block ${isActive ? 'text-blue-700' : 'text-neutral-500'}`}>
                {labels[i]}
              </span>
            </div>
            {/* Línea conectora entre pasos */}
            {step < total && (
              <div
                className={`
                  h-0.5 w-12 mx-1 sm:w-16 transition-colors
                  ${isCompleted ? 'bg-emerald-400' : 'bg-neutral-200'}
                `}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Paso 1: Información básica ───────────────────────────────────────────────

interface Step1Props {
  form: AgentFormData
  updateForm: (updates: Partial<AgentFormData>) => void
  t: ReturnType<typeof useTranslations<'creator.agentForm'>>
}

function Step1({ form, updateForm, t }: Step1Props) {
  // Alterna un idioma en el array languages
  const toggleLanguage = (lang: string) => {
    const current = form.languages
    const updated = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang]
    updateForm({ languages: updated })
  }

  return (
    <div className="space-y-6">
      {/* Nombre del agente */}
      <div className="space-y-1.5">
        <Label htmlFor="agent-name">{t('name')} *</Label>
        <Input
          id="agent-name"
          value={form.name}
          onChange={(e) => updateForm({ name: e.target.value })}
          placeholder="e.g. Clinical Documentation Assistant"
          required
        />
      </div>

      {/* Descripción corta con contador de caracteres */}
      <div className="space-y-1.5">
        <Label htmlFor="agent-short-desc">{t('shortDescription')} *</Label>
        <p className="text-xs text-neutral-500">{t('shortDescriptionHint')}</p>
        <div className="relative">
          <textarea
            id="agent-short-desc"
            value={form.short_description}
            onChange={(e) =>
              updateForm({ short_description: e.target.value.slice(0, 150) })
            }
            rows={2}
            maxLength={150}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground resize-none"
            placeholder="One-line pitch for the marketplace card..."
          />
          {/* Contador de caracteres */}
          <span className="absolute bottom-2 right-3 text-xs text-neutral-400">
            {form.short_description.length}/150
          </span>
        </div>
      </div>

      {/* Descripción completa */}
      <div className="space-y-1.5">
        <Label htmlFor="agent-desc">{t('description')}</Label>
        <textarea
          id="agent-desc"
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          rows={5}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground resize-none"
          placeholder="Full markdown description shown on the agent detail page..."
        />
      </div>

      {/* Categoría */}
      <div className="space-y-1.5">
        <Label htmlFor="agent-category">{t('category')} *</Label>
        <Select
          value={(form.category || undefined) as string | undefined}
          onValueChange={(val) => updateForm({ category: val as string })}
        >
          <SelectTrigger id="agent-category" className="w-full h-9">
            <SelectValue placeholder="Select a category..." />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {/* Convierte kebab-case a Title Case */}
                {cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Precio mensual */}
      <div className="space-y-1.5">
        <Label htmlFor="agent-price">{t('pricingUsd')}</Label>
        <p className="text-xs text-neutral-500">{t('pricingUsdHint')}</p>
        <Input
          id="agent-price"
          type="number"
          min={0}
          step={0.01}
          value={form.pricing_usd}
          onChange={(e) => updateForm({ pricing_usd: parseFloat(e.target.value) || 0 })}
          className="max-w-[160px]"
        />
      </div>

      {/* Idiomas soportados — grid de checkboxes */}
      <div className="space-y-2">
        <Label>{t('languages')}</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => {
            const checked = form.languages.includes(lang)
            return (
              <label
                key={lang}
                className={`
                  flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors
                  ${checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}
                `}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLanguage(lang)}
                  className="sr-only"
                />
                {LANGUAGE_LABELS[lang]}
              </label>
            )
          })}
        </div>
      </div>

      {/* URL del video de demostración (opcional) */}
      <div className="space-y-1.5">
        <Label htmlFor="agent-demo">{t('demoVideoUrl')}</Label>
        <Input
          id="agent-demo"
          type="url"
          value={form.demo_video_url}
          onChange={(e) => updateForm({ demo_video_url: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
    </div>
  )
}

// ─── Paso 2: Cómo se ejecuta ──────────────────────────────────────────────────

interface Step2Props {
  form: AgentFormData
  updateForm: (updates: Partial<AgentFormData>) => void
  t: ReturnType<typeof useTranslations<'creator.agentForm'>>
}

function Step2({ form, updateForm, t }: Step2Props) {
  // Opciones de hosting con estado habilitado/deshabilitado
  const HOSTING_OPTIONS: Array<{
    value: AgentFormData['hosting_type'] | 'managed_openai'
    label: string
    desc: string
    disabled?: boolean
  }> = [
    { value: 'managed_anthropic', label: t('managedAnthropicLabel'), desc: t('managedAnthropicDesc') },
    { value: 'managed_openai', label: t('managedOpenaiLabel'), desc: t('managedOpenaiDesc'), disabled: true },
    { value: 'creator_hosted', label: t('creatorHostedLabel'), desc: t('creatorHostedDesc') },
    { value: 'self_hosted_package', label: t('selfHostedLabel'), desc: t('selfHostedDesc') },
  ]

  return (
    <div className="space-y-6">
      {/* Selector de tipo de hosting en tarjetas clickeables */}
      <div className="space-y-2">
        <Label>{t('hostingType')} *</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {HOSTING_OPTIONS.map((opt) => {
            const isSelected = form.hosting_type === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  if (!opt.disabled && opt.value !== 'managed_openai') {
                    updateForm({ hosting_type: opt.value as AgentFormData['hosting_type'] })
                  }
                }}
                className={`
                  flex flex-col gap-1 rounded-xl border p-4 text-left transition-all
                  ${opt.disabled ? 'cursor-not-allowed opacity-50 bg-neutral-50' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/40'}
                  ${isSelected && !opt.disabled ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-neutral-200'}
                `}
                aria-pressed={isSelected && !opt.disabled}
              >
                <span className="flex items-center gap-2 font-medium text-sm text-neutral-900">
                  {/* Indicador de selección (radio visual) */}
                  <span
                    className={`
                      flex h-4 w-4 items-center justify-center rounded-full border-2
                      ${isSelected && !opt.disabled ? 'border-blue-600 bg-blue-600' : 'border-neutral-300'}
                    `}
                    aria-hidden="true"
                  >
                    {isSelected && !opt.disabled && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  {opt.label}
                </span>
                <span className="text-xs text-neutral-500 ml-6">{opt.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Campos dinámicos según el tipo de hosting seleccionado */}
      {form.hosting_type === 'managed_anthropic' && (
        <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Anthropic Managed Agent — Credentials
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="anthropic-agent-id">{t('anthropicAgentId')}</Label>
            <Input
              id="anthropic-agent-id"
              value={form.anthropic_agent_id}
              onChange={(e) => updateForm({ anthropic_agent_id: e.target.value })}
              placeholder="agent_..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anthropic-env-id">{t('anthropicEnvironmentId')}</Label>
            <Input
              id="anthropic-env-id"
              value={form.anthropic_environment_id}
              onChange={(e) => updateForm({ anthropic_environment_id: e.target.value })}
              placeholder="env_..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anthropic-api-key">{t('anthropicApiKey')}</Label>
            <Input
              id="anthropic-api-key"
              type="password"
              value={form.anthropic_api_key}
              onChange={(e) => updateForm({ anthropic_api_key: e.target.value })}
              placeholder="sk-ant-..."
            />
          </div>
        </div>
      )}

      {form.hosting_type === 'creator_hosted' && (
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            Creator-Hosted API — Endpoint Details
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="api-endpoint">{t('apiEndpoint')}</Label>
            <Input
              id="api-endpoint"
              type="url"
              value={form.api_endpoint}
              onChange={(e) => updateForm({ api_endpoint: e.target.value })}
              placeholder="https://api.example.com/v1/agent"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="api-key">{t('apiKey')}</Label>
            <Input
              id="api-key"
              type="password"
              value={form.api_key}
              onChange={(e) => updateForm({ api_key: e.target.value })}
              placeholder="Bearer token or API key..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="api-spec">{t('apiSpecVersion')}</Label>
            <Input
              id="api-spec"
              value={form.api_spec_version}
              onChange={(e) => updateForm({ api_spec_version: e.target.value })}
              placeholder="v1.0"
            />
          </div>
        </div>
      )}

      {form.hosting_type === 'self_hosted_package' && (
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            Self-Hosted Package — Distribution Details
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="package-url">{t('packageUrl')}</Label>
            <Input
              id="package-url"
              type="url"
              value={form.package_url}
              onChange={(e) => updateForm({ package_url: e.target.value })}
              placeholder="https://github.com/your-org/agent/releases/..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deploy-guide">{t('deploymentGuideUrl')}</Label>
            <Input
              id="deploy-guide"
              type="url"
              value={form.deployment_guide_url}
              onChange={(e) => updateForm({ deployment_guide_url: e.target.value })}
              placeholder="https://docs.example.com/deploy"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supported-models">{t('supportedModels')}</Label>
            <Input
              id="supported-models"
              value={form.supported_models_text}
              onChange={(e) => updateForm({ supported_models_text: e.target.value })}
              placeholder="claude-3-5-sonnet, gpt-4o, llama-3.1"
            />
          </div>
        </div>
      )}

      {/* Proveedor de modelo */}
      <div className="space-y-1.5">
        <Label htmlFor="model-provider">{t('modelProvider')}</Label>
        <Select
          value={(form.model_provider || undefined) as string | undefined}
          onValueChange={(val) => updateForm({ model_provider: val as string })}
        >
          <SelectTrigger id="model-provider" className="w-full max-w-xs h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_PROVIDERS.map((mp) => (
              <SelectItem key={mp} value={mp}>{mp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Capacidad mínima del modelo requerida */}
      <div className="space-y-2">
        <Label>{t('modelCapability')}</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          {(
            [
              ['cloud_only', t('capabilityCloudOnly')],
              ['cloud_and_local', t('capabilityBoth')],
              ['local_only', t('capabilityLocalOnly')],
            ] as const
          ).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="min_model_capability"
                value={val}
                checked={form.min_model_capability === val}
                onChange={() => updateForm({ min_model_capability: val })}
                className="accent-blue-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Paso 3: Configuración del dashboard ──────────────────────────────────────

interface Step3Props {
  form: AgentFormData
  updateForm: (updates: Partial<AgentFormData>) => void
  t: ReturnType<typeof useTranslations<'creator.agentForm'>>
}

function Step3({ form, updateForm, t }: Step3Props) {
  // Genera un ID único para nuevas acciones rápidas
  const uid = useId()

  // Agrega una nueva acción rápida vacía (máximo 4)
  const addAction = () => {
    if (form.quick_actions.length >= 4) return
    const newAction: QuickAction = {
      id: `${uid}-${Date.now()}`,
      icon: '',
      label: '',
      prompt: '',
    }
    updateForm({ quick_actions: [...form.quick_actions, newAction] })
  }

  // Elimina una acción rápida por su ID
  const removeAction = (id: string) => {
    updateForm({ quick_actions: form.quick_actions.filter((a) => a.id !== id) })
  }

  // Actualiza un campo de una acción rápida específica
  const updateAction = (id: string, field: keyof QuickAction, value: string) => {
    updateForm({
      quick_actions: form.quick_actions.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    })
  }

  // Alterna una integración en el array relevant_integrations
  const toggleIntegration = (integration: string) => {
    const current = form.relevant_integrations
    const updated = current.includes(integration)
      ? current.filter((i) => i !== integration)
      : [...current, integration]
    updateForm({ relevant_integrations: updated })
  }

  return (
    <div className="space-y-8">
      {/* Constructor de acciones rápidas */}
      <div className="space-y-3">
        <div>
          <Label>{t('quickActions')}</Label>
          <p className="mt-0.5 text-xs text-neutral-500">{t('quickActionsDesc')}</p>
        </div>

        {/* Lista de acciones configuradas */}
        <div className="space-y-3">
          {form.quick_actions.map((action, idx) => (
            <div
              key={action.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                  Action {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeAction(action.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  {t('removeAction')}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
                {/* Campo de emoji/icono */}
                <div className="space-y-1">
                  <Label htmlFor={`action-icon-${action.id}`}>{t('actionIcon')}</Label>
                  <Input
                    id={`action-icon-${action.id}`}
                    value={action.icon}
                    onChange={(e) => updateAction(action.id, 'icon', e.target.value.slice(0, 2))}
                    placeholder="📝"
                    maxLength={2}
                    className="text-center text-lg"
                  />
                </div>
                {/* Etiqueta del botón */}
                <div className="space-y-1">
                  <Label htmlFor={`action-label-${action.id}`}>{t('actionLabel')}</Label>
                  <Input
                    id={`action-label-${action.id}`}
                    value={action.label}
                    onChange={(e) => updateAction(action.id, 'label', e.target.value)}
                    placeholder="Generate SOAP Note"
                  />
                </div>
              </div>
              {/* Prompt que se envía al agente */}
              <div className="space-y-1">
                <Label htmlFor={`action-prompt-${action.id}`}>{t('actionPrompt')}</Label>
                <textarea
                  id={`action-prompt-${action.id}`}
                  value={action.prompt}
                  onChange={(e) => updateAction(action.id, 'prompt', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                  placeholder="Generate a SOAP note for my last patient session..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Botón para agregar acción (deshabilitado al llegar a 4) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAction}
          disabled={form.quick_actions.length >= 4}
        >
          + {t('addAction')}
        </Button>
      </div>

      {/* Tipos de items de trabajo */}
      <div className="space-y-1.5">
        <Label htmlFor="work-item-types">{t('workItemTypes')}</Label>
        <p className="text-xs text-neutral-500">{t('workItemTypesHint')}</p>
        <Input
          id="work-item-types"
          value={form.work_item_types_text}
          onChange={(e) => updateForm({ work_item_types_text: e.target.value })}
          placeholder="Content Package, VA Brief, SOAP Note, Exercise Plan"
        />
      </div>

      {/* Toggle de delegación a staff */}
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4">
        <input
          id="staff-delegation"
          type="checkbox"
          checked={form.staff_delegation}
          onChange={(e) => updateForm({ staff_delegation: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-blue-600 cursor-pointer"
        />
        <div>
          <label htmlFor="staff-delegation" className="text-sm font-medium text-neutral-900 cursor-pointer">
            {t('staffDelegation')}
          </label>
          <p className="text-xs text-neutral-500 mt-0.5">{t('staffDelegationDesc')}</p>
        </div>
      </div>

      {/* Grid de integraciones relevantes */}
      <div className="space-y-2">
        <Label>{t('integrations')}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {INTEGRATION_OPTIONS.map((integration) => {
            const checked = form.relevant_integrations.includes(integration)
            return (
              <label
                key={integration}
                className={`
                  flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors
                  ${checked ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}
                `}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleIntegration(integration)}
                  className="h-4 w-4 accent-blue-600"
                />
                {integration}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Paso 4: Calidad y documentación ─────────────────────────────────────────

interface Step4Props {
  form: AgentFormData
  updateForm: (updates: Partial<AgentFormData>) => void
  t: ReturnType<typeof useTranslations<'creator.agentForm'>>
}

function Step4({ form, updateForm, t }: Step4Props) {
  // Agrega un nuevo escenario de prueba vacío
  const addScenario = () => {
    updateForm({
      test_scenarios: [
        ...form.test_scenarios,
        { user_message: '', expected_behavior: '' },
      ],
    })
  }

  // Elimina un escenario de prueba por índice
  const removeScenario = (idx: number) => {
    const updated = form.test_scenarios.filter((_, i) => i !== idx)
    updateForm({ test_scenarios: updated })
  }

  // Actualiza un campo de un escenario de prueba específico
  const updateScenario = (idx: number, field: keyof TestScenario, value: string) => {
    updateForm({
      test_scenarios: form.test_scenarios.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      ),
    })
  }

  return (
    <div className="space-y-8">
      {/* Base de conocimiento en Markdown */}
      <div className="space-y-1.5">
        <Label htmlFor="knowledge-base">{t('knowledgeBase')}</Label>
        <p className="text-xs text-neutral-500">{t('knowledgeBaseHint')}</p>
        <textarea
          id="knowledge-base"
          value={form.knowledge_base}
          onChange={(e) => updateForm({ knowledge_base: e.target.value })}
          rows={8}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-mono outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground placeholder:font-sans resize-y"
          placeholder="# Agent Knowledge Base&#10;&#10;## Specialties&#10;- Physical therapy&#10;- Sports rehabilitation..."
        />
      </div>

      {/* Constructor de escenarios de prueba */}
      <div className="space-y-3">
        <div>
          <Label>{t('testScenarios')}</Label>
          <p className="mt-0.5 text-xs text-neutral-500">{t('testScenariosDesc')}</p>
        </div>

        {form.test_scenarios.map((scenario, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Scenario {idx + 1}
              </span>
              {/* Solo permite eliminar si quedan más de 1 escenario */}
              <button
                type="button"
                onClick={() => removeScenario(idx)}
                disabled={form.test_scenarios.length <= 1}
                className="text-xs text-red-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('removeTestScenario')}
              </button>
            </div>
            {/* Mensaje del usuario de prueba */}
            <div className="space-y-1">
              <Label htmlFor={`scenario-msg-${idx}`}>{t('userMessage')}</Label>
              <Input
                id={`scenario-msg-${idx}`}
                value={scenario.user_message}
                onChange={(e) => updateScenario(idx, 'user_message', e.target.value)}
                placeholder="Generate a SOAP note for shoulder impingement patient..."
              />
            </div>
            {/* Comportamiento esperado del agente */}
            <div className="space-y-1">
              <Label htmlFor={`scenario-behavior-${idx}`}>{t('expectedBehavior')}</Label>
              <textarea
                id={`scenario-behavior-${idx}`}
                value={scenario.expected_behavior}
                onChange={(e) => updateScenario(idx, 'expected_behavior', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                placeholder="Agent should produce a properly formatted SOAP note with S, O, A, P sections..."
              />
            </div>
          </div>
        ))}

        {/* Botón para agregar escenario */}
        <Button type="button" variant="outline" size="sm" onClick={addScenario}>
          + {t('addTestScenario')}
        </Button>

        {/* Advertencia si hay menos de 3 escenarios */}
        {form.test_scenarios.length < 3 && (
          <p className="text-xs text-amber-600 font-medium">
            ⚠ Al menos 3 escenarios son requeridos antes de guardar.
          </p>
        )}
      </div>

      {/* Limitaciones conocidas */}
      <div className="space-y-1.5">
        <Label htmlFor="known-limitations">{t('knownLimitations')}</Label>
        <textarea
          id="known-limitations"
          value={form.known_limitations}
          onChange={(e) => updateForm({ known_limitations: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
          placeholder="This agent does not support multi-session memory. Best suited for single-encounter documentation..."
        />
      </div>

      {/* Declaración de cumplimiento — obligatoria para guardar */}
      <label className="flex items-start gap-3 rounded-xl border-2 border-neutral-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
        <input
          type="checkbox"
          checked={form.compliance_declaration}
          onChange={(e) => updateForm({ compliance_declaration: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-blue-600"
        />
        <span className="text-sm text-neutral-700">
          {t('complianceDeclaration')}
        </span>
      </label>
    </div>
  )
}

// ─── Paso 5: Vista previa y guardar cambios ───────────────────────────────────

interface Step5Props {
  form: AgentFormData
  t: ReturnType<typeof useTranslations<'creator.agentForm'>>
  // Callback de guardado — diferente al submit del nuevo agente
  onSave: () => void
  saving: boolean
}

function Step5({ form, t, onSave, saving }: Step5Props) {
  // Badge del tipo de hosting
  const HOSTING_LABELS: Record<string, string> = {
    managed_anthropic: 'Managed Anthropic',
    creator_hosted: 'Creator Hosted',
    self_hosted_package: 'Self Hosted',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-neutral-900">{t('previewTitle')}</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Así es como aparecerá tu agente en el marketplace de RehabStack.
        </p>
      </div>

      {/* Tarjeta de vista previa del marketplace */}
      <Card className="max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            {/* Badge de categoría */}
            {form.category && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                {form.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            )}
            {/* Badge de hosting */}
            <span className="text-xs font-medium text-neutral-500">
              {HOSTING_LABELS[form.hosting_type] ?? form.hosting_type}
            </span>
          </div>
          {/* Nombre del agente */}
          <CardTitle className="mt-2 text-base font-semibold text-neutral-900">
            {form.name || <span className="text-neutral-400 italic">Agent name...</span>}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Descripción corta */}
          <p className="line-clamp-2 text-sm text-neutral-600">
            {form.short_description || <span className="text-neutral-400 italic">Short description...</span>}
          </p>

          {/* Idiomas seleccionados */}
          {form.languages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600"
                >
                  {LANGUAGE_LABELS[lang] ?? lang.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {/* Precio */}
          <p className="text-sm font-semibold text-neutral-900">
            {form.pricing_usd > 0 ? `$${form.pricing_usd}/mo` : 'Free'}
          </p>
        </CardContent>
      </Card>

      {/* Resumen de los datos del formulario */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm text-neutral-700">
        <p><span className="font-medium">Hosting:</span> {HOSTING_LABELS[form.hosting_type]}</p>
        <p><span className="font-medium">Model Provider:</span> {form.model_provider}</p>
        <p>
          <span className="font-medium">Quick Actions:</span>{' '}
          {form.quick_actions.length > 0
            ? form.quick_actions.map((a) => a.label).join(', ')
            : 'None'}
        </p>
        <p>
          <span className="font-medium">Test Scenarios:</span>{' '}
          <span className={form.test_scenarios.length < 3 ? 'text-amber-600 font-semibold' : ''}>
            {form.test_scenarios.length} defined
            {form.test_scenarios.length < 3 ? ' (minimum 3 required)' : ''}
          </span>
        </p>
        <p>
          <span className="font-medium">Compliance Declaration:</span>{' '}
          <span className={form.compliance_declaration ? 'text-emerald-600' : 'text-red-600'}>
            {form.compliance_declaration ? 'Signed ✓' : 'Not signed — required'}
          </span>
        </p>
      </div>

      {/* Botón de guardar cambios — reemplaza "Submit for Review" */}
      <Button
        type="button"
        onClick={onSave}
        disabled={saving || !form.compliance_declaration || form.test_scenarios.length < 3}
        className="w-full"
      >
        {/* Muestra "Guardando..." mientras se procesa el PATCH */}
        {saving ? t('submitting') : t('saveChanges')}
      </Button>

      {/* Advertencias de bloqueo */}
      {!form.compliance_declaration && (
        <p className="text-xs text-red-600 text-center">
          Debes marcar la declaración de cumplimiento en el Paso 4 para guardar.
        </p>
      )}
    </div>
  )
}

// ─── Componente principal del formulario de edición ──────────────────────────

export function EditAgentForm({ initialData, agentId }: EditAgentFormProps) {
  // Traducciones del namespace del formulario de agente
  const t = useTranslations('creator.agentForm')
  // Router para navegación programática tras guardar
  const router = useRouter()

  // Estado del paso actual (1–5)
  const [step, setStep] = useState(1)
  // Estado del formulario inicializado con los datos existentes del agente
  const [form, setForm] = useState<AgentFormData>(initialData)
  // Estado de carga durante el guardado
  const [saving, setSaving] = useState(false)
  // Estado de éxito tras guardar los cambios
  const [saved, setSaved] = useState(false)

  // Actualiza campos del formulario parcialmente
  const updateForm = (updates: Partial<AgentFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  // Valida los campos requeridos del Paso 1 antes de avanzar
  const validateStep1 = (): boolean => {
    return form.name.trim().length > 0 && form.category.trim().length > 0
  }

  // Avanza al siguiente paso con validación del paso 1
  const goNext = () => {
    if (step === 1 && !validateStep1()) {
      alert('El nombre del agente y la categoría son obligatorios.')
      return
    }
    setStep((s) => Math.min(s + 1, 5))
  }

  // Retrocede al paso anterior
  const goPrev = () => setStep((s) => Math.max(s - 1, 1))

  // Envía los cambios al API route del creador via PATCH
  const handleSave = async () => {
    setSaving(true)
    try {
      // Construir el payload procesando los campos CSV antes de enviar
      const payload = {
        name: form.name,
        short_description: form.short_description,
        description: form.description,
        category: form.category,
        pricing_usd: form.pricing_usd,
        languages: form.languages,
        demo_video_url: form.demo_video_url || undefined,
        hosting_type: form.hosting_type,
        model_provider: form.model_provider,
        min_model_capability: form.min_model_capability,
        staff_delegation: form.staff_delegation,
        quick_actions: form.quick_actions,
        work_item_types: form.work_item_types_text
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        relevant_integrations: form.relevant_integrations,
        knowledge_base: form.knowledge_base,
        test_scenarios: form.test_scenarios,
        known_limitations: form.known_limitations,
        compliance_declaration: form.compliance_declaration,
        // Campos específicos según el tipo de hosting
        ...(form.hosting_type === 'managed_anthropic' && {
          anthropic_agent_id: form.anthropic_agent_id,
          anthropic_environment_id: form.anthropic_environment_id,
          anthropic_api_key: form.anthropic_api_key,
        }),
        ...(form.hosting_type === 'creator_hosted' && {
          api_endpoint: form.api_endpoint,
          api_key: form.api_key,
          api_spec_version: form.api_spec_version,
        }),
        ...(form.hosting_type === 'self_hosted_package' && {
          package_url: form.package_url,
          deployment_guide_url: form.deployment_guide_url,
          supported_models: form.supported_models_text
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }

      // PATCH al endpoint específico del agente — diferente a POST del nuevo agente
      const res = await fetch(`/api/creator/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save')

      // Muestra el estado de éxito sin limpiar localStorage (no hay borrador en edición)
      setSaved(true)
    } catch (e) {
      console.error('Error al guardar los cambios del agente:', e)
      alert('Error al guardar los cambios. Por favor, inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // Etiquetas de los pasos para el indicador de progreso
  const stepLabels = [
    t('step1Title'),
    t('step2Title'),
    t('step3Title'),
    t('step4Title'),
    t('step5Title'),
  ]

  // ── Estado de éxito tras guardar los cambios ───────────────────────────────
  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
        {/* Icono de éxito */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-10 w-10 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-2">
          {/* Mensaje de confirmación de cambios guardados */}
          <h2 className="text-2xl font-bold text-neutral-900">{t('changesSavedTitle')}</h2>
          <p className="text-neutral-600 max-w-sm">{t('changesSavedMessage')}</p>
        </div>
        {/* Botón para volver al listado de agentes del creador */}
        <Button onClick={() => router.push('/creator/agents')}>
          {t('backToAgents')}
        </Button>
      </div>
    )
  }

  // ── Formulario multi-paso ──────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl">
      {/* Indicador de pasos */}
      <StepIndicator current={step} total={5} labels={stepLabels} />

      {/* Encabezado del paso actual */}
      <div className="mb-6">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          {t('stepOf', { current: step, total: 5 })}
        </p>
        <h2 className="text-xl font-bold text-neutral-900 mt-0.5">
          {stepLabels[step - 1]}
        </h2>
      </div>

      {/* Contenido del paso actual */}
      <div className="mb-8">
        {step === 1 && <Step1 form={form} updateForm={updateForm} t={t} />}
        {step === 2 && <Step2 form={form} updateForm={updateForm} t={t} />}
        {step === 3 && <Step3 form={form} updateForm={updateForm} t={t} />}
        {step === 4 && <Step4 form={form} updateForm={updateForm} t={t} />}
        {step === 5 && (
          <Step5 form={form} t={t} onSave={handleSave} saving={saving} />
        )}
      </div>

      {/* Navegación entre pasos: Anterior / Siguiente */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        {/* Botón Anterior — oculto en el paso 1 */}
        <Button
          type="button"
          variant="outline"
          onClick={goPrev}
          disabled={step === 1}
          className={step === 1 ? 'invisible' : ''}
        >
          {t('previous')}
        </Button>

        {/* Indicador textual de progreso */}
        <span className="text-xs text-neutral-400 hidden sm:block">
          {t('stepOf', { current: step, total: 5 })}
        </span>

        {/* Botón Siguiente — oculto en el paso 5 (donde está el botón de Guardar) */}
        {step < 5 ? (
          <Button type="button" onClick={goNext}>
            {t('next')}
          </Button>
        ) : (
          // Espacio vacío para mantener el layout en el paso 5
          <div />
        )}
      </div>
    </div>
  )
}
