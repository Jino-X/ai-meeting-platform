# AI Meeting Intelligence Platform — API Specification

## 1. Overview

This document defines the production-grade REST API for the AI Meeting Intelligence Platform. The API is built on Next.js Route Handlers and consumed internally via tRPC procedures where type safety is beneficial. All endpoints require authentication unless marked **Public**.

**Base URL:** `https://api.example.com` (or `https://app.example.com/api` on Vercel)

**Authentication:** JWT session cookie issued by Auth.js. API key authentication is supported for select endpoints using the `X-API-Key` header.

**Headers:**

```txt
Content-Type: application/json
Authorization: Bearer <jwt>  (or session cookie)
X-Organization-Id: <organizationId>  (required for multi-tenant endpoints)
X-API-Key: <apiKey>  (optional, for programmatic access)
```

---

## 2. Standard Response Format

### Success

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [ ... ]
  }
}
```

HTTP status codes:

- `200` OK
- `201` Created
- `204` No Content
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `422` Unprocessable Entity
- `429` Too Many Requests
- `500` Internal Server Error

---

## 3. Authentication

### `POST /api/auth/register` (Public)

Register a new user with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd",
  "name": "Jane Doe"
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "userId": "u_123",
    "email": "user@example.com",
    "requiresEmailVerification": true
  }
}
```

### `POST /api/auth/login` (Public)

Email/password login.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd"
}
```

**Response:** `200 OK` (sets session cookie)

```json
{
  "data": {
    "user": { "id": "u_123", "email": "user@example.com", "name": "Jane Doe" },
    "organizations": [{ "id": "org_1", "name": "Acme Inc", "role": "OWNER" }]
  }
}
```

### `POST /api/auth/forgot-password` (Public)

Send password reset email.

**Request:**

```json
{ "email": "user@example.com" }
```

### `POST /api/auth/reset-password` (Public)

Reset password using token.

**Request:**

```json
{
  "token": "reset-token",
  "password": "NewP@ssw0rd"
}
```

### `POST /api/auth/magic-link` (Public)

Send magic link login email.

**Request:**

```json
{ "email": "user@example.com" }
```

### OAuth Providers

- `GET /api/auth/signin/google`
- `GET /api/auth/signin/github`
- `GET /api/auth/signout`
- `GET /api/auth/session` (returns current session)

---

## 4. Organizations & Workspaces

### `GET /api/workspaces`

List workspaces the authenticated user belongs to.

**Response:** `200 OK`

```json
{
  "data": [
    { "id": "org_1", "name": "Acme Inc", "slug": "acme", "role": "OWNER", "plan": "PRO" }
  ]
}
```

### `POST /api/workspaces`

Create a new workspace.

**Request:**

```json
{
  "name": "Acme Inc",
  "slug": "acme"
}
```

### `GET /api/workspaces/:id`

Get workspace details.

### `PATCH /api/workspaces/:id`

Update workspace settings (name, logo, etc.).

### `DELETE /api/workspaces/:id`

Delete workspace (owner only).

---

## 5. Members & Invitations

### `GET /api/workspaces/:id/members`

List members with roles.

**Response:** `200 OK`

```json
{
  "data": [
    { "id": "m_1", "userId": "u_1", "email": "alice@example.com", "role": "ADMIN", "status": "ACTIVE" }
  ]
}
```

### `POST /api/workspaces/:id/members/invite`

Invite a user by email.

**Request:**

```json
{
  "email": "bob@example.com",
  "role": "MANAGER"
}
```

### `PATCH /api/workspaces/:id/members/:memberId`

Update member role.

**Request:**

```json
{ "role": "MANAGER" }
```

### `DELETE /api/workspaces/:id/members/:memberId`

Remove member.

### `POST /api/workspaces/:id/members/:memberId/transfer-ownership`

Transfer ownership (owner only).

---

## 6. Meetings

### `GET /api/meetings`

List meetings for the active organization.

**Query Parameters:**

- `status` (optional): `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `from` / `to` (optional): ISO date filters
- `search` (optional): full-text search on title/description
- `page`, `limit`: pagination

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "mt_1",
      "title": "Q3 Planning",
      "status": "COMPLETED",
      "scheduledAt": "2026-06-15T10:00:00Z",
      "duration": 60,
      "participants": ["alice@example.com", "bob@example.com"],
      "recordingUrl": "https://...",
      "transcriptStatus": "COMPLETED",
      "summaryStatus": "COMPLETED"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

### `POST /api/meetings`

Create a meeting.

**Request:**

```json
{
  "title": "Q3 Planning",
  "description": "Discuss roadmap and budget",
  "participants": ["alice@example.com", "bob@example.com"],
  "scheduledAt": "2026-06-15T10:00:00Z",
  "duration": 60,
  "source": "MANUAL"
}
```

**Response:** `201 Created`

### `GET /api/meetings/:id`

Get meeting details including transcript and summary IDs.

### `PATCH /api/meetings/:id`

Update meeting fields.

### `DELETE /api/meetings/:id`

Delete meeting and associated data.

### `POST /api/meetings/:id/start`

Mark meeting as in progress.

### `POST /api/meetings/:id/complete`

Mark meeting as completed and trigger transcription if a recording exists.

### `POST /api/meetings/:id/upload`

Upload a recording file. Returns a presigned S3 URL for direct browser upload.

**Response:** `200 OK`

```json
{
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "recordingId": "rec_1",
    "storageKey": "recordings/org_1/mt_1/rec_1.mp4"
  }
}
```

---

## 7. Transcripts

### `GET /api/meetings/:id/transcript`

Get transcript for a meeting.

**Response:** `200 OK`

```json
{
  "data": {
    "id": "tr_1",
    "status": "COMPLETED",
    "language": "en",
    "fullText": "...",
    "segments": [
      {
        "id": "seg_1",
        "speakerLabel": "Alice",
        "speakerEmail": "alice@example.com",
        "startTime": 0.0,
        "endTime": 5.2,
        "text": "Let's start with Q3 goals.",
        "sentiment": 0.4
      }
    ]
  }
}
```

### `POST /api/meetings/:id/transcript`

Request (re-)transcription of a recording.

**Response:** `202 Accepted`

```json
{
  "data": { "jobId": "job_1", "status": "PROCESSING" }
}
```

### `PATCH /api/transcript-segments/:segmentId`

Edit a transcript segment (owner/manager/employee with edit permission).

**Request:**

```json
{ "text": "Let's start with Q3 goals and budget." }
```

---

## 8. Summaries & AI Outputs

### `GET /api/meetings/:id/summary`

Get AI-generated summary.

**Response:** `200 OK`

```json
{
  "data": {
    "id": "sm_1",
    "executiveSummary": "Meeting focused on Q3 planning.",
    "keyPoints": ["Marketing budget approved", "Engineering timeline adjusted"],
    "risks": ["Delayed design review may push launch"],
    "decisions": ["Use Next.js 16 for frontend"],
    "nextSteps": ["Finalize landing page copy by Friday"],
    "overallSentiment": 0.35
  }
}
```

### `POST /api/meetings/:id/summary`

Regenerate summary.

### `GET /api/meetings/:id/sentiment`

Get sentiment breakdown per segment and overall.

### `GET /api/meetings/:id/decisions`

Get extracted decisions.

---

## 9. Action Items

### `GET /api/meetings/:id/action-items`

List action items extracted from a meeting.

### `POST /api/meetings/:id/action-items`

Extract or regenerate action items.

### `PATCH /api/action-items/:id`

Update action item (title, owner, due date, priority, status).

**Request:**

```json
{
  "title": "Create landing page",
  "ownerId": "u_2",
  "dueDate": "2026-06-20T23:59:00Z",
  "priority": "HIGH",
  "status": "TODO"
}
```

### `DELETE /api/action-items/:id`

Delete an action item.

---

## 10. Tasks

### `GET /api/tasks`

List tasks for the organization.

**Query Parameters:** `status`, `assigneeId`, `priority`, `dueBefore`, `search`, `page`, `limit`.

### `POST /api/tasks`

Create a task manually.

**Request:**

```json
{
  "title": "Create landing page",
  "description": "...",
  "assigneeId": "u_2",
  "dueDate": "2026-06-20T23:59:00Z",
  "priority": "HIGH",
  "meetingId": "mt_1"
}
```

### `GET /api/tasks/:id`

Get task details.

### `PATCH /api/tasks/:id`

Update task.

### `DELETE /api/tasks/:id`

Delete task.

---

## 11. Analytics

### `GET /api/analytics`

Get dashboard analytics for the organization.

**Query Parameters:** `from`, `to`, `groupBy` (`day`, `week`, `month`).

**Response:** `200 OK`

```json
{
  "data": {
    "totalMeetings": 120,
    "totalDurationMinutes": 7200,
    "actionItems": 45,
    "completionRate": 0.78,
    "participants": 18,
    "aiUsageMinutes": 340,
    "trend": [
      { "date": "2026-06-01", "meetings": 10, "duration": 600, "tasks": 4 }
    ]
  }
}
```

### `GET /api/analytics/usage`

Get current billing-usage counters.

### `GET /api/analytics/meetings/:id`

Get per-meeting analytics.

---

## 12. Search

### `GET /api/search`

Global search across meetings, transcripts, tasks, and users.

**Query Parameters:** `q`, `type` (`all`, `meetings`, `transcripts`, `tasks`, `users`), `page`, `limit`.

**Response:** `200 OK`

```json
{
  "data": {
    "meetings": [...],
    "transcripts": [...],
    "tasks": [...],
    "users": [...]
  }
}
```

---

## 13. Notifications

### `GET /api/notifications`

List notifications for the current user.

**Query Parameters:** `status` (`UNREAD`, `READ`), `page`, `limit`.

### `PATCH /api/notifications/:id/read`

Mark notification as read.

### `POST /api/notifications/preferences`

Update notification preferences.

---

## 14. Billing

### `GET /api/billing/plans`

List available plans.

### `GET /api/billing/subscription`

Get current subscription.

### `POST /api/billing/checkout`

Create Stripe checkout session.

**Request:**

```json
{ "plan": "PRO", "billingInterval": "month" }
```

**Response:** `200 OK`

```json
{ "data": { "checkoutUrl": "https://checkout.stripe.com/..." } }
```

### `POST /api/billing/portal`

Create Stripe customer portal session.

### `POST /api/billing/webhooks` (Public)

Stripe webhook endpoint.

---

## 15. Webhooks

### `GET /api/webhooks`

List configured webhooks.

### `POST /api/webhooks`

Create a webhook.

**Request:**

```json
{
  "url": "https://customer.com/webhooks",
  "events": ["meeting.completed", "task.assigned"],
  "secret": "whsec_..."
}
```

### `PATCH /api/webhooks/:id`

Update webhook.

### `DELETE /api/webhooks/:id`

Delete webhook.

### `POST /api/webhooks/:id/test`

Send a test webhook event.

---

## 16. API Keys

### `GET /api/api-keys`

List API keys.

### `POST /api/api-keys`

Create an API key.

**Request:**

```json
{
  "name": "Zapier Integration",
  "scopes": ["read:meetings", "write:tasks"]
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "key_1",
    "name": "Zapier Integration",
    "key": "amip_live_...", // shown only once
    "scopes": ["read:meetings", "write:tasks"]
  }
}
```

### `DELETE /api/api-keys/:id`

Revoke API key.

---

## 17. Rate Limits

| Endpoint Group | Limit |
|---|---|
| Auth endpoints | 5 requests/minute per IP |
| General API | 100 requests/minute per user |
| AI endpoints | 20 requests/minute per organization |
| Upload endpoints | 10 requests/minute per user |
| Webhooks | 100 requests/minute per source |

Rate limiting is implemented via Redis-backed middleware (`src/middleware/rate-limit.ts`).

---

## 18. Error Codes

| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient role/permission |
| `TENANT_NOT_FOUND` | Invalid or missing organization context |
| `VALIDATION_ERROR` | Request body/query failed Zod validation |
| `NOT_FOUND` | Resource does not exist |
| `CONFLICT` | Resource already exists or state conflict |
| `RATE_LIMITED` | Too many requests |
| `PLAN_LIMIT_EXCEEDED` | Subscription usage limit reached |
| `AI_PROCESSING_ERROR` | AI/queue worker failure |
| `INTERNAL_ERROR` | Unexpected server error |
