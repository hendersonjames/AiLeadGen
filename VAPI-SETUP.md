# AI Phone Receptionist — Setup Guide
## LeadHub Phase 4 — Vapi Integration

---

## Prerequisites
- Vapi account (vapi.ai)
- Twilio account (twilio.com) OR use Vapi's built-in phone numbers
- These Vercel environment variables added:
  - `VAPI_API_KEY` — from your Vapi dashboard
  - `SUPABASE_SERVICE_KEY` — Supabase service role key (not the publishable key)
  - `WEBHOOK_SECRET` — any random string (e.g., generate at random.org)

---

## Step 1 — Import the AI Assistant

1. Go to your Vapi dashboard → **Assistants** → **Create Assistant**
2. Switch to JSON/raw mode and paste the contents of `vapi-assistant-config.json`
3. Replace the placeholders:
   - `{{ASSISTANT_NAME}}` → e.g., "Alex" or "Sam" (the AI's name)
   - `{{BUSINESS_NAME}}` → e.g., "Henderson Roofing"
   - `{{SERVICE_TYPE}}` → e.g., "roofing"
   - `{{SERVICE_AREA}}` → e.g., "Denver and surrounding areas"
   - `{{WEBHOOK_URL}}` → your Vercel app URL (e.g., `https://ai-lead-gen-one.vercel.app`)
   - `{{WEBHOOK_SECRET}}` → the same value as your `WEBHOOK_SECRET` env var
4. Save the assistant

## Step 2 — Get a Phone Number

**Option A — Vapi built-in number:**
1. Vapi dashboard → **Phone Numbers** → **Buy Number**
2. Pick a local number for your service area
3. Assign your assistant to that number

**Option B — Twilio (bring your own number):**
1. Get a number in Twilio
2. In Vapi → Phone Numbers → Import Twilio Number
3. Follow their instructions

## Step 3 — Set Vercel Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

| Key | Value |
|-----|-------|
| `VAPI_API_KEY` | From Vapi dashboard → Account → API Keys |
| `SUPABASE_SERVICE_KEY` | From Supabase → Project Settings → API → service_role key |
| `WEBHOOK_SECRET` | Any random string (copy it, keep it safe) |

Then redeploy.

## Step 4 — Run the Database Migration

In Supabase SQL Editor, run the calls table portion of `supabase-schema.sql` (the section under "CALLS TABLE (Phase 4)").

## Step 5 — Test It

1. Call the phone number you set up
2. The AI should answer with your business name
3. After the call ends, check the **📞 Calls** tab in LeadHub — the call should appear automatically
4. Check the **Pipeline** tab — a new lead should have been created from the call

---

## How It Works

```
Caller dials number
      ↓
Vapi AI answers (sounds like a person)
      ↓
Gathers: name, phone, address, issue, urgency
      ↓
Call ends → Vapi sends webhook to /api/vapi-webhook
      ↓
Webhook creates:
  • Call record in `calls` table
  • Lead record in `leads` table (stage: 'new')
      ↓
Lead appears in Pipeline + Calls tab
      ↓
Contractor gets notification (Phase 4b — Twilio SMS)
```

---

## Customizing the AI

Edit the `systemPrompt` in `vapi-assistant-config.json` to:
- Change the qualifying questions for your trade
- Adjust how urgent calls are handled
- Set specific hours ("We're open Mon-Fri 8am-6pm...")
- Add services you offer

---
*Built by Max — March 13, 2026*
