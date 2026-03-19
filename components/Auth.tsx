// components/Auth.tsx
// Sign in / Sign up screen

import React, { useState } from 'react';
import { signIn, signUp, signInWithGoogle } from '../services/authService';
import { supabaseConfigured } from '../lib/supabase';

const Auth: React.FC = () => {
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-xl p-8 max-w-md w-full border border-red-500/30 text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-xl font-bold text-white mb-2">Configuration Required</h2>
          <p className="text-content-200 text-sm mb-4">
            Supabase environment variables are missing. Please add the following to your Vercel project settings:
          </p>
          <div className="bg-base-300 rounded-lg p-4 text-left text-xs font-mono text-content-100 space-y-1">
            <div>VITE_SUPABASE_URL</div>
            <div>VITE_SUPABASE_PUBLISHABLE_KEY</div>
            <div>GEMINI_API_KEY</div>
          </div>
          <p className="text-content-200 text-xs mt-4">After adding them, redeploy the app.</p>
        </div>
      </div>
    );
  }

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setMessage('Account created! Check your email to confirm, then sign in.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
        // App will re-render via auth state change listener
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* LeadHub Icon — isometric 3D house */}
            <svg width="48" height="54" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Left face — blue */}
              <polygon points="45,8 8,30 8,78 45,56" fill="#3B82F6"/>
              {/* Right face — orange */}
              <polygon points="45,8 82,30 82,78 45,56" fill="#F97316"/>
              {/* Bottom cap — dark blue */}
              <polygon points="8,78 45,56 82,78 45,100" fill="#1D4ED8"/>
              {/* Window on left face — 2x2 grid */}
              <rect x="18" y="36" width="7" height="6" rx="0.5" fill="white" opacity="0.9"/>
              <rect x="27" y="36" width="7" height="6" rx="0.5" fill="white" opacity="0.9"/>
              <rect x="18" y="44" width="7" height="6" rx="0.5" fill="white" opacity="0.9"/>
              <rect x="27" y="44" width="7" height="6" rx="0.5" fill="white" opacity="0.9"/>
              {/* Cyan curve */}
              <path d="M 12 72 Q 30 50 50 42 Q 65 36 76 30" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" fill="none"/>
            </svg>
            <h1 className="text-4xl font-black tracking-tight">
              <span style={{color: '#3B82F6'}}>Lead</span>
              <span style={{color: '#F97316'}}>Hub</span>
            </h1>
          </div>
          <p className="text-content-200 text-sm">AI-powered lead generation for home service contractors</p>
        </div>

        {/* Card */}
        <div className="bg-base-200 rounded-2xl p-8 border border-base-300 shadow-2xl">
          <h2 className="text-xl font-bold text-content-100 mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-content-200 text-sm mb-6">
            {isSignUp
              ? 'Start finding high-quality leads in minutes.'
              : 'Sign in to access your lead dashboard.'}
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-900/30 border border-green-500 text-green-300 rounded-lg p-3 mb-4 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-200 mb-1">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                required
                className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all placeholder-content-200/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-200 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
              />
              {isSignUp && (
                <p className="text-content-200 text-xs mt-1">Minimum 6 characters</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-brand-primary/20 mt-2"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Free Account' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-base-300" />
            <span className="px-3 text-content-200 text-xs uppercase tracking-wide">or continue with</span>
            <div className="flex-1 border-t border-base-300" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-gray-800 font-semibold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Prominent sign-up / sign-in toggle */}
        <div className="mt-4">
          <div className="bg-base-200 border border-base-300 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-content-100 font-semibold text-sm">
                {isSignUp ? 'Already have an account?' : 'New to LeadHub?'}
              </p>
              <p className="text-content-200 text-xs mt-0.5">
                {isSignUp
                  ? 'Sign in to your existing account.'
                  : 'Free forever. No credit card required.'}
              </p>
            </div>
            <button
              onClick={toggleMode}
              className="shrink-0 px-4 py-2 text-sm font-semibold border border-brand-secondary text-brand-secondary rounded-lg hover:bg-brand-secondary hover:text-white transition-colors whitespace-nowrap"
            >
              {isSignUp ? '← Sign In' : 'Sign Up Free →'}
            </button>
          </div>
        </div>

        {/* Trust signal */}
        <p className="text-center text-content-200/60 text-xs mt-5">
          Trusted by home service contractors · Secured by Supabase
        </p>

      </div>
    </div>
  );
};

export default Auth;
