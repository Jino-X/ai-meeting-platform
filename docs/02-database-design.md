# AI Meeting Intelligence Platform — Database Design

## 1. Overview

This document defines the Prisma ORM schema for the AI Meeting Intelligence Platform. The schema supports multi-tenant SaaS isolation, role-based access, meetings, recordings, transcripts, AI-generated summaries, tasks, notifications, billing, audit logs, API keys, and webhooks.

All data is scoped to an `Organization` via `organizationId` foreign keys. Prisma Client extensions or service-layer functions enforce tenant filtering.

---

## 2. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────────────────
// Identity & Organizations
// ─────────────────────────────────────────────────────────────

enum Role {
  SUPER_ADMIN
  OWNER
  ADMIN
  MANAGER
  EMPLOYEE
}

enum MembershipStatus {
  ACTIVE
  INVITED
  DISABLED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  passwordHash  String? // For email/password login
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  memberships   Membership[]
  ownedOrgs     Organization[] @relation("OrganizationOwner")
  createdTasks  Task[]         @relation("TaskCreator")
  assignedTasks Task[]         @relation("TaskAssignee")
  actionItems   ActionItem[]
  notifications Notification[]
  auditLogs     AuditLog[]
  apiKeys       ApiKey[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logoUrl     String?
  plan        Plan     @default(FREE)
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner        User             @relation("OrganizationOwner", fields: [ownerId], references: [id])
  memberships  Membership[]
  meetings     Meeting[]
  recordings   Recording[]
  transcripts  Transcript[]
  summaries    Summary[]
  actionItems  ActionItem[]
  tasks        Task[]
  notifications Notification[]
  subscriptions Subscription[]
  auditLogs    AuditLog[]
  apiKeys      ApiKey[]
  webhooks     Webhook[]

  @@index([slug])
}

model Membership {
  id             String           @id @default(cuid())
  organizationId String
  userId         String
  role           Role             @default(EMPLOYEE)
  status         MembershipStatus @default(ACTIVE)
  invitedById    String?
  joinedAt       DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}

// ─────────────────────────────────────────────────────────────
// Meetings & Media
// ─────────────────────────────────────────────────────────────

enum MeetingStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum MeetingSource {
  MANUAL
  ZOOM
  GOOGLE_MEET
  TEAMS
  UPLOAD
}

model Meeting {
  id             String        @id @default(cuid())
  organizationId String
  title          String
  description    String?       @db.Text
  participants   String[] // Array of email strings
  scheduledAt    DateTime?
  duration       Int? // minutes
  status         MeetingStatus @default(SCHEDULED)
  source         MeetingSource   @default(MANUAL)
  externalId     String? // Zoom/Google Meet meeting ID
  recordingUrl   String?
  transcriptId   String?       @unique
  summaryId      String?       @unique
  createdById    String
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization  Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  recordings    Recording[]
  transcript    Transcript?     @relation(fields: [transcriptId], references: [id])
  summary       Summary?        @relation(fields: [summaryId], references: [id])
  actionItems   ActionItem[]
  tasks         Task[]
  auditLogs     AuditLog[]

  @@index([organizationId, status])
  @@index([organizationId, scheduledAt])
  @@index([organizationId, createdAt])
}

enum RecordingStatus {
  PENDING
  PROCESSING
  READY
  FAILED
}

model Recording {
  id             String          @id @default(cuid())
  organizationId String
  meetingId    String
  status         RecordingStatus @default(PENDING)
  storageKey     String // S3 key
  fileName       String
  mimeType       String
  sizeBytes      Int
  durationSeconds Int?
  transcriptionJobId String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  meeting      Meeting      @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  @@index([organizationId, meetingId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────
// Transcripts & AI Outputs
// ─────────────────────────────────────────────────────────────

enum TranscriptStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model Transcript {
  id             String           @id @default(cuid())
  organizationId String
  meetingId      String?          @unique
  status         TranscriptStatus @default(PENDING)
  language       String?          @default("en")
  fullText       String?          @db.Text
  wordCount      Int?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  meeting      Meeting?             @relation(fields: [meetingId], references: [id])
  segments     TranscriptSegment[]
  summary      Summary?

  @@index([organizationId, status])
}

model TranscriptSegment {
  id             String   @id @default(cuid())
  organizationId String
  transcriptId   String
  speakerLabel   String   @default("Speaker")
  speakerEmail   String? // When known
  startTime      Float // seconds
  endTime        Float // seconds
  text           String   @db.Text
  confidence     Float?
  sentiment      Float? // -1.0 to 1.0
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  transcript   Transcript   @relation(fields: [transcriptId], references: [id], onDelete: Cascade)

  @@index([transcriptId, startTime])
  @@index([organizationId])
}

model Summary {
  id               String   @id @default(cuid())
  organizationId   String
  meetingId        String?  @unique
  transcriptId     String?  @unique
  executiveSummary String?  @db.Text
  keyPoints        String[] // Array of text bullets
  risks            String[]
  decisions        String[]
  nextSteps        String[]
  overallSentiment Float?   // -1.0 to 1.0
  generatedByModel String   @default("gpt-4o")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  meeting        Meeting?     @relation(fields: [meetingId], references: [id])
  transcript     Transcript?  @relation(fields: [transcriptId], references: [id])

  @@index([organizationId])
}

enum ActionItemStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model ActionItem {
  id             String           @id @default(cuid())
  organizationId String
  meetingId      String
  title          String
  ownerId        String?
  dueDate        DateTime?
  priority       Priority         @default(MEDIUM)
  status         ActionItemStatus @default(TODO)
  extractedByModel String         @default("gpt-4o")
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  meeting      Meeting      @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  owner        User?        @relation(fields: [ownerId], references: [id])

  @@index([organizationId, meetingId])
  @@index([ownerId, status])
  @@index([organizationId, status])
}

// ─────────────────────────────────────────────────────────────
// Tasks (Kanban / Project management)
// ─────────────────────────────────────────────────────────────

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

model Task {
  id             String     @id @default(cuid())
  organizationId String
  meetingId      String?
  title          String
  description    String?    @db.Text
  status         TaskStatus @default(TODO)
  priority       Priority   @default(MEDIUM)
  assigneeId     String?
  createdById    String
  dueDate        DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  meeting        Meeting?     @relation(fields: [meetingId], references: [id])
  assignee       User?        @relation("TaskAssignee", fields: [assigneeId], references: [id])
  createdBy      User         @relation("TaskCreator", fields: [createdById], references: [id])

  @@index([organizationId, status])
  @@index([assigneeId, status])
  @@index([organizationId, dueDate])
}

// ─────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────

enum NotificationChannel {
  IN_APP
  EMAIL
  SLACK
}

enum NotificationStatus {
  UNREAD
  READ
}

model Notification {
  id             String              @id @default(cuid())
  organizationId String
  userId         String
  channel        NotificationChannel @default(IN_APP)
  title          String
  body           String?             @db.Text
  status         NotificationStatus  @default(UNREAD)
  metadata       Json? // { meetingId, taskId, actionItemId }
  sentAt         DateTime?
  createdAt      DateTime            @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([organizationId, createdAt])
}

// ─────────────────────────────────────────────────────────────
// Billing & Subscriptions
// ─────────────────────────────────────────────────────────────

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  INCOMPLETE
  ACTIVE
  PAST_DUE
  CANCELLED
  PAUSED
}

model Subscription {
  id             String             @id @default(cuid())
  organizationId String
  stripeCustomerId String?
  stripeSubscriptionId String?
  plan           Plan               @default(FREE)
  status         SubscriptionStatus @default(INCOMPLETE)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean          @default(false)
  usageMeetings    Int              @default(0) // Current month counter
  usageAiMinutes   Int              @default(0)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId])
  @@index([stripeSubscriptionId])
}

// ─────────────────────────────────────────────────────────────
// Audit & Security
// ─────────────────────────────────────────────────────────────

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  INVITE
  EXPORT
  AI_GENERATE
}

model AuditLog {
  id             String     @id @default(cuid())
  organizationId String
  actorId        String?
  action         AuditAction
  entityType     String     // Meeting, Task, User, etc.
  entityId       String?
  metadata       Json?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime   @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  actor        User?        @relation(fields: [actorId], references: [id])

  @@index([organizationId, createdAt])
  @@index([actorId, createdAt])
  @@index([entityType, entityId])
}

model ApiKey {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  name           String
  hashedKey      String   @unique
  scopes         String[] // read:meetings, write:tasks, etc.
  lastUsedAt     DateTime?
  expiresAt      DateTime?
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([hashedKey])
}

// ─────────────────────────────────────────────────────────────
// Webhooks
// ─────────────────────────────────────────────────────────────

enum WebhookStatus {
  ACTIVE
  PAUSED
  DISABLED
}

model Webhook {
  id             String        @id @default(cuid())
  organizationId String
  url            String
  secret         String
  events         String[] // meeting.completed, task.assigned, etc.
  status         WebhookStatus @default(ACTIVE)
  failureCount   Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId, status])
}
```

---

## 3. Multi-tenancy Enforcement

- **Foreign keys**: Every domain table includes `organizationId` referencing `Organization`.
- **Prisma middleware**: A client extension ensures `organizationId` is added to all queries unless bypassed by a super-admin context.
- **Service layer**: All business-logic functions accept an authenticated `user` object and `organizationId` and reject cross-tenant access.

---

## 4. Indexing Strategy

- Tenant + status filters: `Meeting(organizationId, status)`, `Task(organizationId, status)`.
- Time-series queries: `Meeting(organizationId, scheduledAt)`, `AuditLog(organizationId, createdAt)`.
- Unique lookups: `Meeting(transcriptId)`, `Meeting(summaryId)`, `Membership(organizationId, userId)`.
- Search performance: `TranscriptSegment(transcriptId, startTime)` for playback scrubbing.

---

## 5. Full-Text Search

PostgreSQL full-text search is implemented via Prisma raw queries or generated columns:

```sql
-- Migration example for generated search vector
ALTER TABLE "Meeting" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX meeting_search_idx ON "Meeting" USING GIN (search_vector);
```

For `Transcript` and `TranscriptSegment`, a `tsvector` over `fullText` and `text` enables transcript search.

---

## 6. Audit & Compliance

- `AuditLog` captures every mutation, login, export, and AI generation.
- `ApiKey` uses hashed keys (never store plaintext).
- `Webhook` secrets are used to sign outbound payloads.
- Sensitive columns (tokens, secrets) are encrypted at the application layer before persistence where required.
