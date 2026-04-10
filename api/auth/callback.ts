// api/auth/callback.ts
// Server-side OAuth token exchange — handles the redirect from Supabase Google OAuth
// This is a fallback: Supabase also supports client-side exchangeCodeForSession in App.tsx
// But a server-side route is more robust (works even if JS hasn't loaded yet)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('[auth/callback] OAuth error:', error, error_description);
    // Redirect to app with error
    return res.redirect(302, `/?auth_error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code || typeof code !== 'string') {
    console.error('[auth/callback] No authorization code in callback');
    return res.redirect(302, '/?auth_error=missing_code');
  }

  if (!process.env.SUPABASE_URL || !process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    console.error('[auth/callback] Missing Supabase env vars');
    return res.redirect(302, '/?auth_error=server_config_error');
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[auth/callback] Code exchange failed:', exchangeError);
      return res.redirect(302, `/?auth_error=${encodeURIComponent(exchangeError.message)}`);
    }

    // Success — redirect to app root; App.tsx auth state listener will pick up the session
    return res.redirect(302, '/');
  } catch (err: any) {
    console.error('[auth/callback] Unexpected error:', err?.message ?? err);
    return res.redirect(302, `/?auth_error=${encodeURIComponent(err?.message ?? 'unknown_error')}`);
  }
}
