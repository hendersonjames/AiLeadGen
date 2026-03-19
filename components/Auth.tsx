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

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-brand-primary mb-2">LeadHub</h1>
          <p className="text-content-200 text-sm">AI-powered lead generation for home services</p>
        </div>

        {/* Card */}
        <div className="bg-base-200 rounded-2xl p-8 border border-base-300 shadow-2xl">
          <h2 className="text-xl font-bold text-content-100 mb-6">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>

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
              <label className="block text-sm font-medium text-content-200 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
                className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-base-300" />
            <span className="px-3 text-content-200 text-xs">OR</span>
            <div className="flex-1 border-t border-base-300" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-gray-800 font-semibold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-content-200 mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
              className="text-brand-primary hover:underline font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
