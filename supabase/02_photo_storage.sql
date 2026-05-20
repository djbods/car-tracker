-- E39 Garage Tracker — Phase 2: move car photo from IndexedDB to Supabase Storage
-- Paste into Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────
-- Vehicles get a pointer to the photo object in storage.
-- Convention: <user_id>/<vehicle_id>.jpg
-- ──────────────────────────────────────────────────────────────────────────

alter table vehicles add column if not exists photo_path text;

-- ──────────────────────────────────────────────────────────────────────────
-- Private bucket for car photos. Reads happen via signed URLs minted by
-- the client; nothing in here is world-readable.
-- ──────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', false)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────────────────────
-- Storage RLS — a user can only touch objects under a folder named after
-- their own auth.uid(). storage.foldername() splits 'a/b/c.jpg' → {a,b,c.jpg}.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "Users can read own car photos"   on storage.objects;
drop policy if exists "Users can upload own car photos" on storage.objects;
drop policy if exists "Users can update own car photos" on storage.objects;
drop policy if exists "Users can delete own car photos" on storage.objects;

create policy "Users can read own car photos"
  on storage.objects for select
  using (bucket_id = 'car-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own car photos"
  on storage.objects for insert
  with check (bucket_id = 'car-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own car photos"
  on storage.objects for update
  using (bucket_id = 'car-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own car photos"
  on storage.objects for delete
  using (bucket_id = 'car-photos' and auth.uid()::text = (storage.foldername(name))[1]);
