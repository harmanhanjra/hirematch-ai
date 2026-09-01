# HireMatch AI — Intelligent Job Matching

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/NVIDIA-NIM-76B900?style=for-the-badge&logo=nvidia" />
  <br/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/github/stars/harmanhanjra/hirematch-ai?style=flat-square" />
</p>

<p align="center">
  <b>Stop spraying resumes. Start matching with precision.</b><br/>
  AI-powered job matching, kanban application tracking, and tailored document generation — all in one fast, beautiful app.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-how-it-works">How It Works</a>
</p>

---

## ✨ Why HireMatch?

| Before | After HireMatch |
|---|---|
| Scrolling 100s of irrelevant listings | **Ranked by fit score** — skills 50% + experience 20% + location 15% + salary 15% |
| Spreadsheet chaos | **Kanban pipeline** — drag jobs from Saved → Offer |
| Generic cover letters | **NVIDIA NIM-generated** — tailored in seconds, editable |
| "Am I qualified?" guesswork | **Gap analysis** — see exactly which skills to learn next |

---

## 🎬 Demo

> **Live:** `http://localhost:3000` after `npm run dev`

```
Landing → Dashboard (avg fit, top matches, skill gaps)
  → Jobs (search, remote filter, fit filter, add manually, fit ring)
    → Job Detail (fit breakdown bars, matched/missing badges, stage change, ✨ cover letter)
  → Applications (6-column kanban with drag-and-drop)
  → Documents (resume + cover letters, AI generate, edit, delete)
  → Analytics (funnel, conversion %, top roles, demand gaps)
  → Profile (headline, summary, skills chips, target roles, salary)
```

**Seeded with 12 real-world jobs** (Stripe, Linear, Vercel, Anthropic, Datadog, Notion, GitHub, Shopify, Figma, Snowflake, Cloudflare, Adyen) — zero setup to explore.

---

## 🚀 Features

### 🎯 Explainable Smart Fit Scoring
Multi-dimensional matching with skill-synonym expansion (`js ↔ javascript`, `k8s ↔ kubernetes`, `ml ↔ machine learning`). Every job gets an `overall` score plus `skills / experience / location / salary` breakdowns, a confidence level, evidence-backed strengths and gaps, and concrete next-best actions before applying.

### 📋 Kanban Application Tracking
6 stages: `Saved → Applied → Screening → Interview → Offer → Rejected`. Native drag-and-drop, instant `PATCH /api/applications` persistence, unapplied jobs listed for one-click save.

### 🧾 ATS Resume Analyzer
Compare the resume text saved in your profile against any job. HireMatch scores keyword coverage, ATS-friendly structure, and measurable impact, then highlights missing keywords and concrete fixes before you apply.

### 📄 AI Document Generation (NVIDIA NIM)
- **Resume** from your profile — `POST /api/ai { generateResume: true }`
- **Cover letter** per job — tailored to `matchedSkills` vs `missingSkills`
- Model: `nvidia/nemotron-3-nano-30b-a3b` via `https://integrate.api.nvidia.com/v1/chat/completions` (OpenAI-compatible). Falls back to a local template when `NVIDIA_API_KEY` is unset — always works offline.

### 📊 Analytics
Funnel by stage, conversion `%`, average fit, top-6 matches, and **skill demand vs. gaps** (most-requested skills you haven't listed).

### 👤 Profile That Powers Everything
Headline, summary, location, remote preference, years of experience, salary range, **skill chips with suggestions**, and target roles. Completion `%` drives match accuracy.

### 🌓 Polished UX
- Dark/light with system preference + toggle
- Tailwind v4 + custom CSS variables, `FitRing` SVG, skeleton loaders, shimmer
- Mobile: sidebar → bottom nav
- Zero client-side data-fetch libs — just `fetch` + React state (lean, fast)

---

## 🧱 Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| **Framework** | Next.js 16.3 (App Router, Turbopack) + React 19 | `RouteContext<'/path'>`, async `params`/`searchParams` |
| **Styling** | Tailwind CSS v4 (`@custom-variant dark`) | Class-based dark mode, custom tokens |
| **Language** | TypeScript 5 | `LayoutProps<"/">`, strict |
| **DB** | SQLite via `better-sqlite3` | WAL mode, `serverExternalPackages` (native module) |
| **Validation** | Zod | All API routes |
| **AI** | NVIDIA NIM (`nvidia/nemotron-3-nano-30b-a3b`) | OpenAI-compatible, stub fallback |

**No external auth, no ORM, no chart lib** — intentionally minimal and hackable.

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+ (tested on 24.19, npm 11.16)
- No Docker, no Postgres

### 1. Clone & install

```bash
git clone https://github.com/harmanhanjra/hirematch-ai.git
cd hirematch-ai
npm install
npm approve-scripts better-sqlite3   # one-time: allow native build
npm rebuild better-sqlite3            # verify: should print "rebuilt dependencies successfully"
```

### 2. Environment

```bash
cp .env.example .env.local
# .env.local:
# NVIDIA_API_KEY=nvapi-...   # from https://build.nvidia.com
# NVIDIA_MODEL=nvidia/nemotron-3-nano-30b-a3b
# Leave NVIDIA_API_KEY empty to run in offline stub mode
```

> `.env` and `.env.local` are gitignored. Only `.env.example` is tracked.

### 3. Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build (15 routes)
npm start        # serve production (after build)
npx tsc --noEmit # type check
```

On first `GET /api/jobs`, 12 jobs are auto-seeded to `data/jobmatch.db` (gitignored). Add your profile at `/profile` to unlock fit scores.

---

## 🔧 How It Works

```
app/
  layout.tsx              → ThemeProvider + globals.css
  page.tsx                → Landing (feature cards)
  (app)/                  → Authenticated shell (AppShell: sidebar/bottom nav)
    dashboard/page.tsx    → stats, top matches, skill gaps, avg fit
    jobs/page.tsx         → list + filters + FitRing + add dialog → job-detail modal
    applications/page.tsx → kanban (6 columns, drag-and-drop)
    documents/page.tsx    → list + generate + edit + delete
    analytics/page.tsx    → funnel, conversions, demand gaps, top roles
    profile/page.tsx      → editable form + chips + completion %

lib/
  db.ts        → SQLite: users, profiles, jobs, applications, documents, sessions (WAL)
  repo.ts      → CRUD (prepared statements, upserts, transactions)
  matching.ts  → explainable computeFit(profile, job) + synonym map
  ats.ts       → deterministic ATS resume analysis
  ai/nvidia.ts → chat(messages) → NVIDIA NIM or stubChat
  auth.ts      → cookie sessions (jm_session, 30d) + ensureDemoUser
  documents.ts → resume/cover generation (AI → template fallback)
  seed.ts      → 12 realistic jobs
  types.ts     → Stage, User, Profile, Job, Application, FitBreakdown, JobWithFit

app/api/
  auth, profile, jobs, applications, ai, ats, documents, stats, health
```

**Auth:** No login wall. First request auto-creates `demo@jobmatch.app` + `jm_session` cookie. Add real auth later by swapping `ensureDemoUser`.

---

## 🔑 NVIDIA NIM Setup

1. Create account at [build.nvidia.com](https://build.nvidia.com).
2. Generate an API key (format `nvapi-...`).
3. List available models: `GET https://integrate.api.nvidia.com/v1/models` with `Authorization: Bearer <key>`.
4. Set `NVIDIA_MODEL` to a model your account can access. Tested: `nvidia/nemotron-3-nano-30b-a3b`. Older `meta/llama-3.1-*` models were sunset on 2026-08-26 (return `410 Gone`).
5. Restart dev server — `Environments: .env.local, .env` should appear in logs. Check `dev.err.log` for `NVIDIA API error` if any.

---

## 🛣️ Roadmap

- [ ] Real auth (NextAuth / Clerk) + multi-user
- [ ] Job scraping (company career pages, Greenhouse/Lever)
- [x] ATS resume scoring with keyword, structure, and impact analysis
- [ ] Interview prep (STAR builder, mock interview)
- [ ] Email/Gmail sync for status updates
- [ ] Charts with Recharts / D3
- [ ] Tests (Vitest + Playwright)
- [x] Explainable match scoring with confidence, evidence signals, and recommendations
- [x] Health endpoint for deployment monitoring
- [x] GitHub Actions CI for type checking and production builds

PRs welcome — see [CONTRIBUTING](#contributing) below.

---

## 🤝 Contributing

```bash
git checkout -b feat/your-feature
# make changes, ensure:
npx tsc --noEmit
npm run build
git commit -m "feat: your feature"
gh pr create
```

Please keep PRs focused and include a short loom/screenshot for UI changes.

---

## 📄 License

MIT — do whatever you want, just keep the notice.

---

## 🙏 Acknowledgments

- NVIDIA NIM for the generous free tier.
- The `better-sqlite3` maintainers for the fastest SQLite binding.
- Next.js team for Turbopack.

---

<p align="center">
  If this helped you, please <b>⭐ star the repo</b> — it helps others discover it.
  <br/>
  <a href="https://github.com/harmanhanjra/hirematch-ai">github.com/harmanhanjra/hirematch-ai</a>
</p>
