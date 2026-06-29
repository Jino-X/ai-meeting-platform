# AI Meeting Intelligence Platform — System Architecture

## 1. Executive Summary

This document describes the high-level architecture for the AI Meeting Intelligence Platform, a multi-tenant SaaS application that enables teams to record, transcribe, summarize, and act on meetings. The system is designed to support 100,000+ users and millions of meeting records through horizontal scaling, async processing, and a clear separation between real-time collaboration and background AI workflows.

---

## 2. Architectural Principles

| Principle | Description |
|-----------|-------------|
| **Multi-tenancy** | All data is scoped to an `Organization`. Row-level security and query filtering enforce tenant isolation. |
| **AI-first workflows** | Recording upload and real-time transcription trigger async job pipelines for AI summarization, action-item extraction, and analytics. |
| **Security by default** | RBAC, encrypted secrets, rate limiting, audit logs, and OWASP-aligned input handling. |
| **Observability** | Sentry for error tracking, PostHog for product analytics, and structured logging throughout. |
| **Scalability** | Stateless Next.js API + serverless functions, Redis-backed queues, and object storage for large media files. |
| **Developer experience** | TypeScript-first, monorepo-style Next.js app, Prisma ORM, and tRPC/REST hybrid APIs. |

---

## 3. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Client Layer                            │
│  Next.js 16 App Router  •  React 19  •  TailwindCSS 4  •  shadcn/ui  │
│       Server Components  |  Client Components  |  TanStack Query     │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ HTTPS / tRPC / REST
┌────────────────────────────────────▼────────────────────────────────┐
│                          Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  App Router  │  │  tRPC        │  │  Server Actions          │   │
│  │  Route       │  │  Procedures  │  │  (forms, auth, invites)   │   │
│  │  Handlers    │  │              │  │                          │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘   │
│         └─────────────────┴──────────────────────┘                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Services Layer (business logic, tenant scoping, RBAC)        │   │
│  └──────────────────────────────────┬──────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       │                             │                             │
┌──────▼──────┐  ┌───────────────▼──────┐  ┌────────────────────▼──┐
│  PostgreSQL │  │  Redis              │  │  AWS S3               │
│  (Prisma)   │  │  (BullMQ + cache)   │  │  (recordings/assets)  │
└─────────────┘  └──────────────────────┘  └───────────────────────┘
       │                             │
       │  ┌──────────────────────────┘
       │  │
┌──────▼──▼────────┐  ┌──────────────────┐  ┌────────────────────┐
│  AI Workers      │  │  Notification    │  │  Analytics/Monitoring│
│  (BullMQ)        │  │  Workers         │  │  • Sentry          │
│  • Transcription │  │  • Email         │  │  • PostHog         │
│  • Summarization │  │  • Slack         │  │  • Audit logs      │
│  • Action items  │  │  • In-app        │  │                    │
│  • Sentiment     │  │                  │  │                    │
└──────────────────┘  └──────────────────┘  └────────────────────┘
```

---

## 4. Runtime Components

### 4.1 Next.js Application
- **Server Components** for data-heavy pages (dashboards, meeting lists, analytics).
- **Client Components** for interactive surfaces (Kanban, recording player, forms).
- **Route Handlers** for REST endpoints and webhooks (Stripe, Slack, Zoom, Google Meet).
- **Server Actions** for mutations triggered from forms and shadcn/ui dialogs.
- **tRPC router** for type-safe internal API consumption.

### 4.2 Background Workers (BullMQ on Redis)
| Queue | Purpose | Worker |
|---|---|---|
| `transcription` | Extract audio, send to Whisper, store `TranscriptSegment` rows | `transcription.worker.ts` |
| `summarization` | Build executive summary, key points, risks, decisions | `summarization.worker.ts` |
| `action-items` | Extract tasks, owners, due dates, priorities | `action-items.worker.ts` |
| `sentiment` | Run sentiment analysis per segment and overall | `sentiment.worker.ts` |
| `notifications` | Send email, Slack, and in-app notifications | `notification.worker.ts` |
| `analytics` | Roll up metrics into materialized aggregates | `analytics.worker.ts` |
| `webhooks` | Deliver outbound webhooks to customer endpoints | `webhook.worker.ts` |

### 4.3 AI Agents
Each agent is a focused worker function with a deterministic prompt and JSON-mode output.

1. **Transcript Cleaner** — normalizes speaker labels, punctuation, and filler words.
2. **Meeting Summarizer** — produces executive summary, key points, risks, decisions, next steps.
3. **Action Item Extractor** — extracts structured tasks with owner, due date, priority, status.
4. **Risk Detection Agent** — flags deadlines, scope changes, budget risks, and blockers.
5. **Sentiment Analysis Agent** — scores sentiment per segment and overall meeting.
6. **Decision Tracking Agent** — extracts decisions with context and decider.

---

## 5. Data Flow — Meeting Lifecycle

```
1. User schedules or records a meeting
        ↓
2. Meeting + Recording rows created in PostgreSQL
        ↓
3. Recording file uploaded to S3; S3 event published
        ↓
4. transcription job enqueued (BullMQ + Redis)
        ↓
5. Worker extracts audio → Whisper API → TranscriptSegment rows
        ↓
6. On completion, dependent jobs enqueued:
   • summarization
   • action-items
   • sentiment
   • decision-tracking
   • analytics-rollup
   • notifications
        ↓
7. User views meeting page with transcript, summary, tasks, sentiment
        ↓
8. Analytics dashboard updated via materialized aggregates
```

---

## 6. Multi-Tenancy & Security Model

- **Tenant isolation**: Every table contains `organizationId`. All service-layer functions receive `organizationId` and filter queries accordingly.
- **Membership roles**: `OWNER`, `ADMIN`, `MANAGER`, `EMPLOYEE`.
- **RBAC**: Permission checks live in `src/lib/permissions.ts` and are enforced in both UI and API.
- **API keys**: `ApiKey` table scoped to an organization with fine-grained scopes (`read:meetings`, `write:tasks`, etc.).
- **Audit logs**: Every create/update/delete on sensitive tables writes to `AuditLog`.
- **Secrets**: AI keys, Stripe, OAuth, and S3 credentials stored in environment variables / Vercel secrets / AWS Secrets Manager.

---

## 7. External Integrations

| Service | Integration Type | Purpose |
|---|---|---|
| OpenAI Whisper | HTTP API | Audio transcription |
| OpenAI GPT / Gemini | HTTP API | Summarization, action items, sentiment, risks |
| Auth.js | Next.js library | OAuth (Google, GitHub) + email + magic link |
| Stripe | HTTP API + webhooks | Subscriptions and billing |
| AWS S3 | SDK | Recording and asset storage |
| Pusher / WebSockets | SDK | Real-time transcript updates and notifications |
| Slack | OAuth + webhooks | Notifications and commands |
| Zoom / Google Meet / Teams | OAuth + APIs | Calendar/connect imports |
| Sentry | SDK | Error monitoring |
| PostHog | SDK | Product analytics |

---

## 8. Deployment Architecture

```
                       ┌─────────────┐
                       │   Vercel    │
                       │  (Next.js)  │
                       └──────┬──────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
    ┌──────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐
    │  PostgreSQL │    │    Redis     │   │   AWS S3    │
    │  (RDS/Supa) │    │  (Upstash/   │   │  (storage)  │
    │             │    │   ElastiCache)│   │             │
    └─────────────┘    └─────────────┘   └─────────────┘
           │                  │
           └────────┬─────────┘
                    │
           ┌────────▼────────┐
           │  BullMQ Workers │
           │  (Docker/Fargate)│
           └─────────────────┘
```

- **Vercel** hosts the Next.js app with auto-scaling and edge functions.
- **PostgreSQL** on RDS or Supabase with read replicas for analytics.
- **Redis** on Upstash or ElastiCache for BullMQ and caching.
- **AWS S3** for recordings and generated exports.
- **BullMQ workers** packaged as Docker containers on ECS/Fargate or Railway.

---

## 9. Scalability Considerations

- **Object storage**: Audio/video files never touch the Next.js filesystem; they stream directly to S3 via presigned URLs.
- **Async AI**: All AI operations are queue-based, retriable, and idempotent.
- **Database**: Prisma connection pooling via PgBouncer; read replicas for analytics; indexes on `organizationId`, `createdAt`, `status`.
- **Caching**: Redis caches user sessions, dashboard aggregates, and recent transcripts.
- **Code splitting**: Heavy components (recording player, analytics charts) are lazy-loaded.
- **Streaming**: Summary generation is streamed to the client where possible using Server-Sent Events.

---

## 10. Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS 4, shadcn/ui, Framer Motion |
| State | TanStack Query, React Hook Form, Zod, Zustand (where needed) |
| Backend | Next.js Route Handlers, Server Actions, tRPC |
| Database | PostgreSQL, Prisma ORM |
| Auth | Auth.js (Google, GitHub, email, magic link) |
| AI | OpenAI Whisper, GPT-4o / Gemini |
| Realtime | WebSockets, Pusher |
| Storage | AWS S3 |
| Queue | BullMQ + Redis |
| Monitoring | Sentry, PostHog |
| Deployment | Vercel, AWS, Docker |
