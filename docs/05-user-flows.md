# AI Meeting Intelligence Platform — User Flows

## 1. Overview

This document describes the primary user flows and sequence diagrams for the AI Meeting Intelligence Platform. It covers authentication, workspace setup, meeting lifecycle, AI processing, task management, billing, and admin flows.

---

## 2. User Personas

| Role | Goals |
|---|---|
| **Super Admin** | Manage all organizations, subscriptions, AI usage, and platform health. |
| **Organization Owner** | Set up workspace, manage billing, invite members, control permissions. |
| **Manager** | Access team meetings, assign action items, run reports. |
| **Employee** | Join meetings, view own meetings, complete assigned tasks. |

---

## 3. Authentication Flows

### 3.1 Email/Password Registration

```
User ──► /register
        │
        ▼
[Client] Validate form with Zod
        │
        ▼
[Server] POST /api/auth/register
        │
        ├──► Check if email exists
        │
        ├──► Hash password
        │
        ├──► Create User
        │
        ├──► Create default Organization (Owner)
        │
        ├──► Create Membership OWNER
        │
        └──► Send verification email
        │
        ▼
[Client] Redirect to /verify-email
```

### 3.2 OAuth Login (Google/GitHub)

```
User ──► Click "Sign in with Google"
        │
        ▼
[Auth.js] Initiate OAuth flow
        │
        ▼
Provider ──► Return authorization code
        │
        ▼
[Auth.js] Exchange code for tokens
        │
        ▼
[Server] Find or create User
        │
        ├──► If new user: create Organization
        │
        └──► Create session cookie
        │
        ▼
[Client] Redirect to /dashboard
```

### 3.3 Magic Link Login

```
User ──► Enter email on /login
        │
        ▼
[Server] POST /api/auth/magic-link
        │
        ├──► Generate signed token
        │
        └──► Send email with link
        │
        ▼
User clicks link
        │
        ▼
[Server] Verify token → create session
        │
        ▼
[Client] Redirect to /dashboard
```

---

## 4. Workspace Setup Flow

### 4.1 Create Workspace

```
User ──► /workspace/new
        │
        ▼
[Client] Form: name, slug
        │
        ▼
[Server] POST /api/workspaces
        │
        ├──► Validate slug uniqueness
        │
        ├──► Create Organization
        │
        ├──► Create Membership OWNER
        │
        └──► Create default Subscription (FREE)
        │
        ▼
[Client] Redirect to /workspace/members
```

### 4.2 Invite Member

```
Owner/Admin ──► /workspace/members
              │
              ▼
[Client] Click "Invite" → enter email + role
              │
              ▼
[Server] POST /api/workspaces/:id/members/invite
              │
              ├──► Check inviter permissions
              │
              ├──► Create or find User
              │
              ├──► Create Membership INVITED
              │
              └──► Send invitation email
              │
              ▼
Invitee clicks link
              │
              ▼
[Server] Accept invite → Membership ACTIVE
```

### 4.3 Transfer Ownership

```
Owner ──► Select member → "Transfer Ownership"
        │
        ▼
[Server] POST /api/workspaces/:id/members/:id/transfer-ownership
        │
        ├──► Verify current owner
        │
        ├──► Update old owner role to ADMIN
        │
        └──► Update new owner role to OWNER
```

---

## 5. Meeting Lifecycle Flow

### 5.1 Schedule a Meeting

```
User ──► /meetings/new
        │
        ▼
[Client] Form: title, description, participants, date, duration
        │
        ▼
[Server] POST /api/meetings
        │
        ├──► Validate plan meeting limits
        │
        ├──► Create Meeting row
        │
        └──► Send calendar invites (if connected)
        │
        ▼
[Client] Redirect to /meetings/:id
```

### 5.2 Upload Recording

```
User ──► Meeting detail → "Upload Recording"
        │
        ▼
[Client] POST /api/meetings/:id/upload
        │
        ▼
[Server] Generate presigned S3 URL
        │
        ▼
[Client] Upload file directly to S3
        │
        ▼
[Server] S3 webhook → create Recording row
        │
        ▼
[Server] Enqueue transcription job
        │
        ▼
[Client] Show processing state
```

### 5.3 AI Processing Pipeline

```
Recording uploaded / meeting completed
        │
        ▼
[Worker] transcription job
        │
        ├──► Download audio from S3
        │
        ├──► Extract audio / normalize
        │
        ├──► Send to Whisper API
        │
        └──► Store Transcript + TranscriptSegment rows
        │
        ▼
[Worker] summarization job (depends on transcript)
        │
        ├──► Build prompt from transcript
        │
        ├──► Call GPT-4o / Gemini
        │
        └──► Store Summary row
        │
        ▼
[Worker] action-items job
        │
        └──► Store ActionItem rows
        │
        ▼
[Worker] sentiment job
        │
        └──► Update segment sentiment + overall score
        │
        ▼
[Worker] decision-tracking job
        │
        └──► Store decisions in Summary
        │
        ▼
[Worker] notification job
        │
        └──► Notify participants that meeting is ready
        │
        ▼
[Worker] analytics rollup job
        │
        └──► Update materialized aggregates
        │
        ▼
[Client] Real-time update via Pusher / WebSocket
```

### 5.4 View Meeting & Transcript

```
User ──► /meetings/:id
        │
        ▼
[Server] Load Meeting + Transcript + Summary + ActionItems
        │
        ▼
[Client] Render:
        ├── Recording player
        ├── Searchable transcript
        ├── AI summary tabs
        ├── Action items list
        └── Participants
```

### 5.5 Edit Transcript

```
User ──► Click transcript segment → Edit
        │
        ▼
[Client] Inline edit form
        │
        ▼
[Server] PATCH /api/transcript-segments/:id
        │
        ├──► Validate user permission
        │
        ├──► Update segment text
        │
        └──► Write AuditLog entry
        │
        ▼
[Client] Update transcript and re-sync summary (optional)
```

---

## 6. Action Item & Task Flows

### 6.1 Extract Action Items from Meeting

```
Meeting summary complete
        │
        ▼
[Worker] action-items extraction
        │
        ├──► Prompt: extract tasks, owners, due dates, priorities
        │
        ├──► Parse JSON response
        │
        └──► Create ActionItem rows linked to Meeting
        │
        ▼
User ──► /meetings/:id
        │
        ▼
[Client] Display action items
        │
        ▼
User converts action item to Task
        │
        ▼
[Server] POST /api/tasks (copy from ActionItem)
```

### 6.2 Task Management

```
User ──► /tasks
        │
        ▼
[Client] Kanban / List / Calendar view
        │
        ▼
User creates task
        │
        ▼
[Server] POST /api/tasks
        │
        ├──► Validate role
        │
        └──► Create Task
        │
        ▼
[Server] Enqueue notification to assignee
        │
        ▼
User moves task card (drag-and-drop)
        │
        ▼
[Server] PATCH /api/tasks/:id
        │
        └──► Update status
        │
        ▼
[Client] Update board optimistically
```

---

## 7. Search Flow

```
User ──► Global search bar or /search
        │
        ▼
[Client] Type query
        │
        ▼
[Server] GET /api/search?q=...&type=all
        │
        ├──► Full-text search on Meetings (title, description)
        ├──► Full-text search on Transcript segments
        ├──► Search Tasks (title, description)
        └──► Search Users (name, email)
        │
        ▼
[Client] Grouped results with quick navigation
```

---

## 8. Notification Flow

### 8.1 Trigger: Task Assigned

```
Task created/updated with assignee
        │
        ▼
[Server] Enqueue notification job
        │
        ├──► In-app notification
        ├──► Email notification (if enabled)
        └──► Slack notification (if connected)
        │
        ▼
[Real-time] Pusher event to assignee
        │
        ▼
[Client] Update notification bell badge
```

### 8.2 Notification Preferences

```
User ──► /workspace/settings/notifications
        │
        ▼
[Client] Toggle channels per event type
        │
        ▼
[Server] POST /api/notifications/preferences
        │
        └──► Store user preferences
```

---

## 9. Billing Flow

### 9.1 Upgrade Plan

```
Owner ──► /workspace/settings/billing
        │
        ▼
[Client] Select plan + interval
        │
        ▼
[Server] POST /api/billing/checkout
        │
        ├──► Validate permissions
        │
        ├──► Create Stripe Checkout Session
        │
        └──► Return checkout URL
        │
        ▼
[Client] Redirect to Stripe Checkout
        │
        ▼
Stripe ──► Payment success
        │
        ▼
[Server] Webhook /api/billing/webhooks
        │
        ├──► Update Subscription (PRO/ENTERPRISE)
        └──► Write AuditLog
        │
        ▼
[Client] Return to /workspace/settings/billing
```

### 9.2 Plan Usage Limits

```
User creates meeting or uploads recording
        │
        ▼
[Server] Check subscription usageMeetings < plan limit
        │
        ├──► If within limit: proceed
        └──► If exceeded: return 402 Plan Limit Exceeded
        │
        ▼
[Client] Show upgrade CTA
```

---

## 10. Admin Flows

### 10.1 Super Admin Dashboard

```
Super Admin ──► /admin
              │
              ▼
[Server] Load platform-wide metrics
              │
              ├── Total organizations
              ├── Total users
              ├── Revenue
              ├── Total meetings
              ├── Active subscriptions
              └── AI costs
              │
              ▼
[Client] Render admin dashboard widgets
```

### 10.2 Manage Organization

```
Super Admin ──► /admin/organizations
              │
              ▼
[Server] List all organizations
              │
              ▼
Super Admin ──► View / edit / disable org
              │
              ▼
[Server] PATCH /api/admin/organizations/:id
              │
              └──► Update status or plan
```

---

## 11. API Key Integration Flow

```
User ──► /workspace/settings/api-keys
        │
        ▼
[Client] Create key with scopes
        │
        ▼
[Server] POST /api/api-keys
        │
        ├──► Generate plaintext key
        ├──► Hash and store key
        └──► Return plaintext once
        │
        ▼
External client uses key in X-API-Key header
        │
        ▼
[Server] Middleware: validate key, scopes, organization
        │
        ▼
[Server] Execute allowed endpoint
```

---

## 12. Webhook Delivery Flow

```
System event (e.g., meeting.completed)
        │
        ▼
[Server] Enqueue webhook job
        │
        ▼
[Worker] Fetch active webhooks for event type
        │
        ▼
[Worker] Sign payload with HMAC-SHA256
        │
        ▼
[Worker] POST to customer URL
        │
        ├──► Success: reset failureCount
        └──► Failure: increment failureCount, retry with backoff
        │
        ▼
[Worker] Pause webhook after max failures
```
