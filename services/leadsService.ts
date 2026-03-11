// services/leadsService.ts
// All database operations for leads

import { supabase } from '../lib/supabase';

export type LeadStage = 'new' | 'contacted' | 'estimate_sent' | 'won' | 'lost';

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  service_type: string;
  job_type?: string;
  estimated_value?: number;
  urgency?: number;
  notes?: string;
  source: string;
  source_url?: string;
  raw_lead_text?: string;
  qualification_report?: string;
  stage: LeadStage;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  name?: string;
  business_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  service_type?: string;
  job_type?: string;
  estimated_value?: number;
  urgency?: number;
  notes?: string;
  source?: string;
  source_url?: string;
  raw_lead_text?: string;
  qualification_report?: string;
}

// Fetch all leads for current user
export const getLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Fetch leads by stage
export const getLeadsByStage = async (stage: LeadStage): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('stage', stage)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Save a new lead to the database
export const saveLead = async (leadData: CreateLeadInput): Promise<Lead> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...leadData,
      user_id: user.id,
      stage: 'new',
      service_type: leadData.service_type || 'roofing',
      name: leadData.name || leadData.business_name || 'Unknown Lead',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a lead's stage (move through pipeline)
export const updateLeadStage = async (leadId: string, newStage: LeadStage, oldStage: LeadStage): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error: updateError } = await supabase
    .from('leads')
    .update({ 
      stage: newStage,
      contacted_at: newStage === 'contacted' ? new Date().toISOString() : undefined,
      closed_at: (newStage === 'won' || newStage === 'lost') ? new Date().toISOString() : undefined,
    })
    .eq('id', leadId);

  if (updateError) throw updateError;

  // Log the activity
  await supabase.from('lead_activities').insert({
    lead_id: leadId,
    user_id: user.id,
    activity_type: 'stage_change',
    old_stage: oldStage,
    new_stage: newStage,
    content: `Stage changed from ${oldStage} to ${newStage}`,
  });
};

// Update lead details
export const updateLead = async (leadId: string, updates: Partial<Lead>): Promise<Lead> => {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a lead
export const deleteLead = async (leadId: string): Promise<void> => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) throw error;
};

// Add a note to a lead
export const addLeadNote = async (leadId: string, note: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('lead_activities').insert({
    lead_id: leadId,
    user_id: user.id,
    activity_type: 'note',
    content: note,
  });
};

// Get pipeline summary stats
export const getPipelineStats = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('stage, estimated_value');

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    new: 0,
    contacted: 0,
    estimate_sent: 0,
    won: 0,
    lost: 0,
    pipeline_value: 0,
    won_value: 0,
  };

  data?.forEach(lead => {
    stats[lead.stage as LeadStage]++;
    if (lead.estimated_value) {
      stats.pipeline_value += lead.estimated_value;
      if (lead.stage === 'won') stats.won_value += lead.estimated_value;
    }
  });

  return stats;
};
