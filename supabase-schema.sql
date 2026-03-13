-- ================================================================
-- LeadHub Database Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ================================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ================================================================
-- LEADS TABLE
-- Stores all leads found or entered by users
-- ================================================================
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Lead info
  name text not null default 'Unknown Lead',
  business_name text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  
  -- Job details
  service_type text not null default 'roofing',
  job_type text, -- repair, replacement, inspection, etc.
  estimated_value numeric(10,2),
  urgency integer check (urgency between 1 and 5),
  notes text,
  
  -- Source tracking
  source text default 'lead_finder', -- lead_finder, manual, referral
  source_url text, -- Google Maps URL if from lead finder
  raw_lead_text text, -- Original AI-generated lead info
  qualification_report text, -- AI qualification analysis
  
  -- Pipeline stage
  stage text not null default 'new' 
    check (stage in ('new', 'contacted', 'estimate_sent', 'won', 'lost')),
  
  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  contacted_at timestamptz,
  closed_at timestamptz
);

-- ================================================================
-- LEAD ACTIVITIES TABLE  
-- Tracks every action taken on a lead (call, email, note, stage change)
-- ================================================================
create table if not exists public.lead_activities (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  activity_type text not null 
    check (activity_type in ('note', 'call', 'email', 'stage_change', 'qualification')),
  content text,
  old_stage text,
  new_stage text,
  
  created_at timestamptz default now() not null
);

-- ================================================================
-- USER PROFILES TABLE
-- Stores business info for each user (extends auth.users)
-- ================================================================
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  
  -- Business info
  business_name text,
  trade_type text default 'roofing',
  service_area text,
  phone text,
  
  -- Onboarding
  onboarding_completed boolean default false,
  
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- Ensures users can only see their own data
-- ================================================================

-- Enable RLS on all tables
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.user_profiles enable row level security;

-- Leads policies
create policy "Users can view their own leads"
  on public.leads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own leads"
  on public.leads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own leads"
  on public.leads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own leads"
  on public.leads for delete
  using (auth.uid() = user_id);

-- Lead activities policies
create policy "Users can view their own activities"
  on public.lead_activities for select
  using (auth.uid() = user_id);

create policy "Users can insert their own activities"
  on public.lead_activities for insert
  with check (auth.uid() = user_id);

-- User profiles policies
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- Auto-update updated_at timestamps
-- ================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================
-- DONE! Your LeadHub database is ready.
-- ================================================================

-- ================================================================
-- CALLS TABLE (Phase 4 — AI Phone Receptionist)
-- Stores every inbound call handled by the Vapi AI agent
-- ================================================================
create table if not exists public.calls (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  vapi_call_id text unique,
  caller_phone text,
  caller_name text,
  address text,
  service_needed text,
  issue_description text,
  urgency text default 'medium' check (urgency in ('emergency', 'high', 'medium', 'low')),
  duration_seconds integer,
  recording_url text,
  transcript text,
  status text default 'new' check (status in ('new', 'contacted', 'converted', 'lost')),
  call_id uuid,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.calls enable row level security;

create policy "Users can view their own calls"
  on public.calls for select using (auth.uid() = user_id);

create policy "Service role can insert calls"
  on public.calls for insert with check (true);

-- Add call_id reference to leads table
alter table public.leads add column if not exists call_id uuid references public.calls(id);
