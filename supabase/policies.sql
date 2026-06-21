-- =====================================================================
-- policies.sql
-- Run this in the Supabase SQL Editor.
--
-- Context: schema.sql already calls ALTER TABLE ... ENABLE ROW LEVEL
-- SECURITY for all five tables, but adds zero policies.  In Supabase,
-- RLS enabled + no policies = implicit deny for every non-service role.
-- This file makes that deny EXPLICIT by adding a "deny_anon" policy
-- on each table, which:
--   (a) self-documents intent clearly in the Supabase UI
--   (b) stays safe if Supabase ever changes the implicit-deny default
--
-- All application reads/writes go through the service_role client
-- (server-side API routes), which bypasses RLS — the deny-anon
-- policy never fires for legitimate app traffic.
-- =====================================================================

-- ── tenants ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_anon" ON tenants;
CREATE POLICY "deny_anon" ON tenants
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ── forms ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_anon" ON forms;
CREATE POLICY "deny_anon" ON forms
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ── responses ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_anon" ON responses;
CREATE POLICY "deny_anon" ON responses
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ── system_prompts ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_anon" ON system_prompts;
CREATE POLICY "deny_anon" ON system_prompts
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ── templates ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_anon" ON templates;
CREATE POLICY "deny_anon" ON templates
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- =====================================================================
-- TODO: shared_reports — SCHEMA + RLS MISSING
-- =====================================================================
-- The application references a "shared_reports" table in:
--   src/app/r/[id]/route.ts
--   src/app/api/reports/share/route.ts  (SELECT, INSERT, UPDATE)
--
-- This table does NOT appear in supabase/schema.sql or any migration.
-- Before enabling RLS elsewhere is complete, you MUST:
--
--   1. Define the shared_reports table (CREATE TABLE shared_reports ...)
--      with at minimum: id, form_id, token/slug, created_at, and
--      any access-control columns the share routes expect.
--
--   2. Run ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;
--
--   3. Add appropriate policies.  The public /r/[id] route reads a
--      report by token — that likely needs a select policy using the
--      token column, NOT a blanket deny-anon.
--
-- Until shared_reports is defined and secured, the /r/[id] public
-- share route will error at runtime (table not found).
-- =====================================================================
