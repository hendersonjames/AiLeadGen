// components/Auth.tsx
// Sign in / Sign up screen — polished for contractors

import React, { useState } from 'react';
import { signIn, signUp, signInWithGoogle, resetPassword } from '../services/authService';
import { supabaseConfigured } from '../lib/supabase';
import { LeadHubLogo } from './Header';

const Auth: React.FC = () => {
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%, rgba(30,64,175,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(249,115,22,0.12) 0%, transparent 60%)' }}>
        <div className="bg-[#1f2937] rounded-2xl p-8 max-w-md w-full border border-red-500/30 text-center shadow-2xl">
          <div className="text-5xl mb-4">⚙️</div>
          <h2 className="text-xl font-bold text-[#d1d5db] mb-2">Configuration Required</h2>
          <p className="text-[#9ca3af] text-sm mb-4">
            Supabase environment variables are missing. Add the following to your Vercel project settings:
          </p>
          <div className="bg-[#374151] rounded-lg p-4 text-left text-xs font-mono text-[#d1d5db] space-y-1">
            <div>VITE_SUPABASE_URL</div>
            <div>VITE_SUPABASE_PUBLISHABLE_KEY</div>
            <div>GEMINI_API_KEY</div>
          </div>
          <p className="text-[#9ca3af] text-xs mt-4">After adding them, redeploy the app.</p>
        </div>
      </div>
    );
  }

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const clearMessages = () => { setError(null); setMessage(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setMessage('Password reset email sent! Check your inbox and follow the link.');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        await signUp(email, password);
        setMessage('Account created! Check your email to confirm, then sign in.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearMessages();
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: '#0f1117',
        backgroundImage: `
          radial-gradient(ellipse at 15% 0%, rgba(30,64,175,0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 100%, rgba(249,115,22,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(30,64,175,0.05) 0%, transparent 70%)
        `,
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#1f2937] rounded-2xl p-8 border border-[#374151] shadow-2xl relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(to right, #1c4a9a, #00aeef, #f7941d, #d9531e)' }} />

          {/* Logo */}
          <div className="text-center mb-8 mt-2">
            <LeadHubLogo />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold text-[#d1d5db] mb-1 text-center">
            {isForgotPassword ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-[#6b7280] text-sm text-center mb-6">
            {isForgotPassword ? "We'll send you a link to get back in."
              : isSignUp ? 'Start generating leads in minutes.'
              : 'Sign in to manage your leads and pipeline.'}
          </p>

          {/* Messages */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 rounded-xl p-3 mb-4 text-sm flex items-start gap-2">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="bg-green-900/30 border border-green-500/50 text-green-300 rounded-xl p-3 mb-4 text-sm flex items-start gap-2">
              <span className="mt-0.5 shrink-0">✓</span>
              <span>{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                required
                autoComplete="email"
                className="w-full bg-[#374151] border border-[#4b5563] text-[#d1d5db] rounded-xl p-3.5 text-sm placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-150"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-[#9ca3af]">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); clearMessages(); }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    className="w-full bg-[#374151] border border-[#4b5563] text-[#d1d5db] rounded-xl p-3.5 text-sm placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-150 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#9ca3af] transition-colors text-base"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1c4a9a, #1E40AF)' }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #2563eb, #1c4a9a)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #1c4a9a, #1E40AF)'; }}
            >
              {loading
                ? <span className="opacity-80">Working...</span>
                : isForgotPassword ? 'Send Reset Link'
                : isSignUp ? 'Create Account'
                : 'Sign In'}
            </button>
          </form>

          {!isForgotPassword && (
            <>
              {/* Divider */}
              <div className="flex items-center my-5">
                <div className="flex-1 border-t border-[#374151]" />
                <span className="px-3 text-[#6b7280] text-xs select-none">or</span>
                <div className="flex-1 border-t border-[#374151]" />
              </div>

              {/* Google — polished with shadow + hover */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-[#1f2937]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-semibold">Continue with Google</span>
              </button>
            </>
          )}

          {/* Toggle sign in / up */}
          <p className="text-center text-sm text-[#6b7280] mt-6">
            {isForgotPassword ? (
              <>
                Remember your password?{' '}
                <button onClick={() => { setIsForgotPassword(false); clearMessages(); }}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => { setIsSignUp(!isSignUp); clearMessages(); }}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  {isSignUp ? 'Sign in' : 'Sign up free'}
                </button>
              </>
            )}
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-[#374151]">
            <span className="text-[#4b5563] text-xs flex items-center gap-1">
              <span>🔒</span> Secured by Supabase
            </span>
            <span className="text-[#4b5563] text-xs flex items-center gap-1">
              <span>🤖</span> Powered by Gemini AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;