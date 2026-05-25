-- Car Tracker — Phase 2.5: Document vault
-- Paste into Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────
-- documents table — per-vehicle file metadata. The actual bytes live in
-- Storage; this table stores the pointer + searchable/filterable fields.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists documents (
  id              uuid primary key default gen_random_uuid(),
  vehicle_id      uuid references vehicles(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  type            text not null,
  title           text not null,
  file_path       text not null,
  file_size_bytes bigint,
  mime_type       text,
  expiry_date     date,
  notes           text,
  created_at      timestamptz default now(),
  constraint documents_type_check check (type in (
    'Insurance', 'Registration', 'Roadworthy', 'Warranty',
    'Manual', 'Receipt', 'Other'
  ))
);

-- "All documents for this vehicle, expiring soonest first" — covers the
-- main list view and the 2.6 reminder query.
create index if not exists documents_vehicle_expiry_idx
  on documents (vehicle_id, expiry_date asc nulls last);

-- "Total bytes used by this user" — backs the 50MB soft cap check.
create index if not exists documents_user_idx
  on documents (user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- RLS — same shape as the other tables: user can only touch their own rows.
-- ──────────────────────────────────────────────────────────────────────────

alter table documents enable row level security;

drop policy if exists "Users can manage their own documents" on documents;

create policy "Users can manage their own documents"
  on documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- Private storage bucket. Same folder-per-user RLS pattern as car-photos.
-- Path convention: <user_id>/<vehicle_id>/<uuid>.<ext>
-- ──────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own documents"   on storage.objects;
drop policy if exists "Users can upload own documents" on storage.objects;
drop policy if exists "Users can update own documents" on storage.objects;
drop policy if exists "Users can delete own documents" on storage.objects;

create policy "Users can read own documents"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own documents"
  on storage.objects for update
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
