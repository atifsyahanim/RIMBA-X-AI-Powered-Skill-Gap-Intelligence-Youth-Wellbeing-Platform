# RimbaX AI Tutor — System Summary

> **Stack**: Next.js 16.1.6 · Supabase · Gemini 2.0 Flash · pgvector · Tailwind CSS · TypeScript  
> **Deployment**: Netlify  
> **Database**: Supabase PostgreSQL with pgvector extension

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Directory Structure](#3-directory-structure)
4. [API Routes](#4-api-routes)
5. [Pages & UI Routes](#5-pages--ui-routes)
6. [Core Library (lib/)](#6-core-library-lib)
7. [Components](#7-components)
8. [Database Schema](#8-database-schema)
9. [Key Data Flows](#9-key-data-flows)
10. [Security & Rate Limiting](#10-security--rate-limiting)
11. [Configuration & Environment](#11-configuration--environment)
12. [Dependencies](#12-dependencies)
13. [Feature Status](#13-feature-status)

---

## 1. Project Overview

RimbaX AI Tutor is a full-stack AI-powered study platform targeting students in Southeast Asia. It allows students to upload study materials (PDFs, DOCX, XLSX, TXT), chat with an AI tutor contextualised to those documents, generate structured notes and exercises, and track learning progress through a gamification system.

**Core capabilities:**

- Multimodal document ingestion (text extraction + Gemini OCR fallback for image-heavy PDFs)
- RAG (Retrieval-Augmented Generation) for document-grounded AI responses
- Streaming AI tutor chat with customisable teaching mode and voice tone
- Adaptive learning path generation via conversational diagnostic AI
- Exercise generation (multiple-choice + guided practice) from uploaded materials
- Text-to-speech (WAV output) via Gemini 2.5 Flash
- Gamification: XP, levels, streaks, achievements
- Row-Level Security on all Supabase tables

---

## 2. Architecture Diagram

```
Browser (Next.js Client)
│
│  Auth: Supabase SSR cookies
│  State: React useState / useRef
│  Streaming: SSE (text/plain, ReadableStream)
│
├─── Next.js App Router (app/)
│     ├─ (auth)/            login · signup · forgot-password · reset-password
│     ├─ (dashboard)/       home · upload · notes · tutor · progress · learning-path
│     └─ api/               REST + SSE endpoints (Node.js Edge-compatible)
│
├─── lib/
│     ├─ ai/                gemini.ts · embeddings.ts · rag.ts
│     ├─ parsers/            PDF · DOCX · XLSX · TXT + chunker
│     ├─ supabase/           client · server · queries
│     ├─ gamification/       XP · levels · streaks · achievements
│     ├─ security/           rate-limit · validation · sanitization
│     └─ hooks/              useUser (auth state)
│
└─── External Services
      ├─ Supabase DB          PostgreSQL + pgvector (3072-dim embeddings)
      ├─ Supabase Storage     documents bucket
      ├─ Gemini API           gemini-2.0-flash (chat, OCR, exercises)
      ├─ Gemini Embeddings    gemini-embedding-001 (3072 dimensions)
      ├─ Gemini TTS           gemini-2.5-flash-preview (WAV, Aoede voice)
      └─ Upstash Redis        Distributed rate limiting (production)
```

---

## 3. Directory Structure

```
app/
  globals.css
  layout.tsx                  Root layout (Inter font, Toaster)
  page.tsx                    Public landing page
  (auth)/                     Auth group (no sidebar)
    layout.tsx
    login/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
  (dashboard)/                Dashboard group (with Sidebar)
    layout.tsx
    page.tsx                  (deprecated, returns null)
    upload/page.tsx
    notes/page.tsx
    tutor/page.tsx            ← Main tutor room (full feature)
    progress/page.tsx
    career/                   Career advisor section
      page.tsx                Career hub — stats, journey stepper, profile banner
      profile/page.tsx        Career profile form (education, skills, goals)
      analyse/page.tsx        Skill gap analysis runner + results viewer
      modules/page.tsx        AI-curated learning modules (kanban + list view)
      resume/page.tsx         AI resume generator with version management
      recommend/page.tsx      AI career recommendations with match scoring
  dashboard/                  Duplicate routing for learning-path
    layout.tsx
    learning-path/page.tsx
    page.tsx
    ...
  api/
    chat/route.ts             POST  – streaming AI chat
    upload/route.ts           POST  – file upload + embedding
    parse/route.ts            POST  – parse only (no store)
    documents/route.ts        GET/DELETE – document management
    exercises/
      generate/route.ts       POST  – generate quiz + practice
      feedback/route.ts       POST  – evaluate answers
    notes/generate/route.ts   POST  – generate structured notes
    tts/route.ts              POST  – text to WAV audio
    init-user/route.ts        POST  – initialise user rows
    learning-path/route.ts    POST  – adaptive learning path chat
    career/
      profile/route.ts        GET/POST/PATCH – career profile CRUD + target career update
      analyse/route.ts        GET/POST – fetch/run AI skill gap analysis
      modules/route.ts        GET – fetch learning modules (filterable by status)
      modules/[id]/route.ts   PATCH – update module status/progress/certificate
      resume/route.ts         POST – generate + save AI resume version
      recommend/route.ts      POST – generate AI career recommendations
  security/
    rate-limit.ts             Redis/in-memory rate limiter
    validation.ts             Zod schemas, file validation, magic numbers
    sanitization.ts           DOMPurify XSS sanitization
  hooks/
    useUser.ts                useUser() auth hook
  career/
    prompts.ts                Gemini prompt templates (SKILL_GAP_PROMPT, CAREER_RECOMMEND_PROMPT, RESUME_GEN_PROMPT)
    parser.ts                 safeParseJson, parseGapAnalysis, parseRecommendations, deriveModulesFromGap
    resources.ts              Curated fallback resource map keyed by skill name

components/
  ui/
    Button.tsx
    Input.tsx
    Card.tsx / CardHeader / CardSection
    ChatBubble.tsx
    FileUpload.tsx
    ErrorMessage.tsx
    LoadingSkeleton.tsx
    ProgressRing.tsx
    BarChart.tsx
    StatusBadge.tsx
    Modal.tsx
    index.ts                  Barrel export
  dashboard/
    Sidebar.tsx               Main navigation sidebar
  career/
    ModuleCard.tsx            Learning module card with status toggle, progress bar, and certificate URL input

types/
  index.ts                    App-level TypeScript types
  database.ts                 Supabase auto-generated types

public/
  maya.vrm                    3D VRM avatar asset
  logo.png

next.config.ts
middleware.ts
supabase-schema.sql
netlify.toml
```

---

## 4. API Routes

### `POST /api/chat`

Streams AI tutor responses grounded in the user's uploaded documents.

| Detail     | Value                      |
| ---------- | -------------------------- |
| Auth       | Required (user session)    |
| Rate limit | 50 req / 15 min (per user) |
| Response   | SSE stream (`text/plain`)  |

**Request body:**

```json
{
  "message": "string (max 4000 chars)",
  "history": [{ "role": "user|model", "content": "string (max 2000)" }],
  "settings": { "teachingMode": "focused|balanced|exploratory", "voiceTone": "warm|professional|casual" },
  "focusDocumentIds": ["uuid", ...],
  "focusDocumentTitles": ["string", ...]
}
```

**Flow:** sanitize inputs → rate-limit check → `assembleContext()` RAG → `buildSystemPrompt()` → `generateStreamingResponse()` → stream chunks.

---

### `POST /api/upload`

Uploads, parses, chunks, embeds, and stores a study document.

| Detail         | Value                    |
| -------------- | ------------------------ |
| Auth           | Required                 |
| Rate limit     | 10 req / 1 hour (per IP) |
| Max file size  | 20 MB                    |
| Accepted types | PDF, DOCX, XLSX, TXT     |

**Flow:**

1. Validate MIME type + magic number signature
2. Parse file (`parsePDF` / `parseDOCX` / `parseXLSX` / `parseTXT`)
3. Sanitise text (strip `\u0000`, C0/C1 control chars, lone surrogates)
4. Chunk text (500-word chunks, 50-word overlap)
5. Generate embeddings per chunk via Gemini
6. Store file in Supabase Storage (`documents` bucket)
7. Insert document row + embedding rows in DB
8. Mark document `processed = true`

---

### `GET /api/documents`

Returns all documents owned by the authenticated user (filename, title, subject, type, size, processed flag).

### `DELETE /api/documents`

Deletes a document + its embeddings from DB and storage (uses service role client).

---

### `POST /api/exercises/generate`

Generates a multiple-choice quiz question and an open-ended guided practice task from a document.

**Flow:** verify ownership → fetch first 25 content chunks → prompt Gemini → parse JSON (strip Markdown fences if needed).

**Response:**

```json
{
  "quickCheck": {
    "question": "",
    "options": ["A", "B", "C", "D"],
    "correct": "A",
    "explanation": ""
  },
  "guidedPractice": { "task": "", "context": "" }
}
```

---

### `POST /api/exercises/feedback`

Evaluates a submitted answer.

- `quickcheck`: Compares user answer to correct option, returns brief feedback
- `guided`: Evaluates open-ended response, returns quality label + improvement suggestions

---

### `POST /api/notes/generate`

Generates structured study notes from a document.

**Flow:** verify ownership → fetch up to 30 chunks (fallback to `parsed_text` column if no embeddings) → prompt Gemini.

**Response:**

```json
{
  "title": "",
  "keyConcepts": [{ "concept": "", "explanation": "" }],
  "keyTerms": [{ "term": "", "definition": "" }]
}
```

---

### `POST /api/tts`

Converts text to WAV audio using Gemini 2.5 Flash Preview.

| Detail     | Value                      |
| ---------- | -------------------------- |
| Auth       | Required                   |
| Rate limit | 60 req / 15 min (per user) |
| Voice      | Aoede (female)             |
| Output     | WAV — PCM L16 24kHz mono   |

**Internals:** Raw REST API call to Gemini (avoids SDK serialisation issues). `pcmToWav()` wraps raw PCM bytes in a proper WAV header.

---

### `POST /api/init-user`

Idempotently creates `user_progress` (level=1, xp=0, streak=0) and `user_stats` rows for a new user. Called on first login/signup.

---

### Career API Routes

All career routes require user authentication. Rate-limited under the `career` limiter.

#### `GET /api/career/profile`

Returns the authenticated user's career profile as `{ data: profile | null }`.

#### `POST /api/career/profile`

Creates or upserts a full career profile. Validated with Zod.

**Request body:**

```json
{
  "current_level": "Undergraduate",
  "target_career": "Data Scientist",
  "target_industry": "Finance",
  "field_of_study": "Computer Science",
  "institution": "UTM",
  "graduation_year": 2026,
  "skills": ["Python", "SQL"],
  "certifications": ["AWS Cloud Practitioner"],
  "work_experience": [
    { "company": "", "role": "", "duration_months": 6, "description": "" }
  ],
  "career_goals": "string (max 2000)"
}
```

Awards 50 XP on first creation.

#### `PATCH /api/career/profile`

Updates `target_career` and/or `target_industry` only (used by the Recommendations page "Set as Target" action).

#### `GET /api/career/analyse`

Fetches the most recent `skill_gap_analyses` row for the user as `{ data: analysis | null }`.

#### `POST /api/career/analyse`

Runs a full AI skill gap analysis against the user's career profile.

**Flow:**

1. Rate limit check (10 req / 1 hr)
2. Fetch `career_profiles` row — 400 if missing
3. Build prompt via `SKILL_GAP_PROMPT(profile)` → Gemini `gemini-2.0-flash`
4. `parseGapAnalysis(rawText)` — strips Markdown fences, parses JSON
5. Enrich `gap_skills` with curated resources via `getResourcesForSkill()` where AI returned none
6. Insert row into `skill_gap_analyses`
7. Delete all existing `learning_modules` for user (prevents stale accumulation)
8. `deriveModulesFromGap()` → bulk insert new `learning_modules` rows
9. Award 75 XP

**Response:** `{ data: analysis, modules: LearningModule[] }`

#### `GET /api/career/modules`

Returns all learning modules for the user ordered by `created_at desc`. Accepts optional `?status=not_started|in_progress|completed` query param.

#### `PATCH /api/career/modules/[id]`

Updates a single module's `status`, `completion_pct`, and/or `certificate_url`. Verifies ownership. Awards 30 XP when transitioning to `completed`.

#### `POST /api/career/resume`

Generates an AI-written resume from the user's profile, completed modules, and certificates.

| Detail     | Value                                       |
| ---------- | ------------------------------------------- |
| Rate limit | 5 req / 1 hr                                |
| Tones      | `professional` \| `creative` \| `technical` |

**Flow:** Parallel fetch of `career_profiles`, `user_certificates`, completed `learning_modules`, and existing `resume_versions` count → `RESUME_GEN_PROMPT` → Gemini → `safeParseJson` → save to `resume_versions` → award 40 XP on first resume.

**Response:**

```json
{
  "id": "uuid",
  "version_name": "Data Scientist v1",
  "content": {
    "summary": "",
    "skills": [],
    "experience": [],
    "education": [],
    "certifications": []
  }
}
```

#### `POST /api/career/recommend`

Generates AI career role recommendations based on the user's profile.

**Flow:** Fetch profile → `CAREER_RECOMMEND_PROMPT(profile)` → Gemini → `parseRecommendations()` → return array.

**Response:**

```json
{
  "recommendations": [
    {
      "title": "Data Analyst",
      "fit_score": 87,
      "description": "...",
      "required_skills": ["SQL", "Python"],
      "salary_range_myr": { "min": 4000, "max": 8000 },
      "growth_outlook": "Strong",
      "why_good_fit": "..."
    }
  ]
}
```

---

### `POST /api/learning-path`

Adaptive learning path advisor. Conducts a diagnostic conversation (up to 7 questions: age, track, level, goal, etc.) then generates a personalised JSON roadmap.

**Response (final message):**

```json
{
  "track": "Science",
  "level": "Intermediate",
  "focus_areas": ["Biology", "Chemistry"],
  "modules": [{ "title": "", "description": "", "duration": "", "courses": [] }]
}
```

---

### `GET /auth/callback`

Handles Supabase OAuth2 callback. Exchanges auth code for a session, then redirects to `/dashboard`.

---

## 5. Pages & UI Routes

### Public

| Route | File           | Purpose                                                    |
| ----- | -------------- | ---------------------------------------------------------- |
| `/`   | `app/page.tsx` | Landing page — hero, features, animated stats counter, CTA |

### Auth Group `/app/(auth)/`

| Route              | Purpose                                   |
| ------------------ | ----------------------------------------- |
| `/login`           | Email + password login                    |
| `/signup`          | Full name + email + password registration |
| `/forgot-password` | Password reset email trigger              |
| `/reset-password`  | New password entry                        |

Auth pages redirect authenticated users to `/dashboard`.

### Dashboard Group `/app/(dashboard)/`

All routes protected by middleware — unauthenticated users redirected to `/login`.

| Route                      | File                     | Status         | Purpose                                                            |
| -------------------------- | ------------------------ | -------------- | ------------------------------------------------------------------ |
| `/dashboard/upload`        | `upload/page.tsx`        | ✅ Full        | Drag-and-drop file upload, document list with search/filter/delete |
| `/dashboard/notes`         | `notes/page.tsx`         | ✅ Full        | Document list with AI note + exercise generation                   |
| `/dashboard/tutor`         | `tutor/page.tsx`         | ✅ Full        | Streaming AI chat, 3D VRM avatar, XP toasts, settings panel        |
| `/dashboard/learning-path` | `learning-path/page.tsx` | ✅ Full        | Adaptive diagnostic conversation + visual roadmap                  |
| `/dashboard/progress`      | `progress/page.tsx`      | 🔄 Placeholder | Progress dashboard (coming soon)                                   |

### Career Group `/app/(dashboard)/career/`

All routes share the dashboard sidebar. Hero sections use contained `rounded-2xl mx-6 mt-6` cards with solid color backgrounds and a subtle grid pattern overlay.

| Route               | Color  | Status  | Purpose                                                                                                                         |
| ------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/career`           | Indigo | ✅ Full | Hub: stats cards, journey stepper, profile banner with edit button                                                              |
| `/career/profile`   | Slate  | ✅ Full | Zod-validated form — education, skills, work experience, career goals; upserts on save; awards 50 XP on first save              |
| `/career/analyse`   | Violet | ✅ Full | Triggers AI skill gap analysis; displays match score ring, required/gap skills with resources, AI summary                       |
| `/career/modules`   | Teal   | ✅ Full | Kanban + list view of AI-curated learning modules; filter by status; module progress/certificate tracking; Re-run Analysis link |
| `/career/resume`    | Rose   | ✅ Full | Target role + tone selector; generates AI resume; renders structured sections; download/copy actions; version history           |
| `/career/recommend` | Amber  | ✅ Full | AI career role recommendations with fit score, salary range (MYR), growth outlook; "Set as Target" updates profile              |

---

## 6. Core Library (lib/)

### `lib/ai/gemini.ts`

| Export                                 | Description                                |
| -------------------------------------- | ------------------------------------------ |
| `getGeminiModel(name)`                 | Returns a Gemini model instance            |
| `buildSystemPrompt(settings, context)` | Builds mode+tone-aware system instructions |
| `generateTutorResponse(...)`           | Non-streaming single response              |
| `generateStreamingResponse(...)`       | Async generator yielding text chunks       |

**Teaching modes:**

| Mode          | Behaviour                            | Temp |
| ------------- | ------------------------------------ | ---- |
| `focused`     | Only answers from uploaded materials | 0.3  |
| `balanced`    | Pedagogically fills gaps             | 0.5  |
| `exploratory` | Deep mentor-level answers            | 0.7  |

**Voice tones:** `warm` (encouraging), `professional` (measured), `casual` (conversational)

**Model used:** `gemini-2.0-flash`

---

### `lib/ai/embeddings.ts`

| Export                           | Description                                                    |
| -------------------------------- | -------------------------------------------------------------- |
| `generateEmbedding(text)`        | Single embedding via Gemini REST API                           |
| `generateEmbeddingsBatch(texts)` | Batch of embeddings — 5 per batch, 100ms delay between batches |
| `cosineSimilarity(a, b)`         | Cosine distance between two vectors                            |

**Model:** `gemini-embedding-001` — **3072 dimensions**  
**API:** v1beta REST (not SDK, avoids serialisation overhead)

---

### `lib/ai/rag.ts`

| Export                                           | Description                                            |
| ------------------------------------------------ | ------------------------------------------------------ |
| `storeDocumentChunks(docId, chunks, embeddings)` | Bulk insert into `document_embeddings`                 |
| `findRelevantChunks(query, userId, opts)`        | Vector search OR focused document retrieval            |
| `assembleContext(query, userId, opts)`           | Returns formatted `[CONTEXT]` string for system prompt |
| `deleteDocumentEmbeddings(docId)`                | Removes all chunks for a document                      |
| `getDocumentChunkCount(docId)`                   | Count stored chunks                                    |

**Retrieval modes:**

- **Focused** (focusDocumentIds provided): Ordered chunks from those docs — full document context mode
- **Semantic** (default): `match_documents()` RPC — vector similarity threshold 0.4, top-K 5

---

### `lib/parsers/index.ts`

| Export                             | Description                                         |
| ---------------------------------- | --------------------------------------------------- |
| `parsePDF(buffer)`                 | pdf-parse → Gemini OCR fallback if < 100 words      |
| `parseDOCX(buffer)`                | mammoth library                                     |
| `parseXLSX(buffer)`                | xlsx library (`sheet_to_txt`)                       |
| `parseTXT(buffer)`                 | Plain text decode                                   |
| `parseDocument(buffer, mime)`      | Auto-dispatch to correct parser                     |
| `chunkText(text, size?, overlap?)` | Split by paragraphs (~1000 words, 200-word overlap) |

**PDF special cases:**

- File > 4 MB → goes directly to Gemini OCR (avoids OOM in Node.js)
- Gemini OCR prompt explicitly requests preserving logical reading order

---

### `lib/supabase/`

| File         | Client Type          | Use                                                                                           |
| ------------ | -------------------- | --------------------------------------------------------------------------------------------- |
| `client.ts`  | Browser (anon key)   | Client components, auth state                                                                 |
| `server.ts`  | Server (SSR cookies) | API routes, server components                                                                 |
| `queries.ts` | Server               | Pre-built queries: `getUserDocuments`, `getUserStats`, `getUserProgress`, `getRecentSessions` |

---

### `lib/gamification/index.ts`

**XP Rewards table:**

| Action              | XP  |
| ------------------- | --- |
| Complete session    | 50  |
| Ask question        | 5   |
| Correct quiz answer | 10  |
| Upload material     | 25  |
| Daily streak        | 30  |
| Complete topic      | 100 |
| First login         | 10  |
| Week streak         | 100 |

**Level formula:** `level = floor(sqrt(totalXP / 100))`

| Export                            | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `calculateLevel(xp)`              | Current level from XP                                  |
| `xpForNextLevel(level)`           | XP required for next level                             |
| `calculateLevelProgress(xp)`      | Percentage progress to next level                      |
| `awardXP(userId, amount, reason)` | Update DB, return `{ newLevel, leveledUp }`            |
| `updateStreak(userId)`            | Increment consecutive-day streak, auto-award streak XP |

---

### `lib/security/`

**`rate-limit.ts`**

| Limit          | Req | Window | Used by                  |
| -------------- | --- | ------ | ------------------------ |
| `API_LIMIT`    | 100 | 15 min | General API (IP-based)   |
| `AUTH_LIMIT`   | 10  | 15 min | Signup, login, init-user |
| `UPLOAD_LIMIT` | 10  | 1 hour | Upload, parse            |
| `CHAT_LIMIT`   | 50  | 15 min | Chat, learning-path      |
| `TTS_LIMIT`    | 60  | 15 min | TTS                      |

Backend: **Upstash Redis** in production, **in-memory Map** in local dev (auto-detected via `UPSTASH_REDIS_REST_URL`).

**`validation.ts`**

- Zod schemas: `emailSchema`, `passwordSchema` (min 8 chars, 1 letter, 1 digit)
- `validateFile()` — type + size + filename (blocks path traversal `../`)
- `verifyFileSignature()` — Magic number check: `%PDF`, `PK` (ZIP/DOCX/XLSX), `D0 CF 11 E0` (OLE2/legacy DOCX)

**`sanitization.ts`**

- `sanitizeHtml(input)` — Strip all HTML tags (DOMPurify)
- `sanitizeInput(input)` — Strip + trim
- `sanitizeRichText(input)` — Allow only safe tags: `b, i, em, strong, p, br`
- `escapeRegex(str)` — Escape regex metacharacters

---

### `lib/hooks/useUser.ts`

```typescript
useUser() → { user: User | null, loading: boolean }
```

Sets up `supabase.auth.onAuthStateChange()` subscription. Used in client components to gate UI by auth state.

---

### `lib/career/`

**`prompts.ts`** — Gemini prompt builders:

| Export                                                   | Description                                                                                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `SKILL_GAP_PROMPT(profile)`                              | Builds an analysis prompt requesting JSON with `required_skills`, `gap_skills` (with resources), `match_score`, `ai_summary` |
| `CAREER_RECOMMEND_PROMPT(profile)`                       | Requests JSON array of career role recommendations with fit score, salary (MYR), and growth outlook                          |
| `RESUME_GEN_PROMPT(profile, certs, modules, role, tone)` | Builds a resume generation prompt incorporating work experience, completed modules, and certificates                         |

**`parser.ts`** — Response parsing utilities:

| Export                                              | Description                                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `safeParseJson<T>(raw)`                             | Strips Markdown code fences then parses JSON; falls back to regex extraction                         |
| `parseGapAnalysis(raw)`                             | Parses Gemini gap analysis response into `RawGapAnalysis`                                            |
| `parseRecommendations(raw)`                         | Parses recommendation response into `RawRecommendations`                                             |
| `deriveModulesFromGap(userId, analysisId, gapData)` | Converts `gap_skills` array into `learning_modules` insert rows (`not_started`, `completion_pct: 0`) |

**`resources.ts`** — Curated fallback resource map: maps common skill names (e.g. `Python`, `SQL`, `Machine Learning`) to structured `{ title, url, type, free }` resource arrays. Used when Gemini returns empty resources for a skill.

---

### `lib/utils.ts`

| Export                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `cn(...classes)`        | Merge Tailwind classes (clsx + tailwind-merge) |
| `formatDate(date)`      | → "18 Mar 2026"                                |
| `formatFileSize(bytes)` | → "1.2 MB"                                     |
| `truncate(str, len)`    | Truncate with ellipsis                         |
| `formatTime(date)`      | → "09:45 AM"                                   |

---

## 7. Components

### UI Components (`components/ui/`)

| Component                             | Props / Behaviour                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Button`                              | variant: primary/secondary/danger/ghost/outline · size: sm/md/lg · loading spinner · icon slot |
| `Input`                               | label, error, hint, leftIcon, rightIcon · focus ring · red error display                       |
| `Card` / `CardHeader` / `CardSection` | padding: none/sm/md/lg · optional hover · onClick                                              |
| `ChatBubble`                          | role: user/ai · content · timestamp · isTyping (animated dots) · Markdown render in AI bubble  |
| `FileUpload`                          | Drag-and-drop · accept list · maxSizeMB · MIME validation                                      |
| `ErrorMessage`                        | variant: error/warning/info/success · optional retry button                                    |
| `LoadingSkeleton`                     | `Skeleton` · `CardSkeleton` · `ChatBubbleSkeleton` · `ListSkeleton`                            |
| `ProgressRing`                        | SVG circle · value/max · strokeWidth · centre label + sublabel                                 |
| `BarChart`                            | `data: [{label, value}]` · maxValue · barColor                                                 |
| `StatusBadge`                         | processed (green) · processing (blue pulsing) · pending (yellow) · error (red)                 |
| `Modal`                               | Backdrop click + Escape to close · sizes: sm/md/lg/xl · locks body scroll                      |

All exported via `components/ui/index.ts` barrel.

### Dashboard Components (`components/dashboard/`)

**`Sidebar.tsx`**

- Collapsible sidebar with icon nav
- Primary nav: Home, Learning Path (New badge), Upload, Tutor (AI badge), Notes, Community, Progress
- Career section: Career Hub, Career Profile, Skill Gap Analysis, Learning Modules, AI Resume Builder, Career Recommendations (AI badge)
- Secondary nav: Achievements, Settings, Help
- Mobile drawer overlay
- User avatar from Supabase session
- Active route highlight
- Sign-out button

**`ModuleCard.tsx`** (`components/career/`)

- Displays a single learning module with title, skill target, difficulty badge, estimated hours, description
- Inline status toggle (Not Started → In Progress → Completed)
- Progress bar with `completion_pct` input
- Certificate URL field (unlocks on completion)
- `PATCH /api/career/modules/[id]` on every change

---

## 8. Database Schema

### Tables

**`user_progress`**

```sql
id uuid PK, user_id uuid FK(auth.users) UNIQUE,
level int DEFAULT 1, xp int DEFAULT 0,
streak int DEFAULT 0, last_active_date date
```

**`user_stats`**

```sql
id uuid PK, user_id uuid FK UNIQUE,
total_sessions int DEFAULT 0, total_questions int DEFAULT 0,
topics_completed int DEFAULT 0, study_time int DEFAULT 0
```

**`documents`**

```sql
id uuid PK, user_id uuid FK,
filename text, file_path text, file_type text, file_size int,
title text, subject text, language text DEFAULT 'en',
processed bool DEFAULT false, parsed_text text,
created_at timestamptz DEFAULT now()
```

**`document_embeddings`**

```sql
id uuid PK, document_id uuid FK(documents),
chunk_index int, content text,
embedding vector(3072)           -- pgvector
```

**`tutoring_sessions`**

```sql
id uuid PK, user_id uuid FK,
started_at timestamptz, ended_at timestamptz, message_count int DEFAULT 0
```

**`achievements`** (seeded, 12 rows)

```sql
id uuid PK, key text UNIQUE, title text, description text,
xp_reward int, icon text
```

**`user_achievements`**

```sql
id uuid PK, user_id uuid FK, achievement_id uuid FK,
unlocked_at timestamptz DEFAULT now()
```

**`career_profiles`**

```sql
id uuid PK, user_id uuid FK(auth.users) UNIQUE,
full_name text, current_level text, field_of_study text,
institution text, graduation_year int,
target_career text, target_industry text,
skills text[], certifications text[],
work_experience jsonb,    -- [{ company, role, duration_months, description }]
career_goals text, location text DEFAULT 'Malaysia',
created_at timestamptz, updated_at timestamptz
```

**`skill_gap_analyses`**

```sql
id uuid PK, user_id uuid FK,
target_career text,
required_skills jsonb,   -- [{ skill, importance, category }]
current_skills text[],
gap_skills jsonb,        -- [{ skill, importance, category, estimatedHours, resources[] }]
match_score int,         -- 0–100
ai_summary text,
created_at timestamptz DEFAULT now()
```

**`learning_modules`**

```sql
id uuid PK, user_id uuid FK, gap_analysis_id uuid FK(skill_gap_analyses),
title text, skill_target text, description text,
difficulty text, estimated_hours int,
status text DEFAULT 'not_started',   -- not_started | in_progress | completed
completion_pct int DEFAULT 0,
resources jsonb,          -- [{ title, url, type, free }]
certificate_url text,
completed_at timestamptz,
created_at timestamptz DEFAULT now()
```

_Re-running analysis deletes all existing modules for the user and inserts fresh ones._

**`resume_versions`**

```sql
id uuid PK, user_id uuid FK,
version_name text, target_role text, tone text,
content jsonb,   -- { summary, skills, experience, education, certifications }
created_at timestamptz DEFAULT now()
```

**`user_certificates`**

```sql
id uuid PK, user_id uuid FK,
title text, issuer text, issued_date date,
credential_url text,
created_at timestamptz DEFAULT now()
```

### Vector Search Function

```sql
CREATE FUNCTION match_documents(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (id uuid, document_id uuid, content text, similarity float)
```

Uses `1 - (embedding <=> query_embedding)` cosine similarity. Filtered by `p_user_id` if provided.

### Row-Level Security

All tables have RLS enabled. Policy pattern: `user_id = auth.uid()`. Users can only read/write their own rows. `document_embeddings` inherits security via `document_id → documents → user_id`.

---

## 9. Key Data Flows

### Document Upload

```
Browser → POST /api/upload (FormData)
  → verifyFileSignature()            magic number check
  → parseDocument()                  extract text
  → sanitizeText()                   strip null bytes / control chars
  → chunkText()                      500-word chunks, 50-word overlap
  → generateEmbeddingsBatch()        Gemini embedding-001 (3072-dim)
  → Supabase Storage upload          documents/{userId}/{uuid}
  → DB insert: documents             (with parsed_text)
  → DB bulk insert: document_embeddings
  → response { wordCount, chunkCount }
```

### Chat / Tutor

```
Browser → POST /api/chat (JSON)
  → rate limit check (per user)
  → assembleContext(query, userId, { focusDocumentIds })
      ├── focused mode: SELECT chunks WHERE document_id IN (ids) ORDER BY chunk_index
      └── semantic mode: match_documents() RPC (threshold 0.4, top-K 5)
  → buildSystemPrompt(settings, context)
  → generateStreamingResponse()       Gemini gemini-2.0-flash
  → SSE stream to browser
```

### Exercise Generation

```
Browser → POST /api/exercises/generate { documentId }
  → verify document ownership
  → fetch first 25 content chunks
  → Gemini prompt → JSON { quickCheck, guidedPractice }
  → parse + clean Markdown fences
  → response JSON
```

### Learning Path Diagnostic

```
Browser → POST /api/learning-path (conversational turns)
  → CHAT_LIMIT check
  → System prompt: diagnostic questioning rules (max 7 questions)
  → Gemini response: single question + multiple-choice options
  → After ≥5 answers → Gemini generates roadmap JSON
  → Browser renders ModuleDetailView
```

### Gamification

```
User action (upload / answer / session complete)
  → server calls awardXP(userId, amount)
  → UPDATE user_progress SET xp = xp + amount
  → calculateLevel(newXp) → check levelup
  → updateStreak() → consecutive-day check → streak XP bonus
  → return { newLevel, leveledUp, streak }
```

---

## 10. Security & Rate Limiting

| Layer              | Implementation                                                          |
| ------------------ | ----------------------------------------------------------------------- |
| Authentication     | Supabase JWT (SSR cookie-based)                                         |
| Session timeout    | 30 min inactivity → redirect to login (middleware.ts)                   |
| Rate limiting      | Upstash Redis (prod) / in-memory (dev)                                  |
| File validation    | MIME whitelist + magic number verification                              |
| Input sanitization | DOMPurify (XSS), Zod (schema validation)                                |
| Text sanitization  | Strips `\u0000`, C0/C1 control chars, lone surrogates (Postgres safety) |
| Security headers   | CSP, X-Frame-Options: DENY, HSTS 2yr, X-Content-Type-Options: nosniff   |
| RLS                | All Supabase tables: `user_id = auth.uid()`                             |

**CSP allows:** Gemini API (`generativelanguage.googleapis.com`), Supabase, Google CDN, ReadyPlayer.me  
**Blocked:** camera access (Permissions-Policy), iframes (X-Frame-Options)

---

## 11. Configuration & Environment

### Environment Variables

| Variable                        | Scope       | Purpose                                 |
| ------------------------------- | ----------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public      | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public      | Supabase anon/public key                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only | Privileged DB operations (delete, init) |
| `GEMINI_API_KEY`                | Server only | All Gemini API calls                    |
| `UPSTASH_REDIS_REST_URL`        | Server only | Redis rate limiter endpoint (prod)      |
| `UPSTASH_REDIS_REST_TOKEN`      | Server only | Redis auth token (prod)                 |
| `NODE_ENV`                      | Auto        | `development` → in-memory rate limiting |

### `next.config.ts`

- `serverExternalPackages`: `pdf-parse`, `pdfjs-dist` (Node.js native modules)
- Security headers applied on all responses
- Remote image patterns: `readyplayer.me`

### `middleware.ts`

- Refreshes Supabase auth session on every request
- Session timeout: checks `last_activity` cookie (30 min max)
- Protected paths: `/dashboard/**` → redirect to `/login` if unauthenticated
- Auth paths: `/login`, `/signup` → redirect to `/dashboard` if authenticated
- Matcher: excludes `_next/static`, `_next/image`, `favicon.ico`

### `netlify.toml`

- Configures `@netlify/plugin-nextjs` for serverless Next.js deployment on Netlify

---

## 12. Dependencies

### Runtime

| Package                        | Version                                     | Purpose                            |
| ------------------------------ | ------------------------------------------- | ---------------------------------- |
| `next`                         | 16.1.6                                      | Framework                          |
| `react` / `react-dom`          | 19.x                                        | UI rendering                       |
| `@supabase/supabase-js`        | ^2.95.3                                     | DB + auth client                   |
| `@supabase/ssr`                | ^0.8.0                                      | SSR cookie handling                |
| `@google/genai`                | ^1.43.0                                     | Gemini AI SDK                      |
| `@google/generative-ai`        | ^0.24.1                                     | Gemini generative AI               |
| `@google-cloud/speech`         | ^7.2.1                                      | Speech recognition                 |
| `@google-cloud/text-to-speech` | ^6.4.0                                      | TTS (secondary)                    |
| `@upstash/redis`               | ^1.36.3                                     | Distributed rate limiting          |
| `@react-three/fiber`           | ^9.5.0                                      | 3D rendering (Three.js for avatar) |
| `@react-three/drei`            | ^10.7.7                                     | Three.js helpers                   |
| `@pixiv/three-vrm`             | ^3.5.0                                      | VRM avatar loader                  |
| `framer-motion`                | ^12.34.0                                    | Animations                         |
| `react-markdown`               | —                                           | Markdown rendering in chat         |
| `react-hot-toast`              | —                                           | Toast notifications                |
| `mammoth`                      | ^1.11.0                                     | DOCX → text                        |
| `pdf-parse`                    | —                                           | PDF text layer extraction          |
| `xlsx`                         | —                                           | Excel/spreadsheet parsing          |
| `zod`                          | —                                           | Runtime schema validation          |
| `lucide-react`                 | ^0.575.0                                    | Icon library                       |
| `clsx`                         | ^2.1.1                                      | Class name utility                 |
| `tailwind-merge`               | —                                           | Tailwind class deduplication       |
| `html2canvas`                  | ^1.4.1                                      | Screenshot to canvas               |
| `jspdf`                        | ^4.2.0                                      | PDF export                         |
| `date-fns`                     | ^4.1.0                                      | Date formatting                    |
| sanitization                   | regex-based server sanitization (Node-safe) |

### Dev

| Package                  | Purpose                   |
| ------------------------ | ------------------------- |
| `typescript`             | Type checking             |
| `tailwindcss`            | Utility-first CSS         |
| `eslint-plugin-security` | Static security analysis  |
| `@netlify/plugin-nextjs` | Netlify deployment plugin |

---

## 13. Feature Status

| Feature                             | Status         | Notes                                                                                          |
| ----------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| User auth (email/password)          | ✅ Complete    | Supabase Auth + SSR cookies                                                                    |
| Document upload (PDF/DOCX/XLSX/TXT) | ✅ Complete    | Magic number validation, OCR fallback                                                          |
| Gemini OCR for image-heavy PDFs     | ✅ Complete    | Fallback at < 100 words from pdf-parse                                                         |
| Document embedding + RAG            | ✅ Complete    | pgvector 3072-dim, focusDocumentIds filter                                                     |
| AI tutor chat (streaming)           | ✅ Complete    | SSE, teaching modes, voice tones                                                               |
| XP / level gamification             | ✅ Complete    | In-session toasts, milestone banners                                                           |
| Exercise generation                 | ✅ Complete    | Multiple-choice + guided practice                                                              |
| Exercise feedback                   | ✅ Complete    | AI evaluation of answers                                                                       |
| Notes generation                    | ✅ Complete    | Structured key concepts + terms                                                                |
| Text-to-speech                      | ✅ Complete    | Gemini 2.5 Flash, WAV output                                                                   |
| 3D VRM avatar (Maya)                | ✅ Complete    | Three.js + @pixiv/three-vrm                                                                    |
| Adaptive learning path              | ✅ Complete    | Diagnostic chat → JSON roadmap                                                                 |
| Rate limiting                       | ✅ Complete    | Redis (prod) / in-memory (dev)                                                                 |
| Career profile                      | ✅ Complete    | Zod-validated upsert, 50 XP on first save                                                      |
| Skill gap analysis                  | ✅ Complete    | Gemini-powered, match score, curated resources, 75 XP                                          |
| AI learning modules                 | ✅ Complete    | Auto-generated from gap analysis, kanban + list view, status/progress/certificate tracking     |
| AI resume builder                   | ✅ Complete    | Profile + certs + completed modules → structured resume, version history, 40 XP first generate |
| Career recommendations              | ✅ Complete    | Fit score, salary range (MYR), growth outlook, "Set as Target" action                          |
| Progress dashboard                  | 🔄 Placeholder | Page exists, UI not built                                                                      |
| Achievements page                   | 🔄 Placeholder | DB schema seeded, UI not built                                                                 |
| Community features                  | 🔄 Placeholder | Nav item exists, no implementation                                                             |
| Settings page                       | 🔄 Placeholder | Not yet implemented                                                                            |
| Help page                           | 🔄 Placeholder | Not yet implemented                                                                            |

---

_Last updated: 18 March 2026_
