# AI Meeting Intelligence Platform

A production-grade AI-powered meeting intelligence platform built with Next.js 16, featuring automatic transcription, smart summaries, action item extraction, and team collaboration tools.

## Features

### 🎥 Meeting Management
- Record and upload meeting recordings
- Automatic AI transcription with speaker identification
- Real-time meeting status tracking
- Meeting history and search

### 🤖 AI-Powered Intelligence
- **Transcription**: Powered by OpenAI Whisper for accurate speech-to-text
- **Smart Summaries**: Executive summaries, key points, decisions, and risks
- **Action Items**: Automatic extraction and assignment to team members
- **Sentiment Analysis**: Track meeting tone and participant engagement

### ✅ Task Management
- Kanban board and list views
- Drag-and-drop status updates
- Priority levels and due dates
- Convert action items to tasks

### 📊 Analytics Dashboard
- Meeting statistics and trends
- Task completion rates
- AI usage tracking
- Team activity insights

### 👥 Team Collaboration
- Multi-tenant workspaces
- Role-based access control (Owner, Admin, Manager, Employee)
- Member invitations
- Real-time notifications

### ⚙️ Settings & Configuration
- Workspace settings
- Billing and subscription management
- Notification preferences
- API key management

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | TailwindCSS 4, shadcn/ui |
| **Database** | PostgreSQL with Prisma ORM |
| **Authentication** | NextAuth.js with Prisma Adapter |
| **AI/ML** | OpenAI (Whisper, GPT-4) |
| **Queue** | BullMQ with Redis |
| **Validation** | Zod |
| **Forms** | React Hook Form |
| **Data Fetching** | TanStack Query (React Query) |

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14+
- Redis 7+
- OpenAI API key

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Jino-X/ai-meeting-platform.git
cd ai-meeting-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_meeting_platform"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# OpenAI
OPENAI_API_KEY="sk-..."

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# File Storage (optional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
AWS_REGION=""
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Start background workers (optional)

For AI processing features, start the workers in a separate terminal:

```bash
npm run workers
```

## Project Structure

```
ai-meeting-platform/
├── docs/                    # Documentation
│   ├── 01-system-architecture.md
│   ├── 02-database-design.md
│   ├── 03-api-specification.md
│   ├── 04-ui-design-system.md
│   ├── 05-ai-integration.md
│   └── 06-implementation-roadmap.md
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   └── workspaces/  # Workspace API routes
│   │   ├── (auth)/          # Auth pages (login, register)
│   │   └── workspaces/      # Workspace pages
│   │       └── [slug]/
│   │           ├── dashboard/
│   │           ├── meetings/
│   │           ├── tasks/
│   │           ├── analytics/
│   │           ├── members/
│   │           └── settings/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── shared/          # Shared components
│   ├── hooks/               # React Query hooks
│   ├── lib/
│   │   ├── ai/              # AI utilities (OpenAI)
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── prisma.ts        # Prisma client
│   │   ├── queue.ts         # BullMQ queues
│   │   └── validations/     # Zod schemas
│   └── workers/             # Background job workers
├── public/                  # Static assets
└── package.json
```

## API Routes

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/[...nextauth]` | NextAuth.js handlers |
| POST | `/api/auth/forgot-password` | Password reset |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List user workspaces |
| POST | `/api/workspaces` | Create workspace |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/[slug]/meetings` | List meetings |
| POST | `/api/workspaces/[slug]/meetings` | Create meeting |
| GET | `/api/workspaces/[slug]/meetings/[id]` | Get meeting details |
| PATCH | `/api/workspaces/[slug]/meetings/[id]` | Update meeting |
| DELETE | `/api/workspaces/[slug]/meetings/[id]` | Delete meeting |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/[slug]/tasks` | List tasks |
| POST | `/api/workspaces/[slug]/tasks` | Create task |
| GET | `/api/workspaces/[slug]/tasks/[id]` | Get task details |
| PATCH | `/api/workspaces/[slug]/tasks/[id]` | Update task |
| DELETE | `/api/workspaces/[slug]/tasks/[id]` | Delete task |

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workspaces/[slug]/members/invite` | Invite member |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/[slug]/analytics` | Get analytics data |

## Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev    # Run migrations (dev)
npx prisma migrate deploy # Run migrations (prod)
npx prisma studio    # Open Prisma Studio

# Workers
npm run workers      # Start background workers
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
# Build the image
docker build -t ai-meeting-platform .

# Run the container
docker run -p 3000:3000 --env-file .env ai-meeting-platform
```

### Manual Deployment

```bash
# Build
npm run build

# Start
npm run start
```

## Environment Configuration

### Development
- Uses local PostgreSQL and Redis
- Hot reloading enabled
- Debug logging

### Production
- Use managed PostgreSQL (e.g., Neon, Supabase)
- Use managed Redis (e.g., Upstash, Redis Cloud)
- Enable connection pooling
- Set `NODE_ENV=production`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ using Next.js and OpenAI
