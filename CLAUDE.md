# RehabStack — Claude Code Context

## Project
RehabStack is an AI agent marketplace for physical therapy and
rehabilitation professionals. Entity: Soulistica LLC (California),
DBA "RehabStack". Deployed at rehabstack.vercel.app.

## Current Status
- Phase 1 complete: Next.js 16, Supabase auth, dashboard, Vercel deploy
- Phase 2 in progress: Building agent management dashboard and marketplace

## Tech Stack
- Framework: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- UI: shadcn/ui components
- Database: Supabase (PostgreSQL + RLS + Storage)
- Auth: Supabase Auth (email, magic link — Google OAuth Phase 2)
- Payments: Stripe (Checkout, Billing, Connect, Tax)
- Hosting: Vercel (GitHub auto-deploy from master branch)
- Email: Resend
- SMS: Twilio (launch), WhatsApp Business (Phase 2)
- Analytics: PostHog
- Errors: Sentry
- Rate limiting: Upstash Redis
- AI agents: Anthropic Managed Agents API (beta header: managed-agents-2026-04-01)
- Platform Copilot: Claude Messages API (claude-sonnet-4-6)
- AI Website Assistant: multi-provider (ASSISTANT_AI_PROVIDER env var: "anthropic" → claude-sonnet-4-6, "openai" → gpt-4o-mini); abstraction in src/lib/assistant-llm.ts

## Coding Rules — Never Break These
- Always TypeScript, never plain JavaScript
- Server Components by default, Client Components only when needed
- Use Supabase SSR helpers (@supabase/ssr) — never client-only
- All Stripe operations server-side only
- Never expose API keys in client code
- All secrets in environment variables only
- generateMetadata() on every page
- Mobile-responsive from the start (Tailwind responsive classes)
- i18n from day one: next-intl with locale prefix routing
- Supported locales: en, es, pt, fr, de, ar (scalable — adding locale = adding JSON file only)
- Button + Link pattern: wrap Button inside Link, never use asChild prop

## Architecture Decisions
- Agent abstraction layer: ALL agent calls go through src/lib/agent-runtime.ts
- Routing by hosting_type: managed_anthropic | managed_openai | creator_hosted | self_hosted_package
- Dashboard is identical for all agents — data-driven via agent JSONB fields
- Platform Copilot is SEPARATE from the agent (different API calls, different UI)
- Work items auto-created when agent produces structured output
- Rate limiting: Upstash Redis (10/min, 60/hr, 200/day per user)

## Database Tables
- users: id, email, name, specialty, location, language, role (user/creator/admin), subscription_tier, created_at
- agents: Full Universal Agent Listing Schema — structured columns + JSONB for quick_actions, connection_config, work_item_types, relevant_integrations
- subscriptions: user_id, agent_id, stripe_subscription_id, stripe_customer_id, status, created_at
- sessions: user_id, agent_id, platform_session_id, hosting_type, status, token_usage_estimate, created_at
- work_items: user_id, agent_id, session_id, type, title, content (JSONB), tags[], status, created_at
- showcases: user_id, agent_id, photo_url, practitioner_name, specialty, location, social_links (JSONB), testimonial_text, testimonial_video_url, metrics (JSONB), featured, approved, created_at
- courses: provider_name, title, specialty, location, dates, seats_total, seats_remaining, language, url, affiliate_link, price_usd, created_at
- reviews: user_id, agent_id, rating (1-5), text, verified, created_at
- notifications: user_id, agent_id, type, message, read, created_at
- team_members: owner_user_id, member_user_id, agent_id, role (clinician/staff), status (active/invited/disabled), created_at
- usage_counters: user_id, agent_id, period, message_count, content_generations, session_hours, created_at

## API Routes
- /api/auth/* — Supabase auth callbacks, signout
- /api/agents/* — Agent CRUD, listing, filtering
- /api/agents/[id]/activate — Creates session via agent-runtime.ts
- /api/agents/[id]/message — Sends message, streams SSE response
- /api/agents/[id]/session — Session management
- /api/work-items/* — Work item CRUD
- /api/showcase/* — Showcase submission and retrieval
- /api/stripe/* — Webhooks (subscription events, Connect payouts)
- /api/stripe/checkout — Create checkout session
- /api/copilot — Platform Copilot endpoint (Claude Messages API)
- /api/assistant — AI Website Assistant (Claude Messages API)
- /api/courses/* — CE course queries
- /api/notifications/* — Notification management
- /api/creator/* — Creator dashboard data, agent listing submission
- /api/admin/* — Admin panel operations

## Site Map
Public: /, /agents, /agents/[category], /agents/[category]/[slug],
/showcase, /for-creators, /pricing, /blog, /blog/[slug],
/community, /docs, /about, /contact

User Dashboard: /dashboard, /dashboard/agents, /dashboard/agents/[id],
/dashboard/showcase, /dashboard/account, /dashboard/help

Creator Dashboard: /creator, /creator/agents, /creator/agents/new,
/creator/agents/[id]/edit, /creator/revenue, /creator/docs, /creator/settings

Admin: /admin, /admin/review-queue, /admin/agents, /admin/users,
/admin/revenue, /admin/reports

## Agent Management Dashboard (/dashboard/agents/[id])
Layout: sidebar nav + main content area + quick actions bar + message input
Sidebar sections: Chat, Work, Channels, Integrations, Team, Settings, Usage
Quick Actions: dynamic from agent's quick_actions JSONB (up to 4)
Platform Copilot: floating panel bottom-right, separate from agent chat
All sections generic — agent-specific content comes from database fields only

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL,
STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET,
ANTHROPIC_API_KEY, OPENAI_API_KEY, ASSISTANT_AI_PROVIDER,
RESEND_API_KEY, TWILIO_ACCOUNT_SID,
TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, SENTRY_DSN

## Key Files
- src/lib/agent-runtime.ts — Agent abstraction layer (route by hosting_type)
- src/lib/supabase/client.ts — Browser client
- src/lib/supabase/server.ts — Server client
- src/middleware.ts — Auth + session refresh (deprecated — rename to proxy.ts in Next.js 16)
- supabase/migrations/ — Database migrations

## Blog Image Upload Workflow

Supabase Storage bucket: `blog` (public, 5 MB limit, JPEG/PNG/WebP/GIF/SVG)
Public URL format: `https://gspbimlphifgmijrxmwk.supabase.co/storage/v1/object/public/blog/[filename]`

To insert an image into a blog post:
1. Copy the image file to `public/blog-images/` (gitignored — staging only)
2. Tell Claude Code: "upload [filename] to Supabase blog bucket and insert into [post-slug].mdx before section [section-name]"
3. Claude Code will:
   a. Read the file from `public/blog-images/[filename]`
   b. Upload it to Supabase Storage bucket `blog` via MCP (`mcp__supabase` tools or Storage API)
   c. Construct the public URL: `https://gspbimlphifgmijrxmwk.supabase.co/storage/v1/object/public/blog/[filename]`
   d. Edit the MDX file to insert `![alt text](url)` at the correct location
4. After confirming the URL works, delete the local file from `public/blog-images/`

Supported formats: JPEG, PNG, WebP, GIF, SVG. Max size: 5 MB per file.
