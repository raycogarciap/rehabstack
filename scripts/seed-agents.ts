// scripts/seed-agents.ts
// Script de semilla para insertar los 3 agentes de plataforma de RehabStack.
// Usa la clave service_role de Supabase para saltarse las políticas RLS.
// Ejecutar con: npx tsx scripts/seed-agents.ts
//
// NOTA: Este script es para desarrollo/staging.
// En producción, los agentes se gestionan desde el panel de admin.

import { createClient } from '@supabase/supabase-js'

// Valida las variables de entorno requeridas antes de ejecutar
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'ERROR: Variables de entorno requeridas no están definidas.\n' +
    'Ejecuta: npx dotenv -e .env.local -- tsx scripts/seed-agents.ts',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const platformAgents = [
  {
    name: 'Content Engine',
    slug: 'content-engine',
    short_description:
      'Create Instagram posts, VA briefs, and testimonial requests from voice notes or photos in minutes.',
    description:
      'Content Engine helps physical therapists and rehabilitation professionals build a consistent social media presence without spending hours on content creation. Upload a voice note describing a patient win (anonymized), a before/after photo, or a clinical tip — and Content Engine produces a complete Instagram content package with captions, hashtags, and posting schedule. It also generates VA briefs so your virtual assistant can execute the plan, and sends personalized testimonial requests to patients on your behalf.',
    tier: 'professional',
    pricing_usd: 49,
    creator_id: null,
    creator_name: 'RehabStack',
    compliance_badge: true,
    languages: ['en', 'es', 'pt'],
    category: 'grow-your-practice',
    model_provider: 'Anthropic',
    supported_models: ['claude-sonnet-4-6', 'claude-opus-4-6'],
    min_model_capability: 'sonnet',
    status: 'active',
    hosting_type: 'managed_anthropic',
    staff_delegation: true,
    stripe_price_id: null,
    quick_actions: [
      { id: 'voice-note',  label: 'Record Voice Note',   icon: 'mic' },
      { id: 'photo-video', label: 'Upload Photo/Video',  icon: 'camera' },
      { id: 'testimonial', label: 'Request Testimonial', icon: 'star' },
      { id: 'va-brief',    label: 'Create VA Brief',     icon: 'clipboard' },
    ],
    work_item_types: [
      {
        type: 'Content Package',
        description: 'A complete social media content package with captions and hashtags',
      },
      {
        type: 'VA Brief',
        description: 'Detailed instructions for your virtual assistant to execute content tasks',
      },
      {
        type: 'Testimonial Request',
        description: 'Personalized testimonial request messages for your patients',
      },
    ],
    relevant_integrations: [
      { name: 'Instagram', type: 'social' },
      { name: 'Google Drive', type: 'storage' },
    ],
    connection_config: {},
  },
  {
    name: 'CE Matcher',
    slug: 'ce-matcher',
    short_description:
      'Find continuing education courses, plan conference trips, and stay on top of your CE calendar.',
    description:
      'CE Matcher is your AI-powered continuing education advisor. It searches a curated database of PT, OT, and rehab CE courses and conferences, matches them to your specialty, license renewal requirements, and learning goals, and builds a recommended calendar. Planning to attend a conference? CE Matcher creates a full trip proposal including flight windows, hotel options, and a session-by-session schedule. It also tracks your CE hours and sends reminders before license renewal deadlines.',
    tier: 'starter',
    pricing_usd: 29,
    creator_id: null,
    creator_name: 'RehabStack',
    compliance_badge: true,
    languages: ['en', 'es', 'pt'],
    category: 'find-training',
    model_provider: 'Anthropic',
    supported_models: ['claude-sonnet-4-6'],
    min_model_capability: 'sonnet',
    status: 'active',
    hosting_type: 'managed_anthropic',
    staff_delegation: false,
    stripe_price_id: null,
    quick_actions: [
      { id: 'find-courses', label: 'Find Courses',  icon: 'search' },
      { id: 'check-radar',  label: 'Check Radar',   icon: 'radar' },
      { id: 'plan-trip',    label: 'Plan Trip',      icon: 'map-pin' },
      { id: 'ce-calendar',  label: 'CE Calendar',    icon: 'calendar' },
    ],
    work_item_types: [
      {
        type: 'Course Recommendation',
        description: 'Personalized CE course recommendations based on your specialty and license state',
      },
      {
        type: 'Trip Proposal',
        description: 'Complete conference trip plan with flights, hotels, and conference schedule',
      },
      {
        type: 'CE Calendar',
        description: 'Organized calendar of upcoming CE requirements and renewal deadlines',
      },
    ],
    relevant_integrations: [
      { name: 'Google Calendar', type: 'calendar' },
    ],
    connection_config: {},
  },
  {
    name: 'Course Creator',
    slug: 'course-creator',
    short_description:
      'Transform your clinical expertise into an online course with curriculum, sales page, and launch emails.',
    description:
      'Course Creator turns your years of clinical experience into a sellable online course — without requiring you to know anything about instructional design. Start with a Brain Dump: talk or type out everything you know about a topic. Course Creator organizes it into a structured curriculum with modules, lessons, and learning objectives. It then writes a high-converting sales page and a complete pre-launch email sequence. Built for rehabilitation professionals who want to create a revenue stream beyond patient care hours.',
    tier: 'professional',
    pricing_usd: 59,
    creator_id: null,
    creator_name: 'RehabStack',
    compliance_badge: false,
    languages: ['en', 'es', 'pt'],
    category: 'monetize-expertise',
    model_provider: 'Anthropic',
    supported_models: ['claude-sonnet-4-6', 'claude-opus-4-6'],
    min_model_capability: 'sonnet',
    status: 'active',
    hosting_type: 'managed_anthropic',
    staff_delegation: true,
    stripe_price_id: null,
    quick_actions: [
      { id: 'brain-dump',         label: 'Brain Dump',         icon: 'brain' },
      { id: 'review-curriculum',  label: 'Review Curriculum',  icon: 'book-open' },
      { id: 'sales-page',         label: 'Sales Page',         icon: 'megaphone' },
      { id: 'launch-emails',      label: 'Launch Emails',      icon: 'mail' },
    ],
    work_item_types: [
      {
        type: 'Curriculum Draft',
        description: 'Complete course curriculum with modules, lessons, and learning objectives',
      },
      {
        type: 'Sales Page',
        description: 'High-converting sales page copy for your online course',
      },
      {
        type: 'Launch Email Sequence',
        description: 'Pre-launch and launch email sequence to sell your course',
      },
    ],
    relevant_integrations: [
      { name: 'Teachable', type: 'lms' },
      { name: 'Kajabi', type: 'lms' },
      { name: 'Mailchimp', type: 'email' },
    ],
    connection_config: {},
  },
]

async function seed() {
  console.log('Seeding platform agents…')

  const { data, error } = await supabase
    .from('agents')
    .upsert(platformAgents, { onConflict: 'slug' })
    .select('id, name, slug')

  if (error) {
    console.error('Error seeding agents:', error.message)
    process.exit(1)
  }

  console.log('Seeded agents:')
  data?.forEach((a) => console.log(`  ✓ ${a.name} (${a.id}) — /agents/${a.slug}`))
  console.log('Done.')
}

seed()
