-- ContentBot Pro database schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- Workspaces represent an agency / team account.
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  created_at timestamptz not null default now()
);

-- Profiles extend Supabase's built-in auth.users with workspace membership.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

-- Clients are the brands/companies a workspace creates content for.
create table clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  industry text,
  audience text,
  brand_voice text,
  avatar_label text,
  avatar_color text default 'blue',
  created_at timestamptz not null default now()
);

-- Generated content pieces and their scores.
create table content_pieces (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  title text not null,
  body text not null,
  platform text not null,
  content_type text not null,
  goal text not null,
  tone text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  scheduled_for timestamptz,
  variety_score int,
  hook_score int,
  clarity_score int,
  cta_score int,
  emotion_score int,
  authority_score int,
  virality_score int,
  predicted_reach text check (predicted_reach in ('Low', 'Medium', 'High', 'Viral')),
  classification text,
  why_it_works text,
  improvement_tip text,
  created_at timestamptz not null default now()
);

create index idx_clients_workspace on clients(workspace_id);
create index idx_content_client on content_pieces(client_id);
create index idx_profiles_workspace on profiles(workspace_id);

-- Row Level Security: users can only see data inside their own workspace.
alter table workspaces enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table content_pieces enable row level security;

create policy "Users can view their own workspace"
  on workspaces for select
  using (id in (select workspace_id from profiles where id = auth.uid()));

create policy "Users can view profiles in their workspace"
  on profiles for select
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

create policy "Users can view clients in their workspace"
  on clients for select
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

create policy "Users can insert clients in their workspace"
  on clients for insert
  with check (workspace_id in (select workspace_id from profiles where id = auth.uid()));

create policy "Users can update clients in their workspace"
  on clients for update
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

create policy "Users can delete clients in their workspace"
  on clients for delete
  using (workspace_id in (select workspace_id from profiles where id = auth.uid()));

create policy "Users can view content for their workspace's clients"
  on content_pieces for select
  using (client_id in (
    select id from clients where workspace_id in (
      select workspace_id from profiles where id = auth.uid()
    )
  ));

create policy "Users can insert content for their workspace's clients"
  on content_pieces for insert
  with check (client_id in (
    select id from clients where workspace_id in (
      select workspace_id from profiles where id = auth.uid()
    )
  ));

create policy "Users can update content for their workspace's clients"
  on content_pieces for update
  using (client_id in (
    select id from clients where workspace_id in (
      select workspace_id from profiles where id = auth.uid()
    )
  ));

create policy "Users can delete content for their workspace's clients"
  on content_pieces for delete
  using (client_id in (
    select id from clients where workspace_id in (
      select workspace_id from profiles where id = auth.uid()
    )
  ));

-- When a new user signs up, automatically create a workspace + profile for them.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_workspace_id uuid;
begin
  insert into workspaces (name, plan)
  values (coalesce(new.raw_user_meta_data->>'workspace_name', 'My workspace'), 'free')
  returning id into new_workspace_id;

  insert into profiles (id, workspace_id, full_name, role)
  values (new.id, new_workspace_id, new.raw_user_meta_data->>'full_name', 'owner');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
