// api/vapi-webhook.ts
// Vercel serverless function — receives Vapi call events and saves to Supabase

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface VapiCallData {
  message: {
    type: 'end-of-call-report' | 'status-update' | 'transcript';
    call?: {
      id: string;
      phoneNumberId: string;
      customer?: { number: string };
      startedAt?: string;
      endedAt?: string;
      duration?: number;
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

const urgencyToScore = (urgency?: string): number => {
  switch (urgency) {
    case 'emergency': return 5;
    case 'high':      return 4;
    case 'medium':    return 3;
    case 'low':       return 1;
    default:          return 2;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify webhook secret
  const secret = req.headers['x-vapi-secret'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as VapiCallData;

  // Only process end-of-call reports
  if (body.message?.type !== 'end-of-call-report') {
    return res.status(200).json({ received: true });
  }

  const call = body.message.call;
  const structured = body.message.analysis?.structuredData;
  const transcript = body.message.artifact?.transcript || body.message.transcript;
  const recordingUrl = body.message.artifact?.recordingUrl;

  try {
    // 1. Save call record
    const { data: callRecord, error: callError } = await supabase
      .from('calls')
      .insert({
        vapi_call_id: call?.id,
        caller_phone: call?.customer?.number,
        duration_seconds: call?.duration,
        recording_url: recordingUrl,
        transcript,
        started_at: call?.startedAt,
        ended_at: call?.endedAt,
        caller_name: structured?.caller_name,
        address: structured?.address,
        service_needed: structured?.service_needed,
        issue_description: structured?.issue_description,
        urgency: structured?.urgency || 'medium',
        status: 'new',
      })
      .select()
      .single();

    if (callError) throw callError;

    // 2. Auto-create lead from call
    // NOTE: user_id is intentionally omitted — leads from phone calls are
    // inserted via the service role (bypasses RLS). The leads.user_id column
    // must be made nullable in the schema for this to work (see supabase-schema.sql).
    // James: run the schema patch below before enabling Vapi.
    if (structured?.caller_name || structured?.address) {
      await supabase.from('leads').insert({
        // user_id omitted — phone_call leads are ownerless until claimed or
        // the webhook is updated to accept a Vapi assistant metadata user_id.
        name: structured?.caller_name || 'Phone Inquiry',
        phone: structured?.callback_number || call?.customer?.number,
        address: structured?.address,
        service_type: structured?.service_needed || 'roofing',
        source: 'phone_call',
        raw_lead_text: transcript,
        notes: structured?.issue_description,
        urgency: urgencyToScore(structured?.urgency),
        stage: 'new',
        call_id: callRecord?.id,
      });
    }

    // 3. Return success
    return res.status(200).json({ success: true, callId: callRecord?.id });

  } catch (error: any) {
    console.error('Vapi webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
