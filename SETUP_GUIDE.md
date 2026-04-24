# RimbaX AI Tutor - Complete Setup Guide

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation Steps](#installation-steps)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [Development Workflow](#development-workflow)
9. [Troubleshooting](#troubleshooting)

---

## 📋 Project Overview

### What is RimbaX?

RimbaX is a free AI-powered personal tutoring system designed for ASEAN youth (university students, TVET learners, and rural secondary school students). It transforms static learning resources into real-time, human-like tutoring experiences.

### Core Features

- 📚 **Personalized Learning**: Upload your study materials (PDF, DOCX, XLSX, TXT)
- 🤖 **AI Tutor**: Powered by Google's Gemini AI with RAG (Retrieval-Augmented Generation)
- 🎭 **3D Avatar**: Interactive Ready Player Me avatar with emotions
- 🎤 **Voice Interaction**: Speak naturally using Google Speech-to-Text & Text-to-Speech
- 🎮 **Gamification**: XP, levels, achievements, and daily streaks
- 🌏 **Multi-language**: Support for EN, MS, ID, VI, TH

### Target Users

- University students in ASEAN countries
- TVET (Technical and Vocational Education and Training) learners
- Rural secondary school students
- Anyone who needs free, accessible tutoring

---

## 💻 Tech Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **3D Graphics**: Three.js + React Three Fiber
- **Language**: TypeScript

### Backend

- **Runtime**: Node.js 20+
- **API**: Next.js API Routes (serverless functions)
- **File Processing**: pdf-parse, mammoth, xlsx

### AI & Voice

- **AI Model**: Google Gemini API (gemini-1.5-flash)
- **Voice Input**: Google Cloud Speech-to-Text API
- **Voice Output**: Google Cloud Text-to-Speech API
- **Vector DB**: Supabase with pgvector extension

### Database & Storage

- **Database**: Supabase PostgreSQL
- **Vector Storage**: Supabase with pgvector
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth

### Security

- **Sanitization**: DOMPurify
- **Rate Limiting**: express-rate-limit
- **Malware Scanning**: ClamScan (optional)
- **Headers**: helmet, CORS

---

## ✅ Prerequisites

### Required Software

#### 1. Node.js (v20 or higher)

- **Download**: https://nodejs.org/
- **Verify installation**:
  ```bash
  node --version  # Should show v20.x.x or higher
  npm --version   # Should show v10.x.x or higher
  ```

#### 2. Git

- **Download**: https://git-scm.com/
- **Verify installation**:
  ```bash
  git --version   # Should show version 2.x.x or higher
  ```

#### 3. Code Editor

- **Recommended**: Visual Studio Code (https://code.visualstudio.com/)
- **Extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Required Accounts & API Keys

#### 1. Supabase Account (Free Tier)

- **Sign up**: https://supabase.com/
- **What you'll get**:
  - PostgreSQL database
  - Authentication
  - Storage for files
  - Vector database with pgvector
- **Cost**: FREE (2 free projects)

#### 2. Google Cloud Platform Account

- **Sign up**: https://cloud.google.com/
- **Enable APIs**:
  - Speech-to-Text API
  - Text-to-Speech API
- **What you'll need**:
  - Service account JSON credentials
- **Cost**: FREE tier includes:
  - Speech-to-Text: 60 minutes/month
  - Text-to-Speech: 4 million characters/month

#### 3. Google AI Studio (Gemini API)

- **Sign up**: https://aistudio.google.com/
- **Get API Key**: Create a free API key
- **Cost**: FREE tier includes generous limits

#### 4. Ready Player Me (Optional - for Avatar)

- **Sign up**: https://readyplayer.me/
- **What it does**: Provides customizable 3D avatars
- **Cost**: FREE

---

## 🚀 Installation Steps

### Step 1: Clone or Initialize Project

**Option A: Start Fresh (Recommended)**

```bash
# Navigate to your projects folder
cd c:\Users\60195\Documents\rimbax-ai-tutor

# The project folder already exists, we'll initialize Next.js here
```

**Option B: Clone from Git (if repository exists)**

```bash
git clone <repository-url>
cd rimbax-ai-tutor
```

### Step 2: Initialize Next.js Project

```bash
# This will be done programmatically
# Creates a Next.js 14+ app with TypeScript, Tailwind CSS, App Router
```

### Step 3: Install Core Dependencies

```bash
npm install @supabase/supabase-js@latest
npm install @google-cloud/speech@latest
npm install @google-cloud/text-to-speech@latest
npm install @google/generative-ai@latest
npm install @react-three/fiber@latest
npm install @react-three/drei@latest
npm install three@latest
npm install framer-motion@latest
npm install zod@latest
npm install react-hot-toast@latest
npm install date-fns@latest
```

### Step 4: Install File Processing Libraries

```bash
npm install pdf-parse@latest
npm install mammoth@latest
npm install xlsx@latest
```

### Step 5: Install Security Dependencies

```bash
npm install helmet@latest
npm install cors@latest
npm install express-rate-limit@latest
npm install dompurify@latest
```

### Step 6: Install Development Dependencies

```bash
npm install -D @types/node@latest
npm install -D @types/react@latest
npm install -D @types/three@latest
npm install -D eslint-plugin-security@latest
npm install -D prettier@latest
npm install -D eslint-config-prettier@latest
```

---

## ⚙️ Environment Configuration

### Step 1: Create Environment File

Create a file named `.env.local` in the root directory:

```bash
# Navigate to project root
cd c:\Users\60195\Documents\rimbax-ai-tutor

# Create .env.local file (will be done programmatically)
```

### Step 2: Add Environment Variables

```env
# ================================
# SUPABASE CONFIGURATION
# ================================
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ================================
# GOOGLE CLOUD CONFIGURATION
# ================================
# Path to your Google Cloud service account JSON file
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# ================================
# GEMINI AI CONFIGURATION
# ================================
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# ================================
# APPLICATION CONFIGURATION
# ================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Getting Your API Keys

#### Supabase Keys

1. Go to https://app.supabase.com/
2. Create a new project (or select existing)
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

#### Google Cloud Credentials

1. Go to https://console.cloud.google.com/
2. Create a new project (e.g., "rimbax-ai-tutor")
3. Enable APIs:
   - Cloud Speech-to-Text API
   - Cloud Text-to-Speech API
4. Create Service Account:
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Name: "rimbax-speech-service"
   - Grant roles: "Cloud Speech Administrator", "Cloud Text-to-Speech Admin"
5. Create JSON key:
   - Click on service account
   - Keys → Add Key → Create New Key → JSON
   - Download and save as `google-credentials.json` in project root

#### Gemini API Key

1. Go to https://aistudio.google.com/
2. Click "Get API Key"
3. Create new API key
4. Copy key to `.env.local`

---

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to https://app.supabase.com/
2. Click "New Project"
3. Fill in:
   - Name: RimbaX AI Tutor
   - Database Password: (save this securely)
   - Region: Southeast Asia (Singapore)
4. Click "Create new project" (takes ~2 minutes)

### Step 2: Enable pgvector Extension

1. In Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Step 3: Create Database Schema

Run the following SQL in Supabase SQL Editor:

```sql
-- User progress tracking
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User statistics
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  topics_completed INTEGER DEFAULT 0,
  study_time INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Achievements
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Uploaded documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  title TEXT,
  subject TEXT,
  language TEXT DEFAULT 'en',
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document embeddings for RAG
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutoring sessions
CREATE TABLE tutoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  message_count INTEGER DEFAULT 0,
  topic TEXT
);

-- Conversation history
CREATE TABLE conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector index
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### Step 4: Enable Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only access their own data)
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own embeddings" ON document_embeddings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON tutoring_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON conversation_history
  FOR ALL USING (auth.uid() = user_id);
```

### Step 5: Create Vector Similarity Search Function

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE user_id = match_documents.user_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

### Step 6: Setup Storage Bucket

1. In Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `user-materials`
4. Public: NO (keep private)
5. Click "Create bucket"
6. Go to Policies → Add new policy for the bucket:

   ```sql
   -- Users can upload to their own folder
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'user-materials'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Users can view their own files
   CREATE POLICY "Users can view own files"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'user-materials'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

---

## 🏃 Running the Application

### Development Mode

```bash
# Navigate to project directory
cd c:\Users\60195\Documents\rimbax-ai-tutor

# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

The application will be available at: http://localhost:3000

### Production Build

```bash
# Build for production
npm run build

# Run production server
npm start
```

### Other Commands

```bash
# Run linter
npm run lint

# Run security audit
npm audit

# Fix security vulnerabilities
npm audit fix

# Format code with Prettier
npm run format  # (if configured)
```

---

## 🛠️ Development Workflow

### Daily Development Checklist

1. Pull latest changes: `git pull`
2. Install new dependencies: `npm install`
3. Run development server: `npm run dev`
4. Make changes
5. Test in browser
6. Commit changes: `git add .` → `git commit -m "message"`
7. Push changes: `git push`

### Folder Structure

```
rimbax-ai-tutor/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── (dashboard)/         # Protected app pages
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── avatar/              # 3D avatar components
│   ├── voice/               # Voice interaction components
│   └── tutoring/            # Tutoring session components
├── lib/                     # Utility functions
│   ├── supabase/            # Supabase client setup
│   ├── ai/                  # Gemini AI integration
│   ├── voice/               # Speech APIs
│   └── security/            # Security utilities
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
├── .env.local              # Environment variables (DO NOT COMMIT)
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/voice-interaction

# Make changes and commit
git add .
git commit -m "Add voice recording functionality"

# Push to remote
git push origin feature/voice-interaction

# Create pull request on GitHub (if using)
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: `npm install` fails

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: Supabase connection error

**Solution:**

- Verify `.env.local` has correct credentials
- Check if Supabase project is active
- Ensure RLS policies are set up correctly

#### Issue: Google Cloud API authentication fails

**Solution:**

- Verify `google-credentials.json` exists in project root
- Check if APIs are enabled in Google Cloud Console
- Ensure service account has correct roles

#### Issue: Port 3000 already in use

**Solution:**

```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

#### Issue: TypeScript errors

**Solution:**

```bash
# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

#### Issue: Tailwind CSS classes not working

**Solution:**

- Check `tailwind.config.ts` content paths
- Restart development server
- Clear browser cache

---

## 📚 Additional Resources

### Documentation

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Gemini API**: https://ai.google.dev/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber

### Security Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security

### Learning Resources

- **Next.js Tutorial**: https://nextjs.org/learn
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS Tutorial**: https://tailwindcss.com/docs/utility-first

---

## 🎯 Next Steps

After completing setup:

1. ✅ Verify all prerequisites are installed
2. ✅ Set up environment variables
3. ✅ Create and configure Supabase database
4. ✅ Run the application
5. 📋 Follow the [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md) for development

---

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Review error messages carefully
3. Search existing issues on GitHub
4. Check Supabase/Google Cloud status pages

---

**Last Updated**: February 13, 2026
**Version**: 1.0.0
