-- =============================================
-- SalAmat Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Households
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz default now()
);

-- Profiles (one per auth user)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  household_id uuid references households(id),
  created_at timestamptz default now()
);

-- Shopping items
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  quantity numeric,
  unit text,
  category text,
  checked boolean default false,
  added_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- =============================================
-- Auto-create profile on sign-up
-- =============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================
-- Row Level Security
-- =============================================
alter table profiles enable row level security;
alter table households enable row level security;
alter table shopping_items enable row level security;

-- Profiles: read/update own row only
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Households: members can read their household
create policy "Household members can read household"
  on households for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.household_id = households.id
    )
  );

create policy "Authenticated users can create households"
  on households for insert with check (auth.uid() is not null);

-- Shopping items: household members can CRUD
create policy "Household members can read items"
  on shopping_items for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.household_id = shopping_items.household_id
    )
  );

create policy "Household members can insert items"
  on shopping_items for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.household_id = shopping_items.household_id
    )
  );

create policy "Household members can update items"
  on shopping_items for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.household_id = shopping_items.household_id
    )
  );

create policy "Household members can delete items"
  on shopping_items for delete using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.household_id = shopping_items.household_id
    )
  );
