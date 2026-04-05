-- Migration 002: Add ends_at to forms, simplify status
alter table forms
  add column if not exists ends_at timestamptz default null;

-- Update status check to include 'inactive'
alter table forms drop constraint if exists forms_status_check;
alter table forms add constraint forms_status_check
  check (status in ('active', 'inactive', 'archived'));

-- Migrate existing 'draft' to 'inactive'
update forms set status = 'inactive' where status = 'draft';
