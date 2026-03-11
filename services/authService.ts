// services/authService.ts
// Authentication helpers

import { supabase } from '../lib/supabase';
import type { User, Session } from '../lib/supabase';

export { User, Session };

// Sign up with email and password
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
};

// Get/update user profile
export const getUserProfile = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateUserProfile = async (updates: {
  business_name?: string;
  trade_type?: string;
  service_area?: string;
  phone?: string;
  onboarding_completed?: boolean;
}) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .select()
    .single();
  if (error) throw error;
  return data;
};
