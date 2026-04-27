-- Admin User Notes
create table if not exists admin_user_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    admin_id uuid references profiles(id) on delete set null,
    note text not null,
    created_at timestamptz default now()
);

-- Admin Announcements
create table if not exists admin_announcements (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    body text not null,
    type text check (type in ('info','success','warning','danger')) default 'info',
    is_active boolean default true,
    starts_at timestamptz default now(),
    ends_at timestamptz,
    created_by uuid references profiles(id) on delete set null,
    created_at timestamptz default now()
);

-- Support Tickets
create table if not exists support_tickets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    subject text not null,
    message text not null,
    category text check (category in ('bug','feature','billing','usage','other')) default 'other',
    status text check (status in ('open','reviewing','resolved')) default 'open',
    admin_note text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Admin Audit Logs
create table if not exists admin_audit_logs (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid references profiles(id) on delete set null,
    target_user_id uuid references profiles(id) on delete set null,
    action text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- RLS
alter table admin_user_notes enable row level security;
alter table admin_announcements enable row level security;
alter table support_tickets enable row level security;
alter table admin_audit_logs enable row level security;

-- Drop existing policies if any
drop policy if exists "Admins can manage user notes" on admin_user_notes;
drop policy if exists "Users can read active announcements" on admin_announcements;
drop policy if exists "Admins can manage announcements" on admin_announcements;
drop policy if exists "Users can read own tickets" on support_tickets;
drop policy if exists "Users can insert own tickets" on support_tickets;
drop policy if exists "Admins can manage tickets" on support_tickets;
drop policy if exists "Admins can manage audit logs" on admin_audit_logs;

-- Policies for admin_user_notes
create policy "Admins can manage user notes" on admin_user_notes
    using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
    with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Policies for admin_announcements
create policy "Users can read active announcements" on admin_announcements
    for select
    using (is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "Admins can manage announcements" on admin_announcements
    using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
    with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Policies for support_tickets
create policy "Users can read own tickets" on support_tickets
    for select using (auth.uid() = user_id);
create policy "Users can insert own tickets" on support_tickets
    for insert with check (auth.uid() = user_id);
create policy "Admins can manage tickets" on support_tickets
    using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
    with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Policies for admin_audit_logs
create policy "Admins can manage audit logs" on admin_audit_logs
    using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
    with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
