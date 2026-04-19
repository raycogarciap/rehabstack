# Creator Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the complete Creator Dashboard for RehabStack — the /creator/* section for users with role='creator' to manage and monetize their AI agents.

**Architecture:** Protected routes under /[locale]/creator/*. Layout uses a left sidebar (similar to dashboard). Role check in layout redirects non-creators to /creator/onboarding. All data from Supabase with RLS ensuring creators only see their own data.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, next-intl, Supabase, Stripe Connect, recharts

---

### Task 1: Translations — Add creator.* keys to all 6 locale files

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/es.json`
- Modify: `src/messages/pt.json`
- Modify: `src/messages/fr.json`
- Modify: `src/messages/de.json`
- Modify: `src/messages/ar.json`

Add a top-level `creator` key with all strings needed by the creator dashboard pages.

Structure:
```json
"creator": {
  "onboarding": {
    "metaTitle": "Become a Creator | RehabStack",
    "title": "Become a Creator",
    "subtitle": "Share your expertise with rehab professionals worldwide.",
    "step1Title": "Agree to Terms",
    "step2Title": "Connect Stripe",
    "step3Title": "You're a Creator!",
    "termsHeading": "Creator Agreement",
    "termsList": ["...", "..."],
    "agreeButton": "I Agree — Continue",
    "connectStripe": "Connect with Stripe",
    "connectStripeDesc": "We use Stripe to send you payouts. You'll be redirected to Stripe to set up your account.",
    "connectingStripe": "Connecting...",
    "successTitle": "You're a creator!",
    "successMessage": "Your account is ready. Welcome to the RehabStack creator community.",
    "goToDashboard": "Go to my dashboard",
    "terms": [
      "You retain full ownership of your agent's intellectual property.",
      "RehabStack takes 20-25% commission on managed agent subscriptions.",
      "Agents must comply with RehabStack quality and compliance standards.",
      "Patient data must never be stored in your agent's backend.",
      "You are responsible for keeping your agent's knowledge base up to date.",
      "RehabStack may pause or delist agents that violate terms.",
      "Payouts are processed monthly via Stripe Connect."
    ]
  },
  "nav": {
    "overview": "Overview",
    "myAgents": "My Agents",
    "newAgent": "New Agent",
    "revenue": "Revenue",
    "docs": "Docs",
    "settings": "Settings",
    "title": "Creator Dashboard",
    "backToMarketplace": "Back to Marketplace"
  },
  "overview": {
    "metaTitle": "Creator Dashboard | RehabStack",
    "metaDescription": "Manage your AI agents, track subscribers, and monitor revenue.",
    "title": "Creator Dashboard",
    "totalAgents": "Total Agents",
    "activeSubscribers": "Active Subscribers",
    "revenueMtd": "Revenue MTD",
    "revenueAllTime": "All-Time Revenue",
    "agentStatus": "Agent Status",
    "noAgentsTitle": "List your first agent",
    "noAgentsDesc": "Create an AI agent and share it with thousands of rehab professionals.",
    "createAgent": "Create Agent",
    "statusDraft": "Draft",
    "statusInReview": "In Review",
    "statusActive": "Active",
    "statusPaused": "Paused",
    "statusDelisted": "Delisted"
  },
  "agents": {
    "metaTitle": "My Agents | Creator Dashboard",
    "title": "My Agents",
    "addNew": "Add New Agent",
    "empty": "No agents yet",
    "emptyDesc": "Create your first AI agent to start earning.",
    "columns": {
      "name": "Agent Name",
      "status": "Status",
      "subscribers": "Subscribers",
      "revenue": "MRR",
      "rating": "Rating",
      "actions": "Actions"
    },
    "actions": {
      "edit": "Edit",
      "pause": "Pause",
      "activate": "Activate",
      "viewListing": "View Listing"
    }
  },
  "agentForm": {
    "step1Title": "Basic Info",
    "step2Title": "How It Runs",
    "step3Title": "Dashboard Config",
    "step4Title": "Quality & Docs",
    "step5Title": "Preview & Submit",
    "name": "Agent Name",
    "shortDescription": "Short Description",
    "shortDescriptionHint": "Max 150 characters. Shown in marketplace cards.",
    "description": "Full Description",
    "category": "Category",
    "pricingUsd": "Monthly Price (USD)",
    "pricingUsdHint": "Set to 0 for free agents.",
    "languages": "Supported Languages",
    "demoVideoUrl": "Demo Video URL (optional)",
    "hostingType": "Hosting Type",
    "hostingTypes": {
      "managed_anthropic": "Anthropic Managed Agents",
      "managed_anthropic_desc": "Runs on Anthropic's infrastructure. Provide your agent ID and API key.",
      "managed_openai": "OpenAI Managed Agents (coming soon)",
      "managed_openai_desc": "OpenAI managed agent hosting — not yet available.",
      "creator_hosted": "Creator-Hosted API",
      "creator_hosted_desc": "You provide a REST API endpoint implementing the RehabStack Agent API Spec.",
      "self_hosted_package": "Self-Hosted Package",
      "self_hosted_package_desc": "Users run the agent on their own infrastructure."
    },
    "anthropicAgentId": "Anthropic Agent ID",
    "anthropicEnvironmentId": "Anthropic Environment ID",
    "anthropicApiKey": "Anthropic API Key",
    "apiEndpoint": "API Endpoint URL",
    "apiKey": "API Key",
    "apiSpecVersion": "API Spec Version",
    "packageUrl": "Package URL",
    "deploymentGuideUrl": "Deployment Guide URL",
    "supportedModels": "Supported Models (comma-separated)",
    "modelProvider": "Model Provider",
    "modelCapability": "Model Capability",
    "modelCapabilities": {
      "cloud_only": "Cloud Only",
      "cloud_and_local": "Cloud & Local",
      "local_only": "Local Only"
    },
    "quickActions": "Quick Actions",
    "quickActionsDesc": "Up to 4 actions users can launch from their dashboard.",
    "addAction": "Add Action",
    "removeAction": "Remove",
    "actionIcon": "Icon",
    "actionLabel": "Label",
    "actionPrompt": "Prompt sent to agent",
    "workItemTypes": "Work Item Types",
    "workItemTypesHint": "Comma-separated tags (e.g. Content Package, VA Brief)",
    "staffDelegation": "Enable Staff Delegation",
    "staffDelegationDesc": "Allow practitioners to delegate tasks to staff members.",
    "integrations": "Relevant Integrations",
    "knowledgeBase": "Knowledge Base Document",
    "knowledgeBaseHint": "Markdown. This is loaded into the agent's context to ground responses.",
    "testScenarios": "Test Scenarios (min. 3)",
    "testScenariosDesc": "Describe how the agent should respond to specific inputs.",
    "userMessage": "User message",
    "expectedBehavior": "Expected behavior",
    "addTestScenario": "Add Scenario",
    "removeTestScenario": "Remove",
    "knownLimitations": "Known Limitations",
    "complianceDeclaration": "I declare this agent does not store patient PHI and complies with RehabStack's quality standards.",
    "previewTitle": "Marketplace Preview",
    "submit": "Submit for Review",
    "submitDesc": "Your agent will be reviewed within 24 hours.",
    "saveChanges": "Save Changes",
    "submitting": "Submitting...",
    "successTitle": "Agent submitted!",
    "successMessage": "Your agent is in review. We'll notify you within 24 hours.",
    "backToAgents": "Back to My Agents",
    "previous": "Previous",
    "next": "Next",
    "stepOf": "Step {current} of {total}"
  },
  "revenue": {
    "metaTitle": "Revenue | Creator Dashboard",
    "title": "Revenue",
    "chart": "Monthly Revenue",
    "table": "Agent Revenue Breakdown",
    "payoutHistory": "Payout History",
    "managePayouts": "Manage Payouts (Stripe)",
    "columns": {
      "agent": "Agent",
      "subscribers": "Subscribers",
      "mrr": "MRR",
      "totalEarned": "Total Earned"
    },
    "noData": "No revenue data yet.",
    "noPayouts": "No payouts yet."
  },
  "settings": {
    "metaTitle": "Settings | Creator Dashboard",
    "title": "Settings",
    "profileSection": "Creator Profile",
    "displayName": "Display Name",
    "bio": "Bio",
    "bioHint": "Short bio shown on your agent listings.",
    "website": "Website URL",
    "saveProfile": "Save Profile",
    "stripeSection": "Stripe Connect",
    "stripeConnected": "Connected",
    "stripeNotConnected": "Not connected",
    "managePayouts": "Manage Payouts",
    "dangerZone": "Danger Zone",
    "pauseAll": "Pause All My Agents",
    "pauseAllDesc": "This will pause all your active agents immediately.",
    "pauseAllConfirm": "Are you sure? This will pause all your active agents.",
    "saving": "Saving..."
  },
  "docs": {
    "metaTitle": "Creator Docs | RehabStack",
    "title": "Agent Creator Documentation",
    "subtitle": "Everything you need to build and list AI agents on RehabStack.",
    "fullDocs": "View Full Documentation"
  }
}
```

### Task 2: Middleware — Add /creator/* protection

**Files:**
- Modify: `src/middleware.ts`

Add `creator` to the `isProtected` check alongside `dashboard` and `admin`. The role-based redirect (creator → onboarding) will be handled in the layout, not the middleware. Middleware only enforces authentication.

### Task 3: Onboarding Page

**Files:**
- Create: `src/app/[locale]/creator/onboarding/page.tsx`
- Create: `src/components/creator/connect-stripe-button.tsx`

The onboarding page is a Server Component with a Client Component for the Stripe Connect button.

Visual 3-step progress indicator at the top.

Step states determined by URL params and user data:
- `?success=true` → show Step 3 (done state)
- Default → show Step 1 (terms) then Step 2 (connect Stripe) based on `stripe_connect_id` in user profile

Server component fetches user profile from Supabase to check `stripe_connect_id`.

### Task 4: Creator Layout

**Files:**
- Create: `src/app/[locale]/creator/layout.tsx`
- Create: `src/components/creator/creator-sidebar-nav.tsx`

Layout does auth + role check:
1. If not authenticated → redirect to /[locale]/login
2. If authenticated but role !== 'creator' → redirect to /[locale]/creator/onboarding

Sidebar has: Overview, My Agents, New Agent, Revenue, Docs, Settings
Uses `Link` and `usePathname` from `@/i18n/navigation` (locale-aware).
Top bar has title + LocaleSwitcher.
Mobile responsive (hamburger menu like dashboard sidebar).

### Task 5: API Routes

**Files:**
- Create: `src/app/api/creator/agents/route.ts`
- Create: `src/app/api/creator/agents/[id]/route.ts`
- Create: `src/app/api/creator/revenue/route.ts`

`/api/creator/agents`:
- GET: returns creator's agents where creator_id = user.id
- POST: creates new agent, status='in_review', saves connection_config + quick_actions as JSONB

`/api/creator/agents/[id]`:
- GET: single agent (must be owned by creator)
- PATCH: update agent fields
- DELETE: set status='delisted'

`/api/creator/revenue`:
- GET: join subscriptions with agents where creator_id = user.id
- Group by agent, calculate MRR = sum of pricing_usd for active subscriptions
- Return per-agent breakdown + monthly totals

All routes require auth and check creator role.

### Task 6: Creator Overview Page

**Files:**
- Create: `src/app/[locale]/creator/page.tsx`

Stats: Total agents listed, Active subscribers, Revenue MTD, Revenue all-time.
Agent status list with badges.
Empty state CTA if no agents.
Fetches from Supabase: agents where creator_id = user.id + subscriptions joined.

### Task 7: Creator Agents List Page

**Files:**
- Create: `src/app/[locale]/creator/agents/page.tsx`

Table with columns: name, status, subscribers, revenue, rating, actions.
Status badges with color coding.
Actions: Edit (→ /creator/agents/[id]/edit), Pause/Activate (PATCH via fetch), View Listing (→ /agents/[category]/[slug]).
"Add New Agent" button.
Empty state.

### Task 8: New Agent Multi-Step Form

**Files:**
- Create: `src/app/[locale]/creator/agents/new/page.tsx`

5-step form. All state in React (useState). Save to localStorage on every change.
Step navigation: "Previous" / "Next" buttons. Cannot advance without required fields.

Steps as defined in the spec. Submit POSTs to /api/creator/agents.
On success, show success message with link to agents list.

### Task 9: Agent Edit Page

**Files:**
- Create: `src/app/[locale]/creator/agents/[id]/edit/page.tsx`

Server Component fetches agent by ID (must be owned by creator).
Passes data to Client Component (same form as new, pre-filled).
On submit, PATCHes /api/creator/agents/[id].

### Task 10: Revenue Page

**Files:**
- Create: `src/app/[locale]/creator/revenue/page.tsx`

Bar chart using recharts (monthly revenue).
Table: agent name, subscribers, MRR, total earned.
"Manage Payouts" button → POST /api/stripe/portal then redirect.

### Task 11: Settings Page

**Files:**
- Create: `src/app/[locale]/creator/settings/page.tsx`

Creator profile form: display name, bio, website.
Stripe Connect status card.
Danger zone: pause all agents button (calls PATCH on each agent).

### Task 12: Docs Page

**Files:**
- Create: `src/app/[locale]/creator/docs/page.tsx`

Static content: RehabStack Agent API Spec.
Sections: Overview, Hosting Types, API Endpoints (POST /sessions, etc.), Quick Actions format, Test Scenarios guide.
Code examples for creator_hosted.
Link to /docs.
