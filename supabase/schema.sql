-- Supabase Schema for Automated Certificates

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Events Table
create table public.events (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    template_url text not null,
    hotspot_x float8 not null default 50.0, -- Percentage from left
    hotspot_y float8 not null default 50.0, -- Percentage from top
    font_family text not null default 'Plus Jakarta Sans',
    font_size int4 not null default 40,
    font_color text not null default '#000000',
    status text not null default 'Draft', -- 'Draft' or 'Active'
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Claims Table (Optional: for tracking who claimed what)
create table public.claims (
    id uuid primary key default uuid_generate_v4(),
    event_id uuid references public.events(id) on delete cascade,
    user_name text not null,
    claimed_at timestamptz default now()
);

-- RLS (Row Level Security) - Basic setup
alter table public.events enable row level security;
alter table public.claims enable row level security;

-- Policies (Simplified for now, will need Auth for Admin)
create policy "Public events are viewable by everyone" 
on public.events for select using (true);

create policy "Anyone can create events" 
on public.events for insert with check (true);

create policy "Anyone can update events" 
on public.events for update using (true);

create policy "Anyone can delete events" 
on public.events for delete using (true);

create policy "Public claims are viewable by everyone" 
on public.claims for select using (true);

-- Storage Bucket for Templates
-- Note: You should manually create a public bucket named 'templates' in Supabase Dashboard
-- or use these policies if you've already created it.

-- Enable Storage (if not already enabled)
-- insert into storage.buckets (id, name, public) values ('templates', 'templates', true);

create policy "Templates are public" on storage.objects for select using (bucket_id = 'templates');
create policy "Admins can upload templates" on storage.objects for insert with check (bucket_id = 'templates');
create policy "Admins can update templates" on storage.objects for update with check (bucket_id = 'templates');
create policy "Admins can delete templates" on storage.objects for delete using (bucket_id = 'templates');
