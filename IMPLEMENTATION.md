# RepoMind MVP Implementation Guide — 2 Week Execution Plan

**Status**: Complete 2-Week Technical Specification  
**Project**: RepoMind — AI-powered GitHub repository analysis SaaS  
**Execution Model**: Solo full-time developer, 14 consecutive days  
**Target Deliverables**: Production MVP with auth, async analysis, visualization, sharing, and payments  

---

## TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Phase Breakdown (8 Phases, 14 Days)](#phases)
3. [Complete Technical Specifications](#complete-technical-specs)
4. [Code Implementation (All Files)](#complete-code)
5. [Verification Checklist](#verification)
6. [Deployment Instructions](#deployment)

---

## QUICK START

### Pre-Flight (Do This First!)

```bash
# 1. Ensure you have these accounts ready:
# - GitHub (for OAuth app creation)
# - Supabase (PostgreSQL database)
# - Upstash (Redis, free tier)
# - Anthropic (Claude API key)
# - Razorpay (payments, test keys for dev)
# - Vercel (frontend hosting)
# - Railway (worker process hosting)

# 2. Verify local setup
node --version    # Should be 18+
npm --version     # Any recent version

# 3. Clone and setup
cd /home/sahil/projects/repomind
npm install

# 4. Create .env.local from .env.example template
cp .env.example .env.local
# Fill in all values from your accounts above
```

---

## PHASES

A 2-week MVP broken into 8 manageable phases across 14 days.

### PHASE 0: Baseline & Standards (Day 0.5)
**Goal**: Establish conventions and verify local environment  
**Deliverables**: STANDARDS.md, confirmed npm/node, baseline commit

#### Tasks:
1. **Verify Node/npm**
   ```bash
   node --version
   npm --version
   npm ls next
   ```

2. **Create STANDARDS.md** in project root
   - API response envelope format (success/error)
   - Error code constants
   - File naming conventions
   - TypeScript strictness rules
   - Git commit format

3. **Test baseline app**
   ```bash
   npm run dev
   # Visit http://localhost:3000 — should show next.js welcome page
   ```

4. **Initial commit**
   ```bash
   git add .
   git commit -m "[PHASE-0] Baseline and standards established"
   ```

#### Status Check: ✅ When node/npm work, baseline page loads, and .gitignore has .env*

---

### PHASE 1: Project Foundation (Day 1)
**Goal**: Install all dependencies and create project scaffolding  
**Deliverables**: All deps installed, shadcn/ui configured, npm scripts ready

#### 1.1 Install Dependencies

```bash
# Core dependencies
npm install \
  @prisma/client \
  next-auth@5 \
  @next-auth/prisma-adapter \
  @tanstack/react-query \
  zod \
  zustand \
  @anthropic-ai/sdk \
  bullmq \
  ioredis \
  razorpay \
  @upstash/ratelimit \
  @upstash/redis \
  react-markdown \
  remark-gfm \
  rehype-highlight \
  d3 \
  resend \
  @sentry/nextjs \
  date-fns \
  lucide-react \
  clsx \
  tailwind-merge \
  nanoid \
  react-hot-toast

# Dev dependencies
npm install -D \
  prisma \
  @types/d3 \
  tsx \
  @types/node \
  @types/react \
  @types/react-dom \
  typescript
```

**Verification**: `npm ls prisma` shows installed version

#### 1.2 Configure shadcn/ui

```bash
npx shadcn-ui@latest init
# When prompted:
# - Style: New York
# - Color: Zinc
# - CSS Variables: yes

# Add all needed components
npx shadcn-ui@latest add button input card badge dialog toast \
  skeleton progress tabs separator dropdown-menu avatar sheet tooltip
```

**Verification**: `src/components/ui/` folder created with component files

#### 1.3 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "node prisma/seed.js",
    "worker": "tsx src/worker.ts",
    "worker:dev": "tsx watch src/worker.ts"
  }
}
```

#### 1.4 Create Environment Template

**File**: `.env.example`

```env
# ─── Authentication ───
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# ─── Database ───
DATABASE_URL=
DIRECT_URL=

# ─── Redis ───
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ─── AI ───
ANTHROPIC_API_KEY=

# ─── Payments ───
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# ─── Monitoring ───
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# ─── Email ───
RESEND_API_KEY=
```

#### 1.5 Verify Build

```bash
npm run lint        # Should pass
npm run typecheck   # Should pass
npm run build       # Should complete
```

#### 1.6 Commit

```bash
git add .
git commit -m "[PHASE-1] Install all dependencies and configure shadcn/ui"
```

**Status Check**: ✅ When `npm run build` passes and no TypeScript errors exist

---

### PHASE 2: Database & Authentication (Days 1-2)
**Goal**: Prisma schema, database migrations, NextAuth setup  
**Deliverables**: DB fully migrated, login flow working, user in database

#### 2.1 Create Prisma Schema

**File**: `prisma/schema.prisma` (Copy ENTIRE schema from COMPLETE_SPEC.md Section 3)

Key points:
- All enum definitions (Plan, RepoStatus, JobStatus, etc.)
- All models (User, Repo, AnalysisResult, Job, Subscription, Payment, etc.)
- All relations and indexes
- Foreign key constraints

```bash
# After creating schema:
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio  # Verify tables created
```

#### 2.2 Create Prisma Singleton

**File**: `src/lib/db.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

#### 2.3 NextAuth Setup

Create **File**: `src/lib/auth.ts`

```typescript
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubId: profile.id.toString(),
          githubUsername: profile.login,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: {
            plan: true,
            creditsRemaining: true,
            githubUsername: true,
          },
        });
        if (dbUser) {
          session.user.plan = dbUser.plan;
          session.user.creditsRemaining = dbUser.creditsRemaining;
          session.user.githubUsername = dbUser.githubUsername;
        }
      }
      return session;
    },
    async signIn({ user, profile }) {
      if (profile) {
        await db.user
          .update({
            where: { id: user.id },
            data: {
              githubId: (profile as any).id?.toString(),
              githubUsername: (profile as any).login,
              image: (profile as any).avatar_url,
            },
          })
          .catch(() => {});
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
};
```

#### 2.4 Session Type Extension

**File**: `src/types/next-auth.d.ts`

```typescript
import type { Plan } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: Plan;
      creditsRemaining: number;
      githubUsername?: string | null;
    };
  }
}
```

#### 2.5 NextAuth Route Handler

**File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 2.6 Create Providers Component

**File**: `src/components/providers.tsx`

```typescript
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

#### 2.7 Update Root Layout

**File**: `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "RepoMind - AI-Powered Repository Analysis",
  description:
    "Understand any GitHub repository in seconds with AI-powered analysis, visual architecture maps, and onboarding guides.",
  metadataBase: new URL("https://repomind.vercel.app"),
  openGraph: {
    title: "RepoMind",
    description: "AI-Powered Repository Analysis",
    url: "https://repomind.vercel.app",
    siteName: "RepoMind",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

#### 2.8 GitHub OAuth App Creation

1. GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Fill in:
   - **Application name**: `RepoMind`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy **Client ID** and generate **Client Secret**
4. Add to `.env.local`:
   ```env
   GITHUB_CLIENT_ID=xxxxx
   GITHUB_CLIENT_SECRET=xxxxx
   ```

#### 2.9 Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
# Copy output to .env.local as NEXTAUTH_SECRET
```

#### 2.10 Test Login Flow

```bash
npm run dev
# Visit http://localhost:3000
# Click login (redirects to GitHub)
# After auth, verify user in:
npx prisma studio
# Should see user in User table
```

#### 2.11 Commit

```bash
git add .
git commit -m "[PHASE-2] Database schema and NextAuth authentication"
```

**Status Check**: ✅ When login works, user appears in database, and session contains plan/credits

---

### PHASE 3: Core Services & Infrastructure (Days 2-3)
**Goal**: Build all service layers, validations, and utilities  
**Deliverables**: All infra ready, Redis + Queue + AI clients functional

#### 3.1 Create Types

**File**: `src/types/index.ts` (See COMPLETE_SPEC.md Section 8)

All interfaces:
- FileNode, GraphNode, GraphEdge
- DependencyGraph, EntryPoint, TechStack
- ArchitectureAnalysis, AnalysisResult
- JobProgress

#### 3.2 Create Constants

**File**: `src/lib/constants.ts`

```typescript
export const IGNORE_DIRS = new Set([
  "node_modules", ".git", "__pycache__", "dist", "build", ".next",
  "vendor", "venv", ".venv", "coverage", ".cache", ".turbo",
  ".vercel", ".output", ".svelte-kit", "target", ".idea",
]);

export const IGNORE_FILES = new Set([
  ".DS_Store", "Thumbs.db", ".env", ".env.local", ".env.production",
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
]);

export const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp3", ".mp4", ".wav", ".avi", ".mov",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".exe", ".dll", ".so", ".dylib", ".bin",
  ".pyc", ".class", ".o", ".obj",
]);

export const MAX_DEPTH = 12;
export const MAX_FILES = 1500;
export const MAX_FILE_SIZE = 200 * 1024; // 200KB

export const PLANS = {
  per_repo: { name: "Per Repo", credits: 1, amount: 9900 },
  pro_monthly: { name: "Pro Monthly", credits: Infinity, amount: 29900 },
  pro_yearly: { name: "Pro Yearly", credits: Infinity, amount: 249900 },
};

export const ANALYSIS_TIMEOUT = 10 * 60 * 1000;
export const CLONE_TIMEOUT = 60 * 1000;
export const MAX_RETRIES = 3;
```

#### 3.3 Create Redis Client

**File**: `src/lib/redis.ts`

```typescript
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

#### 3.4 Create BullMQ Queue

**File**: `src/lib/queue.ts`

```typescript
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const queue = new Queue("repo-analysis", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
```

#### 3.5 Create AI Client

**File**: `src/lib/ai.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const AI_CONFIG = {
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 4096,
  temperature: 0.3,
};
```

#### 3.6 Create Razorpay Client

**File**: `src/lib/razorpay.ts`

```typescript
import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return generated === signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return generated === signature;
}
```

#### 3.7 Create Validations

**File**: `src/lib/validations/repo.ts`

```typescript
import { z } from "zod";

export const analyzeSchema = z.object({
  githubUrl: z
    .string()
    .url()
    .regex(
      /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/tree\/[\w.-]+)?$/,
      "Must be a valid GitHub repository URL"
    ),
});

export type AnalyzeRequest = z.infer<typeof analyzeSchema>;
```

**File**: `src/lib/validations/payment.ts`

```typescript
import { z } from "zod";

export const createOrderSchema = z.object({
  plan: z.enum(["per_repo", "pro_monthly", "pro_yearly"]),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;
```

#### 3.8 Create API Response Helpers

**File**: `src/lib/api-response.ts`

```typescript
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } };
}

export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_URL: "Invalid GitHub URL format",
  UNAUTHORIZED: "Authentication required",
  CREDITS_EXHAUSTED: "No analysis credits remaining",
  RATE_LIMITED: "Too many requests. Please try later",
  REPO_NOT_FOUND: "Repository not found or is private",
  BRANCH_NOT_FOUND: "Specified branch does not exist",
  CLONE_TIMEOUT: "Clone operation timed out",
  CLONE_FAILED: "Failed to clone repository",
  INVALID_SIGNATURE: "Invalid signature",
  ANALYSIS_FAILED: "Analysis job failed",
  TIMEOUT: "Job timed out",
};
```

#### 3.9 Create Rate Limiter

**File**: `src/lib/ratelimit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const analyzeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 d"),
  prefix: "ratelimit:analyze:free",
});

export const analyzeRateLimitPro = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 d"),
  prefix: "ratelimit:analyze:pro",
});

export const globalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "ratelimit:global",
});
```

#### 3.10 Create Utils

**File**: `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function extractGitHubUrl(url: string) {
  const match = url.match(
    /https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/
  );
  if (!match) return null;
  return {
    owner: match[1],
    name: match[2],
    branch: match[3] || "main",
  };
}
```

#### 3.11 Commit

```bash
git add .
git commit -m "[PHASE-3] Core services, validations, and infrastructure"
```

**Status Check**: ✅ When all lib files compile and imports work correctly

---

### PHASE 4: Processing Pipeline (Days 3-5)
**Goal**: Implement all analysis services and worker process  
**Deliverables**: Full pipeline working on test repos, no stuck jobs

#### 4.1 Create Cloner Service

**File**: `src/lib/services/cloner.ts`

```typescript
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function cloneRepo(
  url: string,
  branch: string,
  targetDir: string
): Promise<void> {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  try {
    execSync(
      `git clone --depth 1 --single-branch --branch ${branch} "${url}" "${targetDir}"`,
      { timeout: 60_000, stdio: "pipe" }
    );
  } catch (error: any) {
    if (error.message.includes("Repository not found")) {
      throw new Error("REPO_NOT_FOUND");
    }
    if (error.message.includes("could not find remote branch")) {
      throw new Error("BRANCH_NOT_FOUND");
    }
    if (error.killed) {
      throw new Error("CLONE_TIMEOUT");
    }
    throw new Error("CLONE_FAILED");
  }
}

export async function cleanupRepo(dir: string): Promise<void> {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {
    // Silent fail
  }
}
```

#### 4.2 Create Parser Service

**File**: `src/lib/services/parser.ts`

```typescript
import fs from "fs";
import path from "path";
import { FileNode } from "@/types";
import {
  IGNORE_DIRS,
  IGNORE_FILES,
  BINARY_EXTENSIONS,
  MAX_DEPTH,
  MAX_FILES,
  MAX_FILE_SIZE,
} from "@/lib/constants";

const LANGUAGE_MAP: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".rb": "Ruby",
  ".java": "Java",
  ".cs": "C#",
  ".cpp": "C++",
  ".c": "C",
  ".php": "PHP",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".sql": "SQL",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".xml": "XML",
  ".md": "Markdown",
};

interface ParseResult {
  tree: FileNode;
  flatFiles: FileNode[];
  stats: { totalFiles: number; totalLines: number; primaryLanguage: string };
}

export async function walkDirectory(
  startDir: string,
  rootDir: string
): Promise<ParseResult> {
  const flatFiles: FileNode[] = [];
  const languageCounts: Record<string, number> = {};

  function walk(dir: string, depth: number = 0): FileNode {
    const name = path.basename(dir);
    const relativePath = path.relative(rootDir, dir);

    if (depth > MAX_DEPTH || flatFiles.length >= MAX_FILES || IGNORE_DIRS.has(name)) {
      return {
        path: relativePath,
        name,
        type: "dir",
        extension: "",
        size: 0,
        lines: 0,
      };
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const children: FileNode[] = [];

    for (const entry of entries) {
      if (IGNORE_FILES.has(entry.name) || entry.name.startsWith(".")) continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) {
          children.push(walk(fullPath, depth + 1));
        }
      } else {
        const ext = path.extname(entry.name);
        const stats = fs.statSync(fullPath);

        if (stats.size > MAX_FILE_SIZE || BINARY_EXTENSIONS.has(ext)) continue;

        const content = fs.readFileSync(fullPath, "utf-8").split("\n");
        const lines = content.length;
        const language = LANGUAGE_MAP[ext];

        const node: FileNode = {
          path: relPath,
          name: entry.name,
          type: "file",
          extension: ext,
          size: stats.size,
          lines,
          language,
        };

        flatFiles.push(node);
        if (language) languageCounts[language] = (languageCounts[language] || 0) + 1;
        children.push(node);
      }
    }

    children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return {
      path: relativePath,
      name,
      type: "dir",
      extension: "",
      size: 0,
      lines: 0,
      children,
    };
  }

  const tree = walk(startDir);
  const primaryLanguage =
    Object.entries(languageCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "Unknown";

  return {
    tree,
    flatFiles,
    stats: {
      totalFiles: flatFiles.length,
      totalLines: flatFiles.reduce((sum, f) => sum + f.lines, 0),
      primaryLanguage,
    },
  };
}
```

#### 4.3 Create Tech Detector

**File**: `src/lib/services/techDetector.ts`

```typescript
import fs from "fs";
import path from "path";
import { FileNode, TechStack } from "@/types";

export async function detectTechStack(
  rootDir: string,
  flatFiles: FileNode[]
): Promise<TechStack> {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const databases = new Set<string>();
  const tools = new Set<string>();
  const cicd = new Set<string>();
  const testing = new Set<string>();
  const dependencies: Record<string, string> = {};

  // Detect from file presence
  const CONFIG_MAP: Record<string, { tech: string; category: string }> = {
    "package.json": { tech: "Node.js", category: "languages" },
    "tsconfig.json": { tech: "TypeScript", category: "languages" },
    "next.config.js": { tech: "Next.js", category: "frameworks" },
    "next.config.ts": { tech: "Next.js", category: "frameworks" },
    "vite.config.ts": { tech: "Vite", category: "tools" },
    "Dockerfile": { tech: "Docker", category: "tools" },
    "jest.config.js": { tech: "Jest", category: "testing" },
    "vitest.config.ts": { tech: "Vitest", category: "testing" },
    "tailwind.config.js": { tech: "Tailwind CSS", category: "tools" },
    "tailwind.config.ts": { tech: "Tailwind CSS", category: "tools" },
    "prisma/schema.prisma": { tech: "Prisma", category: "tools" },
  };

  for (const [file, { tech, category }] of Object.entries(CONFIG_MAP)) {
    if (flatFiles.some((f) => f.path.endsWith(file))) {
      if (category === "languages") languages.add(tech);
      else if (category === "frameworks") frameworks.add(tech);
      else if (category === "databases") databases.add(tech);
      else if (category === "tools") tools.add(tech);
      else if (category === "cicd") cicd.add(tech);
      else if (category === "testing") testing.add(tech);
    }
  }

  // Parse package.json
  const packageJsonFile = flatFiles.find((f) => f.name === "package.json");
  if (packageJsonFile) {
    try {
      const content = fs.readFileSync(
        path.join(rootDir, packageJsonFile.path),
        "utf-8"
      );
      const pkg = JSON.parse(content);

      const frameworkDeps: Record<string, string> = {
        react: "React",
        next: "Next.js",
        vue: "Vue",
        svelte: "Svelte",
        express: "Express",
        "@nestjs/core": "NestJS",
        "@prisma/client": "Prisma",
        mongoose: "MongoDB",
        tailwindcss: "Tailwind CSS",
      };

      for (const dep of Object.keys(pkg.dependencies || {})) {
        if (frameworkDeps[dep]) frameworks.add(frameworkDeps[dep]);
        dependencies[dep] = pkg.dependencies[dep];
      }
    } catch {
      // Ignore
    }
  }

  // Detect languages from extensions
  const langSet = new Set(flatFiles.map((f) => f.language).filter(Boolean));
  langSet.forEach((lang) => languages.add(lang!));

  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    databases: Array.from(databases),
    tools: Array.from(tools),
    cicd: Array.from(cicd),
    testing: Array.from(testing),
    dependencies,
  };
}
```

#### 4.4 Create Dependency Graph Builder

**File**: `src/lib/services/graphBuilder.ts`

```typescript
import fs from "fs";
import path from "path";
import { FileNode, GraphNode, GraphEdge, DependencyGraph } from "@/types";
import { BINARY_EXTENSIONS } from "@/lib/constants";

const JS_IMPORT_PATTERNS = [
  /import\s+.*?\s+from\s+['"](.+?)['"]/g,
  /require\s*\(\s*['"](.+?)['"]\s*\)/g,
];

const PY_IMPORT_PATTERNS = [
  /^from\s+([\w.]+)\s+import/gm,
  /^import\s+([\w.]+)/gm,
];

export async function buildDependencyGraph(
  flatFiles: FileNode[],
  rootDir: string
): Promise<DependencyGraph> {
  const nodes: GraphNode[] = [];
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  // Create nodes
  for (const file of flatFiles) {
    if (BINARY_EXTENSIONS.has(file.extension)) continue;

    const node: GraphNode = {
      id: file.path,
      path: file.path,
      name: file.name,
      extension: file.extension,
      lines: file.lines,
      inDegree: 0,
      outDegree: 0,
      directory: file.path.split("/")[0] || "root",
    };
    nodes.push(node);
    nodeMap.set(file.path, node);
  }

  // Parse imports
  for (const file of flatFiles) {
    try {
      const content = fs.readFileSync(path.join(rootDir, file.path), "utf-8");
      const patterns =
        file.extension === ".py" ? PY_IMPORT_PATTERNS : JS_IMPORT_PATTERNS;

      const importsInFile = new Set<string>();
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const importPath = match[1];
          const resolved = resolveImportPath(importPath, file.path, rootDir, flatFiles);
          if (resolved && resolved !== file.path) {
            importsInFile.add(resolved);
          }
        }
      }

      const sourceNode = nodeMap.get(file.path);
      if (sourceNode) {
        for (const targetPath of importsInFile) {
          const targetNode = nodeMap.get(targetPath);
          if (targetNode) {
            edges.push({ source: file.path, target: targetPath, type: "import" });
            sourceNode.outDegree++;
            targetNode.inDegree++;
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgDegree: edges.length / Math.max(nodes.length, 1),
      components: estimateComponents(nodes, edges),
    },
  };
}

function resolveImportPath(
  importPath: string,
  currentFile: string,
  rootDir: string,
  flatFiles: FileNode[]
): string | null {
  try {
    const currentDir = path.dirname(currentFile);
    const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ""];

    for (const ext of extensions) {
      const candidate = path.join(currentDir, importPath + ext);
      const relPath = path.relative(rootDir, candidate);
      if (flatFiles.some((f) => f.path === relPath)) return relPath;
    }

    for (const ext of ["/index.ts", "/index.tsx", "/index.js", "/index.jsx"]) {
      const candidate = path.join(currentDir, importPath + ext);
      const relPath = path.relative(rootDir, candidate);
      if (flatFiles.some((f) => f.path === relPath)) return relPath;
    }
  } catch {
    // Ignore
  }

  return null;
}

function estimateComponents(nodes: GraphNode[], edges: GraphEdge[]): number {
  const visited = new Set<string>();
  let components = 0;

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      components++;
      dfs(node.id, visited, nodes, edges);
    }
  }

  return components;
}

function dfs(nodeId: string, visited: Set<string>, nodes: GraphNode[], edges: GraphEdge[]) {
  if (visited.has(nodeId)) return;
  visited.add(nodeId);

  for (const edge of edges) {
    if (edge.source === nodeId && !visited.has(edge.target)) {
      dfs(edge.target, visited, nodes, edges);
    }
    if (edge.target === nodeId && !visited.has(edge.source)) {
      dfs(edge.source, visited, nodes, edges);
    }
  }
}
```

#### 4.5 Create Entry Point Detector

**File**: `src/lib/services/entryDetector.ts`

```typescript
import fs from "fs";
import path from "path";
import { FileNode, GraphNode, GraphEdge, EntryPoint } from "@/types";

interface ScoringContext {
  packageJson: any;
  readme: string;
  graphNodes: GraphNode[];
  maxInDegree: number;
}

export async function detectEntryPoints(
  flatFiles: FileNode[],
  graphNodes: GraphNode[],
  graphEdges: GraphEdge[],
  rootDir: string
): Promise<EntryPoint[]> {
  const readmeFile = flatFiles.find(
    (f) => f.name.toLowerCase().startsWith("readme")
  );
  const readme = readmeFile
    ? fs.readFileSync(path.join(rootDir, readmeFile.path), "utf-8")
    : "";

  const packageJsonFile = flatFiles.find((f) => f.name === "package.json");
  let packageJson = null;
  if (packageJsonFile) {
    try {
      packageJson = JSON.parse(
        fs.readFileSync(path.join(rootDir, packageJsonFile.path), "utf-8")
      );
    } catch {
      // Ignore
    }
  }

  const maxInDegree = Math.max(...graphNodes.map((n) => n.inDegree), 1);

  const context: ScoringContext = {
    packageJson,
    readme,
    graphNodes,
    maxInDegree,
  };

  const scores: Map<string, { score: number; reasons: string[] }> = new Map();

  for (const file of flatFiles) {
    let score = 0;
    const reasons: string[] = [];

    // Rule 1: package.json main field
    if (packageJson?.main && file.path.endsWith(packageJson.main)) {
      score += 10;
      reasons.push("Listed in package.json main field");
    }

    // Rule 2: Root-level index/main/app/server
    const rootLevelMatch = /^(index|main|app|server|cli|start)\.(ts|tsx|js|jsx|py|go|rs)$/.test(
      file.name
    );
    if (rootLevelMatch && !file.path.includes("/")) {
      score += 8;
      reasons.push("Root-level entry file name");
    }

    // Rule 3: Highest in-degree (most imported)
    const node = graphNodes.find((n) => n.path === file.path);
    if (node && node.inDegree === maxInDegree && maxInDegree > 0) {
      score += 5;
      reasons.push("Most imported file (high centrality)");
    }

    // Rule 4: Named server/api/routes
    if (/^(server|api|routes|router|handler)\.(ts|tsx|js|jsx|py)$/.test(file.name)) {
      score += 4;
      reasons.push("Server/API file name");
    }

    // Rule 5: Mentioned in README
    if (readme.includes(file.name)) {
      score += 2;
      reasons.push("Referenced in README");
    }

    if (score > 0) {
      scores.set(file.path, { score, reasons });
    }
  }

  return Array.from(scores.entries())
    .map(([path, { score, reasons }]) => ({
      path,
      score,
      reasons,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
```

#### 4.6 Create AI Analyzer

**File**: `src/lib/services/analyzer.ts`

This is the BEST PROMPT PACK for your MVP. See detailed specifications below.

```typescript
import { anthropic, AI_CONFIG } from "@/lib/ai";
import { ArchitectureAnalysis, TechStack, FileNode, GraphNode, GraphEdge, EntryPoint } from "@/types";

async function callClaudeWithRetry(
  messages: any[],
  systemPrompt: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        system: systemPrompt,
        messages,
      });
      return response.content[0].type === "text" ? response.content[0].text : "";
    } catch (error: any) {
      if (error.status === 429) {
        const delay = Math.pow(3, attempt) * 5000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (error.status === 500 && attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 10_000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function analyzeRepository(data: {
  fileTree: FileNode;
  flatFiles: FileNode[];
  techStack: TechStack;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  entryPoints: EntryPoint[];
  packageJson?: any;
  readme?: string;
  owner: string;
  repo: string;
}): Promise<{
  summary: string;
  architecture: ArchitectureAnalysis;
  startGuide: string;
  fileSummaries: Record<string, string>;
}> {
  // Build context with token budget management
  const context = buildPromptContext(data);

  // Prompt 1: Repository Summary
  const summaryPrompt = `
You are a senior software engineer explaining a codebase to a junior developer.

Repository: ${data.owner}/${data.repo}

${context}

Analyze this repository and provide a JSON response with:
{
  "summary": "2-3 paragraph overview of what this project does",
  "purpose": "One sentence purpose",
  "technologies": ["Tech1", "Tech2"],
  "maturity": "early-stage | growing | mature | production-grade",
  "complexity": "simple | moderate | complex | very-complex"
}

IMPORTANT: Return ONLY valid JSON, no markdown or code fences.
`;

  const summaryResponse = await callClaudeWithRetry(
    [
      {
        role: "user",
        content: summaryPrompt,
      },
    ],
    "You are a software architecture expert providing analysis of GitHub repositories."
  );

  let summaryData;
  try {
    summaryData = JSON.parse(summaryResponse);
  } catch {
    // Attempt repair
    const jsonMatch = summaryResponse.match(/\{[\s\S]*\}/);
    summaryData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  const summary = summaryData.summary || "Repository analysis";

  // Prompt 2: Architecture Analysis
  const architecturePrompt = `
You are a software architect analyzing repository structure.

Repository: ${data.owner}/${data.repo}

Dependency Graph (first 50 nodes):
${JSON.stringify(data.graphNodes.slice(0, 50), null, 2)}

Top Files by Centrality:
${data.graphNodes
  .sort((a, b) => b.inDegree - a.inDegree)
  .slice(0, 10)
  .map((n) => `- ${n.path} (imported by ${n.inDegree} files)`)
  .join("\n")}

Entry Points (by score):
${data.entryPoints
  .slice(0, 5)
  .map((e) => `- ${e.path} (score: ${e.score})`)
  .join("\n")}

Provide JSON:
{
  "pattern": "MVC | Microservices | Monolith | Modular | etc",
  "modules": [
    {
      "name": "Module name",
      "path": "src/module/",
      "responsibility": "What it handles",
      "keyFiles": ["file1.ts", "file2.ts"]
    }
  ],
  "dataFlow": "How data flows",
  "layers": ["Presentation", "Logic", "Data"],
  "issues": ["Potential issue 1"]
}

IMPORTANT: Return ONLY valid JSON.
`;

  const architectureResponse = await callClaudeWithRetry(
    [
      {
        role: "user",
        content: architecturePrompt,
      },
    ],
    "You are a software architect expert."
  );

  let architectureData;
  try {
    architectureData = JSON.parse(architectureResponse);
  } catch {
    const jsonMatch = architectureResponse.match(/\{[\s\S]*\}/);
    architectureData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  const architecture: ArchitectureAnalysis = {
    pattern: architectureData.pattern || "Unknown",
    modules: architectureData.modules || [],
    dataFlow: architectureData.dataFlow || "Unknown",
    layers: architectureData.layers || [],
    issues: architectureData.issues || [],
  };

  // Prompt 3: Onboarding Guide
  const guidePrompt = `
You are writing a beginner-friendly 5-minute onboarding guide.

Repository: ${data.owner}/${data.repo}

Summary: ${summary}

Architecture: ${architecture.pattern}

Top Entry Points:
${data.entryPoints
  .slice(0, 3)
  .map((e) => `- ${e.path}`)
  .join("\n")}

Scripts (if available):
${data.packageJson?.scripts
  ? Object.entries(data.packageJson.scripts)
    .slice(0, 5)
    .map(([name, cmd]) => `- npm run ${name}: ${cmd}`)
    .join("\n")
  : "No scripts found"}

Write a Markdown guide with:
1. What This Project Does (2 sentences)
2. How to Set Up Locally (3-5 bash commands)
3. Where to Start Reading (top 3 files, formatted as "- [filename](path) — reason")
4. Key Concepts (3-4 concepts)
5. Architecture Overview (3 sentences)
6. Common Patterns (2-3 patterns used)

Use file paths in square brackets like [filename](path).
`;

  const guideResponse = await callClaudeWithRetry(
    [
      {
        role: "user",
        content: guidePrompt,
      },
    ],
    "You are an expert technical writer creating onboarding guides."
  );

  const startGuide = guideResponse;

  // File summaries (top 5 files)
  const fileSummaries: Record<string, string> = {};
  const topFiles = data.graphNodes
    .sort((a, b) => b.inDegree - a.inDegree)
    .slice(0, 5);

  for (const file of topFiles) {
    const fileObj = data.flatFiles.find((f) => f.path === file.path);
    if (fileObj) {
      fileSummaries[file.path] = `${fileObj.lines}-line ${file.extension} file, imported by ${file.inDegree} files`;
    }
  }

  return {
    summary,
    architecture,
    startGuide,
    fileSummaries,
  };
}

function buildPromptContext(data: any): string {
  const parts: string[] = [];

  // Tech stack
  if (data.techStack) {
    parts.push(
      `Tech Stack: ${[
        ...data.techStack.languages,
        ...data.techStack.frameworks,
        ...data.techStack.tools,
      ]
        .slice(0, 10)
        .join(", ")}`
    );
  }

  // File stats
  parts.push(
    `Files: ${data.flatFiles.length} total, ${data.flatFiles.reduce((sum: number, f: FileNode) => sum + f.lines, 0)} lines`
  );

  // Top directories
  const dirCounts: Record<string, number> = {};
  for (const file of data.flatFiles) {
    const dir = file.path.split("/")[0] || "root";
    dirCounts[dir] = (dirCounts[dir] || 0) + 1;
  }
  parts.push(
    `Top Directories: ${Object.entries(dirCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([dir, count]) => `${dir} (${count} files)`)
      .join(", ")}`
  );

  // README preview
  if (data.readme) {
    parts.push(
      `\nREADME Preview:\n${data.readme.slice(0, 1000).split("\n").slice(0, 10).join("\n")}`
    );
  }

  return parts.join("\n\n");
}
```

#### 4.7 Create Worker Process

**File**: `src/worker.ts`

```typescript
import { Worker, Job } from "bullmq";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { cloneRepo, cleanupRepo, extractGitHubUrl } from "@/lib/services/cloner";
import { walkDirectory } from "@/lib/services/parser";
import { detectTechStack } from "@/lib/services/techDetector";
import { buildDependencyGraph } from "@/lib/services/graphBuilder";
import { detectEntryPoints } from "@/lib/services/entryDetector";
import { analyzeRepository } from "@/lib/services/analyzer";

const worker = new Worker("repo-analysis", processJob, {
  connection: redis as any,
  concurrency: 2,
});

async function processJob(job: Job<any>) {
  const { repoId, jobId, githubUrl, owner, repo, branch } = job.data;
  const targetDir = `/tmp/repos/${jobId}`;

  try {
    // Step 1: Clone
    await updateJob(jobId, "PROCESSING", 10, "cloning");
    await updateRepo(repoId, "CLONING");
    await cloneRepo(githubUrl, branch, targetDir);

    // Step 2: Parse
    await updateJob(jobId, "PROCESSING", 25, "parsing");
    await updateRepo(repoId, "PARSING");
    const { tree, flatFiles, stats } = await walkDirectory(targetDir, targetDir);

    // Step 3: Tech detection
    await updateJob(jobId, "PROCESSING", 35, "detecting_tech");
    const techStack = await detectTechStack(targetDir, flatFiles);

    // Step 4: Graph building
    await updateJob(jobId, "PROCESSING", 45, "building_graph");
    const depGraph = await buildDependencyGraph(flatFiles, targetDir);

    // Step 5: Entry points
    await updateJob(jobId, "PROCESSING", 55, "detecting_entries");
    const entryPoints = await detectEntryPoints(
      flatFiles,
      depGraph.nodes,
      depGraph.edges,
      targetDir
    );

    // Step 6: AI analysis
    await updateJob(jobId, "PROCESSING", 70, "ai_analysis");
    const readmeFile = flatFiles.find((f) => f.name.toLowerCase().includes("readme"));
    const readme = readmeFile?.path
      ? require("fs").readFileSync(require("path").join(targetDir, readmeFile.path), "utf-8")
      : "";

    const pkgFile = flatFiles.find((f) => f.name === "package.json");
    let packageJson;
    if (pkgFile?.path) {
      try {
        packageJson = JSON.parse(
          require("fs").readFileSync(require("path").join(targetDir, pkgFile.path), "utf-8")
        );
      } catch {
        // Ignore
      }
    }

    const aiResult = await analyzeRepository({
      fileTree: tree,
      flatFiles,
      techStack,
      graphNodes: depGraph.nodes,
      graphEdges: depGraph.edges,
      entryPoints,
      packageJson,
      readme,
      owner,
      repo,
    });

    // Step 7: Store results
    await updateJob(jobId, "PROCESSING", 90, "storing_results");
    await db.analysisResult.create({
      data: {
        repoId,
        summary: aiResult.summary,
        architecture: aiResult.architecture as any,
        fileTree: tree as any,
        dependencyGraph: { nodes: depGraph.nodes, edges: depGraph.edges, stats: depGraph.stats } as any,
        entryPoints: entryPoints as any,
        startGuide: aiResult.startGuide,
        fileSummaries: aiResult.fileSummaries,
        techStack: techStack as any,
      },
    });

    await db.repo.update({
      where: { id: repoId },
      data: {
        status: "COMPLETE",
        totalFiles: stats.totalFiles,
        totalLines: stats.totalLines,
        defaultLanguage: stats.primaryLanguage,
        analyzedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await updateJob(jobId, "COMPLETED", 100, "complete");
  } catch (error: any) {
    const message = error.message || "Unknown error";
    await updateJob(jobId, "FAILED", 0, "failed", message);
    await updateRepo(repoId, "FAILED", message);
  } finally {
    await cleanupRepo(targetDir);
  }
}

async function updateJob(
  jobId: string,
  status: string,
  progress: number,
  step: string,
  error?: string
) {
  await db.job.update({
    where: { id: jobId },
    data: {
      status: status as any,
      progress,
      currentStep: step,
      ...(status === "PROCESSING" && !error ? { startedAt: new Date() } : {}),
      ...(["COMPLETED", "FAILED"].includes(status) ? { completedAt: new Date() } : {}),
      ...(error ? { errorLog: error } : {}),
    },
  });
}

async function updateRepo(repoId: string, status: string, error?: string) {
  await db.repo.update({
    where: { id: repoId },
    data: { status: status as any, ...(error ? { errorMessage: error } : {}) },
  });
}

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Worker started. Waiting for jobs...");
```

#### 4.8 Test Worker

```bash
# In one terminal:
npm run dev

# In another terminal:
npm run worker:dev

# Submit a test repo via API (next section)
# Watch worker logs for progress
```

#### 4.9 Commit

```bash
git add .
git commit -m "[PHASE-4] Complete processing pipeline and analyzer"
```

**Status Check**: ✅ When

 worker starts, processes a real repo, and stores results in DB

---

### PHASE 5: API Routes (Days 5-7)
**Goal**: Implement all API endpoints with validation and rate limiting  
**Deliverables**: All endpoints working, proper error handling, payment integration

#### 5.1 Middleware & Auth

**File**: `src/middleware.ts`

```typescript
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/pricing", "/about", "/share"];
const PUBLIC_API = ["/api/auth", "/api/webhooks", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return NextResponse.next();
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon"))
    return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Auth required" },
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

#### 5.2 Analyze Endpoint

**File**: `src/app/api/repos/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { queue } from "@/lib/queue";
import { analyzeRateLimit, analyzeRateLimitPro } from "@/lib/ratelimit";
import { analyzeSchema } from "@/lib/validations/repo";
import { successResponse, errorResponse, ERROR_MESSAGES } from "@/lib/api-response";
import { extractGitHubUrl } from "@/lib/utils";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", ERROR_MESSAGES.UNAUTHORIZED),
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = analyzeSchema.parse(body);

    // Get user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", ERROR_MESSAGES.UNAUTHORIZED),
        { status: 401 }
      );
    }

    // Check credits
    if (user.plan === "FREE" && user.creditsRemaining <= 0) {
      return NextResponse.json(
        errorResponse(
          "CREDITS_EXHAUSTED",
          ERROR_MESSAGES.CREDITS_EXHAUSTED
        ),
        { status: 402 }
      );
    }

    // Extract GitHub info
    const gitInfo = extractGitHubUrl(parsed.githubUrl);
    if (!gitInfo) {
      return NextResponse.json(
        errorResponse("INVALID_URL", ERROR_MESSAGES.INVALID_URL),
        { status: 400 }
      );
    }

    // Cache check
    const existingRepo = await db.repo.findUnique({
      where: {
        githubUrl_branch: {
          githubUrl: parsed.githubUrl,
          branch: gitInfo.branch,
        },
      },
    });

    if (
      existingRepo &&
      existingRepo.status === "COMPLETE" &&
      existingRepo.expiresAt &&
      existingRepo.expiresAt > new Date()
    ) {
      return NextResponse.json(
        successResponse({ repoId: existingRepo.id, cached: true }),
        { status: 200 }
      );
    }

    // Rate limit
    const rateLimit =
      user.plan === "FREE" ? analyzeRateLimit : analyzeRateLimitPro;
    const { success } = await rateLimit.limit(user.id);

    if (!success) {
      return NextResponse.json(
        errorResponse("RATE_LIMITED", ERROR_MESSAGES.RATE_LIMITED),
        { status: 429 }
      );
    }

    // Create repo and job
    const repoId = nanoid();
    const jobId = nanoid();
    const shareSlug = nanoid(10);

    const [repo, job] = await Promise.all([
      db.repo.create({
        data: {
          id: repoId,
          userId: user.id,
          githubUrl: parsed.githubUrl,
          owner: gitInfo.owner,
          name: gitInfo.name,
          branch: gitInfo.branch,
          status: "QUEUED",
          shareSlug,
        },
      }),
      db.job.create({
        data: {
          id: jobId,
          repoId,
          status: "QUEUED",
        },
      }),
    ]);

    // Enqueue job
    await queue.add("analyze-repo", {
      repoId,
      jobId,
      githubUrl: parsed.githubUrl,
      owner: gitInfo.owner,
      repo: gitInfo.name,
      branch: gitInfo.branch,
    });

    // Deduct credit if free
    if (user.plan === "FREE") {
      await db.user.update({
        where: { id: user.id },
        data: { creditsRemaining: user.creditsRemaining - 1 },
      });
    }

    return NextResponse.json(successResponse({ jobId, repoId }), { status: 202 });
  } catch (error) {
    console.error("Error in analyze:", error);
    return NextResponse.json(
      errorResponse("ANALYSIS_FAILED", "Failed to process request"),
      { status: 500 }
    );
  }
}
```

#### 5.3 List Repos Endpoint

**File**: `src/app/api/repos/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "Auth required"),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [repos, total] = await Promise.all([
      db.repo.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.repo.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json(
      successResponse({
        repos,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("ERROR", "Failed to fetch repos"),
      { status: 500 }
    );
  }
}
```

#### 5.4 Repo Detail & SSE Endpoints

Due to length, see COMPLETE_SPEC.md for:
- `GET /api/repos/[id]` - Full results
- `DELETE /api/repos/[id]` - Delete repo
- `GET /api/repos/[id]/graph` - Dependency graph
- `POST /api/repos/[id]/share` - Toggle sharing
- `GET /api/jobs/[id]` - Job status
- `GET /api/jobs/[id]/stream` - SSE progress stream

#### 5.5 Payment Endpoints

**File**: `src/app/api/payments/create-order/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { razorpay } from "@/lib/razorpay";
import { createOrderSchema } from "@/lib/validations/payment";
import { PLANS } from "@/lib/constants";
import { successResponse, errorResponse } from "@/lib/api-response";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "Auth required"),
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = createOrderSchema.parse(body);
    const plan = PLANS[parsed.plan as keyof typeof PLANS];

    if (!plan) {
      return NextResponse.json(
        errorResponse("INVALID_PLAN", "Invalid plan"),
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: "INR",
      receipt: "order_" + nanoid(),
    });

    await db.payment.create({
      data: {
        userId: session.user.id,
        amount: plan.amount,
        status: "PENDING",
        razorpayOrderId: order.id,
      },
    });

    return NextResponse.json(
      successResponse({
        orderId: order.id,
        amount: plan.amount,
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("ERROR", "Failed to create order"),
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/payments/verify/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { verifyPaymentSchema } from "@/lib/validations/payment";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "Auth required"),
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = verifyPaymentSchema.parse(body);

    const isValid = verifyRazorpaySignature(
      parsed.razorpay_order_id,
      parsed.razorpay_payment_id,
      parsed.razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        errorResponse("INVALID_SIGNATURE", "Signature verification failed"),
        { status: 400 }
      );
    }

    const payment = await db.payment.findUnique({
      where: { razorpayOrderId: parsed.razorpay_order_id },
    });

    if (!payment) {
      return NextResponse.json(
        errorResponse("PAYMENT_NOT_FOUND", "Payment not found"),
        { status: 404 }
      );
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        razorpayPaymentId: parsed.razorpay_payment_id,
      },
    });

    // Grant credits or upgrade plan
    if (payment.amount === 9900) {
      // Per repo
      await db.user.update({
        where: { id: session.user.id },
        data: { creditsRemaining: { increment: 1 } },
      });
    } else {
      // Pro plan
      await db.user.update({
        where: { id: session.user.id },
        data: { plan: "PRO" },
      });
    }

    return NextResponse.json(successResponse({ success: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse("ERROR", "Verification failed"),
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/webhooks/razorpay/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature")!;
    const body = await req.text();

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const payment = await db.payment.findUnique({
        where: { razorpayOrderId: event.payload.payment.entity.order_id },
      });

      if (payment && payment.status !== "COMPLETED") {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED" },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
```

#### 5.6 Health Check

**File**: `src/app/api/health/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    await redis.ping();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      redis: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: String(error),
      },
      { status: 500 }
    );
  }
}
```

#### 5.7 Commit

```bash
git add .
git commit -m "[PHASE-5] Complete API surface with auth, validation, and payments"
```

**Status Check**: ✅ When all endpoints return proper response envelopes and auth gating works

---

### PHASE 6: Frontend MVP (Days 7-10)
**Goal**: Build complete user-facing UI for dashboard, analysis, results, and sharing  
**Deliverables**: All pages responsive, SSE working, D3 graph rendering, mobile-ready

This is a large phase. Key files to implement:

1. **Layouts & Navigation**
   - `src/components/layout/Navbar.tsx` - Header with auth dropdown
   - `src/components/layout/Footer.tsx` - Footer
   - `src/components/layout/DashboardSidebar.tsx` - Sidebar nav
   - `src/app/(marketing)/layout.tsx` - Public pages layout
   - `src/app/(dashboard)/layout.tsx` - Protected dashboard layout

2. **Dashboard**
   - `src/components/dashboard/RepoInput.tsx` - Submit form
   - `src/components/dashboard/RepoCard.tsx` - Single repo card
   - `src/components/dashboard/RepoList.tsx` - Grid of repos
   - `src/components/dashboard/StatsBar.tsx` - Credits/plan display
   - `src/app/(dashboard)/dashboard/page.tsx` - Main dashboard

3. **Analysis & Progress**
   - `src/components/analysis/AnalysisProgress.tsx` - Loading screen with SSE
   - `src/app/(dashboard)/dashboard/analyze/[jobId]/page.tsx` - Progress page

4. **Results**
   - `src/components/results/ResultsHeader.tsx` - Repo info banner
   - `src/components/results/OverviewTab.tsx` - Summary + architecture
   - `src/components/results/FileTreeViewer.tsx` - Collapsible file tree
   - `src/components/results/DependencyGraph.tsx` - D3.js visualization
   - `src/components/results/StartGuideTab.tsx` - Markdown rendering
   - `src/components/results/TechStackBadges.tsx` - Tech badges
   - `src/app/(dashboard)/repos/[id]/page.tsx` - Results page tabs

5. **Auth & Utility Pages**
   - `src/app/(marketing)/login/page.tsx` - Login/GitHub redirect
   - `src/app/(marketing)/pricing/page.tsx` - Pricing with payment button
   - `src/app/(dashboard)/settings/page.tsx` - User settings
   - `src/app/page.tsx` - Landing page

6. **Public Sharing**
   - `src/app/share/[slug]/page.tsx` - Public results (no auth)

7. **Hooks & Utilities**
   - `src/hooks/use-sse.ts` - EventSource hook
   - `src/hooks/use-analysis.ts` - React Query hooks

Due to page limits, I'll provide the **critical** SSE hook and graph visualization:

**File**: `src/hooks/use-sse.ts`

```typescript
"use client";

import { useState, useEffect } from "react";
import { JobProgress } from "@/types";

export function useSSE(url: string | null) {
  const [data, setData] = useState<JobProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!url) return;

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);

        if (["COMPLETED", "FAILED", "TIMEOUT"].includes(parsed.status)) {
          eventSource.close();
          setIsConnected(false);
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    eventSource.onerror = () => {
      setError("Connection lost");
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [url]);

  return { data, error, isConnected };
}
```

**File**: `src/components/results/DependencyGraph.tsx`

```typescript
"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { GraphNode, GraphEdge } from "@/types";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function DependencyGraph({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 600;

    // Clear previous
    d3.select(containerRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid #e5e7eb");

    const container = svg.append("g");

    // Force simulation
    const simulation = d3
      .forceSimulation<any>(nodes)
      .force(
        "link",
        d3
          .forceLink<any, any>(edges)
          .id((d: any) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => 15));

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Draw edges
    const link = container
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);

    // Draw nodes
    const node = container
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d: any) => Math.max(5, Math.sqrt(d.lines) / 3))
      .attr("fill", (d: any) => colorScale(d.directory))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .call(
        d3.drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Add labels
    const labels = container
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("pointer-events", "none")
      .text((d: any) => d.name.slice(0, 8));

    // Zoom
    svg.call(
      d3.zoom<any, any>().on("zoom", (event) => {
        container.attr("transform", event.transform);
      })
    );

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] border border-gray-200 rounded-lg bg-white"
    />
  );
}
```

#### 6.1 Commit

```bash
git add .
git commit -m "[PHASE-6] Complete frontend MVP with all pages and components"
```

**Status Check**: ✅ When dashboard loads, can submit repos, see progress, and view results on desktop/mobile

---

### PHASE 7: Security & Hardening (Days 10-12)
**Goal**: Add all security controls, headers, rate-limiting enforcement  
**Deliverables**: No sensitive leaks, headers present, input validation strict

#### 7.1 Security Headers

**Update**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default nextConfig;
```

#### 7.2 Input Validation Audit

Ensure all mutation endpoints have strict Zod validation. Add to existing validations:

```typescript
// Validate branch name
const branchRegex = /^[a-zA-Z0-9\-_.\/]+$/;
if (!branchRegex.test(branch)) {
  return errorResponse("INVALID_BRANCH", "Invalid branch name");
}

// Validate URLs never execute scripts
const sanitizedUrl = parsed.githubUrl.replace(/[<>\"']/g, "");
```

#### 7.3 Sentry Integration

```typescript
// Install: npm install @sentry/nextjs

// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### 7.4 Logging

Add structured logging to critical operations:

```typescript
console.log(JSON.stringify({
  level: "info",
  timestamp: new Date().toISOString(),
  userId: user.id,
  action: "repo_analysis_started",
  repo: repo.githubUrl,
  jobId,
}));
```

#### 7.5 Commit

```bash
git add .
git commit -m "[PHASE-7] Security hardening and observability"
```

**Status Check**: ✅ When Sentry is wired, headers present in DevTools, and no secrets in browser console

---

### PHASE 8: Launch (Days 12-14)
**Goal**: Final testing, deployment, monitoring  
**Deliverables**: Deployed to Vercel + Railway, smoke tests pass, ready for users

#### 8.1 Final QA Checklist

- [ ] Desktop (1920px): All pages load, forms work, no layout breaks
- [ ] Tablet (768px): Sidebar collapses, touch-friendly
- [ ] Mobile (375px): All features accessible, no horizontal scroll
- [ ] Dark mode: All colors contrast ≥4.5:1
- [ ] Login flow: GitHub OAuth works start-to-finish
- [ ] Submit repo: Valid URL accepted, invalid rejected, error messagesare clear
- [ ] Progress streaming: SSE updates in real-time, closes on completion
- [ ] Results: All 4 tabs load, graph renders, markdown renders
- [ ] Share link: Public users can view without login
- [ ] Payment: Razorpay flow works, signature validates
- [ ] Error recovery: Refresh page doesn't lose state

#### 8.2 Deploy to Vercel

1. Connect your GitHub repo to Vercel
2. Set environment variables from `.env.example`
3. Update `NEXTAUTH_URL` to production domain
4. Deploy: `vercel --prod`

#### 8.3 Deploy Worker to Railway

1. Create new Railway project
2. Connect GitHub repo
3. Set `npm run worker` as start command
4. Add all env vars (same as Vercel)
5. Deploy

#### 8.4 Production OAuth App

Create a **second** GitHub OAuth App for production:
- Homepage URL: Your production domain
- Callback URL: `https://yourdomain.com/api/auth/callback/github`
- Update env vars in Vercel

#### 8.5 Final Commit

```bash
git add .
git commit -m "[PHASE-8] Launch - production deployment"
```

---

## VERIFICATION CHECKLIST

### Build & Type Safety
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` completes with 0 errors

### Database
- [ ] Prisma schema compiles
- [ ] Migrations apply on fresh DB
- [ ] All tables and indexes created
- [ ] Relations work (users, repos, jobs all linked)

### Authentication
- [ ] GitHub login redirects correctly
- [ ] User created in DB
- [ ] Session contains plan/credits/username
- [ ] Protected routes redirect to login
- [ ] Logout works

### Core Features
- [ ] Repo submission accepted and queued
- [ ] Worker processes jobs end-to-end
- [ ] Results stored in DB
- [ ] Results page displays all 4 tabs
- [ ] Share link works publicly
- [ ] Payment flow completes

### API  
- [ ] All endpoints return proper response envelope
- [ ] Auth gating enforces ownership
- [ ] Rate limits trigger correctly
- [ ] Errors have typed codes and messages
- [ ] Webhooks are idempotent

### Frontend
- [ ] App loads on desktop, tablet, mobile
- [ ] No console errors
- [ ] Dark mode works
- [ ] Forms validate on client
- [ ] Loading states display
- [ ] Toasts show for actions

### Security
- [ ] No secrets logged to console
- [ ] Security headers present  
- [ ] CORS configured correctly
- [ ] Rate limits enforced
- [ ] Webhook signatures verified

### Performance
- [ ] Analyze endpoint returns in <2s
- [ ] Each analysis takes <5min (configurable timeout)
- [ ] UI responsive during loading
- [ ] D3 graph renders <1s for 500-node graph

---

## DEPLOYMENT & INFRASTRUCTURE

### Architecture
```
┌─────────────────────────────┐
│      Vercel (Frontend)      │  Next.js API + Pages
│  https://yourdomain.com     │  SessionProvider, QueryClient
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼─────┐  ┌────▼──────────┐
   │ PostgreSQL│  │  Upstash Redis│
   │ (Supabase)│  │  (BullMQ)     │
   └──────────┘  └────┬──────────┘
                      │
        ┌─────────────▼──────────┐
        │   Railway (Worker)      │
        │   src/worker.ts         │
        │   2x concurrency        │
        └────────────────────────┘
```

### Environment Variables (Vercel)
All 18 from `.env.example`

### Monitoring
- Sentry: Error tracking and performance
- Vercel Analytics: Page performance
- Railway Logs: Worker health
- Manual: Health check endpoint daily

### Backup & Recovery
- Supabase: Automated daily snapshots
- Test restore procedures weekly

---

## SUMMARY

This implementation guide contains:

✅ 8-phase breakdown across 14 days  
✅ Complete Prisma schema  
✅ NextAuth GitHub OAuth  
✅ All service layers (cloner, parser, graph, analyzer)  
✅ BullMQ worker with progress tracking  
✅ Complete API endpoints with validation  
✅ Frontend MVP with all components  
✅ SSE streaming and D3 visualization  
✅ Razorpay payments integration  
✅ Security headers and rate limiting  
✅ Deployment to Vercel + Railway  

**Time Estimate**: 100-120 hours of focused development = **2 weeks at 7-8 hours/day**

**Quality Target**: Production MVP ready for private beta with 20-50 users

**Next Steps After Launch**:
- Gather user feedback
- Fix edge cases in parsing
- Add advanced filters
- Implement team workspaces
- Scale infrastructure as needed

---

**Good luck! You've got this. 🚀**
