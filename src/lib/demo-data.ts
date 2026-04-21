// src/lib/demo-data.ts
// Datos mock compartidos para el showcase: testimonios de practicantes y demos de agentes.
// Importado tanto por showcase/page.tsx como por showcase/demos/[slug]/page.tsx.

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PractitionerResult {
  id: number
  name: string
  specialty: string
  location: string
  flag: string
  agentUsed: string
  agentSlug: string
  agentCategory: string
  agentColor: string
  agentIcon: string
  result: string
  quote: string
  initials: string
  avatarColor: string
  socialLinks: { instagram: string; linkedin: string }
  featured: boolean
}

export interface AgentDemo {
  id: number
  slug: string
  agentName: string
  agentSlug: string
  agentCategory: string
  categoryBadge: string
  badgeColor: string
  badgeBg: string
  videoUrl: string
  title: string
  description: string
  longDescription: string
  datePosted: string
  tags: string[]
}

// ── Practitioner Results ──────────────────────────────────────────────────────

export const PRACTITIONER_RESULTS: PractitionerResult[] = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    specialty: 'Sports Physiotherapist',
    location: 'London, UK',
    flag: '🇬🇧',
    agentUsed: 'Content Engine',
    agentSlug: 'content-engine',
    agentCategory: 'grow-your-practice',
    agentColor: '#4F46E5',
    agentIcon: '✍️',
    result: '3x more patient inquiries in 6 weeks',
    quote:
      'I went from posting once a month to every day. My Instagram following doubled and I get 3x more new patient inquiries than before. The content sounds exactly like me.',
    initials: 'SM',
    avatarColor: '#4F46E5',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: true,
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    specialty: 'Musculoskeletal Chiropractor',
    location: 'Barcelona, Spain',
    flag: '🇪🇸',
    agentUsed: 'CE Concierge',
    agentSlug: 'ce-matcher',
    agentCategory: 'find-training',
    agentColor: '#0EA5E9',
    agentIcon: '🎓',
    result: 'Found 4 relevant courses in first week',
    quote:
      'It found a dry needling masterclass in Berlin I had zero idea existed. Registration closed the next day. I would have missed it completely without CE Concierge.',
    initials: 'CM',
    avatarColor: '#6B9E78',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: true,
  },
  {
    id: 3,
    name: 'Priya Sharma',
    specialty: 'Pelvic Floor Physiotherapist',
    location: 'Melbourne, Australia',
    flag: '🇦🇺',
    agentUsed: 'Course Creator',
    agentSlug: 'course-creator',
    agentCategory: 'monetize-expertise',
    agentColor: '#F59E0B',
    agentIcon: '📚',
    result: 'First course launched in 8 weeks',
    quote:
      'I recorded 6 voice notes during my lunch breaks. Eight weeks later I had a full pelvic floor rehab course ready to sell. I never thought it would be this fast.',
    initials: 'PS',
    avatarColor: '#F59E0B',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: false,
  },
  {
    id: 4,
    name: 'Marco Rossi',
    specialty: 'Osteopath',
    location: 'Milan, Italy',
    flag: '🇮🇹',
    agentUsed: 'Content Engine',
    agentSlug: 'content-engine',
    agentCategory: 'grow-your-practice',
    agentColor: '#4F46E5',
    agentIcon: '✍️',
    result: '2,400 new Instagram followers in 3 months',
    quote:
      'My patients started telling me they saw my posts and finally understood what osteopathy actually does. The educational content has been incredible for my practice.',
    initials: 'MR',
    avatarColor: '#4F46E5',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: false,
  },
  {
    id: 5,
    name: 'Ana Lima',
    specialty: 'Sports Physiotherapist',
    location: 'São Paulo, Brazil',
    flag: '🇧🇷',
    agentUsed: 'CE Concierge',
    agentSlug: 'ce-matcher',
    agentCategory: 'find-training',
    agentColor: '#0EA5E9',
    agentIcon: '🎓',
    result: 'Saved 8 hours per month on course research',
    quote:
      'Finding courses in Brazil that count toward my international certification used to take me a whole weekend. Now CE Concierge does it in minutes and finds options I never knew existed.',
    initials: 'AL',
    avatarColor: '#6B9E78',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: false,
  },
  {
    id: 6,
    name: 'James Okafor',
    specialty: 'Neurological Physiotherapist',
    location: 'Lagos, Nigeria',
    flag: '🇳🇬',
    agentUsed: 'Course Creator',
    agentSlug: 'course-creator',
    agentCategory: 'monetize-expertise',
    agentColor: '#F59E0B',
    agentIcon: '📚',
    result: '€4,200 in first month of course sales',
    quote:
      "I've been treating stroke patients for 14 years. Course Creator helped me turn that expertise into a structured online course in 6 weeks. The first month I made more from the course than a week of clinical work.",
    initials: 'JO',
    avatarColor: '#F59E0B',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: false,
  },
]

// ── Agent Demos ───────────────────────────────────────────────────────────────

export const AGENT_DEMOS: AgentDemo[] = [
  {
    id: 1,
    slug: 'ce-matcher-dry-needling-europe',
    agentName: 'CE Matcher',
    agentSlug: 'ce-matcher',
    agentCategory: 'find-training',
    categoryBadge: 'Find Training',
    badgeColor: '#0EA5E9',
    badgeBg: '#E0F2FE',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'CE Matcher in action: Finding a dry needling course in Europe',
    description:
      'Watch how CE Matcher scans providers across 12 countries, filters by specialty and recertification requirements, and builds a complete trip plan in under 3 minutes.',
    longDescription:
      "In this demonstration, a musculoskeletal physiotherapist based in London uses CE Matcher to find dry needling courses across Europe. The session begins with a simple brief: specialty (dry needling), preferred locations (Spain, Germany, Netherlands), and certification requirements for the UK CSP.\n\nCE Matcher scans 47 course providers across 12 European countries in real time. Within 90 seconds, it returns 8 matching courses with dates, seat availability, pricing, and accreditation status. Three courses are flagged as high-priority based on the practitioner's renewal deadline.\n\nThe second part of the demo shows CE Matcher's trip planning feature. The practitioner selects a course in Amsterdam. CE Matcher immediately generates a full trip plan: flight options from Heathrow, hotel recommendations within walking distance of the venue, total cost estimate (£680 including flights, hotel, and course fee), and a calendar block suggestion.\n\nThe entire workflow — from first message to complete trip plan — takes 4 minutes and 12 seconds.",
    datePosted: 'April 10, 2026',
    tags: ['course-finding', 'dry-needling', 'europe'],
  },
  {
    id: 2,
    slug: 'content-engine-acl-voice-note',
    agentName: 'Content Engine',
    agentSlug: 'content-engine',
    agentCategory: 'grow-your-practice',
    categoryBadge: 'Grow Your Practice',
    badgeColor: '#4F46E5',
    badgeBg: '#EEF2FF',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'Content Engine: From voice note to Instagram carousel in 4 minutes',
    description:
      'A sports physiotherapist records a 2-minute voice note about ACL rehabilitation. Watch what Content Engine produces: carousel, LinkedIn post, video script, and blog draft.',
    longDescription:
      "This demonstration follows a sports physiotherapist who records a 2-minute voice note about ACL rehabilitation protocols following return-to-sport criteria. The voice note is informal, clinical, and unscripted — exactly what you would say to a colleague.\n\nContent Engine processes the voice note and produces a complete content package in under 3 minutes. The package includes: an 8-slide Instagram carousel explaining the ACL rehab timeline with patient-friendly language, a LinkedIn article draft (650 words) targeting other physiotherapists, a 90-second video script for Instagram Reels or TikTok, a blog post draft (1,200 words) optimized for search, and a VA task brief with posting schedule and hashtag recommendations.\n\nThe second part of the demo shows the tone customization feature. The practitioner adjusts the voice from 'educational' to 'conversational' and regenerates the Instagram carousel. The difference is immediate — same clinical content, completely different energy and language.\n\nAll content is generated in English and Spanish simultaneously, since the practitioner has a bilingual following. Total time from voice note to complete bilingual content package: 6 minutes and 40 seconds.",
    datePosted: 'April 3, 2026',
    tags: ['content-creation', 'instagram', 'sports-physio'],
  },
]
