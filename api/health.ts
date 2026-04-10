// api/health.ts
// Simple diagnostics endpoint — does NOT require auth
// Returns status of key server-side dependencies
// Use for: verifying Vercel env vars, Supabase connectivity

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results: Record<string, string> = {};

  // Check required env vars
  results['SUPABASE_URL'] = process.env.SUPABASE_URL ? 'SET' : 'MISSING';
  results['SUPABASE_SERVICE_KEY'] = process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING';
  results['WEBHOOK_SECRET'] = process.env.WEBHOOK_SECRET ? 'SET' : 'NOT_SET (optional)';
  results['VAPI_API_KEY'] = process.env.VAPI_API_KEY ? 'SET' : 'NOT_SET (optional)';

  // Try Supabase connection (service role — can read all rows)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Check calls table
      const { count: callCount, error: callErr } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true });
      results['calls_table'] = callErr ? `ERROR: ${callErr.message}` : `OK (${callCount ?? 0} rows)`;

      // Check leads table (user_id nullability)
      const { data: leadSample, error: leadErr } = await supabase
        .from('leads')
        .select('id,user_id')
        .limit(1);
      if (leadErr) {
        results['leads_table'] = `ERROR: ${leadErr.message}`;
      } else {
        const hasNullUserId = leadSample?.some(l => l.user_id === null);
        results['leads_table'] = `OK (nullable user_id: ${hasNullUserId ? 'YES ✓' : 'CHECK — may need patch'})`;
      }

      results['supabase_connection'] = 'OK';
    } catch (err: any) {
      results['supabase_connection'] = `ERROR: ${err?.message ?? err}`;
    }
  } else {
    results['supabase_connection'] = 'SKIPPED — env vars missing';
  }

  const httpStatus = results['supabase_connection'] === 'OK' ? 200
    : results['supabase_connection'] === 'SKIPPED — env vars missing' ? 503
    : 500;

  return res.status(httpStatus).json({
    service: 'LeadHub health',
    timestamp: new Date().toISOString(),
    ...results,
  });
}
