// services/callsService.ts
// Fetch and manage phone call records from Vapi

import { supabase } from '../lib/supabase';

export interface Call {
  id: string;
  vapi_call_id?: string;
  caller_phone?: string;
  caller_name?: string;
  address?: string;
  service_needed?: string;
  issue_description?: string;
  urgency: 'emergency' | 'high' | 'medium' | 'low';
  duration_seconds?: number;
  recording_url?: string;
  transcript?: string;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  started_at?: string;
  created_at: string;
}

export const getCalls = async (): Promise<Call[]> => {
  const { data, error } = await supabase
    .from('calls')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateCallStatus = async (callId: string, status: Call['status']): Promise<void> => {
  const { error } = await supabase.from('calls').update({ status }).eq('id', callId);
  if (error) throw error;
};

export const formatDuration = (seconds?: number): string => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};
