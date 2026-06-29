# AI Meeting Intelligence Platform — UI Design System

## 1. Overview

This document defines the design system, component hierarchy, page structure, and user-experience patterns for the AI Meeting Intelligence Platform. The UI is built with **Next.js 16**, **React 19**, **TailwindCSS 4**, and **shadcn/ui**.

---

## 2. Design Tokens

### Colors

```css
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --popover: #ffffff;
  --popover-foreground: #0a0a0a;
  --primary: #6366f1; /* Indigo 500 */
  --primary-foreground: #ffffff;
  --secondary: #f3f4f6; /* Gray 100 */
  --secondary-foreground: #1f2937;
  --muted: #f9fafb;
  --muted-foreground: #6b7280;
  --accent: #8b5cf6; /* Violet 500 */
  --accent-foreground: #ffffff;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #e5e7eb;
  --input: #e5e7eb;
  --ring: #6366f1;
  --radius: 0.625rem;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #171717;
  --card-foreground: #fafafa;
  --popover: #171717;
  --popover-foreground: #fafafa;
  --primary: #818cf8;
  --primary-foreground: #0a0a0a;
  --secondary: #262626;
  --secondary-foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a1a1aa;
  --accent: #a78bfa;
  --accent-foreground: #0a0a0a;
  --destructive: #f87171;
  --destructive-foreground: #0a0a0a;
  --border: #262626;
  --input: #262626;
  --ring: #818cf8;
}
```

### Typography

| Token | Value |
|---|---|
| Font family | `Inter`, system-ui, sans-serif |
| Heading font | `Inter` (weight 600–700) |
| Base size | 16px |
| Small | 14px |
| Large | 18px |
| H1 | 2.5rem / 40px |
| H2 | 2rem / 32px |
| H3 | 1.5rem / 24px |
| H4 | 1.25rem / 20px |

### Spacing Scale

Tailwind defaults: `4` = `1rem` = `16px`. Use `gap-4`, `p-6`, `m-2`, etc.

### Radius & Shadows

| Token | Value |
|---|---|
| Radius | `0.625rem` (10px) |
| Card shadow | `0 1px 3px rgba(0,0,0,0.1)` |
| Card hover shadow | `0 4px 12px rgba(0,0,0,0.08)` |
| Modal shadow | `0 24px 48px rgba(0,0,0,0.15)` |

---

## 3. Component Hierarchy

```
src
 ├─ app
 │   ├─ (auth)
 │   │   ├─ login/page.tsx
 │   │   ├─ register/page.tsx
 │   │   ├─ forgot-password/page.tsx
 │   │   └─ reset-password/page.tsx
 │   ├─ (dashboard)
 │   │   ├─ page.tsx
 │   │   ├─ meetings/
 │   │   │   ├─ page.tsx
 │   │   │   ├─ new/page.tsx
 │   │   │   └─ [id]/page.tsx
 │   │   ├─ tasks/
 │   │   │   ├─ page.tsx
 │   │   │   ├─ kanban/page.tsx
 │   │   │   └─ calendar/page.tsx
 │   │   ├─ workspace/
 │   │   │   ├─ page.tsx
 │   │   │   ├─ members/page.tsx
 │   │   │   └─ settings/page.tsx
 │   │   ├─ analytics/page.tsx
 │   │   ├─ search/page.tsx
 │   │   └─ notifications/page.tsx
 │   ├─ api/...
 │   └─ layout.tsx
 │
 ├─ components
 │   ├─ ui/              # shadcn/ui primitives
 │   │   ├─ button.tsx
 │   │   ├─ card.tsx
 │   │   ├─ dialog.tsx
 │   │   ├─ dropdown-menu.tsx
 │   │   ├─ input.tsx
 │   │   ├─ table.tsx
 │   │   ├─ tabs.tsx
 │   │   ├─ toast.tsx
 │   │   └─ skeleton.tsx
 │   ├─ layout/
 │   │   ├─ sidebar.tsx
 │   │   ├─ topbar.tsx
 │   │   ├─ nav-links.tsx
 │   │   └─ organization-switcher.tsx
 │   ├─ forms/
 │   │   ├─ meeting-form.tsx
 │   │   ├─ task-form.tsx
 │   │   └─ invite-member-form.tsx
 │   └─ shared/
 │       ├─ empty-state.tsx
 │       ├─ loading-page.tsx
 │       ├─ error-boundary.tsx
 │       └─ pagination.tsx
 │
 ├─ features
 │   ├─ meetings/
 │   │   ├─ meeting-card.tsx
 │   │   ├─ meeting-list.tsx
 │   │   ├─ meeting-detail.tsx
 │   │   ├─ transcript-player.tsx
 │   │   ├─ summary-panel.tsx
 │   │   ├─ action-items-table.tsx
 │   │   └─ recording-uploader.tsx
 │   ├─ tasks/
 │   │   ├─ task-board.tsx
 │   │   ├─ task-list.tsx
 │   │   ├─ task-card.tsx
 │   │   └─ task-calendar.tsx
 │   ├─ analytics/
 │   │   ├─ stat-card.tsx
 │   │   ├─ meetings-chart.tsx
 │   │   ├─ tasks-chart.tsx
 │   │   └─ usage-widget.tsx
 │   ├─ workspace/
 │   │   ├─ members-table.tsx
 │   │   ├─ role-badge.tsx
 │   │   └─ billing-plan.tsx
 │   └─ search/
 │       └─ global-search.tsx
 │
 └─ hooks
     ├─ use-meetings.ts
     ├─ use-tasks.ts
     ├─ use-current-user.ts
     └─ use-organization.ts
```

---

## 4. Page Layouts

### 4.1 Auth Pages

- Centered card layout on a subtle gradient background.
- Social login buttons (Google, GitHub) + divider + email form.
- Clear error states and loading spinners.

### 4.2 Dashboard Layout

- **Sidebar**: collapsible, icons + labels, workspace switcher at bottom.
- **Topbar**: global search, notification bell, user avatar dropdown.
- **Main area**: responsive grid, cards, and tables.
- **Breadcrumbs**: shown on detail pages.

### 4.3 Dashboard Home

Widgets in a responsive grid:

- Upcoming meetings
- Recent meetings
- My tasks (todo / in progress)
- Activity feed / notifications
- Quick analytics sparkline

### 4.4 Meeting List

- Filter bar: status, date range, search.
- Table / card toggle.
- Columns: title, date, duration, status, participants, actions.
- Empty state with CTA.

### 4.5 Meeting Detail

Three-column layout on desktop:

- **Left**: recording player + transcript.
- **Center**: AI summary + key points + risks + decisions + next steps.
- **Right**: participants + action items + notes.

Mobile: vertical tabs (`Summary`, `Transcript`, `Action Items`, `Recording`).

### 4.6 Tasks

Views:

- **Kanban**: columns `Todo`, `In Progress`, `Review`, `Done`.
- **List**: sortable, filterable table.
- **Calendar**: month view with due dates.

### 4.7 Analytics

- Stat cards in a top row.
- Charts below: bar chart (meetings over time), pie chart (task status), line chart (AI usage).
- Date range picker.

### 4.8 Workspace Settings

- Tabs: General, Members, Billing, API Keys, Webhooks, Notifications.
- Role-based visibility (billing only for owner/admin).

---

## 5. UX Patterns

### 5.1 Loading States

- Skeleton screens for cards and tables.
- Spinners inside buttons during mutations.
- Suspense boundaries around heavy data components.

### 5.2 Empty States

- Illustration + headline + description + primary CTA.
- Example: “No meetings yet. Schedule your first meeting.”

### 5.3 Error Handling

- Toast notifications for mutation success/failure.
- Inline validation with Zod + React Hook Form.
- Error boundary for unexpected UI errors.
- 404 / 403 pages with clear messaging.

### 5.4 Feedback & Notifications

- Toast system via shadcn/ui Sonner.
- Real-time badges for unread notifications.
- Progress indicators for file uploads and AI processing.

### 5.5 Accessibility

- Keyboard navigation for all interactive elements.
- Focus rings using `--ring` color.
- ARIA labels on icon buttons.
- Reduced motion support.
- Color contrast ratio ≥ 4.5:1.
- Screen-reader announcements for async updates.

### 5.6 Mobile Responsiveness

- Sidebar collapses to a bottom nav or hamburger menu.
- Tables convert to cards on small screens.
- Meeting detail uses vertical tabs.
- Touch-friendly button sizes (min 44px).

---

## 6. Animation & Motion

- **Page transitions**: subtle fade/slide via Framer Motion.
- **Loading skeletons**: shimmer animation.
- **Kanban drag-and-drop**: smooth reordering with `framer-motion` or `@dnd-kit`.
- **Toast entrance**: slide-in from bottom-right.
- **Modal entrance**: scale + fade.
- **Staggered lists**: cards appear with a 50ms stagger.

Use `prefers-reduced-motion` to disable non-essential animations.

---

## 7. Iconography

Use **Lucide React** icons consistently:

| Concept | Icon |
|---|---|
| Meetings | `Calendar`, `Video` |
| Tasks | `CheckSquare`, `Kanban` |
| Analytics | `BarChart3`, `PieChart` |
| Workspace | `Building2`, `Users` |
| Settings | `Settings`, `Cog` |
| Notifications | `Bell` |
| Search | `Search` |
| AI | `Sparkles`, `Bot` |
| Upload | `Upload` |
| Delete | `Trash2` |

---

## 8. Form Patterns

- Use `react-hook-form` + `zod` for all forms.
- Inline validation on blur.
- Submit buttons disabled until valid and not submitting.
- Date/time pickers use native `datetime-local` or a custom accessible picker.
- Multi-select participants via `cmdk` combobox.

---

## 9. Dark Mode

- Full dark-mode support via CSS variables and `next-themes`.
- Toggle in user avatar dropdown.
- Charts and images adapt automatically.

---

## 10. Key Components to Build

| Component | Purpose |
|---|---|
| `TranscriptPlayer` | Sync transcript segments with audio/video playback |
| `SummaryPanel` | Display executive summary, key points, risks, decisions, next steps |
| `ActionItemsTable` | Editable table of extracted tasks |
| `RecordingUploader` | Drag-and-drop upload with progress |
| `TaskBoard` | Kanban board with drag-and-drop |
| `UsageWidget` | Show plan usage vs. limits |
| `GlobalSearch` | Command palette-style search |
| `OrganizationSwitcher` | Switch between workspaces |
| `NotificationBell` | Real-time notification dropdown |
| `StatCard` | KPI cards with trend indicators |
