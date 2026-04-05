-- Migration 001: Add lead_data and is_test columns to responses
-- Run this in Supabase SQL Editor

alter table responses
  add column if not exists lead_data jsonb default '{}',
  add column if not exists is_test boolean default false;

-- Index for filtering test data
create index if not exists responses_is_test_idx on responses(is_test);
