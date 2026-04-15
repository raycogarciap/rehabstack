<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# RehabStack Agent Architecture

## The 3 Platform Agents (hosting_type: managed_anthropic)

### 1. Content Engine
- Category: grow-your-practice
- Purpose: Creates Instagram content packages, VA briefs, testimonial requests
- Quick Actions: Record Voice Note | Upload Photo/Video | Request Testimonial | Create VA Brief
- Work item types: Content Package, VA Brief, Testimonial Request
- Staff delegation: true

### 2. CE Matcher (Continuing Education Matcher)
- Category: find-training
- Purpose: Finds and recommends CE courses, plans conference trips
- Quick Actions: Find Courses | Check Radar | Plan Trip | CE Calendar
- Work item types: Course Recommendation, Trip Proposal, CE Calendar
- Staff delegation: false
- Revenue: 5-10% affiliate commission on referred registrations

### 3. Course Creator
- Category: monetize-expertise
- Purpose: Creates online courses from practitioner expertise
- Quick Actions: Brain Dump | Review Curriculum | Sales Page | Launch Emails
- Work item types: Curriculum Draft, Sales Page, Launch Email Sequence
- Staff delegation: true

## Hosting Types
- managed_anthropic: Anthropic Managed Agents API, creator's API key, session-based
- managed_openai: OpenAI managed agent API (when available)
- creator_hosted: Creator's own API implementing RehabStack Agent API Spec
- self_hosted_package: End-user infrastructure (OpenClaw + NemoClaw, Phase 2)

## The Abstraction Layer (src/lib/agent-runtime.ts)
All agent communication routes through this single file.
Never call agent providers directly from API routes or components.
Input: { agentId, sessionId, message, userId }
Output: ReadableStream (SSE) or structured response

## RehabStack Agent API Spec (for creator_hosted agents)
POST /sessions — create session, receive user profile, return session ID
POST /sessions/{id}/messages — send message, return SSE stream
GET /sessions/{id}/stream — SSE stream
GET /sessions/{id}/history — message history
DELETE /sessions/{id} — terminate session
GET /health — uptime check

## Platform Copilot
- Runs on: Claude Messages API (claude-sonnet-4-6)
- Endpoint: /api/copilot
- System prompt includes: RehabStack knowledge + agent knowledge base doc + user profile + usage data
- NOT embedded in agent session — completely separate API calls
- UI: floating panel bottom-right, different color from main chat

## Commission Structure
- Platform agents (your own): 100% revenue
- managed_anthropic/openai/other: 20-25% commission, creator gets 75-80%
- creator_hosted: 20-25% commission
- self_hosted_package: 10-15% commission

## Anthropic Managed Agents API
Beta header: managed-agents-2026-04-01
Flow: Create agent → Create environment → Start session per user →
      Send events → Stream responses via SSE
Session IDs stored in sessions table as platform_session_id
