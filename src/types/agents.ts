// src/types/agents.ts
// Tipos TypeScript compartidos para agentes del marketplace.
// Reflejan el esquema de la tabla agents + columnas adicionales.

// Acción rápida tal como se almacena en el campo JSONB quick_actions
export interface QuickAction {
  id: string
  label: string
  icon: string
}

// Tipo de item de trabajo tal como se almacena en work_item_types JSONB
export interface WorkItemType {
  type: string
  description: string
}

// Video de demostración almacenado en el JSONB demo_videos
export interface DemoVideo {
  url: string
  title: string
}

// Captura de pantalla almacenada en el JSONB screenshots
export interface AgentScreenshot {
  url: string
  alt_text: string
}

// Reseña verificada con campos completos para la página de detalle
export interface AgentReview {
  rating: number
  text: string | null
  created_at: string | null
  verified: boolean
}

// Agente completo con joins resueltos — usado en la página de detalle
export interface AgentDetail {
  id: string
  name: string
  slug: string
  tagline: string | null
  short_description: string | null
  description: string | null
  long_description: string | null
  tier: string
  pricing_usd: number | null
  pricing_annual_usd: number | null
  stripe_price_id: string | null
  creator_id: string | null
  creator_name: string | null
  creator_bio: string | null
  creator_verified: boolean
  compliance_badge: boolean
  languages: string[]
  category: string
  model_provider: string | null
  supported_models: string[] | null
  hosting_type: string
  staff_delegation: boolean
  free_trial_enabled: boolean
  hero_image_url: string | null
  demo_videos: DemoVideo[] | null
  screenshots: AgentScreenshot[] | null
  quick_actions: QuickAction[]
  work_item_types: WorkItemType[]
  reviews: AgentReview[]
}

// Agente resumido — usado en AgentCard (sin quick_actions ni reviews completas)
export interface AgentSummary {
  id: string
  name: string
  slug: string
  short_description: string | null
  tier: string
  pricing_usd: number | null
  creator_name: string | null
  compliance_badge: boolean
  languages: string[]
  category: string
  model_provider: string | null
  reviews: Pick<AgentReview, 'rating'>[]
}

// Categorías válidas del marketplace
export type AgentCategory =
  | 'grow-your-practice'
  | 'monetize-expertise'
  | 'find-training'
  | 'documentation'
  | 'treatment-planning'
  | 'outcomes'

// Filtros del marketplace leídos desde searchParams de la URL
export interface MarketplaceFilters {
  q?: string
  category?: string
  language?: string
  provider?: string
  price?: 'free' | '1-29' | '30-59' | '60+'
}

// Mapa de categoría → etiqueta legible + descripción
export const CATEGORY_META: Record<string, { label: string; description: string }> = {
  'grow-your-practice': {
    label: 'Grow Your Practice',
    description: 'Agents that help you attract more patients and grow your referral network.',
  },
  'monetize-expertise': {
    label: 'Monetize Expertise',
    description: 'Turn your clinical knowledge into online courses and digital products.',
  },
  'find-training': {
    label: 'Find Training',
    description: 'Discover continuing education courses, conferences, and certifications.',
  },
  documentation: {
    label: 'Documentation',
    description: 'Streamline clinical documentation and patient record management.',
  },
  'treatment-planning': {
    label: 'Treatment Planning',
    description: 'AI-powered treatment planning and evidence-based protocol recommendations.',
  },
  outcomes: {
    label: 'Outcomes',
    description: 'Track, measure, and demonstrate patient outcomes and clinical results.',
  },
}
