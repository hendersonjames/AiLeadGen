# LeadHub — AI Lead Generation & CRM

AI-powered lead finder, qualifier, and CRM pipeline for home service businesses. Built with React + Vite + TypeScript, Supabase, Gemini AI, and Vapi (AI phone receptionist).

**Live:** https://ai-lead-gen-one.vercel.app

---

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Auth + Database:** Supabase (anon/publishable key for client, service role key for webhook only)
- **AI Features:** Google Gemini API (lead finding, qualification)
- **AI Phone Receptionist:** Vapi (Phase 4)
- **Deployment:** Vercel

---

## Environment Variables

### Vercel — Frontend (Build-time)

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key | Supabase → Settings → API → anon key |
| `GEMINI_API_KEY` | Google Gemini API key | Google AI Studio |

> ⚠️ `VITE_` prefix is required for Vite to expose vars to the browser build. These are **public** keys — safe to expose in frontend.

### Vercel — Serverless API (Runtime, Phase 4 only)

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `SUPABASE_URL` | Same project URL as above | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (secret!) | Supabase → Settings → API → service_role key |
| `VAPI_API_KEY` | Vapi API key | vapi.ai → Account → API Keys |
| `WEBHOOK_SECRET` | Random secret string | Generate at random.org or `openssl rand -hex 32` |

> ⚠️ `SUPABASE_SERVICE_KEY` bypasses RLS — never expose it in frontend code. Only use in serverless functions.

---

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your keys:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   GEMINI_API_KEY=AIza...
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

---

## Database Setup

Run `supabase-schema.sql` in your Supabase SQL Editor (Dashboard → SQL Editor → New Query).

**If upgrading to Phase 4 (Vapi):** Also run the "SCHEMA PATCH" section at the bottom of the file — it makes `leads.user_id` nullable and adds performance indexes.

---

## Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Auth + Database + Pipeline CRM | ✅ Complete |
| 2 | AI Lead Finder saves to pipeline | ✅ Complete |
| 3 | Lead detail view, notes, stage movement | ✅ Complete |
| 4 | AI Phone Receptionist (Vapi) | ✅ Code ready — needs Vercel env vars + Vapi setup |

See `VAPI-SETUP.md` for Phase 4 setup instructions.

---

## Auth Notes

- **Email/password signup:** Works out of the box. Supabase sends a confirmation email by default — disable this in Supabase → Auth → Settings → "Enable email confirmations" if you want instant login during development.
- **Google OAuth:** Redirect URL is set to `window.location.origin`. You must add your domain to Supabase → Auth → URL Configuration → Redirect URLs, and configure Google OAuth credentials in Supabase → Auth → Providers → Google.
- **Key format:** This app uses the new `sb_publishable_` format key (not the legacy `eyJ...` JWT format). Both work, but `sb_publishable_` is preferred for new projects.
