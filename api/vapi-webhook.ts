// api/vapi-webhook.ts
// Vercel serverless function — receives Vapi call events and saves to Supabase
//
// IMPORTANT: Vapi calls are unauthenticated (no user_id from Vapi).
// The calls.user_id column is intentionally nullable so anonymous webhook
// calls can insert records. Ensure this patch has been run in Supabase SQL Editor:
//
//   ALTER TABLE public.calls ALTER COLUMN user_id DROP NOT NULL;
//
// If leads are also not saving, also run:
//   ALTER TABLE public.leads ALTER COLUMN user_id DROP NOT NULL;

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ─── Vapi payload types ─────────────────────────────────────────────────────

interface VapiCallData {
  message: {
    type: 'end-of-call-report' | 'status-update' | 'transcript';
    call?: {
      id: string;
      phoneNumberId: string;
      direction?: 'inbound' | 'outbound';
      callerNumber?: string;        // caller's phone number
      calledNumber?: string;       // number that was called
      customer?: { number: string };
      startedAt?: string;
      endedAt?: string;
      duration?: number;            // seconds
      endedReason?: string;         // hangup reason from Vapi
      recording?: { url: string };
    };
    transcript?: string;
    summary?: string;
    analysis?: {
      structuredData?: {
        caller_name?: string;
        callback_number?: string;
        address?: string;
        service_needed?: string;
        issue_description?: string;
        urgency?: 'emergency' | 'high' | 'medium' | 'low';
      };
    };
    artifact?: {
      transcript?: string;
      recordingUrl?: string;
    };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const urgencyToScore = (urgency?: string): number => {
  switch (urgency) {
    case 'emergency': return 5;
    case 'high':      return 4;
    case 'medium':    return 3;
    case 'low':       return 1;
    default:          return 2;
  }
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Debugging: confirm webhook is being reached ──────────────────────────
  console.log('[vapi-webhook] Request received', {
    method: req.method,
    hasBody: !!req.body,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasWebhookSecret: !!process.env.WEBHOOK_SECRET,
  });

  // ── Guard: required env vars must be present ─────────────────────────────
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('[vapi-webhook] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
    return res.status(500).json({
      error: 'Server misconfiguration: missing Supabase environment variables',
      hint: 'Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in Vercel → Settings → Environment Variables',
    });
  }

  // ── Guard: POST only ─────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Verify webhook secret (optional — only enforced if env var is set) ──
  const secret = req.headers['x-vapi-secret'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: invalid webhook secret' });
  }

  const body = req.body as VapiCallData;

  // ── Log full payload for debugging ──────────────────────────────────────
  console.log('[vapi-webhook] Full payload:', JSON.stringify(body, null, 2));

  // Only process end-of-call reports
  if (body.message?.type !== 'end-of-call-report') {
    return res.status(200).json({ received: true });
  }

  const call = body.message.call;
  const structured = body.message.analysis?.structuredData;
  const transcript = body.message.artifact?.transcript || body.message.transcript;
  const recordingUrl = body.message.artifact?.recordingUrl;

  // ── Extract richer metadata ───────────────────────────────────────────────
  // callerNumber is Vapi's canonical field for the caller's phone number
  const callerPhone = call?.callerNumber || call?.customer?.number;
  const callType = call?.direction || null;           // 'inbound' | 'outbound'
  const endedReason = call?.endedReason || null;       // hangup reason string
  const durationSeconds = call?.duration || null;     // already in seconds

  try {
    // 1. Save call record — user_id intentionally omitted (NULL for anonymous Vapi webhooks)
    const { data: callRecord, error: callError } = await supabase
      .from('calls')
      .insert({
        vapi_call_id:  call?.id,
        caller_phone:  callerPhone,
        call_type:     callType,       // inbound | outbound
        ended_reason:  endedReason,   // hangup reason
        duration_seconds: durationSeconds,
        recording_url: recordingUrl,
        transcript,
        started_at:    call?.startedAt,
        ended_at:      call?.endedAt,
        caller_name:   structured?.caller_name,
        address:       structured?.address,
        service_needed: structured?.service_needed,
        issue_description: structured?.issue_description,
        urgency:       structured?.urgency || 'medium',
        status:        'new',
        // user_id is intentionally NULL — anonymous Vapi webhook
        // RLS insert policy "with check (true)" allows service role to insert
      })
      .select()
      .single();

    if (callError) {
      // Log full error for debugging before throwing
      console.error('[vapi-webhook] Call insert error:', JSON.stringify(callError, null, 2));
      throw callError;
    }

    console.log('[vapi-webhook] Call record saved:', callRecord?.id);

    // 2. Auto-create lead from call (non-fatal if it fails)
    if (structured?.caller_name || structured?.address || callerPhone) {
      try {
        const { data: leadRecord, error: leadErr } = await supabase
          .from('leads')
          .insert({
            // user_id intentionally omitted — phone_call leads are ownerless until claimed
            name:         structured?.caller_name || 'Phone Inquiry',
            phone:        structured?.callback_number || callerPhone,
            address:      structured?.address,
            service_type: structured?.service_needed || 'roofing',
            source:       'phone_call',
            raw_lead_text: transcript,
            notes:        structured?.issue_description,
            urgency:      urgencyToScore(structured?.urgency),
            stage:        'new',
            call_id:      callRecord?.id,
          })
          .select()
          .single();

        if (leadErr) {
          console.error('[vapi-webhook] Lead insert error:', JSON.stringify(leadErr, null, 2));
        } else {
          console.log('[vapi-webhook] Lead record saved:', leadRecord?.id);
        }
      } catch (leadErr) {
        // Non-fatal: call saved successfully, lead creation failed
        console.error('Vapi lead insert error (non-fatal):', leadErr);
      }
    }

    // 3. Return 200 fast — processing is done
    return res.status(200).json({ success: true, callId: callRecord?.id });

  } catch (error: any) {
    console.error('[vapi-webhook] Fatal error:', error?.message ?? error);
    return res.status(500).json({
      error:  error?.message ?? 'Internal server error',
      hint:   error?.code ? `Error code: ${error.code}` : undefined,
    });
  }
}
