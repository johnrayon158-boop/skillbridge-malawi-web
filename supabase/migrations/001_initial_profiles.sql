-- SkillBridge Malawi: Supabase authentication profile foundation

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'graduate', 'employer', 'admin')),
  full_name text,
  email text,
  phone text,
  profile_photo_url text,
  location text,
  bio text,
  institution text,
  programme text,
  graduation_year integer,
  career_interests text[] not null default '{}',
  company_name text,
  company_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
begin
  if requested_role not in ('student', 'graduate', 'employer') then
    requested_role := 'student';
  end if;

  insert into public.profiles (
    id,
    user_id,
    role,
    full_name,
    email,
    institution,
    programme,
    career_interests,
    company_name,
    company_type
  ) values (
    new.id,
    new.id,
    requested_role,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    nullif(new.raw_user_meta_data->>'institution', ''),
    nullif(new.raw_user_meta_data->>'programme', ''),
    case
      when jsonb_typeof(new.raw_user_meta_data->'career_interests') = 'array'
        then array(select jsonb_array_elements_text(new.raw_user_meta_data->'career_interests'))
      else '{}'
    end,
    nullif(new.raw_user_meta_data->>'company_name', ''),
    nullif(new.raw_user_meta_data->>'company_type', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

 drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

 drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id and role <> 'admin');

 drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and role <> 'admin');
